/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    // db is actually the app instance in migrations
    
    // Create collections using the Collections import from core
    const collections = [
        {
            "id": "_pb_users_auth_",
            "name": "users",
            "type": "auth",
            "system": false,
            "schema": [],
            "indexes": [],
            "listRule": "@request.auth.id != ''",
            "viewRule": "@request.auth.id != '' && @request.auth.id = id",
            "createRule": "",
            "updateRule": "@request.auth.id = id",
            "deleteRule": "@request.auth.id = id",
            "options": {
                "allowEmailAuth": true,
                "allowOAuth2Auth": true,
                "allowUsernameAuth": true,
                "exceptEmailDomains": null,
                "manageRule": null,
                "minPasswordLength": 8,
                "onlyEmailDomains": null,
                "requireEmail": false
            }
        },
        {
            "id": "",
            "name": "settings",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "id": "servfeeegp",
                    "name": "servFeeEGP",
                    "type": "number",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": 0,
                        "max": null
                    }
                },
                {
                    "id": "delareas",
                    "name": "delAreas",
                    "type": "json",
                    "system": false,
                    "required": false,
                    "options": {}
                },
                {
                    "id": "paydetails",
                    "name": "payDetails",
                    "type": "json",
                    "system": false,
                    "required": false,
                    "options": {}
                },
                {
                    "id": "wanumraw",
                    "name": "waNumRaw",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 20,
                        "pattern": ""
                    }
                },
                {
                    "id": "wanumdisp",
                    "name": "waNumDisp",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 20,
                        "pattern": ""
                    }
                },
                {
                    "id": "onlinepaymentfeeegp",
                    "name": "online_payment_fee_egp",
                    "type": "number",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": 0,
                        "max": null
                    }
                },
                {
                    "id": "appemailsenderaddress",
                    "name": "app_email_sender_address",
                    "type": "email",
                    "system": false,
                    "required": false,
                    "options": {
                        "exceptDomains": null,
                        "onlyDomains": null
                    }
                },
                {
                    "id": "appemailsendername",
                    "name": "app_email_sender_name",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 100,
                        "pattern": ""
                    }
                },
                {
                    "id": "slaughterlocationgmapsurl",
                    "name": "slaughter_location_gmaps_url",
                    "type": "url",
                    "system": false,
                    "required": false,
                    "options": {
                        "exceptDomains": null,
                        "onlyDomains": null
                    }
                }
            ],
            "indexes": [],
            "listRule": "",
            "viewRule": "",
            "createRule": "@request.auth.id != ''",
            "updateRule": "@request.auth.id != ''",
            "deleteRule": null,
            "options": {}
        },
        {
            "id": "",
            "name": "products",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "id": "itemkey",
                    "name": "item_key",
                    "type": "text",
                    "system": false,
                    "required": true,
                    "options": {
                        "min": 1,
                        "max": 100,
                        "pattern": "^[a-z0-9_]+$"
                    }
                },
                {
                    "id": "productcategory",
                    "name": "product_category",
                    "type": "select",
                    "system": false,
                    "required": true,
                    "options": {
                        "maxSelect": 1,
                        "values": [
                            "udheya",
                            "livesheep_general",
                            "meat_cuts",
                            "gathering_package",
                            "live_sheep"
                        ]
                    }
                },
                {
                    "id": "variantnameen",
                    "name": "variant_name_en",
                    "type": "text",
                    "system": false,
                    "required": true,
                    "options": {
                        "min": 1,
                        "max": 150,
                        "pattern": ""
                    }
                },
                {
                    "id": "variantnamear",
                    "name": "variant_name_ar",
                    "type": "text",
                    "system": false,
                    "required": true,
                    "options": {
                        "min": 1,
                        "max": 150,
                        "pattern": ""
                    }
                },
                {
                    "id": "basepriceegp",
                    "name": "base_price_egp",
                    "type": "number",
                    "system": false,
                    "required": true,
                    "options": {
                        "min": 0,
                        "max": null
                    }
                },
                {
                    "id": "stockavailablepb",
                    "name": "stock_available_pb",
                    "type": "number",
                    "system": false,
                    "required": true,
                    "options": {
                        "min": 0,
                        "max": null
                    }
                },
                {
                    "id": "isactive",
                    "name": "is_active",
                    "type": "bool",
                    "system": false,
                    "required": true,
                    "options": {}
                },
                {
                    "id": "avgweightkg",
                    "name": "avg_weight_kg",
                    "type": "number",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": 0,
                        "max": null
                    }
                }
            ],
            "indexes": [],
            "listRule": "",
            "viewRule": "",
            "createRule": "@request.auth.id != ''",
            "updateRule": "@request.auth.id != ''",
            "deleteRule": "@request.auth.id != ''",
            "options": {}
        },
        {
            "id": "",
            "name": "orders",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "id": "orderidtext",
                    "name": "order_id_text",
                    "type": "text",
                    "system": false,
                    "required": true,
                    "options": {
                        "min": null,
                        "max": 50,
                        "pattern": ""
                    }
                },
                {
                    "id": "lineitems",
                    "name": "line_items",
                    "type": "json",
                    "system": false,
                    "required": true,
                    "options": {}
                },
                {
                    "id": "customeremail",
                    "name": "customer_email",
                    "type": "email",
                    "system": false,
                    "required": true,
                    "options": {
                        "exceptDomains": null,
                        "onlyDomains": null
                    }
                },
                {
                    "id": "customerphone",
                    "name": "customer_phone",
                    "type": "text",
                    "system": false,
                    "required": true,
                    "options": {
                        "min": null,
                        "max": 50,
                        "pattern": ""
                    }
                },
                {
                    "id": "customername",
                    "name": "customer_name",
                    "type": "text",
                    "system": false,
                    "required": true,
                    "options": {
                        "min": 1,
                        "max": 100,
                        "pattern": ""
                    }
                },
                {
                    "id": "customercountry",
                    "name": "customer_country",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 50,
                        "pattern": ""
                    }
                },
                {
                    "id": "subtotalamountegp",
                    "name": "subtotal_amount_egp",
                    "type": "number",
                    "system": false,
                    "required": true,
                    "options": {
                        "min": 0,
                        "max": null
                    }
                },
                {
                    "id": "totaludheyaservicefeeegp",
                    "name": "total_udheya_service_fee_egp",
                    "type": "number",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": 0,
                        "max": null
                    }
                },
                {
                    "id": "deliveryfeeappliedegp",
                    "name": "delivery_fee_applied_egp",
                    "type": "number",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": 0,
                        "max": null
                    }
                },
                {
                    "id": "internationalshippingfeeegp",
                    "name": "international_shipping_fee_egp",
                    "type": "number",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": 0,
                        "max": null
                    }
                },
                {
                    "id": "onlinepaymentfeeappliedegp",
                    "name": "online_payment_fee_applied_egp",
                    "type": "number",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": 0,
                        "max": null
                    }
                },
                {
                    "id": "totalamountdueegp",
                    "name": "total_amount_due_egp",
                    "type": "number",
                    "system": false,
                    "required": true,
                    "options": {
                        "min": 0,
                        "max": null
                    }
                },
                {
                    "id": "deliveryoption",
                    "name": "delivery_option",
                    "type": "select",
                    "system": false,
                    "required": true,
                    "options": {
                        "maxSelect": 1,
                        "values": [
                            "home_delivery",
                            "pickup",
                            "international_shipping"
                        ]
                    }
                },
                {
                    "id": "deliveryaddress",
                    "name": "delivery_address",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 500,
                        "pattern": ""
                    }
                },
                {
                    "id": "deliverycityid",
                    "name": "delivery_city_id",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 50,
                        "pattern": ""
                    }
                },
                {
                    "id": "deliveryareanameen",
                    "name": "delivery_area_name_en",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 200,
                        "pattern": ""
                    }
                },
                {
                    "id": "deliveryareanamear",
                    "name": "delivery_area_name_ar",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 200,
                        "pattern": ""
                    }
                },
                {
                    "id": "deliveryinstructions",
                    "name": "delivery_instructions",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 500,
                        "pattern": ""
                    }
                },
                {
                    "id": "deliverytimeslot",
                    "name": "delivery_time_slot",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 100,
                        "pattern": ""
                    }
                },
                {
                    "id": "paymentmethod",
                    "name": "payment_method",
                    "type": "text",
                    "system": false,
                    "required": true,
                    "options": {
                        "min": 1,
                        "max": 50,
                        "pattern": ""
                    }
                },
                {
                    "id": "paymentstatus",
                    "name": "payment_status",
                    "type": "select",
                    "system": false,
                    "required": true,
                    "options": {
                        "maxSelect": 1,
                        "values": [
                            "pending_payment",
                            "paid_confirmed",
                            "cod_pending_confirmation",
                            "cod_confirmed_awaiting_delivery",
                            "cod_delivered_paid",
                            "failed",
                            "refunded",
                            "pending_gateway_redirect"
                        ]
                    }
                },
                {
                    "id": "orderstatus",
                    "name": "order_status",
                    "type": "select",
                    "system": false,
                    "required": true,
                    "options": {
                        "maxSelect": 1,
                        "values": [
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
                    "id": "termsagreed",
                    "name": "terms_agreed",
                    "type": "bool",
                    "system": false,
                    "required": true,
                    "options": {}
                },
                {
                    "id": "adminnotes",
                    "name": "admin_notes",
                    "type": "editor",
                    "system": false,
                    "required": false,
                    "options": {}
                },
                {
                    "id": "user",
                    "name": "user",
                    "type": "relation",
                    "system": false,
                    "required": false,
                    "options": {
                        "collectionId": "_pb_users_auth_",
                        "cascadeDelete": false,
                        "minSelect": null,
                        "maxSelect": 1,
                        "displayFields": []
                    }
                },
                {
                    "id": "useripaddress",
                    "name": "user_ip_address",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 45,
                        "pattern": ""
                    }
                },
                {
                    "id": "useragentstring",
                    "name": "user_agent_string",
                    "type": "text",
                    "system": false,
                    "required": false,
                    "options": {
                        "min": null,
                        "max": 500,
                        "pattern": ""
                    }
                }
            ],
            "indexes": [],
            "listRule": null,
            "viewRule": null,
            "createRule": "",
            "updateRule": "@request.auth.is_admin = true",
            "deleteRule": "@request.auth.is_admin = true",
            "options": {}
        }
    ];

    const jsonData = JSON.stringify(collections);
    const collections_import = db.importCollectionsByMarshaledJSON(jsonData);
    return collections_import;

}, (db) => {
    // Delete collections in reverse order
    const collections = ["orders", "products", "settings", "users"];
    
    for (const collectionName of collections) {
        try {
            const collection = db.findCollectionByNameOrId(collectionName);
            if (collection) {
                db.deleteCollection(collection);
            }
        } catch (e) {
            // Collection might not exist, ignore error
        }
    }
});