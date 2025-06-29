# 🔧 Deployment Fix for Vendor Files

## Problem
Vendor JavaScript files returning HTML instead of JavaScript due to MIME type issues.

## Root Cause
Alpine Docker + Caddy combination not serving `.js` files with correct MIME type from vendor directory.

## Solution 1: Add to entrypoint.sh (before start_server)

```bash
fix_vendor_serving() {
    local public_dir=$(detect_dir)
    if [ -d "$public_dir/vendor" ]; then
        log "🔧 Fixing vendor file serving..."
        
        # Ensure Alpine has correct MIME types
        if [ ! -f /etc/mime.types ]; then
            cat > /etc/mime.types << 'EOF'
application/javascript                  js mjs
text/css                                css
application/json                        json
text/html                               html htm
EOF
        fi
        
        # Set proper file permissions
        find "$public_dir/vendor" -name "*.js" -exec chmod 644 {} \;
        
        log "✅ Vendor files configured"
    fi
}
```

## Solution 2: Alternative PocketBase Start Command

```bash
# Replace the start_server function with:
start_server() {
    stop_server
    log "🚀 Starting server..."
    
    local hooks_dir="$REPO/$BACKEND_DIR/pb_hooks"
    local migrations_dir="$REPO/$BACKEND_DIR/pb_migrations"
    local public_dir=$(detect_dir)
    
    # Add explicit MIME type handling
    export GOMAXPROCS=${GOMAXPROCS:-1}
    
    log "📁 Serving frontend from: $public_dir"
    log "🔄 Starting PocketBase with enhanced static serving..."
    
    "$PB_BIN" serve \
        --http="0.0.0.0:$PB_PORT" \
        --dir="$DATA_DIR" \
        --publicDir="$public_dir" \
        --hooksDir="$hooks_dir" \
        --migrationsDir="$migrations_dir" \
        > /tmp/pb_start.log 2>&1 &
    
    local pb_pid=$!
    echo "$pb_pid" > /tmp/pb.pid
    sleep 5
    
    # Verify and return status
    local real_pid=$(pgrep -f "$PB_BIN.*serve")
    if [ -n "$real_pid" ]; then
        log "✅ Server running on port $PB_PORT (PID: $real_pid)"
        log "📂 Structure: Backend in /$BACKEND_DIR, Frontend in /$FRONTEND_DIR"
        
        # Test vendor file serving
        sleep 2
        if command -v wget >/dev/null 2>&1; then
            wget -q --spider "http://localhost:$PB_PORT/vendor/alpine.min.js" 2>/dev/null && \
                log "✅ Vendor files accessible" || \
                log "⚠️ Vendor files may have serving issues"
        fi
        
        return 0
    else
        log "❌ Server failed to start"
        return 1
    fi
}
```

## Solution 3: Quick Test Command

Add this to test the fix:

```bash
test_vendor_serving() {
    local port=${PB_PORT:-8090}
    log "🧪 Testing vendor file serving..."
    
    if command -v curl >/dev/null 2>&1; then
        local response=$(curl -s -I "http://localhost:$port/vendor/alpine.min.js" 2>/dev/null | grep -i content-type || echo "no-response")
        
        if echo "$response" | grep -q "application/javascript\|text/javascript"; then
            log "✅ Vendor files serving correctly"
        else
            log "❌ Vendor files MIME issue: $response"
            log "🔧 Attempting fix..."
            
            # Restart with verbose logging
            pkill -f "$PB_BIN.*serve" 2>/dev/null || true
            sleep 2
            start_server
        fi
    fi
}
```

## Immediate Action Required

1. Add `fix_vendor_serving()` call before `start_server` in your entrypoint.sh
2. Or update the `start_server()` function with Solution 2
3. Rebuild and redeploy the container
4. The vendor files should then serve with correct MIME types

## Expected Result After Fix
- https://dev.sheep.land/vendor/alpine.min.js returns JavaScript (not HTML)
- Products display correctly (all 13 items)
- Interactive features work properly
- Complete e-commerce functionality restored