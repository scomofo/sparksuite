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
    lastInsightRun: null,
    playAlongRecent: []
  };
  global.__sparkState = global.S;
  global.SparkState = {
    getRoot: function() {
      return global.S;
    },
    read: function(path, fallback) {
      var parts = Array.isArray(path) ? path.slice() : [path];
      var cursor = global.S;
      var i;
      for (i = 0; i < parts.length; i++) {
        if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) {
          return fallback;
        }
        cursor = cursor[parts[i]];
      }
      return cursor == null ? fallback : cursor;
    }
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
eval(loadJS("js/home/home_engine.js"));
eval(loadJS("js/home/home_cards.js"));
eval(loadJS("js/meta/challenge_ui.js"));

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

test("renderHomePlayAlongCard surfaces recent resume context", function() {
  var html = renderHomePlayAlongCard({
    recent: [{
      trackId: "demo_song_1",
      title: "Sunrise Drive",
      artist: "SparkSuite Demo",
      transportMode: "generated"
    }],
    outcome: {
      accuracy: 0.82
    },
    transportMode: "generated",
    weakAreas: ["lane_2", "late"],
    hasDrill: true,
    weakSection: { sectionLabel: "Chorus" },
    bookmarks: [{ sectionLabel: "Verse", title: "Sunrise Drive" }]
  });

  assert.ok(html.indexOf("Last song: Sunrise Drive") >= 0);
  assert.ok(html.indexOf("Resume Song") >= 0);
  assert.ok(html.indexOf("Last accuracy: 82%") >= 0);
  assert.ok(html.indexOf("Weak spots: lane_2 | late") >= 0);
  assert.ok(html.indexOf("Run Last Drill") >= 0);
  assert.ok(html.indexOf("Jump To Weak Section") >= 0);
  assert.ok(html.indexOf("Weak section: Chorus") >= 0);
  assert.ok(html.indexOf("Bookmarks") >= 0);
});

test("renderSmartCoachCard includes execution trace and recent play-along context", function() {
  S.playAlongRecent = [{ title: "Sunrise Drive" }];
  global.window.sparkCore = {
    runtimeState: {
      lastExecutionTrace: {
        source: "play_along_resume"
      }
    },
    getPlayAlongDashboardView: function() {
      return {
        recent: [{ title: "Sunrise Drive" }],
        bookmarks: [],
        outcome: null,
        transportMode: null,
        weakAreas: [],
        hasDrill: false,
        weakSection: null
      };
    }
  };

  var html = renderSmartCoachCard({
    recommendationQuality: {
      smartCoach: {
        focusSkill: "timing"
      }
    },
    coach: {
      message: "Tighten your timing before increasing speed."
    }
  });

  assert.ok(html.indexOf("Latest execution: play_along_resume") >= 0);
  assert.ok(html.indexOf("Recent play along: Sunrise Drive") >= 0);
});

test("buildHomeDashboardData falls back when sparkCore dashboard challenges are empty", function() {
  global.getIncompleteChallenges = function(limit) {
    return [{ id: "fallback_daily" }, { id: "fallback_weekly" }].slice(0, limit);
  };
  global.window.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          dashboardChallenges: []
        }
      };
    }
  };

  var summary = buildHomeDashboardData().challenges;

  assert.strictEqual(summary.length, 2);
  assert.strictEqual(summary[0].id, "fallback_daily");
});

test("challenge hub falls back to active challenges when sparkCore dashboard list is empty", function() {
  global.SparkState.read = function(path, fallback) {
    var key = Array.isArray(path) ? path[0] : path;
    return Object.prototype.hasOwnProperty.call(global.S, key) ? global.S[key] : fallback;
  };
  global.window.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          dashboardChallenges: []
        }
      };
    }
  };
  S.activeChallenges = [{
    id: "claim_me",
    title: "Claim Me",
    description: "Test challenge",
    progress: 1,
    target: 1,
    completed: true,
    claimed: false
  }];
  global.getActiveSeasonalEvent = function() { return null; };

  var html = renderActiveChallengesCard();

  assert.ok(html.indexOf("Claim Me") >= 0);
  assert.ok(html.indexOf("Claim Reward") >= 0);
});

test("buildHomeDashboardData carries play-along summary", function() {
  global.window.sparkCore = {
    runtimeState: {
      playAlongTransportMode: "generated",
      lastExecutionTrace: { source: "play_along_resume" }
    },
    getPlayAlongDashboardView: function() {
      return {
        recent: [{ title: "Sunrise Drive", transportMode: "generated" }],
        bookmarks: [{ sectionLabel: "Verse", title: "Sunrise Drive" }],
        outcome: {
          accuracy: 0.81,
          performance: {
            weakAreas: ["lane_2", "late"]
          },
          drills: [{ label: "Fix timing" }],
          sectionSummary: {
            sectionLabel: "Chorus"
          }
        },
        transportMode: "generated",
        weakAreas: ["lane_2", "late"],
        hasDrill: true,
        weakSection: { sectionLabel: "Chorus" }
      };
    }
  };
  global.getIncompleteChallenges = function() { return []; };
  global.getActiveSeasonalEvent = function() { return null; };

  var data = buildHomeDashboardData();

  assert.strictEqual(data.playAlong.recent[0].title, "Sunrise Drive");
  assert.strictEqual(data.system.executionTrace.source, "play_along_resume");
  assert.strictEqual(data.system.transportMode, "generated");
  assert.deepStrictEqual(data.playAlong.weakAreas, ["lane_2", "late"]);
  assert.strictEqual(data.playAlong.hasDrill, true);
  assert.strictEqual(data.playAlong.weakSection.sectionLabel, "Chorus");
  assert.strictEqual(data.playAlong.bookmarks[0].sectionLabel, "Verse");
});

test("generatePersonalInsights carries play-along summary", function() {
  global.window.sparkCore = {
    getPlayAlongDashboardView: function() {
      return {
        recent: [{ title: "Sunrise Drive", transportMode: "generated" }],
        bookmarks: [{ sectionLabel: "Verse", title: "Sunrise Drive" }],
        outcome: {
          accuracy: 0.74,
          performance: {
            weakAreas: ["lane_2", "late"]
          },
          drills: [{ label: "Fix timing" }],
          sectionSummary: {
            sectionLabel: "Chorus"
          }
        },
        transportMode: "generated",
        weakAreas: ["lane_2", "late"],
        hasDrill: true,
        weakSection: { sectionLabel: "Chorus" }
      };
    }
  };

  var insights = generatePersonalInsights();

  assert.strictEqual(insights.playAlongSummary.recentTitle, "Sunrise Drive");
  assert.strictEqual(insights.playAlongSummary.accuracy, 74);
  assert.deepStrictEqual(insights.playAlongSummary.weakAreas, ["lane_2", "late"]);
  assert.strictEqual(insights.playAlongSummary.hasDrill, true);
  assert.strictEqual(insights.playAlongSummary.weakSection, "Chorus");
  assert.strictEqual(insights.playAlongSummary.bookmarks[0].sectionLabel, "Verse");
});

test("renderSmartCoachCard includes play-along weak spot carryover", function() {
  var html = renderSmartCoachCard({
    recommendationQuality: {
      smartCoach: {
        focusSkill: "timing"
      }
    },
    coach: {
      message: "Tighten your timing before increasing speed."
    },
    playAlongSummary: {
      accuracy: 74,
      weakAreas: ["lane_2", "late"],
      weakSection: "Chorus",
      bookmarks: [{ sectionLabel: "Verse" }]
    }
  });

  assert.ok(html.indexOf("Last play-along accuracy: 74%") >= 0);
  assert.ok(html.indexOf("Play-along weak spots: lane 2 | late") >= 0);
  assert.ok(html.indexOf("Weak section: Chorus") >= 0);
  assert.ok(html.indexOf("Saved section: Verse") >= 0);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
