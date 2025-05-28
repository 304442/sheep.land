document.addEventListener('alpine:init', () => {
    const BARE_MINIMUM_APP_SETTINGS = {
        exchange_rates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true }, USD: { rate_from_egp: 0.020, symbol: "$", is_active: true }, GBP: { rate_from_egp: 0.015, symbol: "£", is_active: true } },
        default_currency: "EGP",
        whatsapp_number_raw: "201117117489", whatsapp_number_display: "+20 11 1711 7489",
        promo_end_date: new Date("2025-06-07T00:00:00.000Z").toISOString(), 
        promo_discount_percent: 10, 
        promo_is_active: true,
        udheya_service_surcharge_egp: 750,
        delivery_areas: [ 
            { id: "giza_west", name_en: "Giza West", name_ar: "غرب الجيزة", cities: [ { id: "october", name_en: "6th of October City", name_ar: "مدينة 6 أكتوبر", delivery_fee_egp: 150 }, { id: "zayed", name_en: "Sheikh Zayed", name_ar: "الشيخ زايد", delivery_fee_egp: 150 }, { id: "euro_reef", name_en: "European Reef", name_ar: "الريف الأوروبى", delivery_fee_egp: 150 } ] }, 
            { id:"cairo", name_en:"Cairo", name_ar:"القاهرة", cities:[ {id:"nasr_city", name_en:"Nasr City", name_ar:"مدينة نصر", delivery_fee_egp: 250 }, {id:"maadi", name_en:"Maadi", name_ar:"المعادي", delivery_fee_egp: 250 }, {id:"heliopolis", name_en:"Heliopolis", name_ar:"مصر الجديدة", delivery_fee_egp: 250} ] } 
        ],
        payment_details: { vodafone_cash: "01076543210", instapay_ipn: "seed_user@instapay", revolut_details: "@seedUserRevolut", monzo_details: "monzo.me/seeduser", bank_name: "Seed Bank Egypt", bank_account_name: "Sheep Land Seed Account", bank_account_number: "1234567890123456", bank_iban: "EG00123400000000001234567890", bank_swift: "SEEDBANKEGCA" }
    };

    const HARDCODED_PRODUCT_CATALOG_CONFIG = [
        { 
            value_key: "baladi", name_en: "Baladi Sheep", name_ar: "خروف بلدي", 
            description_en: "Local breed, rich flavor.", description_ar: "سلالة محلية، نكهة غنية.",
            price_per_kg_egp: 230,
            weights_prices: [ 
                { item_key: "baladi_40_50", weight_range_text_en: "40-50kg", weight_range_text_ar: "٤٠-٥٠ كجم", nameEN_specific: "Baladi (40-50kg)", nameAR_specific: "بلدي (٤٠-٥٠كجم)", avg_weight_kg: 45, initial_stock: 7, is_active: true },
                { item_key: "baladi_50_60", weight_range_text_en: "50-60kg", weight_range_text_ar: "٥٠-٦٠ كجم", nameEN_specific: "Baladi (50-60kg)", nameAR_specific: "بلدي (٥٠-٦٠كجم)", avg_weight_kg: 55, initial_stock: 8, is_active: true },
                { item_key: "baladi_60_plus", weight_range_text_en: "60+kg", weight_range_text_ar: "+٦٠ كجم", nameEN_specific: "Baladi (60+kg)", nameAR_specific: "بلدي (+٦٠كجم)", avg_weight_kg: 65, initial_stock: 1, is_active: true }
            ]
        },
        { 
            value_key: "barki", name_en: "Barki Sheep", name_ar: "خروف برقي", 
            description_en: "Desert breed, lean meat.", description_ar: "سلالة صحراوية، لحم قليل الدهن.",
            price_per_kg_egp: 255,
            weights_prices: [
                { item_key: "barki_30_40", weight_range_text_en: "30-40kg", weight_range_text_ar: "٣٠-٤٠ كجم", nameEN_specific: "Barki (30-40kg)", nameAR_specific: "برقي (٣٠-٤٠كجم)", avg_weight_kg: 35, initial_stock: 1, is_active: true },
                { item_key: "barki_40_50", weight_range_text_en: "40-50kg", weight_range_text_ar: "٤٠-٥٠ كجم", nameEN_specific: "Barki (40-50kg)", nameAR_specific: "برقي (٤٠-٥٠كجم)", avg_weight_kg: 45, initial_stock: 5, is_active: true },
                { item_key: "barki_50_60", weight_range_text_en: "50-60kg", weight_range_text_ar: "٥٠-٦٠ كجم", nameEN_specific: "Barki (50-60kg)", nameAR_specific: "برقي (٥٠-٦٠كجم)", avg_weight_kg: 55, initial_stock: 3, is_active: true },
                { item_key: "barki_60_plus", weight_range_text_en: "60+kg", weight_range_text_ar: "+٦٠ كجم", nameEN_specific: "Barki (60+kg)", nameAR_specific: "برقي (+٦٠كجم)", avg_weight_kg: 65, initial_stock: 2, is_active: true }
            ]
        }
    ];

    const initialBookingStateData = {
        selectedAnimal: { type: "", item_key: "", weight_range_en: "", weight_range_ar: "", basePriceEGP: 0, nameEN: "", nameAR: "", stock: null, typeGenericNameEN: "", typeGenericNameAR: "" },
        orderingPersonName: "", 
        orderingPersonPhone: "", 
        customerEmail: "", 
        niyyahNames: "",
        selectedUdheyaService: 'standard_service', 
        currentServiceFeeEGP: BARE_MINIMUM_APP_SETTINGS.udheya_service_surcharge_egp, 
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
    
    async function updateStockInPB(itemKey, quantityToDecrement = 1) {
        const pb = new PocketBase('/');
        try {
            const stockRecord = await pb.collection('stock_levels').getFirstListItem(`item_key="${itemKey}"`);
            if (stockRecord) {
                const newStock = Math.max(0, stockRecord.current_stock - quantityToDecrement);
                await pb.collection('stock_levels').update(stockRecord.id, { current_stock: newStock });
                console.log(`Stock updated in PB for ${itemKey} to ${newStock}`);
                return newStock; // Return the new stock level
            } else {
                console.warn(`Stock record not found in PB for item_key: ${itemKey}. Cannot update stock.`);
                return null; // Indicate stock record not found
            }
        } catch (error) {
            console.error(`Error updating stock in PB for ${itemKey}:`, error);
            throw error; // Rethrow to be handled by the caller
        }
    }


    Alpine.data('udheyaBooking', () => ({
        isLoading: { status: false, booking: false, init: true },
        appSettings: JSON.parse(JSON.stringify(BARE_MINIMUM_APP_SETTINGS)),
        productOptions: { livestock: [] },
        get availablePaymentMethods() { return paymentMethodDisplayOptions.filter(pm => activePaymentMethodsList.includes(pm.id)); },
        apiError: null, userFriendlyApiError: "", ...JSON.parse(JSON.stringify(initialBookingStateData)),
        bookingConfirmed: false, statusResult: null, statusNotFound: false, lookupBookingID: "", currentCurrency: "EGP", bookingID: "",
        currentConceptualStep: 1, stepProgress: { step1: false, step2: false, step3: false, step4: false, step5: false }, // 5 steps
        isMobileMenuOpen: false, isUdheyaDropdownOpen: false, isUdheyaMobileSubmenuOpen: false,
        countdown: { days: "00", hours: "00", minutes: "00", seconds: "00", ended: false },
        countdownTimerInterval: null, currentLang: "en",
        errorMessages: { required: { en: "This field is required.", ar: "هذا الحقل مطلوب." }, select: { en: "Please make a selection.", ar: "يرجى الاختيار." }, email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." }, phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." }, timeSlot: { en: "Please select a time slot.", ar: "يرجى اختيار وقت التوصيل." }, udheyaService: {en: "Please select a service option.", ar: "يرجى اختيار خيار الخدمة."}},
        navLinksData: [ { href: "#udheya-booking-start", sectionId: "udheya-booking-start", parentMenu: "Udheya" }, { href: "#check-booking-status", sectionId: "check-booking-status", parentMenu: "Udheya" }],
        activeNavLinkHref: "", stepSectionsMeta: [], deliveryFeeForDisplayEGP: 0, isDeliveryFeeVariable: false,

        getEnglishStockStatusText(stock, isActive) {
            if (!isActive) return "Inactive";
            if (stock <= 0) return "Out of Stock";
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

            let fetchedStockLevels = [];
            try {
                fetchedStockLevels = await pb.collection('stock_levels').getFullList({ requestKey: `stock-${Date.now()}` }); // Add requestKey to try and avoid cache
            } catch (e) {
                console.error("Error fetching stock levels from PocketBase:", e);
                this.apiError = "Could not load stock information. Please refresh.";
                this.userFriendlyApiError = "Error loading availability. Please refresh the page.";
            }
            
            this.productOptions.livestock = JSON.parse(JSON.stringify(HARDCODED_PRODUCT_CATALOG_CONFIG)).map(animalType => {
                animalType.weights_prices.forEach(item => {
                    item.basePriceEGP = item.avg_weight_kg * animalType.price_per_kg_egp;
                    const stockInfo = fetchedStockLevels.find(s => s.item_key === item.item_key);
                    if (stockInfo) {
                        item.current_stock = stockInfo.current_stock;
                        item.is_active = stockInfo.is_active !== undefined ? stockInfo.is_active : item.is_active;
                    } else {
                        item.current_stock = 0; 
                        item.is_active = false; 
                        console.warn(`Stock info for item_key ${item.item_key} not found in PocketBase stock_levels. Marking as inactive/out of stock.`);
                    }
                });
                return animalType;
            });
            
            let cities = []; 
            this.appSettings.delivery_areas.forEach(gov => {
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

            // New 5-step order
            this.stepSectionsMeta = [
                { id: "#step1-content", conceptualStep: 1, titleRef: "step1Title", firstFocusableErrorRef: (this.productOptions.livestock[0]?.value_key + 'WeightSelect') || 'step1Title', validator: this.validateStep1.bind(this) },
                { id: "#step2-content", conceptualStep: 2, titleRef: "step2Title", firstFocusableErrorRef: 'orderingPersonNameInput_s2', validator: this.validateStep2.bind(this) }, // Your Details
                { id: "#step3-content", conceptualStep: 3, titleRef: "step3Title", firstFocusableErrorRef: 'udheyaServiceRadios_s3', validator: this.validateStep3.bind(this) }, // Udheya Arrangements
                { id: "#step4-content", conceptualStep: 4, titleRef: "step4Title", firstFocusableErrorRef: 'distributionChoiceSelect_s4', validator: this.validateStep4.bind(this) }, // Distribution & Delivery
                { id: "#step5-content", conceptualStep: 5, titleRef: "step5Title", firstFocusableErrorRef: 'paymentMethodRadios', validator: this.validateStep5.bind(this) }  // Review & Reserve
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
        updateServiceFee() { /* ... (logic unchanged) ... */ },
        handleScroll() { /* ... (logic unchanged) ... */ },
        setError(f, m) { this.errors[f] = (typeof m === 'string' ? this.errorMessages[m] : m) || this.errorMessages.required; },
        clearError(f) { if(this.errors[f]) delete this.errors[f]; },
        clearAllErrors() { this.errors = {}; },
        focusOnRef(r, s=true) {this.$nextTick(()=>{if(this.$refs[r]){this.$refs[r].focus({preventScroll:!s});if(s)setTimeout(()=>{try{this.$refs[r].scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});}catch(e){console.warn("ScrollIntoView failed for",r,e);}},50);}})},
        get _needsDeliveryDetails() { /* ... (logic unchanged) ... */ },
        get splitDetails() { /* ... (logic unchanged) ... */ },
        _getDeliveryLocation(lang) { /* ... (logic unchanged) ... */ },
        get summaryDeliveryToEN() { /* ... (logic unchanged) ... */ },
        get summaryDeliveryToAR() { /* ... (logic unchanged) ... */ },
        get summaryDistributionEN() { /* ... (logic unchanged) ... */ },
        get summaryDistributionAR() { /* ... (logic unchanged) ... */ },
        startOfferDHDMSCountdown() { /* ... (logic unchanged) ... */ },
        updateDHDMSCountdownDisplay(t) { /* ... (logic unchanged) ... */ },
        updateDeliveryFeeDisplay() { /* ... (logic unchanged) ... */ },
        getFormattedPrice(p, c) { /* ... (logic unchanged) ... */ },
        isValidEmail: (e) => (!e?.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
        isValidPhone: (p) => p?.trim() && /^\+?[0-9\s\-()]{7,20}$/.test(p.trim()),
        scrollToSection(s) { /* ... (logic unchanged) ... */ },
        validateConceptualStep(cs, se=true) { const m=this.stepSectionsMeta[cs-1]; if(!m||!m.validator)return true; const v=m.validator(se);this.stepProgress[`step${cs}`]=v;return v;},
        updateAllStepCompletionStates() { for(let i=1;i<=this.stepSectionsMeta.length;i++)this.stepProgress[`step${i}`]=this.validateConceptualStep(i,false);},
        handleStepperNavigation(tcs) {this.clearAllErrors();let cp=true;for(let s=1;s<tcs;s++){if(!this.validateConceptualStep(s,true)){this.currentConceptualStep=s;const m=this.stepSectionsMeta[s-1];this.focusOnRef(m?.firstFocusableErrorRef||m?.titleRef);this.scrollToSection(m?.id||'#udheya-booking-start');cp=false;break;}}if(cp){this.currentConceptualStep=tcs;this.scrollToSection(this.stepSectionsMeta[tcs-1]?.id||'#udheya-booking-start');this.focusOnRef(this.stepSectionsMeta[tcs-1]?.titleRef);}},
        
        validateStep1(setErrors = true) { // Select Sheep
            if (setErrors) this.clearError('animal');
            if (!this.selectedAnimal.item_key) { if (setErrors) this.setError('animal', 'select'); return false; }
            return true; 
        },
        validateStep2(setErrors = true) { // New Step 2: Your Details
            if (setErrors) { this.clearError('orderingPersonName'); this.clearError('orderingPersonPhone'); this.clearError('customerEmail');}
            let isValid = true;
            if (!(this.orderingPersonName || "").trim()) { if (setErrors) this.setError('orderingPersonName', 'required'); isValid = false; }
            if (!this.isValidPhone(this.orderingPersonPhone)) { if (setErrors) this.setError('orderingPersonPhone', 'phone'); isValid = false; }
            if ((this.customerEmail || "").trim() && !this.isValidEmail(this.customerEmail)) { if (setErrors) this.setError('customerEmail', 'email'); isValid = false; }
            // Niyyah is optional, no validation needed unless it becomes required
            return isValid;
        },
        validateStep3(setErrors = true) { // New Step 3: Udheya Arrangements
            if (setErrors) { this.clearError('udheyaService');this.clearError('sacrificeDay'); }
            let isValid = true;
            if (!this.selectedUdheyaService) { if(setErrors) this.setError('udheyaService', 'select'); isValid = false;}
            if (!this.selectedSacrificeDay.value) { if (setErrors) this.setError('sacrificeDay', 'select'); isValid = false; }
            // Slaughter viewing is optional
            return isValid;
        },
        validateStep4(setErrors = true) { // New Step 4: Distribution & Delivery
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
        validateStep5(setErrors = true) { // New Step 5: Review & Reserve (was Step 4)
            if (setErrors) this.clearError('paymentMethod');
            if (!this.paymentMethod) { if (setErrors) this.setError('paymentMethod', 'select'); return false; }
            return true;
        },

        selectAnimal(animalTypeKeyFromCard, weightSelectElement) { /* ... (logic remains the same as previous version) ... */ },
        updateSacrificeDayTexts() { const sacrificeDaySelectElement = this.$refs.sacrificeDaySelect_s3; if (sacrificeDaySelectElement) { const optionElement = sacrificeDaySelectElement.querySelector(`option[value="${this.selectedSacrificeDay.value}"]`); if(optionElement) Object.assign(this.selectedSacrificeDay,{textEN:optionElement.dataset.en,textAR:optionElement.dataset.ar});} }, // Refers to s3, will need to be s2 in HTML
        calculateTotalPrice() { /* ... (logic remains the same) ... */ },
        updateAllDisplayedPrices() { /* ... (logic remains the same as previous version, using getEnglishStockStatusText) ... */ },

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
            const bookingId = `SL-UDHY-${new Date().getFullYear()}-${String(Math.random()).slice(2,7)}`;
            let delOpt = "self_pickup_or_internal_distribution"; 
            if (this.distributionChoice === 'char') delOpt = "charity_distribution_by_sl"; 
            else if (this._needsDeliveryDetails) delOpt = "home_delivery_to_orderer";
            const selectedCityInfo = (this._needsDeliveryDetails && this.deliveryCity) ? this.allAvailableCities.find(c => c.id === this.deliveryCity) : null;
            const payload = {
                booking_id_text: bookingId, animal_type_name_en: this.selectedAnimal.typeGenericNameEN, animal_type_name_ar: this.selectedAnimal.typeGenericNameAR,
                weight_category_name_en: this.selectedAnimal.nameEN, weight_category_name_ar: this.selectedAnimal.nameAR,
                weight_range_actual_en: this.selectedAnimal.weight_range_en, weight_range_actual_ar: this.selectedAnimal.weight_range_ar,
                animal_base_price_egp: this.selectedAnimal.basePriceEGP, udheya_service_option_selected: this.selectedUdheyaService,
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
                payment_method: this.paymentMethod, payment_status: (this.paymentMethod === 'cod' && this._needsDeliveryDetails) ? 'cod_pending_confirmation' : 'pending_payment',
                booking_status: 'confirmed_pending_payment', terms_agreed: true, 
                group_purchase_interest: this.groupPurchase, admin_notes: this.groupPurchase ? "Group purchase interest." : ""
            };
            try {
                const createdBooking = await postBookingToPB(payload); 
                this.bookingID = createdBooking.booking_id_text || createdBooking.id;
                
                const newStockLevelAfterBooking = await updateStockInPB(stockItemConfig.item_key, 1); // Decrement by 1
                if (newStockLevelAfterBooking !== null) {
                    stockItemConfig.current_stock = newStockLevelAfterBooking; 
                    this.selectedAnimal.stock = newStockLevelAfterBooking; 
                    this.updateAllDisplayedPrices(); 
                } else {
                    // Stock update failed, but booking was made. Log this seriously.
                    console.error(`CRITICAL: Booking ${this.bookingID} created, but failed to update stock for ${stockItemConfig.item_key} in PocketBase.`);
                    this.userFriendlyApiError = "Booking placed, but there was an issue updating stock. Please contact support with your Booking ID.";
                }

                this.bookingConfirmed = true; 
                this.$nextTick(() => { this.scrollToSection('#booking-confirmation-section'); this.focusOnRef('bookingConfirmedTitle'); });
            } catch (e) { 
                this.apiError=String(e.message);
                this.userFriendlyApiError="Issue submitting your booking. Please try again or contact support.";
                if (e.message.includes("Failed to update stock")) { // Specific error from updateStockInPB
                    this.userFriendlyApiError = "Booking submission failed during stock update. Please try again.";
                }
                this.$nextTick(()=>this.scrollToSection('.global-error-indicator'));
            }
            finally { this.isLoading.booking = false; }
        },
        async validateAndCheckBookingStatus() { /* ... (logic remains the same) ... */ },
        async checkBookingStatus() { /* ... (logic remains the same) ... */ },
        getSacrificeDayText(v) { const optionElement = document.querySelector(`#sacrifice_day_select_s3 option[value="${v}"]`); return optionElement ? {en: optionElement.dataset.en, ar: optionElement.dataset.ar} : {en: v, ar: v}; }, // Refers to s3, will change in HTML
        
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