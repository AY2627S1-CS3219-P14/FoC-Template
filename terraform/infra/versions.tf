terraform {
  required_version = ">= 1.11"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 3.3"
    }
  }

  # State lives in the S3 bucket created by terraform/bootstrap. A backend block can't use
  # variables, so the bucket name etc. come from backend.hcl:
  #   terraform init -backend-config=backend.hcl
  backend "s3" {}
}
