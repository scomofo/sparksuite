var assert = require("assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var childProcess = require("child_process");

var repoRoot = path.resolve(__dirname, "..");
var scriptPath = path.join(repoRoot, "scripts", "check_ui_business_logic.js");

var cleanRun = childProcess.spawnSync("node", [scriptPath], {
  cwd: repoRoot,
  encoding: "utf8"
});

assert.strictEqual(cleanRun.status, 0, cleanRun.stdout + cleanRun.stderr);
assert.ok(cleanRun.stdout.indexOf("OK no UI business logic violations found") >= 0);

var tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sparksuite-ui-scan-"));
var tempUiDir = path.join(tempRoot, "pages");
fs.mkdirSync(tempUiDir, { recursive: true });
fs.writeFileSync(
  path.join(tempUiDir, "bad.js"),
  "function render(){ return adjustDifficulty(); }\n",
  "utf8"
);

var violationRun = childProcess.spawnSync("node", [scriptPath], {
  cwd: repoRoot,
  encoding: "utf8",
  env: Object.assign({}, process.env, {
    UI_LOGIC_DIRS: tempUiDir
  })
});

assert.notStrictEqual(violationRun.status, 0);
assert.ok(violationRun.stderr.indexOf("adjustDifficulty") >= 0);

console.log("PASS: UI business logic scan passes clean UI and fails forbidden ownership terms");
