// Maintenance Mode Check
// Blocks access when maintenance mode is enabled

onRequest((e) => {
    // Skip maintenance check for admin routes
    if (e.httpContext.path().startsWith("/_/") || 
        e.httpContext.path().startsWith("/api/files/")) {
        return;
    }
    
    // Skip for health check endpoint
    if (e.httpContext.path() === "/api/health") {
        return;
    }
    
    try {
        // Check maintenance mode setting
        const settings = $app.dao().findFirstRecordByFilter("settings", "");
        if (!settings || !settings.get("maintenance_mode")) {
            return; // Not in maintenance mode
        }
        
        // Allow admin users to bypass maintenance
        const authRecord = e.get("authRecord");
        if (authRecord && authRecord.get("is_admin")) {
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
        
    } catch (error) {
        // If settings check fails, allow request to continue
        console.error("Maintenance mode check failed:", error);
    }
}, "maintenance_mode_check");