/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("orders");
    
    // Add user field
    const userField = new SchemaField({
        "system": false,
        "id": "userrelation",
        "name": "user",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
            "collectionId": "_pb_users_auth_",
            "cascadeDelete": false,
            "minSelect": null,
            "maxSelect": 1,
            "displayFields": ["email"]
        }
    });
    
    collection.schema.addField(userField);
    
    // Update collection rules to allow user to see their own orders
    collection.listRule = "(@request.query.lookupOrderID != '' && order_id_text = @request.query.lookupOrderID) || (@request.auth.id != '' && user = @request.auth.id) || @request.auth.is_admin = true";
    collection.viewRule = "(@request.query.lookupOrderID != '' && order_id_text = @request.query.lookupOrderID) || (@request.auth.id != '' && user = @request.auth.id) || @request.auth.is_admin = true";
    
    // Save collection with new field
    return dao.saveCollection(collection);
    
}, (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("orders");
    
    // Remove user field
    collection.schema.removeField("userrelation");
    
    // Revert collection rules
    collection.listRule = "(@request.query.lookupOrderID != '' && order_id_text = @request.query.lookupOrderID) || @request.auth.is_admin = true";
    collection.viewRule = "(@request.query.lookupOrderID != '' && order_id_text = @request.query.lookupOrderID) || @request.auth.is_admin = true";
    
    return dao.saveCollection(collection);
});