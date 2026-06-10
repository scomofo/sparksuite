var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    resetState();
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
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    recommendationHistory: [],
    performanceStats: {},
    personalInsights: null,
    lastInsightRun: null
  };
  global.escHTML = function(value) { return String(value); };
  global.getWeakestMasterySkills = function() { return []; };
  global.getStrongestMasterySkills = function() { return []; };
  global.buildMasteryTrend = function() { return {}; };
  global.buildPracticeTrendSeries = function() { return {}; };
  global.buildCareerInsights = function() { return {}; };
}

resetState();
eval(loadJS("js/insights/recommendations.js"));
eval(loadJS("js/insights/engine.js"));
eval(loadJS("js/insights/ui.js"));
eval(loadJS("js/home/home_cards.js"));

console.log("\n--- Insights ---");

test("buildRecommendationInsights carries a focused imported-technique block when still weak", function() {
  S.performanceStats = {
    imported_song_imported_chart_hard: {
      songId: "imported_song",
      arrangement: "imported_chart",
      difficulty: "hard",
      lastFocusedTechnique: "tap",
      focusedTechniqueRuns: { tap: 3 },
      importedTechniqueTotals: {
        tap: { total: 10, hits: 4, misses: 6 }
      }
    }
  };

  var insights = buildRecommendationInsights();

  assert.ok(insights.focusedTechnique);
  assert.strictEqual(insights.focusedTechnique.techniqueKey, "tap");
  assert.strictEqual(insights.focusedTechnique.accuracy, 40);
  assert.strictEqual(insights.focusedTechnique.focusedRuns, 3);
  assert.strictEqual(insights.focusedTechnique.songId, "imported_song");
});

test("generatePersonalInsights includes focused imported-technique insight data", function() {
  S.performanceStats = {
    imported_song_imported_chart_hard: {
      songId: "imported_song",
      arrangement: "imported_chart",
      difficulty: "hard",
      lastFocusedTechnique: "forced",
      focusedTechniqueRuns: { forced: 2 },
      importedTechniqueTotals: {
        forced: { total: 8, hits: 5, misses: 3 }
      }
    }
  };

  var insights = generatePersonalInsights();

  assert.ok(insights.recommendationQuality.focusedTechnique);
  assert.strictEqual(insights.recommendationQuality.focusedTechnique.techniqueKey, "forced");
  assert.strictEqual(insights.recommendationQuality.focusedTechnique.accuracy, 63);
});

test("insightsDashboardPage renders focused imported-technique continuity", function() {
  S.personalInsights = {
    weakestSkills: [],
    strongestSkills: [],
    masteryTrend: {},
    practiceTrend: {},
    recommendationQuality: {
      totalAccepted: 0,
      focusedTechnique: {
        songId: "imported_song",
        techniqueLabel: "tap-note consistency",
        accuracy: 40
      }
    },
    careerTrend: {}
  };
  S.lastInsightRun = Date.now();
  global.renderInsightLineChart = function() { return "<svg></svg>"; };

  var html = insightsDashboardPage();

  assert.ok(html.indexOf("Focused Technique") >= 0);
  assert.ok(html.indexOf("tap-note consistency is still at 40% in imported song") >= 0);
});

test("renderHomeInsightCard surfaces focused imported-technique continuity on the home dashboard", function() {
  var html = renderHomeInsightCard({
    weakestSkills: [],
    recommendationQuality: {
      focusedTechnique: {
        songId: "imported_song",
        techniqueLabel: "tap-note consistency",
        accuracy: 40
      }
    }
  });

  assert.ok(html.indexOf("Focus: tap-note consistency 40% in imported song") >= 0);
  assert.ok(html.indexOf("Practice more to see insights.") < 0);
});

test("renderHomeRecommendationCard surfaces module-progress recommendation details", function() {
  var html = renderHomeRecommendationCard([{
    id: "module_bass_level_4",
    title: "Bass: Walking Lines - Walking (Turnaround Steps)",
    source: "module_progress",
    meta: {
      recommendationFocus: "walking",
      progressSummary: {
        weakestMetric: "timing",
        timing: 0.48
      }
    }
  }]);

  assert.ok(html.indexOf("Focus: walking") >= 0);
  assert.ok(html.indexOf("Weakest: timing 48%") >= 0);
});

test("renderHomeRecommendationCard ignores sentinel focus strings in module-progress details", function() {
  var html = renderHomeRecommendationCard([{
    id: "module_bass_level_4",
    title: "Bass: Walking Lines",
    source: "module_progress",
    meta: {
      recommendationFocus: "undefined",
      progressSummary: {
        weakestMetric: "timing",
        timing: 0.48
      }
    }
  }]);

  assert.strictEqual(html.indexOf("Focus: undefined"), -1);
  assert.ok(html.indexOf("Weakest: timing 48%") >= 0);
});

test("renderHomeRecommendationCard surfaces focused imported-technique recommendation details", function() {
  var html = renderHomeRecommendationCard([{
    id: "imported_technique_song_x_tap",
    title: "Stay on tap-note timing in song x",
    type: "performance_technique",
    source: "weakspot",
    meta: {
      techniqueKey: "tap",
      techniqueAccuracy: 38
    }
  }]);

  assert.ok(html.indexOf("Technique: tap") >= 0);
  assert.ok(html.indexOf("Accuracy: 38%") >= 0);
});

test("renderHomePracticeCard ignores sentinel item titles and falls back to ids", function() {
  var html = renderHomePracticeCard({
    todayPlan: [
      { title: "undefined", id: "island_strum" }
    ]
  });

  assert.ok(html.indexOf("island strum") >= 0);
  assert.strictEqual(html.indexOf("undefined"), -1);
});

test("renderHomePracticeCard offers ADHD-friendly 10-minute templates", function() {
  var html = renderHomePracticeCard({ todayPlan: [] });

  assert.ok(html.indexOf("openPracticeTemplate") >= 0);
  assert.ok(html.indexOf("quick_win") >= 0);
  assert.ok(html.indexOf("low_energy") >= 0);
  assert.ok(html.indexOf("reset_focus") >= 0);
  assert.strictEqual(html.indexOf("openUkuleleMiniSession"), -1);
});

test("renderHomePracticeCard gates ukulele mini-sessions to ukulele context", function() {
  var html = renderHomePracticeCard({ todayPlan: [], activeInstrumentType: "ukulele" });

  assert.ok(html.indexOf("openUkuleleMiniSession") >= 0);
  assert.ok(html.indexOf("uke_favorites_set_a") >= 0);
});

test("renderHomeRecommendationCard ignores sentinel titles and falls back to ids", function() {
  var html = renderHomeRecommendationCard([{
    id: "next_focus_item",
    title: "null",
    source: "weakspot",
    meta: {}
  }]);

  assert.ok(html.indexOf("next focus item") >= 0);
  assert.strictEqual(html.indexOf("null"), -1);
});

test("renderHomeInsightCard ignores sentinel focused-technique text", function() {
  var html = renderHomeInsightCard({
    weakestSkills: [],
    recommendationQuality: {
      focusedTechnique: {
        songId: "undefined",
        techniqueLabel: "null",
        accuracy: 40
      }
    }
  });

  assert.ok(html.indexOf("Focus: skill 40% in song") >= 0);
  assert.strictEqual(html.indexOf("undefined"), -1);
  assert.strictEqual(html.indexOf("null"), -1);
});

test("renderHomeInsightCard ignores sentinel weakest-skill labels", function() {
  var html = renderHomeInsightCard({
    weakestSkills: [{ bucket: "undefined", id: "null" }],
    recommendationQuality: {}
  });

  assert.strictEqual(html.indexOf("Weakest:"), -1);
  assert.ok(html.indexOf("Practice more to see insights.") >= 0);
});

test("renderStrengthWeaknessCard ignores sentinel skill labels", function() {
  var html = renderStrengthWeaknessCard({
    strongestSkills: [{ bucket: "undefined", id: "null", value: 0.9 }],
    weakestSkills: [{ bucket: "null", id: "undefined", value: 0.2 }]
  });

  assert.strictEqual(html.indexOf("undefined"), -1);
  assert.strictEqual(html.indexOf("null"), -1);
});

test("insightsDashboardPage ignores sentinel focused-technique text", function() {
  S.personalInsights = {
    weakestSkills: [],
    strongestSkills: [],
    masteryTrend: {},
    practiceTrend: {},
    recommendationQuality: {
      totalAccepted: 0,
      focusedTechnique: {
        songId: "undefined",
        techniqueLabel: "null",
        accuracy: 40
      }
    },
    careerTrend: {}
  };
  S.lastInsightRun = Date.now();
  global.renderInsightLineChart = function() { return "<svg></svg>"; };

  var html = insightsDashboardPage();

  assert.ok(html.indexOf("skill is still at 40% in song") >= 0);
  assert.strictEqual(html.indexOf("undefined"), -1);
  assert.strictEqual(html.indexOf("null"), -1);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
