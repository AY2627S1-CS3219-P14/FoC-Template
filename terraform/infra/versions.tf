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
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9" # ephemeral random_password: generated passwords that never reach state
    }
  }

  # State lives in the S3 bucket created by terraform/bootstrap. A backend block can't use
  # variables, so the bucket name etc. come from backend.hcl:
  #   terraform init -backend-config=backend.hcl
  backend "s3" {}
}
