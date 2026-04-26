# ---------------------------------------------------------------------------
# Terraform Variables — Multi-Model Agent Platform
# ---------------------------------------------------------------------------

# --- General ---
variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "multi-model-agent-platform"
}

variable "environment" {
  description = "Deployment environment (e.g., dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "availability_zones" {
  description = "List of availability zones for subnet distribution"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# --- VPC / Networking ---
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets (isolated)"
  type        = list(string)
  default     = ["10.0.7.0/24", "10.0.8.0/24", "10.0.9.0/24"]
}

# --- ECS / Container ---
variable "ecs_task_cpu" {
  description = "CPU units for the ECS Fargate task (256 = 0.25 vCPU)"
  type        = number
  default     = 512
}

variable "ecs_task_memory" {
  description = "Memory (MiB) for the ECS Fargate task"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of ECS task instances"
  type        = number
  default     = 2
}

variable "ecs_max_count" {
  description = "Maximum number of ECS task instances for auto-scaling"
  type        = number
  default     = 10
}

variable "container_port" {
  description = "Port exposed by the container (Next.js default)"
  type        = number
  default     = 3000
}

variable "container_image" {
  description = "ECR image URI for the Next.js application"
  type        = string
  default     = "" # Set via terraform.tfvars or CI/CD
}

variable "health_check_path" {
  description = "Health check endpoint for ALB target group"
  type        = string
  default     = "/api/health"
}

# --- RDS PostgreSQL ---
variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16.1"
}

variable "db_name" {
  description = "Name of the default database"
  type        = string
  default     = "agent_platform"
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "platform_admin"
}

variable "db_password" {
  description = "Master password for RDS (sensitive — set via TF_VARS or Secrets Manager)"
  type        = string
  sensitive   = true
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum storage limit for autoscaling (GB)"
  type        = number
  default     = 100
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for high availability"
  type        = bool
  default     = true
}

variable "db_backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "db_deletion_protection" {
  description = "Prevent accidental deletion of the RDS instance"
  type        = bool
  default     = true
}

variable "db_skip_final_snapshot" {
  description = "Skip final snapshot on destroy (set false for production)"
  type        = bool
  default     = false
}

# --- ElastiCache Redis ---
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t4g.micro"
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes (1 for single-node, 2+ for cluster mode)"
  type        = number
  default     = 1
}

# --- ALB ---
variable "alb_enable_deletion_protection" {
  description = "Enable deletion protection on ALB"
  type        = bool
  default     = true
}

variable "alb_idle_timeout" {
  description = "ALB idle timeout in seconds"
  type        = number
  default     = 60
}

# --- S3 ---
variable "s3_assets_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  type        = string
  default     = "" # Auto-generated if empty
}

# --- CloudFront ---
variable "cloudfront_price_class" {
  description = "CloudFront price class (PriceClass_All, PriceClass_200, PriceClass_100)"
  type        = string
  default     = "PriceClass_All"
}

variable "cloudfront_enabled" {
  description = "Enable CloudFront distribution"
  type        = bool
  default     = true
}

# --- Route53 ---
variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Existing Route53 hosted zone ID (leave empty to create new)"
  type        = string
  default     = ""
}

variable "create_route53_zone" {
  description = "Create a new Route53 hosted zone if zone_id is not provided"
  type        = bool
  default     = false
}

# --- Monitoring / Logging ---
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights for monitoring"
  type        = bool
  default     = true
}

# --- Tags ---
variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default = {
    Project     = "multi-model-agent-platform"
    ManagedBy   = "terraform"
    Environment = "production"
  }
}
