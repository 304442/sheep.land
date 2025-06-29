// Initial database schema migration
// Replaces setup.html for database initialization

migrate((db) => {
    // Create users collection (auth type)
    const users = new Collection({
        name: "users",
        type: "auth",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != '' && @request.auth.id = id",
        createRule: "",
        updateRule: "@request.auth.id = id",
        deleteRule: "@request.auth.id = id"
    });
    
    // Create settings collection
    const settings = new Collection({
        name: "settings",
        type: "base",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: null,
        schema: [
            {
                name: "servFeeEGP",
                type: "number",
                required: false,
                options: { min: 0 }
            },
            {
                name: "delAreas",
                type: "json",
                required: false
            },
            {
                name: "payDetails", 
                type: "json",
                required: false
            },
            {
                name: "waNumRaw",
                type: "text",
                required: false,
                options: { max: 20 }
            },
            {
                name: "waNumDisp",
                type: "text", 
                required: false,
                options: { max: 20 }
            },
            {
                name: "online_payment_fee_egp",
                type: "number",
                required: false,
                options: { min: 0 }
            },
            {
                name: "app_email_sender_address",
                type: "email",
                required: false
            },
            {
                name: "app_email_sender_name",
                type: "text",
                required: false,
                options: { max: 100 }
            },
            {
                name: "slaughter_location_gmaps_url",
                type: "url",
                required: false
            }
        ]
    });

    // Create products collection
    const products = new Collection({
        name: "products",
        type: "base", 
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''", 
        deleteRule: "@request.auth.id != ''",
        schema: [
            {
                name: "item_key",
                type: "text",
                required: true,
                unique: true,
                options: {
                    min: 1,
                    max: 100,
                    pattern: "^[a-z0-9_]+$"
                }
            },
            {
                name: "product_category",
                type: "select",
                required: true,
                options: {
                    maxSelect: 1,
                    values: [
                        "udheya",
                        "livesheep_general", 
                        "meat_cuts",
                        "gathering_package",
                        "live_sheep"
                    ]
                }
            },
            {
                name: "variant_name_en",
                type: "text",
                required: true,
                options: {
                    min: 1,
                    max: 150
                }
            },
            {
                name: "variant_name_ar", 
                type: "text",
                required: true,
                options: {
                    min: 1,
                    max: 150
                }
            },
            {
                name: "base_price_egp",
                type: "number",
                required: true,
                options: { min: 0 }
            },
            {
                name: "stock_available_pb",
                type: "number",
                required: true,
                options: { min: 0 }
            },
            {
                name: "is_active",
                type: "bool",
                required: true
            },
            {
                name: "avg_weight_kg",
                type: "number", 
                required: false,
                options: { min: 0 }
            }
        ]
    });

    // Create orders collection
    const orders = new Collection({
        name: "orders",
        type: "base",
        listRule: "@request.auth.id != '' && (@request.auth.id = user || @request.auth.id = created_by)",
        viewRule: "@request.auth.id != '' && (@request.auth.id = user || @request.auth.id = created_by)", 
        createRule: "",
        updateRule: "@request.auth.id != '' && (@request.auth.id = user || @request.auth.id = created_by)",
        deleteRule: "@request.auth.id != '' && (@request.auth.id = user || @request.auth.id = created_by)",
        schema: [
            {
                name: "order_id_text",
                type: "text",
                required: true,
                unique: true,
                options: { max: 50 }
            },
            {
                name: "line_items",
                type: "json", 
                required: true
            },
            {
                name: "customer_email",
                type: "email",
                required: true
            },
            {
                name: "customer_phone",
                type: "text",
                required: true,
                options: { max: 50 }
            },
            {
                name: "customer_name",
                type: "text", 
                required: true,
                options: {
                    min: 1,
                    max: 100
                }
            },
            {
                name: "subtotal_amount_egp",
                type: "number",
                required: true,
                options: { min: 0 }
            },
            {
                name: "total_udheya_service_fee_egp",
                type: "number", 
                required: false,
                options: { min: 0 }
            },
            {
                name: "delivery_fee_applied_egp",
                type: "number",
                required: false,
                options: { min: 0 }
            },
            {
                name: "online_payment_fee_applied_egp",
                type: "number",
                required: false, 
                options: { min: 0 }
            },
            {
                name: "total_amount_due_egp",
                type: "number",
                required: true,
                options: { min: 0 }
            },
            {
                name: "delivery_option",
                type: "select",
                required: true,
                options: {
                    maxSelect: 1,
                    values: [
                        "home_delivery",
                        "pickup", 
                        "international_shipping"
                    ]
                }
            },
            {
                name: "delivery_address",
                type: "text",
                required: false,
                options: { max: 500 }
            },
            {
                name: "delivery_city_id", 
                type: "text",
                required: false,
                options: { max: 50 }
            },
            {
                name: "payment_method",
                type: "text",
                required: true,
                options: {
                    min: 1,
                    max: 50
                }
            },
            {
                name: "payment_status",
                type: "select",
                required: true,
                options: {
                    maxSelect: 1,
                    values: [
                        "pending_payment",
                        "paid_confirmed", 
                        "cod_pending_confirmation",
                        "cod_confirmed_pending_delivery",
                        "failed",
                        "refunded",
                        "pending_gateway_redirect"
                    ]
                }
            },
            {
                name: "order_status",
                type: "select",
                required: true,
                options: {
                    maxSelect: 1,
                    values: [
                        "pending_confirmation",
                        "confirmed_pending_payment",
                        "payment_confirmed_processing", 
                        "ready_for_fulfillment",
                        "out_for_delivery",
                        "fulfilled_completed",
                        "cancelled_by_user",
                        "cancelled_by_admin",
                        "awaiting_payment_gateway"
                    ]
                }
            },
            {
                name: "terms_agreed",
                type: "bool",
                required: true
            },
            {
                name: "admin_notes",
                type: "editor",
                required: false
            },
            {
                name: "user",
                type: "relation",
                required: false,
                options: {
                    collectionId: "users",
                    maxSelect: 1
                }
            }
        ]
    });

    const dao = new Dao(db);
    dao.saveCollection(users);
    dao.saveCollection(settings);
    dao.saveCollection(products);
    dao.saveCollection(orders);

}, (db) => {
    const dao = new Dao(db);
    dao.deleteCollection(dao.findCollectionByNameOrId("orders"));
    dao.deleteCollection(dao.findCollectionByNameOrId("products")); 
    dao.deleteCollection(dao.findCollectionByNameOrId("settings"));
    dao.deleteCollection(dao.findCollectionByNameOrId("users"));
});