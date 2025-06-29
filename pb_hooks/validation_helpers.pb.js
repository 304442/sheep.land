// PocketBase Validation Helper Functions
// Reusable validation utilities for hooks

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone validation (Egyptian format)
function isValidEgyptianPhone(phone) {
    // Egyptian phone numbers: +20 followed by 10 digits
    const phoneRegex = /^(\+20|0)?1[0-2,5]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Price validation
function isValidPrice(price) {
    return typeof price === 'number' && price >= 0 && isFinite(price);
}

// Quantity validation
function isValidQuantity(quantity) {
    return Number.isInteger(quantity) && quantity > 0;
}

// Date validation
function isValidFutureDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return date > now && !isNaN(date.getTime());
}

// Sacrifice day validation
function isValidSacrificeDay(day) {
    const validDays = [
        "day1_10_dhul_hijjah",
        "day2_11_dhul_hijjah", 
        "day3_12_dhul_hijjah",
        "day4_13_dhul_hijjah"
    ];
    return validDays.includes(day);
}

// Delivery option validation
function isValidDeliveryOption(option) {
    const validOptions = ["home_delivery", "pickup", "international_shipping"];
    return validOptions.includes(option);
}

// Payment method validation
function isValidPaymentMethod(method) {
    const validMethods = [
        "online_card", "cod", "fawry", "vodafone_cash",
        "instapay", "revolut", "paypal", "western_union", 
        "bank_transfer"
    ];
    return validMethods.includes(method);
}

// Order status validation
function isValidOrderStatus(status) {
    const validStatuses = [
        "pending_confirmation", "confirmed_pending_payment",
        "awaiting_payment_gateway", "payment_confirmed_processing",
        "ready_for_fulfillment", "out_for_delivery",
        "fulfilled_completed", "cancelled_by_user", "cancelled_by_admin"
    ];
    return validStatuses.includes(status);
}

// Product category validation
function isValidProductCategory(category) {
    const validCategories = ["udheya", "live_sheep", "meat", "catering"];
    return validCategories.includes(category);
}

// Sanitize HTML input
function sanitizeHtml(html) {
    // Basic HTML sanitization - in production use a proper library
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '');
}

// Validate delivery address
function validateDeliveryAddress(address) {
    if (!address || typeof address !== 'string') {
        return { valid: false, error: "Delivery address is required" };
    }
    
    if (address.length < 10) {
        return { valid: false, error: "Delivery address too short (minimum 10 characters)" };
    }
    
    if (address.length > 500) {
        return { valid: false, error: "Delivery address too long (maximum 500 characters)" };
    }
    
    return { valid: true };
}

// Validate line items structure
function validateLineItems(lineItems) {
    if (!Array.isArray(lineItems)) {
        return { valid: false, error: "Line items must be an array" };
    }
    
    if (lineItems.length === 0) {
        return { valid: false, error: "Order must contain at least one item" };
    }
    
    for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        
        if (!item.item_key_pb) {
            return { valid: false, error: `Missing product ID at line item ${i + 1}` };
        }
        
        if (!isValidQuantity(item.quantity)) {
            return { valid: false, error: `Invalid quantity at line item ${i + 1}` };
        }
        
        if (item.product_category === 'udheya' && item.udheya_details) {
            const udheyaValidation = validateUdheyaDetails(item.udheya_details);
            if (!udheyaValidation.valid) {
                return { valid: false, error: `Line item ${i + 1}: ${udheyaValidation.error}` };
            }
        }
    }
    
    return { valid: true };
}

// Validate Udheya details
function validateUdheyaDetails(details) {
    if (!details) {
        return { valid: false, error: "Udheya details are required" };
    }
    
    if (!details.serviceOption || !['standard_service', 'live_delivery'].includes(details.serviceOption)) {
        return { valid: false, error: "Invalid Udheya service option" };
    }
    
    if (details.serviceOption === 'standard_service') {
        if (!isValidSacrificeDay(details.sacrificeDay)) {
            return { valid: false, error: "Invalid sacrifice day selected" };
        }
        
        if (!details.distribution || !details.distribution.choice) {
            return { valid: false, error: "Distribution choice is required" };
        }
    }
    
    return { valid: true };
}

// Calculate order totals with validation
function calculateOrderTotals(lineItems, fees) {
    let subtotal = 0;
    let serviceFees = 0;
    
    for (const item of lineItems) {
        if (!isValidPrice(item.price_egp_each)) {
            throw new Error(`Invalid price for item ${item.name_en}`);
        }
        
        if (!isValidQuantity(item.quantity)) {
            throw new Error(`Invalid quantity for item ${item.name_en}`);
        }
        
        subtotal += item.price_egp_each * item.quantity;
        
        if (item.product_category === 'udheya' && 
            item.udheya_details?.serviceOption === 'standard_service') {
            serviceFees += fees.udheyaServiceFee || 0;
        }
    }
    
    const deliveryFee = fees.deliveryFee || 0;
    const onlinePaymentFee = fees.onlinePaymentFee || 0;
    
    const total = subtotal + serviceFees + deliveryFee + onlinePaymentFee;
    
    if (!isValidPrice(total)) {
        throw new Error("Invalid total amount calculated");
    }
    
    return {
        subtotal,
        serviceFees,
        deliveryFee,
        onlinePaymentFee,
        total
    };
}

// Export validation functions for use in hooks
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidEmail,
        isValidEgyptianPhone,
        isValidPrice,
        isValidQuantity,
        isValidFutureDate,
        isValidSacrificeDay,
        isValidDeliveryOption,
        isValidPaymentMethod,
        isValidOrderStatus,
        isValidProductCategory,
        sanitizeHtml,
        validateDeliveryAddress,
        validateLineItems,
        validateUdheyaDetails,
        calculateOrderTotals
    };
}