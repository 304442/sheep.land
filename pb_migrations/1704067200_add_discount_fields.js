// Migration: Add discount fields to products collection
// This migration adds special discount and seasonal pricing fields

migrate((db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("products");
    
    // Add special discount percentage field
    collection.schema.addField(new SchemaField({
        "system": false,
        "name": "special_discount_percent",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
            "min": 0,
            "max": 100,
            "decimalPlaces": 2
        }
    }));
    
    // Add discount start date
    collection.schema.addField(new SchemaField({
        "system": false,
        "name": "discount_start_date",
        "type": "date",
        "required": false,
        "unique": false,
        "options": {
            "dateOnly": false
        }
    }));
    
    // Add discount end date  
    collection.schema.addField(new SchemaField({
        "system": false,
        "name": "discount_end_date",
        "type": "date",
        "required": false,
        "unique": false,
        "options": {
            "dateOnly": false
        }
    }));
    
    // Add seasonal pricing flag
    collection.schema.addField(new SchemaField({
        "system": false,
        "name": "is_seasonal_pricing",
        "type": "bool",
        "required": false,
        "unique": false,
        "options": {}
    }));
    
    return dao.saveCollection(collection);
}, (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("products");
    
    // Remove fields on rollback
    collection.schema.removeField("special_discount_percent");
    collection.schema.removeField("discount_start_date");
    collection.schema.removeField("discount_end_date");
    collection.schema.removeField("is_seasonal_pricing");
    
    return dao.saveCollection(collection);
});