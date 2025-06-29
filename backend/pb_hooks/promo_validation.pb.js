// Promo code validation hook
onRecordCreateRequest((e) => {
    if (e.collection.name !== "orders") return;
    
    const record = e.record;
    const promoCode = record.get("promo_code");
    
    if (!promoCode || promoCode === "") return;
    
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
        } else {
            discountAmount = Math.min(discountValue, orderTotal);
        }
        
        // Apply discount
        record.set("promo_applied", true);
        record.set("promo_discount_amount", discountAmount);
        
        // Recalculate final total
        const serviceFee = record.get("total_service_fee_egp") || 0;
        const deliveryFee = record.get("delivery_fee_egp") || 0;
        const onlineFee = record.get("online_payment_fee_applied_egp") || 0;
        const finalTotal = orderTotal + serviceFee + deliveryFee + onlineFee - discountAmount;
        
        record.set("final_total_egp", Math.max(0, finalTotal));
        
        // Increment usage count (will be done after successful order creation)
        e.next = () => {
            promo.set("used_count", usedCount + 1);
            $app.dao().save(promo);
        };
        
    } catch (err) {
        if (err instanceof BadRequestError) {
            throw err;
        }
        console.error("Promo validation error:", err);
        throw new BadRequestError("Error validating promo code");
    }
}, "promo_validation");