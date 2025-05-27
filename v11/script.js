document.addEventListener('alpine:init', () => {
    const initialBookingState = {
        selectedAnimal: { type: "", value: "", weight: "", basePriceEGP: 0, nameEN: "", nameAR: "", stock: null, pbId: null, originalStock: null },
        selectedPrepStyle: { value: "", nameEN: "", nameAR: "", is_custom: false, addonPriceEGP: 0 },
        customPrepDetails: "",
        selectedPackaging: { value: "", addonPriceEGP: 0, nameEN: "", nameAR: "" },
        totalPriceEGP: 0, customerEmail: "", deliveryName: "", deliveryPhone: "", selectedGovernorate: "",
        deliveryCity: "", availableCities: [], deliveryAddress: "", deliveryInstructions: "", niyyahNames: "",
        splitDetailsOption: "", customSplitDetailsText: "", groupPurchase: false,
        selectedSacrificeDay: { value: "day1_10_dhul_hijjah", textEN: "Day 1 of Eid (10th Dhul Hijjah)", textAR: "اليوم الأول (10 ذو الحجة)"},
        selectedTimeSlot: "8 AM-9 AM", distributionChoice: "me", paymentMethod: "fa",
        slaughterViewingPreference: "none", // Added for slaughter viewing
        errors: {}
    };

    async function pbFetch(collectionName, { recordId = "", queryParams = "", method = "GET", body = null } = {}) {
        const apiUrl = `/api/collections/${collectionName}/records${recordId ? `/${recordId}` : ""}${queryParams ? `?${queryParams}` : ""}`;
        const options = { method, headers: {} };
        if (body) { options.headers["Content-Type"] = "application/json"; options.body = JSON.stringify(body); }
        try {
            const response = await fetch(apiUrl, options);
            if (!response.ok) {
                let errorMessage = `API Error (${method} ${collectionName} ${recordId||queryParams}): ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage += ` - ${errorData?.message || (errorData?.data && typeof errorData.data === 'object' ? Object.values(errorData.data).map(err => String(err?.message || JSON.stringify(err))).join("; ") : response.statusText)}`;
                } catch { errorMessage += ` - ${await response.text() || response.statusText}`; }
                throw new Error(errorMessage);
            }
            const responseText = await response.text();
            if (!responseText && (method === "GET" || method === "POST" || method === "PATCH")) return (method === "GET" ? { items: [] } : {});
            if (method === "DELETE" && response.status === 204) return {};
            try { return JSON.parse(responseText); }
            catch (parseError) { throw new Error(`API Parse Error (${method} ${collectionName} ${recordId||queryParams}): ${parseError.message}`); }
        } catch (error) { throw new Error((error.message.startsWith('API')||error.message.startsWith('Network') ? error.message : `Network Error (${method} ${collectionName} ${recordId||queryParams}): ${error.message}`)); }
    }

    Alpine.data('udheyaBooking', () => ({
        isLoading: { status: false, booking: false, init: true },
        appSettings: {
            exchange_rates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true }, USD: { rate_from_egp: 0.021, symbol: "$", is_active: false }, GBP: { rate_from_egp: 0.016, symbol: "£", is_active: false }},
            default_currency: "EGP",
            whatsapp_number_raw: "201000000000",
            whatsapp_number_display: "+20 100 000 0000",
            promo_end_date: new Date().toISOString(),
            promo_discount_percent: 0,
            promo_is_active: false,
            udheya_service_surcharge_egp: 750, 
            delivery_areas: [],
            payment_details: {
                vodafone_cash: "010X-XXXXXXX", instapay_ipn: "fallback_ipn@instapay", revolut_details: "@fallbackRevolut",
                monzo_details: "monzo.me/fallbacktag", bank_name: "Fallback Bank", bank_account_name: "Fallback Account", bank_account_number: "0000000000000000"
            }
        },
        productOptions: {
            livestock: [],
            preparationStyles: [
                { value: "Standard Mixed Cuts", nameEN: "Standard Mix", nameAR: "قطع عادية", is_custom: false, addonPriceEGP: 0 },
                { value: "Charity Portions", nameEN: "Charity Portions", nameAR: "حصص صدقة", is_custom: false, addonPriceEGP: 0 },
                { value: "Feast Preparation", nameEN: "Feast Prep", nameAR: "تجهيز وليمة", is_custom: false, addonPriceEGP: 250 },
                { value: "Custom & Ground Mix", nameEN: "Custom & Ground", nameAR: "مخصص ومفروم", is_custom: true, addonPriceEGP: 150 }
            ],
            packagingOptions: [
                { value: "standard", nameEN: "Standard Packaging", nameAR: "تعبئة عادية", addonPriceEGP: 0 },
                { value: "vacuum_sealed", nameEN: "Vacuum Sealed", nameAR: "تعبئة مفرغة", addonPriceEGP: 150 }
            ]
        },
        apiError: null, userFriendlyApiError: "", ...JSON.parse(JSON.stringify(initialBookingState)),
        bookingConfirmed: false, statusResult: null, statusNotFound: false, lookupBookingID: "", currentCurrency: "EGP", bookingID: "",
        currentConceptualStep: 1, stepProgress: { step1: false, step2: false, step3: false, step4: false },
        isMobileMenuOpen: false, isUdheyaDropdownOpen: false, isUdheyaMobileSubmenuOpen: false,
        countdown: { days: "00", hours: "00", minutes: "00", seconds: "00", ended: false },
        countdownTimerInterval: null, currentLang: "en",
        errorMessages: { required: { en: "This field is required.", ar: "هذا الحقل مطلوب." }, select: { en: "Please make a selection.", ar: "يرجى الاختيار." }, email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." }, phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." }, timeSlot: { en: "Please select a time slot.", ar: "يرجى اختيار وقت التوصيل." }},
        navLinksData: [ { href: "#udheya-booking-start", sectionId: "udheya-booking-start", parentMenu: "Udheya" }, { href: "#check-booking-status", sectionId: "check-booking-status", parentMenu: "Udheya" }, { href: "#livestock-section", sectionId: "livestock-section" }, { href: "#meat-section", sectionId: "meat-section" }, { href: "#gatherings-section", sectionId: "gatherings-section" }],
        activeNavLinkHref: "",
        stepSectionsMeta: [],
        deliveryFeeForDisplayEGP: 0,
        isDeliveryFeeVariable: false,

        parseWeightRange(weightRangeStr) {
            if (!weightRangeStr || typeof weightRangeStr !== 'string') return { min: 0, max: 0, avg: 0 };
            const numbers = weightRangeStr.match(/\d+(\.\d+)?/g);
            if (!numbers || numbers.length === 0) return { min: 0, max: 0, avg: 0 };
            const min = parseFloat(numbers[0]);
            const max = numbers.length > 1 ? parseFloat(numbers[1]) : min;
            return { min, max, avg: (min + max) / 2 };
        },

        getApproxPricePerKiloText(weightPriceInfo) {
            if (!this.appSettings || !weightPriceInfo || !weightPriceInfo.weight_range || typeof weightPriceInfo.price_egp !== 'number') return "";
            const { avg } = this.parseWeightRange(weightPriceInfo.weight_range);
            if (avg === 0) return "";
            const approxPerKilo = parseFloat(weightPriceInfo.price_egp) / avg;
            return `(Approx. ${this.getFormattedPrice(approxPerKilo, "EGP")}/kg)`;
        },

        async initApp() {
            this.isLoading.init = true; this.apiError = null; this.userFriendlyApiError = "";
            const initialLocalAppSettings = JSON.parse(JSON.stringify(this.appSettings));
            const initialLocalProductOptions = JSON.parse(JSON.stringify(this.productOptions));

            try {
                const [appSettingsResponse, livestockResponse] = await Promise.all([
                    pbFetch("app_settings", { queryParams: "filter=(setting_key='global_config')&perPage=1" }),
                    pbFetch("livestock_types")
                ]);

                if (appSettingsResponse?.items?.length) {
                    const remoteSettings = appSettingsResponse.items[0];
                    this.appSettings = {
                        ...initialLocalAppSettings, ...remoteSettings,
                        payment_details: { ...initialLocalAppSettings.payment_details, ...remoteSettings.payment_details },
                        exchange_rates: { ...initialLocalAppSettings.exchange_rates, ...remoteSettings.exchange_rates }
                    };
                    this.appSettings.whatsapp_number_raw = remoteSettings.whatsapp_number_raw || initialLocalAppSettings.whatsapp_number_raw;
                    this.appSettings.whatsapp_number_display = remoteSettings.whatsapp_number_display || initialLocalAppSettings.whatsapp_number_display;
                    this.appSettings.udheya_service_surcharge_egp = remoteSettings.udheya_service_surcharge_egp !== undefined ? remoteSettings.udheya_service_surcharge_egp : initialLocalAppSettings.udheya_service_surcharge_egp;
                    this.appSettings.delivery_areas = remoteSettings.delivery_areas && Array.isArray(remoteSettings.delivery_areas) && remoteSettings.delivery_areas.length > 0 ? remoteSettings.delivery_areas : initialLocalAppSettings.delivery_areas;
                } else {
                    console.warn('Warning: No global_config found in app_settings. Using local fallback defaults for appSettings.');
                    this.appSettings = initialLocalAppSettings;
                }

                this.productOptions.livestock = livestockResponse?.items?.map(item => ({
                    pbId: item.id, value_key: item.value_key, name_en: item.name_en, name_ar: item.name_ar,
                    weights_prices: Array.isArray(item.weights_prices) ? item.weights_prices.map(wp => ({ ...wp })) : []
                })) || [];
                if (!this.productOptions.preparationStyles || this.productOptions.preparationStyles.length === 0) {
                    this.productOptions.preparationStyles = initialLocalProductOptions.preparationStyles;
                }
                if (!this.productOptions.packagingOptions || this.productOptions.packagingOptions.length === 0) {
                    this.productOptions.packagingOptions = initialLocalProductOptions.packagingOptions;
                }

            } catch (error) {
                this.apiError = String(error.message || "Unknown error during data fetch.");
                this.userFriendlyApiError = "Failed to load essential application data. Please refresh or try again later.";
                this.appSettings = initialLocalAppSettings;
                this.productOptions = initialLocalProductOptions;
                console.error("API Init Error:", error);
            } finally {
                this.currentCurrency = this.appSettings.default_currency && this.appSettings.exchange_rates[this.appSettings.default_currency] ? this.appSettings.default_currency : "EGP";
                this.startOfferDHDMSCountdown();
                this.updateSacrificeDayTexts();
                this.clearAllErrors();
                this.$nextTick(() => {
                    if (this.productOptions.livestock?.length > 0) {
                        this.updateAllDisplayedPrices();
                    } else if (!this.apiError) {
                         this.userFriendlyApiError = this.userFriendlyApiError || "Livestock options could not be loaded. Please check back later.";
                    }
                    this.updateAllStepCompletionStates();
                    this.handleScroll();
                    this.focusOnRef(this.bookingConfirmed ? "bookingConfirmedTitle" : "body", false);
                    this.updateDeliveryFeeDisplay();
                    this.isLoading.init = false;
                });
            }
            this.stepSectionsMeta = [
                { id: "#step1-content", conceptualStep: 1, titleRef: "step1Title", firstFocusableErrorRef: null, validator: this.validateStep1.bind(this) },
                { id: "#step2-content", conceptualStep: 2, titleRef: "step2Title", firstFocusableErrorRef: null, validator: this.validateStep2.bind(this) },
                { id: "#step3-content", conceptualStep: 3, titleRef: "step3Title", firstFocusableErrorRef: null, validator: this.validateStep3.bind(this) },
                { id: "#step4-content", conceptualStep: 4, titleRef: "step4Title", firstFocusableErrorRef: null, validator: this.validateStep4.bind(this) }
            ];
            ['selectedAnimal.basePriceEGP', 'selectedPrepStyle.addonPriceEGP', 'selectedPackaging.addonPriceEGP', 'currentCurrency', 'appSettings.udheya_service_surcharge_egp'].forEach(prop => this.$watch(prop, () => { this.calculateTotalPrice(); if(!['selectedPackaging.addonPriceEGP', 'selectedPrepStyle.addonPriceEGP'].includes(prop)) this.updateAllDisplayedPrices(); }));
            ['selectedSacrificeDay.value', 'distributionChoice', 'selectedPrepStyle.value', 'selectedPackaging.value', 'splitDetailsOption', 'customSplitDetailsText', 'deliveryName', 'deliveryPhone', 'deliveryAddress', 'selectedTimeSlot', 'paymentMethod', 'slaughterViewingPreference', 'selectedGovernorate', 'deliveryCity'].forEach(prop => this.$watch(prop, (newValue, oldValue) => {
                this.updateAllStepCompletionStates();
                if (prop === 'selectedGovernorate' || (prop === 'deliveryCity' && newValue !== oldValue)) {
                    this.updateDeliveryFeeDisplay();
                }
            }));
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
            document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.startOfferDHDMSCountdown(); else if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval); });
        },

        handleScroll() {
            if (!this.bookingConfirmed && this.stepSectionsMeta.some(step => document.querySelector(step.id) && typeof document.querySelector(step.id).offsetTop === 'number')) {
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
        setError(field, messageKeyOrObject) { this.errors[field] = (typeof messageKeyOrObject === 'string' ? this.errorMessages[messageKeyOrObject] : messageKeyOrObject) || this.errorMessages.required; },
        clearError(field) { if (this.errors[field]) delete this.errors[field]; },
        clearAllErrors() { this.errors = {}; },
        focusOnRef(refName, shouldScroll = true) { this.$nextTick(() => { if (this.$refs[refName]) { this.$refs[refName].focus({ preventScroll: !shouldScroll }); if (shouldScroll) { setTimeout(() => { try { this.$refs[refName].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch(e) {console.warn("ScrollIntoView failed for", refName, e)} }, 50); } } }); },
        get _needsDeliveryDetails() { const customDetailsLower = (this.customSplitDetailsText || "").toLowerCase(); return this.distributionChoice === 'me' || (this.distributionChoice === 'split' && (["1/3_me_2/3_charity_sl", "1/2_me_1/2_charity_sl", "2/3_me_1/3_charity_sl", "all_me_custom_distro"].includes(this.splitDetailsOption) || (this.splitDetailsOption === 'custom' && (customDetailsLower.includes("for me") || customDetailsLower.includes("all delivered to me") || customDetailsLower.includes("لي") || customDetailsLower.includes("توصيل لي"))))); },
        get splitDetails() { if (this.distributionChoice !== 'split') return ""; if (this.splitDetailsOption === 'custom') return (this.customSplitDetailsText || "").trim(); const optionsMap = { "1/3_me_2/3_charity_sl": { en: "1/3 me (delivered), 2/3 charity (SL)", ar: "ثلث لي (يوصل)، ثلثان صدقة (أرض الأغنام)" }, "1/2_me_1/2_charity_sl": { en: "1/2 me (delivered), 1/2 charity (SL)", ar: "نصف لي (يوصل)، نصف صدقة (أرض الأغنام)" }, "2/3_me_1/3_charity_sl": { en: "2/3 me (delivered), 1/3 charity (SL)", ar: "ثلثان لي (يوصل)، ثلث صدقة (أرض الأغنام)" }, "all_me_custom_distro": { en: "All for me (I distribute)", ar: "الكل لي (أنا أوزع)" }}; const selected = optionsMap[this.splitDetailsOption]; return selected ? (this.currentLang === 'ar' ? selected.ar : selected.en) : this.splitDetailsOption; },
        _getDeliveryLocation(lang) { const nameKey = lang === 'en' ? 'name_en' : 'name_ar'; const govObj = (this.appSettings.delivery_areas || []).find(area => area.id === this.selectedGovernorate); const cityObj = govObj?.cities?.find(city => city.id === this.deliveryCity); if (cityObj?.[nameKey]) return cityObj[nameKey]; if (govObj && govObj.cities?.length === 0 && this.selectedGovernorate && govObj[nameKey]) return govObj[nameKey]; if (govObj && !cityObj && this.selectedGovernorate && govObj[nameKey]) return `${govObj[nameKey]} (${lang === 'en' ? "City not selected" : "المدينة غير مختارة"})`; return ""; },
        get summaryDeliveryToEN() { if (this.distributionChoice === 'char') return "Charity Distribution by Sheep Land"; if (this._needsDeliveryDetails) { const name = (this.deliveryName || "").trim(); const locEN = this._getDeliveryLocation('en'); const shortAddr = (this.deliveryAddress || "").substring(0, 20) + ((this.deliveryAddress || "").length > 20 ? "..." : ""); return [name, locEN, shortAddr].filter(p => p?.trim()).join(", ") || "Delivery Details Incomplete"; } return "Self Pickup / Distribution as per split"; },
        get summaryDeliveryToAR() { if (this.distributionChoice === 'char') return "توزيع خيري بواسطة أرض الأغنام"; if (this._needsDeliveryDetails) { const name = (this.deliveryName || "").trim(); const locAR = this._getDeliveryLocation('ar'); const shortAddr = (this.deliveryAddress || "").substring(0, 20) + ((this.deliveryAddress || "").length > 20 ? "..." : ""); return [name, locAR, shortAddr].filter(p => p?.trim()).join("، ") || "تفاصيل التوصيل غير مكتملة"; } return "استلام ذاتي / توزيع حسب التقسيم"; },
        get summaryDistributionEN() { if (this.distributionChoice === 'me') return "All to me"; if (this.distributionChoice === 'char') return "All to charity (by Sheep Land)"; return `Split: ${(this.splitDetails || "").trim() || "(Not specified)"}`; },
        get summaryDistributionAR() { if (this.distributionChoice === 'me') return "الكل لي"; if (this.distributionChoice === 'char') return "تبرع بالكل للصدقة (أرض الأغنام توزع)"; return `تقسيم الحصص: ${(this.splitDetails || "").trim() || "(لم يحدد)"}`; },
        startOfferDHDMSCountdown() { if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval); if (!this.appSettings.promo_is_active || !this.appSettings.promo_end_date || typeof this.appSettings.promo_end_date !== 'string') { this.countdown.ended = true; return; } const targetTime = new Date(this.appSettings.promo_end_date).getTime(); if (isNaN(targetTime)) { this.countdown.ended = true; return; } this.updateDHDMSCountdownDisplay(targetTime); this.countdownTimerInterval = setInterval(() => this.updateDHDMSCountdownDisplay(targetTime), 1000); },
        updateDHDMSCountdownDisplay(targetTime) { const distance = targetTime - Date.now(); if (distance < 0) { if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval); Object.assign(this.countdown, { days: "00", hours: "00", minutes: "00", seconds: "00", ended: true }); return; } this.countdown.ended = false; this.countdown = {days:String(Math.floor(distance/864e5)).padStart(2,'0'), hours:String(Math.floor(distance%864e5/36e5)).padStart(2,'0'), minutes:String(Math.floor(distance%36e5/6e4)).padStart(2,'0'), seconds:String(Math.floor(distance%6e4/1e3)).padStart(2,'0')}; },
        updateCities() {
            const selectedGovData = (this.appSettings.delivery_areas || []).find(area => area.id === this.selectedGovernorate);
            this.availableCities = selectedGovData?.cities || [];
            this.deliveryCity = "";
            this.updateDeliveryFeeDisplay();
        },
        updateDeliveryFeeDisplay() {
            this.deliveryFeeForDisplayEGP = 0;
            this.isDeliveryFeeVariable = false;
            if (!this.selectedGovernorate && !this.deliveryCity) return;

            const gov = (this.appSettings.delivery_areas || []).find(a => a.id === this.selectedGovernorate);
            if (!gov) { this.isDeliveryFeeVariable = true; return; }

            let city;
            if (this.deliveryCity && gov.cities && gov.cities.length > 0) {
                city = gov.cities.find(c => c.id === this.deliveryCity);
            }
            const feeSource = city || gov;

            if (feeSource && typeof feeSource.delivery_fee_egp === 'number') {
                this.deliveryFeeForDisplayEGP = feeSource.delivery_fee_egp;
                this.isDeliveryFeeVariable = false;
            } else if (feeSource && feeSource.delivery_fee_egp === null) {
                this.isDeliveryFeeVariable = true; this.deliveryFeeForDisplayEGP = 0;
            } else if (!city && this.deliveryCity && gov.cities && gov.cities.length > 0) {
                if (gov && typeof gov.delivery_fee_egp === 'number') { this.deliveryFeeForDisplayEGP = gov.delivery_fee_egp; this.isDeliveryFeeVariable = false; }
                else { this.isDeliveryFeeVariable = true; this.deliveryFeeForDisplayEGP = 0; }
            } else { this.isDeliveryFeeVariable = true; this.deliveryFeeForDisplayEGP = 0; }
        },
        getFormattedPrice(priceEGP, currencyCode) { const finalCC = currencyCode || this.currentCurrency; const currencyInfo = this.appSettings?.exchange_rates?.[finalCC]; if (priceEGP == null || !currencyInfo || typeof currencyInfo.rate_from_egp !== 'number') return `${currencyInfo?.symbol || (finalCC === 'EGP' ? 'LE' : '?')} ---`; const convertedPrice = priceEGP * currencyInfo.rate_from_egp; return `${currencyInfo.symbol || (finalCC === 'EGP' ? 'LE' : finalCC)} ${convertedPrice.toFixed((currencyInfo.symbol === "LE" || currencyInfo.symbol === "ل.م" || finalCC === 'EGP') ? 0 : 2)}`; },
        isValidEmail: (email) => (!email?.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        isValidPhone: (phone) => phone?.trim() && /^\+?[0-9\s\-()]{7,20}$/.test(phone.trim()),
        scrollToSection(selector) { try { const element = document.querySelector(selector); if (element) { let offset = document.querySelector('.site-header')?.offsetHeight || 0; if (selector.startsWith('#udheya-booking-start') || selector.startsWith('#step') || selector.startsWith('#udheya-booking-form-panel')) { const stepperHeader = document.querySelector('.stepper-outer-wrapper'); if (stepperHeader && getComputedStyle(stepperHeader).position === 'sticky') offset += stepperHeader.offsetHeight; } window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - offset - 10, behavior: 'smooth' }); } } catch (error) {} },
        validateConceptualStep(conceptualStep, setErrors = true) { const stepMeta = this.stepSectionsMeta[conceptualStep - 1]; if (!stepMeta || !stepMeta.validator) return true; const isValid = stepMeta.validator(setErrors); this.stepProgress[`step${conceptualStep}`] = isValid; return isValid; },
        updateAllStepCompletionStates() { for (let i = 1; i <= this.stepSectionsMeta.length; i++) this.stepProgress[`step${i}`] = this.validateConceptualStep(i, false); },
        handleStepperNavigation(targetConceptualStep) { this.clearAllErrors(); let canProceed = true; for (let step = 1; step < targetConceptualStep; step++) { if (!this.validateConceptualStep(step, true)) { this.currentConceptualStep = step; const stepMeta = this.stepSectionsMeta[step-1]; this.focusOnRef(stepMeta?.firstFocusableErrorRef || stepMeta?.titleRef); this.scrollToSection(stepMeta?.id || '#udheya-booking-start'); canProceed = false; break; }} if (canProceed) { this.currentConceptualStep = targetConceptualStep; this.scrollToSection(this.stepSectionsMeta[targetConceptualStep-1]?.id || '#udheya-booking-start'); this.focusOnRef(this.stepSectionsMeta[targetConceptualStep-1]?.titleRef); }},
        validateStep1(setErrors = true) { /* ... as before ... */ },
        validateStep2(setErrors = true) { /* ... as before ... */ },
        validateStep3(setErrors = true) { /* ... as before ... */ }, // Slaughter viewing preference is optional, no specific validation needed here for it
        validateStep4(setErrors = true) { /* ... as before ... */ },
        selectAnimal(animalTypeValueKey, weightSelectElement) { /* ... as before ... */ },
        updateSelectedPrepStyle(value) { const selectedOption = this.productOptions.preparationStyles.find(style => style.value === value); this.selectedPrepStyle = selectedOption ? { ...selectedOption, addonPriceEGP: parseFloat(selectedOption.addonPriceEGP || 0) } : { value: "", nameEN: "", nameAR: "", is_custom: false, addonPriceEGP: 0 }; if (!this.selectedPrepStyle.is_custom) this.customPrepDetails = ""; this.calculateTotalPrice(); this.updateAllStepCompletionStates(); },
        updateSelectedPackaging(value) { const selectedOption = this.productOptions.packagingOptions.find(pkg => pkg.value === value); this.selectedPackaging = selectedOption ? { ...selectedOption, addonPriceEGP: parseFloat(selectedOption.addonPriceEGP || 0) } : { value: "", addonPriceEGP: 0, nameEN: "", nameAR: "" }; this.calculateTotalPrice(); this.updateAllStepCompletionStates(); },
        updateSacrificeDayTexts() { const optionElement = document.querySelector(`#sacrifice_day_select_s3 option[value="${this.selectedSacrificeDay.value}"]`); if (optionElement) Object.assign(this.selectedSacrificeDay, { textEN: optionElement.dataset.en, textAR: optionElement.dataset.ar }); },
        calculateTotalPrice() { const surcharge = this.appSettings.udheya_service_surcharge_egp || 0; const prepStyleAddon = this.selectedPrepStyle.addonPriceEGP || 0; const packagingAddon = this.selectedPackaging.addonPriceEGP || 0; this.totalPriceEGP = (this.selectedAnimal.basePriceEGP || 0) + surcharge + prepStyleAddon + packagingAddon; },
        updateAllDisplayedPrices() {
            try {
                (this.productOptions.livestock || []).forEach(livestockType => {
                    const weightSelectElement = this.$refs[`${livestockType.value_key}WeightSelect`];
                    const cardElement = document.getElementById(livestockType.value_key);
                    if (!weightSelectElement || !cardElement) return;
                    const currentSelectedWeightInDropdown = weightSelectElement.value;
                    weightSelectElement.innerHTML = `<option value="">${this.currentLang === 'ar' ? "-- اختر الوزن --" : "-- Select Weight --"}</option>`;
                    let currentSelectionStillValid = false;
                    (livestockType.weights_prices || []).forEach(wp => {
                        const optionEl = document.createElement('option');
                        optionEl.value = wp.weight_range;
                        const isOutOfStock = !wp.is_active || (wp.stock != null && wp.stock <= 0);
                        const stockText = isOutOfStock ? (this.currentLang === 'ar' ? " - نفذت الكمية" : " - Out of Stock") : (wp.stock != null ? ` - ${(this.currentLang === 'ar' ? "الكمية: " : "Stock: ")}${wp.stock}` : "");
                        const approxPerKiloText = this.getApproxPricePerKiloText(wp);
                        optionEl.textContent = `${wp.weight_range || ""} (${this.getFormattedPrice(wp.price_egp)}) ${approxPerKiloText} ${stockText}`.trim();
                        optionEl.disabled = isOutOfStock;
                        weightSelectElement.appendChild(optionEl);
                        if (wp.weight_range === currentSelectedWeightInDropdown && !isOutOfStock) currentSelectionStillValid = true;
                    });
                    if (currentSelectedWeightInDropdown && currentSelectionStillValid) { weightSelectElement.value = currentSelectedWeightInDropdown; }
                    else if (this.selectedAnimal.type === livestockType.value_key && this.selectedAnimal.weight && livestockType.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight && wp.is_active && (wp.stock == null || wp.stock > 0))) { weightSelectElement.value = this.selectedAnimal.weight; }
                    else { weightSelectElement.value = ""; }
                    const firstActiveWeightPrice = (livestockType.weights_prices || []).find(wp => wp.is_active && (wp.stock == null || wp.stock > 0));
                    const fromPriceEgp = firstActiveWeightPrice ? firstActiveWeightPrice.price_egp : ((livestockType.weights_prices || [])[0]?.price_egp || 0);
                    const priceSpanEN = cardElement.querySelector('.price.bil-row .en span');
                    const priceSpanAR = cardElement.querySelector('.price.bil-row .ar span');
                    if (priceSpanEN) priceSpanEN.textContent = this.getFormattedPrice(fromPriceEgp);
                    if (priceSpanAR) priceSpanAR.textContent = this.getFormattedPrice(fromPriceEgp);
                });
                this.calculateTotalPrice();
            } catch (error) { console.error("Error updating price displays:", error); this.userFriendlyApiError = "Error updating price displays."; }
        },
        async validateAndSubmitBooking() {
            this.clearAllErrors(); let isFormValid = true;
            for (let step = 1; step <= this.stepSectionsMeta.length; step++) { if (!this.validateConceptualStep(step, true)) { isFormValid = false; const stepMeta = this.stepSectionsMeta[step - 1]; if (stepMeta) { this.focusOnRef(stepMeta.firstFocusableErrorRef || stepMeta.titleRef); this.scrollToSection(stepMeta?.id || '#udheya-booking-start'); } break; }}
            if (!isFormValid) return;
            const selectedAnimalConfig = this.productOptions.livestock.find(lt => lt.value_key === this.selectedAnimal.value);
            const selectedWeightPriceInfo = selectedAnimalConfig?.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight);
            if (!selectedAnimalConfig || !selectedWeightPriceInfo || !selectedWeightPriceInfo.is_active || (selectedWeightPriceInfo.stock != null && selectedWeightPriceInfo.stock <= 0)) { this.setError('animal', { en: `Sorry, ${this.selectedAnimal.nameEN || "selected item"} (${this.selectedAnimal.weight}) is unavailable. Please reselect.`, ar: `عذراً، ${this.selectedAnimal.nameAR || "المنتج المختار"} (${this.selectedAnimal.weight}) غير متوفر. يرجى إعادة الاختيار.` }); this.selectedAnimal = { ...initialBookingState.selectedAnimal }; this.updateAllDisplayedPrices(); this.updateAllStepCompletionStates(); this.scrollToSection('#step1-content'); this.focusOnRef(this.stepSectionsMeta[0].titleRef); return; }
            this.isLoading.booking = true; this.apiError = null; this.userFriendlyApiError = "";
            this.calculateTotalPrice();
            const bookingPayload = {
                booking_id_text: `SL-UDHY-${(new Date()).getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0')}`,
                animal_type_key: this.selectedAnimal.value, animal_type_name_en: this.selectedAnimal.nameEN, animal_type_name_ar: this.selectedAnimal.nameAR,
                animal_weight_selected: this.selectedAnimal.weight, animal_base_price_egp: this.selectedAnimal.basePriceEGP,
                service_fee_applied_egp: this.appSettings.udheya_service_surcharge_egp || 0,
                preparation_style_value: this.selectedPrepStyle.value, preparation_style_name_en: this.selectedPrepStyle.nameEN, preparation_style_name_ar: this.selectedPrepStyle.nameAR,
                prep_style_price_applied_egp: this.selectedPrepStyle.addonPriceEGP || 0,
                is_custom_prep: this.selectedPrepStyle.is_custom, custom_prep_details: this.selectedPrepStyle.is_custom ? (this.customPrepDetails || "").trim() : "",
                packaging_value: this.selectedPackaging.value, packaging_name_en: this.selectedPackaging.nameEN, packaging_name_ar: this.selectedPackaging.nameAR,
                packaging_addon_price_egp: this.selectedPackaging.addonPriceEGP, total_price_egp: this.totalPriceEGP,
                sacrifice_day_value: this.selectedSacrificeDay.value, time_slot: this.distributionChoice === 'char' ? 'N/A' : this.selectedTimeSlot,
                distribution_choice: this.distributionChoice, split_details_option: this.distributionChoice === 'split' ? this.splitDetailsOption : "",
                custom_split_details_text: (this.distributionChoice === 'split' && this.splitDetailsOption === 'custom') ? (this.customSplitDetailsText || "").trim() : "",
                niyyah_names: (this.niyyahNames || "").trim(), customer_email: (this.customerEmail || "").trim(), group_purchase_interest: this.groupPurchase,
                slaughter_viewing_preference: this.slaughterViewingPreference, // Added
                delivery_name: this._needsDeliveryDetails ? (this.deliveryName || "").trim() : "", delivery_phone: this._needsDeliveryDetails ? (this.deliveryPhone || "").trim() : "",
                delivery_governorate_id: this._needsDeliveryDetails ? this.selectedGovernorate : "", delivery_city_id: this._needsDeliveryDetails ? this.deliveryCity : "",
                delivery_address: this._needsDeliveryDetails ? (this.deliveryAddress || "").trim() : "", delivery_instructions: this._needsDeliveryDetails ? (this.deliveryInstructions || "").trim() : "",
                delivery_fee_applied_egp: (this._needsDeliveryDetails && this.deliveryFeeForDisplayEGP > 0 && !this.isDeliveryFeeVariable) ? this.deliveryFeeForDisplayEGP : 0,
                payment_method: this.paymentMethod,
                payment_status: (this.paymentMethod === 'cod' && this._needsDeliveryDetails) || ['visa','mastercard', 'applepay', 'googlepay'].includes(this.paymentMethod) ? 'pending_confirmation' : 'pending_payment',
                booking_status: 'confirmed_pending_payment',
            };
            try {
                const createdRecord = await pbFetch("bookings", { method: "POST", body: bookingPayload });
                this.bookingID = createdRecord.booking_id_text || createdRecord.id;
                if (selectedWeightPriceInfo && selectedWeightPriceInfo.stock != null && selectedWeightPriceInfo.stock > 0) { selectedWeightPriceInfo.stock--; }
                this.bookingConfirmed = true;
                this.$nextTick(() => { this.scrollToSection('#booking-confirmation-section'); this.focusOnRef('bookingConfirmedTitle'); });
            } catch (error) {
                this.apiError = String(error.message); this.userFriendlyApiError = "Issue submitting booking. Review details, try again, or contact support.";
                this.$nextTick(() => this.scrollToSection('.global-error-indicator'));
            } finally { this.isLoading.booking = false; }
        },
        async validateAndCheckBookingStatus() { this.clearError('lookupBookingID'); if ((this.lookupBookingID || "").trim()) await this.checkBookingStatus(); else { this.setError('lookupBookingID', 'required'); this.focusOnRef('lookupBookingIdInput'); } },
        async checkBookingStatus() { this.statusResult = null; this.statusNotFound = false; this.isLoading.status = true; this.apiError = null; this.userFriendlyApiError = ""; const trimmedLookupID = (this.lookupBookingID || "").trim(); try { const response = await pbFetch("bookings", { queryParams: `filter=(booking_id_text='${encodeURIComponent(trimmedLookupID)}')&perPage=1` }); if (response.items?.length > 0) { const booking = response.items[0]; this.statusResult = { booking_id_text: booking.booking_id_text || booking.id, status: booking.booking_status || "Unknown", animal_type: booking.animal_type_name_en || booking.animal_type_key, animal_weight_selected: booking.animal_weight_selected, sacrifice_day: booking.sacrifice_day_value, time_slot: booking.time_slot }; } else this.statusNotFound = true; } catch (error) { this.apiError = String(error.message); this.userFriendlyApiError = "Could not retrieve booking status. Check ID or try again."; this.statusNotFound = true; } finally { this.isLoading.status = false; } },
        getSacrificeDayText(dayValue) { const optionElement = document.querySelector(`#sacrifice_day_select_s3 option[value="${dayValue}"]`); return optionElement ? { en: optionElement.dataset.en, ar: optionElement.dataset.ar } : { en: dayValue, ar: dayValue }; },
        resetAndStartOver() {
             Object.assign(this, JSON.parse(JSON.stringify(initialBookingState)), {
                bookingConfirmed: false, bookingID: "", lookupBookingID: "", statusResult: null, statusNotFound: false,
                currentConceptualStep: 1, stepProgress: { step1: false, step2: false, step3: false, step4: false },
                apiError: null, userFriendlyApiError: "",
                deliveryFeeForDisplayEGP: 0, isDeliveryFeeVariable: false,
            });
            if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            this.initApp();
            this.$nextTick(() => {
                this.scrollToSection('#udheya-booking-start');
                this.focusOnRef('bookingSectionTitle');
            });
        }
    }));
});
