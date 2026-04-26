#!/usr/bin/env bash
# =================================================================
# Multi-Model Agent Platform — One-Click Production Setup
# =================================================================
# Usage:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh [--skip-deps] [--skip-db] [--skip-ssl]
#
# This script:
#   1. Validates system dependencies (Docker, Node, psql)
#   2. Generates secrets if missing
#   3. Creates required directories
#   4. Starts Docker services
#   5. Runs database migrations
#   6. Builds production assets
#   7. Prints post-setup checklist
# =================================================================

set -euo pipefail

# -----------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_TEMPLATE="$PROJECT_ROOT/.env.production"
LOG_FILE="$PROJECT_ROOT/logs/setup-$(date +%Y%m%d-%H%M%S).log"

SKIP_DEPS=false
SKIP_DB=false
SKIP_SSL=false

# -----------------------------------------------------------------
# CLI arguments
# -----------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-deps) SKIP_DEPS=true ; shift ;;
    --skip-db)   SKIP_DB=true   ; shift ;;
    --skip-ssl)  SKIP_SSL=true  ; shift ;;
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

generate_secret() {
  openssl rand -hex 32 2>/dev/null || dd if=/dev/urandom bs=32 count=1 2>/dev/null | xxd -p | tr -d '\n'
}

require_cmd() {
  if ! command -v "$1" &>/dev/null; then
    log_error "Missing required command: $1"
    exit 1
  fi
  log_ok "$1 found: $(command -v "$1")"
}

# -----------------------------------------------------------------
# 1. Dependency check
# -----------------------------------------------------------------
check_dependencies() {
  log_info "Checking system dependencies..."
  require_cmd docker
  require_cmd docker-compose
  require_cmd node
  require_cmd npm
  require_cmd psql
  if ! $SKIP_SSL; then
    require_cmd openssl
  fi
  log_ok "All required tools are available."
}

# -----------------------------------------------------------------
# 2. Environment file
# -----------------------------------------------------------------
setup_env() {
  log_info "Setting up environment file..."

  mkdir -p "$(dirname "$LOG_FILE")"

  if [[ ! -f "$ENV_FILE" ]]; then
    if [[ -f "$ENV_TEMPLATE" ]]; then
      cp "$ENV_TEMPLATE" "$ENV_FILE"
      log_warn "Created .env from .env.production template — PLEASE REVIEW AND EDIT!"
    else
      log_error "No .env.production template found. Cannot create .env"
      exit 1
    fi
  fi

  # Auto-generate secrets if still placeholders
  local secrets_updated=false
  for key in APP_SECRET JWT_SECRET ENCRYPTION_KEY; do
    if grep -q "^${key}=<" "$ENV_FILE" 2>/dev/null; then
      local secret
      secret=$(generate_secret)
      # Use portable sed syntax
      sed -i.bak "s/^${key}=<.*>/${key}=${secret}/" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
      log_ok "Auto-generated ${key}"
      secrets_updated=true
    fi
  done

  if $secrets_updated; then
    log_warn "Secrets were auto-generated. Please review remaining placeholders in .env"
  fi
}

# -----------------------------------------------------------------
# 3. Directory structure
# -----------------------------------------------------------------
setup_directories() {
  log_info "Creating required directories..."
  mkdir -p \
    "$PROJECT_ROOT/logs" \
    "$PROJECT_ROOT/data/postgres" \
    "$PROJECT_ROOT/data/redis" \
    "$PROJECT_ROOT/data/uploads" \
    "$PROJECT_ROOT/nginx/ssl" \
    "$PROJECT_ROOT/nginx/logs"
  log_ok "Directory structure created."
}

# -----------------------------------------------------------------
# 4. SSL certificates (self-signed if none exist)
# -----------------------------------------------------------------
setup_ssl() {
  if $SKIP_SSL; then
    log_info "Skipping SSL setup (--skip-ssl)."
    return
  fi

  log_info "Checking SSL certificates..."
  local cert_dir="$PROJECT_ROOT/nginx/ssl"

  if [[ -f "$cert_dir/server.crt" && -f "$cert_dir/server.key" ]]; then
    log_ok "Existing SSL certificates found."
    return
  fi

  log_warn "No SSL certificates found. Generating self-signed certificates..."
  openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
    -keyout "$cert_dir/server.key" \
    -out "$cert_dir/server.crt" \
    -subj "/C=US/ST=State/L=City/O=AgentPlatform/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"

  chmod 600 "$cert_dir/server.key"
  log_ok "Self-signed certificates generated at $cert_dir"
  log_warn "Replace with real certificates before production use!"
}

# -----------------------------------------------------------------
# 5. Docker services
# -----------------------------------------------------------------
start_services() {
  log_info "Starting Docker services..."
  cd "$PROJECT_ROOT"

  if [[ -f docker-compose.yml ]]; then
    docker-compose -f docker-compose.yml up -d --build
    log_ok "Docker services started."
  else
    log_warn "No docker-compose.yml found — skipping Docker startup."
  fi
}

# -----------------------------------------------------------------
# 6. Database setup
# -----------------------------------------------------------------
setup_database() {
  if $SKIP_DB; then
    log_info "Skipping database setup (--skip-db)."
    return
  fi

  log_info "Setting up database..."

  # Wait for PostgreSQL to be ready
  local max_attempts=30
  local attempt=0
  local db_url
  db_url=$(grep "^DB_HOST=" "$ENV_FILE" | cut -d= -f2 || true)

  if [[ -z "$db_url" || "$db_url" == *"<"* ]]; then
    log_warn "DB_HOST not configured — skipping database connection test."
    return
  fi

  while ! pg_isready -h "$db_url" -p 5432 &>/dev/null; do
    attempt=$((attempt + 1))
    if [[ $attempt -ge $max_attempts ]]; then
      log_error "PostgreSQL did not become ready within 60 seconds."
      exit 1
    fi
    sleep 2
  done
  log_ok "PostgreSQL is ready."

  # Run migrations
  if [[ -f package.json ]]; then
    if grep -q '"migrate"' package.json; then
      npm run migrate 2>&1 | tee -a "$LOG_FILE"
      log_ok "Database migrations completed."
    elif grep -q '"db:migrate"' package.json; then
      npm run db:migrate 2>&1 | tee -a "$LOG_FILE"
      log_ok "Database migrations completed."
    else
      log_warn "No migrate script found in package.json — skipping migrations."
    fi
  fi
}

# -----------------------------------------------------------------
# 7. Build production assets
# -----------------------------------------------------------------
build_assets() {
  log_info "Building production assets..."
  cd "$PROJECT_ROOT"

  if [[ -f package.json ]]; then
    npm ci --production=false 2>&1 | tee -a "$LOG_FILE"
    if grep -q '"build"' package.json; then
      npm run build 2>&1 | tee -a "$LOG_FILE"
      log_ok "Production build completed."
    else
      log_warn "No build script found — skipping build step."
    fi
  fi
}

# -----------------------------------------------------------------
# 8. Post-setup summary
# -----------------------------------------------------------------
print_summary() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║         Setup Complete — Post-Deploy Checklist               ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  1. Edit .env and replace all <PLACEHOLDER> values           ║"
  echo "║  2. Replace self-signed SSL certs with real certificates      ║"
  echo "║  3. Review nginx.conf and update server_name directives       ║"
  echo "║  4. Run ./scripts/seed.sh to seed initial admin user        ║"
  echo "║  5. Configure firewall: allow 80, 443, and SSH only           ║"
  echo "║  6. Set up log rotation for logs/ directory                 ║"
  echo "║  7. Configure automated backups for data/postgres/          ║"
  echo "║  8. Enable fail2ban for SSH and nginx access logs           ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  log_info "Full setup log: $LOG_FILE"
}

# =================================================================
# Main
# =================================================================
main() {
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "  Multi-Model Agent Platform — Production Setup"
  echo "════════════════════════════════════════════════════════════════"
  echo ""

  if ! $SKIP_DEPS; then
    check_dependencies
  fi

  setup_env
  setup_directories
  setup_ssl
  start_services
  setup_database
  build_assets

  print_summary
}

main "$@"
