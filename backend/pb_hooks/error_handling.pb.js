// Production Error Handling and Monitoring

// Global error handler for unhandled exceptions
onError((e) => {
    const error = e.error;
    const context = e.httpContext;
    
    // Log error details for monitoring
    const errorDetails = {
        timestamp: new Date().toISOString(),
        path: context.path(),
        method: context.method(),
        ip: context.realIP(),
        statusCode: error.code || 500,
        message: error.message,
        stack: $app.isDev() ? error.stack : undefined
    };
    
    // Log to error collection for monitoring
    try {
        const errorCollection = $app.dao().findCollectionByNameOrId("error_logs");
        if (errorCollection) {
            const errorRecord = new Record(errorCollection);
            errorRecord.set("timestamp", errorDetails.timestamp);
            errorRecord.set("path", errorDetails.path);
            errorRecord.set("method", errorDetails.method);
            errorRecord.set("ip", errorDetails.ip);
            errorRecord.set("status_code", errorDetails.statusCode);
            errorRecord.set("message", errorDetails.message);
            errorRecord.set("stack", errorDetails.stack);
            errorRecord.set("user_id", context.get("authRecord")?.id || "");
            
            $app.dao().saveRecord(errorRecord);
        }
    } catch (logError) {
        // Fallback to console if database logging fails
        console.error(`[ErrorHandler] Failed to log error: ${logError.message}`);
    }
    
    // Return user-friendly error response
    const isProduction = !$app.isDev();
    const statusCode = error.code || 500;
    
    // User-friendly error messages
    const errorMessages = {
        400: { en: "Bad Request", ar: "طلب غير صالح" },
        401: { en: "Unauthorized", ar: "غير مصرح" },
        403: { en: "Forbidden", ar: "محظور" },
        404: { en: "Not Found", ar: "غير موجود" },
        429: { en: "Too Many Requests", ar: "طلبات كثيرة جداً" },
        500: { en: "Internal Server Error", ar: "خطأ في الخادم" },
        503: { en: "Service Unavailable", ar: "الخدمة غير متاحة" }
    };
    
    const defaultMessage = errorMessages[statusCode] || errorMessages[500];
    
    // Build response
    const response = {
        error: true,
        code: statusCode,
        message: isProduction ? defaultMessage.en : error.message,
        message_ar: isProduction ? defaultMessage.ar : error.message,
        request_id: context.id()
    };
    
    // Add debug info in development
    if (!isProduction) {
        response.debug = {
            stack: error.stack,
            details: error.details
        };
    }
    
    // Send response
    e.json(statusCode, response);
});

// Database connection error handler
onDatabaseError((e) => {
    const timestamp = new Date().toISOString();
    console.error(`[Database] Error at ${timestamp}: ${e.error.message}`);
    
    // Notify administrators
    try {
        const settings = $app.dao().findFirstRecordByFilter("settings", "");
        if (settings?.get("alert_email")) {
            // Send alert email to administrators
            const message = new MailerMessage({
                from: { 
                    address: settings.get("app_email_sender_address") || "noreply@sheep.land",
                    name: "Sheep Land Alerts"
                },
                to: [{ address: settings.get("alert_email") }],
                subject: "Database Error Alert",
                html: `
                    <h2>Database Error Detected</h2>
                    <p><strong>Time:</strong> ${timestamp}</p>
                    <p><strong>Error:</strong> ${e.error.message}</p>
                    <p>Please check the server logs for more details.</p>
                `
            });
            
            $mails.send(message);
        }
    } catch (alertError) {
        console.error(`[Database] Failed to send alert: ${alertError.message}`);
    }
});

// Request timeout handler
const REQUEST_TIMEOUT = 30000; // 30 seconds

onRequest((e) => {
    const startTime = Date.now();
    
    // Set timeout for long-running requests
    const timeoutId = setTimeout(() => {
        if (!e.httpContext.response().committed) {
            e.json(408, {
                error: true,
                code: 408,
                message: "Request Timeout",
                message_ar: "انتهت مهلة الطلب",
                request_id: e.httpContext.id()
            });
        }
    }, REQUEST_TIMEOUT);
    
    // Clear timeout when request completes
    e.onAfterResponse(() => {
        clearTimeout(timeoutId);
        
        // Log slow requests
        const duration = Date.now() - startTime;
        if (duration > 5000) { // Log requests taking more than 5 seconds
            console.error(`[Performance] Slow request: ${e.httpContext.path()} took ${duration}ms`);
        }
    });
    
    e.next();
});

// Health check endpoint for monitoring
routerAdd("GET", "/api/health", (c) => {
    try {
        // Check database connection
        const settings = $app.dao().findFirstRecordByFilter("settings", "");
        const dbHealthy = settings !== null;
        
        // Check available disk space
        const stats = $os.diskUsage("/");
        const diskHealthy = stats.available > 1024 * 1024 * 100; // 100MB minimum
        
        // Overall health status
        const healthy = dbHealthy && diskHealthy;
        
        return c.json(healthy ? 200 : 503, {
            status: healthy ? "healthy" : "unhealthy",
            timestamp: new Date().toISOString(),
            checks: {
                database: dbHealthy ? "ok" : "error",
                disk: diskHealthy ? "ok" : "low space",
                disk_available_mb: Math.round(stats.available / 1024 / 1024)
            },
            version: "1.0.0"
        });
    } catch (error) {
        return c.json(503, {
            status: "error",
            message: "Health check failed",
            timestamp: new Date().toISOString()
        });
    }
});

// Graceful shutdown handler
onShutdown((e) => {
    console.log("[Shutdown] Gracefully shutting down Sheep Land...");
    
    // Log shutdown event
    try {
        const auditCollection = $app.dao().findCollectionByNameOrId("audit_logs");
        if (auditCollection) {
            const record = new Record(auditCollection);
            record.set("action", "system_shutdown");
            record.set("entity_type", "system");
            record.set("entity_id", "");
            record.set("timestamp", new Date().toISOString());
            $app.dao().saveRecord(record);
        }
    } catch (e) {
        // Best effort logging
    }
    
    console.log("[Shutdown] Shutdown complete");
});