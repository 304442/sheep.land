// Security headers and middleware for PocketBase

// Add security headers to all responses
routerAdd("GET", "/*", (c) => {
    // Security headers
    c.response().header().set("X-Content-Type-Options", "nosniff");
    c.response().header().set("X-Frame-Options", "DENY");
    c.response().header().set("X-XSS-Protection", "1; mode=block");
    c.response().header().set("Referrer-Policy", "strict-origin-when-cross-origin");
    c.response().header().set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    
    // Content Security Policy - Production ready without unsafe-eval
    const isDev = c.request().url.host.includes("localhost");
    const cspPolicy = isDev ? 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';"
        :
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';";
    
    c.response().header().set("Content-Security-Policy", cspPolicy);
    
    // HSTS (only for production with HTTPS)
    if (c.request().url.scheme === "https") {
        c.response().header().set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    
    c.next();
});

// CORS configuration
routerAdd("OPTIONS", "/*", (c) => {
    const origin = c.request().header.get("Origin");
    const isDev = process.env.SHEEP_LAND_ENV !== "production";
    
    // Production-only origins
    const allowedOrigins = [
        "https://sheep.land",
        "https://www.sheep.land"
    ];
    
    // Add localhost only in development
    if (isDev) {
        allowedOrigins.push("http://localhost:8090");
    }
    
    if (allowedOrigins.includes(origin)) {
        c.response().header().set("Access-Control-Allow-Origin", origin);
        c.response().header().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        c.response().header().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        c.response().header().set("Access-Control-Max-Age", "86400");
    }
    
    return c.noContent(204);
});

// Input sanitization helper
function sanitizeHtml(input) {
    if (!input) return '';
    
    // Basic HTML entity encoding
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Export for use in other hooks
module.exports = { sanitizeHtml };