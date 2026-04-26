# ---------------------------------------------------------------------------
# outputs.tf — Terraform Outputs
# ---------------------------------------------------------------------------
# Key resource identifiers and connection endpoints for CI/CD and operations
# ---------------------------------------------------------------------------

# =========================================================================
# VPC
# =========================================================================

output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets (ECS tasks)"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets (isolated)"
  value       = aws_subnet.database[*].id
}

# =========================================================================
# ALB
# =========================================================================

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Canonical hosted zone ID of the ALB"
  value       = aws_lb.main.zone_id
}

output "alb_target_group_arn" {
  description = "ARN of the ALB target group"
  value       = aws_lb_target_group.ecs.arn
}

output "alb_security_group_id" {
  description = "Security group ID of the ALB"
  value       = aws_security_group.alb.id
}

# =========================================================================
# ECS
# =========================================================================

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "ecs_service_arn" {
  description = "ARN of the ECS service"
  value       = aws_ecs_service.app.id
}

output "ecs_task_definition_arn" {
  description = "ARN of the active ECS task definition (revision included)"
  value       = aws_ecs_task_definition.app.arn
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution IAM role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task IAM role"
  value       = aws_iam_role.ecs_task.arn
}

# =========================================================================
# ECR
# =========================================================================

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.app.arn
}

# =========================================================================
# RDS
# =========================================================================

output "rds_endpoint" {
  description = "Connection endpoint for the RDS PostgreSQL instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "Hostname of the RDS instance (without port)"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "Port number of the RDS instance"
  value       = aws_db_instance.main.port
}

output "rds_instance_id" {
  description = "Identifier of the RDS instance"
  value       = aws_db_instance.main.identifier
}

output "rds_instance_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "rds_db_name" {
  description = "Name of the default database"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "Master username for RDS"
  value       = aws_db_instance.main.username
}

output "rds_connection_string" {
  description = "PostgreSQL connection string (sensitive — password redacted)"
  value       = "postgresql://${aws_db_instance.main.username}:<PASSWORD>@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = true
}

output "rds_replica_endpoint" {
  description = "Connection endpoint for the RDS read replica (if enabled)"
  value       = var.environment == "production" ? aws_db_instance.replica[0].endpoint : null
}

# =========================================================================
# REDIS
# =========================================================================

output "redis_endpoint" {
  description = "Connection endpoint for the ElastiCache Redis cluster"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "redis_port" {
  description = "Port number for Redis"
  value       = aws_elasticache_cluster.main.cache_nodes[0].port
}

output "redis_url" {
  description = "Full Redis connection URL"
  value       = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:${aws_elasticache_cluster.main.cache_nodes[0].port}"
}

output "redis_cluster_id" {
  description = "ID of the ElastiCache Redis cluster"
  value       = aws_elasticache_cluster.main.id
}

output "redis_replication_group_endpoint" {
  description = "Primary endpoint of the Redis replication group (production only)"
  value       = var.environment == "production" ? aws_elasticache_replication_group.main[0].primary_endpoint_address : null
}

# =========================================================================
# S3
# =========================================================================

output "s3_assets_bucket_name" {
  description = "Name of the S3 assets bucket"
  value       = aws_s3_bucket.assets.id
}

output "s3_assets_bucket_arn" {
  description = "ARN of the S3 assets bucket"
  value       = aws_s3_bucket.assets.arn
}

output "s3_assets_bucket_regional_domain" {
  description = "Regional domain name of the S3 assets bucket (for CloudFront)"
  value       = aws_s3_bucket.assets.bucket_regional_domain_name
}

# =========================================================================
# CloudFront
# =========================================================================

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = var.cloudfront_enabled ? aws_cloudfront_distribution.main[0].id : null
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = var.cloudfront_enabled ? aws_cloudfront_distribution.main[0].arn : null
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = var.cloudfront_enabled ? aws_cloudfront_distribution.main[0].domain_name : null
}

output "cloudfront_origin_access_control_id" {
  description = "ID of the CloudFront Origin Access Control for S3"
  value       = aws_cloudfront_origin_access_control.assets.id
}

# =========================================================================
# Route53
# =========================================================================

output "route53_zone_id" {
  description = "ID of the Route53 hosted zone"
  value       = local.route53_zone_id != "" ? local.route53_zone_id : null
}

output "route53_domain_name" {
  description = "Configured domain name"
  value       = var.domain_name != "" ? var.domain_name : null
}

# =========================================================================
# SECRETS
# =========================================================================

output "secrets_manager_db_password_arn" {
  description = "ARN of the Secrets Manager secret for DB password"
  value       = aws_secretsmanager_secret.db_password.arn
}

# =========================================================================
# CLOUDWATCH
# =========================================================================

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for ECS"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.arn
}

# =========================================================================
# SECURITY GROUPS
# =========================================================================

output "security_group_ecs_id" {
  description = "Security group ID for ECS tasks"
  value       = aws_security_group.ecs.id
}

output "security_group_rds_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds.id
}

output "security_group_redis_id" {
  description = "Security group ID for ElastiCache Redis"
  value       = aws_security_group.redis.id
}
