// PocketBase Hooks for Sheep Land Egypt
// Updated to match latest PocketBase API documentation

const sacrificeDayMap = { 
    "day1_10_dhul_hijjah": { "en": "Day 1 of Eid (10th Dhul Hijjah)", "ar": "اليوم الأول (10 ذو الحجة)" },
    "day2_11_dhul_hijjah": { "en": "Day 2 of Eid (11th Dhul Hijjah)", "ar": "اليوم الثاني (11 ذو الحجة)" },
    "day3_12_dhul_hijjah": { "en": "Day 3 of Eid (12th Dhul Hijjah)", "ar": "اليوم الثالث (12 ذو الحجة)" },
    "day4_13_dhul_hijjah": { "en": "Day 4 of Eid (13th Dhul Hijjah)", "ar": "اليوم الرابع (13 ذو الحجة)" },
};

// Before Create Hook for Orders
onRecordCreateRequest((e) => {
    if (e.collection.name !== "orders") return;
    
    const record = e.record;
    const lineItemsData = JSON.parse(JSON.stringify(record.get("line_items"))); 

    if (!Array.isArray(lineItemsData) || lineItemsData.length === 0) {
        throw new BadRequestError("Order must contain at least one item.");
    }

    let calculatedSubtotalEGP = 0;
    let calculatedTotalServiceFeeEGP = 0;
    const productStockUpdates = []; 
    const processedLineItems = []; 

    let appSettings;
    try {
        appSettings = $app.dao().findFirstRecordByFilter("settings", "id!=''");
        if (!appSettings) throw new Error("Application settings not found.");
    } catch (err) {
        console.error(`[OrderHook] Failed to fetch settings: ${err}`);
        throw new BadRequestError("Server configuration error. Please contact support.");
    }
    const defaultServiceFeeEGP = appSettings.get("servFeeEGP") || 0;

    for (let i = 0; i < lineItemsData.length; i++) {
        const clientLineItem = lineItemsData[i]; 

        if (!clientLineItem.item_key_pb || typeof clientLineItem.quantity !== 'number' || clientLineItem.quantity <= 0) {
            throw new BadRequestError(`Invalid line item data at index ${i}.`);
        }

        let product;
        try {
            product = $app.dao().findRecordById("products", clientLineItem.item_key_pb);
        } catch (err) {
            console.error(`[OrderHook] Product lookup failed: ${clientLineItem.item_key_pb}`);
            throw new BadRequestError(`Product "${clientLineItem.name_en || clientLineItem.item_key_pb}" not found.`);
        }

        if (!product.get("is_active")) {
            throw new BadRequestError(`Product "${product.get("variant_name_en")}" is not active.`);
        }

        const currentStock = product.get("stock_available_pb");
        if (currentStock < clientLineItem.quantity) {
            throw new BadRequestError(`Not enough stock for "${product.get("variant_name_en")}". Available: ${currentStock}, Requested: ${clientLineItem.quantity}.`);
        }
        
        productStockUpdates.push({ productRecord: product, newStock: currentStock - clientLineItem.quantity });

        const pricePerItemEGP = product.get("base_price_egp");
        
        const processedItem = {
            item_key_pb: product.getId(), 
            product_category: product.get("product_category"),
            name_en: product.get("variant_name_en"),
            name_ar: product.get("variant_name_ar"),
            quantity: clientLineItem.quantity,
            price_egp_each: pricePerItemEGP, 
            udheya_details: null 
        };

        calculatedSubtotalEGP += pricePerItemEGP * clientLineItem.quantity;

        if (processedItem.product_category === "udheya" && clientLineItem.udheya_details) {
            processedItem.udheya_details = clientLineItem.udheya_details; 
            if (clientLineItem.udheya_details.serviceOption === "standard_service") {
                calculatedTotalServiceFeeEGP += defaultServiceFeeEGP;
            }
            if (!clientLineItem.udheya_details.sacrificeDay || !clientLineItem.udheya_details.distribution?.choice) {
                 throw new BadRequestError(`Missing Udheya details for "${processedItem.name_en}".`);
            }
        }
        processedLineItems.push(processedItem);
    }
    
    record.set("line_items", processedLineItems); 
    record.set("subtotal_amount_egp", calculatedSubtotalEGP);
    record.set("total_udheya_service_fee_egp", calculatedTotalServiceFeeEGP);

    let deliveryFeeAppliedEGP = record.get("delivery_fee_applied_egp") || 0; 
    const deliveryOption = record.get("delivery_option");
    let areaNameEnToSet = record.get("delivery_area_name_en") || ""; 
    let areaNameArToSet = record.get("delivery_area_name_ar") || "";

    if (deliveryOption === "home_delivery") {
        const deliveryAreaID = record.get("delivery_city_id");
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
                                if (currentCityID === deliveryAreaID) {
                                    if (typeof city.delivery_fee_egp === 'number') deliveryFeeAppliedEGP = city.delivery_fee_egp;
                                    foundFee = true; 
                                    areaNameEnToSet = `${govArea.name_en || ''} - ${city.name_en || ''}`;
                                    areaNameArToSet = `${govArea.name_ar || ''} - ${city.name_ar || ''}`;
                                    break;
                                }
                            }
                        }
                    } else if (govID === deliveryAreaID) {
                        if (typeof govArea.delivery_fee_egp === 'number') deliveryFeeAppliedEGP = govArea.delivery_fee_egp;
                        foundFee = true; 
                        areaNameEnToSet = govArea.name_en || '';
                        areaNameArToSet = govArea.name_ar || '';
                        break;
                    }
                }
                if (foundFee) break;
            }
        }
        record.set("delivery_fee_applied_egp", deliveryFeeAppliedEGP);
        record.set("delivery_area_name_en", areaNameEnToSet);
        record.set("delivery_area_name_ar", areaNameArToSet);
    } else if (deliveryOption === "international_shipping") {
        const internationalShippingFee = 500;
        record.set("international_shipping_fee_egp", internationalShippingFee);
        deliveryFeeAppliedEGP = internationalShippingFee;
        record.set("delivery_fee_applied_egp", deliveryFeeAppliedEGP);
    } else { 
        record.set("delivery_fee_applied_egp", 0);
        record.set("international_shipping_fee_egp", 0);
        record.set("delivery_city_id", null); 
        record.set("delivery_address", null);
        record.set("delivery_instructions", null); 
        record.set("delivery_time_slot", null);
        record.set("delivery_area_name_en", null); 
        record.set("delivery_area_name_ar", null);
    }

    let onlinePaymentFeeAppliedEGP = 0.0;
    const paymentMethod = record.get("payment_method");
    if (paymentMethod === "online_card") {
        onlinePaymentFeeAppliedEGP = appSettings.get("online_payment_fee_egp") || 0;
    }
    record.set("online_payment_fee_applied_egp", onlinePaymentFeeAppliedEGP);

    const totalAmountDueEGP = calculatedSubtotalEGP + calculatedTotalServiceFeeEGP + deliveryFeeAppliedEGP + onlinePaymentFeeAppliedEGP;
    if (isNaN(totalAmountDueEGP) || totalAmountDueEGP < 0) {
        console.error(`[OrderHook] Invalid totalAmountDueEGP: ${totalAmountDueEGP}`);
        throw new BadRequestError("Internal error calculating total. Please contact support.");
    }
    record.set("total_amount_due_egp", totalAmountDueEGP);

    if (paymentMethod === "online_card") {
        record.set("payment_status", "pending_gateway_redirect");
        record.set("order_status", "awaiting_payment_gateway");
    } else if (paymentMethod === "cod") {
        record.set("payment_status", "cod_pending_confirmation");
        record.set("order_status", "pending_confirmation");
    } else { 
        record.set("payment_status", "pending_payment");
        record.set("order_status", "confirmed_pending_payment");
    }

    if (e.requestInfo.auth && e.requestInfo.auth.id) {
        record.set("user", e.requestInfo.auth.id);
    }

    try {
        if (e.requestInfo && e.requestInfo.realIp) {
            record.set("user_ip_address", e.requestInfo.realIp);
        }
        if (e.requestInfo && e.requestInfo.userAgent) {
            record.set("user_agent_string", e.requestInfo.userAgent);
        }
    } catch (ipErr) { 
        // Could not set IP/UserAgent 
    }

    for (const update of productStockUpdates) {
        update.productRecord.set("stock_available_pb", update.newStock);
        try {
            $app.dao().save(update.productRecord);
        } catch (err) {
            console.error(`[OrderHook] Failed to update stock for ${update.productRecord.get("item_key")}: ${err}`);
            throw new BadRequestError(`Failed to update product stock. Order not created.`);
        }
    }
});

// After Create Hook for Orders
onRecordAfterCreateSuccess((e) => {
    if (e.collection.name !== "orders") return;
    
    const record = e.record;
    const customerEmail = record.get("customer_email");
    
    let senderAddress = "noreply@sheep.land"; 
    let senderName = "Sheep Land Egypt"; 
    let appSettings;
    try {
        appSettings = $app.dao().findFirstRecordByFilter("settings", "id!=''");
        if (appSettings && appSettings.get("app_email_sender_address")) { 
            senderAddress = appSettings.get("app_email_sender_address");
        }
        if (appSettings && appSettings.get("app_email_sender_name")) {
            senderName = appSettings.get("app_email_sender_name");
        }
    } catch (err) {
        // Could not fetch app settings for email. Using defaults.
    }

    const enableEmailConfirmation = true; 

    if (enableEmailConfirmation && customerEmail) {
        try {
            const lineItems = record.get("line_items") || [];
            let itemsListHTML = "<ul style='list-style-type: none; padding: 0;'>";
            
            for (const item of lineItems) {
                let itemDisplayPrice = item.price_egp_each * item.quantity;
                let serviceFeeText = "";
                let premiumBadge = "";
                
                if (item.product_category === 'udheya' && item.udheya_details && item.udheya_details.serviceOption === 'standard_service' && appSettings) {
                    const udheyaServiceFee = appSettings.get("servFeeEGP") || 0;
                    serviceFeeText = ` (+ ${udheyaServiceFee} EGP service)`; 
                }
                
                itemsListHTML += `<li style='margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 8px;'>`;
                itemsListHTML += `<strong>${item.name_en}</strong> (×${item.quantity}) - <span style='color: #2C5F41; font-weight: bold;'>${itemDisplayPrice} EGP${serviceFeeText}</span>`;
                
                if (item.product_category === 'udheya' && item.udheya_details) {
                    const sacrificeDayValue = item.udheya_details.sacrificeDay;
                    const sacrificeDayInfo = sacrificeDayMap[sacrificeDayValue] || {en: sacrificeDayValue, ar: sacrificeDayValue}; 
                    const sacrificeDayText = sacrificeDayInfo.en;
                    itemsListHTML += `<br><small style='color: #8B4513;'>🕌 Service: ${item.udheya_details.serviceOption === 'standard_service' ? 'Standard Processing' : 'Live Animal Delivery'}</small>`;
                    if (item.udheya_details.serviceOption === 'standard_service') {
                        itemsListHTML += `<br><small style='color: #8B4513;'>📅 Sacrifice Day: ${sacrificeDayText}</small>`;
                    }
                    itemsListHTML += `<br><small style='color: #8B4513;'>📦 Distribution: ${item.udheya_details.distribution?.choice || 'Standard'}</small>`;
                }
                itemsListHTML += "</li>";
            }
            itemsListHTML += "</ul>";

            let emailBody = `
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;'>
                <div style='background: linear-gradient(135deg, #2C5F41, #8B4513); color: white; padding: 20px; text-align: center;'>
                    <h1 style='margin: 0; font-size: 24px;'>🐑 Sheep Land Egypt</h1>
                    <p style='margin: 5px 0 0 0; font-size: 16px;'>Premium Live Sheep & Udheya Services</p>
                </div>
                <div style='padding: 30px;'>
                    <h2 style='color: #2C5F41; margin-top: 0;'>JazakAllah Khairan for Your Order! 🙏</h2>
                    <p style='font-size: 16px; line-height: 1.6;'>Thank you for choosing Sheep Land Egypt. Your order has been confirmed and is being processed with the utmost care.</p>
                    
                    <div style='background: #f0ebe3; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;'>
                        <p style='margin: 0; font-size: 14px; color: #8B4513;'><strong>Order ID</strong></p>
                        <p style='margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #2C5F41;'>${record.get("order_id_text")}</p>
                    </div>

                    <h3 style='color: #8B4513; border-bottom: 2px solid #D2B48C; padding-bottom: 5px;'>📦 Order Summary</h3>
                    ${itemsListHTML}`;
            
            if (record.get("total_udheya_service_fee_egp") > 0) {
                 emailBody += `<p style='margin: 15px 0 5px 0; font-size: 14px;'><strong>🕌 Total Udheya Service Fee(s):</strong> <span style='color: #2C5F41;'>${record.get("total_udheya_service_fee_egp")} EGP</span></p>`;
            }
            if (record.get("delivery_fee_applied_egp") > 0) {
                emailBody += `<p style='margin: 5px 0; font-size: 14px;'><strong>🚚 Delivery Fee:</strong> <span style='color: #2C5F41;'>${record.get("delivery_fee_applied_egp")} EGP</span></p>`;
            }
            if (record.get("international_shipping_fee_egp") > 0) {
                emailBody += `<p style='margin: 5px 0; font-size: 14px;'><strong>🌍 International Shipping:</strong> <span style='color: #2C5F41;'>${record.get("international_shipping_fee_egp")} EGP</span></p>`;
            }
            if (record.get("online_payment_fee_applied_egp") > 0) {
                emailBody += `<p style='margin: 5px 0; font-size: 14px;'><strong>💳 Online Payment Fee:</strong> <span style='color: #2C5F41;'>${record.get("online_payment_fee_applied_egp")} EGP</span></p>`;
            }
            
            emailBody += `
                    <div style='background: #2C5F41; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;'>
                        <p style='margin: 0; font-size: 18px; font-weight: bold;'>💰 Total Amount Due: ${record.get("total_amount_due_egp")} EGP</p>
                    </div>

                    <h3 style='color: #8B4513; border-bottom: 2px solid #D2B48C; padding-bottom: 5px;'>💳 Payment Instructions</h3>`;

            const paymentMethod = record.get("payment_method");
            const totalAmount = record.get("total_amount_due_egp");
            const orderId = record.get("order_id_text");
            const waNumRaw = appSettings?.get("waNumRaw") || "";
            const waNumDisp = appSettings?.get("waNumDisp") || waNumRaw;
            const payDetails = appSettings?.get("payDetails") || {};
            const waConfirmationLink = `https://wa.me/${waNumRaw}?text=Order%20Payment%20Confirmation%3A%20${orderId}`;
            
            if (paymentMethod === "online_card") {
                emailBody += `<div style='background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 10px 0;'><p>💳 <strong>Online Payment:</strong> To complete your order for <strong>${totalAmount} EGP</strong>, please follow the payment instructions on our website or contact us directly. Order ID: <code style='background: #fff; padding: 2px 6px; border-radius: 4px;'>${orderId}</code></p></div>`;
            } else if (paymentMethod === "cod") {
                emailBody += `<div style='background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0;'><p>💵 <strong>Cash on Delivery:</strong> Our team will contact you on <strong>${record.get("customer_phone")}</strong> to confirm delivery and collect payment of <strong>${totalAmount} EGP</strong>. Order ID: <code style='background: #fff; padding: 2px 6px; border-radius: 4px;'>${orderId}</code></p></div>`;
            } else if (paymentMethod === "fawry") {
                emailBody += `<div style='background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 10px 0;'><p>🏪 <strong>Fawry:</strong> Pay <strong>${totalAmount} EGP</strong> at any Fawry location. Use Order ID <code style='background: #fff; padding: 2px 6px; border-radius: 4px;'>${orderId}</code>. Payment due within 24 hours. Confirm via <a href="${waConfirmationLink}" style='color: #2C5F41;'>${waNumDisp}</a>.</p></div>`;
            } else if (paymentMethod === "vodafone_cash") {
                emailBody += `<div style='background: #f8d7da; padding: 15px; border-radius: 8px; margin: 10px 0;'><p>📱 <strong>Vodafone Cash:</strong> Send <strong>${totalAmount} EGP</strong> to <code style='background: #fff; padding: 2px 6px; border-radius: 4px;'>${payDetails.vodafone_cash || 'N/A'}</code>. Reference: <strong>${orderId}</strong>. Confirm via <a href="${waConfirmationLink}" style='color: #2C5F41;'>${waNumDisp}</a>.</p></div>`;
            } else if (paymentMethod === "instapay") {
                emailBody += `<div style='background: #d4edda; padding: 15px; border-radius: 8px; margin: 10px 0;'><p>⚡ <strong>InstaPay:</strong> Send <strong>${totalAmount} EGP</strong> to <code style='background: #fff; padding: 2px 6px; border-radius: 4px;'>${payDetails.instapay_ipn || 'N/A'}</code>. Reference: <strong>${orderId}</strong>. Confirm via <a href="${waConfirmationLink}" style='color: #2C5F41;'>${waNumDisp}</a>.</p></div>`;
            } else if (paymentMethod === "revolut") {
                emailBody += `<div style='background: #e2e3e5; padding: 15px; border-radius: 8px; margin: 10px 0;'><p>🌍 <strong>Revolut:</strong> Send <strong>${totalAmount} EGP</strong> to <code style='background: #fff; padding: 2px 6px; border-radius: 4px;'>${payDetails.revolut_details || 'N/A'}</code>. Reference: <strong>${orderId}</strong>. Confirm via <a href="${waConfirmationLink}" style='color: #2C5F41;'>${waNumDisp}</a>.</p></div>`;
            } else if (paymentMethod === "paypal") {
                emailBody += `<div style='background: #cce5ff; padding: 15px; border-radius: 8px; margin: 10px 0;'><p>🌐 <strong>PayPal:</strong> Send <strong>${totalAmount} EGP</strong> to <code style='background: #fff; padding: 2px 6px; border-radius: 4px;'>${payDetails.paypal_email || 'N/A'}</code>. Reference: <strong>${orderId}</strong>. Confirm via <a href="${waConfirmationLink}" style='color: #2C5F41;'>${waNumDisp}</a>.</p></div>`;
            } else if (paymentMethod === "western_union") {
                emailBody += `<div style='background: #fff2cc; padding: 15px; border-radius: 8px; margin: 10px 0;'><p>🏦 <strong>Western Union:</strong> Send <strong>${totalAmount} EGP</strong> to <strong>${payDetails.western_union_details || 'N/A'}</strong>. Reference: <strong>${orderId}</strong>. Confirm via <a href="${waConfirmationLink}" style='color: #2C5F41;'>${waNumDisp}</a>.</p></div>`;
            } else if (paymentMethod === "bank_transfer") {
                emailBody += `<div style='background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 10px 0;'>
                    <p><strong>🏛️ Bank Transfer ${totalAmount} EGP to:</strong></p>
                    <ul style='margin: 10px 0; padding-left: 20px;'>
                        <li><strong>Bank:</strong> ${payDetails.bank_name || 'N/A'}</li>
                        <li><strong>Account Name:</strong> ${payDetails.bank_account_name || 'N/A'}</li>
                        <li><strong>Account Number:</strong> <code style='background: #fff; padding: 2px 6px; border-radius: 4px;'>${payDetails.bank_account_number || 'N/A'}</code></li>
                        ${payDetails.bank_iban ? `<li><strong>IBAN:</strong> <code style='background: #fff; padding: 2px 6px; border-radius: 4px;'>${payDetails.bank_iban}</code></li>` : ''}
                        ${payDetails.bank_swift ? `<li><strong>SWIFT:</strong> <code style='background: #fff; padding: 2px 6px; border-radius: 4px;'>${payDetails.bank_swift}</code></li>` : ''}
                    </ul>
                    <p>Reference Order ID: <strong>${orderId}</strong>. Confirm via <a href="${waConfirmationLink}" style='color: #2C5F41;'>${waNumDisp}</a>.</p>
                </div>`;
            }

            if (record.get("delivery_option") === "home_delivery" && record.get("delivery_address")) {
                emailBody += `
                    <h3 style='color: #8B4513; border-bottom: 2px solid #D2B48C; padding-bottom: 5px;'>🚚 Delivery Details</h3>
                    <div style='background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 10px 0;'>
                        <p><strong>📍 Address:</strong> ${record.get("delivery_address")}</p>
                        <p><strong>🏙️ Area:</strong> ${record.get("delivery_area_name_en") || record.get("delivery_city_id") || 'N/A'}</p>
                        <p><strong>⏰ Preferred Time:</strong> ${record.get("delivery_time_slot") || 'Flexible'}</p>
                        ${record.get("delivery_instructions") ? `<p><strong>📝 Instructions:</strong> ${record.get("delivery_instructions")}</p>` : ''}
                    </div>`;
            } else if (record.get("delivery_option") === "international_shipping") {
                emailBody += `
                    <h3 style='color: #8B4513; border-bottom: 2px solid #D2B48C; padding-bottom: 5px;'>🌍 International Shipping</h3>
                    <div style='background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 10px 0;'>
                        <p><strong>🌎 Country:</strong> ${record.get("customer_country") || 'International'}</p>
                        <p>📦 International shipping arrangements will be coordinated separately after payment confirmation.</p>
                    </div>`;
            }
            
            if (appSettings?.get("slaughter_location_gmaps_url")) {
                let hasUdheyaStandardService = lineItems.some(item => item.product_category === 'udheya' && item.udheya_details?.serviceOption === 'standard_service');
                if (hasUdheyaStandardService) {
                    emailBody += `
                        <div style='background: #f0ebe3; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                            <p>🏭 <strong>Our Certified Slaughter Facility:</strong> <a href="${appSettings.get("slaughter_location_gmaps_url")}" style='color: #2C5F41;'>📍 View Location on Maps</a></p>
                            <p style='font-size: 14px; color: #666;'>All Udheya services are performed according to Islamic guidelines with full Halal certification.</p>
                        </div>`;
                }
            }
            
            emailBody += `
                    <div style='background: #2C5F41; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;'>
                        <h3 style='margin: 0 0 10px 0;'>📞 Need Help?</h3>
                        <p style='margin: 0; font-size: 16px;'>Contact us via WhatsApp: <a href="${waConfirmationLink}" style='color: #D2B48C; text-decoration: none;'>${waNumDisp}</a></p>
                    </div>
                    
                    <div style='text-align: center; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;'>
                        <p style='margin: 0;'>🐑 <strong>Sheep Land Egypt</strong> - Your trusted partner for premium live sheep</p>
                        <p style='margin: 5px 0 0 0; font-size: 14px;'>Serving Egypt and international customers with quality guaranteed</p>
                    </div>
                </div>
            </div>`;
            
            const message = new MailerMessage({
                from: { address: senderAddress, name: senderName },
                to: [{ address: customerEmail }],
                subject: `🐑 Your Sheep Land Egypt Order Confirmed: ${record.get("order_id_text")}`,
                html: emailBody
            });
            $mails.send(message);
            
            // Confirmation email sent successfully
        } catch (err) {
            console.error(`[OrderHook] Failed to send email for order ${record.get("order_id_text")}: ${err}`);
        }
    } else if (customerEmail) {
        // Email not sent: SMTP may not be configured
    } else if (!customerEmail) {
        // Email not sent: No customer email provided
    }
});

// Before Update Hook for Orders
onRecordUpdateRequest((e) => {
    if (e.collection.name !== "orders") return;
    
    const record = e.record; 
    let originalRecord;
    try {
        originalRecord = $app.dao().findRecordById("orders", record.getId());
    } catch (err) { 
        // Could not find original record
        return; 
    }

    const oldStatus = originalRecord.get("order_status") || "";
    const newStatus = record.get("order_status");
    const paymentStatus = record.get("payment_status"); 
    
    if ((newStatus === "cancelled_by_user" || newStatus === "cancelled_by_admin") && oldStatus !== newStatus) {
        const cancellableStates = ["pending_confirmation", "confirmed_pending_payment", "awaiting_payment_gateway", "payment_confirmed_processing"];
        let shouldRestock = true;

        if (paymentStatus === "paid_confirmed" || paymentStatus.startsWith("cod_confirmed")) { 
            if (oldStatus === "fulfilled_completed" || oldStatus === "out_for_delivery" || oldStatus === "ready_for_fulfillment") {
                 shouldRestock = false; 
            }
        }
        
        if (cancellableStates.includes(oldStatus) && shouldRestock) {
            const lineItems = record.get("line_items") || []; 
            let stockUpdateNotes = "";

            for (const lineItem of lineItems) {
                const productID = lineItem.item_key_pb; 
                const quantityToRestock = lineItem.quantity;

                if (productID && quantityToRestock > 0) {
                    try {
                        const product = $app.dao().findRecordById("products", productID);
                        const currentStock = product.get("stock_available_pb");
                        product.set("stock_available_pb", currentStock + quantityToRestock);
                        $app.dao().save(product);
                        stockUpdateNotes += `Restocked ${quantityToRestock} of ${product.get("variant_name_en") || lineItem.name_en}. `;
                    } catch (err) {
                         console.error(`[OrderHook] Failed to restock product ${productID}: ${err}`);
                         stockUpdateNotes += `STOCK INCREMENT FAILED for product ${productID}. `;
                    }
                }
            }
            record.set("admin_notes", (record.get("admin_notes") || "" + `\nOrder Cancellation: ${stockUpdateNotes}`).trim());
        } else {
            record.set("admin_notes", (record.get("admin_notes") || "" + `\nOrder cancelled (old status: ${oldStatus}, payment: ${paymentStatus}). Stock not auto-incremented.`).trim());
        }
    }
});

