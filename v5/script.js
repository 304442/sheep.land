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
