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
        console.error("[API Hook /api/custom_place_order] Failed to parse request data:", e);
        return c.json(400, { error: "Invalid request payload. JSON object expected." });
    }

    // --- Essential field validation from client ---
    const requiredFields = [
        "product_item_key", "order_id_text", "udheya_service_option_selected",
        "sacrifice_day_value", "ordering_person_name", "ordering_person_phone", "payment_method"
    ];
    for (const field of requiredFields) {
        if (!requestData[field]) {
            return c.json(400, { error: `Missing essential field in request: '${field}'.` });
        }
    }
    if (requestData.delivery_option === "home_delivery_to_orderer" && !requestData.delivery_area_id) {
        return c.json(400, { error: "Missing 'delivery_area_id' for home delivery option."});
    }
    // --- End Essential Field Validation ---

    let createdOrderPocketBaseId = null;
    let finalStockLevel = null;
    let serverCalculatedTotalEGP = 0;
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
                console.warn(`[API Hook] Product not found or inactive: ${productItemKey}`);
                throw new Error(`Product with item_key '${productItemKey}' not found or is inactive.`);
            }

            const currentStock = productRecord.getInt("stock_available_pb");
            if (currentStock < quantityToOrder) {
                console.warn(`[API Hook] Insufficient stock for ${productItemKey}. Available: ${currentStock}, Requested: ${quantityToOrder}`);
                throw new Error(`Insufficient stock for product '${productItemKey}'. Available: ${currentStock}, Requested: ${quantityToOrder}.`);
            }

            // 2. Fetch Settings for fees
            const settingsRecord = txDao.findFirstRecordByFilter("settings", "id!=''");
            if (!settingsRecord) {
                console.error("[API Hook] Critical: Application settings not found.");
                throw new Error("Application settings not found. Cannot calculate fees.");
            }
            const generalServiceFeeEGP = settingsRecord.getFloat("servFeeEGP") || 0;
            const deliveryAreasConfig = settingsRecord.get("delAreas"); // This is a JSON field

            // 3. Calculate Fees Server-Side
            const animalPriceEGP = productRecord.getFloat("base_price_egp");
            let serviceFeeAppliedEGP = 0;
            if (requestData.udheya_service_option_selected === "standard_service") {
                serviceFeeAppliedEGP = generalServiceFeeEGP;
            }

            let deliveryFeeAppliedEGP = 0;
            if (requestData.delivery_option === "home_delivery_to_orderer" && requestData.delivery_area_id) {
                let foundCityFee = null;
                if (deliveryAreasConfig && Array.isArray(deliveryAreasConfig)) {
                    for (const gov of deliveryAreasConfig) {
                        if (gov.cities && Array.isArray(gov.cities)) {
                            const city = gov.cities.find(c => `${gov.id}_${c.id}` === requestData.delivery_area_id);
                            if (city && typeof city.delivery_fee_egp === 'number') {
                                foundCityFee = city.delivery_fee_egp;
                                break;
                            }
                        } else if (gov.id === requestData.delivery_area_id && typeof gov.delivery_fee_egp === 'number') {
                            foundCityFee = gov.delivery_fee_egp;
                            break;
                        }
                    }
                }
                if (foundCityFee === null) {
                    console.warn(`[API Hook] Delivery fee for area_id '${requestData.delivery_area_id}' not found in settings or is marked as variable (null). Applying 0 for now. Admin should verify.`);
                    deliveryFeeAppliedEGP = 0; 
                } else {
                    deliveryFeeAppliedEGP = foundCityFee;
                }
            }
            
            serverCalculatedTotalEGP = animalPriceEGP + serviceFeeAppliedEGP + deliveryFeeAppliedEGP;

            // 4. Create the new order record
            const ordersCollection = txDao.findCollectionByNameOrId("orders");
            const newOrder = new Record(ordersCollection);

            if (authRecord) { newOrder.set("user", authRecord.id); }

            newOrder.set("order_id_text", requestData.order_id_text);
            newOrder.set("product_id", productRecord.id);
            
            newOrder.set("ordered_product_name_en", productRecord.getString("variant_name_en"));
            newOrder.set("ordered_product_name_ar", productRecord.getString("variant_name_ar"));
            newOrder.set("ordered_weight_range_en", productRecord.getString("weight_range_text_en"));
            newOrder.set("ordered_weight_range_ar", productRecord.getString("weight_range_text_ar"));
            newOrder.set("price_at_order_time_egp", animalPriceEGP);
            
            newOrder.set("service_fee_applied_egp", serviceFeeAppliedEGP);
            newOrder.set("delivery_fee_applied_egp", deliveryFeeAppliedEGP);
            newOrder.set("total_amount_due_egp", serverCalculatedTotalEGP);

            let costOfAnimalEGP = parseFloat(requestData.cost_of_animal_egp) || 0;

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
            // Names can be derived from settings and area_id if needed, or sent by client
            newOrder.set("delivery_area_name_en", requestData.delivery_area_name_en || ""); 
            newOrder.set("delivery_area_name_ar", requestData.delivery_area_name_ar || "");
            newOrder.set("delivery_address", requestData.delivery_address);
            newOrder.set("delivery_instructions", requestData.delivery_instructions);
            newOrder.set("time_slot", requestData.time_slot);
            newOrder.set("payment_method", requestData.payment_method);
            
            if (requestData.payment_method === 'cod') {
                newOrder.set("payment_status", "cod_pending_confirmation");
                newOrder.set("order_status", "pending_confirmation");
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

            if (requestData.animal_tag_id) {
                const animalRecord = txDao.findFirstRecordByFilter(
                    "sheep_log",
                    "animal_tag_id = {:tagId} && current_status = 'Active'",
                    { tagId: requestData.animal_tag_id }
                );
                if (animalRecord) {
                    newOrder.set("animal_id", animalRecord.id); 
                    if (requestData.cost_of_animal_egp === undefined || requestData.cost_of_animal_egp === null) {
                        costOfAnimalEGP = animalRecord.getFloat("acquisition_cost_egp") || 0;
                    }
                } else {
                    console.warn(`[API Hook] Specific animal tag_id ${requestData.animal_tag_id} not found or not active. Order will proceed without specific animal link.`);
                }
            }
            newOrder.set("cost_of_animal_egp", costOfAnimalEGP);
            
            txDao.saveRecord(newOrder);
            createdOrderPocketBaseId = newOrder.getId();

            if (newOrder.get("animal_id")) { 
                 const animalToUpdate = txDao.findRecordById("sheep_log", newOrder.getString("animal_id"));
                 if (animalToUpdate) {
                    animalToUpdate.set("sale_order_id", createdOrderPocketBaseId); 
                    animalToUpdate.set("current_status", "Sold"); 
                    txDao.saveRecord(animalToUpdate);
                    console.log(`[API Hook] Animal ${animalToUpdate.getString("animal_tag_id")} status updated to Sold and linked to order ${newOrder.getString("order_id_text")}.`);
                 }
            }

            // 5. Update product stock
            finalStockLevel = currentStock - quantityToOrder;
            productRecord.set("stock_available_pb", finalStockLevel);
            txDao.saveRecord(productRecord);

            console.log(`[API Hook Success] Order ${newOrder.getString("order_id_text")} created. Product ${productItemKey} stock updated to ${finalStockLevel}. Total: ${serverCalculatedTotalEGP}. User: ${authRecord ? authRecord.id : 'Anonymous'}`);
        });

        return c.json(200, {
            message: "Order placed successfully.",
            order_id_text: requestData.order_id_text,
            id: createdOrderPocketBaseId,
            new_stock_level: finalStockLevel,
            total_amount_due_egp: serverCalculatedTotalEGP
        });

    } catch (err) {
        console.error(`[API Hook /api/custom_place_order] Transaction failed: ${err.message}`, err.originalError || err);
        let statusCode = 500;
        let clientErrorMessage = "Failed to process order due to an internal server error.";

        if (err.message) {
            if (err.message.includes("not found or is inactive")) {
                statusCode = 404; 
                clientErrorMessage = "The selected product is not available or is inactive. Please refresh and try again.";
            } else if (err.message.includes("Insufficient stock")) {
                statusCode = 409;
                clientErrorMessage = "Unfortunately, the selected item is now out of stock. Please select another option.";
            } else if (err.message.includes("Application settings not found")) {
                statusCode = 503; 
                clientErrorMessage = "Order placement is temporarily unavailable due to a configuration issue. Please try again later.";
            } else {
                 // Keep a somewhat generic message for other internal errors unless specific user feedback is useful
                clientErrorMessage = "An unexpected error occurred while processing your order. " + err.message; 
            }
        }
        
        return c.json(statusCode, { error: clientErrorMessage });
    }
});

// Optional: Health check endpoint
routerAdd("GET", "/api/health_check", (c) => {
    try {
        // Perform a quick, non-intensive check, e.g., try to read settings
        const settings = $app.dao().findFirstRecordByFilter("settings", "id!=''");
        if (settings) {
            return c.json(200, { status: "healthy", message: "API and DB connection appear healthy.", timestamp: new Date().toISOString() });
        } else {
            return c.json(503, { status: "unhealthy", message: "API is up, but settings collection is inaccessible.", timestamp: new Date().toISOString() });
        }
    } catch (e) {
        console.error("[API Health Check Error]:", e);
        return c.json(503, { status: "unhealthy", message: "API is up, but an error occurred during health check.", error: e.message, timestamp: new Date().toISOString() });
    }
});
