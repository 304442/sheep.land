/// <reference path="../pb_data/types.d.ts" />
// Add is_admin field to users collection

migrate((app) => {
    console.log("Adding is_admin field to users...");
    
    const collection = app.findCollectionByNameOrId("users");
    
    // Add is_admin field
    const adminField = new BoolField({
        id: "isadmin",
        name: "is_admin",
        required: false
    });
    
    collection.fields.add(adminField);
    app.save(collection);
    
    console.log("✅ Added is_admin field to users collection");
    
    // Create admin user
    try {
        const usersCollection = app.findCollectionByNameOrId("users");
        const adminRecord = new Record(usersCollection);
        
        adminRecord.set("email", "admin@sheep.land");
        adminRecord.set("username", "admin");
        adminRecord.set("password", "admin@sheep2024");
        adminRecord.set("passwordConfirm", "admin@sheep2024");
        adminRecord.set("is_admin", true);
        adminRecord.set("name", "مدير النظام");
        adminRecord.set("verified", true);
        
        app.save(adminRecord);
        console.log("✅ Created admin user: admin@sheep.land / admin@sheep2024");
    } catch (e) {
        if (e.message.includes("unique")) {
            console.log("Admin user already exists");
        } else {
            console.log("Error creating admin user:", e.message);
        }
    }
    
}, (app) => {
    // Remove is_admin field
    const collection = app.findCollectionByNameOrId("users");
    collection.fields.removeByName("is_admin");
    app.save(collection);
});