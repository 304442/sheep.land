document.addEventListener('alpine:init', () => {
    const BARE_MINIMUM_APP_SETTINGS = {
        exchange_rates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true }, USD: { rate_from_egp: 0.020, symbol: "$", is_active: true }, GBP: { rate_from_egp: 0.016, symbol: "£", is_active: true } },
        default_currency: "EGP",
        whatsapp_number_raw: "201012345678", whatsapp_number_display: "+20 101 234 5678",
        promo_end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), promo_discount_percent: 12, promo_is_active: true,
        udheya_service_surcharge_egp: 600,
        delivery_areas: [ 
            { id: "giza_west", name_en: "Giza West", name_ar: "غرب الجيزة", cities: [ { id: "october", name_en: "6th of October City", name_ar: "مدينة 6 أكتوبر", delivery_fee_egp: 150 }, { id: "zayed", name_en: "Sheikh Zayed", name_ar: "الشيخ زايد", delivery_fee_egp: 150 }, { id: "euro_reef", name_en: "European Reef", name_ar: "الريف الأوروبى", delivery_fee_egp: 150 } ] }, 
            { id:"cairo", name_en:"Cairo", name_ar:"القاهرة", cities:[ {id:"nasr_city", name_en:"Nasr City", name_ar:"مدينة نصر", delivery_fee_egp: 100 }, {id:"maadi", name_en:"Maadi", name_ar:"المعادي", delivery_fee_egp: 100 }, {id:"heliopolis", name_en:"Heliopolis", name_ar:"مصر الجديدة", delivery_fee_egp: 120} ] } 
        ],
        payment_details: { vodafone_cash: "01076543210", instapay_ipn: "seed_user@instapay", revolut_details: "@seedUserRevolut", monzo_details: "monzo.me/seeduser", bank_name: "Seed Bank Egypt", bank_account_name: "Sheep Land Seed Account", bank_account_number: "1234567890123456", bank_iban: "EG00123400000000001234567890", bank_swift: "SEEDBANKEGCA" }
    };

    const HARDCODED_PRODUCT_CATALOG_CONFIG = [
        { value_key: "baladi", name_en: "Baladi Sheep", name_ar: "خروف بلدي", price_per_kg_egp: 150,
            weights_prices: [
                { item_key: "baladi_35_45", weight_range_text: "35-45kg", nameEN_specific: "Baladi (35-45kg)", nameAR_specific: "بلدي (٣٥-٤٥كجم)", avg_weight_kg: 40, initial_stock: 7, is_active: true },
                { item_key: "baladi_45_55", weight_range_text: "45-55kg", nameEN_specific: "Baladi (45-55kg)", nameAR_specific: "بلدي (٤٥-٥٥كجم)", avg_weight_kg: 50, initial_stock: 8, is_active: true },
                { item_key: "baladi_55plus", weight_range_text: "55+kg", nameEN_specific: "Baladi (55+kg)", nameAR_specific: "بلدي (+٥٥كجم)", avg_weight_kg: 60, initial_stock: 1, is_active: false }
            ]
        },
        { value_key: "barki", name_en: "Barki Sheep", name_ar: "خروف برقي", price_per_kg_egp: 165,
            weights_prices: [
                { item_key: "barki_25_35", weight_range_text: "25-35kg", nameEN_specific: "Barki (25-35kg)", nameAR_specific: "برقي (٢٥-٣٥كجم)", avg_weight_kg: 30, initial_stock: 1, is_active: true },
                { item_key: "barki_40_50", weight_range_text: "40-50kg", nameEN_specific: "Barki (40-50kg)", nameAR_specific: "برقي (٤٠-٥٠كجم)", avg_weight_kg: 45, initial_stock: 5, is_active: true },
                { item_key: "barki_50_60", weight_range_text: "50-60kg", nameEN_specific: "Barki (50-60kg)", nameAR_specific: "برقي (٥٠-٦٠كجم)", avg_weight_kg: 55, initial_stock: 3, is_active: true }
            ]
        }
    ];

    const initialBookingStateData = {
        selectedAnimal: { type: "", item_key: "", weight_range: "", basePriceEGP: 0, nameEN: "", nameAR: "", stock: null, typeGenericNameEN: "", typeGenericNameAR: "" },
        selectedUdheyaService: 'standard_service', 
        currentServiceFeeEGP: BARE_MINIMUM_APP_SETTINGS.udheya_service_surcharge_egp, 
        orderingPersonName: "", 
        orderingPersonPhone: "", 
        customerEmail: "", 
        deliveryName: "", 
        deliveryPhone: "", 
        deliveryCity: "", 
        allAvailableCities: [], 
        deliveryAddress: "", deliveryInstructions: "", niyyahNames: "",
        splitDetailsOption: "", customSplitDetailsText: "", groupPurchase: false,
        selectedSacrificeDay: { value: "day1_10_dhul_hijjah", textEN: "Day 1 of Eid (10th Dhul Hijjah)", textAR: "اليوم الأول (10 ذو الحجة)"},
        selectedTimeSlot: "8 AM-9 AM", distributionChoice: "me", paymentMethod: "fa",
        slaughterViewingPreference: "none", errors: {},
        totalPriceEGP: 0
    };

    const activePaymentMethodsList = [ 'revolut', 'monzo', 'ip', 'fa', 'vo', 'cod', 'bank_transfer' ];
    const paymentMethodDisplayOptions = [
        { id: 'revolut', title: 'Revolut', imgSrc: 'images/revolut.svg' }, { id: 'monzo', title: 'Monzo', imgSrc: 'images/monzo.svg' },
        { id: 'ip', title: 'InstaPay', imgSrc: 'images/instapay.svg' }, { id: 'fa', title: 'Fawry', imgSrc: 'images/fawry.svg' },
        { id: 'vo', title: 'Vodafone Cash', imgSrc: 'images/vodafone.svg' }, { id: 'cod', title: 'Cash on Delivery', imgSrc: 'images/cod.svg' },
        { id: 'bank_transfer', title: 'Bank Transfer', imgSrc: 'images/bank_transfer.svg' }
    ];

    async function postBookingToPB(bookingPayload) {
        const apiUrl = `/api/collections/bookings/records`;
        const options = { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(bookingPayload) };
        try {
            const response = await fetch(apiUrl, options);
            if (!response.ok) {
                let errorMessage = `API Error (POST bookings): ${response.status}`;
                try { const errorData = await response.json(); errorMessage += ` - ${errorData?.message || JSON.stringify(errorData.data) || response.statusText}`; }
                catch { errorMessage += ` - ${await response.text() || response.statusText}`; }
                throw new Error(errorMessage);
            }
            const responseText = await response.text();
            return responseText ? JSON.parse(responseText) : {};
        } catch (error) {
            throw new Error(error.message.startsWith('API') || error.message.startsWith('Network') ? error.message : `Network Error (POST bookings): ${error.message}`);
        }
    }

    Alpine.data('udheyaBooking', () => ({
        isLoading: { status: false, booking: false, init: true },
        appSettings: JSON.parse(JSON.stringify(BARE_MINIMUM_APP_SETTINGS)),
        productOptions: { livestock: [] },
        get availablePaymentMethods() { return paymentMethodDisplayOptions.filter(pm => activePaymentMethodsList.includes(pm.id)); },
        apiError: null, userFriendlyApiError: "", ...JSON.parse(JSON.stringify(initialBookingStateData)),
        bookingConfirmed: false, statusResult: null, statusNotFound: false, lookupBookingID: "", currentCurrency: "EGP", bookingID: "",
        currentConceptualStep: 1, stepProgress: { step1: false, step2: false, step3: false, step4: false },
        isMobileMenuOpen: false, isUdheyaDropdownOpen: false, isUdheyaMobileSubmenuOpen: false,
        countdown: { days: "00", hours: "00", minutes: "00", seconds: "00", ended: false },
        countdownTimerInterval: null, currentLang: "en",
        errorMessages: { required: { en: "This field is required.", ar: "هذا الحقل مطلوب." }, select: { en: "Please make a selection.", ar: "يرجى الاختيار." }, email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." }, phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." }, timeSlot: { en: "Please select a time slot.", ar: "يرجى اختيار وقت التوصيل." }, udheyaService: {en: "Please select a service option.", ar: "يرجى اختيار خيار الخدمة."}},
        navLinksData: [ { href: "#udheya-booking-start", sectionId: "udheya-booking-start", parentMenu: "Udheya" }, { href: "#check-booking-status", sectionId: "check-booking-status", parentMenu: "Udheya" }],
        activeNavLinkHref: "", stepSectionsMeta: [], deliveryFeeForDisplayEGP: 0, isDeliveryFeeVariable: false,

        calculateItemPrice(item, animalTypeConfig) {
            if (!item || !animalTypeConfig || typeof animalTypeConfig.price_per_kg_egp !== 'number' || typeof item.avg_weight_kg !== 'number') return 0;
            return item.avg_weight_kg * animalTypeConfig.price_per_kg_egp;
        },
        getApproxPricePerKiloTextForDisplay(animalTypeValueKey) {
            const animalConfig = this.productOptions.livestock.find(a => a.value_key === animalTypeValueKey);
            if (animalConfig && typeof animalConfig.price_per_kg_egp === 'number') {
                 return `(${this.getFormattedPrice(animalConfig.price_per_kg_egp, "EGP")}/kg est.)`;
            }
            return "";
        },
        getStockDisplayText(stock, isActive, lang = this.currentLang) {
            if (!isActive) return lang === 'ar' ? " - غير نشط" : " - Inactive";
            if (stock <= 0) return lang === 'ar' ? " - نفذت الكمية" : " - Out of Stock";
            if (stock > 0 && stock <= 5) return lang === 'ar' ? " - كمية محدودة" : " - Limited Stock";
            return lang === 'ar' ? " - متوفر" : " - Available";
        },
        slaughterViewingOptions() {
            return [
                { value: 'none', textEn: 'No Preference / Not Required', textAr: 'لا يوجد تفضيل / غير مطلوب' },
                { value: 'physical_inquiry', textEn: 'Inquire about Physical Attendance', textAr: 'الاستفسار عن الحضور الشخصي' },
                { value: 'video_request', textEn: 'Request Video/Photos of Process', textAr: 'طلب فيديو/صور للعملية' }
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

        initApp() {
            this.isLoading.init = true; this.apiError = null; this.userFriendlyApiError = "";
            this.productOptions.livestock = JSON.parse(JSON.stringify(HARDCODED_PRODUCT_CATALOG_CONFIG)).map(animalType => {
                animalType.weights_prices.forEach(item => {
                    item.basePriceEGP = this.calculateItemPrice(item, animalType);
                    item.current_stock = item.initial_stock;
                });
                return animalType;
            });
            
            let cities = [];
            this.appSettings.delivery_areas.forEach(gov => {
                if (gov.cities && gov.cities.length > 0) {
                    gov.cities.forEach(city => {
                        cities.push({
                            id: `${gov.id}_${city.id}`, 
                            name_en: `${gov.name_en} - ${city.name_en}`,
                            name_ar: `${gov.name_ar} - ${city.name_ar}`,
                            delivery_fee_egp: city.delivery_fee_egp,
                            governorate_id: gov.id, 
                            governorate_name_en: gov.name_en,
                            governorate_name_ar: gov.name_ar
                        });
                    });
                } else if (gov.delivery_fee_egp !== undefined) { 
                     cities.push({
                        id: gov.id, 
                        name_en: gov.name_en,
                        name_ar: gov.name_ar,
                        delivery_fee_egp: gov.delivery_fee_egp,
                        governorate_id: gov.id,
                        governorate_name_en: gov.name_en,
                        governorate_name_ar: gov.name_ar
                    });
                }
            });
            this.allAvailableCities = cities.sort((a,b) => a.name_en.localeCompare(b.name_en));
            this.updateServiceFee(); 

            this.currentCurrency = this.appSettings.default_currency;
            this.startOfferDHDMSCountdown(); 
            this.updateSacrificeDayTexts(); 
            this.clearAllErrors();
            this.$nextTick(() => {
                if (this.productOptions.livestock?.length > 0) this.updateAllDisplayedPrices();
                else this.userFriendlyApiError = "Livestock options could not be loaded.";
                this.updateAllStepCompletionStates(); this.handleScroll();
                this.focusOnRef(this.bookingConfirmed ? "bookingConfirmedTitle" : "body", false);
                this.updateDeliveryFeeDisplay(); this.isLoading.init = false;
            });
            this.stepSectionsMeta = [
                { id: "#step1-content", conceptualStep: 1, titleRef: "step1Title", firstFocusableErrorRef: 'baladiWeightSelect', validator: this.validateStep1.bind(this) },
                { id: "#step2-content", conceptualStep: 2, titleRef: "step2Title", firstFocusableErrorRef: 'udheyaServiceRadios', validator: this.validateStep2.bind(this) },
                { id: "#step3-content", conceptualStep: 3, titleRef: "step3Title", firstFocusableErrorRef: 'orderingPersonNameInput_s3', validator: this.validateStep3.bind(this) },
                { id: "#step4-content", conceptualStep: 4, titleRef: "step4Title", firstFocusableErrorRef: 'paymentMethodRadios', validator: this.validateStep4.bind(this) }
            ];
            ['selectedAnimal.basePriceEGP', 'currentCurrency', 'currentServiceFeeEGP'].forEach(prop => this.$watch(prop, () => { this.calculateTotalPrice(); if(prop !== 'currentServiceFeeEGP') this.updateAllDisplayedPrices(); }));
            this.$watch('appSettings.udheya_service_surcharge_egp', () => { this.updateServiceFee(); });
            ['selectedSacrificeDay.value', 'distributionChoice', 'splitDetailsOption', 'customSplitDetailsText', 'orderingPersonName', 'orderingPersonPhone', 'customerEmail', 'deliveryName', 'deliveryPhone', 'deliveryAddress', 'selectedTimeSlot', 'paymentMethod', 'slaughterViewingPreference', 'deliveryCity', 'selectedUdheyaService'].forEach(prop => this.$watch(prop, (nv,ov) => { this.updateAllStepCompletionStates(); if (prop === 'deliveryCity' && nv !== ov) {this.updateDeliveryFeeDisplay(); this.calculateTotalPrice();} if (prop === 'selectedUdheyaService') this.updateServiceFee(); if (prop === 'distributionChoice') this.calculateTotalPrice(); }));
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
            window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.startOfferDHDMSCountdown(); else if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval); });
        },
        updateServiceFee() {
            if (this.selectedUdheyaService === 'standard_service') {
                this.currentServiceFeeEGP = this.appSettings.udheya_service_surcharge_egp || 0;
            } else if (this.selectedUdheyaService === 'live_animal_only') {
                this.currentServiceFeeEGP = 0;
            } else {
                this.currentServiceFeeEGP = this.appSettings.udheya_service_surcharge_egp || 0;
            }
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
            const selectedCityData = this.allAvailableCities.find(c => c.id === this.deliveryCity);
            if (!selectedCityData) return "";
            return lang === 'en' ? selectedCityData.name_en : selectedCityData.name_ar;
        },
        get summaryDeliveryToEN() {if(this.distributionChoice==='char')return"Charity Distribution by Sheep Land";if(this._needsDeliveryDetails){const n=(this.deliveryName||"").trim();const l=this._getDeliveryLocation('en');const s=(this.deliveryAddress||"").substring(0,20)+((this.deliveryAddress||"").length>20?"...":"");return[n,l,s].filter(p=>p?.trim()).join(", ")||"Delivery Details Incomplete";}return"Self Pickup/Distribution";},
        get summaryDeliveryToAR() {if(this.distributionChoice==='char')return"توزيع خيري بواسطة أرض الأغنام";if(this._needsDeliveryDetails){const n=(this.deliveryName||"").trim();const l=this._getDeliveryLocation('ar');const s=(this.deliveryAddress||"").substring(0,20)+((this.deliveryAddress||"").length>20?"...":"");return[n,l,s].filter(p=>p?.trim()).join("، ")||"تفاصيل التوصيل غير مكتملة";}return"استلام ذاتي/توزيع";},
        get summaryDistributionEN() {if(this.distributionChoice==='me')return"All to me";if(this.distributionChoice==='char')return"All to charity (by SL)";return`Split: ${(this.splitDetails||"").trim()||"(Not specified)"}`;},
        get summaryDistributionAR() {if(this.distributionChoice==='me')return"الكل لي";if(this.distributionChoice==='char')return"تبرع بالكل للصدقة (أرض الأغنام)";return`تقسيم: ${(this.splitDetails||"").trim()||"(لم يحدد)"}`;},
        startOfferDHDMSCountdown() { if(this.countdownTimerInterval)clearInterval(this.countdownTimerInterval);if(!this.appSettings.promo_is_active||!this.appSettings.promo_end_date) {this.countdown.ended=true;return;} const t=new Date(this.appSettings.promo_end_date).getTime();if(isNaN(t)){this.countdown.ended=true;return;}this.updateDHDMSCountdownDisplay(t);this.countdownTimerInterval=setInterval(()=>this.updateDHDMSCountdownDisplay(t),1000);},
        updateDHDMSCountdownDisplay(t) {const d=t-Date.now();if(d<0){if(this.countdownTimerInterval)clearInterval(this.countdownTimerInterval);Object.assign(this.countdown,{days:"00",hours:"00",minutes:"00",seconds:"00",ended:true});return;}this.countdown.ended=false;this.countdown={days:String(Math.floor(d/864e5)).padStart(2,'0'),hours:String(Math.floor(d%864e5/36e5)).padStart(2,'0'),minutes:String(Math.floor(d%36e5/6e4)).padStart(2,'0'),seconds:String(Math.floor(d%6e4/1e3)).padStart(2,'0')};},
        updateDeliveryFeeDisplay() {
            this.deliveryFeeForDisplayEGP = 0; this.isDeliveryFeeVariable = false;
            if (!this.deliveryCity) { this.calculateTotalPrice(); return; } 
            const cityData = this.allAvailableCities.find(c => c.id === this.deliveryCity);
            if (cityData && typeof cityData.delivery_fee_egp === 'number') {
                this.deliveryFeeForDisplayEGP = cityData.delivery_fee_egp;
                this.isDeliveryFeeVariable = false;
            } else if (cityData && cityData.delivery_fee_egp === null) {
                this.isDeliveryFeeVariable = true; this.deliveryFeeForDisplayEGP = 0;
            } else {
                this.isDeliveryFeeVariable = true; this.deliveryFeeForDisplayEGP = 0;
            }
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
        validateStep2(setErrors = true) { // Service & Niyyah + Arrangements
            if (setErrors) { this.clearError('udheyaService');this.clearError('sacrificeDay'); this.clearError('splitDetails'); this.clearError('distributionChoice');}
            let isValid = true;
            if (!this.selectedUdheyaService) { if(setErrors) this.setError('udheyaService', 'select'); isValid = false;}
            if (!this.selectedSacrificeDay.value) { if (setErrors) this.setError('sacrificeDay', 'select'); isValid = false; }
            if (!this.distributionChoice) { if(setErrors) this.setError('distributionChoice', 'select'); isValid = false; }
            if (this.distributionChoice === 'split' && this.splitDetailsOption === 'custom' && !(this.customSplitDetailsText || "").trim()) { if (setErrors) this.setError('splitDetails', 'required'); isValid = false; }
            else if (this.distributionChoice === 'split' && !this.splitDetailsOption) { if (setErrors) this.setError('splitDetails', 'select'); isValid = false; }
            return isValid;
        },
        validateStep3(setErrors = true) { // Contact & Delivery Details
            if (setErrors) { this.clearError('orderingPersonName'); this.clearError('orderingPersonPhone'); this.clearError('customerEmail'); this.clearError('deliveryName'); this.clearError('deliveryPhone'); this.clearError('deliveryCity'); this.clearError('deliveryAddress'); this.clearError('timeSlot');}
            let isValid = true;
            if (!(this.orderingPersonName || "").trim()) { if (setErrors) this.setError('orderingPersonName', 'required'); isValid = false; }
            if (!this.isValidPhone(this.orderingPersonPhone)) { if (setErrors) this.setError('orderingPersonPhone', 'phone'); isValid = false; }
            if ((this.customerEmail || "").trim() && !this.isValidEmail(this.customerEmail)) { if (setErrors) this.setError('customerEmail', 'email'); isValid = false; }
            
            if (this._needsDeliveryDetails) { 
                if (!(this.deliveryName || "").trim()) { if (setErrors) this.setError('deliveryName', 'required'); isValid = false; }
                if (!this.isValidPhone(this.deliveryPhone)) { if (setErrors) this.setError('deliveryPhone', 'phone'); isValid = false; }
                if (!this.deliveryCity) { if (setErrors) this.setError('deliveryCity', 'select'); isValid = false; } 
                if (!(this.deliveryAddress || "").trim()) { if (setErrors) this.setError('deliveryAddress', 'required'); isValid = false; }
                if (!this.selectedTimeSlot) { if (setErrors) this.setError('timeSlot', 'select'); isValid = false; }
            }
            return isValid;
        },
        validateStep4(setErrors = true) { 
            if (setErrors) this.clearError('paymentMethod');
            if (!this.paymentMethod) { if (setErrors) this.setError('paymentMethod', 'select'); return false; }
            return true;
        },

        selectAnimal(animalTypeKeyFromCard, weightSelectElement) { 
            const selectedItemKey = weightSelectElement.value; 
            this.clearError('animal');
            if (!selectedItemKey) {
                this.selectedAnimal = { ...initialBookingStateData.selectedAnimal };
                const otherTypeKey = animalTypeKeyFromCard === 'baladi' ? 'barki' : 'baladi';
                if (this.$refs[`${otherTypeKey}WeightSelect`]) this.$refs[`${otherTypeKey}WeightSelect`].value = "";
                this.calculateTotalPrice(); this.updateAllStepCompletionStates(); return;
            }
            const otherTypeKey = animalTypeKeyFromCard === 'baladi' ? 'barki' : 'baladi';
            if (this.$refs[`${otherTypeKey}WeightSelect`]) this.$refs[`${otherTypeKey}WeightSelect`].value = "";

            const animalTypeConfig = this.productOptions.livestock.find(a => a.value_key === animalTypeKeyFromCard);
            if (!animalTypeConfig) { this.selectedAnimal = { ...initialBookingStateData.selectedAnimal }; this.calculateTotalPrice(); this.updateAllStepCompletionStates(); return; }
            const selectedSpecificItem = animalTypeConfig.weights_prices.find(wp => wp.item_key === selectedItemKey);

            if (selectedSpecificItem && selectedSpecificItem.is_active && selectedSpecificItem.current_stock > 0) {
                this.selectedAnimal = {
                    type: animalTypeConfig.value_key, item_key: selectedSpecificItem.item_key, 
                    weight_range: selectedSpecificItem.weight_range_text, basePriceEGP: selectedSpecificItem.basePriceEGP,
                    nameEN: selectedSpecificItem.nameEN_specific, nameAR: selectedSpecificItem.nameAR_specific,
                    stock: selectedSpecificItem.current_stock, typeGenericNameEN: animalTypeConfig.name_en, 
                    typeGenericNameAR: animalTypeConfig.name_ar
                };
            } else {
                this.selectedAnimal = { ...initialBookingStateData.selectedAnimal };
                this.setError('animal', {en: 'Selected item is out of stock or inactive.', ar: 'الخيار المحدد غير متوفر أو غير نشط.'});
            }
            this.calculateTotalPrice(); this.updateAllStepCompletionStates();
        },
        updateSacrificeDayTexts() {const o=document.querySelector(`#sacrifice_day_select_s2 option[value="${this.selectedSacrificeDay.value}"]`);if(o)Object.assign(this.selectedSacrificeDay,{textEN:o.dataset.en,textAR:o.dataset.ar});},
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
                    if (!weightSelectEl || !cardEl) return;
                    const currentVal = weightSelectEl.value; weightSelectEl.innerHTML = `<option value="">${this.currentLang==='ar'?"-- اختر فئة الوزن --":"-- Select Weight Category --"}</option>`;
                    let stillValid = false;
                    (livestockTypeConfig.weights_prices || []).forEach(wp => { 
                        const opt = document.createElement('option'); opt.value = wp.item_key; 
                        const outOfStock = !wp.is_active || wp.current_stock <= 0;
                        const stockTxt = this.getStockDisplayText(wp.current_stock, wp.is_active);
                        opt.textContent = `${wp.nameEN_specific||wp.weight_range_text} (${this.getFormattedPrice(wp.basePriceEGP)}) ${stockTxt}`.trim();
                        opt.disabled = outOfStock; weightSelectEl.appendChild(opt);
                        if (wp.item_key === currentVal && !outOfStock) stillValid = true;
                    });
                    if(currentVal && stillValid) weightSelectEl.value = currentVal;
                    else if (this.selectedAnimal.type === livestockTypeConfig.value_key && this.selectedAnimal.item_key && livestockTypeConfig.weights_prices.find(wp => wp.item_key === this.selectedAnimal.item_key && wp.is_active && (wp.current_stock > 0))) weightSelectEl.value = this.selectedAnimal.item_key;
                    else weightSelectEl.value = ""; 
                    
                    const pricePerKilo = livestockTypeConfig.price_per_kg_egp || 0;
                    const pricePerKiloTextEn = this.getFormattedPrice(pricePerKilo) + '/kg';
                    const pricePerKiloTextAr = this.getFormattedPrice(pricePerKilo) + '/كجم';
                    const pEN=cardEl.querySelector('.price.bil-row .en span'); if(pEN)pEN.textContent=pricePerKiloTextEn;
                    const pAR=cardEl.querySelector('.price.bil-row .ar span'); if(pAR)pAR.textContent=pricePerKiloTextAr;
                });
                this.calculateTotalPrice(); 
            } catch (e) { console.error("Err updateAllDisplayedPrices:", e); this.userFriendlyApiError = "Error updating prices."; }
        },

        async validateAndSubmitBooking() {
            this.clearAllErrors(); let isValid = true;
            for (let i = 1; i <= this.stepSectionsMeta.length; i++) { if (!this.validateConceptualStep(i, true)) { isValid = false; const meta = this.stepSectionsMeta[i-1]; if (meta) { this.focusOnRef(meta.firstFocusableErrorRef || meta.titleRef); this.scrollToSection(meta.id || '#udheya-booking-start'); } break; }}
            if (!isValid) return;

            const animalTypeCfg = this.productOptions.livestock.find(lt => lt.value_key === this.selectedAnimal.type);
            const stockItem = animalTypeCfg?.weights_prices.find(wp => wp.item_key === this.selectedAnimal.item_key);

            if (!stockItem || !stockItem.is_active || stockItem.current_stock <= 0) { 
                this.setError('animal', { en: `Sorry, selected item is unavailable. Please reselect.`, ar: `عذراً، المنتج المختار غير متوفر. يرجى إعادة الاختيار.` });
                this.selectedAnimal.basePriceEGP = 0; this.updateAllDisplayedPrices(); this.updateAllStepCompletionStates();
                this.scrollToSection('#step1-content'); this.focusOnRef(this.stepSectionsMeta[0].firstFocusableErrorRef || this.stepSectionsMeta[0].titleRef); return;
            }
            this.isLoading.booking = true; this.apiError = null; this.userFriendlyApiError = ""; this.calculateTotalPrice();
            const bookingId = `SL-UDHY-${new Date().getFullYear()}-${String(Math.random()).slice(2,7)}`;
            let delOpt = "self_arranged"; if (this.distributionChoice === 'char') delOpt = "charity_distribution"; else if (this._needsDeliveryDetails) delOpt = "home_delivery";
            const selectedCityInfo = this._needsDeliveryDetails ? this.allAvailableCities.find(c => c.id === this.deliveryCity) : null;

            const payload = {
                booking_id_text: bookingId,
                animal_type_name_en: this.selectedAnimal.typeGenericNameEN, animal_type_name_ar: this.selectedAnimal.typeGenericNameAR,
                weight_category_name_en: this.selectedAnimal.nameEN, weight_category_name_ar: this.selectedAnimal.nameAR,
                animal_base_price_egp: this.selectedAnimal.basePriceEGP,
                udheya_service_option_selected: this.selectedUdheyaService,
                service_fee_applied_egp: this.currentServiceFeeEGP,
                delivery_fee_applied_egp: (this._needsDeliveryDetails && this.deliveryFeeForDisplayEGP > 0 && !this.isDeliveryFeeVariable) ? this.deliveryFeeForDisplayEGP : 0,
                total_amount_due_egp: this.totalPriceEGP, selected_display_currency: this.currentCurrency,
                sacrifice_day_value: this.selectedSacrificeDay.value, sacrifice_day_text_en: this.selectedSacrificeDay.textEN, sacrifice_day_text_ar: this.selectedSacrificeDay.textAR,
                slaughter_viewing_preference: this.slaughterViewingPreference, distribution_choice: this.distributionChoice,
                split_details_option: this.distributionChoice === 'split' ? this.splitDetailsOption : "", custom_split_details_text: (this.distributionChoice === 'split' && this.splitDetailsOption === 'custom') ? (this.customSplitDetailsText || "").trim() : "",
                niyyah_names: (this.niyyahNames || "").trim(), 
                ordering_person_name: (this.orderingPersonName || "").trim(), 
                ordering_person_phone: (this.orderingPersonPhone || "").trim(), 
                customer_email: (this.customerEmail || "").trim(),
                delivery_option: delOpt,
                delivery_name: this._needsDeliveryDetails ? (this.deliveryName || "").trim() : (this.orderingPersonName || "").trim(),
                delivery_phone: this._needsDeliveryDetails ? (this.deliveryPhone || "").trim() : (this.orderingPersonPhone || "").trim(),
                delivery_area_id: this._needsDeliveryDetails ? (selectedCityInfo?.id || "") : "", 
                delivery_area_name_en: this._needsDeliveryDetails ? (selectedCityInfo?.name_en || "") : "", 
                delivery_area_name_ar: this._needsDeliveryDetails ? (selectedCityInfo?.name_ar || "") : "",
                delivery_address: this._needsDeliveryDetails ? (this.deliveryAddress || "").trim() : "", delivery_instructions: this._needsDeliveryDetails ? (this.deliveryInstructions || "").trim() : "",
                time_slot: (this.distributionChoice === 'char' || !this._needsDeliveryDetails) ? 'N/A' : this.selectedTimeSlot,
                payment_method: this.paymentMethod, payment_status: (this.paymentMethod === 'cod' && this._needsDeliveryDetails) ? 'cod_pending_confirmation' : 'pending_payment',
                booking_status: 'confirmed_pending_payment', terms_agreed: true, 
                group_purchase_interest: this.groupPurchase, admin_notes: this.groupPurchase ? "Group purchase interest." : ""
            };
            try {
                const created = await postBookingToPB(payload); this.bookingID = created.booking_id_text || created.id;
                if (stockItem && stockItem.current_stock > 0) { stockItem.current_stock--; this.selectedAnimal.stock = stockItem.current_stock; }
                this.bookingConfirmed = true; this.$nextTick(() => { this.scrollToSection('#booking-confirmation-section'); this.focusOnRef('bookingConfirmedTitle'); });
            } catch (e) { this.apiError=String(e.message);this.userFriendlyApiError="Issue submitting. Try again or contact support.";this.$nextTick(()=>this.scrollToSection('.global-error-indicator'));}
            finally { this.isLoading.booking = false; }
        },
        async validateAndCheckBookingStatus() {this.clearError('lookupBookingID');if((this.lookupBookingID||"").trim())await this.checkBookingStatus();else{this.setError('lookupBookingID','required');this.focusOnRef('lookupBookingIdInput');}},
        async checkBookingStatus() {
            this.statusResult = null; this.statusNotFound = false; this.isLoading.status = true; this.apiError = null; this.userFriendlyApiError = ""; const id = (this.lookupBookingID || "").trim();
            try {
                const response = await fetch(`/api/collections/bookings/records?filter=(booking_id_text='${encodeURIComponent(id)}')`);
                if (!response.ok && response.status !== 404) throw new Error(`API Error: ${response.status}`);
                const data = await response.json();
                if (data.items?.length > 0) {
                    const b = data.items[0];
                    this.statusResult = { booking_id_text: b.booking_id_text, status: b.booking_status?.replace(/_/g," ")||"Unknown", animal_type: b.animal_type_name_en, animal_weight_selected: b.weight_category_name_en, sacrifice_day: b.sacrifice_day_value, time_slot: b.time_slot };
                } else this.statusNotFound = true;
            } catch (e) { this.apiError=String(e.message);this.userFriendlyApiError="Could not get status.";this.statusNotFound=true;}
            finally { this.isLoading.status = false; }
        },
        getSacrificeDayText(v) {const o=document.querySelector(`#sacrifice_day_select_s2 option[value="${v}"]`);return o?{en:o.dataset.en,ar:o.dataset.ar}:{en:v,ar:v};}, // Note: Sacrifice day select is in Step 2 (Arrangements) now
        resetAndStartOver() {
             const currency = this.currentCurrency; 
             Object.assign(this, JSON.parse(JSON.stringify(initialBookingStateData)));
             this.currentCurrency = currency; 
             this.productOptions.livestock = JSON.parse(JSON.stringify(HARDCODED_PRODUCT_CATALOG_CONFIG)).map(at => { at.weights_prices.forEach(i => { i.basePriceEGP = this.calculateItemPrice(i, at); i.current_stock = i.initial_stock; }); return at; });
             this.updateServiceFee();
             if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
             this.startOfferDHDMSCountdown(); this.updateSacrificeDayTexts(); this.clearAllErrors();
             this.$nextTick(() => {
                this.updateAllDisplayedPrices(); this.updateAllStepCompletionStates(); this.updateDeliveryFeeDisplay();
                this.scrollToSection('#udheya-booking-start'); this.focusOnRef('bookingSectionTitle');
                this.bookingConfirmed = false; this.bookingID = "";
             });
        }
    }));
});