// Payment Processing Workflow
// Handles COD confirmations and prepares for payment gateway integration

// Payment confirmation endpoint
routerAdd("POST", "/api/payments/confirm", (c) => {
    const authRecord = c.get("authRecord");
    if (!authRecord) {
        return c.json(401, { error: "Authentication required" });
    }
    
    const body = $apis.requestInfo(c).data;
    const orderId = body.order_id;
    const paymentMethod = body.payment_method;
    const paymentDetails = body.payment_details || {};
    
    try {
        // Fetch the order
        const order = $app.dao().findRecordById("orders", orderId);
        
        // Verify order belongs to user or user is admin
        if (order.get("user_id") !== authRecord.id && !authRecord.get("is_admin")) {
            return c.json(403, { error: "Access denied" });
        }
        
        // Check order status
        if (order.get("status") !== "pending") {
            return c.json(400, { error: "Order is not in pending status" });
        }
        
        // Process based on payment method
        switch (paymentMethod) {
            case "cash_on_delivery":
                // For COD, just confirm the order
                order.set("status", "confirmed");
                order.set("payment_status", "pending");
                order.set("payment_confirmed_at", new Date().toISOString());
                break;
                
            case "bank_transfer":
                // For bank transfer, store reference number
                if (!paymentDetails.reference_number) {
                    return c.json(400, { error: "Bank transfer reference required" });
                }
                order.set("status", "payment_pending");
                order.set("payment_status", "awaiting_verification");
                order.set("payment_reference", paymentDetails.reference_number);
                order.set("payment_details", paymentDetails);
                break;
                
            case "online_card":
                // Placeholder for payment gateway integration
                return c.json(501, { 
                    error: "Online payment not yet implemented",
                    message: "Please use Cash on Delivery or Bank Transfer"
                });
                
            default:
                return c.json(400, { error: "Invalid payment method" });
        }
        
        // Save order
        $app.dao().saveRecord(order);
        
        // Log payment attempt
        try {
            const auditCollection = $app.dao().findCollectionByNameOrId("audit_logs");
            const auditRecord = new Record(auditCollection);
            auditRecord.set("action", "payment_confirmation");
            auditRecord.set("entity_type", "orders");
            auditRecord.set("entity_id", orderId);
            auditRecord.set("new_data", {
                payment_method: paymentMethod,
                payment_details: paymentDetails
            });
            auditRecord.set("user_id", authRecord.id);
            $app.dao().saveRecord(auditRecord);
        } catch (e) {
            console.error(`[PaymentProcessing] Audit log failed for order ${orderId}, method ${paymentMethod}: ${e.message}`);
        }
        
        // Send confirmation email
        try {
            const emailTemplate = $app.dao().findFirstRecordByFilter(
                "email_templates",
                "name = 'order_confirmation_ar'"
            );
            
            if (emailTemplate) {
                // Prepare email data
                const emailData = {
                    order_id: order.get("order_number"),
                    customer_name: order.get("customer_name"),
                    order_date: new Date(order.created).toLocaleDateString('ar-EG'),
                    total_amount: order.get("total_amount_egp"),
                    payment_method: paymentMethod === "cash_on_delivery" ? "الدفع عند التسليم" : "تحويل بنكي",
                    order_status: "مؤكد",
                    delivery_address: order.get("delivery_address"),
                    phone: order.get("phone"),
                    whatsapp_link: `https://wa.me/201234567890?text=طلب رقم ${order.get("order_number")}`
                };
                
                // Build order items list
                const lineItems = order.get("line_items") || [];
                let orderItemsHtml = '<ul dir="rtl">';
                lineItems.forEach(item => {
                    orderItemsHtml += `<li>${item.name_ar} - الكمية: ${item.quantity} - السعر: ${item.price_egp} جنيه</li>`;
                });
                orderItemsHtml += '</ul>';
                emailData.order_items = orderItemsHtml;
                
                // Replace placeholders in template
                let emailBody = emailTemplate.get("body");
                Object.keys(emailData).forEach(key => {
                    emailBody = emailBody.replace(new RegExp(`{{${key}}}`, 'g'), emailData[key]);
                });
                
                // Send email
                const message = new MailerMessage({
                    from: { 
                        address: $app.settings().meta.senderAddress || "noreply@sheep.land",
                        name: $app.settings().meta.senderName || "Sheep Land"
                    },
                    to: [{ address: order.get("email") }],
                    subject: emailTemplate.get("subject"),
                    html: emailBody
                });
                
                $mails.send(message);
            }
        } catch (e) {
            console.error(`[PaymentProcessing] Email failed for order ${orderId} to ${order.get("customer_email") ? order.get("customer_email").substring(0, 3) + '***' : 'unknown'}: ${e.message}`);
        }
        
        return c.json(200, {
            success: true,
            order_id: orderId,
            status: order.get("status"),
            payment_status: order.get("payment_status"),
            message: paymentMethod === "cash_on_delivery" ? 
                "Order confirmed! We will contact you soon." :
                "Payment reference received. We will verify and confirm."
        });
        
    } catch (error) {
        return c.json(500, { error: "Payment processing failed" });
    }
});

// Admin endpoint to verify bank transfers
routerAdd("POST", "/api/admin/payments/verify", (c) => {
    const authRecord = c.get("authRecord");
    if (!authRecord || !authRecord.get("is_admin")) {
        return c.json(403, { error: "Admin access required" });
    }
    
    const body = $apis.requestInfo(c).data;
    const orderId = body.order_id;
    const verified = body.verified;
    const notes = body.notes;
    
    try {
        const order = $app.dao().findRecordById("orders", orderId);
        
        if (order.get("payment_method") !== "bank_transfer") {
            return c.json(400, { error: "Order is not a bank transfer" });
        }
        
        if (verified) {
            order.set("status", "confirmed");
            order.set("payment_status", "paid");
            order.set("payment_verified_at", new Date().toISOString());
            order.set("payment_verified_by", authRecord.id);
        } else {
            order.set("status", "payment_failed");
            order.set("payment_status", "failed");
            order.set("payment_notes", notes);
        }
        
        $app.dao().saveRecord(order);
        
        // Send status update email
        try {
            const template = verified ? "order_confirmation_ar" : "order_status_update_ar";
            // Email sending logic here...
        } catch (e) {
            console.error(`[PaymentProcessing] Verification email failed for order ${orderId}: ${e.message}`);
        }
        
        return c.json(200, {
            success: true,
            order_id: orderId,
            payment_status: order.get("payment_status")
        });
        
    } catch (error) {
        return c.json(500, { error: "Verification failed" });
    }
});

// Get payment methods with availability
routerAdd("GET", "/api/payments/methods", (c) => {
    const settings = $app.dao().findFirstRecordByFilter("settings", "");
    
    const methods = [
        {
            id: "cash_on_delivery",
            name: { en: "Cash on Delivery", ar: "الدفع عند التسليم" },
            available: true,
            description: { 
                en: "Pay when you receive your order", 
                ar: "ادفع عند استلام طلبك" 
            },
            fee: settings?.get("cod_fee") || 0
        },
        {
            id: "bank_transfer",
            name: { en: "Bank Transfer", ar: "تحويل بنكي" },
            available: true,
            description: { 
                en: "Transfer to our bank account", 
                ar: "حول إلى حسابنا البنكي" 
            },
            accounts: [
                {
                    bank: "CIB",
                    account_number: "1234567890",
                    account_name: "Sheep Land Egypt"
                }
            ]
        },
        {
            id: "online_card",
            name: { en: "Credit/Debit Card", ar: "بطاقة ائتمان/خصم" },
            available: false,
            description: { 
                en: "Coming soon", 
                ar: "قريبا" 
            },
            message: {
                en: "Online payment will be available soon",
                ar: "الدفع الإلكتروني سيكون متاحا قريبا"
            }
        },
        {
            id: "instapay",
            name: { en: "InstaPay", ar: "انستاباي" },
            available: settings?.get("instapay_enabled") || false,
            description: { 
                en: "Instant payment via InstaPay", 
                ar: "دفع فوري عبر انستاباي" 
            },
            phone: settings?.get("instapay_phone") || ""
        }
    ];
    
    return c.json(200, { payment_methods: methods });
});

// Cancel order endpoint
routerAdd("POST", "/api/orders/{id}/cancel", (c) => {
    const authRecord = c.get("authRecord");
    if (!authRecord) {
        return c.json(401, { error: "Authentication required" });
    }
    
    const orderId = c.pathParam("id");
    const body = $apis.requestInfo(c).data;
    const reason = body.reason || "Customer request";
    
    try {
        const order = $app.dao().findRecordById("orders", orderId);
        
        // Check ownership
        if (order.get("user_id") !== authRecord.id && !authRecord.get("is_admin")) {
            return c.json(403, { error: "Access denied" });
        }
        
        // Check if cancellable
        const cancelableStatuses = ["pending", "confirmed", "payment_pending"];
        if (!cancelableStatuses.includes(order.get("status"))) {
            return c.json(400, { error: "Order cannot be cancelled in current status" });
        }
        
        // Check cancellation time limit
        const settings = $app.dao().findFirstRecordByFilter("settings", "");
        const cancellationHours = settings?.get("order_cancellation_hours") || 24;
        const orderAge = (new Date() - new Date(order.created)) / (1000 * 60 * 60);
        
        if (orderAge > cancellationHours && !authRecord.get("is_admin")) {
            return c.json(400, { 
                error: `Orders can only be cancelled within ${cancellationHours} hours` 
            });
        }
        
        // Cancel order
        order.set("status", "cancelled");
        order.set("cancelled_at", new Date().toISOString());
        order.set("cancelled_by", authRecord.id);
        order.set("cancellation_reason", reason);
        
        // Restore stock
        const lineItems = order.get("line_items") || [];
        lineItems.forEach(item => {
            try {
                const product = $app.dao().findRecordById("products", item.item_key_pb);
                const currentStock = product.get("current_stock_units") || 0;
                product.set("current_stock_units", currentStock + item.quantity);
                $app.dao().saveRecord(product);
            } catch (e) {
                console.error(`[PaymentProcessing] Stock restoration failed for product ${item.item_key_pb}, quantity ${item.quantity}: ${e.message}`);
            }
        });
        
        $app.dao().saveRecord(order);
        
        return c.json(200, {
            success: true,
            order_id: orderId,
            status: "cancelled",
            message: "Order cancelled successfully"
        });
        
    } catch (error) {
        return c.json(500, { error: "Cancellation failed" });
    }
});