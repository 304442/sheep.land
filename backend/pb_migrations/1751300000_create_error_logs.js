/// <reference path="../pb_data/types.d.ts" />
// Create error_logs collection for production monitoring

migrate((app) => {
    const collection = new Collection({
        id: "pbc_error_logs",
        type: "base",
        name: "error_logs",
        listRule: "@request.auth.is_admin = true",
        viewRule: "@request.auth.is_admin = true",
        createRule: null, // Only system can create
        updateRule: null,
        deleteRule: "@request.auth.is_admin = true",
        fields: [
            {
                name: "timestamp",
                type: "date",
                required: true
            },
            {
                name: "path",
                type: "text",
                required: true,
                max: 500
            },
            {
                name: "method",
                type: "select",
                required: true,
                values: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
            },
            {
                name: "ip",
                type: "text",
                required: false,
                max: 45 // IPv6 max length
            },
            {
                name: "status_code",
                type: "number",
                required: true,
                min: 100,
                max: 599
            },
            {
                name: "message",
                type: "text",
                required: true,
                max: 1000
            },
            {
                name: "stack",
                type: "text",
                required: false,
                max: 5000
            },
            {
                name: "user_id",
                type: "relation",
                required: false,
                collectionId: "_pb_users_auth_",
                cascadeDelete: false,
                maxSelect: 1
            }
        ],
        indexes: [
            "CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC)",
            "CREATE INDEX idx_error_logs_status ON error_logs(status_code)",
            "CREATE INDEX idx_error_logs_path ON error_logs(path)"
        ]
    });
    
    app.save(collection);
    
    // Also add alert_email to settings if not exists
    const settings = app.findCollectionByNameOrId("settings");
    if (settings) {
        const alertEmailField = {
            name: "alert_email",
            type: "email",
            required: false
        };
        
        // Check if field already exists
        const existingField = settings.fields.find(f => f.name === "alert_email");
        if (!existingField) {
            settings.fields.push(alertEmailField);
            app.save(settings);
        }
    }
    
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("error_logs");
        if (collection) {
            app.delete(collection);
        }
    } catch (e) {}
});