document.addEventListener('alpine:init', () => {
    const initBookData = {
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
        lookupPhone: "" 
    };

    const payMethOpts = [ 
        { id: 'revolut', title: 'Revolut', imgSrc: 'images/revolut.svg' }, { id: 'monzo', title: 'Monzo', imgSrc: 'images/monzo.svg' },
        { id: 'ip', title: 'InstaPay', imgSrc: 'images/instapay.svg' }, { id: 'fa', title: 'Fawry', imgSrc: 'images/fawry.svg' },
        { id: 'vo', title: 'Vodafone Cash', imgSrc: 'images/vodafone.svg' }, { id: 'cod', title: 'Cash on Delivery', imgSrc: 'images/cod.svg' },
        { id: 'bank_transfer', title: 'Bank Transfer', imgSrc: 'images/bank_transfer.svg' }
    ];
    
    async function apiBookUdheya(bookLoad) {
        const pb = new PocketBase('/');
        try {
            const res = await pb.send("/api/custom_book_udheya", {
                method: "POST",
                body: bookLoad,
            });
            return res; 
        } catch (err) {
            console.error("API call /api/custom_book_udheya err:", err);
            let userMsg = "Failed to place booking. Please try again.";
            if (err.data && err.data.error) { 
                userMsg = err.data.error;
            } else if (err.data && err.data.data && Object.keys(err.data.data).length > 0) { 
                userMsg = "Booking failed due to validation issues: ";
                const fieldErrs = [];
                for (const key in err.data.data) {
                    fieldErrs.push(`${key}: ${err.data.data[key].message}`);
                }
                userMsg += fieldErrs.join("; ");
            } else if (err.message) {
                 userMsg = err.message;
            }
            throw new Error(userMsg);
        }
    }

    Alpine.data('udhBook', () => ({
        load: { status: false, booking: false, init: true },
        settings: { 
            xchgRates: { EGP: { rate_from_egp: 1, symbol: "LE", is_active: true } }, 
            defCurr: "EGP",
            waNumRaw: "", waNumDisp: "",
            promoEndISO: new Date().toISOString(), promoDiscPc: 0, promoActive: false,
            servFeeEGP: 0,
            delAreas: [], 
            payDetails: {}
        },
        prodOpts: { live: [] },
        get availPayMeths() { return payMethOpts; },
        apiErr: null, usrApiErr: "", ...JSON.parse(JSON.stringify(initBookData)),
        bookConf: false, statRes: null, statNotFound: false, lookupBookID: "", 
        currStep: 1, stepProg: { step1: false, step2: false, step3: false, step4: false, step5: false },
        isMobNavOpen: false, isUdhDropOpen: false, isUdhMobSubOpen: false,
        cd: { days: "00", hours: "00", mins: "00", secs: "00", ended: false },
        cdTimer: null, currLang: "en", curr: "EGP", 
        errMsgs: { required: { en: "This field is required.", ar: "هذا الحقل مطلوب." }, select: { en: "Please make a selection.", ar: "يرجى الاختيار." }, email: { en: "Please enter a valid email address.", ar: "يرجى إدخال بريد إلكتروني صحيح." }, phone: { en: "Please enter a valid phone number.", ar: "يرجى إدخال رقم هاتف صحيح." }, timeSlot: { en: "Please select a time slot.", ar: "يرجى اختيار وقت التوصيل." }, udhServ: {en: "Please select a service option.", ar: "يرجى اختيار خيار الخدمة."}},
        navData: [ { href: "#udh-book-start", sectId: "udh-book-start", parentMenu: "Udheya" }, { href: "#chk-book-stat", sectId: "chk-book-stat", parentMenu: "Udheya" }],
        actNavHref: "", stepMeta: [], delFeeDispEGP: 0, isDelFeeVar: false, bookID: "",

        getStockEn(stock, isActive) {
            if (!isActive) return "Inactive";
            if (stock === undefined || stock === null || stock <= 0) return "Out of Stock";
            if (stock > 0 && stock <= 5) return "Limited Stock";
            return "Available";
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
                const remoteSettingsList = await pb.collection('settings').getFullList({ requestKey: null }); // Renamed collection
                if (remoteSettingsList && remoteSettingsList.length > 0) {
                    const rs = remoteSettingsList[0];
                    this.settings.xchgRates = rs.xchgRates;
                    this.settings.defCurr = rs.defCurr;
                    this.settings.waNumRaw = rs.waNumRaw;
                    this.settings.waNumDisp = rs.waNumDisp;
                    this.settings.promoEndISO = rs.promoEndISO;
                    this.settings.promoDiscPc = rs.promoDiscPc;
                    this.settings.promoActive = rs.promoActive;
                    this.settings.servFeeEGP = rs.servFeeEGP;
                    this.settings.delAreas = rs.delAreas;
                    this.settings.payDetails = rs.payDetails;
                } else {
                    this.usrApiErr = "App config could not be loaded.";
                }
                this.servFee = this.settings.servFeeEGP;

                const fetchedProds = await pb.collection('products').getFullList({ 
                    sort: '+sort_order_type,+sort_order_variant', 
                    filter: 'is_active = true', 
                    requestKey: null 
                });
                
                const prodGrps = {};
                fetchedProds.forEach(p => {
                    if (!prodGrps[p.type_key]) {
                        prodGrps[p.type_key] = {
                            valKey: p.type_key, nameEn: p.type_name_en, nameAr: p.type_name_ar,
                            descEn: p.type_description_en, descAr: p.type_description_ar,
                            priceKgEgp: p.price_per_kg_egp, wps: []
                        };
                    }
                    prodGrps[p.type_key].wps.push({
                        itemKey: p.item_key, varIdPb: p.id, 
                        nameENSpec: p.variant_name_en, nameARSpec: p.variant_name_ar,
                        wtRangeEn: p.weight_range_text_en, wtRangeAr: p.weight_range_text_ar,
                        avgWtKg: p.avg_weight_kg, priceEGP: p.base_price_egp,
                        stock: p.stock_available_pb, isActive: p.is_active
                    });
                });
                this.prodOpts.live = Object.values(prodGrps);

            } catch (e) {
                console.error("Error fetching initial data:", e);
                this.apiErr = "Could not load data from server.";
                this.usrApiErr = "Error loading essential data. Please try again later or contact support.";
                this.prodOpts.live = [];
            }
            
            let cities = []; 
            (this.settings.delAreas || []).forEach(gov => {
                if (gov.cities && gov.cities.length > 0) { gov.cities.forEach(city => { cities.push({ id: `${gov.id}_${city.id}`, nameEn: `${gov.name_en} - ${city.name_en}`, nameAr: `${gov.name_ar} - ${city.name_ar}`, delFeeEgp: city.delivery_fee_egp, govId: gov.id, govNameEn: gov.name_en, govNameAr: gov.name_ar }); });
                } else if (gov.delivery_fee_egp !== undefined) { cities.push({ id: gov.id, nameEn: gov.name_en, nameAr: gov.name_ar, delFeeEgp: gov.delivery_fee_egp, govId: gov.id, govNameEn: gov.name_en, govNameAr: gov.name_ar });}
            });
            this.allCities = cities.sort((a,b) => a.nameEn.localeCompare(b.nameEn));
            this.updServFee(); 
            this.curr = this.settings.defCurr;
            this.startCd(); 
            this.updSacDayTxt(); 
            this.clrAllErrs();

            this.$nextTick(() => {
                if (this.prodOpts.live?.length > 0) { this.updAllPrices(); }
                else if (!this.apiErr) { this.usrApiErr = "No sheep options are currently available."; }
                this.updAllStepStates(); this.onScroll();
                this.focusRef(this.bookConf ? "bookConfTitle" : "body", false);
                this.updDelFeeDisp(); this.load.init = false;
            });

            this.stepMeta = [
                { id: "#step1-content", conceptualStep: 1, titleRef: "step1Title", firstFocusableErrorRef: (this.prodOpts.live[0]?.valKey + 'WtSel') || 'step1Title', validator: this.valStep1.bind(this) },
                { id: "#step2-content", conceptualStep: 2, titleRef: "step2Title", firstFocusableErrorRef: 'custNameInputS2', validator: this.valStep2.bind(this) },
                { id: "#step3-content", conceptualStep: 3, titleRef: "step3Title", firstFocusableErrorRef: 'udhServRadiosS3', validator: this.valStep3.bind(this) },
                { id: "#step4-content", conceptualStep: 4, titleRef: "step4Title", firstFocusableErrorRef: 'distChoiceSelS4', validator: this.valStep4.bind(this) },
                { id: "#step5-content", conceptualStep: 5, titleRef: "step5Title", firstFocusableErrorRef: 'payMethRadios', validator: this.valStep5.bind(this) }
            ];
            ['selAnim.priceEgp', 'curr', 'servFee'].forEach(prop => this.$watch(prop, () => { this.calcTotal(); if(prop !== 'servFee') this.updAllPrices(); }));
            this.$watch('settings.servFeeEGP', () => { this.updServFee(); });
            ['sacDay.val', 'distChoice', 'splitOpt', 'splitCustom', 'custName', 'custPhone', 'custEmail', 'delAddr', 'timeSlot', 'payMeth', 'viewPref', 'delCity', 'selUdhServ', 'niyyahNames'].forEach(prop => this.$watch(prop, (nv,ov) => { 
                this.updAllStepStates(); 
                if (prop === 'delCity' && nv !== ov) {this.updDelFeeDisp(); this.calcTotal();} 
                if (prop === 'selUdhServ') this.updServFee(); 
                if (prop === 'distChoice') this.calcTotal(); 
            }));
            window.addEventListener('scroll', () => this.onScroll(), { passive: true });
            window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.startCd(); else if (this.cdTimer) clearInterval(this.cdTimer); });
        },
        updServFee() { 
            if (this.selUdhServ === 'standard_service') { this.servFee = this.settings.servFeeEGP || 0; }
            else if (this.selUdhServ === 'live_animal_only') { this.servFee = 0; }
            else { this.selUdhServ = 'standard_service'; this.servFee = this.settings.servFeeEGP || 0; }
            this.calcTotal();
         },
        onScroll() {
            if (!this.bookConf && this.stepMeta.some(step => { const el = document.querySelector(step.id); return el && typeof el.offsetTop === 'number'; })) {
                const scrollMid = window.scrollY + (window.innerHeight / 2); let closestStep = 1; let minDist = Infinity;
                this.stepMeta.forEach(meta => { const el = document.querySelector(meta.id); if (el) { const dist = Math.abs(scrollMid - (el.offsetTop + (el.offsetHeight / 2))); if (dist < minDist) { minDist = dist; closestStep = meta.conceptualStep; } } });
                if (this.currStep !== closestStep) this.currStep = closestStep;
            }
            const headH = document.querySelector('.head-site')?.offsetHeight || 70; const scrollOff = headH + (window.innerHeight * 0.10); const currScrollYOff = window.scrollY + scrollOff; let newActHref = ""; let newActParent = null;
            for (const navLink of this.navData) { const sectEl = document.getElementById(navLink.sectId); if (sectEl) { const sectTop = sectEl.offsetTop; const sectBot = sectTop + sectEl.offsetHeight; if (sectTop <= currScrollYOff && sectBot > currScrollYOff) { newActHref = navLink.href; newActParent = navLink.parentMenu; break; } } }
            const firstNavSect = document.getElementById(this.navData[0]?.sectId);
            if (window.scrollY < (firstNavSect?.offsetTop || headH) - headH) { newActHref = ""; newActParent = null; }
            else if ((window.innerHeight + Math.ceil(window.scrollY)) >= (document.body.offsetHeight - 2)) { const lastVisLink = this.navData.slice().reverse().find(nl => document.getElementById(nl.sectId)); if (lastVisLink) { newActHref = lastVisLink.href; newActParent = lastVisLink.parentMenu; } }
            this.actNavHref = newActParent || newActHref;
        },
        setErr(f, m) { this.errs[f] = (typeof m === 'string' ? this.errMsgs[m] : m) || this.errMsgs.required; },
        clrErr(f) { if(this.errs[f]) delete this.errs[f]; },
        clrAllErrs() { this.errs = {}; },
        focusRef(r, s=true) {this.$nextTick(()=>{if(this.$refs[r]){this.$refs[r].focus({preventScroll:!s});if(s)setTimeout(()=>{try{this.$refs[r].scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});}catch(e){console.warn("Scroll fail",r,e);}},50);}})},
        get needsDelDetails() { const c = (this.splitCustom || "").toLowerCase(); return this.distChoice === 'me' || (this.distChoice === 'split' && (["1/3_me_2/3_charity_sl", "1/2_me_1/2_charity_sl", "2/3_me_1/3_charity_sl", "all_me_custom_distro"].includes(this.splitOpt) || (this.splitOpt === 'custom' && (c.includes("for me") || c.includes("all delivered to me") || c.includes("لي") || c.includes("توصيل لي"))))); },
        get splitDet() { if(this.distChoice !== 'split') return ""; if(this.splitOpt === 'custom') return (this.splitCustom || "").trim(); const o={"1/3_me_2/3_charity_sl":{en:"1/3 me, 2/3 charity (SL)",ar:"ثلث لي، ثلثان صدقة (أرض الأغنام)"},"1/2_me_1/2_charity_sl":{en:"1/2 me, 1/2 charity (SL)",ar:"نصف لي، نصف صدقة (أرض الأغنام)"},"2/3_me_1/3_charity_sl":{en:"2/3 me, 1/3 charity (SL)",ar:"ثلثان لي، ثلث صدقة (أرض الأغنام)"},"all_me_custom_distro":{en:"All for me (I distribute)",ar:"الكل لي (أنا أوزع)"}};const s=o[this.splitOpt];return s?(this.currLang==='ar'?s.ar:s.en):this.splitOpt;},
        getDelLoc(lang) {
            if (!this.needsDelDetails || !this.delCity) return "";
            const selCityData = this.allCities.find(c => c.id === this.delCity);
            if (!selCityData) return "";
            return lang === 'en' ? selCityData.nameEn : selCityData.nameAr;
        },
        get sumDelToEn() {
            if(this.distChoice === 'char') return "Charity Distribution by Sheep Land";
            if(this.needsDelDetails) {
                const name = (this.custName || "").trim(); const loc = this.getDelLoc('en');
                const addrShort = (this.delAddr || "").substring(0,30) + ((this.delAddr || "").length > 30 ? "..." : "");
                return [name, loc, addrShort].filter(p => p?.trim()).join(", ") || "Delivery Details Incomplete";
            }
            return "Self Pickup/Distribution (No delivery details provided)";
        },
        get sumDelToAr() {
            if(this.distChoice === 'char') return "توزيع خيري بواسطة أرض الأغنام";
            if(this.needsDelDetails) {
                const name = (this.custName || "").trim(); const loc = this.getDelLoc('ar');
                const addrShort = (this.delAddr || "").substring(0,30) + ((this.delAddr || "").length > 30 ? "..." : "");
                return [name, loc, addrShort].filter(p => p?.trim()).join("، ") || "تفاصيل التوصيل غير مكتملة";
            }
            return "استلام ذاتي/توزيع (لم تقدم تفاصيل توصيل)";
        },
        get sumDistrEn() {if(this.distChoice==='me')return"All to me";if(this.distChoice==='char')return"All to charity (by SL)";return`Split: ${(this.splitDet||"").trim()||"(Not specified)"}`;},
        get sumDistrAr() {if(this.distChoice==='me')return"الكل لي";if(this.distChoice==='char')return"تبرع بالكل للصدقة (أرض الأغنام)";return`تقسيم: ${(this.splitDet||"").trim()||"(لم يحدد)"}`;},
        startCd() { if(this.cdTimer)clearInterval(this.cdTimer);if(!this.settings.promoActive||!this.settings.promoEndISO) {this.cd.ended=true;return;} const t=new Date(this.settings.promoEndISO).getTime();if(isNaN(t)){this.cd.ended=true;return;}this.updCdDisp(t);this.cdTimer=setInterval(()=>this.updCdDisp(t),1000);},
        updCdDisp(t) {const d=t-Date.now();if(d<0){if(this.cdTimer)clearInterval(this.cdTimer);Object.assign(this.cd,{days:"00",hours:"00",mins:"00",secs:"00",ended:true});return;}this.cd.ended=false;this.cd={days:String(Math.floor(d/864e5)).padStart(2,'0'),hours:String(Math.floor(d%864e5/36e5)).padStart(2,'0'),mins:String(Math.floor(d%36e5/6e4)).padStart(2,'0'),secs:String(Math.floor(d%6e4/1e3)).padStart(2,'0')};},
        updDelFeeDisp() {
            this.delFeeDispEGP = 0; this.isDelFeeVar = false;
            if (!this.needsDelDetails || !this.delCity) { this.calcTotal(); return; } 
            const cityData = this.allCities.find(c => c.id === this.delCity);
            if (cityData && typeof cityData.delFeeEgp === 'number') { this.delFeeDispEGP = cityData.delFeeEgp; this.isDelFeeVar = false; } 
            else if (cityData && cityData.delFeeEgp === null) { this.isDelFeeVar = true; this.delFeeDispEGP = 0; } 
            else { this.isDelFeeVar = true; this.delFeeDispEGP = 0; }
            this.calcTotal(); 
        },
        fmtPrice(p, c) {const cc=c||this.curr;const ci=this.settings?.xchgRates?.[cc];if(p==null||!ci||typeof ci.rate_from_egp !=='number')return`${ci?.symbol||(cc==='EGP'?'LE':'?')} ---`;const cp=p*ci.rate_from_egp;return`${ci.symbol||(cc==='EGP'?'LE':cc)} ${cp.toFixed((ci.symbol==="LE"||ci.symbol==="ل.م"||cc==='EGP')?0:2)}`;},
        isEmailValid: (e) => (!e?.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
        isPhoneValid: (p) => p?.trim() && /^\+?[0-9\s\-()]{7,20}$/.test(p.trim()),
        scrollSect(s) { try{const e=document.querySelector(s);if(e){let o=document.querySelector('.head-site')?.offsetHeight||0;if(s.startsWith('#udh-book-start')||s.startsWith('#step')||s.startsWith('#udh-book-panel')){const h=document.querySelector('.step-wrap');if(h&&getComputedStyle(h).position==='sticky')o+=h.offsetHeight;}window.scrollTo({top:e.getBoundingClientRect().top+window.pageYOffset-o-10,behavior:'smooth'});}}catch(err){console.warn("ScrollSect err:", err);}},
        valConceptStep(cs, se=true) { const m=this.stepMeta[cs-1]; if(!m||!m.validator)return true; const v=m.validator(se);this.stepProg[`step${cs}`]=v;return v;},
        updAllStepStates() { for(let i=1;i<=this.stepMeta.length;i++)this.stepProg[`step${i}`]=this.valConceptStep(i,false);},
        navStep(tcs) {this.clrAllErrs();let cp=true;for(let s=1;s<tcs;s++){if(!this.valConceptStep(s,true)){this.currStep=s;const m=this.stepMeta[s-1];this.focusRef(m?.firstFocusableErrorRef||m?.titleRef);this.scrollSect(m?.id||'#udh-book-start');cp=false;break;}}if(cp){this.currStep=tcs;this.scrollSect(this.stepMeta[tcs-1]?.id||'#udh-book-start');this.focusRef(this.stepMeta[tcs-1]?.titleRef);}},
        
        valStep1(setErrs = true) { 
            if (setErrs) this.clrErr('animal');
            if (!this.selAnim.itemKey) { if (setErrs) this.setErr('animal', 'select'); return false; }
            return true; 
        },
        valStep2(setErrs = true) { 
            if (setErrs) { this.clrErr('custName'); this.clrErr('custPhone'); this.clrErr('custEmail');}
            let isValid = true;
            if (!(this.custName || "").trim()) { if (setErrs) this.setErr('custName', 'required'); isValid = false; }
            if (!this.isPhoneValid(this.custPhone)) { if (setErrs) this.setErr('custPhone', 'phone'); isValid = false; }
            if ((this.custEmail || "").trim() && !this.isEmailValid(this.custEmail)) { if (setErrs) this.setErr('custEmail', 'email'); isValid = false; }
            return isValid;
        },
        valStep3(setErrs = true) { 
            if (setErrs) { this.clrErr('udhServ');this.clrErr('sacDay'); }
            let isValid = true;
            if (!this.selUdhServ) { if(setErrs) this.setErr('udhServ', 'select'); isValid = false;}
            if (!this.sacDay.val) { if (setErrs) this.setErr('sacDay', 'select'); isValid = false; }
            return isValid;
        },
        valStep4(setErrs = true) { 
            if (setErrs) { this.clrErr('distChoice'); this.clrErr('splitOpt'); this.clrErr('delCity'); this.clrErr('delAddr'); this.clrErr('timeSlot');}
            let isValid = true;
            if (!this.distChoice) { if(setErrs) this.setErr('distChoice', 'select'); isValid = false; }
            if (this.distChoice === 'split' && this.splitOpt === 'custom' && !(this.splitCustom || "").trim()) { if (setErrs) this.setErr('splitOpt', 'required'); isValid = false; }
            else if (this.distChoice === 'split' && !this.splitOpt) { if (setErrs) this.setErr('splitOpt', 'select'); isValid = false; }
            
            if (this.needsDelDetails) { 
                if (!this.delCity) { if (setErrs) this.setErr('delCity', 'select'); isValid = false; } 
                if (!(this.delAddr || "").trim()) { if (setErrs) this.setErr('delAddr', 'required'); isValid = false; }
                if (!this.timeSlot) { if (setErrs) this.setErr('timeSlot', 'select'); isValid = false; }
            }
            return isValid;
        },
        valStep5(setErrs = true) { 
            if (setErrs) this.clrErr('payMeth');
            if (!this.payMeth) { if (setErrs) this.setErr('payMeth', 'select'); return false; }
            return true;
        },

        selAnimal(animTypeKey, wtSelEl) { 
            const selItemKey = wtSelEl.value; 
            this.clrErr('animal');
            if (!selItemKey) {
                this.selAnim = { ...initBookData.selAnim };
                this.prodOpts.live.forEach(type => { if (type.valKey !== animTypeKey && this.$refs[`${type.valKey}WtSel`]) { this.$refs[`${type.valKey}WtSel`].value = ""; } });
                this.calcTotal(); this.updAllStepStates(); return;
            }
            this.prodOpts.live.forEach(type => { if (type.valKey !== animTypeKey && this.$refs[`${type.valKey}WtSel`]) { this.$refs[`${type.valKey}WtSel`].value = ""; } });
            const animTypeCfg = this.prodOpts.live.find(a => a.valKey === animTypeKey);
            if (!animTypeCfg) { this.selAnim = { ...initBookData.selAnim }; this.calcTotal(); this.updAllStepStates(); return; }
            const selSpecItem = animTypeCfg.wps.find(wp => wp.itemKey === selItemKey);
            if (selSpecItem && selSpecItem.isActive && selSpecItem.stock > 0) {
                this.selAnim = {
                    type: animTypeCfg.valKey, itemKey: selSpecItem.itemKey, 
                    varPbId: selSpecItem.varIdPb, 
                    wtRangeEn: selSpecItem.wtRangeEn, wtRangeAr: selSpecItem.wtRangeAr,
                    priceEgp: selSpecItem.priceEGP, nameEN: selSpecItem.nameENSpec, nameAR: selSpecItem.nameARSpec,
                    stock: selSpecItem.stock, typeGenEn: animTypeCfg.nameEn, typeGenAr: animTypeCfg.nameAr,
                    typePriceKgEgp: animTypeCfg.priceKgEgp
                };
            } else {
                this.selAnim = { ...initBookData.selAnim };
                this.setErr('animal', {en: 'Selected item is out of stock or inactive.', ar: 'الخيار المحدد غير متوفر أو غير نشط.'});
            }
            this.calcTotal(); this.updAllStepStates();
        },
        updSacDayTxt() { 
            const sacDaySelEl = this.$refs.sacDaySelS3; 
            if (sacDaySelEl) { 
                const optEl = sacDaySelEl.querySelector(`option[value="${this.sacDay.val}"]`); 
                if(optEl) Object.assign(this.sacDay,{txtEN:optEl.dataset.en,txtAR:optEl.dataset.ar});
            } 
        },
        calcTotal() { 
            let delFeeTotal = 0; 
            if(this.needsDelDetails && this.delFeeDispEGP > 0 && !this.isDelFeeVar) { 
                delFeeTotal = this.delFeeDispEGP; 
            } 
            this.totalEgp=(this.selAnim.priceEgp||0) + (this.servFee || 0) + delFeeTotal;  
        },
        updAllPrices() {
            try {
                (this.prodOpts.live || []).forEach(liveTypeCfg => { 
                    const wtSelEl = this.$refs[`${liveTypeCfg.valKey}WtSel`]; 
                    const cardEl = document.getElementById(liveTypeCfg.valKey); 
                    if (!wtSelEl || !cardEl) { console.warn(`Missing elements for ${liveTypeCfg.valKey}`); return; }
                    const currVal = wtSelEl.value; 
                    wtSelEl.innerHTML = `<option value="">-- Select Weight --</option>`;
                    let stillValid = false;
                    (liveTypeCfg.wps || []).forEach(wp => { 
                        const opt = document.createElement('option'); 
                        opt.value = wp.itemKey; 
                        const outOfStock = !wp.isActive || wp.stock <= 0;
                        const statTxtEn = this.getStockEn(wp.stock, wp.isActive);
                        const priceDispEn = this.fmtPrice(wp.priceEGP);
                        opt.textContent = `${wp.nameENSpec || wp.wtRangeEn} (${priceDispEn}) - ${statTxtEn}`.trim();
                        opt.disabled = outOfStock; 
                        wtSelEl.appendChild(opt);
                        if (wp.itemKey === currVal && !outOfStock) stillValid = true;
                    });
                    if(currVal && stillValid) { wtSelEl.value = currVal; }
                    else if (this.selAnim.type === liveTypeCfg.valKey && this.selAnim.itemKey && liveTypeCfg.wps.find(wp => wp.itemKey === this.selAnim.itemKey && wp.isActive && (wp.stock > 0))) { wtSelEl.value = this.selAnim.itemKey; }
                    else { wtSelEl.value = ""; }
                    const priceKg = liveTypeCfg.priceKgEgp || 0;
                    const priceKgTxtEn = this.fmtPrice(priceKg) + '/kg';
                    const priceKgTxtAr = this.fmtPrice(priceKg) + '/كجم';
                    const pEN_el = cardEl.querySelector('.price.bil-row .en span'); if(pEN_el) pEN_el.textContent = priceKgTxtEn;
                    const pAR_el = cardEl.querySelector('.price.bil-row .ar span'); if(pAR_el) pAR_el.textContent = priceKgTxtAr;
                });
                this.calcTotal(); 
            } catch (e) { console.error("Error in updAllPrices:", e); this.usrApiErr = "Error updating prices."; }
        },
        async submitBookValid() { 
            this.clrAllErrs(); let isValid = true;
            for (let i = 1; i <= this.stepMeta.length; i++) { if (!this.valConceptStep(i, true)) { isValid = false; const meta = this.stepMeta[i-1]; if (meta) { this.focusRef(meta.firstFocusableErrorRef || meta.titleRef); this.scrollSect(meta.id || '#udh-book-start'); } break; }}
            if (!isValid) return;

            const animTypeCfg = this.prodOpts.live.find(lt => lt.valKey === this.selAnim.type);
            const stockItemCfg = animTypeCfg?.wps.find(wp => wp.itemKey === this.selAnim.itemKey);

            if (!stockItemCfg || !stockItemCfg.isActive || stockItemCfg.stock <= 0) { 
                this.setErr('animal', { en: `Sorry, selected item is unavailable. Please reselect.`, ar: `عذراً، المنتج المختار غير متوفر. يرجى إعادة الاختيار.` });
                this.selAnim.priceEgp = 0; this.updAllPrices(); this.updAllStepStates();
                this.scrollSect('#step1-content'); this.focusRef(this.stepMeta[0].firstFocusableErrorRef || this.stepMeta[0].titleRef); return;
            }
            this.load.booking = true; this.apiErr = null; this.usrApiErr = ""; this.calcTotal();
            const bookIdClient = `SL-UDHY-${new Date().getFullYear()}-${String(Math.random()).slice(2,7)}`;
            let delOpt = "self_pickup_or_internal_distribution"; 
            if (this.distChoice === 'char') delOpt = "charity_distribution_by_sl"; 
            else if (this.needsDelDetails) delOpt = "home_delivery_to_orderer";
            const selCityInfo = (this.needsDelDetails && this.delCity) ? this.allCities.find(c => c.id === this.delCity) : null;
            
            const payload = {
                booking_id_text: bookIdClient, 
                product_item_key: this.selAnim.itemKey,
                quantity: 1, 
                animal_type_name_en: this.selAnim.typeGenEn, animal_type_name_ar: this.selAnim.typeGenAr,
                weight_category_name_en: this.selAnim.nameEN, weight_category_name_ar: this.selAnim.nameAR,
                weight_range_actual_en: this.selAnim.wtRangeEn, weight_range_actual_ar: this.selAnim.wtRangeAr,
                animal_base_price_egp: this.selAnim.priceEgp,
                udheya_service_option_selected: this.selUdhServ,
                service_fee_applied_egp: this.servFee,
                delivery_fee_applied_egp: (this.needsDelDetails && this.delFeeDispEGP > 0 && !this.isDelFeeVar) ? this.delFeeDispEGP : 0,
                total_amount_due_egp: this.totalEgp, selected_display_currency: this.curr,
                sacrifice_day_value: this.sacDay.val, sacrifice_day_text_en: this.sacDay.txtEN, sacrifice_day_text_ar: this.sacDay.txtAR,
                slaughter_viewing_preference: this.viewPref, distribution_choice: this.distChoice,
                split_details_option: this.distChoice === 'split' ? this.splitOpt : "", custom_split_details_text: (this.distChoice === 'split' && this.splitOpt === 'custom') ? (this.splitCustom || "").trim() : "",
                niyyah_names: (this.niyyahNames || "").trim(), ordering_person_name: (this.custName || "").trim(), 
                ordering_person_phone: (this.custPhone || "").trim(), customer_email: (this.custEmail || "").trim(),
                delivery_option: delOpt, delivery_name: (this.custName || "").trim(), delivery_phone: (this.custPhone || "").trim(), 
                delivery_area_id: (this.needsDelDetails && selCityInfo) ? selCityInfo.id : "", 
                delivery_area_name_en: (this.needsDelDetails && selCityInfo) ? selCityInfo.nameEn : "", 
                delivery_area_name_ar: (this.needsDelDetails && selCityInfo) ? selCityInfo.nameAr : "",
                delivery_address: this.needsDelDetails ? (this.delAddr || "").trim() : "", 
                delivery_instructions: this.needsDelDetails ? (this.delNotes || "").trim() : "",
                time_slot: (this.distChoice === 'char' || !this.needsDelDetails) ? 'N/A' : this.timeSlot,
                payment_method: this.payMeth, 
                payment_status: (this.payMeth === 'cod' && this.needsDelDetails) ? 'cod_pending_confirmation' : 'pending_payment',
                booking_status: 'confirmed_pending_payment', terms_agreed: true, 
                group_purchase_interest: this.grpBuy, admin_notes: this.grpBuy ? "Group purchase interest." : ""
            };

            try {
                const bookRes = await apiBookUdheya(payload); 
                this.bookID = bookRes.booking_id_text || bookIdClient; 
                
                if (stockItemCfg) {
                    const newClientStock = bookRes.new_stock_level !== undefined ? bookRes.new_stock_level : (stockItemCfg.stock -1);
                    stockItemCfg.stock = newClientStock;
                    this.selAnim.stock = newClientStock;
                    this.updAllPrices(); 
                }

                this.bookConf = true; 
                this.$nextTick(() => { this.scrollSect('#book-conf-sect'); this.focusRef('bookConfTitle'); });
            } catch (e) { 
                this.apiErr=String(e.message); 
                this.usrApiErr = e.message; 
                this.$nextTick(()=>this.scrollSect('.err-ind'));
            }
            finally { this.load.booking = false; }
        },
        async submitStatValid() {
            this.clrErr('lookupBookID'); this.clrErr('lookupPhone');
            let isValid = true;
            if (!(this.lookupBookID || "").trim()) { this.setErr('lookupBookID', 'required'); isValid = false; }
            if (!this.isPhoneValid(this.lookupPhone)) { this.setErr('lookupPhone', 'phone'); isValid = false; }
            if(isValid) { await this.chkBookStat(); } 
            else { if(this.errs.lookupBookID) this.focusRef('lookupBookIdInput'); else if(this.errs.lookupPhone) this.focusRef('lookupPhoneInput');}
        },
        async chkBookStat() { 
            this.statRes = null; this.statNotFound = false; this.load.status = true; this.apiErr = null; this.usrApiErr = ""; 
            const id = (this.lookupBookID || "").trim(); const phone = (this.lookupPhone || "").trim(); 
            const pb = new PocketBase('/');
            try {
                const filterStr = `(booking_id_text = "${pb.realtime.client.utils.escapeFilterValue(id)}" && ordering_person_phone = "${pb.realtime.client.utils.escapeFilterValue(phone)}")`;
                const recs = await pb.collection('bookings').getFullList({filter: filterStr, requestKey: null});

                if (recs && recs.length > 0) {
                    const b = recs[0];
                    let distrTxtEn = b.distribution_choice; let distrTxtAr = b.distribution_choice; 
                     const distOpt = this.distrOpts().find(opt => opt.val === b.distribution_choice);
                     if(distOpt) { distrTxtEn = distOpt.txtEn; distrTxtAr = distOpt.txtAr; }

                    if (b.distribution_choice === 'split') {
                        let splitDetEn = b.split_details_option; let splitDetAr = b.split_details_option;
                        if (b.split_details_option === 'custom') {
                            splitDetEn = b.custom_split_details_text || "Custom"; splitDetAr = b.custom_split_details_text || "مخصص";
                        } else {
                            const splitOptRes = this.splitOptsList().find(opt => opt.val === b.split_details_option);
                            if(splitOptRes){ splitDetEn = splitOptRes.txtEn; splitDetAr = splitOptRes.txtAr;}
                        }
                        distrTxtEn += ` (${splitDetEn})`; distrTxtAr += ` (${splitDetAr})`;
                    }
                    
                    this.statRes = { 
                        bookIdTxt: b.booking_id_text, status: b.booking_status?.replace(/_/g," ")||"Unknown", 
                        payStatTxt: b.payment_status?.replace(/_/g, " ") || "N/A",
                        animTypeEn: b.animal_type_name_en, animTypeAr: b.animal_type_name_ar,
                        wtCatEn: b.weight_category_name_en, wtCatAr: b.weight_category_name_ar,
                        udhServOpt: b.udheya_service_option_selected,
                        sacDayVal: b.sacrifice_day_value, sacDayTxtEn: b.sacrifice_day_text_en, sacDayTxtAr: b.sacrifice_day_text_ar,
                        viewPref: b.slaughter_viewing_preference, timeSlot: b.time_slot,
                        custName: b.ordering_person_name, niyyah: b.niyyah_names,
                        distrChoiceEn: distrTxtEn, distrChoiceAr: distrTxtAr,
                        delAddr: b.delivery_address, delCityEn: b.delivery_city_name_en, delCityAr: b.delivery_city_name_ar,
                        totalEgp: b.total_amount_due_egp, payMeth: b.payment_method,
                         needsDel: (b.delivery_option === 'home_delivery_to_orderer' || (b.distribution_choice === 'split' && (b.split_details_option?.includes('_me_') || b.split_details_option === 'all_me_custom_distro' || (b.split_details_option === 'custom' && b.custom_split_details_text?.toLowerCase().includes('me')))))
                    };
                } else this.statNotFound = true;
            } catch (e) { this.apiErr=String(e.message);this.usrApiErr="Could not get status.";this.statNotFound=true;}
            finally { this.load.status = false; }
        },
        getSacDayTxt(v) { 
            const optEl = document.querySelector(`#sac_day_sel_s3 option[value="${v}"]`); 
            return optEl ? {en: optEl.dataset.en, ar: optEl.dataset.ar} : {en: v, ar: v}; 
        },
        
        async resetForm() { 
            const currency = this.curr; const lang = this.currLang;
            Object.assign(this, JSON.parse(JSON.stringify(initBookData)));
            this.curr = currency; this.currLang = lang;
            if (this.cdTimer) clearInterval(this.cdTimer);
            await this.initApp(); 
            this.$nextTick(() => {
                this.scrollSect('#udh-book-start'); 
                this.focusRef('bookSectTitle');
                this.bookConf = false; 
                this.bookID = "";
            });
        }
    }));
});