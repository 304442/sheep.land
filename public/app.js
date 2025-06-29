// Initialize constants before Alpine starts
const initForm = {
        customer_name: "", customer_phone: "", customer_email: "", customer_country: "Egypt",
        delivery_option: "self_pickup_or_internal_distribution",
        delivery_city_id: "", delivery_address: "", delivery_instructions: "", 
        delivery_time_slot: "9AM-11AM", payment_method: "vodafone_cash", terms_agreed: false,
        total_service_fee_egp: 0, delivery_fee_egp: 0, online_payment_fee_applied_egp: 0,
        final_total_egp: 0, user_id: null,
        promo_code: "", promo_applied: false, promo_discount_amount: 0
    };

    const initUdheya = {
        itemKey: null, serviceOption: "standard_service",
        sacrificeDay: "day1_10_dhul_hijjah",
        distribution: { choice: "me", splitOption: "", customSplitText: "" },
        isBuyNowIntent: false 
    };

    const payMethods = [
        // Egypt Local Payment Methods
        { id: 'vodafone_cash', title: 'Vodafone Cash', imgSrc: 'vodafonecash.png', category: 'egypt_local' },
        { id: 'instapay', title: 'InstaPay', imgSrc: 'instapay.svg', category: 'egypt_local' },
        { id: 'fawry', title: 'Fawry', imgSrc: 'fawry.svg', category: 'egypt_local' },
        { id: 'cod', title: 'Cash on Delivery', imgSrc: 'cod.svg', category: 'egypt_local' },
        
        // International Payment Methods
        { id: 'online_card', title: 'Visa', imgSrc: 'visa.svg', category: 'international' },
        { id: 'mastercard', title: 'Mastercard', imgSrc: 'mastercard.svg', category: 'international' },
        { id: 'google_pay', title: 'Google Pay', imgSrc: 'google_pay.svg', category: 'international' },
        { id: 'apple_pay', title: 'Apple Pay', imgSrc: 'apple_pay.svg', category: 'international' },
        { id: 'bank_transfer', title: 'Bank Transfer', imgSrc: 'bank_transfer.svg', category: 'international' },
        { id: 'revolut', title: 'Revolut', imgSrc: 'revolut.svg', category: 'international' },
        { id: 'monzo', title: 'Monzo', imgSrc: 'monzo.svg', category: 'international' },
        
        // Cryptocurrency
        { id: 'bitcoin', title: 'Bitcoin', imgSrc: 'bitcoin.svg', category: 'crypto' },
        { id: 'ethereum', title: 'Ethereum', imgSrc: 'ethereum.svg', category: 'crypto' },
        { id: 'usdt', title: 'USDT (Tether)', imgSrc: 'usdt.svg', category: 'crypto' }
    ];

    const sacrificeDayMapInternal = {
        "day1_10_dhul_hijjah": { "en": "Day 1 of Eid (10th Dhul Hijjah)", "ar": "اليوم الأول (10 ذو الحجة)" },
        "day2_11_dhul_hijjah": { "en": "Day 2 of Eid (11th Dhul Hijjah)", "ar": "اليوم الثاني (11 ذو الحجة)" },
        "day3_12_dhul_hijjah": { "en": "Day 3 of Eid (12th Dhul Hijjah)", "ar": "اليوم الثالث (12 ذو الحجة)" },
        "day4_13_dhul_hijjah": { "en": "Day 4 of Eid (13th Dhul Hijjah)", "ar": "اليوم الرابع (13 ذو الحجة)" }
    };

// Register Alpine component when Alpine initializes
document.addEventListener('alpine:init', () => {
    Alpine.data('sheepLand', () => ({
        load: { init: true, status: false, checkout: false, auth: false, orders: false, addingToCart: null },
        settings: {
            xchgRates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true } },
            defCurr: "EGP", waNumRaw: "", waNumDisp: "", promoEndISO: new Date().toISOString(), 
            promoDiscPc: 0, promoActive: false, servFeeEGP: 0, delAreas: [], payDetails: {},
            enable_udheya_section: true, enable_livesheep_section: true, enable_meat_section: true, enable_gatherings_section: true,
            slaughter_location_gmaps_url: "", online_payment_fee_egp: 0, refundPolicyHTMLContent: "<p>Loading policy...</p>",
            app_email_sender_address: "noreply@sheep.land", app_email_sender_name: "Sheep Land",
            site_title_en: "Sheep Land", site_title_ar: "أرض الأغنام",
            site_desc_en: "Premium live sheep & Udheya", site_desc_ar: "مواشي وأضاحي فاخرة"
        },
        prodOpts: { 
            // Religious/Occasions (ولائم/عزومات/مناسبات)
            aqiqah: [],           // عقيقة
            charity: [],          // صدقات  
            vow: [],              // نذر
            expiation: [],        // كفارة
            ready_to_eat: [],     // خراف جاهزة للأكل
            
            // Sacrificial (أضاحى)
            udheya: [],           // أضحية
            
            // Processed Options
            slaughtered: [],      // خراف مذبوحة ومجزأة
            meat_cuts: [],        // قطعيات
            
            // Legacy categories for compatibility
            gathering_package: []
        },
        selectedMeatWeights: {},
        selectedSacrificeVariants: {},
        searchQuery: '',
        showSearch: false,
        showAccountDropdown: false,
        showAuthDropdown: false,
        showWishlistDropdown: false,
        showCart: false,
        showWhatsAppChat: false,
        chatMessage: '',
        chatMessages: [],
        showExitOffer: false,
        showMeatCalculator: false,
        isPromoBarDismissed: false,
        cartItems: [], 
        isMobNavOpen: false, isCartOpen: false, isRefundModalOpen: false, 
        isOrderStatusModalOpen: false, isUdheyaConfigModalOpen: false, isWishlistOpen: false,
        showFeasibilityModal: false, showFarmModal: false, showAddSheepForm: false,
        farmActiveTab: 'inventory', // Track active tab in farm management
        showAuth: false, cartOpen: false,
        wishlistCount: 0,
        financialDashboard: {
            monthlyRevenue: 0,
            monthlyExpenses: 0,
            monthlyProfit: 0,
            totalAssetValue: 0,
            sheepInventoryCount: 0,
            pendingOrders: 0,
            readyForSaleCount: 0
        },
        syncInterval: null,
        wishlistItems: [],
        currentPage: 'home', currLang: "en", curr: "EGP",
        cd: { days: "00", hours: "00", mins: "00", secs: "00", ended: false }, cdTimer: null,
        checkoutForm: JSON.parse(JSON.stringify(initForm)),
        tempUdheyaConfig: JSON.parse(JSON.stringify(initUdheya)), 
        apiErr: null, usrApiErr: "", setupRequired: false, addedToCartMsg: { text: null, isError: false, pageContext: '' },
        statRes: null, statNotFound: false, lookupOrderID: "",
        orderConf: { show: false, orderID: "", totalEgp: 0, items: [], paymentInstructions: "", customerEmail: "" },
        currentUser: null, 
        auth: { email: "", password: "", passwordConfirm: "", name: "", phone: "", country: "Egypt", view: 'login' }, 
        userOrders: [], redirectAfterLogin: null,
        errs: {}, 
        errMsgs: { 
            required: { en: "This field is required.", ar: "هذا الحقل مطلوب." },
            email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." },
            phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." },
            terms_agreed: { en: "You must agree to the terms and refund policy.", ar: "يجب أن توافق على الشروط وسياسة الاسترداد." }
        },
        allCities: [], isDelFeeVar: false, configuringUdheyaItem: null,
        
        // Feasibility Calculator Data - Enhanced Version
        feasibility: {
            // Basic Project Parameters
            numSheep: 10,
            pricePerSheep: 3000,
            facilityCosts: 50000,
            feedCostPerMonth: 5000,
            laborCostPerMonth: 3000,
            vetCostPerMonth: 1000,
            sellingPricePerSheep: 5000,
            projectDuration: 6,
            selectedBreed: 'Barki',
            selectedSeason: 'Regular',
            includeBreeding: false,
            breedingRate: 0.3,
            lambPrice: 2000,
            showResults: false,
            
            // Enhanced Parameters from Archive
            landType: 'rented', // owned, rented
            landArea: 1000, // sq meters
            landCost: 0,
            annualLandRent: 12000,
            
            // Infrastructure Costs
            shelterCost: 30000,
            fencingCost: 15000,
            waterSystemCost: 10000,
            feedingEquipmentCost: 8000,
            
            // Operational Parameters
            feedConversionRatio: 3.5,
            dailyFeedPerHead: 2.5, // kg
            feedPricePerKg: 6,
            waterCostPerCubic: 5,
            
            // Breeding Parameters
            fertilityRate: 85, // percentage
            birthsPerEwePerYear: 1.5,
            avgOffspringPerBirth: 1.2,
            maleRatio: 50, // percentage
            mortalityRate: 5, // percentage
            weaningAge: 90, // days
            
            // Marketing Parameters
            marketShareTarget: 5, // percentage
            competitorCount: 10,
            competitorAvgPrice: 320, // per kg
            priceAdvantage: 5, // percentage below competitors
            
            // Financial Parameters
            discountRate: 12, // percentage for NPV
            inflationRate: 3, // percentage
            taxRate: 22.5, // percentage
            
            // Risk Factors
            feedPriceVolatility: 15, // percentage
            diseaseRiskFactor: 10, // percentage
            marketDemandVariation: 20, // percentage
            
            // Multi-year Projections
            projectionYears: 5,
            annualGrowthRate: 15, // percentage
            
            results: {
                totalInitialCost: 0,
                monthlyOperatingCost: 0,
                totalOperatingCost: 0,
                totalRevenue: 0,
                breedingRevenue: 0,
                netProfit: 0,
                roi: 0,
                monthlyProfit: 0,
                breakEvenMonths: 0,
                isViable: false,
                
                // Enhanced Results
                npv: 0,
                irr: 0,
                paybackPeriod: 0,
                profitMargin: 0,
                cashFlow: [],
                sensitivityAnalysis: {},
                riskAssessment: {},
                marketAnalysis: {}
            },
            
            // Advanced Features
            activeTab: 'basic',
            feedOptimizer: {
                targetProtein: 16,
                maxCostPerTon: 5000,
                ingredients: {
                    'Alfalfa': { protein: 18, cost: 4500, fiber: 25 },
                    'Corn': { protein: 9, cost: 3200, fiber: 2 },
                    'Soybean': { protein: 44, cost: 8000, fiber: 7 },
                    'Wheat Bran': { protein: 15, cost: 2800, fiber: 11 },
                    'Barley': { protein: 11, cost: 3500, fiber: 5 }
                }
            },
            breedingCalendar: {
                targetSeason: 'spring',
                ewesCount: 0,
                calendar: []
            },
            sensitivity: {
                variable: 'feedPrice',
                range: [-20, -10, 0, 10, 20],
                results: []
            },
            multiYear: {
                annualGrowthRate: 15,
                projections: []
            },
            advancedResults: {}
        },
        // Market data based on actual product catalog
        marketData: {
            breeds: {
                'Barki': { avgWeight: 45, pricePerKg: 320, growthRate: 1.2, description: { en: 'Barki - Desert breed', ar: 'برقي - سلالة صحراوية' } },
                'Rahmani': { avgWeight: 52, pricePerKg: 280, growthRate: 1.1, description: { en: 'Rahmani - Egyptian breed', ar: 'رحماني - سلالة مصرية' } },
                'Ossimi': { avgWeight: 58, pricePerKg: 300, growthRate: 1.15, description: { en: 'Ossimi - Upper Egypt breed', ar: 'أوسيمي - سلالة الصعيد' } },
                'Saidi': { avgWeight: 65, pricePerKg: 350, growthRate: 1.3, description: { en: 'Saidi - Premium breed', ar: 'صعيدي - سلالة ممتازة' } }
            },
            seasonalFactors: {
                'Eid': { multiplier: 1.4, description: { en: 'Eid Season (+40%)', ar: 'موسم العيد (+40%)' } },
                'Regular': { multiplier: 1.0, description: { en: 'Regular Season', ar: 'موسم عادي' } },
                'OffSeason': { multiplier: 0.85, description: { en: 'Off Season (-15%)', ar: 'خارج الموسم (-15%)' } }
            }
        },
        savedAnalyses: [],
        
        // Enhanced Farm Management Data
        farmSheep: [],
        filteredFarmSheep: [],
        farmFilterStatus: '',
        editingSheepId: null,
        sheepForm: {
            tagId: '',
            breed: '',
            age: '',
            weight: '',
            status: 'healthy',
            lastVaccination: '',
            notes: '',
            purchasePrice: 0,
            purchaseDate: '',
            motherTagId: '',
            fatherTagId: '',
            gender: 'female',
            location: 'barn1',
            feedingPlan: 'standard'
        },
        farmStats: {
            totalSheep: 0,
            healthy: 0,
            pregnant: 0,
            needAttention: 0,
            totalValue: 0,
            readyForMarket: 0,
            averageWeight: 0,
            monthlyExpenses: 0,
            
            // Enhanced Stats
            totalEwes: 0,
            totalRams: 0,
            lactating: 0,
            youngLambs: 0,
            mortalityRate: 0,
            feedInventory: 0,
            upcomingVaccinations: 0,
            expectedBirths: 0
        },
        
        // Enhanced Management Features
        breedingRecords: [],
        healthRecords: [],
        feedInventory: {
            alfalfa: 0,
            concentrate: 0,
            grains: 0,
            minerals: 0,
            lastRestockDate: null
        },
        
        tasks: [],
        taskForm: {
            title: '',
            description: '',
            dueDate: '',
            priority: 'medium',
            category: 'general',
            assignedTo: '',
            sheepIds: []
        },
        
        // Real-time integration properties
        syncInterval: null,
        lastSyncTime: null,
        activeAlerts: [],
        alertsShown: false,
        financialDashboard: {
            revenue: {
                total: 0,
                orderCount: 0,
                byCategory: {}
            },
            expenses: {
                total: 0,
                feed: 0,
                healthcare: 0,
                other: 0
            },
            profitability: {
                netProfit: 0,
                margin: 0,
                roi: 0
            },
            inventory: {
                livestock: 0,
                feed: 0,
                sheepCount: 0
            },
            projections: {
                projectedRevenue: 0,
                revenueVariance: 0
            }
        },
        
        reports: {
            showReports: false,
            selectedReport: 'health',
            dateRange: {
                start: '',
                end: ''
            }
        },
        
        farmSettings: {
            farmName: '',
            notifications: {
                vaccination: true,
                breeding: true,
                health: true,
                inventory: true
            },
            defaultVetContact: '',
            feedSupplierContact: ''
        },
        
        vaccinationSchedule: {
            'FMD': { name: { en: 'Foot & Mouth Disease', ar: 'الحمى القلاعية' }, frequency: 180, cost: 50 },
            'PPR': { name: { en: 'Peste des Petits', ar: 'طاعون المجترات' }, frequency: 365, cost: 75 },
            'Clostridial': { name: { en: 'Clostridial Diseases', ar: 'الأمراض الكلوستريدية' }, frequency: 180, cost: 40 },
            'Brucellosis': { name: { en: 'Brucellosis', ar: 'البروسيلا' }, frequency: 365, cost: 60 },
            'Enterotoxemia': { name: { en: 'Enterotoxemia', ar: 'التسمم المعوي' }, frequency: 120, cost: 35 },
            'Anthrax': { name: { en: 'Anthrax', ar: 'الجمرة الخبيثة' }, frequency: 365, cost: 45 }
        },
        
        // Analytics data
        analytics: {
            monthlyGrowthRate: [],
            mortalityTrends: [],
            revenueByMonth: [],
            expensesByCategory: []
        },
        
        get sacrificeDayMapInternal() { return sacrificeDayMapInternal; },
        get availPayMeths() { return payMethods; },
        get groupedPaymentMethods() {
            return {
                egypt_local: {
                    title: { en: 'Egypt Local Payment', ar: 'الدفع المحلي في مصر' },
                    methods: payMethods.filter(m => m.category === 'egypt_local')
                },
                international: {
                    title: { en: 'International Payment', ar: 'الدفع الدولي' },
                    methods: payMethods.filter(m => m.category === 'international')
                },
                crypto: {
                    title: { en: 'Cryptocurrency', ar: 'العملات الرقمية' },
                    methods: payMethods.filter(m => m.category === 'crypto')
                }
            };
        },
        get cartItemCount() { return this.cartItems.reduce((sum, item) => sum + item.quantity, 0); },
        deliveryTimeSlots: [ 
            { value: "9AM-11AM", label: "9 AM - 11 AM" }, 
            { value: "11AM-1PM", label: "11 AM - 1 PM" }, 
            { value: "1PM-3PM", label: "1 PM - 3 PM" }, 
            { value: "3PM-5PM", label: "3 PM - 5 PM" }, 
            { value: "5PM-7PM", label: "5 PM - 7 PM"},
            { value: "7PM-9PM", label: "7 PM - 9 PM"}
        ],

        pageTitle() {
            const titles = {
                home: this.settings.site_title_en || "Premium Live Sheep & Udheya", 
                udheya: "Premium Udheya Collection", 
                livesheep: "Live Sheep", 
                meat: "Fresh Meat & Cuts", 
                gatherings: "Event & Gathering Packages", 
                checkout: "Secure Checkout",
                auth: "Account Access", 
                account: "My Account"
            };
            return titles[this.currentPage] || titles.home;
        },

        async initApp() {
            // Check if PocketBase is set up FIRST before doing anything else
            let isPocketBaseSetUp = false;
            let collectionsExist = false;
            
            try {
                const healthCheck = await fetch('/api/health');
                isPocketBaseSetUp = healthCheck.ok;
                
                if (isPocketBaseSetUp) {
                    // Also check if collections exist
                    const settingsCheck = await fetch('/api/collections/settings/records?perPage=1');
                    collectionsExist = settingsCheck.ok;
                }
            } catch (e) {
                isPocketBaseSetUp = false;
                collectionsExist = false;
            }
            
            if (!isPocketBaseSetUp || !collectionsExist) {
                // Redirect immediately without initializing anything
                // console.error('Database not initialized. Redirecting to setup...');
                this.load.init = false;
                this.apiErr = "Database not initialized";
                this.usrApiErr = "Database not initialized. Click here to go to setup.";
                this.setupRequired = true;
                return;
            }
            
            this.load.init = true; 
            this.determineCurrentPageFromURL();
            
            const pb = new PocketBase('/'); 
            this.pb = pb;
            window.pb = pb; // Make PocketBase available globally for feedback system
            
            if (pb.authStore.isValid && pb.authStore.model) {
                this.currentUser = pb.authStore.model;
                // Start real-time sync for logged in users
                await this.initRealTimeSync();
            } else {
                pb.authStore.clear(); 
                this.currentUser = null;
            }
            this.loadCartFromStorage(); 
            
            // Initialize wishlist
            this.wishlistItems = wishlist.getItems();
            this.wishlistCount = wishlist.getCount();
            window.addEventListener('wishlistUpdated', (e) => {
                this.wishlistCount = e.detail.count;
                this.wishlistItems = wishlist.getItems();
            }); 

            try {
                const rs = await pb.collection('settings').getFirstListItem('id!=""');
                if (rs) {
                    Object.assign(this.settings, {
                        xchgRates: rs.xchgRates || this.settings.xchgRates,
                        defCurr: rs.defCurr || this.settings.defCurr,
                        waNumRaw: rs.waNumRaw || "", waNumDisp: rs.waNumDisp || "",
                        promoEndISO: rs.promoEndISO || new Date().toISOString(),
                        promoDiscPc: Number(rs.promoDiscPc) || 0,
                        promoActive: typeof rs.promoActive === 'boolean' ? rs.promoActive : false,
                        servFeeEGP: Number(rs.servFeeEGP) || 0,
                        delAreas: Array.isArray(rs.delAreas) ? rs.delAreas : [],
                        payDetails: typeof rs.payDetails === 'object' && rs.payDetails !== null ? rs.payDetails : {},
                        enable_udheya_section: typeof rs.enable_udheya_section === 'boolean' ? rs.enable_udheya_section : true,
                        enable_livesheep_section: typeof rs.enable_livesheep_section === 'boolean' ? rs.enable_livesheep_section : true,
                        enable_meat_section: typeof rs.enable_meat_section === 'boolean' ? rs.enable_meat_section : true,
                        enable_gatherings_section: typeof rs.enable_gatherings_section === 'boolean' ? rs.enable_gatherings_section : true,
                        slaughter_location_gmaps_url: rs.slaughter_location_gmaps_url || "",
                        online_payment_fee_egp: Number(rs.online_payment_fee_egp) || 0,
                        refundPolicyHTMLContent: rs.refund_policy_html || this.generateDefaultRefundPolicyHTML(),
                        app_email_sender_address: rs.app_email_sender_address || "noreply@sheep.land",
                        app_email_sender_name: rs.app_email_sender_name || "Sheep Land",
                        site_title_en: rs.site_title_en || "Sheep Land",
                        site_title_ar: rs.site_title_ar || "أرض الأغنام",
                        site_desc_en: rs.site_desc_en || "Premium live sheep & Udheya",
                        site_desc_ar: rs.site_desc_ar || "مواشي وأضاحي فاخرة"
                    });
                }

                const allProducts = await pb.collection('products').getFullList({ filter: 'is_active = true', sort:'+sort_order_type,+sort_order_variant'});
                // console.log('Loaded products from PocketBase:', allProducts.length, 'items');
                
                const categorizeProducts = (products, categoryFilter) => {
                    if (!products || !Array.isArray(products)) {
                        // console.warn(`Products is not an array for category ${categoryFilter}:`, products);
                        return [];
                    }
                    const categoryProducts = products.filter(p => p.product_category === categoryFilter);
                    const grouped = {};
                    categoryProducts.forEach(p => {
                        if (!grouped[p.type_key]) { 
                            grouped[p.type_key] = { 
                                valKey: p.type_key, nameEn: p.type_name_en, nameAr: p.type_name_ar, 
                                descEn: p.type_description_en, descAr: p.type_description_ar, 
                                priceKgEgp: p.price_per_kg_egp || 0, wps: [] 
                            }; 
                        }
                        grouped[p.type_key].wps.push({ 
                            itemKey: p.item_key, varIdPb: p.id, nameENSpec: p.variant_name_en, 
                            nameARSpec: p.variant_name_ar, wtRangeEn: p.weight_range_text_en, 
                            wtRangeAr: p.weight_range_text_ar, avgWtKg: p.avg_weight_kg, 
                            priceEGP: p.base_price_egp, stock: p.stock_available_pb, 
                            isActive: p.is_active, is_premium: p.is_premium, origin_farm: p.origin_farm,
                            product_category: p.product_category, type_key: p.type_key, type_name_en: p.type_name_en, 
                            type_name_ar: p.type_name_ar, descEn: p.type_description_en, 
                            descAr: p.type_description_ar, breed_info_en: p.breed_info_en, breed_info_ar: p.breed_info_ar,
                            discount_percentage: p.discount_percentage || 0
                        });
                    });
                    // Ensure all returned objects have valid wps arrays
                    const result = Object.values(grouped);
                    result.forEach(productType => {
                        if (!productType.wps) productType.wps = [];
                    });
                    return result;
                };
                
                // Helper to ensure all productTypes have valid wps arrays
                const ensureValidStructure = (productTypes) => {
                    return productTypes.filter(pt => pt && pt.wps && Array.isArray(pt.wps));
                };
                
                // Map products to new categories based on product tags or type
                this.prodOpts.udheya = ensureValidStructure(categorizeProducts(allProducts, 'udheya'));
                this.prodOpts.aqiqah = ensureValidStructure(categorizeProducts(allProducts, 'aqiqah'));
                this.prodOpts.charity = ensureValidStructure(categorizeProducts(allProducts, 'charity'));
                this.prodOpts.vow = ensureValidStructure(categorizeProducts(allProducts, 'vow'));
                this.prodOpts.expiation = ensureValidStructure(categorizeProducts(allProducts, 'expiation'));
                this.prodOpts.ready_to_eat = ensureValidStructure(categorizeProducts(allProducts, 'ready_to_eat'));
                this.prodOpts.slaughtered = ensureValidStructure(categorizeProducts(allProducts, 'slaughtered'));
                this.prodOpts.meat_cuts = ensureValidStructure(categorizeProducts(allProducts, 'meat_cuts'));
                
                // Legacy compatibility
                this.prodOpts.gathering_package = ensureValidStructure(categorizeProducts(allProducts, 'gathering_package'));
                
                // console.log('Product categories loaded:', {
                //     udheya: this.prodOpts.udheya.length,
                //     livesheep: this.prodOpts.livesheep_general.length,
                //     meat: this.prodOpts.meat_cuts.length,
                //     gathering: this.prodOpts.gathering_package.length
                // });
                
                // Verify data structure integrity
                const allCategories = ['udheya', 'meat_cuts', 'gathering_package'];
                allCategories.forEach(cat => {
                    const valid = this.prodOpts[cat].every(pt => pt && pt.wps && Array.isArray(pt.wps));
                    if (!valid) {
                        // console.warn(`Data structure issue in ${cat} - some products missing wps array`);
                    }
                });
                
                // Debug: Check structure of first udheya product
                if (this.prodOpts.udheya.length > 0) {
                    // console.log('First udheya product structure:', this.prodOpts.udheya[0]);
                    // console.log('Has wps?', this.prodOpts.udheya[0].hasOwnProperty('wps'));
                    // console.log('wps is array?', Array.isArray(this.prodOpts.udheya[0].wps));
                }
            
                let cities = []; 
                (this.settings.delAreas || []).forEach(gov => { 
                    if (gov.cities && Array.isArray(gov.cities) && gov.cities.length > 0) { 
                        gov.cities.forEach(city => { 
                            cities.push({ 
                                id: `${gov.id}_${city.id}`, nameEn: `${gov.name_en} - ${city.name_en}`, 
                                nameAr: `${gov.name_ar} - ${city.name_ar}`, delFeeEgp: city.delivery_fee_egp, govId: gov.id 
                            }); 
                        });
                    } else if (gov.delivery_fee_egp !== undefined) { 
                        cities.push({ 
                            id: gov.id, nameEn: gov.name_en, nameAr: gov.name_ar, 
                            delFeeEgp: gov.delivery_fee_egp, govId: gov.id 
                        }); 
                    }
                });
                this.allCities = cities.sort((a,b) => a.nameEn.localeCompare(b.nameEn));
                
            } catch (e) { 
                // console.error("Failed to load products from database:", e);
                this.apiErr = String(e.message || "Could not load initial application data."); 
                this.usrApiErr = "Database connection error. Click here to go to setup.";
                this.setupRequired = true;
                return; // Stop further execution
            }
            
            this.curr = this.settings.defCurr || "EGP"; 
            this.startCd(); 
            this.clearAllErrors();
            
            if (this.currentPage === 'checkout') this.initCheckoutPage();
            else if (this.currentPage === 'auth') this.initAuthPage();
            else if (this.currentPage === 'account') this.initAccountPage();
            else this.calculateFinalTotal();
            
            this.load.init = false;
            window.addEventListener('hashchange', () => this.determineCurrentPageFromURL());
            
            // Cleanup on page unload to prevent memory leaks
            window.addEventListener('beforeunload', () => this.cleanup());
        },

        determineCurrentPageFromURL() {
            const hash = window.location.hash.replace(/^#/, '');
            const validPages = ['home', 'sacrifices', 'fresh-meat', 'events-catering', 'checkout', 'auth', 'account'];
            if (hash && validPages.includes(hash.split('?')[0])) {
                this.currentPage = hash.split('?')[0];
            } else {
                this.currentPage = 'home';
            }
            this.updatePageSpecifics();
        },

        updatePageSpecifics() {
            if (this.currentPage !== 'checkout' && this.orderConf.show) {
                this.orderConf = { show: false, orderID: "", totalEgp: 0, items: [], paymentInstructions: "", customerEmail: "" };
            }

            if (this.currentPage === 'checkout') this.initCheckoutPage();
            else if (this.currentPage === 'auth') this.initAuthPage();
            else if (this.currentPage === 'account') this.initAccountPage();

            this.$nextTick(() => {
                const mainContentArea = document.querySelector(`main > section[x-show*="${this.currentPage}"]`);
                if (mainContentArea) {
                    let offset = document.querySelector('.site-head')?.offsetHeight || 0;
                     window.scrollTo({ top: mainContentArea.offsetTop - offset - 10, behavior: 'smooth' });
                } else {
                    window.scrollTo({top: 0, behavior: 'smooth'});
                }
            });
        },

        navigateToOrScroll(targetPage, targetAnchor = null) {
            if (targetPage.startsWith('#')) {
                targetAnchor = targetPage.substring(1);
                targetPage = this.currentPage;
            }
            
            const pageName = targetPage.split('?')[0];
            
            if (this.currentPage !== pageName) {
                this.currentPage = pageName;
                window.location.hash = targetPage; 
            } else {
                if (targetAnchor) {
                    const element = document.getElementById(targetAnchor);
                    if (element) {
                        let offset = document.querySelector('.site-head')?.offsetHeight || 0;
                        window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - offset - 10, behavior: 'smooth' });
                    }
                } else {
                     const mainContentArea = document.querySelector(`main > section[x-show*="${this.currentPage}"]`);
                     if (mainContentArea) {
                         let offset = document.querySelector('.site-head')?.offsetHeight || 0;
                         window.scrollTo({ top: mainContentArea.offsetTop - offset - 10, behavior: 'smooth' });
                     } else {
                         window.scrollTo({top: 0, behavior: 'smooth'});
                     }
                }
            }
        },

        generateDefaultRefundPolicyHTML() {
            return `<div class="bil-row"><p class="en">Welcome to Sheep Land. Please read our policy carefully.</p><p class="ar" dir="rtl">مرحباً بكم في أرض الأغنام. يرجى قراءة سياستنا بعناية.</p></div>`;
        },

        scrollToSection(sectionId) {
            const element = document.getElementById(sectionId);
            if (element) {
                const headerOffset = document.querySelector('.site-head')?.offsetHeight || 100;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        },

        toggleCart() { 
            const wasOpen = this.isCartOpen;
            this.closeAllDropdowns();
            this.isCartOpen = !wasOpen; 
        },
        closeCart() { 
            this.isCartOpen = false; 
        },
        
        toggleWishlistDropdown() {
            const wasOpen = this.isWishlistOpen;
            this.closeAllDropdowns();
            this.isWishlistOpen = !wasOpen;
        },
        closeWishlist() {
            this.isWishlistOpen = false;
        },
        
        toggleWishlist(product) {
            if (wishlist.contains(product.item_key || product.itemKey)) {
                wishlist.remove(product.item_key || product.itemKey);
            } else {
                wishlist.add({
                    item_key: product.item_key || product.itemKey,
                    nameEN: product.nameENSpec || product.nameEN,
                    nameAR: product.nameARSpec || product.nameAR,
                    priceDisp: this.fmtPrice(product.priceEGP || product.price),
                    image: this.getProductImage(product, product.product_category || 'general'),
                    cat: product.product_category || 'general'
                });
            }
        },
        
        isInWishlist(itemKey) {
            return wishlist.contains(itemKey);
        },
        
        removeFromWishlist(itemKey) {
            wishlist.remove(itemKey);
            this.wishlistItems = wishlist.getItems();
            this.showWishlistNotification('Removed from wishlist', 'remove');
        },
        
        clearWishlist() {
            if (confirm('Are you sure you want to clear your wishlist?')) {
                wishlist.clear();
                this.wishlistItems = [];
                this.isWishlistOpen = false;
                this.showWishlistNotification('Wishlist cleared', 'info');
            }
        },

        // Feedback System Integration
        openFeedback(context = 'general', orderId = null) {
            if (window.feedbackSystem) {
                window.feedbackSystem.openFeedbackModal(context, orderId);
            }
        },

        getFeedbackStats() {
            if (window.feedbackSystem) {
                return window.feedbackSystem.getStatistics();
            }
            return null;
        },
        
        moveToCart(item) {
            // Find the actual product data
            let product = null;
            const categories = ['udheya', 'meat_cuts', 'gathering_package'];
            
            for (const cat of categories) {
                if (this.prodOpts[cat] && Array.isArray(this.prodOpts[cat])) {
                    for (const productType of this.prodOpts[cat]) {
                        if (productType && productType.wps && Array.isArray(productType.wps)) {
                            const found = productType.wps.find(p => p.itemKey === item.item_key);
                            if (found) {
                                product = found;
                                break;
                            }
                        }
                    }
                }
                if (product) break;
            }
            
            if (product) {
                this.addItemToCart(product);
                wishlist.remove(item.item_key);
                this.wishlistItems = wishlist.getItems();
                this.showWishlistNotification('Moved to cart', 'success');
            } else {
                this.showWishlistNotification('Product not found', 'remove');
            }
        },
        
        showWishlistNotification(message, type = 'info') {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `wishlist-notification ${type}`;
            notification.innerHTML = `
                <span>${message}</span>
                <span class="close">&times;</span>
            `;
            
            document.body.appendChild(notification);
            
            // Auto remove after 3 seconds
            setTimeout(() => {
                notification.remove();
            }, 3000);
            
            // Close on click
            notification.querySelector('.close').addEventListener('click', () => {
                notification.remove();
            });
        },

        addItemToCart(productVariant, udheyaConfigDetails = null) {
            this.load.addingToCart = productVariant.itemKey;
            this.addedToCartMsg = { text: null, isError: false, pageContext: this.currentPage };
            
            if (!productVariant || !productVariant.itemKey || productVariant.stock <= 0) {
                this.addedToCartMsg = { text: { en: 'This item is out of stock.', ar: 'هذا المنتج غير متوفر.' }, isError: true, pageContext: this.currentPage };
                this.load.addingToCart = null; 
                setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000); 
                return;
            }

            const isUdheya = productVariant.product_category === 'udheya';
            const existingItemIndex = this.cartItems.findIndex(item => item.itemKey === productVariant.itemKey);

            if (existingItemIndex > -1) {
                if (isUdheya) {
                    this.addedToCartMsg = { text: { en: 'This Udheya is already in your cart.', ar: 'هذه الأضحية موجودة بالفعل في سلتك.' }, isError: true, pageContext: this.currentPage };
                    this.load.addingToCart = null; 
                    setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 5000); 
                    return;
                }
                if (this.cartItems[existingItemIndex].quantity < productVariant.stock) { 
                    this.cartItems[existingItemIndex].quantity++; 
                } else { 
                    this.addedToCartMsg = { text: { en: 'Stock limit reached.', ar: 'وصلت إلى الحد الأقصى للمخزون.' }, isError: true, pageContext: this.currentPage }; 
                    this.load.addingToCart = null; 
                    setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000); 
                    return; 
                }
            } else {
                const newItem = { ...productVariant, quantity: 1, uniqueIdInCart: Date.now().toString(36) + Math.random().toString(36).substring(2) };
                if (isUdheya && udheyaConfigDetails) { 
                    newItem.udheya_details = { ...udheyaConfigDetails }; 
                }
                this.cartItems.push(newItem);
            }
            
            this.saveCartToStorage(); 
            this.calculateFinalTotal(); 
            this.addedToCartMsg = { text: { en: `${productVariant.nameENSpec} added to cart.`, ar: `تمت إضافة ${productVariant.nameARSpec} إلى السلة.` }, isError: false, pageContext: this.currentPage };
            this.load.addingToCart = null;
            if (this.isUdheyaConfigModalOpen && udheyaConfigDetails && !udheyaConfigDetails.isBuyNowIntent) this.closeUdheyaConfiguration(); 
            setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000);
        },

        async buyNow(productVariant, udheyaConfigDetails = null) {
            this.load.addingToCart = productVariant.itemKey; 
            this.addedToCartMsg = { text: null, isError: false, pageContext: this.currentPage }; 
            this.clearAllErrors(); 

            if (!productVariant || !productVariant.itemKey || productVariant.stock <= 0) {
                this.addedToCartMsg = { text: { en: 'This item is out of stock.', ar: 'هذا المنتج غير متوفر.' }, isError: true, pageContext: this.currentPage };
                this.load.addingToCart = null;
                setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000);
                return;
            }

            const buyNowItem = { ...productVariant, quantity: 1, uniqueIdInCart: Date.now().toString(36) + Math.random().toString(36).substring(2) };

            if (productVariant.product_category === 'udheya') {
                if (!udheyaConfigDetails) {
                    this.openUdheyaConfiguration(productVariant, true); 
                    this.load.addingToCart = null;
                    return;
                }
                buyNowItem.udheya_details = { ...udheyaConfigDetails };
            }
            
            try {
                localStorage.setItem('sheepLandBuyNowItem', JSON.stringify(buyNowItem));
            } catch(e) {
                this.usrApiErr = "Could not proceed with Buy Now. Please try adding to cart.";
                this.load.addingToCart = null;
                return;
            }
            
            this.load.addingToCart = null;
            if (this.isUdheyaConfigModalOpen) this.closeUdheyaConfiguration();
            this.navigateToOrScroll('checkout?buyNow=true');
        },

        removeFromCart(uniqueIdInCart) { 
            this.cartItems = this.cartItems.filter(item => item.uniqueIdInCart !== uniqueIdInCart); 
            this.saveCartToStorage(); 
            this.calculateFinalTotal();
        },

        updateCartQuantity(uniqueIdInCart, newQuantity) { 
            const itemIndex = this.cartItems.findIndex(i => i.uniqueIdInCart === uniqueIdInCart);
            if (itemIndex > -1) { 
                const item = this.cartItems[itemIndex];
                const qty = Math.max(1, parseInt(newQuantity) || 1);
                if (item.product_category === 'udheya' && qty > 1) { 
                    this.addedToCartMsg = { text: { en: 'Only one of each Udheya can be added.', ar: 'يمكن إضافة أضحية واحدة فقط من كل نوع.'}, isError: true, pageContext: 'cart' }; 
                    item.quantity = 1; 
                    setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000); 
                } else if (qty <= item.stock) { 
                    item.quantity = qty; 
                    this.addedToCartMsg = { text: null, isError: false, pageContext: '' }; 
                } else { 
                    item.quantity = item.stock; 
                    this.addedToCartMsg = { text: { en: 'Requested quantity exceeds available stock.', ar: 'الكمية المطلوبة تتجاوز المخزون المتاح.'}, isError: true, pageContext: 'cart' }; 
                    setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000);
                }
            } 
            this.saveCartToStorage(); 
            this.calculateFinalTotal();
        },

        getSubtotalForItem(cartItem) { 
            let itemTotal = cartItem.priceEGP * cartItem.quantity; 
            if (cartItem.product_category === 'udheya' && cartItem.udheya_details?.serviceOption === 'standard_service') { 
                itemTotal += (this.settings.servFeeEGP || 0); 
            } 
            return itemTotal;
        },

        calculateCartSubtotal() { return this.cartItems.reduce((total, item) => total + (item.priceEGP * item.quantity), 0); },
        calculateTotalServiceFee() { 
            return this.cartItems.reduce((totalFee, item) => { 
                if (item.product_category === 'udheya' && item.udheya_details?.serviceOption === 'standard_service') { 
                    return totalFee + (this.settings.servFeeEGP || 0); 
                } 
                return totalFee; 
            }, 0);
        },
        calculateCartTotal() { return this.calculateCartSubtotal() + this.calculateTotalServiceFee(); },

        saveCartToStorage() { 
            try { 
                localStorage.setItem('sheepLandCart-' + (this.currentUser?.id || 'guest'), JSON.stringify(this.cartItems)); 
            } catch(e){ 
                // console.error("Error saving cart to localStorage", e); 
            } 
        },

        loadCartFromStorage() { 
            try { 
                const storedCart = localStorage.getItem('sheepLandCart-' + (this.currentUser?.id || 'guest')); 
                if (storedCart) { 
                    this.cartItems = JSON.parse(storedCart); 
                } else { 
                    this.cartItems = [];
                } 
            } catch(e){ 
                // console.error("Error loading cart from localStorage", e); 
                this.cartItems = []; 
                localStorage.removeItem('sheepLandCart-' + (this.currentUser?.id || 'guest'));
            } 
            this.calculateFinalTotal(); 
        },

        clearCart() { 
            this.cartItems = []; 
            this.saveCartToStorage(); 
            this.calculateFinalTotal(); 
        },

        openUdheyaConfiguration(item, isBuyNowIntent = false) { 
            if (!item.isActive || item.stock <= 0) { 
                this.addedToCartMsg = { text: { en: 'This Udheya is out of stock.', ar: 'هذه الأضحية غير متوفرة حالياً.' }, isError: true, pageContext: 'udheya' }; 
                setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext:'' }, 3000); 
                return; 
            }
            this.configuringUdheyaItem = {...item}; 
            this.tempUdheyaConfig = JSON.parse(JSON.stringify(initUdheya)); 
            this.tempUdheyaConfig.itemKey = item.itemKey; 
            this.tempUdheyaConfig.isBuyNowIntent = isBuyNowIntent; 
            this.isUdheyaConfigModalOpen = true; 
            document.body.classList.add('overflow-hidden');
        },

        closeUdheyaConfiguration() { 
            this.isUdheyaConfigModalOpen = false; 
            this.configuringUdheyaItem = null; 
            const errorKeys = ['udheya_service_config', 'udheya_sacrifice_day_config', 'udheya_distribution_choice_config', 'udheya_split_option_config'];
            errorKeys.forEach(key => this.clrErr(key));
            document.body.classList.remove('overflow-hidden');
        },

        confirmUdheyaConfigurationAndProceed() { 
            if (!this.configuringUdheyaItem) return; 
            let isValid = true; 
            const errorKeys = ['udheya_service_config', 'udheya_sacrifice_day_config', 'udheya_distribution_choice_config', 'udheya_split_option_config'];
            errorKeys.forEach(key => this.clrErr(key));

            if (!this.tempUdheyaConfig.serviceOption) { 
                this.setErr('udheya_service_config', 'required'); 
                isValid = false; 
            }
            if (this.tempUdheyaConfig.serviceOption === 'standard_service' && !this.tempUdheyaConfig.sacrificeDay) { 
                this.setErr('udheya_sacrifice_day_config', 'required'); 
                isValid = false; 
            }
            if (!this.tempUdheyaConfig.distribution.choice) { 
                this.setErr('udheya_distribution_choice_config', 'required'); 
                isValid = false; 
            }
            if (this.tempUdheyaConfig.distribution.choice === 'split' && !this.tempUdheyaConfig.distribution.splitOption) { 
                this.setErr('udheya_split_option_config', 'required'); 
                isValid = false; 
            }
            if (this.tempUdheyaConfig.distribution.choice === 'split' && this.tempUdheyaConfig.distribution.splitOption === 'custom' && !this.tempUdheyaConfig.distribution.customSplitText.trim()) { 
                this.setErr('udheya_split_option_config', {en: 'Please specify custom split details.', ar: 'يرجى تحديد تفاصيل التقسيم المخصصة.'}); 
                isValid = false; 
            }
            if (!isValid) return;

            if (this.tempUdheyaConfig.isBuyNowIntent) {
                this.buyNow(this.configuringUdheyaItem, this.tempUdheyaConfig);
            } else {
                this.addItemToCart(this.configuringUdheyaItem, this.tempUdheyaConfig);
            }
        },

        getUdheyaConfigErrorText() {
            const errorKeys = ['udheya_service_config', 'udheya_sacrifice_day_config', 'udheya_distribution_choice_config', 'udheya_split_option_config'];
            for (const key of errorKeys) { 
                if (this.errs[key]) return this.currLang === 'ar' ? this.errs[key].ar : this.errs[key].en; 
            } 
            return '';
        },

        openRefundModal() { this.isRefundModalOpen = true; document.body.classList.add('overflow-hidden'); },
        closeRefundModal() { this.isRefundModalOpen = false; document.body.classList.remove('overflow-hidden'); },
        openOrderStatusModal() { this.isOrderStatusModalOpen = true; document.body.classList.add('overflow-hidden'); this.$nextTick(() => this.$refs.lookupOrderIdInputModal?.focus()); },
        closeOrderStatusModal() { this.isOrderStatusModalOpen = false; document.body.classList.remove('overflow-hidden'); this.lookupOrderID = ''; this.statRes = null; this.statNotFound = false; this.clrErr('lookupOrderID');},
        
        // Feasibility Calculator Modal
        openFeasibilityModal() { 
            this.showFeasibilityModal = true; 
            document.body.classList.add('overflow-hidden');
            if (this.initFeasibility) {
                this.initFeasibility();
            }
            // Update with actual data if available
            if (this.currentUser) {
                this.updateFeasibilityWithActualData();
            }
        },
        closeFeasibilityModal() { 
            this.showFeasibilityModal = false; 
            document.body.classList.remove('overflow-hidden'); 
        },
        
        // Farm Management Modal
        openFarmModal() { 
            this.showFarmModal = true; 
            document.body.classList.add('overflow-hidden');
            if (this.initFarmManagement) {
                this.initFarmManagement();
            }
            // Update financial dashboard if available
            if (this.currentUser) {
                this.updateFinancialDashboard();
                this.syncFarmInventoryToEcommerce();
            }
        },
        closeFarmModal() { 
            this.showFarmModal = false; 
            document.body.classList.remove('overflow-hidden'); 
        },
        
        // Enhanced Feasibility Calculator Methods
        calculateFeasibility() {
            const f = this.feasibility;
            const breedData = this.marketData.breeds[f.selectedBreed] || this.marketData.breeds['Barki'];
            const seasonFactor = this.marketData.seasonalFactors[f.selectedSeason].multiplier;
            
            // Enhanced Initial Costs Calculation
            const youngSheepWeight = breedData.avgWeight * 0.6;
            const sheepCost = f.numSheep * youngSheepWeight * breedData.pricePerKg;
            
            // Infrastructure costs
            const infrastructureCosts = f.shelterCost + f.fencingCost + f.waterSystemCost + f.feedingEquipmentCost;
            
            // Land costs
            const landInitialCost = f.landType === 'owned' ? f.landCost : 0;
            
            f.results.totalInitialCost = sheepCost + infrastructureCosts + landInitialCost + f.facilityCosts;
            
            // Enhanced Operating Costs Calculation
            const actualFeedCost = f.numSheep * f.dailyFeedPerHead * f.feedPricePerKg * 30;
            const landRentMonthly = f.landType === 'rented' ? f.annualLandRent / 12 : 0;
            
            f.results.monthlyOperatingCost = actualFeedCost + f.laborCostPerMonth + f.vetCostPerMonth + landRentMonthly;
            f.results.totalOperatingCost = f.results.monthlyOperatingCost * f.projectDuration;
            
            // Enhanced Growth and Production Calculations
            const growthFactor = Math.pow(breedData.growthRate, f.projectDuration / 12);
            const finalWeight = breedData.avgWeight * growthFactor;
            
            // Apply competitive pricing
            const competitivePricePerKg = f.competitorAvgPrice * (1 - f.priceAdvantage / 100);
            
            // Revenue calculations with risk factors
            const baseRevenue = f.numSheep * finalWeight * competitivePricePerKg * seasonFactor;
            const marketVariationFactor = 1 - (f.marketDemandVariation / 100) * 0.5; // Apply 50% of variation as conservative estimate
            
            f.results.totalRevenue = baseRevenue * marketVariationFactor;
            
            // Enhanced Breeding Calculations
            f.results.breedingRevenue = 0;
            if (f.includeBreeding && f.projectDuration >= 12) {
                const breedingMonths = Math.max(0, f.projectDuration - 5); // Account for maturation time
                const effectiveEwes = f.numSheep * 0.7; // Assume 70% are breeding ewes
                const lambsPerYear = effectiveEwes * (f.fertilityRate / 100) * f.birthsPerEwePerYear * f.avgOffspringPerBirth;
                const survivingLambs = lambsPerYear * (1 - f.mortalityRate / 100);
                const totalLambs = survivingLambs * (breedingMonths / 12);
                
                f.results.breedingRevenue = totalLambs * f.lambPrice;
            }
            
            // Calculate comprehensive profit metrics
            const totalCost = f.results.totalInitialCost + f.results.totalOperatingCost;
            const totalRevenue = f.results.totalRevenue + f.results.breedingRevenue;
            const grossProfit = totalRevenue - totalCost;
            
            // Apply tax calculation
            const taxableProfit = Math.max(0, grossProfit);
            const tax = taxableProfit * (f.taxRate / 100);
            
            f.results.netProfit = grossProfit - tax;
            f.results.monthlyProfit = f.results.netProfit / f.projectDuration;
            f.results.profitMargin = totalRevenue > 0 ? (f.results.netProfit / totalRevenue) * 100 : 0;
            
            // Calculate ROI
            f.results.roi = (f.results.netProfit / f.results.totalInitialCost) * 100;
            
            // Calculate break-even with enhanced accuracy
            const monthlyRevenue = totalRevenue / f.projectDuration;
            const monthlyProfit = monthlyRevenue - f.results.monthlyOperatingCost;
            
            if (monthlyProfit > 0) {
                f.results.breakEvenMonths = Math.ceil(f.results.totalInitialCost / monthlyProfit);
            } else {
                f.results.breakEvenMonths = 999;
            }
            
            // Calculate NPV (Net Present Value)
            f.results.cashFlow = [];
            f.results.npv = -f.results.totalInitialCost;
            
            for (let month = 1; month <= f.projectDuration; month++) {
                const monthCashFlow = monthlyRevenue - f.results.monthlyOperatingCost;
                const discountFactor = Math.pow(1 + f.discountRate / 100 / 12, month);
                const presentValue = monthCashFlow / discountFactor;
                
                f.results.cashFlow.push({
                    month: month,
                    revenue: monthlyRevenue,
                    cost: f.results.monthlyOperatingCost,
                    cashFlow: monthCashFlow,
                    presentValue: presentValue
                });
                
                f.results.npv += presentValue;
            }
            
            // Simple payback period calculation
            f.results.paybackPeriod = f.results.breakEvenMonths;
            
            // Risk Assessment
            f.results.riskAssessment = {
                feedPriceRisk: f.feedPriceVolatility > 20 ? 'High' : f.feedPriceVolatility > 10 ? 'Medium' : 'Low',
                diseaseRisk: f.diseaseRiskFactor > 15 ? 'High' : f.diseaseRiskFactor > 8 ? 'Medium' : 'Low',
                marketRisk: f.marketDemandVariation > 25 ? 'High' : f.marketDemandVariation > 15 ? 'Medium' : 'Low',
                overallRisk: this.calculateOverallRisk(f)
            };
            
            // Market Analysis
            f.results.marketAnalysis = {
                estimatedMarketShare: (f.numSheep / (f.competitorCount * 50)) * 100, // Assume avg competitor has 50 sheep
                priceCompetitiveness: f.priceAdvantage > 0 ? 'Competitive' : 'Premium',
                demandOutlook: seasonFactor > 1.2 ? 'High' : seasonFactor > 0.9 ? 'Normal' : 'Low'
            };
            
            // Enhanced viability determination
            f.results.isViable = f.results.netProfit > 0 && 
                                f.results.roi > 20 && 
                                f.results.breakEvenMonths <= 18 &&
                                f.results.npv > 0 &&
                                f.results.riskAssessment.overallRisk !== 'High';
            
            // Show results
            f.showResults = true;
        },
        
        // Advanced Feasibility Methods
        initAdvancedFeatures() {
            // Initialize charts if needed
            if (this.feasibility.activeTab === 'advanced') {
                this.initializeAdvancedCalculations();
            }
        },
        
        initializeAdvancedCalculations() {
            // Update breeding calendar ewes count
            this.feasibility.breedingCalendar.ewesCount = Math.floor(this.feasibility.numSheep * 0.7);
        },
        
        optimizeFeedMix() {
            const f = this.feasibility;
            const targetProtein = f.feedOptimizer.targetProtein;
            const maxCost = f.feedOptimizer.maxCostPerTon;
            
            // Simple linear optimization for feed mix
            let bestMix = null;
            let bestCost = Infinity;
            
            // Try different combinations
            for (let alfalfa = 0; alfalfa <= 50; alfalfa += 10) {
                for (let corn = 0; corn <= 50; corn += 10) {
                    for (let soybean = 0; soybean <= 30; soybean += 5) {
                        const wheatBran = Math.max(0, 100 - alfalfa - corn - soybean - 10);
                        const barley = 100 - alfalfa - corn - soybean - wheatBran;
                        
                        if (barley < 0) continue;
                        
                        // Calculate protein content
                        const protein = (alfalfa * 18 + corn * 9 + soybean * 44 + wheatBran * 15 + barley * 11) / 100;
                        
                        // Calculate cost
                        const cost = (alfalfa * 4500 + corn * 3200 + soybean * 8000 + wheatBran * 2800 + barley * 3500) / 100;
                        
                        // Check constraints
                        if (Math.abs(protein - targetProtein) < 0.5 && cost <= maxCost && cost < bestCost) {
                            bestMix = {
                                'Alfalfa': alfalfa,
                                'Corn': corn,
                                'Soybean': soybean,
                                'Wheat Bran': wheatBran,
                                'Barley': barley
                            };
                            bestCost = cost;
                        }
                    }
                }
            }
            
            if (bestMix) {
                f.advancedResults = f.advancedResults || {};
                f.advancedResults.feedMix = {
                    ingredients: bestMix,
                    costPerTon: Math.round(bestCost),
                    proteinContent: Object.entries(bestMix).reduce((sum, [ing, pct]) => 
                        sum + (pct * f.feedOptimizer.ingredients[ing].protein / 100), 0
                    ).toFixed(1)
                };
                
                this.showNotification('Feed mix optimized successfully!', 'success');
            } else {
                this.showNotification('Could not find optimal mix with given constraints', 'error');
            }
        },
        
        generateBreedingCalendar() {
            const f = this.feasibility;
            const targetSeason = f.breedingCalendar.targetSeason;
            const ewesCount = f.breedingCalendar.ewesCount || Math.floor(f.numSheep * 0.7);
            
            // Season to month mapping (Northern Hemisphere)
            const seasonMonths = {
                'spring': 3, // March
                'summer': 6, // June
                'fall': 9,   // September
                'winter': 12 // December
            };
            
            const targetLambingMonth = seasonMonths[targetSeason];
            const breedingMonth = (targetLambingMonth - 5 + 12) % 12 || 12; // 5 months gestation
            
            const calendar = [];
            const currentMonth = new Date().getMonth() + 1;
            
            // Generate 12-month calendar
            for (let i = 0; i < 12; i++) {
                const month = ((currentMonth + i - 1) % 12) + 1;
                const event = {
                    month: month,
                    monthName: new Date(2024, month - 1, 1).toLocaleString('en', { month: 'long' }),
                    events: []
                };
                
                if (month === breedingMonth) {
                    event.events.push(`Breed ${ewesCount} ewes`);
                }
                if (month === ((breedingMonth + 2) % 12) || month === 12) {
                    event.events.push('Pregnancy confirmation');
                }
                if (month === targetLambingMonth) {
                    event.events.push(`Expected lambing (${Math.floor(ewesCount * 0.85)} ewes)`);
                }
                if (month === ((targetLambingMonth + 3) % 12) || month === 12) {
                    event.events.push('Wean lambs');
                }
                
                calendar.push(event);
            }
            
            f.breedingCalendar.calendar = calendar;
            f.advancedResults = f.advancedResults || {};
            f.advancedResults.breedingCalendar = calendar;
            
            this.showNotification('Breeding calendar generated!', 'success');
        },
        
        runSensitivityAnalysis() {
            const f = this.feasibility;
            const variable = f.sensitivity.variable;
            const baseValue = this.getBaseValueForVariable(variable);
            const results = [];
            
            // Save current values
            const originalValue = this.getCurrentValueForVariable(variable);
            
            // Test each variation
            f.sensitivity.range.forEach(change => {
                const newValue = baseValue * (1 + change / 100);
                this.setValueForVariable(variable, newValue);
                this.calculateFeasibility();
                
                results.push({
                    change: change,
                    value: newValue,
                    roi: f.results.roi,
                    netProfit: f.results.netProfit,
                    breakEven: f.results.breakEvenMonths
                });
            });
            
            // Restore original value
            this.setValueForVariable(variable, originalValue);
            this.calculateFeasibility();
            
            f.sensitivity.results = results;
            f.advancedResults = f.advancedResults || {};
            f.advancedResults.sensitivity = results;
            
            this.showNotification('Sensitivity analysis completed!', 'success');
        },
        
        generateMultiYearProjection() {
            const f = this.feasibility;
            const growthRate = f.multiYear.annualGrowthRate / 100;
            const projections = [];
            
            let currentSheep = f.numSheep;
            let cumulativeProfit = 0;
            
            for (let year = 1; year <= 5; year++) {
                // Growth calculations
                currentSheep = Math.floor(currentSheep * (1 + growthRate));
                const yearRevenue = currentSheep * 50 * 320 * 12; // Simplified annual revenue
                const yearCosts = currentSheep * 2.5 * 6 * 365; // Simplified annual costs
                const yearProfit = yearRevenue - yearCosts;
                cumulativeProfit += yearProfit;
                
                projections.push({
                    year: year,
                    sheepCount: currentSheep,
                    revenue: yearRevenue,
                    costs: yearCosts,
                    profit: yearProfit,
                    cumulativeProfit: cumulativeProfit,
                    roi: (cumulativeProfit / f.results.totalInitialCost) * 100
                });
            }
            
            f.multiYear.projections = projections;
            f.advancedResults = f.advancedResults || {};
            f.advancedResults.multiYear = projections;
            
            this.showNotification('5-year projection generated!', 'success');
        },
        
        // Helper methods for sensitivity analysis
        getBaseValueForVariable(variable) {
            switch (variable) {
                case 'feedPrice': return this.feasibility.feedPricePerKg;
                case 'sheepPrice': return this.marketData.breeds[this.feasibility.selectedBreed].pricePerKg;
                case 'mortalityRate': return this.feasibility.mortalityRate;
                default: return 0;
            }
        },
        
        getCurrentValueForVariable(variable) {
            switch (variable) {
                case 'feedPrice': return this.feasibility.feedPricePerKg;
                case 'sheepPrice': return this.marketData.breeds[this.feasibility.selectedBreed].pricePerKg;
                case 'mortalityRate': return this.feasibility.mortalityRate;
                default: return 0;
            }
        },
        
        setValueForVariable(variable, value) {
            switch (variable) {
                case 'feedPrice': this.feasibility.feedPricePerKg = value; break;
                case 'sheepPrice': this.marketData.breeds[this.feasibility.selectedBreed].pricePerKg = value; break;
                case 'mortalityRate': this.feasibility.mortalityRate = value; break;
            }
        },
        
        // Report Generation Methods
        generatePDFReport() {
            // This would integrate with a PDF library like jsPDF
            this.showNotification('PDF report generation coming soon!', 'info');
        },
        
        exportToExcel() {
            // This would integrate with a library like SheetJS
            this.showNotification('Excel export coming soon!', 'info');
        },
        
        calculateOverallRisk(f) {
            let riskScore = 0;
            if (f.feedPriceVolatility > 20) riskScore += 3;
            else if (f.feedPriceVolatility > 10) riskScore += 2;
            else riskScore += 1;
            
            if (f.diseaseRiskFactor > 15) riskScore += 3;
            else if (f.diseaseRiskFactor > 8) riskScore += 2;
            else riskScore += 1;
            
            if (f.marketDemandVariation > 25) riskScore += 3;
            else if (f.marketDemandVariation > 15) riskScore += 2;
            else riskScore += 1;
            
            const avgRisk = riskScore / 3;
            return avgRisk > 2.5 ? 'High' : avgRisk > 1.5 ? 'Medium' : 'Low';
        },
        
        // Load market prices from products
        async loadMarketPrices() {
            try {
                const products = await this.pb.collection('products').getList(1, 50, {
                    filter: 'is_active = true && product_category = "live_sheep"',
                    sort: '-price_per_kg_egp'
                });
                
                // Update market data with real prices
                products.items.forEach(product => {
                    if (product.breed_info_en && this.marketData.breeds[product.breed_info_en]) {
                        this.marketData.breeds[product.breed_info_en].pricePerKg = product.price_per_kg_egp;
                        this.marketData.breeds[product.breed_info_en].avgWeight = product.avg_weight_kg;
                    }
                });
            } catch (err) {
                console.error('Failed to load market prices:', err);
            }
        },

        async saveFeasibilityAnalysis() {
            if (!this.pb || !this.currentUser) {
                alert('Please login to save analyses / يرجى تسجيل الدخول لحفظ التحليلات');
                return;
            }

            try {
                this.loading = true;
                this.loadingMessage = 'Saving analysis...';
                
                const analysisData = {
                    user: this.currentUser.id,
                    title: `Analysis - ${this.feasibility.selectedBreed} - ${new Date().toLocaleDateString()}`,
                    sheep_count: this.feasibility.numSheep,
                    sheep_price: this.feasibility.pricePerSheep,
                    land_cost: this.feasibility.facilityCosts,
                    equipment_cost: 0, // Not separately tracked, included in facility costs
                    feed_cost: this.feasibility.feedCostPerMonth,
                    vet_cost: this.feasibility.vetCostPerMonth,
                    labor_cost: this.feasibility.laborCostPerMonth,
                    other_cost: 0,
                    breeding_rate: this.feasibility.breedingRate,
                    lamb_price: this.feasibility.lambPrice,
                    wool_revenue: 0, // Not calculated in current version
                    analysis_period: this.feasibility.projectDuration,
                    results: {
                        breed: this.feasibility.selectedBreed,
                        season: this.feasibility.selectedSeason,
                        includeBreeding: this.feasibility.includeBreeding,
                        totalInitialCost: this.feasibility.results.totalInitialCost,
                        monthlyOperatingCost: this.feasibility.results.monthlyOperatingCost,
                        totalOperatingCost: this.feasibility.results.totalOperatingCost,
                        totalRevenue: this.feasibility.results.totalRevenue,
                        breedingRevenue: this.feasibility.results.breedingRevenue,
                        netProfit: this.feasibility.results.netProfit,
                        roi: this.feasibility.results.roi,
                        monthlyProfit: this.feasibility.results.monthlyProfit,
                        breakEvenMonths: this.feasibility.results.breakEvenMonths,
                        isViable: this.feasibility.results.isViable
                    }
                };
                
                await this.pb.collection('feasibility_analyses').create(analysisData);
                
                alert('Analysis saved successfully! / تم حفظ التحليل بنجاح!');
                await this.loadSavedAnalyses();
                
            } catch (err) {
                console.error('Save analysis error:', err);
                alert('Failed to save analysis. Please try again.');
            } finally {
                this.loading = false;
                this.loadingMessage = '';
            }
        },

        async loadSavedAnalyses() {
            try {
                const records = await this.pb.collection('feasibility_analyses').getList(1, 10, {
                    sort: '-created',
                    filter: `user = "${this.currentUser.id}"`
                });
                
                this.savedAnalyses = records.items;
            } catch (err) {
                console.error('Load analyses error:', err);
            }
        },

        async initFeasibility() {
            if (this.pb && this.currentUser?.is_admin) {
                await this.loadSavedAnalyses();
                await this.loadMarketPrices();
            }
        },
        
        updateBreedPrices() {
            const breed = this.marketData.breeds[this.feasibility.selectedBreed];
            if (breed) {
                // Auto-update price per sheep based on breed
                const youngSheepWeight = breed.avgWeight * 0.6;
                this.feasibility.pricePerSheep = Math.round(youngSheepWeight * breed.pricePerKg);
                
                // Update selling price projection
                const matureWeight = breed.avgWeight;
                this.feasibility.sellingPricePerSheep = Math.round(matureWeight * breed.pricePerKg);
            }
        },

        // Farm Management Methods
        async initFarmManagement() {
            if (this.pb && this.currentUser?.is_admin) {
                await this.loadFarmSheep();
            }
        },

        async loadFarmSheep() {
            try {
                this.loading = true;
                this.loadingMessage = 'Loading sheep data...';
                
                const records = await this.pb.collection('farm_sheep').getList(1, 500, {
                    sort: '-created',
                    filter: `user = "${this.currentUser.id}"`
                });
                
                this.farmSheep = records.items;
                this.filteredFarmSheep = [...this.farmSheep];
                this.updateFarmStats();
            } catch (err) {
                console.error('Load sheep error:', err);
                this.error = 'Failed to load sheep data.';
            } finally {
                this.loading = false;
                this.loadingMessage = '';
            }
        },

        updateFarmStats() {
            const sheepCount = this.farmSheep.length;
            
            // Basic stats
            this.farmStats.totalSheep = sheepCount;
            this.farmStats.healthy = this.farmSheep.filter(s => s.status === 'healthy').length;
            this.farmStats.pregnant = this.farmSheep.filter(s => s.status === 'pregnant').length;
            this.farmStats.needAttention = this.farmSheep.filter(s => s.status === 'sick' || this.needsVaccination(s)).length;
            
            // Enhanced stats - Gender breakdown
            this.farmStats.totalEwes = this.farmSheep.filter(s => s.gender === 'female').length;
            this.farmStats.totalRams = this.farmSheep.filter(s => s.gender === 'male').length;
            
            // Age-based stats
            this.farmStats.youngLambs = this.farmSheep.filter(s => s.age_months < 6).length;
            this.farmStats.lactating = this.farmSheep.filter(s => s.status === 'lactating').length;
            
            // Calculate total value based on current market prices
            this.farmStats.totalValue = this.farmSheep.reduce((sum, sheep) => {
                const breed = this.marketData.breeds[sheep.breed] || this.marketData.breeds['Barki'];
                return sum + (sheep.weight_kg * breed.pricePerKg);
            }, 0);
            
            // Count sheep ready for market (healthy and weight >= 40kg)
            this.farmStats.readyForMarket = this.farmSheep.filter(s => 
                s.status === 'healthy' && s.weight_kg >= 40 && s.age_months >= 6
            ).length;
            
            // Calculate average weight
            if (sheepCount > 0) {
                this.farmStats.averageWeight = Math.round(
                    this.farmSheep.reduce((sum, s) => sum + s.weight_kg, 0) / sheepCount
                );
            } else {
                this.farmStats.averageWeight = 0;
            }
            
            // Calculate mortality rate
            const deadCount = this.farmSheep.filter(s => s.status === 'dead').length;
            this.farmStats.mortalityRate = sheepCount > 0 ? ((deadCount / sheepCount) * 100).toFixed(1) : 0;
            
            // Count upcoming vaccinations (next 30 days)
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            
            this.farmStats.upcomingVaccinations = this.farmSheep.filter(sheep => {
                if (!sheep.last_vaccination) return true;
                const nextVacDate = new Date(sheep.last_vaccination);
                nextVacDate.setDate(nextVacDate.getDate() + 180); // 6 months
                return nextVacDate <= thirtyDaysFromNow;
            }).length;
            
            // Count expected births (pregnant sheep)
            this.farmStats.expectedBirths = this.farmSheep.filter(s => s.status === 'pregnant').length;
            
            // Calculate feed inventory status
            const dailyFeedRequired = sheepCount * 2.5; // kg per day
            const totalFeedStock = this.feedInventory.alfalfa + this.feedInventory.concentrate + this.feedInventory.grains;
            this.farmStats.feedInventory = Math.round(totalFeedStock / dailyFeedRequired); // Days of feed remaining
            
            // Enhanced expense calculation
            const baseFeedCost = 200; // EGP per sheep per month
            const pregnantFeedCost = 300; // Higher for pregnant sheep
            const youngLambFeedCost = 150; // Lower for young lambs
            
            let totalFeedCost = 0;
            this.farmSheep.forEach(sheep => {
                if (sheep.status === 'pregnant') {
                    totalFeedCost += pregnantFeedCost;
                } else if (sheep.age_months < 6) {
                    totalFeedCost += youngLambFeedCost;
                } else {
                    totalFeedCost += baseFeedCost;
                }
            });
            
            const vetCostPerSheep = 50; // EGP per month
            const facilityMaintenance = sheepCount * 20; // EGP per sheep
            const laborCost = Math.ceil(sheepCount / 50) * 3000; // 1 worker per 50 sheep
            
            this.farmStats.monthlyExpenses = totalFeedCost + (sheepCount * vetCostPerSheep) + facilityMaintenance + laborCost;
        },

        needsVaccination(sheep) {
            if (!sheep.last_vaccination) return true;
            const lastVac = new Date(sheep.last_vaccination);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return lastVac < sixMonthsAgo;
        },

        filterFarmSheep() {
            if (this.farmFilterStatus) {
                this.filteredFarmSheep = this.farmSheep.filter(s => s.status === this.farmFilterStatus);
            } else {
                this.filteredFarmSheep = [...this.farmSheep];
            }
        },

        async saveFarmSheep() {
            try {
                this.loading = true;
                this.loadingMessage = 'Saving sheep data...';
                
                const data = {
                    user: this.currentUser.id,
                    tag_id: this.sheepForm.tagId,
                    breed: this.sheepForm.breed,
                    age_months: parseInt(this.sheepForm.age),
                    weight_kg: parseFloat(this.sheepForm.weight),
                    status: this.sheepForm.status,
                    gender: this.sheepForm.gender || 'female',
                    location: this.sheepForm.location || 'barn1',
                    feeding_plan: this.sheepForm.feedingPlan || 'standard',
                    last_vaccination: this.sheepForm.lastVaccination || null,
                    notes: this.sheepForm.notes || '',
                    purchase_price: parseFloat(this.sheepForm.purchasePrice) || 0,
                    purchase_date: this.sheepForm.purchaseDate || null,
                    mother_tag_id: this.sheepForm.motherTagId || null,
                    father_tag_id: this.sheepForm.fatherTagId || null
                };
                
                if (this.editingSheepId) {
                    await this.pb.collection('farm_sheep').update(this.editingSheepId, data);
                } else {
                    await this.pb.collection('farm_sheep').create(data);
                }
                
                await this.loadFarmSheep();
                this.resetSheepForm();
                this.showAddSheepForm = false;
                
                alert('Sheep data saved successfully! / تم حفظ بيانات الأغنام بنجاح!');
            } catch (err) {
                console.error('Save error:', err);
                alert('Failed to save sheep data. Please try again.');
            } finally {
                this.loading = false;
                this.loadingMessage = '';
            }
        },

        editFarmSheep(sheep) {
            this.editingSheepId = sheep.id;
            this.sheepForm = {
                tagId: sheep.tag_id,
                breed: sheep.breed,
                age: sheep.age_months.toString(),
                weight: sheep.weight_kg.toString(),
                status: sheep.status,
                gender: sheep.gender || 'female',
                location: sheep.location || 'barn1',
                feedingPlan: sheep.feeding_plan || 'standard',
                lastVaccination: sheep.last_vaccination ? sheep.last_vaccination.split('T')[0] : '',
                notes: sheep.notes || '',
                purchasePrice: sheep.purchase_price || 0,
                purchaseDate: sheep.purchase_date ? sheep.purchase_date.split('T')[0] : '',
                motherTagId: sheep.mother_tag_id || '',
                fatherTagId: sheep.father_tag_id || ''
            };
            this.showAddSheepForm = true;
        },

        async recordSheepHealth(sheep) {
            const action = prompt('Enter health action:\\n1 - Mark as Healthy\\n2 - Mark as Sick\\n3 - Record Vaccination\\n4 - Mark as Pregnant\\n5 - Record Weight Update\\n6 - Mark for Sale');
            
            let updateData = {};
            let healthRecord = {
                date: new Date().toISOString(),
                action: '',
                notes: ''
            };
            
            switch(action) {
                case '1':
                    updateData.status = 'healthy';
                    healthRecord.action = 'Marked as healthy';
                    break;
                case '2':
                    updateData.status = 'sick';
                    healthRecord.action = 'Marked as sick';
                    const symptoms = prompt('Enter symptoms / أدخل الأعراض:');
                    if (symptoms) healthRecord.notes = symptoms;
                    break;
                case '3':
                    updateData.last_vaccination = new Date().toISOString();
                    healthRecord.action = 'Vaccination recorded';
                    // Record which vaccines were given
                    const vaccines = prompt('Which vaccines? (FMD, PPR, Clostridial, Brucellosis)');
                    if (vaccines) healthRecord.notes = `Vaccines: ${vaccines}`;
                    alert('Vaccination recorded / تم تسجيل التطعيم');
                    break;
                case '4':
                    updateData.status = 'pregnant';
                    healthRecord.action = 'Marked as pregnant';
                    const dueDate = prompt('Expected delivery date (YYYY-MM-DD)?');
                    if (dueDate) healthRecord.notes = `Due: ${dueDate}`;
                    break;
                case '5':
                    const newWeight = prompt(`Current weight: ${sheep.weight_kg}kg. Enter new weight (kg):`);
                    if (newWeight && !isNaN(newWeight)) {
                        updateData.weight_kg = parseFloat(newWeight);
                        healthRecord.action = 'Weight updated';
                        healthRecord.notes = `${sheep.weight_kg}kg → ${newWeight}kg`;
                    }
                    break;
                case '6':
                    if (sheep.weight_kg >= 40 && sheep.status === 'healthy') {
                        updateData.notes = (sheep.notes || '') + ' [READY FOR SALE]';
                        healthRecord.action = 'Marked for sale';
                        healthRecord.notes = `Weight: ${sheep.weight_kg}kg, Market value: EGP ${Math.round(sheep.weight_kg * (this.marketData.breeds[sheep.breed]?.pricePerKg || 300))}`;
                        alert('Marked for sale! / تم وضع علامة للبيع!');
                    } else {
                        alert('Sheep must be healthy and at least 40kg / يجب أن تكون الأغنام بصحة جيدة وبوزن 40 كجم على الأقل');
                        return;
                    }
                    break;
                default:
                    return;
            }
            
            try {
                this.loading = true;
                
                let healthRecords = sheep.health_records || [];
                if (typeof healthRecords === 'string') {
                    healthRecords = JSON.parse(healthRecords);
                }
                healthRecords.push(healthRecord);
                
                updateData.health_records = healthRecords;
                await this.pb.collection('farm_sheep').update(sheep.id, updateData);
                
                await this.loadFarmSheep();
            } catch (err) {
                console.error('Health record error:', err);
                alert('Failed to update health record.');
            } finally {
                this.loading = false;
            }
        },

        async deleteFarmSheep(id) {
            if (!confirm('Are you sure you want to delete this sheep record? / هل أنت متأكد من حذف سجل هذه الأغنام؟')) {
                return;
            }
            
            try {
                this.loading = true;
                await this.pb.collection('farm_sheep').delete(id);
                await this.loadFarmSheep();
            } catch (err) {
                console.error('Delete error:', err);
                alert('Failed to delete sheep record.');
            } finally {
                this.loading = false;
            }
        },

        resetSheepForm() {
            this.editingSheepId = null;
            this.sheepForm = {
                tagId: '',
                breed: '',
                age: '',
                weight: '',
                status: 'healthy',
                lastVaccination: '',
                notes: '',
                purchasePrice: 0,
                purchaseDate: '',
                motherTagId: '',
                fatherTagId: '',
                gender: 'female',
                location: 'barn1',
                feedingPlan: 'standard'
            };
        },

        formatDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },
        
        // ========== REAL-TIME INTEGRATION METHODS ==========
        
        // Auto-sync farm inventory with e-commerce stock
        async syncFarmInventoryToEcommerce() {
            try {
                // Get all healthy sheep ready for sale (40kg+)
                const readyForSale = await this.pb.collection('farm_sheep').getFullList({
                    filter: 'status = "healthy" && weight_kg >= 40',
                    sort: '-weight_kg'
                });
                
                // Group by breed and weight ranges
                const inventory = {};
                readyForSale.forEach(sheep => {
                    const weightRange = this.getWeightRange(sheep.weight_kg);
                    const key = `${sheep.breed}_${weightRange}`;
                    
                    if (!inventory[key]) {
                        inventory[key] = {
                            breed: sheep.breed,
                            weightRange: weightRange,
                            count: 0,
                            avgWeight: 0,
                            totalWeight: 0,
                            sheep: []
                        };
                    }
                    
                    inventory[key].count++;
                    inventory[key].totalWeight += sheep.weight_kg;
                    inventory[key].avgWeight = inventory[key].totalWeight / inventory[key].count;
                    inventory[key].sheep.push(sheep);
                });
                
                // Update product stock in e-commerce
                for (const [key, data] of Object.entries(inventory)) {
                    const productKey = `live_${data.breed.toLowerCase()}_${data.weightRange}kg`;
                    
                    try {
                        const products = await this.pb.collection('products').getList(1, 1, {
                            filter: `item_key ~ "${productKey}" || (type_key = "${data.breed.toLowerCase()}_sheep" && weight_range_text_en ~ "${data.weightRange}")`
                        });
                        
                        if (products.items.length > 0) {
                            await this.pb.collection('products').update(products.items[0].id, {
                                stock_available_pb: data.count,
                                avg_weight_kg: Math.round(data.avgWeight)
                            });
                        }
                    } catch (err) {
                        console.error(`Failed to update stock for ${key}:`, err);
                    }
                }
                
                // Refresh product display
                // await this.fetchProducts(); // TODO: Implement if needed
                
                return { success: true, inventory };
            } catch (err) {
                console.error('Inventory sync error:', err);
                return { success: false, error: err };
            }
        },
        
        // Link feasibility projections with actual farm performance
        async updateFeasibilityWithActualData() {
            if (!this.currentUser) return;
            
            try {
                // Get actual farm data
                const farmSheep = await this.pb.collection('farm_sheep').getFullList({
                    filter: `user = "${this.currentUser.id}"`
                });
                
                const orders = await this.pb.collection('orders').getFullList({
                    filter: `user = "${this.currentUser.id}" && order_status = "delivered"`
                });
                
                const feedInventory = await this.pb.collection('feed_inventory').getFullList({
                    filter: `user = "${this.currentUser.id}"`
                });
                
                // Calculate actual metrics
                const actualMetrics = {
                    totalSheep: farmSheep.length,
                    healthySheep: farmSheep.filter(s => s.status === 'healthy').length,
                    avgWeight: farmSheep.reduce((sum, s) => sum + s.weight_kg, 0) / farmSheep.length || 0,
                    mortalityRate: ((farmSheep.filter(s => s.status === 'deceased').length / farmSheep.length) * 100) || 0,
                    totalRevenue: orders.reduce((sum, o) => sum + o.total_amount_due_egp, 0),
                    feedCostActual: feedInventory.reduce((sum, f) => sum + (f.quantity_kg * f.cost_per_kg), 0),
                    sheepReadyForSale: farmSheep.filter(s => s.status === 'healthy' && s.weight_kg >= 40).length
                };
                
                // Update feasibility with actual data
                this.feasibility.actualPerformance = actualMetrics;
                
                // Calculate variance
                if (this.feasibility.showResults) {
                    this.feasibility.results.performanceVariance = {
                        revenueVariance: ((actualMetrics.totalRevenue - this.feasibility.results.totalRevenue) / this.feasibility.results.totalRevenue * 100) || 0,
                        mortalityVariance: actualMetrics.mortalityRate - this.feasibility.mortalityRate,
                        feedCostVariance: ((actualMetrics.feedCostActual - (this.feasibility.results.monthlyOperatingCost * this.feasibility.projectDuration)) / (this.feasibility.results.monthlyOperatingCost * this.feasibility.projectDuration) * 100) || 0
                    };
                }
                
                return actualMetrics;
            } catch (err) {
                console.error('Failed to update feasibility with actual data:', err);
            }
        },
        
        // Auto-create products when sheep reach market weight
        async autoCreateMarketProducts() {
            try {
                const marketReadySheep = await this.pb.collection('farm_sheep').getFullList({
                    filter: 'status = "healthy" && weight_kg >= 40 && (notes !~ "LISTED")'
                });
                
                for (const sheep of marketReadySheep) {
                    // Check if product already exists for this sheep
                    const existingProduct = await this.pb.collection('products').getList(1, 1, {
                        filter: `item_key = "farm_sheep_${sheep.tag_id}"`
                    });
                    
                    if (existingProduct.items.length === 0) {
                        // Create product listing
                        const product = {
                            item_key: `farm_sheep_${sheep.tag_id}`,
                            product_category: 'livesheep_general',
                            type_key: `${sheep.breed.toLowerCase()}_sheep`,
                            type_name_en: `${sheep.breed} Sheep`,
                            type_name_ar: `خروف ${sheep.breed}`,
                            variant_name_en: `Tag #${sheep.tag_id} (${sheep.weight_kg}kg)`,
                            variant_name_ar: `رقم ${sheep.tag_id} (${sheep.weight_kg} كجم)`,
                            weight_range_text_en: `${sheep.weight_kg}kg`,
                            weight_range_text_ar: `${sheep.weight_kg} كجم`,
                            avg_weight_kg: sheep.weight_kg,
                            base_price_egp: Math.round(sheep.weight_kg * (this.marketData.breeds[sheep.breed]?.pricePerKg || 300)),
                            stock_available_pb: 1,
                            is_active: true,
                            origin_farm: 'Own Farm',
                            breed_info_en: `${sheep.age_months} months old, ${sheep.gender}`,
                            breed_info_ar: `عمر ${sheep.age_months} شهر، ${sheep.gender === 'male' ? 'ذكر' : 'أنثى'}`
                        };
                        
                        await this.pb.collection('products').create(product);
                        
                        // Update sheep notes to indicate it's listed
                        await this.pb.collection('farm_sheep').update(sheep.id, {
                            notes: (sheep.notes || '') + ' [LISTED]'
                        });
                    }
                }
                
                // await this.fetchProducts(); // TODO: Implement if needed
            } catch (err) {
                console.error('Failed to auto-create products:', err);
            }
        },
        
        // Process order and update farm inventory
        async processOrderFromFarmInventory(order) {
            try {
                const orderItems = await this.pb.collection('order_items').getFullList({
                    filter: `order = "${order.id}"`
                });
                
                for (const item of orderItems) {
                    if (item.item_key && item.item_key.startsWith('farm_sheep_')) {
                        const tagId = item.item_key.replace('farm_sheep_', '');
                        
                        // Update sheep status
                        const sheep = await this.pb.collection('farm_sheep').getFirstListItem(`tag_id = "${tagId}"`);
                        if (sheep) {
                            await this.pb.collection('farm_sheep').update(sheep.id, {
                                status: 'sold',
                                notes: (sheep.notes || '') + ` [SOLD: Order ${order.order_id_text}]`,
                                sale_date: new Date().toISOString(),
                                sale_price: item.price_egp
                            });
                        }
                        
                        // Deactivate product
                        await this.pb.collection('products').update(item.product_id, {
                            is_active: false,
                            stock_available_pb: 0
                        });
                    }
                }
                
                // Update financial records
                await this.updateFinancialDashboard();
            } catch (err) {
                console.error('Failed to process order from inventory:', err);
            }
        },
        
        // Update financial dashboard with real-time data
        async updateFinancialDashboard() { if (!this.currentUser) return; try { const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); const [orders, expenses, sheep] = await Promise.all([this.pb.collection('orders').getFullList({ filter: `user = "${this.currentUser.id}" && created >= "${monthStart.toISOString()}"` }), this.pb.collection('feed_inventory').getFullList({ filter: `user = "${this.currentUser.id}" && purchase_date >= "${monthStart.toISOString()}"` }), this.pb.collection('farm_sheep').getFullList({ filter: `user = "${this.currentUser.id}"` })]);
                
                // Calculate revenue by category
                const revenueByCategory = {};
                orders.forEach(order => {
                    const category = order.primary_category || 'other';
                    revenueByCategory[category] = (revenueByCategory[category] || 0) + order.total_amount_due_egp;
                });
                
                // Calculate metrics in the expected structure
                const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount_due_egp, 0);
                const totalExpenses = expenses.reduce((sum, e) => sum + (e.quantity_kg * e.cost_per_kg), 0);
                const livestockValue = sheep.filter(s => s.status !== 'sold' && s.status !== 'deceased')
                    .reduce((sum, s) => sum + (s.weight_kg * (this.marketData.breeds[s.breed]?.pricePerKg || 300)), 0);
                
                this.financialDashboard = {
                    revenue: {
                        total: totalRevenue,
                        orderCount: orders.length,
                        byCategory: revenueByCategory
                    },
                    expenses: {
                        total: totalExpenses,
                        feed: expenses.reduce((sum, e) => sum + (e.quantity_kg * e.cost_per_kg), 0),
                        healthcare: 0, // TODO: Get from health checkups
                        other: 0
                    },
                    profitability: {
                        netProfit: totalRevenue - totalExpenses,
                        margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0,
                        roi: livestockValue > 0 ? ((totalRevenue - totalExpenses) / livestockValue * 100) : 0
                    },
                    inventory: {
                        livestock: livestockValue,
                        feed: expenses.reduce((sum, e) => sum + (e.quantity_kg * e.cost_per_kg * 0.2), 0), // Estimate 20% remaining
                        sheepCount: sheep.filter(s => s.status !== 'sold' && s.status !== 'deceased').length
                    },
                    projections: {
                        projectedRevenue: totalRevenue * 1.1, // Simple 10% growth projection
                        revenueVariance: 0
                    }
                };
                
                return this.financialDashboard;
            } catch (err) {
                console.error('Failed to update financial dashboard:', err);
            }
        },
        
        // Auto-schedule tasks based on farm events
        async autoScheduleFarmTasks() {
            try {
                const [sheep, breeding] = await Promise.all([
                    this.pb.collection('farm_sheep').getFullList({
                        filter: `user = "${this.currentUser.id}"`
                    }),
                    this.pb.collection('breeding_records').getFullList({
                        filter: `user = "${this.currentUser.id}" && actual_lambing_date = null`
                    })
                ]);
                
                const tasks = [];
                
                // Schedule vaccination reminders
                sheep.forEach(s => {
                    if (s.last_vaccination) {
                        const lastVaccDate = new Date(s.last_vaccination);
                        const nextVaccDate = new Date(lastVaccDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 months
                        
                        if (nextVaccDate > new Date() && nextVaccDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
                            tasks.push({
                                task_name: `Vaccinate ${s.tag_id}`,
                                task_type: 'health',
                                priority: 'high',
                                due_date: nextVaccDate.toISOString(),
                                description: `Annual vaccination for sheep ${s.tag_id}`,
                                status: 'pending'
                            });
                        }
                    }
                });
                
                // Schedule lambing preparations
                breeding.forEach(b => {
                    if (b.expected_lambing_date) {
                        const lambingDate = new Date(b.expected_lambing_date);
                        const prepDate = new Date(lambingDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week before
                        
                        if (prepDate > new Date()) {
                            tasks.push({
                                task_name: `Prepare for lambing - Ewe ${b.ewe_id}`,
                                task_type: 'breeding',
                                priority: 'high',
                                due_date: prepDate.toISOString(),
                                description: `Prepare lambing pen and supplies for ewe ${b.ewe_id}`,
                                status: 'pending'
                            });
                        }
                    }
                });
                
                // Create tasks that don't already exist
                for (const task of tasks) {
                    const existing = await this.pb.collection('farm_tasks').getList(1, 1, {
                        filter: `task_name = "${task.task_name}" && status != "completed"`
                    });
                    
                    if (existing.items.length === 0) {
                        await this.pb.collection('farm_tasks').create({
                            ...task,
                            user: this.currentUser.id,
                            assigned_to: 'Farm Manager'
                        });
                    }
                }
                
                // Update breeding schedule and product availability
                await this.updateBreedingScheduleProducts();
            } catch (err) {
                console.error('Failed to auto-schedule tasks:', err);
            }
        },
        
        // Update product availability based on breeding schedule
        async updateBreedingScheduleProducts() {
            if (!this.currentUser) return;
            
            try {
                const breedingRecords = await this.pb.collection('breeding_records').getFullList({
                    filter: `user = "${this.currentUser.id}" && status = "confirmed" && actual_lambing = null`
                });
                
                for (const record of breedingRecords) {
                    if (record.expected_lambing) {
                        const lambingDate = new Date(record.expected_lambing);
                        const weaningDate = new Date(lambingDate.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days after birth
                        const marketReadyDate = new Date(lambingDate.getTime() + 120 * 24 * 60 * 60 * 1000); // 120 days for market weight
                        
                        // Check if we need to create future product listings
                        const monthsUntilMarketReady = Math.floor((marketReadyDate - new Date()) / (1000 * 60 * 60 * 24 * 30));
                        
                        if (monthsUntilMarketReady <= 2 && monthsUntilMarketReady > 0) {
                            // Get ewe details
                            const ewe = await this.pb.collection('farm_sheep').getOne(record.ewe_id);
                            
                            // Create pre-order product for expected lambs
                            const expectedLambs = record.lambs_count || 2; // Default to twins
                            
                            const preOrderProduct = {
                                item_key: `pre_order_lamb_${record.id}`,
                                product_category: 'livesheep_general',
                                type_key: 'young_lambs',
                                type_name_en: 'Pre-Order Lambs',
                                type_name_ar: 'حجز مسبق للحملان',
                                type_description_en: `Expected lambs from ${ewe.tag_id}, available from ${marketReadyDate.toLocaleDateString()}`,
                                type_description_ar: `حملان متوقعة من ${ewe.tag_id}، متاحة من ${marketReadyDate.toLocaleDateString('ar-EG')}`,
                                variant_name_en: `Pre-order (${expectedLambs} lambs)`,
                                variant_name_ar: `حجز مسبق (${expectedLambs} حملان)`,
                                weight_range_text_en: '15-25kg expected',
                                weight_range_text_ar: '١٥-٢٥ كجم متوقع',
                                avg_weight_kg: 20,
                                base_price_egp: 4500 * expectedLambs,
                                stock_available_pb: expectedLambs,
                                is_active: true,
                                is_premium: false,
                                origin_farm: 'Own Breeding Program',
                                breed_info_en: `From ${ewe.breed} breeding line`,
                                breed_info_ar: `من سلالة ${ewe.breed}`,
                                notes: `Pre-order from breeding record ${record.id}`
                            };
                            
                            // Check if pre-order already exists
                            const existing = await this.pb.collection('products').getList(1, 1, {
                                filter: `item_key = "${preOrderProduct.item_key}"`
                            });
                            
                            if (existing.items.length === 0) {
                                await this.pb.collection('products').create(preOrderProduct);
                                
                                // Create alert for new pre-order availability
                                this.activeAlerts.push({
                                    type: 'success',
                                    title: this.currLang === 'ar' ? 'منتج جديد متاح للحجز المسبق' : 'New Pre-Order Product Available',
                                    message: this.currLang === 'ar' 
                                        ? `${expectedLambs} حملان من ${ewe.tag_id} - متاحة ${marketReadyDate.toLocaleDateString('ar-EG')}`
                                        : `${expectedLambs} lambs from ${ewe.tag_id} - available ${marketReadyDate.toLocaleDateString()}`,
                                    priority: 'medium',
                                    action: 'view_product'
                                });
                            }
                        }
                    }
                }
                
                // Update pregnant ewes' availability status
                const pregnantEwes = await this.pb.collection('farm_sheep').getFullList({
                    filter: `user = "${this.currentUser.id}" && status = "pregnant"`
                });
                
                for (const ewe of pregnantEwes) {
                    // Remove from active product listings
                    const products = await this.pb.collection('products').getFullList({
                        filter: `item_key ~ "${ewe.tag_id}" && is_active = true`
                    });
                    
                    for (const product of products) {
                        await this.pb.collection('products').update(product.id, {
                            is_active: false,
                            notes: 'Temporarily unavailable - breeding program'
                        });
                    }
                }
                
                // Log breeding schedule sync
                await this.pb.collection('sync_logs').create({
                    user: this.currentUser.id,
                    sync_type: 'inventory_to_ecommerce',
                    sync_status: 'success',
                    records_synced: breedingRecords.length,
                    summary: `Updated breeding schedule products for ${breedingRecords.length} breeding records`
                });
                
            } catch (err) {
                console.error('Failed to update breeding schedule products:', err);
                await this.pb.collection('sync_logs').create({
                    user: this.currentUser.id,
                    sync_type: 'inventory_to_ecommerce',
                    sync_status: 'failed',
                    errors: { message: err.message },
                    summary: 'Breeding schedule product update failed'
                });
            }
        },
        
        // Helper method to determine weight range
        getWeightRange(weight) {
            if (weight < 40) return '30-40';
            if (weight < 50) return '40-50';
            if (weight < 60) return '50-60';
            if (weight < 70) return '60-70';
            return '70+';
        },
        
        // Initialize real-time sync
        async initRealTimeSync() {
            if (!this.currentUser) return;
            
            // Set up periodic sync (every 5 minutes)
            this.syncInterval = setInterval(async () => {
                await this.syncFarmInventoryToEcommerce();
                await this.updateFeasibilityWithActualData();
                await this.autoCreateMarketProducts();
                await this.updateFinancialDashboard();
                await this.autoScheduleFarmTasks();
                await this.checkAndCreateAlerts();
                this.lastSyncTime = new Date();
            }, 5 * 60 * 1000); // 5 minutes
            
            // Initial sync
            await this.syncFarmInventoryToEcommerce();
            await this.updateFeasibilityWithActualData();
            await this.updateFinancialDashboard();
            await this.checkAndCreateAlerts();
            this.lastSyncTime = new Date();
        },
        
        // Automated alerts and notifications system
        async checkAndCreateAlerts() {
            if (!this.currentUser) return;
            
            const alerts = [];
            
            try {
                // Check low feed inventory
                const feedInventory = await this.pb.collection('feed_inventory').getFullList({
                    filter: `user = "${this.currentUser.id}"`
                });
                
                feedInventory.forEach(feed => {
                    if (feed.quantity_kg < 100) {
                        alerts.push({
                            type: 'warning',
                            title: this.currLang === 'ar' ? 'مخزون العلف منخفض' : 'Low Feed Inventory',
                            message: this.currLang === 'ar' 
                                ? `${feed.feed_type}: ${feed.quantity_kg} كجم متبقي فقط`
                                : `${feed.feed_type}: Only ${feed.quantity_kg}kg remaining`,
                            priority: 'high',
                            action: 'reorder_feed'
                        });
                    }
                });
                
                // Check overdue vaccinations
                const sheep = await this.pb.collection('farm_sheep').getFullList({
                    filter: `user = "${this.currentUser.id}" && status != "sold" && status != "deceased"`
                });
                
                sheep.forEach(s => {
                    if (s.last_vaccination) {
                        const daysSinceVaccination = Math.floor((new Date() - new Date(s.last_vaccination)) / (1000 * 60 * 60 * 24));
                        if (daysSinceVaccination > 180) { // 6 months
                            alerts.push({
                                type: 'danger',
                                title: this.currLang === 'ar' ? 'تطعيم متأخر' : 'Overdue Vaccination',
                                message: this.currLang === 'ar' 
                                    ? `${s.tag_id}: متأخر ${daysSinceVaccination - 180} يوم`
                                    : `${s.tag_id}: ${daysSinceVaccination - 180} days overdue`,
                                priority: 'urgent',
                                action: 'schedule_vaccination',
                                sheep_id: s.id
                            });
                        }
                    }
                });
                
                // Check upcoming breeding events
                const breeding = await this.pb.collection('breeding_records').getFullList({
                    filter: `user = "${this.currentUser.id}" && status = "confirmed" && actual_lambing = null`
                });
                
                breeding.forEach(b => {
                    if (b.expected_lambing) {
                        const daysUntilLambing = Math.floor((new Date(b.expected_lambing) - new Date()) / (1000 * 60 * 60 * 24));
                        if (daysUntilLambing <= 7 && daysUntilLambing > 0) {
                            alerts.push({
                                type: 'info',
                                title: this.currLang === 'ar' ? 'ولادة قريبة' : 'Upcoming Lambing',
                                message: this.currLang === 'ar' 
                                    ? `النعجة ${b.ewe_id} - خلال ${daysUntilLambing} أيام`
                                    : `Ewe ${b.ewe_id} - in ${daysUntilLambing} days`,
                                priority: 'high',
                                action: 'prepare_lambing',
                                breeding_id: b.id
                            });
                        }
                    }
                });
                
                // Check financial thresholds
                if (this.financialDashboard && this.financialDashboard.profitability) {
                    if (this.financialDashboard.profitability.margin < 20) {
                        alerts.push({
                            type: 'warning',
                            title: this.currLang === 'ar' ? 'هامش ربح منخفض' : 'Low Profit Margin',
                            message: this.currLang === 'ar' 
                                ? `هامش الربح الحالي: ${this.financialDashboard.profitability.margin.toFixed(1)}%`
                                : `Current margin: ${this.financialDashboard.profitability.margin.toFixed(1)}%`,
                            priority: 'medium',
                            action: 'review_expenses'
                        });
                    }
                    
                    if (this.financialDashboard.inventory.sheepCount > 150) {
                        alerts.push({
                            type: 'info',
                            title: this.currLang === 'ar' ? 'مخزون مرتفع' : 'High Inventory',
                            message: this.currLang === 'ar' 
                                ? `${this.financialDashboard.inventory.sheepCount} رأس - فكر في زيادة المبيعات`
                                : `${this.financialDashboard.inventory.sheepCount} sheep - consider increasing sales`,
                            priority: 'low',
                            action: 'promote_sales'
                        });
                    }
                }
                
                // Store alerts for display
                this.activeAlerts = alerts;
                
                // Show high priority alerts as notifications
                const urgentAlerts = alerts.filter(a => a.priority === 'urgent' || a.priority === 'high');
                if (urgentAlerts.length > 0 && !this.alertsShown) {
                    this.alertsShown = true;
                    this.showAlertNotification(urgentAlerts[0]);
                }
                
                // Log sync activity
                if (alerts.length > 0) {
                    await this.pb.collection('sync_logs').create({
                        user: this.currentUser.id,
                        sync_type: 'auto_task_creation',
                        sync_status: 'success',
                        records_synced: alerts.length,
                        summary: `Created ${alerts.length} alerts`
                    });
                }
                
            } catch (err) {
                console.error('Failed to check alerts:', err);
                await this.pb.collection('sync_logs').create({
                    user: this.currentUser.id,
                    sync_type: 'auto_task_creation',
                    sync_status: 'failed',
                    errors: { message: err.message },
                    summary: 'Alert check failed'
                });
            }
        },
        
        // Show alert notification
        showAlertNotification(alert) {
            const notification = document.createElement('div');
            notification.className = `alert-notification ${alert.type}`;
            notification.innerHTML = `
                <div class="alert-icon">${this.getAlertIcon(alert.type)}</div>
                <div class="alert-content">
                    <h4>${alert.title}</h4>
                    <p>${alert.message}</p>
                </div>
                <button class="alert-close" onclick="this.parentElement.remove()">×</button>
            `;
            
            document.body.appendChild(notification);
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 10000);
        },
        
        // Get alert icon based on type
        getAlertIcon(type) {
            switch(type) {
                case 'danger': return '🚨';
                case 'warning': return '⚠️';
                case 'info': return 'ℹ️';
                case 'success': return '✅';
                default: return '📢';
            }
        },
        
        // Enhanced Farm Management Methods
        async recordBreeding(eweId, ramId) {
            try {
                const breedingRecord = {
                    ewe_id: eweId,
                    ram_id: ramId,
                    breeding_date: new Date().toISOString(),
                    expected_lambing: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(), // 150 days gestation
                    status: 'confirmed',
                    notes: ''
                };
                
                this.breedingRecords.push(breedingRecord);
                
                // Update ewe status
                const ewe = this.farmSheep.find(s => s.id === eweId);
                if (ewe) {
                    ewe.status = 'pregnant';
                    await this.pb.collection('farm_sheep').update(eweId, { status: 'pregnant' });
                }
                
                this.updateFarmStats();
                alert('Breeding recorded successfully! / تم تسجيل التزاوج بنجاح!');
            } catch (err) {
                console.error('Breeding record error:', err);
                alert('Failed to record breeding');
            }
        },
        
        async updateFeedInventory(feedType, quantity, action = 'add') {
            try {
                if (action === 'add') {
                    this.feedInventory[feedType] += quantity;
                } else {
                    this.feedInventory[feedType] = Math.max(0, this.feedInventory[feedType] - quantity);
                }
                
                this.feedInventory.lastRestockDate = new Date().toISOString();
                
                // Check if low on feed
                const totalFeed = this.feedInventory.alfalfa + this.feedInventory.concentrate + this.feedInventory.grains;
                const daysOfFeed = totalFeed / (this.farmStats.totalSheep * 2.5);
                
                if (daysOfFeed < 7) {
                    alert('Warning: Low feed inventory! Less than 7 days remaining. / تحذير: مخزون العلف منخفض! أقل من 7 أيام متبقية.');
                }
                
                this.updateFarmStats();
            } catch (err) {
                console.error('Feed inventory update error:', err);
            }
        },
        
        async createTask(task) {
            try {
                const newTask = {
                    ...task,
                    id: Date.now().toString(),
                    created: new Date().toISOString(),
                    completed: false,
                    completedDate: null
                };
                
                this.tasks.push(newTask);
                alert('Task created successfully! / تم إنشاء المهمة بنجاح!');
                
                // Reset form
                this.taskForm = {
                    title: '',
                    description: '',
                    dueDate: '',
                    priority: 'medium',
                    category: 'general',
                    assignedTo: '',
                    sheepIds: []
                };
            } catch (err) {
                console.error('Task creation error:', err);
            }
        },
        
        completeTask(taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = true;
                task.completedDate = new Date().toISOString();
            }
        },
        
        getUpcomingTasks() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            return this.tasks
                .filter(t => !t.completed && new Date(t.dueDate) >= today)
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 5);
        },
        
        getOverdueTasks() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            return this.tasks.filter(t => !t.completed && new Date(t.dueDate) < today);
        },
        
        generateHealthReport() {
            const report = {
                date: new Date().toISOString(),
                totalAnimals: this.farmStats.totalSheep,
                healthStatus: {
                    healthy: this.farmStats.healthy,
                    sick: this.farmSheep.filter(s => s.status === 'sick').length,
                    pregnant: this.farmStats.pregnant,
                    lactating: this.farmStats.lactating
                },
                vaccinations: {
                    upToDate: this.farmSheep.filter(s => !this.needsVaccination(s)).length,
                    overdue: this.farmStats.upcomingVaccinations
                },
                mortality: {
                    rate: this.farmStats.mortalityRate + '%',
                    count: this.farmSheep.filter(s => s.status === 'dead').length
                },
                recommendations: []
            };
            
            // Add recommendations
            if (report.vaccinations.overdue > 0) {
                report.recommendations.push({
                    type: 'vaccination',
                    message: `${report.vaccinations.overdue} animals need vaccination`,
                    priority: 'high'
                });
            }
            
            if (parseFloat(report.mortality.rate) > 5) {
                report.recommendations.push({
                    type: 'health',
                    message: 'Mortality rate is above 5% - investigate causes',
                    priority: 'high'
                });
            }
            
            return report;
        },
        
        async exportFarmData() {
            const data = {
                exportDate: new Date().toISOString(),
                farmStats: this.farmStats,
                animals: this.farmSheep,
                breedingRecords: this.breedingRecords,
                tasks: this.tasks,
                feedInventory: this.feedInventory
            };
            
            // Create and download JSON file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `farm_data_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Farm data exported successfully! / تم تصدير بيانات المزرعة بنجاح!');
        },

        startCd() { 
            if(this.cdTimer) clearInterval(this.cdTimer); 
            if(!this.settings.promoActive) {
                this.cd.ended=true; 
                return;
            }
            // If promo is active but no end date, show promo without countdown
            if(!this.settings.promoEndISO) {
                this.cd.ended=false; 
                this.cd.days = "--"; this.cd.hours = "--"; this.cd.mins = "--"; this.cd.secs = "--";
                return;
            } 
            const t=new Date(this.settings.promoEndISO).getTime(); 
            if(isNaN(t)){
                // Invalid date but promo is active, show without countdown
                this.cd.ended=false; 
                this.cd.days = "--"; this.cd.hours = "--"; this.cd.mins = "--"; this.cd.secs = "--";
                return;
            } 
            this.updCdDisp(t); 
            this.cdTimer=setInterval(()=>this.updCdDisp(t),1000); 
        },

        updCdDisp(t) { 
            const d = t - Date.now(); 
            if (d < 0) { 
                if (this.cdTimer) clearInterval(this.cdTimer); 
                this.cd.days = "00"; this.cd.hours = "00"; this.cd.mins = "00"; this.cd.secs = "00"; 
                this.cd.ended = true; 
                return; 
            } 
            this.cd.ended = false; 
            this.cd.days = String(Math.floor(d / 864e5)).padStart(2, '0'); 
            this.cd.hours = String(Math.floor(d % 864e5 / 36e5)).padStart(2, '0'); 
            this.cd.mins = String(Math.floor(d % 36e5 / 6e4)).padStart(2, '0'); 
            this.cd.secs = String(Math.floor(d % 6e4 / 1e3)).padStart(2, '0'); 
        },

        fmtPrice(p, c) { 
            const cc=c||this.curr; 
            const ci=this.settings?.xchgRates?.[cc]; 
            if(p==null||p === undefined ||!ci||typeof ci.rate_from_egp !=='number') return`${ci?.symbol||(cc==='EGP'?'LE':'')} ---`; 
            const cp=p*ci.rate_from_egp; 
            return`${ci.symbol||(cc==='EGP'?'LE':cc)} ${cp.toFixed((ci.symbol==="LE"||ci.symbol==="ل.م"||cc==='EGP'||ci.symbol==="€")?0:2)}`; 
        },

        // All product data now comes from database via PocketBase
        // No hardcoded products or prices

        closeAllDropdowns() {
            this.showSearch = false;
            this.showAccountDropdown = false;
            this.showAuthDropdown = false;
            this.showWhatsAppChat = false;
            this.isCartOpen = false;
            this.isWishlistOpen = false;
            this.isMobNavOpen = false;
        },

        toggleSearch() {
            const wasOpen = this.showSearch;
            this.closeAllDropdowns();
            this.showSearch = !wasOpen;
            if (this.showSearch) {
                this.$nextTick(() => {
                    this.$refs.searchInput?.focus();
                });
            }
        },

        toggleAccountDropdown() {
            const wasOpen = this.showAccountDropdown;
            this.closeAllDropdowns();
            this.showAccountDropdown = !wasOpen;
        },

        toggleAuthDropdown() {
            const wasOpen = this.showAuthDropdown;
            this.closeAllDropdowns();
            this.showAuthDropdown = !wasOpen;
            if (this.showAuthDropdown) {
                this.auth.view = 'welcome';
            }
        },

        toggleWhatsAppChat() {
            const wasOpen = this.showWhatsAppChat;
            this.closeAllDropdowns();
            this.showWhatsAppChat = !wasOpen;
        },

        sendWhatsAppMessage() {
            if (!this.chatMessage.trim()) return;
            
            const msg = {
                id: Date.now(),
                text: this.chatMessage,
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            };
            
            this.chatMessages.push(msg);
            
            // Send to WhatsApp in background
            const whatsappUrl = `https://wa.me/${this.settings.waNumRaw}?text=${encodeURIComponent(this.chatMessage)}`;
            window.open(whatsappUrl, '_blank', 'width=800,height=600');
            
            this.chatMessage = '';
        },

        sendQuickWhatsAppMessage(text) {
            this.chatMessage = text;
            this.sendWhatsAppMessage();
        },



        getMeatPrice(item) {
            const weight = this.selectedMeatWeights[item.itemKey] || 1;
            const pricePerKg = item.pricePerKg || item.priceEGP;
            return pricePerKg * weight;
        },

        getSacrificeVariant(productType) {
            // Get the selected variant index for this product type, default to 0 (first variant)
            const selectedIndex = this.selectedSacrificeVariants[productType.valKey] || 0;
            return productType.wps[selectedIndex] || productType.wps[0];
        },

        getSacrificePrice(productType) {
            const variant = this.getSacrificeVariant(productType);
            return variant ? variant.priceEGP : 0;
        },

        updateSacrificeVariant(productType, variantIndex) {
            this.selectedSacrificeVariants[productType.valKey] = parseInt(variantIndex);
        },


        getMeatItemWithWeight(item, sectionKey) {
            if (sectionKey !== 'meat') return item;
            
            const weight = this.selectedMeatWeights[item.itemKey] || 1;
            return {
                ...item,
                nameENSpec: `${item.nameENSpec} - ${weight} kg`,
                nameARSpec: `${item.nameARSpec} - ${weight} كجم`,
                priceEGP: this.getMeatPrice(item),
                selectedWeight: weight
            };
        },

        // Removed empty filterProducts function - filtering is handled by computed property

        get productSections() {
            // Ensure each product array has valid structure
            const ensureValidProducts = (products) => {
                if (!Array.isArray(products)) return [];
                return products.filter(p => p && p.wps && Array.isArray(p.wps));
            };
            
            return [
                {key: 'meat', name: {en: 'Fresh Meat & Cuts', ar: 'اللحوم الطازجة والقطعيات'}, products: ensureValidProducts(this.prodOpts.meat_cuts), badge: 'FRESH'},
                {key: 'gatherings', name: {en: 'Event & Gathering Packages', ar: 'باقات المناسبات والولائم'}, products: ensureValidProducts(this.prodOpts.gathering_package), badge: 'EVENT'}
            ];
        },

        get filteredProducts() {
            if (!this.searchQuery || this.searchQuery.trim().length < 2) return {};
            
            const query = this.searchQuery.toLowerCase().trim();
            const filtered = {};
            
            const categoryNames = {
                udheya: { en: 'Udheya', ar: 'الأضحية' },
                meatCuts: { en: 'Fresh Meat', ar: 'اللحوم الطازجة' },
                gatheringPackage: { en: 'Gatherings', ar: 'الولائم' }
            };
            
            Object.keys(this.prodOpts).forEach(category => {
                const matchingProducts = [];
                
                // Add defensive check for category array
                if (this.prodOpts[category] && Array.isArray(this.prodOpts[category])) {
                    this.prodOpts[category].forEach(productType => {
                        // Add defensive check for productType and wps property
                        if (productType && productType.wps && Array.isArray(productType.wps)) {
                            const matchingItems = productType.wps.filter(item => 
                                item.nameENSpec && item.nameENSpec.toLowerCase().includes(query) ||
                                item.nameARSpec && item.nameARSpec.includes(query) ||
                                productType.nameEn && productType.nameEn.toLowerCase().includes(query) ||
                                productType.nameAr && productType.nameAr.includes(query)
                            );
                    
                            if (matchingItems.length > 0) {
                                matchingProducts.push(...matchingItems);
                            }
                        }
                    });
                }
                
                if (matchingProducts.length > 0) {
                    filtered[category] = matchingProducts;
                }
            });
            
            return filtered;
        },
        
        getCategoryDisplayName(category) {
            const names = {
                udheya: { en: 'Udheya', ar: 'الأضحية' },
                meatCuts: { en: 'Fresh Meat', ar: 'اللحوم الطازجة' },
                gatheringPackage: { en: 'Gatherings', ar: 'الولائم' }
            };
            return names[category] || { en: category, ar: category };
        },
        
        cleanup() {
            // Cleanup timers to prevent memory leaks
            if (this.cdTimer) {
                clearInterval(this.cdTimer);
                this.cdTimer = null;
            }
        },

        getStockDisplayInfo(stock, isActive, lang = this.currLang) {
            if (!isActive) return lang === 'ar' ? "غير نشط" : "Inactive";
            if (stock === undefined || stock === null || stock <= 0) return lang === 'ar' ? "نفذ المخزون" : "Out of Stock";
            if (stock <= 5) return lang === 'ar' ? `متوفر: ${stock} (كمية محدودة)` : `${stock} Available (Limited)`;
            return lang === 'ar' ? `متوفر: ${stock}` : `${stock} Available`;
        },

        getCategoryDisplayName(category, lang) {
            const names = {
                udheya: { en: 'Udheya', ar: 'الأضحية' },
                aqiqah: { en: 'Aqiqah', ar: 'عقيقة' },
                charity: { en: 'Charity', ar: 'صدقات' },
                vow: { en: 'Vow', ar: 'نذر' },
                expiation: { en: 'Expiation', ar: 'كفارة' },
                ready_to_eat: { en: 'Ready to Eat', ar: 'جاهز للأكل' },
                slaughtered: { en: 'Slaughtered & Portioned', ar: 'مذبوحة ومجزأة' },
                meat_cuts: { en: 'Meat Cuts', ar: 'قطعيات' },
                gathering_package: { en: 'Events & Gatherings', ar: 'مناسبات وولائم' }
            };
            return names[category] ? names[category][lang] : category;
        },

        getBadgeClass(category, item) {
            if (item.is_premium) return 'premium-badge';
            if (category === 'udheya') return 'udheya-badge';
            return '';
        },

        getBadgeText(category, item) {
            if (item.is_premium) return 'PREMIUM';
            const badges = {
                udheya: 'UDHEYA',
                aqiqah: 'AQIQAH',
                charity: 'CHARITY',
                vow: 'VOW',
                meat_cuts: 'FRESH'
            };
            return badges[category] || 'NEW';
        },

        handleProductClick(item, category) {
            if (category === 'udheya') {
                this.openUdheyaConfiguration(item);
            } else if (category === 'meat_cuts') {
                // For meat cuts, add with 1kg default
                const meatItem = {
                    ...item,
                    selectedWeight: 1,
                    priceEGP: item.priceEGP || item.base_price_egp
                };
                this.addItemToCart(meatItem);
            } else {
                this.addItemToCart(item);
            }
        },

        getProductImage(item, sectionKey) {
            // Keep real images only for sacrifices/udheya section
            if (sectionKey === 'udheya' || sectionKey === 'sacrifices') {
                const sheepImage1 = 'images/sheep-1.jpg';
                const sheepImage2 = 'images/barki-sheep.png';
                // Alternate between the two sheep images for variety
                return item && item.type_key && item.type_key.includes('barki') ? sheepImage2 : sheepImage1;
            }
            
            // Use placeholder images for all other sections
            if (sectionKey === 'meat' || sectionKey === 'fresh-meat' || sectionKey === 'meat_cuts') {
                return 'https://placehold.co/400x300/8B4513/FFFFFF?text=Fresh+Meat';
            }
            else if (sectionKey === 'gatherings' || sectionKey === 'events-catering' || sectionKey === 'gathering_package') {
                return 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Events';
            }
            else if (sectionKey === 'ready_to_eat') {
                return 'https://placehold.co/400x300/2E7D32/FFFFFF?text=Ready+to+Eat';
            }
            else if (sectionKey === 'livesheep' || sectionKey === 'livesheep_general') {
                return 'https://placehold.co/400x300/558B2F/FFFFFF?text=Live+Sheep';
            }
            
            // Default placeholder
            return 'https://placehold.co/400x300/cccccc/666666?text=Product+Image';
        },

        isEmailValid: (e) => e?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
        isPhoneValid: (p) => p?.trim() && /^\+?[0-9\s\-()]{7,20}$/.test(p.trim()),

        setErr(f, m, isUserErr = true) { 
            this.errs[f] = (typeof m === 'string' ? this.errMsgs[m] || {en:m, ar:m} : m) || this.errMsgs.required; 
            if (isUserErr && typeof this.errs[f] === 'object') { 
                this.usrApiErr = this.currLang === 'ar' ? this.errs[f].ar : this.errs[f].en; 
            } else if (isUserErr) { 
                this.usrApiErr = String(this.errs[f]); 
            } 
        },

        clrErr(f) { 
            if(this.errs[f]) delete this.errs[f]; 
            let hasVisibleErrors = Object.keys(this.errs).some(key => this.errs[key]); 
            if (!hasVisibleErrors) { 
                this.usrApiErr = ""; 
                this.apiErr = null;
            } 
        },

        clearAllErrors() { 
            this.errs = {}; 
            this.usrApiErr = ""; 
            this.apiErr = null; 
        },

        focusRef(r, s=true) { 
            this.$nextTick(()=>{ 
                const target = this.$refs[r]; 
                if(target){ 
                    target.focus({preventScroll:!s}); 
                    if(s) setTimeout(()=>{ 
                        try{ 
                            target.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'}); 
                        }catch(e){ 
                            // console.warn("ScrollIntoView failed for:", r, e); 
                        } 
                    },50); 
                } 
            }) 
        },
        
        distrOpts() { 
            return [ 
                { val: 'me', txtEn: 'Deliver All to Me', txtAr: 'توصيل الكل لي' }, 
                { val: 'char', txtEn: 'Donate All (Charity Distribution)', txtAr: 'تبرع بالكل (توزيع خيري)' }, 
                { val: 'split', txtEn: 'Split Between Me & Charity', txtAr: 'تقسيم بيني وبين الخير' } 
            ]; 
        },

        splitOptsList() { 
            return [ 
                { val: '1/3_me_2/3_charity_sl', txtEn: '1/3 for me, 2/3 charity', txtAr: 'ثلث لي، ثلثان صدقة' }, 
                { val: '1/2_me_1/2_charity_sl', txtEn: '1/2 for me, 1/2 charity', txtAr: 'نصف لي، نصف صدقة' }, 
                { val: '2/3_me_1/3_charity_sl', txtEn: '2/3 for me, 1/3 charity', txtAr: 'ثلثان لي، ثلث صدقة' }, 
                { val: 'all_me_custom_distro', txtEn: 'All for me (I will distribute)', txtAr: 'الكل لي (سأوزع بنفسي)' }, 
                { val: 'custom', txtEn: 'Custom (Specify)', txtAr: 'مخصص (حدد)' } 
            ]; 
        },

        initAuthPage() { 
            this.clearAllErrors();
            if (this.currentUser?.id) { 
                this.navigateToOrScroll('account'); 
                return; 
            } 
            this.auth.view = 'login'; 
        },

        async loginUser() { 
            this.clearAllErrors(); 
            this.load.auth = true;
            try { 
                const authData = await this.pb.collection('users').authWithPassword(this.auth.email, this.auth.password); 
                this.currentUser = authData.record; 
                this.checkoutForm.user_id = this.currentUser?.id || null; 
                this.loadCartFromStorage(); 
                
                // Start real-time sync after successful login
                await this.initRealTimeSync();
                
                this.load.auth = false;
                this.showAuthDropdown = false; // Close dropdown on successful login
                
                if (this.redirectAfterLogin) {
                    this.navigateToOrScroll(this.redirectAfterLogin);
                    this.redirectAfterLogin = null;
                } 
            } catch (e) { 
                this.load.auth = false; 
                this.setErr('auth_login', {en: 'Login failed. Please check credentials.', ar: 'فشل الدخول. تحقق من البيانات.'}); 
            }
        },

        async registerUser() { 
            this.clearAllErrors(); 
            this.load.auth = true;
            let regValid = true;
            if (!this.auth.name.trim()) { 
                this.setErr('auth_name', {en: 'Name is required.', ar: 'الاسم مطلوب.'}); 
                regValid = false; 
            }
            if (!this.isEmailValid(this.auth.email)) { 
                this.setErr('auth_email', 'email'); 
                regValid = false; 
            }
            if (this.auth.password.length < 8) { 
                this.setErr('auth_password', {en: 'Password must be at least 8 characters.', ar: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.'}); 
                regValid = false; 
            }
            if (this.auth.password !== this.auth.passwordConfirm) { 
                this.setErr('auth_passwordConfirm', {en: 'Passwords do not match.', ar: 'كلمات المرور غير متطابقة.'}); 
                regValid = false; 
            }
            if (!regValid) { 
                this.load.auth = false; 
                return;
            }

            try { 
                const data = {
                    email: this.auth.email, 
                    password: this.auth.password, 
                    passwordConfirm: this.auth.passwordConfirm, 
                    name: this.auth.name,
                    phone: this.auth.phone,
                    country: this.auth.country,
                    emailVisibility: true 
                }; 
                await this.pb.collection('users').create(data); 
                this.errs.auth_form_success = {en: 'Registration successful! Please login.', ar: 'تم التسجيل بنجاح! يرجى تسجيل الدخول.'};
                this.load.auth = false; 
                this.auth.view = 'login'; 
                this.auth.password = ""; 
                this.auth.passwordConfirm = "";
            } catch (e) { 
                this.load.auth = false; 
                this.setErr('auth_register', { en: 'Registration failed. This email might already be in use.', ar: 'فشل التسجيل. قد يكون هذا البريد الإلكتروني مستخدمًا بالفعل.' }); 
            }
        },

        logoutUser() { 
            // Clear sync interval
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
            
            this.pb.authStore.clear(); 
            this.currentUser = null; 
            this.userOrders = []; 
            this.checkoutForm = JSON.parse(JSON.stringify(initForm)); 
            this.loadCartFromStorage(); 
            this.navigateToOrScroll('home'); 
        },

        async initAccountPage() { 
            this.clearAllErrors();
            if (!this.pb.authStore.isValid) { 
                this.redirectAfterLogin = 'account'; 
                this.navigateToOrScroll('auth'); 
                return; 
            } 
            if (!this.currentUser && this.pb.authStore.model) {
                this.currentUser = this.pb.authStore.model; 
            }
            if (this.currentUser?.id) {
                await this.fetchUserOrders(); 
            }
        },

        async fetchUserOrders() { 
            if (!this.currentUser?.id) return; 
            this.load.orders = true; 
            this.clrErr('orders_fetch');
            try { 
                const resultList = await this.pb.collection('orders').getFullList({ 
                    filter: `user = "${this.currentUser.id}"`, 
                    sort: '-created' 
                });
                this.userOrders = resultList.map(order => ({ 
                    ...order, 
                    order_status: order.order_status?.replace(/_/g, " ") || "N/A", 
                    payment_status: order.payment_status?.replace(/_/g, " ") || "N/A"
                }));
            } catch (e) { 
                this.setErr('orders_fetch', {en: 'Could not fetch your orders.', ar: 'تعذر جلب طلباتك.'}); 
            } finally { 
                this.load.orders = false; 
            }
        },

        initCheckoutPage() { 
            this.clearAllErrors();
            const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
            const isBuyNow = urlParams.get('buyNow') === 'true';
            let buyNowItem = null;

            if (isBuyNow) {
                try {
                    const storedItem = localStorage.getItem('sheepLandBuyNowItem');
                    if (storedItem) {
                        buyNowItem = JSON.parse(storedItem);
                        this.cartItems = [buyNowItem]; 
                    }
                    localStorage.removeItem('sheepLandBuyNowItem'); 
                } catch (e) { 
                    // console.error("Error loading Buy Now item", e); 
                }
            } else {
                this.loadCartFromStorage();
            }

            // Pre-fill form if user is logged in
            if (this.currentUser) {
                this.checkoutForm.customer_name = this.currentUser.name || '';
                this.checkoutForm.customer_email = this.currentUser.email || '';
                this.checkoutForm.customer_phone = this.currentUser.phone || '';
            }
            
            if (this.cartItems.length === 0 && !this.orderConf.show) { 
                this.navigateToOrScroll('sacrifices'); 
                return; 
            }
            
            this.checkoutForm = JSON.parse(JSON.stringify(initForm)); 
            if (this.currentUser?.id) { 
                this.checkoutForm.customer_name = this.currentUser.name || ""; 
                this.checkoutForm.customer_email = this.currentUser.email || ""; 
                this.checkoutForm.customer_phone = this.currentUser.phone || ""; 
                this.checkoutForm.customer_country = this.currentUser.country || "Egypt"; 
                this.checkoutForm.user_id = this.currentUser.id; 
            } else { 
                this.checkoutForm.user_id = null; 
            }
            this.updateDeliveryFeeForCheckout(); 
            this.calculateFinalTotal();
        },

        deliveryNeededForCart() { 
            return this.cartItems.some(item => {
                if (item.product_category === 'udheya') { 
                    const distChoice = item.udheya_details?.distribution?.choice; 
                    const splitOpt = item.udheya_details?.distribution?.splitOption; 
                    return distChoice === 'me' || (distChoice === 'split' && ["1/3_me_2/3_charity_sl", "1/2_me_1/2_charity_sl", "2/3_me_1/3_charity_sl", "all_me_custom_distro"].includes(splitOpt));
                } 
                return ['meat_cuts', 'gathering_package'].includes(item.product_category);
            });
        },

        applyPromoCode() {
            this.clearError('promo_code');
            const code = this.checkoutForm.promo_code.toUpperCase().trim();
            
            // Check if code is valid
            if (code === 'SAVE5') {
                this.checkoutForm.promo_applied = true;
                this.calculateFinalTotal();
            } else if (this.settings.promoActive && code === 'PROMO' + this.settings.promoDiscPc) {
                this.checkoutForm.promo_applied = true;
                this.calculateFinalTotal();
            } else {
                this.setErr('promo_code', 'Invalid promo code');
                this.checkoutForm.promo_applied = false;
                this.checkoutForm.promo_discount_amount = 0;
                this.calculateFinalTotal();
            }
        },

        updateDeliveryFeeForCheckout() { 
            this.checkoutForm.delivery_fee_egp = 0; 
            this.isDelFeeVar = false; 
            if (!this.deliveryNeededForCart() || !this.checkoutForm.delivery_city_id) { 
                this.calculateFinalTotal(); 
                return; 
            } 
            const cityData = this.allCities.find(c => c.id === this.checkoutForm.delivery_city_id); 
            if (cityData && typeof cityData.delFeeEgp === 'number') { 
                this.checkoutForm.delivery_fee_egp = cityData.delFeeEgp; 
                this.isDelFeeVar = false; 
            } else if (cityData && cityData.delFeeEgp === null) { 
                this.isDelFeeVar = true; 
                this.checkoutForm.delivery_fee_egp = 0; 
            } else { 
                this.isDelFeeVar = true; 
                this.checkoutForm.delivery_fee_egp = 0; 
            } 
            this.calculateFinalTotal(); 
        },

        calculateFinalTotal() { 
            const cartSubtotal = this.calculateCartSubtotal(); 
            const totalServiceFee = this.calculateTotalServiceFee(); 
            this.checkoutForm.total_service_fee_egp = totalServiceFee; 
            let deliveryFee = 0; 
            if (this.deliveryNeededForCart() && this.checkoutForm.delivery_fee_egp > 0 && !this.isDelFeeVar) { 
                deliveryFee = this.checkoutForm.delivery_fee_egp; 
            } 
            let onlinePaymentFee = 0; 
            const onlinePaymentMethods = ['online_card', 'mastercard', 'google_pay', 'apple_pay', 'paypal', 'bitcoin', 'ethereum', 'usdt'];
            if (onlinePaymentMethods.includes(this.checkoutForm.payment_method) && this.settings.online_payment_fee_egp > 0) { 
                onlinePaymentFee = this.settings.online_payment_fee_egp; 
            } 
            this.checkoutForm.online_payment_fee_applied_egp = onlinePaymentFee; 
            
            // Calculate promo discount
            let promoDiscount = 0;
            if (this.checkoutForm.promo_applied) {
                // Apply promo discount to subtotal before fees
                if (this.checkoutForm.promo_code === 'SAVE5') {
                    promoDiscount = cartSubtotal * 0.05;
                } else if (this.settings.promoActive && this.checkoutForm.promo_code === 'PROMO' + this.settings.promoDiscPc) {
                    promoDiscount = cartSubtotal * (this.settings.promoDiscPc / 100);
                }
                this.checkoutForm.promo_discount_amount = promoDiscount;
            }
            
            this.checkoutForm.final_total_egp = cartSubtotal + totalServiceFee + deliveryFee + onlinePaymentFee - promoDiscount; 
        },

        validateCheckoutForm() { 
            this.clearAllErrors(); 
            let isValid = true;
            if (!this.checkoutForm.customer_name.trim()) { 
                this.setErr('customer_name', 'required'); 
                isValid = false; 
            }
            if (!this.isPhoneValid(this.checkoutForm.customer_phone)) { 
                this.setErr('customer_phone', 'phone'); 
                isValid = false; 
            }
            if (!this.isEmailValid(this.checkoutForm.customer_email)) { 
                this.setErr('customer_email', 'email'); 
                isValid = false; 
            }
            if (this.deliveryNeededForCart()) { 
                if (!this.checkoutForm.delivery_city_id) { 
                    this.setErr('delivery_city_id', 'required'); 
                    isValid = false; 
                } 
                if (!this.checkoutForm.delivery_address.trim()) { 
                    this.setErr('delivery_address', 'required'); 
                    isValid = false; 
                } 
                if (!this.checkoutForm.delivery_time_slot) { 
                    this.setErr('delivery_time_slot', {en: 'Please select a delivery time slot.', ar: 'يرجى اختيار وقت التوصيل.'}); 
                    isValid = false; 
                } 
            }
            if (!this.checkoutForm.payment_method) { 
                this.setErr('payment_method', 'required'); 
                isValid = false; 
            }
            if (!this.checkoutForm.terms_agreed) { 
                this.setErr('terms_agreed', 'terms_agreed'); 
                isValid = false; 
            }
            return isValid;
        },

        async processOrder() { 
            if (!this.validateCheckoutForm()) return; 
            this.load.checkout = true; 
            this.usrApiErr = ""; 
            this.apiErr = "";
            
            const lineItemsForOrder = this.cartItems.map(item => { 
                let lineItem = { 
                    item_key_pb: item.varIdPb, 
                    product_category: item.product_category, 
                    name_en: item.nameENSpec, 
                    name_ar: item.nameARSpec, 
                    quantity: item.quantity, 
                    price_egp_each: item.priceEGP, 
                    udheya_details: null 
                }; 
                if (item.product_category === 'udheya' && item.udheya_details) { 
                    lineItem.udheya_details = item.udheya_details; 
                } 
                return lineItem; 
            });
            
            let deliveryOpt = "self_pickup_or_internal_distribution"; 
            if (this.deliveryNeededForCart()) { 
                deliveryOpt = this.checkoutForm.customer_country?.toLowerCase() === 'egypt' ? "home_delivery" : "international_shipping"; 
            } else { 
                this.checkoutForm.delivery_city_id = ""; 
                this.checkoutForm.delivery_address = ""; 
                this.checkoutForm.delivery_instructions = ""; 
                this.checkoutForm.delivery_time_slot = ""; 
                this.checkoutForm.delivery_fee_egp = 0; 
            } 
            this.calculateFinalTotal();
            
            // Set user_id from current user if logged in, otherwise null for guest checkout
            this.checkoutForm.user_id = this.currentUser?.id || null;
            
            // Sanitize all input data before submission to prevent XSS
            const sanitizeInput = (input) => {
                if (typeof input !== 'string') return input;
                // Remove any HTML tags and limit length
                return input.replace(/<[^>]*>/g, '').trim().substring(0, 1000);
            };
            
            const orderPayload = { 
                order_id_text: `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`, 
                user: this.checkoutForm.user_id, 
                customer_name: sanitizeInput(this.checkoutForm.customer_name), 
                customer_phone: sanitizeInput(this.checkoutForm.customer_phone), 
                customer_email: sanitizeInput(this.checkoutForm.customer_email), 
                customer_country: this.checkoutForm.customer_country || "Egypt",
                line_items: lineItemsForOrder, 
                delivery_option: deliveryOpt, 
                delivery_city_id: this.checkoutForm.delivery_city_id, 
                delivery_address: sanitizeInput(this.checkoutForm.delivery_address), 
                delivery_instructions: sanitizeInput(this.checkoutForm.delivery_instructions), 
                delivery_time_slot: this.checkoutForm.delivery_time_slot, 
                payment_method: this.checkoutForm.payment_method, 
                terms_agreed: this.checkoutForm.terms_agreed, 
                selected_display_currency: this.curr, 
                subtotal_amount_egp: this.calculateCartSubtotal(), 
                total_udheya_service_fee_egp: this.checkoutForm.total_service_fee_egp, 
                delivery_fee_applied_egp: this.checkoutForm.delivery_fee_egp, 
                online_payment_fee_applied_egp: this.checkoutForm.online_payment_fee_applied_egp, 
                total_amount_due_egp: this.checkoutForm.final_total_egp,
                promo_code: this.checkoutForm.promo_code || null,
                promo_discount_amount_egp: this.checkoutForm.promo_discount_amount || 0
            };
            
            try { 
                const createdOrder = await this.pb.collection('orders').create(orderPayload); 
                this.orderConf.orderID = createdOrder.order_id_text; 
                this.orderConf.totalEgp = createdOrder.total_amount_due_egp; 
                this.orderConf.items = createdOrder.line_items.map(li => ({...li})); 
                this.orderConf.customerEmail = createdOrder.customer_email; 
                this.orderConf.paymentInstructions = this.getPaymentInstructionsHTML(createdOrder.payment_method, createdOrder.total_amount_due_egp, createdOrder.order_id_text); 
                this.orderConf.show = true;
            
            // Trigger feedback prompt after order completion
            window.dispatchEvent(new CustomEvent('orderCompleted', {
                detail: { orderId: this.orderConf.orderID }
            })); 
                
                const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
                const isBuyNow = urlParams.get('buyNow') === 'true';
                if (!isBuyNow) { 
                    this.clearCart(); 
                }
                localStorage.removeItem('sheepLandBuyNowItem'); 
                this.checkoutForm = JSON.parse(JSON.stringify(initForm)); 
                
                // Send WhatsApp notification to business owner
                this.sendBusinessWhatsAppNotification(createdOrder);
                
                this.$nextTick(() => { 
                    this.focusRef('orderConfTitle'); 
                }); 
            } catch (e) { 
                this.apiErr = String(e.data?.message || e.message || "Order placement failed."); 
                this.usrApiErr = "An unexpected error occurred. Please check your selections or contact support."; 
            } finally { 
                this.load.checkout = false; 
            }
        },

        getPaymentInstructionsHTML(payMeth, totalEgp, orderID) { 
            let instructions = ""; 
            const priceText = this.fmtPrice(totalEgp); 
            const waLink = `https://wa.me/${this.settings.waNumRaw}?text=Order%20Payment%20Confirmation%3A%20${orderID}`;
            const confirmWALink = `<a href="${waLink}" target="_blank" rel="noopener noreferrer" class="link-style">${this.settings.waNumDisp || 'WhatsApp'}</a>`;
            
            if (payMeth === 'online_card') { 
                instructions = `<div class="bil-row"><p class="en">Your order total is <strong>${priceText}</strong>. To complete payment, you will be contacted shortly. Order ID: <strong class="pay-ref">${orderID}</strong>.</p><p class="ar">إجمالي طلبك هو <strong>${priceText}</strong>. لإتمام الدفع، سنتصل بك قريبًا. رقم الطلب: <strong class="pay-ref">${orderID}</strong>.</p></div>`; 
            } else if (payMeth === 'fawry') { 
                instructions = `<div class="bil-row"><p class="en">Fawry: Pay <strong>${priceText}</strong>. Use Order ID <strong class="pay-ref">${orderID}</strong>. Due in 24h.</p><p class="ar">فوري: ادفع <strong>${priceText}</strong>. استخدم رقم الطلب <strong class="pay-ref">${orderID}</strong>. خلال 24س.</p></div>`; 
            } else if (payMeth === 'vodafone_cash') { 
                instructions = `<div class="bil-row"><p class="en">Vodafone Cash: Pay <strong>${priceText}</strong> to <strong class="pay-ref">${this.settings.payDetails?.vodafone_cash || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">فودافون كاش: ادفع <strong>${priceText}</strong> إلى <strong class="pay-ref">${this.settings.payDetails?.vodafone_cash || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; 
            } else if (payMeth === 'instapay') { 
                instructions = `<div class="bil-row"><p class="en">InstaPay: Pay <strong>${priceText}</strong> to <strong class="pay-ref">${this.settings.payDetails?.instapay_ipn || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">إنستا باي: ادفع <strong>${priceText}</strong> إلى <strong class="pay-ref">${this.settings.payDetails?.instapay_ipn || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; 
            } else if (payMeth === 'revolut') { 
                instructions = `<div class="bil-row"><p class="en">Revolut: Pay <strong>${priceText}</strong> to <strong class="pay-ref">${this.settings.payDetails?.revolut_details || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">ريفولوت: ادفع <strong>${priceText}</strong> إلى <strong class="pay-ref">${this.settings.payDetails?.revolut_details || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; 
            } else if (payMeth === 'monzo') { 
                instructions = `<div class="bil-row"><p class="en">Monzo: Pay <strong>${priceText}</strong> to <strong class="pay-ref">${this.settings.payDetails?.monzo_details || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">مونزو: ادفع <strong>${priceText}</strong> إلى <strong class="pay-ref">${this.settings.payDetails?.monzo_details || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; 
            } else if (payMeth === 'google_pay') { 
                instructions = `<div class="bil-row"><p class="en">Google Pay: Pay <strong>${priceText}</strong> to <strong class="pay-ref">${this.settings.payDetails?.google_pay_details || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">جوجل باي: ادفع <strong>${priceText}</strong> إلى <strong class="pay-ref">${this.settings.payDetails?.google_pay_details || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; 
            } else if (payMeth === 'apple_pay') { 
                instructions = `<div class="bil-row"><p class="en">Apple Pay: Pay <strong>${priceText}</strong> to <strong class="pay-ref">${this.settings.payDetails?.apple_pay_details || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">آبل باي: ادفع <strong>${priceText}</strong> إلى <strong class="pay-ref">${this.settings.payDetails?.apple_pay_details || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; 
            } else if (payMeth === 'bank_transfer') { 
                instructions = `<div class="bil-row"><p class="en">Bank Transfer <strong>${priceText}</strong> to:</p><p class="ar">تحويل بنكي <strong>${priceText}</strong> إلى:</p></div><ul class="bank-dets"><li class="bil-row"><span class="en">Bank: <strong class="pay-ref">${this.settings.payDetails?.bank_name || 'N/A'}</strong></span><span class="ar">البنك: <strong class="pay-ref">${this.settings.payDetails?.bank_name || 'غير متوفر'}</strong></span></li><li class="bil-row"><span class="en">Acc No: <strong class="pay-ref">${this.settings.payDetails?.bank_account_number || 'N/A'}</strong></span><span class="ar">رقم الحساب: <strong class="pay-ref">${this.settings.payDetails?.bank_account_number || 'غير متوفر'}</strong></span></li></ul><div class="bil-row bank-note"><p class="en">Ref Order ID: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">مرجع الطلب: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; 
            } else if (payMeth === 'bitcoin') { 
                instructions = `<div class="bil-row"><p class="en">Bitcoin: Send <strong>${priceText}</strong> worth of BTC to wallet: <strong class="pay-ref">${this.settings.payDetails?.bitcoin_wallet || '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">بيتكوين: أرسل ما قيمته <strong>${priceText}</strong> من BTC إلى المحفظة: <strong class="pay-ref">${this.settings.payDetails?.bitcoin_wallet || '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; 
            } else if (payMeth === 'ethereum') { 
                instructions = `<div class="bil-row"><p class="en">Ethereum: Send <strong>${priceText}</strong> worth of ETH to wallet: <strong class="pay-ref">${this.settings.payDetails?.ethereum_wallet || '0x742d35Cc6634C0532925a3b844Bc9e7595f5b899'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">إيثيريوم: أرسل ما قيمته <strong>${priceText}</strong> من ETH إلى المحفظة: <strong class="pay-ref">${this.settings.payDetails?.ethereum_wallet || '0x742d35Cc6634C0532925a3b844Bc9e7595f5b899'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; 
            } else if (payMeth === 'usdt') { 
                instructions = `<div class="bil-row"><p class="en">USDT: Send <strong>${priceText}</strong> USDT (TRC20) to wallet: <strong class="pay-ref">${this.settings.payDetails?.usdt_wallet || 'TN9mQPH3XDczWJbKJYxHG5PbR5MFF5Fxyz'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">USDT: أرسل <strong>${priceText}</strong> USDT (TRC20) إلى المحفظة: <strong class="pay-ref">${this.settings.payDetails?.usdt_wallet || 'TN9mQPH3XDczWJbKJYxHG5PbR5MFF5Fxyz'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; 
            } else if (payMeth === 'cod') { 
                instructions = `<div class="bil-row"><p class="en">COD: Our team will call <strong>${this.checkoutForm.customer_phone}</strong> to confirm. Total Amount Due <strong>${priceText}</strong>. Order ID: <strong class="pay-ref">${orderID}</strong>.</p><p class="ar">الدفع عند الاستلام: سيتصل بك الفريق على <strong>${this.checkoutForm.customer_phone}</strong> للتأكيد. المجموع الكلي للطلب <strong>${priceText}</strong>. رقم الطلب: <strong class="pay-ref">${orderID}</strong>.</p></div>`; 
            } 
            return instructions;
        },

        sendBusinessWhatsAppNotification(order) {
            // Format order details for WhatsApp
            const items = order.line_items.map(item => 
                `• ${item.name_en} x${item.quantity} = ${this.fmtPrice(item.price_egp_each * item.quantity)}`
            ).join('\n');
            
            const deliveryInfo = order.delivery_option === 'home_delivery' 
                ? `\n📍 Delivery to: ${order.delivery_address}\n🏙️ Area: ${order.delivery_city_id}` 
                : '\n📦 Self Pickup';
            
            const message = `🆕 *NEW ORDER ALERT!*\n\n` +
                `🔢 Order: #${order.order_id_text}\n` +
                `👤 Customer: ${order.customer_name}\n` +
                `📱 Phone: ${order.customer_phone}\n` +
                `✉️ Email: ${order.customer_email}\n` +
                `${deliveryInfo}\n\n` +
                `🛒 *Items:*\n${items}\n\n` +
                `💰 *Total: ${this.fmtPrice(order.total_amount_due_egp)}*\n` +
                `💳 Payment: ${order.payment_method}\n\n` +
                `⏰ Time: ${new Date().toLocaleString('en-EG')}`;
            
            // Open WhatsApp with pre-filled message
            const businessPhone = this.settings.businessWhatsApp || this.settings.waNumRaw;
            const whatsappUrl = `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`;
            
            // Open in new tab (business owner should keep this tab open)
            window.open(whatsappUrl, '_blank');
            
            // Also copy to clipboard for easy sharing
            navigator.clipboard.writeText(message).catch(() => {});
        },

        async submitStatValid() { 
            this.clrErr('lookupOrderId'); 
            if (!(this.lookupOrderID || "").trim()) { 
                this.setErr('lookupOrderId', 'required'); 
                this.$refs.lookupOrderIdInputModal?.focus(); 
                return; 
            } 
            await this.checkOrderStatus(); 
        },

        async checkOrderStatus() { 
            this.statRes = null; 
            this.statNotFound = false; 
            this.load.status = true; 
            this.apiError = null; 
            this.usrApiErr = ""; 
            const id = (this.lookupOrderID || "").trim();
            
            // Validate order ID format (alphanumeric, hyphens, underscores only)
            if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
                this.usrApiErr = "Invalid order ID format. Please check and try again.";
                this.statNotFound = true;
                this.load.status = false;
                return;
            }
            
            try { 
                // Use parameterized query to prevent SQL injection
                const result = await this.pb.collection('orders').getList(1, 1, {
                    filter: this.pb.filter('order_id_text = {:id}', { id: id })
                });
                if (result.items && result.items.length > 0) { 
                    const o = result.items[0]; 
                    this.statRes = { 
                        orderIdTxt: o.order_id_text, 
                        customer_name: o.customer_name, 
                        order_status: o.order_status?.replace(/_/g," ")||"N/A", 
                        payment_status: o.payment_status?.replace(/_/g, " ") || "N/A", 
                        line_items: o.line_items || [], 
                        total_amount_due_egp: o.total_amount_due_egp, 
                        payment_method: o.payment_method, 
                        delivery_option: o.delivery_option, 
                        delivery_address: o.delivery_address, 
                        delivery_area_name_en: o.delivery_area_name_en, 
                        delivery_area_name_ar: o.delivery_area_name_ar 
                    }; 
                } else { 
                    this.statNotFound = true; 
                    this.usrApiErr = "No order found with that ID."; 
                }
            } catch (e) { 
                this.apiError = String(e.message); 
                this.usrApiErr = "Could not get order status. Please check details or contact support."; 
                this.statNotFound = true; 
            } finally { 
                this.load.status = false; 
            }
        }
}));

    // Business Stats Component
    Alpine.data('businessStats', () => ({
        todayOrders: 0,
        todayRevenue: 0,
        activeCustomers: 0,
        popularItem: '-',
        pb: null,
        
        async init() {
            // Get pb instance from parent component
            this.pb = this.$root.pb || new PocketBase('/');
            await this.fetchTodayStats();
            // Disable auto-refresh to avoid overwhelming the server
            // setInterval(() => this.fetchTodayStats(), 30000);
        },
        
        async fetchTodayStats() {
            if (!this.pb || typeof PocketBase === 'undefined') return;
            
            try {
                const today = new Date().toISOString().split('T')[0];
                const orders = await this.pb.collection('orders').getList(1, 50, {
                    filter: `created >= '${today} 00:00:00'`,
                    sort: '-created'
                });
                
                this.todayOrders = orders.totalItems;
                this.todayRevenue = orders.items.reduce((sum, order) => sum + (order.total_amount_due_egp || 0), 0);
                
                const uniqueCustomers = new Set(orders.items.map(o => o.user || o.customer_email));
                this.activeCustomers = uniqueCustomers.size;
                
                const itemCounts = {};
                orders.items.forEach(order => {
                    if (order.line_items && Array.isArray(order.line_items)) {
                        order.line_items.forEach(item => {
                            const itemName = item.name_en || 'Unknown';
                            itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantity;
                        });
                    }
                });
                
                const topItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];
                this.popularItem = topItem ? topItem[0] : '-';
            } catch (error) {
                // console.error('Failed to fetch stats:', error);
                // Silently fail - stats are not critical
            }
        },
        
        fmtPrice(amount) {
            // Use parent component's fmtPrice method
            return this.$root.fmtPrice ? this.$root.fmtPrice(amount) : `${amount} EGP`;
        }
    }));
});

// Initialize after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const el = document.querySelector('[x-data="sheepLand"]');
        const app = el ? Alpine.$data(el) : null;
        if (!app) return;
        if (e.target.matches('input, textarea, select')) return;
        
        switch(e.key.toLowerCase()) {
            case 'c':
                if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    app.isCartOpen = !app.isCartOpen;
                }
                break;
            case 'o':
                if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    app.openOrderStatusModal();
                }
                break;
            case 'escape':
                if (app) {
                    app.isCartOpen = false;
                    app.isOrderStatusModalOpen = false;
                    app.isUdheyaConfigModalOpen = false;
                    app.showSearch = false;
                }
                break;
            case '/':
                if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    // Get Alpine component directly from the page
                    const el = document.querySelector('[x-data="sheepLand"]');
                    const alpineApp = el ? Alpine.$data(el) : null;
                    if (alpineApp) {
                        alpineApp.showSearch = true;
                        setTimeout(() => {
                            document.querySelector('.search-input-header')?.focus();
                        }, 100);
                    }
                }
                break;
        }
    });

    // Exit intent popup
    let exitIntentShown = false;
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0 && !exitIntentShown) {
            const el = document.querySelector('[x-data="sheepLand"]');
            const app = el ? Alpine.$data(el) : null;
            if (app && app.cartItems.length > 0 && !app.isCartOpen) {
                exitIntentShown = true;
                app.showExitOffer = true;
                setTimeout(() => app.showExitOffer = false, 10000);
            }
        }
    });

    // Social proof notifications - removed due to lack of real data

    // Removed unused features: prayer times, social proof, etc.
    // These features were not properly integrated and caused errors
});
