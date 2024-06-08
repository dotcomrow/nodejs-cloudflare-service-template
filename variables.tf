variable "cloudflare_account_id" {
  description = "Cloudflare account id"
  type        = string
  nullable = false
}

variable "cloudflare_worker_hostname" {
  description = "cloudflare worker hostname"
  type        = string
  nullable = false
}

variable "cloudflare_worker_url_pattern" {
  description = "cloudflare worker domain"
  type        = string
  nullable = false
}

variable "cloudflare_worker_zone_id" {
  description = "cloudflare worker zone id"
  type        = string
  nullable = false
}

variable "cloudflare_cors_domains" {
  description = "cloudflare cors domains"
  type        = string
  nullable = false
}

variable "user_profile_svc_url" {
  description = "user profile svc url"
  type        = string
  nullable = false
}