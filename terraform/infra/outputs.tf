output "signed_in_as" {
  description = "The identity Terraform is using. Should be your SSO role, never the root user."
  value       = data.aws_caller_identity.current.arn
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "region" {
  value = data.aws_region.current.region
}

# --- Network ---------------------------------------------------------------------------------------
output "vpc_id" {
  value = aws_vpc.main.id
}

output "availability_zones" {
  value = local.azs
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "public_subnet_cidrs" {
  description = "Use these in k8s/app/network-policies.yaml (traffic from the ALB comes from here)."
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  value = aws_subnet.database[*].id
}

output "nat_public_ips" {
  description = "Outgoing traffic from pods appears to come from these IPs (useful for allow-lists)."
  value       = aws_eip.nat[*].public_ip
}

# --- EKS -------------------------------------------------------------------------------------------
output "cluster_name" {
  value = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

output "cluster_security_group_id" {
  description = "Security group of the control plane and nodes. RDS will allow port 5432 from it."
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "kubeconfig_command" {
  description = "Run this to point kubectl at the cluster."
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.main.name} --region ${var.aws_region} --alias ${aws_eks_cluster.main.name}"
}

# --- Platform --------------------------------------------------------------------------------------
output "secrets_manager_secrets" {
  description = "Secrets to fill in with `aws secretsmanager put-secret-value` (see README)."
  value = [
    aws_secretsmanager_secret.user_service_jwt.name,
    aws_secretsmanager_secret.user_bootstrap_admin.name,
  ]
}

# --- RDS -------------------------------------------------------------------------------------------
output "rds_address" {
  description = "RDS hostname. Put it in k8s/app/database-endpoints.yaml and k8s/messaging/database-endpoints.yaml."
  value       = aws_db_instance.main.address
}

output "rds_master_secret_arn" {
  description = "Secrets Manager secret (created by RDS) holding the master username and password."
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
}
