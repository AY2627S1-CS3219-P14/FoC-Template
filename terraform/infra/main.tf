# The VPC is in vpc.tf and the EKS cluster in eks.tf. RDS, ECR, etc. will be added in their own files.
#
# These data sources read who you are signed in as; the signed_in_as output shows it, so
# `terraform plan` quickly confirms you are in the right account.
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
