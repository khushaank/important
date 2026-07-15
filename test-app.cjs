const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const scriptStart = html.lastIndexOf("<script>") + 8;
const scriptEnd = html.indexOf("</script>", scriptStart);

assert.doesNotThrow(() => new Function(html.slice(scriptStart, scriptEnd)));
assert.equal((html.match(/aria-label="PIN digit/g) || []).length, 4);
assert.match(html, /<progress id="task-progress"/);
assert.match(html, /Look out for the noise\./);
assert.doesNotThrow(() => JSON.parse(fs.readFileSync("manifest.webmanifest")));
assert.doesNotThrow(() => JSON.parse(fs.readFileSync(".mcp.json")));
assert.match(fs.readFileSync("supabase.sql", "utf8"), /super_important_tasks_private\.is_owner/);

console.log("App checks passed");
