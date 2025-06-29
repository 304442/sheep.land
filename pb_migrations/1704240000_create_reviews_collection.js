// Migration: Create customer reviews collection
// This migration creates a new collection for product reviews and ratings

migrate((db) => {
    const dao = new Dao(db);
    
    // Create reviews collection
    const collection = new Collection({
        "name": "reviews",
        "type": "base",
        "system": false,
        "schema": [
            {
                "system": false,
                "name": "product",
                "type": "relation",
                "required": true,
                "unique": false,
                "options": {
                    "collectionId": dao.findCollectionByNameOrId("products").id,
                    "cascadeDelete": false,
                    "minSelect": null,
                    "maxSelect": 1,
                    "displayFields": ["variant_name_en", "variant_name_ar"]
                }
            },
            {
                "system": false,
                "name": "order",
                "type": "relation",
                "required": true,
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
                "name": "user",
                "type": "relation",
                "required": false,
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
                "name": "rating",
                "type": "number",
                "required": true,
                "unique": false,
                "options": {
                    "min": 1,
                    "max": 5,
                    "decimalPlaces": 0
                }
            },
            {
                "system": false,
                "name": "title",
                "type": "text",
                "required": false,
                "unique": false,
                "options": {
                    "min": null,
                    "max": 200,
                    "pattern": ""
                }
            },
            {
                "system": false,
                "name": "comment",
                "type": "text",
                "required": false,
                "unique": false,
                "options": {
                    "min": null,
                    "max": 1000,
                    "pattern": ""
                }
            },
            {
                "system": false,
                "name": "is_verified_purchase",
                "type": "bool",
                "required": true,
                "unique": false,
                "options": {}
            },
            {
                "system": false,
                "name": "is_approved",
                "type": "bool",
                "required": true,
                "unique": false,
                "options": {}
            },
            {
                "system": false,
                "name": "helpful_count",
                "type": "number",
                "required": false,
                "unique": false,
                "options": {
                    "min": 0,
                    "max": null,
                    "decimalPlaces": 0
                }
            },
            {
                "system": false,
                "name": "images",
                "type": "file",
                "required": false,
                "unique": false,
                "options": {
                    "maxSelect": 5,
                    "maxSize": 10485760,
                    "mimeTypes": [
                        "image/jpeg",
                        "image/png",
                        "image/webp"
                    ],
                    "thumbs": [
                        "100x100",
                        "300x300"
                    ]
                }
            }
        ],
        "listRule": "is_approved = true",
        "viewRule": "is_approved = true || @request.auth.id = user",
        "createRule": "@request.auth.id != '' && @request.auth.id = user",
        "updateRule": "@request.auth.id = user && is_approved = false",
        "deleteRule": "@request.auth.id = user || @request.auth.role = 'admin'"
    });
    
    // Save the collection
    dao.saveCollection(collection);
    
    // Create indexes for better performance
    dao.db().exec(`CREATE INDEX idx_reviews_product ON reviews (product)`);
    dao.db().exec(`CREATE INDEX idx_reviews_rating ON reviews (rating)`);
    dao.db().exec(`CREATE INDEX idx_reviews_approved ON reviews (is_approved)`);
    
}, (db) => {
    const dao = new Dao(db);
    
    // Drop indexes
    dao.db().exec(`DROP INDEX IF EXISTS idx_reviews_product`);
    dao.db().exec(`DROP INDEX IF EXISTS idx_reviews_rating`);
    dao.db().exec(`DROP INDEX IF EXISTS idx_reviews_approved`);
    
    // Delete the collection
    dao.deleteCollection(dao.findCollectionByNameOrId("reviews"));
});