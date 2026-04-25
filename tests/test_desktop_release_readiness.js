var assert = require("assert");
var fs = require("fs");
var path = require("path");

var root = path.join(__dirname, "..");
var checklistPath = path.join(root, "docs", "release", "desktop_release_checklist.md");
var runbookPath = path.join(root, "docs", "release", "release_runbook.md");
var tauriConfigPath = path.join(root, "src-tauri", "tauri.conf.json");

assert.ok(fs.existsSync(checklistPath), "desktop release checklist should exist");
assert.ok(fs.existsSync(runbookPath), "release runbook should exist");
assert.ok(fs.existsSync(tauriConfigPath), "tauri.conf.json should exist");

var checklist = fs.readFileSync(checklistPath, "utf8");
var runbook = fs.readFileSync(runbookPath, "utf8");
var tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, "utf8"));

assert.ok(checklist.indexOf("User data export works.") >= 0, "checklist should cover export");
assert.ok(checklist.indexOf("User data import works on a clean profile.") >= 0, "checklist should cover import");
assert.ok(checklist.indexOf("Debug bundle export works.") >= 0, "checklist should cover debug export");
assert.ok(checklist.indexOf("No leaderboard features added.") >= 0, "checklist should guard scope");

assert.ok(runbook.indexOf("npm run verify") >= 0, "runbook should require verify");
assert.ok(runbook.indexOf("build packaged app") >= 0 || runbook.indexOf("tauri build") >= 0, "runbook should cover packaged builds");
assert.ok(runbook.indexOf("export a debug bundle") >= 0 || runbook.indexOf("debug bundle") >= 0, "runbook should cover debug export");
assert.strictEqual(tauriConfig.productName, "SparkSuite");

console.log("PASS: desktop release docs and tauri config support the release readiness checklist");
