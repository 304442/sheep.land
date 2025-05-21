document.addEventListener('alpine:init', () => {
    const initialBookingFormState = {
        selectedAnimal: { type: '', value: '', weight: '', basePriceEGP: 0, nameEN: '', nameAR: '', stock: null, pbId: null, originalStock: null },
        selectedPrepStyle: { value: '', nameEN: '', nameAR: '', is_custom: false }, customPrepDetails: '',
        selectedPackaging: { value: '', addonPriceEGP: 0, nameEN: '', nameAR: '' }, totalPriceEGP: 0,
        customerEmail: '', deliveryName: '', deliveryPhone: '', selectedGovernorate: '', deliveryCity: '', availableCities: [], deliveryAddress: '', deliveryInstructions: '',
        niyyahNames: '', splitDetailsOption: '', customSplitDetailsText: '', groupPurchase: false,
        selectedSacrificeDay: { value: 'day1_10_dhul_hijjah', textEN: 'Day 1 of Eid (10th Dhul Hijjah)', textAR: 'اليوم الأول (10 ذو الحجة)' },
        selectedTimeSlot: '8 AM-9 AM', distributionChoice: 'me', paymentMethod: 'fa', // Defaulted payment to Fawry as 'vi' was not in HTML
    };

    async function pbFetch(collection, options = {}) {
        const { recordId = '', params = '' } = options;
        const url = `/api/collections/${collection}/records${recordId ? `/${recordId}` : ''}${params ? `?${params}` : ''}`;
        const response = await fetch(url, options.fetchOptions);
        if (!response.ok) {
            let errorDataMessage = response.statusText;
            try {
                const errorData = await response.json();
                if (errorData && typeof errorData.data === 'object' && errorData.data !== null) {
                    errorDataMessage = JSON.stringify(errorData.data);
                } else if (errorData && errorData.message) { errorDataMessage = errorData.message; }
            } catch (e) { /* ignore */ }
            throw new Error(`API Error (${collection} ${recordId || params}): ${response.status} ${errorDataMessage}`);
        }
        return response.json();
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
        apiError: null,
        ...JSON.parse(JSON.stringify(initialBookingFormState)),
        bookingConfirmed: false, statusResult: null, statusNotFound: false, lookupBookingID: '', currentCurrency: 'EGP',
        bookingID: '', currentActiveStep: 1, isMobileMenuOpen: false,
        stepSectionsMeta: [],
        calculatedPromoDaysLeft: 0,
        currentLang: 'en', // Basic language toggle, 'en' or 'ar'
        countdown: { days: '00', hours: '00', minutes: '00', seconds: '00', ended: false },
        countdownTimerInterval: null,

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
                const name = (this.deliveryName || "").trim() || 'Recipient';
                const location = this._getDeliveryLocation('en');
                const address = (this.deliveryAddress || "").trim();
                const addressSummary = address ? (address.substring(0,20) + (address.length > 20 ? '...' : '')) : '';
                const parts = [name, location, addressSummary].filter(Boolean);
                const govObj = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
                const isGovCityValid = this.selectedGovernorate && ((govObj?.cities?.length === 0) || this.deliveryCity);
                return (parts.length > 1 && isGovCityValid && address && (this.deliveryName || "").trim()) ? parts.join(', ') : 'Delivery Details Incomplete';
            }
            return 'Self Pickup / Distribution as per split';
        },
        get summaryDeliveryToAR() {
            if (this.distributionChoice === 'char') return 'توزيع خيري بواسطة أرض الأغنام';
            if (this._needsDeliveryDetails) {
                const name = (this.deliveryName || "").trim() || 'المستلم';
                const location = this._getDeliveryLocation('ar');
                const address = (this.deliveryAddress || "").trim();
                const addressSummary = address ? (address.substring(0,20) + (address.length > 20 ? '...' : '')) : '';
                const parts = [name, location, addressSummary].filter(Boolean);
                const govObj = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
                const isGovCityValid = this.selectedGovernorate && ((govObj?.cities?.length === 0) || this.deliveryCity);
                return (parts.length > 1 && isGovCityValid && address && (this.deliveryName || "").trim()) ? parts.join('، ') : 'تفاصيل التوصيل غير مكتملة';
            }
            return 'استلام ذاتي / توزيع حسب التقسيم';
        },
        get summaryDistributionEN() { return (this.distributionChoice === 'me') ? 'All to me' : (this.distributionChoice === 'char' ? 'All to charity (by Sheep Land)' : `Split: ${(this.splitDetails || "").trim() || '(Not specified)'}`); },
        get summaryDistributionAR() { return (this.distributionChoice === 'me') ? 'الكل لي (لتوزيعه بنفسك)' : (this.distributionChoice === 'char' ? 'تبرع بالكل للصدقة (أرض الأغنام توزع نيابة عنك)' : `تقسيم الحصص: ${(this.splitDetails || "").trim() || '(لم يحدد)'}`); },

        async initApp() {
            this.isLoading.init = true;
            this.apiError = null;
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
                        if (fetchedSettings.hasOwnProperty(key) && key !== 'site_name') { // Exclude site_name
                            if (typeof fetchedSettings[key] === 'object' && fetchedSettings[key] !== null &&
                                newAppSettings[key] !== undefined && typeof newAppSettings[key] === 'object' && newAppSettings[key] !== null &&
                                !Array.isArray(fetchedSettings[key])) {
                                newAppSettings[key] = { ...newAppSettings[key], ...fetchedSettings[key] };
                            } else {
                                newAppSettings[key] = fetchedSettings[key];
                            }
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
                this.appSettings = JSON.parse(JSON.stringify(initialDefaultAppSettings));
            }
            finally {
                this.isLoading.init = false;
            }

            this.startOfferCountdown();
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.startOfferCountdown(); // Re-evaluate countdown on visibility
                } else {
                    if(this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
                }
            });

            this.currentCurrency = this.appSettings.default_currency || "EGP";
            this.updateSacrificeDayTexts();
            this.updateAllDisplayedPrices();

            this.$watch(['selectedAnimal.basePriceEGP', 'selectedPackaging.addonPriceEGP'], () => this.calculateTotalPrice());
            this.$watch('currentCurrency', () => { this.calculateTotalPrice(); this.updateAllDisplayedPrices(); });
            this.$watch('selectedSacrificeDay.value', () => this.updateSacrificeDayTexts());
            this.$watch('distributionChoice', val => {
                if (val !== 'split') { this.splitDetailsOption = ''; this.customSplitDetailsText = ''; }
                if (val === 'char') {
                    Object.assign(this, { deliveryName: '', deliveryPhone: '', selectedGovernorate: '', deliveryCity: '', deliveryAddress: '', deliveryInstructions: '', availableCities: [] });
                }
            });
            this.$watch('selectedPrepStyle.value', () => { if (!this.selectedPrepStyle.is_custom) this.customPrepDetails = ''; });
            this.$watch('splitDetailsOption', val => { if (val !== 'custom') this.customSplitDetailsText = ''; });
            this.$watch('selectedGovernorate', () => this.updateCities());

            this.stepSectionsMeta = ['#step1-content', '#step2-content', '#step3-content', '#step4-content']
                .map((id, index) => ({ id, step: index + 1, element: document.querySelector(id) }));

            this.$nextTick(() => { this.handleScroll(); });
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
            this.updateStepperState(1);
        },

        startOfferCountdown() {
            if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            if (!this.appSettings.promo_is_active || !this.appSettings.promo_end_date) {
                this.countdown.ended = true; this.calculatedPromoDaysLeft = 0; return;
            }
            const endDate = new Date(this.appSettings.promo_end_date).getTime();
            this.updateCountdownDisplay(endDate);
            this.countdownTimerInterval = setInterval(() => this.updateCountdownDisplay(endDate), 1000);
        },

        updateCountdownDisplay(endDate) {
            const now = new Date().getTime();
            const distance = endDate - now;

            if (distance < 0) {
                if(this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
                Object.assign(this.countdown, {days: '00', hours: '00', minutes: '00', seconds: '00', ended: true});
                this.calculatedPromoDaysLeft = 0; return;
            }
            this.countdown.ended = false;
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            Object.assign(this.countdown, {
                days: String(days).padStart(2, '0'), hours: String(hours).padStart(2, '0'),
                minutes: String(minutes).padStart(2, '0'), seconds: String(seconds).padStart(2, '0')
            });
            this.calculatedPromoDaysLeft = days > 0 ? days : (hours > 0 || minutes > 0 || seconds > 0 ? 1: 0);
        },

        handleScroll() {
            if (this.bookingConfirmed || !this.stepSectionsMeta.some(s => s.element)) return;
            const offset = (document.querySelector('.site-header')?.offsetHeight || 70) + (document.querySelector('.stepper-outer-wrapper')?.offsetHeight || 55) + 20;
            let newActiveStep = this.currentActiveStep;
            const scrollPosition = window.scrollY + offset;

            for (let i = 0; i < this.stepSectionsMeta.length; i++) {
                const section = this.stepSectionsMeta[i];
                if (section.element) {
                    const sectionTop = section.element.offsetTop;
                    const sectionBottom = sectionTop + section.element.offsetHeight;
                    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                        newActiveStep = section.step;
                        if (i === this.stepSectionsMeta.length - 1 && scrollPosition >= sectionTop) {
                           newActiveStep = section.step;
                        }
                    } else if (scrollPosition < sectionTop && i === 0) {
                        newActiveStep = 1;
                    }
                }
            }
            const lastStepElement = this.stepSectionsMeta[this.stepSectionsMeta.length - 1]?.element;
            if (lastStepElement && scrollPosition >= lastStepElement.offsetTop + lastStepElement.offsetHeight) {
                newActiveStep = this.stepSectionsMeta[this.stepSectionsMeta.length - 1].step;
            }

            if (this.currentActiveStep !== newActiveStep) {
                if (newActiveStep === 2 && !this.selectedAnimal.type) { /* stay */ }
                else if (newActiveStep === 3 && !(this.selectedAnimal.type && this.selectedPrepStyle.value && this.selectedPackaging.value)) { /* stay */ }
                else if (newActiveStep === 4 && !this.canProceedFromLogistics()) { /* stay */ }
                else { this.currentActiveStep = newActiveStep; }
            }
        },
        updateCities() {
            const gov = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
            this.availableCities = gov?.cities || []; this.deliveryCity = '';
        },
        getFormattedPrice(price, currency) {
            const c = currency || this.currentCurrency;
            const r = (this.appSettings.exchange_rates || {})[c];
            return (price == null || !r || typeof r.rate_from_egp !== 'number') ? `${r?.symbol || '?'} ---` : `${r.symbol} ${(price * r.rate_from_egp).toFixed(2)}`;
        },
        isValidEmail: email => (!email || !email.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        scrollToSection: sel => {
            const element = document.querySelector(sel);
            if (element) {
                const headerOffset = (document.querySelector('.site-header')?.offsetHeight || 0) + (document.querySelector('.stepper-outer-wrapper')?.offsetHeight || 0);
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        },
        updateStepperState(step) {
            if (step > 1 && !this.selectedAnimal.type) { this.currentActiveStep = 1; this.scrollToSection('#step1-content'); return; }
            if (step > 2 && !(this.selectedAnimal.type && this.selectedPrepStyle.value && this.selectedPackaging.value)) { this.currentActiveStep = 2; this.scrollToSection('#step2-content'); return; }
            if (step > 3 && !this.canProceedFromLogistics()) {
                 if (!(this.selectedAnimal.type && this.selectedPrepStyle.value && this.selectedPackaging.value)) {
                    this.currentActiveStep = 2; this.scrollToSection('#step2-content'); return;
                 }
                 this.currentActiveStep = 3; this.scrollToSection('#step3-content');
                 if (step === 4) this.proceedToReview();
                 return;
            }
            this.currentActiveStep = step;
        },
        selectAnimal(cardEl, key) {
            const animal = this.productOptions.livestock.find(a => a.value_key === key);
            const sel = cardEl.querySelector('.livestock-weight-select');
            if (!animal || !sel || !sel.value) { alert('Error selecting animal/weight.'); return; }
            const wp = animal.weights_prices.find(w => w.weight_range === sel.value);
            if (!wp || !wp.is_active || (wp.stock != null && wp.stock <= 0)) {
                alert(`${animal.name_en || 'Selected animal'} (${sel.value}) is out of stock.`); this.updateAllDisplayedPrices(); return;
            }
            this.selectedAnimal = { type: animal.value_key, value: animal.value_key, weight: wp.weight_range, basePriceEGP: parseFloat(wp.price_egp), stock: wp.stock, originalStock: wp.stock, nameEN: animal.name_en, nameAR: animal.name_ar, pbId: animal.pbId };
            this.calculateTotalPrice();
            this.$nextTick(() => { this.updateStepperState(2); this.scrollToSection('#step2-content'); });
        },
        isLivestockWeightOutOfStock(selEl, key) {
            const animal = this.productOptions.livestock.find(a => a.value_key === key);
            if (!animal || !selEl || !selEl.value) return true;
            const wp = animal.weights_prices.find(w => w.weight_range === selEl.value);
            return !wp || !wp.is_active || (wp.stock != null && wp.stock <= 0);
        },
        updateSelectedPrepStyle(value) {
            const style = this.productOptions.preparationStyles.find(s => s.value === value);
            if (style) {
                this.selectedPrepStyle = { ...style };
            } else {
                this.selectedPrepStyle = { value: '', nameEN: '', nameAR: '', is_custom: false };
            }
            this.calculateTotalPrice();
        },
        updateSelectedPackaging(value) {
            const pkg = this.productOptions.packagingOptions.find(p => p.value === value);
            if (pkg) {
                this.selectedPackaging = { ...pkg, addonPriceEGP: parseFloat(pkg.addonPriceEGP || 0) };
            } else {
                this.selectedPackaging = { value: '', addonPriceEGP: 0, nameEN: '', nameAR: '' };
            }
            this.calculateTotalPrice();
        },
        proceedToLogistics() { // From new Step 2 (Prep & Pack) to Step 3 (Logistics)
            if (this.selectedPrepStyle.value && this.selectedPackaging.value) {
                this.$nextTick(() => { this.updateStepperState(3); this.scrollToSection('#step3-content'); });
            } else {
                alert('Please select preparation style and packaging preference.');
                this.updateStepperState(2); this.scrollToSection('#step2-content');
            }
        },
        canProceedFromLogistics() {
            if (!this.selectedAnimal.type || !this.selectedPrepStyle.value || !this.selectedPackaging.value) return false;
            if (this.customerEmail && !this.isValidEmail(this.customerEmail)) return false;
            if (this.distributionChoice === 'split' && (!this.splitDetailsOption || (this.splitDetailsOption === 'custom' && !(this.customSplitDetailsText || "").trim()))) return false;
            if (this._needsDeliveryDetails) {
                const gov = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
                const cityMissing = gov && gov.cities?.length > 0 && !this.deliveryCity;
                if (!this.deliveryPhone?.trim() || !this.selectedGovernorate || cityMissing || !this.deliveryAddress?.trim() || !this.deliveryName?.trim()) return false;
            }
            return true;
        },
        proceedToReview() { // From Step 3 (Logistics) to Step 4 (Review)
            if (this.canProceedFromLogistics()) { this.$nextTick(() => { this.updateStepperState(4); this.scrollToSection('#step4-content'); }); return; }
            const errors = ['Complete required fields in Logistics (Step 3):'];
            if (this.customerEmail && !this.isValidEmail(this.customerEmail)) errors.push('- Invalid Email.');
            if (this.distributionChoice === 'split' && (!this.splitDetailsOption || (this.splitDetailsOption === 'custom' && !this.customSplitDetailsText?.trim()))) errors.push('- Invalid split details.');
            if (this._needsDeliveryDetails) {
                if (!this.deliveryName?.trim()) errors.push('- Delivery Name.'); if (!this.deliveryPhone?.trim()) errors.push('- Delivery Phone.');
                if (!this.selectedGovernorate) errors.push('- Governorate.');
                const gov = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
                if (gov && gov.cities?.length > 0 && !this.deliveryCity) errors.push('- City.');
                if (!this.deliveryAddress?.trim()) errors.push('- Delivery Address.');
            }
            alert(errors.join('\n')); this.updateStepperState(3); this.scrollToSection('#step3-content');
        },
        updateSacrificeDayTexts() { const opt = document.querySelector(`#sacrifice_day_select_s3 option[value="${this.selectedSacrificeDay.value}"]`); if (opt) Object.assign(this.selectedSacrificeDay, { textEN: opt.dataset.en, textAR: opt.dataset.ar }); },
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
        async submitBooking() {
            const v = [
                !this.selectedAnimal.type,
                !(this.selectedPrepStyle.value && this.selectedPackaging.value),
                !this.canProceedFromLogistics()
            ];
            const sections = ['#step1-content', '#step2-content', '#step3-content'];
            for (let i = 0; i < v.length; i++) {
                if (v[i]) {
                    if (i === 2) this.proceedToReview(); // handles logistics validation alert
                    else if (i === 1) this.proceedToLogistics(); // handles prep/pack validation alert
                    else alert(`Please complete Step ${i + 1}.`);
                    this.updateStepperState(i + 1); this.scrollToSection(sections[i]); return;
                }
            }
            const animal = this.productOptions.livestock.find(a => a.value_key === this.selectedAnimal.value);
            const wpData = animal?.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight);
            if (!animal || !wpData || !wpData.is_active || (wpData.stock != null && wpData.stock <= 0)) {
                alert(`Sorry, ${this.selectedAnimal.nameEN || 'item'} is no longer available.`);
                this.selectedAnimal = { ...initialBookingFormState.selectedAnimal }; this.updateAllDisplayedPrices();
                this.updateStepperState(1); this.scrollToSection('#step1-content'); return;
            }

            this.isLoading.booking = true; this.apiError = null; this.calculateTotalPrice();
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
                if (wpData.stock != null && wpData.stock > 0) {
                    wpData.stock--;
                    this.updateAllDisplayedPrices();
                }
                this.bookingConfirmed = true; this.$nextTick(() => this.scrollToSection('#step5-booking-confirmation'));
            } catch (error) { this.apiError = error.message; alert(`Booking Error: ${error.message}`); }
            finally { this.isLoading.booking = false; }
        },
        async checkBookingStatus() {
            this.statusResult = null; this.statusNotFound = false; this.isLoading.status = true; this.apiError = null;
            const id = (this.lookupBookingID || "").trim();
            if (!id) { alert('Please enter Booking ID.'); this.isLoading.status = false; return; }
            try {
                const data = await pbFetch('bookings', { params: `filter=(booking_id_text='${encodeURIComponent(id)}')&perPage=1` });
                if (data.items && data.items.length > 0) {
                    const b = data.items[0];
                    this.statusResult = { booking_id_text: b.booking_id_text || b.id, status: b.booking_status || 'Unknown', animal_type: b.animal_type_name_en || b.animal_type_key, animal_weight_selected: b.animal_weight_selected, sacrifice_day: b.sacrifice_day_value, time_slot: b.time_slot };
                } else this.statusNotFound = true;
            } catch (error) { this.apiError = error.message; this.statusNotFound = true; }
            finally { this.isLoading.status = false; }
        },
        getSacrificeDayText(val) { const opt = document.querySelector(`#sacrifice_day_select_s3 option[value="${val}"]`); return opt ? { en: opt.dataset.en, ar: opt.dataset.ar } : { en: val, ar: val }; },
        resetAndStartOver() {
            Object.assign(this, JSON.parse(JSON.stringify(initialBookingFormState)), { bookingConfirmed: false, bookingID: '', lookupBookingID: '', statusResult: null, statusNotFound: false, currentActiveStep: 1, isMobileMenuOpen: false, apiError: null, countdown: { days: '00', hours: '00', minutes: '00', seconds: '00', ended: false } });
            if(this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            this.initApp();
        }
    }));
});
