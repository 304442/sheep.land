// Setup Modal System for Sheep Land
// Handles database initialization and setup functionality

// Setup system initialization
document.addEventListener('alpine:init', () => {
    Alpine.data('setupSystem', () => ({
        // Setup Modal State
        isSetupModalOpen: false,
        
        // Setup Configuration
        setupConfig: {
            pbUrl: '/',
            adminEmail: 'admin@example.com', 
            adminPassword: 'unifiedpassword',
            collections: '',
            seedData: ''
        },
        
        // Validation State
        setupValidation: {
            collections: { valid: false, message: '' },
            seedData: { valid: false, message: '' }
        },
        
        // Loading and Output
        setupLoading: false,
        setupOutput: [],

        // Modal Functions
        openSetupModal() { 
            this.isSetupModalOpen = true; 
            document.body.classList.add('overflow-hidden'); 
            this.initializeSetupData();
        },
        
        closeSetupModal() { 
            this.isSetupModalOpen = false; 
            document.body.classList.remove('overflow-hidden'); 
            this.setupLoading = false;
            this.setupOutput = [];
        },

        // Data Initialization
        initializeSetupData() {
            // Load default collections and seed data
            this.setupConfig.collections = JSON.stringify(this.getDefaultCollections(), null, 2);
            this.setupConfig.seedData = JSON.stringify(this.getDefaultSeedData(), null, 2);
            
            // Trigger validation
            this.$nextTick(() => {
                this.validateCollections();
                this.validateSeedData();
            });
        },

        // Validation Functions
        validateCollections() {
            try {
                const collections = JSON.parse(this.setupConfig.collections);
                
                if (!Array.isArray(collections)) {
                    this.setupValidation.collections = { valid: false, message: "❌ Must be an array of collections" };
                    return;
                }
                
                if (collections.length === 0) {
                    this.setupValidation.collections = { valid: false, message: "❌ At least one collection required" };
                    return;
                }
                
                for (let i = 0; i < collections.length; i++) {
                    const collection = collections[i];
                    const requiredFields = ['name', 'type', 'listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule', 'fields'];
                    const missingFields = requiredFields.filter(field => !(field in collection));
                    
                    if (missingFields.length > 0) {
                        this.setupValidation.collections = { valid: false, message: `❌ Collection ${i + 1} missing: ${missingFields.join(', ')}` };
                        return;
                    }
                    
                    if (typeof collection.name !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(collection.name)) {
                        this.setupValidation.collections = { valid: false, message: `❌ Collection ${i + 1} invalid name` };
                        return;
                    }
                    
                    if (!Array.isArray(collection.fields)) {
                        this.setupValidation.collections = { valid: false, message: `❌ Collection ${i + 1} fields must be array` };
                        return;
                    }
                }
                
                this.setupValidation.collections = { valid: true, message: `✅ Valid collections (${collections.length})` };
                
            } catch (error) {
                this.setupValidation.collections = { valid: false, message: `❌ JSON Parse Error: ${error.message}` };
            }
        },

        validateSeedData() {
            try {
                const seedData = JSON.parse(this.setupConfig.seedData);
                
                if (!seedData || typeof seedData !== 'object') {
                    this.setupValidation.seedData = { valid: false, message: "❌ Must be an object" };
                    return;
                }
                
                const requiredSections = ['settings', 'products'];
                const foundSections = Object.keys(seedData);
                const missingSections = requiredSections.filter(name => !foundSections.includes(name));
                
                if (missingSections.length > 0) {
                    this.setupValidation.seedData = { valid: false, message: `❌ Missing required sections: ${missingSections.join(', ')}` };
                    return;
                }
                
                if (!Array.isArray(seedData.settings) || seedData.settings.length === 0) {
                    this.setupValidation.seedData = { valid: false, message: "❌ Settings must be non-empty array" };
                    return;
                }
                
                if (!Array.isArray(seedData.products)) {
                    this.setupValidation.seedData = { valid: false, message: "❌ Products must be an array" };
                    return;
                }
                
                this.setupValidation.seedData = { valid: true, message: `✅ Valid seed data (${seedData.products.length} products)` };
                
            } catch (error) {
                this.setupValidation.seedData = { valid: false, message: `❌ JSON Parse Error: ${error.message}` };
            }
        },

        canRunSetup() {
            return this.setupValidation.collections.valid && this.setupValidation.seedData.valid;
        },

        // Logging System
        setupLog(message, type = 'i', data = null) {
            const time = new Date().toTimeString().slice(0, 8);
            const entry = {
                id: Date.now(),
                time,
                message,
                type,
                data: data ? JSON.stringify(data, null, 1) : null
            };
            this.setupOutput.push(entry);
        },

        // PocketBase Authentication
        async authenticateAdmin(pb) {
            try {
                await pb.admins.authWithPassword(this.setupConfig.adminEmail, this.setupConfig.adminPassword);
                this.setupLog('🔑 Admin authentication successful', 's');
                return true;
            } catch (error) {
                this.setupLog(`❌ Admin authentication failed: ${error.message}`, 'e');
                return false;
            }
        },

        // Setup Operations
        async runFullSetup() {
            this.setupLoading = true;
            this.setupOutput = [];
            this.setupLog('🚀 === FULL SETUP PROCESS STARTED ===', 'i');
            
            const pb = new PocketBase(this.setupConfig.pbUrl);
            
            try {
                // First run schema setup
                const schemaSuccess = await this.runSetupSchema(pb);
                
                if (!schemaSuccess) {
                    this.setupLog('❌ Schema setup failed, aborting full setup', 'e');
                    return;
                }
                
                // Then run seed data
                const seedSuccess = await this.runSetupSeedData(pb);
                
                if (seedSuccess) {
                    this.setupLog('🎉 === FULL SETUP COMPLETED SUCCESSFULLY ===', 's');
                    // Refresh the page after successful setup
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    this.setupLog('⚠️ Setup completed with errors', 'w');
                }
                
            } catch (error) {
                this.setupLog(`💥 CRITICAL ERROR during full setup: ${error.message}`, 'e');
            } finally {
                if (pb.authStore.isValid) pb.authStore.clear();
                this.setupLoading = false;
            }
        },

        async runSchemaOnly() {
            this.setupLoading = true;
            this.setupOutput = [];
            this.setupLog('📋 === SCHEMA SETUP STARTED ===', 'i');
            
            const pb = new PocketBase(this.setupConfig.pbUrl);
            
            try {
                await this.runSetupSchema(pb);
                this.setupLog('✅ Schema setup completed', 's');
            } catch (error) {
                this.setupLog(`❌ Schema setup failed: ${error.message}`, 'e');
            } finally {
                if (pb.authStore.isValid) pb.authStore.clear();
                this.setupLoading = false;
            }
        },

        async runSetupSchema(pb) {
            if (!await this.authenticateAdmin(pb)) return false;

            this.setupLog('📋 Processing collections...', 'i');
            
            let collections;
            try {
                collections = JSON.parse(this.setupConfig.collections);
            } catch (e) {
                this.setupLog('❌ Invalid Collections JSON: ' + e.message, 'e');
                return false;
            }
            
            try {
                for (const collection of collections) {
                    this.setupLog(`Creating/updating collection: ${collection.name}`, 'i');
                    
                    try {
                        // Try to get existing collection
                        await pb.collections.getOne(collection.name);
                        // If it exists, update it
                        await pb.collections.update(collection.name, collection);
                        this.setupLog(`✅ Updated collection: ${collection.name}`, 's');
                    } catch (error) {
                        // If it doesn't exist, create it
                        await pb.collections.create(collection);
                        this.setupLog(`✅ Created collection: ${collection.name}`, 's');
                    }
                }
                
                this.setupLog('✅ Schema setup completed successfully', 's');
                return true;
                
            } catch (error) {
                this.setupLog(`❌ Collection setup failed: ${error.message}`, 'e');
                return false;
            }
        },

        async runSetupSeedData(pb) {
            this.setupLog('🌱 === SEED DATA PHASE ===', 'i');
            if (!await this.authenticateAdmin(pb)) return false;

            let seedData;
            try {
                seedData = JSON.parse(this.setupConfig.seedData);
            } catch (e) {
                this.setupLog('❌ Invalid Seed Data JSON: ' + e.message, 'e');
                return false;
            }

            try {
                // Seed settings
                for (const setting of seedData.settings) {
                    try {
                        await pb.collection('settings').create(setting);
                        this.setupLog(`✅ Created setting: ${setting.key}`, 's');
                    } catch (error) {
                        this.setupLog(`⚠️ Setting may already exist: ${setting.key}`, 'w');
                    }
                }

                // Seed products
                for (const product of seedData.products) {
                    try {
                        await pb.collection('products').create(product);
                        this.setupLog(`✅ Created product: ${product.item_key}`, 's');
                    } catch (error) {
                        this.setupLog(`⚠️ Product may already exist: ${product.item_key}`, 'w');
                    }
                }

                this.setupLog('✅ Seed data setup completed', 's');
                return true;

            } catch (error) {
                this.setupLog(`❌ Seed data setup failed: ${error.message}`, 'e');
                return false;
            }
        },

        async clearDatabase() {
            if (!confirm('Are you sure you want to clear the database? This action cannot be undone.')) {
                return;
            }

            this.setupLoading = true;
            this.setupOutput = [];
            this.setupLog('🗑️ === CLEARING DATABASE ===', 'i');
            
            const pb = new PocketBase(this.setupConfig.pbUrl);
            
            try {
                if (!await this.authenticateAdmin(pb)) return;

                // Get all collections
                const collections = await pb.collections.getFullList();
                
                for (const collection of collections) {
                    if (collection.system) continue; // Skip system collections
                    
                    try {
                        await pb.collections.delete(collection.id);
                        this.setupLog(`✅ Deleted collection: ${collection.name}`, 's');
                    } catch (error) {
                        this.setupLog(`❌ Failed to delete collection ${collection.name}: ${error.message}`, 'e');
                    }
                }
                
                this.setupLog('✅ Database cleared successfully', 's');
                
            } catch (error) {
                this.setupLog(`❌ Database clearing failed: ${error.message}`, 'e');
            } finally {
                if (pb.authStore.isValid) pb.authStore.clear();
                this.setupLoading = false;
            }
        },

        // Default Data Generators
        getDefaultCollections() {
            return [
                {
                    "name": "settings",
                    "type": "base",
                    "system": false,
                    "listRule": "",
                    "viewRule": "",
                    "createRule": "@request.auth.id != '' && @request.auth.verified = true",
                    "updateRule": "@request.auth.id != '' && @request.auth.verified = true",
                    "deleteRule": "@request.auth.id != '' && @request.auth.verified = true",
                    "fields": [
                        {
                            "name": "key",
                            "type": "text",
                            "required": true,
                            "presentable": true,
                            "unique": true,
                            "max": 100,
                            "min": 1,
                            "pattern": "^[a-z0-9_]+$"
                        },
                        {
                            "name": "value_text",
                            "type": "text",
                            "required": false,
                            "presentable": true,
                            "max": 1000
                        },
                        {
                            "name": "value_number",
                            "type": "number",
                            "required": false,
                            "presentable": true
                        },
                        {
                            "name": "value_bool",
                            "type": "bool",
                            "required": false,
                            "presentable": true
                        }
                    ]
                },
                {
                    "name": "products",
                    "type": "base",
                    "system": false,
                    "listRule": "",
                    "viewRule": "",
                    "createRule": "@request.auth.id != '' && @request.auth.verified = true",
                    "updateRule": "@request.auth.id != '' && @request.auth.verified = true",
                    "deleteRule": "@request.auth.id != '' && @request.auth.verified = true",
                    "fields": [
                        {
                            "name": "item_key",
                            "type": "text",
                            "required": true,
                            "presentable": true,
                            "unique": true,
                            "max": 100,
                            "min": 1,
                            "pattern": "^[a-z0-9_]+$"
                        },
                        {
                            "name": "product_category",
                            "type": "select",
                            "required": true,
                            "presentable": true,
                            "maxSelect": 1,
                            "values": ["udheya", "livesheep_general", "meat_cuts", "gathering_package"]
                        },
                        {
                            "name": "variant_name_en",
                            "type": "text",
                            "required": true,
                            "presentable": true,
                            "max": 150,
                            "min": 1
                        },
                        {
                            "name": "variant_name_ar",
                            "type": "text",
                            "required": true,
                            "presentable": true,
                            "max": 150,
                            "min": 1
                        },
                        {
                            "name": "base_price_egp",
                            "type": "number",
                            "required": true,
                            "presentable": true,
                            "min": 0
                        },
                        {
                            "name": "is_active",
                            "type": "bool",
                            "required": false,
                            "presentable": true
                        }
                    ]
                },
                {
                    "name": "users",
                    "type": "auth",
                    "system": false,
                    "listRule": "@request.auth.id = id || @request.auth.is_admin = true",
                    "viewRule": "@request.auth.id = id || @request.auth.is_admin = true",
                    "createRule": "",
                    "updateRule": "@request.auth.id = id || @request.auth.is_admin = true",
                    "deleteRule": "@request.auth.id = id || @request.auth.is_admin = true",
                    "options": {
                        "emailVisibility": true,
                        "requireEmailVerification": false,
                        "allowOAuth2Auth": false,
                        "allowUsernameAuth": false,
                        "allowPasswordAuth": true,
                        "onlyVerified": false
                    },
                    "fields": [
                        {
                            "name": "name",
                            "type": "text",
                            "required": false,
                            "presentable": true,
                            "max": 100
                        }
                    ]
                }
            ];
        },

        getDefaultSeedData() {
            return {
                "settings": [
                    {
                        "key": "site_title_en",
                        "value_text": "Sheep Land"
                    },
                    {
                        "key": "site_title_ar", 
                        "value_text": "أرض الأغنام"
                    },
                    {
                        "key": "enable_udheya_section",
                        "value_bool": true
                    }
                ],
                "products": [
                    {
                        "item_key": "sample_udheya_1",
                        "product_category": "udheya",
                        "variant_name_en": "Premium Udheya Sheep",
                        "variant_name_ar": "خروف أضحية فاخر",
                        "base_price_egp": 5000,
                        "is_active": true
                    }
                ]
            };
        }
    }));
});

// Global setup system access for compatibility
document.addEventListener('alpine:initialized', () => {
    window.setupSystem = {
        openSetupModal() {
            // Find the Alpine component instance and call openSetupModal
            const setupElement = document.querySelector('[x-data="setupSystem"]');
            if (setupElement && setupElement.__x) {
                setupElement.__x.$data.openSetupModal();
            }
        }
    };
});