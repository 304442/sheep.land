// PocketBase Synchronization for Farm Management System
// Connects farm management with existing PocketBase e-commerce database

class PocketBaseSync {
    constructor() {
        this.pb = null;
        this.isConnected = false;
        this.syncInProgress = false;
        this.lastSync = null;
        this.collections = {
            animals: 'farm_sheep',
            inventory: 'feed_inventory', 
            health_records: 'health_records',
            matings: 'farm_matings',
            tasks: 'farm_tasks',
            equipment: 'farm_equipment',
            customers: 'users', // Existing users collection
            products: 'products', // Existing products collection
            orders: 'orders' // Existing orders collection
        };
    }
    
    // Initialize PocketBase connection
    async initialize() {
        try {
            // Use the same PocketBase instance as the main site
            this.pb = new PocketBase('/');
            
            // Check if connected
            const health = await this.pb.health.check();
            if (health.code === 200) {
                this.isConnected = true;
                console.log('✅ Connected to PocketBase');
                
                // Initialize collections if needed
                await this.initializeCollections();
                
                // Setup real-time subscriptions
                this.setupSubscriptions();
                
                // Initial sync
                await this.performInitialSync();
                
                return true;
            }
        } catch (error) {
            console.error('❌ PocketBase connection failed:', error);
            this.isConnected = false;
            return false;
        }
    }
    
    // Create farm management collections if they don't exist
    async initializeCollections() {
        try {
            // Check if farm collections exist
            const collections = await this.pb.collections.getFullList();
            const existingNames = collections.map(c => c.name);
            
            // Check for farm_sheep collection (renamed from farm_animals)
            if (!existingNames.includes('farm_sheep')) {
                console.log('Note: farm_sheep collection should be created by migrations');
            }
            
            // Create farm_inventory collection
            if (!existingNames.includes('feed_inventory')) {
                await this.createInventoryCollection();
            }
            
            // Create farm_health_records collection
            if (!existingNames.includes('health_records')) {
                await this.createHealthRecordsCollection();
            }
            
            // Create other collections as needed
            await this.createRemainingCollections(existingNames);
            
        } catch (error) {
            console.error('Collection initialization error:', error);
        }
    }
    
    // Create animals collection schema
    async createAnimalsCollection() {
        const schema = {
            name: 'farm_sheep',
            type: 'base',
            schema: [
                {
                    name: 'tag_id',
                    type: 'text',
                    required: true,
                    options: { min: 1, max: 50 }
                },
                {
                    name: 'name',
                    type: 'text',
                    options: { min: 0, max: 100 }
                },
                {
                    name: 'breed',
                    type: 'text',
                    required: true
                },
                {
                    name: 'sex',
                    type: 'select',
                    required: true,
                    options: {
                        values: ['male', 'female']
                    }
                },
                {
                    name: 'birth_date',
                    type: 'date'
                },
                {
                    name: 'status',
                    type: 'select',
                    required: true,
                    options: {
                        values: ['active', 'sold', 'deceased', 'culled']
                    }
                },
                {
                    name: 'dam_id',
                    type: 'relation',
                    options: {
                        collectionId: 'farm_sheep',
                        cascadeDelete: false
                    }
                },
                {
                    name: 'sire_id',
                    type: 'relation',
                    options: {
                        collectionId: 'farm_sheep',
                        cascadeDelete: false
                    }
                },
                {
                    name: 'weight_history',
                    type: 'json'
                },
                {
                    name: 'photos',
                    type: 'file',
                    options: {
                        maxSelect: 5,
                        maxSize: 5242880, // 5MB
                        mimeTypes: ['image/jpeg', 'image/png']
                    }
                },
                {
                    name: 'for_sale',
                    type: 'bool',
                    options: { default: true }
                },
                {
                    name: 'price',
                    type: 'number',
                    options: { min: 0 }
                },
                {
                    name: 'notes',
                    type: 'editor'
                }
            ],
            indexes: ['tag_id', 'breed', 'status']
        };
        
        return await this.pb.collections.create(schema);
    }
    
    // Sync local farm data to PocketBase
    async syncToCloud() {
        if (!this.isConnected || this.syncInProgress) return;
        
        this.syncInProgress = true;
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        
        try {
            // Sync animals
            await this.syncAnimals(results);
            
            // Sync inventory
            await this.syncInventory(results);
            
            // Sync health records
            await this.syncHealthRecords(results);
            
            // Sync tasks
            await this.syncTasks(results);
            
            // Update products from animals
            await this.updateProductsFromAnimals(results);
            
            this.lastSync = new Date();
            showSfmAppNotification(
                `تمت المزامنة: ${results.success} نجح، ${results.failed} فشل`,
                results.failed > 0 ? 'warning' : 'success'
            );
            
        } catch (error) {
            console.error('Sync error:', error);
            results.errors.push(error.message);
        } finally {
            this.syncInProgress = false;
        }
        
        return results;
    }
    
    // Sync animals collection
    async syncAnimals(results) {
        const localAnimals = sfmData.animals;
        
        for (const animal of localAnimals) {
            try {
                // Check if animal exists in PocketBase
                let pbAnimal;
                try {
                    pbAnimal = await this.pb.collection('farm_sheep')
                        .getFirstListItem(`tag_id = "${animal.tagId}"`);
                } catch (e) {
                    // Animal doesn't exist, create it
                    pbAnimal = null;
                }
                
                // Prepare data for PocketBase
                const animalData = {
                    tag_id: animal.tagId,
                    name: animal.name || '',
                    breed: animal.breed,
                    sex: animal.sex,
                    birth_date: animal.birthDate,
                    status: animal.status,
                    dam_id: animal.damId || null,
                    sire_id: animal.sireId || null,
                    weight_history: animal.weightHistory || [],
                    for_sale: animal.forSale !== false,
                    price: this.calculateAnimalPrice(animal),
                    notes: animal.notes || ''
                };
                
                // Handle photos separately
                if (animal.photoDataUrl && !pbAnimal) {
                    // Convert data URL to blob for upload
                    const photoBlob = this.dataURLtoBlob(animal.photoDataUrl);
                    const formData = new FormData();
                    Object.entries(animalData).forEach(([key, value]) => {
                        formData.append(key, JSON.stringify(value));
                    });
                    formData.append('photos', photoBlob, `${animal.tagId}.jpg`);
                    animalData._formData = formData;
                }
                
                if (pbAnimal) {
                    // Update existing
                    await this.pb.collection('farm_sheep').update(pbAnimal.id, animalData);
                } else {
                    // Create new
                    await this.pb.collection('farm_sheep').create(
                        animalData._formData || animalData
                    );
                }
                
                results.success++;
                
            } catch (error) {
                console.error(`Failed to sync animal ${animal.tagId}:`, error);
                results.failed++;
                results.errors.push(`Animal ${animal.tagId}: ${error.message}`);
            }
        }
    }
    
    // Update products based on animals
    async updateProductsFromAnimals(results) {
        try {
            // Get animals marked for sale
            const forSaleAnimals = await this.pb.collection('farm_sheep')
                .getFullList({
                    filter: 'status = "active" && for_sale = true'
                });
            
            for (const animal of forSaleAnimals) {
                try {
                    // Check if product exists for this animal
                    let product;
                    const productKey = `live_animal_${animal.id}`;
                    
                    try {
                        product = await this.pb.collection('products')
                            .getFirstListItem(`item_key_pb = "${productKey}"`);
                    } catch (e) {
                        product = null;
                    }
                    
                    // Get latest weight
                    const latestWeight = animal.weight_history?.length > 0 
                        ? animal.weight_history[animal.weight_history.length - 1].weight
                        : 40; // Default weight
                    
                    const productData = {
                        item_key_pb: productKey,
                        category: 'live_sheep',
                        name_ar: `${animal.breed} - ${animal.tag_id}`,
                        name_en: `${animal.breed} - ${animal.tag_id}`,
                        description_ar: this.generateAnimalDescriptionAr(animal, latestWeight),
                        description_en: this.generateAnimalDescriptionEn(animal, latestWeight),
                        is_active: true,
                        specs_weight: {
                            min: Math.floor(latestWeight * 0.95),
                            max: Math.ceil(latestWeight * 1.05),
                            avg: latestWeight
                        },
                        price_egp: animal.price || latestWeight * 120,
                        has_stock: true,
                        initial_stock: 1,
                        current_stock: 1,
                        breed: animal.breed,
                        tier: animal.premium ? 'premium' : 'standard',
                        sort_order_type: 10,
                        sort_order_variant: animal.premium ? 1 : 2,
                        // Link to farm animal
                        farm_animal_id: animal.id,
                        farm_data: {
                            tag_id: animal.tag_id,
                            birth_date: animal.birth_date,
                            sex: animal.sex,
                            health_status: 'certified',
                            last_weight: latestWeight,
                            age_months: this.calculateAgeMonths(animal.birth_date)
                        }
                    };
                    
                    if (product) {
                        await this.pb.collection('products').update(product.id, productData);
                    } else {
                        await this.pb.collection('products').create(productData);
                    }
                    
                    results.success++;
                    
                } catch (error) {
                    console.error(`Failed to sync product for animal ${animal.tag_id}:`, error);
                    results.failed++;
                }
            }
            
        } catch (error) {
            console.error('Product sync error:', error);
            results.errors.push(`Product sync: ${error.message}`);
        }
    }
    
    // Setup real-time subscriptions
    setupSubscriptions() {
        // Subscribe to orders for farm task creation
        this.pb.collection('orders').subscribe('*', (e) => {
            if (e.action === 'create') {
                this.handleNewOrder(e.record);
            } else if (e.action === 'update') {
                this.handleOrderUpdate(e.record);
            }
        });
        
        // Subscribe to farm animals changes
        this.pb.collection('farm_sheep').subscribe('*', (e) => {
            if (e.action === 'update' || e.action === 'delete') {
                this.syncAnimalToLocal(e.record, e.action);
            }
        });
    }
    
    // Handle new order from e-commerce
    async handleNewOrder(order) {
        console.log('📦 New order received:', order.order_id_text);
        
        // Check if order contains live animals or requires farm action
        const farmItems = order.line_items.filter(item => 
            ['live_sheep', 'udheya', 'aqiqah'].includes(item.product_category)
        );
        
        if (farmItems.length === 0) return;
        
        // Create farm tasks for the order
        for (const item of farmItems) {
            const task = {
                id: generateUUID(),
                title: `طلب ${order.order_id_text} - ${item.name_ar}`,
                description: `تجهيز ${item.quantity} ${item.name_ar} للعميل ${order.customer_name}`,
                dueDate: this.calculateDueDate(order, item),
                priority: 'high',
                status: 'pending',
                category: 'order',
                orderId: order.id,
                orderNumber: order.order_id_text,
                customerName: order.customer_name,
                customerPhone: order.customer_phone,
                itemDetails: item
            };
            
            // Add to local tasks
            sfmData.tasks.push(task);
            
            // If it's a live animal, reserve it
            if (item.product_category === 'live_sheep' && item.farm_animal_id) {
                await this.reserveAnimal(item.farm_animal_id, order.id);
            }
        }
        
        // Save and update UI
        saveSfmDataToLocalStorage();
        renderTaskList();
        showSfmAppNotification(
            `طلب جديد: ${order.order_id_text}`,
            'info'
        );
    }
    
    // Reserve animal for order
    async reserveAnimal(animalId, orderId) {
        try {
            // Update in PocketBase
            await this.pb.collection('farm_sheep').update(animalId, {
                status: 'reserved',
                reserved_for_order: orderId,
                reserved_until: new Date(Date.now() + 48*60*60*1000) // 48 hours
            });
            
            // Update locally
            const localAnimal = sfmData.animals.find(a => 
                a.tagId === animalId || a.id === animalId
            );
            if (localAnimal) {
                localAnimal.status = 'reserved';
                localAnimal.reservedFor = orderId;
                saveSfmDataToLocalStorage();
                renderAnimalList();
            }
            
        } catch (error) {
            console.error('Failed to reserve animal:', error);
        }
    }
    
    // Sync from cloud to local
    async syncFromCloud() {
        if (!this.isConnected) return;
        
        try {
            // Sync animals
            const pbAnimals = await this.pb.collection('farm_sheep').getFullList();
            
            pbAnimals.forEach(pbAnimal => {
                const localIndex = sfmData.animals.findIndex(a => 
                    a.tagId === pbAnimal.tag_id
                );
                
                const localAnimal = {
                    id: pbAnimal.id,
                    tagId: pbAnimal.tag_id,
                    name: pbAnimal.name,
                    breed: pbAnimal.breed,
                    sex: pbAnimal.sex,
                    birthDate: pbAnimal.birth_date,
                    status: pbAnimal.status,
                    damId: pbAnimal.dam_id,
                    sireId: pbAnimal.sire_id,
                    weightHistory: pbAnimal.weight_history || [],
                    notes: pbAnimal.notes,
                    forSale: pbAnimal.for_sale,
                    // Add cloud sync metadata
                    cloudId: pbAnimal.id,
                    lastCloudSync: pbAnimal.updated
                };
                
                if (localIndex >= 0) {
                    // Update existing
                    sfmData.animals[localIndex] = {
                        ...sfmData.animals[localIndex],
                        ...localAnimal
                    };
                } else {
                    // Add new
                    sfmData.animals.push(localAnimal);
                }
            });
            
            saveSfmDataToLocalStorage();
            refreshAllSfmDataViews();
            
        } catch (error) {
            console.error('Sync from cloud error:', error);
        }
    }
    
    // Helper methods
    calculateAnimalPrice(animal) {
        const weight = this.getLatestWeight(animal);
        const basePrice = 120; // EGP per kg
        let multiplier = 1;
        
        // Breed multipliers
        const breedMultipliers = {
            'رحماني': 1.15,
            'برقي': 1.10,
            'عسافي': 1.20
        };
        
        multiplier *= breedMultipliers[animal.breed] || 1;
        
        // Age factor
        const ageMonths = this.calculateAgeMonths(animal.birthDate);
        if (ageMonths >= 6 && ageMonths <= 12) {
            multiplier *= 1.1;
        }
        
        return Math.round(weight * basePrice * multiplier);
    }
    
    getLatestWeight(animal) {
        if (!animal.weightHistory || animal.weightHistory.length === 0) {
            return 40; // Default
        }
        return animal.weightHistory[animal.weightHistory.length - 1].weight;
    }
    
    calculateAgeMonths(birthDate) {
        if (!birthDate) return 0;
        const birth = new Date(birthDate);
        const now = new Date();
        return (now.getFullYear() - birth.getFullYear()) * 12 + 
               (now.getMonth() - birth.getMonth());
    }
    
    generateAnimalDescriptionAr(animal, weight) {
        const age = this.calculateAgeMonths(animal.birth_date);
        return `${animal.breed} من مزارعنا الخاصة
العمر: ${age} شهر
الوزن: ${weight} كجم
الجنس: ${animal.sex === 'male' ? 'ذكر' : 'أنثى'}
صحة ممتازة مع شهادة بيطرية`;
    }
    
    generateAnimalDescriptionEn(animal, weight) {
        const age = this.calculateAgeMonths(animal.birth_date);
        return `${animal.breed} from our farms
Age: ${age} months
Weight: ${weight} kg
Gender: ${animal.sex}
Excellent health with veterinary certificate`;
    }
    
    dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type: mime});
    }
    
    calculateDueDate(order, item) {
        // For Udheya, use the sacrifice date
        if (item.udheya_details?.sacrificeDay) {
            return item.udheya_details.sacrificeDay;
        }
        
        // For delivery, use delivery date
        if (order.delivery_date) {
            return order.delivery_date;
        }
        
        // Default to 3 days from now
        const date = new Date();
        date.setDate(date.getDate() + 3);
        return date.toISOString().split('T')[0];
    }
}

// Initialize PocketBase sync
const pbSync = new PocketBaseSync();

// Add sync status to UI
function addPocketBaseSyncUI() {
    // Add sync button to header
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('pbSyncBtn')) {
        const syncBtn = document.createElement('button');
        syncBtn.id = 'pbSyncBtn';
        syncBtn.className = 'header-btn';
        syncBtn.innerHTML = '☁️';
        syncBtn.title = 'مزامنة السحابة';
        syncBtn.onclick = async () => {
            syncBtn.disabled = true;
            syncBtn.innerHTML = '⏳';
            
            if (!pbSync.isConnected) {
                await pbSync.initialize();
            }
            
            if (pbSync.isConnected) {
                await pbSync.syncToCloud();
            } else {
                showSfmAppNotification('فشل الاتصال بالخادم', 'error');
            }
            
            syncBtn.disabled = false;
            syncBtn.innerHTML = '☁️';
        };
        
        headerActions.appendChild(syncBtn);
    }
    
    // Add sync status to dashboard
    const dashboard = document.getElementById('dashboardStats');
    if (dashboard && !document.getElementById('cloudSyncCard')) {
        const syncCard = document.createElement('div');
        syncCard.id = 'cloudSyncCard';
        syncCard.className = 'stat-card';
        syncCard.innerHTML = `
            <div class="stat-value" id="syncStatus">
                ${pbSync.isConnected ? '✅' : '❌'}
            </div>
            <div class="stat-label">السحابة</div>
        `;
        syncCard.onclick = showSyncDetails;
        dashboard.appendChild(syncCard);
    }
}

// Show sync details
function showSyncDetails() {
    const modalContent = `
        <div class="sync-details">
            <h4>تفاصيل مزامنة السحابة</h4>
            <div class="info-grid">
                <div class="info-item">
                    <label>الحالة:</label>
                    <span class="${pbSync.isConnected ? 'text-success' : 'text-danger'}">
                        ${pbSync.isConnected ? 'متصل' : 'غير متصل'}
                    </span>
                </div>
                <div class="info-item">
                    <label>آخر مزامنة:</label>
                    <span>${pbSync.lastSync ? sfmFormatDate(pbSync.lastSync, 'long') : 'لم تتم'}</span>
                </div>
                <div class="info-item">
                    <label>الخادم:</label>
                    <span>${window.location.origin}</span>
                </div>
            </div>
            
            <div class="sync-actions">
                <button class="btn btn-primary" onclick="syncNow()">
                    🔄 مزامنة الآن
                </button>
                <button class="btn btn-secondary" onclick="syncFromCloudNow()">
                    ⬇️ جلب من السحابة
                </button>
                <button class="btn btn-info" onclick="showSyncLog()">
                    📋 سجل المزامنة
                </button>
            </div>
            
            <div class="sync-info">
                <p>المزامنة تربط بيانات المزرعة مع المتجر الإلكتروني وتتيح:</p>
                <ul>
                    <li>عرض الحيوانات للبيع تلقائياً في المتجر</li>
                    <li>استقبال الطلبات مباشرة في نظام المزرعة</li>
                    <li>تحديث المخزون في الوقت الفعلي</li>
                    <li>النسخ الاحتياطي السحابي</li>
                </ul>
            </div>
        </div>
    `;
    
    openSfmFormModal('مزامنة السحابة', modalContent, 'closeSfmFormModal');
}

// Sync functions for modal
async function syncNow() {
    closeSfmFormModal();
    document.getElementById('pbSyncBtn')?.click();
}

async function syncFromCloudNow() {
    closeSfmFormModal();
    await pbSync.syncFromCloud();
    showSfmAppNotification('تم جلب البيانات من السحابة', 'success');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async function() {
    // Add UI elements
    addPocketBaseSyncUI();
    
    // Initialize PocketBase connection
    setTimeout(async () => {
        await pbSync.initialize();
        
        // Update sync status indicator
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) {
            syncStatus.textContent = pbSync.isConnected ? '✅' : '❌';
        }
    }, 1000);
});