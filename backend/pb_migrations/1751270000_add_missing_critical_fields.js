/// <reference path="../pb_data/types.d.ts" />
// Add critical missing fields to collections

migrate((app) => {
    console.log("Adding critical missing fields...");
    
    // 1. Add image fields to products
    const productsCollection = app.findCollectionByNameOrId("products");
    const productImageField = new FileField({
        id: "productimages",
        name: "product_images",
        required: false,
        maxSelect: 5,
        maxSize: 5242880, // 5MB
        mimeTypes: ["image/jpeg", "image/png", "image/webp"]
    });
    productsCollection.fields.add(productImageField);
    app.save(productsCollection);
    console.log("✅ Added product_images field");
    
    // 2. Add promo codes collection
    const promoCodesCollection = new Collection({
        id: "promo_codes_001",
        type: "base",
        name: "promo_codes",
        listRule: "@request.auth.is_admin = true",
        viewRule: "@request.auth.is_admin = true",
        createRule: "@request.auth.is_admin = true",
        updateRule: "@request.auth.is_admin = true",
        deleteRule: "@request.auth.is_admin = true",
        fields: [
            {
                name: "code",
                type: "text",
                required: true,
                unique: true,
                min: 3,
                max: 20,
                pattern: "^[A-Z0-9]+$"
            },
            {
                name: "discount_type",
                type: "select",
                required: true,
                values: ["percentage", "fixed_amount"]
            },
            {
                name: "discount_value",
                type: "number",
                required: true,
                min: 0
            },
            {
                name: "min_order_amount",
                type: "number",
                required: false,
                min: 0
            },
            {
                name: "max_uses",
                type: "number",
                required: false,
                min: 0
            },
            {
                name: "used_count",
                type: "number",
                required: false,
                min: 0
            },
            {
                name: "valid_from",
                type: "date",
                required: true
            },
            {
                name: "valid_until",
                type: "date",
                required: true
            },
            {
                name: "is_active",
                type: "bool",
                required: false
            },
            {
                name: "applicable_categories",
                type: "select",
                required: false,
                maxSelect: 4,
                values: ["udheya", "live_sheep", "meat_cuts", "gathering_package"]
            }
        ]
    });
    app.save(promoCodesCollection);
    console.log("✅ Created promo_codes collection");
    
    // 3. Add delivery tracking fields to orders
    const ordersCollection = app.findCollectionByNameOrId("orders");
    
    const trackingNumberField = new TextField({
        id: "trackingnumber",
        name: "tracking_number",
        required: false,
        max: 100
    });
    ordersCollection.fields.add(trackingNumberField);
    
    const deliveryPartnerField = new SelectField({
        id: "deliverypartner",
        name: "delivery_partner",
        required: false,
        values: ["internal", "aramex", "fedex", "dhl", "other"]
    });
    ordersCollection.fields.add(deliveryPartnerField);
    
    const estimatedDeliveryField = new DateField({
        id: "estimateddelivery",
        name: "estimated_delivery_date",
        required: false
    });
    ordersCollection.fields.add(estimatedDeliveryField);
    
    const deliveryNotesField = new TextField({
        id: "deliverynotes",
        name: "delivery_notes",
        required: false,
        max: 500
    });
    ordersCollection.fields.add(deliveryNotesField);
    
    app.save(ordersCollection);
    console.log("✅ Added delivery tracking fields to orders");
    
    // 4. Add email templates collection
    const emailTemplatesCollection = new Collection({
        id: "email_templates_001",
        type: "base",
        name: "email_templates",
        listRule: "@request.auth.is_admin = true",
        viewRule: "@request.auth.is_admin = true",
        createRule: "@request.auth.is_admin = true",
        updateRule: "@request.auth.is_admin = true",
        deleteRule: "@request.auth.is_admin = true",
        fields: [
            {
                name: "template_key",
                type: "text",
                required: true,
                unique: true,
                max: 50
            },
            {
                name: "template_name",
                type: "text",
                required: true,
                max: 100
            },
            {
                name: "subject_en",
                type: "text",
                required: true,
                max: 200
            },
            {
                name: "subject_ar",
                type: "text",
                required: true,
                max: 200
            },
            {
                name: "body_en",
                type: "editor",
                required: true
            },
            {
                name: "body_ar",
                type: "editor",
                required: true
            },
            {
                name: "variables",
                type: "json",
                required: false
            },
            {
                name: "is_active",
                type: "bool",
                required: false
            }
        ]
    });
    app.save(emailTemplatesCollection);
    console.log("✅ Created email_templates collection");
    
    // 5. Add audit logs collection
    const auditLogsCollection = new Collection({
        id: "audit_logs_001",
        type: "base",
        name: "audit_logs",
        listRule: "@request.auth.is_admin = true",
        viewRule: "@request.auth.is_admin = true",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
            {
                name: "user_id",
                type: "relation",
                required: false,
                collectionId: "_pb_users_auth_",
                cascadeDelete: false,
                maxSelect: 1
            },
            {
                name: "action",
                type: "text",
                required: true,
                max: 100
            },
            {
                name: "entity_type",
                type: "text",
                required: true,
                max: 50
            },
            {
                name: "entity_id",
                type: "text",
                required: false,
                max: 50
            },
            {
                name: "old_data",
                type: "json",
                required: false
            },
            {
                name: "new_data",
                type: "json",
                required: false
            },
            {
                name: "ip_address",
                type: "text",
                required: false,
                max: 45
            },
            {
                name: "user_agent",
                type: "text",
                required: false,
                max: 500
            }
        ]
    });
    app.save(auditLogsCollection);
    console.log("✅ Created audit_logs collection");
    
    // 6. Add language preference to users
    const usersCollection = app.findCollectionByNameOrId("users");
    const languageField = new SelectField({
        id: "language",
        name: "preferred_language",
        required: false,
        values: ["en", "ar"]
    });
    usersCollection.fields.add(languageField);
    app.save(usersCollection);
    console.log("✅ Added preferred_language field to users");
    
    // 7. Add SMTP settings fields to settings
    const settingsCollection = app.findCollectionByNameOrId("settings");
    
    const smtpFields = [
        { name: "smtp_host", type: "text", max: 100 },
        { name: "smtp_port", type: "number", min: 1, max: 65535 },
        { name: "smtp_username", type: "text", max: 100 },
        { name: "smtp_password", type: "text", max: 100 },
        { name: "smtp_from_address", type: "email" },
        { name: "smtp_from_name", type: "text", max: 100 },
        { name: "smtp_use_tls", type: "bool" }
    ];
    
    smtpFields.forEach(config => {
        let field;
        switch(config.type) {
            case "text":
                field = new TextField({
                    id: config.name.replace(/_/g, ''),
                    name: config.name,
                    required: false,
                    max: config.max || 100
                });
                break;
            case "number":
                field = new NumberField({
                    id: config.name.replace(/_/g, ''),
                    name: config.name,
                    required: false,
                    min: config.min,
                    max: config.max
                });
                break;
            case "email":
                field = new EmailField({
                    id: config.name.replace(/_/g, ''),
                    name: config.name,
                    required: false
                });
                break;
            case "bool":
                field = new BoolField({
                    id: config.name.replace(/_/g, ''),
                    name: config.name,
                    required: false
                });
                break;
        }
        settingsCollection.fields.add(field);
    });
    
    app.save(settingsCollection);
    console.log("✅ Added SMTP configuration fields to settings");
    
    console.log("✅ All critical fields and collections added successfully");
    
}, (app) => {
    // Rollback
    try {
        // Remove collections
        ["promo_codes", "email_templates", "audit_logs"].forEach(name => {
            const col = app.findCollectionByNameOrId(name);
            if (col) app.delete(col);
        });
        
        // Remove fields
        const products = app.findCollectionByNameOrId("products");
        if (products) {
            products.fields.removeByName("product_images");
            app.save(products);
        }
        
        const orders = app.findCollectionByNameOrId("orders");
        if (orders) {
            ["tracking_number", "delivery_partner", "estimated_delivery_date", "delivery_notes"].forEach(field => {
                orders.fields.removeByName(field);
            });
            app.save(orders);
        }
        
        const users = app.findCollectionByNameOrId("users");
        if (users) {
            users.fields.removeByName("preferred_language");
            app.save(users);
        }
        
        const settings = app.findCollectionByNameOrId("settings");
        if (settings) {
            ["smtp_host", "smtp_port", "smtp_username", "smtp_password", "smtp_from_address", "smtp_from_name", "smtp_use_tls"].forEach(field => {
                settings.fields.removeByName(field);
            });
            app.save(settings);
        }
    } catch (e) {}
});