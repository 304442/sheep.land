// Migration: Add tracking fields to orders collection
// This migration adds fields for shipment tracking and delivery status

migrate((db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("orders");
    
    // Add tracking number field
    collection.schema.addField(new SchemaField({
        "system": false,
        "name": "tracking_number",
        "type": "text",
        "required": false,
        "unique": false,
        "options": {
            "min": null,
            "max": 100,
            "pattern": ""
        }
    }));
    
    // Add shipping carrier field
    collection.schema.addField(new SchemaField({
        "system": false,
        "name": "shipping_carrier",
        "type": "select",
        "required": false,
        "unique": false,
        "options": {
            "maxSelect": 1,
            "values": [
                "aramex",
                "dhl",
                "fedex",
                "ups",
                "egypt_post",
                "other"
            ]
        }
    }));
    
    // Add estimated delivery date
    collection.schema.addField(new SchemaField({
        "system": false,
        "name": "estimated_delivery_date",
        "type": "date",
        "required": false,
        "unique": false,
        "options": {
            "dateOnly": true
        }
    }));
    
    // Add actual delivery date
    collection.schema.addField(new SchemaField({
        "system": false,
        "name": "actual_delivery_date",
        "type": "date",
        "required": false,
        "unique": false,
        "options": {
            "dateOnly": false
        }
    }));
    
    // Add delivery signature field
    collection.schema.addField(new SchemaField({
        "system": false,
        "name": "delivery_signature",
        "type": "file",
        "required": false,
        "unique": false,
        "options": {
            "maxSelect": 1,
            "maxSize": 5242880,
            "mimeTypes": [
                "image/jpeg",
                "image/png",
                "image/webp"
            ],
            "thumbs": [
                "200x200"
            ]
        }
    }));
    
    // Add index for tracking number
    dao.db().exec(`CREATE INDEX idx_orders_tracking ON orders (tracking_number)`);
    
    return dao.saveCollection(collection);
}, (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("orders");
    
    // Remove fields on rollback
    collection.schema.removeField("tracking_number");
    collection.schema.removeField("shipping_carrier");
    collection.schema.removeField("estimated_delivery_date");
    collection.schema.removeField("actual_delivery_date");
    collection.schema.removeField("delivery_signature");
    
    // Drop index
    dao.db().exec(`DROP INDEX IF EXISTS idx_orders_tracking`);
    
    return dao.saveCollection(collection);
});