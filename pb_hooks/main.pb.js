/// <reference path="../pb_data/types.d.ts" />

$app.onRecordBeforeCreateRequest("orders", (e) => {
    const record = e.record;
    const dao = $app.dao();

    console.log(`[OrderHook START] Client-suggested ID: ${record.getString("order_id_text")}`);

    const productID = record.getString("product_id");
    console.log(`[OrderHook] Product ID from client: ${productID}`);
    if (!productID) {
        throw new Error("product_id is required from the client.");
    }

    let product;
    try {
        product = dao.findRecordById("products", productID);
    } catch (err) {
        console.error(`[OrderHook] CRITICAL: Product with ID ${productID} not found: ${err}`);
        throw new Error(`Product with ID ${productID} not found. Ensure it's a valid product variant ID.`);
    }

    if (!product.getBool("is_active")) {
        console.error(`[OrderHook] CRITICAL: Product ${product.getString("item_key")} (ID: ${productID}) is not active.`);
        throw new Error(`Product ${product.getString("item_key")} (ID: ${productID}) is not active.`);
    }

    const currentStock = product.getInt("stock_available_pb");
    console.log(`[OrderHook] Product ${product.getString("item_key")} current stock: ${currentStock}`);
    if (currentStock <= 0) {
        console.error(`[OrderHook] CRITICAL: Product ${product.getString("item_key")} (ID: ${productID}) is out of stock.`);
        throw new Error(`Product ${product.getString("item_key")} (ID: ${productID}) is out of stock.`);
    }

    // Set the required fields that are missing
    const orderedProductNameEn = product.getString("variant_name_en");
    const orderedProductNameAr = product.getString("variant_name_ar");
    const orderedWeightRangeEn = product.getString("weight_range_text_en");
    const orderedWeightRangeAr = product.getString("weight_range_text_ar");
    const priceAtOrderTimeEGP = product.getFloat("base_price_egp");

    console.log(`[OrderHook] Setting product details -> nameEn: "${orderedProductNameEn}", nameAr: "${orderedProductNameAr}"`);
    
    record.set("ordered_product_name_en", orderedProductNameEn);
    record.set("ordered_product_name_ar", orderedProductNameAr);
    record.set("ordered_weight_range_en", orderedWeightRangeEn);
    record.set("ordered_weight_range_ar", orderedWeightRangeAr);
    record.set("price_at_order_time_egp", priceAtOrderTimeEGP);

    // Get settings for service fee
    let appSettings;
    try {
        appSettings = dao.findFirstRecordByFilter("settings", "id!=''");
    } catch (err) {
        console.error(`[OrderHook] CRITICAL: Failed to fetch settings: ${err}`);
        throw new Error("Failed to fetch application settings. Cannot process order.");
    }

    const defaultServiceFeeEGP = appSettings.getFloat("servFeeEGP");
    let serviceFeeAppliedEGP = 0.0;
    if (record.getString("udheya_service_option_selected") === "standard_service") {
        serviceFeeAppliedEGP = defaultServiceFeeEGP;
    }
    record.set("service_fee_applied_egp", serviceFeeAppliedEGP);

    // Calculate delivery fee
    let deliveryFeeAppliedEGP = 0.0;
    const deliveryOption = record.getString("delivery_option");
    const deliveryAreaID = record.getString("delivery_area_id");
    const deliveryAreasJSON = appSettings.get("delAreas");

    if (deliveryOption === "home_delivery_to_orderer" && deliveryAreaID) {
        if (deliveryAreasJSON && Array.isArray(deliveryAreasJSON)) {
            for (const govArea of deliveryAreasJSON) {
                if (typeof govArea === 'object' && govArea !== null) {
                    const govID = govArea.id || "";
                    if (Array.isArray(govArea.cities)) {
                        for (const city of govArea.cities) {
                            if (typeof city === 'object' && city !== null) {
                                const currentCityID = `${govID}_${city.id || ""}`;
                                if (currentCityID === deliveryAreaID) {
                                    if (typeof city.delivery_fee_egp === 'number') {
                                        deliveryFeeAppliedEGP = city.delivery_fee_egp;
                                        break;
                                    }
                                }
                            }
                        }
                    } else if (govID === deliveryAreaID) {
                        if (typeof govArea.delivery_fee_egp === 'number') {
                            deliveryFeeAppliedEGP = govArea.delivery_fee_egp;
                            break;
                        }
                    }
                }
                if (deliveryFeeAppliedEGP > 0) break;
            }
        }
    }
    record.set("delivery_fee_applied_egp", deliveryFeeAppliedEGP);

    // Calculate total
    const totalAmountDueEGP = priceAtOrderTimeEGP + serviceFeeAppliedEGP + deliveryFeeAppliedEGP;
    console.log(`[OrderHook] Calculated total: ${totalAmountDueEGP}`);
    record.set("total_amount_due_egp", totalAmountDueEGP);

    // Set sacrifice day text
    const sacrificeDayMap = {
        "day1_10_dhul_hijjah": { "en": "Day 1 of Eid (10th Dhul Hijjah)", "ar": "اليوم الأول (10 ذو الحجة)" },
        "day2_11_dhul_hijjah": { "en": "Day 2 of Eid (11th Dhul Hijjah)", "ar": "اليوم الثاني (11 ذو الحجة)" },
        "day3_12_dhul_hijjah": { "en": "Day 3 of Eid (12th Dhul Hijjah)", "ar": "اليوم الثالث (12 ذو الحجة)" },
        "day4_13_dhul_hijjah": { "en": "Day 4 of Eid (13th Dhul Hijjah)", "ar": "اليوم الرابع (13 ذو الحجة)" },
    };
    const sacDayVal = record.getString("sacrifice_day_value");
    if (sacrificeDayMap[sacDayVal]) {
        record.set("sacrifice_day_text_en", sacrificeDayMap[sacDayVal].en);
        record.set("sacrifice_day_text_ar", sacrificeDayMap[sacDayVal].ar);
    } else {
        record.set("sacrifice_day_text_en", sacDayVal);
        record.set("sacrifice_day_text_ar", sacDayVal);
    }

    // Set payment and order status
    const paymentMethod = record.getString("payment_method");
    let paymentStatusToSet = "";
    let orderStatusToSet = "";
    if (paymentMethod === "cod") {
        paymentStatusToSet = "cod_pending_confirmation";
        orderStatusToSet = "pending_confirmation";
    } else {
        paymentStatusToSet = "pending_payment";
        orderStatusToSet = "confirmed_pending_payment";
    }
    record.set("payment_status", paymentStatusToSet);
    record.set("order_status", orderStatusToSet);

    console.log(`[OrderHook] Set statuses -> payment: "${paymentStatusToSet}", order: "${orderStatusToSet}"`);

    // Set IP and User Agent if fields exist
    if (record.has("user_ip_address")) {
        record.set("user_ip_address", e.httpContext.realIp());
    }
    if (record.has("user_agent_string")) {
        record.set("user_agent_string", e.httpContext.request().header.get("User-Agent"));
    }

    // Update stock
    product.set("stock_available_pb", currentStock - 1);
    try {
        dao.saveRecord(product);
        console.log(`[OrderHook] Stock updated for ${product.getString("item_key")}`);
    } catch (err) {
        console.error(`[OrderHook] CRITICAL: Failed to update stock: ${err}`);
        throw new Error(`Failed to update product stock. Order not created.`);
    }

    console.log(`[OrderHook END] Order processing complete.`);
});

$app.onRecordAfterCreateRequest("orders", (e) => {
    const record = e.record;
    console.log(`[OrderHook AfterCreate]: Order ${record.id} (Client ID: ${record.getString("order_id_text")}) created successfully.`);
});

$app.onRecordBeforeUpdateRequest("orders", (e) => {
    const record = e.record;
    const dao = $app.dao();
    let oldStatus = "";
    
    try {
        const originalRecord = dao.findRecordById("orders", record.id);
        oldStatus = originalRecord?.getString("order_status") || "";
    } catch (findErr) {
        console.warn(`[OrderHook BeforeUpdate]: Could not find original record ${record.id} to get oldStatus. Proceeding with update.`);
    }
    
    console.log(`[OrderHook BeforeUpdate]: Processing order ${record.id} (Client ID: ${record.getString("order_id_text")}). Old status: ${oldStatus}, New status: ${record.getString("order_status")}`);

    const newStatus = record.getString("order_status");
    const paymentStatus = record.getString("payment_status");

    if ((newStatus === "cancelled_by_user" || newStatus === "cancelled_by_admin") &&
        oldStatus !== "cancelled_by_user" && oldStatus !== "cancelled_by_admin") {
        
        if (paymentStatus !== "paid_confirmed" &&
            paymentStatus !== "payment_under_review" &&
            !(paymentStatus === "cod_confirmed_pending_delivery" && oldStatus === "ready_for_fulfillment")) {
            
            const productID = record.getString("product_id");
            if (productID) {
                try {
                    const product = dao.findRecordById("products", productID);
                    const currentStock = product.getInt("stock_available_pb");
                    product.set("stock_available_pb", currentStock + 1);
                    dao.saveRecord(product);
                    console.log(`[OrderHook BeforeUpdate] Order ${record.id} cancelled. Product ${productID} stock incremented back to ${currentStock + 1}.`);
                    record.set("admin_notes", (record.getString("admin_notes") + "\nStock auto-incremented on cancellation.").trim());
                } catch (err) {
                    console.error(`[OrderHook BeforeUpdate] Failed to restock product ${productID} for cancelled order ${record.id}: ${err}`);
                    record.set("admin_notes", (record.getString("admin_notes") + `\nStock auto-increment FAILED on cancellation for product ${productID}. Error: ${err.message}`).trim());
                }
            }
        } else {
            console.log(`[OrderHook BeforeUpdate] Order ${record.id} cancelled but was paid/under review or CoD advanced. Stock NOT automatically incremented.`);
            record.set("admin_notes", (record.getString("admin_notes") + "\nOrder cancelled (paid/review/CoD advanced). Stock not auto-incremented.").trim());
        }
    }
});

console.log("JavaScript hooks for 'orders' registered with older syntax.");
