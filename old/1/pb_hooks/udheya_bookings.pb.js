// pb_hooks/udheya_bookings.pb.js

/**
 * Hook: Before creating a booking, check stock from livestock_options.
 */
onRecordBeforeCreate(async (e) => {
    const record = e.record;
    const pb = $app;
    const animalValueKey = record.get("selected_livestock_type_key");
    const animalWeightRange = record.get("animal_weight_selected"); // Ensure client sends this matching a weight_range

    if (!animalValueKey || !animalWeightRange) throw new BadRequestError("Animal type key or weight not specified for stock check.");

    let livestockOption;
    try {
        livestockOption = await pb.collection('livestock_options').getFirstListItem(`type_key="${animalValueKey}" && is_globally_active=true`);
    } catch (err) {
        console.error(`Hook: Error fetching livestock option for stock check: ${animalValueKey}`, err);
        throw new UnprocessableEntityError("Selected animal type is not available or issue verifying stock.");
    }

    const weightsPrices = livestockOption.get("weights_prices"); // This is a JSON array
    if (!weightsPrices || !Array.isArray(weightsPrices)) throw new UnprocessableEntityError("Stock information is misconfigured for this animal.");

    const weightTier = weightsPrices.find(wp => wp.weight_range === animalWeightRange);
    if (!weightTier) throw new UnprocessableEntityError("Selected weight category not found for stock check.");

    if (weightTier.is_active === false || typeof weightTier.stock !== 'number' || weightTier.stock <= 0) {
        const animalName = record.get("animal_type") || animalValueKey; // animal_type is the display name
        throw new BadRequestError(`Sorry, ${animalName} (${animalWeightRange}) is currently out of stock or unavailable.`);
    }
}, "udheya_bookings");


/**
 * Hook: After creating a booking, decrement stock and send emails.
 */
onRecordAfterCreate(async (e) => {
    const record = e.record;
    const pb = $app;
    const animalValueKey = record.get("selected_livestock_type_key");
    const animalWeightRange = record.get("animal_weight_selected");

    // --- Decrement Stock ---
    if (animalValueKey && animalWeightRange) {
        try {
            const livestockOption = await pb.collection('livestock_options').getFirstListItem(`type_key="${animalValueKey}"`);
            let weightsPrices = livestockOption.get("weights_prices") || [];
            let stockUpdated = false;
            const updatedWeightsPrices = weightsPrices.map(wp => {
                if (wp.weight_range === animalWeightRange) {
                    if (wp.is_active !== false && typeof wp.stock === 'number' && wp.stock > 0) {
                        wp.stock -= 1; stockUpdated = true;
                    } else { console.warn(`Stock for ${animalValueKey}-${animalWeightRange} was <=0, inactive, or invalid. Booking: ${record.get("booking_id_text")}`); }
                }
                return wp;
            });
            if (stockUpdated) {
                await pb.collection('livestock_options').update(livestockOption.id, { weights_prices: updatedWeightsPrices });
                console.log(`Stock decremented for ${animalValueKey}-${animalWeightRange}. New: ${updatedWeightsPrices.find(wp=>wp.weight_range === animalWeightRange)?.stock}. Booking: ${record.get("booking_id_text")}`);
            }
        } catch (err) {
            console.error(`CRITICAL: Stock decrement failed for ${animalValueKey}-${animalWeightRange}, Booking: ${record.get("booking_id_text")}:`, err);
            let adminEmailsSetting = ["YOUR_FALLBACK_ADMIN_EMAIL@example.com"]; // Fallback
            let siteNameSetting = "Sheep Land"; // Fallback
            try {
                const appSettingsRecords = await pb.collection('app_settings').getFullList({filter: `setting_key="admin_notification_emails" || setting_key="site_name"`});
                adminEmailsSetting = appSettingsRecords.find(s => s.setting_key === "admin_notification_emails")?.value_json?.emails || adminEmailsSetting;
                siteNameSetting = appSettingsRecords.find(s => s.setting_key === "site_name")?.value_json?.name || siteNameSetting;
            } catch (settingErr) { console.error("Failed to load settings for critical alert:", settingErr); }

            const urgentMsg = new MailerMessage({ from: { address: pb.settings().meta.senderAddress, name: `${siteNameSetting} Stock Alert` }, to: adminEmailsSetting.map(email => ({address: email})), subject: `CRITICAL: Stock Decrement Failed for Booking ${record.get("booking_id_text")}`, html: `<p>Booking ${record.get("booking_id_text")} was created, but stock decrement failed for ${animalValueKey} - ${animalWeightRange}. Check stock manually.</p><p>Error: ${err.message}</p>`});
            try { await pb.newMailClient().send(urgentMsg); } catch (mailErr) { console.error("Failed to send critical stock alert email:", mailErr); }
        }
    }

    // --- Email Notifications ---
    let adminEmails = ["YOUR_ADMIN_EMAIL@example.com"]; // Fallback
    let siteName = "Sheep Land"; // Fallback
    try {
        const appSettingsRecords = await pb.collection('app_settings').getFullList({filter: `setting_key="admin_notification_emails" || setting_key="site_name"`});
        adminEmails = appSettingsRecords.find(s => s.setting_key === "admin_notification_emails")?.value_json?.emails || adminEmails;
        siteName = appSettingsRecords.find(s => s.setting_key === "site_name")?.value_json?.name || siteName;
    } catch (settingErr) { console.error("Failed to load settings for email notifications:", settingErr); }


    const bookingId = record.get("booking_id_text");
    const animalTypeDisplay = record.get("animal_type"); // This should be the display name (e.g., "Baladi Sheep")
    const customerEmail = record.get("customer_email");
    const currencyUsed = record.get("currency_used");
    const priceInSelectedCurrency = record.get("price_in_selected_currency");

    const adminSubject = `New Udheya Booking on ${siteName}: ${bookingId}`;
    let adminHtmlBody = `<p>New booking: ${bookingId} for ${animalTypeDisplay} - ${animalWeightRange}. Phone: ${record.get("delivery_phone")}.</p>`;
    adminHtmlBody += `<ul><li>Total (EGP): ${record.get("total_price_egp")} EGP</li><li>Total (${currencyUsed}): ${priceInSelectedCurrency} ${currencyUsed}</li></ul>`;
    adminHtmlBody += `<p><a href="${pb.settings().meta.appUrl}/_/collections/udheya_bookings/records/${record.id}">View Booking in Admin</a></p>`;
    const adminMessage = new MailerMessage({ from: { address: pb.settings().meta.senderAddress, name: pb.settings().meta.senderName || siteName }, to: adminEmails.map(e => ({address: e})), subject: adminSubject, html: adminHtmlBody });
    try { await pb.newMailClient().send(adminMessage); } catch (err) { console.error(`Failed to send admin email for ${bookingId}:`, JSON.stringify(err)); }

    if (customerEmail) {
        const customerSubject = `Your ${siteName} Udheya Booking Confirmed: ${bookingId}`;
        const customerHtmlBody = `<p>Dear Customer, Thank you for your Udheya booking with ${siteName}! Your booking ID <strong>${bookingId}</strong> has been received. Status: <strong>${record.get("status")}</strong>.</p><p>Details: ${animalTypeDisplay} - ${animalWeightRange}, Prep: ${record.get("prep_style_value")}, Total: ${priceInSelectedCurrency} ${currencyUsed}.</p><p>Sincerely,<br>The ${siteName} Team</p>`;
        const customerMessage = new MailerMessage({ from: { address: pb.settings().meta.senderAddress, name: pb.settings().meta.senderName || siteName }, to: [{ address: customerEmail }], subject: customerSubject, html: customerHtmlBody });
        try { await pb.newMailClient().send(customerMessage); } catch (err) { console.error(`Failed to send customer email for ${bookingId}:`, JSON.stringify(err)); }
    }
}, "udheya_bookings");


onRecordAfterUpdate(async (e) => {
    const record = e.record; const oldRecord = e.oldRecord; const pb = $app;
    if (record.get("status") !== oldRecord.get("status") && record.get("customer_email")) {
        let siteName = "Sheep Land"; // Fallback
        try {
            const siteNameSettingRec = await pb.collection('app_settings').getFirstListItem(`setting_key="site_name"`);
            siteName = siteNameSettingRec?.value_json?.name || siteName;
        } catch (settingErr) { console.error("Failed to load site_name for status update email:", settingErr); }

        const bookingId = record.get("booking_id_text"); const newStatus = record.get("status");
        const customerEmail = record.get("customer_email");
        const subject = `${siteName} Booking Update: ID ${bookingId} is now ${newStatus}`;
        const htmlBody = `<p>Dear Customer,</p><p>The status of your Udheya booking (ID: <strong>${bookingId}</strong>) has been updated to: <strong>${newStatus}</strong>.</p><p>The ${siteName} Team</p>`;
        const message = new MailerMessage({ from: { address: pb.settings().meta.senderAddress, name: pb.settings().meta.senderName || siteName }, to: [{ address: customerEmail }], subject, html: htmlBody });
        try { await pb.newMailClient().send(message); } catch (err) { console.error(`Failed to send status update email for ${bookingId}:`, JSON.stringify(err)); }
    }
}, "udheya_bookings");