// ===== AI Policy / Learner Model Tests =====
// Run: node tests/test_ai_policy_learner.js
//
// Behavioral coverage for the js/sparksuite/ai/ decision layer:
// policy_engine.js (decide / update / adaptSession), learner_model.js
// (persistence + skill/struggle bookkeeping), feedback_rules.js
// (coaching rule conditions), and lesson_planner.js running with the
// real skill extractor and lesson builder.

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var passed = 0;
var failed = 0;

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

function loadJS(file) {
  var full = path.join(__dirname, "..", file);
  vm.runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

global.window = global;

// Minimal localStorage stub for the learner model.
var storageBacking = {};
global.localStorage = {
  getItem: function(k) { return Object.prototype.hasOwnProperty.call(storageBacking, k) ? storageBacking[k] : null; },
  setItem: function(k, v) { storageBacking[k] = String(v); },
  removeItem: function(k) { delete storageBacking[k]; }
};

loadJS("js/sparksuite/ai/policy_engine.js");
loadJS("js/sparksuite/ai/learner_model.js");
loadJS("js/sparksuite/ai/feedback_rules.js");
loadJS("js/sparksuite/ai/skill_extractor.js");
loadJS("js/sparksuite/ai/lesson_builder.js");
loadJS("js/sparksuite/ai/lesson_planner.js");

var policy = new SparkPolicyEngine();
var learner = new SparkLearnerModel();

console.log("=== AI Policy / Learner Model Tests ===");

test("decide: very low consistency simplifies before anything else", function() {
  var d = policy.decide({ consistency: 0.3, struggleAreas: { a: 1, b: 1, c: 1, d: 1 } });
  assert.strictEqual(d.action, SparkPolicyEngine.ACTIONS.SIMPLIFY);
});

test("decide: low consistency slows down", function() {
  assert.strictEqual(policy.decide({ consistency: 0.45 }).action, SparkPolicyEngine.ACTIONS.SLOW_DOWN);
});

test("decide: many struggle areas trigger a focus drill", function() {
  var d = policy.decide({ consistency: 0.7, struggleAreas: { a: 1, b: 1, c: 1, d: 1 } });
  assert.strictEqual(d.action, SparkPolicyEngine.ACTIONS.FOCUS_DRILL);
  assert.strictEqual(d.reason, "4 struggle areas");
});

test("decide: high consistency advances", function() {
  assert.strictEqual(policy.decide({ consistency: 0.9 }).action, SparkPolicyEngine.ACTIONS.ADVANCE);
});

test("decide: steady progress maintains, and no model maintains", function() {
  assert.strictEqual(policy.decide({ consistency: 0.7 }).action, SparkPolicyEngine.ACTIONS.MAINTAIN);
  assert.strictEqual(policy.decide().action, SparkPolicyEngine.ACTIONS.MAINTAIN);
});

test("update: consistency moves by exponential smoothing (alpha 0.1)", function() {
  var model = policy.update({ consistency: 0.5 }, { consistency: 1.0 });
  assert.strictEqual(model.consistency, 0.55);
  model = policy.update(model, { consistency: 1.0 });
  assert.strictEqual(model.consistency, 0.595);
});

test("update: strong accuracy nudges preferred tempo up, capped at 1.5", function() {
  var model = policy.update({ preferredTempo: 1.0 }, { accuracy: 0.95 });
  assert.strictEqual(model.preferredTempo, 1.05);
  model.preferredTempo = 1.5;
  policy.update(model, { accuracy: 0.95 });
  assert.strictEqual(model.preferredTempo, 1.5, "tempo must not exceed 1.5");
});

test("update: weak accuracy nudges preferred tempo down, floored at 0.5", function() {
  var model = policy.update({ preferredTempo: 1.0 }, { accuracy: 0.4 });
  assert.strictEqual(model.preferredTempo, 0.95);
  model.preferredTempo = 0.5;
  policy.update(model, { accuracy: 0.4 });
  assert.strictEqual(model.preferredTempo, 0.5, "tempo must not drop below 0.5");
});

test("update: counts sessions and stamps the session date", function() {
  var model = policy.update({}, {});
  assert.strictEqual(model.sessionsCompleted, 1);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(model.lastSessionDate));
  policy.update(model, {});
  assert.strictEqual(model.sessionsCompleted, 2);
});

test("adaptSession: slow_down and simplify ease the session", function() {
  var base = { difficulty: "normal", speedMultiplier: 1.0 };
  var adapted = policy.adaptSession(base, { action: "slow_down", reason: "r" });
  assert.strictEqual(adapted.speedMultiplier, 0.75);
  assert.strictEqual(adapted.difficulty, "easy");
  assert.strictEqual(adapted.policyAction, "slow_down");
  assert.strictEqual(base.difficulty, "normal", "base session must not be mutated");
});

test("adaptSession: advance raises difficulty one step", function() {
  assert.strictEqual(policy.adaptSession({ difficulty: "easy" }, { action: "advance" }).difficulty, "normal");
  assert.strictEqual(policy.adaptSession({ difficulty: "normal" }, { action: "advance" }).difficulty, "hard");
});

test("adaptSession: without an action the session passes through", function() {
  var base = { difficulty: "normal" };
  assert.strictEqual(policy.adaptSession(base, null), base);
});

test("learner model: load returns fresh defaults when nothing is saved", function() {
  var model = learner.load("nobody");
  assert.strictEqual(model.userId, "nobody");
  assert.strictEqual(model.consistency, 0.5);
  assert.strictEqual(model.sessionsCompleted, 0);
  assert.deepStrictEqual(model.skillLevels, {});
});

test("learner model: save/load round-trips through storage", function() {
  var model = learner.load("alex");
  model.consistency = 0.8;
  learner.updateSkill(model, "chords", 0.4);
  learner.save("alex", model);
  var reloaded = learner.load("alex");
  assert.strictEqual(reloaded.consistency, 0.8);
  assert.strictEqual(reloaded.skillLevels.chords, 0.4);
});

test("learner model: skill levels clamp to [0, 1]", function() {
  var model = { skillLevels: { x: 0.9 } };
  learner.updateSkill(model, "x", 0.5);
  assert.strictEqual(model.skillLevels.x, 1);
  learner.updateSkill(model, "x", -2);
  assert.strictEqual(model.skillLevels.x, 0);
});

test("learner model: struggles accumulate and clear", function() {
  var model = {};
  learner.recordStruggle(model, "barre");
  learner.recordStruggle(model, "barre");
  assert.strictEqual(model.struggleAreas.barre, 2);
  learner.clearStruggle(model, "barre");
  assert.ok(!("barre" in model.struggleAreas));
});

test("feedback rules fire on their trigger conditions", function() {
  function firing(data) {
    return SparkFeedbackRules.filter(function(r) { return r.condition(data); })
      .map(function(r) { return r.id; });
  }
  assert.deepStrictEqual(firing({ timingError: 150, accuracy: 0.8, consistency: 0.8, averageTiming: 150 }), ["late_timing"]);
  assert.deepStrictEqual(firing({ timingError: -150, accuracy: 0.8, consistency: 0.8, averageTiming: -150 }), ["early_timing"]);
  assert.deepStrictEqual(firing({ timingError: 0, accuracy: 0.5, consistency: 0.8, averageTiming: 0 }), ["low_accuracy"]);
  assert.deepStrictEqual(firing({ timingError: 0, accuracy: 0.8, consistency: 0.4, averageTiming: 0 }), ["inconsistent"]);
  assert.deepStrictEqual(firing({ timingError: 0, accuracy: 0.8, consistency: 0.8, weakLanes: [1], averageTiming: 0 }), ["weak_lanes"]);
  assert.deepStrictEqual(
    firing({ timingError: 0, accuracy: 0.97, consistency: 0.8, averageTiming: 10 }),
    ["good_accuracy", "perfect_run"]
  );
});

test("lesson planner builds a full plan from a chart with the real extractor and builder", function() {
  var chart = {
    chords: [
      { chord: "C" }, { chord: "G" }, { chord: "Am" }, { chord: "F" }, { chord: "Dm" }
    ],
    sections: [{ name: "Verse 1" }],
    getTimeline: function() {
      return [
        { type: "chord", duration: 0 },
        { type: "note", duration: 0.5 },
        { type: "strum_pattern", duration: 0 }
      ];
    },
    getBpm: function() { return 150; }
  };
  var planner = new SparkLessonPlanner();
  var plan = planner.generate(chart);

  assert.deepStrictEqual(
    plan.skills.slice().sort(),
    ["chord_switching", "chord_vocabulary", "rhythm", "speed", "sustain", "timing"]
  );
  assert.strictEqual(plan.chart, chart);
  var types = plan.steps.map(function(s) { return s.type; });
  assert.deepStrictEqual(types, ["warmup", "drill", "song_section", "full_play"]);
  assert.strictEqual(plan.steps[0].skill, plan.skills[0]);
  assert.strictEqual(plan.steps[2].section, chart.sections[0]);
});

test("lesson planner handles an empty chart without exercises", function() {
  var planner = new SparkLessonPlanner();
  var plan = planner.generate(null);
  assert.deepStrictEqual(plan.skills, []);
  assert.deepStrictEqual(plan.steps.map(function(s) { return s.type; }), ["full_play"]);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
