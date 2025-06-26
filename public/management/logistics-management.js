// Logistics and Delivery Management System
// Complete solution for farm-to-customer delivery operations

class LogisticsManagement {
    constructor() {
        this.fleet = this.loadFleet();
        this.drivers = this.loadDrivers();
        this.deliveries = this.loadDeliveries();
        this.routes = [];
        this.zones = this.defineDeliveryZones();
    }
    
    // Fleet Management
    loadFleet() {
        return JSON.parse(localStorage.getItem('sfm_fleet') || '[]');
    }
    
    addVehicle(vehicleData) {
        const vehicle = {
            id: generateUUID(),
            plateNumber: vehicleData.plateNumber,
            type: vehicleData.type, // 'refrigerated', 'standard', 'motorcycle'
            capacity: vehicleData.capacity, // in kg
            
            specifications: {
                make: vehicleData.make,
                model: vehicleData.model,
                year: vehicleData.year,
                refrigerated: vehicleData.refrigerated || false,
                temperatureRange: vehicleData.temperatureRange || null
            },
            
            status: 'available', // 'available', 'in-transit', 'maintenance', 'offline'
            currentLocation: null,
            currentDriver: null,
            currentLoad: [],
            
            maintenance: {
                lastService: vehicleData.lastService,
                nextService: this.calculateNextService(vehicleData.lastService),
                oilChange: vehicleData.oilChange,
                tireRotation: vehicleData.tireRotation,
                insurance: vehicleData.insurance,
                registration: vehicleData.registration
            },
            
            performance: {
                totalTrips: 0,
                totalDistance: 0,
                totalDeliveries: 0,
                fuelConsumption: [],
                averageSpeed: 0
            },
            
            createdAt: new Date().toISOString()
        };
        
        this.fleet.push(vehicle);
        this.saveFleet();
        return vehicle;
    }
    
    // Driver Management
    addDriver(driverData) {
        const driver = {
            id: generateUUID(),
            name: driverData.name,
            phone: driverData.phone,
            licenseNumber: driverData.licenseNumber,
            licenseExpiry: driverData.licenseExpiry,
            
            qualifications: {
                hasRefrigeratedLicense: driverData.hasRefrigeratedLicense || false,
                hasHazmatLicense: driverData.hasHazmatLicense || false,
                yearsExperience: driverData.yearsExperience
            },
            
            status: 'available', // 'available', 'on-delivery', 'off-duty', 'on-break'
            currentVehicle: null,
            currentRoute: null,
            
            performance: {
                totalDeliveries: 0,
                onTimeRate: 100,
                customerRating: 5.0,
                accidentsCount: 0,
                complaintCount: 0
            },
            
            schedule: {
                workDays: driverData.workDays || ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
                workHours: driverData.workHours || { start: '08:00', end: '17:00' },
                breakTime: driverData.breakTime || { start: '13:00', duration: 60 }
            },
            
            createdAt: new Date().toISOString()
        };
        
        this.drivers.push(driver);
        this.saveDrivers();
        return driver;
    }
    
    // Delivery Planning
    createDelivery(orderData) {
        const delivery = {
            id: generateUUID(),
            orderId: orderData.orderId,
            orderNumber: orderData.orderNumber,
            
            customer: {
                name: orderData.customerName,
                phone: orderData.customerPhone,
                address: orderData.address,
                coordinates: orderData.coordinates || this.geocodeAddress(orderData.address),
                notes: orderData.deliveryNotes
            },
            
            items: orderData.items.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                weight: item.weight,
                temperature: item.requiresRefrigeration ? 'cold' : 'ambient',
                handling: item.specialHandling || 'standard'
            })),
            
            requirements: {
                vehicleType: this.determineVehicleType(orderData.items),
                timeSlot: orderData.preferredTimeSlot,
                date: orderData.deliveryDate,
                priority: orderData.priority || 'normal'
            },
            
            status: 'pending', // 'pending', 'assigned', 'picked', 'in-transit', 'delivered', 'failed'
            
            assignment: {
                vehicleId: null,
                driverId: null,
                routeId: null,
                sequence: null
            },
            
            tracking: {
                events: [{
                    timestamp: new Date().toISOString(),
                    status: 'created',
                    location: null,
                    notes: 'طلب توصيل جديد'
                }],
                currentLocation: null,
                estimatedArrival: null,
                actualArrival: null
            },
            
            proof: {
                signature: null,
                photo: null,
                receiverName: null,
                deliveryTime: null,
                temperature: null
            },
            
            billing: {
                deliveryFee: orderData.deliveryFee || 0,
                codAmount: orderData.paymentMethod === 'cod' ? orderData.total : 0,
                collected: false
            }
        };
        
        this.deliveries.push(delivery);
        this.saveDeliveries();
        
        // Auto-assign if possible
        this.attemptAutoAssignment(delivery);
        
        return delivery;
    }
    
    // Route Optimization
    optimizeRoutes(date) {
        const pendingDeliveries = this.deliveries.filter(d => 
            d.requirements.date === date && 
            ['pending', 'assigned'].includes(d.status)
        );
        
        if (pendingDeliveries.length === 0) return [];
        
        // Group by area and time slot
        const groups = this.groupDeliveriesByAreaAndTime(pendingDeliveries);
        const routes = [];
        
        Object.entries(groups).forEach(([key, deliveries]) => {
            const [area, timeSlot] = key.split('_');
            
            // Find available vehicles and drivers
            const availableVehicles = this.getAvailableVehicles(date, timeSlot);
            const availableDrivers = this.getAvailableDrivers(date, timeSlot);
            
            // Create routes based on vehicle capacity
            let currentRoute = null;
            let currentCapacity = 0;
            
            deliveries.forEach(delivery => {
                const deliveryWeight = delivery.items.reduce((sum, item) => sum + item.weight, 0);
                
                if (!currentRoute || currentCapacity + deliveryWeight > currentRoute.vehicle.capacity) {
                    // Start new route
                    const vehicle = availableVehicles.shift();
                    const driver = availableDrivers.shift();
                    
                    if (!vehicle || !driver) {
                        console.warn('Insufficient resources for delivery:', delivery.id);
                        return;
                    }
                    
                    currentRoute = {
                        id: generateUUID(),
                        date: date,
                        area: area,
                        timeSlot: timeSlot,
                        vehicle: vehicle,
                        driver: driver,
                        deliveries: [],
                        sequence: [],
                        totalDistance: 0,
                        estimatedDuration: 0,
                        status: 'planned'
                    };
                    
                    routes.push(currentRoute);
                    currentCapacity = 0;
                }
                
                currentRoute.deliveries.push(delivery);
                currentCapacity += deliveryWeight;
                
                // Update delivery assignment
                delivery.assignment = {
                    vehicleId: currentRoute.vehicle.id,
                    driverId: currentRoute.driver.id,
                    routeId: currentRoute.id,
                    sequence: currentRoute.deliveries.length
                };
                delivery.status = 'assigned';
            });
        });
        
        // Optimize sequence for each route
        routes.forEach(route => {
            route.sequence = this.optimizeRouteSequence(route.deliveries);
            route.totalDistance = this.calculateRouteDistance(route.sequence);
            route.estimatedDuration = this.estimateRouteDuration(route);
        });
        
        this.routes.push(...routes);
        this.saveRoutes();
        this.saveDeliveries();
        
        return routes;
    }
    
    // Real-time Tracking
    updateDeliveryLocation(deliveryId, location) {
        const delivery = this.deliveries.find(d => d.id === deliveryId);
        if (!delivery) return;
        
        delivery.tracking.currentLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: new Date().toISOString()
        };
        
        // Add tracking event
        delivery.tracking.events.push({
            timestamp: new Date().toISOString(),
            status: 'location_update',
            location: location,
            notes: null
        });
        
        // Update ETA
        delivery.tracking.estimatedArrival = this.calculateETA(delivery);
        
        // Notify customer if significant change
        if (this.shouldNotifyCustomer(delivery)) {
            this.sendCustomerNotification(delivery);
        }
        
        this.saveDeliveries();
    }
    
    // Proof of Delivery
    completeDelivery(deliveryId, proofData) {
        const delivery = this.deliveries.find(d => d.id === deliveryId);
        if (!delivery) return;
        
        delivery.status = 'delivered';
        delivery.proof = {
            signature: proofData.signature,
            photo: proofData.photo,
            receiverName: proofData.receiverName,
            deliveryTime: new Date().toISOString(),
            temperature: proofData.temperature,
            condition: proofData.condition
        };
        
        delivery.tracking.actualArrival = new Date().toISOString();
        delivery.tracking.events.push({
            timestamp: new Date().toISOString(),
            status: 'delivered',
            location: delivery.tracking.currentLocation,
            notes: `تم التسليم إلى ${proofData.receiverName}`
        });
        
        // Update driver and vehicle status
        this.updateResourceStatus(delivery);
        
        // Process COD if applicable
        if (delivery.billing.codAmount > 0) {
            delivery.billing.collected = true;
            this.processCODCollection(delivery);
        }
        
        // Update performance metrics
        this.updatePerformanceMetrics(delivery);
        
        this.saveDeliveries();
        
        // Trigger next delivery in route
        this.triggerNextDelivery(delivery.assignment.routeId);
        
        return delivery;
    }
    
    // Failed Delivery Handling
    handleFailedDelivery(deliveryId, reason) {
        const delivery = this.deliveries.find(d => d.id === deliveryId);
        if (!delivery) return;
        
        delivery.status = 'failed';
        delivery.tracking.events.push({
            timestamp: new Date().toISOString(),
            status: 'failed',
            location: delivery.tracking.currentLocation,
            notes: reason
        });
        
        // Determine next action
        const nextAction = this.determineFailedDeliveryAction(delivery, reason);
        
        switch (nextAction) {
            case 'reschedule':
                this.rescheduleDelivery(delivery);
                break;
            case 'return':
                this.scheduleReturn(delivery);
                break;
            case 'hold':
                this.holdForPickup(delivery);
                break;
        }
        
        // Notify stakeholders
        this.notifyDeliveryFailure(delivery, reason);
        
        this.saveDeliveries();
    }
    
    // Temperature Monitoring
    recordTemperature(vehicleId, temperature) {
        const vehicle = this.fleet.find(v => v.id === vehicleId);
        if (!vehicle || !vehicle.specifications.refrigerated) return;
        
        const record = {
            timestamp: new Date().toISOString(),
            temperature: temperature,
            inRange: this.isTemperatureInRange(temperature, vehicle)
        };
        
        if (!vehicle.temperatureLog) {
            vehicle.temperatureLog = [];
        }
        
        vehicle.temperatureLog.push(record);
        
        // Alert if out of range
        if (!record.inRange) {
            this.sendTemperatureAlert(vehicle, temperature);
        }
        
        // Update all deliveries in vehicle
        const activeDeliveries = this.deliveries.filter(d => 
            d.assignment.vehicleId === vehicleId && 
            d.status === 'in-transit'
        );
        
        activeDeliveries.forEach(delivery => {
            if (!delivery.temperatureLog) {
                delivery.temperatureLog = [];
            }
            delivery.temperatureLog.push(record);
        });
        
        this.saveFleet();
        this.saveDeliveries();
    }
    
    // Customer Notifications
    sendCustomerNotification(delivery) {
        const message = this.generateDeliveryMessage(delivery);
        
        // Send via preferred channel
        if (delivery.customer.phone) {
            this.sendSMS(delivery.customer.phone, message);
            this.sendWhatsApp(delivery.customer.phone, message);
        }
        
        // Log notification
        delivery.tracking.events.push({
            timestamp: new Date().toISOString(),
            status: 'customer_notified',
            location: null,
            notes: message
        });
    }
    
    generateDeliveryMessage(delivery) {
        const eta = new Date(delivery.tracking.estimatedArrival);
        const timeStr = eta.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        
        switch (delivery.status) {
            case 'assigned':
                return `طلبك #${delivery.orderNumber} تم تحديد موعد التوصيل اليوم ${timeStr}`;
            case 'in-transit':
                const minsAway = Math.round((eta - new Date()) / 60000);
                return `طلبك #${delivery.orderNumber} في الطريق إليك! سيصل خلال ${minsAway} دقيقة`;
            case 'delivered':
                return `طلبك #${delivery.orderNumber} تم تسليمه بنجاح. شكراً لثقتك`;
            default:
                return `تحديث على طلبك #${delivery.orderNumber}`;
        }
    }
    
    // Analytics and Reporting
    generateDeliveryReport(startDate, endDate) {
        const deliveries = this.deliveries.filter(d => {
            const deliveryDate = new Date(d.requirements.date);
            return deliveryDate >= startDate && deliveryDate <= endDate;
        });
        
        return {
            summary: {
                total: deliveries.length,
                delivered: deliveries.filter(d => d.status === 'delivered').length,
                failed: deliveries.filter(d => d.status === 'failed').length,
                pending: deliveries.filter(d => d.status === 'pending').length,
                onTimeRate: this.calculateOnTimeRate(deliveries),
                averageDeliveryTime: this.calculateAverageDeliveryTime(deliveries)
            },
            
            byArea: this.groupDeliveriesByArea(deliveries),
            byDriver: this.analyzeDriverPerformance(deliveries),
            byVehicle: this.analyzeVehicleUtilization(deliveries),
            
            costs: {
                fuel: this.calculateFuelCosts(deliveries),
                labor: this.calculateLaborCosts(deliveries),
                maintenance: this.calculateMaintenanceCosts(startDate, endDate),
                total: 0 // Sum of above
            },
            
            issues: {
                delays: this.identifyDelays(deliveries),
                failures: this.analyzeFailureReasons(deliveries),
                complaints: this.getDeliveryComplaints(deliveries)
            }
        };
    }
    
    // Helper Methods
    defineDeliveryZones() {
        return {
            cairo: {
                name: 'القاهرة',
                areas: ['مدينة نصر', 'مصر الجديدة', 'المعادي', 'التجمع الخامس'],
                baseDeliveryFee: 50,
                estimatedTime: 60
            },
            giza: {
                name: 'الجيزة',
                areas: ['الهرم', '6 أكتوبر', 'الشيخ زايد', 'المهندسين'],
                baseDeliveryFee: 60,
                estimatedTime: 90
            },
            alexandria: {
                name: 'الإسكندرية',
                areas: ['سموحة', 'سيدي بشر', 'المنتزه', 'سان ستيفانو'],
                baseDeliveryFee: 150,
                estimatedTime: 240
            }
        };
    }
    
    determineVehicleType(items) {
        const requiresRefrigeration = items.some(item => 
            item.requiresRefrigeration || item.category === 'fresh-meat'
        );
        
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        
        if (requiresRefrigeration) {
            return totalWeight > 100 ? 'refrigerated-truck' : 'refrigerated-van';
        }
        
        return totalWeight > 200 ? 'truck' : 'van';
    }
    
    calculateNextService(lastService) {
        const last = new Date(lastService);
        const next = new Date(last);
        next.setMonth(next.getMonth() + 3); // Every 3 months
        return next.toISOString();
    }
    
    isTemperatureInRange(temp, vehicle) {
        if (!vehicle.specifications.temperatureRange) return true;
        
        return temp >= vehicle.specifications.temperatureRange.min && 
               temp <= vehicle.specifications.temperatureRange.max;
    }
    
    // Save methods
    saveFleet() {
        localStorage.setItem('sfm_fleet', JSON.stringify(this.fleet));
    }
    
    saveDrivers() {
        localStorage.setItem('sfm_drivers', JSON.stringify(this.drivers));
    }
    
    saveDeliveries() {
        localStorage.setItem('sfm_deliveries', JSON.stringify(this.deliveries));
    }
    
    saveRoutes() {
        localStorage.setItem('sfm_routes', JSON.stringify(this.routes));
    }
    
    loadDrivers() {
        return JSON.parse(localStorage.getItem('sfm_drivers') || '[]');
    }
    
    loadDeliveries() {
        return JSON.parse(localStorage.getItem('sfm_deliveries') || '[]');
    }
}

// Initialize logistics system
const logisticsManager = new LogisticsManagement();

// Add UI integration
function addLogisticsUI() {
    // Add to navigation
    const moreSheet = document.querySelector('#sfmsMoreSheet .sheet-content > div');
    if (moreSheet) {
        const logisticsBtn = document.createElement('button');
        logisticsBtn.className = 'nav-item';
        logisticsBtn.innerHTML = `
            <span class="nav-icon">🚚</span>
            <span class="nav-label">التوصيل</span>
        `;
        logisticsBtn.onclick = () => {
            showLogisticsDashboard();
            hideSfmBottomSheet('sfmsMoreSheet');
        };
        moreSheet.appendChild(logisticsBtn);
    }
}

// Show logistics dashboard
function showLogisticsDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayDeliveries = logisticsManager.deliveries.filter(d => 
        d.requirements.date === today
    );
    
    const content = `
        <div class="logistics-dashboard">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <span class="card-icon">🚚</span>
                        إدارة التوصيل والخدمات اللوجستية
                    </h2>
                    <button class="btn btn-primary btn-sm" onclick="showRouteOptimizer()">
                        تحسين المسارات
                    </button>
                </div>
                
                <div class="stats-grid-dynamic">
                    <div class="stat-card">
                        <div class="stat-value">${todayDeliveries.length}</div>
                        <div class="stat-label">توصيلات اليوم</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">
                            ${todayDeliveries.filter(d => d.status === 'delivered').length}
                        </div>
                        <div class="stat-label">مكتملة</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">
                            ${todayDeliveries.filter(d => d.status === 'in-transit').length}
                        </div>
                        <div class="stat-label">في الطريق</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">
                            ${logisticsManager.fleet.filter(v => v.status === 'available').length}
                        </div>
                        <div class="stat-label">مركبات متاحة</div>
                    </div>
                </div>
                
                <div class="logistics-sections">
                    <button class="btn btn-secondary" onclick="showDeliveryList()">
                        قائمة التوصيلات
                    </button>
                    <button class="btn btn-secondary" onclick="showFleetManagement()">
                        إدارة الأسطول
                    </button>
                    <button class="btn btn-secondary" onclick="showDriverManagement()">
                        إدارة السائقين
                    </button>
                    <button class="btn btn-secondary" onclick="showDeliveryTracking()">
                        تتبع مباشر
                    </button>
                </div>
            </div>
            
            <div class="card mt-3">
                <div class="card-header">
                    <h3 class="card-title">خريطة التوصيلات</h3>
                </div>
                <div id="deliveryMap" style="height: 400px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                    <p>خريطة التوصيلات (يتطلب Google Maps API)</p>
                </div>
            </div>
        </div>
    `;
    
    const logisticsSection = document.createElement('div');
    logisticsSection.className = 'section-page';
    logisticsSection.id = 'logisticsManagement';
    logisticsSection.innerHTML = content;
    
    document.getElementById('sfmsContentArea').appendChild(logisticsSection);
    showSfmSection('logisticsManagement');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    addLogisticsUI();
});