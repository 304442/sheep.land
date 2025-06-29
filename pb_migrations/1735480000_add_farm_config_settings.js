/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    // db is the app instance with DAO methods
    const collection = db.findCollectionByNameOrId("settings");
    
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
    
    // Add each field using the appropriate field type constructor
    fields.forEach(fieldConfig => {
        let field;
        switch (fieldConfig.type) {
            case 'number':
                field = new NumberField(fieldConfig);
                break;
            case 'text':
                field = new TextField(fieldConfig);
                break;
            case 'bool':
                field = new BoolField(fieldConfig);
                break;
            case 'select':
                field = new SelectField(fieldConfig);
                break;
            case 'date':
                field = new DateField(fieldConfig);
                break;
            case 'json':
                field = new JSONField(fieldConfig);
                break;
            default:
                throw new Error(`Unknown field type: ${fieldConfig.type}`);
        }
        collection.fields.add(field);
    });
    
    return db.save(collection);
}, (db) => {
    // db is the app instance with DAO methods
    const collection = db.findCollectionByNameOrId("settings");
    
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
        collection.fields.removeByName(name);
    });
    
    return db.save(collection);
});