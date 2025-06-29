// Enhanced validation for all collections

// Egyptian phone number validation
function validateEgyptianPhone(phone) {
    // Remove spaces and dashes
    phone = phone.replace(/[\s-]/g, '');
    
    // Egyptian mobile patterns: 010, 011, 012, 015 followed by 8 digits
    const egyptianMobilePattern = /^(010|011|012|015)\d{8}$/;
    
    // Also accept with country code
    const withCountryCode = /^(\+20|0020)(10|11|12|15)\d{8}$/;
    
    return egyptianMobilePattern.test(phone) || withCountryCode.test(phone);
}

// Email validation
function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Password strength validation
function validatePassword(password) {
    const settings = $app.dao().findFirstRecordByFilter("settings", "");
    const minLength = settings?.get("password_min_length") || 8;
    
    if (password.length < minLength) {
        return `Password must be at least ${minLength} characters long`;
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
        return "Password must contain at least one number";
    }
    
    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
        return "Password must contain at least one letter";
    }
    
    return null; // Valid
}

// User validation
onRecordCreateRequest((e) => {
    if (e.collection.name !== "users") return;
    
    const record = e.record;
    
    // Validate email
    const email = record.get("email");
    if (!validateEmail(email)) {
        throw new BadRequestError("Invalid email format");
    }
    
    // Validate password for new users
    const password = record.get("password");
    if (password) {
        const passwordError = validatePassword(password);
        if (passwordError) {
            throw new BadRequestError(passwordError);
        }
    }
    
    // Set default values
    if (!record.get("lang")) {
        record.set("lang", "ar");
    }
    
    if (record.get("is_admin") === null) {
        record.set("is_admin", false);
    }
}, "validate_user_create");

// Order validation
onRecordCreateRequest((e) => {
    if (e.collection.name !== "orders") return;
    
    const record = e.record;
    
    // Validate phone number
    const phone = record.get("phone");
    if (!phone) {
        throw new BadRequestError("Phone number is required");
    }
    
    if (!validateEgyptianPhone(phone)) {
        throw new BadRequestError("Invalid Egyptian phone number format. Use format: 01XXXXXXXXX");
    }
    
    // Validate email
    const email = record.get("email");
    if (email && !validateEmail(email)) {
        throw new BadRequestError("Invalid email format");
    }
    
    // Validate delivery area
    const deliveryArea = record.get("delivery_area");
    const validAreas = ["cairo", "giza", "alexandria", "international"];
    if (!validAreas.includes(deliveryArea)) {
        throw new BadRequestError("Invalid delivery area");
    }
    
    // Validate order quantity limits
    const settings = $app.dao().findFirstRecordByFilter("settings", "");
    const maxQuantity = settings?.get("max_order_quantity") || 100;
    const minAmount = settings?.get("min_order_amount") || 100;
    
    const lineItems = record.get("line_items");
    if (lineItems) {
        let totalQuantity = 0;
        for (const item of lineItems) {
            totalQuantity += item.quantity || 0;
            if (item.quantity > maxQuantity) {
                throw new BadRequestError(`Maximum quantity per item is ${maxQuantity}`);
            }
        }
        
        if (totalQuantity > maxQuantity * 10) {
            throw new BadRequestError("Total order quantity is too large. Please contact us for bulk orders.");
        }
    }
    
    // Check minimum order amount
    const totalAmount = record.get("total_amount_egp");
    if (totalAmount < minAmount) {
        throw new BadRequestError(`Minimum order amount is ${minAmount} EGP`);
    }
    
}, "validate_order_create");

// Product validation
onRecordCreateRequest((e) => {
    if (e.collection.name !== "products") return;
    
    const record = e.record;
    
    // Validate price
    const price = record.get("price_egp");
    if (price <= 0) {
        throw new BadRequestError("Price must be greater than 0");
    }
    
    // Validate stock
    const stock = record.get("current_stock_units");
    if (stock < 0) {
        throw new BadRequestError("Stock cannot be negative");
    }
    
    // Validate category
    const category = record.get("category_pb");
    const validCategories = ["udheya", "local_sheep", "meat_cuts", "gathering_packages"];
    if (!validCategories.includes(category)) {
        throw new BadRequestError("Invalid product category");
    }
    
    // Validate item key format
    const itemKey = record.get("item_key");
    if (!/^[a-z0-9_]+$/.test(itemKey)) {
        throw new BadRequestError("Item key must contain only lowercase letters, numbers, and underscores");
    }
    
}, "validate_product_create");

// Promo code validation on update
onRecordUpdateRequest((e) => {
    if (e.collection.name !== "promo_codes") return;
    
    const record = e.record;
    const oldRecord = e.record.originalCopy();
    
    // Don't allow changing code after creation
    if (oldRecord.get("code") !== record.get("code")) {
        throw new BadRequestError("Promo code cannot be changed after creation");
    }
    
    // Validate dates
    const validFrom = new Date(record.get("valid_from"));
    const validUntil = new Date(record.get("valid_until"));
    
    if (validFrom >= validUntil) {
        throw new BadRequestError("Valid from date must be before valid until date");
    }
    
    // Don't allow reducing max uses below current usage
    const currentUsage = oldRecord.get("current_usage") || 0;
    const maxUses = record.get("max_uses");
    
    if (maxUses && maxUses < currentUsage) {
        throw new BadRequestError(`Cannot set max uses below current usage (${currentUsage})`);
    }
    
}, "validate_promo_update");

// Farm sheep validation
onRecordCreateRequest((e) => {
    if (e.collection.name !== "farm_sheep") return;
    
    const record = e.record;
    
    // Validate tag number format
    const tagNumber = record.get("tag_number");
    if (!/^[A-Z0-9-]+$/.test(tagNumber)) {
        throw new BadRequestError("Tag number must contain only uppercase letters, numbers, and hyphens");
    }
    
    // Validate weight
    const weight = record.get("current_weight");
    if (weight <= 0) {
        throw new BadRequestError("Weight must be greater than 0");
    }
    
    // Validate birth date
    const birthDate = new Date(record.get("birth_date"));
    if (birthDate > new Date()) {
        throw new BadRequestError("Birth date cannot be in the future");
    }
    
    // Validate purchase price
    const purchasePrice = record.get("purchase_price");
    if (purchasePrice < 0) {
        throw new BadRequestError("Purchase price cannot be negative");
    }
    
}, "validate_farm_sheep_create");