// pb_hooks/test_hook.pb.js

console.log("[PB_HOOK_DEBUG] test_hook.pb.js - TOP OF FILE PARSED at " + new Date().toISOString());

try {
    routerAdd("GET", "/api/ping_me", (c) => {
        console.log("[PB_HOOK_DEBUG] /api/ping_me endpoint was called at " + new Date().toISOString());
        return c.json(200, {
            message: "Simplified test hook is ALIVE!",
            timestamp: new Date().toISOString()
        });
    });
    console.log("[PB_HOOK_DEBUG] routerAdd for /api/ping_me executed successfully at " + new Date().toISOString());
} catch (e) {
    console.error("[PB_HOOK_DEBUG] ERROR during routerAdd in test_hook.pb.js: " + e.toString(), e);
}

console.log("[PB_HOOK_DEBUG] test_hook.pb.js - BOTTOM OF FILE PARSED at " + new Date().toISOString());
