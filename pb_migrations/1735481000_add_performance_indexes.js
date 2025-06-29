/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    // Add indexes for frequently queried fields
    
    // Orders table indexes
    db.newQuery(`
        CREATE INDEX IF NOT EXISTS idx_orders_user 
        ON orders(user);
        
        CREATE INDEX IF NOT EXISTS idx_orders_created 
        ON orders(created);
        
        CREATE INDEX IF NOT EXISTS idx_orders_order_status 
        ON orders(order_status);
        
        CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
        ON orders(payment_status);
    `).execute();
    
    // Products table indexes
    db.newQuery(`
        CREATE INDEX IF NOT EXISTS idx_products_product_category 
        ON products(product_category);
        
        CREATE INDEX IF NOT EXISTS idx_products_is_active 
        ON products(is_active);
        
        CREATE INDEX IF NOT EXISTS idx_products_stock_available 
        ON products(stock_available_pb);
    `).execute();
    
    // Farm sheep table indexes
    db.newQuery(`
        CREATE INDEX IF NOT EXISTS idx_farm_sheep_user 
        ON farm_sheep(user);
        
        CREATE INDEX IF NOT EXISTS idx_farm_sheep_status 
        ON farm_sheep(status);
        
        CREATE INDEX IF NOT EXISTS idx_farm_sheep_weight 
        ON farm_sheep(weight_kg);
    `).execute();
    
    // Breeding records indexes
    db.newQuery(`
        CREATE INDEX IF NOT EXISTS idx_breeding_records_user 
        ON breeding_records(user);
        
        CREATE INDEX IF NOT EXISTS idx_breeding_records_expected_lambing 
        ON breeding_records(expected_lambing);
    `).execute();
    
    // Feed inventory indexes
    db.newQuery(`
        CREATE INDEX IF NOT EXISTS idx_feed_inventory_user 
        ON feed_inventory(user);
        
        CREATE INDEX IF NOT EXISTS idx_feed_inventory_quantity 
        ON feed_inventory(quantity_kg);
    `).execute();
    
    // Compound indexes for complex queries
    db.newQuery(`
        CREATE INDEX IF NOT EXISTS idx_orders_user_created 
        ON orders(user, created);
        
        CREATE INDEX IF NOT EXISTS idx_farm_sheep_user_status_weight 
        ON farm_sheep(user, status, weight_kg);
    `).execute();

}, (db) => {
    // Remove indexes in reverse migration
    const indexes = [
        'idx_orders_user',
        'idx_orders_created',
        'idx_orders_order_status',
        'idx_orders_payment_status',
        'idx_products_product_category',
        'idx_products_is_active',
        'idx_products_stock_available',
        'idx_farm_sheep_user',
        'idx_farm_sheep_status',
        'idx_farm_sheep_weight',
        'idx_breeding_records_user',
        'idx_breeding_records_expected_lambing',
        'idx_feed_inventory_user',
        'idx_feed_inventory_quantity',
        'idx_orders_user_created',
        'idx_farm_sheep_user_status_weight'
    ];
    
    indexes.forEach(indexName => {
        try {
            db.newQuery(`DROP INDEX IF EXISTS ${indexName}`).execute();
        } catch (e) {
            // Index might not exist
        }
    });
});