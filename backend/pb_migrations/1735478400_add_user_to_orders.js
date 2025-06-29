/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    // In PocketBase v0.28.4, db is the app instance with DAO methods
    const collection = db.findCollectionByNameOrId("orders");
    
    // Add user field
    const userField = new RelationField({
        "name": "user",
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": false,
        "minSelect": null,
        "maxSelect": 1
    });
    userField.id = "userrelation";
    userField.required = false;
    
    collection.fields.add(userField);
    
    // Keep existing rules for now - they'll be updated in a separate migration
    // to avoid validation errors when the user field doesn't exist yet
    
    // Save collection with new field
    return db.save(collection);
    
}, (db) => {
    const collection = db.findCollectionByNameOrId("orders");
    
    // Remove user field
    collection.fields.removeByName("user");
    
    // Revert collection rules
    collection.listRule = "(@request.query.lookupOrderID != '' && order_id_text = @request.query.lookupOrderID) || @request.auth.is_admin = true";
    collection.viewRule = "(@request.query.lookupOrderID != '' && order_id_text = @request.query.lookupOrderID) || @request.auth.is_admin = true";
    
    return db.save(collection);
});