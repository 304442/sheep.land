// Migration: Add loyalty points system
// This migration adds fields for customer loyalty points and rewards tracking

migrate((db) => {
    const dao = new Dao(db);
    
    // Update users collection to add loyalty fields
    const usersCollection = dao.findCollectionByNameOrId("users");
    
    // Add loyalty points field
    usersCollection.schema.addField(new SchemaField({
        "system": false,
        "name": "loyalty_points",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
            "min": 0,
            "max": null,
            "decimalPlaces": 0
        }
    }));
    
    // Add lifetime points earned
    usersCollection.schema.addField(new SchemaField({
        "system": false,
        "name": "lifetime_points_earned",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
            "min": 0,
            "max": null,
            "decimalPlaces": 0
        }
    }));
    
    // Add loyalty tier
    usersCollection.schema.addField(new SchemaField({
        "system": false,
        "name": "loyalty_tier",
        "type": "select",
        "required": false,
        "unique": false,
        "options": {
            "maxSelect": 1,
            "values": [
                "bronze",
                "silver",
                "gold",
                "platinum"
            ]
        }
    }));
    
    dao.saveCollection(usersCollection);
    
    // Update orders collection to add points tracking
    const ordersCollection = dao.findCollectionByNameOrId("orders");
    
    // Add points earned field
    ordersCollection.schema.addField(new SchemaField({
        "system": false,
        "name": "points_earned",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
            "min": 0,
            "max": null,
            "decimalPlaces": 0
        }
    }));
    
    // Add points redeemed field
    ordersCollection.schema.addField(new SchemaField({
        "system": false,
        "name": "points_redeemed",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
            "min": 0,
            "max": null,
            "decimalPlaces": 0
        }
    }));
    
    // Add discount from points field
    ordersCollection.schema.addField(new SchemaField({
        "system": false,
        "name": "points_discount_egp",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
            "min": 0,
            "max": null,
            "decimalPlaces": 2
        }
    }));
    
    dao.saveCollection(ordersCollection);
    
    // Create loyalty transactions collection
    const loyaltyCollection = new Collection({
        "name": "loyalty_transactions",
        "type": "base",
        "system": false,
        "schema": [
            {
                "system": false,
                "name": "user",
                "type": "relation",
                "required": true,
                "unique": false,
                "options": {
                    "collectionId": dao.findCollectionByNameOrId("users").id,
                    "cascadeDelete": false,
                    "minSelect": null,
                    "maxSelect": 1,
                    "displayFields": ["email", "name"]
                }
            },
            {
                "system": false,
                "name": "order",
                "type": "relation",
                "required": false,
                "unique": false,
                "options": {
                    "collectionId": dao.findCollectionByNameOrId("orders").id,
                    "cascadeDelete": false,
                    "minSelect": null,
                    "maxSelect": 1,
                    "displayFields": ["order_id_text"]
                }
            },
            {
                "system": false,
                "name": "transaction_type",
                "type": "select",
                "required": true,
                "unique": false,
                "options": {
                    "maxSelect": 1,
                    "values": [
                        "earned",
                        "redeemed",
                        "expired",
                        "bonus",
                        "adjustment"
                    ]
                }
            },
            {
                "system": false,
                "name": "points",
                "type": "number",
                "required": true,
                "unique": false,
                "options": {
                    "min": null,
                    "max": null,
                    "decimalPlaces": 0
                }
            },
            {
                "system": false,
                "name": "description",
                "type": "text",
                "required": false,
                "unique": false,
                "options": {
                    "min": null,
                    "max": 500,
                    "pattern": ""
                }
            },
            {
                "system": false,
                "name": "balance_after",
                "type": "number",
                "required": true,
                "unique": false,
                "options": {
                    "min": 0,
                    "max": null,
                    "decimalPlaces": 0
                }
            }
        ],
        "listRule": "@request.auth.id = user",
        "viewRule": "@request.auth.id = user",
        "createRule": null,
        "updateRule": null,
        "deleteRule": null
    });
    
    dao.saveCollection(loyaltyCollection);
    
    // Create index for performance
    dao.db().exec(`CREATE INDEX idx_loyalty_user ON loyalty_transactions (user)`);
    
}, (db) => {
    const dao = new Dao(db);
    
    // Remove fields from users collection
    const usersCollection = dao.findCollectionByNameOrId("users");
    usersCollection.schema.removeField("loyalty_points");
    usersCollection.schema.removeField("lifetime_points_earned");
    usersCollection.schema.removeField("loyalty_tier");
    dao.saveCollection(usersCollection);
    
    // Remove fields from orders collection
    const ordersCollection = dao.findCollectionByNameOrId("orders");
    ordersCollection.schema.removeField("points_earned");
    ordersCollection.schema.removeField("points_redeemed");
    ordersCollection.schema.removeField("points_discount_egp");
    dao.saveCollection(ordersCollection);
    
    // Drop index and delete loyalty transactions collection
    dao.db().exec(`DROP INDEX IF EXISTS idx_loyalty_user`);
    dao.deleteCollection(dao.findCollectionByNameOrId("loyalty_transactions"));
});