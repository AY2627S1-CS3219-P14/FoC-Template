# One file per part: vpc.tf, eks.tf, irsa.tf, load-balancer-controller.tf, external-secrets.tf.
# RDS, ECR, etc. will be added the same way.
#
# These data sources read who you are signed in as; the signed_in_as output shows it, so
# `terraform plan` quickly confirms you are in the right account.
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
