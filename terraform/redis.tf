# ---------------------------------------------------------------------------
# redis.tf — ElastiCache Redis Cluster
# ---------------------------------------------------------------------------
# Redis for session storage, caching, and real-time message broker
# ---------------------------------------------------------------------------

# =========================================================================
# ELASTICACHE SUBNET GROUP
# =========================================================================
# Already defined in main.tf as aws_elasticache_subnet_group.main

# =========================================================================
# ELASTICACHE PARAMETER GROUP
# =========================================================================

resource "aws_elasticache_parameter_group" "main" {
  name_prefix = "${local.name_prefix}-redis-pg"
  family      = "redis7"
  description = "Custom parameter group for ${var.project_name} Redis"

  # Enable keyspace notifications for cache invalidation patterns
  parameter {
    name  = "notify-keyspace-events"
    value = "Ex" # Expired events for cache TTL tracking
  }

  # Memory management
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru" # Evict least recently used keys when memory is full
  }

  tags = {
    Name = "${local.name_prefix}-redis-pg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =========================================================================
# ELASTICACHE CLUSTER — REDIS
# =========================================================================

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${local.name_prefix}-redis"
  engine               = "redis"
  engine_version       = var.redis_engine_version
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.main.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  port                 = 6379

  # At-rest encryption
  at_rest_encryption_enabled = true

  # In-transit encryption (TLS)
  transit_encryption_enabled = false # Set true for production with TLS client support

  # Auto minor version upgrades
  auto_minor_version_upgrade = true

  # Maintenance window
  maintenance_window = "tue:04:00-tue:05:00"

  # Snapshots
  snapshot_window          = "05:00-06:00"
  snapshot_retention_limit = 7

  # Apply changes immediately (set false for production to avoid downtime)
  apply_immediately = var.environment != "production"

  tags = {
    Name = "${local.name_prefix}-redis"
  }

  depends_on = [
    aws_elasticache_subnet_group.main,
    aws_security_group.redis,
    aws_elasticache_parameter_group.main
  ]
}

# =========================================================================
# ELASTICACHE REPLICATION GROUP (Production: Multi-AZ with replicas)
# =========================================================================

resource "aws_elasticache_replication_group" "main" {
  count = var.environment == "production" ? 1 : 0

  replication_group_id = "${local.name_prefix}-redis-rg"
  description          = "Redis replication group for ${var.project_name}"

  engine               = "redis"
  engine_version       = var.redis_engine_version
  node_type            = var.redis_node_type
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.main.name

  # Cluster mode disabled — single primary with replicas
  num_cache_clusters = 2 # 1 primary + 1 replica
  multi_az_enabled   = true
  automatic_failover_enabled = true

  # Subnet & security
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = false

  # Snapshots
  snapshot_window          = "05:00-06:00"
  snapshot_retention_limit = 7

  # Auto minor version upgrades
  auto_minor_version_upgrade = true

  # Maintenance
  maintenance_window = "tue:04:00-tue:05:00"

  apply_immediately = false

  tags = {
    Name = "${local.name_prefix}-redis-rg"
  }

  depends_on = [
    aws_elasticache_subnet_group.main,
    aws_security_group.redis,
    aws_elasticache_parameter_group.main
  ]
}

# =========================================================================
# CLOUDWATCH ALARMS — REDIS
# =========================================================================

# High CPU alarm
resource "aws_cloudwatch_metric_alarm" "redis_high_cpu" {
  alarm_name          = "${local.name_prefix}-redis-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Redis CPU utilization is high"
  alarm_actions       = []
  ok_actions          = []

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.main.id
  }

  tags = {
    Name = "${local.name_prefix}-redis-high-cpu-alarm"
  }
}

# High memory alarm
resource "aws_cloudwatch_metric_alarm" "redis_high_memory" {
  alarm_name          = "${local.name_prefix}-redis-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Redis memory usage is high"
  alarm_actions       = []
  ok_actions          = []

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.main.id
  }

  tags = {
    Name = "${local.name_prefix}-redis-high-memory-alarm"
  }
}

# High engine CPU alarm (more accurate for Redis)
resource "aws_cloudwatch_metric_alarm" "redis_engine_cpu" {
  alarm_name          = "${local.name_prefix}-redis-engine-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "EngineCPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Redis engine CPU utilization is high"
  alarm_actions       = []
  ok_actions          = []

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.main.id
  }

  tags = {
    Name = "${local.name_prefix}-redis-engine-cpu-alarm"
  }
}

# Evictions alarm (indicates memory pressure)
resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  alarm_name          = "${local.name_prefix}-redis-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "Redis is evicting keys — consider scaling up"
  alarm_actions       = []
  ok_actions          = []

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.main.id
  }

  tags = {
    Name = "${local.name_prefix}-redis-evictions-alarm"
  }
}

# Connection count alarm
resource "aws_cloudwatch_metric_alarm" "redis_connections" {
  alarm_name          = "${local.name_prefix}-redis-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 500
  alarm_description   = "Redis current connection count is high"
  alarm_actions       = []
  ok_actions          = []

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.main.id
  }

  tags = {
    Name = "${local.name_prefix}-redis-connections-alarm"
  }
}
