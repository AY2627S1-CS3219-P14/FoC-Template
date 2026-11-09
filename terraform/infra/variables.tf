variable "aws_account_id" {
  description = "The AWS account to deploy into (12 digits). Terraform refuses to touch any other account."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be exactly 12 digits."
  }
}

variable "aws_region" {
  description = "Region for all resources. Singapore is closest to NUS."
  type        = string
  default     = "ap-southeast-1"
}

variable "project" {
  description = "Prefix for resource names and the Project tag."
  type        = string
  default     = "campuscouriers"
}

# --- Network ---------------------------------------------------------------------------------------
variable "vpc_cidr" {
  description = "Address range of the whole VPC. Subnets are carved out of it in vpc.tf."
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of Availability Zones to use. 2 is the minimum for an ALB and for RDS Multi-AZ."
  type        = number
  default     = 2

  validation {
    condition     = var.az_count >= 2 && var.az_count <= 3
    error_message = "az_count must be 2 or 3."
  }
}

variable "single_nat_gateway" {
  description = "true: one shared NAT gateway (cheaper). false: one per AZ (survives an AZ outage, costs more)."
  type        = bool
  default     = true
}
