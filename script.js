document.addEventListener('alpine:init', () => {
    const initialBookingState = {
        selectedAnimal: { type: "", value: "", weight: "", basePriceEGP: 0, nameEN: "", nameAR: "", stock: null, pbId: null, originalStock: null },
        selectedPrepStyle: { value: "", nameEN: "", nameAR: "", is_custom: false },
        customPrepDetails: "",
        selectedPackaging: { value: "", addonPriceEGP: 0, nameEN: "", nameAR: "" },
        totalPriceEGP: 0, customerEmail: "", deliveryName: "", deliveryPhone: "", selectedGovernorate: "",
        deliveryCity: "", availableCities: [], deliveryAddress: "", deliveryInstructions: "", niyyahNames: "",
        splitDetailsOption: "", customSplitDetailsText: "", groupPurchase: false,
        selectedSacrificeDay: { value: "day1_10_dhul_hijjah", textEN: "Day 1 of Eid (10th Dhul Hijjah)", textAR: "اليوم الأول (10 ذو الحجة)"},
        selectedTimeSlot: "8 AM-9 AM", distributionChoice: "me", paymentMethod: "fa", errors: {}
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
            default_currency: "EGP", whatsapp_number_raw: "201000000000", whatsapp_number_display: "+20 100 000 0000",
            promo_end_date: new Date(Date.now() + (7*24*60*60*1000)).toISOString(), promo_discount_percent: 10, promo_is_active: true,
            delivery_areas: [{id:"cairo",name_en:"Cairo",name_ar:"القاهرة",cities:[{id:"nasr_city",name_en:"Nasr City",name_ar:"مدينة نصر"},{id:"maadi",name_en:"Maadi",name_ar:"المعادي"}]}],
            payment_details: { vodafone_cash: "010XXXXXXXX", instapay_ipn: "your_ipn@instapay", revolut_details: "@yourRevolutTag", monzo_details: "monzo.me/yourtag", bank_name: "Default Bank", bank_account_name: "Default Account Name", bank_account_number: "000000000000", bank_iban: "", bank_swift: "" }
        },
        productOptions: {
            livestock: [],
            preparationStyles: [ { value: "Standard Mixed Cuts", nameEN: "Standard Mix", nameAR: "قطع عادية", is_custom: false }, { value: "Charity Portions", nameEN: "Charity Portions", nameAR: "حصص صدقة", is_custom: false }, { value: "Feast Preparation", nameEN: "Feast Preparation", nameAR: "تجهيز ولائم", is_custom: false }, { value: "Custom & Ground Mix", nameEN: "Custom & Ground", nameAR: "مخصص ومفروم", is_custom: true }],
            packagingOptions: [ { value: "standard", nameEN: "Standard Packaging", nameAR: "تعبئة عادية", addonPriceEGP: 0 }, { value: "vacuum_sealed", nameEN: "Vacuum Sealed", nameAR: "تعبئة مفرغة", addonPriceEGP: 150 }]
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

        async initApp() {
            this.isLoading.init = true; this.apiError = null; this.userFriendlyApiError = "";
            const defaultLocalSettings = JSON.parse(JSON.stringify(this.appSettings));
            try {
                const [appSettingsResponse, livestockResponse] = await Promise.all([
                    pbFetch("app_settings", { queryParams: "filter=(setting_key='global_config')&perPage=1" }),
                    pbFetch("livestock_types")
                ]);
                if (appSettingsResponse?.items?.length) {
                    const remoteSettings = appSettingsResponse.items[0];
                    this.appSettings = { ...defaultLocalSettings, ...remoteSettings, payment_details: { ...defaultLocalSettings.payment_details, ...remoteSettings.payment_details}, exchange_rates: { ...defaultLocalSettings.exchange_rates, ...remoteSettings.exchange_rates }};
                    this.appSettings.whatsapp_number_raw = this.appSettings.whatsapp_number_raw || defaultLocalSettings.whatsapp_number_raw;
                    this.appSettings.whatsapp_number_display = this.appSettings.whatsapp_number_display || defaultLocalSettings.whatsapp_number_display;
                } else { this.appSettings = defaultLocalSettings; }
                this.productOptions.livestock = livestockResponse?.items?.map(item => ({ pbId: item.id, value_key: item.value_key, name_en: item.name_en, name_ar: item.name_ar, weights_prices: Array.isArray(item.weights_prices) ? item.weights_prices.map(wp => ({ ...wp })) : [] })) || [];
            } catch (error) {
                this.apiError = String(error.message || "Unknown error during data fetch.");
                this.userFriendlyApiError = "Failed to load settings. Please refresh or try again later.";
                this.appSettings = defaultLocalSettings; this.productOptions.livestock = [];
            } finally {
                this.currentCurrency = this.appSettings.default_currency && this.appSettings.exchange_rates[this.appSettings.default_currency] ? this.appSettings.default_currency : "EGP";
                this.startOfferDHDMSCountdown(); this.updateSacrificeDayTexts(); this.clearAllErrors();
                this.$nextTick(() => {
                    if (this.productOptions.livestock?.length > 0) this.updateAllDisplayedPrices();
                    else if (!this.apiError) this.userFriendlyApiError = this.userFriendlyApiError || "Livestock options could not be loaded.";
                    this.updateAllStepCompletionStates(); this.handleScroll();
                    this.focusOnRef(this.bookingConfirmed ? "bookingConfirmedTitle" : (this.$refs.step1Title ? "step1Title" : "bookingSectionTitle"));
                    this.isLoading.init = false;
                });
            }
            this.stepSectionsMeta = [
                { id: "#step1-content", conceptualStep: 1, titleRef: "step1Title", firstFocusableErrorRef: null, validator: this.validateStep1.bind(this) },
                { id: "#step2-content", conceptualStep: 2, titleRef: "step2Title", firstFocusableErrorRef: null, validator: this.validateStep2.bind(this) },
                { id: "#step3-content", conceptualStep: 3, titleRef: "step3Title", firstFocusableErrorRef: null, validator: this.validateStep3.bind(this) },
                { id: "#step4-content", conceptualStep: 4, titleRef: "step4Title", firstFocusableErrorRef: null, validator: this.validateStep4.bind(this) }
            ];
            ['selectedAnimal.basePriceEGP', 'selectedPackaging.addonPriceEGP', 'currentCurrency'].forEach(prop => this.$watch(prop, () => { this.calculateTotalPrice(); if(prop !== 'selectedPackaging.addonPriceEGP') this.updateAllDisplayedPrices(); }));
            ['selectedSacrificeDay.value', 'distributionChoice', 'selectedPrepStyle.value', 'selectedPackaging.value', 'splitDetailsOption', 'customSplitDetailsText', 'selectedGovernorate', 'deliveryCity', 'deliveryName', 'deliveryPhone', 'deliveryAddress', 'selectedTimeSlot', 'paymentMethod'].forEach(prop => this.$watch(prop, () => this.updateAllStepCompletionStates()));
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
        focusOnRef(refName, shouldScroll = true) { this.$nextTick(() => { if (this.$refs[refName]) { this.$refs[refName].focus({ preventScroll: false }); if (shouldScroll) { setTimeout(() => { try { this.$refs[refName].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch(e) {} }, 50); } } }); },
        get _needsDeliveryDetails() { const customDetailsLower = (this.customSplitDetailsText || "").toLowerCase(); return this.distributionChoice === 'me' || (this.distributionChoice === 'split' && (["1/3_me_2/3_charity_sl", "1/2_me_1/2_charity_sl", "2/3_me_1/3_charity_sl", "all_me_custom_distro"].includes(this.splitDetailsOption) || (this.splitDetailsOption === 'custom' && (customDetailsLower.includes("for me") || customDetailsLower.includes("all delivered to me"))))); },
        get splitDetails() { if (this.distributionChoice !== 'split') return ""; if (this.splitDetailsOption === 'custom') return (this.customSplitDetailsText || "").trim(); const optionsMap = { "1/3_me_2/3_charity_sl": { en: "1/3 me (delivered), 2/3 charity (SL)", ar: "ثلث لي (يوصل)، ثلثان صدقة (أرض الأغنام)" }, "1/2_me_1/2_charity_sl": { en: "1/2 me (delivered), 1/2 charity (SL)", ar: "نصف لي (يوصل)، نصف صدقة (أرض الأغنام)" }, "2/3_me_1/3_charity_sl": { en: "2/3 me (delivered), 1/3 charity (SL)", ar: "ثلثان لي (يوصل)، ثلث صدقة (أرض الأغنام)" }, "all_me_custom_distro": { en: "All for me (I distribute)", ar: "الكل لي (أنا أوزع)" }}; const selected = optionsMap[this.splitDetailsOption]; return selected ? (this.currentLang === 'ar' ? selected.ar : selected.en) : this.splitDetailsOption; },
        _getDeliveryLocation(lang) { const nameKey = lang === 'en' ? 'name_en' : 'name_ar'; const govObj = (this.appSettings.delivery_areas || []).find(area => area.id === this.selectedGovernorate); const cityObj = govObj?.cities?.find(city => city.id === this.deliveryCity); if (cityObj?.[nameKey]) return cityObj[nameKey]; if (govObj && govObj.cities?.length === 0 && this.selectedGovernorate && govObj[nameKey]) return govObj[nameKey]; if (govObj && !cityObj && this.selectedGovernorate && govObj[nameKey]) return `${govObj[nameKey]} (${lang === 'en' ? "City not selected" : "المدينة غير مختارة"})`; return ""; },
        get summaryDeliveryToEN() { if (this.distributionChoice === 'char') return "Charity Distribution by Sheep Land"; if (this._needsDeliveryDetails) { const name = (this.deliveryName || "").trim(); const locEN = this._getDeliveryLocation('en'); const shortAddr = (this.deliveryAddress || "").substring(0, 20) + ((this.deliveryAddress || "").length > 20 ? "..." : ""); return [name, locEN, shortAddr].filter(p => p?.trim()).join(", ") || "Delivery Details Incomplete"; } return "Self Pickup / Distribution as per split"; },
        get summaryDeliveryToAR() { if (this.distributionChoice === 'char') return "توزيع خيري بواسطة أرض الأغنام"; if (this._needsDeliveryDetails) { const name = (this.deliveryName || "").trim(); const locAR = this._getDeliveryLocation('ar'); const shortAddr = (this.deliveryAddress || "").substring(0, 20) + ((this.deliveryAddress || "").length > 20 ? "..." : ""); return [name, locAR, shortAddr].filter(p => p?.trim()).join("، ") || "تفاصيل التوصيل غير مكتملة"; } return "استلام ذاتي / توزيع حسب التقسيم"; },
        get summaryDistributionEN() { if (this.distributionChoice === 'me') return "All to me"; if (this.distributionChoice === 'char') return "All to charity (by Sheep Land)"; return `Split: ${(this.splitDetails || "").trim() || "(Not specified)"}`; },
        get summaryDistributionAR() { if (this.distributionChoice === 'me') return "الكل لي"; if (this.distributionChoice === 'char') return "تبرع بالكل للصدقة (أرض الأغنام توزع)"; return `تقسيم الحصص: ${(this.splitDetails || "").trim() || "(لم يحدد)"}`; },
        startOfferDHDMSCountdown() { if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval); if (!this.appSettings.promo_is_active || !this.appSettings.promo_end_date || typeof this.appSettings.promo_end_date !== 'string') { this.countdown.ended = true; return; } const targetTime = new Date(this.appSettings.promo_end_date).getTime(); if (isNaN(targetTime)) { this.countdown.ended = true; return; } this.updateDHDMSCountdownDisplay(targetTime); this.countdownTimerInterval = setInterval(() => this.updateDHDMSCountdownDisplay(targetTime), 1000); },
        updateDHDMSCountdownDisplay(targetTime) { const distance = targetTime - Date.now(); if (distance < 0) { if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval); Object.assign(this.countdown, { days: "00", hours: "00", minutes: "00", seconds: "00", ended: true }); return; } this.countdown.ended = false; this.countdown = {days:String(Math.floor(distance/864e5)).padStart(2,'0'), hours:String(Math.floor(distance%864e5/36e5)).padStart(2,'0'), minutes:String(Math.floor(distance%36e5/6e4)).padStart(2,'0'), seconds:String(Math.floor(distance%6e4/1e3)).padStart(2,'0')}; },
        updateCities() { const selectedGovData = (this.appSettings.delivery_areas || []).find(area => area.id === this.selectedGovernorate); this.availableCities = selectedGovData?.cities || []; this.deliveryCity = ""; },
        getFormattedPrice(priceEGP, currencyCode) { const finalCC = currencyCode || this.currentCurrency; const currencyInfo = this.appSettings?.exchange_rates?.[finalCC]; if (priceEGP == null || !currencyInfo || typeof currencyInfo.rate_from_egp !== 'number') return `${currencyInfo?.symbol || '?'} ---`; const convertedPrice = priceEGP * currencyInfo.rate_from_egp; return `${currencyInfo.symbol} ${convertedPrice.toFixed((currencyInfo.symbol === "LE" || currencyInfo.symbol === "ل.م") ? 0 : 2)}`; },
        isValidEmail: (email) => (!email?.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        isValidPhone: (phone) => phone?.trim() && /^\+?[0-9\s\-()]{7,20}$/.test(phone.trim()),
        scrollToSection(selector) { try { const element = document.querySelector(selector); if (element) { let offset = document.querySelector('.site-header')?.offsetHeight || 0; if (selector.startsWith('#udheya-booking-start') || selector.startsWith('#step') || selector.startsWith('#udheya-booking-form-panel')) { const stepperHeader = document.querySelector('.stepper-outer-wrapper'); if (stepperHeader && getComputedStyle(stepperHeader).position === 'sticky') offset += stepperHeader.offsetHeight; } window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - offset - 10, behavior: 'smooth' }); } } catch (error) {} },
        validateConceptualStep(conceptualStep, setErrors = true) { const stepMeta = this.stepSectionsMeta[conceptualStep - 1]; if (!stepMeta || !stepMeta.validator) return true; const isValid = stepMeta.validator(setErrors); this.stepProgress[`step${conceptualStep}`] = isValid; return isValid; },
        updateAllStepCompletionStates() { for (let i = 1; i <= this.stepSectionsMeta.length; i++) this.stepProgress[`step${i}`] = this.validateConceptualStep(i, false); },
        handleStepperNavigation(targetConceptualStep) { this.clearAllErrors(); let canProceed = true; for (let step = 1; step < targetConceptualStep; step++) { if (!this.validateConceptualStep(step, true)) { this.currentConceptualStep = step; const stepMeta = this.stepSectionsMeta[step-1]; this.focusOnRef(stepMeta?.firstFocusableErrorRef || stepMeta?.titleRef); this.scrollToSection(stepMeta?.id || '#udheya-booking-start'); canProceed = false; break; }} if (canProceed) { this.currentConceptualStep = targetConceptualStep; this.scrollToSection(this.stepSectionsMeta[targetConceptualStep-1]?.id || '#udheya-booking-start'); this.focusOnRef(this.stepSectionsMeta[targetConceptualStep-1]?.titleRef); }},
        validateStep1(setErrors = true) { if (setErrors) this.clearError('animal'); const stepMeta = this.stepSectionsMeta[0]; stepMeta.firstFocusableErrorRef = null; if (!this.selectedAnimal.type || !this.selectedAnimal.weight) { if (setErrors) { this.setError('animal', { en: "Please select an animal and weight.", ar: "يرجى اختيار الحيوان ووزنه." }); stepMeta.firstFocusableErrorRef = !this.selectedAnimal.type ? (this.$refs.baladiWeightSelect ? 'baladiWeightSelect' : 'barkiWeightSelect') : (this.selectedAnimal.type === 'baladi' ? 'baladiWeightSelect' : 'barkiWeightSelect'); } return false; } const animalTypeConfig = this.productOptions.livestock.find(lt => lt.value_key === this.selectedAnimal.type); const weightPriceInfo = animalTypeConfig?.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight); if (!weightPriceInfo || !weightPriceInfo.is_active || (weightPriceInfo.stock != null && weightPriceInfo.stock <= 0)) { if (setErrors) { this.setError('animal', { en: `${this.selectedAnimal.nameEN || "Selected animal"} (${this.selectedAnimal.weight}) is out of stock. Please re-select.`, ar: `${this.selectedAnimal.nameAR || "الحيوان المختار"} (${this.selectedAnimal.weight}) نفذت كميته. يرجى إعادة الاختيار.` }); stepMeta.firstFocusableErrorRef = this.selectedAnimal.type === 'baladi' ? 'baladiWeightSelect' : 'barkiWeightSelect'; this.selectedAnimal = { ...initialBookingState.selectedAnimal }; this.calculateTotalPrice(); this.updateAllDisplayedPrices(); document.querySelectorAll('.livestock-card').forEach(card => card.classList.remove('livestock-card-selected')); } return false; } return true; },
        validateStep2(setErrors = true) { if (setErrors) { this.clearError('prepStyle'); this.clearError('packaging'); } let isValid = true; const stepMeta = this.stepSectionsMeta[1]; stepMeta.firstFocusableErrorRef = null; if (!this.selectedPrepStyle.value) { if (setErrors) { this.setError('prepStyle', 'select'); if (!stepMeta.firstFocusableErrorRef) stepMeta.firstFocusableErrorRef = 'prepStyleSelect'; } isValid = false; } if (!this.selectedPackaging.value) { if (setErrors) { this.setError('packaging', 'select'); if (!stepMeta.firstFocusableErrorRef) stepMeta.firstFocusableErrorRef = 'packagingSelect'; } isValid = false; } return isValid; },
        validateStep3(setErrors = true) { if (setErrors) this.clearError('sacrificeDay'); const stepMeta = this.stepSectionsMeta[2]; stepMeta.firstFocusableErrorRef = null; if (!this.selectedSacrificeDay.value) { if (setErrors) { this.setError('sacrificeDay', 'select'); stepMeta.firstFocusableErrorRef = 'sacrificeDaySelect'; } return false; } return true; },
        validateStep4(setErrors = true) { if (setErrors) { ['splitDetails', 'deliveryName', 'deliveryPhone', 'customerEmail', 'selectedGovernorate', 'deliveryCity', 'deliveryAddress', 'timeSlot', 'paymentMethod'].forEach(f => this.clearError(f)); } let isValid = true; const stepMeta = this.stepSectionsMeta[3]; stepMeta.firstFocusableErrorRef = null; const setFieldError = (field, msgKey, ref) => { if (setErrors) this.setError(field, msgKey); isValid = false; if (setErrors && !stepMeta.firstFocusableErrorRef) stepMeta.firstFocusableErrorRef = ref; }; if (this.distributionChoice === 'split') { if (!this.splitDetailsOption) setFieldError('splitDetails', 'select', 'distributionChoiceRadios'); else if (this.splitDetailsOption === 'custom' && !(this.customSplitDetailsText || "").trim()) setFieldError('splitDetails', 'required', 'customSplitTextarea'); } if (this._needsDeliveryDetails) { if (!(this.deliveryName || "").trim()) setFieldError('deliveryName', 'required', 'deliveryNameInput'); if (!(this.deliveryPhone || "").trim()) setFieldError('deliveryPhone', 'required', 'deliveryPhoneInput'); else if (!this.isValidPhone((this.deliveryPhone || "").trim())) setFieldError('deliveryPhone', 'phone', 'deliveryPhoneInput'); if ((this.customerEmail || "").trim() && !this.isValidEmail((this.customerEmail || "").trim())) setFieldError('customerEmail', 'email', 'customerEmailInput'); if (!this.selectedGovernorate) setFieldError('selectedGovernorate', 'select', 'deliveryGovernorateSelect'); const selectedGovConfig = (this.appSettings.delivery_areas || []).find(area => area.id === this.selectedGovernorate); if (selectedGovConfig?.cities?.length > 0 && !this.deliveryCity) setFieldError('deliveryCity', 'select', 'deliveryCitySelect'); if (!(this.deliveryAddress || "").trim()) setFieldError('deliveryAddress', 'required', 'deliveryAddressInput'); if (!this.selectedTimeSlot) setFieldError('timeSlot', 'timeSlot', 'timeSlotContainer');} if (!this.paymentMethod) setFieldError('paymentMethod', 'select', 'paymentMethodRadios'); return isValid; },
        selectAnimal(animalTypeValueKey, weightSelectElement) { this.clearError('animal'); const animalConfig = this.productOptions.livestock.find(lt => lt.value_key === animalTypeValueKey); if (!animalConfig) { this.setError('animal', { en: "Invalid animal type.", ar: "نوع حيوان غير صالح." }); this.updateAllStepCompletionStates(); return; } const selectedWeightValue = weightSelectElement.value; if (!selectedWeightValue) { if (this.selectedAnimal.type === animalTypeValueKey) { this.selectedAnimal = { ...initialBookingState.selectedAnimal }; this.calculateTotalPrice(); document.getElementById(animalTypeValueKey)?.classList.remove('livestock-card-selected'); } this.updateAllStepCompletionStates(); return; } const weightPriceConfig = animalConfig.weights_prices.find(wp => wp.weight_range === selectedWeightValue); if (!weightPriceConfig || !weightPriceConfig.is_active || (weightPriceConfig.stock != null && weightPriceConfig.stock <= 0)) { this.setError('animal', { en: `${animalConfig.name_en || "Selected animal"} (${selectedWeightValue}) is out of stock.`, ar: `${animalConfig.name_ar || "الحيوان المختار"} (${selectedWeightValue}) نفذت كميته.` }); if (this.selectedAnimal.type === animalTypeValueKey && this.selectedAnimal.weight === selectedWeightValue) { this.selectedAnimal = { ...initialBookingState.selectedAnimal }; document.getElementById(animalTypeValueKey)?.classList.remove('livestock-card-selected');} this.calculateTotalPrice(); if (this.$refs[weightSelectElement.id]) this.focusOnRef(weightSelectElement.id); this.updateAllStepCompletionStates(); return; } const otherAnimalTypeKey = animalTypeValueKey === 'baladi' ? 'barki' : 'baladi'; if (this.selectedAnimal.type && this.selectedAnimal.type !== animalTypeValueKey) { const otherWeightSelect = this.$refs[`${otherAnimalTypeKey}WeightSelect`]; if (otherWeightSelect) otherWeightSelect.value = ""; document.getElementById(otherAnimalTypeKey)?.classList.remove('livestock-card-selected'); } this.selectedAnimal = { type: animalConfig.value_key, value: animalConfig.value_key, weight: weightPriceConfig.weight_range, basePriceEGP: parseFloat(weightPriceConfig.price_egp), stock: weightPriceConfig.stock, originalStock: weightPriceConfig.stock, nameEN: animalConfig.name_en, nameAR: animalConfig.name_ar, pbId: animalConfig.pbId }; this.calculateTotalPrice(); document.querySelectorAll('.livestock-card').forEach(card => card.classList.remove('livestock-card-selected')); weightSelectElement.closest('.livestock-card').classList.add('livestock-card-selected'); this.updateAllStepCompletionStates(); if (this.stepProgress.step1) this.handleStepperNavigation(2); },
        updateSelectedPrepStyle(value) { const selectedOption = this.productOptions.preparationStyles.find(style => style.value === value); this.selectedPrepStyle = selectedOption ? { ...selectedOption } : { value: "", nameEN: "", nameAR: "", is_custom: false }; if (!this.selectedPrepStyle.is_custom) this.customPrepDetails = ""; this.calculateTotalPrice(); this.updateAllStepCompletionStates(); },
        updateSelectedPackaging(value) { const selectedOption = this.productOptions.packagingOptions.find(pkg => pkg.value === value); this.selectedPackaging = selectedOption ? { ...selectedOption, addonPriceEGP: parseFloat(selectedOption.addonPriceEGP || 0) } : { value: "", addonPriceEGP: 0, nameEN: "", nameAR: "" }; this.calculateTotalPrice(); this.updateAllStepCompletionStates(); },
        updateSacrificeDayTexts() { const optionElement = document.querySelector(`#sacrifice_day_select_s3 option[value="${this.selectedSacrificeDay.value}"]`); if (optionElement) Object.assign(this.selectedSacrificeDay, { textEN: optionElement.dataset.en, textAR: optionElement.dataset.ar }); },
        calculateTotalPrice() { this.totalPriceEGP = (this.selectedAnimal.basePriceEGP || 0) + (this.selectedPackaging.addonPriceEGP || 0); },
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
                        const optionEl = document.createElement('option'); optionEl.value = wp.weight_range;
                        const isOutOfStock = !wp.is_active || (wp.stock != null && wp.stock <= 0);
                        const stockText = isOutOfStock ? (this.currentLang === 'ar' ? " - نفذت الكمية" : " - Out of Stock") : (wp.stock != null ? ` - ${(this.currentLang === 'ar' ? "الكمية: " : "Stock: ")}${wp.stock}` : "");
                        optionEl.textContent = `${wp.weight_range || ""} (${this.getFormattedPrice(wp.price_egp)})${stockText}`;
                        optionEl.disabled = isOutOfStock; weightSelectElement.appendChild(optionEl);
                        if (wp.weight_range === currentSelectedWeightInDropdown && !isOutOfStock) currentSelectionStillValid = true;
                    });
                    if (currentSelectedWeightInDropdown && currentSelectionStillValid) weightSelectElement.value = currentSelectedWeightInDropdown;
                    else if (this.selectedAnimal.type === livestockType.value_key && this.selectedAnimal.weight && livestockType.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight && wp.is_active && (wp.stock == null || wp.stock > 0))) weightSelectElement.value = this.selectedAnimal.weight;
                    else weightSelectElement.value = "";
                    const firstActiveWeightPrice = (livestockType.weights_prices || []).find(wp => wp.is_active && (wp.stock == null || wp.stock > 0));
                    const fromPriceEgp = firstActiveWeightPrice ? firstActiveWeightPrice.price_egp : ((livestockType.weights_prices || [])[0]?.price_egp || 0);
                    const priceSpanEN = cardElement.querySelector('.price.bil-row .en span'); const priceSpanAR = cardElement.querySelector('.price.bil-row .ar span');
                    if (priceSpanEN) priceSpanEN.textContent = this.getFormattedPrice(fromPriceEgp); if (priceSpanAR) priceSpanAR.textContent = this.getFormattedPrice(fromPriceEgp);
                });
                this.calculateTotalPrice();
            } catch (error) { this.userFriendlyApiError = "Error updating price displays."; }
        },
        async validateAndSubmitBooking() { this.clearAllErrors(); let isFormValid = true; for (let step = 1; step <= this.stepSectionsMeta.length; step++) { if (!this.validateConceptualStep(step, true)) { isFormValid = false; const stepMeta = this.stepSectionsMeta[step - 1]; if (stepMeta) { this.focusOnRef(stepMeta.firstFocusableErrorRef || stepMeta.titleRef); this.scrollToSection(stepMeta.id || '#udheya-booking-start'); } break; }} if (!isFormValid) return; const selectedAnimalConfig = this.productOptions.livestock.find(lt => lt.value_key === this.selectedAnimal.value); const selectedWeightPriceInfo = selectedAnimalConfig?.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight); if (!selectedAnimalConfig || !selectedWeightPriceInfo || !selectedWeightPriceInfo.is_active || (selectedWeightPriceInfo.stock != null && selectedWeightPriceInfo.stock <= 0)) { this.setError('animal', { en: `Sorry, ${this.selectedAnimal.nameEN || "selected item"} (${this.selectedAnimal.weight}) is unavailable. Please reselect.`, ar: `عذراً، ${this.selectedAnimal.nameAR || "المنتج المختار"} (${this.selectedAnimal.weight}) غير متوفر. يرجى إعادة الاختيار.` }); this.selectedAnimal = { ...initialBookingState.selectedAnimal }; this.updateAllDisplayedPrices(); this.updateAllStepCompletionStates(); this.scrollToSection('#step1-content'); this.focusOnRef(this.stepSectionsMeta[0].titleRef); return; } this.isLoading.booking = true; this.apiError = null; this.userFriendlyApiError = ""; this.calculateTotalPrice(); const bookingPayload = { booking_id_text: `SL-UDHY-${(new Date()).getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0')}`, animal_type_key: this.selectedAnimal.value, animal_type_name_en: this.selectedAnimal.nameEN, animal_type_name_ar: this.selectedAnimal.nameAR, animal_weight_selected: this.selectedAnimal.weight, animal_base_price_egp: this.selectedAnimal.basePriceEGP, preparation_style_value: this.selectedPrepStyle.value, preparation_style_name_en: this.selectedPrepStyle.nameEN, preparation_style_name_ar: this.selectedPrepStyle.nameAR, is_custom_prep: this.selectedPrepStyle.is_custom, custom_prep_details: this.selectedPrepStyle.is_custom ? (this.customPrepDetails || "").trim() : "", packaging_value: this.selectedPackaging.value, packaging_name_en: this.selectedPackaging.nameEN, packaging_name_ar: this.selectedPackaging.nameAR, packaging_addon_price_egp: this.selectedPackaging.addonPriceEGP, total_price_egp: this.totalPriceEGP, sacrifice_day_value: this.selectedSacrificeDay.value, time_slot: this.distributionChoice === 'char' ? 'N/A' : this.selectedTimeSlot, distribution_choice: this.distributionChoice, split_details_option: this.distributionChoice === 'split' ? this.splitDetailsOption : "", custom_split_details_text: (this.distributionChoice === 'split' && this.splitDetailsOption === 'custom') ? (this.customSplitDetailsText || "").trim() : "", niyyah_names: (this.niyyahNames || "").trim(), customer_email: (this.customerEmail || "").trim(), group_purchase_interest: this.groupPurchase, delivery_name: this._needsDeliveryDetails ? (this.deliveryName || "").trim() : "", delivery_phone: this._needsDeliveryDetails ? (this.deliveryPhone || "").trim() : "", delivery_governorate_id: this._needsDeliveryDetails ? this.selectedGovernorate : "", delivery_city_id: this._needsDeliveryDetails ? this.deliveryCity : "", delivery_address: this._needsDeliveryDetails ? (this.deliveryAddress || "").trim() : "", delivery_instructions: this._needsDeliveryDetails ? (this.deliveryInstructions || "").trim() : "", payment_method: this.paymentMethod, payment_status: (this.paymentMethod === 'cod' && this._needsDeliveryDetails) || ['visa','mastercard'].includes(this.paymentMethod) ? 'pending_confirmation' : 'pending_payment', booking_status: 'confirmed_pending_payment', }; try { const createdRecord = await pbFetch("bookings", { method: "POST", body: bookingPayload }); this.bookingID = createdRecord.booking_id_text || createdRecord.id; if (selectedWeightPriceInfo && selectedWeightPriceInfo.stock != null && selectedWeightPriceInfo.stock > 0) selectedWeightPriceInfo.stock--; this.bookingConfirmed = true; this.$nextTick(() => { this.scrollToSection('#booking-confirmation-section'); this.focusOnRef('bookingConfirmedTitle'); }); } catch (error) { this.apiError = String(error.message); this.userFriendlyApiError = "Issue submitting booking. Review details, try again, or contact support."; this.scrollToSection('.global-error-indicator'); } finally { this.isLoading.booking = false; } },
        async validateAndCheckBookingStatus() { this.clearError('lookupBookingID'); if ((this.lookupBookingID || "").trim()) await this.checkBookingStatus(); else { this.setError('lookupBookingID', 'required'); this.focusOnRef('lookupBookingIdInput'); } },
        async checkBookingStatus() { this.statusResult = null; this.statusNotFound = false; this.isLoading.status = true; this.apiError = null; this.userFriendlyApiError = ""; const trimmedLookupID = (this.lookupBookingID || "").trim(); try { const response = await pbFetch("bookings", { queryParams: `filter=(booking_id_text='${encodeURIComponent(trimmedLookupID)}')&perPage=1` }); if (response.items?.length > 0) { const booking = response.items[0]; this.statusResult = { booking_id_text: booking.booking_id_text || booking.id, status: booking.booking_status || "Unknown", animal_type: booking.animal_type_name_en || booking.animal_type_key, animal_weight_selected: booking.animal_weight_selected, sacrifice_day: booking.sacrifice_day_value, time_slot: booking.time_slot }; } else this.statusNotFound = true; } catch (error) { this.apiError = String(error.message); this.userFriendlyApiError = "Could not retrieve booking status. Check ID or try again."; this.statusNotFound = true; } finally { this.isLoading.status = false; } },
        getSacrificeDayText(dayValue) { const optionElement = document.querySelector(`#sacrifice_day_select_s3 option[value="${dayValue}"]`); return optionElement ? { en: optionElement.dataset.en, ar: optionElement.dataset.ar } : { en: dayValue, ar: dayValue }; },
        resetAndStartOver() { Object.assign(this, JSON.parse(JSON.stringify(initialBookingState)), { bookingConfirmed: false, bookingID: "", lookupBookingID: "", statusResult: null, statusNotFound: false, currentConceptualStep: 1, stepProgress: { step1: false, step2: false, step3: false, step4: false }, apiError: null, userFriendlyApiError: ""}); if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval); this.initApp(); this.$nextTick(() => { this.scrollToSection('#udheya-booking-start'); this.focusOnRef('bookingSectionTitle'); }); }
    }));

    /*
    // DEVELOPMENT ONLY: Database Seeder Logic
    // The following IIFE is for development purposes to seed the database.
    // It should be disabled or removed in production environments to prevent accidental data manipulation
    // and to avoid exposing API endpoints. It runs if the URL query parameter "run_db_seed=true" is present.
    (function() {
        const SEED_PARAM_NAME = "run_db_seed";
        if (new URLSearchParams(window.location.search).get(SEED_PARAM_NAME) !== "true") return;

        async function pbSeedFetch(collectionName, { recordId = "", queryParams = "", method = "GET", body = null } = {}) {
            const apiUrl = `/api/collections/${collectionName}/records${recordId ? `/${recordId}` : ""}${queryParams ? `?${queryParams}` : ""}`;
            const options = { method, headers: {} };
            if (body) { options.headers["Content-Type"] = "application/json"; options.body = JSON.stringify(body); }
            const response = await fetch(apiUrl, options);
            if (!response.ok && response.status !== 204) {
                const errorText = await response.text();
                throw new Error(`Seeder API Error (${method} ${collectionName}): ${response.status} ${errorText}`);
            }
            if (response.status === 204) return {};
            return response.json();
        }

        const seedDataConfig = [
            {
                collection: "app_settings", keyField: "setting_key",
                data: [{
                    setting_key: "global_config",
                    exchange_rates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true }, USD: { rate_from_egp: 0.020, symbol: "$", is_active: true }, GBP: { rate_from_egp: 0.016, symbol: "£", is_active: true }},
                    default_currency: "EGP", whatsapp_number_raw: "201012345678", whatsapp_number_display: "+20 101 234 5678",
                    promo_end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), promo_discount_percent: 12, promo_is_active: true,
                    delivery_areas: [
                        {id:"cairo",name_en:"Cairo",name_ar:"القاهرة",cities:[{id:"nasr_city",name_en:"Nasr City",name_ar:"مدينة نصر"},{id:"maadi",name_en:"Maadi",name_ar:"المعادي"},{id:"heliopolis",name_en:"Heliopolis",name_ar:"مصر الجديدة"}]},
                        {id:"giza",name_en:"Giza",name_ar:"الجيزة",cities:[{id:"dokki",name_en:"Dokki",name_ar:"الدقي"},{id:"mohandessin",name_en:"Mohandessin",name_ar:"المهندسين"}]},
                        {id:"alexandria",name_en:"Alexandria",name_ar:"الإسكندرية",cities:[{id:"smouha",name_en:"Smouha",name_ar:"سموحة"}]},
                        {id:"other_gov",name_en:"Other Governorate",name_ar:"محافظة أخرى",cities:[]}
                    ],
                    payment_details: { vodafone_cash: "01076543210", instapay_ipn: "seed_user@instapay", revolut_details: "@seedUserRevolut", monzo_details: "monzo.me/seeduser", bank_name: "Seed Bank Egypt", bank_account_name: "Sheep Land Seed Account", bank_account_number: "1234567890123456", bank_iban: "EG00123400000000001234567890", bank_swift: "SEEDBANKEGCA" }
                }]
            },
            {
                collection: "livestock_types", keyField: "value_key",
                data: [
                    { value_key: "baladi", name_en: "Baladi Sheep", name_ar: "خروف بلدي", weights_prices: [{ weight_range: "35-45 kg", price_egp: 4800, stock: 20, is_active: true }, { weight_range: "45-55 kg", price_egp: 5500, stock: 12, is_active: true }, { weight_range: "55+ kg", price_egp: 6200, stock: 5, is_active: false }] },
                    { value_key: "barki", name_en: "Barki Sheep", name_ar: "خروف برقي", weights_prices: [{ weight_range: "40-50 kg", price_egp: 5300, stock: 18, is_active: true }, { weight_range: "50-60 kg", price_egp: 6100, stock: 0, is_active: true }, { weight_range: "25-35 kg", price_egp: 4000, stock: 10, is_active: true }] }
                ]
            }
        ];

        (async function seedDatabase() {
            console.log("SEEDER_INFO: Starting database seed process...");
            for (const config of seedDataConfig) {
                for (const recordData of config.data) {
                    try {
                        const existingRecords = await pbSeedFetch(config.collection, { queryParams: `filter=(${config.keyField}='${recordData[config.keyField]}')&perPage=1` });
                        if (existingRecords.items && existingRecords.items.length > 0) {
                            await pbSeedFetch(config.collection, { recordId: existingRecords.items[0].id, method: "PATCH", body: recordData });
                            console.log(`SEEDER_SUCCESS: Record updated in '${config.collection}'. Key: ${recordData[config.keyField]}`);
                        } else {
                            const created = await pbSeedFetch(config.collection, { method: "POST", body: recordData });
                            console.log(`SEEDER_SUCCESS: Record created in '${config.collection}'. Key: ${recordData[config.keyField]}`);
                        }
                    } catch (error) { console.error(`SEEDER_EXCEPTION: Error for record in '${config.collection}' (Key: ${recordData[config.keyField]}):`, error.message); }
                }
            }
            console.log("SEEDER_INFO: Database seed process finished.");
            if (window.history.replaceState) {
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
            }
        })();
    })();
    */
});
