// Filename: /script.js
document.addEventListener('alpine:init', () => {
    const initialCheckoutForm = {
        customer_name: "", customer_phone: "", customer_email: "",
        delivery_option: "self_pickup_or_internal_distribution",
        delivery_city_id: "", delivery_address: "", delivery_instructions: "", delivery_time_slot: "9AM-11AM",
        payment_method: "fa", 
        terms_agreed: false,
        total_service_fee_egp: 0, delivery_fee_egp: 0, online_payment_fee_applied_egp: 0,
        final_total_egp: 0, user_id: null
    };

    const initialTempUdheyaConfig = {
        itemKey: null, niyyahNames: "", serviceOption: "standard_service",
        sacrificeDay: "day1_10_dhul_hijjah", viewingPreference: "none",
        distribution: { choice: "me", splitOption: "", customSplitText: "" },
        isBuyNowIntent: false 
    };

    const payMethOptsList = [
        { id: 'online_card', title: 'Online Payment (Card)', imgSrc: 'card_payment.svg', requiresServerAction: true },
        { id: 'revolut', title: 'Revolut', imgSrc: 'revolut.svg' },
        { id: 'monzo', title: 'Monzo', imgSrc: 'monzo.svg' },
        { id: 'ip', title: 'InstaPay', imgSrc: 'instapay.svg' },
        { id: 'fa', title: 'Fawry', imgSrc: 'fawry.svg' },
        { id: 'vo', title: 'Vodafone Cash', imgSrc: 'vodafone.svg' },
        { id: 'cod', title: 'Cash on Delivery', imgSrc: 'cod.svg' },
        { id: 'bank_transfer', title: 'Bank Transfer', imgSrc: 'bank_transfer.svg' }
    ];

    const sacrificeDayMapInternal = {
        "day1_10_dhul_hijjah": { "en": "Day 1 of Eid (10th Dhul Hijjah)", "ar": "اليوم الأول (10 ذو الحجة)" },
        "day2_11_dhul_hijjah": { "en": "Day 2 of Eid (11th Dhul Hijjah)", "ar": "اليوم الثاني (11 ذو الحجة)" },
        "day3_12_dhul_hijjah": { "en": "Day 3 of Eid (12th Dhul Hijjah)", "ar": "اليوم الثالث (12 ذو الحجة)" },
        "day4_13_dhul_hijjah": { "en": "Day 4 of Eid (13th Dhul Hijjah)", "ar": "اليوم الرابع (13 ذو الحجة)" },
    };

    Alpine.data('udh', () => ({
        load: { init: true, status: false, checkout: false, auth: false, orders: false, addingToCart: null, configuringUdheya: null },
        settings: {
            xchgRates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true } },
            defCurr: "EGP", waNumRaw: "", waNumDisp: "",
            promoEndISO: new Date().toISOString(), promoDiscPc: 0, promoActive: false,
            servFeeEGP: 0, delAreas: [], payDetails: {},
            enable_udheya_section: true, enable_livestock_section: true, enable_meat_section: true, enable_gatherings_section: true,
            slaughter_location_gmaps_url: "", online_payment_fee_egp: 0, refundPolicyHTMLContent: "<p>Loading policy...</p>",
            app_email_sender_address: "noreply@example.com", app_email_sender_name: "Sheep Land"
        },
        prodOpts: { udheya: [], livestock_general: [], meat_cuts: [], gathering_package: [] },
        cartItems: [], 
        apiErr: null, usrApiErr: "",
        get availPayMeths() { return payMethOptsList; },
        
        isMobNavOpen: false, isCartOpen: false, isRefundModalOpen: false, isOrderStatusModalOpen: false,
        isUdheyaConfigModalOpen: false,
        currentPage: '', currentProductPage: '', 
        currLang: "en", curr: "EGP",
        cd: { days: "00", hours: "00", mins: "00", secs: "00", ended: false },
        cdTimer: null,
        
        checkoutForm: JSON.parse(JSON.stringify(initialCheckoutForm)),
        tempUdheyaConfig: JSON.parse(JSON.stringify(initialTempUdheyaConfig)), 
        configuringUdheyaItem: null, 
        addedToCartMsg: { text: null, isError: false, pageContext: '' },
        
        statRes: null, statNotFound: false, lookupOrderID: "",
        orderConf: { show: false, orderID: "", totalEgp: 0, items: [], paymentInstructions: "", customerEmail: "" },
        
        currentUser: null, 
        auth: { email: "", password: "", passwordConfirm: "", name: "" , view: 'login' }, 
        userOrders: [], 
        redirectAfterLogin: null,

        errs: {}, 
        errMsgs: { 
            required: { en: "This field is required.", ar: "هذا الحقل مطلوب." },
            select: { en: "Please make a selection.", ar: "يرجى الاختيار." },
            email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." },
            phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." },
            password_mismatch: { en: "Passwords do not match.", ar: "كلمات المرور غير متطابقة." },
            password_short: { en: "Password must be at least 8 characters.", ar: "يجب أن تكون كلمة المرور 8 أحرف على الأقل." },
            terms_agreed: { en: "You must agree to the terms and refund policy.", ar: "يجب أن توافق على الشروط وسياسة الاسترداد." },
            udheya_animal: { en: "Please select an Udheya animal and weight.", ar: "يرجى اختيار حيوان الأضحية والوزن."},
            udheya_service_config: { en: "Please select an Udheya service option.", ar: "يرجى اختيار خيار خدمة الأضحية."},
            udheya_sacrifice_day_config: { en: "Please select a sacrifice day.", ar: "يرجى اختيار يوم الذبح."},
            udheya_distribution_choice_config: { en: "Please select a distribution choice.", ar: "يرجى اختيار طريقة التوزيع."},
            udheya_split_option_config: { en: "Please specify split details or choose an option.", ar: "يرجى تحديد تفاصيل التقسيم أو اختيار خيار."},
            auth_login: { en: 'Login failed. Please check credentials.', ar: 'فشل الدخول. تحقق من البيانات.'},
            auth_register: { en: 'Registration failed. Please try again.', ar: 'فشل التسجيل. حاول مرة أخرى.'},
            auth_name: {en: 'Name is required for registration.', ar: 'الاسم مطلوب للتسجيل.'},
            auth_email: {en: 'A valid email is required.', ar: 'البريد الإلكتروني مطلوب وصحيح.'},
            auth_password: {en: 'Password is required.', ar: 'كلمة المرور مطلوبة.'},
            auth_passwordConfirm: {en: 'Password confirmation is required.', ar: 'تأكيد كلمة المرور مطلوب.'},
            orders_fetch: { en: 'Could not fetch your orders.', ar: 'تعذر جلب طلباتك.'}
        },
        allCities: [], isDelFeeVar: false, 
        
        get cartItemCount() { return this.cartItems.reduce((sum, item) => sum + item.quantity, 0); },

        async initApp() {
            this.load.init = true; this.apiErr = null; this.usrApiErr = "";
            this.setCurrentPage();
            
            const pb = new PocketBase('/'); this.pb = pb;
            
            if (pb.authStore.isValid && pb.authStore.model) {
                this.currentUser = pb.authStore.model;
            } else {
                pb.authStore.clear(); 
                this.currentUser = null;
            }
            this.loadCartFromStorage(); 

            try {
                const rs = await pb.collection('settings').getFirstListItem('id!=""', { requestKey: "settings_init_global" });
                if (rs) {
                    this.settings.xchgRates = rs.xchgRates || this.settings.xchgRates;
                    this.settings.defCurr = rs.defCurr || this.settings.defCurr;
                    this.settings.waNumRaw = rs.waNumRaw || ""; this.settings.waNumDisp = rs.waNumDisp || "";
                    this.settings.promoEndISO = rs.promoEndISO || new Date().toISOString();
                    this.settings.promoDiscPc = Number(rs.promoDiscPc) || 0;
                    this.settings.promoActive = typeof rs.promoActive === 'boolean' ? rs.promoActive : false;
                    this.settings.servFeeEGP = Number(rs.servFeeEGP) || 0;
                    this.settings.delAreas = Array.isArray(rs.delAreas) ? rs.delAreas : [];
                    this.settings.payDetails = typeof rs.payDetails === 'object' && rs.payDetails !== null ? rs.payDetails : {};
                    this.settings.enable_udheya_section = typeof rs.enable_udheya_section === 'boolean' ? rs.enable_udheya_section : true;
                    this.settings.enable_livestock_section = typeof rs.enable_livestock_section === 'boolean' ? rs.enable_livestock_section : true;
                    this.settings.enable_meat_section = typeof rs.enable_meat_section === 'boolean' ? rs.enable_meat_section : true;
                    this.settings.enable_gatherings_section = typeof rs.enable_gatherings_section === 'boolean' ? rs.enable_gatherings_section : true;
                    this.settings.slaughter_location_gmaps_url = rs.slaughter_location_gmaps_url || "";
                    this.settings.online_payment_fee_egp = Number(rs.online_payment_fee_egp) || 0;
                    this.settings.refundPolicyHTMLContent = rs.refund_policy_html || this.generateDefaultRefundPolicyHTML();
                    this.settings.app_email_sender_address = rs.app_email_sender_address || "noreply@example.com";
                    this.settings.app_email_sender_name = rs.app_email_sender_name || "Sheep Land";
                } else { this.usrApiErr = "App configuration could not be loaded. Essential features may be unavailable.";}

                const allProducts = await pb.collection('products').getFullList({ filter: 'is_active = true', sort:'+sort_order_type,+sort_order_variant', requestKey: "all_products_init_global" });
                const categorizeAndGroupProducts = (products, categoryFilter) => {
                    const categoryProducts = products.filter(p => p.product_category === categoryFilter);
                    const grouped = {};
                    categoryProducts.forEach(p => {
                        if (!grouped[p.type_key]) { grouped[p.type_key] = { valKey: p.type_key, nameEn: p.type_name_en, nameAr: p.type_name_ar, descEn: p.type_description_en, descAr: p.type_description_ar, priceKgEgp: p.price_per_kg_egp || 0, wps: [] }; }
                        grouped[p.type_key].wps.push({ itemKey: p.item_key, varIdPb: p.id, nameENSpec: p.variant_name_en, nameARSpec: p.variant_name_ar, wtRangeEn: p.weight_range_text_en, wtRangeAr: p.weight_range_text_ar, avgWtKg: p.avg_weight_kg, priceEGP: p.base_price_egp, stock: p.stock_available_pb, isActive: p.is_active, product_category: p.product_category, type_key: p.type_key, type_name_en: p.type_name_en, type_name_ar: p.type_name_ar, descEn: p.type_description_en, descAr: p.type_description_ar });
                    });
                    return Object.values(grouped);
                };
                this.prodOpts.udheya = categorizeAndGroupProducts(allProducts, 'udheya');
                this.prodOpts.livestock_general = categorizeAndGroupProducts(allProducts, 'livestock_general');
                this.prodOpts.meat_cuts = categorizeAndGroupProducts(allProducts, 'meat_cuts');
                this.prodOpts.gathering_package = categorizeAndGroupProducts(allProducts, 'gathering_package');
            
                let cities = []; (this.settings.delAreas || []).forEach(gov => { 
                    if (gov.cities && Array.isArray(gov.cities) && gov.cities.length > 0) { gov.cities.forEach(city => { cities.push({ id: `${gov.id}_${city.id}`, nameEn: `${gov.name_en} - ${city.name_en}`, nameAr: `${gov.name_ar} - ${city.name_ar}`, delFeeEgp: city.delivery_fee_egp, govId: gov.id }); });
                    } else if (gov.delivery_fee_egp !== undefined) { cities.push({ id: gov.id, nameEn: gov.name_en, nameAr: gov.name_ar, delFeeEgp: gov.delivery_fee_egp, govId: gov.id }); }
                });
                this.allCities = cities.sort((a,b) => a.nameEn.localeCompare(b.nameEn));
                
            } catch (e) { this.apiErr = String(e.message || "Could not load initial application data."); this.usrApiErr = "Error loading essential data. Please try refreshing the page or contact support if the issue persists."; console.error("Init App Error:", e); }
            
            this.curr = this.settings.defCurr || "EGP"; this.startCd(); this.clrAllErrs();
            this.calculateFinalTotal();
            this.load.init = false;
        },
        generateDefaultRefundPolicyHTML() {
            return `<div class="bil-row"><p class="en">Welcome to Sheep Land. We strive to provide the best quality Udheya and livestock services. Please read our policy carefully.</p><p class="ar" dir="rtl">مرحباً بكم في أرض الأغنام. نسعى جاهدين لتقديم أفضل جودة في خدمات الأضاحي والمواشي. يرجى قراءة سياستنا بعناية.</p></div> <h3 class="bil-spread modal-section-title"><span class="en">Udheya Orders</span><span class="ar" dir="rtl">طلبات الأضاحي</span></h3> <div class="bil-row"><p class="en">Due to the nature of Udheya (Qurbani/Sacrifice), which is a time-sensitive religious observance, our refund and cancellation policy is as follows:</p><p class="ar" dir="rtl">نظرًا لطبيعة الأضحية، وهي شعيرة دينية مرتبطة بوقت محدد، فإن سياسة الاسترداد والإلغاء لدينا هي كما يلي:</p></div> <ul class="modal-list"><li><div class="bil-row"><p class="en"><strong>Cancellations Before [Specify Cut-off Date, e.g., 72 hours before Eid Day 1]:</strong> Full refund, less any payment processing fees.</p><p class="ar" dir="rtl"><strong>الإلغاء قبل [تحديد تاريخ القطع، مثلاً، ٧٢ ساعة قبل أول أيام العيد]:</strong> استرداد كامل، مخصومًا منه رسوم معالجة الدفع.</p></div></li><li><div class="bil-row"><p class="en"><strong>Cancellations After Cut-off:</strong> Non-refundable as animal is committed.</p><p class="ar" dir="rtl"><strong>الإلغاء بعد تاريخ القطع:</strong> غير قابل للاسترداد لالتزام الحيوان.</p></div></li><li><div class="bil-row"><p class="en"><strong>Non-Fulfilment by Us:</strong> Full refund if we cannot fulfill order.</p><p class="ar" dir="rtl"><strong>عدم التنفيذ من طرفنا:</strong> استرداد كامل إذا لم نتمكن من تنفيذ الطلب.</p></div></li></ul> <h3 class="bil-spread modal-section-title"><span class="en">Other Products</span><span class="ar" dir="rtl">المنتجات الأخرى</span></h3> <ul class="modal-list"><li><div class="bil-row"><p class="en"><strong>Cancellations:</strong> Up to [e.g., 24 hours] before delivery for full refund (minus processing/customization costs).</p><p class="ar" dir="rtl"><strong>الإلغاء:</strong> حتى [مثلاً، ٢٤ ساعة] قبل التوصيل لاسترداد كامل (ناقص تكاليف المعالجة/التخصيص).</p></div></li><li><div class="bil-row"><p class="en"><strong>Quality Issues:</strong> Contact within [e.g., 6 hours] of receipt with evidence for review.</p><p class="ar" dir="rtl"><strong>مشاكل الجودة:</strong> تواصل خلال [مثلاً، ٦ ساعات] من الاستلام مع إثبات للمراجعة.</p></div></li></ul> <h3 class="bil-spread modal-section-title"><span class="en">General</span><span class="ar" dir="rtl">عام</span></h3> <div class="bil-row"><p class="en">Refunds processed within [e.g., 7-14] business days. Policy subject to change.</p><p class="ar" dir="rtl">تتم معالجة المبالغ المستردة خلال [مثلاً، ٧-١٤] يوم عمل. السياسة قابلة للتغيير.</p></div>`;
        },
        setCurrentPage() { const path = window.location.pathname.split("/").pop(); this.currentPage = path || 'index.html'; this.currentProductPage = ''; if (['udheya.html', 'livestock.html', 'meat.html', 'gatherings.html'].includes(this.currentPage)) { this.currentProductPage = this.currentPage.split('.')[0]; } },
        isCurrentPage(pageName) { return this.currentPage === pageName; },
        navigateToOrScroll(target) { const targetPage = target.split('#')[0]; const targetAnchor = target.split('#')[1]; if (targetPage && this.isCurrentPage(targetPage) && targetAnchor) { const element = document.getElementById(targetAnchor); if (element) { let offset = document.querySelector('.site-head')?.offsetHeight || 0; window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - offset - 10, behavior: 'smooth' }); } } else if (targetPage) { window.location.href = target; } else if (target.startsWith('#')) { const element = document.getElementById(target.substring(1)); if (element) { let offset = document.querySelector('.site-head')?.offsetHeight || 0; window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - offset - 10, behavior: 'smooth' }); } } },

        openCart() { this.isCartOpen = true; document.body.classList.add('overflow-hidden'); },
        closeCart() { this.isCartOpen = false; document.body.classList.remove('overflow-hidden'); },
        addItemToCart(productVariant, udheyaConfigDetails = null) {
            this.load.addingToCart = productVariant.itemKey;
            this.addedToCartMsg = { text: null, isError: false, pageContext: this.currentProductPage };
            
            if (!productVariant || !productVariant.itemKey || productVariant.stock <= 0) {
                this.addedToCartMsg = { text: { en: 'This item is out of stock.', ar: 'هذا المنتج غير متوفر.' }, isError: true, pageContext: this.currentProductPage };
                this.load.addingToCart = null; setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000); return;
            }
            const isUdheya = productVariant.product_category === 'udheya';
            const existingItemIndex = this.cartItems.findIndex(item => item.itemKey === productVariant.itemKey && item.product_category === productVariant.product_category);

            if (existingItemIndex > -1) {
                if (isUdheya) {
                    this.addedToCartMsg = { text: { en: 'This Udheya is already in your cart. You can modify details during checkout if needed.', ar: 'هذه الأضحية موجودة بالفعل في سلتك. يمكنك تعديل التفاصيل عند الدفع إذا لزم الأمر.' }, isError: true, pageContext: this.currentProductPage };
                    this.load.addingToCart = null; setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 5000); return;
                }
                if (this.cartItems[existingItemIndex].quantity < productVariant.stock) { this.cartItems[existingItemIndex].quantity++; } 
                else { this.addedToCartMsg = { text: { en: 'Stock limit reached for this item.', ar: 'لقد وصلت إلى الحد الأقصى للمخزون لهذا المنتج.' }, isError: true, pageContext: this.currentProductPage }; this.load.addingToCart = null; setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000); return; }
            } else {
                const newItem = { ...productVariant, quantity: 1, uniqueIdInCart: Date.now().toString(36) + Math.random().toString(36).substring(2) };
                if (isUdheya && udheyaConfigDetails) { newItem.udheya_details = { ...udheyaConfigDetails }; }
                this.cartItems.push(newItem);
            }
            this.saveCartToStorage(); this.calculateFinalTotal(); 
            this.addedToCartMsg = { text: { en: `${productVariant.nameENSpec} added to cart.`, ar: `تمت إضافة ${productVariant.nameARSpec} إلى السلة.` }, isError: false, pageContext: this.currentProductPage };
            this.load.addingToCart = null;
            if (this.isUdheyaConfigModalOpen && udheyaConfigDetails && !udheyaConfigDetails.isBuyNowIntent) this.closeUdheyaConfiguration(); 
            setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000);
        },
        async buyNow(productVariant, udheyaConfigDetails = null) {
            this.load.addingToCart = productVariant.itemKey; 
            this.addedToCartMsg = { text: null, isError: false, pageContext: this.currentProductPage }; 
            this.clrAllErrs(); 

            if (!productVariant || !productVariant.itemKey || productVariant.stock <= 0) {
                this.addedToCartMsg = { text: { en: 'This item is out of stock.', ar: 'هذا المنتج غير متوفر.' }, isError: true, pageContext: this.currentProductPage };
                this.load.addingToCart = null;
                setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000);
                return;
            }

            const buyNowItem = {
                ...productVariant,
                quantity: 1, 
                uniqueIdInCart: Date.now().toString(36) + Math.random().toString(36).substring(2)
            };

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
                console.error("Error saving Buy Now item to localStorage", e);
                this.usrApiErr = "Could not proceed with Buy Now. Please try adding to cart.";
                this.load.addingToCart = null;
                return;
            }
            
            this.load.addingToCart = null;
            if (this.isUdheyaConfigModalOpen) this.closeUdheyaConfiguration();
            this.navigateToOrScroll('checkout.html?buyNow=true');
        },
        removeFromCart(uniqueIdInCart) { this.cartItems = this.cartItems.filter(item => item.uniqueIdInCart !== uniqueIdInCart); this.saveCartToStorage(); this.calculateFinalTotal();},
        updateCartQuantity(uniqueIdInCart, newQuantity) { 
            const itemIndex = this.cartItems.findIndex(i => i.uniqueIdInCart === uniqueIdInCart);
            if (itemIndex > -1) { 
                const item = this.cartItems[itemIndex];
                const qty = Math.max(1, parseInt(newQuantity) || 1);
                if (item.product_category === 'udheya' && qty > 1) { this.addedToCartMsg = { text: { en: 'Only one of each Udheya can be added.', ar: 'يمكن إضافة أضحية واحدة فقط من كل نوع.'}, isError: true, pageContext: 'cart' }; item.quantity = 1; setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000); } 
                else if (qty <= item.stock) { item.quantity = qty; this.addedToCartMsg = { text: null, isError: false, pageContext: '' }; } 
                else { item.quantity = item.stock; this.addedToCartMsg = { text: { en: 'Requested quantity exceeds available stock.', ar: 'الكمية المطلوبة تتجاوز المخزون المتاح.'}, isError: true, pageContext: 'cart' }; setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext: '' }, 3000);}
            } this.saveCartToStorage(); this.calculateFinalTotal();
        },
        getSubtotalForItem(cartItem) { let itemTotal = cartItem.priceEGP * cartItem.quantity; if (cartItem.product_category === 'udheya' && cartItem.udheya_details?.serviceOption === 'standard_service') { itemTotal += (this.settings.servFeeEGP || 0); } return itemTotal;},
        calculateCartSubtotal() { return this.cartItems.reduce((total, item) => total + (item.priceEGP * item.quantity), 0);},
        calculateTotalServiceFee() { return this.cartItems.reduce((totalFee, item) => { if (item.product_category === 'udheya' && item.udheya_details?.serviceOption === 'standard_service') { return totalFee + (this.settings.servFeeEGP || 0); } return totalFee; }, 0);},
        calculateCartTotal() { const subtotal = this.calculateCartSubtotal(); const serviceFee = this.calculateTotalServiceFee(); return subtotal + serviceFee;},
        saveCartToStorage() { try { localStorage.setItem('sheepLandCart-' + (this.currentUser?.id || 'guest'), JSON.stringify(this.cartItems)); } catch(e){ console.error("Error saving cart to localStorage", e); } },
        loadCartFromStorage() { try { const storedCart = localStorage.getItem('sheepLandCart-' + (this.currentUser?.id || 'guest')); if (storedCart) { this.cartItems = JSON.parse(storedCart); } else { this.cartItems = [];} } catch(e){ console.error("Error loading/parsing cart from localStorage", e); this.cartItems = []; localStorage.removeItem('sheepLandCart-' + (this.currentUser?.id || 'guest'));} this.calculateFinalTotal(); },
        clearCart() { this.cartItems = []; this.saveCartToStorage(); this.calculateFinalTotal(); },

        openUdheyaConfiguration(item, isBuyNowIntent = false) { 
            if (!item.isActive || item.stock <= 0) { this.addedToCartMsg = { text: { en: 'This Udheya is out of stock.', ar: 'هذه الأضحية غير متوفرة حالياً.' }, isError: true, pageContext: 'udheya' }; setTimeout(() => this.addedToCartMsg = { text: null, isError: false, pageContext:'' }, 3000); return; }
            this.configuringUdheyaItem = {...item}; 
            this.tempUdheyaConfig = JSON.parse(JSON.stringify(initialTempUdheyaConfig)); 
            this.tempUdheyaConfig.itemKey = item.itemKey; 
            this.tempUdheyaConfig.isBuyNowIntent = isBuyNowIntent; 
            this.isUdheyaConfigModalOpen = true; document.body.classList.add('overflow-hidden');
        },
        closeUdheyaConfiguration() { 
            this.isUdheyaConfigModalOpen = false; this.configuringUdheyaItem = null; 
            const errorKeys = ['udheya_service_config', 'udheya_sacrifice_day_config', 'udheya_distribution_choice_config', 'udheya_split_option_config'];
            errorKeys.forEach(key => this.clrErr(key));
            document.body.classList.remove('overflow-hidden');
        },
        confirmUdheyaConfigurationAndProceed() { 
            if (!this.configuringUdheyaItem) return; let isValid = true; 
            const errorKeys = ['udheya_service_config', 'udheya_sacrifice_day_config', 'udheya_distribution_choice_config', 'udheya_split_option_config'];
            errorKeys.forEach(key => this.clrErr(key));

            if (!this.tempUdheyaConfig.serviceOption) { this.setErr('udheya_service_config', 'select'); isValid = false; }
            if (!this.tempUdheyaConfig.sacrificeDay) { this.setErr('udheya_sacrifice_day_config', 'select'); isValid = false; }
            if (!this.tempUdheyaConfig.distribution.choice) { this.setErr('udheya_distribution_choice_config', 'select'); isValid = false; }
            if (this.tempUdheyaConfig.distribution.choice === 'split' && !this.tempUdheyaConfig.distribution.splitOption) { this.setErr('udheya_split_option_config', 'select'); isValid = false; }
            if (this.tempUdheyaConfig.distribution.choice === 'split' && this.tempUdheyaConfig.distribution.splitOption === 'custom' && !this.tempUdheyaConfig.distribution.customSplitText.trim()) { this.setErr('udheya_split_option_config', {en: 'Please specify custom split details.', ar: 'يرجى تحديد تفاصيل التقسيم المخصصة.'}); isValid = false; }
            if (!isValid) return;

            if (this.tempUdheyaConfig.isBuyNowIntent) {
                this.buyNow(this.configuringUdheyaItem, this.tempUdheyaConfig);
            } else {
                this.addItemToCart(this.configuringUdheyaItem, this.tempUdheyaConfig);
            }
        },
        getUdheyaConfigErrorText() {
            const errorKeys = ['udheya_service_config', 'udheya_sacrifice_day_config', 'udheya_distribution_choice_config', 'udheya_split_option_config'];
            for (const key of errorKeys) { if (this.errs[key]) return this.currLang === 'ar' ? this.errs[key].ar : this.errs[key].en; } return '';
        },

        openRefundModal() { this.isRefundModalOpen = true; document.body.classList.add('overflow-hidden'); },
        closeRefundModal() { this.isRefundModalOpen = false; document.body.classList.remove('overflow-hidden'); },
        openOrderStatusModal() { this.isOrderStatusModalOpen = true; document.body.classList.add('overflow-hidden'); this.$nextTick(() => this.$refs.lookupOrderIdInputModal?.focus()); },
        closeOrderStatusModal() { this.isOrderStatusModalOpen = false; document.body.classList.remove('overflow-hidden'); this.lookupOrderID = ''; this.statRes = null; this.statNotFound = false; this.clrErr('lookupOrderID');},

        startCd() { if(this.cdTimer)clearInterval(this.cdTimer); if(!this.settings.promoActive||!this.settings.promoEndISO) {this.cd.ended=true; return;} const t=new Date(this.settings.promoEndISO).getTime(); if(isNaN(t)){this.cd.ended=true; return;} this.updCdDisp(t); this.cdTimer=setInterval(()=>this.updCdDisp(t),1000); },
        updCdDisp(t) { const d = t - Date.now(); if (d < 0) { if (this.cdTimer) clearInterval(this.cdTimer); this.cd.days = "00"; this.cd.hours = "00"; this.cd.mins = "00"; this.cd.secs = "00"; this.cd.ended = true; return; } this.cd.ended = false; this.cd.days = String(Math.floor(d / 864e5)).padStart(2, '0'); this.cd.hours = String(Math.floor(d % 864e5 / 36e5)).padStart(2, '0'); this.cd.mins = String(Math.floor(d % 36e5 / 6e4)).padStart(2, '0'); this.cd.secs = String(Math.floor(d % 6e4 / 1e3)).padStart(2, '0'); },
        fmtPrice(p, c) { const cc=c||this.curr; const ci=this.settings?.xchgRates?.[cc]; if(p==null||p === undefined ||!ci||typeof ci.rate_from_egp !=='number') return`${ci?.symbol||(cc==='EGP'?'LE':'')} ---`; const cp=p*ci.rate_from_egp; return`${ci.symbol||(cc==='EGP'?'LE':cc)} ${cp.toFixed((ci.symbol==="LE"||ci.symbol==="ل.م"||cc==='EGP'||ci.symbol==="€")?0:2)}`; },
        getStockDisplayInfo(stock, isActive, lang = this.currLang) {
            if (!isActive) return lang === 'ar' ? "غير نشط" : "Inactive";
            if (stock === undefined || stock === null || stock <= 0) return lang === 'ar' ? "نفذ المخزون" : "Out of Stock";
            return lang === 'ar' ? `متوفر: ${stock}` : `${stock} Available`;
        },
        getSacrificeDayText(dayValue, lang) { const dayInfo = sacrificeDayMapInternal[dayValue]; return dayInfo ? (lang === 'ar' ? dayInfo.ar : dayInfo.en) : dayValue; },

        isEmailValid: (e) => (!e?.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
        isPhoneValid: (p) => p?.trim() && /^\+?[0-9\s\-()]{7,20}$/.test(p.trim()),
        setErr(f, m, isUserErr = true) { 
            this.errs[f] = (typeof m === 'string' ? this.errMsgs[m] || {en:m, ar:m} : m) || this.errMsgs.required; 
            if (isUserErr && typeof this.errs[f] === 'object') { this.usrApiErr = this.currLang === 'ar' ? this.errs[f].ar : this.errs[f].en; } 
            else if (isUserErr) { this.usrApiErr = String(this.errs[f]); } 
            this.$nextTick(() => { const firstErrorEl = document.querySelector(`[aria-invalid="true"]`); if (firstErrorEl) firstErrorEl.focus({ preventScroll: false }); else if (this.usrApiErr && !this.isCartOpen && !this.isOrderStatusModalOpen && !this.isRefundModalOpen && !this.isUdheyaConfigModalOpen) { const errInd = document.querySelector('.err-ind'); if(errInd) errInd.focus(); } }); 
        },
        clrErr(f) { if(this.errs[f]) delete this.errs[f]; let hasVisibleErrors = Object.keys(this.errs).some(key => this.errs[key]); if (!hasVisibleErrors) { this.usrApiErr = ""; this.apiErr = null;} },
        clrAllErrs() { this.errs = {}; this.usrApiErr = ""; this.apiErr = null; },
        focusRef(r, s=true) { this.$nextTick(()=>{ const target = this.$refs[r]; if(target){ target.focus({preventScroll:!s}); if(s) setTimeout(()=>{ try{ target.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'}); }catch(e){ console.warn("ScrollIntoView failed for:", r, e); } },50); } }) },
        
        slViewOpts() { return [ { val: 'none', txtEn: 'No Preference / Not Required', txtAr: 'لا يوجد تفضيل / غير مطلوب' }, { val: 'physical_inquiry', txtEn: 'Inquire about Physical Attendance', txtAr: 'الاستفسار عن الحضور الشخصي' }, { val: 'video_request', txtEn: 'Request Video/Photos of Process', txtAr: 'طلب فيديو/صور للعملية' }, { val: 'live_video_inquiry', txtEn: 'Inquire about Live Video', txtAr: 'الاستفسار عن فيديو مباشر' } ]; },
        distrOpts() { return [ { val: 'me', txtEn: 'Deliver All to Me', txtAr: 'توصيل الكل لي' }, { val: 'char', txtEn: 'Donate All (Sheep Land distributes)', txtAr: 'تبرع بالكل (أرض الأغنام توزع)' }, { val: 'split', txtEn: 'Split Portions', txtAr: 'تقسيم الحصص' } ]; },
        splitOptsList() { return [ { val: '1/3_me_2/3_charity_sl', txtEn: '1/3 me, 2/3 charity (SL)', txtAr: 'ثلث لي، ثلثان صدقة (أرض الأغنام)' }, { val: '1/2_me_1/2_charity_sl', txtEn: '1/2 me, 1/2 charity (SL)', txtAr: 'نصف لي، نصف صدقة (أرض الأغنام)' }, { val: '2/3_me_1/3_charity_sl', txtEn: '2/3 me, 1/3 charity (SL)', txtAr: 'ثلثان لي، ثلث صدقة (أرض الأغنام)' }, { val: 'all_me_custom_distro', txtEn: 'All for me (I distribute)', txtAr: 'الكل لي (أنا أوزع)' }, { val: 'custom', txtEn: 'Other (Specify) *', txtAr: 'أخرى (حدد) *' } ]; },
        deliveryTimeSlots: [ { value: "9AM-11AM", label: "9 AM - 11 AM" }, { value: "11AM-1PM", label: "11 AM - 1 PM" }, { value: "1PM-3PM", label: "1 PM - 3 PM" }, { value: "3PM-5PM", label: "3 PM - 5 PM" }, { value: "5PM-7PM", label: "5 PM - 7 PM"} ],

        initAuthPage() { if (this.currentUser) { this.navigateToOrScroll('account.html'); return; } this.auth.view = 'login'; this.clrAllErrs(); },
        async loginUser() { 
            this.clrAllErrs(); this.load.auth = true;
            try { const authData = await this.pb.collection('users').authWithPassword(this.auth.email, this.auth.password); 
                this.currentUser = authData.record; 
                this.checkoutForm.user_id = this.currentUser.id; 
                this.loadCartFromStorage(); 
                this.load.auth = false; 
                this.navigateToOrScroll(this.redirectAfterLogin || 'account.html'); 
                this.redirectAfterLogin = null; 
            } 
            catch (e) { this.load.auth = false; this.setErr('auth_login', this.errMsgs.auth_login); console.error("Login Error:", e.data || e); }
        },
        async registerUser() { 
            this.clrAllErrs(); this.load.auth = true;
            let regValid = true;
            if (!this.auth.name.trim()) { this.setErr('auth_name', this.errMsgs.auth_name); regValid = false; }
            if (!this.isEmailValid(this.auth.email)) { this.setErr('auth_email', this.errMsgs.email); regValid = false; }
            if (this.auth.password.length < 8) { this.setErr('auth_password', this.errMsgs.password_short); regValid = false; }
            if (this.auth.password !== this.auth.passwordConfirm) { this.setErr('auth_passwordConfirm', this.errMsgs.password_mismatch); regValid = false; }
            if (!regValid) { this.load.auth = false; return;}

            try { const data = {email: this.auth.email, password: this.auth.password, passwordConfirm: this.auth.passwordConfirm, name: this.auth.name, emailVisibility: true }; 
                const newUser = await this.pb.collection('users').create(data); 
                
                const usersCollection = await this.pb.collections.getOne("_pb_users_auth_");
                if (usersCollection && usersCollection.options && usersCollection.options.requireEmailVerification) {
                    await this.pb.collection('users').requestVerification(this.auth.email);
                     this.errs.auth_form_success = {en: 'Registration successful! Please check your email to verify your account, then login.', ar: 'تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك، ثم تسجيل الدخول.'};
                } else {
                    this.errs.auth_form_success = {en: 'Registration successful! Please login.', ar: 'تم التسجيل بنجاح! يرجى تسجيل الدخول.'};
                }
                this.load.auth = false; 
                this.auth.view = 'login'; this.auth.password = ""; this.auth.passwordConfirm = "";
            } 
            catch (e) { this.load.auth = false; if (e.data?.data) { Object.keys(e.data.data).forEach(key => { this.setErr(`auth_${key}`, {en: e.data.data[key].message, ar: e.data.data[key].message}); }); } else { this.setErr('auth_register', { en: e.data?.message || 'Registration failed. This email might already be in use.', ar: e.data?.message || 'فشل التسجيل. قد يكون هذا البريد الإلكتروني مستخدمًا بالفعل.' }); } console.error("Register Error:", e.data || e); }
        },
        logoutUser() { this.pb.authStore.clear(); this.currentUser = null; this.userOrders = []; this.checkoutForm = JSON.parse(JSON.stringify(initialCheckoutForm)); this.loadCartFromStorage(); this.navigateToOrScroll('index.html'); },

        async initAccountPage() { 
            if (!this.pb.authStore.isValid) { this.redirectAfterLogin = 'account.html'; this.navigateToOrScroll('auth.html'); return; } 
            if (!this.currentUser && this.pb.authStore.model) this.currentUser = this.pb.authStore.model; 
            if (this.currentUser) await this.fetchUserOrders(); 
        },
        async fetchUserOrders() { 
            if (!this.currentUser) return; this.load.orders = true; this.clrErr('orders_fetch');
            try { const resultList = await this.pb.collection('orders').getFullList({ filter: `user = "${this.currentUser.id}"`, sort: '-created' });
                this.userOrders = resultList.map(order => ({ ...order, order_status: order.order_status?.replace(/_/g, " ") || "N/A", payment_status: order.payment_status?.replace(/_/g, " ") || "N/A"}));
            } catch (e) { this.setErr('orders_fetch', this.errMsgs.orders_fetch); console.error("Fetch Orders Error:", e.data || e); } 
            finally { this.load.orders = false; }
        },

        initCheckoutPage() { 
            const urlParams = new URLSearchParams(window.location.search);
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
                } catch (e) { console.error("Error loading Buy Now item from localStorage", e); }
            } else {
                this.loadCartFromStorage();
            }
            
            if (this.cartItems.length === 0 && !this.orderConf.show) { 
                this.navigateToOrScroll('udheya.html'); 
                return; 
            }
            this.checkoutForm = JSON.parse(JSON.stringify(initialCheckoutForm)); 
            if (this.currentUser) { 
                this.checkoutForm.customer_name = this.currentUser.name || ""; 
                this.checkoutForm.customer_email = this.currentUser.email || ""; 
                this.checkoutForm.user_id = this.currentUser.id; 
            } else { this.checkoutForm.user_id = null; }
            this.updateDeliveryFeeForCheckout(); 
            this.calculateFinalTotal();
        },
        deliveryNeededForCart() { 
            return this.cartItems.some(item => {
                if (item.product_category === 'udheya') { const distChoice = item.udheya_details?.distribution?.choice; const splitOpt = item.udheya_details?.distribution?.splitOption; const customSplit = item.udheya_details?.distribution?.customSplitText?.toLowerCase();
                    return distChoice === 'me' || (distChoice === 'split' && (["1/3_me_2/3_charity_sl", "1/2_me_1/2_charity_sl", "2/3_me_1/3_charity_sl", "all_me_custom_distro"].includes(splitOpt) || (splitOpt === 'custom' && customSplit && (customSplit.includes("for me") || customSplit.includes("all delivered to me") || customSplit.includes("لي") || customSplit.includes("توصيل لي") || customSplit.includes("استلام"))) ));
                } return ['meat_cuts', 'livestock_general', 'gathering_package'].includes(item.product_category);
            });
        },
        updateDeliveryFeeForCheckout() { this.checkoutForm.delivery_fee_egp = 0; this.isDelFeeVar = false; if (!this.deliveryNeededForCart() || !this.checkoutForm.delivery_city_id) { this.calculateFinalTotal(); return; } const cityData = this.allCities.find(c => c.id === this.checkoutForm.delivery_city_id); if (cityData && typeof cityData.delFeeEgp === 'number') { this.checkoutForm.delivery_fee_egp = cityData.delFeeEgp; this.isDelFeeVar = false; } else if (cityData && cityData.delFeeEgp === null) { this.isDelFeeVar = true; this.checkoutForm.delivery_fee_egp = 0; } else { this.isDelFeeVar = true; this.checkoutForm.delivery_fee_egp = 0; } this.calculateFinalTotal(); },
        calculateFinalTotal() { const cartSubtotal = this.calculateCartSubtotal(); const totalServiceFee = this.calculateTotalServiceFee(); this.checkoutForm.total_service_fee_egp = totalServiceFee; let deliveryFee = 0; if (this.deliveryNeededForCart() && this.checkoutForm.delivery_fee_egp > 0 && !this.isDelFeeVar) { deliveryFee = this.checkoutForm.delivery_fee_egp; } let onlinePaymentFee = 0; if (this.checkoutForm.payment_method === 'online_card' && this.settings.online_payment_fee_egp > 0) { onlinePaymentFee = this.settings.online_payment_fee_egp; } this.checkoutForm.online_payment_fee_applied_egp = onlinePaymentFee; this.checkoutForm.final_total_egp = cartSubtotal + totalServiceFee + deliveryFee + onlinePaymentFee; },
        validateCheckoutForm() { 
            this.clrAllErrs(); let isValid = true;
            if (!this.checkoutForm.customer_name.trim()) { this.setErr('customer_name', 'required'); isValid = false; }
            if (!this.isPhoneValid(this.checkoutForm.customer_phone)) { this.setErr('customer_phone', 'phone'); isValid = false; }
            if (!this.isEmailValid(this.checkoutForm.customer_email)) { this.setErr('customer_email', 'email'); isValid = false; }
            if (this.deliveryNeededForCart()) { if (!this.checkoutForm.delivery_city_id) { this.setErr('delivery_city_id', 'select'); isValid = false; } if (!this.checkoutForm.delivery_address.trim()) { this.setErr('delivery_address', 'required'); isValid = false; } if (!this.checkoutForm.delivery_time_slot) { this.setErr('delivery_time_slot', {en: 'Please select a delivery time slot.', ar: 'يرجى اختيار وقت التوصيل.'}); isValid = false; } }
            if (!this.checkoutForm.payment_method) { this.setErr('payment_method', 'select'); isValid = false; }
            if (!this.checkoutForm.terms_agreed) { this.setErr('terms_agreed', 'terms_agreed'); isValid = false; }
            if(!isValid && this.$refs.checkoutTitle) this.focusRef('checkoutTitle'); return isValid;
        },
        async processOrder() { 
            if (!this.validateCheckoutForm()) return; this.load.checkout = true; this.usrApiErr = ""; this.apiErr = "";
            const lineItemsForOrder = this.cartItems.map(item => { let lineItem = { item_key_pb: item.varIdPb, product_category: item.product_category, name_en: item.nameENSpec, name_ar: item.nameARSpec, quantity: item.quantity, price_egp_each: item.priceEGP, udheya_details: null }; if (item.product_category === 'udheya' && item.udheya_details) { lineItem.udheya_details = item.udheya_details; } return lineItem; });
            let deliveryOpt = "self_pickup_or_internal_distribution"; if (this.deliveryNeededForCart()) { deliveryOpt = "home_delivery"; } else { this.checkoutForm.delivery_city_id = ""; this.checkoutForm.delivery_address = ""; this.checkoutForm.delivery_instructions = ""; this.checkoutForm.delivery_time_slot = ""; this.checkoutForm.delivery_fee_egp = 0; } this.calculateFinalTotal();
            const orderPayload = { order_id_text: `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`, user: this.checkoutForm.user_id || null, customer_name: this.checkoutForm.customer_name, customer_phone: this.checkoutForm.customer_phone, customer_email: this.checkoutForm.customer_email, line_items: lineItemsForOrder, delivery_option: deliveryOpt, delivery_city_id: this.checkoutForm.delivery_city_id, delivery_address: this.checkoutForm.delivery_address, delivery_instructions: this.checkoutForm.delivery_instructions, delivery_time_slot: this.checkoutForm.delivery_time_slot, payment_method: this.checkoutForm.payment_method, terms_agreed: this.checkoutForm.terms_agreed, selected_display_currency: this.curr, subtotal_amount_egp: this.calculateCartSubtotal(), total_udheya_service_fee_egp: this.checkoutForm.total_service_fee_egp, delivery_fee_applied_egp: this.checkoutForm.delivery_fee_egp, online_payment_fee_applied_egp: this.checkoutForm.online_payment_fee_applied_egp, total_amount_due_egp: this.checkoutForm.final_total_egp, };
            try { const createdOrder = await this.pb.collection('orders').create(orderPayload); this.orderConf.orderID = createdOrder.order_id_text; this.orderConf.totalEgp = createdOrder.total_amount_due_egp; this.orderConf.items = createdOrder.line_items.map(li => ({...li})); this.orderConf.customerEmail = createdOrder.customer_email; this.orderConf.paymentInstructions = this.getPaymentInstructionsHTML(createdOrder.payment_method, createdOrder.total_amount_due_egp, createdOrder.order_id_text); this.orderConf.show = true; 
                const urlParams = new URLSearchParams(window.location.search);
                const isBuyNow = urlParams.get('buyNow') === 'true';
                if (!isBuyNow) { 
                    this.clearCart(); 
                }
                localStorage.removeItem('sheepLandBuyNowItem'); 
                this.checkoutForm = JSON.parse(JSON.stringify(initialCheckoutForm)); 
                this.$nextTick(() => { if(this.$refs.orderConfTitle) this.navigateToOrScroll('#order-conf-sect'); else console.warn("Order conf title ref not found for scroll"); this.focusRef('orderConfTitle'); }); } 
            catch (e) { this.apiErr = String(e.data?.message || e.message || "Order placement failed."); let userFriendlyError = "An unexpected error occurred. Please check your selections or contact support."; if (e.data && typeof e.data === 'object') { if (e.data.message && e.data.message.toLowerCase().includes("out of stock")) { userFriendlyError = "One or more items in your cart are now out of stock. Please review your cart."; this.usrApiErr = userFriendlyError; await this.initApp(); this.openCart(); } else if (e.data.data && Object.keys(e.data.data).length > 0) { Object.keys(e.data.data).forEach(serverFieldKey => { const clientFieldKey = serverFieldKey; if(this.checkoutForm.hasOwnProperty(clientFieldKey) || clientFieldKey.startsWith('line_items.')) { this.setErr(clientFieldKey, {en: e.data.data[serverFieldKey].message, ar: e.data.data[serverFieldKey].message }, false); }}); userFriendlyError = "Please correct the highlighted errors."; this.usrApiErr = userFriendlyError; } else if (e.data.message) { this.usrApiErr = e.data.message; } } else { this.usrApiErr = userFriendlyError; } if (this.apiErr && !this.orderConf.show && document.querySelector('.err-ind')) { this.$nextTick(() => this.navigateToOrScroll('.err-ind')); }} 
            finally { this.load.checkout = false; }
        },
        getPaymentInstructionsHTML(payMeth, totalEgp, orderID) { 
            let instructions = ""; const priceText = this.fmtPrice(totalEgp); const waLink = `https://wa.me/${this.settings.waNumRaw}?text=Order%20Payment%20Confirmation%3A%20${orderID}`;
            const confirmWALink = `<a href="${waLink}" target="_blank" rel="noopener noreferrer" class="link-style">${this.settings.waNumDisp || 'WhatsApp'}</a>`;
            if (payMeth === 'online_card') { instructions = `<div class="bil-row"><p class="en">Your order total is <strong>${priceText}</strong>. To complete your payment via our secure online gateway, you will be contacted shortly with instructions or redirected. If you are not redirected or contacted within a few minutes, please contact us referencing Order ID: <strong class="pay-ref">${orderID}</strong>.</p><p class="ar">إجمالي طلبك هو <strong>${priceText}</strong>. لإتمام الدفع عبر بوابتنا الآمنة عبر الإنترنت، سنتصل بك قريبًاพร้อมًا بالتعليمات أو سيتم إعادة توجيهك. إذا لم يتم إعادة توجيهك أو الاتصال بك في غضون دقائق قليلة، فيرجى الاتصال بنا مع ذكر رقم الطلب: <strong class="pay-ref">${orderID}</strong>.</p></div>`; } 
            else if (payMeth === 'fa') { instructions = `<div class="bil-row"><p class="en">Fawry: Pay <strong>${priceText}</strong>. Use Order ID <strong class="pay-ref">${orderID}</strong>. Due in 24h.</p><p class="ar">فوري: ادفع <strong>${priceText}</strong>. استخدم رقم الطلب <strong class="pay-ref">${orderID}</strong>. خلال 24س.</p></div>`; } 
            else if (payMeth === 'vo') { instructions = `<div class="bil-row"><p class="en">Vodafone Cash: Pay <strong>${priceText}</strong> to <strong class="pay-ref">${this.settings.payDetails?.vodafone_cash || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">فودافون كاش: ادفع <strong>${priceText}</strong> إلى <strong class="pay-ref">${this.settings.payDetails?.vodafone_cash || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; } 
            else if (payMeth === 'ip') { instructions = `<div class="bil-row"><p class="en">InstaPay: Pay <strong>${priceText}</strong> to <strong class="pay-ref">${this.settings.payDetails?.instapay_ipn || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">إنستا باي: ادفع <strong>${priceText}</strong> إلى <strong class="pay-ref">${this.settings.payDetails?.instapay_ipn || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; } 
            else if (payMeth === 'revolut') { instructions = `<div class="bil-row"><p class="en">Revolut: Pay <strong>${priceText}</strong> to <strong class="pay-ref">${this.settings.payDetails?.revolut_details || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">ريفولوت: ادفع <strong>${priceText}</strong> إلى <strong class="pay-ref">${this.settings.payDetails?.revolut_details || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; } 
            else if (payMeth === 'monzo') { instructions = `<div class="bil-row"><p class="en">Monzo: Pay <strong>${priceText}</strong> to <strong class="pay-ref">${this.settings.payDetails?.monzo_details || 'N/A'}</strong>. Ref: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">مونزو: ادفع <strong>${priceText}</strong> إلى <strong class="pay-ref">${this.settings.payDetails?.monzo_details || 'غير متوفر'}</strong>. مرجع: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; } 
            else if (payMeth === 'bank_transfer') { instructions = `<div class="bil-row"><p class="en">Bank Transfer <strong>${priceText}</strong> to:</p><p class="ar">تحويل بنكي <strong>${priceText}</strong> إلى:</p></div><ul class="bank-dets"><li class="bil-row"><span class="en">Bank: <strong class="pay-ref">${this.settings.payDetails?.bank_name || 'N/A'}</strong></span><span class="ar">البنك: <strong class="pay-ref">${this.settings.payDetails?.bank_name || 'غير متوفر'}</strong></span></li><li class="bil-row"><span class="en">Acc Name: <strong class="pay-ref">${this.settings.payDetails?.bank_account_name || 'N/A'}</strong></span><span class="ar">اسم الحساب: <strong class="pay-ref">${this.settings.payDetails?.bank_account_name || 'غير متوفر'}</strong></span></li><li class="bil-row"><span class="en">Acc No: <strong class="pay-ref">${this.settings.payDetails?.bank_account_number || 'N/A'}</strong></span><span class="ar">رقم الحساب: <strong class="pay-ref">${this.settings.payDetails?.bank_account_number || 'غير متوفر'}</strong></span></li>${this.settings.payDetails?.bank_iban ? `<li class="bil-row"><span class="en">IBAN: <strong class="pay-ref">${this.settings.payDetails.bank_iban}</strong></span><span class="ar">IBAN: <strong class="pay-ref">${this.settings.payDetails.bank_iban}</strong></span></li>` : ''}${this.settings.payDetails?.bank_swift ? `<li class="bil-row"><span class="en">SWIFT: <strong class="pay-ref">${this.settings.payDetails.bank_swift}</strong></span><span class="ar">SWIFT: <strong class="pay-ref">${this.settings.payDetails.bank_swift}</strong></span></li>` : ''}</ul><div class="bil-row bank-note"><p class="en">Crucial: Ref Order ID: <strong class="pay-ref">${orderID}</strong>. Confirm via ${confirmWALink}.</p><p class="ar">هام: مرجع الطلب: <strong class="pay-ref">${orderID}</strong>. أكد عبر ${confirmWALink}.</p></div>`; } 
            else if (payMeth === 'cod') { let codNote = this.isDelFeeVar && this.deliveryNeededForCart() ? `<br><span class="en">Note: Delivery fee for your area will be confirmed by phone and paid separately.</span><span class="ar">ملاحظة: سيتم تأكيد رسوم التوصيل لمنطقتكم عبر الهاتف وتدفع بشكل منفصل.</span>` : ""; instructions = `<div class="bil-row"><p class="en">COD: Our team will call <strong>${this.checkoutForm.customer_phone}</strong> to confirm. Total Amount Due <strong>${priceText}</strong>. Order ID: <strong class="pay-ref">${orderID}</strong>.${codNote}</p><p class="ar">الدفع عند الاستلام: سيتصل بك الفريق على <strong>${this.checkoutForm.customer_phone}</strong> للتأكيد. المجموع الكلي للطلب <strong>${priceText}</strong>. رقم الطلب: <strong class="pay-ref">${orderID}</strong>.${codNote}</p></div>`; } return instructions;
        },

        async submitStatValid() { this.clrErr('lookupOrderID'); if (!(this.lookupOrderID || "").trim()) { this.setErr('lookupOrderID', 'required'); this.$refs.lookupOrderIdInputModal?.focus(); return; } await this.chkOrderStatus(); },
        async chkOrderStatus() { 
            this.statRes = null; this.statNotFound = false; this.load.status = true; this.apiErr = null; this.usrApiErr = ""; const id = (this.lookupOrderID || "").trim();
            try { 
                const result = await this.pb.collection('orders').getList(1, 1, {
                    filter: `order_id_text = "${this.pb.utils.escapeFieldValue(id)}"`,
                });
                if (result.items && result.items.length > 0) { 
                    const o = result.items[0]; 
                    this.statRes = { 
                        orderIdTxt: o.order_id_text, customer_name: o.customer_name, 
                        order_status: o.order_status?.replace(/_/g," ")||"N/A", 
                        payment_status: o.payment_status?.replace(/_/g, " ") || "N/A", 
                        line_items: o.line_items || [], total_amount_due_egp: o.total_amount_due_egp, 
                        payment_method: o.payment_method, delivery_option: o.delivery_option, 
                        delivery_address: o.delivery_address, 
                        delivery_area_name_en: o.delivery_area_name_en, 
                        delivery_area_name_ar: o.delivery_area_name_ar 
                    }; 
                } else { this.statNotFound = true; this.usrApiErr = "No order found with that ID."; }
            } catch (e) { this.apiErr=String(e.message); this.usrApiErr="Could not get order status. Please check details or contact support."; this.statNotFound=true; console.error("Check Status Error:", e.data || e); }
            finally { this.load.status = false; }
        },
    }));
});
