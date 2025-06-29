// Farm to Store Integration System
// Connects farm management with e-commerce platform

class FarmStoreIntegration {
    constructor() {
        this.syncInterval = 5 * 60 * 1000; // 5 minutes
        this.lastSync = null;
        this.syncQueue = [];
    }
    
    // Initialize two-way sync
    initializeSync() {
        // Check for PocketBase connection
        if (typeof pb !== 'undefined') {
            this.startRealtimeSync();
        } else {
            this.workOffline();
        }
        
        // Set up periodic sync
        setInterval(() => this.performSync(), this.syncInterval);
    }
    
    // Sync animal inventory with store products
    async syncAnimalInventory() {
        const activeAnimals = sfmData.animals.filter(a => 
            a.status === 'active' && 
            a.forSale !== false
        );
        
        const storeProducts = [];
        
        for (const animal of activeAnimals) {
            const product = await this.createProductFromAnimal(animal);
            storeProducts.push(product);
        }
        
        return this.updateStoreProducts(storeProducts);
    }
    
    // Convert animal to store product
    createProductFromAnimal(animal) {
        const recentWeight = this.getAnimalRecentWeight(animal.id);
        const price = this.calculateAnimalPrice(animal, recentWeight);
        const photos = animal.photos || [];
        
        return {
            id: `animal-${animal.id}`,
            type: 'live-sheep',
            name_ar: `${animal.breed} - ${animal.tagId}`,
            name_en: `${animal.breed} - ${animal.tagId}`,
            description_ar: this.generateAnimalDescription(animal, 'ar'),
            description_en: this.generateAnimalDescription(animal, 'en'),
            
            // Pricing
            price: price,
            weight: recentWeight,
            price_per_kg: Math.round(price / recentWeight),
            
            // Stock
            stock: 1,
            sku: `LIVE-${animal.tagId}`,
            
            // Details
            specifications: {
                breed: animal.breed,
                age: this.calculateAge(animal.birthDate),
                sex: animal.sex,
                weight: recentWeight,
                healthStatus: 'معتمد صحياً',
                vaccinationStatus: this.getVaccinationStatus(animal.id),
                source: 'مزرعة الشركة'
            },
            
            // Media
            images: photos.map(p => ({
                url: p.url || p.dataUrl,
                alt: `${animal.breed} ${animal.tagId}`
            })),
            
            // Categories
            categories: ['live-animals', animal.breed.toLowerCase()],
            tags: this.generateAnimalTags(animal),
            
            // Traceability
            traceability: {
                animalId: animal.id,
                farmLocation: sfmData.settings.farmName,
                birthDate: animal.birthDate,
                parentage: {
                    sire: animal.sireId,
                    dam: animal.damId
                }
            },
            
            // Availability
            available: true,
            featured: animal.premium || false,
            
            // Metadata
            created: animal.createdAt || new Date().toISOString(),
            updated: new Date().toISOString()
        };
    }
    
    // Calculate dynamic pricing
    calculateAnimalPrice(animal, weight) {
        const basePrice = 120; // EGP per kg
        let multiplier = 1;
        
        // Breed premium
        const breedPremiums = {
            'رحماني': 1.15,
            'برقي': 1.10,
            'عسافي': 1.20,
            'بلدي': 1.00
        };
        multiplier *= breedPremiums[animal.breed] || 1;
        
        // Age factor
        const ageMonths = this.calculateAgeMonths(animal.birthDate);
        if (ageMonths >= 6 && ageMonths <= 12) {
            multiplier *= 1.1; // Prime age
        }
        
        // Health premium
        if (this.hasCompleteHealthRecords(animal.id)) {
            multiplier *= 1.05;
        }
        
        // Market conditions
        const marketMultiplier = this.getMarketPriceMultiplier();
        multiplier *= marketMultiplier;
        
        return Math.round(weight * basePrice * multiplier);
    }
    
    // Generate product description
    generateAnimalDescription(animal, language) {
        if (language === 'ar') {
            return `
                ${animal.breed} أصيل من مزارعنا الخاصة.
                العمر: ${this.calculateAge(animal.birthDate)}
                الوزن الحالي: ${this.getAnimalRecentWeight(animal.id)} كجم
                
                مميزات:
                • تغذية طبيعية 100%
                • رعاية بيطرية كاملة
                • جاهز للذبح الحلال
                • شهادة صحية معتمدة
                
                ${animal.notes || ''}
            `.trim();
        } else {
            return `
                Pure ${animal.breed} from our farms.
                Age: ${this.calculateAge(animal.birthDate)}
                Current weight: ${this.getAnimalRecentWeight(animal.id)} kg
                
                Features:
                • 100% natural feeding
                • Complete veterinary care
                • Ready for Halal slaughter
                • Certified health certificate
                
                ${animal.notes || ''}
            `.trim();
        }
    }
    
    // Sync processed meat inventory
    async syncMeatInventory() {
        const meatProducts = [];
        
        // Get recent slaughter records
        const recentSlaughters = this.getRecentSlaughters();
        
        for (const slaughter of recentSlaughters) {
            const cuts = this.generateMeatCuts(slaughter);
            meatProducts.push(...cuts);
        }
        
        // Add to store
        return this.updateStoreMeatProducts(meatProducts);
    }
    
    // Generate meat cuts from slaughter
    generateMeatCuts(slaughter) {
        const cuts = [
            { name: 'فخذ', code: 'leg', yield: 0.20 },
            { name: 'كتف', code: 'shoulder', yield: 0.16 },
            { name: 'ضلوع', code: 'ribs', yield: 0.14 },
            { name: 'صدر', code: 'breast', yield: 0.08 },
            { name: 'رقبة', code: 'neck', yield: 0.06 },
            { name: 'مفروم', code: 'minced', yield: 0.10 }
        ];
        
        const carcassWeight = slaughter.weight * 0.45; // 45% yield
        
        return cuts.map(cut => ({
            id: `meat-${slaughter.id}-${cut.code}`,
            type: 'fresh-meat',
            name_ar: `لحم ${cut.name} طازج`,
            name_en: `Fresh ${cut.code} meat`,
            
            weight: Math.round(carcassWeight * cut.yield * 10) / 10,
            price: this.calculateMeatPrice(cut.code, carcassWeight * cut.yield),
            
            stock: Math.floor(carcassWeight * cut.yield), // Available kg
            unit: 'kg',
            
            specifications: {
                source: slaughter.animalId,
                slaughterDate: slaughter.date,
                expiryDate: this.calculateExpiryDate(slaughter.date),
                storage: 'مبرد 0-4°م'
            },
            
            halal: {
                certified: true,
                certificate: slaughter.halalCertificate,
                method: 'ذبح إسلامي'
            }
        }));
    }
    
    // Handle store orders in farm system
    async processStoreOrder(order) {
        console.log('Processing store order:', order.id);
        
        // Validate inventory
        const validationResult = await this.validateOrderInventory(order);
        if (!validationResult.valid) {
            return this.notifyInventoryIssue(order, validationResult);
        }
        
        // Reserve animals/products
        const reservation = await this.reserveOrderItems(order);
        
        // Create farm tasks
        const tasks = this.createOrderTasks(order, reservation);
        
        // Update farm records
        this.updateFarmRecords(order, reservation);
        
        // Schedule processing
        if (order.type === 'udheya') {
            this.scheduleUdheyaProcessing(order);
        } else if (order.items.some(i => i.type === 'live-sheep')) {
            this.scheduleLiveAnimalDelivery(order);
        } else {
            this.scheduleOrderFulfillment(order);
        }
        
        return {
            success: true,
            reservation,
            tasks,
            estimatedReady: this.calculateOrderReadyTime(order)
        };
    }
    
    // Create tasks from order
    createOrderTasks(order, reservation) {
        const tasks = [];
        const baseDate = new Date();
        
        // Animal preparation tasks
        if (reservation.animals.length > 0) {
            tasks.push({
                id: generateUUID(),
                title: `تجهيز حيوانات للطلب #${order.number}`,
                description: `تجهيز ${reservation.animals.length} حيوان للعميل ${order.customerName}`,
                animalIds: reservation.animals.map(a => a.id),
                dueDate: new Date(baseDate.getTime() + 24*60*60*1000),
                priority: 'high',
                category: 'sales',
                status: 'pending'
            });
            
            // Health check task
            tasks.push({
                id: generateUUID(),
                title: 'فحص صحي قبل البيع',
                description: `فحص الحيوانات المخصصة للطلب #${order.number}`,
                animalIds: reservation.animals.map(a => a.id),
                dueDate: baseDate,
                priority: 'critical',
                category: 'health',
                status: 'pending'
            });
        }
        
        // Slaughter tasks
        if (order.requiresSlaughter) {
            tasks.push({
                id: generateUUID(),
                title: `ذبح وتجهيز - طلب #${order.number}`,
                description: `ذبح حلال وتجهيز اللحوم للعميل ${order.customerName}`,
                scheduledDate: order.preferredDate,
                priority: 'high',
                category: 'processing',
                status: 'pending',
                
                subtasks: [
                    'تأكيد موعد الذبح',
                    'تجهيز الشهادات',
                    'تصوير العملية (إذا مطلوب)',
                    'تقطيع حسب الطلب',
                    'تغليف وتبريد'
                ]
            });
        }
        
        // Delivery preparation
        tasks.push({
            id: generateUUID(),
            title: `تجهيز التوصيل - طلب #${order.number}`,
            description: `تجهيز وتحميل الطلب للتوصيل إلى ${order.deliveryAddress}`,
            dueDate: new Date(order.deliveryDate),
            priority: 'medium',
            category: 'logistics',
            status: 'pending'
        });
        
        // Add tasks to farm system
        tasks.forEach(task => {
            sfmData.tasks.push(task);
        });
        
        saveSfmDataToLocalStorage();
        renderTaskList();
        
        return tasks;
    }
    
    // Update farm financial records
    updateFarmRecords(order, reservation) {
        // Add sale transaction
        const transaction = {
            id: generateUUID(),
            date: new Date().toISOString(),
            type: 'sale',
            category: 'online-order',
            description: `طلب أونلاين #${order.number} - ${order.customerName}`,
            amount: order.total,
            orderId: order.id,
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            paymentMethod: order.paymentMethod,
            status: 'pending'
        };
        
        sfmData.transactions.push(transaction);
        
        // Update animal status
        reservation.animals.forEach(animal => {
            const farmAnimal = sfmData.animals.find(a => a.id === animal.id);
            if (farmAnimal) {
                farmAnimal.status = 'reserved';
                farmAnimal.reservedFor = order.id;
                farmAnimal.reservedUntil = new Date(Date.now() + 48*60*60*1000); // 48 hours
            }
        });
        
        // Update inventory
        reservation.products.forEach(product => {
            const invItem = sfmData.inventory.find(i => i.id === product.id);
            if (invItem) {
                invItem.reserved = (invItem.reserved || 0) + product.quantity;
                invItem.available = invItem.currentStock - invItem.reserved;
            }
        });
        
        saveSfmDataToLocalStorage();
    }
    
    // Real-time sync with store
    startRealtimeSync() {
        // Subscribe to store order changes
        pb.collection('orders').subscribe('*', (e) => {
            
            switch(e.action) {
                case 'create':
                    this.processStoreOrder(e.record);
                    break;
                case 'update':
                    this.updateOrderStatus(e.record);
                    break;
                case 'delete':
                    this.cancelOrderReservation(e.record.id);
                    break;
            }
        });
        
        // Subscribe to product requests
        pb.collection('product_requests').subscribe('*', (e) => {
            if (e.action === 'create') {
                this.handleProductRequest(e.record);
            }
        });
    }
    
    // Offline queue management
    workOffline() {
        // Queue changes for later sync
        this.syncQueue.push({
            timestamp: new Date(),
            action: 'offline_mode',
            data: { message: 'Working offline - changes will sync when connected' }
        });
    }
    
    async performSync() {
        if (this.syncQueue.length === 0) return;
        
        console.log(`Syncing ${this.syncQueue.length} queued items...`);
        
        for (const item of this.syncQueue) {
            try {
                await this.processSyncItem(item);
            } catch (error) {
                console.error('Sync error:', error);
                // Keep in queue for retry
                continue;
            }
        }
        
        // Clear successfully synced items
        this.syncQueue = this.syncQueue.filter(item => item.error);
        this.lastSync = new Date();
    }
    
    // Customer portal access
    generateCustomerPortal(orderId) {
        const order = this.getOrder(orderId);
        if (!order) return null;
        
        return {
            orderId: order.id,
            accessUrl: `https://my.sheep.land/orders/${order.id}`,
            
            // Real-time tracking
            tracking: {
                currentStatus: order.status,
                timeline: order.statusHistory,
                location: order.currentLocation,
                estimatedDelivery: order.estimatedDelivery
            },
            
            // Animal information (for live/udheya orders)
            animalInfo: order.animals?.map(animalId => {
                const animal = sfmData.animals.find(a => a.id === animalId);
                return {
                    tagId: animal.tagId,
                    breed: animal.breed,
                    weight: this.getAnimalRecentWeight(animalId),
                    photos: animal.photos,
                    healthCertificate: this.getHealthCertificate(animalId),
                    videoUrl: order.type === 'udheya' ? order.sacrificeVideo : null
                };
            }),
            
            // Quality assurance
            quality: {
                temperatureLog: order.coldChainLog,
                handlingLog: order.handlingLog,
                certifications: order.certifications
            }
        };
    }
    
    // Helper methods
    getAnimalRecentWeight(animalId) {
        const animal = sfmData.animals.find(a => a.id === animalId);
        if (!animal || !animal.weightHistory || animal.weightHistory.length === 0) {
            return 40; // Default weight
        }
        
        const sorted = [...animal.weightHistory].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        return sorted[0].weight;
    }
    
    calculateAge(birthDate) {
        if (!birthDate) return 'غير محدد';
        
        const birth = new Date(birthDate);
        const now = new Date();
        const months = (now.getFullYear() - birth.getFullYear()) * 12 + 
                      (now.getMonth() - birth.getMonth());
        
        if (months < 12) {
            return `${months} شهر`;
        } else {
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            return remainingMonths > 0 ? 
                `${years} سنة و ${remainingMonths} شهر` : 
                `${years} سنة`;
        }
    }
    
    calculateAgeMonths(birthDate) {
        if (!birthDate) return 0;
        const birth = new Date(birthDate);
        const now = new Date();
        return (now.getFullYear() - birth.getFullYear()) * 12 + 
               (now.getMonth() - birth.getMonth());
    }
    
    getVaccinationStatus(animalId) {
        const vaccinations = sfmData.healthRecords.filter(hr => 
            hr.animalId === animalId && 
            hr.type === 'vaccination'
        );
        
        const requiredVaccinations = ['جدري', 'حمى قلاعية', 'كلوستريديا'];
        const completed = requiredVaccinations.filter(v => 
            vaccinations.some(hr => hr.condition.includes(v))
        );
        
        return completed.length === requiredVaccinations.length ? 
            'مكتمل' : `${completed.length}/${requiredVaccinations.length}`;
    }
    
    hasCompleteHealthRecords(animalId) {
        const records = sfmData.healthRecords.filter(hr => hr.animalId === animalId);
        return records.length >= 3; // At least 3 health records
    }
    
    generateAnimalTags(animal) {
        const tags = [animal.breed];
        
        const ageMonths = this.calculateAgeMonths(animal.birthDate);
        if (ageMonths <= 6) tags.push('صغير');
        else if (ageMonths <= 12) tags.push('متوسط');
        else tags.push('كبير');
        
        if (animal.sex === 'male') tags.push('ذكر');
        else tags.push('أنثى');
        
        if (this.hasCompleteHealthRecords(animal.id)) tags.push('سجل صحي كامل');
        if (animal.organic) tags.push('عضوي');
        if (animal.premium) tags.push('مميز');
        
        return tags;
    }
    
    getMarketPriceMultiplier() {
        // This would connect to market price API
        // For now, return seasonal adjustment
        const month = new Date().getMonth();
        
        // Higher prices during Eid seasons
        if (month === 11 || month === 0) return 1.3; // Eid al-Adha season
        if (month === 3 || month === 4) return 1.2; // Eid al-Fitr season
        
        return 1.0;
    }
}

// Initialize integration
const farmStoreIntegration = new FarmStoreIntegration();

// Add integration status to dashboard
function addIntegrationStatus() {
    const dashboard = document.getElementById('dashboardStats');
    if (!dashboard) return;
    
    const integrationCard = document.createElement('div');
    integrationCard.className = 'stat-card';
    integrationCard.innerHTML = `
        <div class="stat-value" id="integrationStatus">
            ${farmStoreIntegration.lastSync ? 'متصل' : 'غير متصل'}
        </div>
        <div class="stat-label">حالة المتجر</div>
    `;
    integrationCard.onclick = () => showIntegrationDetails();
    
    dashboard.appendChild(integrationCard);
}

// Show integration details
function showIntegrationDetails() {
    const details = {
        status: farmStoreIntegration.lastSync ? 'متصل' : 'غير متصل',
        lastSync: farmStoreIntegration.lastSync || 'لم يتم المزامنة',
        queuedItems: farmStoreIntegration.syncQueue.length,
        activeOrders: sfmData.transactions.filter(t => 
            t.category === 'online-order' && t.status === 'pending'
        ).length
    };
    
    const modalContent = `
        <div class="integration-details">
            <h4>تفاصيل الربط مع المتجر الإلكتروني</h4>
            <div class="stats-grid">
                <div class="stat-item">
                    <label>الحالة:</label>
                    <span class="${details.status === 'متصل' ? 'text-success' : 'text-danger'}">
                        ${details.status}
                    </span>
                </div>
                <div class="stat-item">
                    <label>آخر مزامنة:</label>
                    <span>${details.lastSync}</span>
                </div>
                <div class="stat-item">
                    <label>في انتظار المزامنة:</label>
                    <span>${details.queuedItems} عنصر</span>
                </div>
                <div class="stat-item">
                    <label>طلبات نشطة:</label>
                    <span>${details.activeOrders} طلب</span>
                </div>
            </div>
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="farmStoreIntegration.performSync()">
                    مزامنة الآن
                </button>
                <button class="btn btn-secondary" onclick="farmStoreIntegration.syncAnimalInventory()">
                    تحديث المنتجات
                </button>
            </div>
        </div>
    `;
    
    openSfmFormModal('ربط المتجر الإلكتروني', modalContent, 'closeSfmFormModal');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    // Add integration to menu
    const menuSheet = document.getElementById('sfmsMenuSheet');
    if (menuSheet) {
        const sheetContent = menuSheet.querySelector('.sheet-content');
        const integrationBtn = document.createElement('button');
        integrationBtn.className = 'btn btn-secondary';
        integrationBtn.innerHTML = '🔗 ربط المتجر';
        integrationBtn.onclick = () => {
            showIntegrationDetails();
            hideSfmBottomSheet('sfmsMenuSheet');
        };
        sheetContent.appendChild(integrationBtn);
    }
    
    // Start integration
    setTimeout(() => {
        farmStoreIntegration.initializeSync();
        addIntegrationStatus();
    }, 1000);
});