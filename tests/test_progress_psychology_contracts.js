var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

global.window = global;
global.S = {
  mastery: {
    lessons: {}
  },
  xp: 0
};
global.saveStateCalls = 0;
global.saveState = function() {
  saveStateCalls++;
};

loadJS("js/sparksuite/domain/types.js");
loadJS("js/sparksuite/core/psychology_engine.js");
loadJS("js/sparksuite/core/progress_engine.js");

var psychology = new SparkSuitePsychologyEngine();
var stableDecision = psychology.adjustDifficulty({
  currentDifficulty: "normal",
  recentPerformances: [
    { accuracy: 0.95 },
    { accuracy: 0.93 },
    { accuracy: 0.94 }
  ]
});
assert.strictEqual(stableDecision.difficulty, "hard");
assert.strictEqual(stableDecision.reason, "accuracy_stable_high");
assert.ok(stableDecision.confidence > 0.8);

var supportDecision = psychology.adjustDifficulty({
  currentDifficulty: "normal",
  recentPerformances: [
    { accuracy: 0.62 },
    { accuracy: 0.58 },
    { accuracy: 0.6 }
  ]
});
assert.strictEqual(supportDecision.difficulty, "easy");
assert.strictEqual(supportDecision.reason, "accuracy_support_needed");

var insufficientDecision = psychology.adjustDifficulty({
  currentDifficulty: "normal",
  recentPerformances: [
    { accuracy: 0.9 }
  ]
});
assert.strictEqual(insufficientDecision.difficulty, "normal");
assert.strictEqual(insufficientDecision.reason, "insufficient_history");
assert.deepStrictEqual(
  psychology.getSessionStructure("bass"),
  ["spark", "reviewGroove", "technique", "grooveDrill", "songGroove", "victoryGroove"]
);

var progress = new SparkSuiteProgressEngine();
var masteryUpdate = progress.updateMastery({
  instrument: "guitar",
  skillId: "session_1",
  performance: {
    accuracy: 0.8,
    timing: {
      score: 0.6
    }
  }
});
assert.strictEqual(masteryUpdate.skillId, "session_1");
assert.strictEqual(masteryUpdate.instrument, "guitar");
assert.ok(masteryUpdate.mastery > 0.18 && masteryUpdate.mastery < 0.19);
assert.ok(typeof masteryUpdate.nextReviewAt === "string");
assert.strictEqual(saveStateCalls, 1);

var secondMasteryUpdate = progress.updateMastery({
  instrument: "guitar",
  skillId: "session_1",
  performance: {
    accuracy: 1,
    timing: {
      score: 1
    }
  }
});
assert.ok(secondMasteryUpdate.mastery > masteryUpdate.mastery);
assert.strictEqual(saveStateCalls, 2);

var xpResult = progress.addXp({ xp: 4 }, 6);
assert.deepStrictEqual(xpResult, { xp: 10 });
assert.strictEqual(progress.calculatePerformanceScore({
  accuracy: 0.8,
  timing: {
    score: 0.6
  }
}), 0.74);
assert.strictEqual(progress.smoothMastery(0.5, 1), 0.625);
assert.ok(typeof progress.calculateNextReview(0.9) === "string");

console.log("PASS: Progress and psychology engines expose structured contract helpers");
