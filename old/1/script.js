// script.js
document.addEventListener('alpine:init', () => {
    Alpine.data('udheyaBooking', () => ({
        pb: null,
        pocketbaseUrl: window.location.origin,
        isLoading: { status: false, booking: false, settings: true, livestock: true },

        livestockOptions: [], // Fetched from PocketBase
        appSettings: {
            exchange_rates: { EGP: { rate_from_egp: 1, symbol: 'LE', is_active: true } },
            default_currency: "EGP",
            whatsapp_number: "+20 123 456 7890", // Default fallback
            promo_days_left: 45, // Default fallback
            promo_discount_percent: 15 // Default fallback
        },

        hardcodedPrepStyleOptions: [
            { value_key: 'Standard Mixed Cuts', name_en: 'Standard Mix', name_ar: 'مزيج قياسي', image_path: '/images/prep-standard-mixed-cuts.jpg', description_en: 'Balanced cuts for family use.', description_ar: 'تقطيع متوازن للاستخدام العائلي.', is_custom: false },
            { value_key: 'Charity Portions', name_en: 'Charity Portions', name_ar: 'حصص صدقة', image_path: '/images/prep-charity-portions.jpg', description_en: 'Prepared in equal shares, suitable for your donation.', description_ar: 'تُجهز في حصص متساوية، مناسبة لتبرعك الخاص.', is_custom: false },
            { value_key: 'Feast Preparation', name_en: 'Feast Preparation', name_ar: 'تجهيز ولائم', image_path: '/images/prep-feast-preparation.jpg', description_en: 'Larger cuts, perfect for gatherings and events.', description_ar: 'قطع أكبر، مثالية للتجمعات والمناسبات.', is_custom: false },
            { value_key: 'Custom & Ground Mix', name_en: 'Custom & Ground', name_ar: 'مخصص ومفروم', image_path: '/images/prep-custom-ground-mix.jpg', description_en: 'Specify your preferred cuts & mince portions.', description_ar: 'حدد تقطيعاتك المفضلة وحصص اللحم المفروم.', is_custom: true }
        ],
        hardcodedPackagingOptions: [
            { value_key: 'standard', name_en: 'Standard Packaging', name_ar: 'تعبئة قياسية', image_path: '/images/packaging-standard.jpg', description_en: 'Hygienic, ready for your freezer.', description_ar: 'صحية وجاهزة للتجميد.', addon_price_egp: 0 },
            { value_key: 'vacuum_sealed', name_en: 'Vacuum Sealed', name_ar: 'تعبئة مفرغة', image_path: '/images/packaging-vacuum-sealed.jpg', description_en: 'Extends freshness, ideal for storage.', description_ar: 'تحافظ على النضارة، مثالية للتخزين.', addon_price_egp: 100 }
        ],

        currentStep: 1, bookingConfirmed: false, statusResult: null, statusNotFound: false, lookupBookingID: '', currentCurrency: 'EGP',
        selectedAnimal: { type: '', value: '', weight: '', basePriceEGP: 0, nameEN: '', nameAR: '', stock: null },
        selectedPrepStyle: { value: '', nameEN: '', nameAR: '', is_custom: false }, customPrepDetails: '',
        selectedPackaging: { value: '', addonPriceEGP: 0, nameEN: '', nameAR: '' },
        selectedSacrificeDay: { value: 'day1_10_dhul_hijjah', textEN: 'Day 1 of Eid (10th Dhul Hijjah)', textAR: 'اليوم الأول (10 ذو الحجة)' },
        selectedTimeSlot: '8 AM-9 AM', customerEmail: '', deliveryName: '', deliveryPhone: '', deliveryCity: '', deliveryAddress: '', deliveryInstructions: '',
        distributionChoice: 'me', splitDetails: '', niyyahNames: '', groupPurchase: false, paymentMethod: 'vi',
        bookingID: '', totalPriceEGP: 0,
        timeSlots: ['7 AM-8 AM', '8 AM-9 AM', '9 AM-10 AM', '10 AM-11 AM', '11 AM-12 PM', '12 PM-1 PM', '1 PM-2 PM', '2 PM-3 PM'],
        paymentMethods: [
            { value: 'vi', title: 'Visa', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/100px-Visa_Inc._logo.svg.png' },
            { value: 'mc', title: 'Mastercard', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_logo.svg/100px-Mastercard_logo.svg.png' },
            { value: 'fa', title: 'Fawry', icon: '/images/payment-fawry.svg' },
            { value: 'vo', title: 'Vodafone Cash', icon: '/images/payment-vodafone-cash.svg' },
            { value: 'cod', title: 'Cash on Delivery', icon: '/images/payment-cod.svg' },
            { value: 'ip', title: 'InstaPay', icon: '/images/payment-instapay.svg' }
        ],

        get summaryDeliveryToEN() { return (this.distributionChoice === 'char') ? 'Charity Distribution by Sheep Land' : (this.deliveryAddress ? `${this.deliveryName || 'Recipient'}, ${this.deliveryAddress.substring(0,30)}${this.deliveryAddress.length > 30 ? '...' : ''}` : 'Self Pickup / To Be Confirmed'); },
        get summaryDeliveryToAR() { return (this.distributionChoice === 'char') ? 'توزيع خيري بواسطة أرض الأغنام' : (this.deliveryAddress ? `${this.deliveryName || 'المستلم'}\u060C ${this.deliveryAddress.substring(0,30)}${this.deliveryAddress.length > 30 ? '...' : ''}` : 'استلام ذاتي / سيتم التأكيد'); },
        get summaryDistributionEN() { return (this.distributionChoice === 'me') ? 'All to me' : (this.distributionChoice === 'char' ? 'All to charity (by Sheep Land)' : `Split: ${this.splitDetails || '(Not specified)'}`); },
        get summaryDistributionAR() { return (this.distributionChoice === 'me') ? 'الكل لي (لتوزيعه بنفسك)' : (this.distributionChoice === 'char' ? 'تبرع بالكل للصدقة (أرض الأغنام توزع نيابة عنك)' : `تقسيم الحصص: ${this.splitDetails || '(لم يحدد)'}`); },

        async initApp() {
            this.pb = new PocketBase(this.pocketbaseUrl);
            await Promise.all([this.loadAppSettings(), this.loadLivestockOptions()]);
            this.currentCurrency = this.appSettings.default_currency || 'EGP'; // Set after settings are loaded
            this.updateSacrificeDayTexts();
            this.updateAllDisplayedPrices();
            this.$watch('currentStep', v => { if (v === 4) this.calculateTotalPrice(); });
            this.$watch(['selectedAnimal.basePriceEGP', 'selectedPackaging.addonPriceEGP'], () => this.calculateTotalPrice());
            this.$watch('currentCurrency', () => { this.calculateTotalPrice(); this.updateAllDisplayedPrices(); });
            this.$watch('selectedSacrificeDay.value', () => this.updateSacrificeDayTexts());
            this.$watch('distributionChoice', v => { if (v !== 'split') this.splitDetails = ''; });
            this.$watch('selectedPrepStyle.is_custom', isCustom => { if (!isCustom) this.customPrepDetails = ''; });
        },

        async loadAppSettings() {
            this.isLoading.settings = true;
            try {
                const settingsRecords = await this.pb.collection('app_settings').getFullList();
                let tempSettings = { exchange_rates: { EGP: { rate_from_egp: 1, symbol: 'LE', is_active: true } }, default_currency: "EGP", whatsapp_number: "+20 123 456 7890", promo_days_left: 45, promo_discount_percent: 15 }; // Fallbacks
                settingsRecords.forEach(setting => {
                    if(setting.setting_key === "exchange_rates" || setting.setting_key === "admin_notification_emails" || setting.setting_key === "site_name" || setting.setting_key === "default_currency") {
                        tempSettings[setting.setting_key] = setting.value_json;
                    } else { // For simple value settings like promo days/discount
                         tempSettings[setting.setting_key] = setting.value_json.value; // Assuming simple settings have {value: ...}
                    }
                });
                this.appSettings = tempSettings;

                if (!this.appSettings.exchange_rates || !this.appSettings.exchange_rates['EGP']) {
                    this.appSettings.exchange_rates = { ...this.appSettings.exchange_rates, EGP: { rate_from_egp: 1, symbol: 'LE', is_active: true } };
                }
                const activeRates = {};
                for (const code in this.appSettings.exchange_rates) {
                    if (this.appSettings.exchange_rates[code].is_active) activeRates[code] = this.appSettings.exchange_rates[code];
                }
                this.appSettings.exchange_rates = activeRates; // Only keep active rates
            } catch (error) { console.error("Failed to load app settings, using defaults:", error); /* Defaults already set */ }
            finally { this.isLoading.settings = false; }
        },
        async loadLivestockOptions() {
            this.isLoading.livestock = true;
            try {
                this.livestockOptions = await this.pb.collection('livestock_options').getFullList({ filter: 'is_globally_active = true', sort: 'sort_order,created' });
            } catch (error) { console.error("Failed to load livestock options:", error); /* Can add user alert */ }
            finally { this.isLoading.livestock = false; }
        },

        getPocketBaseFileUrl(r, f) { return (r && f) ? this.pb.files.getUrl(r, f) : '/images/placeholder.jpg'; },
        getFormattedPrice(priceInEGP, currencyCodeOverride) {
            const targetCurrencyCode = currencyCodeOverride || this.currentCurrency;
            const rates = this.appSettings.exchange_rates || {};
            const rateInfo = rates[targetCurrencyCode];
            if (priceInEGP === undefined || priceInEGP === null || !rateInfo || typeof rateInfo.rate_from_egp !== 'number') {
                const symbolAttempt = rateInfo?.symbol || '?'; return `${symbolAttempt} ---`;
            }
            const convertedPrice = priceInEGP * rateInfo.rate_from_egp;
            return `${rateInfo.symbol} ${convertedPrice.toFixed(2)}`;
        },
        isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },
        isStepCompleted(stepNumber) {
            if (stepNumber < this.currentStep) return true;
            switch (stepNumber) {
                case 1: return !!this.selectedAnimal.type;
                case 2: return !!this.selectedPrepStyle.value && !!this.selectedPackaging.value;
                case 3: return !!this.deliveryPhone && (!this.customerEmail || this.isValidEmail(this.customerEmail));
                default: return false;
            }
        },
        goToStep(step) {
            if (step > this.currentStep && !this.isStepCompleted(this.currentStep)) {
                let message = "Please complete current step.";
                if(this.currentStep === 1 && !this.selectedAnimal.type) message = "Please select an animal first.";
                else if(this.currentStep === 2 && (!this.selectedPrepStyle.value || !this.selectedPackaging.value)) message = "Please select preparation style and packaging.";
                else if(this.currentStep === 3 && !this.deliveryPhone) message = "Please enter your phone number.";
                else if(this.currentStep === 3 && this.customerEmail && !this.isValidEmail(this.customerEmail)) message = "Please enter a valid email address or leave it blank.";
                alert(message); return;
            }
            if (step >= 1 && step <= 4) { this.currentStep = step; this.scrollToSection(this.getStepTargetId(step)); }
            else if (step === 5 && this.bookingConfirmed) { this.currentStep = step; this.scrollToSection(this.getStepTargetId(step));}
        },
        getStepTargetId(step) { return `#step${step}-${{1:'livestock',2:'prep-packaging',3:'logistics-personalization',4:'review-pay',5:'booking-confirmation'}[step]}` || 'body'; },
        scrollToSection(s) { document.querySelector(s)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
        handleNavClick(targetId) { (targetId === '#step1-livestock' && !this.bookingConfirmed) ? this.goToStep(1) : this.scrollToSection(targetId); },

        selectAnimal(cardElement, animalData) {
            const sel = cardElement.querySelector('.livestock-weight-select');
            const selectedWeightPriceInfo = animalData.weights_prices.find(wp => wp.weight_range === sel.value);
            if (!selectedWeightPriceInfo || selectedWeightPriceInfo.is_active === false || (typeof selectedWeightPriceInfo.stock === 'number' && selectedWeightPriceInfo.stock <= 0)) {
                alert(`${animalData.name_en} (${sel.value}) is out of stock or unavailable. Please select another option.`); return;
            }
            this.selectedAnimal = {
                type: animalData.name_en, value: animalData.type_key, weight: selectedWeightPriceInfo.weight_range,
                basePriceEGP: parseFloat(selectedWeightPriceInfo.price_egp), nameEN: animalData.name_en, nameAR: animalData.name_ar,
                stock: selectedWeightPriceInfo.stock
            };
            this.goToStep(2);
        },
        isLivestockWeightOutOfStock(selectElement, animalData) {
            if (!animalData || !animalData.weights_prices || !selectElement) return true;
            const selectedWeightPriceInfo = animalData.weights_prices.find(wp => wp.weight_range === selectElement.value);
            return !selectedWeightPriceInfo || selectedWeightPriceInfo.is_active === false || (typeof selectedWeightPriceInfo.stock === 'number' && selectedWeightPriceInfo.stock <= 0);
        },
        updateAllDisplayedPrices() {
            if (this.isLoading.settings && Object.keys(this.appSettings.exchange_rates).length <= 1) return;
            this.$nextTick(() => {
                this.livestockOptions.forEach(animalData => {
                    const card = document.getElementById(animalData.type_key);
                    if (!card || !animalData.weights_prices) return;
                    card.querySelectorAll('.price span span').forEach(span => span.textContent = this.getFormattedPrice(animalData.weights_prices[0]?.price_egp || 0));
                    const weightSelect = card.querySelector('.livestock-weight-select');
                    Array.from(weightSelect.options).forEach(opt => {
                        const wp = animalData.weights_prices.find(w => w.weight_range === opt.value);
                        if (wp) {
                            let text = `${wp.weight_range} (${this.getFormattedPrice(wp.price_egp)})`;
                            if (wp.is_active === false || (typeof wp.stock === 'number' && wp.stock <= 0)) { text += ' - Out of Stock'; opt.disabled = true; }
                            else if (typeof wp.stock === 'number') { text += ` - Stock: ${wp.stock}`; opt.disabled = false; }
                            else { opt.disabled = false; }
                            opt.textContent = text;
                        }
                    });
                });
                this.hardcodedPackagingOptions.forEach(pkgOpt => {
                    if (pkgOpt.addon_price_egp > 0) {
                        const pkgCard = document.querySelector(`.packaging-card[data-packaging-value="${pkgOpt.value_key}"]`);
                        if (pkgCard) pkgCard.querySelectorAll('.price-addon span').forEach(span => span.textContent = this.getFormattedPrice(pkgOpt.addon_price_egp));
                    }
                });
            });
            if (this.currentStep === 4) this.calculateTotalPrice();
        },
        selectPrepStyle(cardElement, prepData) { this.selectedPrepStyle = { ...prepData }; },
        selectPackaging(cardElement, pkgData) { this.selectedPackaging = { ...pkgData, addonPriceEGP: parseFloat(pkgData.addon_price_egp || 0) }; },
        updateSacrificeDayTexts() { const opt = document.querySelector(`#sacrifice_day_select_s3 option[value="${this.selectedSacrificeDay.value}"]`); if (opt) { this.selectedSacrificeDay.textEN = opt.dataset.en; this.selectedSacrificeDay.textAR = opt.dataset.ar; } },
        calculateTotalPrice() { this.totalPriceEGP = (this.selectedAnimal.basePriceEGP || 0) + (this.selectedPackaging.addonPriceEGP || 0); },

        async submitBooking() {
            if (!this.isStepCompleted(3)) { /* error handled in goToStep */ return; }
            const liveAnimalOpt = this.livestockOptions.find(a => a.type_key === this.selectedAnimal.value);
            if (liveAnimalOpt) {
                const liveWeightOpt = liveAnimalOpt.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight);
                if (!liveWeightOpt || liveWeightOpt.is_active === false || (typeof liveWeightOpt.stock === 'number' && liveWeightOpt.stock <= 0)) {
                    alert(`Sorry, ${this.selectedAnimal.nameEN} (${this.selectedAnimal.weight}) is no longer available. Please re-select.`);
                    this.selectedAnimal = { type: '', value: '', weight: '', basePriceEGP: 0, nameEN: '', nameAR: '', stock: null }; this.goToStep(1); this.updateAllDisplayedPrices(); return;
                }
            } else { alert("Selected animal option is invalid."); this.goToStep(1); return; }

            this.isLoading.booking = true;
            this.bookingID = `SL-UDHY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0')}`;
            this.calculateTotalPrice();
            const finalPriceInSelectedCurrency = parseFloat(this.getFormattedPrice(this.totalPriceEGP).replace(/[^\d.-]/g, ''));
            const dataToSave = {
                booking_id_text: this.bookingID, selected_livestock_type_key: this.selectedAnimal.value, animal_type: this.selectedAnimal.type,
                animal_weight_selected: this.selectedAnimal.weight, animal_base_price_egp_at_booking: this.selectedAnimal.basePriceEGP,
                prep_style_value: this.selectedPrepStyle.value, custom_prep_details: this.customPrepDetails,
                packaging_preference_value: this.selectedPackaging.value, packaging_addon_price_egp_at_booking: this.selectedPackaging.addonPriceEGP,
                sacrifice_day: this.selectedSacrificeDay.value, time_slot: this.selectedTimeSlot, customer_email: this.customerEmail || null,
                delivery_name: this.deliveryName, delivery_phone: this.deliveryPhone, delivery_city: this.deliveryCity,
                delivery_address: this.deliveryAddress, delivery_instructions: this.deliveryInstructions, distribution_choice: this.distributionChoice,
                split_details: this.splitDetails, niyyah_names: this.niyyahNames, group_purchase: this.groupPurchase, payment_method: this.paymentMethod,
                total_price_egp: this.totalPriceEGP, currency_used: this.currentCurrency, price_in_selected_currency: finalPriceInSelectedCurrency,
                status: "Pending Confirmation"
            };
            try {
                await this.pb.collection('udheya_bookings').create(dataToSave);
                const bookedAnimalOption = this.livestockOptions.find(a => a.type_key === this.selectedAnimal.value);
                if (bookedAnimalOption) {
                    const bookedWeight = bookedAnimalOption.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight);
                    if (bookedWeight && typeof bookedWeight.stock === 'number') bookedWeight.stock -= 1; // Optimistic UI update for stock
                }
                this.bookingConfirmed = true; this.currentStep = 5; this.scrollToSection(this.getStepTargetId(5));
            } catch (error) { console.error("Booking save error:", error.data?.message || error.message, error); alert(`Booking failed: ${error.data?.message || error.message || 'Please check details or try again.'}`); }
            finally { this.isLoading.booking = false; }
        },
        async checkBookingStatus() {
            this.statusResult = null; this.statusNotFound = false; this.isLoading.status = true;
            if (!this.lookupBookingID) { alert('Please enter a Booking ID.'); this.isLoading.status = false; return; }
            try { this.statusResult = await this.pb.collection('udheya_bookings').getFirstListItem(`booking_id_text="${this.lookupBookingID.trim()}"`); }
            catch (error) { if (error.status === 404) this.statusNotFound = true; else { console.error("Status check error:", error.data || error.message, error); alert("Error checking status.");}}
            finally { this.isLoading.status = false; }
        },
        getSacrificeDayText(val) { const opt = document.querySelector(`#sacrifice_day_select_s3 option[value="${val}"]`); return opt ? { en: opt.dataset.en, ar: opt.dataset.ar } : { en: val, ar: val }; },
        resetAndStartOver() {
            this.currentStep = 1; this.bookingConfirmed = false; this.bookingID = '';
            this.selectedAnimal = { type: '', value: '', weight: '', basePriceEGP: 0, nameEN: '', nameAR: '', stock: null };
            this.selectedPrepStyle = { value: '', nameEN: '', nameAR: '', is_custom: false }; this.customPrepDetails = '';
            this.selectedPackaging = { value: '', addonPriceEGP: 0, nameEN: '', nameAR: '' };
            this.totalPriceEGP = 0; this.lookupBookingID = ''; this.statusResult = null; this.statusNotFound = false;
            this.customerEmail = ''; this.deliveryName = ''; this.deliveryPhone = ''; this.deliveryCity = ''; this.deliveryAddress = ''; this.deliveryInstructions = '';
            this.niyyahNames = ''; this.splitDetails = ''; this.groupPurchase = false;
            this.scrollToSection('#step1-livestock');
            this.$nextTick(() => this.updateAllDisplayedPrices());
        }
    }));
});