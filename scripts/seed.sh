#!/usr/bin/env bash
# =================================================================
# Multi-Model Agent Platform — Database Seeding Script
# =================================================================
# Usage:
#   chmod +x scripts/seed.sh
#   ./scripts/seed.sh [--admin-email admin@example.com]
#                     [--admin-password "SecurePass123!"]
#                     [--dry-run]
#                     [--truncate]
#
# Seeds:
#   1. Admin user with full permissions
#   2. Default model provider configurations
#   3. System roles and permissions
#   4. Default agent templates
#   5. Initial knowledge base collections
# =================================================================

set -euo pipefail

# -----------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
LOG_FILE="$PROJECT_ROOT/logs/seed-$(date +%Y%m%d-%H%M%S).log"

ADMIN_EMAIL=""
ADMIN_PASSWORD=""
DRY_RUN=false
TRUNCATE=false

# -----------------------------------------------------------------
# CLI arguments
# -----------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --admin-email)    ADMIN_EMAIL="$2";    shift 2 ;;
    --admin-password) ADMIN_PASSWORD="$2"; shift 2 ;;
    --dry-run)        DRY_RUN=true;        shift ;;
    --truncate)       TRUNCATE=true;       shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# -----------------------------------------------------------------
# Utilities
# -----------------------------------------------------------------
log_info()  { echo -e "\033[1;34m[INFO]\033[0m  $1" | tee -a "$LOG_FILE"; }
log_ok()    { echo -e "\033[1;32m[OK]\033[0m    $1" | tee -a "$LOG_FILE"; }
log_warn()  { echo -e "\033[1;33m[WARN]\033[0m  $1" | tee -a "$LOG_FILE"; }
log_error() { echo -e "\033[1;31m[ERROR]\033[0m $1" | tee -a "$LOG_FILE"; }

require_env() {
  local var_name="$1"
  local value
  value=$(grep "^${var_name}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2 || true)
  if [[ -z "$value" || "$value" == *"<"* ]]; then
    log_error "Required env var ${var_name} is missing or still a placeholder."
    exit 1
  fi
  echo "$value"
}

psql_exec() {
  local db_url="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  if $DRY_RUN; then
    echo "$1" | tee -a "$LOG_FILE"
  else
    echo "$1" | psql "$db_url" 2>&1 | tee -a "$LOG_FILE"
  fi
}

# -----------------------------------------------------------------
# Validation
# -----------------------------------------------------------------
validate_inputs() {
  log_info "Validating environment and inputs..."

  if [[ ! -f "$ENV_FILE" ]]; then
    log_error ".env file not found at $ENV_FILE. Run setup.sh first."
    exit 1
  fi

  DB_HOST=$(require_env DB_HOST)
  DB_PORT=$(require_env DB_PORT)
  DB_NAME=$(require_env DB_NAME)
  DB_USER=$(require_env DB_USER)
  DB_PASSWORD=$(require_env DB_PASSWORD)

  if [[ -z "$ADMIN_EMAIL" ]]; then
    read -rp "Admin email: " ADMIN_EMAIL
  fi

  if [[ -z "$ADMIN_PASSWORD" ]]; then
    read -rsp "Admin password (min 12 chars): " ADMIN_PASSWORD
    echo ""
    if [[ ${#ADMIN_PASSWORD} -lt 12 ]]; then
      log_error "Password must be at least 12 characters."
      exit 1
    fi
  fi

  log_ok "Inputs validated."
}

# -----------------------------------------------------------------
# Seed: Truncate (optional reset)
# -----------------------------------------------------------------
seed_truncate() {
  if ! $TRUNCATE; then return; fi
  log_warn "TRUNCATE enabled — clearing existing data..."
  psql_exec "TRUNCATE TABLE sessions, audit_logs, agent_runs, knowledge_chunks, agents, users, roles, model_providers CASCADE;"
  log_ok "Tables truncated."
}

# -----------------------------------------------------------------
# Seed: Roles & Permissions
# -----------------------------------------------------------------
seed_roles() {
  log_info "Seeding roles and permissions..."

  psql_exec "
INSERT INTO roles (id, name, description, permissions, created_at)
VALUES
  (gen_random_uuid(), 'super_admin', 'Full platform access', '{\"*\"}', NOW()),
  (gen_random_uuid(), 'admin', 'Administrative access without infra', '{\"users:read\",\"users:write\",\"agents:read\",\"agents:write\",\"models:read\",\"models:write\",\"audit:read\"}', NOW()),
  (gen_random_uuid(), 'developer', 'Can create and manage agents', '{\"agents:read\",\"agents:write\",\"models:read\",\"knowledge:read\",\"knowledge:write\"}', NOW()),
  (gen_random_uuid(), 'viewer', 'Read-only access', '{\"agents:read\",\"models:read\",\"knowledge:read\"}', NOW())
ON CONFLICT (name) DO NOTHING;
"

  log_ok "Roles seeded."
}

# -----------------------------------------------------------------
# Seed: Admin User
# -----------------------------------------------------------------
seed_admin() {
  log_info "Seeding admin user (${ADMIN_EMAIL})..."

  # Generate bcrypt hash via Node.js (bcryptjs) or fallback to openssl-based argon2 placeholder
  local hashed_password
  if command -v node &>/dev/null && node -e "require('bcryptjs')" &>/dev/null; then
    hashed_password=$(node -e "
      const bcrypt = require('bcryptjs');
      console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 12));
    ")
  else
    log_warn "bcryptjs not available — using OpenSSL SHA-256 + salt placeholder."
    local salt
    salt=$(openssl rand -hex 16)
    hashed_password="sha256:${salt}:$(echo -n "${salt}${ADMIN_PASSWORD}" | openssl dgst -sha256 -binary | openssl base64)"
  fi

  psql_exec "
INSERT INTO users (id, email, password_hash, display_name, role, email_verified, mfa_enabled, status, created_at)
VALUES (
  gen_random_uuid(),
  '${ADMIN_EMAIL}',
  '${hashed_password}',
  'Platform Administrator',
  'super_admin',
  true,
  false,
  'active',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = 'super_admin',
  status = 'active',
  updated_at = NOW();
"

  log_ok "Admin user created/updated."
}

# -----------------------------------------------------------------
# Seed: Model Providers
# -----------------------------------------------------------------
seed_providers() {
  log_info "Seeding model provider configurations..."

  psql_exec "
INSERT INTO model_providers (id, name, display_name, api_base_url, is_enabled, supports_streaming, supports_vision, rate_limit_rpm, cost_per_1k_input, cost_per_1k_output, created_at)
VALUES
  (gen_random_uuid(), 'openai',     'OpenAI',      'https://api.openai.com/v1',       true, true,  true,  60, 0.0015, 0.0020, NOW()),
  (gen_random_uuid(), 'anthropic',  'Anthropic',   'https://api.anthropic.com/v1',    true, true,  true,  50, 0.0008, 0.0024, NOW()),
  (gen_random_uuid(), 'google',     'Google Gemini','https://generativelanguage.googleapis.com', true, true, true, 60, 0.0005, 0.0015, NOW()),
  (gen_random_uuid(), 'azure_openai','Azure OpenAI', NULL,                             true, true,  true,  60, 0.0010, 0.0020, NOW()),
  (gen_random_uuid(), 'mistral',    'Mistral AI',  'https://api.mistral.ai/v1',       true, true,  false, 30, 0.0006, 0.0018, NOW()),
  (gen_random_uuid(), 'cohere',     'Cohere',      'https://api.cohere.com/v1',       true, true,  false, 40, 0.0010, 0.0020, NOW())
ON CONFLICT (name) DO NOTHING;
"

  log_ok "Model providers seeded."
}

# -----------------------------------------------------------------
# Seed: Agent Templates
# -----------------------------------------------------------------
seed_templates() {
  log_info "Seeding default agent templates..."

  psql_exec "
INSERT INTO agent_templates (id, name, description, system_prompt, default_model_provider, default_model, default_temperature, default_max_tokens, tools_config, is_system, created_at)
VALUES
  (gen_random_uuid(), 'General Assistant', 'Versatile assistant for general tasks', 'You are a helpful AI assistant.', 'openai', 'gpt-4o', 0.7, 4096, '[]', true, NOW()),
  (gen_random_uuid(), 'Code Reviewer', 'Expert at reviewing code for quality and bugs', 'You are an expert software engineer. Review the provided code for bugs, security issues, and best practices. Provide specific line-by-line feedback.', 'openai', 'gpt-4o', 0.3, 8192, '[\"code_analyzer\"]', true, NOW()),
  (gen_random_uuid(), 'Research Analyst', 'Deep research and analysis agent', 'You are a research analyst. Provide thorough, well-sourced analysis. Always cite your reasoning.', 'anthropic', 'claude-3-5-sonnet', 0.5, 16384, '[\"web_search\",\"document_parser\"]', true, NOW()),
  (gen_random_uuid(), 'Customer Support', 'Friendly support agent for user inquiries', 'You are a customer support specialist. Be empathetic, clear, and solution-oriented.', 'openai', 'gpt-4o-mini', 0.8, 2048, '[\"knowledge_base\",\"ticket_creator\"]', true, NOW())
ON CONFLICT (name) DO NOTHING;
"

  log_ok "Agent templates seeded."
}

# -----------------------------------------------------------------
# Seed: Knowledge Base Collections
# -----------------------------------------------------------------
seed_knowledge() {
  log_info "Seeding knowledge base collections..."

  psql_exec "
INSERT INTO knowledge_collections (id, name, description, embedding_model, chunk_size, chunk_overlap, is_public, created_at)
VALUES
  (gen_random_uuid(), 'Platform Docs', 'Official platform documentation and guides', 'text-embedding-3-large', 512, 50, true, NOW()),
  (gen_random_uuid(), 'API Reference', 'API endpoints, schemas, and examples', 'text-embedding-3-large', 1024, 100, true, NOW()),
  (gen_random_uuid(), 'Best Practices', 'Agent design and deployment best practices', 'text-embedding-3-large', 512, 50, true, NOW())
ON CONFLICT (name) DO NOTHING;
"

  log_ok "Knowledge base collections seeded."
}

# -----------------------------------------------------------------
# Seed: Audit Log Entry (seeding event)
# -----------------------------------------------------------------
seed_audit() {
  log_info "Recording seed audit entry..."

  psql_exec "
INSERT INTO audit_logs (id, event_type, actor_email, resource_type, resource_id, details, ip_address, user_agent, created_at)
VALUES (
  gen_random_uuid(),
  'database_seed',
  '${ADMIN_EMAIL}',
  'system',
  'seed-script',
  '{\"source\":\"seed.sh\",\"dry_run\":${DRY_RUN},\"truncated\":${TRUNCATE}}',
  '127.0.0.1',
  'seed-script/1.0',
  NOW()
);
"

  log_ok "Audit entry recorded."
}

# -----------------------------------------------------------------
# Summary
# -----------------------------------------------------------------
print_summary() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║              Database Seeding Complete                       ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Admin Email:    ${ADMIN_EMAIL}"
  echo "║  Dry Run:        ${DRY_RUN}"
  echo "║  Truncated:      ${TRUNCATE}"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Seeded:                                                     ║"
  echo "║    • 4 system roles                                          ║"
  echo "║    • 1 admin user (super_admin)                              ║"
  echo "║    • 6 model providers                                       ║"
  echo "║    • 4 agent templates                                       ║"
  echo "║    • 3 knowledge collections                                 ║"
  echo "║    • 1 audit log entry                                     ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  log_info "Full seed log: $LOG_FILE"
}

# =================================================================
# Main
# =================================================================
main() {
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "  Multi-Model Agent Platform — Database Seeding"
  echo "════════════════════════════════════════════════════════════════"
  echo ""

  mkdir -p "$(dirname "$LOG_FILE")"
  validate_inputs
  seed_truncate
  seed_roles
  seed_admin
  seed_providers
  seed_templates
  seed_knowledge
  seed_audit
  print_summary
}

main "$@"
