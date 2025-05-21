// pb_seeder.js (Minimal - Create Only Version - Runs Automatically)

// --- CONFIGURATION ---
// !IMPORTANT: Set this to your PocketBase API URL.
const API_BASE_URL = 'http://localhost:8090/api/'; // EXAMPLE: Change this
// --- END CONFIGURATION ---

// Data to be seeded. This script will attempt to CREATE these records.
// WARNING: If run multiple times without manual cleanup or unique constraints
// in PocketBase, this WILL create duplicate records.
const recordsToCreate = [
    {
        collection: 'app_settings',
        data: {
            setting_key: "global_config", // Ensure this is unique or manually delete old one
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

async function seedData() {
    for (const record of recordsToCreate) {
        const response = await fetch(`${API_BASE_URL}collections/${record.collection}/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record.data)
        });

        if (!response.ok) {
            const responseText = await response.text();
            const recordIdentifier = record.data.setting_key || record.data.value_key || 'N/A';
            if (response.status === 404 && responseText.toLowerCase().includes("collection not found")) {
                 console.error(`ABORTING: Collection '${record.collection}' not found. Please create it first. Cannot seed record: ${recordIdentifier}`);
            } else {
                 console.error(`Failed to create record in '${record.collection}': ${response.status} ${response.statusText} - ${responseText}. Record data identifier: ${recordIdentifier}`);
            }
            // This version continues to the next record on error.
        }
        // No explicit success message to keep it minimal.
    }
}

// --- HOW TO RUN ---
// 1. Save this file (e.g., as pb_seeder.js).
// 2. **CRITICAL**: Update `API_BASE_URL`.
// 3. Ensure PocketBase is running.
// 4. **CRITICAL**: Ensure collections ('app_settings', 'livestock_types') EXIST (import pb_schema.json first).
// 5. **CRITICAL**: Temporarily open API rules for 'Create Records' in these collections.
// 6. **WARNING**: This script ONLY CREATES records (potential for duplicates if run multiple times without cleanup/unique constraints).
// 7. Execute the script (e.g., `node pb_seeder.js` or `deno run --allow-net pb_seeder.js`).
//    It will run automatically. No need to type anything extra in the console after starting the script.
// 8. **CRITICAL**: RE-SECURE YOUR API RULES in PocketBase.
//    Check PocketBase admin UI or server logs to confirm seeding.
// --- END HOW TO RUN ---

// This line makes the script run automatically when executed.
seedData();
