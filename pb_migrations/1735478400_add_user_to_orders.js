/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("orders");

    // Add user field if it doesn't exist
    const userField = {
        "name": "user",
        "type": "relation",
        "required": false,
        "presentable": false,
        "options": {
            "collectionId": "_pb_users_auth_",
            "cascadeDelete": false,
            "minSelect": null,
            "maxSelect": 1,
            "displayFields": ["email"]
        }
    };

    // Check if field already exists
    const existingField = collection.schema.find(field => field.name === 'user');
    if (!existingField) {
        collection.schema.push(userField);
    }

    // Update collection rules to allow user to see their own orders
    collection.listRule = "(@request.query.lookupOrderID != '' && order_id_text = @request.query.lookupOrderID) || (@request.auth.id != '' && user = @request.auth.id) || @request.auth.is_admin = true";
    collection.viewRule = "(@request.query.lookupOrderID != '' && order_id_text = @request.query.lookupOrderID) || (@request.auth.id != '' && user = @request.auth.id) || @request.auth.is_admin = true";

    // Save collection with new field
    dao.saveCollection(collection);

    // Add index for better performance
    db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user)`);

    // Populate user field for existing orders based on customer_email
    db.exec(`
        UPDATE orders 
        SET user = (
            SELECT id FROM users 
            WHERE users.email = orders.customer_email 
            LIMIT 1
        )
        WHERE user IS NULL 
        AND customer_email IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = orders.customer_email
        )
    `);

}, (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("orders");

    // Revert collection rules
    collection.listRule = "(@request.query.lookupOrderID != '' && order_id_text = @request.query.lookupOrderID) || @request.auth.is_admin = true";
    collection.viewRule = "(@request.query.lookupOrderID != '' && order_id_text = @request.query.lookupOrderID) || @request.auth.is_admin = true";

    // Remove user field
    collection.schema = collection.schema.filter(field => field.name !== 'user');

    dao.saveCollection(collection);

    // Drop index
    db.exec(`DROP INDEX IF EXISTS idx_orders_user`);
});