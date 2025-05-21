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
                try {
                    const errorData = await response.json();
                    if (errorData && typeof errorData.data === 'object' && errorData.data !== null) {
                        errorDataMessage = Object.values(errorData.data).map(e => e.message || JSON.stringify(e)).join('; ');
                    } else if (errorData && errorData.message) { errorDataMessage = errorData.message; }
                } catch (e) { /* ignore */ }
                throw new Error(`API Error (${collection} ${recordId || params}): ${response.status} ${errorDataMessage}`);
            }
            return response.json();
        } catch (networkError) {
             throw new Error(`Network Error: Could not connect to API. (${networkError.message})`);
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
        currentLang: 'en',
        errors: {},
        errorMessages: {
            required: { en: "This field is required.", ar: "هذا الحقل مطلوب." },
            select: { en: "Please make a selection.", ar: "يرجى الاختيار." },
            email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." },
            phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." }
        },

        setError(field, typeOrMessage) {
            if (typeof typeOrMessage === 'string') {
                this.errors[field] = this.errorMessages[typeOrMessage] || this.errorMessages.required;
            } else { this.errors[field] = typeOrMessage; }
        },
        clearError(field) { if (this.errors[field]) this.$delete(this.errors, field); },
        clearAllErrors() { this.errors = {}; },
        focusOnRef(refName) { this.$nextTick(() => { if (this.$refs[refName]) { this.$refs[refName].focus({preventScroll:false}); setTimeout(() => this.$refs[refName].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }), 50); } }); },

        get _needsDeliveryDetails() {
            const customText = (this.customSplitDetailsText || '').toLowerCase();
            return this.distributionChoice === 'me' || (this.distributionChoice === 'split' && (
                   ['1/3_me_2/3_charity_sl', '1/2_me_1/2_charity_sl', '2/3_me_1/3_charity_sl', 'all_me_custom_distro'].includes(this.splitDetailsOption) ||
                   (this.splitDetailsOption === 'custom' && (customText.includes('for me') || customText.includes('all delivered to me'))) ));
        },
        get splitDetails() {
            if (this.distributionChoice !== 'split') return '';
            if (this.splitDetailsOption === 'custom') return (this.customSplitDetailsText || "").trim();
            return {
                '1/3_me_2/3_charity_sl': '1/3 for me (delivered), 2/3 for charity (by Sheep Land)',
                '1/2_me_1/2_charity_sl': '1/2 for me (delivered), 1/2 for charity (by Sheep Land)',
                '2/3_me_1/3_charity_sl': '2/3 for me (delivered), 1/3 for charity (by Sheep Land)',
                'all_me_custom_distro': 'All for me (for my own distribution)'
            }[this.splitDetailsOption] || this.splitDetailsOption;
        },
        _getDeliveryLocation(lang) {
            const key = lang === 'en' ? 'name_en' : 'name_ar';
            const govObj = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
            const cityObj = govObj?.cities?.find(c => c.id === this.deliveryCity);
            if (cityObj) return cityObj[key];
            if (govObj && govObj.cities?.length === 0 && this.selectedGovernorate) return govObj[key];
            if (govObj && !cityObj && this.selectedGovernorate) return `${govObj[key]} (${lang === 'en' ? 'City not selected' : 'المدينة غير مختارة'})`;
            return '';
        },
        get summaryDeliveryToEN() {
            if (this.distributionChoice === 'char') return 'Charity Distribution by Sheep Land';
            if (this._needsDeliveryDetails) {
                const name = (this.deliveryName || "").trim(); const phone = (this.deliveryPhone || "").trim();
                const gov = this.selectedGovernorate; const city = this.deliveryCity;
                const address = (this.deliveryAddress || "").trim();
                const govObj = (this.appSettings.delivery_areas || []).find(g => g.id === gov);
                const cityRequiredAndMissing = govObj && govObj.cities?.length > 0 && !city;
                if (!name || !phone || !gov || cityRequiredAndMissing || !address) return 'Delivery Details Incomplete';
                const location = this._getDeliveryLocation('en');
                const addressSummary = address ? (address.substring(0,20) + (address.length > 20 ? '...' : '')) : '';
                return [name, location, addressSummary].filter(Boolean).join(', ');
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
                const cityRequiredAndMissing = govObj && govObj.cities?.length > 0 && !city;
                if (!name || !phone || !gov || cityRequiredAndMissing || !address) return 'تفاصيل التوصيل غير مكتملة';
                const location = this._getDeliveryLocation('ar');
                const addressSummary = address ? (address.substring(0,20) + (address.length > 20 ? '...' : '')) : '';
                return [name, location, addressSummary].filter(Boolean).join('، ');
            }
            return 'استلام ذاتي / توزيع حسب التقسيم';
        },
        get summaryDistributionEN() { return (this.distributionChoice === 'me') ? 'All to me' : (this.distributionChoice === 'char' ? 'All to charity (by Sheep Land)' : `Split: ${(this.splitDetails || "").trim() || '(Not specified)'}`); },
        get summaryDistributionAR() { return (this.distributionChoice === 'me') ? 'الكل لي (لتوزيعه بنفسك)' : (this.distributionChoice === 'char' ? 'تبرع بالكل للصدقة (أرض الأغنام توزع نيابة عنك)' : `تقسيم الحصص: ${(this.splitDetails || "").trim() || '(لم يحدد)'}`); },

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
                    console.warn("Global app settings ('global_config') not found in DB. Using defaults. Consider running the seeder if this is a new setup: index.html?run_db_seed=true");
                }
                this.productOptions.livestock = livestockData.items.map(item => ({
                    pbId: item.id, value_key: item.value_key, name_en: item.name_en, name_ar: item.name_ar,
                    weights_prices: Array.isArray(item.weights_prices) ? item.weights_prices.map(wp => ({...wp})) : []
                }));
            } catch (error) {
                this.apiError = error.message;
                this.userFriendlyApiError = error.message.includes('Network Error') ? error.message : 'Failed to load application settings. Please refresh or try again later.';
                this.appSettings = JSON.parse(JSON.stringify(initialDefaultAppSettings));
                 console.error("Error fetching initial app data:", error);
            } finally { this.isLoading.init = false; }

            this.startOfferDHDMSCountdown();
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') this.startOfferDHDMSCountdown();
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
                this.clearError('splitDetails');
            });
            this.$watch('selectedPrepStyle.value', () => { if (!this.selectedPrepStyle.is_custom) this.customPrepDetails = ''; });
            this.$watch('splitDetailsOption', val => { if (val !== 'custom') this.customSplitDetailsText = ''; this.clearError('splitDetails'); });
            this.$watch('selectedGovernorate', () => { this.updateCities(); this.clearError('deliveryCity');});

            this.stepSectionsMeta = ['#step1-content', '#step2-content', '#step3-content', '#step4-content', '#step5-content']
                .map((id, index) => ({ id, step: index + 1, element: document.querySelector(id), titleRef: `step${index+1}Title`, firstFocusableErrorRef: null }));
            this.$nextTick(() => {
                this.handleScroll();
                const initialFocusTarget = this.bookingConfirmed ? 'bookingConfirmedTitle' : (this.$refs.step1Title ? 'step1Title' : 'bookingSectionTitle');
                this.focusOnRef(initialFocusTarget);
            });
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        },

        startOfferDHDMSCountdown() {
            if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            if (!this.appSettings.promo_is_active || !this.appSettings.promo_end_date) {
                this.countdown.ended = true; this.promoHasEnded = true; this.calculatedPromoDaysLeft = 0; return;
            }
            const endDate = new Date(this.appSettings.promo_end_date).getTime();
            this.updateDHDMSCountdownDisplay(endDate);
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
                let canScrollToStep = true;
                for(let i=1; i < newActiveStep; i++) { if (!this.currentStepCompleted(i, false)) { canScrollToStep = false; break; } }
                if (canScrollToStep) this.currentActiveStep = newActiveStep;
            }
        },
        updateCities() {
            const gov = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
            this.availableCities = gov?.cities || []; this.deliveryCity = '';
        },
        getFormattedPrice(price, currency) {
            const c = currency || this.currentCurrency; const r = (this.appSettings.exchange_rates || {})[c];
            return (price == null || !r || typeof r.rate_from_egp !== 'number') ? `${r?.symbol || '?'} ---` : `${r.symbol} ${(price * r.rate_from_egp).toFixed(2)}`;
        },
        isValidEmail: email => (!email || !email.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        isValidPhone: phone => phone && /^\+?[0-9\s\-()]{7,20}$/.test(phone.trim()),
        scrollToSection: sel => {
            const element = document.querySelector(sel);
            if (element) {
                const headerOffset = (document.querySelector('.site-header')?.offsetHeight || 0) + (document.querySelector('.stepper-outer-wrapper')?.offsetHeight || 0);
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        },

        navigateToStep(targetStep) {
            this.clearAllErrors();
            for (let i = 1; i < targetStep; i++) {
                if (!this.currentStepCompleted(i, true)) { 
                    this.currentActiveStep = i;
                    this.scrollToSection(this.stepSectionsMeta[i-1].id || '#udheya-booking-form-panel');
                    return;
                }
            }
            this.currentActiveStep = targetStep;
            this.focusOnRef(this.stepSectionsMeta[targetStep - 1]?.titleRef);
            this.scrollToSection(this.stepSectionsMeta[targetStep-1].id || '#udheya-booking-form-panel');
        },

        currentStepCompleted(stepNumber, showErrorsIfCurrent = true) {
            let isValid = false;
            const isCurrentValidatingStep = showErrorsIfCurrent && this.currentActiveStep === stepNumber;
            switch (stepNumber) {
                case 1: isValid = this.validateStep1(isCurrentValidatingStep); break;
                case 2: isValid = this.validateStep2(isCurrentValidatingStep); break;
                case 3: isValid = this.validateStep3(isCurrentValidatingStep); break;
                case 4: isValid = this.validateStep4(isCurrentValidatingStep); break;
                case 5: isValid = this.validateStep5(isCurrentValidatingStep); break; 
                default: isValid = false;
            }
            if (isValid && isCurrentValidatingStep && this.stepSectionsMeta[stepNumber-1]) {
                this.stepSectionsMeta[stepNumber-1].firstFocusableErrorRef = null;
            }
            return isValid;
        },

        validateAndProceedToStep(nextStep) {
            this.clearAllErrors();
            let isValidCurrentStep = this.currentStepCompleted(this.currentActiveStep, true);

            if (isValidCurrentStep) {
                if (nextStep <= this.stepSectionsMeta.length) {
                    this.currentActiveStep = nextStep;
                    this.focusOnRef(this.stepSectionsMeta[nextStep - 1]?.titleRef);
                    this.scrollToSection(this.stepSectionsMeta[nextStep-1].id || '#udheya-booking-form-panel');
                }
            } else {
                this.scrollToSection(this.stepSectionsMeta[this.currentActiveStep-1].id || '#udheya-booking-form-panel');
            }
        },

        validateStep1(showErrors = true) {
            if(showErrors) this.clearError('animal');
            let firstErrorRef = null;
            if (!this.selectedAnimal.type) {
                if(showErrors) { this.setError('animal', 'select'); firstErrorRef = this.$refs.baladiWeightSelect?.closest('.livestock-card') ? 'baladiWeightSelect' : 'barkiWeightSelect'; this.focusOnRef(firstErrorRef);}
                if(this.stepSectionsMeta[0]) this.stepSectionsMeta[0].firstFocusableErrorRef = firstErrorRef;
                return false;
            }
            if(this.stepSectionsMeta[0]) this.stepSectionsMeta[0].firstFocusableErrorRef = null;
            return true;
        },
        validateStep2(showErrors = true) { 
            if(showErrors) { this.clearError('prepStyle'); this.clearError('packaging'); }
            let isValid = true; let firstErrorRef = null;
            if (!this.selectedPrepStyle.value) {
                if(showErrors) {this.setError('prepStyle', 'select'); if(!firstErrorRef) firstErrorRef = 'prepStyleSelect';} isValid = false;
            }
            if (!this.selectedPackaging.value) {
                if(showErrors) {this.setError('packaging', 'select'); if(!firstErrorRef) firstErrorRef = 'packagingSelect';} isValid = false;
            }
            if(showErrors && firstErrorRef) this.focusOnRef(firstErrorRef);
            if(this.stepSectionsMeta[1]) this.stepSectionsMeta[1].firstFocusableErrorRef = firstErrorRef;
            return isValid;
        },
        validateStep3(showErrors = true) { 
            if(this.stepSectionsMeta[2]) this.stepSectionsMeta[2].firstFocusableErrorRef = null; return true;
        },
        validateStep4(showErrors = true) { 
            if(showErrors) { this.clearError('splitDetails'); this.clearError('deliveryName'); this.clearError('deliveryPhone'); this.clearError('customerEmail'); this.clearError('selectedGovernorate'); this.clearError('deliveryCity'); this.clearError('deliveryAddress');}
            let isValid = true; let firstErrorRef = null;
            const setValError = (f, t, r) => { if(showErrors) this.setError(f,t); isValid=false; if(showErrors && !firstErrorRef) firstErrorRef=r;};

            if (this.distributionChoice === 'split') {
                if (!this.splitDetailsOption) setValError('splitDetails', 'select', 'distributionChoiceRadios');
                else if (this.splitDetailsOption === 'custom' && !(this.customSplitDetailsText || "").trim()) setValError('splitDetails', 'required', 'customSplitTextarea');
            }
            if (this._needsDeliveryDetails) {
                if (!this.deliveryName?.trim()) setValError('deliveryName', 'required', 'deliveryNameInput');
                if (!this.deliveryPhone?.trim()) setValError('deliveryPhone', 'required', 'deliveryPhoneInput');
                else if (!this.isValidPhone(this.deliveryPhone.trim())) setValError('deliveryPhone', 'phone', 'deliveryPhoneInput');
                if (this.customerEmail?.trim() && !this.isValidEmail(this.customerEmail.trim())) setValError('customerEmail', 'email', 'customerEmailInput');
                if (!this.selectedGovernorate) setValError('selectedGovernorate', 'select', 'deliveryGovernorateSelect');
                const gov = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
                if (gov && gov.cities?.length > 0 && !this.deliveryCity) setValError('deliveryCity', 'select', 'deliveryCitySelect');
                if (!this.deliveryAddress?.trim()) setValError('deliveryAddress', 'required', 'deliveryAddressInput');
            }
            if(showErrors && firstErrorRef) this.focusOnRef(firstErrorRef);
            if(this.stepSectionsMeta[3]) this.stepSectionsMeta[3].firstFocusableErrorRef = firstErrorRef;
            return isValid;
        },
        validateStep5(showErrors = true) { 
            if(showErrors) this.clearError('paymentMethod');
            let firstErrorRef = null;
            if(!this.paymentMethod) {
                if(showErrors) {this.setError('paymentMethod', 'select'); firstErrorRef = 'paymentMethodRadios'; this.focusOnRef(firstErrorRef);}
                if(this.stepSectionsMeta[4]) this.stepSectionsMeta[4].firstFocusableErrorRef = firstErrorRef;
                return false;
            }
            if(this.stepSectionsMeta[4]) this.stepSectionsMeta[4].firstFocusableErrorRef = null;
            return true;
        },

        selectAnimal(cardEl, key) {
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
            this.validateAndProceedToStep(2); 
        },
        isLivestockWeightOutOfStock(selEl, key) {
            const animal = this.productOptions.livestock.find(a => a.value_key === key);
            if (!animal || !selEl || !selEl.value) return true;
            const wp = animal.weights_prices.find(w => w.weight_range === selEl.value);
            return !wp || !wp.is_active || (wp.stock != null && wp.stock <= 0);
        },
        updateSelectedPrepStyle(value) {
            const style = this.productOptions.preparationStyles.find(s => s.value === value);
            if (style) this.selectedPrepStyle = { ...style };
            else this.selectedPrepStyle = { value: '', nameEN: '', nameAR: '', is_custom: false };
            this.calculateTotalPrice();
        },
        updateSelectedPackaging(value) {
            const pkg = this.productOptions.packagingOptions.find(p => p.value === value);
            if (pkg) this.selectedPackaging = { ...pkg, addonPriceEGP: parseFloat(pkg.addonPriceEGP || 0) };
            else this.selectedPackaging = { value: '', addonPriceEGP: 0, nameEN: '', nameAR: '' };
            this.calculateTotalPrice();
        },
        updateSacrificeDayTexts() {
            const opt = document.querySelector(`#sacrifice_day_select_s3 option[value="${this.selectedSacrificeDay.value}"]`);
            if (opt) Object.assign(this.selectedSacrificeDay, { textEN: opt.dataset.en, textAR: opt.dataset.ar });
        },
        calculateTotalPrice() { this.totalPriceEGP = (this.selectedAnimal.basePriceEGP || 0) + (this.selectedPackaging.addonPriceEGP || 0); },
        updateAllDisplayedPrices() {
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
            if (!this.currentStepCompleted(1, true)) { this.navigateToStep(1); return; }
            if (!this.currentStepCompleted(2, true)) { this.navigateToStep(2); return; }
            if (!this.currentStepCompleted(3, true)) { this.navigateToStep(3); return; }
            if (!this.currentStepCompleted(4, true)) { this.navigateToStep(4); return; }
            if (!this.currentStepCompleted(5, true)) { this.navigateToStep(5); return; }

            const animal = this.productOptions.livestock.find(a => a.value_key === this.selectedAnimal.value);
            const wpData = animal?.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight);
            if (!animal || !wpData || !wpData.is_active || (wpData.stock != null && wpData.stock <= 0)) {
                this.setError('animal', {en: `Sorry, ${this.selectedAnimal.nameEN || 'item'} is no longer available.`, ar: `عذراً، ${this.selectedAnimal.nameAR || 'المنتج'} لم يعد متوفراً.`});
                this.selectedAnimal = { ...initialBookingFormState.selectedAnimal }; this.updateAllDisplayedPrices();
                this.navigateToStep(1); return;
            }

            this.isLoading.booking = true; this.apiError = null; this.userFriendlyApiError = ''; this.calculateTotalPrice();
            const p = this;
            const payload = {
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
                this.bookingConfirmed = true; this.$nextTick(() => { this.scrollToSection('#booking-confirmation-section'); this.focusOnRef('bookingConfirmedTitle'); });
            } catch (error) {
                this.apiError = error.message;
                this.userFriendlyApiError = error.message.includes('Network Error') ? error.message : "There was an issue submitting your booking. Please review your details or try again. If the problem persists, contact support.";
                this.scrollToSection('.global-error-indicator');
            } finally { this.isLoading.booking = false; }
        },
        async validateAndCheckBookingStatus() {
            this.clearError('lookupBookingID');
            if (!this.lookupBookingID?.trim()) {
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
                    this.statusResult = { booking_id_text: b.booking_id_text || b.id, status: b.booking_status || 'Unknown', animal_type: b.animal_type_name_en || b.animal_type_key, animal_weight_selected: b.animal_weight_selected, sacrifice_day: b.sacrifice_day_value, time_slot: b.time_slot };
                } else { this.statusNotFound = true; }
            } catch (error) {
                this.apiError = error.message;
                this.userFriendlyApiError = error.message.includes('Network Error') ? error.message : "Could not retrieve booking status. Please check the ID or try again later.";
                this.statusNotFound = true;
            } finally { this.isLoading.status = false; }
        },
        getSacrificeDayText(val) {
            const opt = document.querySelector(`#sacrifice_day_select_s3 option[value="${val}"]`);
            return opt ? { en: opt.dataset.en, ar: opt.dataset.ar } : { en: val, ar: val };
        },
        resetAndStartOver() {
             Object.assign(this, JSON.parse(JSON.stringify(initialBookingFormState)), {
                bookingConfirmed: false, bookingID: '', lookupBookingID: '', statusResult: null, statusNotFound: false,
                currentActiveStep: 1, isMobileMenuOpen: false, apiError: null, userFriendlyApiError: '',
                countdown: { days: '00', hours: '00', minutes: '00', seconds: '00', ended: false },
                promoHasEnded: false, calculatedPromoDaysLeft: 0, errors: {}
            });
            if(this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            this.initApp();
            this.$nextTick(() => { this.scrollToSection('#udheya-booking-start'); this.focusOnRef('bookingSectionTitle'); });
        }
    }));
});

// ----- START: INLINE POCKETBASE SEEDER -----
(function() { 
    const SEEDER_QUERY_PARAM = 'run_db_seed';

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    if (getQueryParam(SEEDER_QUERY_PARAM) === 'true') {
        console.warn("==== INLINE POCKETBASE SEEDER: Query parameter found, attempting to seed database. ====");
        console.log("Ensure 'app_settings' and 'livestock_types' collections exist and 'Create Rule' is temporarily open for them.");

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

        async function runInlineSeed() {
            console.log("SEEDER: Starting inline data seed process...");
            let allSuccessful = true;

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
                        if (response.status === 404 && responseText.toLowerCase().includes("collection not found")) {
                             console.error(`SEEDER_ERROR: Collection '${record.collection}' not found. Cannot seed record: ${recordIdentifier}`);
                        } else {
                             console.error(`SEEDER_ERROR: Failed to create record in '${record.collection}': ${response.status} ${response.statusText} - ${responseText}. Record identifier: ${recordIdentifier}`);
                        }
                        allSuccessful = false;
                    } else {
                        console.log(`SEEDER_SUCCESS: Record created/updated in '${record.collection}'. Identifier: ${recordIdentifier}`);
                    }
                } catch (error) {
                    console.error(`SEEDER_EXCEPTION: Network or other error for record in '${record.collection}' (ID: ${recordIdentifier}):`, error);
                    allSuccessful = false;
                }
            }

            if (allSuccessful) {
                console.log("SEEDER: Inline data seed process finished successfully.");
            } else {
                console.warn("SEEDER: Inline data seed process finished, but some records may have failed. Check logs above.");
            }
            console.warn("SEEDER: IMPORTANT! Remember to re-secure your API rules in PocketBase if you opened them.");

            if (window.history.replaceState) {
                const cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({path: cleanURL}, '', cleanURL);
                console.log("SEEDER: Cleared seed query parameter from URL.");
            }
        }
        runInlineSeed();
    }
})();
// ----- END: INLINE POCKETBASE SEEDER -----
