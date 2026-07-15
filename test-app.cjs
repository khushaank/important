const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const scriptStart = html.lastIndexOf("<script>") + 8;
const scriptEnd = html.indexOf("</script>", scriptStart);

assert.doesNotThrow(() => new Function(html.slice(scriptStart, scriptEnd)));
assert.equal((html.match(/aria-label="PIN digit/g) || []).length, 4);
assert.match(html, /pin !== "5514"/);
assert.match(html, /id="progress-circle"/);
assert.match(html, /\.lt\("task_date", requestedDate\)/);
assert.match(html, /Not completed on/);
assert.match(html, /Enter PIN 5514/);
assert.doesNotThrow(() => JSON.parse(fs.readFileSync("manifest.webmanifest")));
assert.doesNotMatch(fs.readFileSync("supabase.sql", "utf8"), /super_important_tasks_private/);

console.log("App checks passed");
