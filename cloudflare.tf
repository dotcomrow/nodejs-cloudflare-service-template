locals {
  project_name = "${var.project_name}"
}

resource "cloudflare_worker_domain" "project_domain" {
  account_id = var.cloudflare_account_id
  hostname   = "${local.project_name}.${var.domain}"
  service    = "${local.project_name}"
  zone_id    = var.cloudflare_zone_id

  depends_on = [ cloudflare_worker_script.project_script ]
}

resource "cloudflare_worker_route" "project_route" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "${local.project_name}.${var.domain}/*"
  script_name = cloudflare_worker_script.project_script.name
}

# resource "cloudflare_workers_kv_namespace" "mapping" {
#   account_id = var.cloudflare_account_id
#   title      = "${local.project_name}_mapping"
# }

resource "cloudflare_worker_script" "project_script" {
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
        text        =  ".*.${var.domain},.*localhost.*"
    }

    plain_text_binding {
        name          =  "GCP_LOGGING_PROJECT_ID"
        text        =  "${var.GCP_LOGGING_PROJECT_ID}" 
    }

    plain_text_binding {
        name = "GCP_BIGQUERY_PROJECT_ID"
        text = "${var.GCP_BIGQUERY_PROJECT_ID}"
    }
    plain_text_binding {
       name = "LOG_NAME"
        text = "${local.project_name}_worker_log"
    }

    plain_text_binding {
      name = "USER_PROFILE_SVC_URL"
      text = var.user_profile_svc_endpoint
    }

    d1_database_binding {
        name          =  "user_prefs_database"
        database_id   =  cloudflare_d1_database.project_db.id
    }

    secret_text_binding {
        name          =  "INITIALIZATION_KEY"
        text = "${var.init_key}"
    }

    secret_text_binding {
        name          =  "GCP_LOGGING_CREDENTIALS"
        text = "${var.GCP_LOGGING_CREDENTIALS}"
    }

    secret_text_binding {
        name = "GCP_BIGQUERY_CREDENTIALS"
        text = "${var.GCP_BIGQUERY_CREDENTIALS}"
    }
}

# output "api_gateway_namespace_id" {
#   value = cloudflare_workers_kv_namespace.mapping.id
# }

resource "cloudflare_d1_database" "project_db" {
  account_id = var.cloudflare_account_id
  name       = "database"
}