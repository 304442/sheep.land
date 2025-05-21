async function seedPocketBaseData() {
    console.log("Attempting to seed PocketBase data... Ensure API Create/Update rules for app_settings and livestock_types are temporarily public (\"\") if running this from an unauthenticated session.");
    const API_URL_PREFIX = '/api'; // Assuming PocketBase is served from the same origin under /api/

    // --- App Settings ---
    const defaultAppSettingsData = {
        setting_key: "global_config", // This key is used by the app to fetch the settings
        exchange_rates: {
            EGP: { rate_from_egp: 1, symbol: 'LE', is_active: true },
            USD: { rate_from_egp: 0.021, symbol: '$', is_active: true }, // Example rate
            GBP: { rate_from_egp: 0.017, symbol: '£', is_active: true }  // Example rate
        },
        default_currency: "EGP",
        whatsapp_number_raw: "201234567890", // Replace with your actual number
        whatsapp_number_display: "+20 123 456 7890", // Replace with your display number
        promo_end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // Example: 15 days from now
        promo_discount_percent: 15,
        promo_is_active: true,
        // site_name: "Sheep Land", // Removed as per decision to make it static
        delivery_areas: [
            { id: 'cairo', name_en: 'Cairo', name_ar: 'القاهرة', cities: [ {id: 'nasr_city', name_en: 'Nasr City', name_ar: 'مدينة نصر'}, {id: 'maadi', name_en: 'Maadi', name_ar: 'المعادي'}, {id: 'heliopolis', name_en: 'Heliopolis', name_ar: 'مصر الجديدة'} ]},
            { id: 'giza', name_en: 'Giza', name_ar: 'الجيزة', cities: [ {id: 'dokki', name_en: 'Dokki', name_ar: 'الدقي'}, {id: 'mohandessin', name_en: 'Mohandessin', name_ar: 'المهندسين'}, {id: 'haram', name_en: 'Haram', name_ar: 'الهرم'} ]},
            { id: 'alexandria', name_en: 'Alexandria', name_ar: 'الإسكندرية', cities: [ {id: 'smouha', name_en: 'Smouha', name_ar: 'سموحة'}, {id: 'miami', name_en: 'Miami', name_ar: 'ميامي'} ]},
            { id: 'other_gov', name_en: 'Other Governorate', name_ar: 'محافظة أخرى', cities: [] }
        ],
        payment_details: {
            vodafone_cash: "010 YOUR VODA NUMBER", // Replace
            instapay_ipn: "YOUR.IPN@instapay", // Replace
            revolut_details: "@YOUR_REVTAG or Phone: +XX XXXXXXXX", // Replace
            bank_name: "YOUR BANK NAME", // Replace
            bank_account_name: "YOUR ACCOUNT HOLDER NAME", // Replace
            bank_account_number: "YOUR ACCOUNT NUMBER", // Replace
            bank_iban: "YOUR IBAN (Optional)", // Replace
            bank_swift: "YOUR SWIFT/BIC (Optional)" // Replace
        }
    };

    try {
        const checkSettingsUrl = `${API_URL_PREFIX}/collections/app_settings/records?filter=(setting_key='global_config')&perPage=1`;
        const checkResponse = await fetch(checkSettingsUrl);
        if (!checkResponse.ok && checkResponse.status !== 404) {
            throw new Error(`Checking settings failed: ${checkResponse.statusText} - ${await checkResponse.text()}`);
        }
        const checkData = await checkResponse.json();
        let recordIdToAlert = '';

        if (checkData.items && checkData.items.length > 0) {
            console.log("App settings 'global_config' already exists. Updating it.");
            const existingSettingsId = checkData.items[0].id;
            recordIdToAlert = existingSettingsId;
            const updateResponse = await fetch(`${API_URL_PREFIX}/collections/app_settings/records/${existingSettingsId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaultAppSettingsData)
            });
            if (!updateResponse.ok) {
                const errText = await updateResponse.text();
                throw new Error(`Failed to update app_settings: ${updateResponse.statusText} - ${errText}`);
            }
            console.log("App settings updated:", await updateResponse.json());
        } else {
            console.log("App settings 'global_config' not found. Creating it.");
            const createResponse = await fetch(`${API_URL_PREFIX}/collections/app_settings/records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaultAppSettingsData)
            });
            if (!createResponse.ok) {
                const errText = await createResponse.text();
                throw new Error(`Failed to create app_settings: ${createResponse.statusText} - ${errText}`);
            }
            const createdRecord = await createResponse.json();
            recordIdToAlert = createdRecord.id;
            console.log("App settings created:", createdRecord);
        }
        alert(`App settings 'global_config' (ID: ${recordIdToAlert}) processed. The application fetches this record by its 'setting_key', not by ID.`);

    } catch (error) {
        console.error("Error seeding app_settings:", error);
        alert("Error seeding app_settings: " + error.message + "\nCheck console for more details. Ensure API rules for 'app_settings' collection allow create/update operations temporarily.");
    }

    // --- Livestock Types ---
    const defaultLivestockData = [
        {
            value_key: 'baladi',
            name_en: 'Baladi Sheep',
            name_ar: 'خروف بلدي',
            weights_prices: [
                { weight_range: "30-40 kg", price_egp: 4500, stock: 15, is_active: true },
                { weight_range: "40-50 kg", price_egp: 5200, stock: 10, is_active: true },
                { weight_range: "50+ kg", price_egp: 6000, stock: 0, is_active: true } // Example: Out of stock
            ]
        },
        {
            value_key: 'barki',
            name_en: 'Barki Sheep',
            name_ar: 'خروف برقي',
            weights_prices: [
                { weight_range: "35-45 kg", price_egp: 5100, stock: 8, is_active: true },
                { weight_range: "45-55 kg", price_egp: 5900, stock: 12, is_active: true }
            ]
        }
        // Add more livestock types as needed
    ];

    for (const livestock of defaultLivestockData) {
        try {
            const checkLivestockUrl = `${API_URL_PREFIX}/collections/livestock_types/records?filter=(value_key='${livestock.value_key}')&perPage=1`;
            const checkResponse = await fetch(checkLivestockUrl);
            if (!checkResponse.ok && checkResponse.status !== 404) {
                 throw new Error(`Checking livestock ${livestock.value_key} failed: ${checkResponse.statusText} - ${await checkResponse.text()}`);
            }
            const checkData = await checkResponse.json();

            if (checkData.items && checkData.items.length > 0) {
                console.log(`Livestock type '${livestock.value_key}' already exists. Updating.`);
                const updateResponse = await fetch(`${API_URL_PREFIX}/collections/livestock_types/records/${checkData.items[0].id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(livestock)
                });
                if (!updateResponse.ok) {
                    const errText = await updateResponse.text();
                    throw new Error(`Update failed for ${livestock.value_key}: ${updateResponse.statusText} - ${errText}`);
                }
                console.log("Livestock updated:", await updateResponse.json());
            } else {
                console.log(`Livestock type '${livestock.value_key}' not found. Creating.`);
                const createResponse = await fetch(`${API_URL_PREFIX}/collections/livestock_types/records`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(livestock)
                });
                if (!createResponse.ok) {
                    const errText = await createResponse.text();
                    throw new Error(`Create failed for ${livestock.value_key}: ${createResponse.statusText} - ${errText}`);
                }
                console.log("Livestock created:", await createResponse.json());
            }
        } catch (error) {
            console.error(`Error seeding livestock ${livestock.value_key}:`, error);
            alert(`Error for ${livestock.value_key}: ` + error.message + "\nCheck console. Ensure API rules for 'livestock_types' allow create/update.");
        }
    }

    console.log("Data seeding process finished. IMPORTANT: Re-secure API rules for app_settings and livestock_types if you loosened them for this process.");
    alert("Data seeding finished. Refresh page to see changes. Remember to secure your API rules in PocketBase!");
}

// --- DEVELOPMENT ONLY: Auto-run the seeding function ---
// WARNING: Ensure this file is NOT deployed to production with this line active
// and that PocketBase API rules are appropriately managed during seeding.
//
// To use:
// 1. Save this file as seed-data.js (or similar) in your project.
// 2. Temporarily include it in an HTML page that is loaded in your browser
//    (e.g., <script src="seed-data.js"></script> in index.html or a dedicated seeder.html).
// 3. Ensure PocketBase is running and API rules are temporarily open for create/update on
//    app_settings and livestock_types if running unauthenticated.
// 4. Load the HTML page in your browser. The script will attempt to run.
// 5. Check the console for messages.
// 6. REMOVE THE SCRIPT TAG from your HTML and RE-SECURE YOUR API RULES afterwards.

(async () => {
    // This IIFE (Immediately Invoked Function Expression) will run when the script is loaded.
    // We add a small delay or wait for DOMContentLoaded if we want to be absolutely sure
    // the browser environment is ready, though for fetch it's usually fine.
    // For simplicity here, direct call. In a complex setup, you might wait for an event.
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        // Optional: Add a check to only run it in a local development environment
        console.log("Development environment detected, attempting to auto-run seeder...");
        try {
            await seedPocketBaseData();
        } catch (e) {
            console.error("Auto-run of seeder failed:", e);
        }
    } else {
        console.warn("Seeder auto-run skipped: Not a recognized development environment.");
    }
})();
