// Butchery and Meat Processing Management System
// Complete halal-compliant slaughter and processing workflow

class ButcheryManagement {
    constructor() {
        this.slaughterOrders = this.loadSlaughterOrders();
        this.processingBatches = this.loadProcessingBatches();
        this.cuttingSpecifications = this.loadCuttingSpecs();
        this.qualityRecords = this.loadQualityRecords();
        this.halalCertificates = this.loadHalalCertificates();
    }
    
    // Slaughter Planning
    createSlaughterOrder(orderData) {
        const slaughterOrder = {
            id: generateUUID(),
            orderId: orderData.orderId,
            orderNumber: orderData.orderNumber,
            customerName: orderData.customerName,
            
            // Animal selection
            animal: {
                id: orderData.animalId,
                tagId: orderData.animalTagId,
                breed: orderData.breed,
                weight: orderData.weight,
                age: orderData.age,
                healthStatus: orderData.healthStatus
            },
            
            // Slaughter specifications
            specifications: {
                type: orderData.type, // 'udheya', 'aqiqah', 'regular', 'custom'
                date: orderData.slaughterDate,
                timeSlot: orderData.timeSlot,
                
                // Religious requirements
                religious: {
                    customerPresent: orderData.customerPresent || false,
                    videoRecording: orderData.videoRecording || false,
                    liveStreaming: orderData.liveStreaming || false,
                    specificDua: orderData.specificDua || null,
                    distributionInstructions: orderData.distribution || null
                },
                
                // Processing requirements
                processing: {
                    skinning: orderData.skinning !== false,
                    gutting: orderData.gutting !== false,
                    cutting: orderData.cuttingStyle || 'standard',
                    packaging: orderData.packagingType || 'vacuum',
                    aging: orderData.agingDays || 0
                }
            },
            
            // Butcher assignment
            butcher: {
                id: null,
                name: null,
                certification: null,
                assigned: false
            },
            
            status: 'scheduled', // 'scheduled', 'in-progress', 'completed', 'cancelled'
            
            // Workflow tracking
            workflow: {
                stages: this.createWorkflowStages(orderData.type),
                currentStage: 0,
                startTime: null,
                endTime: null
            },
            
            // Quality control
            quality: {
                preSlaughterCheck: null,
                postSlaughterCheck: null,
                finalInspection: null,
                temperature: []
            },
            
            createdAt: new Date().toISOString()
        };
        
        this.slaughterOrders.push(slaughterOrder);
        this.saveSlaughterOrders();
        
        // Auto-assign butcher if available
        this.assignButcher(slaughterOrder);
        
        // Create calendar event
        this.scheduleSlaughter(slaughterOrder);
        
        return slaughterOrder;
    }
    
    // Workflow stages based on type
    createWorkflowStages(type) {
        const baseStages = [
            { name: 'فحص ما قبل الذبح', required: true, duration: 10 },
            { name: 'التكبير والذبح', required: true, duration: 5 },
            { name: 'الإدماء', required: true, duration: 15 },
            { name: 'السلخ', required: true, duration: 20 },
            { name: 'الإفراغ والتنظيف', required: true, duration: 15 },
            { name: 'الفحص الصحي', required: true, duration: 10 },
            { name: 'التقطيع', required: true, duration: 30 },
            { name: 'التغليف', required: true, duration: 20 },
            { name: 'التبريد', required: true, duration: 10 }
        ];
        
        // Add specific stages based on type
        if (type === 'udheya') {
            baseStages.splice(1, 0, 
                { name: 'تصوير/بث مباشر', required: true, duration: 5 }
            );
            baseStages.push(
                { name: 'تقسيم الأضحية', required: true, duration: 15 },
                { name: 'إعداد شهادة الأضحية', required: true, duration: 5 }
            );
        }
        
        if (type === 'aqiqah') {
            baseStages.push(
                { name: 'إعداد وجبة العقيقة', required: false, duration: 60 },
                { name: 'توزيع العقيقة', required: true, duration: 30 }
            );
        }
        
        return baseStages.map((stage, index) => ({
            ...stage,
            id: index + 1,
            status: 'pending',
            startTime: null,
            endTime: null,
            performedBy: null,
            notes: null,
            photos: []
        }));
    }
    
    // Start slaughter process
    startSlaughter(orderId) {
        const order = this.slaughterOrders.find(o => o.id === orderId);
        if (!order) return;
        
        order.status = 'in-progress';
        order.workflow.startTime = new Date().toISOString();
        
        // Pre-slaughter health check
        const healthCheck = this.performHealthCheck(order.animal.id);
        order.quality.preSlaughterCheck = {
            timestamp: new Date().toISOString(),
            inspector: 'البيطري المناوب',
            result: healthCheck.passed ? 'مقبول' : 'مرفوض',
            notes: healthCheck.notes,
            certificate: healthCheck.certificateId
        };
        
        if (!healthCheck.passed) {
            order.status = 'rejected';
            this.notifyHealthCheckFailure(order);
            return false;
        }
        
        // Start video recording if requested
        if (order.specifications.religious.videoRecording) {
            order.videoRecording = this.startVideoRecording(order);
        }
        
        // Start live streaming if requested
        if (order.specifications.religious.liveStreaming) {
            order.liveStream = this.startLiveStream(order);
        }
        
        this.saveSlaughterOrders();
        return true;
    }
    
    // Update workflow stage
    updateWorkflowStage(orderId, stageId, updates) {
        const order = this.slaughterOrders.find(o => o.id === orderId);
        if (!order) return;
        
        const stage = order.workflow.stages.find(s => s.id === stageId);
        if (!stage) return;
        
        stage.status = updates.status || 'in-progress';
        stage.startTime = stage.startTime || new Date().toISOString();
        
        if (updates.status === 'completed') {
            stage.endTime = new Date().toISOString();
            stage.performedBy = updates.performedBy;
            stage.notes = updates.notes;
            
            if (updates.photos) {
                stage.photos = updates.photos;
            }
            
            // Auto-advance to next stage
            const nextStage = order.workflow.stages.find(s => 
                s.id === stageId + 1 && s.required
            );
            if (nextStage) {
                nextStage.status = 'ready';
                order.workflow.currentStage = nextStage.id;
            } else {
                // All stages completed
                this.completeSlaughter(orderId);
            }
        }
        
        // Special handling for specific stages
        if (stage.name === 'التكبير والذبح' && updates.status === 'completed') {
            this.recordSlaughterDetails(order, updates);
        }
        
        if (stage.name === 'الفحص الصحي' && updates.status === 'completed') {
            this.recordPostSlaughterInspection(order, updates);
        }
        
        this.saveSlaughterOrders();
    }
    
    // Record slaughter details
    recordSlaughterDetails(order, details) {
        order.slaughterDetails = {
            timestamp: new Date().toISOString(),
            butcher: details.performedBy,
            method: 'ذبح حلال',
            direction: 'القبلة',
            takbir: details.takbirRecited || 'بسم الله والله أكبر',
            bloodDrainage: details.bloodDrainage || 'كامل',
            duration: details.duration,
            witnesses: details.witnesses || []
        };
        
        // Generate Halal certificate
        const certificate = this.generateHalalCertificate(order);
        order.halalCertificateId = certificate.id;
    }
    
    // Carcass processing
    processCarcass(orderId, processingData) {
        const order = this.slaughterOrders.find(o => o.id === orderId);
        if (!order) return;
        
        const batch = {
            id: generateUUID(),
            orderId: orderId,
            animalId: order.animal.id,
            
            // Yield tracking
            yield: {
                liveWeight: order.animal.weight,
                carcassWeight: processingData.carcassWeight,
                yieldPercentage: (processingData.carcassWeight / order.animal.weight) * 100,
                
                // Parts breakdown
                parts: {
                    forequarter: processingData.forequarter || 0,
                    hindquarter: processingData.hindquarter || 0,
                    ribs: processingData.ribs || 0,
                    organs: processingData.organs || 0,
                    skin: processingData.skinWeight || 0,
                    waste: processingData.waste || 0
                }
            },
            
            // Cutting specifications
            cutting: this.applyCuttingSpec(order.specifications.processing.cutting),
            
            // Package details
            packages: [],
            
            status: 'processing',
            startTime: new Date().toISOString()
        };
        
        this.processingBatches.push(batch);
        this.saveProcessingBatches();
        
        return batch;
    }
    
    // Apply cutting specifications
    applyCuttingSpec(specType) {
        const specifications = {
            'standard': {
                cuts: [
                    { name: 'فخذ', code: 'LEG', count: 2, avgWeight: 3.5 },
                    { name: 'كتف', code: 'SHOULDER', count: 2, avgWeight: 2.5 },
                    { name: 'ضلوع', code: 'RIBS', count: 2, avgWeight: 1.5 },
                    { name: 'صدر', code: 'BREAST', count: 1, avgWeight: 1.0 },
                    { name: 'رقبة', code: 'NECK', count: 1, avgWeight: 0.8 },
                    { name: 'مفروم', code: 'MINCE', count: 1, avgWeight: 2.0 }
                ]
            },
            'thirds': {
                cuts: [
                    { name: 'الثلث الأول', code: 'THIRD1', count: 1, avgWeight: null },
                    { name: 'الثلث الثاني', code: 'THIRD2', count: 1, avgWeight: null },
                    { name: 'الثلث الثالث', code: 'THIRD3', count: 1, avgWeight: null }
                ]
            },
            'halves': {
                cuts: [
                    { name: 'النصف الأيمن', code: 'RIGHT', count: 1, avgWeight: null },
                    { name: 'النصف الأيسر', code: 'LEFT', count: 1, avgWeight: null }
                ]
            },
            'custom': {
                cuts: [] // Will be filled based on customer requirements
            }
        };
        
        return specifications[specType] || specifications['standard'];
    }
    
    // Package creation
    createPackages(batchId, cuts) {
        const batch = this.processingBatches.find(b => b.id === batchId);
        if (!batch) return;
        
        const packages = cuts.map(cut => ({
            id: generateUUID(),
            batchId: batchId,
            
            // Package details
            cut: {
                name: cut.name,
                code: cut.code,
                weight: cut.weight,
                pieces: cut.pieces || 1
            },
            
            // Packaging
            packaging: {
                type: cut.packagingType || 'vacuum',
                date: new Date().toISOString(),
                sealedBy: cut.packagedBy,
                material: 'food-grade-plastic'
            },
            
            // Labeling
            label: {
                qrCode: this.generatePackageQR(batchId, cut),
                productionDate: new Date().toISOString(),
                expiryDate: this.calculateExpiryDate(cut.packagingType),
                storageInstructions: this.getStorageInstructions(cut.code),
                halalCertificate: batch.halalCertificateId
            },
            
            // Traceability
            traceability: {
                animalId: batch.animalId,
                slaughterDate: batch.slaughterDate,
                batchNumber: `${new Date().getFullYear()}${batchId.substring(0, 6)}`,
                origin: 'مزرعة الشركة'
            },
            
            status: 'ready',
            location: 'cold-storage'
        }));
        
        batch.packages = packages;
        batch.status = 'packaged';
        
        this.saveProcessingBatches();
        return packages;
    }
    
    // Quality Control
    performQualityCheck(packageId, checkData) {
        const qualityRecord = {
            id: generateUUID(),
            packageId: packageId,
            timestamp: new Date().toISOString(),
            
            // Visual inspection
            visual: {
                color: checkData.color, // 'normal', 'pale', 'dark'
                texture: checkData.texture, // 'firm', 'soft', 'sticky'
                odor: checkData.odor, // 'fresh', 'off', 'spoiled'
                appearance: checkData.appearance // 'good', 'acceptable', 'reject'
            },
            
            // Temperature check
            temperature: {
                surface: checkData.surfaceTemp,
                core: checkData.coreTemp,
                acceptable: checkData.surfaceTemp <= 4 && checkData.coreTemp <= 4
            },
            
            // Packaging integrity
            packaging: {
                seal: checkData.sealIntegrity, // 'intact', 'compromised'
                vacuum: checkData.vacuumStatus, // 'good', 'lost'
                label: checkData.labelCondition // 'clear', 'damaged'
            },
            
            // Overall result
            result: this.determineQualityResult(checkData),
            inspector: checkData.inspectorId,
            notes: checkData.notes,
            
            // Actions taken
            actions: checkData.result !== 'pass' ? checkData.actions : null
        };
        
        this.qualityRecords.push(qualityRecord);
        this.saveQualityRecords();
        
        // Update package status if rejected
        if (qualityRecord.result === 'reject') {
            this.quarantinePackage(packageId, qualityRecord);
        }
        
        return qualityRecord;
    }
    
    // Halal Certification
    generateHalalCertificate(order) {
        const certificate = {
            id: generateUUID(),
            orderId: order.id,
            
            // Certificate details
            certificateNumber: this.generateCertificateNumber(),
            issueDate: new Date().toISOString(),
            validUntil: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
            
            // Animal details
            animal: {
                id: order.animal.id,
                tagId: order.animal.tagId,
                breed: order.animal.breed,
                weight: order.animal.weight,
                healthStatus: order.quality.preSlaughterCheck.result
            },
            
            // Slaughter details
            slaughter: {
                date: order.slaughterDetails.timestamp,
                location: 'مسلخ الشركة الحلال',
                butcher: {
                    name: order.slaughterDetails.butcher,
                    certification: this.getButcherCertification(order.slaughterDetails.butcher)
                },
                method: order.slaughterDetails.method,
                witnesses: order.slaughterDetails.witnesses
            },
            
            // Compliance statement
            compliance: {
                islamicLaw: true,
                egyptianStandards: true,
                internationalHalal: true,
                additionalCertifications: ['ISO 22000', 'HACCP']
            },
            
            // Digital signature
            signature: {
                certifyingAuthority: 'هيئة الرقابة الشرعية - مزارع الشركة',
                signedBy: 'الشيخ محمد أحمد',
                digitalSignature: this.generateDigitalSignature(),
                qrCode: null // Will be generated
            },
            
            status: 'active'
        };
        
        // Generate QR code for verification
        certificate.signature.qrCode = this.generateCertificateQR(certificate);
        
        this.halalCertificates.push(certificate);
        this.saveHalalCertificates();
        
        return certificate;
    }
    
    // Video Recording Management
    startVideoRecording(order) {
        return {
            id: generateUUID(),
            orderId: order.id,
            startTime: new Date().toISOString(),
            status: 'recording',
            
            // Recording settings
            settings: {
                resolution: '1080p',
                fps: 30,
                audio: true,
                format: 'mp4'
            },
            
            // Storage
            storage: {
                location: 'cloud',
                provider: 'aws-s3',
                bucket: 'sheep-land-recordings',
                path: `udheya/${order.orderNumber}/${new Date().toISOString()}.mp4`
            },
            
            // Access control
            access: {
                public: false,
                customerAccess: true,
                expiryDate: new Date(Date.now() + 30*24*60*60*1000), // 30 days
                password: this.generateAccessPassword()
            }
        };
    }
    
    // Distribution Management (for Udheya)
    manageDistribution(orderId, distributionPlan) {
        const order = this.slaughterOrders.find(o => o.id === orderId);
        if (!order || order.specifications.type !== 'udheya') return;
        
        const distribution = {
            orderId: orderId,
            plan: distributionPlan, // 'thirds', 'custom'
            
            recipients: {
                family: {
                    portion: distributionPlan === 'thirds' ? 0.33 : distributionPlan.family,
                    packages: [],
                    delivered: false
                },
                poor: {
                    portion: distributionPlan === 'thirds' ? 0.33 : distributionPlan.poor,
                    packages: [],
                    delivered: false,
                    charityOrg: distributionPlan.charityOrg || null
                },
                relatives: {
                    portion: distributionPlan === 'thirds' ? 0.33 : distributionPlan.relatives,
                    packages: [],
                    delivered: false,
                    list: distributionPlan.relativesList || []
                }
            },
            
            status: 'pending',
            completedAt: null
        };
        
        // Allocate packages to recipients
        const batch = this.processingBatches.find(b => b.orderId === orderId);
        if (batch && batch.packages) {
            this.allocatePackagesToRecipients(distribution, batch.packages);
        }
        
        order.distribution = distribution;
        this.saveSlaughterOrders();
        
        return distribution;
    }
    
    // Temperature Monitoring
    recordTemperature(location, temperature) {
        const record = {
            timestamp: new Date().toISOString(),
            location: location, // 'cold-room', 'freezer', 'aging-room'
            temperature: temperature,
            humidity: null, // If available from sensor
            acceptable: this.isTemperatureAcceptable(location, temperature)
        };
        
        // Check all packages in location
        const affectedPackages = this.getPackagesInLocation(location);
        
        if (!record.acceptable) {
            // Temperature violation alert
            this.sendTemperatureAlert(location, temperature, affectedPackages);
            
            // Log in affected packages
            affectedPackages.forEach(pkg => {
                if (!pkg.temperatureLog) pkg.temperatureLog = [];
                pkg.temperatureLog.push({
                    ...record,
                    violation: true
                });
            });
        }
        
        return record;
    }
    
    // HACCP Compliance
    performHACCPCheck() {
        const check = {
            id: generateUUID(),
            date: new Date().toISOString(),
            
            criticalControlPoints: [
                {
                    point: 'استلام الحيوانات',
                    criteria: 'شهادة صحية سارية',
                    result: null,
                    action: null
                },
                {
                    point: 'ما قبل الذبح',
                    criteria: 'راحة 12 ساعة minimum',
                    result: null,
                    action: null
                },
                {
                    point: 'الذبح',
                    criteria: 'طريقة حلال، تصريف دم كامل',
                    result: null,
                    action: null
                },
                {
                    point: 'التبريد',
                    criteria: 'أقل من 4°م خلال ساعتين',
                    result: null,
                    action: null
                },
                {
                    point: 'التخزين',
                    criteria: '0-4°م للتبريد، -18°م للتجميد',
                    result: null,
                    action: null
                }
            ],
            
            overallCompliance: null,
            correctionActions: [],
            nextCheckDate: null
        };
        
        return check;
    }
    
    // Helper Methods
    generateCertificateNumber() {
        const year = new Date().getFullYear();
        const count = this.halalCertificates.filter(c => 
            c.issueDate.startsWith(year.toString())
        ).length + 1;
        
        return `HAL-${year}-${count.toString().padStart(5, '0')}`;
    }
    
    generateDigitalSignature() {
        // In production, use proper cryptographic signing
        return btoa(`${new Date().toISOString()}-${Math.random()}`);
    }
    
    generatePackageQR(batchId, cut) {
        const data = {
            batch: batchId,
            cut: cut.code,
            date: new Date().toISOString(),
            halal: true
        };
        
        // In production, use QR library
        return `QR-${btoa(JSON.stringify(data)).substring(0, 10)}`;
    }
    
    calculateExpiryDate(packagingType) {
        const days = {
            'vacuum': 21,
            'modified-atmosphere': 14,
            'wrapped': 7,
            'frozen': 180
        };
        
        const expiryDays = days[packagingType] || 7;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + expiryDays);
        
        return expiry.toISOString();
    }
    
    determineQualityResult(checkData) {
        if (checkData.odor !== 'fresh' || 
            checkData.appearance === 'reject' ||
            !checkData.temperature.acceptable) {
            return 'reject';
        }
        
        if (checkData.texture === 'soft' || 
            checkData.color !== 'normal' ||
            checkData.packaging.seal !== 'intact') {
            return 'conditional';
        }
        
        return 'pass';
    }
    
    // Save methods
    saveSlaughterOrders() {
        localStorage.setItem('sfm_slaughter_orders', JSON.stringify(this.slaughterOrders));
    }
    
    saveProcessingBatches() {
        localStorage.setItem('sfm_processing_batches', JSON.stringify(this.processingBatches));
    }
    
    saveQualityRecords() {
        localStorage.setItem('sfm_quality_records', JSON.stringify(this.qualityRecords));
    }
    
    saveHalalCertificates() {
        localStorage.setItem('sfm_halal_certificates', JSON.stringify(this.halalCertificates));
    }
    
    loadSlaughterOrders() {
        return JSON.parse(localStorage.getItem('sfm_slaughter_orders') || '[]');
    }
    
    loadProcessingBatches() {
        return JSON.parse(localStorage.getItem('sfm_processing_batches') || '[]');
    }
    
    loadCuttingSpecs() {
        return JSON.parse(localStorage.getItem('sfm_cutting_specs') || '{}');
    }
    
    loadQualityRecords() {
        return JSON.parse(localStorage.getItem('sfm_quality_records') || '[]');
    }
    
    loadHalalCertificates() {
        return JSON.parse(localStorage.getItem('sfm_halal_certificates') || '[]');
    }
}

// Initialize butchery system
const butcheryManager = new ButcheryManagement();

// Add UI components
function addButcheryUI() {
    // Add to navigation
    const moreSheet = document.querySelector('#sfmsMoreSheet .sheet-content > div');
    if (moreSheet) {
        const butcheryBtn = document.createElement('button');
        butcheryBtn.className = 'nav-item';
        butcheryBtn.innerHTML = `
            <span class="nav-icon">🔪</span>
            <span class="nav-label">المسلخ</span>
        `;
        butcheryBtn.onclick = () => {
            showButcheryDashboard();
            hideSfmBottomSheet('sfmsMoreSheet');
        };
        moreSheet.appendChild(butcheryBtn);
    }
}

// Show butchery dashboard
function showButcheryDashboard() {
    const todayOrders = butcheryManager.slaughterOrders.filter(o => 
        o.specifications.date === new Date().toISOString().split('T')[0]
    );
    
    const content = `
        <div class="butchery-dashboard">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <span class="card-icon">🔪</span>
                        إدارة المسلخ والتجهيز
                    </h2>
                    <button class="btn btn-primary btn-sm" onclick="showSlaughterSchedule()">
                        جدول الذبح
                    </button>
                </div>
                
                <div class="stats-grid-dynamic">
                    <div class="stat-card">
                        <div class="stat-value">${todayOrders.length}</div>
                        <div class="stat-label">ذبائح اليوم</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">
                            ${todayOrders.filter(o => o.specifications.type === 'udheya').length}
                        </div>
                        <div class="stat-label">أضاحي</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">
                            ${butcheryManager.processingBatches.filter(b => 
                                b.status === 'processing'
                            ).length}
                        </div>
                        <div class="stat-label">قيد التجهيز</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">
                            ${butcheryManager.qualityRecords.filter(q => 
                                q.result === 'pass' && 
                                q.timestamp.startsWith(new Date().toISOString().split('T')[0])
                            ).length}
                        </div>
                        <div class="stat-label">فحص جودة ناجح</div>
                    </div>
                </div>
                
                <div class="butchery-sections">
                    <button class="btn btn-secondary" onclick="showSlaughterOrders()">
                        طلبات الذبح
                    </button>
                    <button class="btn btn-secondary" onclick="showProcessingStatus()">
                        التجهيز والتقطيع
                    </button>
                    <button class="btn btn-secondary" onclick="showQualityControl()">
                        مراقبة الجودة
                    </button>
                    <button class="btn btn-secondary" onclick="showHalalCertificates()">
                        شهادات الحلال
                    </button>
                </div>
            </div>
            
            <div class="card mt-3">
                <div class="card-header">
                    <h3 class="card-title">سير العمل الحالي</h3>
                </div>
                <div id="workflowStatus">
                    ${todayOrders.filter(o => o.status === 'in-progress').map(order => `
                        <div class="workflow-item">
                            <h4>طلب #${order.orderNumber} - ${order.customerName}</h4>
                            <div class="workflow-stages">
                                ${order.workflow.stages.map(stage => `
                                    <div class="stage ${stage.status}">
                                        <span class="stage-name">${stage.name}</span>
                                        <span class="stage-status">${
                                            stage.status === 'completed' ? '✓' : 
                                            stage.status === 'in-progress' ? '⏳' : '○'
                                        }</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('') || '<p>لا توجد عمليات جارية حالياً</p>'}
                </div>
            </div>
        </div>
    `;
    
    const butcherySection = document.createElement('div');
    butcherySection.className = 'section-page';
    butcherySection.id = 'butcheryManagement';
    butcherySection.innerHTML = content;
    
    document.getElementById('sfmsContentArea').appendChild(butcherySection);
    showSfmSection('butcheryManagement');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    addButcheryUI();
});