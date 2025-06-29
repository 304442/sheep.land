// Basic rate limiting for API protection

// Simple in-memory rate limiter (resets on server restart)
const rateLimitStore = {};
const WINDOW_MS = 60 * 1000; // 1 minute window

// Get rate limits from settings or use defaults
let MAX_REQUESTS = {
    orders: 5,        // Default: 5 orders per minute
    auth: 10,         // Default: 10 auth attempts per minute
    general: 100      // Default: 100 general requests per minute
};

// Load rate limits from settings
try {
    const settings = $app.dao().findFirstRecordByFilter("settings", "");
    if (settings) {
        MAX_REQUESTS.orders = settings.get("rate_limit_orders_per_minute") || MAX_REQUESTS.orders;
        MAX_REQUESTS.auth = settings.get("rate_limit_auth_per_minute") || MAX_REQUESTS.auth;
    }
} catch (e) {
    console.log("Using default rate limits");
}

function getRateLimitKey(ip, collection) {
    return `${ip}:${collection}`;
}

function checkRateLimit(ip, collection, limit) {
    const key = getRateLimitKey(ip, collection);
    const now = Date.now();
    
    if (!rateLimitStore[key]) {
        rateLimitStore[key] = {
            count: 1,
            resetTime: now + WINDOW_MS
        };
        return true;
    }
    
    // Reset if window expired
    if (now > rateLimitStore[key].resetTime) {
        rateLimitStore[key] = {
            count: 1,
            resetTime: now + WINDOW_MS
        };
        return true;
    }
    
    // Check limit
    if (rateLimitStore[key].count >= limit) {
        return false;
    }
    
    rateLimitStore[key].count++;
    return true;
}

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const key in rateLimitStore) {
        if (rateLimitStore[key].resetTime < now) {
            delete rateLimitStore[key];
        }
    }
}, WINDOW_MS);

// Rate limit order creation
onRecordCreateRequest((e) => {
    if (e.collection.name !== "orders") return;
    
    const ip = e.httpContext.realIP();
    if (!checkRateLimit(ip, "orders", MAX_REQUESTS.orders)) {
        throw new BadRequestError("Too many requests. Please try again later.");
    }
}, "rate_limit_orders");

// Rate limit authentication attempts
onRecordAuthRequest((e) => {
    const ip = e.httpContext.realIP();
    if (!checkRateLimit(ip, "auth", MAX_REQUESTS.auth)) {
        throw new BadRequestError("Too many authentication attempts. Please try again later.");
    }
}, "rate_limit_auth");

// General API rate limiting
onRequest((e) => {
    // Skip admin dashboard and static files
    if (e.httpContext.path().startsWith("/_/") || 
        e.httpContext.path().startsWith("/api/files/")) {
        return;
    }
    
    const ip = e.httpContext.realIP();
    if (!checkRateLimit(ip, "general", MAX_REQUESTS.general)) {
        e.json(429, {
            message: "Rate limit exceeded. Please slow down.",
            code: 429
        });
    }
}, "rate_limit_general");