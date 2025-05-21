document.addEventListener('alpine:init', () => {
    const initialBookingFormState = {
        selectedAnimal: { type: '', value: '', weight: '', basePriceEGP: 0, nameEN: '', nameAR: '', stock: null, pbId: null, originalStock: null },
        selectedPrepStyle: { value: '', nameEN: '', nameAR: '', is_custom: false }, customPrepDetails: '',
        selectedPackaging: { value: '', addonPriceEGP: 0, nameEN: '', nameAR: '' }, totalPriceEGP: 0,
        customerEmail: '', deliveryName: '', deliveryPhone: '', selectedGovernorate: '', deliveryCity: '', availableCities: [], deliveryAddress: '', deliveryInstructions: '',
        niyyahNames: '', splitDetailsOption: '', customSplitDetailsText: '', groupPurchase: false,
        selectedSacrificeDay: { value: 'day1_10_dhul_hijjah', textEN: 'Day 1 of Eid (10th Dhul Hijjah)', textAR: 'اليوم الأول (10 ذو الحجة)' },
        selectedTimeSlot: '8 AM-9 AM', distributionChoice: 'me', paymentMethod: 'fa',
        errors: {} // For inline validation messages
    };

    async function pbFetch(collection, options = {}) {
        const { recordId = '', params = '' } = options;
        const url = `/api/collections/${collection}/records${recordId ? `/${recordId}` : ''}${params ? `?${params}` : ''}`;
        try {
            const response = await fetch(url, options.fetchOptions);
            if (!response.ok) {
                let errorDataMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    if (errorData && typeof errorData.data === 'object' && errorData.data !== null) {
                        errorDataMessage = Object.values(errorData.data).map(e => e.message || JSON.stringify(e)).join('; ');
                    } else if (errorData && errorData.message) { errorDataMessage = errorData.message; }
                } catch (e) { /* ignore if response body is not JSON */ }
                throw new Error(`API Error (${collection} ${recordId || params}): ${response.status} ${errorDataMessage}`);
            }
            return response.json();
        } catch (networkError) {
            // Handle network errors (e.g., PocketBase server is down)
             throw new Error(`Network Error: Could not connect to API. Please check your connection or try again later. (${networkError.message})`);
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
        calculatedPromoDaysLeft: 0, promoHasEnded: false, countdownTimerInterval: null,
        currentLang: 'en',

        // --- Error Handling & Validation ---
        errors: {}, // Holds error messages for fields { fieldName: { en: 'Msg', ar: 'رسالة' } }
        errorMessages: { // Centralized error messages
            required: { en: "This field is required.", ar: "هذا الحقل مطلوب." },
            select: { en: "Please make a selection.", ar: "يرجى الاختيار." },
            email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." },
            phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." } // Basic, can be expanded
        },
        setError(field, type) { this.errors[field] = this.errorMessages[type] || this.errorMessages.required; },
        clearError(field) { if (this.errors[field]) delete this.errors[field]; },
        clearAllErrors() { this.errors = {}; },
        focusOnRef(refName) { this.$nextTick(() => { if (this.$refs[refName]) this.$refs[refName].focus(); }); },

        // --- Computed Properties ---
        get _needsDeliveryDetails() { /* ... (same as before) ... */
            const customText = (this.customSplitDetailsText || '').toLowerCase();
            return this.distributionChoice === 'me' || (this.distributionChoice === 'split' && (
                   ['1/3_me_2/3_charity_sl', '1/2_me_1/2_charity_sl', '2/3_me_1/3_charity_sl', 'all_me_custom_distro'].includes(this.splitDetailsOption) ||
                   (this.splitDetailsOption === 'custom' && (customText.includes('for me') || customText.includes('all delivered to me'))) ));
        },
        get splitDetails() { /* ... (same as before) ... */
            if (this.distributionChoice !== 'split') return '';
            if (this.splitDetailsOption === 'custom') return (this.customSplitDetailsText || "").trim();
            return {
                '1/3_me_2/3_charity_sl': '1/3 for me (delivered), 2/3 for charity (by Sheep Land)',
                '1/2_me_1/2_charity_sl': '1/2 for me (delivered), 1/2 for charity (by Sheep Land)',
                '2/3_me_1/3_charity_sl': '2/3 for me (delivered), 1/3 for charity (by Sheep Land)',
                'all_me_custom_distro': 'All for me (for my own distribution)'
            }[this.splitDetailsOption] || this.splitDetailsOption;
        },
        _getDeliveryLocation(lang) { /* ... (same as before) ... */
            const key = lang === 'en' ? 'name_en' : 'name_ar';
            const govObj = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
            const cityObj = govObj?.cities?.find(c => c.id === this.deliveryCity);
            if (cityObj) return cityObj[key];
            if (govObj && govObj.cities?.length === 0 && this.selectedGovernorate) return govObj[key]; // Governorate acts as city
            if (govObj && !cityObj && this.selectedGovernorate) return `${govObj[key]} (${lang === 'en' ? 'City not selected' : 'المدينة غير مختارة'})`;
            return '';
        },
        get summaryDeliveryToEN() { /* ... (same as before, but check isLogisticsStepComplete() logic) ... */
             if (this.distributionChoice === 'char') return 'Charity Distribution by Sheep Land';
            if (this._needsDeliveryDetails) {
                const name = (this.deliveryName || "").trim() || 'Recipient';
                const location = this._getDeliveryLocation('en');
                const address = (this.deliveryAddress || "").trim();
                const addressSummary = address ? (address.substring(0,20) + (address.length > 20 ? '...' : '')) : '';
                const parts = [name, location, addressSummary].filter(Boolean);

                const govObj = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
                const isGovCityValid = this.selectedGovernorate && ((govObj?.cities?.length === 0) || this.deliveryCity);

                return (parts.length > 1 && isGovCityValid && address && (this.deliveryName || "").trim() && (this.deliveryPhone || "").trim()) ? parts.join(', ') : 'Delivery Details Incomplete';
            }
            return 'Self Pickup / Distribution as per split';
        },
        get summaryDeliveryToAR() { /* ... (same as before, but check isLogisticsStepComplete() logic) ... */
            if (this.distributionChoice === 'char') return 'توزيع خيري بواسطة أرض الأغنام';
            if (this._needsDeliveryDetails) {
                const name = (this.deliveryName || "").trim() || 'المستلم';
                const location = this._getDeliveryLocation('ar');
                const address = (this.deliveryAddress || "").trim();
                const addressSummary = address ? (address.substring(0,20) + (address.length > 20 ? '...' : '')) : '';
                const parts = [name, location, addressSummary].filter(Boolean);
                const govObj = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
                const isGovCityValid = this.selectedGovernorate && ((govObj?.cities?.length === 0) || this.deliveryCity);
                return (parts.length > 1 && isGovCityValid && address && (this.deliveryName || "").trim() && (this.deliveryPhone || "").trim()) ? parts.join('، ') : 'تفاصيل التوصيل غير مكتملة';
            }
            return 'استلام ذاتي / توزيع حسب التقسيم';
        },
        get summaryDistributionEN() { /* ... (same as before) ... */
            return (this.distributionChoice === 'me') ? 'All to me' : (this.distributionChoice === 'char' ? 'All to charity (by Sheep Land)' : `Split: ${(this.splitDetails || "").trim() || '(Not specified)'}`);
        },
        get summaryDistributionAR() { /* ... (same as before) ... */
            return (this.distributionChoice === 'me') ? 'الكل لي (لتوزيعه بنفسك)' : (this.distributionChoice === 'char' ? 'تبرع بالكل للصدقة (أرض الأغنام توزع نيابة عنك)' : `تقسيم الحصص: ${(this.splitDetails || "").trim() || '(لم يحدد)'}`);
        },

        // --- Initialization & Event Handlers ---
        async initApp() {
            this.isLoading.init = true; this.apiError = null; this.userFriendlyApiError = '';
            const initialDefaultAppSettings = JSON.parse(JSON.stringify(this.appSettings));
            try {
                const settingsParams = `filter=(setting_key='global_config')&perPage=1`;
                const [settingsCollectionData, livestockData] = await Promise.all([
                    pbFetch('app_settings', { params: settingsParams }),
                    pbFetch('livestock_types', { params: 'sort=created' })
                ]);
                if (settingsCollectionData.items && settingsCollectionData.items.length > 0) {
                    const fetchedSettings = settingsCollectionData.items[0];
                    const newAppSettings = JSON.parse(JSON.stringify(initialDefaultAppSettings));
                    for (const key in fetchedSettings) {
                        if (fetchedSettings.hasOwnProperty(key) && key !== 'site_name') {
                            if (typeof fetchedSettings[key] === 'object' && fetchedSettings[key] !== null && newAppSettings[key] !== undefined && typeof newAppSettings[key] === 'object' && newAppSettings[key] !== null && !Array.isArray(fetchedSettings[key])) {
                                newAppSettings[key] = { ...newAppSettings[key], ...fetchedSettings[key] };
                            } else { newAppSettings[key] = fetchedSettings[key]; }
                        }
                    }
                    this.appSettings = newAppSettings;
                } else {
                    this.appSettings = initialDefaultAppSettings;
                    throw new Error("Critical: Global app settings ('global_config') not found.");
                }
                this.productOptions.livestock = livestockData.items.map(item => ({
                    pbId: item.id, value_key: item.value_key, name_en: item.name_en, name_ar: item.name_ar,
                    weights_prices: Array.isArray(item.weights_prices) ? item.weights_prices.map(wp => ({...wp})) : []
                }));
            } catch (error) {
                this.apiError = error.message;
                this.userFriendlyApiError = 'Failed to load application settings. Please refresh or try again later.';
                this.appSettings = JSON.parse(JSON.stringify(initialDefaultAppSettings));
            } finally { this.isLoading.init = false; }

            this.startOfferSimpleCountdown();
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') this.startOfferSimpleCountdown();
                else if(this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            });
            this.currentCurrency = this.appSettings.default_currency || "EGP";
            this.updateSacrificeDayTexts(); this.updateAllDisplayedPrices(); this.clearAllErrors();

            this.$watch(['selectedAnimal.basePriceEGP', 'selectedPackaging.addonPriceEGP'], () => this.calculateTotalPrice());
            this.$watch('currentCurrency', () => { this.calculateTotalPrice(); this.updateAllDisplayedPrices(); });
            this.$watch('selectedSacrificeDay.value', () => this.updateSacrificeDayTexts());
            this.$watch('distributionChoice', val => {
                if (val !== 'split') { this.splitDetailsOption = ''; this.customSplitDetailsText = ''; }
                if (val === 'char') { Object.assign(this, { deliveryName: '', deliveryPhone: '', selectedGovernorate: '', deliveryCity: '', deliveryAddress: '', deliveryInstructions: '', availableCities: [] });}
                this.clearError('splitDetails'); // Clear error when main choice changes
            });
            this.$watch('selectedPrepStyle.value', () => { if (!this.selectedPrepStyle.is_custom) this.customPrepDetails = ''; });
            this.$watch('splitDetailsOption', val => { if (val !== 'custom') this.customSplitDetailsText = ''; this.clearError('splitDetails'); });
            this.$watch('selectedGovernorate', () => { this.updateCities(); this.clearError('deliveryCity');});

            this.stepSectionsMeta = ['#step1-content', '#step2-content', '#step3-content', '#step4-content']
                .map((id, index) => ({ id, step: index + 1, element: document.querySelector(id), titleRef: `step${index+1}Title` }));
            this.$nextTick(() => { this.handleScroll(); this.focusOnRef(this.stepSectionsMeta[0].titleRef); });
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        },

        startOfferSimpleCountdown() { /* ... (same as previous simplified version) ... */
            if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            if (!this.appSettings.promo_is_active || !this.appSettings.promo_end_date) {
                this.promoHasEnded = true; this.calculatedPromoDaysLeft = 0; return;
            }
            const endDate = new Date(this.appSettings.promo_end_date).getTime();
            this.updateSimpleCountdownDisplay(endDate);
            this.countdownTimerInterval = setInterval(() => this.updateSimpleCountdownDisplay(endDate), 1000 * 60);
        },
        updateSimpleCountdownDisplay(endDate) { /* ... (same as previous simplified version) ... */
            const now = new Date().getTime(); const distance = endDate - now;
            if (distance < 0) {
                if(this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
                this.calculatedPromoDaysLeft = 0; this.promoHasEnded = true; return;
            }
            this.promoHasEnded = false;
            const daysLeft = Math.ceil(distance / (1000 * 60 * 60 * 24));
            this.calculatedPromoDaysLeft = daysLeft > 0 ? daysLeft : 0;
            if (this.calculatedPromoDaysLeft === 0 && distance > 0) this.calculatedPromoDaysLeft = 1; // Show "1 day" or "Ending Today"
            if (distance <= 0) { this.calculatedPromoDaysLeft = 0; this.promoHasEnded = true; }
        },

        handleScroll() { /* ... (same as before, adjusted for 4 steps) ... */
            if (this.bookingConfirmed || !this.stepSectionsMeta.some(s => s.element)) return;
            const offset = (document.querySelector('.site-header')?.offsetHeight || 70) + (document.querySelector('.stepper-outer-wrapper')?.offsetHeight || 55) + 20;
            let newActiveStep = this.currentActiveStep; const scrollPosition = window.scrollY + offset;
            for (let i = 0; i < this.stepSectionsMeta.length; i++) {
                const section = this.stepSectionsMeta[i];
                if (section.element) {
                    const sectionTop = section.element.offsetTop; const sectionBottom = sectionTop + section.element.offsetHeight;
                    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                        newActiveStep = section.step;
                        if (i === this.stepSectionsMeta.length - 1 && scrollPosition >= sectionTop) newActiveStep = section.step;
                    } else if (scrollPosition < sectionTop && i === 0) newActiveStep = 1;
                }
            }
            const lastStepElement = this.stepSectionsMeta[this.stepSectionsMeta.length - 1]?.element;
            if (lastStepElement && scrollPosition >= lastStepElement.offsetTop + lastStepElement.offsetHeight) newActiveStep = this.stepSectionsMeta[this.stepSectionsMeta.length - 1].step;
            if (this.currentActiveStep !== newActiveStep) {
                if (newActiveStep === 2 && !this.selectedAnimal.type) { /* stay */ }
                else if (newActiveStep === 3 && !(this.selectedAnimal.type && this.selectedPrepStyle.value && this.selectedPackaging.value)) { /* stay */ }
                else if (newActiveStep === 4 && !this.isLogisticsStepComplete()) { /* stay */ }
                else { this.currentActiveStep = newActiveStep; this.focusOnRef(this.stepSectionsMeta[newActiveStep - 1].titleRef); }
            }
        },
        updateCities() { /* ... (same as before) ... */
            const gov = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
            this.availableCities = gov?.cities || []; this.deliveryCity = '';
        },
        getFormattedPrice(price, currency) { /* ... (same as before) ... */
            const c = currency || this.currentCurrency; const r = (this.appSettings.exchange_rates || {})[c];
            return (price == null || !r || typeof r.rate_from_egp !== 'number') ? `${r?.symbol || '?'} ---` : `${r.symbol} ${(price * r.rate_from_egp).toFixed(2)}`;
        },
        isValidEmail: email => (!email || !email.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), // Allow empty optional email
        isValidPhone: phone => /^\+?[0-9\s\-()]{7,20}$/.test(phone), // Basic international phone validation

        scrollToSection: sel => { /* ... (same as before) ... */
            const element = document.querySelector(sel);
            if (element) {
                const headerOffset = (document.querySelector('.site-header')?.offsetHeight || 0) + (document.querySelector('.stepper-outer-wrapper')?.offsetHeight || 0);
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        },
        updateStepperState(step) {
            this.clearAllErrors(); // Clear errors when manually changing step via stepper
            let canProceed = true;
            if (step > 1 && !this.selectedAnimal.type) { canProceed = false; this.currentActiveStep = 1; }
            else if (step > 2 && !(this.selectedAnimal.type && this.selectedPrepStyle.value && this.selectedPackaging.value)) { canProceed = false; this.currentActiveStep = 2;}
            else if (step > 3 && !this.isLogisticsStepComplete(false)) { canProceed = false; this.currentActiveStep = 3; } // Don't show errors here

            if (canProceed) {
                this.currentActiveStep = step;
                this.focusOnRef(this.stepSectionsMeta[step - 1].titleRef);
                this.scrollToSection(this.stepSectionsMeta[step-1].id || '#udheya-booking-form-panel');
            } else {
                 this.scrollToSection(this.stepSectionsMeta[this.currentActiveStep-1].id || '#udheya-booking-form-panel');
            }
        },
        selectAnimal(cardEl, key) { /* ... (same as before, added clearError) ... */
            this.clearError('animal');
            const animal = this.productOptions.livestock.find(a => a.value_key === key);
            const sel = cardEl.querySelector('.livestock-weight-select');
            if (!animal || !sel || !sel.value) { this.setError('animal', 'select'); this.focusOnRef(sel.id.includes('baladi') ? 'baladiWeightSelect' : 'barkiWeightSelect'); return; }
            const wp = animal.weights_prices.find(w => w.weight_range === sel.value);
            if (!wp || !wp.is_active || (wp.stock != null && wp.stock <= 0)) {
                this.setError('animal', {en: `${animal.name_en || 'Selected animal'} (${sel.value}) is out of stock.`, ar: `${animal.name_ar || 'الحيوان المختار'} (${sel.value}) غير متوفر.`});
                this.updateAllDisplayedPrices(); return;
            }
            this.selectedAnimal = { type: animal.value_key, value: animal.value_key, weight: wp.weight_range, basePriceEGP: parseFloat(wp.price_egp), stock: wp.stock, originalStock: wp.stock, nameEN: animal.name_en, nameAR: animal.name_ar, pbId: animal.pbId };
            this.calculateTotalPrice();
            this.$nextTick(() => { this.updateStepperState(2); });
        },
        isLivestockWeightOutOfStock(selEl, key) { /* ... (same as before) ... */
             const animal = this.productOptions.livestock.find(a => a.value_key === key);
            if (!animal || !selEl || !selEl.value) return true;
            const wp = animal.weights_prices.find(w => w.weight_range === selEl.value);
            return !wp || !wp.is_active || (wp.stock != null && wp.stock <= 0);
        },
        updateSelectedPrepStyle(value) { /* ... (same as before) ... */
            const style = this.productOptions.preparationStyles.find(s => s.value === value);
            if (style) this.selectedPrepStyle = { ...style };
            else this.selectedPrepStyle = { value: '', nameEN: '', nameAR: '', is_custom: false };
            this.calculateTotalPrice();
        },
        updateSelectedPackaging(value) { /* ... (same as before) ... */
            const pkg = this.productOptions.packagingOptions.find(p => p.value === value);
            if (pkg) this.selectedPackaging = { ...pkg, addonPriceEGP: parseFloat(pkg.addonPriceEGP || 0) };
            else this.selectedPackaging = { value: '', addonPriceEGP: 0, nameEN: '', nameAR: '' };
            this.calculateTotalPrice();
        },

        validateStep2() { // Prep & Pack
            this.clearError('prepStyle'); this.clearError('packaging');
            let isValid = true;
            if (!this.selectedPrepStyle.value) { this.setError('prepStyle', 'select'); this.focusOnRef('prepStyleSelect'); isValid = false; }
            if (!this.selectedPackaging.value) { this.setError('packaging', 'select'); if(isValid) this.focusOnRef('packagingSelect'); isValid = false; }
            return isValid;
        },
        validateAndProceedToLogistics() {
            if (this.validateStep2()) {
                this.$nextTick(() => { this.updateStepperState(3); });
            } else {
                this.scrollToSection('#step2-content'); // Stay and show errors
            }
        },

        isLogisticsStepComplete(showErrors = false) {
            if(showErrors) this.clearAllErrors(); // Clear previous errors before re-validating this step
            let isValid = true;
            let firstErrorRef = null;

            const setValidationError = (field, type, ref) => {
                if(showErrors) this.setError(field, type);
                isValid = false;
                if(showErrors && !firstErrorRef) firstErrorRef = ref;
            };

            if (this.distributionChoice === 'split') {
                if (!this.splitDetailsOption) setValidationError('splitDetails', 'select', 'distributionChoiceRadios');
                else if (this.splitDetailsOption === 'custom' && !(this.customSplitDetailsText || "").trim()) setValidationError('splitDetails', 'required', 'customSplitTextarea');
            }
            if (this._needsDeliveryDetails) {
                if (!this.deliveryName?.trim()) setValidationError('deliveryName', 'required', 'deliveryNameInput');
                if (!this.deliveryPhone?.trim()) setValidationError('deliveryPhone', 'required', 'deliveryPhoneInput');
                else if (!this.isValidPhone(this.deliveryPhone.trim())) setValidationError('deliveryPhone', 'phone', 'deliveryPhoneInput');
                if (this.customerEmail?.trim() && !this.isValidEmail(this.customerEmail.trim())) setValidationError('customerEmail', 'email', 'customerEmailInput');
                if (!this.selectedGovernorate) setValidationError('selectedGovernorate', 'select', 'deliveryGovernorateSelect');
                const gov = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
                if (gov && gov.cities?.length > 0 && !this.deliveryCity) setValidationError('deliveryCity', 'select', 'deliveryCitySelect');
                if (!this.deliveryAddress?.trim()) setValidationError('deliveryAddress', 'required', 'deliveryAddressInput');
            }
            if(showErrors && firstErrorRef) this.focusOnRef(firstErrorRef);
            return isValid;
        },
        validateAndProceedToReview() {
            if (this.isLogisticsStepComplete(true)) { // Pass true to show errors
                this.$nextTick(() => { this.updateStepperState(4); });
            } else {
                this.scrollToSection('#step3-content'); // Stay and show errors
            }
        },
        validateStep4() { // Review & Payment
            this.clearError('paymentMethod');
            let isValid = true;
            if(!this.paymentMethod) {
                this.setError('paymentMethod', 'select');
                this.focusOnRef('paymentMethodRadios'); // Assuming this x-ref exists on the container
                isValid = false;
            }
            return isValid;
        },

        updateSacrificeDayTexts() { /* ... (same as before, use correct ID 'sacrifice_day_select_s3') ... */
            const opt = document.querySelector(`#sacrifice_day_select_s3 option[value="${this.selectedSacrificeDay.value}"]`);
            if (opt) Object.assign(this.selectedSacrificeDay, { textEN: opt.dataset.en, textAR: opt.dataset.ar });
        },
        calculateTotalPrice() { /* ... (same as before) ... */
            this.totalPriceEGP = (this.selectedAnimal.basePriceEGP || 0) + (this.selectedPackaging.addonPriceEGP || 0);
        },
        updateAllDisplayedPrices() { /* ... (same as before) ... */
             (this.productOptions.livestock || []).forEach(animal => {
                const card = document.getElementById(animal.value_key);
                const sel = card?.querySelector('.livestock-weight-select');
                if (!card || !sel) return;
                const curVal = sel.value; sel.innerHTML = ''; let firstAvail = null, curAvail = false;
                (animal.weights_prices || []).forEach(wp => {
                    const opt = document.createElement('option'); opt.value = wp.weight_range;
                    const oos = !wp.is_active || (wp.stock != null && wp.stock <= 0);
                    opt.textContent = `${wp.weight_range} (${this.getFormattedPrice(wp.price_egp)})${oos ? ' - Out of Stock' : (wp.stock != null ? ` - Stock: ${wp.stock}` : '')}`;
                    opt.disabled = oos; sel.appendChild(opt);
                    if (!oos && firstAvail === null) firstAvail = wp.weight_range;
                    if (wp.weight_range === curVal && !oos) curAvail = true;
                });
                sel.value = curAvail ? curVal : (firstAvail || (sel.options.length ? sel.options[0].value : ''));
                const fA = (animal.weights_prices || []).find(wp => wp.is_active && (wp.stock == null || wp.stock > 0));
                const price = fA ? fA.price_egp : ((animal.weights_prices || [])[0]?.price_egp || 0);
                const priceEnSpan = card.querySelector('.price.bil-row .en span');
                const priceArSpan = card.querySelector('.price.bil-row .ar span');
                if(priceEnSpan) priceEnSpan.textContent = this.getFormattedPrice(price);
                if(priceArSpan) priceArSpan.textContent = this.getFormattedPrice(price);
            });
            this.calculateTotalPrice();
        },

        async validateAndSubmitBooking() {
            this.clearAllErrors();
            if (!this.selectedAnimal.type) { this.setError('animal', 'select'); this.updateStepperState(1); this.scrollToSection('#step1-content'); this.focusOnRef('baladiWeightSelect'); return; }
            if (!this.validateStep2()) { this.updateStepperState(2); this.scrollToSection('#step2-content'); return; }
            if (!this.isLogisticsStepComplete(true)) { this.updateStepperState(3); this.scrollToSection('#step3-content'); return; } // Show errors for logistics
            if (!this.validateStep4()) { this.updateStepperState(4); this.scrollToSection('#step4-content'); return; } // Validate payment method


            const animal = this.productOptions.livestock.find(a => a.value_key === this.selectedAnimal.value);
            const wpData = animal?.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight);
            if (!animal || !wpData || !wpData.is_active || (wpData.stock != null && wpData.stock <= 0)) {
                this.setError('animal', {en: `Sorry, ${this.selectedAnimal.nameEN || 'item'} is no longer available.`, ar: `عذراً، ${this.selectedAnimal.nameAR || 'المنتج'} لم يعد متوفراً.`});
                this.selectedAnimal = { ...initialBookingFormState.selectedAnimal }; this.updateAllDisplayedPrices();
                this.updateStepperState(1); this.scrollToSection('#step1-content'); return;
            }

            this.isLoading.booking = true; this.apiError = null; this.userFriendlyApiError = ''; this.calculateTotalPrice();
            const p = this;
            const payload = { /* ... (same payload as before) ... */
                booking_id_text: `SL-UDHY-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9e4)+1e4).padStart(5,'0')}`,
                animal_type_key: p.selectedAnimal.value, animal_type_name_en: p.selectedAnimal.nameEN, animal_type_name_ar: p.selectedAnimal.nameAR,
                animal_weight_selected: p.selectedAnimal.weight, animal_base_price_egp: p.selectedAnimal.basePriceEGP,
                preparation_style_value: p.selectedPrepStyle.value, preparation_style_name_en: p.selectedPrepStyle.nameEN, preparation_style_name_ar: p.selectedPrepStyle.nameAR,
                is_custom_prep: p.selectedPrepStyle.is_custom, custom_prep_details: p.selectedPrepStyle.is_custom ? p.customPrepDetails : "",
                packaging_value: p.selectedPackaging.value, packaging_name_en: p.selectedPackaging.nameEN, packaging_name_ar: p.selectedPackaging.nameAR,
                packaging_addon_price_egp: p.selectedPackaging.addonPriceEGP, total_price_egp: p.totalPriceEGP,
                sacrifice_day_value: p.selectedSacrificeDay.value, time_slot: p.selectedTimeSlot,
                distribution_choice: p.distributionChoice,
                split_details_option: p.distributionChoice === 'split' ? p.splitDetailsOption : "",
                custom_split_details_text: (p.distributionChoice === 'split' && p.splitDetailsOption === 'custom') ? p.customSplitDetailsText : "",
                niyyah_names: p.niyyahNames, customer_email: p.customerEmail, group_purchase_interest: p.groupPurchase,
                delivery_name: p._needsDeliveryDetails ? p.deliveryName : "", delivery_phone: p._needsDeliveryDetails ? p.deliveryPhone : "",
                delivery_governorate_id: p._needsDeliveryDetails ? p.selectedGovernorate : "", delivery_city_id: p._needsDeliveryDetails ? p.deliveryCity : "",
                delivery_address: p._needsDeliveryDetails ? p.deliveryAddress : "", delivery_instructions: p._needsDeliveryDetails ? p.deliveryInstructions : "",
                payment_method: p.paymentMethod, payment_status: (p.paymentMethod === 'cod' && p._needsDeliveryDetails) ? 'cod_pending' : 'pending',
                booking_status: 'confirmed_pending_payment',
            };

            try {
                const booking = await pbFetch('bookings', { fetchOptions: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }});
                this.bookingID = booking.booking_id_text || booking.id;
                if (wpData.stock != null && wpData.stock > 0) { wpData.stock--; this.updateAllDisplayedPrices(); }
                this.bookingConfirmed = true; this.$nextTick(() => { this.scrollToSection('#step5-booking-confirmation'); this.focusOnRef('bookingConfirmedTitle'); });
            } catch (error) {
                this.apiError = error.message;
                this.userFriendlyApiError = "There was an issue submitting your booking. Please review your details or try again. If the problem persists, contact support.";
                this.scrollToSection('.global-error-indicator');
            } finally { this.isLoading.booking = false; }
        },
        async checkBookingStatus() { /* ... (same as before, with userFriendlyApiError) ... */
            this.statusResult = null; this.statusNotFound = false; this.isLoading.status = true; this.apiError = null; this.userFriendlyApiError = '';
            this.clearError('lookupBookingID');
            const id = (this.lookupBookingID || "").trim();
            if (!id) { this.setError('lookupBookingID', 'required'); this.focusOnRef('lookupBookingIdInput'); this.isLoading.status = false; return; }
            try {
                const data = await pbFetch('bookings', { params: `filter=(booking_id_text='${encodeURIComponent(id)}')&perPage=1` });
                if (data.items && data.items.length > 0) {
                    const b = data.items[0];
                    this.statusResult = { booking_id_text: b.booking_id_text || b.id, status: b.booking_status || 'Unknown', animal_type: b.animal_type_name_en || b.animal_type_key, animal_weight_selected: b.animal_weight_selected, sacrifice_day: b.sacrifice_day_value, time_slot: b.time_slot };
                } else { this.statusNotFound = true; }
            } catch (error) {
                this.apiError = error.message;
                this.userFriendlyApiError = "Could not retrieve booking status. Please check the ID or try again later.";
                this.statusNotFound = true; // Show "not found" or error message area
            } finally { this.isLoading.status = false; }
             // SECURITY NOTE for booking status check:
             // The current method relies on filtering by `booking_id_text`.
             // For enhanced security, PocketBase API rules for the `bookings` collection's `listRule`
             // MUST be carefully configured to:
             // 1. ONLY allow access if the filter is precisely `booking_id_text = "PROVIDED_ID_FROM_USER"`.
             // 2. Ideally, only return a limited, non-sensitive set of fields for this public lookup.
             // A more secure method involves generating a unique, unguessable "status access token" per booking
             // and using a custom PocketBase API view/endpoint for status checks, making the main `bookings`
             // collection's `listRule` admin-only or restricted to authenticated record owners.
        },
        getSacrificeDayText(val) { /* ... (same as before, use correct ID 'sacrifice_day_select_s3') ... */
            const opt = document.querySelector(`#sacrifice_day_select_s3 option[value="${val}"]`);
            return opt ? { en: opt.dataset.en, ar: opt.dataset.ar } : { en: val, ar: val };
        },
        resetAndStartOver() { /* ... (same as before, added clearAllErrors and focus) ... */
            Object.assign(this, JSON.parse(JSON.stringify(initialBookingFormState)), {
                bookingConfirmed: false, bookingID: '', lookupBookingID: '', statusResult: null, statusNotFound: false,
                currentActiveStep: 1, isMobileMenuOpen: false, apiError: null, userFriendlyApiError: '',
                calculatedPromoDaysLeft: 0, promoHasEnded: false, errors: {}
            });
            if(this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            this.initApp(); // Re-init to fetch fresh data and set up watchers
            this.$nextTick(() => { this.scrollToSection('#udheya-booking-start'); this.focusOnRef('bookingSectionTitle'); });
        }
    }));
});
