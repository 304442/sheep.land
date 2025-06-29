#!/bin/sh
set -e

# PocketBase Docker Entrypoint Script - Fixed with proper migration handling

# Default values
PB_VERSION="${PB_VERSION:-latest}"; PB_PORT="${PB_PORT:-8090}"; PB_DATA_DIR="${PB_DATA_DIR:-/pb_data}"; PB_MIGRATIONS_DIR="${PB_MIGRATIONS_DIR:-/pb_migrations}"; PB_PUBLIC_DIR="${PB_PUBLIC_DIR:-/pb_public}"; PB_HOOKS_DIR="${PB_HOOKS_DIR:-/pb_hooks}"

# Functions
log() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"; }
handle_error() { log "ERROR: $1" && exit 1; }

# Check PocketBase binary
test -f "/usr/local/bin/pocketbase" || handle_error "PocketBase binary not found at /usr/local/bin/pocketbase"

# Ensure data directory exists
test -d "$PB_DATA_DIR" || { log "Creating data directory: $PB_DATA_DIR" && mkdir -p "$PB_DATA_DIR"; }

# Check if first run
FIRST_RUN=false; test -f "$PB_DATA_DIR/data.db" || { FIRST_RUN=true && log "First run detected - database will be created"; }

# Create admin user if credentials provided and first run
test "$FIRST_RUN" = true && test -n "$ADMIN_EMAIL" && test -n "$ADMIN_PASSWORD" && { log "Creating admin user: $ADMIN_EMAIL" && /usr/local/bin/pocketbase superuser create "$ADMIN_EMAIL" "$ADMIN_PASSWORD" --dir="$PB_DATA_DIR" || log "Admin user may already exist"; }

# Run migrations if directory exists and contains files
test -d "$PB_MIGRATIONS_DIR" && { MIGRATION_COUNT=$(find "$PB_MIGRATIONS_DIR" -name "*.js" -o -name "*.go" 2>/dev/null | wc -l); test "$MIGRATION_COUNT" -gt 0 && { log "Found $MIGRATION_COUNT migration file(s)" && log "Running migrations..." && { MIGRATION_OUTPUT=$(/usr/local/bin/pocketbase migrate up --dir="$PB_DATA_DIR" --migrationsDir="$PB_MIGRATIONS_DIR" 2>&1) || { log "Migration failed with output:" && echo "$MIGRATION_OUTPUT" && handle_error "Database migration failed. Check the migration files for errors."; }; } && log "Migrations completed successfully"; } || log "No migration files found in $PB_MIGRATIONS_DIR"; } || log "Migrations directory not found: $PB_MIGRATIONS_DIR"

# Start PocketBase
log "Starting PocketBase on port $PB_PORT..." && log "Data directory: $PB_DATA_DIR" && log "Public directory: $PB_PUBLIC_DIR" && log "Hooks directory: $PB_HOOKS_DIR" && log "Migrations directory: $PB_MIGRATIONS_DIR"

# Execute PocketBase serve command
exec /usr/local/bin/pocketbase serve --http="0.0.0.0:$PB_PORT" --dir="$PB_DATA_DIR" --publicDir="$PB_PUBLIC_DIR" --hooksDir="$PB_HOOKS_DIR" --migrationsDir="$PB_MIGRATIONS_DIR"