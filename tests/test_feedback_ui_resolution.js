var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function loadVM(file) {
  var full = path.join(__dirname, "..", file);
  require("vm").runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

function test(name, fn) {
  try {
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Feedback UI Resolution ---");

test("feedback page routes draft updates through utility actions", function() {
  var feedbackSource = loadJS("js/desktop/feedback.js");
  var utilitySource = loadJS("js/actions/utility_family.js");
  assert.ok(feedbackSource.indexOf("act(\\'feedbackDraftText\\',this.value)") >= 0);
  assert.ok(utilitySource.indexOf('if (a === "feedbackDraftText") {') >= 0);
  assert.ok(utilitySource.indexOf('S.feedbackDraft.text = v;') >= 0);
});

test("utility family exposes app reload through an action", function() {
  var utilitySource = loadJS("js/actions/utility_family.js");
  var reloadCalls = 0;
  global.location = {
    reload: function() {
      reloadCalls++;
    }
  };
  global.window = global;
  global.registerSparkActionFamily = function(name, fn) {
    global.runSparkActionFamilies = fn;
  };
  global.eval(utilitySource);
  assert.ok(utilitySource.indexOf('if (a === "appReload") {') >= 0);
  assert.strictEqual(global.runSparkActionFamilies("appReload"), true);
  assert.strictEqual(reloadCalls, 1);
});

if (process.exitCode) process.exit(process.exitCode);
