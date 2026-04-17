var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function makeState() {
  return {
    activeInstrument: "ukespark",
    practicePlan: { instrumentId: "ukespark", items: [{ id: "uke_item" }] },
    practicePlanComplete: true,
    practicePlanInstrumentId: "ukespark",
    practicePlanInstrumentType: "ukulele",
    recommendations: [{ id: "uke_rec" }],
    recommendationInstrumentId: "ukespark",
    onboarding: {
      instrument: "piano",
      currentStep: "finish"
    }
  };
}

function resetEnvironment() {
  global.window = global;
  global.S = makeState();
  global.__sparkState = global.S;
  global.saveStateCalls = 0;
  global.generatedPlanActiveInstrument = null;
  global.generatedRecommendationActiveInstrument = null;
  global.generatedRecommendationType = null;
  global.activatedInstrument = null;
  global.personalInsightsCalls = 0;
  global.challengeInitCalls = 0;
  global.SparkState = {
    getRoot: function() { return global.S; },
    read: function(path, fallback) {
      var parts = Array.isArray(path) ? path.slice() : [path];
      var cursor = global.S;
      var i;
      for (i = 0; i < parts.length; i++) {
        if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
        cursor = cursor[parts[i]];
      }
      return cursor == null ? fallback : cursor;
    },
    write: function(path, value) {
      var parts = Array.isArray(path) ? path.slice() : [path];
      var cursor = global.S;
      var i;
      for (i = 0; i < parts.length - 1; i++) {
        if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
        cursor = cursor[parts[i]];
      }
      cursor[parts[parts.length - 1]] = value;
      return value;
    }
  };
  global.saveState = function() { global.saveStateCalls++; };
  global.SparkInstruments = {
    activate: function(appId) {
      global.activatedInstrument = appId;
    }
  };
  global.generateDailyPracticePlan = function() {
    global.generatedPlanActiveInstrument = global.S.activeInstrument;
    return { instrumentId: global.S.activeInstrument, items: [{ id: "fresh_plan_item" }] };
  };
  global.generateRecommendations = function(appType) {
    global.generatedRecommendationType = appType;
    global.generatedRecommendationActiveInstrument = global.S.activeInstrument;
    return [{ id: "fresh_rec", type: appType }];
  };
  global.generatePersonalInsights = function() {
    global.personalInsightsCalls++;
  };
  global.initializeChallengesForCurrentCycle = function() {
    global.challengeInitCalls++;
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    eval(loadJS("js/onboarding/actions.js"));
    eval(loadJS("js/onboarding/engine.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Onboarding Final Setup ---");

test("initial practice plan generation promotes the onboarding instrument first", function() {
  var plan = generateInitialPracticePlanFromOnboarding();

  assert.strictEqual(global.activatedInstrument, "pianospark");
  assert.strictEqual(global.S.activeInstrument, "pianospark");
  assert.strictEqual(global.generatedPlanActiveInstrument, "pianospark");
  assert.strictEqual(global.S.practicePlan, null);
  assert.strictEqual(global.S.practicePlanInstrumentId, null);
  assert.strictEqual(plan.instrumentId, "pianospark");
});

test("initial recommendations generation uses the onboarding instrument mapping", function() {
  global.S.onboarding.instrument = "ukulele";

  var recommendations = generateInitialRecommendationsFromOnboarding();

  assert.strictEqual(global.activatedInstrument, "ukespark");
  assert.strictEqual(global.S.activeInstrument, "ukespark");
  assert.strictEqual(global.generatedRecommendationActiveInstrument, "ukespark");
  assert.strictEqual(global.generatedRecommendationType, "ukulele");
  assert.strictEqual(Array.isArray(recommendations), true);
});

test("initial recommendations generation preserves bass onboarding type", function() {
  global.S.onboarding.instrument = "bass";

  var recommendations = generateInitialRecommendationsFromOnboarding();

  assert.strictEqual(global.activatedInstrument, "bassspark");
  assert.strictEqual(global.S.activeInstrument, "bassspark");
  assert.strictEqual(global.generatedRecommendationActiveInstrument, "bassspark");
  assert.strictEqual(global.generatedRecommendationType, "bass");
  assert.strictEqual(Array.isArray(recommendations), true);
});

test("initial recommendations generation preserves drums onboarding type", function() {
  global.S.onboarding.instrument = "drums";

  var recommendations = generateInitialRecommendationsFromOnboarding();

  assert.strictEqual(global.activatedInstrument, "drumspark");
  assert.strictEqual(global.S.activeInstrument, "drumspark");
  assert.strictEqual(global.generatedRecommendationActiveInstrument, "drumspark");
  assert.strictEqual(global.generatedRecommendationType, "drums");
  assert.strictEqual(Array.isArray(recommendations), true);
});

test("final onboarding setup uses onboarding-aware generators and keeps follow-up setup intact", function() {
  runFinalOnboardingSetup();

  assert.strictEqual(global.activatedInstrument, "pianospark");
  assert.strictEqual(global.generatedPlanActiveInstrument, "pianospark");
  assert.strictEqual(global.generatedRecommendationType, "piano");
  assert.strictEqual(global.generatedRecommendationActiveInstrument, "pianospark");
  assert.strictEqual(global.personalInsightsCalls, 1);
  assert.strictEqual(global.challengeInitCalls, 1);
});

test("onboarding generators fall back to global S when SparkState.getRoot returns null", function() {
  global.SparkState = { getRoot: function() { return null; } };

  var plan = generateInitialPracticePlanFromOnboarding();
  var recommendations = generateInitialRecommendationsFromOnboarding();

  assert.strictEqual(plan.instrumentId, "pianospark");
  assert.strictEqual(global.generatedPlanActiveInstrument, "pianospark");
  assert.strictEqual(global.generatedRecommendationActiveInstrument, "pianospark");
  assert.strictEqual(Array.isArray(recommendations), true);
});

test("onboarding page reads selected state through global S when SparkState.getRoot returns null", function() {
  global.SparkState = { getRoot: function() { return null; } };
  global.escHTML = function(value) { return String(value); };
  global.act = function() {};
  global.getCurrentOnboardingStep = function() { return "instrument"; };
  global.renderOnboardingNav = function() { return "<div>nav</div>"; };

  eval(loadJS("js/onboarding/ui.js"));
  var html = onboardingPage();

  assert.ok(html.indexOf("Selected: piano") >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
