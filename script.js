document.addEventListener('alpine:init', () => {
    
    const initialBookingFormState = {
        selectedAnimal: { type: '', value: '', weight: '', basePriceEGP: 0, nameEN: '', nameAR: '', stock: null, pbId: null, originalStock: null },
        selectedPrepStyle: { value: '', nameEN: '', nameAR: '', is_custom: false }, customPrepDetails: '',
        selectedPackaging: { value: '', addonPriceEGP: 0, nameEN: '', nameAR: '' }, totalPriceEGP: 0,
        customerEmail: '', deliveryName: '', deliveryPhone: '', selectedGovernorate: '', deliveryCity: '', availableCities: [], deliveryAddress: '', deliveryInstructions: '',
        niyyahNames: '', splitDetailsOption: '', customSplitDetailsText: '', groupPurchase: false,
        selectedSacrificeDay: { value: 'day1_10_dhul_hijjah', textEN: 'Day 1 of Eid (10th Dhul Hijjah)', textAR: 'اليوم الأول (10 ذو الحجة)' },
        selectedTimeSlot: '8 AM-9 AM', distributionChoice: 'me', paymentMethod: 'vi',
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
            } catch (e) { /* ignore if response body is not JSON */ }
            throw new Error(`API Error (${collection} ${recordId || params}): ${response.status} ${errorDataMessage}`);
        }
        return response.json();
    }

    async function seedPocketBaseData() {
        console.log("Attempting to seed PocketBase data... Ensure API Create/Update rules for app_settings and livestock_types are temporarily public (\"\") if running this from an unauthenticated session.");
        const API_URL_PREFIX = '/api'; 

        const defaultAppSettingsData = {
            setting_key: "global_config", 
            exchange_rates: { EGP: { rate_from_egp: 1, symbol: 'LE', is_active: true }, USD: { rate_from_egp: 0.021, symbol: '$', is_active: true }, GBP: { rate_from_egp: 0.017, symbol: '£', is_active: true }},
            default_currency: "EGP",
            whatsapp_number_raw: "201234567890",
            whatsapp_number_display: "+20 123 456 7890",
            promo_end_date: "2024-08-15T23:59:59Z", // EXAMPLE: Set your actual promo end date
            promo_discount_percent: 15,
            promo_is_active: true, 
            site_name: "Sheep Land",
            delivery_areas: [
                { id: 'cairo', name_en: 'Cairo', name_ar: 'القاهرة', cities: [ {id: 'nasr_city', name_en: 'Nasr City', name_ar: 'مدينة نصر'}, {id: 'maadi', name_en: 'Maadi', name_ar: 'المعادي'}, {id: 'heliopolis', name_en: 'Heliopolis', name_ar: 'مصر الجديدة'} ]},
                { id: 'giza', name_en: 'Giza', name_ar: 'الجيزة', cities: [ {id: 'dokki', name_en: 'Dokki', name_ar: 'الدقي'}, {id: 'mohandessin', name_en: 'Mohandessin', name_ar: 'المهندسين'}, {id: 'haram', name_en: 'Haram', name_ar: 'الهرم'} ]},
                { id: 'alexandria', name_en: 'Alexandria', name_ar: 'الإسكندرية', cities: [ {id: 'smouha', name_en: 'Smouha', name_ar: 'سموحة'}, {id: 'miami', name_en: 'Miami', name_ar: 'ميامي'} ]},
                { id: 'other_gov', name_en: 'Other Governorate', name_ar: 'محافظة أخرى', cities: [] }
            ],
            payment_details: { 
                vodafone_cash: "010 YOUR VODA NUMBER", instapay_ipn: "YOUR.IPN@instapay", revolut_details: "@YOUR_REVTAG or Phone: +XX XXXXXXXX",
                bank_name: "YOUR BANK NAME", bank_account_name: "YOUR ACCOUNT HOLDER NAME", bank_account_number: "YOUR ACCOUNT NUMBER",
                bank_iban: "YOUR IBAN (Optional)", bank_swift: "YOUR SWIFT/BIC (Optional)"
            }
        };

        try {
            const checkSettingsUrl = `${API_URL_PREFIX}/collections/app_settings/records?filter=(setting_key='global_config')&perPage=1`;
            const checkResponse = await fetch(checkSettingsUrl);
            if (!checkResponse.ok && checkResponse.status !== 404) throw new Error(`Checking settings failed: ${checkResponse.statusText} - ${await checkResponse.text()}`);
            const checkData = await checkResponse.json();
            let recordIdToAlert = '';

            if (checkData.items && checkData.items.length > 0) {
                console.log("App settings 'global_config' already exists. Updating it.");
                const existingSettingsId = checkData.items[0].id; recordIdToAlert = existingSettingsId;
                const updateResponse = await fetch(`${API_URL_PREFIX}/collections/app_settings/records/${existingSettingsId}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(defaultAppSettingsData)
                });
                if (!updateResponse.ok) { const errText = await updateResponse.text(); throw new Error(`Failed to update app_settings: ${errText}`);}
                console.log("App settings updated:", await updateResponse.json());
            } else {
                console.log("App settings 'global_config' not found. Creating it.");
                const createResponse = await fetch(`${API_URL_PREFIX}/collections/app_settings/records`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(defaultAppSettingsData)
                });
                if (!createResponse.ok) { const errText = await createResponse.text(); throw new Error(`Failed to create app_settings: ${errText}`);}
                const createdRecord = await createResponse.json(); recordIdToAlert = createdRecord.id;
                console.log("App settings created:", createdRecord);
            }
            alert(`App settings 'global_config' (ID: ${recordIdToAlert}) processed. initApp fetches by setting_key.`);
        } catch (error) { console.error("Error seeding app_settings:", error); alert("Error seeding app_settings: " + error.message); }

        const defaultLivestockData = [
            { value_key: 'baladi', name_en: 'Baladi Sheep', name_ar: 'خروف بلدي', weights_prices: [ { weight_range: "30-40 kg", price_egp: 4500, stock: 15, is_active: true }, { weight_range: "40-50 kg", price_egp: 5200, stock: 10, is_active: true }, { weight_range: "50+ kg", price_egp: 6000, stock: 0, is_active: true } ] },
            { value_key: 'barki', name_en: 'Barki Sheep', name_ar: 'خروف برقي', weights_prices: [ { weight_range: "35-45 kg", price_egp: 5100, stock: 8, is_active: true }, { weight_range: "45-55 kg", price_egp: 5900, stock: 12, is_active: true } ] }
        ];

        for (const livestock of defaultLivestockData) {
            try {
                const checkLivestockUrl = `${API_URL_PREFIX}/collections/livestock_types/records?filter=(value_key='${livestock.value_key}')&perPage=1`;
                const checkResponse = await fetch(checkLivestockUrl);
                if (!checkResponse.ok && checkResponse.status !== 404) throw new Error(`Checking livestock ${livestock.value_key} failed: ${checkResponse.statusText} - ${await checkResponse.text()}`);
                const checkData = await checkResponse.json();
                if (checkData.items && checkData.items.length > 0) {
                    console.log(`Livestock type '${livestock.value_key}' already exists. Updating.`);
                    const updateResponse = await fetch(`${API_URL_PREFIX}/collections/livestock_types/records/${checkData.items[0].id}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(livestock)
                    });
                    if (!updateResponse.ok) { const errText = await updateResponse.text(); throw new Error(`Update failed for ${livestock.value_key}: ${errText}`);}
                    console.log("Livestock updated:", await updateResponse.json());
                } else {
                    console.log(`Livestock type '${livestock.value_key}' not found. Creating.`);
                    const createResponse = await fetch(`${API_URL_PREFIX}/collections/livestock_types/records`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(livestock)
                    });
                    if (!createResponse.ok) { const errText = await createResponse.text(); throw new Error(`Create failed for ${livestock.value_key}: ${errText}`);}
                    console.log("Livestock created:", await createResponse.json());
                }
            } catch (error) { console.error(`Error seeding livestock ${livestock.value_key}:`, error); alert(`Error for ${livestock.value_key}: ` + error.message); }
        }
        console.log("Data seeding process finished. IMPORTANT: Secure API rules for app_settings and livestock_types if you loosened them."); 
        alert("Data seeding finished. Refresh page. Remember to secure API rules!");
    }
    window.seedPocketBaseData = seedPocketBaseData;

    Alpine.data('udheyaBooking', () => ({
        isLoading: { status: false, booking: false, init: true },
        appSettings: {
            exchange_rates: { 
                EGP: { rate_from_egp: 1, symbol: 'LE', is_active: true },
                USD: { rate_from_egp: 0, symbol: '$', is_active: false }, 
                GBP: { rate_from_egp: 0, symbol: '£', is_active: false }
            },
            default_currency: "EGP",
            whatsapp_number_raw: "",
            whatsapp_number_display: "",
            promo_end_date: null, 
            promo_discount_percent: 0,
            promo_is_active: true, 
            site_name: "Sheep Land",
            delivery_areas: [],
            payment_details: { 
                vodafone_cash: "", instapay_ipn: "", revolut_details: "",
                bank_name: "", bank_account_name: "", bank_account_number: "",
                bank_iban: "", bank_swift: ""
            }
        },
        productOptions: { livestock: [] },
        apiError: null,
        ...JSON.parse(JSON.stringify(initialBookingFormState)),
        bookingConfirmed: false, statusResult: null, statusNotFound: false, lookupBookingID: '', currentCurrency: 'EGP',
        bookingID: '', currentActiveStep: 1, isMobileMenuOpen: false,
        stepSectionsMeta: [],
        calculatedPromoDaysLeft: 0, 

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

        updateCalculatedPromoDaysLeft() {
            if (this.appSettings.promo_end_date) {
                const endDate = new Date(this.appSettings.promo_end_date);
                const now = new Date();
                const diffTime = endDate - now; 
                if (diffTime > 0) {
                    this.calculatedPromoDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                } else {
                    this.calculatedPromoDaysLeft = 0;
                }
            } else {
                this.calculatedPromoDaysLeft = 0;
            }
        },

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
                        if (fetchedSettings.hasOwnProperty(key)) {
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
                    throw new Error("Critical: Global app settings ('global_config') not found. Run seedPocketBaseData() from console & refresh.");
                }
                
                this.productOptions.livestock = livestockData.items.map(item => ({
                    pbId: item.id, value_key: item.value_key, name_en: item.name_en, name_ar: item.name_ar,
                    weights_prices: Array.isArray(item.weights_prices) ? item.weights_prices.map(wp => ({...wp})) : []
                }));

            } catch (error) { 
                console.error("Init App Error:", error); 
                this.apiError = error.message; 
                this.appSettings = JSON.parse(JSON.stringify(initialDefaultAppSettings));
            }
            finally { 
                this.isLoading.init = false; 
            }

            this.updateCalculatedPromoDaysLeft(); 
            setInterval(() => {
                this.updateCalculatedPromoDaysLeft();
            }, 1000 * 60 * 60); 
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.updateCalculatedPromoDaysLeft();
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
            this.$watch('selectedPrepStyle.is_custom', isCustom => { if (!isCustom) this.customPrepDetails = ''; });
            this.$watch('splitDetailsOption', val => { if (val !== 'custom') this.customSplitDetailsText = ''; });
            this.$watch('selectedGovernorate', () => this.updateCities());
            
            this.stepSectionsMeta = ['#step1-content', '#step2-content', '#step3-content', '#step4-content', '#step5-content'] // Using content div IDs
                .map((id, index) => ({ id, step: index + 1, element: document.querySelector(id) }));
            
            this.$nextTick(() => { this.handleScroll(); });
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
            this.updateStepperState(1);
        },
        handleScroll() { 
            if (this.bookingConfirmed || !this.stepSectionsMeta.some(s => s.element)) return;
            const offset = (document.querySelector('.site-header')?.offsetHeight || 70) + (document.querySelector('.stepper-outer-wrapper')?.offsetHeight || 55) + 20;
            let newActiveStep = this.currentActiveStep; // Default to current to avoid unnecessary changes
            const scrollPosition = window.scrollY + offset;

            for (let i = 0; i < this.stepSectionsMeta.length; i++) {
                const section = this.stepSectionsMeta[i];
                if (section.element) {
                    const sectionTop = section.element.offsetTop;
                    const sectionBottom = sectionTop + section.element.offsetHeight;
                    // Check if the current scroll position is within this section's view
                    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                         // Prioritize step if its top is visible or just passed
                        if (section.element.getBoundingClientRect().top < offset) {
                           newActiveStep = section.step;
                           // If it's the last section and we've scrolled past its start, it should be active
                           if (i === this.stepSectionsMeta.length - 1 && scrollPosition >= sectionTop) {
                               newActiveStep = section.step;
                           }
                           // Break if we find the current section, but allow checking further down for last section case
                           // break; // Potentially remove break to ensure last section check
                        }
                    } else if (scrollPosition < sectionTop && i === 0) { // Scrolled above the first section
                        newActiveStep = 1;
                    }
                }
            }
             // A fallback if scrolled past all sections, keep last step active
            const lastStepElement = this.stepSectionsMeta[this.stepSectionsMeta.length - 1].element;
            if (lastStepElement && scrollPosition >= lastStepElement.offsetTop + lastStepElement.offsetHeight) {
                newActiveStep = this.stepSectionsMeta[this.stepSectionsMeta.length - 1].step;
            }


            if (this.currentActiveStep !== newActiveStep) {
                 // Basic validation before changing step via scroll
                if (newActiveStep === 2 && !this.selectedAnimal.type) { /* stay on 1 */ }
                else if (newActiveStep === 3 && !(this.selectedAnimal.type && this.selectedPrepStyle.value)) { /* stay on prev valid */ }
                else if (newActiveStep === 4 && !(this.selectedAnimal.type && this.selectedPrepStyle.value && this.selectedPackaging.value)) { /* stay on prev valid */ }
                else if (newActiveStep === 5 && !this.canProceedFromLogistics()) { /* stay on prev valid */ }
                else {
                    this.currentActiveStep = newActiveStep;
                }
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
                
                window.scrollTo({
                     top: offsetPosition,
                     behavior: "smooth"
                });
            }
        },
        updateStepperState(step) { 
            // Add validation before allowing step change via stepper click
            if (step > 1 && !this.selectedAnimal.type) { this.currentActiveStep = 1; this.scrollToSection('#step1-content'); return; }
            if (step > 2 && !this.selectedPrepStyle.value) { this.currentActiveStep = 2; this.scrollToSection('#step2-content'); return; }
            if (step > 3 && !this.selectedPackaging.value) { this.currentActiveStep = 3; this.scrollToSection('#step3-content'); return; }
            if (step > 4 && !this.canProceedFromLogistics()) { // This covers logistics for step 5
                 if (!(this.selectedAnimal.type && this.selectedPrepStyle.value && this.selectedPackaging.value)) {
                    this.currentActiveStep = 3; this.scrollToSection('#step3-content'); return;
                 }
                 this.currentActiveStep = 4; this.scrollToSection('#step4-content'); 
                 if (step === 5) this.proceedToReview(); // Specifically if trying to go to step 5 and logistics incomplete
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
        selectPrepStyle(prep) { this.selectedPrepStyle = { ...prep, is_custom: !!prep.is_custom }; this.calculateTotalPrice(); this.$nextTick(() => { this.updateStepperState(3); this.scrollToSection('#step3-content'); }); }, 
        selectPackaging(pkg) { this.selectedPackaging = { ...pkg, addonPriceEGP: parseFloat(pkg.addonPriceEGP || 0) }; this.calculateTotalPrice(); this.$nextTick(() => { this.updateStepperState(4); this.scrollToSection('#step4-content'); }); }, 
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
        proceedToReview() { 
            if (this.canProceedFromLogistics()) { this.$nextTick(() => { this.updateStepperState(5); this.scrollToSection('#step5-content'); }); return; } 
            const errors = ['Complete required fields in Logistics (Step 4):'];
            if (this.customerEmail && !this.isValidEmail(this.customerEmail)) errors.push('- Invalid Email.');
            if (this.distributionChoice === 'split' && (!this.splitDetailsOption || (this.splitDetailsOption === 'custom' && !this.customSplitDetailsText?.trim()))) errors.push('- Invalid split details.');
            if (this._needsDeliveryDetails) {
                if (!this.deliveryName?.trim()) errors.push('- Delivery Name.'); if (!this.deliveryPhone?.trim()) errors.push('- Delivery Phone.');
                if (!this.selectedGovernorate) errors.push('- Governorate.');
                const gov = (this.appSettings.delivery_areas || []).find(g => g.id === this.selectedGovernorate);
                if (gov && gov.cities?.length > 0 && !this.deliveryCity) errors.push('- City.');
                if (!this.deliveryAddress?.trim()) errors.push('- Delivery Address.');
            }
            alert(errors.join('\n')); this.updateStepperState(4);
            this.scrollToSection('#step4-content'); 
        },
        updateSacrificeDayTexts() { const opt = document.querySelector(`#sacrifice_day_select_s4 option[value="${this.selectedSacrificeDay.value}"]`); if (opt) Object.assign(this.selectedSacrificeDay, { textEN: opt.dataset.en, textAR: opt.dataset.ar }); },
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
            document.querySelectorAll('.packaging-card[data-packaging-value="vacuum_sealed"] .price-addon span').forEach(s => { s.textContent = this.getFormattedPrice(100); }); 
            this.calculateTotalPrice();
        },
        async submitBooking() { 
            const v = [!this.selectedAnimal.type, !this.selectedPrepStyle.value, !this.selectedPackaging.value, !this.canProceedFromLogistics()];
            const sections = ['#step1-content', '#step2-content', '#step3-content', '#step4-content'];
            for (let i = 0; i < v.length; i++) {
                if (v[i]) {
                    if (i === 3) this.proceedToReview(); else alert(`Please complete Step ${i + 1}.`);
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
                if(p.customerEmail && p.isValidEmail(p.customerEmail)) console.log(`Booking ${this.bookingID} success. Simulating email to ${p.customerEmail}.`);
            } catch (error) { console.error("Booking Submission Error:", error); this.apiError = error.message; alert(`Booking Error: ${error.message}`); }
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
            } catch (error) { console.error("Status Check Error:", error); this.apiError = error.message; this.statusNotFound = true; }
            finally { this.isLoading.status = false; }
        },
        getSacrificeDayText(val) { const opt = document.querySelector(`#sacrifice_day_select_s4 option[value="${val}"]`); return opt ? { en: opt.dataset.en, ar: opt.dataset.ar } : { en: val, ar: val }; },
        resetAndStartOver() { 
            Object.assign(this, JSON.parse(JSON.stringify(initialBookingFormState)), { bookingConfirmed: false, bookingID: '', lookupBookingID: '', statusResult: null, statusNotFound: false, currentActiveStep: 1, isMobileMenuOpen: false, apiError: null, calculatedPromoDaysLeft: 0 });
            this.initApp(); 
        }
    }));
}); 
