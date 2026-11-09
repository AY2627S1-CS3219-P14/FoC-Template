# The VPC, EKS cluster, RDS, ECR, etc. will be added here step by step.
#
# For now this stack creates nothing. It only reads who you are signed in as, so the first
# `terraform apply` proves that authentication and the S3 state backend both work.
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
