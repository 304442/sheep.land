/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);
    
    // Add constraints to orders collection
    const ordersCollection = dao.findCollectionByNameOrId("orders");
    
    // Ensure line_items is required and validated
    const lineItemsField = ordersCollection.schema.getFieldByName("line_items");
    lineItemsField.required = true;
    lineItemsField.options = {
        ...lineItemsField.options,
        minSelect: 1
    };
    
    // Add validation rules to prevent negative amounts
    const amountFields = [
        'subtotal_amount_egp',
        'total_amount_due_egp',
        'delivery_fee_applied_egp',
        'total_udheya_service_fee_egp'
    ];
    
    amountFields.forEach(fieldName => {
        const field = ordersCollection.schema.getFieldByName(fieldName);
        if (field && field.type === 'number') {
            field.options = {
                ...field.options,
                min: 0,
                noDecimal: false
            };
        }
    });
    
    dao.saveCollection(ordersCollection);
    
    // Add constraints to products collection
    const productsCollection = dao.findCollectionByNameOrId("products");
    
    // Ensure stock cannot be negative
    const stockField = productsCollection.schema.getFieldByName("stock_available_pb");
    if (stockField) {
        stockField.options = {
            ...stockField.options,
            min: 0,
            noDecimal: true
        };
    }
    
    // Ensure price cannot be negative
    const priceField = productsCollection.schema.getFieldByName("base_price_egp");
    if (priceField) {
        priceField.options = {
            ...priceField.options,
            min: 0,
            noDecimal: false
        };
    }
    
    dao.saveCollection(productsCollection);
    
    // Add unique constraint on order_id_text
    db.newQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_id_text 
        ON orders(order_id_text);
    `).execute();
    
    // Add composite unique constraint for farm_sheep tag_id per user
    db.newQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_farm_sheep_user_tag_id 
        ON farm_sheep(user, tag_id);
    `).execute();

}, (db) => {
    const dao = new Dao(db);
    
    // Remove constraints in reverse migration
    try {
        db.newQuery(`DROP INDEX IF EXISTS idx_orders_order_id_text`).execute();
        db.newQuery(`DROP INDEX IF EXISTS idx_farm_sheep_user_tag_id`).execute();
    } catch (e) {
        // Indexes might not exist
    }
    
    // Reset field constraints
    const ordersCollection = dao.findCollectionByNameOrId("orders");
    const amountFields = [
        'subtotal_amount_egp',
        'total_amount_due_egp',
        'delivery_fee_applied_egp',
        'total_udheya_service_fee_egp'
    ];
    
    amountFields.forEach(fieldName => {
        const field = ordersCollection.schema.getFieldByName(fieldName);
        if (field && field.type === 'number') {
            delete field.options.min;
        }
    });
    
    dao.saveCollection(ordersCollection);
});