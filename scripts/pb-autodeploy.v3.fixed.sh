#!/bin/bash
# PocketBase AutoDeploy - Fixed version
set -euo pipefail

# Configuration
REPO="${REPO:-/srv/repo}"; APP_ROOT="${PB_APP_ROOT:-/srv/pb}"; DATA_DIR="${DATA_DIR:-$APP_ROOT/pb_runtime}"; BACKUPS_DIR="${BACKUPS_DIR:-$APP_ROOT/backups}"; PB_BIN="${PB_BINARY_PATH:-$APP_ROOT/bin/pb}"
INTERVAL="${PULL_INTERVAL:-60}"; TIMEOUT="${TIMEOUT:-120}"; PB_VERSION="${PB_VERSION:-latest}"; PB_PORT="${PB_PORT:-8090}"
REPO_URL="${REPO_URL:-}"; GIT_TOKEN="${GIT_TOKEN:-}"; GIT_BRANCH="${GIT_BRANCH:-main}"; ADMIN_EMAIL="${ADMIN_EMAIL:-}"; ADMIN_PASS="${ADMIN_PASS:-}"
BACKUP_ENABLED="${BACKUP_ENABLED:-false}"; BACKUP_DAYS="${BACKUP_DAYS:-7}"; MAX_BACKUPS="${MAX_BACKUPS:-30}"; DEBUG="${DEBUG:-false}"; FIRST_RUN="true"

# Basic functions
log() { echo "[$(date +'%H:%M:%S')] $1"; }
exists() { command -v "$1" >/dev/null 2>&1; }
is_running() { pgrep -f "$PB_BIN.*serve" >/dev/null 2>&1; }
cleanup() { log "🧹 Cleaning up processes..." && pkill -f "$PB_BIN.*serve" 2>/dev/null || true; }

# Setup functions
setup_dirs() { log "📁 Creating directories..." && mkdir -p "$(dirname "$PB_BIN")" "$DATA_DIR/pb_data" "$BACKUPS_DIR" "$REPO" && log "✅ Directories created"; }
install_deps() { log "📦 Checking dependencies..." && exists git && exists pnpm && log "✅ Dependencies already installed" && return 0; log "📥 Installing system dependencies..." && grep -q "edge/community" /etc/apk/repositories 2>/dev/null || echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories; apk add --no-cache git wget unzip jq nodejs npm && log "📦 Installing package managers..." && exists pnpm || npm install -g pnpm && log "✅ Dependencies installed"; }
get_pb() { log "🔍 Checking PocketBase binary..." && test -x "$PB_BIN" && "$PB_BIN" --help >/dev/null 2>&1 && log "✅ PocketBase already installed" && return 0; log "📥 Downloading PocketBase $PB_VERSION..." && local ver="$PB_VERSION"; test "$PB_VERSION" = "latest" && log "🔍 Getting latest version..." && ver=$(wget -qO- https://api.github.com/repos/pocketbase/pocketbase/releases/latest | jq -r '.tag_name' | sed 's/^v//') && log "📦 Latest version: v$ver"; log "⬇️ Downloading PocketBase v$ver..." && wget -q -O /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${ver}/pocketbase_${ver}_linux_amd64.zip" && log "📂 Extracting binary..." && unzip -p /tmp/pb.zip pocketbase > "$PB_BIN" && rm /tmp/pb.zip && chmod 755 "$PB_BIN" && log "✅ PocketBase v$ver installed"; }
setup_admin() { log "👤 Checking admin setup..." && test -n "$ADMIN_EMAIL" && test -n "$ADMIN_PASS" && test "$FIRST_RUN" = "true" && log "🔧 Creating admin user: $ADMIN_EMAIL" && "$PB_BIN" superuser upsert --dir="$DATA_DIR" "$ADMIN_EMAIL" "$ADMIN_PASS" >/dev/null 2>&1 && log "✅ Admin user configured" || log "ℹ️ Admin setup skipped"; }

# Git functions
auth_url() { test -n "$GIT_TOKEN" && echo "$1" | grep -q -E "(github|gitlab|bitbucket)" && log "🔐 Using git token authentication" && echo "${1/https:\/\//https://oauth2:${GIT_TOKEN}@}" || echo "$1"; }
clone_repo() { log "📥 Checking repository..." && test -d "$REPO/.git" && log "✅ Repository already exists" && return 0; test -z "$REPO_URL" && log "❌ REPO_URL not configured" && return 1; log "🔍 Validating repository and branch..." && git ls-remote --heads "$(auth_url "$REPO_URL")" "$GIT_BRANCH" >/dev/null 2>&1 || { log "❌ Branch '$GIT_BRANCH' not found in repository"; return 1; }; log "✅ Branch '$GIT_BRANCH' exists" && log "🗑️ Cleaning existing directory..." && test -d "$REPO" && rm -rf "$REPO"; log "📁 Creating repo directory..." && mkdir -p "$REPO"; log "📥 Cloning $REPO_URL (branch: $GIT_BRANCH)..." && git clone --depth 1 -b "$GIT_BRANCH" "$(auth_url "$REPO_URL")" "$REPO" && log "✅ Repository cloned successfully" && log "🔍 Scanning repository features..." && log "📁 Project type: $(test -f "$REPO/package.json" && echo "Node.js project ($(get_package_manager))" || echo "Static files")" && log "🎣 Hooks: $(test -d "$REPO/pb_hooks" && echo "$(find "$REPO/pb_hooks" -name "*.js" -o -name "*.go" 2>/dev/null | wc -l) files found" || echo "none")" && log "🗄️ Migrations: $(test -d "$REPO/pb_migrations" && { local count=$(find "$REPO/pb_migrations" -name "*.js" -o -name "*.go" 2>/dev/null | wc -l); test "$count" -gt 0 && echo "$count files found" || echo "directory exists but no files"; } || echo "none")" && log "📂 Build output: $(detect_project_type)"; }
check_updates() { log "🔍 Checking for updates..." && test -d "$REPO/.git" || { log "❌ Not a git repository"; return 1; }; cd "$REPO" && log "📡 Fetching from origin/$GIT_BRANCH..." && git fetch origin "$GIT_BRANCH" --quiet && local local_hash=$(git rev-parse HEAD) && local remote_hash=$(git rev-parse "origin/$GIT_BRANCH") && log "🔍 Local: ${local_hash:0:8}, Remote: ${remote_hash:0:8}" && test "$local_hash" != "$remote_hash" && log "🆕 Updates available!" || { log "✅ Repository up to date"; return 1; }; }
apply_updates() { log "⬇️ Applying updates..." && cd "$REPO" && git reset --hard "origin/$GIT_BRANCH" && log "✅ Updates applied successfully" && log "🔍 Checking updated features..." && log "🎣 Hooks: $(test -d "$REPO/pb_hooks" && echo "$(find "$REPO/pb_hooks" -name "*.js" -o -name "*.go" 2>/dev/null | wc -l) files" || echo "none")" && log "🗄️ Migrations: $(test -d "$REPO/pb_migrations" && { local count=$(find "$REPO/pb_migrations" -name "*.js" -o -name "*.go" 2>/dev/null | wc -l); test "$count" -gt 0 && echo "$count files" || echo "directory exists but no files"; } || echo "none")"; }

# Build functions
detect_dir() { for d in dist build out public .next _site; do if test -d "$REPO/$d"; then echo "$REPO/$d" && return; fi; done; echo "$REPO"; }
detect_dir_verbose() { log "🔍 Detecting public directory..." && for d in dist build out public .next _site; do if test -d "$REPO/$d"; then log "📁 Found: $REPO/$d" && echo "$REPO/$d" && return; fi; done; log "📁 Using repo root: $REPO" && echo "$REPO"; }
detect_project_type() { test -d "$REPO" && test -r "$REPO" || { echo "Repository access error"; return; }; test -f "$REPO/package.json" && { local pkg_content=$(cat "$REPO/package.json" 2>/dev/null || echo "{}"); { test -f "$REPO/lerna.json" || test -f "$REPO/nx.json" || test -f "$REPO/rush.json" || test -f "$REPO/turbo.json" || test -f "$REPO/pnpm-workspace.yaml" || echo "$pkg_content" | grep -qE '"workspaces"[[:space:]]*:'; } && echo "Monorepo project" && return; { echo "$pkg_content" | grep -qE '"next"[[:space:]]*:' || test -f "$REPO/next.config.js" || test -f "$REPO/next.config.mjs"; } && { test -d "$REPO/.next" && echo "Next.js app (.next/)" || { test -d "$REPO/out" && echo "Next.js static export (out/)" || echo "Next.js project"; }; } && return; { echo "$pkg_content" | grep -qE '"astro"[[:space:]]*:' || test -f "$REPO/astro.config.js" || test -f "$REPO/astro.config.mjs"; } && { test -d "$REPO/dist" && echo "Astro site (dist/)" || echo "Astro project"; } && return; { echo "$pkg_content" | grep -qE '"gatsby"[[:space:]]*:' || test -f "$REPO/gatsby-config.js" || test -f "$REPO/gatsby-node.js"; } && { test -d "$REPO/public" && echo "Gatsby site (public/)" || echo "Gatsby project"; } && return; { echo "$pkg_content" | grep -qE '"@remix-run"' || test -f "$REPO/remix.config.js"; } && { test -d "$REPO/build" && echo "Remix app (build/)" || echo "Remix project"; } && return; { echo "$pkg_content" | grep -qE '"nuxt"[[:space:]]*:' || test -f "$REPO/nuxt.config.js" || test -f "$REPO/nuxt.config.ts"; } && { test -d "$REPO/.output" && echo "Nuxt app (.output/)" || { test -d "$REPO/dist" && echo "Nuxt static (dist/)" || echo "Nuxt project"; }; } && return; { echo "$pkg_content" | grep -qE '"vue"[[:space:]]*:' || test -f "$REPO/vue.config.js"; } && { test -d "$REPO/dist" && echo "Vue app (dist/)" || echo "Vue project"; } && return; { echo "$pkg_content" | grep -qE '"svelte"[[:space:]]*:' || test -f "$REPO/svelte.config.js"; } && { test -d "$REPO/build" && echo "SvelteKit app (build/)" || { test -d "$REPO/dist" && echo "Svelte Vite app (dist/)" || echo "Svelte project"; }; } && return; { echo "$pkg_content" | grep -qE '"@angular"' || test -f "$REPO/angular.json"; } && { test -d "$REPO/dist" && echo "Angular app (dist/)" || echo "Angular project"; } && return; { echo "$pkg_content" | grep -qE '"@docusaurus"' || test -f "$REPO/docusaurus.config.js"; } && { test -d "$REPO/build" && echo "Docusaurus site (build/)" || echo "Docusaurus project"; } && return; { echo "$pkg_content" | grep -qE '"solid-js"[[:space:]]*:' || { test -f "$REPO/vite.config.js" && grep -qE '(solid|@solidjs)' "$REPO/vite.config.js" 2>/dev/null; }; } && { test -d "$REPO/dist" && echo "SolidJS app (dist/)" || echo "SolidJS project"; } && return; { echo "$pkg_content" | grep -qE '"preact"[[:space:]]*:' || test -f "$REPO/preact.config.js"; } && { test -d "$REPO/build" && echo "Preact app (build/)" || { test -d "$REPO/dist" && echo "Preact app (dist/)" || echo "Preact project"; }; } && return; { echo "$pkg_content" | grep -qE '"@builder\.io/qwik"' || { test -f "$REPO/vite.config.ts" && grep -qE '(qwik|@builder\.io/qwik)' "$REPO/vite.config.ts" 2>/dev/null; }; } && { test -d "$REPO/dist" && echo "Qwik app (dist/)" || echo "Qwik project"; } && return; { echo "$pkg_content" | grep -qE '"react-native"[[:space:]]*:' || echo "$pkg_content" | grep -qE '"@react-native"' || test -f "$REPO/metro.config.js"; } && echo "React Native app" && return; { echo "$pkg_content" | grep -qE '"electron"[[:space:]]*:' || test -f "$REPO/electron.config.js"; } && echo "Electron app" && return; echo "$pkg_content" | grep -qE '"react"[[:space:]]*:' && { test -d "$REPO/build" && echo "React app (build/)" || { test -d "$REPO/dist" && echo "React Vite app (dist/)" || echo "React project"; }; } && return; { test -f "$REPO/vite.config.js" || test -f "$REPO/vite.config.ts"; } && { test -d "$REPO/dist" && echo "Vite app (dist/)" || echo "Vite project"; } && return; test -f "$REPO/tsconfig.json" && echo "TypeScript project" && return; echo "Node.js project ($(get_package_manager))"; } && return; { test -f "$REPO/deno.json" || test -f "$REPO/deno.jsonc" || test -f "$REPO/import_map.json"; } && echo "Deno project" && return; { test -f "$REPO/bun.lockb" || { test -f "$REPO/package.json" && grep -qE '"bun"[[:space:]]*:' "$REPO/package.json" 2>/dev/null; }; } && echo "Bun project" && return; test -f "$REPO/_config.yml" && { test -d "$REPO/_site" && echo "Jekyll site (_site/)" || echo "Jekyll project"; } && return; { test -f "$REPO/.eleventy.js" || test -f "$REPO/eleventy.config.js"; } && { test -d "$REPO/_site" && echo "11ty site (_site/)" || echo "11ty project"; } && return; { test -f "$REPO/config.yaml" || test -f "$REPO/config.toml" || test -f "$REPO/hugo.yaml" || { test -f "$REPO/config.yml" && test -d "$REPO/content"; }; } && { test -d "$REPO/public" && echo "Hugo site (public/)" || echo "Hugo project"; } && return; { test -f "$REPO/index.html" || test -f "$REPO/index.htm"; } && { test -d "$REPO/public" && echo "Simple static site (public/)" || echo "Simple static site (root)"; } && return; find "$REPO" -maxdepth 1 -name "*.html" -o -name "*.htm" 2>/dev/null | head -1 | grep -q . && echo "Simple static site (root)" && return; for d in dist build out public .next _site www docs; do test -d "$REPO/$d" && { case "$d" in "dist") echo "Static build (dist/)" ;; "build") echo "Static build (build/)" ;; "out") echo "Static export (out/)" ;; "public") echo "Static files (public/)" ;; ".next") echo "Next.js build (.next/)" ;; "_site") echo "Static site (_site/)" ;; "www") echo "Ionic/Cordova app (www/)" ;; "docs") echo "Documentation site (docs/)" ;; esac; } && return; done; echo "Unknown project type (root)"; }
get_package_manager() { test -f "$REPO/pnpm-lock.yaml" && echo "pnpm" && return; test -f "$REPO/yarn.lock" && echo "yarn" && return; test -f "$REPO/package-lock.json" && echo "npm" && return; exists pnpm && echo "pnpm" && return; exists yarn && echo "yarn" && return; echo "npm"; }
needs_build() { log "🔍 Checking build requirements..." && test -f "$REPO/package.json" || { log "ℹ️ No package.json found, skipping build"; return 1; }; local build_dir=$(detect_dir); test "$build_dir" = "$REPO" && log "🔨 Build needed (no build directory)" && return 0; test ! -d "$build_dir" && log "🔨 Build needed (build directory missing)" && return 0; test "$REPO/package.json" -nt "$build_dir" && log "🔨 Build needed (package.json newer)" && return 0; log "✅ Build not required"; return 1; }
build_app() { needs_build || return 0; log "🔨 Starting build process..." && cd "$REPO"; local pm=$(get_package_manager) && log "📦 Using package manager: $pm" && exists "$pm" || { log "❌ Package manager '$pm' not available" && return 1; }; log "📦 Installing dependencies..."; case "$pm" in "pnpm") test -f "pnpm-lock.yaml" && pnpm install --frozen-lockfile || pnpm install ;; "yarn") test -f "yarn.lock" && yarn install --frozen-lockfile || yarn install ;; "npm") test -f "package-lock.json" && npm ci || npm install ;; esac && log "🏗️ Running build command..." && case "$pm" in "pnpm") pnpm run build ;; "yarn") yarn build ;; "npm") npm run build ;; esac && log "✅ Build completed successfully" && cd "$APP_ROOT"; }

# Server functions
stop_server() { log "🔍 Checking server status..." && is_running || { log "ℹ️ Server not running"; return 0; }; log "🛑 Stopping PocketBase server..." && pkill -TERM -f "$PB_BIN.*serve" 2>/dev/null || true; log "⏳ Waiting for graceful shutdown..." && sleep 3; log "💥 Force killing if still running..." && pkill -KILL -f "$PB_BIN.*serve" 2>/dev/null || true && log "✅ Server stopped"; }

# Fixed start_server function with proper error handling
start_server() { 
    stop_server
    
    log "🔍 Checking PocketBase features..."
    
    # Check for hooks
    if test -d "$REPO/pb_hooks"; then
        log "🎣 Hooks found: $(find "$REPO/pb_hooks" -name "*.js" -o -name "*.go" 2>/dev/null | wc -l) files"
    else
        log "ℹ️ No hooks directory"
    fi
    
    # Check and run migrations with proper error handling
    if test -d "$REPO/pb_migrations"; then
        local migration_count=$(find "$REPO/pb_migrations" -name "*.js" -o -name "*.go" 2>/dev/null | wc -l)
        if test "$migration_count" -gt 0; then
            log "🗄️ Found $migration_count migration files"
            log "🔄 Running migrations..."
            
            # Capture migration output for debugging
            local migration_output
            if migration_output=$("$PB_BIN" migrate up --dir="$DATA_DIR" --migrationsDir="$REPO/pb_migrations" 2>&1); then
                log "✅ Migrations applied successfully"
            else
                log "❌ Migration failed with error:"
                log "$migration_output"
                log "🔍 Common migration issues:"
                log "  - Check migration file syntax"
                log "  - Ensure collection names match exactly"
                log "  - Verify field types are valid"
                log "  - Check for duplicate field/collection names"
                # Exit with error to prevent server start
                return 1
            fi
        else
            log "ℹ️ Migrations directory empty"
        fi
    else
        log "ℹ️ No migrations directory"
    fi
    
    log "🚀 Starting server..."
    log "⏳ Waiting for startup..."
    
    # Start server in background
    nohup "$PB_BIN" serve \
        --http="0.0.0.0:$PB_PORT" \
        --dir="$DATA_DIR" \
        --publicDir="$(detect_dir)" \
        --hooksDir="$REPO/pb_hooks" \
        --migrationsDir="$REPO/pb_migrations" \
        >/dev/null 2>&1 &
    
    # Wait and check if running
    sleep 2
    
    if is_running; then
        log "✅ Server running at http://0.0.0.0:$PB_PORT"
        return 0
    else
        log "❌ Server failed to start"
        # Try to get error logs
        if test -f "$DATA_DIR/pb_data/logs.db"; then
            log "🔍 Check logs at: $DATA_DIR/pb_data/logs.db"
        fi
        return 1
    fi
}

# Backup functions
create_backup() { log "🔍 Checking backup requirements..." && test "$BACKUP_ENABLED" = "true" && test "$FIRST_RUN" != "true" || { log "ℹ️ Backup skipped (disabled or first run)"; return 0; }; local ts=$(date +%Y%m%d_%H%M%S) && log "📦 Creating backup timestamp: $ts" && log "📁 Backing up repository..." && cd "$(dirname "$REPO")" && tar -czf "$BACKUPS_DIR/repo_$ts.tar.gz" "$(basename "$REPO")" && log "💾 Backing up data..." && cd "$(dirname "$DATA_DIR")" && tar -czf "$BACKUPS_DIR/data_$ts.tar.gz" "$(basename "$DATA_DIR")" && log "✅ Backup created: repo_$ts.tar.gz, data_$ts.tar.gz"; }
cleanup_old() { log "🧹 Cleaning old backups (older than $BACKUP_DAYS days)..." && test "$BACKUP_DAYS" -gt 0 2>/dev/null && find "$BACKUPS_DIR" -name "*.tar.gz" -mtime "+$BACKUP_DAYS" -delete 2>/dev/null && log "✅ Old backups cleaned" || log "ℹ️ No old backup cleanup"; }
cleanup_excess() { log "🧹 Cleaning excess backups (keeping last $MAX_BACKUPS)..." && test "$MAX_BACKUPS" -gt 0 2>/dev/null && { local skip=$((MAX_BACKUPS + 1)); ls -t "$BACKUPS_DIR"/*.tar.gz 2>/dev/null | tail -n +$skip | xargs rm -f 2>/dev/null && log "✅ Excess backups cleaned" || log "ℹ No excess backups to clean"; } || log "ℹ️ No excess backup cleanup"; }
backup() { create_backup && cleanup_old && cleanup_excess; }

# Main functions
run_setup() { log "🚀 Starting initial setup..." && setup_dirs && install_deps && get_pb && setup_admin && clone_repo && build_app && start_server && log "🎉 Initial setup completed successfully"; }
run_update() { log "🔄 Starting update check cycle..." && { is_running || { log "⚠️ Server not running, starting..." && start_server; }; } && check_updates && log "📥 Processing updates..." && backup && apply_updates && build_app && start_server && log "🎉 Update cycle completed successfully" || log "✅ No updates needed, system healthy"; }

# Signal handling
trap 'log "🛑 Shutdown signal received..." && cleanup && log "👋 Goodbye!" && exit 0' SIGINT SIGTERM

# Main execution
log "🎯 PocketBase AutoDeploy starting..."
log "⚙️ Configuration: REPO_URL=${REPO_URL:-'not set'}, BRANCH=$GIT_BRANCH, INTERVAL=${INTERVAL}s, BACKUP=$BACKUP_ENABLED"
test "$INTERVAL" -eq 0 && log "🎣 Running in hook mode (single execution)" && { test "$FIRST_RUN" = "true" && run_setup || run_update; } || { log "🔄 Running in polling mode (continuous monitoring)" && while true; do if test "$FIRST_RUN" = "true"; then if run_setup; then FIRST_RUN="false" && log "🔄 Switching to update monitoring mode..." && log "📊 System status: Hooks=$(test -d "$REPO/pb_hooks" && echo "active" || echo "none"), Migrations=$(test -d "$REPO/pb_migrations" && test "$(find "$REPO/pb_migrations" -name "*.js" -o -name "*.go" 2>/dev/null | wc -l)" -gt 0 && echo "active" || echo "none"), Public=$(basename "$(detect_dir)")"; else log "❌ Setup failed, retrying in ${INTERVAL}s..."; fi; else run_update; fi; test "$DEBUG" = "true" && log "💤 Sleeping for ${INTERVAL} seconds..."; sleep "$INTERVAL"; done; }