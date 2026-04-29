var assert = require("assert");
var fs = require("fs");
var path = require("path");

var root = path.join(__dirname, "..");
var checklistPath = path.join(root, "docs", "release", "desktop_release_checklist.md");
var runbookPath = path.join(root, "docs", "release", "release_runbook.md");
var tauriConfigPath = path.join(root, "src-tauri", "tauri.conf.json");
var electronMainPath = path.join(root, "main.js");
var indexPath = path.join(root, "index.html");

assert.ok(fs.existsSync(checklistPath), "desktop release checklist should exist");
assert.ok(fs.existsSync(runbookPath), "release runbook should exist");
assert.ok(fs.existsSync(tauriConfigPath), "tauri.conf.json should exist");

var checklist = fs.readFileSync(checklistPath, "utf8");
var runbook = fs.readFileSync(runbookPath, "utf8");
var tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, "utf8"));
var electronMain = fs.readFileSync(electronMainPath, "utf8");
var indexHtml = fs.readFileSync(indexPath, "utf8");

assert.ok(checklist.indexOf("User data export works.") >= 0, "checklist should cover export");
assert.ok(checklist.indexOf("User data import works on a clean profile.") >= 0, "checklist should cover import");
assert.ok(checklist.indexOf("Debug bundle export works.") >= 0, "checklist should cover debug export");
assert.ok(checklist.indexOf("npm run smoke:desktop") >= 0, "checklist should cover packaged smoke");
assert.ok(checklist.indexOf("No leaderboard features added.") >= 0, "checklist should guard scope");

assert.ok(runbook.indexOf("npm run verify") >= 0, "runbook should require verify");
assert.ok(runbook.indexOf("build packaged app") >= 0 || runbook.indexOf("tauri build") >= 0, "runbook should cover packaged builds");
assert.ok(runbook.indexOf("npm run smoke:desktop") >= 0, "runbook should cover packaged smoke");
assert.ok(runbook.indexOf("export a debug bundle") >= 0 || runbook.indexOf("debug bundle") >= 0, "runbook should cover debug export");
assert.strictEqual(tauriConfig.productName, "SparkSuite");
assert.ok(electronMain.indexOf("path.relative(stemsDir, normalized)") >= 0, "stems file URLs should use path-relative containment checks");
assert.ok(electronMain.indexOf("path.isAbsolute(relativeStemPath)") >= 0, "stems file URLs should reject absolute relative paths");
assert.ok(indexHtml.indexOf("js/sparksuite/storage/export_user_data.js") >= 0, "packaged renderer should load user data export");
assert.ok(indexHtml.indexOf("js/sparksuite/storage/import_user_data.js") >= 0, "packaged renderer should load user data import");
assert.ok(indexHtml.indexOf("js/sparksuite/debug/debug_bundle.js") >= 0, "packaged renderer should load debug bundle export");
assert.ok(indexHtml.indexOf("js/sparksuite/core/session_runtime.js") >= 0, "packaged renderer should load shared session runtime");
assert.ok(
  indexHtml.indexOf("js/sparksuite/storage/export_user_data.js") < indexHtml.indexOf("js/desktop/bridge.js"),
  "user data export should load before desktop bridge"
);
assert.ok(
  indexHtml.indexOf("js/sparksuite/core/session_runtime.js") < indexHtml.indexOf("js/sparksuite/core/spark_core.js"),
  "shared session runtime should load before spark core"
);
assert.ok(
  indexHtml.indexOf("js/sparksuite/debug/debug_bundle.js") < indexHtml.indexOf("js/desktop/bridge.js"),
  "debug bundle should load before desktop bridge"
);

console.log("PASS: desktop release docs and tauri config support the release readiness checklist");
