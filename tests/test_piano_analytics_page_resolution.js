var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.act = function() {};
  global.buildAnalyticsSummary = function() {
    return {
      weakestTransitions: [{ label: "undefined", avgMs: 180 }],
      weakestSongs: [{ label: "null", accuracy: 62 }],
      weakestPhrases: [{ label: "NaN", accuracy: 58 }],
      strongestSkills: [{ label: "undefined", value: "92%" }],
      recentImprovement: [{ label: "null", value: "+8%" }],
      practiceConsistency: { streak: 4, sessions: 12, historyCount: 20 },
      recommendations: [{ label: "undefined", reason: "null" }]
    };
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/instruments/piano/pages/analytics.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Piano Analytics Page Resolution ---");

test("piano analytics page ignores stale weakness and recommendation labels", function() {
  var html = pianoAnalyticsPage();
  assert.ok(html.indexOf(">undefined<") === -1);
  assert.ok(html.indexOf(">null<") === -1);
  assert.ok(html.indexOf(">NaN<") === -1);
  assert.ok(html.indexOf("Transition") >= 0);
  assert.ok(html.indexOf("Song") >= 0);
  assert.ok(html.indexOf("Phrase") >= 0);
  assert.ok(html.indexOf("Skill") >= 0);
  assert.ok(html.indexOf("Improvement") >= 0);
  assert.ok(html.indexOf("Recommendation") >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
