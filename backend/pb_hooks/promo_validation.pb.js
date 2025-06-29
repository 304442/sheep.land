// Promo code validation hook
onRecordCreateRequest((e) => {
    if (e.collection.name !== "orders") {
        e.next();
        return;
    }
    
    const record = e.record;
    const promoCode = record.get("promo_code");
    
    if (!promoCode || promoCode === "") {
        e.next();
        return;
    }
    
    try {
        // Find promo code
        const promo = $app.dao().findFirstRecordByFilter("promo_codes", 
            `code="${promoCode}" && is_active=true`
        );
        
        if (!promo) {
            throw new BadRequestError("Invalid promo code");
        }
        
        // Check validity dates
        const now = new Date();
        const validFrom = new Date(promo.get("valid_from"));
        const validUntil = new Date(promo.get("valid_until"));
        
        if (now < validFrom || now > validUntil) {
            throw new BadRequestError("Promo code has expired");
        }
        
        // Check usage limits
        const maxUses = promo.get("max_uses");
        const usedCount = promo.get("used_count") || 0;
        
        if (maxUses > 0 && usedCount >= maxUses) {
            throw new BadRequestError("Promo code usage limit reached");
        }
        
        // Check minimum order amount
        const minAmount = promo.get("min_order_amount") || 0;
        const orderTotal = record.get("subtotal_egp");
        
        if (orderTotal < minAmount) {
            throw new BadRequestError(`Minimum order amount for this promo code is ${minAmount} EGP`);
        }
        
        // Calculate discount
        const discountType = promo.get("discount_type");
        const discountValue = promo.get("discount_value");
        let discountAmount = 0;
        
        if (discountType === "percentage") {
            discountAmount = (orderTotal * discountValue) / 100;
            // Apply max discount if set
            const maxDiscount = promo.get("max_discount_amount");
            if (maxDiscount > 0 && discountAmount > maxDiscount) {
                discountAmount = maxDiscount;
            }
        } else {
            // Fixed amount discount
            discountAmount = discountValue;
        }
        
        // Apply discount to order
        record.set("promo_code_id", promo.id);
        record.set("promo_discount_amount", discountAmount);
        
        // Update promo usage count
        promo.set("used_count", usedCount + 1);
        $app.dao().save(promo);
        
        // Promo code applied successfully
        
    } catch (err) {
        if (err instanceof BadRequestError) {
            throw err;
        }
        console.error(`[PromoValidation] Error applying promo ${promoCode} to order: ${err.message}`);
        throw new BadRequestError("Failed to validate promo code");
    }
    
    e.next();
}, "orders");

// Track promo code usage after order creation
onRecordAfterCreateRequest((e) => {
    if (e.collection.name !== "orders") {
        e.next();
        return;
    }
    
    const record = e.record;
    const promoCodeId = record.get("promo_code_id");
    
    if (!promoCodeId) {
        e.next();
        return;
    }
    
    try {
        // Create promo usage record for tracking
        const usageCollection = $app.dao().findCollectionByNameOrId("promo_usage");
        if (usageCollection) {
            const usageRecord = new Record(usageCollection);
            usageRecord.set("promo_code_id", promoCodeId);
            usageRecord.set("order_id", record.id);
            usageRecord.set("user_id", record.get("user_id"));
            usageRecord.set("discount_amount", record.get("promo_discount_amount"));
            $app.dao().saveRecord(usageRecord);
        }
    } catch (err) {
        console.error(`[PromoValidation] Failed to track usage for promo ${promoRecord.getId()} on order ${e.record.getId()}: ${err.message}`);
    }
    
    e.next();
}, "orders");