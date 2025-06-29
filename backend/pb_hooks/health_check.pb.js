// Health check endpoint for monitoring

routerAdd("GET", "/health", (c) => {
    try {
        // Check database connectivity
        const testQuery = $app.dao().db().newQuery("SELECT 1");
        testQuery.one();
        
        // Get system stats
        const collections = $app.dao().findCollectionsByType("base").length;
        const systemInfo = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            database: "connected",
            collections: collections,
            environment: process.env.SHEEP_LAND_ENV || "development"
        };
        
        return c.json(200, systemInfo);
    } catch (error) {
        return c.json(503, {
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: "Database connection failed"
        });
    }
});

// Extended health check with more details (admin only)
routerAdd("GET", "/health/detailed", (c) => {
    // Check if request has admin auth
    const authRecord = c.get("authRecord");
    if (!authRecord || !authRecord.get("is_admin")) {
        return c.json(403, { error: "Unauthorized" });
    }
    
    try {
        // Database stats
        const ordersCount = $app.dao().findRecordsByFilter("orders", "", "", 0, 1).totalItems;
        const productsCount = $app.dao().findRecordsByFilter("products", "", "", 0, 1).totalItems;
        const usersCount = $app.dao().findRecordsByFilter("users", "", "", 0, 1).totalItems;
        
        // Memory usage
        const memUsage = process.memoryUsage();
        
        return c.json(200, {
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            database: {
                status: "connected",
                orders: ordersCount,
                products: productsCount,
                users: usersCount
            },
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1048576) + " MB",
                heapTotal: Math.round(memUsage.heapTotal / 1048576) + " MB",
                rss: Math.round(memUsage.rss / 1048576) + " MB"
            },
            uptime: Math.round(process.uptime()) + " seconds"
        });
    } catch (error) {
        return c.json(503, {
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});