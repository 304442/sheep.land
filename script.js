// script.js

document.addEventListener('alpine:init', () => {
    const initOrderData = {
        selAnim: { type: "", itemKey: "", varPbId: "", wtRangeEn: "", wtRangeAr: "", priceEgp: 0, nameEN: "", nameAR: "", stock: null, typeGenEn: "", typeGenAr: "", typePriceKgEgp:0 },
        custName: "",
        custPhone: "",
        custEmail: "",
        niyyahNames: "",
        selUdhServ: 'standard_service',
        servFee: 0,
        sacDay: { val: "day1_10_dhul_hijjah", txtEN: "Day 1 of Eid (10th Dhul Hijjah)", txtAR: "اليوم الأول (10 ذو الحجة)"},
        viewPref: "none",
        distChoice: "me",
        splitOpt: "",
        splitCustom: "",
        delCity: "",
        allCities: [],
        delAddr: "",
        delNotes: "",
        timeSlot: "8 AM-9 AM",
        grpBuy: false,
        payMeth: "fa",
        errs: {},
        totalEgp: 0,
        gatewayFeeEgp: 0,
        cost_of_animal_egp: null
    };

    const payMethOpts = [
        { id: 'online_card', title: 'Online Payment (Card)', imgSrc: 'images/card_payment.svg' },
        { id: 'revolut', title: 'Revolut', imgSrc: 'images/revolut.svg' },
        { id: 'monzo', title: 'Monzo', imgSrc: 'images/monzo.svg' },
        { id: 'ip', title: 'InstaPay', imgSrc: 'images/instapay.svg' },
        { id: 'fa', title: 'Fawry', imgSrc: 'images/fawry.svg' },
        { id: 'vo', title: 'Vodafone Cash', imgSrc: 'images/vodafone.svg' },
        { id: 'cod', title: 'Cash on Delivery', imgSrc: 'images/cod.svg' },
        { id: 'bank_transfer', title: 'Bank Transfer', imgSrc: 'images/bank_transfer.svg' }
    ];

    Alpine.data('udh', () => ({
        load: { status: false, ordering: false, init: true },
        settings: {
            xchgRates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true } },
            defCurr: "EGP",
            waNumRaw: "", waNumDisp: "",
            promoEndISO: new Date().toISOString(), promoDiscPc: 0, promoActive: false,
            servFeeEGP: 0,
            delAreas: [],
            payDetails: { vodafone_cash: "", instapay_ipn: "", revolut_details: "", monzo_details: "", bank_name: "", bank_account_name: "", bank_account_number: "", bank_iban: "", bank_swift: "" },
            enable_udheya_section: true,
            enable_livestock_section: true,
            enable_meat_section: true,
            enable_gatherings_section: true,
            slaughter_location_gmaps_url: "",
            online_payment_fee_egp: 0,
            paddle_vendor_id: ""
        },
        prodOpts: { udheya: [], livestock_general: [], meat_cuts: [], gathering_package: [] },
        cartItems: [], // Client-side cart
        apiErr: null, usrApiErr: "",
        get availPayMeths() { return payMethOpts; },
        ...JSON.parse(JSON.stringify(initOrderData)),
        orderConf: false,
        statRes: null, statNotFound: false,
        lookupOrderID: "",
        currStep: 1, stepProg: { step1: false, step2: false, step3: false, step4: false, step5: false },
        isMobNavOpen: false, isUdhDropOpen: false, isUdhMobSubOpen: false,
        cd: { days: "00", hours: "00", mins: "00", secs: "00", ended: false },
        cdTimer: null, currLang: "en", curr: "EGP",
        errMsgs: {
            required: { en: "This field is required.", ar: "هذا الحقل مطلوب." },
            select: { en: "Please make a selection.", ar: "يرجى الاختيار." },
            email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." },
            phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." },
            timeSlot: { en: "Please select a time slot.", ar: "يرجى اختيار وقت التوصيل." },
            udhServ: {en: "Please select a service option.", ar: "يرجى اختيار خيار الخدمة."}
        },
        navData: [],
        actNavHref: "", stepMeta: [], delFeeDispEGP: 0, isDelFeeVar: false,
        orderID: "",
        elementsReady: false,

        getStockEn(stock, isActive) {
            return (!isActive) ? "Inactive" : (stock === undefined || stock === null || stock <= 0) ? "Out of Stock" : (stock > 0 && stock <= 5) ? "Limited Stock" : "Available";
        },
        slViewOpts() {
            return [
                { val: 'none', txtEn: 'No Preference / Not Required', txtAr: 'لا يوجد تفضيل / غير مطلوب' },
                { val: 'physical_inquiry', txtEn: 'Inquire about Physical Attendance', txtAr: 'الاستفسار عن الحضور الشخصي' },
                { val: 'video_request', txtEn: 'Request Video/Photos of Process', txtAr: 'طلب فيديو/صور للعملية' },
                { val: 'live_video_inquiry', txtEn: 'Inquire about Live Video', txtAr: 'الاستفسار عن فيديو مباشر' }
            ];
        },
        distrOpts() {
            return [
                { val: 'me', txtEn: 'Deliver All to Me', txtAr: 'توصيل الكل لي' },
                { val: 'char', txtEn: 'Donate All (Sheep Land distributes)', txtAr: 'تبرع بالكل (أرض الأغنام توزع)' },
                { val: 'split', txtEn: 'Split Portions', txtAr: 'تقسيم الحصص' }
            ];
        },
        splitOptsList() {
            return [
                { val: '1/3_me_2/3_charity_sl', txtEn: '1/3 me, 2/3 charity (SL)', txtAr: 'ثلث لي، ثلثان صدقة (أرض الأغنام)' },
                { val: '1/2_me_1/2_charity_sl', txtEn: '1/2 me, 1/2 charity (SL)', txtAr: 'نصف لي، نصف صدقة (أرض الأغنام)' },
                { val: '2/3_me_1/3_charity_sl', txtEn: '2/3 me, 1/3 charity (SL)', txtAr: 'ثلثان لي، ثلث صدقة (أرض الأغنام)' },
                { val: 'all_me_custom_distro', txtEn: 'All for me (I distribute)', txtAr: 'الكل لي (أنا أوزع)' },
                { val: 'custom', txtEn: 'Other (Specify) *', txtAr: 'أخرى (حدد) *' }
            ];
        },

        async initApp() {
            this.load.init = true; this.apiErr = null; this.usrApiErr = "";
            const pb = new PocketBase('/');
            try {
                const remoteSettingsList = await pb.collection('settings').getFullList({ requestKey: "settings_init" });
                if (remoteSettingsList && remoteSettingsList.length > 0) {
                    const rs = remoteSettingsList[0];
                    this.settings.xchgRates = rs.xchgRates || this.settings.xchgRates;
                    this.settings.defCurr = rs.defCurr || this.settings.defCurr;
                    this.settings.waNumRaw = rs.waNumRaw || ""; this.settings.waNumDisp = rs.waNumDisp || "";
                    this.settings.promoEndISO = rs.promoEndISO || new Date().toISOString(); this.settings.promoDiscPc = Number(rs.promoDiscPc) || 0;
                    this.settings.promoActive = typeof rs.promoActive === 'boolean' ? rs.promoActive : false;
                    this.settings.servFeeEGP = Number(rs.servFeeEGP) || 0;
                    this.settings.delAreas = Array.isArray(rs.delAreas) ? rs.delAreas : [];
                    this.settings.payDetails = typeof rs.payDetails === 'object' && rs.payDetails !== null ? rs.payDetails : this.settings.payDetails;
                    this.settings.enable_udheya_section = typeof rs.enable_udheya_section === 'boolean' ? rs.enable_udheya_section : true;
                    this.settings.enable_livestock_section = typeof rs.enable_livestock_section === 'boolean' ? rs.enable_livestock_section : true;
                    this.settings.enable_meat_section = typeof rs.enable_meat_section === 'boolean' ? rs.enable_meat_section : true;
                    this.settings.enable_gatherings_section = typeof rs.enable_gatherings_section === 'boolean' ? rs.enable_gatherings_section : true;
                    this.settings.slaughter_location_gmaps_url = rs.slaughter_location_gmaps_url || "";
                    this.settings.online_payment_fee_egp = Number(rs.online_payment_fee_egp) || 0; // Renamed from paddle_fee_egp
                    this.settings.paddle_vendor_id = rs.paddle_vendor_id || "";
                } else { this.usrApiErr = "App configuration could not be loaded. Essential features may be unavailable.";}
                this.updServFeeEst(); this.buildNavData();

                const allProducts = await pb.collection('products').getFullList({ filter: 'is_active = true', requestKey: "all_products_init" });
                const categorizeAndGroupProducts = (products, categoryFilter) => {
                    const categoryProducts = products.filter(p => p.product_category === categoryFilter);
                    const grouped = {};
                    categoryProducts.forEach(p => {
                        if (!grouped[p.type_key]) {
                            grouped[p.type_key] = { valKey: p.type_key, nameEn: p.type_name_en, nameAr: p.type_name_ar, descEn: p.type_description_en, descAr: p.type_description_ar, priceKgEgp: p.price_per_kg_egp, wps: [] };
                        }
                        grouped[p.type_key].wps.push({ itemKey: p.item_key, varIdPb: p.id, nameENSpec: p.variant_name_en, nameARSpec: p.variant_name_ar, wtRangeEn: p.weight_range_text_en, wtRangeAr: p.weight_range_text_ar, avgWtKg: p.avg_weight_kg, priceEGP: p.base_price_egp, stock: p.stock_available_pb, isActive: p.is_active, category: p.product_category });
                    });
                    return Object.values(grouped);
                };
                this.prodOpts.udheya = categorizeAndGroupProducts(allProducts, 'udheya');
                this.prodOpts.livestock_general = categorizeAndGroupProducts(allProducts, 'livestock_general');
                this.prodOpts.meat_cuts = categorizeAndGroupProducts(allProducts, 'meat_cuts');
                this.prodOpts.gathering_package = categorizeAndGroupProducts(allProducts, 'gathering_package');

                if (this.settings.enable_udheya_section && this.prodOpts.udheya.length === 0) { this.usrApiErr = (this.usrApiErr ? this.usrApiErr + " " : "") + "No Udheya options currently available."; }

            } catch (e) { this.apiErr = String(e.message || "Could not load initial application data."); this.usrApiErr = "Error loading essential data. Please try refreshing the page or contact support."; }

            let cities = [];
            (this.settings.delAreas || []).forEach(gov => {
                if (gov.cities && Array.isArray(gov.cities) && gov.cities.length > 0) {
                    gov.cities.forEach(city => { cities.push({ id: `${gov.id}_${city.id}`, nameEn: `${gov.name_en} - ${city.name_en}`, nameAr: `${gov.name_ar} - ${city.name_ar}`, delFeeEgp: city.delivery_fee_egp, govId: gov.id, govNameEn: gov.name_en, govNameAr: gov.name_ar }); });
                } else if (gov.delivery_fee_egp !== undefined) {
                    cities.push({ id: gov.id, nameEn: gov.name_en, nameAr: gov.name_ar, delFeeEgp: gov.delivery_fee_egp, govId: gov.id, govNameEn: gov.name_en, govNameAr: gov.name_ar });
                }
            });
            this.allCities = cities.sort((a,b) => a.nameEn.localeCompare(b.nameEn));
            this.curr = this.settings.defCurr || "EGP"; this.startCd(); this.updSacDayTxt(); this.clrAllErrs();

            this.$nextTick(() => this.$nextTick(() => { this.elementsReady = true; this.finalizeInitialization(); }));

            this.stepMeta = [
                { id: "#step1-content", conceptualStep: 1, titleRef: "step1Title", firstFocusableErrorRef: this.getFirstProductSelectId() || 'step1Title', validator: this.valStep1.bind(this) },
                { id: "#step2-content", conceptualStep: 2, titleRef: "step2Title", firstFocusableErrorRef: 'custNameInputS2', validator: this.valStep2.bind(this) },
                { id: "#step3-content", conceptualStep: 3, titleRef: "step3Title", firstFocusableErrorRef: 'udhServRadiosS3', validator: this.valStep3.bind(this) },
                { id: "#step4-content", conceptualStep: 4, titleRef: "step4Title", firstFocusableErrorRef: 'distChoiceSelS4', validator: this.valStep4.bind(this) },
                { id: "#step5-content", conceptualStep: 5, titleRef: "step5Title", firstFocusableErrorRef: 'payMethRadios', validator: this.valStep5.bind(this) }
            ];
            ['selAnim.priceEgp', 'curr', 'servFee', 'delFeeDispEGP', 'payMeth'].forEach(prop => this.$watch(prop, (newValue, oldValue) => { if (newValue !== oldValue) { this.calcTotalEst(); if (prop !== 'servFee' && prop !== 'delFeeDispEGP') { this.$nextTick(() => { if (this.elementsReady) { this.updAllPrices(); } }); } } }));
            this.$watch('settings.servFeeEGP', (newValue, oldValue) => { if (newValue !== oldValue) this.updServFeeEst(); });
            this.$watch('settings.online_payment_fee_egp', (newValue, oldValue) => { if (newValue !== oldValue) this.calcTotalEst(); }); // Use generic fee name
            ['distChoice', 'splitOpt', 'splitCustom', 'custName', 'custPhone', 'custEmail', 'delAddr', 'timeSlot', 'viewPref', 'delCity', 'selUdhServ', 'niyyahNames', 'sacDay.val'].forEach(prop => this.$watch(prop, (nv,ov) => { if (nv !== ov || (typeof nv === 'object' && JSON.stringify(nv) !== JSON.stringify(ov))) { this.updAllStepStates(); if (prop === 'delCity') { this.updDelFeeDispEst(); } else if (prop === 'selUdhServ') { this.updServFeeEst(); } else if (['distChoice', 'splitOpt', 'splitCustom'].includes(prop)) { this.calcTotalEst(); this.updDelFeeDispEst(); } } }));
            let scrollTimeout; window.addEventListener('scroll', () => { clearTimeout(scrollTimeout); scrollTimeout = setTimeout(() => this.onScroll(), 100); }, { passive: true });
            window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.startCd(); else if (this.cdTimer) clearInterval(this.cdTimer); });
            this.load.init = false;
        },

        buildNavData() {
            this.navData = [];
            if (this.settings.enable_udheya_section) { this.navData.push({ href: "#udh-order-start", sectId: "udh-order-start", parentMenu: "Udheya" }); }
            this.navData.push({ href: "#chk-order-stat", sectId: "chk-order-stat", parentMenu: null });
            if (this.settings.enable_livestock_section) { this.navData.push({ href: "#live-sect", sectId: "live-sect", parentMenu: null }); }
            if (this.settings.enable_meat_section) { this.navData.push({ href: "#meat-sect", sectId: "meat-sect", parentMenu: null }); }
            if (this.settings.enable_gatherings_section) { this.navData.push({ href: "#gath-sect", sectId: "gath-sect", parentMenu: null }); }
            this.navData.push({ href: "#cart-sect", sectId: "cart-sect", parentMenu: null });
        },
        getFirstProductSelectId() { if (this.prodOpts.udheya && this.prodOpts.udheya.length > 0 && this.prodOpts.udheya[0].wps.length > 0) { return `${this.prodOpts.udheya[0].valKey}WtSel`; } return 'orderSectTitle'; },
        finalizeInitialization() { if (this.elementsReady) { this.updAllPrices(); } this.updAllStepStates(); this.onScroll(); this.focusRef(this.orderConf ? "orderConfTitle" : "body", false); this.updDelFeeDispEst(); this.calcTotalEst(); },
        updServFeeEst() { this.servFee = (this.selUdhServ === 'standard_service') ? (this.settings.servFeeEGP || 0) : 0; this.calcTotalEst(); },
        onScroll() { if (!this.orderConf && this.stepMeta.length > 0 && this.stepMeta.some(step => { const el = document.querySelector(step.id); return el && typeof el.offsetTop === 'number'; })) { const scrollMid = window.scrollY + (window.innerHeight / 2); let closestStep = this.currStep; let minDist = Infinity; this.stepMeta.forEach(meta => { const el = document.querySelector(meta.id); if (el) { const dist = Math.abs(scrollMid - (el.offsetTop + (el.offsetHeight / 2))); if (dist < minDist) { minDist = dist; closestStep = meta.conceptualStep; } } }); if (this.currStep !== closestStep) this.currStep = closestStep; } const headH = document.querySelector('.site-head')?.offsetHeight || 70; const scrollOff = headH + (window.innerHeight * 0.10); const currScrollYOff = window.scrollY + scrollOff; let newActHref = ""; let newActParent = null; for (const navLink of this.navData) { const sectEl = document.getElementById(navLink.sectId); if (sectEl && sectEl.offsetHeight > 0) { const sectTop = sectEl.offsetTop; const sectBot = sectTop + sectEl.offsetHeight; if (sectTop <= currScrollYOff && sectBot > currScrollYOff) { newActHref = navLink.href; newActParent = navLink.parentMenu; break; } } } const firstNavSect = this.navData.length > 0 ? document.getElementById(this.navData[0].sectId) : null; if (window.scrollY < ((firstNavSect?.offsetTop || headH) - headH)) { newActHref = ""; newActParent = null; } else if ((window.innerHeight + Math.ceil(window.scrollY)) >= (document.body.offsetHeight - 5)) { const lastVisLink = this.navData.slice().reverse().find(nl => { const el = document.getElementById(nl.sectId); return el && el.offsetHeight > 0; }); if (lastVisLink) { newActHref = lastVisLink.href; newActParent = lastVisLink.parentMenu; } } this.actNavHref = newActParent || newActHref; },
        setErr(f, m, isUserErr = true) { this.errs[f] = (typeof m === 'string' ? this.errMsgs[m] : m) || this.errMsgs.required; if (isUserErr && typeof this.errs[f] === 'object') { this.usrApiErr = this.currLang === 'ar' ? this.errs[f].ar : this.errs[f].en; } else if (isUserErr) { this.usrApiErr = String(this.errs[f]); } this.$nextTick(() => { const firstErrorEl = document.querySelector(`[aria-invalid="true"]`); if (firstErrorEl) firstErrorEl.focus({ preventScroll: true }); else if (this.usrApiErr) { const errInd = document.querySelector('.err-ind'); if(errInd) errInd.focus(); } }); },
        clrErr(f) { if(this.errs[f]) delete this.errs[f]; if (Object.keys(this.errs).length === 0) { this.usrApiErr = ""; this.apiErr = null;} },
        clrAllErrs() { this.errs = {}; this.usrApiErr = ""; this.apiErr = null; },
        focusRef(r, s=true) { this.$nextTick(()=>{ const target = this.$refs[r]; if(target){ target.focus({preventScroll:!s}); if(s) setTimeout(()=>{ try{ target.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'}); }catch(e){} },50); } }) },
        get needsDelDetails() { const c = (this.splitCustom || "").toLowerCase(); return this.distChoice === 'me' || (this.distChoice === 'split' && ( ["1/3_me_2/3_charity_sl", "1/2_me_1/2_charity_sl", "2/3_me_1/3_charity_sl", "all_me_custom_distro"].includes(this.splitOpt) || (this.splitOpt === 'custom' && (c.includes("for me") || c.includes("all delivered to me") || c.includes("لي") || c.includes("توصيل لي") || c.includes("استلام"))) )); },
        get splitDet() { if(this.distChoice !== 'split') return ""; if(this.splitOpt === 'custom') return (this.splitCustom || "").trim(); const o={"1/3_me_2/3_charity_sl":{en:"1/3 me, 2/3 charity (SL)",ar:"ثلث لي، ثلثان صدقة (أرض الأغنام)"},"1/2_me_1/2_charity_sl":{en:"1/2 me, 1/2 charity (SL)",ar:"نصف لي، نصف صدقة (أرض الأغنام)"},"2/3_me_1/3_charity_sl":{en:"2/3 me, 1/3 charity (SL)",ar:"ثلثان لي، ثلث صدقة (أرض الأغنام)"},"all_me_custom_distro":{en:"All for me (I distribute)",ar:"الكل لي (أنا أوزع)"}}; const s=o[this.splitOpt]; return s?(this.currLang==='ar'?s.ar:s.en):this.splitOpt; },
        getDelLoc(lang) { if (!this.needsDelDetails || !this.delCity) return ""; const selCityData = this.allCities.find(c => c.id === this.delCity); if (!selCityData) return ""; return lang === 'en' ? selCityData.nameEn : selCityData.nameAr; },
        get sumDelToEn() { if(this.distChoice === 'char') return "Charity Distribution by Sheep Land"; if(this.needsDelDetails) { const name = (this.custName || "").trim(); const loc = this.getDelLoc('en'); const addrShort = (this.delAddr || "").substring(0,30) + ((this.delAddr || "").length > 30 ? "..." : ""); return [name, loc, addrShort].filter(p => p?.trim()).join(", ") || "Delivery Details Incomplete"; } return "Self Pickup/Distribution (No delivery details provided)"; },
        get sumDelToAr() { if(this.distChoice === 'char') return "توزيع خيري بواسطة أرض الأغنام"; if(this.needsDelDetails) { const name = (this.custName || "").trim(); const loc = this.getDelLoc('ar'); const addrShort = (this.delAddr || "").substring(0,30) + ((this.delAddr || "").length > 30 ? "..." : ""); return [name, loc, addrShort].filter(p => p?.trim()).join("، ") || "تفاصيل التوصيل غير مكتملة"; } return "استلام ذاتي/توزيع (لم تقدم تفاصيل توصيل)"; },
        get sumDistrEn() { if(this.distChoice==='me')return"All to me"; if(this.distChoice==='char')return"All to charity (by SL)"; return`Split: ${(this.splitDet||"").trim()||"(Not specified)"}`; },
        get sumDistrAr() { if(this.distChoice==='me')return"الكل لي"; if(this.distChoice==='char')return"تبرع بالكل للصدقة (أرض الأغنام)"; return`تقسيم: ${(this.splitDet||"").trim()||"(لم يحدد)"}`; },
        startCd() { if(this.cdTimer)clearInterval(this.cdTimer); if(!this.settings.promoActive||!this.settings.promoEndISO) {this.cd.ended=true; return;} const t=new Date(this.settings.promoEndISO).getTime(); if(isNaN(t)){this.cd.ended=true; return;} this.updCdDisp(t); this.cdTimer=setInterval(()=>this.updCdDisp(t),1000); },
        updCdDisp(t) { const d = t - Date.now(); if (d < 0) { if (this.cdTimer) clearInterval(this.cdTimer); this.cd.days = "00"; this.cd.hours = "00"; this.cd.mins = "00"; this.cd.secs = "00"; this.cd.ended = true; return; } this.cd.ended = false; this.cd.days = String(Math.floor(d / 864e5)).padStart(2, '0'); this.cd.hours = String(Math.floor(d % 864e5 / 36e5)).padStart(2, '0'); this.cd.mins = String(Math.floor(d % 36e5 / 6e4)).padStart(2, '0'); this.cd.secs = String(Math.floor(d % 6e4 / 1e3)).padStart(2, '0'); },
        updDelFeeDispEst() { this.delFeeDispEGP = 0; this.isDelFeeVar = false; if (!this.needsDelDetails || !this.delCity) { this.calcTotalEst(); return; } const cityData = this.allCities.find(c => c.id === this.delCity); if (cityData && typeof cityData.delFeeEgp === 'number') { this.delFeeDispEGP = cityData.delFeeEgp; this.isDelFeeVar = false; } else if (cityData && cityData.delFeeEgp === null) { this.isDelFeeVar = true; this.delFeeDispEGP = 0; } else { this.isDelFeeVar = true; this.delFeeDispEGP = 0; } this.calcTotalEst(); },
        fmtPrice(p, c) { const cc=c||this.curr; const ci=this.settings?.xchgRates?.[cc]; if(p==null||p === undefined ||!ci||typeof ci.rate_from_egp !=='number') return`${ci?.symbol||(cc==='EGP'?'LE':'')} ---`; const cp=p*ci.rate_from_egp; return`${ci.symbol||(cc==='EGP'?'LE':cc)} ${cp.toFixed((ci.symbol==="LE"||ci.symbol==="ل.م"||cc==='EGP'||ci.symbol==="€")?0:2)}`; },
        isEmailValid: (e) => (!e?.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
        isPhoneValid: (p) => p?.trim() && /^\+?[0-9\s\-()]{7,20}$/.test(p.trim()),
        scrollSect(s) { try{ const e=document.querySelector(s); if(e){ let o=document.querySelector('.site-head')?.offsetHeight||0; if(s.startsWith('#udh-order-start')||s.startsWith('#step')||s.startsWith('#udh-order-panel')){ const h=document.querySelector('.step-wrap'); if(h&&getComputedStyle(h).position==='sticky')o+=h.offsetHeight; } window.scrollTo({top:e.getBoundingClientRect().top+window.pageYOffset-o-10,behavior:'smooth'}); } }catch(err){ this.usrApiErr = "Error during page scroll: " + err.message; } },
        valConceptStep(cs, se=true) { const m=this.stepMeta[cs-1]; if(!m||!m.validator)return true; const v=m.validator(se); this.stepProg[`step${cs}`]=v; return v; },
        updAllStepStates() { for(let i=1;i<=this.stepMeta.length;i++) this.stepProg[`step${i}`]=this.valConceptStep(i,false); },
        navStep(tcs) { this.clrAllErrs(); let canProceed=true; for(let s=1;s<tcs;s++){ if(!this.valConceptStep(s,true)){ this.currStep=s; const m=this.stepMeta[s-1]; if(m) { this.focusRef(m.firstFocusableErrorRef||m.titleRef); this.scrollSect(m.id||'#udh-order-start'); } canProceed=false; break; } } if(canProceed){ this.currStep=tcs; const currentMeta = this.stepMeta[tcs-1]; if(currentMeta) { this.scrollSect(currentMeta.id||'#udh-order-start'); this.focusRef(currentMeta.titleRef); } } },
        valStep1(setErrs = true) { if (setErrs) this.clrErr('animal'); if (!this.selAnim.itemKey) { if (setErrs) this.setErr('animal', 'select'); return false; } return true; },
        valStep2(setErrs = true) { if (setErrs) { this.clrErr('custName'); this.clrErr('custPhone'); this.clrErr('custEmail');} let isValid = true; if (!(this.custName || "").trim()) { if (setErrs) this.setErr('custName', 'required'); isValid = false; } if (!this.isPhoneValid(this.custPhone)) { if (setErrs) this.setErr('custPhone', 'phone'); isValid = false; } if (this.custEmail && (this.custEmail || "").trim() && !this.isEmailValid(this.custEmail)) { if (setErrs) this.setErr('custEmail', 'email'); isValid = false; } return isValid; },
        valStep3(setErrs = true) { if (setErrs) { this.clrErr('udhServ'); this.clrErr('sacDay'); } let isValid = true; if (!this.selUdhServ) { if(setErrs) this.setErr('udhServ', 'select'); isValid = false;} if (!this.sacDay.val) { if (setErrs) this.setErr('sacDay', 'select'); isValid = false; } return isValid; },
        valStep4(setErrs = true) { if (setErrs) { this.clrErr('distChoice'); this.clrErr('splitOpt'); this.clrErr('delCity'); this.clrErr('delAddr'); this.clrErr('timeSlot');} let isValid = true; if (!this.distChoice) { if(setErrs) this.setErr('distChoice', 'select'); isValid = false; } if (this.distChoice === 'split' && this.splitOpt === 'custom' && !(this.splitCustom || "").trim()) { if (setErrs) this.setErr('splitOpt', 'required'); isValid = false; } else if (this.distChoice === 'split' && !this.splitOpt) { if (setErrs) this.setErr('splitOpt', 'select'); isValid = false; } if (this.needsDelDetails) {  if (!this.delCity) { if (setErrs) this.setErr('delCity', 'select'); isValid = false; }  if (!(this.delAddr || "").trim()) { if (setErrs) this.setErr('delAddr', 'required'); isValid = false; } if (!this.timeSlot) { if (setErrs) this.setErr('timeSlot', 'timeSlot'); isValid = false; } } return isValid; },
        valStep5(setErrs = true) { if (setErrs) this.clrErr('payMeth'); if (!this.payMeth) { if (setErrs) this.setErr('payMeth', 'select'); return false; } return true; },

        selAnimal(animTypeKey, wtSelEl) {
            const selItemKey = wtSelEl.value; this.clrErr('animal');
            if (!selItemKey) { this.selAnim = { ...initOrderData.selAnim }; this.prodOpts.udheya.forEach(type => { if (type.valKey !== animTypeKey) { const otherSelectEl = document.getElementById(`${type.valKey}WtSel`); if (otherSelectEl) { otherSelectEl.value = ""; } } }); this.calcTotalEst(); this.updAllStepStates(); return; }
            this.prodOpts.udheya.forEach(type => { if (type.valKey !== animTypeKey) { const otherSelectEl = document.getElementById(`${type.valKey}WtSel`); if (otherSelectEl) { otherSelectEl.value = ""; } } });
            const animTypeCfg = this.prodOpts.udheya.find(a => a.valKey === animTypeKey); if (!animTypeCfg) { this.selAnim = { ...initOrderData.selAnim }; this.calcTotalEst(); this.updAllStepStates(); return; }
            const selSpecItem = animTypeCfg.wps.find(wp => wp.itemKey === selItemKey);
            if (selSpecItem && selSpecItem.isActive && selSpecItem.stock > 0) {
                this.selAnim = { type: animTypeCfg.valKey, itemKey: selSpecItem.itemKey, varPbId: selSpecItem.varIdPb, wtRangeEn: selSpecItem.wtRangeEn, wtRangeAr: selSpecItem.wtRangeAr, priceEgp: selSpecItem.priceEGP, stock: selSpecItem.stock, nameEN: selSpecItem.nameENSpec, nameAR: selSpecItem.nameARSpec, typeGenEn: animTypeCfg.nameEn, typeGenAr: animTypeCfg.nameAr, typePriceKgEgp: animTypeCfg.priceKgEgp };
            } else { this.selAnim = { ...initOrderData.selAnim }; this.setErr('animal', { en: 'Selected item is out of stock or inactive.', ar: 'الخيار المحدد غير متوفر أو غير نشط.' }); }
            this.calcTotalEst(); this.updAllStepStates();
        },
        updSacDayTxt() { const sacDaySelEl = this.$refs.sacDaySelS3; if (sacDaySelEl) {  const optEl = sacDaySelEl.querySelector(`option[value="${this.sacDay.val}"]`); if(optEl) Object.assign(this.sacDay,{ txtEN:optEl.dataset.en || this.sacDay.val, txtAR:optEl.dataset.ar || this.sacDay.val }); }  },
        calcTotalEst() {
            let delFeeFinalEst = 0; if(this.needsDelDetails && this.delFeeDispEGP > 0 && !this.isDelFeeVar) { delFeeFinalEst = this.delFeeDispEGP; }
            this.gatewayFeeEgp = (this.payMeth === 'online_card' && this.settings.online_payment_fee_egp > 0) ? this.settings.online_payment_fee_egp : 0;
            this.totalEgp = (this.selAnim.priceEgp||0) + (this.servFee || 0) + delFeeFinalEst + this.gatewayFeeEgp;
        },
        updAllPrices() {
            if (!this.prodOpts.udheya || this.prodOpts.udheya.length === 0 || !this.elementsReady) { return; }
            try {
                this.prodOpts.udheya.forEach(liveTypeCfg => {
                    const wtSelId = `${liveTypeCfg.valKey}WtSel`; const wtSelEl = document.getElementById(wtSelId); const cardEl = document.getElementById(liveTypeCfg.valKey);
                    if (!wtSelEl || !cardEl) { return; }
                    const currVal = wtSelEl.value; wtSelEl.innerHTML = `<option value="">-- Select Weight --</option>`; let stillValid = false;
                    (liveTypeCfg.wps || []).forEach(wp => { const opt = document.createElement('option'); opt.value = wp.itemKey; const outOfStock = !wp.isActive || wp.stock <= 0; const statTxtEn = this.getStockEn(wp.stock, wp.isActive); const priceDispEn = this.fmtPrice(wp.priceEGP); opt.textContent = `${wp.nameENSpec || wp.wtRangeEn} (${priceDispEn}) - ${statTxtEn}`.trim(); opt.disabled = outOfStock; wtSelEl.appendChild(opt); if (wp.itemKey === currVal && !outOfStock) stillValid = true; });
                    if(currVal && stillValid) { wtSelEl.value = currVal; } else if (this.selAnim.type === liveTypeCfg.valKey && this.selAnim.itemKey && liveTypeCfg.wps.find(wp => wp.itemKey === this.selAnim.itemKey && wp.isActive && (wp.stock > 0))) { wtSelEl.value = this.selAnim.itemKey; } else { wtSelEl.value = ""; }
                    const priceKg = liveTypeCfg.priceKgEgp || 0; const priceKgTxtEn = this.fmtPrice(priceKg) + '/kg (indicative)'; const priceKgTxtAr = this.fmtPrice(priceKg) + '/كجم (استرشادي)';
                    const pEN_el = cardEl.querySelector('.price.bil-row .en span'); if(pEN_el) pEN_el.textContent = priceKgTxtEn;
                    const pAR_el = cardEl.querySelector('.price.bil-row .ar span'); if(pAR_el) pAR_el.textContent = priceKgTxtAr;
                });
                this.calcTotalEst();
            } catch (e) { this.usrApiErr = "Error updating product prices on the page: " + e.message; }
        },

        addToCart(productVariant) {
            if (!productVariant || !productVariant.itemKey || productVariant.stock <= 0) {
                this.usrApiErr = this.currLang === 'ar' ? 'هذا المنتج غير متوفر حالياً.' : 'This item is currently out of stock.';
                return;
            }
            const existingItem = this.cartItems.find(item => item.itemKey === productVariant.itemKey);
            if (existingItem) {
                if (existingItem.quantity < productVariant.stock) {
                    existingItem.quantity++;
                } else {
                    this.usrApiErr = this.currLang === 'ar' ? 'لا يمكن إضافة المزيد من هذا المنتج، لقد وصلت إلى الحد الأقصى للمخزون.' : 'Cannot add more of this item, stock limit reached.';
                }
            } else {
                this.cartItems.push({ ...productVariant, quantity: 1 });
            }
            this.usrApiErr = ""; // Clear any previous error
        },
        removeFromCart(itemKey) {
            this.cartItems = this.cartItems.filter(item => item.itemKey !== itemKey);
        },
        updateCartQuantity(itemKey, newQuantity) {
            const item = this.cartItems.find(i => i.itemKey === itemKey);
            if (item) {
                const qty = Math.max(1, parseInt(newQuantity) || 1);
                if (qty <= item.stock) {
                    item.quantity = qty;
                } else {
                    item.quantity = item.stock;
                    this.usrApiErr = this.currLang === 'ar' ? 'الكمية المطلوبة تتجاوز المخزون المتاح.' : 'Requested quantity exceeds available stock.';
                }
            }
        },
        calculateCartTotal() {
            return this.cartItems.reduce((total, item) => total + (item.priceEGP * item.quantity), 0);
        },
        proceedToCartCheckout() {
            // Placeholder for actual cart checkout process
            // This would involve collecting shipping (if not already done), payment,
            // and creating a different type of order or a combined order in PocketBase.
            this.usrApiErr = this.currLang === 'ar' ? 'عملية الدفع للسلة قيد الإنشاء. سيتم التواصل معك لإتمام الطلب.' : 'Cart checkout process is under development. We will contact you to finalize this order.';
            // For a real implementation, you might:
            // 1. Collect user details if not an Udheya order or if the user is not logged in.
            // 2. Create an order record in PocketBase with cartItems.
            // 3. Initiate payment (e.g., redirect to Paddle or show Paddle.js overlay).
            // this.initiatePaddlePayment(this.calculateCartTotal(), this.cartItems); // Conceptual
        },
        async initiateOnlinePayment(orderId, totalAmount) {
            this.usrApiErr = `Order ${orderId} placed. Amount: ${this.fmtPrice(totalAmount)}. Redirecting to payment... (This is a placeholder for actual Paddle integration).`;
            // In a real app:
            // const pb = new PocketBase('/');
            // try {
            //   const paddleCheckout = await pb.send("/api/paddle/create-checkout", {
            //     method: "POST",
            //     body: { orderId: orderId, amount: totalAmount, currency: this.curr }
            //   });
            //   if (paddleCheckout.url) {
            //     window.location.href = paddleCheckout.url;
            //   } else if (paddleCheckout.transactionId && typeof Paddle !== 'undefined') {
            //      Paddle.Checkout.open({ transaction: paddleCheckout.transactionId });
            //   } else {
            //     this.usrApiErr = "Could not initiate online payment. Please contact support.";
            //   }
            // } catch (e) {
            //   this.usrApiErr = "Error initiating online payment: " + (e.data?.message || e.message);
            // }
        },


        async submitOrderValidClientSide() {
            this.clrAllErrs(); let isValid = true;
            for (let i = 1; i <= this.stepMeta.length; i++) { if (!this.valConceptStep(i, true)) { isValid = false; const meta = this.stepMeta[i - 1]; if (meta) { this.currStep = i; this.focusRef(meta.firstFocusableErrorRef || meta.titleRef); this.scrollSect(meta.id || '#udh-order-start'); } break; } }
            if (!isValid) { return; }
            this.load.ordering = true; const pb = new PocketBase('/');
            const orderIdClient = `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            let delOpt = "self_pickup_or_internal_distribution"; if (this.distChoice === 'char') { delOpt = "charity_distribution_by_sl"; } else if (this.needsDelDetails) { delOpt = "home_delivery_to_orderer"; }
            const selCityInfo = (this.needsDelDetails && this.delCity) ? this.allCities.find(c => c.id === this.delCity) : null;
            const selectedProductType = this.prodOpts.udheya.find(type => type.valKey === this.selAnim.type); const selectedProduct = selectedProductType?.wps.find(wp => wp.itemKey === this.selAnim.itemKey);
            if (!selectedProduct || !selectedProductType) { this.setErr('animal', {en: 'Selected product not found. Please re-select.', ar: 'المنتج المحدد غير موجود. يرجى إعادة الاختيار.'}); this.load.ordering = false; return; }
            const orderPayload = {
                order_id_text: orderIdClient, product_id: this.selAnim.varPbId, udheya_service_option_selected: this.selUdhServ, sacrifice_day_value: this.sacDay.val,
                slaughter_viewing_preference: this.viewPref, distribution_choice: this.distChoice, split_details_option: this.distChoice === 'split' ? this.splitOpt : "",
                custom_split_details_text: (this.distChoice === 'split' && this.splitOpt === 'custom') ? (this.splitCustom || "").trim() : "", niyyah_names: (this.niyyahNames || "").trim(),
                ordering_person_name: (this.custName || "").trim(), ordering_person_phone: (this.custPhone || "").trim(), customer_email: (this.custEmail || "").trim(),
                delivery_option: delOpt, delivery_name: this.needsDelDetails ? (this.custName || "").trim() : "", delivery_phone: this.needsDelDetails ? (this.custPhone || "").trim() : "",
                delivery_area_id: (this.needsDelDetails && selCityInfo) ? selCityInfo.id : "", delivery_address: this.needsDelDetails ? (this.delAddr || "").trim() : "",
                delivery_instructions: this.needsDelDetails ? (this.delNotes || "").trim() : "", time_slot: (this.distChoice === 'char' || !this.needsDelDetails) ? 'N/A' : this.timeSlot,
                payment_method: this.payMeth, terms_agreed: true, group_purchase_interest: this.grpBuy, selected_display_currency: this.curr,
                ordered_product_name_en: selectedProduct.nameENSpec, ordered_product_name_ar: selectedProduct.nameARSpec, ordered_weight_range_en: selectedProduct.wtRangeEn,
                ordered_weight_range_ar: selectedProduct.wtRangeAr, price_at_order_time_egp: selectedProduct.priceEGP, service_fee_applied_egp: this.servFee || 0,
                online_payment_fee_applied_egp: this.gatewayFeeEgp, // Changed from paddle_fee_applied_egp
                delivery_fee_applied_egp: this.needsDelDetails && this.delFeeDispEGP > 0 && !this.isDelFeeVar ? this.delFeeDispEGP : 0,
                total_amount_due_egp: this.totalEgp,
                payment_status: this.payMeth === "cod" ? "cod_pending_confirmation" : (this.payMeth === "online_card" ? "pending_gateway_redirect" : "pending_payment"),
                order_status: this.payMeth === "cod" ? "pending_confirmation" : (this.payMeth === "online_card" ? "awaiting_payment_gateway" : "confirmed_pending_payment"),
                sacrifice_day_text_en: this.sacDay.txtEN, sacrifice_day_text_ar: this.sacDay.txtAR,
            };
            try {
                const createdOrder = await pb.collection('orders').create(orderPayload);
                this.orderID = createdOrder.order_id_text || orderIdClient; this.totalEgp = createdOrder.total_amount_due_egp;
                this.gatewayFeeEgp = createdOrder.online_payment_fee_applied_egp || 0;
                this.selAnim.nameEN = createdOrder.ordered_product_name_en; this.selAnim.nameAR = createdOrder.ordered_product_name_ar;
                this.selAnim.wtRangeEn = createdOrder.ordered_weight_range_en; this.selAnim.wtRangeAr = createdOrder.ordered_weight_range_ar;
                this.sacDay.txtEN = createdOrder.sacrifice_day_text_en; this.sacDay.txtAR = createdOrder.sacrifice_day_text_ar;
                const animTypeCfg = this.prodOpts.udheya.find(lt => lt.valKey === this.selAnim.type); if (animTypeCfg) { const stockItemCfg = animTypeCfg.wps.find(wp => wp.itemKey === this.selAnim.itemKey); if (stockItemCfg) { stockItemCfg.stock = Math.max(0, (stockItemCfg.stock || 1) - 1); } }
                this.$nextTick(() => { if (this.elementsReady) { this.updAllPrices(); } });
                this.orderConf = true; this.$nextTick(() => { this.scrollSect('#order-conf-sect'); this.focusRef('orderConfTitle'); });
                if (this.payMeth === 'online_card') {
                    // this.initiateOnlinePayment(this.orderID, this.totalEgp); // Conceptual call
                }
            } catch (e) {
                this.apiErr = String(e.data?.message || e.message || "Order placement failed.");
                let userFriendlyError = "An unexpected error occurred. Please check your selections or contact support.";
                if (e.data && typeof e.data === 'object') { if (e.data.message && e.data.message.toLowerCase().includes("out of stock")) { userFriendlyError = "The selected item is now out of stock. Please choose another."; this.setErr('animal', {en: userFriendlyError, ar: "الخيار المحدد نفذ من المخزون. يرجى اختيار آخر."}, false); this.currStep = 1; this.scrollSect('#step1-content'); this.focusRef(this.stepMeta[0].firstFocusableErrorRef || this.stepMeta[0].titleRef); const selectedAnimalConfig = this.prodOpts.udheya.find(type => type.valKey === this.selAnim.type); if(selectedAnimalConfig){ const selectedWeightPackage = selectedAnimalConfig.wps.find(wp => wp.itemKey === this.selAnim.itemKey); if(selectedWeightPackage) selectedWeightPackage.stock = 0; } this.$nextTick(() => { if (this.elementsReady) { this.updAllPrices(); }}); } else if (e.data.data && Object.keys(e.data.data).length > 0) { const fieldErrors = Object.keys(e.data.data).map(key => `${key.replace(/_/g, ' ')}: ${e.data.data[key].message}`).join("; "); userFriendlyError = `Please correct the following: ${fieldErrors}`; Object.keys(e.data.data).forEach(serverFieldKey => { if(this.errs.hasOwnProperty(serverFieldKey)){ this.setErr(serverFieldKey, {en: e.data.data[serverFieldKey].message, ar: e.data.data[serverFieldKey].message }, false); }}); } else if (e.data.message) { userFriendlyError = e.data.message; } }
                this.usrApiErr = userFriendlyError;
                if (!this.orderID && this.$refs.custNameInputS2 && !userFriendlyError.toLowerCase().includes("out of stock")) { this.currStep = Math.min(this.currStep, 4); const metaToFocus = this.stepMeta[this.currStep-1]; if (metaToFocus) { this.focusRef(metaToFocus.firstFocusableErrorRef || metaToFocus.titleRef); } else { this.focusRef('orderSectTitle'); } } else if (this.apiErr && !this.orderID && !userFriendlyError.toLowerCase().includes("out of stock")) { this.$nextTick(() => this.scrollSect('.err-ind')); }
            } finally { this.load.ordering = false; }
        },
        async submitStatValid() {
            this.clrAllErrs(); let isValid = true;
            if (!(this.lookupOrderID || "").trim()) { this.setErr('lookupOrderID', 'required'); isValid = false; }
            if(isValid) { await this.chkOrderStatus(); } else { if(this.errs.lookupOrderID) this.focusRef('lookupOrderIdInput'); }
        },
        async chkOrderStatus() {
            this.statRes = null; this.statNotFound = false; this.load.status = true; this.apiErr = null; this.usrApiErr = "";
            const id = (this.lookupOrderID || "").trim(); const pb = new PocketBase('/');
            try {
                const recs = await pb.collection('orders').getFullList({ filter: `order_id_text = "${pb.utils.escapeFilterValue(id)}"` });
                if (recs && recs.length > 0) {
                    const o = recs[0]; let distrTxtEn = o.distribution_choice; let distrTxtAr = o.distribution_choice;
                    const distOpt = this.distrOpts().find(opt => opt.val === o.distribution_choice); if(distOpt) { distrTxtEn = distOpt.txtEn; distrTxtAr = distOpt.txtAr; }
                    if (o.distribution_choice === 'split') { let splitDetEn = o.split_details_option; let splitDetAr = o.split_details_option; if (o.split_details_option === 'custom') { splitDetEn = o.custom_split_details_text || "Custom"; splitDetAr = o.custom_split_details_text || "مخصص"; } else { const splitOptRes = this.splitOptsList().find(opt => opt.val === o.split_details_option); if(splitOptRes){ splitDetEn = splitOptRes.txtEn; splitDetAr = splitOptRes.txtAr;} } distrTxtEn += ` (${splitDetEn})`; distrTxtAr += ` (${splitDetAr})`; }
                    this.statRes = {
                        orderIdTxt: o.order_id_text, status: o.order_status?.replace(/_/g," ")||"Unknown", payStatTxt: o.payment_status?.replace(/_/g, " ") || "N/A",
                        animTypeEn: o.ordered_product_name_en, animTypeAr: o.ordered_product_name_ar, wtCatEn: o.ordered_weight_range_en, wtCatAr: o.ordered_weight_range_ar,
                        udhServOpt: o.udheya_service_option_selected, sacDayVal: o.sacrifice_day_value, sacDayTxtEn: o.sacrifice_day_text_en, sacDayTxtAr: o.sacrifice_day_text_ar,
                        viewPref: o.slaughter_viewing_preference, timeSlot: o.time_slot, custName: o.ordering_person_name, niyyah: typeof o.niyyah_names === 'string' ? o.niyyah_names : "",
                        distrChoiceEn: distrTxtEn, distrChoiceAr: distrTxtAr, delAddr: o.delivery_address, delCityEn: o.delivery_area_name_en, delCityAr: o.delivery_area_name_ar,
                        totalEgp: o.total_amount_due_egp, payMeth: o.payment_method, needsDel: (o.delivery_option === 'home_delivery_to_orderer')
                    };
                } else { this.statNotFound = true; this.usrApiErr = "No order found with that ID."; }
            } catch (e) { this.apiErr=String(e.message); this.usrApiErr="Could not get order status. Please check details or contact support."; this.statNotFound=true; }
            finally { this.load.status = false; }
        },
        async resetForm() {
            const preservedSettings = JSON.parse(JSON.stringify(this.settings)); const preservedProdOpts = JSON.parse(JSON.stringify(this.prodOpts));
            const preservedAllCities = JSON.parse(JSON.stringify(this.allCities)); const preservedLang = this.currLang; const preservedCurr = this.curr;
            Object.assign(this, JSON.parse(JSON.stringify(initOrderData)));
            this.settings = preservedSettings; this.prodOpts = preservedProdOpts; this.allCities = preservedAllCities; this.currLang = preservedLang; this.curr = preservedCurr;
            if (this.cdTimer) clearInterval(this.cdTimer);
            this.updServFeeEst(); this.updSacDayTxt(); this.startCd(); this.clrAllErrs(); this.statRes = null; this.statNotFound = false;
            this.cartItems = []; // Clear cart on form reset
            this.$nextTick(() => { if (this.elementsReady) { this.updAllPrices(); } this.updAllStepStates(); this.updDelFeeDispEst(); this.calcTotalEst(); this.currStep = 1; this.orderConf = false; this.orderID = ""; this.scrollSect('#udh-order-start'); this.focusRef('orderSectTitle', false); });
        }
    }));
});
