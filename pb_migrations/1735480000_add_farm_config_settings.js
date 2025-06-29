/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("settings");
    
    // Add farm management configuration fields
    const fields = [
        {
            "system": false,
            "id": "syncinterval",
            "name": "sync_interval_minutes",
            "type": "number",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "min": 1,
                "max": 60,
                "noDecimal": true
            }
        },
        {
            "system": false,
            "id": "sheepweight",
            "name": "sheep_market_ready_weight_kg",
            "type": "number",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "min": 20,
                "max": 100,
                "noDecimal": true
            }
        },
        {
            "system": false,
            "id": "sheepage",
            "name": "sheep_market_ready_age_months",
            "type": "number",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "min": 3,
                "max": 24,
                "noDecimal": true
            }
        },
        {
            "system": false,
            "id": "feedthreshold",
            "name": "low_feed_threshold_kg",
            "type": "number",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "min": 0,
                "max": 1000,
                "noDecimal": true
            }
        },
        {
            "system": false,
            "id": "vaccinterval",
            "name": "vaccination_interval_days",
            "type": "number",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "min": 30,
                "max": 365,
                "noDecimal": true
            }
        },
        {
            "system": false,
            "id": "lowmargin",
            "name": "financial_low_margin_threshold_percent",
            "type": "number",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "min": 0,
                "max": 100,
                "noDecimal": false
            }
        },
        {
            "system": false,
            "id": "highinventory",
            "name": "financial_high_inventory_months",
            "type": "number",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "min": 1,
                "max": 12,
                "noDecimal": false
            }
        }
    ];
    
    // Add each field
    fields.forEach(fieldConfig => {
        const field = new SchemaField(fieldConfig);
        collection.schema.addField(field);
    });
    
    return dao.saveCollection(collection);
}, (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("settings");
    
    // Remove fields in reverse migration
    const fieldNames = [
        "sync_interval_minutes",
        "sheep_market_ready_weight_kg", 
        "sheep_market_ready_age_months",
        "low_feed_threshold_kg",
        "vaccination_interval_days",
        "financial_low_margin_threshold_percent",
        "financial_high_inventory_months"
    ];
    
    fieldNames.forEach(name => {
        collection.schema.removeField(collection.schema.getFieldByName(name).id);
    });
    
    return dao.saveCollection(collection);
});