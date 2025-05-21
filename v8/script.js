document.addEventListener('alpine:init', () => {
    const initialBookingFormState = {
        selectedAnimal: { type: '', value: '', weight: '', basePriceEGP: 0, nameEN: '', nameAR: '', stock: null, pbId: null, originalStock: null },
        selectedPrepStyle: { value: '', nameEN: '', nameAR: '', is_custom: false }, customPrepDetails: '',
        selectedPackaging: { value: '', addonPriceEGP: 0, nameEN: '', nameAR: '' }, totalPriceEGP: 0,
        customerEmail: '', deliveryName: '', deliveryPhone: '', selectedGovernorate: '', deliveryCity: '', availableCities: [], deliveryAddress: '', deliveryInstructions: '',
        niyyahNames: '', splitDetailsOption: '', customSplitDetailsText: '', groupPurchase: false,
        selectedSacrificeDay: { value: 'day1_10_dhul_hijjah', textEN: 'Day 1 of Eid (10th Dhul Hijjah)', textAR: 'اليوم الأول (10 ذو الحجة)' },
        selectedTimeSlot: '8 AM-9 AM', distributionChoice: 'me', paymentMethod: 'fa',
        errors: {}
    };

    async function pbFetch(collection, options = {}) {
        const { recordId = '', params = '' } = options;
        const url = `/api/collections/${collection}/records${recordId ? `/${recordId}` : ''}${params ? `?${params}` : ''}`;
        try {
            const response = await fetch(url, options.fetchOptions);
            if (!response.ok) {
                let errorDataMessage = response.statusText;
                let responseBodyForError = '';
                try {
                    responseBodyForError = await response.text();
                    const errorData = JSON.parse(responseBodyForError);
                    if (errorData && typeof errorData.data === 'object' && errorData.data !== null) {
                        errorDataMessage = Object.values(errorData.data).map(e_item => e_item.message || JSON.stringify(e_item)).join('; ');
                    } else if (errorData && errorData.message) {
                        errorDataMessage = errorData.message;
                    }
                } catch (e_parse) {
                    errorDataMessage = responseBodyForError || response.statusText;
                }
                throw new Error(`API Error (${collection} ${recordId || params}): ${response.status} ${errorDataMessage}`);
            }
            const responseBody = await response.text();
            if (!responseBody) {
                return { items: [] }; // Return empty items if response body is empty
            }
            try {
                return JSON.parse(responseBody);
            } catch (e_parse_ok) {
                console.error(`PBFETCH: Could not parse successful response as JSON for ${url}. Body: ${responseBody}`, e_parse_ok);
                throw new Error(`API Error (${collection} ${recordId || params}): Failed to parse successful response. ${e_parse_ok.message}`);
            }
        } catch (networkError) {
            const errorMessage = typeof networkError.message === 'string' ? networkError.message : 'Unknown network error';
            console.error(`PBFETCH: Network error for ${url}`, networkError);
            throw new Error(`Network Error: Could not connect to API. (${errorMessage})`);
        }
    }

    Alpine.data('udheyaBooking', () => ({
        isLoading: { status: false, booking: false, init: true },
        appSettings: {
            exchange_rates: { EGP: { rate_from_egp: 1, symbol: 'LE', is_active: true }, USD: { rate_from_egp: 0, symbol: '$', is_active: false }, GBP: { rate_from_egp: 0, symbol: '£', is_active: false }},
            default_currency: "EGP",
            whatsapp_number_raw: "", whatsapp_number_display: "",
            promo_end_date: null, promo_discount_percent: 0, promo_is_active: true,
            delivery_areas: [],
            payment_details: { vodafone_cash: "", instapay_ipn: "", revolut_details: "", bank_name: "", bank_account_name: "", bank_account_number: "", bank_iban: "", bank_swift: "" }
        },
        productOptions: {
            livestock: [],
            preparationStyles: [
                { value: 'Standard Mixed Cuts', nameEN: 'Standard Mix', nameAR: 'مزيج قياسي', is_custom: false },
                { value: 'Charity Portions', nameEN: 'Charity Portions', nameAR: 'حصص صدقة', is_custom: false },
                { value: 'Feast Preparation', nameEN: 'Feast Preparation', nameAR: 'تجهيز ولائم', is_custom: false },
                { value: 'Custom & Ground Mix', nameEN: 'Custom & Ground', nameAR: 'مخصص ومفروم', is_custom: true }
            ],
            packagingOptions: [
                { value: 'standard', nameEN: 'Standard Packaging', nameAR: 'تعبئة قياسية', addonPriceEGP: 0 },
                { value: 'vacuum_sealed', nameEN: 'Vacuum Sealed', nameAR: 'تعبئة مفرغة', addonPriceEGP: 100 }
            ]
        },
        apiError: null, userFriendlyApiError: '',
        ...JSON.parse(JSON.stringify(initialBookingFormState)),
        bookingConfirmed: false, statusResult: null, statusNotFound: false, lookupBookingID: '', currentCurrency: 'EGP',
        bookingID: '', currentActiveStep: 1, isMobileMenuOpen: false,
        stepSectionsMeta: [],
        countdown: { days: '00', hours: '00', minutes: '00', seconds: '00', ended: false },
        promoHasEnded: false, calculatedPromoDaysLeft: 0, countdownTimerInterval: null,
        currentLang: 'en', // Default language
        errors: {},
        errorMessages: {
            required: { en: "This field is required.", ar: "هذا الحقل مطلوب." },
            select: { en: "Please make a selection.", ar: "يرجى الاختيار." },
            email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." },
            phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." }
        },

        setError(field, typeOrMessage) {
            let messageObject;
            if (typeof typeOrMessage === 'string') {
                messageObject = this.errorMessages[typeOrMessage] || { en: typeOrMessage, ar: typeOrMessage }; // Fallback if custom string
            } else { // Is an object {en: ..., ar: ...}
                messageObject = typeOrMessage;
            }
            if (typeof messageObject === 'object' && messageObject !== null && typeof messageObject.en === 'string' && typeof messageObject.ar === 'string') {
                this.errors[field] = messageObject;
            } else {
                 this.errors[field] = this.errorMessages.required; // Default fallback
            }
        },
        clearError(field) { if (this.errors[field]) this.$delete(this.errors, field); },
        clearAllErrors() { this.errors = {}; },
        focusOnRef(refName) { this.$nextTick(() => { if (this.$refs[refName]) { this.$refs[refName].focus({preventScroll:false}); setTimeout(() => { try { this.$refs[refName].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch(e) {/*ignore scroll err*/} }, 50); } }); },

        get _needsDeliveryDetails() {
            const customText = (this.customSplitDetailsText || '').toLowerCase();
            return this.distributionChoice === 'me' || (this.distributionChoice === 'split' && (
                   ['1/3_me_2/3_charity_sl', '1/2_me_1/2_charity_sl', '2/3_me_1/3_charity_sl', 'all_me_custom_distro'].includes(this.splitDetailsOption) ||
                   (this.splitDetailsOption === 'custom' && (customText.includes('for me') || customText.includes('all delivered to me'))) ));
        },
        get splitDetails() {
            if (this.distributionChoice !== 'split') return '';
            if (this.splitDetailsOption === 'custom') return (this.customSplitDetailsText || "").trim();
            const optionsMap = {
                '1/3_me_2/3_charity_sl': { en: '1/3 for me (delivered), 2/3 for charity (by Sheep Land)', ar: 'ثلث لي (يوصل)، ثلثان للصدقة (بواسطة أرض الأغنام)'},
                '1/2_me_1/2_charity_sl': { en: '1/2 for me (delivered), 1/2 for charity (by Sheep Land)', ar: 'نصف لي (يوصل)، نصف للصدقة (بواسطة أرض الأغنام)'},
                '2/3_me_1/3_charity_sl': { en: '2/3 for me (delivered), 1/3 for charity (by Sheep Land)', ar: 'ثلثان لي (يوصل)، ثلث للصدقة (بواسطة أرض الأغنام)'},
                'all_me_custom_distro': { en: 'All for me (I distribute)', ar: 'الكل لي (أنا أوزع)'}
            };
            return optionsMap[this.splitDetailsOption] ? (this.currentLang === 'ar' ? optionsMap[this.splitDetailsOption].ar : optionsMap[this.splitDetailsOption].en) : this.splitDetailsOption;
        },
        _getDeliveryLocation(lang) {
            const key = lang === 'en' ? 'name_en' : 'name_ar';
            const govObj = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
            const cityObj = govObj?.cities?.find(c => c.id === this.deliveryCity);
            if (cityObj && typeof cityObj[key] === 'string') return cityObj[key];
            if (govObj && govObj.cities?.length === 0 && this.selectedGovernorate && typeof govObj[key] === 'string') return govObj[key]; // Governorate without cities listed
            if (govObj && !cityObj && this.selectedGovernorate && typeof govObj[key] === 'string') return `${govObj[key]} (${lang === 'en' ? 'City not selected' : 'المدينة غير مختارة'})`;
            return '';
        },
        get summaryDeliveryToEN() {
            if (this.distributionChoice === 'char') return 'Charity Distribution by Sheep Land';
            if (this._needsDeliveryDetails) {
                const name = (this.deliveryName || "").trim(); const phone = (this.deliveryPhone || "").trim();
                const gov = this.selectedGovernorate; const city = this.deliveryCity;
                const address = (this.deliveryAddress || "").trim();
                const govObj = (this.appSettings.delivery_areas || []).find(g => g.id === gov);
                const cityRequiredAndMissing = govObj && Array.isArray(govObj.cities) && govObj.cities.length > 0 && !city;

                if (!name || !phone || !gov || cityRequiredAndMissing || !address) return 'Delivery Details Incomplete';
                const location = this._getDeliveryLocation('en');
                const addressSummary = address ? (address.substring(0,20) + (address.length > 20 ? '...' : '')) : '';
                return [name, location, addressSummary].filter(val => typeof val === 'string' && val.trim() !== '').join(', ');
            }
            return 'Self Pickup / Distribution as per split';
        },
        get summaryDeliveryToAR() {
            if (this.distributionChoice === 'char') return 'توزيع خيري بواسطة أرض الأغنام';
            if (this._needsDeliveryDetails) {
                const name = (this.deliveryName || "").trim(); const phone = (this.deliveryPhone || "").trim();
                const gov = this.selectedGovernorate; const city = this.deliveryCity;
                const address = (this.deliveryAddress || "").trim();
                const govObj = (this.appSettings.delivery_areas || []).find(g => g.id === gov);
                const cityRequiredAndMissing = govObj && Array.isArray(govObj.cities) && govObj.cities.length > 0 && !city;

                if (!name || !phone || !gov || cityRequiredAndMissing || !address) return 'تفاصيل التوصيل غير مكتملة';
                const location = this._getDeliveryLocation('ar');
                const addressSummary = address ? (address.substring(0,20) + (address.length > 20 ? '...' : '')) : '';
                return [name, location, addressSummary].filter(val => typeof val === 'string' && val.trim() !== '').join('، ');
            }
            return 'استلام ذاتي / توزيع حسب التقسيم';
        },
        get summaryDistributionEN() { return (this.distributionChoice === 'me') ? 'All to me' : (this.distributionChoice === 'char' ? 'All to charity (by Sheep Land)' : `Split: ${(this.splitDetails || "").trim() || '(Not specified)'}`); },
        get summaryDistributionAR() { return (this.distributionChoice === 'me') ? 'الكل لي' : (this.distributionChoice === 'char' ? 'تبرع بالكل للصدقة (أرض الأغنام توزع)' : `تقسيم الحصص: ${(this.splitDetails || "").trim() || '(لم يحدد)'}`); },

        async initApp() {
            this.isLoading.init = true; this.apiError = null; this.userFriendlyApiError = '';
            const initialDefaultAppSettings = JSON.parse(JSON.stringify(this.appSettings)); // Deep copy
            try {
                const settingsParams = `filter=(setting_key='global_config')&perPage=1`;
                const [settingsCollectionData, livestockData] = await Promise.all([
                    pbFetch('app_settings', { params: settingsParams }),
                    pbFetch('livestock_types')
                ]);

                if (settingsCollectionData && settingsCollectionData.items && settingsCollectionData.items.length > 0) {
                    const fetchedSettings = settingsCollectionData.items[0];
                    // Deep merge fetched settings into a copy of initial defaults
                    const newAppSettings = JSON.parse(JSON.stringify(initialDefaultAppSettings));
                    for (const key in fetchedSettings) {
                        if (fetchedSettings.hasOwnProperty(key) && key !== 'site_name') { // Retain site_name exclusion
                            if (typeof fetchedSettings[key] === 'object' && fetchedSettings[key] !== null &&
                                newAppSettings[key] !== undefined && typeof newAppSettings[key] === 'object' && newAppSettings[key] !== null &&
                                !Array.isArray(fetchedSettings[key])) { // Deep merge objects
                                newAppSettings[key] = { ...newAppSettings[key], ...fetchedSettings[key] };
                            } else { // Overwrite primitives, arrays, or if target key doesn't exist/is not object
                                newAppSettings[key] = fetchedSettings[key];
                            }
                        }
                    }
                    this.appSettings = newAppSettings;
                } else {
                    this.appSettings = initialDefaultAppSettings; // Use default if no settings fetched
                }

                if (livestockData && livestockData.items) {
                    this.productOptions.livestock = livestockData.items.map(item => ({
                        pbId: item.id, value_key: item.value_key, name_en: item.name_en, name_ar: item.name_ar,
                        weights_prices: Array.isArray(item.weights_prices) ? item.weights_prices.map(wp => ({...wp})) : [] // Ensure deep copy of weights_prices
                    }));
                } else {
                    this.productOptions.livestock = [];
                }

            } catch (error) {
                console.error("Error fetching initial app data:", error);
                this.apiError = error.message || "An unknown error occurred during data fetch.";
                this.userFriendlyApiError = (typeof error.message === 'string' && error.message.includes('Network Error')) ? error.message : 'Failed to load application settings. Please refresh or try again later.';
                this.appSettings = JSON.parse(JSON.stringify(initialDefaultAppSettings)); // Fallback to defaults
                this.productOptions.livestock = [];
            } finally {
                this.isLoading.init = false;
            }

            if (typeof this.appSettings.default_currency !== 'string' || !this.appSettings.exchange_rates[this.appSettings.default_currency]) {
                this.appSettings.default_currency = "EGP"; // Fallback
            }
            this.currentCurrency = this.appSettings.default_currency;

            this.startOfferDHDMSCountdown();
            this.updateSacrificeDayTexts(); // Initial call
            this.updateAllDisplayedPrices(); // Initial call to populate dropdowns
            this.clearAllErrors(); // Clear any errors from potential previous states

            // Watchers
            this.$watch(['selectedAnimal.basePriceEGP', 'selectedPackaging.addonPriceEGP'], () => this.calculateTotalPrice());
            this.$watch('currentCurrency', () => { this.calculateTotalPrice(); this.updateAllDisplayedPrices(); });
            this.$watch('selectedSacrificeDay.value', () => this.updateSacrificeDayTexts());
            this.$watch('distributionChoice', val => {
                if (val !== 'split') { this.splitDetailsOption = ''; this.customSplitDetailsText = ''; }
                if (val === 'char') { // Clear delivery details if donating all
                    Object.assign(this, { deliveryName: '', deliveryPhone: '', selectedGovernorate: '', deliveryCity: '', deliveryAddress: '', deliveryInstructions: '', availableCities: [] });
                }
                this.clearError('splitDetails'); // Clear validation specific to split
            });
            this.$watch('selectedPrepStyle.value', () => { if (!this.selectedPrepStyle.is_custom) this.customPrepDetails = ''; });
            this.$watch('splitDetailsOption', val => { if (val !== 'custom') this.customSplitDetailsText = ''; this.clearError('splitDetails'); });
            this.$watch('selectedGovernorate', () => { this.updateCities(); this.clearError('deliveryCity'); /* Clear city error when gov changes */});

            this.stepSectionsMeta = ['#step1-content', '#step2-content', '#step3-content', '#step4-content', '#step5-content']
                .map((id, index) => ({
                    id,
                    step: index + 1,
                    element: document.querySelector(id), // Get element once
                    titleRef: `step${index+1}Title`, // Ref for the title in that step
                    firstFocusableErrorRef: null // To store ref of first field with error in this step
                }));

            this.$nextTick(() => {
                this.handleScroll(); // Initial check for active step based on scroll
                const initialFocusTarget = this.bookingConfirmed ? 'bookingConfirmedTitle' : (this.$refs.step1Title ? 'step1Title' : 'bookingSectionTitle');
                this.focusOnRef(initialFocusTarget);
            });
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') this.startOfferDHDMSCountdown();
                else if(this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            });
        },

        startOfferDHDMSCountdown() {
            if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            if (!this.appSettings.promo_is_active || !this.appSettings.promo_end_date) {
                this.countdown.ended = true; this.promoHasEnded = true; this.calculatedPromoDaysLeft = 0; return;
            }
            if (!this.appSettings.promo_end_date || typeof this.appSettings.promo_end_date !== 'string') {
                this.countdown.ended = true; return;
            }
            const endDate = new Date(this.appSettings.promo_end_date).getTime();
            if (isNaN(endDate)) {
                this.countdown.ended = true; return;
            }
            this.updateDHDMSCountdownDisplay(endDate); // Initial display
            this.countdownTimerInterval = setInterval(() => this.updateDHDMSCountdownDisplay(endDate), 1000);
        },
        updateDHDMSCountdownDisplay(endDate) {
            const now = new Date().getTime(); const distance = endDate - now;
            if (distance < 0) {
                if(this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
                Object.assign(this.countdown, {days: '00', hours: '00', minutes: '00', seconds: '00', ended: true});
                this.promoHasEnded = true; this.calculatedPromoDaysLeft = 0; return;
            }
            this.countdown.ended = false; this.promoHasEnded = false;
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            Object.assign(this.countdown, {
                days: String(days).padStart(2, '0'), hours: String(hours).padStart(2, '0'),
                minutes: String(minutes).padStart(2, '0'), seconds: String(seconds).padStart(2, '0')
            });
            this.calculatedPromoDaysLeft = days;
        },

        handleScroll() {
            if (this.bookingConfirmed || !this.stepSectionsMeta.some(s => s.element && typeof s.element.offsetTop === 'number')) return;
            const offset = (document.querySelector('.site-header')?.offsetHeight || 70) + (document.querySelector('.stepper-outer-wrapper')?.offsetHeight || 55) + 20; // Extra 20px buffer
            let newActiveStep = this.currentActiveStep; const scrollPosition = window.scrollY + offset;

            for (let i = 0; i < this.stepSectionsMeta.length; i++) {
                const section = this.stepSectionsMeta[i];
                if (section.element && typeof section.element.offsetTop === 'number') {
                    const sectionTop = section.element.offsetTop;
                    const sectionBottom = sectionTop + section.element.offsetHeight;
                    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                        newActiveStep = section.step;
                        break; // Found the current section
                    } else if (scrollPosition < sectionTop) { // If before the first section
                        newActiveStep = (i === 0) ? 1 : this.stepSectionsMeta[i-1].step;
                        break;
                    }
                }
            }
            // If scrolled past the last section
            const lastStepMeta = this.stepSectionsMeta[this.stepSectionsMeta.length - 1];
            if (lastStepMeta && lastStepMeta.element && scrollPosition >= (lastStepMeta.element.offsetTop + lastStepMeta.element.offsetHeight)) {
                newActiveStep = lastStepMeta.step;
            }


            if (this.currentActiveStep !== newActiveStep) {
                let canScrollToStep = true;
                for(let i=1; i < newActiveStep; i++) { if (!this.currentStepCompleted(i, false)) { canScrollToStep = false; break; } } // Don't show errors on scroll
                if (canScrollToStep) this.currentActiveStep = newActiveStep;
            }
        },
        updateCities() {
            const gov = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
            this.availableCities = gov?.cities || []; this.deliveryCity = ''; // Reset city when governorate changes
        },
        getFormattedPrice(price, currency) {
            const c = currency || this.currentCurrency;
            const r = (this.appSettings && this.appSettings.exchange_rates) ? this.appSettings.exchange_rates[c] : null;
            return (price == null || !r || typeof r.rate_from_egp !== 'number') ? `${r?.symbol || '?'} ---` : `${r.symbol} ${(price * r.rate_from_egp).toFixed(r.symbol === 'LE' || r.symbol === 'ل.م' ? 0 : 2)}`;
        },
        isValidEmail: email => (!email || typeof email !== 'string' || !email.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), // Allow empty if optional
        isValidPhone: phone => phone && typeof phone === 'string' && /^\+?[0-9\s\-()]{7,20}$/.test(phone.trim()),
        scrollToSection: sel => {
            try {
                const element = document.querySelector(sel);
                if (element) {
                    const headerOffset = (document.querySelector('.site-header')?.offsetHeight || 0) + (sel.startsWith('#step') ? (document.querySelector('.stepper-outer-wrapper')?.offsetHeight || 0) : 0);
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 10; // 10px buffer
                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                }
            } catch(e) {/* ignore scroll err */}
        },

        navigateToStep(targetStep) {
            this.clearAllErrors(); // Clear errors when explicitly navigating
            // Check if all previous steps are completed
            for (let i = 1; i < targetStep; i++) {
                if (!this.currentStepCompleted(i, true)) { // Show errors for uncompleted previous steps
                    this.currentActiveStep = i; // Set to the first uncompleted step
                    this.scrollToSection(this.stepSectionsMeta[i-1]?.id || '#udheya-booking-form-panel');
                    // Focus on the first error of that uncompleted step
                    this.$nextTick(() => this.focusOnRef(this.stepSectionsMeta[i-1]?.firstFocusableErrorRef || this.stepSectionsMeta[i-1]?.titleRef));
                    return;
                }
            }
            this.currentActiveStep = targetStep;
            this.focusOnRef(this.stepSectionsMeta[targetStep - 1]?.titleRef); // Focus on new step's title
            this.scrollToSection(this.stepSectionsMeta[targetStep-1]?.id || '#udheya-booking-form-panel');
        },

        currentStepCompleted(stepNumber, showErrorsIfCurrent = true) {
            let isValid = false;
            const isCurrentValidatingStep = showErrorsIfCurrent && this.currentActiveStep === stepNumber;

            switch (stepNumber) {
                case 1: isValid = this.validateStep1(isCurrentValidatingStep); break;
                case 2: isValid = this.validateStep2(isCurrentValidatingStep); break;
                case 3: isValid = this.validateStep3(isCurrentValidatingStep); break; // No explicit validation, always true
                case 4: isValid = this.validateStep4(isCurrentValidatingStep); break;
                case 5: isValid = this.validateStep5(isCurrentValidatingStep); break; // For payment method selection
                default: isValid = false;
            }
            // Store the first error ref if validation failed for the current step being validated
            if (!isValid && isCurrentValidatingStep && this.stepSectionsMeta[stepNumber-1]) {
                // The firstFocusableErrorRef should be set within each validateStepX function
            } else if (isValid && this.stepSectionsMeta[stepNumber-1]) {
                this.stepSectionsMeta[stepNumber-1].firstFocusableErrorRef = null; // Clear if valid
            }
            return isValid;
        },

        validateAndProceedToStep(nextStep) {
            this.clearAllErrors(); // Clear previous errors before validating current step
            let isValidCurrentStep = this.currentStepCompleted(this.currentActiveStep, true); // Validate current step and show errors

            if (isValidCurrentStep) {
                if (nextStep <= this.stepSectionsMeta.length) {
                    this.currentActiveStep = nextStep;
                    this.$nextTick(() => {
                        this.focusOnRef(this.stepSectionsMeta[nextStep - 1]?.titleRef);
                        this.scrollToSection(this.stepSectionsMeta[nextStep-1]?.id || '#udheya-booking-form-panel');
                    });
                }
            } else {
                // Focus on the first error of the current step if validation failed
                this.$nextTick(() => {
                    const currentStepMeta = this.stepSectionsMeta[this.currentActiveStep - 1];
                    if (currentStepMeta && currentStepMeta.firstFocusableErrorRef) {
                        this.focusOnRef(currentStepMeta.firstFocusableErrorRef);
                    } else if (currentStepMeta) { // Fallback to step title if no specific error ref
                        this.focusOnRef(currentStepMeta.titleRef);
                    }
                    this.scrollToSection(currentStepMeta?.id || '#udheya-booking-form-panel');
                });
            }
        },

        validateStep1(showErrors = true) {
            if (showErrors) this.clearError('animal');
            let firstErrorRef = null;
            const stepMeta = this.stepSectionsMeta[0];

            if (!this.selectedAnimal.type || !this.selectedAnimal.weight) {
                if (showErrors) {
                    this.setError('animal', {en: "Please select an animal and its weight.", ar: "يرجى اختيار الحيوان ووزنه."});
                    if (!this.selectedAnimal.type) { // No animal type selected at all
                        firstErrorRef = this.$refs.baladiWeightSelect ? 'baladiWeightSelect' : (this.$refs.barkiWeightSelect ? 'barkiWeightSelect' : null);
                    } else if (this.selectedAnimal.type === 'baladi' && !this.selectedAnimal.weight) {
                        firstErrorRef = 'baladiWeightSelect';
                    } else if (this.selectedAnimal.type === 'barki' && !this.selectedAnimal.weight) {
                        firstErrorRef = 'barkiWeightSelect';
                    }
                    if (firstErrorRef) this.focusOnRef(firstErrorRef);
                }
                if(stepMeta) stepMeta.firstFocusableErrorRef = firstErrorRef;
                return false;
            }

            // Re-check stock at the moment of validation
            const animalDefinition = this.productOptions.livestock.find(a => a.value_key === this.selectedAnimal.type);
            const weightDefinition = animalDefinition?.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight);

            if (!weightDefinition || !weightDefinition.is_active || (weightDefinition.stock != null && weightDefinition.stock <= 0)) {
                if (showErrors) {
                    this.setError('animal', {
                        en: `${this.selectedAnimal.nameEN || 'Your selected animal'} (${this.selectedAnimal.weight}) is no longer in stock. Please re-select.`,
                        ar: `${this.selectedAnimal.nameAR || 'الحيوان المختار'} (${this.selectedAnimal.weight}) لم يعد متوفراً. يرجى إعادة الاختيار.`
                    });
                    firstErrorRef = this.selectedAnimal.type === 'baladi' ? 'baladiWeightSelect' : 'barkiWeightSelect';
                    this.focusOnRef(firstErrorRef);
                    // Important: Reset selection and update UI
                    this.selectedAnimal = { ...initialBookingFormState.selectedAnimal };
                    this.calculateTotalPrice();
                    this.updateAllDisplayedPrices(); // This will re-render selects, potentially clearing the problematic selection
                     document.querySelectorAll('.livestock-card').forEach(card => card.classList.remove('livestock-card-selected'));

                }
                if(stepMeta) stepMeta.firstFocusableErrorRef = firstErrorRef;
                return false;
            }

            if(stepMeta) stepMeta.firstFocusableErrorRef = null;
            return true;
        },
        validateStep2(showErrors = true) {
            if(showErrors) { this.clearError('prepStyle'); this.clearError('packaging'); }
            let isValid = true; let firstErrorRef = null;
            const stepMeta = this.stepSectionsMeta[1];

            if (!this.selectedPrepStyle.value) {
                if(showErrors) {this.setError('prepStyle', 'select'); if(!firstErrorRef) firstErrorRef = 'prepStyleSelect';} isValid = false;
            }
            if (!this.selectedPackaging.value) {
                if(showErrors) {this.setError('packaging', 'select'); if(!firstErrorRef) firstErrorRef = 'packagingSelect';} isValid = false;
            }
            if(showErrors && firstErrorRef) { this.focusOnRef(firstErrorRef); }
            if(stepMeta) stepMeta.firstFocusableErrorRef = firstErrorRef;
            return isValid;
        },
        validateStep3(showErrors = true) { // No specific validation for step 3 as per user's base script
            const stepMeta = this.stepSectionsMeta[2];
            if(stepMeta) stepMeta.firstFocusableErrorRef = null;
            return true;
        },
        validateStep4(showErrors = true) {
            if(showErrors) { this.clearError('splitDetails'); this.clearError('deliveryName'); this.clearError('deliveryPhone'); this.clearError('customerEmail'); this.clearError('selectedGovernorate'); this.clearError('deliveryCity'); this.clearError('deliveryAddress');}
            let isValid = true; let firstErrorRef = null;
            const stepMeta = this.stepSectionsMeta[3];
            const setValError = (f, t, r) => { if(showErrors) this.setError(f,t); isValid=false; if(showErrors && !firstErrorRef) firstErrorRef=r;};

            if (this.distributionChoice === 'split') {
                if (!this.splitDetailsOption) setValError('splitDetails', 'select', 'distributionChoiceRadios'); // Focus on the radio group
                else if (this.splitDetailsOption === 'custom' && !(this.customSplitDetailsText || "").trim()) setValError('splitDetails', 'required', 'customSplitTextarea');
            }
            if (this._needsDeliveryDetails) {
                if (!(this.deliveryName || "").trim()) setValError('deliveryName', 'required', 'deliveryNameInput');
                if (!(this.deliveryPhone || "").trim()) setValError('deliveryPhone', 'required', 'deliveryPhoneInput');
                else if (!this.isValidPhone((this.deliveryPhone || "").trim())) setValError('deliveryPhone', 'phone', 'deliveryPhoneInput');

                // Email is optional, but if filled, it must be valid
                if ((this.customerEmail || "").trim() && !this.isValidEmail((this.customerEmail || "").trim())) setValError('customerEmail', 'email', 'customerEmailInput');

                if (!this.selectedGovernorate) setValError('selectedGovernorate', 'select', 'deliveryGovernorateSelect');

                const gov = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
                if (gov && Array.isArray(gov.cities) && gov.cities.length > 0 && !this.deliveryCity) { // City is required if governorate has cities
                    setValError('deliveryCity', 'select', 'deliveryCitySelect');
                }
                if (!(this.deliveryAddress || "").trim()) setValError('deliveryAddress', 'required', 'deliveryAddressInput');
            }
            if(showErrors && firstErrorRef) { this.focusOnRef(firstErrorRef); }
            if(stepMeta) stepMeta.firstFocusableErrorRef = firstErrorRef;
            return isValid;
        },
        validateStep5(showErrors = true) {
            if(showErrors) this.clearError('paymentMethod');
            let firstErrorRef = null;
            const stepMeta = this.stepSectionsMeta[4];
            if(!this.paymentMethod) {
                if(showErrors) {this.setError('paymentMethod', 'select'); firstErrorRef = 'paymentMethodRadios'; this.focusOnRef(firstErrorRef);}
                if(stepMeta) stepMeta.firstFocusableErrorRef = firstErrorRef;
                return false;
            }
            if(stepMeta) stepMeta.firstFocusableErrorRef = null;
            return true;
        },

        selectAnimal(animalKey, weightSelectElement) {
            this.clearError('animal');

            const livestockChoice = this.productOptions.livestock.find(a => a.value_key === animalKey);
            if (!livestockChoice) {
                this.setError('animal', {en: 'Invalid animal type specified.', ar: 'تم تحديد نوع حيوان غير صالح.'});
                return;
            }

            const selectedWeightValue = weightSelectElement.value;
            // If user selects the placeholder (e.g., "-- Select Weight --")
            if (!selectedWeightValue) {
                if (this.selectedAnimal.type === animalKey) { // If this animal type was previously selected
                    this.selectedAnimal = { ...initialBookingFormState.selectedAnimal }; // Reset it
                    this.calculateTotalPrice();
                    document.getElementById(animalKey)?.classList.remove('livestock-card-selected');
                }
                return; // Do not proceed, do not show error, just de-select
            }

            const weightPriceData = livestockChoice.weights_prices.find(wp => wp.weight_range === selectedWeightValue);

            if (!weightPriceData || !weightPriceData.is_active || (weightPriceData.stock != null && weightPriceData.stock <= 0)) {
                this.setError('animal', {
                    en: `${livestockChoice.name_en || 'Selected animal'} (${selectedWeightValue}) is currently out of stock. Please choose another weight.`,
                    ar: `${livestockChoice.name_ar || 'الحيوان المختار'} (${selectedWeightValue}) غير متوفر حاليًا. يرجى اختيار وزن آخر.`
                });
                if (this.selectedAnimal.type === animalKey && this.selectedAnimal.weight === selectedWeightValue) {
                    this.selectedAnimal = { ...initialBookingFormState.selectedAnimal }; // Reset if current selection became OOS
                     document.getElementById(animalKey)?.classList.remove('livestock-card-selected');
                }
                this.calculateTotalPrice();
                // this.updateAllDisplayedPrices(); // Could cause infinite loop if not careful here. Let validation handle it.
                this.focusOnRef(weightSelectElement.id);
                return;
            }

            // If switching animal types, reset the other animal's weight select and deselect its card
            const otherAnimalKey = animalKey === 'baladi' ? 'barki' : 'baladi';
            if (this.selectedAnimal.type && this.selectedAnimal.type !== animalKey) {
                const otherSelectElement = this.$refs[`${otherAnimalKey}WeightSelect`];
                if (otherSelectElement) otherSelectElement.value = ''; // Reset to default/placeholder
                document.getElementById(otherAnimalKey)?.classList.remove('livestock-card-selected');
            }
            
            this.selectedAnimal = {
                type: livestockChoice.value_key,
                value: livestockChoice.value_key,
                weight: weightPriceData.weight_range,
                basePriceEGP: parseFloat(weightPriceData.price_egp),
                stock: weightPriceData.stock,
                originalStock: weightPriceData.stock,
                nameEN: livestockChoice.name_en,
                nameAR: livestockChoice.name_ar,
                pbId: livestockChoice.pbId
            };
            this.calculateTotalPrice();

            // Highlight the selected card
            document.querySelectorAll('.livestock-card').forEach(card => card.classList.remove('livestock-card-selected'));
            weightSelectElement.closest('.livestock-card').classList.add('livestock-card-selected');

            this.validateAndProceedToStep(2); // Auto-advance
        },
        isLivestockWeightOutOfStock(selEl, key) { // This is used in HTML for disabling the "Select" button (which we removed)
            const animal = this.productOptions.livestock.find(a => a.value_key === key);
            if (!animal || !selEl || !selEl.value) return true; // No value selected means it's "out of stock" for proceeding
            const wp = animal.weights_prices.find(w => w.weight_range === selEl.value);
            return !wp || !wp.is_active || (wp.stock != null && wp.stock <= 0);
        },
        updateSelectedPrepStyle(value) {
            const style = this.productOptions.preparationStyles.find(s => s.value === value);
            if (style) this.selectedPrepStyle = { ...style }; // Create a new object copy
            else this.selectedPrepStyle = { value: '', nameEN: '', nameAR: '', is_custom: false };
            if (!this.selectedPrepStyle.is_custom) this.customPrepDetails = ''; // Clear custom details if not custom
            this.calculateTotalPrice();
        },
        updateSelectedPackaging(value) {
            const pkg = this.productOptions.packagingOptions.find(p => p.value === value);
            if (pkg) this.selectedPackaging = { ...pkg, addonPriceEGP: parseFloat(pkg.addonPriceEGP || 0) };
            else this.selectedPackaging = { value: '', addonPriceEGP: 0, nameEN: '', nameAR: '' };
            this.calculateTotalPrice();
        },
        updateSacrificeDayTexts() { // Called on init and when selectedSacrificeDay.value changes
            const opt = document.querySelector(`#sacrifice_day_select_s3 option[value="${this.selectedSacrificeDay.value}"]`);
            if (opt) Object.assign(this.selectedSacrificeDay, { textEN: opt.dataset.en, textAR: opt.dataset.ar });
        },
        calculateTotalPrice() { this.totalPriceEGP = (this.selectedAnimal.basePriceEGP || 0) + (this.selectedPackaging.addonPriceEGP || 0); },
        updateAllDisplayedPrices() { // Populates livestock weight dropdowns and updates card prices
            try {
                 (this.productOptions.livestock || []).forEach(animal => {
                    const card = document.getElementById(animal.value_key); // e.g., id="baladi"
                    const sel = card?.querySelector('.livestock-weight-select'); // Select element in the card
                    if (!card || !sel) return;

                    const currentSelectedValueInDropdown = sel.value; // Store current selection before clearing
                    sel.innerHTML = ''; // Clear existing options

                    // Add a placeholder/default option
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = "";
                    placeholderOption.textContent = this.currentLang === 'ar' ? "-- اختر الوزن --" : "-- Select Weight --";
                    placeholderOption.disabled = false; // Placeholder should be selectable to de-select
                    sel.appendChild(placeholderOption);

                    let firstAvailableWeight = null;
                    let currentSelectionStillAvailable = false;

                    (animal.weights_prices || []).forEach(wp => {
                        const opt = document.createElement('option');
                        opt.value = wp.weight_range;
                        const isOutOfStock = !wp.is_active || (wp.stock != null && wp.stock <= 0);
                        const stockTextEN = isOutOfStock ? ' - Out of Stock' : (wp.stock != null ? ` - Stock: ${wp.stock}` : '');
                        const stockTextAR = isOutOfStock ? ' - نفذت الكمية' : (wp.stock != null ? ` - الكمية: ${wp.stock}` : '');
                        const stockDisplayText = this.currentLang === 'ar' ? stockTextAR : stockTextEN;

                        opt.textContent = `${wp.weight_range || ''} (${this.getFormattedPrice(wp.price_egp)})${stockDisplayText}`;
                        opt.disabled = isOutOfStock;
                        sel.appendChild(opt);

                        if (!isOutOfStock && firstAvailableWeight === null) {
                            firstAvailableWeight = wp.weight_range;
                        }
                        if (wp.weight_range === currentSelectedValueInDropdown && !isOutOfStock) {
                            currentSelectionStillAvailable = true;
                        }
                    });

                    // Restore selection or set to first available or placeholder
                    if (currentSelectedValueInDropdown && currentSelectionStillAvailable) {
                        sel.value = currentSelectedValueInDropdown;
                    } else if (this.selectedAnimal.type === animal.value_key && this.selectedAnimal.weight &&
                               animal.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight && wp.is_active && (wp.stock == null || wp.stock > 0))) {
                        // If a global selectedAnimal exists for this type and is valid, set the dropdown to it
                        sel.value = this.selectedAnimal.weight;
                    } else {
                        sel.value = ""; // Default to placeholder
                    }
                    
                    // Update "From X price" display on card
                    const firstActiveWeightPrice = (animal.weights_prices || []).find(wp => wp.is_active && (wp.stock == null || wp.stock > 0));
                    const basePriceForCardDisplay = firstActiveWeightPrice ? firstActiveWeightPrice.price_egp : ((animal.weights_prices || [])[0]?.price_egp || 0);
                    const priceEnSpan = card.querySelector('.price.bil-row .en span');
                    const priceArSpan = card.querySelector('.price.bil-row .ar span');
                    if(priceEnSpan) priceEnSpan.textContent = this.getFormattedPrice(basePriceForCardDisplay);
                    if(priceArSpan) priceArSpan.textContent = this.getFormattedPrice(basePriceForCardDisplay);
                });
                this.calculateTotalPrice(); // Recalculate total if selections changed due to stock updates
            } catch(e) {
                console.error("Error updating price displays:", e);
                this.userFriendlyApiError = "Error updating price displays."; // User-friendly message
            }
        },

        async validateAndSubmitBooking() {
            this.clearAllErrors();
            if (!this.currentStepCompleted(1, true)) { this.navigateToStep(1); return; }
            if (!this.currentStepCompleted(2, true)) { this.navigateToStep(2); return; }
            if (!this.currentStepCompleted(3, true)) { this.navigateToStep(3); return; }
            if (!this.currentStepCompleted(4, true)) { this.navigateToStep(4); return; }
            if (!this.currentStepCompleted(5, true)) { this.navigateToStep(5); return; }

            // Final stock check before submitting
            const animal = this.productOptions.livestock.find(a => a.value_key === this.selectedAnimal.value);
            const wpData = animal?.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight);
            if (!animal || !wpData || !wpData.is_active || (wpData.stock != null && wpData.stock <= 0)) {
                this.setError('animal', {
                    en: `Sorry, ${this.selectedAnimal.nameEN || 'your selected item'} (${this.selectedAnimal.weight}) is no longer available. Please reselect.`,
                    ar: `عذراً، ${this.selectedAnimal.nameAR || 'المنتج المختار'} (${this.selectedAnimal.weight}) لم يعد متوفراً. يرجى إعادة الاختيار.`
                });
                this.selectedAnimal = { ...initialBookingFormState.selectedAnimal }; // Reset selection
                this.updateAllDisplayedPrices(); // Update UI
                this.navigateToStep(1); // Go back to animal selection
                return;
            }

            this.isLoading.booking = true; this.apiError = null; this.userFriendlyApiError = ''; this.calculateTotalPrice();
            const p = this; // Alias for 'this'
            const payload = {
                booking_id_text: `SL-UDHY-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9e4)+1e4).padStart(5,'0')}`, // Generate booking ID
                animal_type_key: p.selectedAnimal.value, animal_type_name_en: p.selectedAnimal.nameEN, animal_type_name_ar: p.selectedAnimal.nameAR,
                animal_weight_selected: p.selectedAnimal.weight, animal_base_price_egp: p.selectedAnimal.basePriceEGP,
                preparation_style_value: p.selectedPrepStyle.value, preparation_style_name_en: p.selectedPrepStyle.nameEN, preparation_style_name_ar: p.selectedPrepStyle.nameAR,
                is_custom_prep: p.selectedPrepStyle.is_custom, custom_prep_details: p.selectedPrepStyle.is_custom ? (p.customPrepDetails || "").trim() : "",
                packaging_value: p.selectedPackaging.value, packaging_name_en: p.selectedPackaging.nameEN, packaging_name_ar: p.selectedPackaging.nameAR,
                packaging_addon_price_egp: p.selectedPackaging.addonPriceEGP, total_price_egp: p.totalPriceEGP,
                sacrifice_day_value: p.selectedSacrificeDay.value, time_slot: p.selectedTimeSlot,
                distribution_choice: p.distributionChoice,
                split_details_option: p.distributionChoice === 'split' ? p.splitDetailsOption : "",
                custom_split_details_text: (p.distributionChoice === 'split' && p.splitDetailsOption === 'custom') ? (p.customSplitDetailsText || "").trim() : "",
                niyyah_names: (p.niyyahNames || "").trim(), customer_email: (p.customerEmail || "").trim(), group_purchase_interest: p.groupPurchase,
                delivery_name: p._needsDeliveryDetails ? (p.deliveryName || "").trim() : "", delivery_phone: p._needsDeliveryDetails ? (p.deliveryPhone || "").trim() : "",
                delivery_governorate_id: p._needsDeliveryDetails ? p.selectedGovernorate : "", delivery_city_id: p._needsDeliveryDetails ? p.deliveryCity : "", // Store IDs
                delivery_address: p._needsDeliveryDetails ? (p.deliveryAddress || "").trim() : "", delivery_instructions: p._needsDeliveryDetails ? (p.deliveryInstructions || "").trim() : "",
                payment_method: p.paymentMethod, payment_status: (p.paymentMethod === 'cod' && p._needsDeliveryDetails) ? 'cod_pending' : 'pending', // Adjust based on payment method
                booking_status: 'confirmed_pending_payment', // Default status
                // Add language of booking if needed: current_lang: p.currentLang,
            };

            try {
                const booking = await pbFetch('bookings', { fetchOptions: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }});
                this.bookingID = booking.booking_id_text || booking.id; // Use the text ID if available

                // Decrement stock in local state (PocketBase rule/hook should handle actual DB decrement)
                if (wpData.stock != null && wpData.stock > 0) {
                    wpData.stock--; // Update local cache
                    // No need to call updateAllDisplayedPrices here unless we want to immediately reflect for next potential booking
                }
                this.bookingConfirmed = true;
                this.$nextTick(() => { this.scrollToSection('#booking-confirmation-section'); this.focusOnRef('bookingConfirmedTitle'); });
            } catch (error) {
                console.error("Booking submission error:", error);
                this.apiError = error.message;
                this.userFriendlyApiError = error.message.includes('Network Error') ? error.message : "There was an issue submitting your booking. Please review your details or try again. If the problem persists, contact support.";
                this.scrollToSection('.global-error-indicator'); // Scroll to global error if shown
            } finally { this.isLoading.booking = false; }
        },
        async validateAndCheckBookingStatus() {
            this.clearError('lookupBookingID');
            if (!(this.lookupBookingID || "").trim()) {
                this.setError('lookupBookingID', 'required'); this.focusOnRef('lookupBookingIdInput'); return;
            }
            await this.checkBookingStatus();
        },
        async checkBookingStatus() {
            this.statusResult = null; this.statusNotFound = false; this.isLoading.status = true; this.apiError = null; this.userFriendlyApiError = '';
            const id = (this.lookupBookingID || "").trim();
            try {
                const data = await pbFetch('bookings', { params: `filter=(booking_id_text='${encodeURIComponent(id)}')&perPage=1` });
                if (data.items && data.items.length > 0) {
                    const b = data.items[0];
                    this.statusResult = {
                        booking_id_text: b.booking_id_text || b.id,
                        status: b.booking_status || 'Unknown',
                        animal_type: b.animal_type_name_en || b.animal_type_key, // Prefer display name
                        animal_weight_selected: b.animal_weight_selected,
                        sacrifice_day: b.sacrifice_day_value, // Store value, get text via helper
                        time_slot: b.time_slot
                    };
                } else { this.statusNotFound = true; }
            } catch (error) {
                console.error("Check status error:", error);
                this.apiError = error.message;
                this.userFriendlyApiError = error.message.includes('Network Error') ? error.message : "Could not retrieve booking status. Please check the ID or try again later.";
                this.statusNotFound = true; // Show not found on error too for simplicity
            } finally { this.isLoading.status = false; }
        },
        getSacrificeDayText(val) { // Helper for status display
            const opt = document.querySelector(`#sacrifice_day_select_s3 option[value="${val}"]`);
            return opt ? { en: opt.dataset.en, ar: opt.dataset.ar } : { en: val, ar: val }; // Fallback
        },
        resetAndStartOver() {
             Object.assign(this, JSON.parse(JSON.stringify(initialBookingFormState)), { // Reset to initial state
                bookingConfirmed: false, bookingID: '', lookupBookingID: '', statusResult: null, statusNotFound: false,
                currentActiveStep: 1, isMobileMenuOpen: false, apiError: null, userFriendlyApiError: '',
                // Keep appSettings and productOptions as they are loaded during initApp
                // Reset countdown related state if necessary, or let initApp handle it
                countdown: { days: '00', hours: '00', minutes: '00', seconds: '00', ended: false },
                promoHasEnded: false, calculatedPromoDaysLeft: 0,
            });
            if(this.countdownTimerInterval) clearInterval(this.countdownTimerInterval); // Clear existing timer
            // Re-initialize parts of the app state that might have changed
            // initApp will reload settings and products, and reset dependent states like prices
            this.initApp(); // This will also call updateAllDisplayedPrices
            this.$nextTick(() => { this.scrollToSection('#udheya-booking-start'); this.focusOnRef('bookingSectionTitle'); });
        }
    }));
});

// ----- START: INLINE POCKETBASE SEEDER (Minimal Logs)-----
// ... (Seeder code remains unchanged) ...
(function() {
    const SEEDER_QUERY_PARAM = 'run_db_seed';

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    if (getQueryParam(SEEDER_QUERY_PARAM) === 'true') {
        const SEEDER_API_BASE_URL = '/api/';
        const SEEDER_RECORDS_TO_CREATE = [
            {
                collection: 'app_settings',
                data: {
                    setting_key: "global_config",
                    exchange_rates: { EGP: { rate_from_egp: 1, symbol: 'LE', is_active: true }, USD: { rate_from_egp: 0.021, symbol: '$', is_active: true }, GBP: { rate_from_egp: 0.017, symbol: '£', is_active: true } },
                    default_currency: "EGP",
                    whatsapp_number_raw: "201234567890",
                    whatsapp_number_display: "+20 123 456 7890",
                    promo_end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                    promo_discount_percent: 15,
                    promo_is_active: true,
                    delivery_areas: [ { id: 'cairo', name_en: 'Cairo', name_ar: 'القاهرة', cities: [ {id: 'nasr_city', name_en: 'Nasr City', name_ar: 'مدينة نصر'}, {id: 'maadi', name_en: 'Maadi', name_ar: 'المعادي'}, {id: 'heliopolis', name_en: 'Heliopolis', name_ar: 'مصر الجديدة'} ]}, { id: 'giza', name_en: 'Giza', name_ar: 'الجيزة', cities: [ {id: 'dokki', name_en: 'Dokki', name_ar: 'الدقي'}, {id: 'mohandessin', name_en: 'Mohandessin', name_ar: 'المهندسين'}, {id: 'haram', name_en: 'Haram', name_ar: 'الهرم'} ]}, { id: 'alexandria', name_en: 'Alexandria', name_ar: 'الإسكندرية', cities: [ {id: 'smouha', name_en: 'Smouha', name_ar: 'سموحة'}, {id: 'miami', name_en: 'Miami', name_ar: 'ميامي'} ]}, { id: 'other_gov', name_en: 'Other Governorate', name_ar: 'محافظة أخرى', cities: [] } ],
                    payment_details: { vodafone_cash: "010 YOUR VODA NUMBER", instapay_ipn: "YOUR.IPN@instapay", revolut_details: "@YOUR_REVTAG or Phone: +XX XXXXXXXX", bank_name: "YOUR BANK NAME", bank_account_name: "YOUR ACCOUNT HOLDER NAME", bank_account_number: "YOUR ACCOUNT NUMBER", bank_iban: "YOUR IBAN (Optional)", bank_swift: "YOUR SWIFT/BIC (Optional)" }
                }
            },
            {
                collection: 'livestock_types',
                data: {
                    value_key: 'baladi', name_en: 'Baladi Sheep', name_ar: 'خروف بلدي', weights_prices: [ { weight_range: "30-40 kg", price_egp: 4500, stock: 15, is_active: true }, { weight_range: "40-50 kg", price_egp: 5200, stock: 10, is_active: true }, { weight_range: "50+ kg", price_egp: 6000, stock: 0, is_active: true } ]
                }
            },
            {
                collection: 'livestock_types',
                data: {
                    value_key: 'barki', name_en: 'Barki Sheep', name_ar: 'خروف برقي', weights_prices: [ { weight_range: "35-45 kg", price_egp: 5100, stock: 8, is_active: true }, { weight_range: "45-55 kg", price_egp: 5900, stock: 12, is_active: true } ]
                }
            }
        ];

        (async function runInlineSeedActual() {
            for (const record of SEEDER_RECORDS_TO_CREATE) {
                const recordIdentifier = record.data.setting_key || record.data.value_key || 'N/A (unknown)';
                try {
                    const response = await fetch(`${SEEDER_API_BASE_URL}collections/${record.collection}/records`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(record.data)
                    });
                    if (!response.ok) {
                        const responseText = await response.text();
                        console.error(`SEEDER_ERROR: Failed to create record in '${record.collection}': ${response.status} ${response.statusText} - ${responseText}. Record identifier: ${recordIdentifier}`);
                    }
                } catch (error) {
                    console.error(`SEEDER_EXCEPTION: Network or other error for record in '${record.collection}' (ID: ${recordIdentifier}):`, error);
                }
            }
            if (window.history.replaceState) {
                const cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({path: cleanURL}, '', cleanURL);
            }
        })();
    }
})();
// ----- END: INLINE POCKETBASE SEEDER -----
