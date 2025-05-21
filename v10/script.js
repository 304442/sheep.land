document.addEventListener('alpine:init', () => {
    // Initial state structure for the booking form
    const initialBookingState = {
        selectedAnimal: {
            type: "", // e.g., "baladi", "barki"
            value: "", // same as type, for consistency in some selections
            weight: "", // e.g., "30-40 kg"
            basePriceEGP: 0,
            nameEN: "",
            nameAR: "",
            stock: null,
            pbId: null, // PocketBase ID
            originalStock: null
        },
        selectedPrepStyle: {
            value: "",
            nameEN: "",
            nameAR: "",
            is_custom: false
        },
        customPrepDetails: "",
        selectedPackaging: {
            value: "",
            addonPriceEGP: 0,
            nameEN: "",
            nameAR: ""
        },
        totalPriceEGP: 0,
        customerEmail: "",
        deliveryName: "",
        deliveryPhone: "",
        selectedGovernorate: "",
        deliveryCity: "",
        availableCities: [],
        deliveryAddress: "",
        deliveryInstructions: "",
        niyyahNames: "", // Names for Udhiyah intention
        splitDetailsOption: "", // For "split" distribution choice
        customSplitDetailsText: "", // If splitDetailsOption is "custom"
        groupPurchase: false,
        selectedSacrificeDay: {
            value: "day1_10_dhul_hijjah",
            textEN: "Day 1 of Eid (10th Dhul Hijjah)",
            textAR: "اليوم الأول (10 ذو الحجة)"
        },
        selectedTimeSlot: "8 AM-9 AM",
        distributionChoice: "me", // "me", "char", "split"
        paymentMethod: "fa", // "fa" likely fawry/full amount, or "cod"
        errors: {} // For validation errors
    };

    // Generic API fetching function (primarily for GET requests)
    async function fetchApiData(collectionName, { recordId = "", queryParams = "" } = {}) {
        const apiUrl = `/api/collections/${collectionName}/records${recordId ? `/${recordId}` : ""}${queryParams ? `?${queryParams}` : ""}`;
        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                let errorMessage = "Unknown API Error";
                try {
                    const errorData = await response.json();
                    errorMessage = (errorData && errorData.data && Object.values(errorData.data).map(errDetail => String(errDetail.message || JSON.stringify(errDetail))).join("; ")) ||
                                   errorData.message ||
                                   response.statusText;
                } catch (jsonParseError) {
                    errorMessage = await response.text() || response.statusText;
                }
                throw new Error(`API Error (${collectionName} ${recordId || queryParams}): ${response.status} ${errorMessage}`);
            }

            const responseText = await response.text();
            if (!responseText) {
                return { items: [] }; // Return empty structure if response is empty
            }

            try {
                return JSON.parse(responseText);
            } catch (parseError) {
                throw new Error(`API Error (${collectionName} ${recordId || queryParams}): Failed to parse response. ${parseError.message}`);
            }
        } catch (error) {
            // Re-throw API errors directly, wrap network errors
            if (error.message.startsWith('API Error')) throw error;
            throw new Error(`Network Error (${collectionName} ${recordId || queryParams}): Could not connect. ${error.message}`);
        }
    }

    Alpine.data('udheyaBooking', () => ({
        isLoading: {
            status: false,
            booking: false,
            init: true
        },
        appSettings: {
            exchange_rates: {
                EGP: { rate_from_egp: 1, symbol: "LE", is_active: true },
                USD: { rate_from_egp: 0.021, symbol: "$", is_active: false },
                GBP: { rate_from_egp: 0.016, symbol: "£", is_active: false }
            },
            default_currency: "EGP",
            whatsapp_number_raw: "201001234567",
            whatsapp_number_display: "+20 100 123 4567",
            promo_end_date: new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)).toISOString(),
            promo_discount_percent: 10,
            promo_is_active: true,
            delivery_areas: [],
            payment_details: {
                vodafone_cash: "010-YOUR-VODA-NUMBER",
                instapay_ipn: "YOUR-IPN@instapay",
                revolut_details: "@YOUR-REVTAG / +XX XXXX XXXX",
                bank_name: "YOUR BANK NAME",
                bank_account_name: "YOUR ACCOUNT HOLDER NAME",
                bank_account_number: "YOUR ACCOUNT NUMBER",
                bank_iban: "",
                bank_swift: ""
            }
        },
        productOptions: {
            livestock: [],
            preparationStyles: [
                { value: "Standard Mixed Cuts", nameEN: "Standard Mix", nameAR: "مزيج قياسي", is_custom: false },
                { value: "Charity Portions", nameEN: "Charity Portions", nameAR: "حصص صدقة", is_custom: false },
                { value: "Feast Preparation", nameEN: "Feast Preparation", nameAR: "تجهيز ولائم", is_custom: false },
                { value: "Custom & Ground Mix", nameEN: "Custom & Ground", nameAR: "مخصص ومفروم", is_custom: true }
            ],
            packagingOptions: [
                { value: "standard", nameEN: "Standard Packaging", nameAR: "تعبئة قياسية", addonPriceEGP: 0 },
                { value: "vacuum_sealed", nameEN: "Vacuum Sealed", nameAR: "تعبئة مفرغة", addonPriceEGP: 100 }
            ]
        },
        apiError: null,
        userFriendlyApiError: "",
        ...JSON.parse(JSON.stringify(initialBookingState)),
        bookingConfirmed: false,
        statusResult: null,
        statusNotFound: false,
        lookupBookingID: "",
        currentCurrency: "EGP",
        bookingID: "",
        currentConceptualStep: 1,
        stepProgress: { step1: false, step2: false, step3: false, step4: false, step5: false },
        isMobileMenuOpen: false,
        isUdheyaDropdownOpen: false,
        isUdheyaMobileSubmenuOpen: false,
        stepSectionsMeta: [],
        countdown: { days: "00", hours: "00", minutes: "00", seconds: "00", ended: false },
        promoHasEnded: false,
        calculatedPromoDaysLeft: 0,
        countdownTimerInterval: null,
        currentLang: "en",
        errors: {},
        errorMessages: {
            required: { en: "This field is required.", ar: "هذا الحقل مطلوب." },
            select: { en: "Please make a selection.", ar: "يرجى الاختيار." },
            email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." },
            phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." }
        },
        navLinksData: [
            { href: "#udheya-booking-start", sectionId: "udheya-booking-start", parentMenu: "Udheya" },
            { href: "#how-it-works", sectionId: "how-it-works", parentMenu: "Udheya" },
            { href: "#check-booking-status", sectionId: "check-booking-status", parentMenu: "Udheya" },
            { href: "#livestock-section", sectionId: "livestock-section" },
            { href: "#meat-section", sectionId: "meat-section" }
        ],
        activeNavLinkHref: "",

        async initApp() {
            this.isLoading.init = true;
            this.apiError = null;
            this.userFriendlyApiError = "";
            const defaultLocalSettings = JSON.parse(JSON.stringify(this.appSettings));

            try {
                const globalConfigFilter = "filter=(setting_key='global_config')&perPage=1";
                const [appSettingsResponse, livestockResponse] = await Promise.all([
                    fetchApiData("app_settings", { queryParams: globalConfigFilter }),
                    fetchApiData("livestock_types")
                ]);

                if (appSettingsResponse?.items?.length) {
                    const remoteSettingsRecord = appSettingsResponse.items[0];
                    const mergedSettings = JSON.parse(JSON.stringify(defaultLocalSettings));
                    for (const key in remoteSettingsRecord) {
                        if (remoteSettingsRecord.hasOwnProperty(key) && key !== "site_name") {
                            const remoteValue = remoteSettingsRecord[key];
                            if (typeof remoteValue === "object" && remoteValue !== null &&
                                typeof mergedSettings[key] === "object" && mergedSettings[key] !== null &&
                                !Array.isArray(remoteValue)) {
                                mergedSettings[key] = { ...mergedSettings[key], ...remoteValue };
                            } else {
                                mergedSettings[key] = remoteValue;
                            }
                        }
                    }
                    if (!mergedSettings.whatsapp_number_raw) mergedSettings.whatsapp_number_raw = defaultLocalSettings.whatsapp_number_raw;
                    if (!mergedSettings.whatsapp_number_display) mergedSettings.whatsapp_number_display = defaultLocalSettings.whatsapp_number_display;
                    for (const detailKey in defaultLocalSettings.payment_details) {
                        if (!mergedSettings.payment_details[detailKey] && mergedSettings.payment_details[detailKey] !== null) {
                             mergedSettings.payment_details[detailKey] = defaultLocalSettings.payment_details[detailKey];
                        }
                    }
                    this.appSettings = mergedSettings;
                } else {
                    this.appSettings = defaultLocalSettings;
                }

                if (livestockResponse?.items) {
                    this.productOptions.livestock = livestockResponse.items.map(item => ({
                        pbId: item.id,
                        value_key: item.value_key,
                        name_en: item.name_en,
                        name_ar: item.name_ar,
                        weights_prices: Array.isArray(item.weights_prices) ? item.weights_prices.map(wp => ({ ...wp })) : []
                    }));
                } else {
                    this.productOptions.livestock = [];
                }

            } catch (error) {
                this.apiError = String(error.message || "Unknown error during data fetch.");
                this.userFriendlyApiError = String(error?.message).includes("Network Error") ?
                    String(error.message) :
                    (String(error?.message) || "Failed to load settings. Please refresh or try again later.");
                this.appSettings = JSON.parse(JSON.stringify(defaultLocalSettings));
                this.productOptions.livestock = [];
            } finally {
                this.isLoading.init = false;
            }

            if (typeof this.appSettings.default_currency !== "string" || !this.appSettings.exchange_rates[this.appSettings.default_currency]) {
                this.appSettings.default_currency = "EGP";
            }
            this.currentCurrency = this.appSettings.default_currency;

            this.startOfferDHDMSCountdown();
            this.updateSacrificeDayTexts();
            this.updateAllDisplayedPrices();
            this.clearAllErrors();

            this.$watch(['selectedAnimal.basePriceEGP', 'selectedPackaging.addonPriceEGP'], () => this.calculateTotalPrice());
            this.$watch('currentCurrency', () => {
                this.calculateTotalPrice();
                this.updateAllDisplayedPrices();
            });
            this.$watch('selectedSacrificeDay.value', () => this.updateSacrificeDayTexts());
            this.$watch('selectedTimeSlot', () => this.updateStepCompletionStatus(3));
            this.$watch('distributionChoice', (newValue) => {
                if (newValue !== 'split') {
                    this.splitDetailsOption = "";
                    this.customSplitDetailsText = "";
                }
                if (newValue === 'char') {
                    Object.assign(this, {
                        deliveryName: "", deliveryPhone: "", selectedGovernorate: "",
                        deliveryCity: "", deliveryAddress: "", deliveryInstructions: "", availableCities: []
                    });
                }
                this.clearError('splitDetails');
                this.updateStepCompletionStatus(4);
            });
            this.$watch('selectedPrepStyle.value', () => {
                if (!this.selectedPrepStyle.is_custom) this.customPrepDetails = "";
                this.updateStepCompletionStatus(2);
            });
            this.$watch('selectedPackaging.value', () => this.updateStepCompletionStatus(2));
            this.$watch('splitDetailsOption', (newValue) => {
                if (newValue !== 'custom') this.customSplitDetailsText = "";
                this.clearError('splitDetails');
                this.updateStepCompletionStatus(4);
            });
            this.$watch('customSplitDetailsText', () => this.updateStepCompletionStatus(4));
            this.$watch('selectedGovernorate', () => {
                this.updateCities();
                this.clearError('deliveryCity');
                this.updateStepCompletionStatus(4);
            });
            this.$watch('deliveryCity', () => this.updateStepCompletionStatus(4));
            this.$watch('deliveryName', () => this.updateStepCompletionStatus(4));
            this.$watch('deliveryPhone', () => this.updateStepCompletionStatus(4));
            this.$watch('deliveryAddress', () => this.updateStepCompletionStatus(4));
            this.$watch('paymentMethod', () => this.updateStepCompletionStatus(5));

            this.stepSectionsMeta = ["#step1-content", "#step2-content", "#step3-content", "#step4-content", "#step5-content"]
                .map((selector, index) => ({
                    id: selector,
                    conceptualStep: index + 1,
                    element: document.querySelector(selector),
                    titleRef: `step${index + 1}Title`,
                    firstFocusableErrorRef: null
                }));

            this.$nextTick(() => {
                this.updateAllStepCompletionStates();
                this.handleScroll();
                const initialFocusRef = this.bookingConfirmed ? "bookingConfirmedTitle" : (this.$refs.step1Title ? "step1Title" : "bookingSectionTitle");
                this.focusOnRef(initialFocusRef);
            });

            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.startOfferDHDMSCountdown();
                } else if (this.countdownTimerInterval) {
                    clearInterval(this.countdownTimerInterval);
                }
            });
        },

        handleScroll() {
            if (!this.bookingConfirmed && this.stepSectionsMeta.some(step => step.element && typeof step.element.offsetTop === 'number')) {
                const scrollMidPoint = window.scrollY + (window.innerHeight / 2);
                let closestStep = 1;
                let minDistance = Infinity;

                this.stepSectionsMeta.forEach(stepMeta => {
                    if (stepMeta.element) {
                        const sectionTop = stepMeta.element.offsetTop;
                        const sectionMidPoint = sectionTop + (stepMeta.element.offsetHeight / 2);
                        const distance = Math.abs(scrollMidPoint - sectionMidPoint);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestStep = stepMeta.conceptualStep;
                        }
                    }
                });
                this.currentConceptualStep = closestStep;
            }

            const headerHeight = document.querySelector('.site-header')?.offsetHeight || 70;
            const scrollCheckOffset = headerHeight + (window.innerHeight * 0.10);
            const currentScrollYWithOffset = window.scrollY + scrollCheckOffset;
            let newActiveNavLinkHref = "";
            let newActiveParentMenu = null;

            for (const navLink of this.navLinksData) {
                const sectionElement = document.getElementById(navLink.sectionId);
                if (sectionElement) {
                    const sectionTop = sectionElement.offsetTop;
                    const sectionBottom = sectionTop + sectionElement.offsetHeight;
                    if (sectionTop <= currentScrollYWithOffset && sectionBottom > currentScrollYWithOffset) {
                        newActiveNavLinkHref = navLink.href;
                        newActiveParentMenu = navLink.parentMenu;
                        break;
                    }
                }
            }
            const firstNavLinkSection = document.getElementById(this.navLinksData[0]?.sectionId);
            if (window.scrollY < (firstNavLinkSection?.offsetTop || headerHeight) - headerHeight) {
                 newActiveNavLinkHref = "";
                 newActiveParentMenu = null;
            } else if ((window.innerHeight + Math.ceil(window.scrollY)) >= (document.body.offsetHeight - 2)) {
                const lastVisibleNavLink = this.navLinksData.slice().reverse().find(nl => document.getElementById(nl.sectionId));
                if (lastVisibleNavLink) {
                    newActiveNavLinkHref = lastVisibleNavLink.href;
                    newActiveParentMenu = lastVisibleNavLink.parentMenu;
                }
            }
            this.activeNavLinkHref = newActiveParentMenu || newActiveNavLinkHref;
        },

        setError(field, messageKeyOrObject) {
            let messageObject;
            if (typeof messageKeyOrObject === 'string') {
                messageObject = this.errorMessages[messageKeyOrObject] || { en: messageKeyOrObject, ar: messageKeyOrObject };
            } else {
                messageObject = messageKeyOrObject;
            }
            if (typeof messageObject === 'object' && messageObject !== null &&
                typeof messageObject.en === 'string' && typeof messageObject.ar === 'string') {
                this.errors[field] = messageObject;
            } else {
                this.errors[field] = this.errorMessages.required;
            }
        },
        clearError(field) {
            if (this.errors[field]) {
                this.$delete(this.errors, field);
            }
        },
        clearAllErrors() {
            this.errors = {};
        },
        focusOnRef(refName) {
            this.$nextTick(() => {
                if (this.$refs[refName]) {
                    this.$refs[refName].focus({ preventScroll: false });
                    setTimeout(() => {
                        try {
                             this.$refs[refName].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                        } catch(e) { /* ignore scroll errors */ }
                    }, 50);
                }
            });
        },

        get _needsDeliveryDetails() {
            const customDetailsLower = (this.customSplitDetailsText || "").toLowerCase();
            return this.distributionChoice === 'me' ||
                   (this.distributionChoice === 'split' &&
                       (["1/3_me_2/3_charity_sl", "1/2_me_1/2_charity_sl", "2/3_me_1/3_charity_sl", "all_me_custom_distro"].includes(this.splitDetailsOption) ||
                       (this.splitDetailsOption === 'custom' && (customDetailsLower.includes("for me") || customDetailsLower.includes("all delivered to me"))))
                   );
        },
        get splitDetails() {
            if (this.distributionChoice !== 'split') return "";
            if (this.splitDetailsOption === 'custom') return (this.customSplitDetailsText || "").trim();
            const optionsMap = {
                "1/3_me_2/3_charity_sl": { en: "1/3 for me (delivered), 2/3 for charity (by Sheep Land)", ar: "ثلث لي (يوصل)، ثلثان للصدقة (بواسطة أرض الأغنام)" },
                "1/2_me_1/2_charity_sl": { en: "1/2 for me (delivered), 1/2 for charity (by Sheep Land)", ar: "نصف لي (يوصل)، نصف للصدقة (بواسطة أرض الأغنام)" },
                "2/3_me_1/3_charity_sl": { en: "2/3 for me (delivered), 1/3 for charity (by Sheep Land)", ar: "ثلثان لي (يوصل)، ثلث للصدقة (بواسطة أرض الأغنام)" },
                "all_me_custom_distro": { en: "All for me (I distribute)", ar: "الكل لي (أنا أوزع)" }
            };
            const selected = optionsMap[this.splitDetailsOption];
            return selected ? (this.currentLang === 'ar' ? selected.ar : selected.en) : this.splitDetailsOption;
        },
        _getDeliveryLocation(lang) {
            const nameKey = lang === 'en' ? 'name_en' : 'name_ar';
            const governorateObj = (this.appSettings.delivery_areas || []).find(area => area.id === this.selectedGovernorate);
            const cityObj = governorateObj?.cities?.find(city => city.id === this.deliveryCity);
            if (cityObj && typeof cityObj[nameKey] === 'string') return cityObj[nameKey];
            if (governorateObj && governorateObj.cities?.length === 0 && this.selectedGovernorate && typeof governorateObj[nameKey] === 'string') return governorateObj[nameKey];
            if (governorateObj && !cityObj && this.selectedGovernorate && typeof governorateObj[nameKey] === 'string') return `${governorateObj[nameKey]} (${lang === 'en' ? "City not selected" : "المدينة غير مختارة"})`;
            return "";
        },
        get summaryDeliveryToEN() {
            if (this.distributionChoice === 'char') return "Charity Distribution by Sheep Land";
            if (this._needsDeliveryDetails) {
                const name = (this.deliveryName || "").trim();
                const phone = (this.deliveryPhone || "").trim();
                const govId = this.selectedGovernorate;
                const cityId = this.deliveryCity;
                const address = (this.deliveryAddress || "").trim();
                const govArea = (this.appSettings.delivery_areas || []).find(area => area.id === govId);
                const isCityRequiredButNotSelected = govArea && Array.isArray(govArea.cities) && govArea.cities.length > 0 && !cityId;
                if (!name || !phone || !govId || isCityRequiredButNotSelected || !address) return "Delivery Details Incomplete";
                const locationNameEN = this._getDeliveryLocation('en');
                const shortAddress = address ? (address.substring(0, 20) + (address.length > 20 ? "..." : "")) : "";
                return [name, locationNameEN, shortAddress].filter(part => typeof part === 'string' && part.trim() !== "").join(", ");
            }
            return "Self Pickup / Distribution as per split";
        },
        get summaryDeliveryToAR() {
            if (this.distributionChoice === 'char') return "توزيع خيري بواسطة أرض الأغنام";
            if (this._needsDeliveryDetails) {
                const name = (this.deliveryName || "").trim();
                const phone = (this.deliveryPhone || "").trim();
                const govId = this.selectedGovernorate;
                const cityId = this.deliveryCity;
                const address = (this.deliveryAddress || "").trim();
                const govArea = (this.appSettings.delivery_areas || []).find(area => area.id === govId);
                const isCityRequiredButNotSelected = govArea && Array.isArray(govArea.cities) && govArea.cities.length > 0 && !cityId;
                if (!name || !phone || !govId || isCityRequiredButNotSelected || !address) return "تفاصيل التوصيل غير مكتملة";
                const locationNameAR = this._getDeliveryLocation('ar');
                const shortAddress = address ? (address.substring(0, 20) + (address.length > 20 ? "..." : "")) : "";
                return [name, locationNameAR, shortAddress].filter(part => typeof part === 'string' && part.trim() !== "").join("، ");
            }
            return "استلام ذاتي / توزيع حسب التقسيم";
        },
        get summaryDistributionEN() {
            if (this.distributionChoice === 'me') return "All to me";
            if (this.distributionChoice === 'char') return "All to charity (by Sheep Land)";
            return `Split: ${(this.splitDetails || "").trim() || "(Not specified)"}`;
        },
        get summaryDistributionAR() {
            if (this.distributionChoice === 'me') return "الكل لي";
            if (this.distributionChoice === 'char') return "تبرع بالكل للصدقة (أرض الأغنام توزع)";
            return `تقسيم الحصص: ${(this.splitDetails || "").trim() || "(لم يحدد)"}`;
        },

        startOfferDHDMSCountdown() {
            if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
            if (!this.appSettings.promo_is_active || !this.appSettings.promo_end_date) {
                this.countdown.ended = true; this.promoHasEnded = true; this.calculatedPromoDaysLeft = 0; return;
            }
            if (!this.appSettings.promo_end_date || typeof this.appSettings.promo_end_date !== 'string') {
                 this.countdown.ended = true; return;
            }
            const targetTime = new Date(this.appSettings.promo_end_date).getTime();
            if (isNaN(targetTime)) { this.countdown.ended = true; return; }
            this.updateDHDMSCountdownDisplay(targetTime);
            this.countdownTimerInterval = setInterval(() => this.updateDHDMSCountdownDisplay(targetTime), 1000);
        },
        updateDHDMSCountdownDisplay(targetTime) {
            const now = new Date().getTime();
            const distance = targetTime - now;
            if (distance < 0) {
                if (this.countdownTimerInterval) clearInterval(this.countdownTimerInterval);
                Object.assign(this.countdown, { days: "00", hours: "00", minutes: "00", seconds: "00", ended: true });
                this.promoHasEnded = true; this.calculatedPromoDaysLeft = 0; return;
            }
            this.countdown.ended = false; this.promoHasEnded = false;
            const days = Math.floor(distance / 864e5);
            const hours = Math.floor(distance % 864e5 / 36e5);
            const minutes = Math.floor(distance % 36e5 / 6e4);
            const seconds = Math.floor(distance % 6e4 / 1e3);
            Object.assign(this.countdown, {
                days: String(days).padStart(2, '0'), hours: String(hours).padStart(2, '0'),
                minutes: String(minutes).padStart(2, '0'), seconds: String(seconds).padStart(2, '0')
            });
            this.calculatedPromoDaysLeft = days;
        },

        updateCities() {
            const selectedGovData = (this.appSettings.delivery_areas || []).find(area => area.id === this.selectedGovernorate);
            this.availableCities = selectedGovData?.cities || [];
            this.deliveryCity = "";
        },

        getFormattedPrice(priceEGP, currencyCode) {
            const finalCurrencyCode = currencyCode || this.currentCurrency;
            const currencyInfo = this.appSettings?.exchange_rates?.[finalCurrencyCode];
            if (priceEGP == null || !currencyInfo || typeof currencyInfo.rate_from_egp !== 'number') return `${currencyInfo?.symbol || '?'} ---`;
            const convertedPrice = priceEGP * currencyInfo.rate_from_egp;
            const decimalPlaces = (currencyInfo.symbol === "LE" || currencyInfo.symbol === "ل.م") ? 0 : 2;
            return `${currencyInfo.symbol} ${convertedPrice.toFixed(decimalPlaces)}`;
        },

        isValidEmail: (email) => (!email || typeof email !== 'string' || !email.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        isValidPhone: (phone) => phone && typeof phone === 'string' && /^\+?[0-9\s\-()]{7,20}$/.test(phone.trim()),

        scrollToSection(selector) {
            try {
                const element = document.querySelector(selector);
                if (element) {
                    let offset = document.querySelector('.site-header')?.offsetHeight || 0;
                    if (selector.startsWith('#udheya-booking-start') || selector.startsWith('#step') || selector.startsWith('#udheya-booking-form-panel')) {
                        const stepperHeader = document.querySelector('.stepper-outer-wrapper');
                        if (stepperHeader && getComputedStyle(stepperHeader).position === 'sticky') offset += stepperHeader.offsetHeight;
                    }
                    const elementRectTop = element.getBoundingClientRect().top;
                    const targetScrollY = elementRectTop + window.pageYOffset - offset - 10;
                    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                }
            } catch (error) { /* console.warn("ScrollToSection error:", error); */ }
        },

        validateConceptualStep(conceptualStep, setErrors = true) {
            let isValid = false;
            switch (conceptualStep) {
                case 1: isValid = this.validateStep1(setErrors); break;
                case 2: isValid = this.validateStep2(setErrors); break;
                case 3: isValid = this.validateStep3(setErrors); break;
                case 4: isValid = this.validateStep4(setErrors); break;
                case 5: isValid = this.validateStep5(setErrors); break;
                default: isValid = false;
            }
            this.stepProgress[`step${conceptualStep}`] = isValid;
            return isValid;
        },
        updateStepCompletionStatus(conceptualStep) {
            this.stepProgress[`step${conceptualStep}`] = this.validateConceptualStep(conceptualStep, false);
        },
        updateAllStepCompletionStates() {
            for (let i = 1; i <= 5; i++) this.updateStepCompletionStatus(i);
        },
        handleStepperNavigation(targetConceptualStep) {
            this.clearAllErrors();
            let canProceed = true;
            for (let step = 1; step < targetConceptualStep; step++) {
                if (!this.validateConceptualStep(step, true)) {
                    this.currentConceptualStep = step;
                    const stepMeta = this.stepSectionsMeta[step - 1];
                    if (stepMeta && stepMeta.firstFocusableErrorRef) this.focusOnRef(stepMeta.firstFocusableErrorRef);
                    else if (stepMeta) this.focusOnRef(stepMeta.titleRef);
                    this.scrollToSection(this.stepSectionsMeta[step-1]?.id || '#udheya-booking-start');
                    canProceed = false; break;
                }
            }
            if (canProceed) {
                this.currentConceptualStep = targetConceptualStep;
                this.scrollToSection(this.stepSectionsMeta[targetConceptualStep-1]?.id || '#udheya-booking-start');
                this.focusOnRef(this.stepSectionsMeta[targetConceptualStep-1]?.titleRef);
            }
        },
        validateAndScrollOrFocus(currentStepNum, targetSectionSelector) {
            this.clearAllErrors();
            const isCurrentStepValid = this.validateConceptualStep(currentStepNum, true);
            this.stepProgress[`step${currentStepNum}`] = isCurrentStepValid;
            if (isCurrentStepValid) {
                if (currentStepNum === 1 && targetSectionSelector === '#step2-content') this.currentConceptualStep = 2;
                this.scrollToSection(targetSectionSelector);
                const targetStepMeta = this.stepSectionsMeta.find(sm => sm.id === targetSectionSelector || sm.id === targetSectionSelector.substring(1));
                this.focusOnRef(targetStepMeta?.titleRef || this.stepSectionsMeta[currentStepNum]?.titleRef || targetSectionSelector);
            } else {
                const currentStepMeta = this.stepSectionsMeta[currentStepNum - 1];
                if (currentStepMeta && currentStepMeta.firstFocusableErrorRef) this.focusOnRef(currentStepMeta.firstFocusableErrorRef);
                else if (currentStepMeta) this.focusOnRef(currentStepMeta.titleRef);
                this.scrollToSection(currentStepMeta?.id || '#udheya-booking-start');
            }
        },

        validateStep1(setErrors = true) {
            if (setErrors) this.clearError('animal');
            let firstErrorRef = null;
            const currentStepMeta = this.stepSectionsMeta[0];
            if (!this.selectedAnimal.type || !this.selectedAnimal.weight) {
                if (setErrors) {
                    this.setError('animal', { en: "Please select an animal and its weight.", ar: "يرجى اختيار الحيوان ووزنه." });
                    if (!this.selectedAnimal.type) firstErrorRef = this.$refs.baladiWeightSelect ? 'baladiWeightSelect' : (this.$refs.barkiWeightSelect ? 'barkiWeightSelect' : null);
                    else if (this.selectedAnimal.type === 'baladi' && !this.selectedAnimal.weight) firstErrorRef = 'baladiWeightSelect';
                    else if (this.selectedAnimal.type === 'barki' && !this.selectedAnimal.weight) firstErrorRef = 'barkiWeightSelect';
                }
                if (currentStepMeta) currentStepMeta.firstFocusableErrorRef = firstErrorRef;
                this.stepProgress.step1 = false; return false;
            }
            const animalTypeConfig = this.productOptions.livestock.find(lt => lt.value_key === this.selectedAnimal.type);
            const weightPriceInfo = animalTypeConfig?.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight);
            if (!weightPriceInfo || !weightPriceInfo.is_active || (weightPriceInfo.stock != null && weightPriceInfo.stock <= 0)) {
                if (setErrors) {
                    this.setError('animal', {
                        en: `${this.selectedAnimal.nameEN || "Your selected animal"} (${this.selectedAnimal.weight}) is no longer in stock. Please re-select.`,
                        ar: `${this.selectedAnimal.nameAR || "الحيوان المختار"} (${this.selectedAnimal.weight}) لم يعد متوفراً. يرجى إعادة الاختيار.`
                    });
                    firstErrorRef = this.selectedAnimal.type === 'baladi' ? 'baladiWeightSelect' : 'barkiWeightSelect';
                    this.selectedAnimal = { ...initialBookingState.selectedAnimal };
                    this.calculateTotalPrice(); this.updateAllDisplayedPrices();
                    document.querySelectorAll('.livestock-card').forEach(card => card.classList.remove('livestock-card-selected'));
                }
                if (currentStepMeta) currentStepMeta.firstFocusableErrorRef = firstErrorRef;
                this.stepProgress.step1 = false; return false;
            }
            if (currentStepMeta) currentStepMeta.firstFocusableErrorRef = null;
            this.stepProgress.step1 = true; return true;
        },
        validateStep2(setErrors = true) {
            if (setErrors) { this.clearError('prepStyle'); this.clearError('packaging'); }
            let isValid = true; let firstErrorRef = null;
            const currentStepMeta = this.stepSectionsMeta[1];
            if (!this.selectedPrepStyle.value) {
                if (setErrors) { this.setError('prepStyle', 'select'); if (!firstErrorRef) firstErrorRef = 'prepStyleSelect'; }
                isValid = false;
            }
            if (!this.selectedPackaging.value) {
                if (setErrors) { this.setError('packaging', 'select'); if (!firstErrorRef) firstErrorRef = 'packagingSelect'; }
                isValid = false;
            }
            if (currentStepMeta) currentStepMeta.firstFocusableErrorRef = firstErrorRef;
            this.stepProgress.step2 = isValid; return isValid;
        },
        validateStep3(setErrors = true) {
            const currentStepMeta = this.stepSectionsMeta[2];
            if (currentStepMeta) currentStepMeta.firstFocusableErrorRef = null;
            this.stepProgress.step3 = true; return true;
        },
        validateStep4(setErrors = true) {
            if (setErrors) { this.clearError('splitDetails'); this.clearError('deliveryName'); this.clearError('deliveryPhone'); this.clearError('customerEmail'); this.clearError('selectedGovernorate'); this.clearError('deliveryCity'); this.clearError('deliveryAddress');}
            let isValid = true; let firstErrorRef = null;
            const currentStepMeta = this.stepSectionsMeta[3];
            const setFieldError = (field, msgKey, ref) => { if (setErrors) this.setError(field, msgKey); isValid = false; if (setErrors && !firstErrorRef) firstErrorRef = ref; };
            if (this.distributionChoice === 'split') {
                if (!this.splitDetailsOption) setFieldError('splitDetails', 'select', 'distributionChoiceRadios');
                else if (this.splitDetailsOption === 'custom' && !(this.customSplitDetailsText || "").trim()) setFieldError('splitDetails', 'required', 'customSplitTextarea');
            }
            if (this._needsDeliveryDetails) {
                if (!(this.deliveryName || "").trim()) setFieldError('deliveryName', 'required', 'deliveryNameInput');
                if (!(this.deliveryPhone || "").trim()) setFieldError('deliveryPhone', 'required', 'deliveryPhoneInput');
                else if (!this.isValidPhone((this.deliveryPhone || "").trim())) setFieldError('deliveryPhone', 'phone', 'deliveryPhoneInput');
                if ((this.customerEmail || "").trim() && !this.isValidEmail((this.customerEmail || "").trim())) setFieldError('customerEmail', 'email', 'customerEmailInput');
                if (!this.selectedGovernorate) setFieldError('selectedGovernorate', 'select', 'deliveryGovernorateSelect');
                const selectedGovConfig = (this.appSettings.delivery_areas || []).find(area => area.id === this.selectedGovernorate);
                if (selectedGovConfig && Array.isArray(selectedGovConfig.cities) && selectedGovConfig.cities.length > 0 && !this.deliveryCity) setFieldError('deliveryCity', 'select', 'deliveryCitySelect');
                if (!(this.deliveryAddress || "").trim()) setFieldError('deliveryAddress', 'required', 'deliveryAddressInput');
            }
            if (currentStepMeta) currentStepMeta.firstFocusableErrorRef = firstErrorRef;
            this.stepProgress.step4 = isValid; return isValid;
        },
        validateStep5(setErrors = true) {
            if (setErrors) this.clearError('paymentMethod');
            let firstErrorRef = null; const currentStepMeta = this.stepSectionsMeta[4];
            if (!this.paymentMethod) {
                if (setErrors) { this.setError('paymentMethod', 'select'); firstErrorRef = 'paymentMethodRadios'; }
                if (currentStepMeta) currentStepMeta.firstFocusableErrorRef = firstErrorRef;
                this.stepProgress.step5 = false; return false;
            }
            if (currentStepMeta) currentStepMeta.firstFocusableErrorRef = null;
            this.stepProgress.step5 = true; return true;
        },

        selectAnimal(animalTypeValueKey, weightSelectElement) {
            this.clearError('animal');
            const animalConfig = this.productOptions.livestock.find(lt => lt.value_key === animalTypeValueKey);
            if (!animalConfig) {
                this.setError('animal', { en: "Invalid animal type specified.", ar: "تم تحديد نوع حيوان غير صالح." });
                this.updateStepCompletionStatus(1); return;
            }
            const selectedWeightValue = weightSelectElement.value;
            if (!selectedWeightValue) {
                if (this.selectedAnimal.type === animalTypeValueKey) {
                    this.selectedAnimal = { ...initialBookingState.selectedAnimal };
                    this.calculateTotalPrice();
                    document.getElementById(animalTypeValueKey)?.classList.remove('livestock-card-selected');
                }
                this.updateStepCompletionStatus(1); return;
            }
            const weightPriceConfig = animalConfig.weights_prices.find(wp => wp.weight_range === selectedWeightValue);
            if (!weightPriceConfig || !weightPriceConfig.is_active || (weightPriceConfig.stock != null && weightPriceConfig.stock <= 0)) {
                this.setError('animal', {
                    en: `${animalConfig.name_en || "Selected animal"} (${selectedWeightValue}) is currently out of stock. Please choose another weight.`,
                    ar: `${animalConfig.name_ar || "الحيوان المختار"} (${selectedWeightValue}) غير متوفر حاليًا. يرجى اختيار وزن آخر.`
                });
                if (this.selectedAnimal.type === animalTypeValueKey && this.selectedAnimal.weight === selectedWeightValue) {
                    this.selectedAnimal = { ...initialBookingState.selectedAnimal };
                    document.getElementById(animalTypeValueKey)?.classList.remove('livestock-card-selected');
                }
                this.calculateTotalPrice(); if (this.$refs[weightSelectElement.id]) this.focusOnRef(weightSelectElement.id);
                this.updateStepCompletionStatus(1); return;
            }
            const otherAnimalTypeKey = animalTypeValueKey === 'baladi' ? 'barki' : 'baladi';
            if (this.selectedAnimal.type && this.selectedAnimal.type !== animalTypeValueKey) {
                const otherWeightSelect = this.$refs[`${otherAnimalTypeKey}WeightSelect`];
                if (otherWeightSelect) otherWeightSelect.value = "";
                document.getElementById(otherAnimalTypeKey)?.classList.remove('livestock-card-selected');
            }
            this.selectedAnimal = {
                type: animalConfig.value_key, value: animalConfig.value_key, weight: weightPriceConfig.weight_range,
                basePriceEGP: parseFloat(weightPriceConfig.price_egp), stock: weightPriceConfig.stock, originalStock: weightPriceConfig.stock,
                nameEN: animalConfig.name_en, nameAR: animalConfig.name_ar, pbId: animalConfig.pbId
            };
            this.calculateTotalPrice();
            document.querySelectorAll('.livestock-card').forEach(card => card.classList.remove('livestock-card-selected'));
            weightSelectElement.closest('.livestock-card').classList.add('livestock-card-selected');
            this.updateStepCompletionStatus(1);
            if (this.stepProgress.step1) this.validateAndScrollOrFocus(1, '#step2-content');
        },

        updateSelectedPrepStyle(value) {
            const selectedOption = this.productOptions.preparationStyles.find(style => style.value === value);
            this.selectedPrepStyle = selectedOption ? { ...selectedOption } : { value: "", nameEN: "", nameAR: "", is_custom: false };
            if (!this.selectedPrepStyle.is_custom) this.customPrepDetails = "";
            this.calculateTotalPrice(); this.updateStepCompletionStatus(2);
        },
        updateSelectedPackaging(value) {
            const selectedOption = this.productOptions.packagingOptions.find(pkg => pkg.value === value);
            this.selectedPackaging = selectedOption ? { ...selectedOption, addonPriceEGP: parseFloat(selectedOption.addonPriceEGP || 0) } : { value: "", addonPriceEGP: 0, nameEN: "", nameAR: "" };
            this.calculateTotalPrice(); this.updateStepCompletionStatus(2);
        },
        updateSacrificeDayTexts() {
            const optionElement = document.querySelector(`#sacrifice_day_select_s3 option[value="${this.selectedSacrificeDay.value}"]`);
            if (optionElement) Object.assign(this.selectedSacrificeDay, { textEN: optionElement.dataset.en, textAR: optionElement.dataset.ar });
            this.updateStepCompletionStatus(3);
        },

        calculateTotalPrice() {
            this.totalPriceEGP = (this.selectedAnimal.basePriceEGP || 0) + (this.selectedPackaging.addonPriceEGP || 0);
        },

        updateAllDisplayedPrices() {
            try {
                (this.productOptions.livestock || []).forEach(livestockType => {
                    const cardElement = document.getElementById(livestockType.value_key);
                    const weightSelectElement = cardElement?.querySelector('select');
                    if (!cardElement || !weightSelectElement) return;
                    const currentSelectedWeightInDropdown = weightSelectElement.value;
                    weightSelectElement.innerHTML = "";
                    const defaultOption = document.createElement('option');
                    defaultOption.value = ""; defaultOption.textContent = this.currentLang === 'ar' ? "-- اختر الوزن --" : "-- Select Weight --";
                    defaultOption.disabled = false; weightSelectElement.appendChild(defaultOption);
                    let firstAvailableWeight = null; let currentSelectionStillValid = false;
                    (livestockType.weights_prices || []).forEach(weightPrice => {
                        const optionEl = document.createElement('option');
                        optionEl.value = weightPrice.weight_range;
                        const isOutOfStock = !weightPrice.is_active || (weightPrice.stock != null && weightPrice.stock <= 0);
                        const stockTextEN = isOutOfStock ? " - Out of Stock" : (weightPrice.stock != null ? ` - Stock: ${weightPrice.stock}` : "");
                        const stockTextAR = isOutOfStock ? " - نفذت الكمية" : (weightPrice.stock != null ? ` - الكمية: ${weightPrice.stock}` : "");
                        optionEl.textContent = `${weightPrice.weight_range || ""} (${this.getFormattedPrice(weightPrice.price_egp)})${this.currentLang === 'ar' ? stockTextAR : stockTextEN}`;
                        optionEl.disabled = isOutOfStock; weightSelectElement.appendChild(optionEl);
                        if (!isOutOfStock && firstAvailableWeight === null) firstAvailableWeight = weightPrice.weight_range;
                        if (weightPrice.weight_range === currentSelectedWeightInDropdown && !isOutOfStock) currentSelectionStillValid = true;
                    });
                    if (currentSelectedWeightInDropdown && currentSelectionStillValid) weightSelectElement.value = currentSelectedWeightInDropdown;
                    else if (this.selectedAnimal.type === livestockType.value_key && this.selectedAnimal.weight &&
                               livestockType.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight && wp.is_active && (wp.stock == null || wp.stock > 0))) {
                        weightSelectElement.value = this.selectedAnimal.weight;
                    } else weightSelectElement.value = "";
                    const firstActiveWeightPrice = (livestockType.weights_prices || []).find(wp => wp.is_active && (wp.stock == null || wp.stock > 0));
                    const fromPriceEgp = firstActiveWeightPrice ? firstActiveWeightPrice.price_egp : ((livestockType.weights_prices || [])[0]?.price_egp || 0);
                    const priceSpanEN = cardElement.querySelector('.price.bil-row .en span');
                    const priceSpanAR = cardElement.querySelector('.price.bil-row .ar span');
                    if (priceSpanEN) priceSpanEN.textContent = this.getFormattedPrice(fromPriceEgp);
                    if (priceSpanAR) priceSpanAR.textContent = this.getFormattedPrice(fromPriceEgp);
                });
                this.calculateTotalPrice();
            } catch (error) { this.userFriendlyApiError = "Error updating price displays."; }
        },

        async validateAndSubmitBooking() {
            this.clearAllErrors();
            let isFormValid = true;
            for (let step = 1; step <= 5; step++) {
                if (!this.validateConceptualStep(step, true)) {
                    isFormValid = false;
                    const stepMeta = this.stepSectionsMeta[step - 1];
                    if (stepMeta) {
                        const focusTargetRef = stepMeta.firstFocusableErrorRef || stepMeta.titleRef;
                        if (focusTargetRef) this.focusOnRef(focusTargetRef);
                        this.scrollToSection(stepMeta.id || '#udheya-booking-start');
                    }
                    break;
                }
            }
            if (!isFormValid) return;

            const selectedAnimalConfig = this.productOptions.livestock.find(lt => lt.value_key === this.selectedAnimal.value);
            const selectedWeightPriceInfo = selectedAnimalConfig?.weights_prices.find(wp => wp.weight_range === this.selectedAnimal.weight);
            if (!selectedAnimalConfig || !selectedWeightPriceInfo || !selectedWeightPriceInfo.is_active || (selectedWeightPriceInfo.stock != null && selectedWeightPriceInfo.stock <= 0)) {
                this.setError('animal', {
                    en: `Sorry, ${this.selectedAnimal.nameEN || "your selected item"} (${this.selectedAnimal.weight}) is no longer available. Please reselect.`,
                    ar: `عذراً، ${this.selectedAnimal.nameAR || "المنتج المختار"} (${this.selectedAnimal.weight}) لم يعد متوفراً. يرجى إعادة الاختيار.`
                });
                this.selectedAnimal = { ...initialBookingState.selectedAnimal }; this.updateAllDisplayedPrices();
                this.updateStepCompletionStatus(1); this.scrollToSection('#step1-content');
                this.focusOnRef(this.stepSectionsMeta[0].titleRef); return;
            }

            this.isLoading.booking = true; this.apiError = null; this.userFriendlyApiError = "";
            this.calculateTotalPrice();

            const bookingPayload = {
                booking_id_text: `SL-UDHY-${(new Date()).getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0')}`,
                animal_type_key: this.selectedAnimal.value, animal_type_name_en: this.selectedAnimal.nameEN, animal_type_name_ar: this.selectedAnimal.nameAR,
                animal_weight_selected: this.selectedAnimal.weight, animal_base_price_egp: this.selectedAnimal.basePriceEGP,
                preparation_style_value: this.selectedPrepStyle.value, preparation_style_name_en: this.selectedPrepStyle.nameEN, preparation_style_name_ar: this.selectedPrepStyle.nameAR,
                is_custom_prep: this.selectedPrepStyle.is_custom, custom_prep_details: this.selectedPrepStyle.is_custom ? (this.customPrepDetails || "").trim() : "",
                packaging_value: this.selectedPackaging.value, packaging_name_en: this.selectedPackaging.nameEN, packaging_name_ar: this.selectedPackaging.nameAR,
                packaging_addon_price_egp: this.selectedPackaging.addonPriceEGP, total_price_egp: this.totalPriceEGP,
                sacrifice_day_value: this.selectedSacrificeDay.value, time_slot: this.selectedTimeSlot, distribution_choice: this.distributionChoice,
                split_details_option: this.distributionChoice === 'split' ? this.splitDetailsOption : "",
                custom_split_details_text: (this.distributionChoice === 'split' && this.splitDetailsOption === 'custom') ? (this.customSplitDetailsText || "").trim() : "",
                niyyah_names: (this.niyyahNames || "").trim(), customer_email: (this.customerEmail || "").trim(), group_purchase_interest: this.groupPurchase,
                delivery_name: this._needsDeliveryDetails ? (this.deliveryName || "").trim() : "", delivery_phone: this._needsDeliveryDetails ? (this.deliveryPhone || "").trim() : "",
                delivery_governorate_id: this._needsDeliveryDetails ? this.selectedGovernorate : "", delivery_city_id: this._needsDeliveryDetails ? this.deliveryCity : "",
                delivery_address: this._needsDeliveryDetails ? (this.deliveryAddress || "").trim() : "", delivery_instructions: this._needsDeliveryDetails ? (this.deliveryInstructions || "").trim() : "",
                payment_method: this.paymentMethod, payment_status: (this.paymentMethod === 'cod' && this._needsDeliveryDetails) ? 'cod_pending' : 'pending',
                booking_status: 'confirmed_pending_payment',
            };

            try {
                const postResponse = await fetch('/api/collections/bookings/records', {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify(bookingPayload)
                });

                if (!postResponse.ok) {
                    let apiErrorMessage = "Failed to submit booking";
                    try {
                        const errorBody = await postResponse.json();
                        apiErrorMessage = (errorBody?.data && Object.values(errorBody.data).map(err => String(err.message || JSON.stringify(err))).join("; ")) ||
                                          errorBody?.message ||
                                          `Server error: ${postResponse.status}`;
                    } catch (e) {
                        apiErrorMessage = await postResponse.text() || `Server error: ${postResponse.status}`;
                    }
                    throw new Error(apiErrorMessage);
                }
                const createdRecord = await postResponse.json(); // Ensure this is the only declaration
                this.bookingID = createdRecord.booking_id_text || createdRecord.id;
                if (selectedWeightPriceInfo && selectedWeightPriceInfo.stock != null && selectedWeightPriceInfo.stock > 0) {
                    selectedWeightPriceInfo.stock--;
                }
                this.bookingConfirmed = true;
                this.$nextTick(() => {
                    this.scrollToSection('#booking-confirmation-section');
                    this.focusOnRef('bookingConfirmedTitle');
                });
            } catch (error) {
                this.apiError = String(error.message);
                this.userFriendlyApiError = String(error.message).includes("Network Error") ?
                    String(error.message) :
                    "There was an issue submitting your booking. Please review your details, try again, or contact support.";
                this.scrollToSection('.global-error-indicator');
            } finally {
                this.isLoading.booking = false;
            }
        },

        async validateAndCheckBookingStatus() {
            this.clearError('lookupBookingID');
            if ((this.lookupBookingID || "").trim()) await this.checkBookingStatus();
            else { this.setError('lookupBookingID', 'required'); this.focusOnRef('lookupBookingIdInput'); }
        },
        async checkBookingStatus() {
            this.statusResult = null; this.statusNotFound = false; this.isLoading.status = true;
            this.apiError = null; this.userFriendlyApiError = "";
            const trimmedLookupID = (this.lookupBookingID || "").trim();
            try {
                const filter = `filter=(booking_id_text='${encodeURIComponent(trimmedLookupID)}')&perPage=1`;
                const response = await fetchApiData("bookings", { queryParams: filter });
                if (response.items?.length > 0) {
                    const booking = response.items[0];
                    this.statusResult = {
                        booking_id_text: booking.booking_id_text || booking.id, status: booking.booking_status || "Unknown",
                        animal_type: booking.animal_type_name_en || booking.animal_type_key, animal_weight_selected: booking.animal_weight_selected,
                        sacrifice_day: booking.sacrifice_day_value, time_slot: booking.time_slot
                    };
                } else this.statusNotFound = true;
            } catch (error) {
                this.apiError = String(error.message);
                this.userFriendlyApiError = String(error.message).includes("Network Error") ? String(error.message) : "Could not retrieve booking status. Check ID or try again.";
                this.statusNotFound = true;
            } finally { this.isLoading.status = false; }
        },
        getSacrificeDayText(dayValue) {
            const optionElement = document.querySelector(`#sacrifice_day_select_s3 option[value="${dayValue}"]`);
            return optionElement ? { en: optionElement.dataset.en, ar: optionElement.dataset.ar } : { en: dayValue, ar: dayValue };
        },

        resetAndStartOver() {
            Object.assign(this, JSON.parse(JSON.stringify(initialBookingState)), {
                bookingConfirmed: false, bookingID: "", lookupBookingID: "", statusResult: null, statusNotFound: false,
                currentConceptualStep: 1, stepProgress: { step1: false, step2: false, step3: false, step4: false, step5: false },
                isMobileMenuOpen: false, isUdheyaDropdownOpen: false, isUdheyaMobileSubmenuOpen: false,
                apiError: null, userFriendlyApiError: "", activeNavLinkHref: "",
                countdown: { days: "00", hours: "00", minutes: "00", seconds: "00", ended: false },
                promoHasEnded: false, calculatedPromoDaysLeft: 0,
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

// --- SEEDER SCRIPT (IIFE) ---
(function() {
    const SEED_PARAM_NAME = "run_db_seed";
    function getQueryParam(paramName) { return new URLSearchParams(window.location.search).get(paramName); }

    if (getQueryParam(SEED_PARAM_NAME) === "true") {
        const API_BASE_URL = "/api/";
        const seedData = [
            {
                collection: "app_settings",
                data: {
                    setting_key: "global_config", exchange_rates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true }, USD: { rate_from_egp: 0.021, symbol: "$", is_active: true }, GBP: { rate_from_egp: 0.017, symbol: "£", is_active: true }},
                    default_currency: "EGP", whatsapp_number_raw: "201001234567", whatsapp_number_display: "+20 100 123 4567",
                    promo_end_date: new Date(Date.now() + 1296e6).toISOString(), promo_discount_percent: 15, promo_is_active: true, // 1296e6 is 15 days
                    delivery_areas: [
                        { id: "cairo", name_en: "Cairo", name_ar: "القاهرة", cities: [ { id: "nasr_city", name_en: "Nasr City", name_ar: "مدينة نصر" }, { id: "maadi", name_en: "Maadi", name_ar: "المعادي" }, { id: "heliopolis", name_en: "Heliopolis", name_ar: "مصر الجديدة" }]},
                        { id: "giza", name_en: "Giza", name_ar: "الجيزة", cities: [{ id: "dokki", name_en: "Dokki", name_ar: "الدقي" }, { id: "mohandessin", name_en: "Mohandessin", name_ar: "المهندسين" }, { id: "haram", name_en: "Haram", name_ar: "الهرم" }]},
                        { id: "alexandria", name_en: "Alexandria", name_ar: "الإسكندرية", cities: [{ id: "smouha", name_en: "Smouha", name_ar: "سموحة" }, { id: "miami", name_en: "Miami", name_ar: "ميامي" }]},
                        { id: "other_gov", name_en: "Other Governorate", name_ar: "محافظة أخرى", cities: [] }
                    ],
                    payment_details: { vodafone_cash: "010_YOUR_LIVE_VODA_NUMBER_SEEDER", instapay_ipn: "YOUR_LIVE_IPN_SEEDER@instapay", revolut_details: "@YOUR_LIVE_REVTAG_SEEDER", bank_name: "YOUR_LIVE_BANK_NAME_SEEDER", bank_account_name: "YOUR_LIVE_ACCOUNT_NAME_SEEDER", bank_account_number: "YOUR_LIVE_ACCOUNT_NUMBER_SEEDER", bank_iban: "YOUR_LIVE_IBAN_SEEDER", bank_swift: "YOUR_LIVE_SWIFT_SEEDER" }
                }
            },
            { collection: "livestock_types", data: { value_key: "baladi", name_en: "Baladi Sheep", name_ar: "خروف بلدي", weights_prices: [ { weight_range: "30-40 kg", price_egp: 4500, stock: 15, is_active: true }, { weight_range: "40-50 kg", price_egp: 5200, stock: 10, is_active: true }, { weight_range: "50+ kg", price_egp: 6000, stock: 0, is_active: true }]} },
            { collection: "livestock_types", data: { value_key: "barki", name_en: "Barki Sheep", name_ar: "خروف برقي", weights_prices: [ { weight_range: "35-45 kg", price_egp: 5100, stock: 8, is_active: true }, { weight_range: "45-55 kg", price_egp: 5900, stock: 12, is_active: true }]} }
        ];
        (async function seedDatabase() {
            console.log("SEEDER_INFO: Starting database seed process...");
            for (const item of seedData) {
                try {
                    const response = await fetch(`${API_BASE_URL}collections/${item.collection}/records`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item.data) });
                    if (response.ok) {
                        const created = await response.json();
                        console.log(`SEEDER_SUCCESS: Record created/updated in '${item.collection}'. ID: ${created.id}, Key: ${item.data.setting_key || item.data.value_key || 'N/A'}`);
                    } else console.error(`SEEDER_ERROR: Failed to create record in '${item.collection}': ${response.status} ${response.statusText} - ${await response.text()}. Record Key: ${item.data.setting_key || item.data.value_key || "N/A"}`);
                } catch (error) { console.error(`SEEDER_EXCEPTION: Network/other error for record in '${item.collection}' (Key: ${item.data.setting_key || item.data.value_key || "N/A"}):`, error); }
            }
            console.log("SEEDER_INFO: Database seed process finished.");
            if (window.history.replaceState) {
                const cleanUrl = location.protocol + "//" + location.host + location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
                console.log("SEEDER_INFO: Cleaned 'run_db_seed' from URL.");
            }
        })();
    }
})();
