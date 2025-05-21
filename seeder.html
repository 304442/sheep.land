<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PocketBase Data Seeder</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; line-height: 1.6; padding: 20px; background-color: #f0f2f5; color: #1c1e21; }
        .container { max-width: 800px; margin: 20px auto; background-color: #fff; padding: 20px 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1); }
        h1 { color: #1877f2; margin-bottom: 20px; text-align: center; }
        .important { color: #fa383e; font-weight: bold; border: 1px solid #fcc2c2; background-color: #ffe5e5; padding: 15px; border-radius: 6px; margin-bottom: 20px;}
        .important strong { display: block; margin-bottom: 5px; }
        .important ol { padding-left: 20px; margin: 0; }
        .important li { margin-bottom: 5px; }
        .log-output { margin-top: 20px; padding: 15px; background-color: #282c34; color: #abb2bf; border: 1px solid #31353f; border-radius: 6px; white-space: pre-wrap; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; max-height: 400px; overflow-y: auto; font-size: 0.9em; }
        .log-output .info { color: #61afef; }
        .log-output .error { color: #e06c75; }
        .log-output .warn { color: #e5c07b; }
        .log-output .success { color: #98c379; }
        button { padding: 10px 20px; background-color: #1877f2; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1em; font-weight: bold; transition: background-color 0.2s; }
        button:hover { background-color: #166fe5; }
        button:active { background-color: #1465d1; }
        .status { margin-top: 15px; padding: 10px; border-radius: 6px; font-weight: bold; }
        .status.success { background-color: #e7f3ff; color: #1877f2; border: 1px solid #b8d7f9; }
        .status.error { background-color: #ffe5e5; color: #fa383e; border: 1px solid #fcc2c2; }
        .status.info { background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
        .config-note { font-size: 0.9em; color: #606770; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>PocketBase Data Seeder</h1>

        <div class="important">
            <strong>IMPORTANT INSTRUCTIONS:</strong>
            <ol>
                <li>Ensure your PocketBase instance is running.</li>
                <li><strong>API URL:</strong> The script below defaults to <code>/api/</code>. If your PocketBase instance is on a different URL (e.g., <code>http://localhost:8090</code>), you <strong>MUST</strong> update the <code>API_URL_PREFIX</code> variable in the script section of this file.</li>
                <li><strong>API Rules:</strong> Temporarily open API rules in PocketBase for 'app_settings' and 'livestock_types' collections (specifically 'Create Rule' and 'Update Rule', e.g., set to <code>""</code> for public access) if running this seeder unauthenticated.</li>
                <li><strong>RE-SECURE YOUR API RULES IMMEDIATELY</strong> after seeding is complete!</li>
            </ol>
        </div>

        <div class="config-note">
            Current API Prefix: <code id="current-api-prefix">/api/</code> (Update in script if needed)
        </div>

        <button onclick="manualRunSeeder()">Run Seeder Manually</button>
        <p><em>The seeder will attempt to run automatically if this page is opened on <code>localhost</code>, <code>127.0.0.1</code>, or via <code>file:///</code> protocol.</em></p>

        <div class="status info" id="status-message">Status: Waiting...</div>
        <div class="log-output" id="log-output"></div>
    </div>

    <script>
        const logOutputDiv = document.getElementById('log-output');
        const statusMessageDiv = document.getElementById('status-message');
        const currentApiPrefixSpan = document.getElementById('current-api-prefix');

        // --- IMPORTANT: Configure this if your PB is not at '/api/' relative to this HTML file ---
        const API_URL_PREFIX = '/api/'; 
        // Example for different origin: const API_URL_PREFIX = 'http://localhost:8090/api';
        currentApiPrefixSpan.textContent = API_URL_PREFIX;


        function customLog(message, type = 'info') {
            console.log(message); 
            const logEntry = document.createElement('div');
            const timestamp = new Date().toLocaleTimeString();
            logEntry.innerHTML = `<span>[${timestamp}]</span> ${message.replace(/\n/g, "<br>")}`; // Allow basic newlines in logs
            logEntry.className = type;
            logOutputDiv.appendChild(logEntry);
            logOutputDiv.scrollTop = logOutputDiv.scrollHeight; 
        }
        
        async function seedPocketBaseData() {
            customLog("Attempting to seed PocketBase data...", 'info');
            statusMessageDiv.className = 'status info';
            statusMessageDiv.textContent = "Status: Seeding in progress...";
            
            const defaultAppSettingsData = {
                setting_key: "global_config",
                exchange_rates: {
                    EGP: { rate_from_egp: 1, symbol: 'LE', is_active: true },
                    USD: { rate_from_egp: 0.021, symbol: '$', is_active: true },
                    GBP: { rate_from_egp: 0.017, symbol: '£', is_active: true }
                },
                default_currency: "EGP",
                whatsapp_number_raw: "201234567890", 
                whatsapp_number_display: "+20 123 456 7890", 
                promo_end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                promo_discount_percent: 15,
                promo_is_active: true,
                delivery_areas: [
                    { id: 'cairo', name_en: 'Cairo', name_ar: 'القاهرة', cities: [ {id: 'nasr_city', name_en: 'Nasr City', name_ar: 'مدينة نصر'}, {id: 'maadi', name_en: 'Maadi', name_ar: 'المعادي'}, {id: 'heliopolis', name_en: 'Heliopolis', name_ar: 'مصر الجديدة'} ]},
                    { id: 'giza', name_en: 'Giza', name_ar: 'الجيزة', cities: [ {id: 'dokki', name_en: 'Dokki', name_ar: 'الدقي'}, {id: 'mohandessin', name_en: 'Mohandessin', name_ar: 'المهندسين'}, {id: 'haram', name_en: 'Haram', name_ar: 'الهرم'} ]},
                    { id: 'alexandria', name_en: 'Alexandria', name_ar: 'الإسكندرية', cities: [ {id: 'smouha', name_en: 'Smouha', name_ar: 'سموحة'}, {id: 'miami', name_en: 'Miami', name_ar: 'ميامي'} ]},
                    { id: 'other_gov', name_en: 'Other Governorate', name_ar: 'محافظة أخرى', cities: [] }
                ],
                payment_details: {
                    vodafone_cash: "010 YOUR VODA NUMBER", 
                    instapay_ipn: "YOUR.IPN@instapay", 
                    revolut_details: "@YOUR_REVTAG or Phone: +XX XXXXXXXX", 
                    bank_name: "YOUR BANK NAME", 
                    bank_account_name: "YOUR ACCOUNT HOLDER NAME", 
                    bank_account_number: "YOUR ACCOUNT NUMBER", 
                    bank_iban: "YOUR IBAN (Optional)", 
                    bank_swift: "YOUR SWIFT/BIC (Optional)" 
                }
            };

            try {
                customLog("Processing app_settings...", 'info');
                const checkSettingsUrl = `${API_URL_PREFIX}/collections/app_settings/records?filter=(setting_key='global_config')&perPage=1`;
                const checkResponse = await fetch(checkSettingsUrl);
                if (!checkResponse.ok && checkResponse.status !== 404) {
                    throw new Error(`Checking settings failed: ${checkResponse.statusText} - ${await checkResponse.text()}`);
                }
                const checkData = await checkResponse.json();
                
                if (checkData.items && checkData.items.length > 0) {
                    customLog("App settings 'global_config' already exists. Updating it.", 'info');
                    const existingSettingsId = checkData.items[0].id;
                    const updateResponse = await fetch(`${API_URL_PREFIX}/collections/app_settings/records/${existingSettingsId}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(defaultAppSettingsData)
                    });
                    if (!updateResponse.ok) throw new Error(`Failed to update app_settings: ${updateResponse.statusText} - ${await updateResponse.text()}`);
                    customLog("App settings updated successfully.", 'success');
                } else {
                    customLog("App settings 'global_config' not found. Creating it.", 'info');
                    const createResponse = await fetch(`${API_URL_PREFIX}/collections/app_settings/records`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(defaultAppSettingsData)
                    });
                    if (!createResponse.ok) throw new Error(`Failed to create app_settings: ${createResponse.statusText} - ${await createResponse.text()}`);
                    customLog("App settings created successfully.", 'success');
                }
            } catch (error) {
                customLog("Error seeding app_settings: " + error.message, 'error');
                statusMessageDiv.className = 'status error';
                statusMessageDiv.textContent = "Status: Error with app_settings. Check console/logs.";
                return; 
            }

            customLog("Processing livestock_types...", 'info');
            const defaultLivestockData = [
                { value_key: 'baladi', name_en: 'Baladi Sheep', name_ar: 'خروف بلدي', weights_prices: [ { weight_range: "30-40 kg", price_egp: 4500, stock: 15, is_active: true }, { weight_range: "40-50 kg", price_egp: 5200, stock: 10, is_active: true }, { weight_range: "50+ kg", price_egp: 6000, stock: 0, is_active: true } ] },
                { value_key: 'barki', name_en: 'Barki Sheep', name_ar: 'خروف برقي', weights_prices: [ { weight_range: "35-45 kg", price_egp: 5100, stock: 8, is_active: true }, { weight_range: "45-55 kg", price_egp: 5900, stock: 12, is_active: true } ] }
            ];

            let livestockSuccessCount = 0;
            for (const livestock of defaultLivestockData) {
                try {
                    customLog(`Processing livestock: ${livestock.value_key}`, 'info');
                    const checkLivestockUrl = `${API_URL_PREFIX}/collections/livestock_types/records?filter=(value_key='${livestock.value_key}')&perPage=1`;
                    const checkResponse = await fetch(checkLivestockUrl);
                    if (!checkResponse.ok && checkResponse.status !== 404) {
                         throw new Error(`Checking livestock ${livestock.value_key} failed: ${checkResponse.statusText} - ${await checkResponse.text()}`);
                    }
                    const checkData = await checkResponse.json();

                    if (checkData.items && checkData.items.length > 0) {
                        customLog(`Livestock type '${livestock.value_key}' already exists. Updating.`, 'info');
                        const updateResponse = await fetch(`${API_URL_PREFIX}/collections/livestock_types/records/${checkData.items[0].id}`, {
                            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(livestock)
                        });
                        if (!updateResponse.ok) throw new Error(`Update failed for ${livestock.value_key}: ${updateResponse.statusText} - ${await updateResponse.text()}`);
                        customLog(`Livestock '${livestock.value_key}' updated successfully.`, 'success');
                    } else {
                        customLog(`Livestock type '${livestock.value_key}' not found. Creating.`, 'info');
                        const createResponse = await fetch(`${API_URL_PREFIX}/collections/livestock_types/records`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(livestock)
                        });
                        if (!createResponse.ok) throw new Error(`Create failed for ${livestock.value_key}: ${createResponse.statusText} - ${await createResponse.text()}`);
                        customLog(`Livestock '${livestock.value_key}' created successfully.`, 'success');
                    }
                    livestockSuccessCount++;
                } catch (error) {
                    customLog(`Error seeding livestock ${livestock.value_key}: ` + error.message, 'error');
                }
            }

            if (livestockSuccessCount === defaultLivestockData.length) {
                 customLog("All livestock types processed successfully.", 'success');
            } else {
                 customLog(`${livestockSuccessCount} of ${defaultLivestockData.length} livestock types processed. Some had errors.`, 'warn');
            }

            customLog("Data seeding process finished. REMEMBER TO RE-SECURE YOUR API RULES!", 'warn');
            statusMessageDiv.className = 'status success';
            statusMessageDiv.textContent = "Status: Seeding process finished. Check logs. RE-SECURE API RULES!";
            alert("Data seeding finished. Refresh your main application page to see changes if any. Remember to re-secure your API rules in PocketBase!");
        }

        async function manualRunSeeder() {
            logOutputDiv.innerHTML = ''; 
            try {
                await seedPocketBaseData();
            } catch (e) {
                customLog("Manual run of seeder failed overall: " + e.message, 'error');
                statusMessageDiv.className = 'status error';
                statusMessageDiv.textContent = "Status: Manual run failed. Check console/logs.";
            }
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:") {
                customLog("Development environment detected, attempting to auto-run seeder...", 'info');
                statusMessageDiv.className = 'status info';
                statusMessageDiv.textContent = "Status: Auto-running seeder...";
                manualRunSeeder(); 
            } else {
                customLog("Seeder auto-run skipped: Not a recognized development environment. Click button to run manually.", 'warn');
                statusMessageDiv.className = 'status info';
                statusMessageDiv.textContent = "Status: Auto-run skipped (not dev environment). Click button to run manually.";
            }
        });
    </script>
</body>
</html>
