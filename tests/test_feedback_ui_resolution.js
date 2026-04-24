var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
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

if (process.exitCode) process.exit(process.exitCode);
