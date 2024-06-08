locals {
  project_name = "preferences"
}

resource "cloudflare_worker_domain" "user_prefs" {
  account_id = var.cloudflare_account_id
  hostname   = var.cloudflare_worker_hostname
  service    = "${local.project_name}"
  zone_id    = var.cloudflare_worker_zone_id

  depends_on = [ cloudflare_worker_script.user_prefs ]
}

resource "cloudflare_worker_route" "user_prefs_route" {
  zone_id     = var.cloudflare_worker_zone_id
  pattern     = "${var.cloudflare_worker_url_pattern}"
  script_name = cloudflare_worker_script.user_prefs.name
}

# resource "cloudflare_workers_kv_namespace" "mapping" {
#   account_id = var.cloudflare_account_id
#   title      = "${local.project_name}_mapping"
# }

resource "cloudflare_worker_script" "user_prefs" {
  account_id = var.cloudflare_account_id
  name       = "${local.project_name}"
  content    = file("${path.module}/dist/index.mjs")
  compatibility_date = "2023-08-28"
  module = true

    # kv_namespace_binding {
    #     name         = "MAPPING"
    #     namespace_id = cloudflare_workers_kv_namespace.mapping.id
    # }

    plain_text_binding {
        name          =  "CORS_DOMAINS"
        text        =  var.cloudflare_cors_domains
    }

    plain_text_binding {
      name = "USER_PROFILE_SVC_URL"
      text = var.user_profile_svc_url
    }

    d1_database_binding {
        name          =  "user_prefs_database"
        database_id   =  cloudflare_d1_database.user_prefs_db.id
    }
}

# output "api_gateway_namespace_id" {
#   value = cloudflare_workers_kv_namespace.mapping.id
# }

resource "cloudflare_d1_database" "user_prefs_db" {
  account_id = var.cloudflare_account_id
  name       = "${local.project_name}_database"
}