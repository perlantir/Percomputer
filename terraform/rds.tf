# ---------------------------------------------------------------------------
# rds.tf — RDS PostgreSQL Instance
# ---------------------------------------------------------------------------
# Production-ready PostgreSQL with Multi-AZ, encryption, backups, monitoring
# ---------------------------------------------------------------------------

# =========================================================================
# DB SUBNET GROUP
# =========================================================================
# Already defined in main.tf as aws_db_subnet_group.main

# =========================================================================
# DB PARAMETER GROUP
# =========================================================================

resource "aws_db_parameter_group" "main" {
  name_prefix = "${local.name_prefix}-pg"
  family      = "postgres16"
  description = "Custom parameter group for ${var.project_name} PostgreSQL"

  # Logging configuration
  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_lock_waits"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries slower than 1000ms
  }

  parameter {
    name  = "log_temp_files"
    value = "1024" # Log temp files larger than 1MB
  }

  # Performance tuning for web workloads
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,auto_explain"
  }

  tags = {
    Name = "${local.name_prefix}-pg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =========================================================================
# DB OPTION GROUP
# =========================================================================

resource "aws_db_option_group" "main" {
  name_prefix              = "${local.name_prefix}-og"
  engine_name              = "postgres"
  major_engine_version     = "16"
  option_group_description = "Option group for ${var.project_name} PostgreSQL"

  tags = {
    Name = "${local.name_prefix}-og"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =========================================================================
# RDS INSTANCE — POSTGRESQL
# =========================================================================

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-db"

  # Engine
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  # Storage
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  # Credentials
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Networking
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  port                   = 5432

  # High availability
  multi_az = var.db_multi_az

  # Parameter / Option groups
  parameter_group_name = aws_db_parameter_group.main.name
  option_group_name    = aws_db_option_group.main.name

  # Backup & maintenance
  backup_retention_period = var.db_backup_retention_period
  backup_window           = "03:00-04:00"      # UTC
  maintenance_window      = "Mon:04:00-Mon:05:00" # UTC

  # Deletion protection
  deletion_protection = var.db_deletion_protection
  skip_final_snapshot = var.db_skip_final_snapshot
  final_snapshot_identifier = var.db_skip_final_snapshot ? null : "${local.name_prefix}-db-final-snapshot"

  # Auto minor version upgrades
  auto_minor_version_upgrade = true

  # Monitoring
  performance_insights_enabled    = true
  performance_insights_retention_period = 7
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # IAM database authentication (optional, for passwordless auth)
  iam_database_authentication_enabled = false

  # Copy tags to snapshots
  copy_tags_to_snapshot = true

  tags = {
    Name = "${local.name_prefix}-db"
  }

  depends_on = [
    aws_db_subnet_group.main,
    aws_security_group.rds,
    aws_db_parameter_group.main,
    aws_db_option_group.main
  ]

  lifecycle {
    prevent_destroy = var.environment == "production"
  }
}

# =========================================================================
# IAM ROLE — RDS ENHANCED MONITORING
# =========================================================================

resource "aws_iam_role" "rds_monitoring" {
  name = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-rds-monitoring-role"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# =========================================================================
# RDS READ REPLICA (Production only)
# =========================================================================

resource "aws_db_instance" "replica" {
  count = var.environment == "production" ? 1 : 0

  identifier = "${local.name_prefix}-db-replica"

  replicate_source_db  = aws_db_instance.main.arn
  instance_class       = var.db_instance_class
  storage_encrypted    = true
  publicly_accessible  = false

  # Backup on replica (for DR)
  backup_retention_period = var.db_backup_retention_period
  backup_window           = "03:00-04:00"

  auto_minor_version_upgrade = true

  performance_insights_enabled    = true
  performance_insights_retention_period = 7

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "${local.name_prefix}-db-replica"
  }

  # Don't create replica until primary is ready
  depends_on = [aws_db_instance.main]
}

# =========================================================================
# CLOUDWATCH ALARMS — RDS
# =========================================================================

# High CPU alarm
resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "${local.name_prefix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is high"
  alarm_actions       = []
  ok_actions          = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = {
    Name = "${local.name_prefix}-rds-high-cpu-alarm"
  }
}

# Low free storage alarm
resource "aws_cloudwatch_metric_alarm" "rds_low_storage" {
  alarm_name          = "${local.name_prefix}-rds-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2147483648 # 2 GB in bytes
  alarm_description   = "RDS free storage space is below 2 GB"
  alarm_actions       = []
  ok_actions          = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = {
    Name = "${local.name_prefix}-rds-low-storage-alarm"
  }
}

# High connection count alarm
resource "aws_cloudwatch_metric_alarm" "rds_high_connections" {
  alarm_name          = "${local.name_prefix}-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS database connection count is high"
  alarm_actions       = []
  ok_actions          = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = {
    Name = "${local.name_prefix}-rds-high-connections-alarm"
  }
}
