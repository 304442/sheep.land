// Filename: /pb_hooks/main.pb.js
/// <reference path="../pb_data/types.d.ts" />

/**
 * Helper to register PocketBase hooks safely, checking for environment.
 */
const registerHook = (collection, event, handler) => {
    try {
        if (typeofโครงสร้าง !== 'undefined' && typeofโครงสร้าง.onRecordBeforeCreateRequest === 'function' && event === 'beforeCreate') { // Cloudflare Workers
            โครงสร้าง.onRecordBeforeCreateRequest(collection, handler);
        } else if (typeofโครงสร้าง !== 'undefined' && typeofโครงสร้าง.onRecordAfterCreateRequest === 'function' && event === 'afterCreate') {
            โครงสร้าง.onRecordAfterCreateRequest(collection, handler);
        } else if (typeofโครงสร้าง !== 'undefined' && typeofโครงสร้าง.onRecordBeforeUpdateRequest === 'function' && event === 'beforeUpdate') {
            โครงสร้าง.onRecordBeforeUpdateRequest(collection, handler);
        } else if (typeof $app !== 'undefined') { // Standard PocketBase environment
            if (event === 'beforeCreate') $app.onRecordBeforeCreateRequest(collection, handler);
            else if (event === 'afterCreate') $app.onRecordAfterCreateRequest(collection, handler);
            else if (event === 'beforeUpdate') $app.onRecordBeforeUpdateRequest(collection, handler);
        } else {
            console.warn(`HOOK REGISTRATION SKIPPED for ${collection} - ${event}: Unknown environment.`);
        }
    } catch (error) {
        console.error(`HOOK REGISTRATION FAILED for ${collection} - ${event}: ${error}`);
    }
};


registerHook("orders", "beforeCreate", (e) => {
    const record = e.record;
    const dao = $app.dao();
    const lineItems = record.get("line_items"); 

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
        throw new Error("Order must contain at least one item (line_items array is empty or not an array).");
    }

    let calculatedSubtotalEGP = 0;
    let calculatedTotalServiceFeeEGP = 0;
    const productStockUpdates = []; 

    let appSettings;
    try {
        appSettings = dao.findFirstRecordByFilter("settings", "id!=''");
        if (!appSettings) throw new Error("Application settings not found. Cannot proceed.");
    } catch (err) {
        console.error(`[OrderHook-BeforeCreate] CRITICAL: Failed to fetch application settings: ${err}`);
        throw new Error("Server configuration error (settings). Please contact support immediately.");
    }
    const defaultServiceFeeEGP = appSettings.getFloat("servFeeEGP") || 0;

    for (let i = 0; i < lineItems.length; i++) {
        const lineItem = lineItems[i]; // Iterate over a copy if modifying in place, but here we read then set.

        if (!lineItem.item_key_pb || typeof lineItem.quantity !== 'number' || lineItem.quantity <= 0) {
            throw new Error(`Invalid line item data at index ${i}: ${lineItem.name_en || 'Unknown item'}. Ensure product ID (item_key_pb) and quantity are correct.`);
        }

        let product;
        try {
            product = dao.findRecordById("products", lineItem.item_key_pb);
        } catch (err) {
            console.error(`[OrderHook-BeforeCreate] Product lookup failed for ID: ${lineItem.item_key_pb} from line item ${i}. Error: ${err}`);
            throw new Error(`Product "${lineItem.name_en || lineItem.item_key_pb}" could not be found or is invalid.`);
        }

        if (!product.getBool("is_active")) {
            throw new Error(`Product "${product.getString("variant_name_en")}" (item ${i+1}) is currently not active.`);
        }

        const currentStock = product.getInt("stock_available_pb");
        if (currentStock < lineItem.quantity) {
            throw new Error(`Not enough stock for "${product.getString("variant_name_en")}" (item ${i+1}). Available: ${currentStock}, Requested: ${lineItem.quantity}.`);
        }
        
        productStockUpdates.push({ productRecord: product, newStock: currentStock - lineItem.quantity });

        const pricePerItemEGP = product.getFloat("base_price_egp");
        lineItem.price_egp_each = pricePerItemEGP; 
        calculatedSubtotalEGP += pricePerItemEGP * lineItem.quantity;

        if (lineItem.product_category === "udheya" && lineItem.udheya_details) {
            if (lineItem.udheya_details.serviceOption === "standard_service") {
                calculatedTotalServiceFeeEGP += defaultServiceFeeEGP;
            }
            // Ensure essential Udheya details are present if it's an Udheya item
            if (!lineItem.udheya_details.sacrificeDay || !lineItem.udheya_details.distribution?.choice) {
                 throw new Error(`Missing essential Udheya details (sacrifice day or distribution) for "${lineItem.name_en}".`);
            }
        }
        // Update the lineItem in the array if you modified it (e.g., added price_egp_each)
        lineItems[i] = lineItem;
    }
    
    record.set("line_items", lineItems); 
    record.set("subtotal_amount_egp", calculatedSubtotalEGP);
    record.set("total_udheya_service_fee_egp", calculatedTotalServiceFeeEGP);

    let deliveryFeeAppliedEGP = record.getFloat("delivery_fee_applied_egp") || 0; // Get from client if provided
    const deliveryOption = record.getString("delivery_option");

    if (deliveryOption === "home_delivery") {
        const deliveryAreaID = record.getString("delivery_city_id");
        const deliveryAreasJSON = appSettings.get("delAreas");
        let foundFee = false;
        if (deliveryAreaID && Array.isArray(deliveryAreasJSON)) {
            for (const govArea of deliveryAreasJSON) {
                if (typeof govArea === 'object' && govArea !== null) {
                    const govID = govArea.id || "";
                    if (Array.isArray(govArea.cities)) {
                        for (const city of govArea.cities) {
                            if (typeof city === 'object' && city !== null) {
                                const currentCityID = `${govID}_${city.id || ""}`;
                                if (currentCityID === deliveryAreaID && typeof city.delivery_fee_egp === 'number') {
                                    deliveryFeeAppliedEGP = city.delivery_fee_egp; foundFee = true; 
                                    record.set("delivery_area_name_en", `${govArea.name_en || ''} - ${city.name_en || ''}`);
                                    record.set("delivery_area_name_ar", `${govArea.name_ar || ''} - ${city.name_ar || ''}`);
                                    break;
                                }
                            }
                        }
                    } else if (govID === deliveryAreaID && typeof govArea.delivery_fee_egp === 'number') {
                        deliveryFeeAppliedEGP = govArea.delivery_fee_egp; foundFee = true; 
                        record.set("delivery_area_name_en", govArea.name_en || '');
                        record.set("delivery_area_name_ar", govArea.name_ar || '');
                        break;
                    }
                }
                if (foundFee) break;
            }
            // If no specific fee found, and client sent 0, it might be a variable fee zone or error.
            // For now, we trust client's calculation if it was > 0, or use server found one.
            if (!foundFee && deliveryFeeAppliedEGP === 0 && deliveryAreaID) {
                 console.warn(`[OrderHook-BeforeCreate] Delivery fee for ${deliveryAreaID} not found in settings, client sent 0. Assuming variable or no fee.`);
                 // deliveryFeeAppliedEGP remains 0 or what client sent.
            }
        }
        record.set("delivery_fee_applied_egp", deliveryFeeAppliedEGP);
    } else { 
        record.set("delivery_fee_applied_egp", 0);
        record.set("delivery_city_id", null); record.set("delivery_address", null);
        record.set("delivery_instructions", null); record.set("delivery_time_slot", null);
        record.set("delivery_area_name_en", null); record.set("delivery_area_name_ar", null);
    }

    let onlinePaymentFeeAppliedEGP = 0.0;
    const paymentMethodHook = record.getString("payment_method");
    if (paymentMethodHook === "online_card") {
        onlinePaymentFeeAppliedEGP = appSettings.getFloat("online_payment_fee_egp") || 0;
    }
    record.set("online_payment_fee_applied_egp", onlinePaymentFeeAppliedEGP);

    const totalAmountDueEGP = calculatedSubtotalEGP + calculatedTotalServiceFeeEGP + deliveryFeeAppliedEGP + onlinePaymentFeeAppliedEGP;
    if (isNaN(totalAmountDueEGP) || totalAmountDueEGP < 0) {
        console.error(`[OrderHook-BeforeCreate] CRITICAL: Calculated totalAmountDueEGP is invalid: ${totalAmountDueEGP}`);
        throw new Error("Internal error calculating total order amount. Please contact support.");
    }
    record.set("total_amount_due_egp", totalAmountDueEGP);

    if (paymentMethodHook === "online_card") {
        record.set("payment_status", "pending_gateway_redirect");
        record.set("order_status", "awaiting_payment_gateway");
    } else if (paymentMethodHook === "cod") {
        record.set("payment_status", "cod_pending_confirmation");
        record.set("order_status", "pending_confirmation");
    } else { 
        record.set("payment_status", "pending_payment");
        record.set("order_status", "confirmed_pending_payment");
    }

    try {
        if (record.has("user_ip_address") && e.httpContext) record.set("user_ip_address", e.httpContext.realIp());
        if (record.has("user_agent_string") && e.httpContext) record.set("user_agent_string", e.httpContext.request().header.get("User-Agent"));
    } catch (ipErr) { console.warn(`[OrderHook-BeforeCreate] Could not set IP/UserAgent: ${ipErr}`); }

    for (const update of productStockUpdates) {
        update.productRecord.set("stock_available_pb", update.newStock);
        try {
            dao.saveRecord(update.productRecord);
        } catch (err) {
            console.error(`[OrderHook-BeforeCreate] CRITICAL: Failed to update stock for product ${update.productRecord.getString("item_key")}: ${err}`);
            throw new Error(`Failed to update product stock for ${update.productRecord.getString("variant_name_en")}. Order not created.`);
        }
    }
});


registerHook("orders", "afterCreate", (e) => {
    const record = e.record;
    const customerEmail = record.getString("customer_email");
    
    let senderAddress = "noreply@sheepland.com"; 
    let senderName = "Sheep Land"; 
    let appSettings;
    try {
        appSettings = $app.dao().findFirstRecordByFilter("settings", "id!=''");
        if (appSettings && appSettings.getString("app_email_sender_address")) { 
            senderAddress = appSettings.getString("app_email_sender_address");
        }
        if (appSettings && appSettings.getString("app_email_sender_name")) {
            senderName = appSettings.getString("app_email_sender_name");
        }
    } catch (err) {
        console.warn(`[OrderHook-AfterCreate] Could not fetch app settings for email sender. Using defaults. Error: ${err}`);
    }

    const enableEmailConfirmation = true; 

    if (enableEmailConfirmation && customerEmail && $app && typeof $app.newMailMessage === 'function') {
        try {
            const message = $app.newMailMessage();
            message.setFrom(senderAddress, senderName);
            message.setTo(customerEmail);
            message.setSubject(`Your Sheep Land Order Confirmed: ${record.getString("order_id_text")}`);
            
            const lineItems = record.get("line_items") || [];
            let itemsListHTML = "<ul>";
            for (const item of lineItems) {
                let itemPrice = item.price_egp_each * item.quantity;
                let serviceFeeText = "";
                if (item.product_category === 'udheya' && item.udheya_details && item.udheya_details.serviceOption === 'standard_service' && appSettings) {
                    const udheyaServiceFee = appSettings.getFloat("servFeeEGP") || 0;
                    itemPrice += udheyaServiceFee;
                    serviceFeeText = ` (incl. ${udheyaServiceFee} EGP service)`;
                }
                itemsListHTML += `<li>${item.name_en} (x${item.quantity}) - ${itemPrice} EGP${serviceFeeText}`;
                if (item.product_category === 'udheya' && item.udheya_details) {
                    const sacrificeDayText = item.udheya_details.sacrificeDay ? (sacrificeDayMapInternal[item.udheya_details.sacrificeDay]?.en || item.udheya_details.sacrificeDay) : 'N/A';
                    itemsListHTML += `<br><small>Service: ${item.udheya_details.serviceOption || 'N/A'}, Day: ${sacrificeDayText}</small>`;
                }
                itemsListHTML += "</li>";
            }
            itemsListHTML += "</ul>";

            let emailBody = `<h1>Thank You for Your Order!</h1>`;
            emailBody += `<p>JazakAllah Khairan for choosing Sheep Land. Your Order ID is: <strong>${record.getString("order_id_text")}</strong></p>`;
            emailBody += `<h2>Order Summary:</h2>`;
            emailBody += itemsListHTML;
            if (record.getFloat("delivery_fee_applied_egp") > 0) {
                emailBody += `<p>Delivery Fee: ${record.getFloat("delivery_fee_applied_egp")} EGP</p>`;
            }
            if (record.getFloat("online_payment_fee_applied_egp") > 0) {
                emailBody += `<p>Online Payment Fee: ${record.getFloat("online_payment_fee_applied_egp")} EGP</p>`;
            }
            emailBody += `<p><strong>Total Amount Due: ${record.getFloat("total_amount_due_egp")} EGP</strong></p>`;

            emailBody += `<h2>Payment Instructions:</h2>`;
            const paymentMethod = record.getString("payment_method");
            const totalAmount = record.getFloat("total_amount_due_egp");
            const orderId = record.getString("order_id_text");
            const waNumRaw = appSettings?.getString("waNumRaw") || "";
            const waNumDisp = appSettings?.getString("waNumDisp") || waNumRaw;
            const payDetails = appSettings?.get("payDetails") || {};
            const waConfirmationLink = `https://wa.me/${waNumRaw}?text=Order%20Payment%20Confirmation%3A%20${orderId}`;
            
            if (paymentMethod === "online_card") {
                emailBody += `<p>To complete your order for ${totalAmount} EGP, please follow the instructions on the website or contact us if you face any issues, quoting Order ID: ${orderId}.</p>`;
            } else if (paymentMethod === "cod") {
                emailBody += `<p>Our team will contact you on ${record.getString("customer_phone")} to confirm delivery and collect payment of ${totalAmount} EGP. Order ID: ${orderId}.</p>`;
            } else if (paymentMethod === "fa") {
                emailBody += `<p>Fawry: Pay ${totalAmount} EGP. Use Order ID ${orderId}. Payment due within 24 hours. Confirm payment on <a href="${waConfirmationLink}" target="_blank">WhatsApp</a>.</p>`;
            } else if (paymentMethod === "vo") {
                emailBody += `<p>Vodafone Cash: Pay ${totalAmount} EGP to ${payDetails.vodafone_cash || 'N/A'}. Reference: ${orderId}. Confirm payment on <a href="${waConfirmationLink}" target="_blank">WhatsApp</a>.</p>`;
            } else if (paymentMethod === "ip") {
                emailBody += `<p>InstaPay: Pay ${totalAmount} EGP to ${payDetails.instapay_ipn || 'N/A'}. Reference: ${orderId}. Confirm payment on <a href="${waConfirmationLink}" target="_blank">WhatsApp</a>.</p>`;
            } else if (paymentMethod === "revolut") {
                emailBody += `<p>Revolut: Pay ${totalAmount} EGP to ${payDetails.revolut_details || 'N/A'}. Reference: ${orderId}. Confirm payment on <a href="${waConfirmationLink}" target="_blank">WhatsApp</a>.</p>`;
            } else if (paymentMethod === "monzo") {
                emailBody += `<p>Monzo: Pay ${totalAmount} EGP to ${payDetails.monzo_details || 'N/A'}. Reference: ${orderId}. Confirm payment on <a href="${waConfirmationLink}" target="_blank">WhatsApp</a>.</p>`;
            } else if (paymentMethod === "bank_transfer") {
                emailBody += `<p>Bank Transfer ${totalAmount} EGP to:</p><ul>
                    <li>Bank: ${payDetails.bank_name || 'N/A'}</li>
                    <li>Account Name: ${payDetails.bank_account_name || 'N/A'}</li>
                    <li>Account Number: ${payDetails.bank_account_number || 'N/A'}</li>
                    ${payDetails.bank_iban ? `<li>IBAN: ${payDetails.bank_iban}</li>` : ''}
                    ${payDetails.bank_swift ? `<li>SWIFT: ${payDetails.bank_swift}</li>` : ''}
                </ul><p>Crucial: Reference Order ID: ${orderId}. Confirm payment on <a href="${waConfirmationLink}" target="_blank">WhatsApp</a>.</p>`;
            }

            if (record.getString("delivery_option") === "home_delivery" && record.getString("delivery_address")) {
                emailBody += `<h2>Delivery Details:</h2><p>${record.getString("delivery_address")}, ${record.getString("delivery_area_name_en") || record.getString("delivery_city_id") || ''}. Preferred Time: ${record.getString("delivery_time_slot") || 'N/A'}</p>`;
            }
             if (appSettings?.getString("slaughter_location_gmaps_url")) {
                let hasUdheyaStandardService = lineItems.some(item => item.product_category === 'udheya' && item.udheya_details?.serviceOption === 'standard_service');
                if (hasUdheyaStandardService) {
                    emailBody += `<p>Our slaughter facility location (relevant for viewing inquiries): <a href="${appSettings.getString("slaughter_location_gmaps_url")}" target="_blank" rel="noopener noreferrer">View Map</a></p>`;
                }
            }
            emailBody += `<p>Thank you,<br/>The Sheep Land Team</p>`;
            message.setHtml(emailBody);
            $app.mails.send(message);
            console.log(`[OrderHook-AfterCreate] Confirmation email initiated for order ${record.getString("order_id_text")} to ${customerEmail}.`);
        } catch (err) {
            console.error(`[OrderHook-AfterCreate] FAILED to send confirmation email for order ${record.getString("order_id_text")} to ${customerEmail}: ${err}`);
        }
    } else if (customerEmail && !($app && typeof $app.newMailMessage === 'function')) {
        console.warn(`[OrderHook-AfterCreate] Email for ${record.getString("order_id_text")} not sent: SMTP not configured or mail functions unavailable.`);
    } else if (!customerEmail) {
        console.warn(`[OrderHook-AfterCreate] Email for ${record.getString("order_id_text")} not sent: No customer email provided.`);
    }
});


registerHook("orders", "beforeUpdate", (e) => {
    const record = e.record; 
    const dao = $app.dao();
    let originalRecord;
    try {
        originalRecord = dao.findRecordById("orders", record.id);
    } catch (err) { 
        console.warn(`[OrderHook-BeforeUpdate] Could not find original record ${record.id}. Error: ${err}`);
        return; 
    }

    const oldStatus = originalRecord.getString("order_status") || "";
    const newStatus = record.getString("order_status");
    const paymentStatus = record.getString("payment_status"); 
    
    if ((newStatus === "cancelled_by_user" || newStatus === "cancelled_by_admin") && oldStatus !== newStatus) {
        const cancellableStates = ["pending_confirmation", "confirmed_pending_payment", "awaiting_payment_gateway", "payment_confirmed_processing"];
        let shouldRestock = true;

        if (paymentStatus === "paid_confirmed" || paymentStatus.startsWith("cod_confirmed")) { // If paid or COD confirmed, might be too late for auto-restock
            if (oldStatus === "fulfilled_completed" || oldStatus === "out_for_delivery" || oldStatus === "ready_for_fulfillment") {
                 shouldRestock = false; // Already processed significantly
            }
        }
        // Only restock if it was in a state where stock was logically held and not yet irreversibly processed.
        if (cancellableStates.includes(oldStatus) && shouldRestock) {
            const lineItems = record.get("line_items") || []; 
            let stockUpdateNotes = "";

            for (const lineItem of lineItems) {
                const productID = lineItem.item_key_pb; 
                const quantityToRestock = lineItem.quantity;

                if (productID && quantityToRestock > 0) {
                    try {
                        const product = dao.findRecordById("products", productID);
                        const currentStock = product.getInt("stock_available_pb");
                        product.set("stock_available_pb", currentStock + quantityToRestock);
                        dao.saveRecord(product);
                        stockUpdateNotes += `Restocked ${quantityToRestock} of ${product.getString("variant_name_en") || lineItem.name_en}. `;
                    } catch (err) {
                         console.error(`[OrderHook-BeforeUpdate] FAILED to restock product ${productID} (qty: ${quantityToRestock}) for cancelled order ${record.id}: ${err}`);
                         stockUpdateNotes += `STOCK INCREMENT FAILED for product ${productID} (qty: ${quantityToRestock}). Error: ${err.message}. `;
                    }
                }
            }
            record.set("admin_notes", (record.getString("admin_notes") || "" + `\nOrder Cancellation: ${stockUpdateNotes}`).trim());
        } else {
            record.set("admin_notes", (record.getString("admin_notes") || "" + `\nOrder cancelled (old status: ${oldStatus}, payment: ${paymentStatus}). Stock not auto-incremented. Manual check may be needed.`).trim());
        }
    }
});
