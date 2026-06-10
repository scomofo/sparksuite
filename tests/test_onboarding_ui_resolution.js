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

console.log("\n--- Onboarding UI Resolution ---");

test("onboarding ui routes legacy controls through app actions", function() {
  var source = loadJS("js/onboarding/ui.js");
  assert.ok(source.indexOf("SparkOnboardingWelcome.render") >= 0);
  assert.ok(source.indexOf("ctaAction: \"act('onboardingNext')\"") >= 0);
  assert.ok(source.indexOf("act(\\'onboardingSetInstrument\\',\\'guitar\\')") >= 0);
  assert.ok(source.indexOf("act(\\'onboardingSetSkillLevel\\',\\'beginner\\')") >= 0);
  assert.ok(source.indexOf("act(\\'onboardingToggleGoal\\',") >= 0);
  assert.ok(source.indexOf("act(\\'onboardingMidiSetupDone\\')") >= 0);
  assert.ok(source.indexOf("act(\\'onboardingCalibrationDone\\')") >= 0);
  assert.ok(source.indexOf("act(\\'onboardingUnlockStarterContent\\')") >= 0);
  assert.ok(source.indexOf("act(\\'onboardingGeneratePlan\\')") >= 0);
  assert.ok(source.indexOf("act(\\'onboardingGenerateRecommendations\\')") >= 0);
  assert.ok(source.indexOf("act(\\'onboardingFinish\\')") >= 0);
  assert.ok(source.indexOf("act(\\'onboardingBack\\')") >= 0);
  assert.ok(source.indexOf("act(\\'onboardingNext\\')") >= 0);
});

test("first-launch onboarding overlay can use Warm Ember welcome without losing the intention input", function() {
  var source = loadJS("js/render.js");
  assert.ok(source.indexOf("SparkOnboardingWelcome.render") >= 0);
  assert.ok(source.indexOf("afterBodyHtml: intentionCard") >= 0);
  assert.ok(source.indexOf("var onboardingPracticeIntention = normalizeAppTextInputValue(S.practiceIntention);") >= 0);
  assert.ok(source.indexOf("value=\"'+escHTML(onboardingPracticeIntention)+'\"") >= 0);
});

test("system family handles onboarding ui actions", function() {
  var source = loadJS("js/actions/system_family.js");
  assert.ok(source.indexOf('if (a === "onboardingSetInstrument") {') >= 0);
  assert.ok(source.indexOf('if (a === "onboardingSetSkillLevel") {') >= 0);
  assert.ok(source.indexOf('if (a === "onboardingToggleGoal") {') >= 0);
  assert.ok(source.indexOf('if (a === "onboardingMidiSetupDone") {') >= 0);
  assert.ok(source.indexOf('if (a === "onboardingCalibrationDone") {') >= 0);
  assert.ok(source.indexOf('if (a === "onboardingUnlockStarterContent") {') >= 0);
  assert.ok(source.indexOf('if (a === "onboardingGeneratePlan") {') >= 0);
  assert.ok(source.indexOf('if (a === "onboardingGenerateRecommendations") {') >= 0);
  assert.ok(source.indexOf('if (a === "onboardingFinish") {') >= 0);
  assert.ok(source.indexOf('if (a === "onboardingBack") {') >= 0);
  assert.ok(source.indexOf('if (a === "onboardingNext") {') >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
