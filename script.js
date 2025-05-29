document.addEventListener('alpine:init', () => {
    const initOrderData = {
        selAnim: { type: "", itemKey: "", varPbId: "", wtRangeEn: "", wtRangeAr: "", priceEgp: 0, nameEN: "", nameAR: "", stock: null, typeGenEn: "", typeGenAr: "", typePriceKgEgp:0 },
        custName: "",
        custPhone: "",
        custEmail: "",
        niyyahNames: "",
        selUdhServ: 'standard_service', // Default service
        servFee: 0,
        sacDay: { val: "day1_10_dhul_hijjah", txtEN: "Day 1 of Eid (10th Dhul Hijjah)", txtAR: "اليوم الأول (10 ذو الحجة)"},
        viewPref: "none",
        distChoice: "me", // Default distribution
        splitOpt: "",
        splitCustom: "",
        delCity: "",
        allCities: [],
        delAddr: "",
        delNotes: "",
        timeSlot: "8 AM-9 AM", // Default timeslot
        grpBuy: false,
        payMeth: "fa", // Default payment method
        errs: {},
        totalEgp: 0,
        cost_of_animal_egp: null, // For P&L - not set by UI initially
        lookupPhone: ""
    };

    const payMethOpts = [
        { id: 'revolut', title: 'Revolut', imgSrc: 'images/revolut.svg' }, { id: 'monzo', title: 'Monzo', imgSrc: 'images/monzo.svg' },
        { id: 'ip', title: 'InstaPay', imgSrc: 'images/instapay.svg' }, { id: 'fa', title: 'Fawry', imgSrc: 'images/fawry.svg' },
        { id: 'vo', title: 'Vodafone Cash', imgSrc: 'images/vodafone.svg' }, { id: 'cod', title: 'Cash on Delivery', imgSrc: 'images/cod.svg' },
        { id: 'bank_transfer', title: 'Bank Transfer', imgSrc: 'images/bank_transfer.svg' }
    ];

    async function apiPlaceOrder(payload) {
        const pb = new PocketBase('/'); // Assumes PB is at root. Adjust if PB is e.g. on a subdomain.
        try {
            // For debugging, you can log the payload before sending
            // console.log("Sending order payload:", JSON.stringify(payload, null, 2));
            const res = await pb.send("/api/custom_place_order", {
                method: "POST",
                body: payload, // PocketBase SDK handles JSON.stringify internally
            });
            return res;
        } catch (err) {
            console.error("API call /api/custom_place_order error object:", err); // Log the full error object
            console.error("API call /api/custom_place_order original error (if any):", err.originalError);
            let userMsg = "Failed to place order. Please try again.";
            if (err.data && err.data.error) { // Custom error from hook
                userMsg = err.data.error;
            } else if (err.data && err.data.data && Object.keys(err.data.data).length > 0) { // PB validation errors
                userMsg = "Order failed due to validation issues: ";
                const fieldErrs = [];
                for (const key in err.data.data) {
                    fieldErrs.push(`${key}: ${err.data.data[key].message}`);
                }
                userMsg += fieldErrs.join("; ");
            } else if (err.message) { // General SDK or network error
                 userMsg = err.message;
            }
            throw new Error(userMsg);
        }
    }

    Alpine.data('udh', () => ({
        load: { status: false, ordering: false, init: true },
        settings: { // Provide a more complete default structure
            xchgRates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true } },
            defCurr: "EGP",
            waNumRaw: "", waNumDisp: "",
            promoEndISO: new Date().toISOString(), promoDiscPc: 0, promoActive: false,
            servFeeEGP: 0,
            delAreas: [],
            payDetails: { vodafone_cash: "", instapay_ipn: "", revolut_details: "", monzo_details: "", bank_name: "", bank_account_name: "", bank_account_number: "", bank_iban: "", bank_swift: "" }
        },
        prodOpts: { live: [] },
        get availPayMeths() { return payMethOpts; },
        apiErr: null, usrApiErr: "", ...JSON.parse(JSON.stringify(initOrderData)),
        orderConf: false,
        statRes: null, statNotFound: false,
        lookupOrderID: "",
        currStep: 1, stepProg: { step1: false, step2: false, step3: false, step4: false, step5: false },
        isMobNavOpen: false, isUdhDropOpen: false, isUdhMobSubOpen: false,
        cd: { days: "00", hours: "00", mins: "00", secs: "00", ended: false },
        cdTimer: null, currLang: "en", curr: "EGP",
        errMsgs: { required: { en: "This field is required.", ar: "هذا الحقل مطلوب." }, select: { en: "Please make a selection.", ar: "يرجى الاختيار." }, email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." }, phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." }, timeSlot: { en: "Please select a time slot.", ar: "يرجى اختيار وقت التوصيل." }, udhServ: {en: "Please select a service option.", ar: "يرجى اختيار خيار الخدمة."}},
        navData: [
            { href: "#udh-order-start", sectId: "udh-order-start", parentMenu: "Udheya" },
            { href: "#chk-order-stat", sectId: "chk-order-stat", parentMenu: "Udheya" },
            { href: "#live-sect", sectId: "live-sect", parentMenu: null },
            { href: "#meat-sect", sectId: "meat-sect", parentMenu: null },
            { href: "#gath-sect", sectId: "gath-sect", parentMenu: null }
        ],
        actNavHref: "", stepMeta: [], delFeeDispEGP: 0, isDelFeeVar: false,
        orderID: "",

        getStockEn(stock, isActive) { return (!isActive) ? "Inactive" : (stock === undefined || stock === null || stock <= 0) ? "Out of Stock" : (stock > 0 && stock <= 5) ? "Limited Stock" : "Available"; },
        slViewOpts() { return [ { val: 'none', txtEn: 'No Preference / Not Required', txtAr: 'لا يوجد تفضيل / غير مطلوب' }, { val: 'physical_inquiry', txtEn: 'Inquire about Physical Attendance', txtAr: 'الاستفسار عن الحضور الشخصي' }, { val: 'video_request', txtEn: 'Request Video/Photos of Process', txtAr: 'طلب فيديو/صور للعملية' }, { val: 'live_video_inquiry', txtEn: 'Inquire about Live Video', txtAr: 'الاستفسار عن فيديو مباشر' } ]; },
        distrOpts() { return [ { val: 'me', txtEn: 'Deliver All to Me', txtAr: 'توصيل الكل لي' }, { val: 'char', txtEn: 'Donate All (Sheep Land distributes)', txtAr: 'تبرع بالكل (أرض الأغنام توزع)' }, { val: 'split', txtEn: 'Split Portions', txtAr: 'تقسيم الحصص' } ]; },
        splitOptsList() { return [ { val: '1/3_me_2/3_charity_sl', txtEn: '1/3 me, 2/3 charity (SL)', txtAr: 'ثلث لي، ثلثان صدقة (أرض الأغنام)' }, { val: '1/2_me_1/2_charity_sl', txtEn: '1/2 me, 1/2 charity (SL)', txtAr: 'نصف لي، نصف صدقة (أرض الأغنام)' }, { val: '2/3_me_1/3_charity_sl', txtEn: '2/3 me, 1/3 charity (SL)', txtAr: 'ثلثان لي، ثلث صدقة (أرض الأغنام)' }, { val: 'all_me_custom_distro', txtEn: 'All for me (I distribute)', txtAr: 'الكل لي (أنا أوزع)' }, { val: 'custom', txtEn: 'Other (Specify) *', txtAr: 'أخرى (حدد) *' } ]; },

        async initApp() {
            this.load.init = true; this.apiErr = null; this.usrApiErr = "";
            const pb = new PocketBase('/');
            try {
                const remoteSettingsList = await pb.collection('settings').getFullList({ requestKey: "settings_init" });
                if (remoteSettingsList && remoteSettingsList.length > 0) {
                    const rs = remoteSettingsList[0];
                    // Merge remote settings with defaults, preferring remote values
                    this.settings.xchgRates = rs.xchgRates || this.settings.xchgRates;
                    this.settings.defCurr = rs.defCurr || this.settings.defCurr;
                    this.settings.waNumRaw = rs.waNumRaw || "";
                    this.settings.waNumDisp = rs.waNumDisp || "";
                    this.settings.promoEndISO = rs.promoEndISO || new Date().toISOString();
                    this.settings.promoDiscPc = Number(rs.promoDiscPc) || 0;
                    this.settings.promoActive = typeof rs.promoActive === 'boolean' ? rs.promoActive : false;
                    this.settings.servFeeEGP = Number(rs.servFeeEGP) || 0;
                    this.settings.delAreas = Array.isArray(rs.delAreas) ? rs.delAreas : [];
                    this.settings.payDetails = typeof rs.payDetails === 'object' && rs.payDetails !== null ? rs.payDetails : this.settings.payDetails;
                } else { this.usrApiErr = "App configuration could not be loaded. Using defaults."; console.warn("Settings not found, using defaults."); }
                
                this.servFee = this.settings.servFeeEGP;

                const fetchedProds = await pb.collection('products').getFullList({ sort: '+sort_order_type,+sort_order_variant', filter: 'is_active = true', requestKey: "products_init" });
                const prodGrps = {};
                (fetchedProds || []).forEach(p => {
                    if (!prodGrps[p.type_key]) { prodGrps[p.type_key] = { valKey: p.type_key, nameEn: p.type_name_en, nameAr: p.type_name_ar, descEn: p.type_description_en, descAr: p.type_description_ar, priceKgEgp: p.price_per_kg_egp, wps: [] }; }
                    prodGrps[p.type_key].wps.push({ itemKey: p.item_key, varIdPb: p.id, nameENSpec: p.variant_name_en, nameARSpec: p.variant_name_ar, wtRangeEn: p.weight_range_text_en, wtRangeAr: p.weight_range_text_ar, avgWtKg: p.avg_weight_kg, priceEGP: p.base_price_egp, stock: p.stock_available_pb, isActive: p.is_active });
                });
                this.prodOpts.live = Object.values(prodGrps);
                if (this.prodOpts.live.length === 0 && !this.usrApiErr && !this.apiErr) { // Check if error already set
                     this.usrApiErr = "No sheep options are currently available.";
                }
            } catch (e) {
                console.error("Error fetching initial data:", e);
                this.apiErr = "Could not load data from server."; this.usrApiErr = "Error loading essential data. Please try again later or contact support.";
                this.prodOpts.live = [];
            }

            let cities = [];
            (this.settings.delAreas || []).forEach(gov => {
                if (gov.cities && Array.isArray(gov.cities) && gov.cities.length > 0) {
                    gov.cities.forEach(city => { cities.push({ id: `${gov.id}_${city.id}`, nameEn: `${gov.name_en} - ${city.name_en}`, nameAr: `${gov.name_ar} - ${city.name_ar}`, delFeeEgp: city.delivery_fee_egp, govId: gov.id, govNameEn: gov.name_en, govNameAr: gov.name_ar }); });
                } else if (gov.delivery_fee_egp !== undefined) {
                    cities.push({ id: gov.id, nameEn: gov.name_en, nameAr: gov.name_ar, delFeeEgp: gov.delivery_fee_egp, govId: gov.id, govNameEn: gov.name_en, govNameAr: gov.name_ar });
                }
            });
            this.allCities = cities.sort((a,b) => a.nameEn.localeCompare(b.nameEn));
            
            this.curr = this.settings.defCurr || "EGP";
            this.updServFee();
            this.startCd();
            this.updSacDayTxt();
            this.clrAllErrs();

            this.$nextTick(() => {
                this.updAllPrices();
                this.updAllStepStates();
                this.onScroll();
                this.focusRef(this.orderConf ? "orderConfTitle" : "body", false);
                this.updDelFeeDisp();
                this.load.init = false;
            });

            this.stepMeta = [
                { id: "#step1-content", conceptualStep: 1, titleRef: "step1Title", firstFocusableErrorRef: (this.prodOpts.live[0]?.valKey + 'WtSel') || 'step1Title', validator: this.valStep1.bind(this) },
                { id: "#step2-content", conceptualStep: 2, titleRef: "step2Title", firstFocusableErrorRef: 'custNameInputS2', validator: this.valStep2.bind(this) },
                { id: "#step3-content", conceptualStep: 3, titleRef: "step3Title", firstFocusableErrorRef: 'udhServRadiosS3', validator: this.valStep3.bind(this) },
                { id: "#step4-content", conceptualStep: 4, titleRef: "step4Title", firstFocusableErrorRef: 'distChoiceSelS4', validator: this.valStep4.bind(this) },
                { id: "#step5-content", conceptualStep: 5, titleRef: "step5Title", firstFocusableErrorRef: 'payMethRadios', validator: this.valStep5.bind(this) }
            ];

            ['selAnim.priceEgp', 'curr', 'servFee'].forEach(prop => this.$watch(prop, (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    this.calcTotal();
                    if (prop !== 'servFee') { // Avoid full price re-render for only service fee change
                        this.$nextTick(() => this.updAllPrices());
                    }
                }
            }));
            this.$watch('settings.servFeeEGP', (newValue, oldValue) => { if (newValue !== oldValue) this.updServFee(); });
            
            ['distChoice', 'splitOpt', 'splitCustom', 'custName', 'custPhone', 'custEmail', 'delAddr', 'timeSlot', 'payMeth', 'viewPref', 'delCity', 'selUdhServ', 'niyyahNames', 'sacDay.val'].forEach(prop => this.$watch(prop, (nv,ov) => {
                if (nv !== ov || (typeof nv === 'object' && JSON.stringify(nv) !== JSON.stringify(ov))) { // Check for actual change
                    this.updAllStepStates();
                    if (prop === 'delCity') { this.updDelFeeDisp(); /* calcTotal is inside updDelFeeDisp */ }
                    else if (prop === 'selUdhServ') { this.updServFee(); /* calcTotal is inside updServFee */ }
                    else if (['distChoice', 'splitOpt', 'splitCustom'].includes(prop)) { this.calcTotal(); this.updDelFeeDisp(); }
                }
            }));
            
            let scrollTimeout; // For debouncing scroll handler
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => this.onScroll(), 100); // Debounce scroll for 100ms
            }, { passive: true });

            window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.startCd(); else if (this.cdTimer) clearInterval(this.cdTimer); });
        },
        updServFee() { this.servFee = (this.selUdhServ === 'standard_service') ? (this.settings.servFeeEGP || 0) : 0; this.calcTotal(); },
        onScroll() { /* ... same as before, already fairly robust ... */
            if (!this.orderConf && this.stepMeta.length > 0 && this.stepMeta.some(step => { const el = document.querySelector(step.id); return el && typeof el.offsetTop === 'number'; })) {
                const scrollMid = window.scrollY + (window.innerHeight / 2); let closestStep = this.currStep; let minDist = Infinity;
                this.stepMeta.forEach(meta => { const el = document.querySelector(meta.id); if (el) { const dist = Math.abs(scrollMid - (el.offsetTop + (el.offsetHeight / 2))); if (dist < minDist) { minDist = dist; closestStep = meta.conceptualStep; } } });
                if (this.currStep !== closestStep) this.currStep = closestStep;
            }
            const headH = document.querySelector('.site-head')?.offsetHeight || 70; const scrollOff = headH + (window.innerHeight * 0.10); const currScrollYOff = window.scrollY + scrollOff; let newActHref = ""; let newActParent = null;
            for (const navLink of this.navData) { const sectEl = document.getElementById(navLink.sectId); if (sectEl) { const sectTop = sectEl.offsetTop; const sectBot = sectTop + sectEl.offsetHeight; if (sectTop <= currScrollYOff && sectBot > currScrollYOff) { newActHref = navLink.href; newActParent = navLink.parentMenu; break; } } }
            const firstNavSect = this.navData.length > 0 ? document.getElementById(this.navData[0].sectId) : null;
            if (window.scrollY < ((firstNavSect?.offsetTop || headH) - headH)) { newActHref = ""; newActParent = null; }
            else if ((window.innerHeight + Math.ceil(window.scrollY)) >= (document.body.offsetHeight - 5)) { // Added small buffer
                 const lastVisLink = this.navData.slice().reverse().find(nl => { const el = document.getElementById(nl.sectId); return el && el.offsetHeight > 0; });
                 if (lastVisLink) { newActHref = lastVisLink.href; newActParent = lastVisLink.parentMenu; }
            }
            this.actNavHref = newActParent || newActHref;
        },
        setErr(f, m) { this.errs[f] = (typeof m === 'string' ? this.errMsgs[m] : m) || this.errMsgs.required; this.$nextTick(() => { const firstErrorEl = document.querySelector(`[aria-invalid="true"]`); if (firstErrorEl) firstErrorEl.focus({ preventScroll: true }); }); },
        clrErr(f) { if(this.errs[f]) delete this.errs[f]; },
        clrAllErrs() { this.errs = {}; },
        focusRef(r, s=true) {this.$nextTick(()=>{ const target = this.$refs[r]; if(target){target.focus({preventScroll:!s});if(s)setTimeout(()=>{try{target.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});}catch(e){console.warn("ScrollIntoView failed for ref:",r,e);}},50);}})},
        get needsDelDetails() { const c = (this.splitCustom || "").toLowerCase(); return this.distChoice === 'me' || (this.distChoice === 'split' && (["1/3_me_2/3_charity_sl", "1/2_me_1/2_charity_sl", "2/3_me_1/3_charity_sl", "all_me_custom_distro"].includes(this.splitOpt) || (this.splitOpt === 'custom' && (c.includes("for me") || c.includes("all delivered to me") || c.includes("لي") || c.includes("توصيل لي") || c.includes("استلام"))))); },
        get splitDet() { if(this.distChoice !== 'split') return ""; if(this.splitOpt === 'custom') return (this.splitCustom || "").trim(); const o={"1/3_me_2/3_charity_sl":{en:"1/3 me, 2/3 charity (SL)",ar:"ثلث لي، ثلثان صدقة (أرض الأغنام)"},"1/2_me_1/2_charity_sl":{en:"1/2 me, 1/2 charity (SL)",ar:"نصف لي، نصف صدقة (أرض الأغنام)"},"2/3_me_1/3_charity_sl":{en:"2/3 me, 1/3 charity (SL)",ar:"ثلثان لي، ثلث صدقة (أرض الأغنام)"},"all_me_custom_distro":{en:"All for me (I distribute)",ar:"الكل لي (أنا أوزع)"}};const s=o[this.splitOpt];return s?(this.currLang==='ar'?s.ar:s.en):this.splitOpt;},
        getDelLoc(lang) { if (!this.needsDelDetails || !this.delCity) return ""; const selCityData = this.allCities.find(c => c.id === this.delCity); if (!selCityData) return ""; return lang === 'en' ? selCityData.nameEn : selCityData.nameAr; },
        get sumDelToEn() { if(this.distChoice === 'char') return "Charity Distribution by Sheep Land"; if(this.needsDelDetails) { const name = (this.custName || "").trim(); const loc = this.getDelLoc('en'); const addrShort = (this.delAddr || "").substring(0,30) + ((this.delAddr || "").length > 30 ? "..." : ""); return [name, loc, addrShort].filter(p => p?.trim()).join(", ") || "Delivery Details Incomplete"; } return "Self Pickup/Distribution (No delivery details provided)"; },
        get sumDelToAr() { if(this.distChoice === 'char') return "توزيع خيري بواسطة أرض الأغنام"; if(this.needsDelDetails) { const name = (this.custName || "").trim(); const loc = this.getDelLoc('ar'); const addrShort = (this.delAddr || "").substring(0,30) + ((this.delAddr || "").length > 30 ? "..." : ""); return [name, loc, addrShort].filter(p => p?.trim()).join("، ") || "تفاصيل التوصيل غير مكتملة"; } return "استلام ذاتي/توزيع (لم تقدم تفاصيل توصيل)"; },
        get sumDistrEn() {if(this.distChoice==='me')return"All to me";if(this.distChoice==='char')return"All to charity (by SL)";return`Split: ${(this.splitDet||"").trim()||"(Not specified)"}`;},
        get sumDistrAr() {if(this.distChoice==='me')return"الكل لي";if(this.distChoice==='char')return"تبرع بالكل للصدقة (أرض الأغنام)";return`تقسيم: ${(this.splitDet||"").trim()||"(لم يحدد)"}`;},
        startCd() { if(this.cdTimer)clearInterval(this.cdTimer);if(!this.settings.promoActive||!this.settings.promoEndISO) {this.cd.ended=true;return;} const t=new Date(this.settings.promoEndISO).getTime();if(isNaN(t)){this.cd.ended=true;console.warn("Invalid promoEndISO date for countdown:", this.settings.promoEndISO);return;}this.updCdDisp(t);this.cdTimer=setInterval(()=>this.updCdDisp(t),1000);},
        updCdDisp(t) {const d=t-Date.now();if(d<0){if(this.cdTimer)clearInterval(this.cdTimer);Object.assign(this.cd,{days:"00",hours:"00",mins:"00",secs:"00",ended:true});return;}this.cd.ended=false;this.cd={days:String(Math.floor(d/864e5)).padStart(2,'0'),hours:String(Math.floor(d%864e5/36e5)).padStart(2,'0'),mins:String(Math.floor(d%36e5/6e4)).padStart(2,'0'),secs:String(Math.floor(d%6e4/1e3)).padStart(2,'0')};},
        updDelFeeDisp() { this.delFeeDispEGP = 0; this.isDelFeeVar = false; if (!this.needsDelDetails || !this.delCity) { this.calcTotal(); return; } const cityData = this.allCities.find(c => c.id === this.delCity); if (cityData && typeof cityData.delFeeEgp === 'number') { this.delFeeDispEGP = cityData.delFeeEgp; this.isDelFeeVar = false; } else if (cityData && cityData.delFeeEgp === null) { this.isDelFeeVar = true; this.delFeeDispEGP = 0; } else { this.isDelFeeVar = true; this.delFeeDispEGP = 0; if (this.delCity) console.warn("Delivery fee not found or invalid for city:", this.delCity); } this.calcTotal();  },
        fmtPrice(p, c) { const cc=c||this.curr; const ci=this.settings?.xchgRates?.[cc]; if(p==null||p === undefined ||!ci||typeof ci.rate_from_egp !=='number')return`${ci?.symbol||(cc==='EGP'?'LE':'')} ---`;const cp=p*ci.rate_from_egp;return`${ci.symbol||(cc==='EGP'?'LE':cc)} ${cp.toFixed((ci.symbol==="LE"||ci.symbol==="ل.م"||cc==='EGP')?0:2)}`;},
        isEmailValid: (e) => (!e?.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
        isPhoneValid: (p) => p?.trim() && /^\+?[0-9\s\-()]{7,20}$/.test(p.trim()), // Basic international phone regex
        scrollSect(s) { try{const e=document.querySelector(s);if(e){let o=document.querySelector('.site-head')?.offsetHeight||0;if(s.startsWith('#udh-order-start')||s.startsWith('#step')||s.startsWith('#udh-order-panel')){const h=document.querySelector('.step-wrap');if(h&&getComputedStyle(h).position==='sticky')o+=h.offsetHeight;}window.scrollTo({top:e.getBoundingClientRect().top+window.pageYOffset-o-10,behavior:'smooth'});}}catch(err){console.warn("ScrollSect err:", err);}},
        valConceptStep(cs, se=true) { const m=this.stepMeta[cs-1]; if(!m||!m.validator)return true; const v=m.validator(se);this.stepProg[`step${cs}`]=v;return v;},
        updAllStepStates() { for(let i=1;i<=this.stepMeta.length;i++)this.stepProg[`step${i}`]=this.valConceptStep(i,false);}, // No error display on silent validation
        navStep(tcs) {this.clrAllErrs();let canProceed=true;for(let s=1;s<tcs;s++){if(!this.valConceptStep(s,true)){this.currStep=s;const m=this.stepMeta[s-1]; if(m) {this.focusRef(m.firstFocusableErrorRef||m.titleRef);this.scrollSect(m.id||'#udh-order-start');} canProceed=false;break;}}if(canProceed){this.currStep=tcs;const currentMeta = this.stepMeta[tcs-1]; if(currentMeta) { this.scrollSect(currentMeta.id||'#udh-order-start'); this.focusRef(currentMeta.titleRef); }}},

        valStep1(setErrs = true) { if (setErrs) this.clrErr('animal'); if (!this.selAnim.itemKey) { if (setErrs) this.setErr('animal', 'select'); return false; } return true;  },
        valStep2(setErrs = true) { if (setErrs) { this.clrErr('custName'); this.clrErr('custPhone'); this.clrErr('custEmail');} let isValid = true; if (!(this.custName || "").trim()) { if (setErrs) this.setErr('custName', 'required'); isValid = false; } if (!this.isPhoneValid(this.custPhone)) { if (setErrs) this.setErr('custPhone', 'phone'); isValid = false; } if ((this.custEmail || "").trim() && !this.isEmailValid(this.custEmail)) { if (setErrs) this.setErr('custEmail', 'email'); isValid = false; } return isValid; },
        valStep3(setErrs = true) { if (setErrs) { this.clrErr('udhServ');this.clrErr('sacDay'); } let isValid = true; if (!this.selUdhServ) { if(setErrs) this.setErr('udhServ', 'select'); isValid = false;} if (!this.sacDay.val) { if (setErrs) this.setErr('sacDay', 'select'); isValid = false; } return isValid; },
        valStep4(setErrs = true) { if (setErrs) { this.clrErr('distChoice'); this.clrErr('splitOpt'); this.clrErr('delCity'); this.clrErr('delAddr'); this.clrErr('timeSlot');} let isValid = true; if (!this.distChoice) { if(setErrs) this.setErr('distChoice', 'select'); isValid = false; } if (this.distChoice === 'split' && this.splitOpt === 'custom' && !(this.splitCustom || "").trim()) { if (setErrs) this.setErr('splitOpt', 'required'); isValid = false; } else if (this.distChoice === 'split' && !this.splitOpt) { if (setErrs) this.setErr('splitOpt', 'select'); isValid = false; } if (this.needsDelDetails) {  if (!this.delCity) { if (setErrs) this.setErr('delCity', 'select'); isValid = false; }  if (!(this.delAddr || "").trim()) { if (setErrs) this.setErr('delAddr', 'required'); isValid = false; } if (!this.timeSlot) { if (setErrs) this.setErr('timeSlot', 'select'); isValid = false; } } return isValid; },
        valStep5(setErrs = true) { if (setErrs) this.clrErr('payMeth'); if (!this.payMeth) { if (setErrs) this.setErr('payMeth', 'select'); return false; } return true; },

        selAnimal(animTypeKey, wtSelEl) { const selItemKey = wtSelEl.value; this.clrErr('animal'); if (!selItemKey) { this.selAnim = { ...initOrderData.selAnim }; this.prodOpts.live.forEach(type => { if (type.valKey !== animTypeKey && this.$refs[`${type.valKey}WtSel`]) { this.$refs[`${type.valKey}WtSel`].value = ""; } }); this.calcTotal(); this.updAllStepStates(); return; } this.prodOpts.live.forEach(type => { if (type.valKey !== animTypeKey && this.$refs[`${type.valKey}WtSel`]) { this.$refs[`${type.valKey}WtSel`].value = ""; } }); const animTypeCfg = this.prodOpts.live.find(a => a.valKey === animTypeKey); if (!animTypeCfg) { this.selAnim = { ...initOrderData.selAnim }; this.calcTotal(); this.updAllStepStates(); return; } const selSpecItem = animTypeCfg.wps.find(wp => wp.itemKey === selItemKey); if (selSpecItem && selSpecItem.isActive && selSpecItem.stock > 0) { this.selAnim = { type: animTypeCfg.valKey, itemKey: selSpecItem.itemKey, varPbId: selSpecItem.varIdPb, wtRangeEn: selSpecItem.wtRangeEn, wtRangeAr: selSpecItem.wtRangeAr, priceEgp: selSpecItem.priceEGP, stock: selSpecItem.stock, typeGenEn: animTypeCfg.nameEn, typeGenAr: animTypeCfg.nameAr, typePriceKgEgp: animTypeCfg.priceKgEgp }; } else { this.selAnim = { ...initOrderData.selAnim }; this.setErr('animal', {en: 'Selected item is out of stock or inactive.', ar: 'الخيار المحدد غير متوفر أو غير نشط.'}); } this.calcTotal(); this.updAllStepStates(); },
        updSacDayTxt() { const sacDaySelEl = this.$refs.sacDaySelS3; if (sacDaySelEl) {  const optEl = sacDaySelEl.querySelector(`option[value="${this.sacDay.val}"]`); if(optEl) Object.assign(this.sacDay,{txtEN:optEl.dataset.en || this.sacDay.val,txtAR:optEl.dataset.ar || this.sacDay.val}); }  },
        calcTotal() { let delFeeFinal = 0; if(this.needsDelDetails && this.delFeeDispEGP > 0 && !this.isDelFeeVar) { delFeeFinal = this.delFeeDispEGP; } this.totalEgp= (this.selAnim.priceEgp||0) + (this.servFee || 0) + delFeeFinal; },
        updAllPrices() { try { (this.prodOpts.live || []).forEach(liveTypeCfg => {  const wtSelEl = this.$refs[`${liveTypeCfg.valKey}WtSel`];  const cardEl = document.getElementById(liveTypeCfg.valKey);  if (!wtSelEl || !cardEl) { console.warn(`Missing elements for ${liveTypeCfg.valKey} during price update.`); return; } const currVal = wtSelEl.value;  wtSelEl.innerHTML = `<option value="">-- Select Weight --</option>`; let stillValid = false; (liveTypeCfg.wps || []).forEach(wp => {  const opt = document.createElement('option');  opt.value = wp.itemKey;  const outOfStock = !wp.isActive || wp.stock <= 0; const statTxtEn = this.getStockEn(wp.stock, wp.isActive); const priceDispEn = this.fmtPrice(wp.priceEGP); opt.textContent = `${wp.nameENSpec || wp.wtRangeEn} (${priceDispEn}) - ${statTxtEn}`.trim(); opt.disabled = outOfStock;  wtSelEl.appendChild(opt); if (wp.itemKey === currVal && !outOfStock) stillValid = true; }); if(currVal && stillValid) { wtSelEl.value = currVal; } else if (this.selAnim.type === liveTypeCfg.valKey && this.selAnim.itemKey && liveTypeCfg.wps.find(wp => wp.itemKey === this.selAnim.itemKey && wp.isActive && (wp.stock > 0))) { wtSelEl.value = this.selAnim.itemKey; } else { wtSelEl.value = ""; } const priceKg = liveTypeCfg.priceKgEgp || 0; const priceKgTxtEn = this.fmtPrice(priceKg) + '/kg'; const priceKgTxtAr = this.fmtPrice(priceKg) + '/كجم'; const pEN_el = cardEl.querySelector('.price.bil-row .en span'); if(pEN_el) pEN_el.textContent = priceKgTxtEn; const pAR_el = cardEl.querySelector('.price.bil-row .ar span'); if(pAR_el) pAR_el.textContent = priceKgTxtAr; }); this.calcTotal();  } catch (e) { console.error("Error in updAllPrices:", e); this.usrApiErr = "Error updating prices."; } },

        async submitOrderValid() {
            this.clrAllErrs(); let isValid = true;
            for (let i = 1; i <= this.stepMeta.length; i++) { if (!this.valConceptStep(i, true)) { isValid = false; const meta = this.stepMeta[i-1]; if (meta) { this.currStep = i; this.focusRef(meta.firstFocusableErrorRef || meta.titleRef); this.scrollSect(meta.id || '#udh-order-start'); } break; }}
            if (!isValid) return;

            const animTypeCfg = this.prodOpts.live.find(lt => lt.valKey === this.selAnim.type);
            const stockItemCfg = animTypeCfg?.wps.find(wp => wp.itemKey === this.selAnim.itemKey);

            if (!stockItemCfg || !stockItemCfg.isActive || stockItemCfg.stock <= 0) {
                this.setErr('animal', { en: `Sorry, selected item is unavailable. Please reselect.`, ar: `عذراً، المنتج المختار غير متوفر. يرجى إعادة الاختيار.` });
                this.selAnim.priceEgp = 0; this.$nextTick(() => this.updAllPrices()); this.updAllStepStates();
                this.currStep = 1; this.scrollSect('#step1-content'); this.focusRef(this.stepMeta[0].firstFocusableErrorRef || this.stepMeta[0].titleRef); return;
            }
            this.load.ordering = true; this.apiErr = null; this.usrApiErr = ""; 
            // Final total calculation is done server-side, client total is for display.
            // this.calcTotal(); 
            const orderIdClient = `SL-UDHY-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}-${String(Math.random()).slice(2,7)}`;
            let delOpt = "self_pickup_or_internal_distribution";
            if (this.distChoice === 'char') delOpt = "charity_distribution_by_sl";
            else if (this.needsDelDetails) delOpt = "home_delivery_to_orderer";
            const selCityInfo = (this.needsDelDetails && this.delCity) ? this.allCities.find(c => c.id === this.delCity) : null;

            const payload = {
                order_id_text: orderIdClient,
                product_item_key: this.selAnim.itemKey,
                quantity: 1, // Assuming always 1 for Udheya
                cost_of_animal_egp: this.cost_of_animal_egp, // Optional, for P&L if specific animal cost is known
                
                udheya_service_option_selected: this.selUdhServ,
                selected_display_currency: this.curr,
                sacrifice_day_value: this.sacDay.val,
                sacrifice_day_text_en: this.sacDay.txtEN, 
                sacrifice_day_text_ar: this.sacDay.txtAR,
                slaughter_viewing_preference: this.viewPref, 
                distribution_choice: this.distChoice,
                split_details_option: this.distChoice === 'split' ? this.splitOpt : "", 
                custom_split_details_text: (this.distChoice === 'split' && this.splitOpt === 'custom') ? (this.splitCustom || "").trim() : "",
                niyyah_names: (this.niyyahNames || "").trim(), 
                ordering_person_name: (this.custName || "").trim(),
                ordering_person_phone: (this.custPhone || "").trim(), 
                customer_email: (this.custEmail || "").trim(),
                delivery_option: delOpt,
                delivery_name: (this.custName || "").trim(), 
                delivery_phone: (this.custPhone || "").trim(),
                delivery_area_id: (this.needsDelDetails && selCityInfo) ? selCityInfo.id : "",
                delivery_address: this.needsDelDetails ? (this.delAddr || "").trim() : "",
                delivery_instructions: this.needsDelDetails ? (this.delNotes || "").trim() : "",
                time_slot: (this.distChoice === 'char' || !this.needsDelDetails) ? 'N/A' : this.timeSlot,
                payment_method: this.payMeth,
                terms_agreed: true,
                group_purchase_interest: this.grpBuy, 
                admin_notes: this.grpBuy ? "Client expressed interest in group purchase." : ""
                // animal_tag_id: if UI allows selecting specific animal, send its tag_id here
            };

            try {
                const orderRes = await apiPlaceOrder(payload);
                this.orderID = orderRes.order_id_text || orderIdClient;
                // Update totalEgp from server response as it's the source of truth
                this.totalEgp = orderRes.total_amount_due_egp !== undefined ? orderRes.total_amount_due_egp : this.totalEgp;

                if (stockItemCfg) {
                    const newClientStock = orderRes.new_stock_level !== undefined ? orderRes.new_stock_level : (stockItemCfg.stock -1);
                    stockItemCfg.stock = newClientStock;
                    this.selAnim.stock = newClientStock;
                    this.$nextTick(() => this.updAllPrices());
                }
                this.orderConf = true;
                this.$nextTick(() => { this.scrollSect('#order-conf-sect'); this.focusRef('orderConfTitle'); });
            } catch (e) {
                this.apiErr=String(e.message || "Order placement failed.");
                this.usrApiErr = String(e.message || "An unexpected error occurred during order placement.");
                this.$nextTick(()=>this.scrollSect('.err-ind'));
            }
            finally { this.load.ordering = false; }
        },
        async submitStatValid() {
            this.clrErr('lookupOrderID'); this.clrErr('lookupPhone');
            let isValid = true;
            if (!(this.lookupOrderID || "").trim()) { this.setErr('lookupOrderID', 'required'); isValid = false; }
            if (!this.isPhoneValid(this.lookupPhone)) { this.setErr('lookupPhone', 'phone'); isValid = false; }
            if(isValid) { await this.chkOrderStatus(); }
            else { if(this.errs.lookupOrderID) this.focusRef('lookupOrderIdInput'); else if(this.errs.lookupPhone) this.focusRef('lookupPhoneInput');}
        },
        async chkOrderStatus() {
            this.statRes = null; this.statNotFound = false; this.load.status = true; this.apiErr = null; this.usrApiErr = "";
            const id = (this.lookupOrderID || "").trim(); const phone = (this.lookupPhone || "").trim();
            const pb = new PocketBase('/');
            try {
                const params = { lookupPhone: phone }; // Parameter for the list rule
                const recs = await pb.collection('orders').getFullList({
                    filter: `order_id_text = "${pb.utils.escapeFilterValue(id)}"`,
                    $autoCancel: false, // Prevent auto-cancellation if needed for longer requests
                    // Pass phone as a query parameter that the PocketBase list rule can access
                    // This requires the list rule on 'orders' to be like:
                    // ordering_person_phone = @request.query.lookupPhone:string
                    // OR (if user is authenticated and owns the order)
                    // user = @request.auth.id
                }, { query: params });


                if (recs && recs.length > 0) {
                    const o = recs[0];
                    let distrTxtEn = o.distribution_choice; let distrTxtAr = o.distribution_choice;
                     const distOpt = this.distrOpts().find(opt => opt.val === o.distribution_choice);
                     if(distOpt) { distrTxtEn = distOpt.txtEn; distrTxtAr = distOpt.txtAr; }

                    if (o.distribution_choice === 'split') {
                        let splitDetEn = o.split_details_option; let splitDetAr = o.split_details_option;
                        if (o.split_details_option === 'custom') {
                            splitDetEn = o.custom_split_details_text || "Custom"; splitDetAr = o.custom_split_details_text || "مخصص";
                        } else {
                            const splitOptRes = this.splitOptsList().find(opt => opt.val === o.split_details_option);
                            if(splitOptRes){ splitDetEn = splitOptRes.txtEn; splitDetAr = splitOptRes.txtAr;}
                        }
                        distrTxtEn += ` (${splitDetEn})`; distrTxtAr += ` (${splitDetAr})`;
                    }

                    this.statRes = {
                        orderIdTxt: o.order_id_text,
                        status: o.order_status?.replace(/_/g," ")||"Unknown",
                        payStatTxt: o.payment_status?.replace(/_/g, " ") || "N/A",
                        animTypeEn: o.ordered_product_name_en, animTypeAr: o.ordered_product_name_ar,
                        wtCatEn: o.ordered_weight_range_en, wtCatAr: o.ordered_weight_range_ar,
                        udhServOpt: o.udheya_service_option_selected,
                        sacDayVal: o.sacrifice_day_value, sacDayTxtEn: o.sacrifice_day_text_en, sacDayTxtAr: o.sacrifice_day_text_ar,
                        viewPref: o.slaughter_viewing_preference, timeSlot: o.time_slot,
                        custName: o.ordering_person_name, niyyah: o.niyyah_names,
                        distrChoiceEn: distrTxtEn, distrChoiceAr: distrTxtAr,
                        delAddr: o.delivery_address, delCityEn: o.delivery_area_name_en, delCityAr: o.delivery_area_name_ar,
                        totalEgp: o.total_amount_due_egp, payMeth: o.payment_method,
                        needsDel: (o.delivery_option === 'home_delivery_to_orderer')
                    };
                } else this.statNotFound = true;
            } catch (e) { this.apiErr=String(e.message);this.usrApiErr="Could not get order status. Please check details or contact support.";this.statNotFound=true; console.error("Error fetching order status:", e)}
            finally { this.load.status = false; }
        },
        async resetForm() {
            const currency = this.curr; const lang = this.currLang;
            const currentSettings = JSON.parse(JSON.stringify(this.settings)); // Preserve current settings
            const currentProdOpts = JSON.parse(JSON.stringify(this.prodOpts)); // Preserve current product options
            const currentAllCities = JSON.parse(JSON.stringify(this.allCities)); // Preserve current cities

            Object.assign(this, JSON.parse(JSON.stringify(initOrderData))); // Reset to initial form data

            // Restore potentially static fetched data
            this.settings = currentSettings;
            this.prodOpts = currentProdOpts;
            this.allCities = currentAllCities;
            
            this.curr = currency; this.currLang = lang;
            if (this.cdTimer) clearInterval(this.cdTimer); // Stop existing timer
            
            this.updServFee(); // Reset based on default selUdhServ
            this.updSacDayTxt(); // Reset based on default sacDay.val
            this.startCd(); // Restart countdown if applicable
            this.clrAllErrs();

            this.$nextTick(() => {
                this.updAllPrices(); // Re-render product options with correct stock/prices
                this.updAllStepStates(); // Recalculate step completion
                this.updDelFeeDisp(); // Reset delivery fee display
                this.currStep = 1; // Explicitly set to first step
                this.orderConf = false;
                this.orderID = "";
                this.scrollSect('#udh-order-start');
                this.focusRef('orderSectTitle');
            });
        }
    }));
});
