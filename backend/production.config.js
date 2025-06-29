// Production Configuration for Sheep Land
// This file contains production-specific settings and optimizations

module.exports = {
    // Server Configuration
    server: {
        host: "0.0.0.0",
        port: 8090,
        publicDir: "../frontend",
        maxRequestSize: "10MB"
    },
    
    // Database Configuration
    database: {
        maxConnections: 100,
        idleTimeout: 30000,
        backupSchedule: "0 2 * * *", // Daily at 2 AM
        vacuumSchedule: "0 3 * * 0"  // Weekly on Sunday at 3 AM
    },
    
    // Security Settings
    security: {
        corsOrigins: [
            "https://sheep.land",
            "https://www.sheep.land"
        ],
        trustedProxies: ["127.0.0.1", "::1"],
        sessionTimeout: 3600, // 1 hour
        maxLoginAttempts: 5,
        blockDuration: 900 // 15 minutes
    },
    
    // Performance Settings
    performance: {
        enableGzip: true,
        cacheStatic: true,
        staticCacheMaxAge: 86400, // 1 day
        apiCacheMaxAge: 0, // No caching for API
        compressionLevel: 6
    },
    
    // Email Configuration (to be set in admin panel)
    email: {
        provider: "smtp",
        maxRetries: 3,
        retryDelay: 5000,
        batchSize: 50
    },
    
    // Logging Configuration
    logging: {
        level: "info", // error, warn, info, debug
        maxFileSize: "10MB",
        maxFiles: 7,
        logErrors: true,
        logRequests: false,
        excludePaths: ["/health", "/api/files"]
    },
    
    // Rate Limiting (defaults, overridden by database settings)
    rateLimiting: {
        windowMs: 60000, // 1 minute
        maxRequests: {
            orders: 5,
            auth: 10,
            api: 100
        }
    },
    
    // File Upload Settings
    uploads: {
        maxFileSize: "5MB",
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        imageSizes: {
            thumbnail: { width: 150, height: 150 },
            medium: { width: 500, height: 500 },
            large: { width: 1200, height: 1200 }
        }
    },
    
    // Monitoring
    monitoring: {
        healthCheckInterval: 60000, // 1 minute
        metricsEnabled: true,
        alertThresholds: {
            cpuUsage: 80,
            memoryUsage: 85,
            diskUsage: 90,
            errorRate: 5 // errors per minute
        }
    },
    
    // Feature Flags
    features: {
        enableFarmManagement: true,
        enableFeasibilityCalculator: true,
        enablePromoCodes: true,
        enableDeliveryTracking: true,
        enableMaintenanceMode: true,
        enableAuditLogging: true
    },
    
    // External Services (configure as needed)
    services: {
        whatsapp: {
            enabled: false,
            apiUrl: "",
            apiKey: ""
        },
        sms: {
            enabled: false,
            provider: "",
            apiKey: ""
        },
        paymentGateway: {
            enabled: false,
            provider: "", // stripe, paypal, paymob
            apiKey: "",
            webhookSecret: ""
        },
        cdn: {
            enabled: false,
            url: "",
            pullZone: ""
        }
    }
};