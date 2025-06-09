document.addEventListener('alpine:init', () => {
    const initForm = {
        customer_name: "", customer_phone: "", customer_email: "", customer_country: "Egypt",
        delivery_option: "self_pickup_or_internal_distribution",
        delivery_city_id: "", delivery_address: "", delivery_instructions: "", 
        delivery_time_slot: "9AM-11AM", payment_method: "vodafone_cash", terms_agreed: false,
        total_service_fee_egp: 0, delivery_fee_egp: 0, online_payment_fee_applied_egp: 0,
        final_total_egp: 0, user_id: null
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

    Alpine.data('sheepLand', () => ({
        load: { init: true, status: false, checkout: false, auth: false, orders: false, addingToCart: null },
        settings: {
            xchgRates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true } },
            defCurr: "EGP", waNumRaw: "", waNumDisp: "", promoEndISO: new Date().toISOString(), 
            promoDiscPc: 0, promoActive: false, servFeeEGP: 0, delAreas: [], payDetails: {},
            enable_udheya_section: true, enable_livesheep_section: true, enable_meat_section: true, enable_gatherings_section: true,
            slaughter_location_gmaps_url: "", online_payment_fee_egp: 0, refundPolicyHTMLContent: "<p>Loading policy...</p>",
            app_email_sender_address: "noreply@sheepland.eg", app_email_sender_name: "Sheep Land",
            site_title_en: "Sheep Land", site_title_ar: "أرض الأغنام",
            site_desc_en: "Premium live sheep & Udheya", site_desc_ar: "مواشي وأضاحي فاخرة"
        },
        prodOpts: { udheya: [], livesheep_general: [], meat_cuts: [], gathering_package: [] },
        selectedMeatWeights: {},
        searchQuery: '',
        showSearch: false,
        showAccountDropdown: false,
        showAuthDropdown: false,
        showWhatsAppChat: false,
        chatMessage: '',
        chatMessages: [],
        showExitOffer: false,
        showMeatCalculator: false,
        isPromoBarDismissed: false,
        cartItems: [], 
        isMobNavOpen: false, isCartOpen: false, isRefundModalOpen: false, 
        isOrderStatusModalOpen: false, isUdheyaConfigModalOpen: false,
        currentPage: 'home', currLang: "en", curr: "EGP",
        cd: { days: "00", hours: "00", mins: "00", secs: "00", ended: false }, cdTimer: null,
        checkoutForm: JSON.parse(JSON.stringify(initForm)),
        tempUdheyaConfig: JSON.parse(JSON.stringify(initUdheya)), 
        apiErr: null, usrApiErr: "", addedToCartMsg: { text: null, isError: false, pageContext: '' },
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
            this.load.init = true; 
            this.determineCurrentPageFromURL();
            
            const pb = new PocketBase('/'); 
            this.pb = pb;
            
            if (pb.authStore.isValid && pb.authStore.model) {
                this.currentUser = pb.authStore.model;
            } else {
                pb.authStore.clear(); 
                this.currentUser = null;
            }
            this.loadCartFromStorage(); 

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
                        app_email_sender_address: rs.app_email_sender_address || "noreply@sheepland.eg",
                        app_email_sender_name: rs.app_email_sender_name || "Sheep Land",
                        site_title_en: rs.site_title_en || "Sheep Land",
                        site_title_ar: rs.site_title_ar || "أرض الأغنام",
                        site_desc_en: rs.site_desc_en || "Premium live sheep & Udheya",
                        site_desc_ar: rs.site_desc_ar || "مواشي وأضاحي فاخرة"
                    });
                }

                const allProducts = await pb.collection('products').getFullList({ filter: 'is_active = true', sort:'+sort_order_type,+sort_order_variant'});
                
                const categorizeProducts = (products, categoryFilter) => {
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
                            descAr: p.type_description_ar, breed_info_en: p.breed_info_en, breed_info_ar: p.breed_info_ar
                        });
                    });
                    return Object.values(grouped);
                };
                
                this.prodOpts.udheya = categorizeProducts(allProducts, 'udheya');
                this.prodOpts.livesheep_general = categorizeProducts(allProducts, 'livesheep_general');
                this.prodOpts.meat_cuts = categorizeProducts(allProducts, 'meat_cuts');
                this.prodOpts.gathering_package = categorizeProducts(allProducts, 'gathering_package');
            
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
                this.apiErr = String(e.message || "Could not load initial application data."); 
                this.usrApiErr = "Error loading essential data. Please try refreshing the page."; 
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
            const validPages = ['home', 'udheya', 'livesheep', 'meat', 'gatherings', 'checkout', 'auth', 'account'];
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

        toggleCart() { 
            this.isCartOpen = !this.isCartOpen; 
        },
        closeCart() { 
            this.isCartOpen = false; 
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
                console.error("Error saving cart to localStorage", e); 
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
                console.error("Error loading cart from localStorage", e); 
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

        toggleSearch() {
            this.showSearch = !this.showSearch;
            if (this.showSearch) {
                this.$nextTick(() => {
                    this.$refs.searchInput?.focus();
                });
            }
        },

        toggleAccountDropdown() {
            this.showAccountDropdown = !this.showAccountDropdown;
        },

        toggleAuthDropdown() {
            this.showAuthDropdown = !this.showAuthDropdown;
            if (this.showAuthDropdown) {
                this.auth.view = 'welcome';
            }
        },

        toggleWhatsAppChat() {
            this.showWhatsAppChat = !this.showWhatsAppChat;
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

        get filteredProducts() {
            if (!this.searchQuery || this.searchQuery.trim().length < 2) return {};
            
            const query = this.searchQuery.toLowerCase().trim();
            const filtered = {};
            
            const categoryNames = {
                udheya: { en: 'Udheya', ar: 'الأضحية' },
                livesheepGeneral: { en: 'Live Sheep', ar: 'الأغنام الحية' },
                meatCuts: { en: 'Fresh Meat', ar: 'اللحوم الطازجة' },
                gatheringPackage: { en: 'Gatherings', ar: 'الولائم' }
            };
            
            Object.keys(this.prodOpts).forEach(category => {
                const matchingProducts = [];
                
                this.prodOpts[category].forEach(productType => {
                    const matchingItems = productType.wps.filter(item => 
                        item.nameENSpec.toLowerCase().includes(query) ||
                        item.nameARSpec.includes(query) ||
                        productType.nameEn.toLowerCase().includes(query) ||
                        productType.nameAr.includes(query)
                    );
                    
                    if (matchingItems.length > 0) {
                        matchingProducts.push(...matchingItems);
                    }
                });
                
                if (matchingProducts.length > 0) {
                    filtered[category] = matchingProducts;
                }
            });
            
            return filtered;
        },
        
        getCategoryDisplayName(category) {
            const names = {
                udheya: { en: 'Udheya', ar: 'الأضحية' },
                livesheepGeneral: { en: 'Live Sheep', ar: 'الأغنام الحية' },
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

        getProductImage(item, sectionKey) {
            // Map specific products to their unique images
            if (sectionKey === 'livesheep') {
                if (item.itemKey && item.itemKey.includes('black')) return 'images/products/sheep-black.jpg';
                if (item.itemKey && item.itemKey.includes('white')) return 'images/products/sheep-white.jpg';
                if (item.itemKey && item.itemKey.includes('import')) return 'images/products/sheep-imported.jpg';
                return 'images/products/sheep-field.jpg';
            }
            else if (sectionKey === 'meat') {
                if (item.itemKey && item.itemKey.includes('shoulder')) return 'images/products/lamb-shoulder.jpg';
                if (item.itemKey && item.itemKey.includes('leg')) return 'images/products/lamb-leg.jpg';
                if (item.itemKey && item.itemKey.includes('rib')) return 'images/products/lamb-ribs.jpg';
                if (item.itemKey && item.itemKey.includes('mince')) return 'images/products/lamb-minced.jpg';
                if (item.itemKey && item.itemKey.includes('steak')) return 'images/products/lamb-steak.jpg';
                return 'images/products/lamb-cuts.jpg';
            }
            else if (sectionKey === 'gatherings') {
                if (item.itemKey && item.itemKey.includes('small')) return 'images/products/event-small-gathering.jpg';
                if (item.itemKey && item.itemKey.includes('large')) return 'images/products/event-large-gathering.jpg';
                return 'images/products/event-catering.jpg';
            }
            return 'images/products/sheep-field.jpg'; // fallback
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
                            console.warn("ScrollIntoView failed for:", r, e); 
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
                    console.error("Error loading Buy Now item", e); 
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
                this.navigateToOrScroll('udheya'); 
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
                return ['meat_cuts', 'livesheep_general', 'gathering_package'].includes(item.product_category);
            });
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
            if (this.checkoutForm.payment_method === 'online_card' && this.settings.online_payment_fee_egp > 0) { 
                onlinePaymentFee = this.settings.online_payment_fee_egp; 
            } 
            this.checkoutForm.online_payment_fee_applied_egp = onlinePaymentFee; 
            this.checkoutForm.final_total_egp = cartSubtotal + totalServiceFee + deliveryFee + onlinePaymentFee; 
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
            };
            
            try { 
                const createdOrder = await this.pb.collection('orders').create(orderPayload); 
                this.orderConf.orderID = createdOrder.order_id_text; 
                this.orderConf.totalEgp = createdOrder.total_amount_due_egp; 
                this.orderConf.items = createdOrder.line_items.map(li => ({...li})); 
                this.orderConf.customerEmail = createdOrder.customer_email; 
                this.orderConf.paymentInstructions = this.getPaymentInstructionsHTML(createdOrder.payment_method, createdOrder.total_amount_due_egp, createdOrder.order_id_text); 
                this.orderConf.show = true; 
                
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
                console.error('Failed to fetch stats:', error);
                // Silently fail - stats are not critical
            }
        },
        
        fmtPrice(amount) {
            // Use parent component's fmtPrice method
            return this.$root.fmtPrice ? this.$root.fmtPrice(amount) : `${amount} EGP`;
        }
    }));

    // Auto-save cart functionality is handled within the main component

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const app = document.querySelector('[x-data="sheepLand"]')?._x_dataStack?.[0];
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
                    const alpineApp = document.querySelector('[x-data="sheepLand"]')?._x_dataStack?.[0];
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
            const app = document.querySelector('[x-data="sheepLand"]')?._x_dataStack?.[0];
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
