/// <reference path="../pb_data/types.d.ts" />
// Fix seed data - ensures all fields are properly populated

migrate((db) => {
    console.log("Fixing seed data...");
    
    // In PocketBase migrations, 'db' is the Dao instance
    const dao = db;
    
    // Fix settings if incomplete
    try {
        const settings = dao.findRecordsByFilter("settings", "", "", 1, 0);
        if (settings.length > 0) {
            const record = settings[0];
            
            // Check if e-commerce fields are missing
            if (!record.get("servFeeEGP") || record.get("servFeeEGP") === 0) {
                console.log("Updating incomplete settings record...");
                
                record.set("servFeeEGP", 150);
                record.set("online_payment_fee_egp", 0);
                record.set("app_email_sender_address", "orders@sheep.land");
                record.set("app_email_sender_name", "Sheep Land Egypt");
                record.set("waNumRaw", "201234567890");
                record.set("waNumDisp", "+20 123 456 7890");
                record.set("slaughter_location_gmaps_url", "https://maps.app.goo.gl/example");
                record.set("payDetails", JSON.stringify({
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
                }));
                record.set("delAreas", JSON.stringify([
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
                ]));
                
                dao.saveRecord(record);
                console.log("✅ Settings updated successfully");
            }
        }
    } catch (e) {
        console.log("Settings update error:", e);
    }
    
    // Check and fix products
    try {
        const products = dao.findRecordsByFilter("products", "", "", 100, 0);
        console.log(`Found ${products.length} products`);
        
        // If products exist but have no field data, delete and recreate
        let needsRecreate = false;
        if (products.length > 0) {
            const firstProduct = products[0];
            if (!firstProduct.get("item_key") || !firstProduct.get("variant_name_en")) {
                console.log("Products have missing field data, will recreate...");
                needsRecreate = true;
                
                // Delete all existing products
                for (const p of products) {
                    dao.deleteRecord(p);
                }
            }
        }
        
        if (products.length === 0 || needsRecreate) {
            console.log("Creating products...");
            
            const productData = [
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
                }
            ];
            
            const productsCollection = dao.findCollectionByNameOrId("products");
            let created = 0;
            
            for (const data of productData) {
                try {
                    const record = new Record(productsCollection);
                    
                    record.set("item_key", data.item_key);
                    record.set("product_category", data.product_category);
                    record.set("variant_name_en", data.variant_name_en);
                    record.set("variant_name_ar", data.variant_name_ar);
                    record.set("base_price_egp", data.base_price_egp);
                    record.set("stock_available_pb", data.stock_available_pb);
                    record.set("is_active", data.is_active);
                    record.set("avg_weight_kg", data.avg_weight_kg);
                    
                    dao.saveRecord(record);
                    created++;
                } catch (e) {
                    console.log(`Failed to create product ${data.item_key}:`, e);
                }
            }
            
            console.log(`✅ Created ${created} products`);
        }
    } catch (e) {
        console.log("Products check error:", e);
    }
    
    console.log("✅ Seed data fix completed");
    
}, (db) => {
    // No rollback needed for fix migration
    console.log("Fix migration rollback - no action needed");
});