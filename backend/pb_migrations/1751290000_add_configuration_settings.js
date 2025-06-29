migrate((app) => {
    const collection = app.findCollectionByNameOrId("settings");
    
    // Add configuration fields for hardcoded values
    const newFields = [
        {
            name: "default_service_fee",
            type: "number",
            required: false,
            min: 0,
            max: 9999,
            options: {
                noDecimal: false
            }
        },
        {
            name: "international_shipping_fee",
            type: "number",
            required: false,
            min: 0,
            max: 99999,
            options: {
                noDecimal: false
            }
        },
        {
            name: "free_delivery_threshold",
            type: "number",
            required: false,
            min: 0,
            max: 99999,
            options: {
                noDecimal: false
            }
        },
        {
            name: "max_order_quantity",
            type: "number",
            required: false,
            min: 1,
            max: 9999,
            options: {
                noDecimal: true
            }
        },
        {
            name: "min_order_amount",
            type: "number",
            required: false,
            min: 0,
            max: 9999,
            options: {
                noDecimal: false
            }
        },
        {
            name: "order_cancellation_hours",
            type: "number",
            required: false,
            min: 0,
            max: 168,
            options: {
                noDecimal: true
            }
        },
        {
            name: "password_min_length",
            type: "number",
            required: false,
            min: 6,
            max: 32,
            options: {
                noDecimal: true
            }
        },
        {
            name: "session_timeout_minutes",
            type: "number",
            required: false,
            min: 5,
            max: 1440,
            options: {
                noDecimal: true
            }
        },
        {
            name: "rate_limit_orders_per_minute",
            type: "number",
            required: false,
            min: 1,
            max: 100,
            options: {
                noDecimal: true
            }
        },
        {
            name: "rate_limit_auth_per_minute",
            type: "number",
            required: false,
            min: 1,
            max: 100,
            options: {
                noDecimal: true
            }
        },
        {
            name: "allowed_domains",
            type: "text",
            required: false,
            options: {
                max: 1000
            }
        },
        {
            name: "maintenance_mode",
            type: "bool",
            required: false
        },
        {
            name: "maintenance_message",
            type: "text",
            required: false,
            options: {
                max: 500
            }
        }
    ];
    
    // Get existing fields and merge with new ones
    const existingFields = collection.fields || [];
    const updatedFields = [...existingFields];
    
    newFields.forEach(newField => {
        const exists = existingFields.some(f => f.name === newField.name);
        if (!exists) {
            updatedFields.push(newField);
        }
    });
    
    collection.fields = updatedFields;
    app.dao().saveCollection(collection);
    
    // Update or create default settings record
    try {
        let settingsRecord = app.dao().findFirstRecordByFilter("settings", "");
        if (!settingsRecord) {
            settingsRecord = new Record(collection);
        }
        
        // Set default values
        settingsRecord.set("default_service_fee", 50);
        settingsRecord.set("international_shipping_fee", 500);
        settingsRecord.set("free_delivery_threshold", 1000);
        settingsRecord.set("max_order_quantity", 100);
        settingsRecord.set("min_order_amount", 100);
        settingsRecord.set("order_cancellation_hours", 24);
        settingsRecord.set("password_min_length", 8);
        settingsRecord.set("session_timeout_minutes", 60);
        settingsRecord.set("rate_limit_orders_per_minute", 5);
        settingsRecord.set("rate_limit_auth_per_minute", 10);
        settingsRecord.set("allowed_domains", "sheep.land,www.sheep.land");
        settingsRecord.set("maintenance_mode", false);
        settingsRecord.set("maintenance_message", "نعتذر، الموقع تحت الصيانة حالياً. سنعود قريباً.");
        
        app.dao().saveRecord(settingsRecord);
        console.log("Configuration settings added successfully");
    } catch (e) {
        console.error("Error updating settings:", e);
    }
    
}, (app) => {
    // Rollback - remove added fields
    const collection = app.findCollectionByNameOrId("settings");
    const fieldsToRemove = [
        "default_service_fee",
        "international_shipping_fee",
        "free_delivery_threshold",
        "max_order_quantity",
        "min_order_amount",
        "order_cancellation_hours",
        "password_min_length",
        "session_timeout_minutes",
        "rate_limit_orders_per_minute",
        "rate_limit_auth_per_minute",
        "allowed_domains",
        "maintenance_mode",
        "maintenance_message"
    ];
    
    collection.fields = collection.fields.filter(f => !fieldsToRemove.includes(f.name));
    app.dao().saveCollection(collection);
});