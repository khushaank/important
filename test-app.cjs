const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const sql = fs.readFileSync("supabase.sql", "utf8");
const loginFunction = fs.readFileSync("supabase/functions/pin-login/index.ts", "utf8");
const scriptStart = html.lastIndexOf("<script>") + 8;
const scriptEnd = html.indexOf("</script>", scriptStart);

assert.doesNotThrow(() => new Function(html.slice(scriptStart, scriptEnd)));
assert.equal((html.match(/aria-label="PIN digit/g) || []).length, 4);
assert.doesNotMatch(html, /5514|signInAnonymously|ensureAnonymousSession|pin\s*!==/);
assert.match(html, /functions\.invoke\("pin-login"/);
assert.match(html, /auth\.verifyOtp/);
assert.match(html, /persistSession:\s*false/);
assert.match(html, /id="progress-circle"/);
assert.match(html, /id="progress-label">TASKS/);
assert.match(html, /\.lt\("task_date", requestedDate\)/);
assert.match(html, /Not completed on/);
assert.doesNotThrow(() => JSON.parse(fs.readFileSync("manifest.webmanifest")));
assert.doesNotThrow(() => JSON.parse(fs.readFileSync(".mcp.json")));
assert.match(sql, /verify_super_tasks_pin/);
assert.match(sql, /pin_hash = extensions\.crypt/);
assert.match(sql, /grant execute on function public\.verify_super_tasks_pin\(text, text\) to service_role/);
assert.match(sql, /super_important_tasks_private\.is_owner/);
assert.match(loginFunction, /admin\.rpc\("verify_super_tasks_pin"/);
assert.match(loginFunction, /admin\.auth\.admin\.generateLink/);
assert.doesNotMatch(loginFunction, /5514/);

console.log("App checks passed");
