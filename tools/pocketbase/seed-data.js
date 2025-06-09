/**
 * PocketBase Seed Data Definition
 * Single source of truth for initial data
 */

// Default refund policy HTML content
const defaultRefundPolicyHTML = `
        <div class="bil-row">
            <p class="en">Welcome to Sheep Land. We are committed to providing premium quality sheep, livesheep, and meat products with full Sharia compliance. Please read our comprehensive policy.</p>
            <p class="ar" dir="rtl">أهلاً بكم في أرض الأغنام. نحن ملتزمون بتقديم منتجات الأغنام الحية واللحوم عالية الجودة مع الامتثال الكامل للشريعة الإسلامية.</p>
        </div>
        <h3 class="bil-spread modal-section-title">
            <span class="en">Udheya & Qurbani Orders</span><span class="ar" dir="rtl">طلبات الأضاحي والقرباني</span>
        </h3>
        <div class="bil-row">
            <p class="en">Due to the religious nature and specific timing of Udheya/Qurbani, our policies are designed to ensure proper fulfillment while accommodating genuine needs:</p>
            <p class="ar" dir="rtl">نظراً للطبيعة الدينية والتوقيت المحدد للأضاحي والقرباني، تم تصميم سياساتنا لضمان التنفيذ السليم مع مراعاة الاحتياجات الحقيقية:</p>
        </div>
        <h4 class="bil-spread"><span class="en">Cancellation Policy</span><span class="ar" dir="rtl">سياسة الإلغاء</span></h4>
        <div class="bil-row">
            <p class="en"><strong>Before Animal Selection (5+ days before Eid):</strong> Full refund minus 3% processing fee</p>
            <p class="ar" dir="rtl"><strong>قبل اختيار الحيوان (5+ أيام قبل العيد):</strong> استرداد كامل ناقص 3% رسوم معالجة</p>
        </div>
        <div class="bil-row">
            <p class="en"><strong>After Animal Selection (2-4 days before):</strong> 50% refund if suitable replacement buyer found</p>
            <p class="ar" dir="rtl"><strong>بعد اختيار الحيوان (2-4 أيام قبل):</strong> استرداد 50% إذا تم العثور على مشترٍ بديل مناسب</p>
        </div>
        <div class="bil-row">
            <p class="en"><strong>Day of Eid:</strong> No refunds (animal prepared for slaughter)</p>
            <p class="ar" dir="rtl"><strong>يوم العيد:</strong> لا يوجد استرداد (الحيوان محضر للذبح)</p>
        </div>

        <h3 class="bil-spread modal-section-title"><span class="en">Live Sheep</span><span class="ar" dir="rtl">الأغنام الحية</span></h3>
        <div class="bil-row">
            <p class="en">Live animals require 48-72 hours advance notice for cancellation. Health-guaranteed animals cannot be returned unless veterinary defects are proven within 24 hours of delivery.</p>
            <p class="ar" dir="rtl">الحيوانات الحية تتطلب إشعار مسبق 48-72 ساعة للإلغاء. الحيوانات المضمونة صحياً لا يمكن إرجاعها إلا إذا تم إثبات عيوب بيطرية خلال 24 ساعة من التسليم.</p>
        </div>

        <h3 class="bil-spread modal-section-title"><span class="en">Fresh Meat & Cuts</span><span class="ar" dir="rtl">اللحوم الطازجة والقطعيات</span></h3>
        <div class="bil-row">
            <p class="en">Fresh meat orders can be cancelled up to 24 hours before preparation. Quality issues must be reported within 4 hours of delivery with photographic evidence.</p>
            <p class="ar" dir="rtl">يمكن إلغاء طلبات اللحوم الطازجة حتى 24 ساعة قبل التحضير. يجب الإبلاغ عن مشاكل الجودة خلال 4 ساعات من التوصيل مع دليل فوتوغرافي.</p>
        </div>

        <h3 class="bil-spread modal-section-title"><span class="en">Gathering Packages & Events</span><span class="ar" dir="rtl">باقات المناسبات والولائم</span></h3>
        <div class="bil-row">
            <p class="en">Event packages require 7 days notice for full refund, 3 days for 50% refund. Same-day cancellations incur full charges due to preparation costs.</p>
            <p class="ar" dir="rtl">باقات المناسبات تتطلب إشعار 7 أيام للاسترداد الكامل، 3 أيام لاسترداد 50%. إلغاء نفس اليوم يتحمل الرسوم كاملة بسبب تكاليف التحضير.</p>
        </div>

        <h3 class="bil-spread modal-section-title"><span class="en">International Orders</span><span class="ar" dir="rtl">الطلبات الدولية</span></h3>
        <div class="bil-row">
            <p class="en">International customers enjoy the same quality guarantees. Shipping costs are non-refundable unless we fail to fulfill confirmed orders.</p>
            <p class="ar" dir="rtl">العملاء الدوليون يتمتعون بنفس ضمانات الجودة. تكاليف الشحن غير قابلة للاسترداد إلا إذا فشلنا في تلبية الطلبات المؤكدة.</p>
        </div>
    `;

// Function to generate dynamic promo end date (30 days from now)
const generatePromoEndDate = () => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
};

const seedData = {
    settings: [{
        xchgRates: { 
            EGP: { rate_from_egp: 1, symbol: "LE", is_active: true }, 
            USD: { rate_from_egp: 0.020, symbol: "$", is_active: true }, 
            SAR: { rate_from_egp: 0.075, symbol: "﷼", is_active: true },
            AED: { rate_from_egp: 0.073, symbol: "د.إ", is_active: true },
            GBP: { rate_from_egp: 0.016, symbol: "£", is_active: true }, 
            EUR: { rate_from_egp: 0.018, symbol: "€", is_active: true },
            KWD: { rate_from_egp: 0.006, symbol: "د.ك", is_active: true },
            QAR: { rate_from_egp: 0.073, symbol: "ر.ق", is_active: true }
        },
        defCurr: "EGP", 
        waNumRaw: "201001234567", 
        waNumDisp: "+20 100 123 4567", 
        promoEndISO: generatePromoEndDate(), 
        promoDiscPc: 15, 
        promoActive: true, 
        servFeeEGP: 800,
        delAreas: [ 
            { 
                id: "cairo_metro", 
                name_en: "Cairo Metropolitan", 
                name_ar: "القاهرة الكبرى", 
                cities: [ 
                    { id: "nasr_city", name_en: "Nasr City", name_ar: "مدينة نصر", delivery_fee_egp: 100 }, 
                    { id: "heliopolis", name_en: "Heliopolis", name_ar: "مصر الجديدة", delivery_fee_egp: 120 }, 
                    { id: "maadi", name_en: "Maadi", name_ar: "المعادي", delivery_fee_egp: 150 },
                    { id: "zamalek", name_en: "Zamalek", name_ar: "الزمالك", delivery_fee_egp: 180 }
                ] 
            }, 
            { 
                id: "giza_west", 
                name_en: "Giza West", 
                name_ar: "غرب الجيزة", 
                cities: [ 
                    { id: "october", name_en: "6th of October City", name_ar: "مدينة 6 أكتوبر", delivery_fee_egp: 200 }, 
                    { id: "zayed", name_en: "Sheikh Zayed", name_ar: "الشيخ زايد", delivery_fee_egp: 220 }, 
                    { id: "hadayek_october", name_en: "Hadayek October", name_ar: "حدائق أكتوبر", delivery_fee_egp: 180 } 
                ] 
            }, 
            { 
                id:"new_cairo", 
                name_en:"New Cairo & East", 
                name_ar:"القاهرة الجديدة والشرق", 
                cities:[ 
                    {id:"tagamoa", name_en:"New Cairo (Tagamoa)", name_ar:"التجمع (القاهرة الجديدة)", delivery_fee_egp: 250 }, 
                    {id:"madinaty", name_en:"Madinaty", name_ar:"مدينتي", delivery_fee_egp: 280 }, 
                    {id:"shorouk", name_en:"El Shorouk", name_ar:"الشروق", delivery_fee_egp: 300},
                    {id:"rehab", name_en:"Rehab City", name_ar:"مدينة الرحاب", delivery_fee_egp: 260}
                ] 
            },
            { 
                id:"alex_metro", 
                name_en:"Alexandria Metropolitan", 
                name_ar:"الإسكندرية الكبرى", 
                cities:[ 
                    {id:"alex_center", name_en:"Alexandria Center", name_ar:"وسط الإسكندرية", delivery_fee_egp: 400 }, 
                    {id:"alex_east", name_en:"Alexandria East", name_ar:"شرق الإسكندرية", delivery_fee_egp: 450 },
                    {id:"alex_west", name_en:"Alexandria West", name_ar:"غرب الإسكندرية", delivery_fee_egp: 420 }
                ] 
            }
        ],
        payDetails: { 
            vodafone_cash: "01012345678", 
            instapay_ipn: "sheepland@instapay", 
            revolut_details: "@SheepLandEgypt", 
            monzo_details: "monzo.me/sheeplandegypt", 
            paypal_email: "payments@sheep.land",
            bank_name: "Commercial International Bank Egypt", 
            bank_account_name: "Sheep Land Trading", 
            bank_account_number: "1234567890123456", 
            bank_iban: "EG38CIBE12345678901234567890", 
            bank_swift: "CIBEEGCX",
            western_union_details: "Sheep Land - Cairo Branch",
            moneygram_details: "Available at all Egypt Post offices"
        },
        enable_udheya_section: true, 
        enable_livesheep_section: true, 
        enable_meat_section: true, 
        enable_gatherings_section: true,
        slaughter_location_gmaps_url: "https://maps.app.goo.gl/SheepLandEgyptFarm123", 
        online_payment_fee_egp: 50,
        refund_policy_html: defaultRefundPolicyHTML, 
        app_email_sender_address: "noreply@sheep.land", 
        app_email_sender_name: "Sheep Land",
        site_title_en: "Sheep Land",
        site_title_ar: "أرض الأغنام",
        site_desc_en: "Sheep, livesheep, fresh meat, and Sharia-compliant Udheya services. Serving Egypt and international customers.",
        site_desc_ar: "أغنام وأغنام ولحوم طازجة وخدمات أضاحي متوافقة مع الشريعة. نخدم مصر والعملاء الدوليين."
    }],
    // Initial product catalog - can be modified via PocketBase admin after setup
    // These replace the old hardcoded Baladi/Barki products that were in the HTML
    products: [
        { item_key: "baladi_udheya_40kg", product_category: "udheya", type_key: "baladi_sheep", type_name_en: "Baladi Sheep", type_name_ar: "خروف بلدي", type_description_en: "Egyptian Baladi sheep.", type_description_ar: "أغنام بلدية مصرية تربت في مزارع بطرق تقليدية.", price_per_kg_egp: 280, variant_name_en: "Baladi Small (35-45kg)", variant_name_ar: "بلدي صغير (٣٥-٤٥ كجم)", weight_range_text_en: "35-45kg", weight_range_text_ar: "٣٥-٤٥ كجم", avg_weight_kg: 40, base_price_egp: 11200, stock_available_pb: 25, is_active: true, is_premium: false, origin_farm: "Fayoum Farms", breed_info_en: "Traditional Egyptian breed", breed_info_ar: "سلالة مصرية تقليدية", sort_order_type: 1, sort_order_variant: 1 },
        
        { item_key: "baladi_udheya_50kg", product_category: "udheya", type_key: "baladi_sheep", type_name_en: "Baladi Sheep", type_name_ar: "خروف بلدي", type_description_en: "Egyptian Baladi sheep.", type_description_ar: "أغنام بلدية مصرية تربت في مزارع بطرق تقليدية.", price_per_kg_egp: 280, variant_name_en: "Baladi Medium (45-55kg)", variant_name_ar: "بلدي متوسط (٤٥-٥٥ كجم)", weight_range_text_en: "45-55kg", weight_range_text_ar: "٤٥-٥٥ كجم", avg_weight_kg: 50, base_price_egp: 14000, stock_available_pb: 30, is_active: true, is_premium: false, origin_farm: "Fayoum Farms", breed_info_en: "Traditional Egyptian breed", breed_info_ar: "سلالة مصرية تقليدية", sort_order_type: 1, sort_order_variant: 2 },

        { item_key: "baladi_udheya_62kg", product_category: "udheya", type_key: "baladi_sheep", type_name_en: "Baladi Sheep", type_name_ar: "خروف بلدي", type_description_en: "Egyptian Baladi sheep.", type_description_ar: "أغنام بلدية مصرية تربت في مزارع بطرق تقليدية.", price_per_kg_egp: 280, variant_name_en: "Baladi Large (55-70kg)", variant_name_ar: "بلدي كبير (٥٥-٧٠ كجم)", weight_range_text_en: "55-70kg", weight_range_text_ar: "٥٥-٧٠ كجم", avg_weight_kg: 62, base_price_egp: 17360, stock_available_pb: 20, is_active: true, is_premium: false, origin_farm: "Fayoum Farms", breed_info_en: "Traditional Egyptian breed", breed_info_ar: "سلالة مصرية تقليدية", sort_order_type: 1, sort_order_variant: 3 },

        { item_key: "barki_udheya_37kg", product_category: "udheya", type_key: "barki_sheep", type_name_en: "Barki Sheep", type_name_ar: "خروف برقي", type_description_en: "Barki sheep with lean meat.", type_description_ar: "أغنام برقي من مناطق صحراوية بلحم قليل الدهن.", price_per_kg_egp: 320, variant_name_en: "Barki Small (35-40kg)", variant_name_ar: "برقي صغير (٣٥-٤٠ كجم)", weight_range_text_en: "35-40kg", weight_range_text_ar: "٣٥-٤٠ كجم", avg_weight_kg: 37, base_price_egp: 11840, stock_available_pb: 15, is_active: true, is_premium: true, origin_farm: "Marsa Matrouh Desert Farms", breed_info_en: "Desert-adapted Bedouin breed", breed_info_ar: "سلالة بدوية متكيفة مع الصحراء", sort_order_type: 2, sort_order_variant: 1 },

        { item_key: "barki_udheya_42kg", product_category: "udheya", type_key: "barki_sheep", type_name_en: "Barki Sheep", type_name_ar: "خروف برقي", type_description_en: "Barki sheep with lean meat.", type_description_ar: "أغنام برقي من مناطق صحراوية بلحم قليل الدهن.", price_per_kg_egp: 320, variant_name_en: "Barki Medium (40-45kg)", variant_name_ar: "برقي متوسط (٤٠-٤٥ كجم)", weight_range_text_en: "40-45kg", weight_range_text_ar: "٤٠-٤٥ كجم", avg_weight_kg: 42, base_price_egp: 13440, stock_available_pb: 12, is_active: true, is_premium: true, origin_farm: "Marsa Matrouh Desert Farms", breed_info_en: "Desert-adapted Bedouin breed", breed_info_ar: "سلالة بدوية متكيفة مع الصحراء", sort_order_type: 2, sort_order_variant: 2 },

        { item_key: "barki_udheya_47kg", product_category: "udheya", type_key: "barki_sheep", type_name_en: "Barki Sheep", type_name_ar: "خروف برقي", type_description_en: "Barki sheep with lean meat.", type_description_ar: "أغنام برقي من مناطق صحراوية بلحم قليل الدهن.", price_per_kg_egp: 320, variant_name_en: "Barki Large (45-50kg)", variant_name_ar: "برقي كبير (٤٥-٥٠ كجم)", weight_range_text_en: "45-50kg", weight_range_text_ar: "٤٥-٥٠ كجم", avg_weight_kg: 47, base_price_egp: 15040, stock_available_pb: 8, is_active: true, is_premium: true, origin_farm: "Marsa Matrouh Desert Farms", breed_info_en: "Desert-adapted Bedouin breed", breed_info_ar: "سلالة بدوية متكيفة مع الصحراء", sort_order_type: 2, sort_order_variant: 3 },
        { item_key: "live_ram_baladi_breeding", product_category: "livesheep_general", type_key: "breeding_rams", type_name_en: "Rams", type_name_ar: "كباش", type_description_en: "Breeding rams.", type_description_ar: "كباش تربية للمزارع.", variant_name_en: "Baladi Ram (80-100kg)", variant_name_ar: "كبش بلدي (٨٠-١٠٠ كجم)", weight_range_text_en: "80-100kg", weight_range_text_ar: "٨٠-١٠٠ كجم", avg_weight_kg: 90, base_price_egp: 18000, stock_available_pb: 6, is_active: true, is_premium: false, origin_farm: "Selection Breeding Center", breed_info_en: "Breeding genetics", breed_info_ar: "وراثة تربية", sort_order_type: 5, sort_order_variant: 1 },

        { item_key: "live_ewe_saidi_breeding", product_category: "livesheep_general", type_key: "breeding_ewes", type_name_en: "Ewes", type_name_ar: "نعاج", type_description_en: "Breeding ewes with fertility records.", type_description_ar: "نعاج تربية مع سجلات خصوبة. أمهات مع إنتاج حليب جيد.", variant_name_en: "Saidi Ewe (55-70kg)", variant_name_ar: "نعجة صعيدي (٥٥-٧٠ كجم)", weight_range_text_en: "55-70kg", weight_range_text_ar: "٥٥-٧٠ كجم", avg_weight_kg: 62, base_price_egp: 12000, stock_available_pb: 10, is_active: true, is_premium: true, origin_farm: "Elite Breeding Center", breed_info_en: "High fertility proven lines", breed_info_ar: "سلالات عالية الخصوبة مثبتة", sort_order_type: 5, sort_order_variant: 2 },

        { item_key: "live_lambs_weaned", product_category: "livesheep_general", type_key: "young_lambs", type_name_en: "Weaned Lambs", type_name_ar: "حملان مفطومة", type_description_en: "Weaned lambs, 3-6 months old. Vaccinated and health-checked.", type_description_ar: "حملان مفطومة، عمر ٣-٦ أشهر، للتربية أو التسمين. محصنة ومفحوصة صحياً.", variant_name_en: "Weaned Lamb (15-25kg)", variant_name_ar: "حمل مفطوم (١٥-٢٥ كجم)", weight_range_text_en: "15-25kg", weight_range_text_ar: "١٥-٢٥ كجم", avg_weight_kg: 20, base_price_egp: 4500, stock_available_pb: 35, is_active: true, is_premium: false, origin_farm: "Young Stock Farms", breed_info_en: "3-6 months weaned", breed_info_ar: "مفطوم ٣-٦ أشهر", sort_order_type: 6, sort_order_variant: 1 },

        { item_key: "lamb_chops_premium", product_category: "meat_cuts", type_key: "lamb_premium_cuts", type_name_en: "Lamb Cuts", type_name_ar: "قطعيات ضأن", type_description_en: "Lamb chops.", type_description_ar: "ريش ضأن مقطعة طازجة يومياً.", price_per_kg_egp: 520, variant_name_en: "Lamb Chops (per kg)", variant_name_ar: "ريش ضاني (للكيلو)", weight_range_text_en: "Per kg", weight_range_text_ar: "للكيلو", base_price_egp: 520, stock_available_pb: 25, is_active: true, is_premium: true, origin_farm: "Fresh Cut Daily", breed_info_en: "Grain-fed young lamb", breed_info_ar: "ضأن صغير يتغذى على الحبوب", sort_order_type: 7, sort_order_variant: 1 },

        { item_key: "lamb_leg_whole", product_category: "meat_cuts", type_key: "lamb_premium_cuts", type_name_en: "Lamb Cuts", type_name_ar: "قطعيات ضأن", type_description_en: "Whole lamb leg for roasting.", type_description_ar: "فخذة ضأن كاملة للتحمير أو الطبخ.", variant_name_en: "Lamb Leg (2.5-4kg)", variant_name_ar: "فخذة ضاني (٢.٥-٤ كجم)", weight_range_text_en: "2.5-4kg", weight_range_text_ar: "٢.٥-٤ كجم", avg_weight_kg: 3.2, base_price_egp: 1450, stock_available_pb: 15, is_active: true, is_premium: true, origin_farm: "Fresh Cut Daily", breed_info_en: "Premium leg cuts", breed_info_ar: "قطعيات فخذ", sort_order_type: 7, sort_order_variant: 2 },

        { item_key: "lamb_shoulder_boneless", product_category: "meat_cuts", type_key: "lamb_standard_cuts", type_name_en: "Lamb Cuts", type_name_ar: "قطعيات ضأن", type_description_en: "Boneless lamb shoulder for slow cooking and stews.", type_description_ar: "كتف ضأن بدون عظم للطبخ البطيء والطواجن.", variant_name_en: "Lamb Shoulder (per kg)", variant_name_ar: "كتف ضاني (للكيلو)", weight_range_text_en: "Per kg", weight_range_text_ar: "للكيلو", base_price_egp: 380, stock_available_pb: 30, is_active: true, is_premium: false, origin_farm: "Daily Fresh Cuts", breed_info_en: "Standard quality cuts", breed_info_ar: "قطعيات جودة عادية", sort_order_type: 8, sort_order_variant: 1 },

        { item_key: "lamb_mince_fresh", product_category: "meat_cuts", type_key: "lamb_standard_cuts", type_name_en: "Lamb Cuts", type_name_ar: "قطعيات ضأن", type_description_en: "Ground lamb mince for kofta and kebabs.", type_description_ar: "لحم ضأن مفروم طازج للكفتة والكباب. يفرم طازج يومياً.", variant_name_en: "Lamb Mince (per kg)", variant_name_ar: "لحم ضاني مفروم (للكيلو)", weight_range_text_en: "Per kg", weight_range_text_ar: "للكيلو", base_price_egp: 350, stock_available_pb: 40, is_active: true, is_premium: false, origin_farm: "Daily Fresh Ground", breed_info_en: "Fresh daily grinding", breed_info_ar: "فرم طازج يومياً", sort_order_type: 8, sort_order_variant: 2 },

        { item_key: "mutton_stew_cuts", product_category: "meat_cuts", type_key: "mutton_cuts", type_name_en: "Mutton Cuts", type_name_ar: "قطعيات لحم الغنم", type_description_en: "Mutton stew cuts from mature sheep.", type_description_ar: "قطعيات لحم غنم للطواجن من أغنام ناضجة.", variant_name_en: "Mutton Stew Cuts (per kg)", variant_name_ar: "قطعيات طاجن لحم غنم (للكيلو)", weight_range_text_en: "Per kg", weight_range_text_ar: "للكيلو", base_price_egp: 320, stock_available_pb: 20, is_active: true, is_premium: false, origin_farm: "Traditional Cuts", breed_info_en: "Mature sheep cuts", breed_info_ar: "قطعيات أغنام ناضجة", sort_order_type: 9, sort_order_variant: 1 },

        { item_key: "gathering_small_family", product_category: "gathering_package", type_key: "family_packages", type_name_en: "Family Packages", type_name_ar: "باقات عائلية", type_description_en: "Family gathering packages with lamb, rice, salads, and bread.", type_description_ar: "باقات تجمعات عائلية تشمل ضأن وأرز وسلطات وخبز.", variant_name_en: "Family Small (8-12 people)", variant_name_ar: "عائلي صغير (٨-١٢ فرد)", base_price_egp: 8500, stock_available_pb: 12, is_active: true, is_premium: false, origin_farm: "Complete Service", breed_info_en: "Full service package", breed_info_ar: "باقة خدمة كاملة", sort_order_type: 10, sort_order_variant: 1 },

        { item_key: "gathering_medium_celebration", product_category: "gathering_package", type_key: "celebration_packages", type_name_en: "Celebration Packages", type_name_ar: "باقات الاحتفالات", type_description_en: "Celebration packages with whole sheep, side dishes, desserts, and service.", type_description_ar: "باقات احتفالات للأفراح والتخرج والمناسبات. تشمل خروف مجهز وأطباق جانبية وحلويات وخدمة.", variant_name_en: "Celebration Medium (20-30 people)", variant_name_ar: "احتفال متوسط (٢٠-٣٠ فرد)", base_price_egp: 18500, stock_available_pb: 8, is_active: true, is_premium: true, origin_farm: "Premium Catering", breed_info_en: "Full celebration service", breed_info_ar: "خدمة احتفال كاملة", sort_order_type: 11, sort_order_variant: 1 },

        { item_key: "gathering_large_wedding", product_category: "gathering_package", type_key: "wedding_packages", type_name_en: "Wedding Packages", type_name_ar: "باقات أفراح", type_description_en: "Wedding packages with multiple sheep, buffet, Egyptian dishes, and event management.", type_description_ar: "باقات أفراح ومناسبات كبرى. عدة أغنام، إعداد بوفيه، أطباق مصرية، طاقم خدمة، وإدارة مناسبات.", variant_name_en: "Wedding Large (50-80 people)", variant_name_ar: "فرح كبير (٥٠-٨٠ فرد)", base_price_egp: 45000, stock_available_pb: 4, is_active: true, is_premium: true, origin_farm: "Luxury Events", breed_info_en: "Full event management", breed_info_ar: "إدارة مناسبات كاملة", sort_order_type: 11, sort_order_variant: 2 },

        { item_key: "bbq_premium_mixed", product_category: "gathering_package", type_key: "bbq_packages", type_name_en: "BBQ & Grill Packages", type_name_ar: "باقات الشواء والمشاوي", type_description_en: "BBQ packages with mixed grilled meats, kebabs, kofta, and chicken.", type_description_ar: "باقات شواء مع لحوم مشوية مختلطة وكباب وكفتة ودجاج.", variant_name_en: "BBQ (15-25 people)", variant_name_ar: "شواء (١٥-٢٥ فرد)", base_price_egp: 12500, stock_available_pb: 10, is_active: true, is_premium: true, origin_farm: "BBQ Specialists", breed_info_en: "Mixed grill specialties", breed_info_ar: "مشاوي مختلطة", sort_order_type: 12, sort_order_variant: 1 }
    ],
    
    users: [
        {
            email: "admin@sheep.land",
            password: "admin123456",
            passwordConfirm: "admin123456",
            name: "Admin User",
            phone: "+201234567890",
            country: "Egypt",
            preferred_currency: "EGP",
            is_admin: true,
            verified: true
        },
        {
            email: "user@example.com",
            password: "user123456",
            passwordConfirm: "user123456",
            name: "Test User",
            phone: "+201098765432",
            country: "Egypt",
            preferred_currency: "EGP",
            is_admin: false,
            verified: true
        }
    ]
};

module.exports = { 
    seedData, 
    defaultRefundPolicyHTML, 
    generatePromoEndDate 
};