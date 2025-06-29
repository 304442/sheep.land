// Migration: Example data migration
// This demonstrates how to migrate existing data when schema changes

migrate((db) => {
    const dao = new Dao(db);
    
    // Example 1: Update all existing products to set default values for new fields
    dao.db().exec(`
        UPDATE products 
        SET special_discount_percent = 0,
            is_seasonal_pricing = FALSE
        WHERE special_discount_percent IS NULL
    `);
    
    // Example 2: Set loyalty tier based on existing order history
    // First, calculate total spent for each user
    const userTotals = dao.db().select(`
        SELECT 
            o.user,
            COUNT(DISTINCT o.id) as order_count,
            SUM(o.total_amount_due_egp) as total_spent
        FROM orders o
        WHERE o.order_status IN ('fulfilled_completed', 'out_for_delivery')
        AND o.payment_status = 'paid_confirmed'
        AND o.user IS NOT NULL
        GROUP BY o.user
    `);
    
    // Update user loyalty tiers based on spending
    for (const userTotal of userTotals) {
        let tier = 'bronze';
        let points = Math.floor(userTotal.total_spent);
        
        if (userTotal.total_spent >= 50000) {
            tier = 'platinum';
        } else if (userTotal.total_spent >= 25000) {
            tier = 'gold';
        } else if (userTotal.total_spent >= 10000) {
            tier = 'silver';
        }
        
        dao.db().exec(`
            UPDATE users 
            SET loyalty_tier = ?,
                loyalty_points = ?,
                lifetime_points_earned = ?
            WHERE id = ?
        `, tier, points, points, userTotal.user);
    }
    
    // Example 3: Create initial loyalty transactions for existing orders
    const completedOrders = dao.db().select(`
        SELECT id, user, total_amount_due_egp, created
        FROM orders
        WHERE order_status = 'fulfilled_completed'
        AND payment_status = 'paid_confirmed'
        AND user IS NOT NULL
        ORDER BY created ASC
    `);
    
    const loyaltyCollection = dao.findCollectionByNameOrId("loyalty_transactions");
    let userBalances = {};
    
    for (const order of completedOrders) {
        const pointsEarned = Math.floor(order.total_amount_due_egp);
        userBalances[order.user] = (userBalances[order.user] || 0) + pointsEarned;
        
        // Create loyalty transaction record
        const transaction = new Record(loyaltyCollection);
        transaction.set("user", order.user);
        transaction.set("order", order.id);
        transaction.set("transaction_type", "earned");
        transaction.set("points", pointsEarned);
        transaction.set("description", `Points earned from order ${order.id}`);
        transaction.set("balance_after", userBalances[order.user]);
        transaction.set("created", order.created);
        
        dao.saveRecord(transaction);
        
        // Update the order with points earned
        dao.db().exec(`
            UPDATE orders 
            SET points_earned = ?
            WHERE id = ?
        `, pointsEarned, order.id);
    }
    
    // Example 4: Set verified purchase flag for existing reviews
    dao.db().exec(`
        UPDATE reviews r
        SET is_verified_purchase = TRUE
        WHERE EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = r.order
            AND o.order_status = 'fulfilled_completed'
            AND o.payment_status = 'paid_confirmed'
        )
    `);
    
    console.log("Data migration completed successfully");
    
}, (db) => {
    // Rollback is complex for data migrations
    // In practice, you might want to backup data before migration
    // or have a more sophisticated rollback strategy
    console.log("Data migration rollback not implemented - restore from backup if needed");
});