// pb_hooks/bookingHooks.js

/**
 * Hook that triggers after a new record in the 'bookings' collection is created.
 * Sends a booking confirmation email to the customer if an email is provided.
 */
onRecordAfterCreateRequest((e) => {
    console.log(`[SheepLand] Hook: onRecordAfterCreateRequest for collection '${e.collection.name}' triggered by record ID '${e.record.id}'.`);

    if (e.collection.name !== "bookings") {
        return; // Only process for 'bookings' collection
    }

    const booking = e.record;
    const customerEmail = booking.get("customer_email");

    if (!customerEmail || customerEmail.trim() === "") {
        console.log(`[SheepLand] Booking ID ${booking.get("booking_id_text") || booking.id}: No customer email provided, skipping confirmation email.`);
        return;
    }

    // --- Construct Email Subject & Body ---
    const bookingIdText = booking.get("booking_id_text") || booking.id;
    const animalNameEn = booking.get("animal_type_name_en") || booking.get("animal_type_key") || "Selected Animal";
    const animalWeight = booking.get("animal_weight_selected") || "N/A";
    const totalPriceEGP = booking.get("total_price_egp") || 0;
    const paymentMethod = booking.get("payment_method") ? booking.get("payment_method").replace("_", " ") : "Selected Method";
    const sacrificeDayValue = booking.get("sacrifice_day_value");
    const viewingPreference = booking.get("slaughter_viewing_preference");

    // Helper to get readable sacrifice day (can be expanded)
    let sacrificeDayText = sacrificeDayValue;
    if (sacrificeDayValue === "day1_10_dhul_hijjah") sacrificeDayText = "1st Day of Eid (10th Dhul Hijjah)";
    else if (sacrificeDayValue === "day2_11_dhul_hijjah") sacrificeDayText = "2nd Day of Eid (11th Dhul Hijjah)";
    else if (sacrificeDayValue === "day3_12_dhul_hijjah") sacrificeDayText = "3rd Day of Eid (12th Dhul Hijjah)";
    else if (sacrificeDayValue === "day4_13_dhul_hijjah") sacrificeDayText = "4th Day of Eid (13th Dhul Hijjah)";


    const subject = `Your Sheep Land Udheya Booking Confirmed! (ID: ${bookingIdText})`;

    let viewingPreferenceText = "";
    if (viewingPreference && viewingPreference !== "none") {
        if (viewingPreference === "physical_inquiry") {
            viewingPreferenceText = "<p>Regarding your preference to inquire about physical attendance for the slaughter: Our team will contact you soon to discuss arrangements and feasibility. Please note that physical attendance is subject to availability and prior confirmation, especially during peak Eid days.</p>";
        } else if (viewingPreference === "video_request") {
            viewingPreferenceText = "<p>Regarding your request for video/photos of the slaughter process: We will capture these for your Udheya and share them with you after the process is complete.</p>";
        } else if (viewingPreference === "live_video_inquiry") {
             viewingPreferenceText = "<p>Regarding your preference to inquire about a live video link for the slaughter: Our team will contact you soon to discuss arrangements and feasibility. Please note this is subject to technical capabilities and availability, especially during peak Eid days.</p>";
        }
    }


    const htmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #5D4037; color: #FAF8F5; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Sheep Land - أرض الأغنام</h1>
            </div>
            <div style="padding: 20px;">
                <h2 style="color: #3E2723; font-size: 20px;">JazakAllah Khairan for your Udheya booking!</h2>
                <p>Dear Customer,</p>
                <p>Your Udheya booking has been successfully confirmed. May Allah accept it from you.</p>
                
                <h3 style="color: #386641; border-bottom: 1px solid #A3B18A; padding-bottom: 5px; margin-top: 30px;">Booking Details:</h3>
                <ul style="list-style-type: none; padding-left: 0;">
                    <li style="margin-bottom: 8px;"><strong>Booking ID / رقم الحجز:</strong> ${bookingIdText}</li>
                    <li style="margin-bottom: 8px;"><strong>Animal / الحيوان:</strong> ${animalNameEn}, ${animalWeight}</li>
                    <li style="margin-bottom: 8px;"><strong>Sacrifice Day / يوم الذبح:</strong> ${sacrificeDayText || 'As per selection'}</li>
                    <li style="margin-bottom: 8px;"><strong>Order Subtotal / المجموع الفرعي للطلب:</strong> ${totalPriceEGP} EGP</li>
                </ul>

                ${viewingPreferenceText}

                <h3 style="color: #386641; border-bottom: 1px solid #A3B18A; padding-bottom: 5px; margin-top: 30px;">Next Steps & Payment:</h3>
                <p>
                    Instructions for your selected payment method (<strong>${paymentMethod}</strong>) have been displayed on our website upon booking completion.
                    If you have any questions or need to confirm payment, please contact us via WhatsApp.
                </p>
                <p>
                    يمكنك التحقق من حالة الحجز في أي وقت على موقعنا الإلكتروني باستخدام رقم الحجز الخاص بك.
                </p>
                
                <p style="margin-top: 30px;">Thank you for choosing Sheep Land.</p>
                <p>Sincerely,<br>The Sheep Land Team / فريق أرض الأغنام</p>
            </div>
            <div style="background-color: #f9f9f9; color: #777; padding: 15px; text-align: center; font-size: 12px;">
                <p style="margin:0;">This is an automated message. Please do not reply directly to this email.</p>
                <p style="margin:0;">If you did not make this booking, please contact us immediately.</p>
                <p style="margin:0;">© ${new Date().getFullYear()} Sheep Land. All rights reserved.</p>
            </div>
        </div>
    `;

    const message = new MailerMessage({
        from: {
            address: $app.settings().meta.senderAddress,
            name: $app.settings().meta.senderName,
        },
        to: [{ address: customerEmail }],
        subject: subject,
        html: htmlBody,
    });

    try {
        $app.newMailClient().send(message);
        console.log(`[SheepLand] Booking confirmation email sent to ${customerEmail} for Booking ID ${bookingIdText}.`);
    } catch (err) {
        console.error(`[SheepLand] Failed to send booking confirmation email for Booking ID ${bookingIdText} to ${customerEmail}:`, err);
    }

}, "bookings");


/**
 * Optional: Hook that triggers after a booking record is updated.
 * Example: Send an email when booking_status changes.
 */
/*
onRecordAfterUpdateRequest((e) => {
    console.log(`[SheepLand] Hook: onRecordAfterUpdateRequest for collection '${e.collection.name}' triggered for record ID '${e.record.id}'.`);

    if (e.collection.name !== "bookings") {
        return;
    }

    const booking = e.record;
    const oldBookingData = e.oldRecord;
    const customerEmail = booking.get("customer_email");

    if (!customerEmail || customerEmail.trim() === "") {
        console.log(`[SheepLand] Booking ID ${booking.get("booking_id_text") || booking.id}: No customer email for status update.`);
        return;
    }

    const bookingIdText = booking.get("booking_id_text") || booking.id;
    const newStatus = booking.get("booking_status");
    const oldStatus = oldBookingData.get("booking_status");

    if (newStatus !== oldStatus) {
        let subject = `Update on your Sheep Land Udheya Order (ID: ${bookingIdText})`;
        let htmlContent = `<p>Dear Customer,</p><p>There's an update on your Udheya order (ID: ${bookingIdText}).</p>`;

        if (newStatus === "processing") {
            htmlContent += "<p>Your order is now being processed. We will notify you of further updates.</p>";
        } else if (newStatus === "ready_for_delivery") {
            htmlContent += "<p>Your Udheya order is ready for delivery! Our team will contact you shortly to confirm the delivery window.</p>";
        } else if (newStatus === "delivered") {
            subject = `Your Sheep Land Udheya Order (ID: ${bookingIdText}) has been Delivered!`;
            htmlContent += "<p>Your Udheya order has been successfully delivered. JazakAllah Khairan!</p>";
        } else if (newStatus === "cancelled") {
            subject = `Your Sheep Land Udheya Order (ID: ${bookingIdText}) has been Cancelled`;
            htmlContent += "<p>We regret to inform you that your Udheya order has been cancelled. Please contact us if you have any questions.</p>";
        } else {
            // Generic update
             htmlContent += `<p>The status of your order has changed to: <strong>${newStatus.replace("_", " ")}</strong>.</p>`;
        }
        htmlContent += `<p>Thank you,<br>The Sheep Land Team</p>`;


        const message = new MailerMessage({
            from: { address: $app.settings().meta.senderAddress, name: $app.settings().meta.senderName },
            to: [{ address: customerEmail }],
            subject: subject,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${htmlContent}</div>`
        });

        try {
            $app.newMailClient().send(message);
            console.log(`[SheepLand] Status update email sent for Booking ID ${bookingIdText}. New status: ${newStatus}`);
        } catch (err) {
            console.error(`[SheepLand] Failed to send status update email for Booking ID ${bookingIdText}:`, err);
        }
    }
}, "bookings");
*/
