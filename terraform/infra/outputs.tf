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
