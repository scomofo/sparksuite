var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function resetEnv() {
  global.window = global;
  global.S = {
    onboarding: {
      instrument: "ukulele"
    }
  };
}

console.log("\n--- Onboarding Recommendation Inference ---");

test("generateInitialRecommendationsFromOnboarding forwards the selected onboarding instrument", function() {
  resetEnv();
  var requestedType = null;
  global.generateRecommendations = function(appType) {
    requestedType = appType;
    return [{ id: "rec_1" }];
  };

  global.eval(loadJS("js/onboarding/actions.js"));
  var recommendations = generateInitialRecommendationsFromOnboarding();

  assert.strictEqual(requestedType, "ukulele");
  assert.strictEqual(recommendations.length, 1);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
