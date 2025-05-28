/** /// <reference path="../pb_data/types.d.ts" /> */

routerAdd("POST", "/api/custom_place_order", (c) => {
    let requestData;
    try {
        requestData = $apis.requestInfo(c).data;
    } catch (e) {
        console.error("[Hook Error] Failed to parse request data for /api/custom_place_order:", e);
        return c.json(400, { error: "Invalid request payload. JSON expected." });
    }

    if (!requestData || !requestData.product_item_key) {
        return c.json(400, { error: "Missing 'product_item_key' in request." });
    }
    // Check for order_id_text which should be sent from client (even if it's just a placeholder for server generation)
    if (!requestData.order_id_text) {
        return c.json(400, { error: "Missing 'order_id_text' in request." });
    }

    let createdOrderPocketBaseId = null;
    let finalStockLevel = null;
    const authRecord = $apis.requestInfo(c).authRecord;

    try {
        $app.dao().runInTransaction(async (txDao) => {
            const productItemKey = requestData.product_item_key;
            const quantityToOrder = requestData.quantity || 1;

            const productRecord = txDao.findFirstRecordByFilter(
                "products",
                "item_key = {:itemKey} && is_active = true",
                { itemKey: productItemKey }
            );

            if (!productRecord) {
                throw new Error(`Product with item_key '${productItemKey}' not found or is inactive.`);
            }

            const currentStock = productRecord.getInt("stock_available_pb");
            if (currentStock < quantityToOrder) {
                throw new Error(`Insufficient stock for product '${productItemKey}'. Available: ${currentStock}, Requested: ${quantityToOrder}`);
            }

            const ordersCollection = txDao.findCollectionByNameOrId("orders");
            const newOrder = new Record(ordersCollection);

            if (authRecord) {
                newOrder.set("user", authRecord.id);
            }

            newOrder.set("order_id_text", requestData.order_id_text);
            newOrder.set("product_id", productRecord.id);
            
            newOrder.set("ordered_product_name_en", productRecord.getString("variant_name_en"));
            newOrder.set("ordered_product_name_ar", productRecord.getString("variant_name_ar"));
            newOrder.set("ordered_weight_range_en", productRecord.getString("weight_range_text_en"));
            newOrder.set("ordered_weight_range_ar", productRecord.getString("weight_range_text_ar"));
            newOrder.set("price_at_order_time_egp", productRecord.getFloat("base_price_egp"));
            
            if (requestData.cost_of_animal_egp !== undefined && requestData.cost_of_animal_egp !== null) {
                newOrder.set("cost_of_animal_egp", parseFloat(requestData.cost_of_animal_egp) || 0);
            }

            newOrder.set("udheya_service_option_selected", requestData.udheya_service_option_selected);
            newOrder.set("service_fee_applied_egp", requestData.service_fee_applied_egp);
            newOrder.set("delivery_fee_applied_egp", requestData.delivery_fee_applied_egp);
            newOrder.set("total_amount_due_egp", requestData.total_amount_due_egp);
            newOrder.set("selected_display_currency", requestData.selected_display_currency);
            newOrder.set("sacrifice_day_value", requestData.sacrifice_day_value);
            newOrder.set("sacrifice_day_text_en", requestData.sacrifice_day_text_en);
            newOrder.set("sacrifice_day_text_ar", requestData.sacrifice_day_text_ar);
            newOrder.set("slaughter_viewing_preference", requestData.slaughter_viewing_preference);
            newOrder.set("distribution_choice", requestData.distribution_choice);
            newOrder.set("split_details_option", requestData.split_details_option);
            newOrder.set("custom_split_details_text", requestData.custom_split_details_text);
            newOrder.set("niyyah_names", requestData.niyyah_names);
            newOrder.set("ordering_person_name", requestData.ordering_person_name);
            newOrder.set("ordering_person_phone", requestData.ordering_person_phone);
            newOrder.set("customer_email", requestData.customer_email);
            newOrder.set("delivery_option", requestData.delivery_option);
            newOrder.set("delivery_name", requestData.delivery_name);
            newOrder.set("delivery_phone", requestData.delivery_phone);
            newOrder.set("delivery_area_id", requestData.delivery_area_id);
            newOrder.set("delivery_area_name_en", requestData.delivery_area_name_en);
            newOrder.set("delivery_area_name_ar", requestData.delivery_area_name_ar);
            newOrder.set("delivery_address", requestData.delivery_address);
            newOrder.set("delivery_instructions", requestData.delivery_instructions);
            newOrder.set("time_slot", requestData.time_slot);
            newOrder.set("payment_method", requestData.payment_method);
            newOrder.set("payment_status", requestData.payment_status);
            newOrder.set("order_status", requestData.order_status);
            newOrder.set("terms_agreed", requestData.terms_agreed === true); // Ensure boolean
            newOrder.set("admin_notes", requestData.admin_notes);
            newOrder.set("group_purchase_interest", requestData.group_purchase_interest === true); // Ensure boolean

            // Optional: Capture IP and User Agent if available and desired
            const clientIp = c.realIp() // Or c.request().remoteAddr if behind proxy not configured for realIp
            if (clientIp) {
                newOrder.set("user_ip_address", clientIp);
            }
            const userAgent = c.request().headers.get("User-Agent");
            if (userAgent) {
                newOrder.set("user_agent_string", userAgent.substring(0,300)); // Truncate if necessary
            }

            txDao.saveRecord(newOrder);
            createdOrderPocketBaseId = newOrder.getId();

            finalStockLevel = currentStock - quantityToOrder;
            productRecord.set("stock_available_pb", finalStockLevel);
            txDao.saveRecord(productRecord);

            console.log(`[Hook Success] Order ${newOrder.getString("order_id_text")} created for product ${productItemKey}. Stock updated to ${finalStockLevel}. User: ${authRecord ? authRecord.id : 'Anonymous'}`);
        });

        return c.json(200, {
            message: "Order placed successfully and stock updated.",
            order_id_text: requestData.order_id_text, // Return the client-sent or generated ID
            id: createdOrderPocketBaseId,
            new_stock_level: finalStockLevel
        });

    } catch (err) {
        console.error(`[Hook Error] /api/custom_place_order: ${err.message}`, err);
        let statusCode = 400;
        if (err.message && (err.message.includes("Variant not found") || err.message.includes("Insufficient stock"))) {
            statusCode = 409;
        } else if (err.isAbort || err.name === 'AbortError') {
            statusCode = 503;
        } else {
            statusCode = 500;
        }
        return c.json(statusCode, { error: "Failed to process order: " + err.message });
    }
});

// Optional hook: Update order status if a payment is marked as confirmed elsewhere
// This is a placeholder for more complex payment integration logic.
// For now, the client sets initial status, and admin would manually update via UI.
/*
onRecordAfterUpdateRequest((e) => {
    if (e.collection.name === "payments" && e.record.get("status") === "confirmed") {
        // Find related order and update its status
        const orderId = e.record.get("related_order_id"); // Assuming a 'payments' collection exists
        if (orderId) {
            try {
                const order = $app.dao().findRecordById("orders", orderId);
                if (order && order.get("payment_status") !== "paid_confirmed") {
                    order.set("payment_status", "paid_confirmed");
                    order.set("order_status", "payment_confirmed_processing");
                    $app.dao().saveRecord(order);
                    console.log(`Order ${order.get("order_id_text")} payment status updated to paid_confirmed via payment hook.`);
                }
            } catch (findErr) {
                console.error(`Error finding order ${orderId} to update payment status:`, findErr);
            }
        }
    }
}, "payments"); // Assuming you might have a 'payments' collection
*/