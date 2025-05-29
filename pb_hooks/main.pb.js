/**
 * !!! IMPORTANT DEPLOYMENT NOTE !!!
 * To make this /api/custom_place_order route active:
 * 1. This file (main.pb.js) MUST be placed in the `pb_hooks` directory
 *    relative to your PocketBase executable.
 * 2. You MUST restart your PocketBase server after placing or modifying
 *    this file in the `pb_hooks` directory.
 * 3. Check the PocketBase server console output for any errors during
 *    hook loading.
 *
 * This hook handles custom order placement logic, including stock updates,
 * and server-side calculation of prices and fees.
 * /// <reference path="../pb_data/types.d.ts" />
 */

routerAdd("POST", "/api/custom_place_order", (c) => {
    let requestData;
    try {
        requestData = $apis.requestInfo(c).data;
        if (typeof requestData !== 'object' || requestData === null) {
            throw new Error("Request data is not a valid object.");
        }
    } catch (e) {
        console.error("[Hook Error] Failed to parse request data for /api/custom_place_order:", e);
        return c.json(400, { error: "Invalid request payload. JSON object expected." });
    }

    // Essential fields from client
    if (!requestData.product_item_key) { return c.json(400, { error: "Missing 'product_item_key' in request." }); }
    if (!requestData.order_id_text) { return c.json(400, { error: "Missing 'order_id_text' in request." }); }
    if (!requestData.udheya_service_option_selected) { return c.json(400, { error: "Missing 'udheya_service_option_selected'." }); }
    // ... add more checks for absolutely essential fields if needed

    let createdOrderPocketBaseId = null;
    let finalStockLevel = null;
    let serverCalculatedTotal = 0; // To be returned to client

    const authRecord = $apis.requestInfo(c).authRecord;

    try {
        $app.dao().runInTransaction(async (txDao) => {
            const productItemKey = requestData.product_item_key;
            const quantityToOrder = parseInt(requestData.quantity) || 1;

            // 1. Fetch Product
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
                throw new Error(`Insufficient stock for product '${productItemKey}'. Available: ${currentStock}, Requested: ${quantityToOrder}.`);
            }

            // 2. Fetch Settings for fees
            const settingsRecord = txDao.findFirstRecordByFilter("settings", "id!=''"); // Get the first (should be only) settings record
            if (!settingsRecord) {
                throw new Error("Application settings not found. Cannot calculate fees.");
            }
            const generalServiceFeeEGP = settingsRecord.getFloat("servFeeEGP") || 0;
            const deliveryAreas = settingsRecord.get("delAreas"); // This is a JSON field

            // 3. Calculate Fees Server-Side
            let animalPriceEGP = productRecord.getFloat("base_price_egp");
            let serviceFeeAppliedEGP = 0;
            if (requestData.udheya_service_option_selected === "standard_service") {
                serviceFeeAppliedEGP = generalServiceFeeEGP;
            }

            let deliveryFeeAppliedEGP = 0;
            if (requestData.delivery_option === "home_delivery_to_orderer" && requestData.delivery_area_id) {
                let foundCityFee = null;
                if (deliveryAreas && Array.isArray(deliveryAreas)) {
                    for (const gov of deliveryAreas) {
                        if (gov.cities && Array.isArray(gov.cities)) {
                            const city = gov.cities.find(c => `${gov.id}_${c.id}` === requestData.delivery_area_id);
                            if (city && typeof city.delivery_fee_egp === 'number') {
                                foundCityFee = city.delivery_fee_egp;
                                break;
                            }
                        } else if (gov.id === requestData.delivery_area_id && typeof gov.delivery_fee_egp === 'number') {
                            // Case where delivery_area_id might be just the governorate ID if no sub-cities
                            foundCityFee = gov.delivery_fee_egp;
                            break;
                        }
                    }
                }
                if (foundCityFee === null) {
                    // Either area_id not found, or fee is null (variable, to be confirmed manually)
                    // For now, if fee is null in config, we assume 0 for auto-calc and admin will adjust
                    console.warn(`Delivery fee for area_id '${requestData.delivery_area_id}' not found or is variable. Applying 0 for now.`);
                    deliveryFeeAppliedEGP = 0; // Or could throw error if fee must be fixed
                } else {
                    deliveryFeeAppliedEGP = foundCityFee;
                }
            }
            
            serverCalculatedTotal = animalPriceEGP + serviceFeeAppliedEGP + deliveryFeeAppliedEGP;

            // 4. Create the new order record
            const ordersCollection = txDao.findCollectionByNameOrId("orders");
            const newOrder = new Record(ordersCollection);

            if (authRecord) { newOrder.set("user", authRecord.id); }

            newOrder.set("order_id_text", requestData.order_id_text);
            newOrder.set("product_id", productRecord.id);
            
            // Derived from productRecord
            newOrder.set("ordered_product_name_en", productRecord.getString("variant_name_en"));
            newOrder.set("ordered_product_name_ar", productRecord.getString("variant_name_ar"));
            newOrder.set("ordered_weight_range_en", productRecord.getString("weight_range_text_en"));
            newOrder.set("ordered_weight_range_ar", productRecord.getString("weight_range_text_ar"));
            newOrder.set("price_at_order_time_egp", animalPriceEGP);
            
            // Fees and Total (Server Calculated)
            newOrder.set("service_fee_applied_egp", serviceFeeAppliedEGP);
            newOrder.set("delivery_fee_applied_egp", deliveryFeeAppliedEGP);
            newOrder.set("total_amount_due_egp", serverCalculatedTotal);

            // Cost of animal for P&L (can be from request if specific animal, or general estimate)
            let costOfAnimalEGP = parseFloat(requestData.cost_of_animal_egp) || 0; // Default to 0 if not provided

            // Set other fields from requestData
            newOrder.set("udheya_service_option_selected", requestData.udheya_service_option_selected);
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
            newOrder.set("delivery_area_name_en", requestData.delivery_area_name_en); // Can be derived from area_id if needed
            newOrder.set("delivery_area_name_ar", requestData.delivery_area_name_ar); // Can be derived from area_id if needed
            newOrder.set("delivery_address", requestData.delivery_address);
            newOrder.set("delivery_instructions", requestData.delivery_instructions);
            newOrder.set("time_slot", requestData.time_slot);
            newOrder.set("payment_method", requestData.payment_method);
            
            // Set initial statuses (server-side decision)
            if (requestData.payment_method === 'cod') {
                newOrder.set("payment_status", "cod_pending_confirmation");
                newOrder.set("order_status", "pending_confirmation"); // Requires phone confirmation
            } else {
                newOrder.set("payment_status", "pending_payment");
                newOrder.set("order_status", "confirmed_pending_payment");
            }

            newOrder.set("terms_agreed", requestData.terms_agreed === true);
            newOrder.set("admin_notes", requestData.admin_notes);
            newOrder.set("group_purchase_interest", requestData.group_purchase_interest === true);

            const clientIp = c.realIp();
            if (clientIp) { newOrder.set("user_ip_address", clientIp); }
            const userAgent = c.request().headers.get("User-Agent");
            if (userAgent) { newOrder.set("user_agent_string", userAgent.substring(0,300)); }

            // If a specific animal_tag_id was part of the order request
            if (requestData.animal_tag_id) {
                const animalRecord = txDao.findFirstRecordByFilter(
                    "sheep_log",
                    "animal_tag_id = {:tagId} && current_status = 'Active'",
                    { tagId: requestData.animal_tag_id }
                );
                if (animalRecord) {
                    newOrder.set("animal_id", animalRecord.id);
                    // If cost_of_animal_egp wasn't provided directly in request, get it from sheep_log
                    if (!requestData.cost_of_animal_egp) { // Only if not already set from request
                        costOfAnimalEGP = animalRecord.getFloat("acquisition_cost_egp") || 0;
                    }
                    // animalRecord status updated after order save, see below
                } else {
                    console.warn(`[Hook Warn] Specific animal with tag_id ${requestData.animal_tag_id} not found or not active. Order created without specific animal link.`);
                    // Decide if this should be an error if specific animal is mandatory for some flows
                    // throw new Error(`Animal with tag_id '${requestData.animal_tag_id}' not found or not available.`);
                }
            }
            newOrder.set("cost_of_animal_egp", costOfAnimalEGP); // Set final cost
            
            txDao.saveRecord(newOrder);
            createdOrderPocketBaseId = newOrder.getId();

            // If a specific animal was linked, update its sale_order_id and status now
            if (newOrder.get("animal_id")) { // Check if animal_id was actually set
                 const animalToUpdate = txDao.findRecordById("sheep_log", newOrder.getString("animal_id"));
                 if (animalToUpdate) {
                    animalToUpdate.set("sale_order_id", createdOrderPocketBaseId); 
                    animalToUpdate.set("current_status", "Sold");
                    txDao.saveRecord(animalToUpdate);
                    console.log(`[Hook Info] Animal ${animalToUpdate.getString("animal_tag_id")} status updated to Sold and linked to order ${newOrder.getString("order_id_text")}.`);
                 }
            }

            // 5. Update product stock
            finalStockLevel = currentStock - quantityToOrder;
            productRecord.set("stock_available_pb", finalStockLevel);
            txDao.saveRecord(productRecord);

            console.log(`[Hook Success] Order ${newOrder.getString("order_id_text")} created. Product ${productItemKey} stock updated to ${finalStockLevel}. User: ${authRecord ? authRecord.id : 'Anonymous'}`);
        });

        return c.json(200, {
            message: "Order placed successfully.",
            order_id_text: requestData.order_id_text,
            id: createdOrderPocketBaseId, // PocketBase ID of the created order
            new_stock_level: finalStockLevel,
            total_amount_due_egp: serverCalculatedTotal // Return server-calculated total
        });

    } catch (err) {
        console.error(`[Hook Error] /api/custom_place_order transaction failed: ${err.message}`, err);
        let statusCode = 500; // Default to Internal Server Error
        let clientErrorMessage = "Failed to process order due to an internal error.";

        if (err.message) {
            if (err.message.includes("not found or is inactive")) {
                statusCode = 404; // Or 409 Conflict if preferred for "unavailable"
                clientErrorMessage = "The selected product is not available or is inactive.";
            } else if (err.message.includes("Insufficient stock")) {
                statusCode = 409; // Conflict - resource state prevents completion
                clientErrorMessage = "Insufficient stock for the selected product.";
            } else if (err.message.includes("Application settings not found")) {
                statusCode = 503; // Service Unavailable - critical config missing
                clientErrorMessage = "Order placement is temporarily unavailable. Please try again later.";
            } else {
                // For other specific known errors, map them here.
                // Otherwise, keep generic for unknown internal issues.
                clientErrorMessage = "Failed to process order: " + err.message; // More detailed for dev, maybe too much for prod
            }
        }
        
        return c.json(statusCode, { error: clientErrorMessage });
    }
});

// Example: Add a health check endpoint (optional)
routerAdd("GET", "/api/health", (c) => {
    return c.json(200, { message: "API is healthy" });
});
