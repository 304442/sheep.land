/// <reference path="../pb_data/types.d.ts" />
// Create farm management collections

migrate((app) => {
    console.log("Creating farm management collections...");
    
    // Create farm_sheep collection (was farm_animals)
    const farmSheepCollection = new Collection({
        id: "farm_sheep_001",
        type: "base",
        name: "farm_sheep",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        updateRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        deleteRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        fields: [
            {
                name: "tag_id",
                type: "text",
                required: true,
                unique: true,
                min: 1,
                max: 50
            },
            {
                name: "name",
                type: "text",
                required: false,
                max: 100
            },
            {
                name: "type",
                type: "select",
                required: true,
                values: ["ewe", "ram", "lamb", "wether"]
            },
            {
                name: "breed",
                type: "text",
                required: false,
                max: 50
            },
            {
                name: "birth_date",
                type: "date",
                required: false
            },
            {
                name: "acquisition_date",
                type: "date",
                required: true
            },
            {
                name: "acquisition_price",
                type: "number",
                required: false,
                min: 0
            },
            {
                name: "weight_kg",
                type: "number",
                required: false,
                min: 0
            },
            {
                name: "health_status",
                type: "select",
                required: true,
                values: ["healthy", "sick", "quarantine", "treatment"]
            },
            {
                name: "location",
                type: "text",
                required: false,
                max: 100
            },
            {
                name: "notes",
                type: "text",
                required: false,
                max: 500
            },
            {
                name: "mother_tag",
                type: "text",
                required: false,
                max: 50
            },
            {
                name: "father_tag",
                type: "text",
                required: false,
                max: 50
            },
            {
                name: "is_pregnant",
                type: "bool",
                required: false
            },
            {
                name: "expected_lambing_date",
                type: "date",
                required: false
            },
            {
                name: "last_vaccination_date",
                type: "date",
                required: false
            },
            {
                name: "is_for_sale",
                type: "bool",
                required: false
            },
            {
                name: "sale_price",
                type: "number",
                required: false,
                min: 0
            },
            {
                name: "sold_date",
                type: "date",
                required: false
            },
            {
                name: "death_date",
                type: "date",
                required: false
            }
        ]
    });
    
    app.save(farmSheepCollection);
    console.log("✅ farm_sheep collection created");
    
    // Create feed_inventory collection
    const feedInventoryCollection = new Collection({
        id: "feed_inventory_001",
        type: "base",
        name: "feed_inventory",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        updateRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        deleteRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        fields: [
            {
                name: "feed_type",
                type: "text",
                required: true,
                max: 100
            },
            {
                name: "quantity_kg",
                type: "number",
                required: true,
                min: 0
            },
            {
                name: "unit_price",
                type: "number",
                required: false,
                min: 0
            },
            {
                name: "supplier",
                type: "text",
                required: false,
                max: 200
            },
            {
                name: "purchase_date",
                type: "date",
                required: true
            },
            {
                name: "expiry_date",
                type: "date",
                required: false
            },
            {
                name: "notes",
                type: "text",
                required: false,
                max: 500
            }
        ]
    });
    
    app.save(feedInventoryCollection);
    console.log("✅ feed_inventory collection created");
    
    // Create health_records collection
    const healthRecordsCollection = new Collection({
        id: "health_records_001",
        type: "base",
        name: "health_records",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        updateRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        deleteRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        fields: [
            {
                name: "sheep_id",
                type: "relation",
                required: true,
                collectionId: "farm_sheep_001",
                cascadeDelete: true,
                maxSelect: 1
            },
            {
                name: "record_type",
                type: "select",
                required: true,
                values: ["vaccination", "treatment", "checkup", "injury", "disease"]
            },
            {
                name: "record_date",
                type: "date",
                required: true
            },
            {
                name: "description",
                type: "text",
                required: true,
                max: 500
            },
            {
                name: "medication",
                type: "text",
                required: false,
                max: 200
            },
            {
                name: "dosage",
                type: "text",
                required: false,
                max: 100
            },
            {
                name: "veterinarian",
                type: "text",
                required: false,
                max: 100
            },
            {
                name: "cost",
                type: "number",
                required: false,
                min: 0
            },
            {
                name: "follow_up_date",
                type: "date",
                required: false
            }
        ]
    });
    
    app.save(healthRecordsCollection);
    console.log("✅ health_records collection created");
    
    // Create financial_transactions collection
    const financialTransactionsCollection = new Collection({
        id: "financial_transactions_001",
        type: "base",
        name: "financial_transactions",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        updateRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        deleteRule: "@request.auth.id != '' && @request.auth.is_admin = true",
        fields: [
            {
                name: "transaction_type",
                type: "select",
                required: true,
                values: ["income", "expense"]
            },
            {
                name: "category",
                type: "select",
                required: true,
                values: ["sheep_sale", "sheep_purchase", "feed", "medication", "equipment", "labor", "utilities", "other"]
            },
            {
                name: "amount",
                type: "number",
                required: true,
                min: 0
            },
            {
                name: "transaction_date",
                type: "date",
                required: true
            },
            {
                name: "description",
                type: "text",
                required: true,
                max: 500
            },
            {
                name: "reference_id",
                type: "text",
                required: false,
                max: 100
            },
            {
                name: "payment_method",
                type: "select",
                required: false,
                values: ["cash", "bank_transfer", "check", "credit", "other"]
            }
        ]
    });
    
    app.save(financialTransactionsCollection);
    console.log("✅ financial_transactions collection created");
    
    // Create feasibility_analyses collection
    const feasibilityAnalysesCollection = new Collection({
        id: "feasibility_analyses_001",
        type: "base",
        name: "feasibility_analyses",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != '' && @request.auth.id = user_id",
        deleteRule: "@request.auth.id != '' && @request.auth.id = user_id",
        fields: [
            {
                name: "user_id",
                type: "relation",
                required: false,
                collectionId: "_pb_users_auth_",
                cascadeDelete: true,
                maxSelect: 1
            },
            {
                name: "analysis_name",
                type: "text",
                required: true,
                max: 200
            },
            {
                name: "analysis_data",
                type: "json",
                required: true
            },
            {
                name: "total_investment",
                type: "number",
                required: true,
                min: 0
            },
            {
                name: "expected_roi",
                type: "number",
                required: true
            },
            {
                name: "payback_period_months",
                type: "number",
                required: true,
                min: 0
            },
            {
                name: "notes",
                type: "text",
                required: false,
                max: 1000
            }
        ]
    });
    
    app.save(feasibilityAnalysesCollection);
    console.log("✅ feasibility_analyses collection created");
    
    console.log("✅ All farm management collections created successfully");
    
}, (app) => {
    // Delete collections in reverse order
    ["feasibility_analyses", "financial_transactions", "health_records", "feed_inventory", "farm_sheep"].forEach(name => {
        try {
            const col = app.findCollectionByNameOrId(name);
            if (col) app.delete(col);
        } catch (e) {}
    });
});