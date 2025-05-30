// Content of your_hook_file_name.pb.js
console.log("[PB_HOOK_DEBUG] Hook file (" + __FILE__ + ") - TOP OF FILE PARSED");

try {
    routerAdd("GET", "/api/ping_hook", (c) => {
        console.log("[PB_HOOK_DEBUG] /api/ping_hook endpoint was called!");
        return c.json(200, { message: "Ping hook is alive!" });
    });
    console.log("[PB_HOOK_DEBUG] routerAdd for /api/ping_hook executed successfully.");
} catch (e) {
    console.error("[PB_HOOK_DEBUG] ERROR during routerAdd: " + e.toString(), e);
}

console.log("[PB_HOOK_DEBUG] Hook file (" + __FILE__ + ") - BOTTOM OF FILE PARSED");
