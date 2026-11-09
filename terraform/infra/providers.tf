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

# Installs Helm charts (packaged Kubernetes apps) into the EKS cluster.
# It logs in the same way kubectl does: by running `aws eks get-token` with your AWS_PROFILE.
provider "helm" {
  kubernetes = {
    host                   = aws_eks_cluster.main.endpoint
    cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)

    exec = {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", aws_eks_cluster.main.name, "--region", var.aws_region]
    }
  }
}
