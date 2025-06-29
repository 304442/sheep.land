/// <reference path="../pb_data/types.d.ts" />

// Example migration file for PocketBase v0.28.4
// This demonstrates the correct migration syntax

migrate((db) => {
    // This is the "up" migration - runs when applying the migration
    // You can use the Dao object to interact with collections
    
    // Example: Add a new field to a collection (if it exists)
    try {
        const dao = new Dao(db);
        const collection = dao.findCollectionByNameOrId("products");
        
        // Check if field already exists to make migration idempotent
        const existingField = collection.schema.getFieldByName("example_field");
        if (!existingField) {
            // Add a new text field
            collection.schema.addField(new SchemaField({
                "system": false,
                "id": "exampleid",
                "name": "example_field", 
                "type": "text",
                "required": false,
                "unique": false,
                "options": {
                    "min": null,
                    "max": 500,
                    "pattern": ""
                }
            }));
            
            return dao.saveCollection(collection);
        }
    } catch (e) {
        // Collection might not exist, which is fine
        console.log("Migration skipped: " + e.toString());
    }
}, (db) => {
    // This is the "down" migration - runs when reverting
    // Remove the field we added
    try {
        const dao = new Dao(db);
        const collection = dao.findCollectionByNameOrId("products");
        
        collection.schema.removeField("example_field");
        
        return dao.saveCollection(collection);
    } catch (e) {
        console.log("Revert skipped: " + e.toString());
    }
});