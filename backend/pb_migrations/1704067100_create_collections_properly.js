/// <reference path="../pb_data/types.d.ts" />
// Create collections properly with fields

migrate((app) => {
    console.log("Creating collections with proper fields...");
    
    // Create products collection
    const productsCollection = new Collection({
        id: "pbc_4092854851",
        type: "base",
        name: "products",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        updateRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        deleteRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        fields: [
            {
                id: "itemkey",
                name: "item_key",
                type: "text",
                required: true,
                min: 1,
                max: 100,
                pattern: "^[a-z0-9_]+$"
            },
            {
                id: "productcategory",
                name: "product_category",
                type: "select",
                required: true,
                values: [
                    "udheya",
                    "livesheep_general",
                    "meat_cuts",
                    "gathering_package",
                    "live_sheep"
                ]
            },
            {
                id: "variantnameen",
                name: "variant_name_en",
                type: "text",
                required: true,
                min: 1,
                max: 150
            },
            {
                id: "variantnamear",
                name: "variant_name_ar",
                type: "text",
                required: true,
                min: 1,
                max: 150
            },
            {
                id: "basepriceegp",
                name: "base_price_egp",
                type: "number",
                required: true,
                min: 0
            },
            {
                id: "stockavailablepb",
                name: "stock_available_pb",
                type: "number",
                required: false,
                min: 0
            },
            {
                id: "isactive",
                name: "is_active",
                type: "bool",
                required: false
            },
            {
                id: "avgweightkg",
                name: "avg_weight_kg",
                type: "number",
                required: false,
                min: 0
            }
        ]
    });
    
    app.save(productsCollection);
    console.log("✅ Products collection created with fields");
    
    // Create settings collection
    const settingsCollection = new Collection({
        id: "pbc_settings_001",
        type: "base",
        name: "settings",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: null,
        fields: [
            {
                id: "servfeeegp",
                name: "servFeeEGP",
                type: "number",
                required: false,
                min: 0
            },
            {
                id: "delareas",
                name: "delAreas",
                type: "json",
                required: false
            },
            {
                id: "paydetails",
                name: "payDetails",
                type: "json",
                required: false
            },
            {
                id: "wanumraw",
                name: "waNumRaw",
                type: "text",
                required: false,
                max: 20
            },
            {
                id: "wanumdisp",
                name: "waNumDisp",
                type: "text",
                required: false,
                max: 20
            },
            {
                id: "onlinepaymentfeeegp",
                name: "online_payment_fee_egp",
                type: "number",
                required: false,
                min: 0
            },
            {
                id: "appemailsenderaddress",
                name: "app_email_sender_address",
                type: "text",
                required: false,
                max: 100
            },
            {
                id: "appemailsendername",
                name: "app_email_sender_name",
                type: "text",
                required: false,
                max: 100
            },
            {
                id: "slaughterlocationgmapsurl",
                name: "slaughter_location_gmaps_url",
                type: "url",
                required: false
            }
        ]
    });
    
    app.save(settingsCollection);
    console.log("✅ Settings collection created with fields");
    
    // Create orders collection
    const ordersCollection = new Collection({
        id: "pbc_orders_001",
        type: "base",
        name: "orders",
        listRule: "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.is_admin = true)",
        viewRule: "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.is_admin = true)",
        createRule: "",
        updateRule: "@request.auth.is_admin = true",
        deleteRule: "@request.auth.is_admin = true",
        fields: [
            {
                id: "status",
                name: "status",
                type: "select",
                required: true,
                values: [
                    "pending",
                    "confirmed",
                    "paid",
                    "processing",
                    "delivered",
                    "cancelled"
                ]
            },
            {
                id: "customername",
                name: "customer_name",
                type: "text",
                required: true,
                min: 2,
                max: 100
            },
            {
                id: "customerphone",
                name: "customer_phone",
                type: "text",
                required: true,
                min: 10,
                max: 20
            },
            {
                id: "customeremail",
                name: "customer_email",
                type: "email",
                required: false
            },
            {
                id: "customercountry",
                name: "customer_country",
                type: "text",
                required: true,
                max: 100
            },
            {
                id: "delopt",
                name: "delivery_option",
                type: "select",
                required: true,
                values: [
                    "self_pickup_or_internal_distribution",
                    "home_delivery",
                    "farm_pickup",
                    "airport_cargo",
                    "international_shipping"
                ]
            },
            {
                id: "delcityid",
                name: "delivery_city_id",
                type: "text",
                required: false,
                max: 100
            },
            {
                id: "deladdress",
                name: "delivery_address",
                type: "text",
                required: false,
                max: 500
            },
            {
                id: "delinstr",
                name: "delivery_instructions",
                type: "text",
                required: false,
                max: 500
            },
            {
                id: "deltimeslot",
                name: "delivery_time_slot",
                type: "text",
                required: false,
                max: 50
            },
            {
                id: "paymethod",
                name: "payment_method",
                type: "select",
                required: true,
                values: [
                    "vodafone_cash",
                    "instapay",
                    "fawry",
                    "cod",
                    "online_card",
                    "mastercard",
                    "google_pay",
                    "apple_pay",
                    "bank_transfer",
                    "revolut",
                    "monzo",
                    "bitcoin",
                    "ethereum",
                    "usdt"
                ]
            },
            {
                id: "promocode",
                name: "promo_code",
                type: "text",
                required: false,
                max: 50
            },
            {
                id: "promoapplied",
                name: "promo_applied",
                type: "bool",
                required: false
            },
            {
                id: "promodiscamount",
                name: "promo_discount_amount",
                type: "number",
                required: false,
                min: 0
            },
            {
                id: "termsagreed",
                name: "terms_agreed",
                type: "bool",
                required: true
            },
            {
                id: "subtotalegp",
                name: "subtotal_egp",
                type: "number",
                required: true,
                min: 0
            },
            {
                id: "totalservfeeegp",
                name: "total_service_fee_egp",
                type: "number",
                required: true,
                min: 0
            },
            {
                id: "delfeeegp",
                name: "delivery_fee_egp",
                type: "number",
                required: true,
                min: 0
            },
            {
                id: "onlinepayfeeegp",
                name: "online_payment_fee_applied_egp",
                type: "number",
                required: true,
                min: 0
            },
            {
                id: "finaltotalegp",
                name: "final_total_egp",
                type: "number",
                required: true,
                min: 0
            },
            {
                id: "lineitems",
                name: "line_items",
                type: "json",
                required: true
            },
            {
                id: "userid",
                name: "user_id",
                type: "relation",
                required: false,
                collectionId: "_pb_users_auth_",
                cascadeDelete: false,
                maxSelect: 1
            }
        ]
    });
    
    app.save(ordersCollection);
    console.log("✅ Orders collection created with fields");
    
    // Test that fields were created
    const testCol = app.findCollectionByNameOrId("products");
    if (testCol && testCol.fields) {
        console.log(`✅ Verified: Products has ${testCol.fields.length} fields`);
    } else {
        console.log("❌ WARNING: Products fields not accessible");
    }
    
}, (app) => {
    // Delete collections in reverse order
    ["orders", "products", "settings"].forEach(name => {
        try {
            const col = app.findCollectionByNameOrId(name);
            if (col) app.delete(col);
        } catch (e) {}
    });
});