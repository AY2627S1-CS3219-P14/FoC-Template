# The VPC is in vpc.tf. EKS, RDS, ECR, etc. will be added in their own files, step by step.
#
# These data sources read who you are signed in as; the signed_in_as output shows it, so
# `terraform plan` quickly confirms you are in the right account.
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
