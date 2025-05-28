document.addEventListener('alpine:init', () => {
    const initialBookingStateData = {
        selectedAnimal: { type: "", item_key: "", variant_pb_id: "", weight_range_en: "", weight_range_ar: "", basePriceEGP: 0, nameEN: "", nameAR: "", stock: null, typeGenericNameEN: "", typeGenericNameAR: "", typePricePerKgEGP:0 },
        orderingPersonName: "", 
        orderingPersonPhone: "", 
        customerEmail: "", 
        niyyahNames: "",
        selectedUdheyaService: 'standard_service', 
        currentServiceFeeEGP: 0, 
        selectedSacrificeDay: { value: "day1_10_dhul_hijjah", textEN: "Day 1 of Eid (10th Dhul Hijjah)", textAR: "اليوم الأول (10 ذو الحجة)"},
        slaughterViewingPreference: "none", 
        distributionChoice: "me", 
        splitDetailsOption: "", 
        customSplitDetailsText: "", 
        deliveryCity: "", 
        allAvailableCities: [], 
        deliveryAddress: "", 
        deliveryInstructions: "", 
        selectedTimeSlot: "8 AM-9 AM", 
        groupPurchase: false, 
        paymentMethod: "fa", 
        errors: {},
        totalPriceEGP: 0,
        lookupPhoneNumber: "" 
    };

    const paymentMethodDisplayOptionsStructure = [ 
        { id: 'revolut', title: 'Revolut', imgSrc: 'images/revolut.svg' }, { id: 'monzo', title: 'Monzo', imgSrc: 'images/monzo.svg' },
        { id: 'ip', title: 'InstaPay', imgSrc: 'images/instapay.svg' }, { id: 'fa', title: 'Fawry', imgSrc: 'images/fawry.svg' },
        { id: 'vo', title: 'Vodafone Cash', imgSrc: 'images/vodafone.svg' }, { id: 'cod', title: 'Cash on Delivery', imgSrc: 'images/cod.svg' },
        { id: 'bank_transfer', title: 'Bank Transfer', imgSrc: 'images/bank_transfer.svg' }
    ];
    
    async function callCustomBookUdheyaEndpoint(bookingPayload) {
        const pb = new PocketBase('/');
        try {
            const result = await pb.send("/api/custom_book_udheya", {
                method: "POST",
                body: bookingPayload,
            });
            return result; 
        } catch (error) {
            console.error("Error calling /api/custom_book_udheya endpoint:", error);
            let userMessage = "Failed to place booking. Please try again.";
            if (error.data && error.data.error) { 
                userMessage = error.data.error;
            } else if (error.data && error.data.data && Object.keys(error.data.data).length > 0) { 
                userMessage = "Booking failed due to validation issues: ";
                const fieldErrors = [];
                for (const key in error.data.data) {
                    fieldErrors.push(`${key}: ${error.data.data[key].message}`);
                }
                userMessage += fieldErrors.join("; ");
            } else if (error.message) {
                 userMessage = error.message;
            }
            throw new Error(userMessage);
        }
    }

    Alpine.data('udheyaBooking', () => ({
        isLoading: { status: false, booking: false, init: true },
        appSettings: { 
            exchange_rates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true } }, 
            default_currency: "EGP",
            whatsapp_number_raw: "201001234567", whatsapp_number_display: "+20 100 123 4567",
            promo_end_date_iso: new Date().toISOString(), promo_discount_percent: 0, promo_is_active: false,
            udheya_service_surcharge_egp: 750,
            delivery_areas: [], 
            payment_details: {}
        },
        productOptions: { livestock: [] }, // This will be a list of types, each containing its variants (products)
        get availablePaymentMethods() { 
            return paymentMethodDisplayOptionsStructure; 
        },
        apiError: null, userFriendlyApiError: "", ...JSON.parse(JSON.stringify(initialBookingStateData)),
        bookingConfirmed: false, statusResult: null, statusNotFound: false, lookupBookingID: "", 
        currentConceptualStep: 1, stepProgress: { step1: false, step2: false, step3: false, step4: false, step5: false },
        isMobileMenuOpen: false, isUdheyaDropdownOpen: false, isUdheyaMobileSubmenuOpen: false,
        countdown: { days: "00", hours: "00", minutes: "00", seconds: "00", ended: false },
        countdownTimerInterval: null, currentLang: "en",
        errorMessages: { required: { en: "This field is required.", ar: "هذا الحقل مطلوب." }, select: { en: "Please make a selection.", ar: "يرجى الاختيار." }, email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." }, phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." }, timeSlot: { en: "Please select a time slot.", ar: "يرجى اختيار وقت التوصيل." }, udheyaService: {en: "Please select a service option.", ar: "يرجى اختيار خيار الخدمة."}},
        navLinksData: [ { href: "#udheya-booking-start", sectionId: "udheya-booking-start", parentMenu: "Udheya" }, { href: "#check-booking-status", sectionId: "check-booking-status", parentMenu: "Udheya" }],
        activeNavLinkHref: "", stepSectionsMeta: [], deliveryFeeForDisplayEGP: 0, isDeliveryFeeVariable: false,

        getEnglishStockStatusText(stock, isActive) {
            if (!isActive) return "Inactive";
            if (stock === undefined || stock === null || stock <= 0) return "Out of Stock";
            if (stock > 0 && stock <= 5) return "Limited Stock";
            return "Available";
        },
        slaughterViewingOptions() {
            return [
                { value: 'none', textEn: 'No Preference / Not Required', textAr: 'لا يوجد تفضيل / غير مطلوب' },
                { value: 'physical_inquiry', textEn: 'Inquire about Physical Attendance', textAr: 'الاستفسار عن الحضور الشخصي' },
                { value: 'video_request', textEn: 'Request Video/Photos of Process', textAr: 'طلب فيديو/صور للعملية' },
                { value: 'live_video_inquiry', textEn: 'Inquire about Live Video', textAr: 'الاستفسار عن فيديو مباشر' }
            ];
        },
        distributionChoiceOptions() {
            return [
                { value: 'me', textEn: 'Deliver All to Me', textAr: 'توصيل الكل لي' },
                { value: 'char', textEn: 'Donate All (Sheep Land distributes)', textAr: 'تبرع بالكل (أرض الأغنام توزع)' },
                { value: 'split', textEn: 'Split Portions', textAr: 'تقسيم الحصص' }
            ];
        },
        splitDetailOptionsList() {
            return [
                { value: '1/3_me_2/3_charity_sl', textEn: '1/3 me, 2/3 charity (SL)', textAr: 'ثلث لي، ثلثان صدقة (أرض الأغنام)' },
                { value: '1/2_me_1/2_charity_sl', textEn: '1/2 me, 1/2 charity (SL)', textAr: 'نصف لي، نصف صدقة (أرض الأغنام)' },
                { value: '2/3_me_1/3_charity_sl', textEn: '2/3 me, 1/3 charity (SL)', textAr: 'ثلثان لي، ثلث صدقة (أرض الأغنام)' },
                { value: 'all_me_custom_distro', textEn: 'All for me (I distribute)', textAr: 'الكل لي (أنا أوزع)' },
                { value: 'custom', textEn: 'Other (Specify) *', textAr: 'أخرى (حدد) *' }
            ];
        },

        async initApp() {
            this.isLoading.init = true; this.apiError = null; this.userFriendlyApiError = "";
            const pb = new PocketBase('/');

            try {
                const settingsRecords = await pb.collection('app_settings').getFullList({ requestKey: null });
                if (settingsRecords && settingsRecords.length > 0) {
                    const remoteSettings = settingsRecords[0];
                    this.appSettings.exchange_rates = remoteSettings.exchange_rates_json || this.appSettings.exchange_rates;
                    this.appSettings.default_currency = remoteSettings.default_currency || this.appSettings.default_currency;
                    this.appSettings.whatsapp_number_raw = remoteSettings.whatsapp_number_raw || this.appSettings.whatsapp_number_raw;
                    this.appSettings.whatsapp_number_display = remoteSettings.whatsapp_number_display || this.appSettings.whatsapp_number_display;
                    this.appSettings.promo_end_date_iso = remoteSettings.promo_end_date_iso || this.appSettings.promo_end_date_iso;
                    this.appSettings.promo_discount_percent = remoteSettings.promo_discount_percent === undefined ? this.appSettings.promo_discount_percent : remoteSettings.promo_discount_percent;
                    this.appSettings.promo_is_active = remoteSettings.promo_is_active !== undefined ? remoteSettings.promo_is_active : this.appSettings.promo_is_active;
                    this.appSettings.udheya_service_surcharge_egp = remoteSettings.udheya_service_surcharge_egp === undefined ? this.appSettings.udheya_service_surcharge_egp : remoteSettings.udheya_service_surcharge_egp;
                    this.appSettings.delivery_areas = remoteSettings.delivery_areas_json || this.appSettings.delivery_areas;
                    this.appSettings.payment_details = remoteSettings.payment_details_json || this.appSettings.payment_details;
                } else {
                    console.warn("App settings not found in PocketBase. Using client-side defaults.");
                    this.userFriendlyApiError = "Application configuration could not be loaded. Some features might be limited.";
                }
                this.currentServiceFeeEGP = this.appSettings.udheya_service_surcharge_egp;

                // Fetch all products (variants with type info embedded)
                const fetchedProducts = await pb.collection('products').getFullList({ 
                    sort: '+sort_order_type,+sort_order_variant', // Sort by type, then by variant within type
                    filter: 'is_active = true', 
                    requestKey: null 
                });
                
                // Transform flat product list into grouped structure for the UI
                const productGroups = {};
                fetchedProducts.forEach(p => {
                    if (!productGroups[p.type_key]) {
                        productGroups[p.type_key] = {
                            value_key: p.type_key,
                            name_en: p.type_name_en,
                            name_ar: p.type_name_ar,
                            description_en: p.type_description_en,
                            description_ar: p.type_description_ar,
                            price_per_kg_egp: p.price_per_kg_egp,
                            weights_prices: []
                        };
                    }
                    productGroups[p.type_key].weights_prices.push({
                        item_key: p.item_key,
                        variant_id_pb: p.id, // Store PB ID of the product record
                        nameEN_specific: p.variant_name_en,
                        nameAR_specific: p.variant_name_ar,
                        weight_range_text_en: p.weight_range_text_en,
                        weight_range_text_ar: p.weight_range_text_ar,
                        avg_weight_kg: p.avg_weight_kg,
                        basePriceEGP: p.base_price_egp,
                        current_stock: p.stock_available_pb,
                        is_active: p.is_active
                    });
                });
                this.productOptions.livestock = Object.values(productGroups);

            } catch (e) {
                console.error("Error fetching initial application data from PocketBase:", e);
                this.apiError = "Could not load application configuration or products from server.";
                this.userFriendlyApiError = "Error loading essential data. Please try again later or contact support.";
                this.productOptions.livestock = [];
            }
            
            let cities = []; 
            (this.appSettings.delivery_areas || []).forEach(gov => {
                if (gov.cities && gov.cities.length > 0) { gov.cities.forEach(city => { cities.push({ id: `${gov.id}_${city.id}`, name_en: `${gov.name_en} - ${city.name_en}`, name_ar: `${gov.name_ar} - ${city.name_ar}`, delivery_fee_egp: city.delivery_fee_egp, governorate_id: gov.id, governorate_name_en: gov.name_en, governorate_name_ar: gov.name_ar }); });
                } else if (gov.delivery_fee_egp !== undefined) { cities.push({ id: gov.id, name_en: gov.name_en, name_ar: gov.name_ar, delivery_fee_egp: gov.delivery_fee_egp, governorate_id: gov.id, governorate_name_en: gov.name_en, governorate_name_ar: gov.name_ar });}
            });
            this.allAvailableCities = cities.sort((a,b) => a.name_en.localeCompare(b.name_en));
            this.updateServiceFee(); 
            this.currentCurrency = this.appSettings.default_currency;
            this.startOfferDHDMSCountdown(); 
            this.updateSacrificeDayTexts(); 
            this.clearAllErrors();

            this.$nextTick(() => {
                if (this.productOptions.livestock?.length > 0) { this.updateAllDisplayedPrices(); }
                else if (!this.apiError) { this.userFriendlyApiError = "No sheep options are currently available. Please check back later."; }
                this.updateAllStepCompletionStates(); this.handleScroll();
                this.focusOnRef(this.bookingConfirmed ? "bookingConfirmedTitle" : "body", false);
                this.updateDeliveryFeeDisplay(); this.isLoading.init = false;
            });

            this.stepSectionsMeta = [
                { id: "#step1-content", conceptualStep: 1, titleRef: "step1Title", firstFocusableErrorRef: (this.productOptions.livestock[0]?.value_key + 'WeightSelect') || 'step1Title', validator: this.validateStep1.bind(this) },
                { id: "#step2-content", conceptualStep: 2, titleRef: "step2Title", firstFocusableErrorRef: 'orderingPersonNameInput_s2', validator: this.validateStep2.bind(this) },
                { id: "#step3-content", conceptualStep: 3, titleRef: "step3Title", firstFocusableErrorRef: 'udheyaServiceRadios_s3', validator: this.validateStep3.bind(this) },
                { id: "#step4-content", conceptualStep: 4, titleRef: "step4Title", firstFocusableErrorRef: 'distributionChoiceSelect_s4', validator: this.validateStep4.bind(this) },
                { id: "#step5-content", conceptualStep: 5, titleRef: "step5Title", firstFocusableErrorRef: 'paymentMethodRadios', validator: this.validateStep5.bind(this) }
            ];
            ['selectedAnimal.basePriceEGP', 'currentCurrency', 'currentServiceFeeEGP'].forEach(prop => this.$watch(prop, () => { this.calculateTotalPrice(); if(prop !== 'currentServiceFeeEGP') this.updateAllDisplayedPrices(); }));
            this.$watch('appSettings.udheya_service_surcharge_egp', () => { this.updateServiceFee(); });
            ['selectedSacrificeDay.value', 'distributionChoice', 'splitDetailsOption', 'customSplitDetailsText', 'orderingPersonName', 'orderingPersonPhone', 'customerEmail', 'deliveryAddress', 'selectedTimeSlot', 'paymentMethod', 'slaughterViewingPreference', 'deliveryCity', 'selectedUdheyaService', 'niyyahNames'].forEach(prop => this.$watch(prop, (nv,ov) => { 
                this.updateAllStepCompletionStates(); 
                if (prop === 'deliveryCity' && nv !== ov) {this.updateDeliveryFeeDisplay(); this.calculateTotalPrice();} 
                if (prop === 'selectedUdheyaService') this.updateServiceFee(); 
                if (prop === 'distributionChoice') this.calculateTotalPrice(); 
            }));
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
            window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.startOfferDHDMSCountdown(); else if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval); });
        },
        updateServiceFee() { 
            if (this.selectedUdheyaService === 'standard_service') { this.currentServiceFeeEGP = this.appSettings.udheya_service_surcharge_egp || 0; }
            else if (this.selectedUdheyaService === 'live_animal_only') { this.currentServiceFeeEGP = 0; }
            else { this.selectedUdheyaService = 'standard_service'; this.currentServiceFeeEGP = this.appSettings.udheya_service_surcharge_egp || 0; }
            this.calculateTotalPrice();
         },
        handleScroll() {
            if (!this.bookingConfirmed && this.stepSectionsMeta.some(step => { const el = document.querySelector(step.id); return el && typeof el.offsetTop === 'number'; })) {
                const scrollMidPoint = window.scrollY + (window.innerHeight / 2); let closestStep = 1; let minDistance = Infinity;
                this.stepSectionsMeta.forEach(stepMeta => { const element = document.querySelector(stepMeta.id); if (element) { const distance = Math.abs(scrollMidPoint - (element.offsetTop + (element.offsetHeight / 2))); if (distance < minDistance) { minDistance = distance; closestStep = stepMeta.conceptualStep; } } });
                if (this.currentConceptualStep !== closestStep) this.currentConceptualStep = closestStep;
            }
            const headerHeight = document.querySelector('.site-header')?.offsetHeight || 70; const scrollCheckOffset = headerHeight + (window.innerHeight * 0.10); const currentScrollYWithOffset = window.scrollY + scrollCheckOffset; let newActiveNavLinkHref = ""; let newActiveParentMenu = null;
            for (const navLink of this.navLinksData) { const sectionElement = document.getElementById(navLink.sectionId); if (sectionElement) { const sectionTop = sectionElement.offsetTop; const sectionBottom = sectionTop + sectionElement.offsetHeight; if (sectionTop <= currentScrollYWithOffset && sectionBottom > currentScrollYWithOffset) { newActiveNavLinkHref = navLink.href; newActiveParentMenu = navLink.parentMenu; break; } } }
            const firstNavLinkSection = document.getElementById(this.navLinksData[0]?.sectionId);
            if (window.scrollY < (firstNavLinkSection?.offsetTop || headerHeight) - headerHeight) { newActiveNavLinkHref = ""; newActiveParentMenu = null; }
            else if ((window.innerHeight + Math.ceil(window.scrollY)) >= (document.body.offsetHeight - 2)) { const lastVisibleNavLink = this.navLinksData.slice().reverse().find(nl => document.getElementById(nl.sectionId)); if (lastVisibleNavLink) { newActiveNavLinkHref = lastVisibleNavLink.href; newActiveParentMenu = lastVisibleNavLink.parentMenu; } }
            this.activeNavLinkHref = newActiveParentMenu || newActiveNavLinkHref;
        },
        setError(f, m) { this.errors[f] = (typeof m === 'string' ? this.errorMessages[m] : m) || this.errorMessages.required; },
        clearError(f) { if(this.errors[f]) delete this.errors[f]; },
        clearAllErrors() { this.errors = {}; },
        focusOnRef(r, s=true) {this.$nextTick(()=>{if(this.$refs[r]){this.$refs[r].focus({preventScroll:!s});if(s)setTimeout(()=>{try{this.$refs[r].scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});}catch(e){console.warn("ScrollIntoView failed for",r,e);}},50);}})},
        get _needsDeliveryDetails() { const c = (this.customSplitDetailsText || "").toLowerCase(); return this.distributionChoice === 'me' || (this.distributionChoice === 'split' && (["1/3_me_2/3_charity_sl", "1/2_me_1/2_charity_sl", "2/3_me_1/3_charity_sl", "all_me_custom_distro"].includes(this.splitDetailsOption) || (this.splitDetailsOption === 'custom' && (c.includes("for me") || c.includes("all delivered to me") || c.includes("لي") || c.includes("توصيل لي"))))); },
        get splitDetails() { if(this.distributionChoice !== 'split') return ""; if(this.splitDetailsOption === 'custom') return (this.customSplitDetailsText || "").trim(); const o={"1/3_me_2/3_charity_sl":{en:"1/3 me, 2/3 charity (SL)",ar:"ثلث لي، ثلثان صدقة (أرض الأغنام)"},"1/2_me_1/2_charity_sl":{en:"1/2 me, 1/2 charity (SL)",ar:"نصف لي، نصف صدقة (أرض الأغنام)"},"2/3_me_1/3_charity_sl":{en:"2/3 me, 1/3 charity (SL)",ar:"ثلثان لي، ثلث صدقة (أرض الأغنام)"},"all_me_custom_distro":{en:"All for me (I distribute)",ar:"الكل لي (أنا أوزع)"}};const s=o[this.splitDetailsOption];return s?(this.currentLang==='ar'?s.ar:s.en):this.splitDetailsOption;},
        _getDeliveryLocation(lang) {
            if (!this._needsDeliveryDetails || !this.deliveryCity) return "";
            const selectedCityData = this.allAvailableCities.find(c => c.id === this.deliveryCity);
            if (!selectedCityData) return "";
            return lang === 'en' ? selectedCityData.name_en : selectedCityData.name_ar;
        },
        get summaryDeliveryToEN() {
            if(this.distributionChoice === 'char') return "Charity Distribution by Sheep Land";
            if(this._needsDeliveryDetails) {
                const name = (this.orderingPersonName || "").trim();
                const location = this._getDeliveryLocation('en');
                const addressShort = (this.deliveryAddress || "").substring(0,30) + ((this.deliveryAddress || "").length > 30 ? "..." : "");
                return [name, location, addressShort].filter(p => p?.trim()).join(", ") || "Delivery Details Incomplete";
            }
            return "Self Pickup/Distribution (No delivery details provided)";
        },
        get summaryDeliveryToAR() {
            if(this.distributionChoice === 'char') return "توزيع خيري بواسطة أرض الأغنام";
            if(this._needsDeliveryDetails) {
                const name = (this.orderingPersonName || "").trim();
                const location = this._getDeliveryLocation('ar');
                const addressShort = (this.deliveryAddress || "").substring(0,30) + ((this.deliveryAddress || "").length > 30 ? "..." : "");
                return [name, location, addressShort].filter(p => p?.trim()).join("، ") || "تفاصيل التوصيل غير مكتملة";
            }
            return "استلام ذاتي/توزيع (لم تقدم تفاصيل توصيل)";
        },
        get summaryDistributionEN() {if(this.distributionChoice==='me')return"All to me";if(this.distributionChoice==='char')return"All to charity (by SL)";return`Split: ${(this.splitDetails||"").trim()||"(Not specified)"}`;},
        get summaryDistributionAR() {if(this.distributionChoice==='me')return"الكل لي";if(this.distributionChoice==='char')return"تبرع بالكل للصدقة (أرض الأغنام)";return`تقسيم: ${(this.splitDetails||"").trim()||"(لم يحدد)"}`;},
        startOfferDHDMSCountdown() { if(this.countdownTimerInterval)clearInterval(this.countdownTimerInterval);if(!this.appSettings.promo_is_active||!this.appSettings.promo_end_date_iso) {this.countdown.ended=true;return;} const t=new Date(this.appSettings.promo_end_date_iso).getTime();if(isNaN(t)){this.countdown.ended=true;return;}this.updateDHDMSCountdownDisplay(t);this.countdownTimerInterval=setInterval(()=>this.updateDHDMSCountdownDisplay(t),1000);},
        updateDHDMSCountdownDisplay(t) {const d=t-Date.now();if(d<0){if(this.countdownTimerInterval)clearInterval(this.countdownTimerInterval);Object.assign(this.countdown,{days:"00",hours:"00",minutes:"00",seconds:"00",ended:true});return;}this.countdown.ended=false;this.countdown={days:String(Math.floor(d/864e5)).padStart(2,'0'),hours:String(Math.floor(d%864e5/36e5)).padStart(2,'0'),minutes:String(Math.floor(d%36e5/6e4)).padStart(2,'0'),seconds:String(Math.floor(d%6e4/1e3)).padStart(2,'0')};},
        updateDeliveryFeeDisplay() {
            this.deliveryFeeForDisplayEGP = 0; this.isDeliveryFeeVariable = false;
            if (!this._needsDeliveryDetails || !this.deliveryCity) { this.calculateTotalPrice(); return; } 
            const cityData = this.allAvailableCities.find(c => c.id === this.deliveryCity);
            if (cityData && typeof cityData.delivery_fee_egp === 'number') { this.deliveryFeeForDisplayEGP = cityData.delivery_fee_egp; this.isDeliveryFeeVariable = false; } 
            else if (cityData && cityData.delivery_fee_egp === null) { this.isDeliveryFeeVariable = true; this.deliveryFeeForDisplayEGP = 0; } 
            else { this.isDeliveryFeeVariable = true; this.deliveryFeeForDisplayEGP = 0; }
            this.calculateTotalPrice(); 
        },
        getFormattedPrice(p, c) {const cc=c||this.currentCurrency;const ci=this.appSettings?.exchange_rates?.[cc];if(p==null||!ci||typeof ci.rate_from_egp !=='number')return`${ci?.symbol||(cc==='EGP'?'LE':'?')} ---`;const cp=p*ci.rate_from_egp;return`${ci.symbol||(cc==='EGP'?'LE':cc)} ${cp.toFixed((ci.symbol==="LE"||ci.symbol==="ل.م"||cc==='EGP')?0:2)}`;},
        isValidEmail: (e) => (!e?.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
        isValidPhone: (p) => p?.trim() && /^\+?[0-9\s\-()]{7,20}$/.test(p.trim()),
        scrollToSection(s) { try{const e=document.querySelector(s);if(e){let o=document.querySelector('.site-header')?.offsetHeight||0;if(s.startsWith('#udheya-booking-start')||s.startsWith('#step')||s.startsWith('#udheya-booking-form-panel')){const h=document.querySelector('.stepper-outer-wrapper');if(h&&getComputedStyle(h).position==='sticky')o+=h.offsetHeight;}window.scrollTo({top:e.getBoundingClientRect().top+window.pageYOffset-o-10,behavior:'smooth'});}}catch(err){console.warn("ScrollToSection error:", err);}},
        validateConceptualStep(cs, se=true) { const m=this.stepSectionsMeta[cs-1]; if(!m||!m.validator)return true; const v=m.validator(se);this.stepProgress[`step${cs}`]=v;return v;},
        updateAllStepCompletionStates() { for(let i=1;i<=this.stepSectionsMeta.length;i++)this.stepProgress[`step${i}`]=this.validateConceptualStep(i,false);},
        handleStepperNavigation(tcs) {this.clearAllErrors();let cp=true;for(let s=1;s<tcs;s++){if(!this.validateConceptualStep(s,true)){this.currentConceptualStep=s;const m=this.stepSectionsMeta[s-1];this.focusOnRef(m?.firstFocusableErrorRef||m?.titleRef);this.scrollToSection(m?.id||'#udheya-booking-start');cp=false;break;}}if(cp){this.currentConceptualStep=tcs;this.scrollToSection(this.stepSectionsMeta[tcs-1]?.id||'#udheya-booking-start');this.focusOnRef(this.stepSectionsMeta[tcs-1]?.titleRef);}},
        
        validateStep1(setErrors = true) { 
            if (setErrors) this.clearError('animal');
            if (!this.selectedAnimal.item_key) { if (setErrors) this.setError('animal', 'select'); return false; }
            return true; 
        },
        validateStep2(setErrors = true) { 
            if (setErrors) { this.clearError('orderingPersonName'); this.clearError('orderingPersonPhone'); this.clearError('customerEmail');}
            let isValid = true;
            if (!(this.orderingPersonName || "").trim()) { if (setErrors) this.setError('orderingPersonName', 'required'); isValid = false; }
            if (!this.isValidPhone(this.orderingPersonPhone)) { if (setErrors) this.setError('orderingPersonPhone', 'phone'); isValid = false; }
            if ((this.customerEmail || "").trim() && !this.isValidEmail(this.customerEmail)) { if (setErrors) this.setError('customerEmail', 'email'); isValid = false; }
            return isValid;
        },
        validateStep3(setErrors = true) { 
            if (setErrors) { this.clearError('udheyaService');this.clearError('sacrificeDay'); }
            let isValid = true;
            if (!this.selectedUdheyaService) { if(setErrors) this.setError('udheyaService', 'select'); isValid = false;}
            if (!this.selectedSacrificeDay.value) { if (setErrors) this.setError('sacrificeDay', 'select'); isValid = false; }
            return isValid;
        },
        validateStep4(setErrors = true) { 
            if (setErrors) { this.clearError('distributionChoice'); this.clearError('splitDetails'); this.clearError('deliveryCity'); this.clearError('deliveryAddress'); this.clearError('timeSlot');}
            let isValid = true;
            if (!this.distributionChoice) { if(setErrors) this.setError('distributionChoice', 'select'); isValid = false; }
            if (this.distributionChoice === 'split' && this.splitDetailsOption === 'custom' && !(this.customSplitDetailsText || "").trim()) { if (setErrors) this.setError('splitDetails', 'required'); isValid = false; }
            else if (this.distributionChoice === 'split' && !this.splitDetailsOption) { if (setErrors) this.setError('splitDetails', 'select'); isValid = false; }
            
            if (this._needsDeliveryDetails) { 
                if (!this.deliveryCity) { if (setErrors) this.setError('deliveryCity', 'select'); isValid = false; } 
                if (!(this.deliveryAddress || "").trim()) { if (setErrors) this.setError('deliveryAddress', 'required'); isValid = false; }
                if (!this.selectedTimeSlot) { if (setErrors) this.setError('timeSlot', 'select'); isValid = false; }
            }
            return isValid;
        },
        validateStep5(setErrors = true) { 
            if (setErrors) this.clearError('paymentMethod');
            if (!this.paymentMethod) { if (setErrors) this.setError('paymentMethod', 'select'); return false; }
            return true;
        },

        selectAnimal(animalTypeKeyFromCard, weightSelectElement) { 
            const selectedItemKey = weightSelectElement.value; 
            this.clearError('animal');
            if (!selectedItemKey) {
                this.selectedAnimal = { ...initialBookingStateData.selectedAnimal };
                this.productOptions.livestock.forEach(type => { if (type.value_key !== animalTypeKeyFromCard && this.$refs[`${type.value_key}WeightSelect`]) { this.$refs[`${type.value_key}WeightSelect`].value = ""; } });
                this.calculateTotalPrice(); this.updateAllStepCompletionStates(); return;
            }
            this.productOptions.livestock.forEach(type => { if (type.value_key !== animalTypeKeyFromCard && this.$refs[`${type.value_key}WeightSelect`]) { this.$refs[`${type.value_key}WeightSelect`].value = ""; } });
            const animalTypeConfig = this.productOptions.livestock.find(a => a.value_key === animalTypeKeyFromCard);
            if (!animalTypeConfig) { this.selectedAnimal = { ...initialBookingStateData.selectedAnimal }; this.calculateTotalPrice(); this.updateAllStepCompletionStates(); return; }
            const selectedSpecificItem = animalTypeConfig.weights_prices.find(wp => wp.item_key === selectedItemKey);
            if (selectedSpecificItem && selectedSpecificItem.is_active && selectedSpecificItem.current_stock > 0) {
                this.selectedAnimal = {
                    type: animalTypeConfig.value_key, item_key: selectedSpecificItem.item_key, 
                    variant_id_pb: selectedSpecificItem.variant_id_pb, 
                    weight_range_en: selectedSpecificItem.weight_range_text_en, weight_range_ar: selectedSpecificItem.weight_range_text_ar,
                    basePriceEGP: selectedSpecificItem.basePriceEGP, nameEN: selectedSpecificItem.nameEN_specific, nameAR: selectedSpecificItem.nameAR_specific,
                    stock: selectedSpecificItem.current_stock, typeGenericNameEN: animalTypeConfig.name_en, typeGenericNameAR: animalTypeConfig.name_ar,
                    typePricePerKgEGP: animalTypeConfig.price_per_kg_egp // Store this for denormalization if needed
                };
            } else {
                this.selectedAnimal = { ...initialBookingStateData.selectedAnimal };
                this.setError('animal', {en: 'Selected item is out of stock or inactive.', ar: 'الخيار المحدد غير متوفر أو غير نشط.'});
            }
            this.calculateTotalPrice(); this.updateAllStepCompletionStates();
        },
        updateSacrificeDayTexts() { 
            const sacrificeDaySelectElement = this.$refs.sacrificeDaySelect_s3; 
            if (sacrificeDaySelectElement) { 
                const optionElement = sacrificeDaySelectElement.querySelector(`option[value="${this.selectedSacrificeDay.value}"]`); 
                if(optionElement) Object.assign(this.selectedSacrificeDay,{textEN:optionElement.dataset.en,textAR:optionElement.dataset.ar});
            } 
        },
        calculateTotalPrice() { 
            let deliveryFeeForTotal = 0; 
            if(this._needsDeliveryDetails && this.deliveryFeeForDisplayEGP > 0 && !this.isDeliveryFeeVariable) { 
                deliveryFeeForTotal = this.deliveryFeeForDisplayEGP; 
            } 
            this.totalPriceEGP=(this.selectedAnimal.basePriceEGP||0) + (this.currentServiceFeeEGP || 0) + deliveryFeeForTotal;  
        },
        updateAllDisplayedPrices() {
            try {
                (this.productOptions.livestock || []).forEach(livestockTypeConfig => { 
                    const weightSelectEl = this.$refs[`${livestockTypeConfig.value_key}WeightSelect`]; 
                    const cardEl = document.getElementById(livestockTypeConfig.value_key); 
                    if (!weightSelectEl || !cardEl) { console.warn(`Missing elements for ${livestockTypeConfig.value_key}`); return; }
                    const currentVal = weightSelectEl.value; 
                    weightSelectEl.innerHTML = `<option value="">-- Select Weight --</option>`;
                    let stillValid = false;
                    (livestockTypeConfig.weights_prices || []).forEach(wp => { 
                        const opt = document.createElement('option'); 
                        opt.value = wp.item_key; 
                        const outOfStock = !wp.is_active || wp.current_stock <= 0;
                        const statusTextEN = this.getEnglishStockStatusText(wp.current_stock, wp.is_active);
                        const priceDisplayEN = this.getFormattedPrice(wp.basePriceEGP);
                        opt.textContent = `${wp.nameEN_specific || wp.weight_range_text_en} (${priceDisplayEN}) - ${statusTextEN}`.trim();
                        opt.disabled = outOfStock; 
                        weightSelectEl.appendChild(opt);
                        if (wp.item_key === currentVal && !outOfStock) stillValid = true;
                    });
                    if(currentVal && stillValid) { weightSelectEl.value = currentVal; }
                    else if (this.selectedAnimal.type === livestockTypeConfig.value_key && this.selectedAnimal.item_key && livestockTypeConfig.weights_prices.find(wp => wp.item_key === this.selectedAnimal.item_key && wp.is_active && (wp.current_stock > 0))) { weightSelectEl.value = this.selectedAnimal.item_key; }
                    else { weightSelectEl.value = ""; }
                    const pricePerKilo = livestockTypeConfig.price_per_kg_egp || 0;
                    const pricePerKiloTextEn = this.getFormattedPrice(pricePerKilo) + '/kg';
                    const pricePerKiloTextAr = this.getFormattedPrice(pricePerKilo) + '/كجم';
                    const pEN_el = cardEl.querySelector('.price.bil-row .en span'); if(pEN_el) pEN_el.textContent = pricePerKiloTextEn;
                    const pAR_el = cardEl.querySelector('.price.bil-row .ar span'); if(pAR_el) pAR_el.textContent = pricePerKiloTextAr;
                });
                this.calculateTotalPrice(); 
            } catch (e) { console.error("Error in updateAllDisplayedPrices:", e); this.userFriendlyApiError = "Error updating prices."; }
        },
        async validateAndSubmitBooking() { 
            this.clearAllErrors(); let isValid = true;
            for (let i = 1; i <= this.stepSectionsMeta.length; i++) { if (!this.validateConceptualStep(i, true)) { isValid = false; const meta = this.stepSectionsMeta[i-1]; if (meta) { this.focusOnRef(meta.firstFocusableErrorRef || meta.titleRef); this.scrollToSection(meta.id || '#udheya-booking-start'); } break; }}
            if (!isValid) return;

            const animalTypeCfg = this.productOptions.livestock.find(lt => lt.value_key === this.selectedAnimal.type);
            const stockItemConfig = animalTypeCfg?.weights_prices.find(wp => wp.item_key === this.selectedAnimal.item_key);

            if (!stockItemConfig || !stockItemConfig.is_active || stockItemConfig.current_stock <= 0) { 
                this.setError('animal', { en: `Sorry, selected item is unavailable. Please reselect.`, ar: `عذراً، المنتج المختار غير متوفر. يرجى إعادة الاختيار.` });
                this.selectedAnimal.basePriceEGP = 0; this.updateAllDisplayedPrices(); this.updateAllStepCompletionStates();
                this.scrollToSection('#step1-content'); this.focusOnRef(this.stepSectionsMeta[0].firstFocusableErrorRef || this.stepSectionsMeta[0].titleRef); return;
            }
            this.isLoading.booking = true; this.apiError = null; this.userFriendlyApiError = ""; this.calculateTotalPrice();
            const bookingIdTextClient = `SL-UDHY-${new Date().getFullYear()}-${String(Math.random()).slice(2,7)}`;
            let delOpt = "self_pickup_or_internal_distribution"; 
            if (this.distributionChoice === 'char') delOpt = "charity_distribution_by_sl"; 
            else if (this._needsDeliveryDetails) delOpt = "home_delivery_to_orderer";
            const selectedCityInfo = (this._needsDeliveryDetails && this.deliveryCity) ? this.allAvailableCities.find(c => c.id === this.deliveryCity) : null;
            
            const payloadToHook = {
                booking_id_text: bookingIdTextClient, 
                product_item_key: this.selectedAnimal.item_key, // For the hook to find the product
                quantity: 1, 
                // Denormalized product info at time of booking
                animal_type_name_en: this.selectedAnimal.typeGenericNameEN, animal_type_name_ar: this.selectedAnimal.typeGenericNameAR,
                weight_category_name_en: this.selectedAnimal.nameEN, weight_category_name_ar: this.selectedAnimal.nameAR,
                weight_range_actual_en: this.selectedAnimal.weight_range_en, weight_range_actual_ar: this.selectedAnimal.weight_range_ar,
                animal_base_price_egp: this.selectedAnimal.basePriceEGP, // Price of variant
                // Booking specific details
                udheya_service_option_selected: this.selectedUdheyaService,
                service_fee_applied_egp: this.currentServiceFeeEGP,
                delivery_fee_applied_egp: (this._needsDeliveryDetails && this.deliveryFeeForDisplayEGP > 0 && !this.isDeliveryFeeVariable) ? this.deliveryFeeForDisplayEGP : 0,
                total_amount_due_egp: this.totalPriceEGP, selected_display_currency: this.currentCurrency,
                sacrifice_day_value: this.selectedSacrificeDay.value, sacrifice_day_text_en: this.selectedSacrificeDay.textEN, sacrifice_day_text_ar: this.selectedSacrificeDay.textAR,
                slaughter_viewing_preference: this.slaughterViewingPreference, distribution_choice: this.distributionChoice,
                split_details_option: this.distributionChoice === 'split' ? this.splitDetailsOption : "", custom_split_details_text: (this.distributionChoice === 'split' && this.splitDetailsOption === 'custom') ? (this.customSplitDetailsText || "").trim() : "",
                niyyah_names: (this.niyyahNames || "").trim(), ordering_person_name: (this.orderingPersonName || "").trim(), 
                ordering_person_phone: (this.orderingPersonPhone || "").trim(), customer_email: (this.customerEmail || "").trim(),
                delivery_option: delOpt, delivery_name: (this.orderingPersonName || "").trim(), delivery_phone: (this.orderingPersonPhone || "").trim(), 
                delivery_area_id: (this._needsDeliveryDetails && selectedCityInfo) ? selectedCityInfo.id : "", 
                delivery_area_name_en: (this._needsDeliveryDetails && selectedCityInfo) ? selectedCityInfo.name_en : "", 
                delivery_area_name_ar: (this._needsDeliveryDetails && selectedCityInfo) ? selectedCityInfo.name_ar : "",
                delivery_address: this._needsDeliveryDetails ? (this.deliveryAddress || "").trim() : "", 
                delivery_instructions: this._needsDeliveryDetails ? (this.deliveryInstructions || "").trim() : "",
                time_slot: (this.distributionChoice === 'char' || !this._needsDeliveryDetails) ? 'N/A' : this.selectedTimeSlot,
                payment_method: this.paymentMethod, 
                payment_status: (this.paymentMethod === 'cod' && this._needsDeliveryDetails) ? 'cod_pending_confirmation' : 'pending_payment',
                booking_status: 'confirmed_pending_payment', terms_agreed: true, 
                group_purchase_interest: this.groupPurchase, admin_notes: this.groupPurchase ? "Group purchase interest." : ""
            };

            try {
                const bookingResult = await callCustomBookUdheyaEndpoint(payloadToHook); 
                this.bookingID = bookingResult.booking_id_text || bookingIdTextClient; 
                
                if (stockItemConfig) {
                    const newClientStock = bookingResult.new_stock_level !== undefined ? bookingResult.new_stock_level : (stockItemConfig.current_stock -1);
                    stockItemConfig.current_stock = newClientStock;
                    this.selectedAnimal.stock = newClientStock;
                    this.updateAllDisplayedPrices(); 
                }

                this.bookingConfirmed = true; 
                this.$nextTick(() => { this.scrollToSection('#booking-confirmation-section'); this.focusOnRef('bookingConfirmedTitle'); });
            } catch (e) { 
                this.apiError=String(e.message); 
                this.userFriendlyApiError = e.message; 
                this.$nextTick(()=>this.scrollToSection('.global-error-indicator'));
            }
            finally { this.isLoading.booking = false; }
        },
        async validateAndCheckBookingStatus() {
            this.clearError('lookupBookingID');
            this.clearError('lookupPhoneNumber');
            let isValid = true;
            if (!(this.lookupBookingID || "").trim()) { this.setError('lookupBookingID', 'required'); isValid = false; }
            if (!this.isValidPhone(this.lookupPhoneNumber)) { this.setError('lookupPhoneNumber', 'phone'); isValid = false; }
            if(isValid) { await this.checkBookingStatus(); } 
            else { if(this.errors.lookupBookingID) this.focusOnRef('lookupBookingIdInput'); else if(this.errors.lookupPhoneNumber) this.focusOnRef('lookupPhoneInput');}
        },
        async checkBookingStatus() { 
            this.statusResult = null; this.statusNotFound = false; this.isLoading.status = true; this.apiError = null; this.userFriendlyApiError = ""; 
            const id = (this.lookupBookingID || "").trim();
            const phone = (this.lookupPhoneNumber || "").trim(); 
            const pb = new PocketBase('/');
            try {
                const filterString = `(booking_id_text = "${pb.realtime.client.utils.escapeFilterValue(id)}" && ordering_person_phone = "${pb.realtime.client.utils.escapeFilterValue(phone)}")`;
                const records = await pb.collection('bookings').getFullList({filter: filterString, requestKey: null});

                if (records && records.length > 0) {
                    const b = records[0];
                    let distributionTextEN = b.distribution_choice;
                    let distributionTextAR = b.distribution_choice; 
                     const distOpt = this.distributionChoiceOptions().find(opt => opt.value === b.distribution_choice);
                     if(distOpt) { distributionTextEN = distOpt.textEn; distributionTextAR = distOpt.textAr; }

                    if (b.distribution_choice === 'split') {
                        let splitDetailTextEN = b.split_details_option;
                        let splitDetailTextAR = b.split_details_option;
                        if (b.split_details_option === 'custom') {
                            splitDetailTextEN = b.custom_split_details_text || "Custom";
                            splitDetailTextAR = b.custom_split_details_text || "مخصص";
                        } else {
                            const splitOpt = this.splitDetailOptionsList().find(opt => opt.value === b.split_details_option);
                            if(splitOpt){ splitDetailTextEN = splitOpt.textEn; splitDetailTextAR = splitOpt.textAr;}
                        }
                        distributionTextEN += ` (${splitDetailTextEN})`;
                        distributionTextAR += ` (${splitDetailTextAR})`;
                    }
                    
                    this.statusResult = { 
                        booking_id_text: b.booking_id_text, status: b.booking_status?.replace(/_/g," ")||"Unknown", 
                        payment_status_text: b.payment_status?.replace(/_/g, " ") || "N/A",
                        animal_type_name_en: b.animal_type_name_en, animal_type_name_ar: b.animal_type_name_ar,
                        weight_category_name_en: b.weight_category_name_en, weight_category_name_ar: b.weight_category_name_ar,
                        udheya_service_option_selected: b.udheya_service_option_selected,
                        sacrifice_day_value: b.sacrifice_day_value, sacrifice_day_text_en: b.sacrifice_day_text_en, sacrifice_day_text_ar: b.sacrifice_day_text_ar,
                        slaughter_viewing_preference: b.slaughter_viewing_preference, time_slot: b.time_slot,
                        ordering_person_name: b.ordering_person_name, niyyah_names: b.niyyah_names,
                        distribution_choice_en: distributionTextEN, distribution_choice_ar: distributionTextAR,
                        delivery_address: b.delivery_address, delivery_city_name_en: b.delivery_city_name_en, delivery_city_name_ar: b.delivery_city_name_ar,
                        total_amount_due_egp: b.total_amount_due_egp, payment_method: b.payment_method,
                         _needs_delivery: (b.delivery_option === 'home_delivery_to_orderer' || (b.distribution_choice === 'split' && (b.split_details_option?.includes('_me_') || b.split_details_option === 'all_me_custom_distro' || (b.split_details_option === 'custom' && b.custom_split_details_text?.toLowerCase().includes('me')))))
                    };
                } else this.statusNotFound = true;
            } catch (e) { this.apiError=String(e.message);this.userFriendlyApiError="Could not get status.";this.statusNotFound=true;}
            finally { this.isLoading.status = false; }
        },
        getSacrificeDayText(v) { 
            const optionElement = document.querySelector(`#sacrifice_day_select_s3 option[value="${v}"]`); 
            return optionElement ? {en: optionElement.dataset.en, ar: optionElement.dataset.ar} : {en: v, ar: v}; 
        },
        
        async resetAndStartOver() { 
            const currency = this.currentCurrency; const lang = this.currentLang;
            Object.assign(this, JSON.parse(JSON.stringify(initialBookingStateData)));
            this.currentCurrency = currency; this.currentLang = lang;
            
            if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            
            await this.initApp(); 
             
            this.$nextTick(() => {
                this.scrollToSection('#udheya-booking-start'); 
                this.focusOnRef('bookingSectionTitle');
                this.bookingConfirmed = false; 
                this.bookingID = "";
            });
        }
    }));
});