// Maintenance Mode Check
// Blocks access when maintenance mode is enabled

onRequest((e) => {
    // Skip maintenance check for admin routes
    if (e.httpContext.path().startsWith("/_/") || 
        e.httpContext.path().startsWith("/api/files/")) {
        e.next();
        return;
    }
    
    // Skip for health check endpoint
    if (e.httpContext.path() === "/api/health") {
        e.next();
        return;
    }
    
    try {
        // Check maintenance mode setting
        const settings = $app.dao().findFirstRecordByFilter("settings", "");
        if (!settings || !settings.get("maintenance_mode")) {
            e.next();
            return; // Not in maintenance mode
        }
        
        // Allow admin users to bypass maintenance
        const authRecord = e.httpContext.get("authRecord");
        if (authRecord && authRecord.get("is_admin")) {
            e.next();
            return;
        }
        
        // Get maintenance message
        const message = settings.get("maintenance_message") || 
            "We're currently performing maintenance. Please check back soon.";
        
        // Return maintenance response
        e.json(503, {
            error: "maintenance_mode",
            message: message,
            message_ar: "نعتذر، الموقع تحت الصيانة حالياً. سنعود قريباً.",
            status: 503
        });
        // Don't call next() when in maintenance mode
        
    } catch (error) {
        // If settings check fails, allow request to continue
        console.error("Maintenance mode check failed:", error);
        e.next();
    }
});