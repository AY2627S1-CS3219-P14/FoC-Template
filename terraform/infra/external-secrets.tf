# External Secrets Operator (ESO): copies secrets from AWS Secrets Manager into Kubernetes Secrets,
# and keeps them in sync when they change in AWS.
#
#   Secrets Manager "campuscouriers/user-service-jwt"
#        │  read by the ESO controller (IAM role below, IRSA)
#        ▼
#   ExternalSecret (k8s/app/external-secrets.yaml) ──> Kubernetes Secret "user-service-jwt" ──> pods
#
# Kubernetes never stores the source of truth, and nobody runs `kubectl create secret` by hand.

locals {
  # Every secret for this project lives under this name prefix; ESO may read only these
  secrets_prefix = "${var.project}/"
}

# --- IAM: read-only access to this project's secrets -----------------------------------------------
data "aws_iam_policy_document" "external_secrets" {
  statement {
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
      "secretsmanager:ListSecretVersionIds",
    ]
    # Secrets Manager adds a random 6-character suffix to every secret ARN, hence the trailing *
    resources = [
      "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:${local.secrets_prefix}*",
      # The RDS master password. RDS names this secret itself ("rds!db-..."), so it doesn't match
      # the prefix above; only the db-init Job in k8s/ops uses it.
      aws_db_instance.main.master_user_secret[0].secret_arn,
    ]
  }
}

resource "aws_iam_role" "external_secrets" {
  name               = "${local.cluster_name}-external-secrets"
  assume_role_policy = data.aws_iam_policy_document.irsa_assume["external_secrets"].json
}

resource "aws_iam_role_policy" "external_secrets" {
  name   = "read-project-secrets"
  role   = aws_iam_role.external_secrets.id
  policy = data.aws_iam_policy_document.external_secrets.json
}

# --- The operator ----------------------------------------------------------------------------------
resource "helm_release" "external_secrets" {
  name = "external-secrets"
  # OCI registry (GitHub Container Registry) rather than https://charts.external-secrets.io: that
  # index points at GitHub release downloads, which returned 504s for this version
  repository       = "oci://ghcr.io/external-secrets/charts"
  chart            = "external-secrets"
  version          = "2.14.0"
  namespace        = "external-secrets"
  create_namespace = true

  values = [yamlencode({
    installCRDs = true # ExternalSecret, ClusterSecretStore, ... resource types

    serviceAccount = {
      create = true
      name   = "external-secrets"
      annotations = {
        "eks.amazonaws.com/role-arn" = aws_iam_role.external_secrets.arn # IRSA
      }
    }
  })]

  depends_on = [
    aws_eks_node_group.main,
    aws_iam_role_policy.external_secrets,
  ]
}

# --- Secrets ---------------------------------------------------------------------------------------
# Terraform creates each secret "container" but never its value: anything Terraform sets ends up in
# the state file. Put the values in with the AWS CLI (see terraform/README.md, "Secrets").
# Database credentials are added in the RDS step.
resource "aws_secretsmanager_secret" "user_service_jwt" {
  name        = "${local.secrets_prefix}user-service-jwt"
  description = "RSA key pair user-service signs JWTs with. JSON keys: private.pem, public.pem"

  # Delete immediately on destroy so the name can be reused right away (default: 30-day recovery
  # window, during which the name is taken). Use 7-30 days for anything long-lived.
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "user_bootstrap_admin" {
  name                    = "${local.secrets_prefix}user-bootstrap-admin"
  description             = "First administrator. JSON keys: BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD"
  recovery_window_in_days = 0
}
