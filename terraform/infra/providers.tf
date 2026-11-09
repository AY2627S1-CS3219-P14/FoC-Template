provider "aws" {
  region = var.aws_region

  # Refuse to run against any other account
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
      Stack     = "infra"
    }
  }

  # No credentials here: they come from your SSO login via AWS_PROFILE (see terraform/README.md)
}
