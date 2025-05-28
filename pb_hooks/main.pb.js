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
    if (!requestData.order_id_text) {
        return c.json(400, { error: "Missing 'order_id_text' in request." });
    }

    let createdOrderPocketBaseId = null;
    let finalStockLevel = null;
    const authRecord = $apis.requestInfo(c).authRecord; // Get authenticated user if any

    try {
        $app.dao().runInTransaction(async (txDao) => {
            const productItemKey = requestData.product_item_key;
            const quantityToOrder = requestData.quantity || 1;

            // 1. Fetch the product to check stock and get details
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

            // 2. Create the new order record
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
            
            // P&L: Set cost_of_animal_egp if provided (could come from client if specific animal is selected)
            if (requestData.cost_of_animal_egp !== undefined && requestData.cost_of_animal_egp !== null) {
                newOrder.set("cost_of_animal_egp", parseFloat(requestData.cost_of_animal_egp) || 0);
            }

            // Set other fields from requestData
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
            newOrder.set("terms_agreed", requestData.terms_agreed === true);
            newOrder.set("admin_notes", requestData.admin_notes);
            newOrder.set("group_purchase_interest", requestData.group_purchase_interest === true);

            const clientIp = c.realIp();
            if (clientIp) { newOrder.set("user_ip_address", clientIp); }
            const userAgent = c.request().headers.get("User-Agent");
            if (userAgent) { newOrder.set("user_agent_string", userAgent.substring(0,300)); }

            // If a specific animal_tag_id was part of the order request (for specific animal sale)
            if (requestData.animal_tag_id) {
                const animalRecord = txDao.findFirstRecordByFilter(
                    "sheep_log",
                    "animal_tag_id = {:tagId} && current_status = 'Active'", // Ensure it's an active animal
                    { tagId: requestData.animal_tag_id }
                );
                if (animalRecord) {
                    newOrder.set("animal_id", animalRecord.id); // Link order to the specific animal
                    // If cost_of_animal_egp wasn't provided directly in request, get it from sheep_log
                    if (requestData.cost_of_animal_egp === undefined || requestData.cost_of_animal_egp === null) {
                        newOrder.set("cost_of_animal_egp", animalRecord.getFloat("acquisition_cost_egp") || 0);
                    }
                    // Update animal_log status
                    animalRecord.set("current_status", "Sold");
                    animalRecord.set("sale_order_id", newOrder.id); // This needs newOrder to be saved first or handle potential circularity if ID is needed before save.
                                                               // For now, we'll save newOrder first, then update animalRecord.
                } else {
                    console.warn(`[Hook Warn] Animal with tag_id ${requestData.animal_tag_id} not found or not active. Order will be created without specific animal link.`);
                    // Potentially throw error if specific animal selection is mandatory and not found
                    // throw new Error(`Animal with tag_id '${requestData.animal_tag_id}' not found or not available for sale.`);
                }
            }
            
            txDao.saveRecord(newOrder);
            createdOrderPocketBaseId = newOrder.getId(); // Get the ID after saving

            // If a specific animal was linked, update its sale_order_id now that newOrder has an ID
            if (requestData.animal_tag_id && newOrder.get("animal_id")) {
                 const animalToUpdate = txDao.findRecordById("sheep_log", newOrder.getString("animal_id"));
                 if (animalToUpdate) {
                    animalToUpdate.set("sale_order_id", createdOrderPocketBaseId); // Link animal to this order ID
                    animalToUpdate.set("current_status", "Sold"); // Re-ensure status is sold
                    txDao.saveRecord(animalToUpdate);
                    console.log(`[Hook Info] Animal ${animalToUpdate.getString("animal_tag_id")} status updated to Sold and linked to order ${newOrder.getString("order_id_text")}.`);
                 }
            }


            // 3. Update product stock
            finalStockLevel = currentStock - quantityToOrder;
            productRecord.set("stock_available_pb", finalStockLevel);
            txDao.saveRecord(productRecord);

            console.log(`[Hook Success] Order ${newOrder.getString("order_id_text")} created for product ${productItemKey}. Stock updated to ${finalStockLevel}. User: ${authRecord ? authRecord.id : 'Anonymous'}`);
        });

        return c.json(200, {
            message: "Order placed successfully and stock updated.",
            order_id_text: requestData.order_id_text,
            id: createdOrderPocketBaseId,
            new_stock_level: finalStockLevel
        });

    } catch (err) {
        console.error(`[Hook Error] /api/custom_place_order: ${err.message}`, err);
        let statusCode = 400;
        if (err.message && (err.message.includes("not found") || err.message.includes("Insufficient stock"))) {
            statusCode = 409;
        } else if (err.isAbort || err.name === 'AbortError') {
            statusCode = 503;
        } else {
            statusCode = 500;
        }
        return c.json(statusCode, { error: "Failed to process order: " + err.message });
    }
});