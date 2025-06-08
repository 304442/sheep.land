document.addEventListener('alpine:init', () => {
    // Constants
    const CONSTANTS = {
        DEFAULT_STOCK: 10,
        MIN_PASSWORD_LENGTH: 8,
        PHONE_REGEX: /^\+?[0-9]{7,15}$/,
        EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        DEBOUNCE_DELAY: 300,
        EXIT_OFFER_DURATION: 10000,
        CART_STORAGE_PREFIX: 'sheepLandCart-',
        ORDER_ID_LENGTH: 10
    };

    // Initial form states
    const initialCheckoutForm = {
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerCountry: "Egypt",
        deliveryOption: "self_pickup_or_internal_distribution",
        deliveryCityId: "",
        deliveryAddress: "",
        deliveryInstructions: "",
        deliveryTimeSlot: "9AM-11AM",
        paymentMethod: "vodafone_cash",
        termsAgreed: false,
        totalServiceFeeEgp: 0,
        deliveryFeeEgp: 0,
        onlinePaymentFeeAppliedEgp: 0,
        finalTotalEgp: 0,
        userId: null
    };

    const initialUdheyaConfig = {
        itemKey: null,
        serviceOption: "standard_service",
        sacrificeDay: "day1_10_dhul_hijjah",
        distribution: {
            choice: "me",
            splitOption: "",
            customSplitText: ""
        },
        isBuyNowIntent: false
    };

    // Payment methods configuration
    const paymentMethods = [
        { id: 'online_card', title: 'Online Payment', imgSrc: 'images/card_payment.svg' },
        { id: 'vodafone_cash', title: 'Vodafone Cash', imgSrc: 'images/vodafone_cash.png' },
        { id: 'instapay', title: 'InstaPay', imgSrc: 'images/instapay.svg' },
        { id: 'fawry', title: 'Fawry', imgSrc: 'images/fawry.svg' },
        { id: 'bank_transfer', title: 'Bank Transfer', imgSrc: 'images/bank_transfer_icon.svg' },
        { id: 'cod', title: 'Cash on Delivery', imgSrc: 'images/cod.svg' }
    ];

    // Sacrifice day mappings
    const sacrificeDayMap = {
        "day1_10_dhul_hijjah": { en: "Day 1 of Eid (10th Dhul Hijjah)", ar: "اليوم الأول (10 ذو الحجة)" },
        "day2_11_dhul_hijjah": { en: "Day 2 of Eid (11th Dhul Hijjah)", ar: "اليوم الثاني (11 ذو الحجة)" },
        "day3_12_dhul_hijjah": { en: "Day 3 of Eid (12th Dhul Hijjah)", ar: "اليوم الثالث (12 ذو الحجة)" },
        "day4_13_dhul_hijjah": { en: "Day 4 of Eid (13th Dhul Hijjah)", ar: "اليوم الرابع (13 ذو الحجة)" }
    };

    // Error messages
    const errorMessages = {
        required: { en: "This field is required.", ar: "هذا الحقل مطلوب." },
        email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." },
        phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." },
        termsAgreed: { en: "You must agree to the terms and refund policy.", ar: "يجب أن توافق على الشروط وسياسة الاسترداد." },
        stock: { en: "Insufficient stock available.", ar: "المخزون المتاح غير كافٍ." },
        generic: { en: "An error occurred. Please try again.", ar: "حدث خطأ. يرجى المحاولة مرة أخرى." }
    };

    // Utility functions
    const utils = {
        sanitizeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },
        
        generateOrderId() {
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 7).toUpperCase();
            return `${timestamp}-${random}`;
        },
        
        isValidEmail(email) {
            return email && CONSTANTS.EMAIL_REGEX.test(email.trim());
        },
        
        isValidPhone(phone) {
            return phone && CONSTANTS.PHONE_REGEX.test(phone.trim().replace(/[\s()-]/g, ''));
        },
        
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func.apply(this, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        safeParseJson(str, fallback = null) {
            try {
                return JSON.parse(str);
            } catch {
                return fallback;
            }
        },
        
        safeLocalStorage: {
            getItem(key) {
                try {
                    return localStorage.getItem(key);
                } catch {
                    return null;
                }
            },
            setItem(key, value) {
                try {
                    localStorage.setItem(key, value);
                    return true;
                } catch {
                    console.error('LocalStorage quota exceeded');
                    return false;
                }
            },
            removeItem(key) {
                try {
                    localStorage.removeItem(key);
                    return true;
                } catch {
                    return false;
                }
            }
        }
    };

    // Main Alpine component
    Alpine.data('sheepLand', () => ({
        // Loading states
        loading: {
            init: true,
            status: false,
            checkout: false,
            auth: false,
            orders: false,
            addingToCart: null
        },

        // Application settings
        settings: {
            exchangeRates: {
                EGP: { rateFromEgp: 1, symbol: "LE", isActive: true }
            },
            defaultCurrency: "EGP",
            whatsappNumberRaw: "",
            whatsappNumberDisplay: "",
            promoEndDate: null,
            promoDiscountPercent: 0,
            promoActive: false,
            serviceFeeEgp: 0,
            deliveryAreas: [],
            paymentDetails: {},
            enableUdheyaSection: true,
            enableLivesheepSection: true,
            enableMeatSection: true,
            enableGatheringsSection: true,
            slaughterLocationUrl: "",
            onlinePaymentFeeEgp: 0,
            refundPolicyHtml: "<p>Loading policy...</p>",
            emailSenderAddress: "noreply@sheepland.eg",
            emailSenderName: "Sheep Land",
            siteTitleEn: "Sheep Land",
            siteTitleAr: "أرض الأغنام",
            siteDescriptionEn: "Premium live sheep & Udheya",
            siteDescriptionAr: "مواشي وأضاحي فاخرة"
        },

        // Product options
        productOptions: {
            udheya: [],
            livesheep: [],
            meat: [],
            gatherings: []
        },

        // UI state
        ui: {
            selectedBaladiSize: '',
            selectedBarkiSize: '',
            selectedMeatWeights: {},
            searchQuery: '',
            showSearch: false,
            showExitOffer: false,
            isMobileNavOpen: false,
            isCartOpen: false,
            isRefundModalOpen: false,
            isOrderStatusModalOpen: false,
            isUdheyaConfigModalOpen: false,
            currentPage: 'home',
            currentLanguage: 'en'
        },

        // Cart state
        cart: {
            items: [],
            currency: "EGP"
        },

        // Countdown state
        countdown: {
            days: "00",
            hours: "00",
            minutes: "00",
            seconds: "00",
            ended: false,
            timer: null
        },

        // Forms
        checkoutForm: { ...initialCheckoutForm },
        tempUdheyaConfig: { ...initialUdheyaConfig },

        // Error handling
        errors: {
            api: null,
            user: "",
            fields: {}
        },

        // User state
        auth: {
            currentUser: null,
            form: {
                email: "",
                password: "",
                passwordConfirm: "",
                name: "",
                phone: "",
                country: "Egypt",
                view: 'login'
            },
            redirectAfterLogin: null
        },

        // Order state
        orders: {
            userOrders: [],
            lookupOrderId: "",
            statusResult: null,
            statusNotFound: false,
            confirmation: {
                show: false,
                orderId: "",
                totalEgp: 0,
                items: [],
                paymentInstructions: "",
                customerEmail: ""
            }
        },

        // Other state
        allCities: [],
        isDeliveryFeeVariable: false,
        configuringUdheyaItem: null,
        exitIntentShown: false,
        pocketbase: null,

        // Getters
        get cartItemCount() {
            return this.cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        },

        get availablePaymentMethods() {
            return paymentMethods;
        },

        get sacrificeDayOptions() {
            return sacrificeDayMap;
        },

        get deliveryTimeSlots() {
            return [
                { value: "9AM-11AM", label: "9 AM - 11 AM" },
                { value: "11AM-1PM", label: "11 AM - 1 PM" },
                { value: "1PM-3PM", label: "1 PM - 3 PM" },
                { value: "3PM-5PM", label: "3 PM - 5 PM" },
                { value: "5PM-7PM", label: "5 PM - 7 PM" },
                { value: "7PM-9PM", label: "7 PM - 9 PM" }
            ];
        },

        get filteredProducts() {
            const query = this.ui.searchQuery.toLowerCase().trim();
            if (!query || query.length < 2) return {};

            const filtered = {};
            Object.entries(this.productOptions).forEach(([category, products]) => {
                const matches = products.filter(product => {
                    const searchableText = [
                        product.nameEn,
                        product.nameAr,
                        product.descriptionEn,
                        product.descriptionAr
                    ].join(' ').toLowerCase();
                    return searchableText.includes(query);
                });
                if (matches.length > 0) {
                    filtered[category] = matches;
                }
            });
            return filtered;
        },

        // Initialization
        async initApp() {
            this.loading.init = true;
            
            try {
                // Ensure PocketBase is available
                if (typeof PocketBase === 'undefined') {
                    throw new Error('PocketBase library not loaded');
                }
                
                this.pocketbase = new PocketBase('/');
                
                // Restore user session
                if (this.pocketbase.authStore.isValid && this.pocketbase.authStore.model) {
                    this.auth.currentUser = this.pocketbase.authStore.model;
                } else {
                    this.pocketbase.authStore.clear();
                    this.auth.currentUser = null;
                }
                
                // Load cart
                this.loadCartFromStorage();
                
                // Determine current page
                this.determineCurrentPageFromUrl();
                
                // Load settings and products
                await this.loadSettings();
                await this.loadProducts();
                
                // Setup page-specific initialization
                this.initializePage();
                
                // Start countdown if active
                this.startCountdown();
                
                // Setup event listeners
                this.setupEventListeners();
                
            } catch (error) {
                console.error('Initialization error:', error);
                this.errors.api = error.message;
                this.errors.user = "Failed to initialize application. Please refresh the page.";
            } finally {
                this.loading.init = false;
            }
        },

        async loadSettings() {
            try {
                const settings = await this.pocketbase.collection('settings').getFirstListItem('id != ""');
                
                if (settings) {
                    // Safely merge settings
                    this.settings = {
                        ...this.settings,
                        exchangeRates: settings.xchgRates || this.settings.exchangeRates,
                        defaultCurrency: settings.defCurr || this.settings.defaultCurrency,
                        whatsappNumberRaw: settings.waNumRaw || "",
                        whatsappNumberDisplay: settings.waNumDisp || "",
                        promoEndDate: settings.promoEndISO ? new Date(settings.promoEndISO) : null,
                        promoDiscountPercent: Number(settings.promoDiscPc) || 0,
                        promoActive: Boolean(settings.promoActive),
                        serviceFeeEgp: Number(settings.servFeeEGP) || 0,
                        deliveryAreas: Array.isArray(settings.delAreas) ? settings.delAreas : [],
                        paymentDetails: settings.payDetails || {},
                        enableUdheyaSection: Boolean(settings.enable_udheya_section),
                        enableLivesheepSection: Boolean(settings.enable_livesheep_section),
                        enableMeatSection: Boolean(settings.enable_meat_section),
                        enableGatheringsSection: Boolean(settings.enable_gatherings_section),
                        slaughterLocationUrl: settings.slaughter_location_gmaps_url || "",
                        onlinePaymentFeeEgp: Number(settings.online_payment_fee_egp) || 0,
                        refundPolicyHtml: settings.refund_policy_html || this.getDefaultRefundPolicy(),
                        emailSenderAddress: settings.app_email_sender_address || "noreply@sheepland.eg",
                        emailSenderName: settings.app_email_sender_name || "Sheep Land",
                        siteTitleEn: settings.site_title_en || "Sheep Land",
                        siteTitleAr: settings.site_title_ar || "أرض الأغنام",
                        siteDescriptionEn: settings.site_desc_en || "Premium live sheep & Udheya",
                        siteDescriptionAr: settings.site_desc_ar || "مواشي وأضاحي فاخرة"
                    };
                    
                    // Process delivery areas
                    this.processDeliveryAreas();
                }
                
                this.cart.currency = this.settings.defaultCurrency;
                
            } catch (error) {
                console.error('Failed to load settings:', error);
                // Continue with defaults
            }
        },

        async loadProducts() {
            try {
                const products = await this.pocketbase.collection('products').getList(1, 500, {
                    filter: 'is_active = true',
                    sort: '+sort_order_type,+sort_order_variant'
                });
                
                this.categorizeProducts(products.items);
                
            } catch (error) {
                console.error('Failed to load products:', error);
                this.errors.user = "Failed to load products. Please refresh the page.";
            }
        },

        categorizeProducts(products) {
            const categories = {
                udheya: [],
                livesheep: [],
                meat: [],
                gatherings: []
            };
            
            products.forEach(product => {
                const category = this.mapProductCategory(product.product_category);
                if (category && categories[category]) {
                    categories[category].push(this.normalizeProduct(product));
                }
            });
            
            this.productOptions = categories;
        },

        mapProductCategory(category) {
            const mapping = {
                'udheya': 'udheya',
                'livesheep_general': 'livesheep',
                'meat_cuts': 'meat',
                'gathering_package': 'gatherings'
            };
            return mapping[category] || null;
        },

        normalizeProduct(product) {
            return {
                itemKey: product.item_key || product.id,
                variantId: product.id,
                nameEn: product.variant_name_en || product.type_name_en || '',
                nameAr: product.variant_name_ar || product.type_name_ar || '',
                descriptionEn: product.type_description_en || '',
                descriptionAr: product.type_description_ar || '',
                weightRangeEn: product.weight_range_text_en || '',
                weightRangeAr: product.weight_range_text_ar || '',
                averageWeight: Number(product.avg_weight_kg) || 0,
                priceEgp: Number(product.base_price_egp) || 0,
                pricePerKg: Number(product.price_per_kg_egp) || 0,
                stock: Number(product.stock_available_pb) || 0,
                isActive: Boolean(product.is_active),
                isPremium: Boolean(product.is_premium),
                originFarm: product.origin_farm || '',
                productCategory: product.product_category,
                typeKey: product.type_key,
                breedInfoEn: product.breed_info_en || '',
                breedInfoAr: product.breed_info_ar || ''
            };
        },

        processDeliveryAreas() {
            const cities = [];
            
            this.settings.deliveryAreas.forEach(governorate => {
                if (Array.isArray(governorate.cities) && governorate.cities.length > 0) {
                    governorate.cities.forEach(city => {
                        cities.push({
                            id: `${governorate.id}_${city.id}`,
                            nameEn: `${governorate.name_en} - ${city.name_en}`,
                            nameAr: `${governorate.name_ar} - ${city.name_ar}`,
                            deliveryFeeEgp: Number(city.delivery_fee_egp) || null,
                            governorateId: governorate.id
                        });
                    });
                } else if (governorate.delivery_fee_egp !== undefined) {
                    cities.push({
                        id: governorate.id,
                        nameEn: governorate.name_en || '',
                        nameAr: governorate.name_ar || '',
                        deliveryFeeEgp: Number(governorate.delivery_fee_egp) || null,
                        governorateId: governorate.id
                    });
                }
            });
            
            this.allCities = cities.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
        },

        setupEventListeners() {
            // Cleanup function
            this.cleanup = () => {
                if (this.countdown.timer) {
                    clearInterval(this.countdown.timer);
                }
                this.removeKeyboardShortcuts();
                this.removeExitIntent();
            };
            
            // Add event listeners
            window.addEventListener('hashchange', () => this.determineCurrentPageFromUrl());
            this.setupKeyboardShortcuts();
            this.setupExitIntent();
        },

        setupKeyboardShortcuts() {
            this.keyboardHandler = (e) => {
                if (e.target.matches('input, textarea, select')) return;
                
                switch(e.key.toLowerCase()) {
                    case 'c':
                        if (!e.metaKey && !e.ctrlKey) {
                            e.preventDefault();
                            this.ui.isCartOpen = !this.ui.isCartOpen;
                        }
                        break;
                    case 'o':
                        if (!e.metaKey && !e.ctrlKey) {
                            e.preventDefault();
                            this.openOrderStatusModal();
                        }
                        break;
                    case 'escape':
                        this.closeAllModals();
                        break;
                    case '/':
                        if (!e.metaKey && !e.ctrlKey) {
                            e.preventDefault();
                            this.ui.showSearch = true;
                            this.$nextTick(() => {
                                document.querySelector('.search-input-header')?.focus();
                            });
                        }
                        break;
                }
            };
            
            document.addEventListener('keydown', this.keyboardHandler);
        },

        removeKeyboardShortcuts() {
            if (this.keyboardHandler) {
                document.removeEventListener('keydown', this.keyboardHandler);
            }
        },

        setupExitIntent() {
            this.exitIntentHandler = (e) => {
                if (e.clientY <= 0 && !this.exitIntentShown && this.cart.items.length > 0 && !this.ui.isCartOpen) {
                    this.exitIntentShown = true;
                    this.ui.showExitOffer = true;
                    setTimeout(() => {
                        this.ui.showExitOffer = false;
                    }, CONSTANTS.EXIT_OFFER_DURATION);
                }
            };
            
            document.addEventListener('mouseleave', this.exitIntentHandler);
        },

        removeExitIntent() {
            if (this.exitIntentHandler) {
                document.removeEventListener('mouseleave', this.exitIntentHandler);
            }
        },

        closeAllModals() {
            this.ui.isCartOpen = false;
            this.ui.isOrderStatusModalOpen = false;
            this.ui.isUdheyaConfigModalOpen = false;
            this.ui.isRefundModalOpen = false;
            this.ui.showSearch = false;
            document.body.classList.remove('overflow-hidden');
        },

        determineCurrentPageFromUrl() {
            const hash = window.location.hash.replace(/^#/, '');
            const validPages = ['home', 'udheya', 'livesheep', 'meat', 'gatherings', 'checkout', 'auth', 'account'];
            const page = hash.split('?')[0];
            
            if (page && validPages.includes(page)) {
                this.ui.currentPage = page;
            } else {
                this.ui.currentPage = 'home';
            }
            
            this.updatePageSpecifics();
        },

        updatePageSpecifics() {
            // Reset order confirmation if not on checkout
            if (this.ui.currentPage !== 'checkout' && this.orders.confirmation.show) {
                this.orders.confirmation = {
                    show: false,
                    orderId: "",
                    totalEgp: 0,
                    items: [],
                    paymentInstructions: "",
                    customerEmail: ""
                };
            }
            
            this.initializePage();
            this.scrollToTop();
        },

        initializePage() {
            switch(this.ui.currentPage) {
                case 'checkout':
                    this.initCheckoutPage();
                    break;
                case 'auth':
                    this.initAuthPage();
                    break;
                case 'account':
                    this.initAccountPage();
                    break;
                default:
                    this.calculateFinalTotal();
            }
        },

        scrollToTop() {
            this.$nextTick(() => {
                const mainContent = document.querySelector(`main > section[x-show*="${this.ui.currentPage}"]`);
                if (mainContent) {
                    const headerOffset = document.querySelector('.site-head')?.offsetHeight || 0;
                    window.scrollTo({
                        top: mainContent.offsetTop - headerOffset - 10,
                        behavior: 'smooth'
                    });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        },

        navigateTo(page, anchor = null) {
            if (page.startsWith('#')) {
                anchor = page.substring(1);
                page = this.ui.currentPage;
            }
            
            const pageName = page.split('?')[0];
            
            if (this.ui.currentPage !== pageName) {
                this.ui.currentPage = pageName;
                window.location.hash = page;
            } else if (anchor) {
                const element = document.getElementById(anchor);
                if (element) {
                    const headerOffset = document.querySelector('.site-head')?.offsetHeight || 0;
                    window.scrollTo({
                        top: element.getBoundingClientRect().top + window.pageYOffset - headerOffset - 10,
                        behavior: 'smooth'
                    });
                }
            } else {
                this.scrollToTop();
            }
        },

        pageTitle() {
            const titles = {
                home: this.settings.siteTitleEn || "Sheep Land",
                udheya: "Premium Udheya Collection",
                livesheep: "Live Sheep",
                meat: "Fresh Meat & Cuts",
                gatherings: "Event & Gathering Packages",
                checkout: "Secure Checkout",
                auth: "Account Access",
                account: "My Account"
            };
            return titles[this.ui.currentPage] || titles.home;
        },

        getDefaultRefundPolicy() {
            return `<div class="bil-row">
                <p class="en">Welcome to Sheep Land. Please read our policy carefully.</p>
                <p class="ar" dir="rtl">مرحباً بكم في أرض الأغنام. يرجى قراءة سياستنا بعناية.</p>
            </div>`;
        },

        // Cart management
        openCart() {
            this.ui.isCartOpen = true;
            document.body.classList.add('overflow-hidden');
        },

        closeCart() {
            this.ui.isCartOpen = false;
            document.body.classList.remove('overflow-hidden');
        },

        addItemToCart(product, udheyaConfig = null) {
            if (!product || !product.itemKey) {
                this.showError('Invalid product');
                return;
            }
            
            if (product.stock <= 0) {
                this.showError('This item is out of stock', 'stock');
                return;
            }
            
            this.loading.addingToCart = product.itemKey;
            
            try {
                const isUdheya = product.productCategory === 'udheya';
                const existingIndex = this.cart.items.findIndex(item => item.itemKey === product.itemKey);
                
                if (existingIndex > -1) {
                    if (isUdheya) {
                        this.showError('This Udheya is already in your cart');
                        return;
                    }
                    
                    const existingItem = this.cart.items[existingIndex];
                    if (existingItem.quantity >= product.stock) {
                        this.showError('Stock limit reached', 'stock');
                        return;
                    }
                    
                    existingItem.quantity++;
                } else {
                    const newItem = {
                        ...product,
                        quantity: 1,
                        uniqueId: utils.generateOrderId()
                    };
                    
                    if (isUdheya && udheyaConfig) {
                        newItem.udheyaDetails = { ...udheyaConfig };
                    }
                    
                    this.cart.items.push(newItem);
                }
                
                this.saveCartToStorage();
                this.calculateFinalTotal();
                this.showSuccess(`${product.nameEn} added to cart`);
                
                if (this.ui.isUdheyaConfigModalOpen && udheyaConfig && !udheyaConfig.isBuyNowIntent) {
                    this.closeUdheyaConfiguration();
                }
                
            } finally {
                this.loading.addingToCart = null;
            }
        },

        async buyNow(product, udheyaConfig = null) {
            if (!product || !product.itemKey || product.stock <= 0) {
                this.showError('This item is not available');
                return;
            }
            
            this.loading.addingToCart = product.itemKey;
            
            try {
                const buyNowItem = {
                    ...product,
                    quantity: 1,
                    uniqueId: utils.generateOrderId()
                };
                
                if (product.productCategory === 'udheya') {
                    if (!udheyaConfig) {
                        this.openUdheyaConfiguration(product, true);
                        return;
                    }
                    buyNowItem.udheyaDetails = { ...udheyaConfig };
                }
                
                if (!utils.safeLocalStorage.setItem('sheepLandBuyNowItem', JSON.stringify(buyNowItem))) {
                    this.showError('Could not proceed with Buy Now. Please try adding to cart.');
                    return;
                }
                
                if (this.ui.isUdheyaConfigModalOpen) {
                    this.closeUdheyaConfiguration();
                }
                
                this.navigateTo('checkout?buyNow=true');
                
            } finally {
                this.loading.addingToCart = null;
            }
        },

        removeFromCart(uniqueId) {
            this.cart.items = this.cart.items.filter(item => item.uniqueId !== uniqueId);
            this.saveCartToStorage();
            this.calculateFinalTotal();
        },

        updateCartQuantity(uniqueId, newQuantity) {
            const itemIndex = this.cart.items.findIndex(item => item.uniqueId === uniqueId);
            if (itemIndex === -1) return;
            
            const item = this.cart.items[itemIndex];
            const quantity = Math.max(1, parseInt(newQuantity) || 1);
            
            if (item.productCategory === 'udheya' && quantity > 1) {
                this.showError('Only one of each Udheya can be added');
                item.quantity = 1;
            } else if (quantity <= item.stock) {
                item.quantity = quantity;
            } else {
                item.quantity = item.stock;
                this.showError('Requested quantity exceeds available stock', 'stock');
            }
            
            this.saveCartToStorage();
            this.calculateFinalTotal();
        },

        getSubtotalForItem(item) {
            if (!item) return 0;
            
            let subtotal = item.priceEgp * item.quantity;
            
            if (item.productCategory === 'udheya' && item.udheyaDetails?.serviceOption === 'standard_service') {
                subtotal += this.settings.serviceFeeEgp;
            }
            
            return subtotal;
        },

        calculateCartSubtotal() {
            return this.cart.items.reduce((total, item) => {
                return total + (item.priceEgp * item.quantity);
            }, 0);
        },

        calculateTotalServiceFee() {
            return this.cart.items.reduce((total, item) => {
                if (item.productCategory === 'udheya' && item.udheyaDetails?.serviceOption === 'standard_service') {
                    return total + this.settings.serviceFeeEgp;
                }
                return total;
            }, 0);
        },

        calculateCartTotal() {
            return this.calculateCartSubtotal() + this.calculateTotalServiceFee();
        },

        saveCartToStorage() {
            const cartKey = CONSTANTS.CART_STORAGE_PREFIX + (this.auth.currentUser?.id || 'guest');
            utils.safeLocalStorage.setItem(cartKey, JSON.stringify(this.cart.items));
        },

        loadCartFromStorage() {
            const cartKey = CONSTANTS.CART_STORAGE_PREFIX + (this.auth.currentUser?.id || 'guest');
            const storedCart = utils.safeLocalStorage.getItem(cartKey);
            
            if (storedCart) {
                this.cart.items = utils.safeParseJson(storedCart, []);
            } else {
                this.cart.items = [];
            }
            
            this.calculateFinalTotal();
        },

        clearCart() {
            this.cart.items = [];
            this.saveCartToStorage();
            this.calculateFinalTotal();
        },

        // Udheya configuration
        openUdheyaConfiguration(item, isBuyNowIntent = false) {
            if (!item || !item.isActive || item.stock <= 0) {
                this.showError('This Udheya is not available');
                return;
            }
            
            this.configuringUdheyaItem = { ...item };
            this.tempUdheyaConfig = { ...initialUdheyaConfig };
            this.tempUdheyaConfig.itemKey = item.itemKey;
            this.tempUdheyaConfig.isBuyNowIntent = isBuyNowIntent;
            
            this.ui.isUdheyaConfigModalOpen = true;
            document.body.classList.add('overflow-hidden');
        },

        closeUdheyaConfiguration() {
            this.ui.isUdheyaConfigModalOpen = false;
            this.configuringUdheyaItem = null;
            this.clearFieldErrors(['udheya_service_config', 'udheya_sacrifice_day_config', 
                                 'udheya_distribution_choice_config', 'udheya_split_option_config']);
            document.body.classList.remove('overflow-hidden');
        },

        confirmUdheyaConfiguration() {
            if (!this.configuringUdheyaItem) return;
            
            const errors = this.validateUdheyaConfig(this.tempUdheyaConfig);
            if (errors.length > 0) {
                errors.forEach(error => this.setFieldError(error.field, error.message));
                return;
            }
            
            if (this.tempUdheyaConfig.isBuyNowIntent) {
                this.buyNow(this.configuringUdheyaItem, this.tempUdheyaConfig);
            } else {
                this.addItemToCart(this.configuringUdheyaItem, this.tempUdheyaConfig);
            }
        },

        validateUdheyaConfig(config) {
            const errors = [];
            
            if (!config.serviceOption) {
                errors.push({ field: 'udheya_service_config', message: 'required' });
            }
            
            if (config.serviceOption === 'standard_service' && !config.sacrificeDay) {
                errors.push({ field: 'udheya_sacrifice_day_config', message: 'required' });
            }
            
            if (!config.distribution.choice) {
                errors.push({ field: 'udheya_distribution_choice_config', message: 'required' });
            }
            
            if (config.distribution.choice === 'split') {
                if (!config.distribution.splitOption) {
                    errors.push({ field: 'udheya_split_option_config', message: 'required' });
                }
                
                if (config.distribution.splitOption === 'custom' && !config.distribution.customSplitText.trim()) {
                    errors.push({ 
                        field: 'udheya_split_option_config', 
                        message: { 
                            en: 'Please specify custom split details.', 
                            ar: 'يرجى تحديد تفاصيل التقسيم المخصصة.' 
                        }
                    });
                }
            }
            
            return errors;
        },

        getUdheyaConfigErrorText() {
            const errorFields = ['udheya_service_config', 'udheya_sacrifice_day_config', 
                               'udheya_distribution_choice_config', 'udheya_split_option_config'];
            
            for (const field of errorFields) {
                if (this.errors.fields[field]) {
                    const error = this.errors.fields[field];
                    return this.ui.currentLanguage === 'ar' ? error.ar : error.en;
                }
            }
            
            return '';
        },

        // Modal management
        openRefundModal() {
            this.ui.isRefundModalOpen = true;
            document.body.classList.add('overflow-hidden');
        },

        closeRefundModal() {
            this.ui.isRefundModalOpen = false;
            document.body.classList.remove('overflow-hidden');
        },

        openOrderStatusModal() {
            this.ui.isOrderStatusModalOpen = true;
            document.body.classList.add('overflow-hidden');
            this.$nextTick(() => this.$refs.lookupOrderIdInput?.focus());
        },

        closeOrderStatusModal() {
            this.ui.isOrderStatusModalOpen = false;
            document.body.classList.remove('overflow-hidden');
            this.orders.lookupOrderId = '';
            this.orders.statusResult = null;
            this.orders.statusNotFound = false;
            this.clearFieldError('lookupOrderId');
        },

        // Countdown management
        startCountdown() {
            if (this.countdown.timer) {
                clearInterval(this.countdown.timer);
            }
            
            if (!this.settings.promoActive || !this.settings.promoEndDate) {
                this.countdown.ended = true;
                return;
            }
            
            const endTime = this.settings.promoEndDate.getTime();
            if (isNaN(endTime)) {
                this.countdown.ended = true;
                return;
            }
            
            this.updateCountdownDisplay(endTime);
            this.countdown.timer = setInterval(() => this.updateCountdownDisplay(endTime), 1000);
        },

        updateCountdownDisplay(endTime) {
            const now = Date.now();
            const diff = endTime - now;
            
            if (diff <= 0) {
                if (this.countdown.timer) {
                    clearInterval(this.countdown.timer);
                }
                this.countdown.days = "00";
                this.countdown.hours = "00";
                this.countdown.minutes = "00";
                this.countdown.seconds = "00";
                this.countdown.ended = true;
                return;
            }
            
            this.countdown.ended = false;
            this.countdown.days = String(Math.floor(diff / 86400000)).padStart(2, '0');
            this.countdown.hours = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
            this.countdown.minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
            this.countdown.seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        },

        // Price formatting
        formatPrice(price, currency = null) {
            const curr = currency || this.cart.currency;
            const rate = this.settings.exchangeRates[curr];
            
            if (price == null || !rate || typeof rate.rateFromEgp !== 'number') {
                return `${rate?.symbol || (curr === 'EGP' ? 'LE' : curr)} ---`;
            }
            
            const convertedPrice = price * rate.rateFromEgp;
            const decimals = ['LE', 'ل.م', 'EGP', '€'].includes(rate.symbol || curr) ? 0 : 2;
            
            return `${rate.symbol || (curr === 'EGP' ? 'LE' : curr)} ${convertedPrice.toFixed(decimals)}`;
        },

        // Product specific methods
        getBaladiPrice() {
            const prices = { small: 4500, medium: 5500, large: 6500 };
            return prices[this.ui.selectedBaladiSize] || 0;
        },

        getBarkiPrice() {
            const prices = { small: 5000, medium: 6000, large: 7000 };
            return prices[this.ui.selectedBarkiSize] || 0;
        },

        getBaladiProduct() {
            if (!this.ui.selectedBaladiSize) return null;
            
            const weights = { small: '25-30', medium: '30-35', large: '35-40' };
            const size = this.ui.selectedBaladiSize;
            
            return {
                itemKey: `baladi_${size}`,
                variantId: `baladi_${size}`,
                nameEn: `Baladi Sheep - ${size.charAt(0).toUpperCase() + size.slice(1)}`,
                nameAr: `خروف بلدي - ${size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : 'كبير'}`,
                weightRangeEn: `${weights[size]} kg`,
                weightRangeAr: `${weights[size]} كجم`,
                priceEgp: this.getBaladiPrice(),
                stock: CONSTANTS.DEFAULT_STOCK,
                isActive: true,
                productCategory: 'udheya'
            };
        },

        getBarkiProduct() {
            if (!this.ui.selectedBarkiSize) return null;
            
            const weights = { small: '25-30', medium: '30-35', large: '35-40' };
            const size = this.ui.selectedBarkiSize;
            
            return {
                itemKey: `barki_${size}`,
                variantId: `barki_${size}`,
                nameEn: `Barki Sheep - ${size.charAt(0).toUpperCase() + size.slice(1)}`,
                nameAr: `خروف برقي - ${size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : 'كبير'}`,
                weightRangeEn: `${weights[size]} kg`,
                weightRangeAr: `${weights[size]} كجم`,
                priceEgp: this.getBarkiPrice(),
                stock: CONSTANTS.DEFAULT_STOCK,
                isActive: true,
                productCategory: 'udheya'
            };
        },

        getMeatPrice(item) {
            if (!item) return 0;
            const weight = this.ui.selectedMeatWeights[item.itemKey] || 1;
            const pricePerKg = item.pricePerKg || item.priceEgp || 0;
            return pricePerKg * weight;
        },

        getMeatItemWithWeight(item, sectionKey) {
            if (!item || sectionKey !== 'meat') return item;
            
            const weight = this.ui.selectedMeatWeights[item.itemKey] || 1;
            
            return {
                ...item,
                nameEn: `${item.nameEn} - ${weight} kg`,
                nameAr: `${item.nameAr} - ${weight} كجم`,
                priceEgp: this.getMeatPrice(item),
                selectedWeight: weight
            };
        },

        // Search functionality
        toggleSearch() {
            this.ui.showSearch = !this.ui.showSearch;
            if (this.ui.showSearch) {
                this.$nextTick(() => this.$refs.searchInput?.focus());
            }
        },

        // Stock display
        getStockDisplayInfo(stock, isActive, lang = null) {
            const language = lang || this.ui.currentLanguage;
            
            if (!isActive) {
                return language === 'ar' ? "غير نشط" : "Inactive";
            }
            
            if (stock == null || stock <= 0) {
                return language === 'ar' ? "نفذ المخزون" : "Out of Stock";
            }
            
            if (stock <= 5) {
                return language === 'ar' ? `متوفر: ${stock} (كمية محدودة)` : `${stock} Available (Limited)`;
            }
            
            return language === 'ar' ? `متوفر: ${stock}` : `${stock} Available`;
        },

        // Error handling
        setFieldError(field, message, isUserError = true) {
            const errorMsg = typeof message === 'string' 
                ? (errorMessages[message] || { en: message, ar: message })
                : message;
            
            this.errors.fields[field] = errorMsg;
            
            if (isUserError && typeof errorMsg === 'object') {
                this.errors.user = this.ui.currentLanguage === 'ar' ? errorMsg.ar : errorMsg.en;
            } else if (isUserError) {
                this.errors.user = String(errorMsg);
            }
        },

        clearFieldError(field) {
            delete this.errors.fields[field];
            
            if (!Object.keys(this.errors.fields).length) {
                this.errors.user = "";
                this.errors.api = null;
            }
        },

        clearFieldErrors(fields) {
            fields.forEach(field => this.clearFieldError(field));
        },

        clearAllErrors() {
            this.errors = {
                api: null,
                user: "",
                fields: {}
            };
        },

        showError(message, type = 'generic') {
            const errorMsg = errorMessages[type] || errorMessages.generic;
            this.errors.user = this.ui.currentLanguage === 'ar' ? errorMsg.ar : errorMsg.en;
            
            if (message && typeof message === 'string') {
                this.errors.user = message;
            }
            
            setTimeout(() => {
                this.errors.user = "";
            }, 5000);
        },

        showSuccess(message) {
            // Implement success message display
            console.log('Success:', message);
        },

        // Focus management
        focusElement(ref, shouldScroll = true) {
            this.$nextTick(() => {
                const element = this.$refs[ref];
                if (element) {
                    element.focus({ preventScroll: !shouldScroll });
                    
                    if (shouldScroll) {
                        setTimeout(() => {
                            try {
                                element.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                    inline: 'nearest'
                                });
                            } catch (error) {
                                console.warn("ScrollIntoView failed for:", ref, error);
                            }
                        }, 50);
                    }
                }
            });
        },

        // Distribution options
        distributionOptions() {
            return [
                { value: 'me', textEn: 'Deliver All to Me', textAr: 'توصيل الكل لي' },
                { value: 'char', textEn: 'Donate All (Charity Distribution)', textAr: 'تبرع بالكل (توزيع خيري)' },
                { value: 'split', textEn: 'Split Between Me & Charity', textAr: 'تقسيم بيني وبين الخير' }
            ];
        },

        splitOptionsList() {
            return [
                { value: '1/3_me_2/3_charity', textEn: '1/3 for me, 2/3 charity', textAr: 'ثلث لي، ثلثان صدقة' },
                { value: '1/2_me_1/2_charity', textEn: '1/2 for me, 1/2 charity', textAr: 'نصف لي، نصف صدقة' },
                { value: '2/3_me_1/3_charity', textEn: '2/3 for me, 1/3 charity', textAr: 'ثلثان لي، ثلث صدقة' },
                { value: 'all_me_custom_distro', textEn: 'All for me (I will distribute)', textAr: 'الكل لي (سأوزع بنفسي)' },
                { value: 'custom', textEn: 'Custom (Specify)', textAr: 'مخصص (حدد)' }
            ];
        },

        // Auth page
        initAuthPage() {
            this.clearAllErrors();
            
            if (this.auth.currentUser?.id) {
                this.navigateTo('account');
                return;
            }
            
            this.auth.form.view = 'login';
        },

        async loginUser() {
            this.clearAllErrors();
            this.loading.auth = true;
            
            try {
                const authData = await this.pocketbase.collection('users').authWithPassword(
                    this.auth.form.email,
                    this.auth.form.password
                );
                
                this.auth.currentUser = authData.record;
                this.checkoutForm.userId = this.auth.currentUser?.id || null;
                this.loadCartFromStorage();
                
                this.navigateTo(this.auth.redirectAfterLogin || 'account');
                this.auth.redirectAfterLogin = null;
                
            } catch (error) {
                this.setFieldError('auth_login', {
                    en: 'Login failed. Please check credentials.',
                    ar: 'فشل الدخول. تحقق من البيانات.'
                });
            } finally {
                this.loading.auth = false;
            }
        },

        async registerUser() {
            this.clearAllErrors();
            this.loading.auth = true;
            
            const validationErrors = this.validateRegistration();
            if (validationErrors.length > 0) {
                validationErrors.forEach(error => this.setFieldError(error.field, error.message));
                this.loading.auth = false;
                return;
            }
            
            try {
                const userData = {
                    email: this.auth.form.email,
                    password: this.auth.form.password,
                    passwordConfirm: this.auth.form.passwordConfirm,
                    name: this.auth.form.name,
                    phone: this.auth.form.phone,
                    country: this.auth.form.country,
                    emailVisibility: true
                };
                
                await this.pocketbase.collection('users').create(userData);
                
                this.errors.fields.auth_form_success = {
                    en: 'Registration successful! Please login.',
                    ar: 'تم التسجيل بنجاح! يرجى تسجيل الدخول.'
                };
                
                this.auth.form.view = 'login';
                this.auth.form.password = "";
                this.auth.form.passwordConfirm = "";
                
            } catch (error) {
                this.setFieldError('auth_register', {
                    en: 'Registration failed. This email might already be in use.',
                    ar: 'فشل التسجيل. قد يكون هذا البريد الإلكتروني مستخدمًا بالفعل.'
                });
            } finally {
                this.loading.auth = false;
            }
        },

        validateRegistration() {
            const errors = [];
            
            if (!this.auth.form.name.trim()) {
                errors.push({ field: 'auth_name', message: { en: 'Name is required.', ar: 'الاسم مطلوب.' } });
            }
            
            if (!utils.isValidEmail(this.auth.form.email)) {
                errors.push({ field: 'auth_email', message: 'email' });
            }
            
            if (this.auth.form.password.length < CONSTANTS.MIN_PASSWORD_LENGTH) {
                errors.push({ 
                    field: 'auth_password', 
                    message: { 
                        en: `Password must be at least ${CONSTANTS.MIN_PASSWORD_LENGTH} characters.`, 
                        ar: `كلمة المرور يجب أن تكون ${CONSTANTS.MIN_PASSWORD_LENGTH} أحرف على الأقل.` 
                    } 
                });
            }
            
            if (this.auth.form.password !== this.auth.form.passwordConfirm) {
                errors.push({ 
                    field: 'auth_passwordConfirm', 
                    message: { en: 'Passwords do not match.', ar: 'كلمات المرور غير متطابقة.' } 
                });
            }
            
            return errors;
        },

        logoutUser() {
            this.pocketbase.authStore.clear();
            this.auth.currentUser = null;
            this.orders.userOrders = [];
            this.checkoutForm = { ...initialCheckoutForm };
            this.loadCartFromStorage();
            this.navigateTo('home');
        },

        // Account page
        async initAccountPage() {
            this.clearAllErrors();
            
            if (!this.pocketbase.authStore.isValid) {
                this.auth.redirectAfterLogin = 'account';
                this.navigateTo('auth');
                return;
            }
            
            if (!this.auth.currentUser && this.pocketbase.authStore.model) {
                this.auth.currentUser = this.pocketbase.authStore.model;
            }
            
            if (this.auth.currentUser?.id) {
                await this.fetchUserOrders();
            }
        },

        async fetchUserOrders() {
            if (!this.auth.currentUser?.id) return;
            
            this.loading.orders = true;
            this.clearFieldError('orders_fetch');
            
            try {
                const orders = await this.pocketbase.collection('orders').getList(1, 50, {
                    filter: `user = "${this.auth.currentUser.id}"`,
                    sort: '-created'
                });
                
                this.orders.userOrders = orders.items.map(order => ({
                    ...order,
                    orderStatus: order.order_status?.replace(/_/g, " ") || "N/A",
                    paymentStatus: order.payment_status?.replace(/_/g, " ") || "N/A"
                }));
                
            } catch (error) {
                this.setFieldError('orders_fetch', {
                    en: 'Could not fetch your orders.',
                    ar: 'تعذر جلب طلباتك.'
                });
            } finally {
                this.loading.orders = false;
            }
        },

        // Checkout page
        initCheckoutPage() {
            this.clearAllErrors();
            
            const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
            const isBuyNow = urlParams.get('buyNow') === 'true';
            
            if (isBuyNow) {
                const storedItem = utils.safeLocalStorage.getItem('sheepLandBuyNowItem');
                if (storedItem) {
                    const buyNowItem = utils.safeParseJson(storedItem);
                    if (buyNowItem) {
                        this.cart.items = [buyNowItem];
                    }
                    utils.safeLocalStorage.removeItem('sheepLandBuyNowItem');
                }
            } else {
                this.loadCartFromStorage();
            }
            
            if (this.cart.items.length === 0 && !this.orders.confirmation.show) {
                this.navigateTo('udheya');
                return;
            }
            
            // Reset form
            this.checkoutForm = { ...initialCheckoutForm };
            
            // Pre-fill from user data
            if (this.auth.currentUser) {
                this.checkoutForm.customerName = this.auth.currentUser.name || "";
                this.checkoutForm.customerEmail = this.auth.currentUser.email || "";
                this.checkoutForm.customerPhone = this.auth.currentUser.phone || "";
                this.checkoutForm.customerCountry = this.auth.currentUser.country || "Egypt";
                this.checkoutForm.userId = this.auth.currentUser.id;
            }
            
            this.updateDeliveryFee();
            this.calculateFinalTotal();
        },

        deliveryNeededForCart() {
            return this.cart.items.some(item => {
                if (item.productCategory === 'udheya') {
                    const choice = item.udheyaDetails?.distribution?.choice;
                    const splitOption = item.udheyaDetails?.distribution?.splitOption;
                    
                    return choice === 'me' || 
                           (choice === 'split' && ['1/3_me_2/3_charity', '1/2_me_1/2_charity', 
                                                   '2/3_me_1/3_charity', 'all_me_custom_distro'].includes(splitOption));
                }
                
                return ['meat', 'livesheep', 'gatherings'].includes(item.productCategory);
            });
        },

        updateDeliveryFee() {
            this.checkoutForm.deliveryFeeEgp = 0;
            this.isDeliveryFeeVariable = false;
            
            if (!this.deliveryNeededForCart() || !this.checkoutForm.deliveryCityId) {
                this.calculateFinalTotal();
                return;
            }
            
            const cityData = this.allCities.find(city => city.id === this.checkoutForm.deliveryCityId);
            
            if (cityData && typeof cityData.deliveryFeeEgp === 'number') {
                this.checkoutForm.deliveryFeeEgp = cityData.deliveryFeeEgp;
                this.isDeliveryFeeVariable = false;
            } else {
                this.isDeliveryFeeVariable = true;
                this.checkoutForm.deliveryFeeEgp = 0;
            }
            
            this.calculateFinalTotal();
        },

        calculateFinalTotal() {
            const subtotal = this.calculateCartSubtotal();
            const serviceFee = this.calculateTotalServiceFee();
            this.checkoutForm.totalServiceFeeEgp = serviceFee;
            
            let deliveryFee = 0;
            if (this.deliveryNeededForCart() && this.checkoutForm.deliveryFeeEgp > 0 && !this.isDeliveryFeeVariable) {
                deliveryFee = this.checkoutForm.deliveryFeeEgp;
            }
            
            let onlinePaymentFee = 0;
            if (this.checkoutForm.paymentMethod === 'online_card' && this.settings.onlinePaymentFeeEgp > 0) {
                onlinePaymentFee = this.settings.onlinePaymentFeeEgp;
            }
            
            this.checkoutForm.onlinePaymentFeeAppliedEgp = onlinePaymentFee;
            this.checkoutForm.finalTotalEgp = subtotal + serviceFee + deliveryFee + onlinePaymentFee;
        },

        validateCheckoutForm() {
            this.clearAllErrors();
            const errors = [];
            
            if (!this.checkoutForm.customerName.trim()) {
                errors.push({ field: 'customer_name', message: 'required' });
            }
            
            if (!utils.isValidPhone(this.checkoutForm.customerPhone)) {
                errors.push({ field: 'customer_phone', message: 'phone' });
            }
            
            if (!utils.isValidEmail(this.checkoutForm.customerEmail)) {
                errors.push({ field: 'customer_email', message: 'email' });
            }
            
            if (this.deliveryNeededForCart()) {
                if (!this.checkoutForm.deliveryCityId) {
                    errors.push({ field: 'delivery_city_id', message: 'required' });
                }
                
                if (!this.checkoutForm.deliveryAddress.trim()) {
                    errors.push({ field: 'delivery_address', message: 'required' });
                }
                
                if (!this.checkoutForm.deliveryTimeSlot) {
                    errors.push({ 
                        field: 'delivery_time_slot', 
                        message: { 
                            en: 'Please select a delivery time slot.', 
                            ar: 'يرجى اختيار وقت التوصيل.' 
                        } 
                    });
                }
            }
            
            if (!this.checkoutForm.paymentMethod) {
                errors.push({ field: 'payment_method', message: 'required' });
            }
            
            if (!this.checkoutForm.termsAgreed) {
                errors.push({ field: 'terms_agreed', message: 'termsAgreed' });
            }
            
            if (errors.length > 0) {
                errors.forEach(error => this.setFieldError(error.field, error.message));
                return false;
            }
            
            return true;
        },

        async processOrder() {
            if (!this.validateCheckoutForm()) return;
            
            this.loading.checkout = true;
            this.errors.user = "";
            this.errors.api = "";
            
            try {
                const lineItems = this.cart.items.map(item => ({
                    item_key_pb: item.variantId,
                    product_category: item.productCategory,
                    name_en: item.nameEn,
                    name_ar: item.nameAr,
                    quantity: item.quantity,
                    price_egp_each: item.priceEgp,
                    udheya_details: item.productCategory === 'udheya' ? item.udheyaDetails : null
                }));
                
                let deliveryOption = "self_pickup_or_internal_distribution";
                if (this.deliveryNeededForCart()) {
                    deliveryOption = this.checkoutForm.customerCountry?.toLowerCase() === 'egypt' 
                        ? "home_delivery" 
                        : "international_shipping";
                } else {
                    // Clear delivery fields
                    this.checkoutForm.deliveryCityId = "";
                    this.checkoutForm.deliveryAddress = "";
                    this.checkoutForm.deliveryInstructions = "";
                    this.checkoutForm.deliveryTimeSlot = "";
                    this.checkoutForm.deliveryFeeEgp = 0;
                }
                
                this.calculateFinalTotal();
                
                const orderPayload = {
                    order_id_text: utils.generateOrderId(),
                    user: this.checkoutForm.userId,
                    customer_name: this.checkoutForm.customerName,
                    customer_phone: this.checkoutForm.customerPhone,
                    customer_email: this.checkoutForm.customerEmail,
                    customer_country: this.checkoutForm.customerCountry || "Egypt",
                    line_items: lineItems,
                    delivery_option: deliveryOption,
                    delivery_city_id: this.checkoutForm.deliveryCityId,
                    delivery_address: this.checkoutForm.deliveryAddress,
                    delivery_instructions: this.checkoutForm.deliveryInstructions,
                    delivery_time_slot: this.checkoutForm.deliveryTimeSlot,
                    payment_method: this.checkoutForm.paymentMethod,
                    terms_agreed: this.checkoutForm.termsAgreed,
                    selected_display_currency: this.cart.currency,
                    subtotal_amount_egp: this.calculateCartSubtotal(),
                    total_udheya_service_fee_egp: this.checkoutForm.totalServiceFeeEgp,
                    delivery_fee_applied_egp: this.checkoutForm.deliveryFeeEgp,
                    online_payment_fee_applied_egp: this.checkoutForm.onlinePaymentFeeAppliedEgp,
                    total_amount_due_egp: this.checkoutForm.finalTotalEgp
                };
                
                const createdOrder = await this.pocketbase.collection('orders').create(orderPayload);
                
                // Setup order confirmation
                this.orders.confirmation = {
                    show: true,
                    orderId: createdOrder.order_id_text,
                    totalEgp: createdOrder.total_amount_due_egp,
                    items: createdOrder.line_items,
                    customerEmail: createdOrder.customer_email,
                    paymentInstructions: this.getPaymentInstructions(
                        createdOrder.payment_method,
                        createdOrder.total_amount_due_egp,
                        createdOrder.order_id_text
                    )
                };
                
                // Clear cart unless it's buy now
                const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
                const isBuyNow = urlParams.get('buyNow') === 'true';
                if (!isBuyNow) {
                    this.clearCart();
                }
                
                utils.safeLocalStorage.removeItem('sheepLandBuyNowItem');
                this.checkoutForm = { ...initialCheckoutForm };
                
                // Send notifications
                this.sendBusinessWhatsAppNotification(createdOrder);
                
                this.$nextTick(() => {
                    this.focusElement('orderConfTitle');
                });
                
            } catch (error) {
                this.errors.api = error.data?.message || error.message || "Order placement failed.";
                this.errors.user = "An unexpected error occurred. Please check your selections or contact support.";
            } finally {
                this.loading.checkout = false;
            }
        },

        getPaymentInstructions(paymentMethod, totalEgp, orderId) {
            const price = this.formatPrice(totalEgp);
            const waLink = `https://wa.me/${this.settings.whatsappNumberRaw}?text=Order%20Payment%20Confirmation%3A%20${orderId}`;
            const confirmLink = `<a href="${waLink}" target="_blank" rel="noopener noreferrer" class="link-style">${this.settings.whatsappNumberDisplay || 'WhatsApp'}</a>`;
            
            const instructions = {
                'online_card': `<div class="bil-row"><p class="en">Your order total is <strong>${price}</strong>. To complete payment, you will be contacted shortly. Order ID: <strong class="pay-ref">${orderId}</strong>.</p><p class="ar">إجمالي طلبك هو <strong>${price}</strong>. لإتمام الدفع، سنتصل بك قريبًا. رقم الطلب: <strong class="pay-ref">${orderId}</strong>.</p></div>`,
                
                'fawry': `<div class="bil-row"><p class="en">Fawry: Pay <strong>${price}</strong>. Use Order ID <strong class="pay-ref">${orderId}</strong>. Due in 24h.</p><p class="ar">فوري: ادفع <strong>${price}</strong>. استخدم رقم الطلب <strong class="pay-ref">${orderId}</strong>. خلال 24س.</p></div>`,
                
                'vodafone_cash': `<div class="bil-row"><p class="en">Vodafone Cash: Pay <strong>${price}</strong> to <strong class="pay-ref">${this.settings.paymentDetails?.vodafone_cash || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderId}</strong>. Confirm via ${confirmLink}.</p><p class="ar">فودافون كاش: ادفع <strong>${price}</strong> إلى <strong class="pay-ref">${this.settings.paymentDetails?.vodafone_cash || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderId}</strong>. أكد عبر ${confirmLink}.</p></div>`,
                
                'instapay': `<div class="bil-row"><p class="en">InstaPay: Pay <strong>${price}</strong> to <strong class="pay-ref">${this.settings.paymentDetails?.instapay_ipn || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderId}</strong>. Confirm via ${confirmLink}.</p><p class="ar">إنستا باي: ادفع <strong>${price}</strong> إلى <strong class="pay-ref">${this.settings.paymentDetails?.instapay_ipn || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderId}</strong>. أكد عبر ${confirmLink}.</p></div>`,
                
                'bank_transfer': `<div class="bil-row"><p class="en">Bank Transfer <strong>${price}</strong> to:</p><p class="ar">تحويل بنكي <strong>${price}</strong> إلى:</p></div><ul class="bank-dets"><li class="bil-row"><span class="en">Bank: <strong class="pay-ref">${this.settings.paymentDetails?.bank_name || 'N/A'}</strong></span><span class="ar">البنك: <strong class="pay-ref">${this.settings.paymentDetails?.bank_name || 'غير متوفر'}</strong></span></li><li class="bil-row"><span class="en">Acc No: <strong class="pay-ref">${this.settings.paymentDetails?.bank_account_number || 'N/A'}</strong></span><span class="ar">رقم الحساب: <strong class="pay-ref">${this.settings.paymentDetails?.bank_account_number || 'غير متوفر'}</strong></span></li></ul><div class="bil-row bank-note"><p class="en">Ref Order ID: <strong class="pay-ref">${orderId}</strong>. Confirm via ${confirmLink}.</p><p class="ar">مرجع الطلب: <strong class="pay-ref">${orderId}</strong>. أكد عبر ${confirmLink}.</p></div>`,
                
                'cod': `<div class="bil-row"><p class="en">COD: Our team will call <strong>${this.checkoutForm.customerPhone}</strong> to confirm. Total Amount Due <strong>${price}</strong>. Order ID: <strong class="pay-ref">${orderId}</strong>.</p><p class="ar">الدفع عند الاستلام: سيتصل بك الفريق على <strong>${this.checkoutForm.customerPhone}</strong> للتأكيد. المجموع الكلي للطلب <strong>${price}</strong>. رقم الطلب: <strong class="pay-ref">${orderId}</strong>.</p></div>`
            };
            
            return instructions[paymentMethod] || instructions['cod'];
        },

        sendBusinessWhatsAppNotification(order) {
            if (!order || !order.line_items) return;
            
            const items = order.line_items.map(item =>
                `• ${item.name_en} x${item.quantity} = ${this.formatPrice(item.price_egp_each * item.quantity)}`
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
                `💰 *Total: ${this.formatPrice(order.total_amount_due_egp)}*\n` +
                `💳 Payment: ${order.payment_method}\n\n` +
                `⏰ Time: ${new Date().toLocaleString('en-EG')}`;
            
            const businessPhone = this.settings.whatsappNumberRaw;
            if (businessPhone) {
                const whatsappUrl = `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                
                // Try to copy to clipboard
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(message).catch(() => {
                        console.log('Could not copy to clipboard');
                    });
                }
            }
        },

        // Order status
        async submitOrderStatusValidation() {
            this.clearFieldError('lookupOrderId');
            
            if (!this.orders.lookupOrderId.trim()) {
                this.setFieldError('lookupOrderId', 'required');
                this.$refs.lookupOrderIdInput?.focus();
                return;
            }
            
            await this.checkOrderStatus();
        },

        async checkOrderStatus() {
            this.orders.statusResult = null;
            this.orders.statusNotFound = false;
            this.loading.status = true;
            this.errors.api = null;
            this.errors.user = "";
            
            const orderId = this.orders.lookupOrderId.trim();
            
            try {
                const result = await this.pocketbase.collection('orders').getList(1, 1, {
                    filter: `order_id_text = "${this.pocketbase.filter.escape(orderId)}"`
                });
                
                if (result.items && result.items.length > 0) {
                    const order = result.items[0];
                    this.orders.statusResult = {
                        orderId: order.order_id_text,
                        customerName: order.customer_name,
                        orderStatus: order.order_status?.replace(/_/g, " ") || "N/A",
                        paymentStatus: order.payment_status?.replace(/_/g, " ") || "N/A",
                        lineItems: order.line_items || [],
                        totalAmountDueEgp: order.total_amount_due_egp,
                        paymentMethod: order.payment_method,
                        deliveryOption: order.delivery_option,
                        deliveryAddress: order.delivery_address,
                        deliveryAreaNameEn: order.delivery_area_name_en,
                        deliveryAreaNameAr: order.delivery_area_name_ar
                    };
                } else {
                    this.orders.statusNotFound = true;
                    this.errors.user = "No order found with that ID.";
                }
                
            } catch (error) {
                this.errors.api = error.message;
                this.errors.user = "Could not get order status. Please check details or contact support.";
                this.orders.statusNotFound = true;
            } finally {
                this.loading.status = false;
            }
        },

        // Category display
        getCategoryDisplayName(category) {
            const names = {
                udheya: { en: 'Udheya', ar: 'الأضحية' },
                livesheep: { en: 'Live Sheep', ar: 'الأغنام الحية' },
                meat: { en: 'Fresh Meat', ar: 'اللحوم الطازجة' },
                gatherings: { en: 'Gatherings', ar: 'الولائم' }
            };
            return names[category] || { en: category, ar: category };
        },

        // Cleanup
        destroy() {
            if (this.cleanup) {
                this.cleanup();
            }
        }
    }));

    // Business Stats Component
    Alpine.data('businessStats', () => ({
        todayOrders: 0,
        todayRevenue: 0,
        activeCustomers: 0,
        popularItem: '-',
        pocketbase: null,
        
        async init() {
            this.pocketbase = this.$root.pocketbase || new PocketBase('/');
            await this.fetchTodayStats();
        },
        
        async fetchTodayStats() {
            if (!this.pocketbase) return;
            
            try {
                const today = new Date().toISOString().split('T')[0];
                const orders = await this.pocketbase.collection('orders').getList(1, 50, {
                    filter: `created >= '${today} 00:00:00'`,
                    sort: '-created'
                });
                
                this.todayOrders = orders.totalItems;
                this.todayRevenue = orders.items.reduce((sum, order) => 
                    sum + (Number(order.total_amount_due_egp) || 0), 0);
                
                const uniqueCustomers = new Set(orders.items.map(order => 
                    order.user || order.customer_email));
                this.activeCustomers = uniqueCustomers.size;
                
                const itemCounts = {};
                orders.items.forEach(order => {
                    if (Array.isArray(order.line_items)) {
                        order.line_items.forEach(item => {
                            const itemName = item.name_en || 'Unknown';
                            itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantity;
                        });
                    }
                });
                
                const topItem = Object.entries(itemCounts)
                    .sort((a, b) => b[1] - a[1])[0];
                this.popularItem = topItem ? topItem[0] : '-';
                
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        },
        
        formatPrice(amount) {
            return this.$root.formatPrice ? 
                this.$root.formatPrice(amount) : 
                `${amount} EGP`;
        }
    }));
});