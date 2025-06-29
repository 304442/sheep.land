/// <reference path="../pb_data/types.d.ts" />
// Seed initial data migration - replaces setup.html data initialization

migrate((db) => {
    console.log("Seeding initial data...");
    
    // Check if settings already exist
    try {
        const existingSettings = db.findRecordsByFilter("settings", "", 1, 0);
        if (existingSettings.length > 0) {
            console.log("Settings already exist, skipping seed data");
            return;
        }
    } catch (e) {
        // Settings might not exist yet
    }
    
    // Create initial settings using PocketBase API
    const settingsData = {
        "servFeeEGP": 150,
        "online_payment_fee_egp": 0,
        "app_email_sender_address": "orders@sheep.land",
        "app_email_sender_name": "Sheep Land Egypt",
        "waNumRaw": "201234567890",
        "waNumDisp": "+20 123 456 7890",
        "slaughter_location_gmaps_url": "https://maps.app.goo.gl/example",
        "payDetails": {
            "bank_name": "CIB - Commercial International Bank",
            "bank_account_name": "Sheep Land Egypt Ltd",
            "bank_account_number": "1234567890",
            "bank_iban": "EG1234567890123456789012345",
            "bank_swift": "CIBEEGCX",
            "vodafone_cash": "01234567890",
            "instapay_ipn": "sheepland@instapay",
            "paypal_email": "payments@sheep.land",
            "western_union_details": "Name: Sheep Land Egypt",
            "revolut_details": "@sheeplandegypt"
        },
        "delAreas": [
            {
                "id": "cairo",
                "name_en": "Cairo",
                "name_ar": "القاهرة",
                "cities": [
                    {
                        "id": "nasr_city",
                        "name_en": "Nasr City",
                        "name_ar": "مدينة نصر",
                        "delivery_fee_egp": 50
                    },
                    {
                        "id": "new_cairo",
                        "name_en": "New Cairo",
                        "name_ar": "القاهرة الجديدة",
                        "delivery_fee_egp": 75
                    },
                    {
                        "id": "maadi",
                        "name_en": "Maadi",
                        "name_ar": "المعادي",
                        "delivery_fee_egp": 60
                    },
                    {
                        "id": "heliopolis",
                        "name_en": "Heliopolis",
                        "name_ar": "مصر الجديدة",
                        "delivery_fee_egp": 50
                    }
                ]
            },
            {
                "id": "giza",
                "name_en": "Giza",
                "name_ar": "الجيزة",
                "cities": [
                    {
                        "id": "6_october",
                        "name_en": "6th of October",
                        "name_ar": "6 أكتوبر",
                        "delivery_fee_egp": 100
                    },
                    {
                        "id": "sheikh_zayed",
                        "name_en": "Sheikh Zayed",
                        "name_ar": "الشيخ زايد",
                        "delivery_fee_egp": 120
                    },
                    {
                        "id": "mohandessin",
                        "name_en": "Mohandessin",
                        "name_ar": "المهندسين",
                        "delivery_fee_egp": 60
                    }
                ]
            },
            {
                "id": "alexandria",
                "name_en": "Alexandria",
                "name_ar": "الإسكندرية",
                "delivery_fee_egp": 200
            }
        ]
    };
    
    // Create settings record using PocketBase API
    try {
        const settingsCollection = db.findCollectionByNameOrId("settings");
        const record = new Record(settingsCollection);
        
        // Set each field explicitly
        record.set("servFeeEGP", settingsData.servFeeEGP);
        record.set("online_payment_fee_egp", settingsData.online_payment_fee_egp);
        record.set("app_email_sender_address", settingsData.app_email_sender_address);
        record.set("app_email_sender_name", settingsData.app_email_sender_name);
        record.set("waNumRaw", settingsData.waNumRaw);
        record.set("waNumDisp", settingsData.waNumDisp);
        record.set("slaughter_location_gmaps_url", settingsData.slaughter_location_gmaps_url);
        record.set("payDetails", settingsData.payDetails);
        record.set("delAreas", settingsData.delAreas);
        
        db.save(record);
        console.log("✅ Settings created");
    } catch (e) {
        console.log("❌ Failed to create settings:", e.message);
    }
    
    // Create initial products
    const products = [
        // Udheya products
        {
            "item_key": "udheya_standard",
            "product_category": "udheya",
            "variant_name_en": "Standard Udheya",
            "variant_name_ar": "أضحية عادية",
            "base_price_egp": 6500,
            "stock_available_pb": 50,
            "is_active": true,
            "avg_weight_kg": 45
        },
        {
            "item_key": "udheya_premium",
            "product_category": "udheya",
            "variant_name_en": "Premium Udheya",
            "variant_name_ar": "أضحية ممتازة",
            "base_price_egp": 8500,
            "stock_available_pb": 30,
            "is_active": true,
            "avg_weight_kg": 55
        },
        
        // Live sheep products
        {
            "item_key": "live_sheep_small",
            "product_category": "live_sheep",
            "variant_name_en": "Small Live Sheep (30-40kg)",
            "variant_name_ar": "خروف حي صغير (30-40 كجم)",
            "base_price_egp": 5000,
            "stock_available_pb": 20,
            "is_active": true,
            "avg_weight_kg": 35
        },
        {
            "item_key": "live_sheep_medium",
            "product_category": "live_sheep",
            "variant_name_en": "Medium Live Sheep (40-50kg)",
            "variant_name_ar": "خروف حي متوسط (40-50 كجم)",
            "base_price_egp": 6500,
            "stock_available_pb": 25,
            "is_active": true,
            "avg_weight_kg": 45
        },
        {
            "item_key": "live_sheep_large",
            "product_category": "live_sheep",
            "variant_name_en": "Large Live Sheep (50-60kg)",
            "variant_name_ar": "خروف حي كبير (50-60 كجم)",
            "base_price_egp": 8000,
            "stock_available_pb": 15,
            "is_active": true,
            "avg_weight_kg": 55
        },
        
        // Meat products
        {
            "item_key": "meat_whole_carcass",
            "product_category": "meat_cuts",
            "variant_name_en": "Whole Carcass (Processed)",
            "variant_name_ar": "ذبيحة كاملة (مجهزة)",
            "base_price_egp": 5500,
            "stock_available_pb": 10,
            "is_active": true,
            "avg_weight_kg": 25
        },
        {
            "item_key": "meat_half_carcass",
            "product_category": "meat_cuts",
            "variant_name_en": "Half Carcass",
            "variant_name_ar": "نصف ذبيحة",
            "base_price_egp": 2800,
            "stock_available_pb": 20,
            "is_active": true,
            "avg_weight_kg": 12.5
        },
        {
            "item_key": "meat_leg_pack",
            "product_category": "meat_cuts",
            "variant_name_en": "Leg Pack (4 pieces)",
            "variant_name_ar": "فخذ (4 قطع)",
            "base_price_egp": 1500,
            "stock_available_pb": 30,
            "is_active": true,
            "avg_weight_kg": 5
        },
        {
            "item_key": "meat_chops_pack",
            "product_category": "meat_cuts",
            "variant_name_en": "Chops Pack (2kg)",
            "variant_name_ar": "ريش (2 كجم)",
            "base_price_egp": 400,
            "stock_available_pb": 40,
            "is_active": true,
            "avg_weight_kg": 2
        },
        {
            "item_key": "meat_ground_pack",
            "product_category": "meat_cuts",
            "variant_name_en": "Ground Meat (1kg)",
            "variant_name_ar": "لحم مفروم (1 كجم)",
            "base_price_egp": 180,
            "stock_available_pb": 50,
            "is_active": true,
            "avg_weight_kg": 1
        },
        
        // Catering products
        {
            "item_key": "catering_small_gathering",
            "product_category": "gathering_package",
            "variant_name_en": "Small Gathering Package (10-15 people)",
            "variant_name_ar": "باقة تجمع صغير (10-15 شخص)",
            "base_price_egp": 3500,
            "stock_available_pb": 5,
            "is_active": true,
            "avg_weight_kg": 15
        },
        {
            "item_key": "catering_medium_gathering",
            "product_category": "gathering_package",
            "variant_name_en": "Medium Gathering Package (20-25 people)",
            "variant_name_ar": "باقة تجمع متوسط (20-25 شخص)",
            "base_price_egp": 6500,
            "stock_available_pb": 3,
            "is_active": true,
            "avg_weight_kg": 25
        },
        {
            "item_key": "catering_large_gathering",
            "product_category": "gathering_package",
            "variant_name_en": "Large Gathering Package (30-40 people)",
            "variant_name_ar": "باقة تجمع كبير (30-40 شخص)",
            "base_price_egp": 10000,
            "stock_available_pb": 2,
            "is_active": true,
            "avg_weight_kg": 40
        }
    ];
    
    // Insert products using PocketBase API
    const productsCollection = db.findCollectionByNameOrId("products");
    let successCount = 0;
    
    products.forEach((product) => {
        try {
            const record = new Record(productsCollection);
            
            record.set("item_key", product.item_key);
            record.set("product_category", product.product_category);
            record.set("variant_name_en", product.variant_name_en);
            record.set("variant_name_ar", product.variant_name_ar);
            record.set("base_price_egp", product.base_price_egp);
            record.set("stock_available_pb", product.stock_available_pb);
            record.set("is_active", product.is_active);
            record.set("avg_weight_kg", product.avg_weight_kg || 0);
            
            db.save(record);
            successCount++;
        } catch (e) {
            console.log(`❌ Failed to create product ${product.item_key}:`, e.message);
        }
    });
    
    console.log(`✅ Created ${successCount} products`);
    
    // Create a test user (optional - for development)
    if (db.isDev) {
        try {
            const usersCollection = db.findCollectionByNameOrId("users");
            const record = new Record(usersCollection);
            
            record.set("email", "test@sheep.land");
            record.set("username", "testuser");
            record.set("emailVisibility", true);
            record.set("verified", true);
            // Note: Password needs to be set through setPassword() method
            record.setPassword("test12345");
            
            db.save(record);
            console.log("✅ Created test user (test@sheep.land) with password: test12345");
        } catch (e) {
            console.log("⚠️ Test user creation skipped:", e.message);
        }
    }
    
    console.log("✅ Seed data migration completed successfully");
    
}, (db) => {
    // Rollback: Remove seeded data
    console.log("Rolling back seed data...");
    
    try {
        // Delete all products
        const products = db.findRecordsByFilter("products", "", "", 1000, 0);
        products.forEach(record => {
            db.delete(record);
        });
        
        // Delete settings
        const settings = db.findRecordsByFilter("settings", "", "", 100, 0);
        settings.forEach(record => {
            db.delete(record);
        });
        
        // Delete test user if exists
        try {
            const testUser = db.findFirstRecordByFilter("users", "email = 'test@sheep.land'");
            if (testUser) {
                db.delete(testUser);
            }
        } catch (e) {
            // User might not exist
        }
        
        console.log("✅ Seed data rolled back");
    } catch (e) {
        console.log("⚠️ Rollback error:", e.message);
    }
});