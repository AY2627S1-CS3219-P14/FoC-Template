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
