// Collective Sheep Buying System
const collectiveBuyingSystem = {
    // Sheep parts configuration with weights and base prices
    sheepParts: {
        shoulder_right: { name_en: "Right Shoulder", name_ar: "الكتف الأيمن", weight: 5, base_price_per_kg: 220 },
        shoulder_left: { name_en: "Left Shoulder", name_ar: "الكتف الأيسر", weight: 5, base_price_per_kg: 220 },
        leg_right: { name_en: "Right Leg", name_ar: "الفخذ الأيمن", weight: 4.5, base_price_per_kg: 250 },
        leg_left: { name_en: "Left Leg", name_ar: "الفخذ الأيسر", weight: 4.5, base_price_per_kg: 250 },
        rack: { name_en: "Rack (Ribs)", name_ar: "الضلوع", weight: 3, base_price_per_kg: 280 },
        loin: { name_en: "Loin", name_ar: "بيت الكلاوي", weight: 2.5, base_price_per_kg: 300 },
        breast: { name_en: "Breast", name_ar: "الصدر", weight: 2, base_price_per_kg: 180 },
        neck: { name_en: "Neck", name_ar: "الرقبة", weight: 1.5, base_price_per_kg: 160 },
        shank_front: { name_en: "Front Shanks", name_ar: "موزة أمامية", weight: 2, base_price_per_kg: 200 },
        shank_rear: { name_en: "Rear Shanks", name_ar: "موزة خلفية", weight: 2, base_price_per_kg: 200 },
        organs: { name_en: "Organs Set", name_ar: "مجموعة الأعضاء", weight: 2, base_price_per_kg: 150 },
        head: { name_en: "Head", name_ar: "الرأس", weight: 3, base_price_per_kg: 100 },
        fat: { name_en: "Fat/Tail", name_ar: "اللية", weight: 2, base_price_per_kg: 120 }
    },

    // Initialize the collective buying section
    init() {
        console.log('Initializing collective buying system...');
        // Add event listeners and load data when Alpine is ready
        if (window.Alpine) {
            this.setupAlpineData();
        }
    },

    // Setup Alpine.js data
    setupAlpineData() {
        Alpine.data('collectiveSheep', () => ({
            activeCollectives: [],
            selectedParts: [],
            currentSheep: null,
            loading: false,
            selectedArea: '',
            showCollectiveModal: false,
            sheepParts: collectiveBuyingSystem.sheepParts,
            
            async loadActiveCollectives() {
                this.loading = true;
                try {
                    // TODO: Fetch from PocketBase
                    // For now, use mock data
                    this.activeCollectives = collectiveBuyingSystem.getMockCollectives();
                } catch (error) {
                    console.error('Error loading collectives:', error);
                } finally {
                    this.loading = false;
                }
            },

            selectPart(partKey) {
                if (!this.currentSheep) return;
                
                const part = this.currentSheep.parts_data[partKey];
                if (!part || part.reserved_by) return;

                const index = this.selectedParts.indexOf(partKey);
                if (index > -1) {
                    this.selectedParts.splice(index, 1);
                } else {
                    this.selectedParts.push(partKey);
                }
            },

            getPartStatus(partKey) {
                if (!this.currentSheep) return 'unavailable';
                const part = this.currentSheep.parts_data[partKey];
                
                if (!part) return 'unavailable';
                if (part.reserved_by === 'current_user_id') return 'mine';
                if (part.reserved_by) return 'reserved';
                if (this.selectedParts.includes(partKey)) return 'selected';
                return 'available';
            },

            getTotalPrice() {
                let total = 0;
                this.selectedParts.forEach(partKey => {
                    const part = this.currentSheep?.parts_data[partKey];
                    if (part) {
                        total += part.price_egp;
                    }
                });
                return total;
            },

            async reserveParts() {
                if (this.selectedParts.length === 0) return;
                
                // TODO: Send reservation to backend
                console.log('Reserving parts:', this.selectedParts);
                alert('يرجى تسجيل الدخول لحجز الأجزاء المختارة');
            },

            getAreaName(areaId) {
                const areas = {
                    cairo_metro_nasr_city: { en: 'Nasr City', ar: 'مدينة نصر' },
                    cairo_metro_heliopolis: { en: 'Heliopolis', ar: 'مصر الجديدة' },
                    giza_west_october: { en: '6th October', ar: '6 أكتوبر' }
                };
                return areas[areaId] || { en: areaId, ar: areaId };
            },

            countAvailableParts(collective) {
                if (!collective || !collective.parts_data) return 0;
                return Object.values(collective.parts_data).filter(part => !part.reserved_by).length;
            },

            formatDate(dateString) {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            },

            filterByArea() {
                // TODO: Filter collectives by selected area
                console.log('Filtering by area:', this.selectedArea);
            },

            startNewCollective() {
                // TODO: Open modal to start new collective
                alert('This feature will allow you to start a new collective sheep purchase in your area');
            },

            viewCollectiveDetails(collective) {
                this.currentSheep = collective;
                this.selectedParts = [];
                this.showCollectiveModal = true;
            },

            closeCollectiveModal() {
                this.showCollectiveModal = false;
                this.currentSheep = null;
                this.selectedParts = [];
            },

            getPartClass(partKey) {
                const status = this.getPartStatus(partKey);
                return {
                    'available': status === 'available',
                    'reserved': status === 'reserved',
                    'selected': status === 'selected',
                    'mine': status === 'mine'
                };
            },

            formatPrice(price) {
                return `EGP ${price.toFixed(0)}`;
            }
        }));
    },

    // Generate SVG for sheep visualization
    generateSheepSVG(sheepData) {
        const bookingPercentage = sheepData.booking_percentage || 0;
        
        return `
        <div class="sheep-visualization">
            <div class="booking-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${bookingPercentage}%"></div>
                </div>
                <div class="progress-text bil-spread">
                    <span class="en">${bookingPercentage}% Reserved</span>
                    <span class="ar">${bookingPercentage}% محجوز</span>
                </div>
            </div>
            
            <svg viewBox="0 0 800 600" class="sheep-svg">
                <!-- Sheep body outline -->
                <g class="sheep-outline">
                    <path d="M400 100 Q200 150 150 300 Q150 450 250 500 L550 500 Q650 450 650 300 Q600 150 400 100" 
                          fill="none" stroke="#8B4513" stroke-width="3"/>
                </g>
                
                <!-- Interactive parts -->
                ${this.generateSheepParts(sheepData)}
            </svg>
            
            <div class="parts-legend">
                <div class="legend-item available">
                    <span class="legend-color"></span>
                    <span class="bil-inline">
                        <span class="en">Available</span>
                        <span class="ar">متاح</span>
                    </span>
                </div>
                <div class="legend-item reserved">
                    <span class="legend-color"></span>
                    <span class="bil-inline">
                        <span class="en">Reserved</span>
                        <span class="ar">محجوز</span>
                    </span>
                </div>
                <div class="legend-item selected">
                    <span class="legend-color"></span>
                    <span class="bil-inline">
                        <span class="en">Your Selection</span>
                        <span class="ar">اختيارك</span>
                    </span>
                </div>
            </div>
        </div>
        `;
    },

    // Generate individual sheep parts for SVG
    generateSheepParts(sheepData) {
        // This would generate clickable regions for each part
        // Simplified for now
        return `
            <rect x="200" y="200" width="100" height="80" 
                  class="sheep-part" 
                  data-part="shoulder_right"
                  @click="selectPart('shoulder_right')"
                  :class="'status-' + getPartStatus('shoulder_right')"/>
            <!-- More parts would be added here -->
        `;
    },

    // Mock data for testing
    getMockCollectives() {
        return [
            {
                sheep_id: "CS20240115",
                status: "booking",
                area_id: "cairo_metro_nasr_city",
                total_weight_kg: 35,
                booking_percentage: 73,
                total_reserved_value: 8500,
                target_slaughter_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
                parts_data: {
                    shoulder_right: { weight: 5, price_egp: 1100, reserved_by: "user_123" },
                    shoulder_left: { weight: 5, price_egp: 1100, reserved_by: null },
                    leg_right: { weight: 4.5, price_egp: 1125, reserved_by: "user_456" },
                    leg_left: { weight: 4.5, price_egp: 1125, reserved_by: null },
                    rack: { weight: 3, price_egp: 840, reserved_by: "user_789" },
                    // ... more parts
                }
            }
        ];
    }
};

// Monthly Subscription Box System
const subscriptionBoxSystem = {
    plans: {
        basic: {
            name_en: "Basic Box",
            name_ar: "الصندوق الأساسي",
            weight: "2-3kg",
            price_egp: 800,
            serves: "2-3 people",
            contents: ["Mixed popular cuts", "Ground meat", "Recipe card"]
        },
        family: {
            name_en: "Family Box",
            name_ar: "صندوق العائلة",
            weight: "5-7kg",
            price_egp: 1500,
            serves: "4-6 people",
            contents: ["Variety of cuts", "Premium selections", "Ground meat", "Recipe cards"]
        },
        premium: {
            name_en: "Premium Box",
            name_ar: "الصندوق المميز",
            weight: "10kg+",
            price_egp: 2500,
            serves: "6-8 people",
            contents: ["Premium cuts only", "Aged selections", "Special preparations", "Chef recipes"]
        }
    },

    // Initialize subscription system
    init() {
        console.log('Initializing subscription box system...');
        if (window.Alpine) {
            this.setupAlpineData();
        }
    },

    // Setup Alpine.js data for subscriptions
    setupAlpineData() {
        Alpine.data('subscriptionBox', () => ({
            selectedPlan: null,
            deliveryDay: 1,
            preferences: {
                no_organs: false,
                extra_ground: false,
                no_bones: false
            },
            
            selectPlan(planKey) {
                this.selectedPlan = planKey;
            },

            async subscribe() {
                if (!this.selectedPlan) return;
                
                // TODO: Process subscription
                console.log('Subscribing to plan:', this.selectedPlan);
                alert('يرجى تسجيل الدخول للاشتراك في الصندوق الشهري');
            }
        }));
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    collectiveBuyingSystem.init();
    subscriptionBoxSystem.init();
});

// Export for use in other scripts
window.collectiveBuyingSystem = collectiveBuyingSystem;
window.subscriptionBoxSystem = subscriptionBoxSystem;