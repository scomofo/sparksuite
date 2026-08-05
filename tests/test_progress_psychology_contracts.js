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
loadJS("js/sparksuite/core/practice_engine.js");
loadJS("js/sparksuite/core/progress_engine.js");
// Bass declares its groove session structure via adapter capabilities —
// the engine must resolve it from the registry, not hardcode instruments.
loadJS("js/sparksuite/instruments/bass/bass_adapter.js");
loadJS("js/sparksuite/instruments/bass/index.js");

var psychology = new SparkSuitePsychologyEngine();
var practice = new SparkSuitePracticeEngine(psychology);
assert.strictEqual(psychology.getPerformancePhraseRating(95), "excellent");
assert.strictEqual(psychology.getPerformancePhraseRating(0.72), "good");
assert.strictEqual(psychology.getPerformancePhraseRating(0.4), "poor");
assert.deepStrictEqual(psychology.getSessionCompletionRewards({ xpAwarded: 60, chordProgressIncrement: 20 }), {
  rewardTrigger: "session_complete",
  audioCue: "complete",
  xpAwarded: 60,
  chordProgressIncrement: 20
});
assert.deepStrictEqual(psychology.getSessionCompletionRewards({ xpAwarded: "not-a-number", chordProgressIncrement: Infinity, performanceScore: 0 }), {
  rewardTrigger: "session_complete",
  audioCue: "complete",
  xpAwarded: 50,
  chordProgressIncrement: 15
});
assert.deepStrictEqual(psychology.getSessionCompletionRewards({ xpAwarded: 5000, chordProgressIncrement: 500 }), {
  rewardTrigger: "session_complete",
  audioCue: "complete",
  xpAwarded: 1000,
  chordProgressIncrement: 100
});
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

var guidedOutcome = progress.buildLegacyGuidedSessionCompletion({
  num: 4,
  newMove: { chord: "G" }
}, {
  curriculum: [{ lhPattern: "root_fifth" }],
  lhPatterns: [{ id: "root_fifth" }],
  level: 1,
  lhLevel: 0
});
assert.deepStrictEqual(guidedOutcome.completedSessionNums, [4]);
assert.strictEqual(guidedOutcome.currentSession, 5);
assert.strictEqual(guidedOutcome.chordProgress.G, 15);
assert.strictEqual(guidedOutcome.xpAwarded, 50);
assert.deepStrictEqual(guidedOutcome.historyEntry, {
  type: "guided_session",
  detail: { session: 4, chord: "G" }
});
assert.strictEqual(guidedOutcome.lhLevel, 1);

var customProgress = new SparkSuiteProgressEngine(null, {
  getSessionCompletionRewards: function() {
    return {
      rewardTrigger: "custom_complete",
      audioCue: "levelup",
      xpAwarded: 70,
      chordProgressIncrement: 22
    };
  },
  getPerformancePhraseRating: function(accuracy) {
    return accuracy >= 80 ? "ready" : "review";
  }
});
var customGuidedOutcome = customProgress.buildLegacyGuidedSessionCompletion({
  num: 2,
  newMove: { chord: "C" }
}, {});
assert.strictEqual(customGuidedOutcome.rewardTrigger, "custom_complete");
assert.strictEqual(customGuidedOutcome.audioCue, "levelup");
assert.strictEqual(customGuidedOutcome.xpAwarded, 70);
assert.strictEqual(customGuidedOutcome.chordProgress.C, 22);
assert.strictEqual(customProgress.buildPerformanceResultsView({
  phrases: [{ phraseId: "a", name: "A", hits: 4, total: 5 }]
}).phrases[0].rating, "ready");
assert.strictEqual(progress.hasPerformedAnyPhrase({
  phraseStats: [{ total: 0 }, { total: 2 }]
}, {
  phrases: [{ id: "a" }, { id: "b" }]
}), true);
assert.strictEqual(progress.hasPerformedAnyPhrase({
  phraseStats: [{ total: 2 }]
}, {
  phrases: []
}), false);
assert.deepStrictEqual(progress.buildPerformSongState({
  phraseStats: [{ total: 2 }]
}, {
  phrases: [{ id: "a" }]
}), { canPracticeWeakestPhrase: true, showWeakestPhraseAction: true });
var doneState = progress.buildPerformanceDoneState({
  title: "Anchor Song",
  artist: "Spark",
  stars: 4,
  score: 1234,
  accuracy: 91,
  maxCombo: 18,
  totalEvents: 20,
  phraseStats: [
    { name: "Verse", total: 10, scoreSum: 900, perfects: 7, goods: 2, oks: 1, misses: 0 },
    { name: "Chorus", total: 10, scoreSum: 700, perfects: 5, goods: 2, oks: 1, misses: 2 }
  ]
}, {
  id: "anchor_song",
  phrases: [{ id: "verse" }, { id: "chorus" }]
}, {
  performanceChartId: "anchor_song",
  performanceTargetTechnique: "alternatePicking"
});

assert.strictEqual(doneState.hasResults, true);
assert.strictEqual(doneState.title, "Anchor Song");
assert.strictEqual(doneState.bestPhrase.name, "Verse");
assert.strictEqual(doneState.weakestPhrase.name, "Chorus");
assert.strictEqual(doneState.showWeakestPhraseAction, true);
assert.strictEqual(doneState.targetTechnique, "alternatePicking");

var emptyDoneState = progress.buildPerformanceDoneState(null, null, {});
assert.deepStrictEqual(emptyDoneState, {
  hasResults: false,
  action: "performDoneSongs",
  label: "Songs"
});
assert.strictEqual(progress.canPracticeWeakestPhrase({
  phrases: [{ id: "a" }]
}, {
  phraseStats: [{ total: 2 }]
}), true);
assert.deepStrictEqual(practice.generateEarTrainingQuestion({
  level: 1,
  random: function() { return 0; },
  instrumentData: {
    CHORDS: { 1: [{ name: "C" }, { name: "G" }] },
    ALL_CHORDS: [{ name: "C" }, { name: "G" }, { name: "Am" }, { name: "F" }]
  }
}), { question: "C", options: ["G", "Am", "F", "C"] });

console.log("PASS: Progress and psychology engines expose structured contract helpers");
