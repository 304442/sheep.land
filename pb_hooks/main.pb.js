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
        if (requestData[field] === undefined || requestData[field] === null || String(requestData[field]).trim() === "") {
            console.warn(`[API Hook Validation] Missing or empty essential field: '${field}'`);
            return c.json(400, { error: `Missing or empty essential field in request: '${field}'.` });
        }
    }
    if (requestData.delivery_option === "home_delivery_to_orderer" && !requestData.delivery_area_id) {
        console.warn(`[API Hook Validation] Missing 'delivery_area_id' for home delivery.`);
        return c.json(400, { error: "Missing 'delivery_area_id' for home delivery option."});
    }
    // --- End Essential Field Validation ---

    let createdOrderPocketBaseId = null;
    let finalStockLevel = null;
    let serverCalculatedTotalEGP = 0;
    const authRecord = $apis.requestInfo(c).authRecord;

    try {
        $app.dao().runInTransaction(async (txDao) => {
            const productItemKey = String(requestData.product_item_key).trim();
            const quantityToOrder = parseInt(requestData.quantity) || 1;

            // 1. Fetch Product
            console.log(`[API Hook] Fetching product: ${productItemKey}`);
            const productRecord = txDao.findFirstRecordByFilter(
                "products",
                "item_key = {:itemKey} && is_active = true",
                { itemKey: productItemKey }
            );
            if (!productRecord) {
                console.warn(`[API Hook] Product not found or inactive: ${productItemKey}`);
                throw new Error(`Product with item_key '${productItemKey}' not found or is inactive.`);
            }
            console.log(`[API Hook] Product found: ${productRecord.getId()}, Stock: ${productRecord.getInt("stock_available_pb")}`);


            const currentStock = productRecord.getInt("stock_available_pb");
            if (currentStock < quantityToOrder) {
                console.warn(`[API Hook] Insufficient stock for ${productItemKey}. Available: ${currentStock}, Requested: ${quantityToOrder}`);
                throw new Error(`Insufficient stock for product '${productItemKey}'. Available: ${currentStock}, Requested: ${quantityToOrder}.`);
            }

            // 2. Fetch Settings for fees
            console.log("[API Hook] Fetching settings...");
            const settingsRecord = txDao.findFirstRecordByFilter("settings", "id!=''"); 
            if (!settingsRecord) {
                console.error("[API Hook] Critical: Application settings not found.");
                throw new Error("Application settings not found. Cannot calculate fees.");
            }
            console.log("[API Hook] Settings found.");
            const generalServiceFeeEGP = settingsRecord.getFloat("servFeeEGP") || 0;
            const deliveryAreasConfig = settingsRecord.get("delAreas"); 

            // 3. Calculate Fees Server-Side
            console.log("[API Hook] Calculating fees...");
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
            console.log(`[API Hook] Fees calculated: Animal=${animalPriceEGP}, Service=${serviceFeeAppliedEGP}, Delivery=${deliveryFeeAppliedEGP}, Total=${serverCalculatedTotalEGP}`);

            // 4. Create the new order record
            console.log("[API Hook] Creating order record...");
            const ordersCollection = txDao.findCollectionByNameOrId("orders");
            const newOrder = new Record(ordersCollection);

            if (authRecord) { newOrder.set("user", authRecord.id); }

            newOrder.set("order_id_text", String(requestData.order_id_text).trim());
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

            newOrder.set("udheya_service_option_selected", String(requestData.udheya_service_option_selected));
            newOrder.set("selected_display_currency", String(requestData.selected_display_currency || "EGP"));
            newOrder.set("sacrifice_day_value", String(requestData.sacrifice_day_value));
            newOrder.set("sacrifice_day_text_en", String(requestData.sacrifice_day_text_en || ""));
            newOrder.set("sacrifice_day_text_ar", String(requestData.sacrifice_day_text_ar || ""));
            newOrder.set("slaughter_viewing_preference", String(requestData.slaughter_viewing_preference || "none"));
            newOrder.set("distribution_choice", String(requestData.distribution_choice || "me"));
            newOrder.set("split_details_option", String(requestData.split_details_option || ""));
            newOrder.set("custom_split_details_text", String(requestData.custom_split_details_text || ""));
            newOrder.set("niyyah_names", String(requestData.niyyah_names || ""));
            newOrder.set("ordering_person_name", String(requestData.ordering_person_name).trim());
            newOrder.set("ordering_person_phone", String(requestData.ordering_person_phone).trim());
            newOrder.set("customer_email", String(requestData.customer_email || "").trim());
            newOrder.set("delivery_option", String(requestData.delivery_option || "self_pickup_or_internal_distribution"));
            newOrder.set("delivery_name", String(requestData.delivery_name || requestData.ordering_person_name).trim());
            newOrder.set("delivery_phone", String(requestData.delivery_phone || requestData.ordering_person_phone).trim());
            newOrder.set("delivery_area_id", String(requestData.delivery_area_id || ""));
            newOrder.set("delivery_area_name_en", String(requestData.delivery_area_name_en || "")); 
            newOrder.set("delivery_area_name_ar", String(requestData.delivery_area_name_ar || ""));
            newOrder.set("delivery_address", String(requestData.delivery_address || "").trim());
            newOrder.set("delivery_instructions", String(requestData.delivery_instructions || "").trim());
            newOrder.set("time_slot", String(requestData.time_slot || "N/A"));
            newOrder.set("payment_method", String(requestData.payment_method));
            
            if (requestData.payment_method === 'cod') {
                newOrder.set("payment_status", "cod_pending_confirmation");
                newOrder.set("order_status", "pending_confirmation");
            } else {
                newOrder.set("payment_status", "pending_payment");
                newOrder.set("order_status", "confirmed_pending_payment");
            }

            newOrder.set("terms_agreed", requestData.terms_agreed === true);
            newOrder.set("admin_notes", String(requestData.admin_notes || ""));
            newOrder.set("group_purchase_interest", requestData.group_purchase_interest === true);

            const clientIp = c.realIp();
            if (clientIp) { newOrder.set("user_ip_address", clientIp); }
            const userAgent = c.request().headers.get("User-Agent");
            if (userAgent) { newOrder.set("user_agent_string", userAgent.substring(0,300)); }

            if (requestData.animal_tag_id) {
                const animalRecord = txDao.findFirstRecordByFilter(
                    "sheep_log",
                    "animal_tag_id = {:tagId} && current_status = 'Active'",
                    { tagId: String(requestData.animal_tag_id).trim() }
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
            console.log(`[API Hook] Order record created with ID: ${createdOrderPocketBaseId}`);

            if (newOrder.get("animal_id")) { 
                 const animalToUpdate = txDao.findRecordById("sheep_log", newOrder.getString("animal_id"));
                 if (animalToUpdate) {
                    animalToUpdate.set("sale_order_id", createdOrderPocketBaseId); 
                    animalToUpdate.set("current_status", "Sold"); 
                    txDao.saveRecord(animalToUpdate);
                    console.log(`[API Hook] Animal ${animalToUpdate.getString("animal_tag_id")} status updated to Sold and linked to order ${newOrder.getString("order_id_text")}.`);
                 } else {
                    console.warn(`[API Hook] Could not find animal record with ID ${newOrder.getString("animal_id")} to update status after order creation.`);
                 }
            }

            // 5. Update product stock
            console.log(`[API Hook] Updating stock for product ${productItemKey}. Old stock: ${currentStock}`);
            finalStockLevel = currentStock - quantityToOrder;
            productRecord.set("stock_available_pb", finalStockLevel);
            txDao.saveRecord(productRecord);
            console.log(`[API Hook] Product ${productItemKey} stock updated to ${finalStockLevel}.`);

            console.log(`[API Hook Success] Order ${newOrder.getString("order_id_text")} created. User: ${authRecord ? authRecord.id : 'Anonymous'}`);
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
                clientErrorMessage = "An unexpected error occurred while processing your order. Please contact support if the issue persists.";
            }
        }
        
        return c.json(statusCode, { error: clientErrorMessage });
    }
});

routerAdd("GET", "/api/health_check", (c) => {
    try {
        const settings = $app.dao().findFirstRecordByFilter("settings", "id!=''");
        if (settings) {
            return c.json(200, { status: "healthy", message: "API and DB connection appear healthy.", timestamp: new Date().toISOString() });
        } else {
            console.warn("[API Health Check] Settings collection inaccessible.");
            return c.json(503, { status: "unhealthy", message: "API is up, but settings collection is inaccessible.", timestamp: new Date().toISOString() });
        }
    } catch (e) {
        console.error("[API Health Check Error]:", e);
        return c.json(503, { status: "unhealthy", message: "API is up, but an error occurred during health check.", error: e.message, timestamp: new Date().toISOString() });
    }
});
