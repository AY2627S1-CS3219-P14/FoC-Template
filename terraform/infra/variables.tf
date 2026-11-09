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

# --- EKS -------------------------------------------------------------------------------------------
variable "kubernetes_version" {
  description = "EKS Kubernetes version. List options: aws eks describe-cluster-versions. Upgrade one minor version at a time."
  type        = string
  default     = "1.37"
}

variable "cluster_public_access_cidrs" {
  description = "IP ranges allowed to reach the Kubernetes API from the internet (still requires AWS credentials)."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "cluster_log_types" {
  description = "Control plane logs sent to CloudWatch. Options: api, audit, authenticator, controllerManager, scheduler."
  type        = list(string)
  default     = ["audit", "authenticator"]
}

variable "cluster_admin_role_arns" {
  description = "Extra IAM role ARNs given cluster admin (the role that creates the cluster already is)."
  type        = list(string)
  default     = []
}

variable "node_capacity_type" {
  description = "SPOT (spare EC2 capacity, ~60-70% cheaper, can be reclaimed with 2 minutes' notice) or ON_DEMAND."
  type        = string
  default     = "SPOT"

  validation {
    condition     = contains(["SPOT", "ON_DEMAND"], var.node_capacity_type)
    error_message = "node_capacity_type must be SPOT or ON_DEMAND."
  }
}

variable "node_instance_types" {
  description = "Instance types for the nodes, all 2 vCPU / 8 GiB. Several types make Spot capacity easier to get."
  type        = list(string)
  default     = ["m6i.large", "m5.large", "m6a.large", "m5a.large", "t3.large", "t3a.large"]
}

variable "node_desired_size" {
  description = "Number of nodes to start with."
  type        = number
  default     = 3
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  type    = number
  default = 5
}
