/// <reference path="../pb_data/types.d.ts" />

/**
 * HOOK: Before an 'orders' record is created
 *
 * This hook handles:
 * 1. Validating basic inputs.
 * 2. Fetching authoritative product data (name, price, stock).
 * 3. Fetching application settings (service fees, delivery areas).
 * 4. Calculating service fees, delivery fees, and total order amount.
 * 5. Populating derived fields on the order record.
 * 6. Atomically decrementing product stock.
 * 7. Logging important actions.
 */
onRecordBeforeCreateRequest((e) => {
    const record = e.record; // The new 'orders' record being created
    const dao = $app.dao();   // Data Access Object

    console.log(`[OrderHook] BeforeCreate: Processing order ID (client-suggested): ${record.getString("order_id_text")}`);

    // --- 1. Get Product ID from client request ---
    const productID = record.getString("product_id"); // This is the PocketBase ID of the product variant
    if (!productID) {
        throw new Error("product_id is required from the client.");
    }

    // --- 2. Fetch Authoritative Product Data & Validate Stock ---
    let product;
    try {
        product = dao.findRecordById("products", productID);
    } catch (err) {
        console.error(`[OrderHook] Product with ID ${productID} not found: ${err}`);
        throw new Error(`Product with ID ${productID} not found. Please ensure it's a valid product variant ID.`);
    }

    if (!product.getBool("is_active")) {
        throw new Error(`Product ${product.getString("item_key")} (ID: ${productID}) is not active.`);
    }
    const currentStock = product.getInt("stock_available_pb");
    if (currentStock <= 0) {
        throw new Error(`Product ${product.getString("item_key")} (ID: ${productID}) is out of stock.`);
    }

    // --- 3. Populate Order Record with Authoritative Product Data ---
    record.set("ordered_product_name_en", product.getString("variant_name_en"));
    record.set("ordered_product_name_ar", product.getString("variant_name_ar"));
    record.set("ordered_weight_range_en", product.getString("weight_range_text_en"));
    record.set("ordered_weight_range_ar", product.getString("weight_range_text_ar"));
    const priceAtOrderTimeEGP = product.getFloat("base_price_egp");
    record.set("price_at_order_time_egp", priceAtOrderTimeEGP);
    // record.set("cost_of_animal_egp", product.getFloat("acquisition_cost_egp")); // If you track this on product

    // --- 4. Fetch Settings ---
    let appSettings;
    try {
        appSettings = dao.findFirstRecordByFilter("settings", "id!=''"); // Assuming only one settings doc
    } catch (err) {
        console.error(`[OrderHook] Failed to fetch settings: ${err}`);
        throw new Error("Failed to fetch application settings. Cannot process order.");
    }
    const defaultServiceFeeEGP = appSettings.getFloat("servFeeEGP");
    const deliveryAreasJSON = appSettings.get("delAreas"); // This is a JSON array from PB

    // --- 5. Calculate Fees ---
    let serviceFeeAppliedEGP = 0.0;
    if (record.getString("udheya_service_option_selected") === "standard_service") {
        serviceFeeAppliedEGP = defaultServiceFeeEGP;
    }
    record.set("service_fee_applied_egp", serviceFeeAppliedEGP);

    let deliveryFeeAppliedEGP = 0.0;
    const deliveryOption = record.getString("delivery_option"); // Set by client based on logic
    const deliveryAreaID = record.getString("delivery_area_id");

    if (deliveryOption === "home_delivery_to_orderer" && deliveryAreaID) {
        if (deliveryAreasJSON && Array.isArray(deliveryAreasJSON)) {
            for (const govArea of deliveryAreasJSON) {
                if (typeof govArea === 'object' && govArea !== null) {
                    const govID = govArea.id || "";
                    if (Array.isArray(govArea.cities)) {
                        for (const city of govArea.cities) {
                            if (typeof city === 'object' && city !== null) {
                                const currentCityID = `${govID}_${city.id || ""}`; // Assuming combined ID format
                                if (currentCityID === deliveryAreaID) {
                                    if (typeof city.delivery_fee_egp === 'number') {
                                        deliveryFeeAppliedEGP = city.delivery_fee_egp;
                                        break;
                                    }
                                }
                            }
                        }
                    } else if (govID === deliveryAreaID) { // Top-level governorate/area fee
                         if (typeof govArea.delivery_fee_egp === 'number') {
                            deliveryFeeAppliedEGP = govArea.delivery_fee_egp;
                            break;
                        }
                    }
                }
                if (deliveryFeeAppliedEGP > 0) {
                    break;
                }
            }
        }
    }
    record.set("delivery_fee_applied_egp", deliveryFeeAppliedEGP);

    const totalAmountDueEGP = priceAtOrderTimeEGP + serviceFeeAppliedEGP + deliveryFeeAppliedEGP;
    record.set("total_amount_due_egp", totalAmountDueEGP);

    // --- 6. Set Derived Fields ---
    // Sacrifice day mappings (could be stored in settings too for more flexibility)
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
        record.set("sacrifice_day_text_en", sacDayVal); // Fallback
        record.set("sacrifice_day_text_ar", sacDayVal);
    }

    const paymentMethod = record.getString("payment_method");
    if (paymentMethod === "cod") {
        record.set("payment_status", "cod_pending_confirmation");
        record.set("order_status", "pending_confirmation");
    } else {
        record.set("payment_status", "pending_payment");
        record.set("order_status", "confirmed_pending_payment");
    }

    // --- Capture IP and User Agent (if fields exist in schema) ---
    if (record.has("user_ip_address")) {
        record.set("user_ip_address", e.httpContext.realIp());
    }
    if (record.has("user_agent_string")) {
        record.set("user_agent_string", e.httpContext.request().header.get("User-Agent"));
    }


    // --- 7. Stock Decrement (within transaction) ---
    // The BeforeCreate hook runs within a transaction with the record save.
    product.set("stock_available_pb", currentStock - 1);
    try {
        dao.saveRecord(product);
    } catch (err) {
        console.error(`[OrderHook] Failed to update product stock for ${productID}: ${err}`);
        throw new Error(`Failed to update product stock for product ${productID}. Order not created.`);
    }

    console.log(`[OrderHook] Product ${product.getString("item_key")} stock decremented from ${currentStock} to ${product.getInt("stock_available_pb")}`);
    console.log(`[OrderHook] Order (client-suggested ID: ${record.getString("order_id_text")}) processing complete. Total: ${totalAmountDueEGP.toFixed(2)}`);

}, "orders"); // Specify the collection name for this hook


/**
 * HOOK: After an 'orders' record is created
 *
 * This hook can be used for post-creation actions like sending notifications,
 * triggering other processes, etc. For now, it's just a placeholder.
 */
onRecordAfterCreateRequest((e) => {
    const record = e.record;
    console.log(`[OrderHook] AfterCreate: Order ${record.id} (Client ID: ${record.getString("order_id_text")}) created successfully.`);

    // Example: Send an email notification (requires mail settings configured in PocketBase)
    /*
    if ($app.settings().meta.smtp?.enabled) {
        const message = new MailerMessage({
            from: {
                address: $app.settings().meta.senderAddress,
                name: $app.settings().meta.senderName,
            },
            to: [{ address: record.getString("customer_email") }], // Assuming customer_email exists
            subject: `Your Sheep Land Order #${record.getString("order_id_text")} Confirmed!`,
            html: `<p>Thank you for your order, ${record.getString("ordering_person_name")}!</p><p>Your Order ID is: <strong>${record.getString("order_id_text")}</strong></p><p>Total: ${record.getFloat("total_amount_due_egp").toFixed(2)} EGP</p>`,
        });
        try {
            $app.newMailClient().send(message);
            console.log(`[OrderHook] Confirmation email sent for order ${record.id}`);
        } catch (emailErr) {
            console.error(`[OrderHook] Failed to send confirmation email for order ${record.id}: ${emailErr}`);
        }
    }
    */

}, "orders");


/**
 * HOOK: Before an 'orders' record is updated
 *
 * This can be used to handle status changes, payment updates, etc.
 * For example, if admin changes order_status to 'fulfilled_completed',
 * and payment_status is 'paid_confirmed', you might link it to an animal_id
 * from sheep_log if not already done.
 */
onRecordBeforeUpdateRequest((e) => {
    const record = e.record; // The 'orders' record being updated
    const dao = $app.dao();
    const oldStatus = dao.findRecordById("orders", record.id)?.getString("order_status") || ""; // Get old status before update

    console.log(`[OrderHook] BeforeUpdate: Processing order ${record.id} (Client ID: ${record.getString("order_id_text")}). Old status: ${oldStatus}, New status: ${record.getString("order_status")}`);

    // Example: Logic for when order status changes
    if (record.isNew()) { // This check is usually for create, but good to be aware of
        return;
    }

    const newStatus = record.getString("order_status");
    const paymentStatus = record.getString("payment_status");

    // If order is cancelled by admin/user and was previously stock-deducted, consider restocking.
    // This requires careful thought about payment status (e.g., only restock if not paid or refunded).
    if ((newStatus === "cancelled_by_user" || newStatus === "cancelled_by_admin") &&
        oldStatus !== "cancelled_by_user" && oldStatus !== "cancelled_by_admin") {
        
        if (paymentStatus !== "paid_confirmed" && paymentStatus !== "payment_under_review") { // Only restock if not paid or payment is reversible
            const productID = record.getString("product_id");
            if (productID) {
                try {
                    const product = dao.findRecordById("products", productID);
                    const currentStock = product.getInt("stock_available_pb");
                    product.set("stock_available_pb", currentStock + 1);
                    dao.saveRecord(product);
                    console.log(`[OrderHook] Order ${record.id} cancelled. Product ${productID} stock incremented back to ${currentStock + 1}.`);
                    record.set("admin_notes", (record.getString("admin_notes") + "\nStock auto-incremented on cancellation.").trim());
                } catch (err) {
                    console.error(`[OrderHook] Failed to restock product ${productID} for cancelled order ${record.id}: ${err}`);
                    // Don't block the update, but log the issue. Admin might need to manually adjust.
                }
            }
        } else {
            console.log(`[OrderHook] Order ${record.id} cancelled but was paid/under review. Stock NOT automatically incremented.`);
             record.set("admin_notes", (record.getString("admin_notes") + "\nOrder cancelled (paid/review). Stock not auto-incremented.").trim());
        }
    }

    // Add more logic here for other status transitions if needed.
    // e.g., when order is 'fulfilled_completed' and 'paid_confirmed',
    // you might want to ensure 'animal_id' (relation to sheep_log) is set.

}, "orders");

// You can add more hooks for other collections or events as needed.
// For example, for the 'products' collection:
/*
onRecordBeforeCreateRequest((e) => {
    const record = e.record;
    // Example: Ensure item_key is unique or generate one if not provided
    if (!record.getString("item_key")) {
        record.set("item_key", record.getString("type_key") + "_" + new Date().getTime()); // Simple generation
    }
    console.log(`[ProductHook] BeforeCreate: Processing product item_key: ${record.getString("item_key")}`);
}, "products");

onRecordBeforeUpdateRequest((e) => {
    const record = e.record;
    // Example: Prevent changing price_per_kg_egp if there are active, unpaid orders for this product
    // This would be more complex and require querying orders.
    console.log(`[ProductHook] BeforeUpdate: Processing product ${record.id}`);
}, "products");
*/

console.log("JavaScript hooks for 'orders' (and potentially others) registered.");
