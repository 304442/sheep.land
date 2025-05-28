/** /// <reference path="../pb_data/types.d.ts" /> */

routerAdd("POST", "/api/custom_book_udheya", (c) => {
    let requestData;
    try {
        requestData = $apis.requestInfo(c).data;
    } catch (e) {
        console.error("[Hook Error] Failed to parse request data for custom_book_udheya:", e);
        return c.json(400, { error: "Invalid request payload. JSON expected." });
    }

    if (!requestData || !requestData.product_item_key) {
        return c.json(400, { error: "Missing 'product_item_key' in request." });
    }
    if (!requestData.booking_id_text) {
        return c.json(400, { error: "Missing 'booking_id_text' in request." });
    }

    let createdBookingPocketBaseId = null;
    let finalStockLevel = null;

    try {
        $app.dao().runInTransaction(async (txDao) => {
            const productItemKey = requestData.product_item_key;
            const quantityToBook = requestData.quantity || 1; 

            const productRecord = txDao.findFirstRecordByFilter(
                "products",
                "item_key = {:itemKey} && is_active = true",
                { itemKey: productItemKey }
            );

            if (!productRecord) {
                throw new Error(`Product with item_key '${productItemKey}' not found or is inactive.`);
            }

            const currentStock = productRecord.getInt("stock_available_pb");
            if (currentStock < quantityToBook) {
                throw new Error(`Insufficient stock for product '${productItemKey}'. Available: ${currentStock}, Requested: ${quantityToBook}`);
            }

            const bookingsCollection = txDao.findCollectionByNameOrId("bookings");
            const newBooking = new Record(bookingsCollection);

            newBooking.set("booking_id_text", requestData.booking_id_text);
            newBooking.set("product_id", productRecord.id); 
            
            newBooking.set("booked_product_name_en", productRecord.getString("variant_name_en"));
            newBooking.set("booked_product_name_ar", productRecord.getString("variant_name_ar"));
            newBooking.set("booked_weight_range_en", productRecord.getString("weight_range_text_en"));
            newBooking.set("booked_weight_range_ar", productRecord.getString("weight_range_text_ar"));
            newBooking.set("booked_price_at_booking_egp", productRecord.getFloat("base_price_egp"));
            
            newBooking.set("udheya_service_option_selected", requestData.udheya_service_option_selected);
            newBooking.set("service_fee_applied_egp", requestData.service_fee_applied_egp);
            newBooking.set("delivery_fee_applied_egp", requestData.delivery_fee_applied_egp);
            newBooking.set("total_amount_due_egp", requestData.total_amount_due_egp);
            newBooking.set("selected_display_currency", requestData.selected_display_currency);
            newBooking.set("sacrifice_day_value", requestData.sacrifice_day_value);
            newBooking.set("sacrifice_day_text_en", requestData.sacrifice_day_text_en);
            newBooking.set("sacrifice_day_text_ar", requestData.sacrifice_day_text_ar);
            newBooking.set("slaughter_viewing_preference", requestData.slaughter_viewing_preference);
            newBooking.set("distribution_choice", requestData.distribution_choice);
            newBooking.set("split_details_option", requestData.split_details_option);
            newBooking.set("custom_split_details_text", requestData.custom_split_details_text);
            newBooking.set("niyyah_names", requestData.niyyah_names);
            newBooking.set("ordering_person_name", requestData.ordering_person_name);
            newBooking.set("ordering_person_phone", requestData.ordering_person_phone);
            newBooking.set("customer_email", requestData.customer_email);
            newBooking.set("delivery_option", requestData.delivery_option);
            newBooking.set("delivery_name", requestData.delivery_name);
            newBooking.set("delivery_phone", requestData.delivery_phone);
            newBooking.set("delivery_area_id", requestData.delivery_area_id);
            newBooking.set("delivery_area_name_en", requestData.delivery_area_name_en);
            newBooking.set("delivery_area_name_ar", requestData.delivery_area_name_ar);
            newBooking.set("delivery_address", requestData.delivery_address);
            newBooking.set("delivery_instructions", requestData.delivery_instructions);
            newBooking.set("time_slot", requestData.time_slot);
            newBooking.set("payment_method", requestData.payment_method);
            newBooking.set("payment_status", requestData.payment_status);
            newBooking.set("booking_status", requestData.booking_status);
            newBooking.set("terms_agreed", requestData.terms_agreed === true);
            newBooking.set("admin_notes", requestData.admin_notes);
            newBooking.set("group_purchase_interest", requestData.group_purchase_interest === true);

            txDao.saveRecord(newBooking);
            createdBookingPocketBaseId = newBooking.getId();

            finalStockLevel = currentStock - quantityToBook;
            productRecord.set("stock_available_pb", finalStockLevel);
            txDao.saveRecord(productRecord);

            console.log(`[Hook Success] Booking ${newBooking.getString("booking_id_text")} created for product ${productItemKey}. Stock updated to ${finalStockLevel}.`);
        });

        return c.json(200, { 
            message: "Booking successful and stock updated.", 
            booking_id_text: requestData.booking_id_text,
            id: createdBookingPocketBaseId,
            new_stock_level: finalStockLevel
        });

    } catch (err) {
        console.error(`[Hook Error] /api/custom_book_udheya: ${err.message}`, err);
        let statusCode = 400; 
        if (err.message.includes("Variant not found") || err.message.includes("Insufficient stock")) {
            statusCode = 409; 
        } else if (err.isAbort || err.name === 'AbortError') {
            statusCode = 503; 
        } else {
            statusCode = 500; 
        }
        return c.json(statusCode, { error: "Failed to process booking: " + err.message });
    }
});