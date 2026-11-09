output "state_bucket" {
  description = "Name of the S3 bucket holding Terraform state."
  value       = aws_s3_bucket.state.bucket
}

output "backend_hcl" {
  description = "Paste this into terraform/infra/backend.hcl."
  value       = <<-EOT
    bucket       = "${aws_s3_bucket.state.bucket}"
    key          = "${var.project}/infra.tfstate"
    region       = "${var.aws_region}"
    encrypt      = true
    use_lockfile = true
  EOT
}
