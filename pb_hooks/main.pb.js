/// <reference path="../pb_data/types.d.ts" />

const registerHook = (collection, event, handler) => {
    try {
        if (typeof onRecordBeforeCreateRequest !== 'undefined' && event === 'beforeCreate') {
            onRecordBeforeCreateRequest(handler, collection);
        } else if (typeof onRecordAfterCreateRequest !== 'undefined' && event === 'afterCreate') {
            onRecordAfterCreateRequest(handler, collection);
        } else if (typeof onRecordBeforeUpdateRequest !== 'undefined' && event === 'beforeUpdate') {
            onRecordBeforeUpdateRequest(handler, collection);
        } else if (typeof $app !== 'undefined') {
            if (event === 'beforeCreate') $app.onRecordBeforeCreateRequest(collection, handler);
            else if (event === 'afterCreate') $app.onRecordAfterCreateRequest(collection, handler);
            else if (event === 'beforeUpdate') $app.onRecordBeforeUpdateRequest(collection, handler);
        }
    } catch (error) {
        console.error(`HOOK REGISTRATION FAILED for ${collection} - ${event}: ${error}`);
    }
};

registerHook("orders", "beforeCreate", (e) => {
    const record = e.record;
    const dao = $app.dao();
    let product;

    try {
        const productID = record.getString("product_id");
        if (!productID) throw new Error("Product ID is missing from the order payload.");
        product = dao.findRecordById("products", productID);
    } catch (err) {
        console.error(`[OrderHook-BeforeCreate] CRITICAL: Product lookup failed. ProductID: ${record.getString("product_id")}. Error: ${err}`);
        throw new Error(`Selected product could not be found. Please try again or contact support.`);
    }

    if (!product.getBool("is_active")) throw new Error(`Product ${product.getString("item_key")} is currently not active.`);
    const currentStock = product.getInt("stock_available_pb");
    if (currentStock <= 0) throw new Error(`Product ${product.getString("item_key")} is out of stock. Please select another option.`);

    record.set("ordered_product_name_en", product.getString("variant_name_en"));
    record.set("ordered_product_name_ar", product.getString("variant_name_ar"));
    record.set("ordered_weight_range_en", product.getString("weight_range_text_en"));
    record.set("ordered_weight_range_ar", product.getString("weight_range_text_ar"));
    const priceAtOrderTimeEGP = product.getFloat("base_price_egp");
    record.set("price_at_order_time_egp", priceAtOrderTimeEGP);

    let appSettings;
    try {
        appSettings = dao.findFirstRecordByFilter("settings", "id!=''");
    } catch (err) {
        console.error(`[OrderHook-BeforeCreate] CRITICAL: Failed to fetch application settings: ${err}`);
        throw new Error("A server configuration error occurred. Please contact support.");
    }

    const defaultServiceFeeEGP = appSettings.getFloat("servFeeEGP");
    let serviceFeeAppliedEGP = 0.0;
    if (record.getString("udheya_service_option_selected") === "standard_service") {
        serviceFeeAppliedEGP = defaultServiceFeeEGP;
    }
    record.set("service_fee_applied_egp", serviceFeeAppliedEGP);

    let deliveryFeeAppliedEGP = 0.0;
    const deliveryOption = record.getString("delivery_option");
    const deliveryAreaID = record.getString("delivery_area_id");
    const deliveryAreasJSON = appSettings.get("delAreas");
    if (deliveryOption === "home_delivery_to_orderer" && deliveryAreaID && Array.isArray(deliveryAreasJSON)) {
        for (const govArea of deliveryAreasJSON) {
            if (typeof govArea === 'object' && govArea !== null) {
                const govID = govArea.id || "";
                if (Array.isArray(govArea.cities)) {
                    for (const city of govArea.cities) {
                        if (typeof city === 'object' && city !== null) {
                            const currentCityID = `${govID}_${city.id || ""}`;
                            if (currentCityID === deliveryAreaID && typeof city.delivery_fee_egp === 'number') {
                                deliveryFeeAppliedEGP = city.delivery_fee_egp; break;
                            }
                        }
                    }
                } else if (govID === deliveryAreaID && typeof govArea.delivery_fee_egp === 'number') {
                    deliveryFeeAppliedEGP = govArea.delivery_fee_egp; break;
                }
            }
            if (deliveryFeeAppliedEGP > 0) break;
        }
    }
    record.set("delivery_fee_applied_egp", deliveryFeeAppliedEGP);

    let onlinePaymentFeeAppliedEGP = 0.0;
    const paymentMethodHook = record.getString("payment_method");
    if (paymentMethodHook === "online_card") {
        onlinePaymentFeeAppliedEGP = appSettings.getFloat("online_payment_fee_egp") || 0;
    }
    record.set("online_payment_fee_applied_egp", onlinePaymentFeeAppliedEGP); // Use generic field name

    const totalAmountDueEGP = priceAtOrderTimeEGP + serviceFeeAppliedEGP + deliveryFeeAppliedEGP + onlinePaymentFeeAppliedEGP;
    if (isNaN(totalAmountDueEGP) || totalAmountDueEGP < 0) {
        console.error(`[OrderHook-BeforeCreate] CRITICAL: Calculated totalAmountDueEGP is invalid: ${totalAmountDueEGP}`);
        throw new Error("Internal error calculating total order amount. Please contact support.");
    }
    record.set("total_amount_due_egp", totalAmountDueEGP);


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
        record.set("sacrifice_day_text_en", sacDayVal); record.set("sacrifice_day_text_ar", sacDayVal);
    }

    if (paymentMethodHook === "online_card") {
        record.set("payment_status", "pending_gateway_redirect");
        record.set("order_status", "awaiting_payment_gateway");
    } else {
        record.set("payment_status", paymentMethodHook === "cod" ? "cod_pending_confirmation" : "pending_payment");
        record.set("order_status", paymentMethodHook === "cod" ? "pending_confirmation" : "confirmed_pending_payment");
    }

    try {
        if (record.has("user_ip_address") && e.httpContext) record.set("user_ip_address", e.httpContext.realIp());
        if (record.has("user_agent_string")&& e.httpContext) record.set("user_agent_string", e.httpContext.request().header.get("User-Agent"));
    } catch(ipErr) { console.warn(`[OrderHook-BeforeCreate] Could not set IP/UserAgent: ${ipErr}`); }


    product.set("stock_available_pb", currentStock - 1);
    try {
        dao.saveRecord(product);
    } catch (err) {
        console.error(`[OrderHook-BeforeCreate] CRITICAL: Failed to update stock for product ${product.getString("item_key")}: ${err}`);
        throw new Error(`Failed to update product stock. Order not created. Please try again or contact support.`);
    }
});

registerHook("orders", "afterCreate", (e) => {
    const record = e.record;
    const customerEmail = record.getString("customer_email");
    const enableEmailConfirmation = true; 

    if (enableEmailConfirmation && customerEmail && $app && typeof $app.newMailMessage === 'function' && $app.settings().meta.senderAddress) {
        try {
            const message = $app.newMailMessage();
            message.setFrom($app.settings().meta.senderAddress, $app.settings().meta.senderName || "Sheep Land");
            message.setTo(customerEmail);
            message.setSubject(`Your Sheep Land Order Confirmed: ${record.getString("order_id_text")}`);

            let emailBody = `<h1>Thank You for Your Order!</h1>`;
            emailBody += `<p>JazakAllah Khairan for choosing Sheep Land. Your Order ID is: <strong>${record.getString("order_id_text")}</strong></p>`;
            emailBody += `<h2>Order Summary:</h2><ul>`;
            emailBody += `<li>Animal: ${record.getString("ordered_product_name_en")} (${record.getString("ordered_weight_range_en")})</li>`;
            if (record.getString("udheya_service_option_selected") === "standard_service") {
                 emailBody += `<li>Service: Standard Service (Fee: ${record.getFloat("service_fee_applied_egp")} EGP)</li>`;
            }
            emailBody += `<li>Sacrifice Day: ${record.getString("sacrifice_day_text_en")}</li>`;
            emailBody += `<li>Distribution: ${record.getString("distribution_choice") === "me" ? "All to me" : (record.getString("distribution_choice") === "char" ? "All to charity (by SL)" : "Split: " + (record.getString("custom_split_details_text") || record.getString("split_details_option")))}</li>`;
            if (record.getString("delivery_option") === "home_delivery_to_orderer" && record.getString("delivery_address")) {
                emailBody += `<li>Delivery Address: ${record.getString("delivery_address")}, ${record.getString("delivery_area_name_en") || record.getString("delivery_area_id")}</li>`;
            }
            if (record.getFloat("online_payment_fee_applied_egp") > 0 && record.getString("payment_method") === "online_card") { // Generic field name
                 emailBody += `<li>Online Payment Fee: ${record.getFloat("online_payment_fee_applied_egp")} EGP</li>`;
            }
            emailBody += `<li><strong>Total Amount: ${record.getFloat("total_amount_due_egp")} EGP</strong></li>`;
            emailBody += `</ul>`;

            const paymentMethod = record.getString("payment_method");
            emailBody += `<h2>Payment Instructions:</h2>`;
            if (paymentMethod === "online_card") {
                emailBody += `<p>To complete your order for ${record.getFloat("total_amount_due_egp")} EGP, you will be contacted shortly with a secure payment link, or you may be redirected momentarily. If you are not redirected or contacted within a few minutes, please contact us quoting Order ID: ${record.getString("order_id_text")}.</p>`;
            } else if (paymentMethod === "cod") {
                emailBody += `<p>Our team will contact you on ${record.getString("ordering_person_phone")} to confirm delivery and collect payment of ${record.getFloat("total_amount_due_egp")} EGP.</p>`;
            } else {
                emailBody += `<p>Please complete your payment of ${record.getFloat("total_amount_due_egp")} EGP using the details provided on our website for ${paymentMethod.toUpperCase()}. Reference your Order ID: ${record.getString("order_id_text")}.</p>`;
            }
             if (record.getString("udheya_service_option_selected") === "standard_service" && $app.settings().slaughter_location_gmaps_url) {
                emailBody += `<p>Our slaughter facility location (relevant for viewing inquiries): <a href="${$app.settings().slaughter_location_gmaps_url}">View Map</a></p>`;
            }
            message.setHtml(emailBody);
            $app.mails.send(message);
            console.log(`[OrderHook-AfterCreate] Confirmation email initiated for order ${record.getString("order_id_text")} to ${customerEmail}.`);
        } catch (err) {
            console.error(`[OrderHook-AfterCreate] FAILED to send confirmation email for order ${record.getString("order_id_text")} to ${customerEmail}: ${err}`);
        }
    } else if (customerEmail && !($app && typeof $app.newMailMessage === 'function' && $app.settings().meta.senderAddress)) {
        console.warn(`[OrderHook-AfterCreate] Email for ${record.getString("order_id_text")} not sent: SMTP not configured in PocketBase or mail functions unavailable.`);
    } else if (!customerEmail) {
        console.warn(`[OrderHook-AfterCreate] Email for ${record.getString("order_id_text")} not sent: No customer email provided.`);
    }
});

registerHook("orders", "beforeUpdate", (e) => {
    const record = e.record;
    const dao = $app.dao();
    let oldStatus = "";
    try {
        const originalRecord = dao.findRecordById("orders", record.id);
        oldStatus = originalRecord?.getString("order_status") || "";
    } catch (err) { console.warn(`[OrderHook-BeforeUpdate] Could not find original record ${record.id} to get oldStatus. Error: ${err}`);}

    const newStatus = record.getString("order_status");
    const paymentStatus = record.getString("payment_status");

    if ((newStatus === "cancelled_by_user" || newStatus === "cancelled_by_admin") && oldStatus !== newStatus) {
        if (paymentStatus !== "paid_confirmed" && paymentStatus !== "payment_under_review" && !(paymentStatus === "cod_confirmed_pending_delivery" && oldStatus === "ready_for_fulfillment")) {
            const productID = record.getString("product_id");
            if (productID) {
                try {
                    const product = dao.findRecordById("products", productID);
                    const currentStock = product.getInt("stock_available_pb");
                    product.set("stock_available_pb", currentStock + 1);
                    dao.saveRecord(product);
                    record.set("admin_notes", (record.getString("admin_notes") + "\nStock auto-incremented on cancellation.").trim());
                } catch (err) {
                     console.error(`[OrderHook-BeforeUpdate] FAILED to restock product ${productID} for cancelled order ${record.id}: ${err}`);
                     record.set("admin_notes", (record.getString("admin_notes") + `\nSTOCK INCREMENT FAILED for product ${productID} on cancellation. Error: ${err.message}`).trim());
                }
            }
        } else {
            record.set("admin_notes", (record.getString("admin_notes") + "\nOrder cancelled (paid/advanced). Stock not auto-incremented.").trim());
        }
    }
});
