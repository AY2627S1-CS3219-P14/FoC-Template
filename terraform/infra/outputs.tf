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
