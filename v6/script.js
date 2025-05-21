// ----- START: INLINE POCKETBASE SEEDER -----
(function() { 
    const SEEDER_QUERY_PARAM = 'run_db_seed';

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    if (getQueryParam(SEEDER_QUERY_PARAM) === 'true') {
        // console.warn("==== INLINE POCKETBASE SEEDER: Query parameter found, attempting to seed database. ====");
        // console.log("Ensure 'app_settings' and 'livestock_types' collections exist and 'Create Rule' is temporarily open for them.");

        const SEEDER_API_BASE_URL = '/api/'; 

        const SEEDER_RECORDS_TO_CREATE = [
            // ... (data records here) ...
        ];

        async function runInlineSeed() {
            // console.log("SEEDER: Starting inline data seed process...");
            // let allSuccessful = true; // Not used if not logging success

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
                        // Minimal error reporting for seeder
                        console.error(`SEEDER_ERROR: Failed to create record in '${record.collection}': ${response.status} ${response.statusText} - ${responseText}. Record identifier: ${recordIdentifier}`);
                        // allSuccessful = false; // Not used
                    } else {
                        // console.log(`SEEDER_SUCCESS: Record created/updated in '${record.collection}'. Identifier: ${recordIdentifier}`);
                    }
                } catch (error) {
                    console.error(`SEEDER_EXCEPTION: Network or other error for record in '${record.collection}' (ID: ${recordIdentifier}):`, error);
                    // allSuccessful = false; // Not used
                }
            }

            // if (allSuccessful) { // Not used
            //     console.log("SEEDER: Inline data seed process finished successfully.");
            // } else {
            //     console.warn("SEEDER: Inline data seed process finished, but some records may have failed. Check logs above.");
            // }
            // console.warn("SEEDER: IMPORTANT! Remember to re-secure your API rules in PocketBase if you opened them.");

            if (window.history.replaceState) {
                const cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({path: cleanURL}, '', cleanURL);
            }
        }
        runInlineSeed();
    }
})();
// ----- END: INLINE POCKETBASE SEEDER -----
