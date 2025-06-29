/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    // Populate user field for existing orders based on customer_email
    // This runs as a separate migration after the field is added
    
    try {
        // db is the app instance with DAO methods
        
        // Get all orders that don't have a user set
        const orders = db.findRecordsByFilter(
            "orders",
            "user = null || user = ''",
            "",
            500,
            0
        );
        
        // Update each order with matching user
        orders.forEach((order) => {
            const customerEmail = order.getString("customer_email");
            if (customerEmail) {
                try {
                    // Find user by email
                    const user = db.findFirstRecordByData("users", "email", customerEmail);
                    if (user) {
                        order.set("user", user.getId());
                        db.save(order);
                    }
                } catch (e) {
                    // User not found, skip
                }
            }
        });
        
    } catch (e) {
        console.log("Error populating user field:", e);
    }
    
}, (db) => {
    // No rollback needed - just removes user associations
});