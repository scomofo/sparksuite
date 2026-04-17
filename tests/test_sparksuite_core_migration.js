var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;
var lastProgressEvent = null;

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
    completedLessons: [],
    mastery: { lessons: {}, rhythm: {} },
    practiceHistory: [],
    practicePlanHistory: [],
    practicePlanComplete: false,
    practicePlanFocus: "",
    practicePlan: null,
    practicePlanDate: null,
    activeSessionPlanId: null,
    xp: 0,
    guidedSession: 1,
    completedGuidedSessions: [],
    chordProgress: {},
    adaptiveState: {},
    weakSpots: {},
    cloudAuth: {
      userId: null,
      email: null,
      token: null,
      loggedIn: false
    },
    cloudSync: {
      lastSyncStatus: "idle",
      lastSyncAt: null,
      dirtyKeys: []
    },
    performArrangementType: "chords",
    performDifficulty: "normal"
  };
  global.__sparkState = global.S;
  global.toasts = [];
  global.saveStateCalls = 0;
  global.saveState = function() { saveStateCalls++; };
  global.showToast = function(msg) { toasts.push(msg); };
  var guidedSessions = [
    {
      num: 1,
      title: "First Spark",
      level: 1,
      bpm: 70,
      spark: { text: "Start here" },
      newMove: { chord: "C" }
    },
    {
      num: 2,
      title: "Second Spark",
      level: 1,
      bpm: 75,
      spark: { text: "Keep going" },
      newMove: { chord: "G" }
    }
  ];
  var songs = [
    { title: "Fire Road", artist: "Spark Suite" },
    { title: "Night Drive", artist: "Spark Suite" }
  ];
  global.buildPracticeCandidates = function() {
    return [
      { id: "warmup_1", type: "warmup", label: "Quick warmup", reason: "Start loose", meta: { durationSec: 120 } },
      { id: "transition_1", type: "transition", label: "Practice G to C", reason: "Weak transition", meta: { key: "G|C", from: "G", to: "C" } }
    ];
  };
  global.SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculumMap: function() { return [{ num: 1, title: "First Spark" }]; },
    getCurriculum: function() { return { SESSIONS: guidedSessions }; },
    getSongs: function() { return songs; }
  };
  global.SparkSession = {
    processResults: function() {
      return {
        xpEarned: 30,
        jackpot: false,
        leveledUp: false
      };
    }
  };
  global.SparkProgressOrchestrator = {
    evaluateAll: function(evt) {
      lastProgressEvent = evt;
      return {};
    }
  };
  global.SparkPsychology = {
    shouldReward: function() { return false; }
  };
  global.updateWeakSpotsFromPerformance = function() {};
  global.updateAdaptiveFromResult = function() {};
  global.checkLessonUnlockRules = function() { return true; };
  global.getNextLessonFromCurriculum = function(rootLessonId, completedLessonIds) {
    completedLessonIds = completedLessonIds || [];
    if (rootLessonId === "uke_01") {
      var order = ["uke_01", "uke_02", "uke_03", "uke_04", "uke_05"];
      for (var i = 0; i < order.length; i++) {
        if (completedLessonIds.indexOf(order[i]) === -1) return order[i];
      }
      return null;
    }
    return rootLessonId;
  };
  lastProgressEvent = null;
}

resetState();

eval(loadJS("js/sparksuite/domain/types.js"));
eval(loadJS("js/sparksuite/domain/session_segment.js"));
eval(loadJS("js/sparksuite/domain/session.js"));
eval(loadJS("js/sparksuite/domain/tempo_map.js"));
eval(loadJS("js/sparksuite/domain/note_event.js"));
eval(loadJS("js/sparksuite/domain/phrase.js"));
eval(loadJS("js/sparksuite/domain/chart.js"));
eval(loadJS("js/sparksuite/domain/gameplay_result.js"));
eval(loadJS("js/sparksuite/domain/engine_preset.js"));
eval(loadJS("js/sparksuite/bridges/practice_bridge.js"));
eval(loadJS("js/sparksuite/bridges/curriculum_bridge.js"));
eval(loadJS("js/sparksuite/bridges/progress_bridge.js"));
eval(loadJS("js/sparksuite/bridges/performance_bridge.js"));
eval(loadJS("js/sparksuite/core/calibration_engine.js"));
eval(loadJS("js/sparksuite/core/timing_engine.js"));
eval(loadJS("js/sparksuite/core/chart_io.js"));
eval(loadJS("js/sparksuite/core/replay_engine.js"));
eval(loadJS("js/sparksuite/core/input_judge.js"));
eval(loadJS("js/sparksuite/core/scoring_engine.js"));
eval(loadJS("js/sparksuite/core/rhythm_gameplay_engine.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_skill_tree.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_lessons.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_chords.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_scales.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_tuning.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_exercises.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_progression.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_module.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_adapter.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/index.js"));
eval(loadJS("js/instruments/bass/data.js"));
eval(loadJS("js/sparksuite/instruments/bass/bass_module.js"));
eval(loadJS("js/sparksuite/instruments/bass/bass_adapter.js"));
eval(loadJS("js/sparksuite/instruments/bass/index.js"));
eval(loadJS("js/sparksuite/instruments/piano/piano_adapter.js"));
eval(loadJS("js/sparksuite/instruments/piano/index.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_chart_library.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_curriculum.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_adapter.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_adapter.js"));
eval(loadJS("js/sparksuite/instruments/guitar/index.js"));
eval(loadJS("js/sparksuite/core/state_facade.js"));
eval(loadJS("js/progression/xp_system.js"));
eval(loadJS("js/progression/level_system.js"));
eval(loadJS("js/progression/skill_mastery.js"));
eval(loadJS("js/progression/unlock_system.js"));
eval(loadJS("js/adaptive/spaced_repetition.js"));
eval(loadJS("js/adaptive/skill_selector.js"));
eval(loadJS("js/performance/session_rewards.js"));
eval(loadJS("js/sparksuite/core/storage.js"));
eval(loadJS("js/sparksuite/core/ai_engine.js"));
eval(loadJS("js/sparksuite/core/instrument_manager.js"));
eval(loadJS("js/sparksuite/core/psychology_engine.js"));
eval(loadJS("js/curriculum/curriculum_engine.js"));
eval(loadJS("js/sparksuite/core/curriculum_engine.js"));
eval(loadJS("js/sparksuite/core/practice_engine.js"));
eval(loadJS("js/sparksuite/core/progress_engine.js"));
eval(loadJS("js/sparksuite/core/session_engine.js"));
eval(loadJS("js/sparksuite/core/spark_core.js"));

console.log("\n--- SparkSuite Core Migration ---");

test("startSession returns a SessionPlan and syncs the legacy practice plan", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "daily_practice");
  assert.strictEqual(plan.segments.length, 2);
  assert.ok(S.practicePlan);
  assert.strictEqual(S.practicePlan.items.length, 2);
  assert.strictEqual(S.practicePlan.curriculum.nextLessonId, "session_1");
});

test("SparkCore exposes engine-owned runtime state for active session context", function() {
  var core = createDefaultSparkCore();
  var initialState = core.getRuntimeState();

  assert.strictEqual(initialState.activeFlow, null);
  assert.strictEqual(initialState.transport.status, "idle");

  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
  var runtimeState = core.getRuntimeState();
  var view = core.getActiveSessionView();

  assert.strictEqual(runtimeState.activeFlow, "daily_practice");
  assert.strictEqual(runtimeState.activeInstrumentId, "chordspark");
  assert.strictEqual(runtimeState.activeInstrumentType, "guitar");
  assert.strictEqual(runtimeState.activePlanId, plan.id);
  assert.strictEqual(runtimeState.activeSegmentId, plan.segments[0].id);
  assert.strictEqual(runtimeState.activeScreen, "daily_practice");
  assert.strictEqual(runtimeState.transport.status, "ready");
  assert.strictEqual(runtimeState.transport.positionMs, 0);
  assert.strictEqual(view.plan, plan);
  assert.strictEqual(view.runtimeState, runtimeState);
  assert.strictEqual(view.lastSessionOutcome, null);
});

test("SparkCore reuses daily practice plans when the active context only provides instrumentId", function() {
  var core = createDefaultSparkCore();
  var buildCalls = 0;
  var today = new Date().toISOString().slice(0, 10);

  core.instrumentManager.getActiveContext = function() {
    return {
      instrumentId: "pianospark",
      instrumentType: "piano",
      curriculumMap: [],
      sessions: [],
      songs: []
    };
  };
  core.sessionEngine.buildSession = function(flow, options) {
    buildCalls++;
    return new SessionPlan({
      id: "daily_piano_plan",
      flow: flow,
      generatedDate: today,
      instrumentId: options.instrumentContext.instrumentId || options.instrumentContext.appId || null,
      instrumentType: options.instrumentContext.instrumentType || null,
      segments: [],
      exercises: [],
      rewards: [{ type: "xp", amount: 40 }]
    });
  };

  var firstPlan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
  var secondPlan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  assert.strictEqual(firstPlan.instrumentId, "pianospark");
  assert.strictEqual(secondPlan, firstPlan);
  assert.strictEqual(buildCalls, 1);
});

test("SparkCore and storage fall back to global S when SparkState.getRoot returns null", function() {
  var originalSparkState = global.SparkState;
  var originalSparkRoot = global.__sparkState;
  global.S.playerXP = 55;
  global.S.activeSessionPlanId = "legacy_plan";
  global.__sparkState = null;
  global.SparkState = { getRoot: function() { return null; } };

  var storage = new SparkSuiteStorage();
  var core = createDefaultSparkCore();

  assert.strictEqual(storage.getCurrentPlanId(), "legacy_plan");
  assert.strictEqual(core.getPlayerXP(), 55);

  global.SparkState = originalSparkState;
  global.__sparkState = originalSparkRoot;
});

test("SparkCore exposes completed lesson ids through a normalized accessor", function() {
  var core = createDefaultSparkCore();
  S.completedLessons = ["uke_01"];
  S.mastery.lessons.uke_02 = true;

  var completed = core.getCompletedLessonIds();

  assert.deepStrictEqual(completed, ["uke_01", "uke_02"]);
});

test("SparkCore exposes a normalized legacy progress snapshot", function() {
  var core = createDefaultSparkCore();
  S.completedLessons = ["uke_01"];
  S.mastery.lessons.uke_02 = true;
  S.mastery.chords = {};
  S.mastery.chords.C = true;
  S.mastery.rhythm.uke_island = 14;
  S.chordProgress.G = 42;
  S.ukuleleSkillProgress = {};
  S.ukuleleSkillProgress.fingerpicking = { timing: 0.52 };

  var progress = core.getLegacyProgressSnapshot();

  assert.deepStrictEqual(progress.completedLessonIds, ["uke_01", "uke_02"]);
  assert.strictEqual(progress.mastery.lessons.uke_02, true);
  assert.strictEqual(progress.mastery.chords.C, true);
  assert.strictEqual(progress.mastery.rhythm.uke_island, 14);
  assert.strictEqual(progress.chordProgress.G, 42);
  assert.strictEqual(progress.ukuleleSkillProgress.fingerpicking.timing, 0.52);
});

test("SparkCore exposes a normalized legacy player snapshot", function() {
  var core = createDefaultSparkCore();
  S.xp = 88;
  S.playerLevel = 4;
  S.streak = 7;
  S.lastSessionDate = "2026-04-12";
  S.playerAchievements = { level_5: true };
  S.unlocks = { songs: { fire_road: true } };

  var player = core.getLegacyPlayerSnapshot();

  assert.strictEqual(player.xp, 88);
  assert.strictEqual(player.level, 4);
  assert.strictEqual(player.streak, 7);
  assert.strictEqual(player.lastSessionDate, "2026-04-12");
  assert.strictEqual(player.achievements.level_5, true);
  assert.strictEqual(player.unlocks.songs.fire_road, true);
});

test("SparkCore exposes a normalized legacy practice analytics snapshot", function() {
  var core = createDefaultSparkCore();
  S.transitionStats = { "G->C": { attempts: 5, success: 2 } };
  S.chordProgress = { G: 42 };
  S.performanceStats = {
    song_hard: { songId: "song", runs: 2, bestAccuracy: 76 }
  };

  var analytics = core.getLegacyPracticeAnalyticsSnapshot();

  assert.strictEqual(analytics.transitionStats["G->C"].attempts, 5);
  assert.strictEqual(analytics.chordProgress.G, 42);
  assert.strictEqual(analytics.performanceStats.song_hard.bestAccuracy, 76);
});

test("SparkCore legacy practice helpers centralize practice, weak-spot, and adaptive updates", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;

  core.recordLegacyPracticeSession({ id: "practice_1", durationMin: 6 });
  core.updateLegacyWeakSpotsFromPerformance({
    transitions: { "G->C": 0.61 },
    phrases: [{ id: "phrase_2", accuracy: 0.55 }]
  });
  core.updateLegacyAdaptiveFromResult({ exerciseId: "rhythm_1", accuracy: 0.82 });

  assert.strictEqual(S.practiceHistory.length, 1);
  assert.strictEqual(S.practiceHistory[0].id, "practice_1");
  assert.ok(S.practiceHistory[0].ts);
  assert.strictEqual(S.totalPracticeMinutes, 6);
  assert.strictEqual(S.todayPracticeMinutes, 6);
  assert.strictEqual(S.practiceStreak, 1);
  assert.strictEqual(S.weakSpots.transitions["G->C"].attempts, 1);
  assert.strictEqual(S.weakSpots.phrases["phrase_2"].attempts, 1);
  assert.strictEqual(S.adaptiveState.rhythm_1.accuracy, 0.82);
  assert.ok(S.adaptiveState.rhythm_1.ts);
});

test("SparkProgressOrchestrator can evaluate from sparkCore-backed snapshots", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  S.playerLevel = 4;
  S.streak = 7;
  S.lastSessionDate = "2026-04-10";
  S.mastery.chords = {};
  S.unlocks = { songs: {} };
  S.playerAchievements = {};

  var levelChecks = 0;
  var streakAwards = [];
  var comebackRequests = [];
  global.checkLevelUp = function() {
    levelChecks++;
    S.playerLevel = 5;
  };
  global.updateMastery = function(skillType, skillId, value) {
    if (!S.mastery[skillType]) S.mastery[skillType] = {};
    S.mastery[skillType][skillId] = value;
  };
  global.evaluateUnlocks = function() {
    S.unlocks.songs.fire_road = true;
  };
  global.evaluateAchievements = function() {
    S.playerAchievements.level_5 = true;
  };
  global.awardStreakXP = function(streak) {
    streakAwards.push(streak);
  };
  global.awardXP = function() {};
  global.SparkPsychology = {
    getComebackBonus: function(lastSessionDate) {
      comebackRequests.push(lastSessionDate);
      return 0;
    }
  };

  eval(loadJS("js/spark-core/progress-orchestrator.js"));

  var result = SparkProgressOrchestrator.evaluateAll({
    type: "session",
    chordName: "C",
    accuracy: 0.82,
    streakUpdated: true
  });

  assert.strictEqual(levelChecks, 1);
  assert.strictEqual(result.leveledUp, true);
  assert.strictEqual(result.newLevel, 5);
  assert.strictEqual(result.masteryUpdates.C, 82);
  assert.deepStrictEqual(result.newUnlocks, ["content_unlocked"]);
  assert.deepStrictEqual(result.newAchievements, ["achievement_earned"]);
  assert.deepStrictEqual(streakAwards, [7]);
  assert.deepStrictEqual(comebackRequests, ["2026-04-10"]);
  assert.strictEqual(result.xpTotal, 35);
});

test("SparkCore runtime state tracks manual patches and completion summaries", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  core.updateRuntimeState({
    activeSegmentId: plan.segments[1].id,
    transport: { status: "running", positionMs: 6400 }
  });

  var midState = core.getRuntimeState();
  assert.strictEqual(midState.activeSegmentId, plan.segments[1].id);
  assert.strictEqual(midState.transport.status, "running");
  assert.strictEqual(midState.transport.positionMs, 6400);

  core.completeSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, itemId: plan.segments[0].id });
  var result = core.completeSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, itemId: plan.segments[1].id });
  var completedState = core.getRuntimeState();

  assert.strictEqual(completedState.transport.status, "completed");
  assert.strictEqual(completedState.lastCompletedSessionId, plan.id);
  assert.strictEqual(completedState.lastCompletedFlow, "daily_practice");
  assert.strictEqual(completedState.lastOutcomeSummary.sessionId, plan.id);
  assert.strictEqual(completedState.lastOutcomeSummary.xpAwarded, result.xpAwarded);
});

test("SparkCore can open and complete daily practice through explicit helpers", function() {
  var core = createDefaultSparkCore();
  var plan = core.openDailyPracticePlan();

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "daily_practice");
  assert.strictEqual(core.getRuntimeState().activeScreen, "daily_practice");

  var rebuiltPlan = core.openDailyPracticePlan({ forceRebuild: true });
  assert.ok(rebuiltPlan instanceof SessionPlan);
  assert.notStrictEqual(rebuiltPlan.id, plan.id);

  var completionResult = core.completeDailyPracticePlan();
  assert.strictEqual(completionResult.planCompleted, true);
  assert.strictEqual(core.getRuntimeState().transport.status, "completed");
});

test("SparkCore resetProgressState clears cached daily practice plans", function() {
  var core = createDefaultSparkCore();
  var plan = core.openDailyPracticePlan();

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(core.getCurrentPlan().id, plan.id);

  core.resetProgressState();

  assert.strictEqual(core.getCurrentPlan(), null);
  assert.strictEqual(core.getRuntimeState().activePlanId, null);
  assert.strictEqual(core.getRuntimeState().activeFlow, null);

  var rebuiltPlan = core.openDailyPracticePlan();
  assert.ok(rebuiltPlan instanceof SessionPlan);
  assert.notStrictEqual(rebuiltPlan.id, plan.id);
});

test("SparkCore rebuilds today's practice plan when the active instrument changes", function() {
  var core = createDefaultSparkCore();

  SparkInstrumentAdapter = {
    getAppId: function() { return "ukespark"; },
    getInstrumentType: function() { return "ukulele"; },
    getCurriculumMap: function() { return SparkUkuleleLessons; },
    getCurriculum: function() { return { SESSIONS: SparkUkuleleLessons }; },
    getSongs: function() { return SparkUkuleleModule.getSongs(); }
  };

  var ukulelePlan = core.openDailyPracticePlan({ forceRebuild: true });

  assert.strictEqual(ukulelePlan.instrumentId, "ukespark");
  assert.strictEqual(S.practicePlan.instrumentId, "ukespark");

  SparkInstrumentAdapter = {
    getAppId: function() { return "pianospark"; },
    getInstrumentType: function() { return "piano"; },
    getCurriculumMap: function() { return [{ num: 1, title: "White Keys Only" }]; },
    getCurriculum: function() {
      return {
        SESSIONS: [
          { num: 1, title: "Piano Spark 1", spark: { text: "Start" }, newMove: { chord: "C" } }
        ]
      };
    },
    getSongs: function() {
      return [{ title: "River Walk", artist: "Piano Suite" }];
    }
  };

  var pianoPlan = core.openDailyPracticePlan();

  assert.strictEqual(pianoPlan.instrumentId, "pianospark");
  assert.notStrictEqual(pianoPlan.id, ukulelePlan.id);
  assert.strictEqual(core.getCurrentPlan().instrumentId, "pianospark");
  assert.strictEqual(S.practicePlan.instrumentId, "pianospark");
});

test("SparkCore can open daily practice from dashboard through an explicit helper", function() {
  var core = createDefaultSparkCore();
  var plan = core.openDashboardPracticePlan();

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "daily_practice");
  assert.strictEqual(core.getRuntimeState().activeScreen, "daily_practice");
});

test("SparkCore can open the practice plan screen through an explicit helper", function() {
  var core = createDefaultSparkCore();
  var plan = core.openPracticePlanScreen();

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "daily_practice");
  assert.strictEqual(core.getRuntimeState().activeScreen, "practice_plan");
  assert.strictEqual(core.getRuntimeState().activeTab, "practice");
});

test("SparkCore can open legacy practice session and drill runtime explicitly", function() {
  var core = createDefaultSparkCore();

  var sessionState = core.openLegacyPracticeSession({
    mode: "chord",
    chordName: "C",
    durationSec: 120
  });
  assert.strictEqual(sessionState.activeFlow, "legacy_practice_session");
  assert.strictEqual(sessionState.activeScreen, "session");
  assert.strictEqual(sessionState.activeTab, "practice");
  assert.strictEqual(sessionState.legacyPracticeMode, "chord");
  assert.strictEqual(sessionState.legacyPracticeChordName, "C");
  assert.strictEqual(sessionState.legacyPracticeDurationSec, 120);
  assert.strictEqual(sessionState.transport.status, "running");

  var drillState = core.openLegacyPracticeDrill({
    durationSec: 60,
    chordNames: ["C", "G"]
  });
  assert.strictEqual(drillState.activeFlow, "legacy_practice_drill");
  assert.strictEqual(drillState.activeScreen, "drill");
  assert.strictEqual(drillState.activeTab, "practice");
  assert.strictEqual(drillState.legacyPracticeMode, "drill");
  assert.deepStrictEqual(drillState.legacyDrillChordNames, ["C", "G"]);
  assert.strictEqual(drillState.legacyPracticeDurationSec, 60);
  assert.strictEqual(drillState.transport.status, "running");

  var fingerState = core.openLegacyFingerExercise({
    exerciseId: "spider_walk",
    durationSec: 90,
    exerciseCount: 0
  });
  assert.strictEqual(fingerState.activeFlow, "legacy_finger_exercise");
  assert.strictEqual(fingerState.activeTab, "practice");
  assert.strictEqual(fingerState.legacyPracticeMode, "finger_exercise");
  assert.strictEqual(fingerState.legacyPracticeDurationSec, 90);
  assert.strictEqual(fingerState.legacyPracticeRemainingSec, 90);
  assert.strictEqual(fingerState.legacyFingerExerciseId, "spider_walk");
  assert.strictEqual(fingerState.legacyFingerExerciseActive, true);
  assert.strictEqual(fingerState.transport.status, "running");

  var completedFingerState = core.completeLegacyFingerExercise({
    exerciseId: "spider_walk",
    durationSec: 90,
    exerciseCount: 3
  });
  assert.strictEqual(completedFingerState.activeFlow, "legacy_finger_exercise");
  assert.strictEqual(completedFingerState.legacyFingerExerciseId, "spider_walk");
  assert.strictEqual(completedFingerState.legacyFingerExerciseActive, false);
  assert.strictEqual(completedFingerState.legacyFingerExerciseCount, 3);
  assert.strictEqual(completedFingerState.legacyPracticeRemainingSec, 0);
  assert.strictEqual(completedFingerState.transport.status, "completed");

  var completedSessionState = core.completeLegacyPracticeSession({
    mode: "chord",
    chordName: "C",
    durationSec: 120
  });
  assert.strictEqual(completedSessionState.activeScreen, "complete");
  assert.strictEqual(completedSessionState.transport.status, "completed");
  assert.strictEqual(completedSessionState.legacyPracticeChordName, "C");

  var completedDrillState = core.completeLegacyPracticeDrill({
    durationSec: 60,
    chordNames: ["C", "G"]
  });
  assert.strictEqual(completedDrillState.activeScreen, "drill_done");
  assert.strictEqual(completedDrillState.transport.status, "completed");
  assert.deepStrictEqual(completedDrillState.legacyDrillChordNames, ["C", "G"]);

  var returnedState = core.returnFromLegacyPracticeFamily({ activeTab: "practice" });
  assert.strictEqual(returnedState.activeScreen, "home");
  assert.strictEqual(returnedState.activeTab, "practice");
  assert.strictEqual(returnedState.transport.status, "idle");

  var repeatedSessionState = core.repeatLegacyPracticeSession({
    mode: "chord",
    chordName: "C",
    durationSec: 120
  });
  assert.strictEqual(repeatedSessionState.activeScreen, "session");
  assert.strictEqual(repeatedSessionState.transport.status, "running");
  assert.strictEqual(repeatedSessionState.legacyPracticeChordName, "C");

  var repeatedDrillState = core.repeatLegacyPracticeDrill({
    durationSec: 60,
    chordNames: ["C", "G"]
  });
  assert.strictEqual(repeatedDrillState.activeScreen, "drill");
  assert.strictEqual(repeatedDrillState.transport.status, "running");
  assert.deepStrictEqual(repeatedDrillState.legacyDrillChordNames, ["C", "G"]);
});

test("SparkCore can sync legacy practice runtime countdown and pause state explicitly", function() {
  var core = createDefaultSparkCore();

  core.openLegacyPracticeSession({
    mode: "chord",
    chordName: "C",
    durationSec: 120
  });

  var tickState = core.syncLegacyPracticeRuntimeState("tick", {
    remainingSec: 91,
    timerActive: true
  });
  assert.strictEqual(tickState.legacyPracticeRemainingSec, 91);
  assert.strictEqual(tickState.legacyPracticeTimerActive, true);
  assert.strictEqual(tickState.transport.status, "running");

  var pauseState = core.syncLegacyPracticeRuntimeState("pause", {
    remainingSec: 91
  });
  assert.strictEqual(pauseState.legacyPracticeRemainingSec, 91);
  assert.strictEqual(pauseState.legacyPracticeTimerActive, false);
  assert.strictEqual(pauseState.transport.status, "paused");

  var resumeState = core.syncLegacyPracticeRuntimeState("resume", {
    remainingSec: 91
  });
  assert.strictEqual(resumeState.legacyPracticeTimerActive, true);
  assert.strictEqual(resumeState.transport.status, "running");
});

test("SparkCore can sync ear training runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var openState = core.openLegacyEarTraining({
    question: "C Major",
    options: ["C Major", "G Major", "A Minor"],
    answer: null,
    score: 1,
    total: 2,
    streak: 1
  });
  assert.strictEqual(openState.activeFlow, "legacy_ear_training");
  assert.strictEqual(openState.activeScreen, "home");
  assert.strictEqual(openState.activeTab, "ear");
  assert.strictEqual(openState.legacyEarTrainQuestion, "C Major");
  assert.deepStrictEqual(openState.legacyEarTrainOptions, ["C Major", "G Major", "A Minor"]);
  assert.strictEqual(openState.legacyEarTrainAnswer, null);
  assert.strictEqual(openState.legacyEarTrainScore, 1);
  assert.strictEqual(openState.legacyEarTrainTotal, 2);
  assert.strictEqual(openState.legacyEarTrainStreak, 1);

  var questionState = core.syncLegacyEarTrainingRuntimeState({
    question: "C Major",
    options: ["C Major", "G Major", "A Minor"],
    answer: null
  });
  assert.strictEqual(questionState.activeFlow, "legacy_ear_training");
  assert.strictEqual(questionState.activeScreen, "home");
  assert.strictEqual(questionState.activeTab, "ear");
  assert.strictEqual(questionState.legacyEarTrainQuestion, "C Major");
  assert.deepStrictEqual(questionState.legacyEarTrainOptions, ["C Major", "G Major", "A Minor"]);
  assert.strictEqual(questionState.legacyEarTrainAnswer, null);

  var answerState = core.syncLegacyEarTrainingRuntimeState({
    answer: "G Major"
  });
  assert.strictEqual(answerState.legacyEarTrainQuestion, "C Major");
  assert.deepStrictEqual(answerState.legacyEarTrainOptions, ["C Major", "G Major", "A Minor"]);
  assert.strictEqual(answerState.legacyEarTrainAnswer, "G Major");
});

test("SparkCore can open and sync strum runtime state explicitly", function() {
  var core = createDefaultSparkCore();
  var pattern = { name: "Island Groove", desc: "Syncopated groove", bpm: 76, pattern: ["D", "D", "U", "U", "D", "U"] };

  var openState = core.openLegacyStrumPattern({ pattern: pattern });
  assert.strictEqual(openState.activeFlow, "legacy_strum_pattern");
  assert.strictEqual(openState.activeScreen, "strum");
  assert.strictEqual(openState.activeTab, "strum");
  assert.deepStrictEqual(openState.legacyStrumPattern, pattern);
  assert.strictEqual(openState.legacyStrumActive, false);
  assert.strictEqual(openState.legacyStrumBeat, -1);
  assert.strictEqual(openState.transport.status, "ready");

  var playState = core.syncLegacyStrumRuntimeState({
    active: true,
    beat: 3
  });
  assert.strictEqual(playState.legacyStrumActive, true);
  assert.strictEqual(playState.legacyStrumBeat, 3);
  assert.strictEqual(playState.transport.status, "running");

  var stopState = core.syncLegacyStrumRuntimeState({
    active: false,
    beat: -1
  });
  assert.strictEqual(stopState.legacyStrumActive, false);
  assert.strictEqual(stopState.legacyStrumBeat, -1);
  assert.strictEqual(stopState.transport.status, "idle");
});

test("SparkCore can sync quiz runtime state explicitly", function() {
  var core = createDefaultSparkCore();
  var question = { name: "C Major", short: "C" };
  var options = [
    { name: "C Major", short: "C" },
    { name: "G Major", short: "G" }
  ];

  var openState = core.openLegacyQuiz({
    question: question,
    options: options,
    answer: null,
    score: 2,
    total: 3,
    streak: 1
  });
  assert.strictEqual(openState.activeFlow, "legacy_quiz");
  assert.strictEqual(openState.activeScreen, "quiz");
  assert.strictEqual(openState.activeTab, "quiz");
  assert.deepStrictEqual(openState.legacyQuizQuestion, question);
  assert.deepStrictEqual(openState.legacyQuizOptions, options);
  assert.strictEqual(openState.legacyQuizAnswer, null);
  assert.strictEqual(openState.legacyQuizScore, 2);
  assert.strictEqual(openState.legacyQuizTotal, 3);
  assert.strictEqual(openState.legacyQuizStreak, 1);

  var answerState = core.syncLegacyQuizRuntimeState({
    answer: "G Major",
    score: 2,
    total: 4,
    streak: 0
  });
  assert.strictEqual(answerState.legacyQuizAnswer, "G Major");
  assert.deepStrictEqual(answerState.legacyQuizOptions, options);
  assert.strictEqual(answerState.legacyQuizTotal, 4);
  assert.strictEqual(answerState.legacyQuizStreak, 0);
});

test("SparkCore can open, sync, and complete legacy daily challenge runtime explicitly", function() {
  var core = createDefaultSparkCore();

  var openState = core.openLegacyDailyChallenge({
    challengeId: "marathon",
    durationSec: 180
  });
  assert.strictEqual(openState.activeFlow, "legacy_daily_challenge");
  assert.strictEqual(openState.activeScreen, "daily");
  assert.strictEqual(openState.activeTab, "daily");
  assert.strictEqual(openState.legacyDailyChallengeId, "marathon");
  assert.strictEqual(openState.legacyDailyRemainingSec, 180);
  assert.strictEqual(openState.legacyDailyTimerActive, true);
  assert.strictEqual(openState.transport.status, "running");

  var tickState = core.syncLegacyDailyRuntimeState("tick", {
    challengeId: "marathon",
    remainingSec: 43,
    durationSec: 180,
    timerActive: true
  });
  assert.strictEqual(tickState.legacyDailyRemainingSec, 43);
  assert.strictEqual(tickState.legacyDailyTimerActive, true);
  assert.strictEqual(tickState.legacyDailyComplete, false);
  assert.strictEqual(tickState.transport.status, "running");

  var completeState = core.completeLegacyDailyChallenge({
    challengeId: "marathon",
    durationSec: 180
  });
  assert.strictEqual(completeState.legacyDailyRemainingSec, 0);
  assert.strictEqual(completeState.legacyDailyTimerActive, false);
  assert.strictEqual(completeState.legacyDailyComplete, true);
  assert.strictEqual(completeState.transport.status, "completed");

  var homeState = core.returnFromLegacyDailyChallenge({ activeTab: "daily" });
  assert.strictEqual(homeState.activeScreen, "home");
  assert.strictEqual(homeState.activeTab, "daily");
  assert.strictEqual(homeState.legacyDailyTimerActive, false);
  assert.strictEqual(homeState.transport.status, "idle");
});

test("SparkCore can open, sync, and complete legacy runner runtime explicitly", function() {
  var core = createDefaultSparkCore();

  var openState = core.openLegacyRunnerGame({
    targetName: "C",
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: 3,
    distance: 0,
    obstacles: []
  });
  assert.strictEqual(openState.activeFlow, "legacy_runner_game");
  assert.strictEqual(openState.activeScreen, "home");
  assert.strictEqual(openState.activeTab, "runner");
  assert.strictEqual(openState.legacyRunnerActive, true);
  assert.strictEqual(openState.legacyRunnerTargetName, "C");
  assert.strictEqual(openState.transport.status, "running");

  var tickState = core.syncLegacyRunnerRuntimeState({
    active: true,
    targetName: "G",
    score: 220,
    combo: 3,
    maxCombo: 5,
    lives: 2,
    distance: 19,
    obstacles: [{ id: 1, name: "G", short: "G", x: 80, isTarget: true, hit: false, result: null }]
  });
  assert.strictEqual(tickState.legacyRunnerTargetName, "G");
  assert.strictEqual(tickState.legacyRunnerScore, 220);
  assert.strictEqual(tickState.legacyRunnerCombo, 3);
  assert.strictEqual(tickState.legacyRunnerLives, 2);
  assert.strictEqual(tickState.legacyRunnerDistance, 19);
  assert.strictEqual(tickState.transport.status, "running");

  var completeState = core.completeLegacyRunnerGame({
    targetName: "G",
    score: 220,
    combo: 0,
    maxCombo: 5,
    lives: 0,
    distance: 19,
    obstacles: [],
    results: { score: 220, maxCombo: 5, distance: 19 }
  });
  assert.strictEqual(completeState.legacyRunnerActive, false);
  assert.strictEqual(completeState.legacyRunnerScore, 220);
  assert.deepStrictEqual(completeState.legacyRunnerResults, { score: 220, maxCombo: 5, distance: 19 });
  assert.strictEqual(completeState.transport.status, "completed");
});

test("SparkCore can open, sync, and complete legacy rhythm runtime explicitly", function() {
  var core = createDefaultSparkCore();
  var beats = [{ time: 0, type: "D", hit: false, result: null }];

  var openState = core.openLegacyRhythmGame({
    beats: beats,
    score: 0,
    combo: 0,
    maxCombo: 0,
    startTimeMs: 1000
  });
  assert.strictEqual(openState.activeFlow, "legacy_rhythm_game");
  assert.strictEqual(openState.activeScreen, "home");
  assert.strictEqual(openState.activeTab, "rhythm");
  assert.strictEqual(openState.legacyRhythmActive, true);
  assert.strictEqual(openState.transport.status, "running");

  var tickState = core.syncLegacyRhythmRuntimeState({
    active: true,
    beats: [{ time: 0, type: "D", hit: true, result: "perfect" }],
    score: 175,
    combo: 2,
    maxCombo: 4,
    startTimeMs: 1000
  });
  assert.strictEqual(tickState.legacyRhythmScore, 175);
  assert.strictEqual(tickState.legacyRhythmCombo, 2);
  assert.strictEqual(tickState.legacyRhythmMaxCombo, 4);
  assert.strictEqual(tickState.transport.status, "running");

  var completeState = core.completeLegacyRhythmGame({
    beats: [{ time: 0, type: "D", hit: true, result: "perfect" }],
    score: 175,
    combo: 0,
    maxCombo: 4,
    startTimeMs: 1000,
    results: { score: 175, accuracy: 100, maxCombo: 4, total: 1, hits: 1 }
  });
  assert.strictEqual(completeState.legacyRhythmActive, false);
  assert.strictEqual(completeState.legacyRhythmScore, 175);
  assert.deepStrictEqual(completeState.legacyRhythmResults, { score: 175, accuracy: 100, maxCombo: 4, total: 1, hits: 1 });
  assert.strictEqual(completeState.transport.status, "completed");
});

test("SparkCore can sync tuner runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var activeState = core.syncTunerRuntimeState({
    active: true,
    note: "A",
    freq: 440,
    cents: 2,
    error: null
  });
  assert.strictEqual(activeState.tunerActive, true);
  assert.strictEqual(activeState.tunerNote, "A");
  assert.strictEqual(activeState.tunerFreq, 440);
  assert.strictEqual(activeState.tunerCents, 2);
  assert.strictEqual(activeState.tunerError, null);

  var errorState = core.syncTunerRuntimeState({
    active: false,
    note: null,
    freq: 0,
    cents: 0,
    error: "Microphone access denied"
  });
  assert.strictEqual(errorState.tunerActive, false);
  assert.strictEqual(errorState.tunerError, "Microphone access denied");
});

test("SparkCore can sync stem player runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var activeState = core.syncStemPlayerRuntimeState({
    playing: true,
    currentTime: 12.5,
    duration: 96
  });
  assert.strictEqual(activeState.stemPlaying, true);
  assert.strictEqual(activeState.stemCurrentTime, 12.5);
  assert.strictEqual(activeState.stemDuration, 96);

  var idleState = core.syncStemPlayerRuntimeState({
    playing: false,
    currentTime: 0,
    duration: 96
  });
  assert.strictEqual(idleState.stemPlaying, false);
  assert.strictEqual(idleState.stemCurrentTime, 0);
  assert.strictEqual(idleState.stemDuration, 96);
});

test("SparkCore can sync audio input runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var activeState = core.syncAudioInputRuntimeState({
    devices: [{ id: "usb", name: "USB Guitar" }],
    inputId: "usb",
    testingId: "usb",
    testLevel: 42
  });
  assert.deepStrictEqual(activeState.audioInputDevices, [{ id: "usb", name: "USB Guitar" }]);
  assert.strictEqual(activeState.audioInputId, "usb");
  assert.strictEqual(activeState.audioTestingId, "usb");
  assert.strictEqual(activeState.audioTestLevel, 42);

  var idleState = core.syncAudioInputRuntimeState({
    devices: [{ id: "default", name: "Default Input" }],
    inputId: "",
    testingId: "",
    testLevel: 0
  });
  assert.deepStrictEqual(idleState.audioInputDevices, [{ id: "default", name: "Default Input" }]);
  assert.strictEqual(idleState.audioInputId, "");
  assert.strictEqual(idleState.audioTestingId, "");
  assert.strictEqual(idleState.audioTestLevel, 0);
});

test("SparkCore can sync metronome runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var activeState = core.syncMetronomeRuntimeState({
    active: true,
    bpm: 96,
    beat: 2,
    beatsPerBar: 4
  });
  assert.strictEqual(activeState.metronomeActive, true);
  assert.strictEqual(activeState.metronomeBpm, 96);
  assert.strictEqual(activeState.metronomeBeat, 2);
  assert.strictEqual(activeState.metronomeBeatsPerBar, 4);

  var idleState = core.syncMetronomeRuntimeState({
    active: false,
    bpm: 72,
    beat: 0,
    beatsPerBar: 3
  });
  assert.strictEqual(idleState.metronomeActive, false);
  assert.strictEqual(idleState.metronomeBpm, 72);
  assert.strictEqual(idleState.metronomeBeat, 0);
  assert.strictEqual(idleState.metronomeBeatsPerBar, 3);
});

test("SparkCore can sync chord detect runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var activeState = core.syncChordDetectRuntimeState({
    active: true,
    notes: ["C", "E", "G"],
    match: 82,
    error: null
  });
  assert.strictEqual(activeState.chordDetectActive, true);
  assert.deepStrictEqual(activeState.chordDetectNotes, ["C", "E", "G"]);
  assert.strictEqual(activeState.chordDetectMatch, 82);
  assert.strictEqual(activeState.chordDetectError, null);

  var errorState = core.syncChordDetectRuntimeState({
    active: false,
    notes: [],
    match: -1,
    error: "Microphone access denied"
  });
  assert.strictEqual(errorState.chordDetectActive, false);
  assert.deepStrictEqual(errorState.chordDetectNotes, []);
  assert.strictEqual(errorState.chordDetectMatch, -1);
  assert.strictEqual(errorState.chordDetectError, "Microphone access denied");
});

test("legacy session and drill pages can fall back to SparkCore practice runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.VOICINGS = {};
  global._prevChordKey = "";
  global.ringHTML = function(_pct, _size, _stroke, _color, inner) { return inner; };
  global.getExpectedNotes = function() { return []; };
  global._buildChordCheckInner = function() { return ""; };
  global.escHTML = function(value) { return String(value); };
  global.tierBadgeHTML = function() { return ""; };
  global.getTransitionTip = function() { return null; };
  global.clickableDiv = function() { return ""; };
  global.strumHandSVG = function() { return ""; };
  global.strumHTML = function() { return ""; };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [
              { name: "C", short: "C" },
              { name: "G", short: "G" }
            ],
            LC: { 1: "#fff" }
          };
        },
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.selectedVoicing = 0;
  S.level = 1;
  S.metronomeBpm = 80;
  S._metroBeats = 4;
  S._metroBeat = 0;
  S.metronomeOn = false;
  S.chordDetectOn = false;
  S.chordDetectErr = "";
  S.practiceIntention = "";
  S.timerActive = true;
  S.drillIdx = 0;
  S.drillSwitches = 0;
  S.drillAdaptiveBpm = 60;
  S.currentChord = null;
  S.timer = undefined;
  S.drillChords = [];
  S.drillTimer = undefined;
  S.dailyChallenge = {
    id: "marathon",
    title: "Marathon",
    desc: "Keep going",
    icon: "M",
    xp: 40
  };
  S.dailyTimer = undefined;
  S.dailyComplete = undefined;

  eval(loadJS("js/pages/session.js"));

  core.openLegacyPracticeSession({ mode: "chord", chordName: "C", durationSec: 120 });
  var sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf(">C<") >= 0);
  assert.ok(sessionHtml.indexOf("2:00") >= 0);

  S.timer = undefined;
  S.timerActive = undefined;
  core.syncLegacyPracticeRuntimeState("pause", { remainingSec: 91 });
  sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf("1:31") >= 0);
  assert.ok(sessionHtml.indexOf("Resume") >= 0);

  core.openLegacyPracticeDrill({ durationSec: 60, chordNames: ["C", "G"] });
  var drillHtml = drillPage();
  assert.ok(drillHtml.indexOf("Switch Drill") >= 0);
  assert.ok(drillHtml.indexOf(">C<") >= 0);
  assert.ok(drillHtml.indexOf(">G<") >= 0);

  S.drillTimer = undefined;
  core.syncLegacyPracticeRuntimeState("tick", {
    remainingSec: 27,
    timerActive: true,
    mode: "drill",
    chordNames: ["C", "G"],
    durationSec: 60
  });
  drillHtml = drillPage();
  assert.ok(drillHtml.indexOf("27s") >= 0);

  core.openLegacyDailyChallenge({ challengeId: "marathon", durationSec: 180 });
  core.syncLegacyDailyRuntimeState("tick", {
    challengeId: "marathon",
    remainingSec: 43,
    durationSec: 180,
    timerActive: true
  });
  var dailyHtml = dailyPage();
  assert.ok(dailyHtml.indexOf("43s") >= 0);

  S.dailyTimer = undefined;
  S.dailyComplete = undefined;
  core.completeLegacyDailyChallenge({ challengeId: "marathon", durationSec: 180 });
  dailyHtml = dailyPage();
  assert.ok(dailyHtml.indexOf("dailyDoneHome") >= 0);
});

test("runner pages can fall back to SparkCore runner runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [
              { name: "C", short: "C" },
              { name: "G", short: "G" }
            ]
          };
        },
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.runnerActive = undefined;
  S.runnerTarget = null;
  S.runnerScore = undefined;
  S.runnerCombo = undefined;
  S.runnerLives = undefined;
  S.runnerDistance = undefined;
  S.runnerObstacles = undefined;
  S.runnerResults = null;
  S.runnerHighScore = 100;

  eval(loadJS("js/pages/games.js"));

  core.openLegacyRunnerGame({
    targetName: "C",
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: 3,
    distance: 0,
    obstacles: []
  });
  core.syncLegacyRunnerRuntimeState({
    active: true,
    targetName: "G",
    score: 220,
    combo: 3,
    maxCombo: 5,
    lives: 2,
    distance: 19,
    obstacles: [{ id: 1, name: "G", short: "G", x: 80, isTarget: true, hit: false, result: null }]
  });
  var runnerHtml = runnerGamePage();
  assert.ok(runnerHtml.indexOf(">220<") >= 0);
  assert.ok(runnerHtml.indexOf(">G<") >= 0);
  assert.ok(runnerHtml.indexOf("runner-obstacle") >= 0);

  S.runnerResults = null;
  core.completeLegacyRunnerGame({
    targetName: "G",
    score: 220,
    combo: 0,
    maxCombo: 5,
    lives: 0,
    distance: 19,
    obstacles: [],
    results: { score: 220, maxCombo: 5, distance: 19 }
  });
  var resultsHtml = runnerResultsPage();
  assert.ok(resultsHtml.indexOf("Game Over!") >= 0);
  assert.ok(resultsHtml.indexOf(">220<") >= 0);
});

test("rhythm pages can fall back to SparkCore rhythm runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  S.rhythmActive = undefined;
  S.rhythmBeats = undefined;
  S.rhythmScore = undefined;
  S.rhythmCombo = undefined;
  S.rhythmMaxCombo = undefined;
  S.rhythmStartTime = undefined;
  S.rhythmResults = null;
  S.rhythmBpm = 90;

  eval(loadJS("js/pages/games.js"));

  var rhythmStart = performance.now();

  core.openLegacyRhythmGame({
    beats: [{ time: 1000, type: "D", hit: false, result: null }],
    score: 0,
    combo: 0,
    maxCombo: 0,
    startTimeMs: rhythmStart
  });
  core.syncLegacyRhythmRuntimeState({
    active: true,
    beats: [{ time: 1000, type: "D", hit: false, result: null }],
    score: 175,
    combo: 2,
    maxCombo: 4,
    startTimeMs: rhythmStart
  });
  var rhythmHtml = rhythmGamePage();
  assert.ok(rhythmHtml.indexOf(">175<") >= 0);
  assert.ok(rhythmHtml.indexOf(">2x<") >= 0);
  assert.ok(rhythmHtml.indexOf("rhythm-beat") >= 0);

  S.rhythmResults = null;
  core.completeLegacyRhythmGame({
    beats: [{ time: 0, type: "D", hit: true, result: "perfect" }],
    score: 175,
    combo: 0,
    maxCombo: 4,
    startTimeMs: performance.now(),
    results: { score: 175, accuracy: 100, maxCombo: 4, total: 1, hits: 1 }
  });
  var resultsHtml = rhythmResultsPage();
  assert.ok(resultsHtml.indexOf("Results!") >= 0);
  assert.ok(resultsHtml.indexOf(">175<") >= 0);
});

test("tuner page can fall back to SparkCore tuner runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            STRINGS: [
              { note: "E", freq: 82.4 },
              { note: "A", freq: 110.0 },
              { note: "D", freq: 146.8 },
              { note: "G", freq: 196.0 },
              { note: "B", freq: 246.9 },
              { note: "e", freq: 329.6 }
            ]
          };
        }
      };
    }
  };
  S.tunerActive = undefined;
  S.tunerNote = undefined;
  S.tunerFreq = undefined;
  S.tunerCents = undefined;
  S.tunerErr = undefined;
  S.audioInputDevices = [];
  S.audioInputId = "";
  S.audioTestingId = null;
  S.audioTestLevel = 0;

  eval(loadJS("js/pages/tools.js"));

  core.syncTunerRuntimeState({
    active: true,
    note: "A",
    freq: 440,
    cents: 2,
    error: null
  });
  var tunerHtml = tunerTab();
  assert.ok(tunerHtml.indexOf(">A<") >= 0);
  assert.ok(tunerHtml.indexOf("440 Hz") >= 0);
  assert.ok(tunerHtml.indexOf("In Tune!") >= 0);

  S.tunerActive = undefined;
  S.tunerNote = undefined;
  S.tunerFreq = undefined;
  S.tunerCents = undefined;
  S.tunerErr = undefined;
  core.syncTunerRuntimeState({
    active: false,
    note: null,
    freq: 0,
    cents: 0,
    error: "Microphone access denied"
  });
  tunerHtml = tunerTab();
  assert.ok(tunerHtml.indexOf("Microphone access denied") >= 0);
});

test("stem player page can fall back to SparkCore stem runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.formatTime = function(seconds) {
    seconds = Math.max(0, Math.floor(seconds || 0));
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  };
  global._isStemSolo = function() { return false; };
  global.STEM_NAMES = ["vocals", "drums"];
  global.STEM_COLORS = { vocals: "#f00", drums: "#0f0" };
  global.STEM_ICONS = { vocals: "V", drums: "D" };
  S.stemFile = { fileName: "mix.wav" };
  S.stemPaths = { vocals: "vocals.wav", drums: "drums.wav" };
  S.stemToggles = { vocals: true, drums: true };
  S.stemVolume = 0.8;
  S.stemPlaying = undefined;
  S.stemCurrentTime = undefined;
  S.stemDuration = undefined;

  eval(loadJS("js/pages/songs.js"));

  core.syncStemPlayerRuntimeState({
    playing: true,
    currentTime: 12.5,
    duration: 96
  });
  var stemsHtml = stemsPage();
  assert.ok(stemsHtml.indexOf("0:12 / 1:36") >= 0);
  assert.ok(stemsHtml.indexOf("Pause") >= 0);
});

test("tools page audio input section can fall back to SparkCore audio runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            STRINGS: [
              { note: "E", freq: 82.4 },
              { note: "A", freq: 110.0 }
            ]
          };
        }
      };
    }
  };
  S.tunerActive = false;
  S.tunerNote = null;
  S.tunerFreq = 0;
  S.tunerCents = 0;
  S.tunerErr = "";
  S.audioInputDevices = [];
  S.audioInputId = undefined;
  S.audioTestingId = undefined;
  S.audioTestLevel = undefined;

  eval(loadJS("js/pages/tools.js"));

  core.syncAudioInputRuntimeState({
    devices: [{ id: "usb", name: "USB Guitar" }],
    inputId: "usb",
    testingId: "usb",
    testLevel: 42
  });
  var toolsHtml = tunerTab();
  assert.ok(toolsHtml.indexOf("USB Guitar") >= 0);
  assert.ok(toolsHtml.indexOf("width:42%") >= 0);
  assert.ok(toolsHtml.indexOf("Signal detected") >= 0);
});

test("session page chord check can fall back to SparkCore chord detect runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.VOICINGS = {};
  global._prevChordKey = "";
  global.ringHTML = function(_pct, _size, _stroke, _color, inner) { return inner; };
  global.getExpectedNotes = function() { return ["C", "E", "G"]; };
  global.getCoachFeedback = function() { return []; };
  global.escHTML = function(value) { return String(value); };
  global.tierBadgeHTML = function() { return ""; };
  global.getTransitionTip = function() { return null; };
  global.clickableDiv = function() { return ""; };
  global.strumHandSVG = function() { return ""; };
  global.strumHTML = function() { return ""; };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [{ name: "C", short: "C" }],
            LC: { 1: "#fff" }
          };
        },
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.selectedVoicing = 0;
  S.level = 1;
  S.currentChord = { name: "C", short: "C" };
  S.metronomeBpm = 80;
  S._metroBeats = 4;
  S._metroBeat = 0;
  S.metronomeOn = false;
  S.practiceIntention = "";
  S.timer = 120;
  S.timerActive = true;
  S.chordDetectOn = undefined;
  S.chordDetectErr = undefined;
  S.detectedNotes = undefined;
  S.chordMatch = undefined;

  eval(loadJS("js/pages/shared.js"));
  eval(loadJS("js/pages/session.js"));

  core.syncChordDetectRuntimeState({
    active: true,
    notes: ["C", "E", "G"],
    match: 82,
    error: null
  });
  var sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf("Stop") >= 0);
  assert.ok(sessionHtml.indexOf("82%") >= 0);
  assert.ok(sessionHtml.indexOf("C") >= 0);

  S.chordDetectOn = undefined;
  S.chordDetectErr = undefined;
  S.detectedNotes = undefined;
  S.chordMatch = undefined;
  core.syncChordDetectRuntimeState({
    active: false,
    notes: [],
    match: -1,
    error: "Microphone access denied"
  });
  sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf("Microphone access denied") >= 0);
  assert.ok(sessionHtml.indexOf("Listen") >= 0);
});

test("session page metronome card can fall back to SparkCore metronome runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.VOICINGS = {};
  global._prevChordKey = "";
  global.ringHTML = function(_pct, _size, _stroke, _color, inner) { return inner; };
  global.getExpectedNotes = function() { return []; };
  global._buildChordCheckInner = function() { return ""; };
  global.getCoachFeedback = function() { return []; };
  global.escHTML = function(value) { return String(value); };
  global.tierBadgeHTML = function() { return ""; };
  global.getTransitionTip = function() { return null; };
  global.clickableDiv = function() { return ""; };
  global.strumHandSVG = function() { return ""; };
  global.strumHTML = function() { return ""; };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [{ name: "C", short: "C" }],
            LC: { 1: "#fff" }
          };
        },
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.selectedVoicing = 0;
  S.level = 1;
  S.currentChord = { name: "C", short: "C" };
  S.practiceIntention = "";
  S.timer = 120;
  S.timerActive = true;
  S.metronomeOn = undefined;
  S.metronomeBpm = undefined;
  S._metroBeat = undefined;
  S._metroBeats = undefined;
  S.chordDetectOn = false;
  S.chordDetectErr = "";

  eval(loadJS("js/pages/session.js"));

  core.syncMetronomeRuntimeState({
    active: true,
    bpm: 96,
    beat: 2,
    beatsPerBar: 4
  });
  var sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf(">96<") >= 0);
  assert.ok(sessionHtml.indexOf("Stop") >= 0);
  assert.ok(sessionHtml.indexOf("metro-dot active") >= 0);
});

test("complete page can fall back to SparkCore player and progress snapshots", function() {
  window.sparkCore = {
    getActiveSessionView: function() {
      return {
        player: { streak: 9 },
        progress: { chordProgress: { C: 88 } }
      };
    }
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [{ name: "C", short: "C" }]
          };
        }
      };
    }
  };
  S.currentChord = { name: "C", short: "C" };
  S.streak = undefined;
  S.chordProgress = {};
  S.xpToast = { amount: 15, time: 1 };

  eval(loadJS("js/pages/session.js"));

  var completeHtml = completePage();
  assert.ok(completeHtml.indexOf("+15") >= 0);
  assert.ok(completeHtml.indexOf("&#128293;9") >= 0);
  assert.ok(completeHtml.indexOf(">88%<") >= 0);
});

test("sv2 home dashboard can fall back to SparkCore player and progress snapshots", function() {
  window.sparkCore = {
    getActiveSessionView: function() {
      return {
        player: { xp: 88, level: 4, streak: 7 },
        progress: { chordProgress: { C: 100, G: 40 } }
      };
    }
  };
  global.document = { body: { classList: { contains: function() { return true; } } } };
  global.SparkTheme = {
    get: function() { return {}; },
    getColor: function() { return "#4ECDC4"; }
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        id: "chordspark",
        instrument: "guitar",
        icon: "G",
        name: "Chord",
        tabs: ["practice", "songs", "drill"],
        getData: function() {
          return {
            LN: { 4: "Stage 4" },
            ALL_CHORDS: [{ name: "C" }, { name: "G" }],
            LC: { 1: "#111", 4: "#45B7D1" },
            CHORDS: {
              1: [{ name: "C", short: "C" }, { name: "G", short: "G" }]
            }
          };
        }
      };
    },
    getAll: function() {
      return [{ id: "chordspark", instrument: "guitar", available: true }];
    }
  };
  global.escHTML = function(value) { return String(value); };
  S.level = 1;
  S.selectedLevel = 1;
  S.todayPracticeSeconds = 0;
  S.dailyGoalMinutes = 10;
  S.goalReachedToday = false;
  S.goalStreak = 0;

  eval(loadJS("js/pages/practice.js"));

  var homeHtml = sv2HomeDashboard();
  assert.ok(homeHtml.indexOf("88 XP") >= 0);
  assert.ok(homeHtml.indexOf("Stage 4") >= 0);
  assert.ok(homeHtml.indexOf("1/2 chords") >= 0);
});

test("sv2 home dashboard merges missing player session counts from fallback state", function() {
  window.sparkCore = {
    getActiveSessionView: function() {
      return {
        player: { xp: 12, level: 1, streak: 0 },
        progress: { chordProgress: {} }
      };
    }
  };
  global.document = { body: { classList: { contains: function() { return true; } } } };
  global.SparkTheme = {
    get: function() { return {}; },
    getColor: function() { return "#4ECDC4"; }
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        id: "chordspark",
        instrument: "guitar",
        icon: "G",
        name: "Chord",
        tabs: ["practice"],
        getData: function() {
          return {
            LN: { 1: "Stage 1" },
            ALL_CHORDS: [],
            LC: { 1: "#111" },
            CHORDS: { 1: [] }
          };
        }
      };
    },
    getAll: function() {
      return [{ id: "chordspark", instrument: "guitar", available: true }];
    }
  };
  global.escHTML = function(value) { return String(value); };
  S.level = 1;
  S.playerLevel = 1;
  S.selectedLevel = 1;
  S.sessions = 7;
  S.todayPracticeSeconds = 0;
  S.dailyGoalMinutes = 10;
  S.goalReachedToday = false;
  S.goalStreak = 0;

  eval(loadJS("js/pages/practice.js"));

  var homeHtml = sv2HomeDashboard();
  assert.ok(homeHtml.indexOf("undefined") === -1);
});

test("sv2 home dashboard resolves thin active instrument ids before requesting a theme", function() {
  var requestedThemeInstrument = null;
  window.sparkCore = {
    getActiveSessionView: function() {
      return {
        player: { xp: 12, level: 1, streak: 0, sessions: 1 },
        progress: { chordProgress: {} }
      };
    }
  };
  global.document = { body: { classList: { contains: function() { return true; } } } };
  global.SparkTheme = {
    get: function(instrument) { requestedThemeInstrument = instrument; return {}; },
    getColor: function() { return "#4ECDC4"; }
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        id: "pianospark",
        icon: "P",
        name: "Piano",
        tabs: ["practice"],
        getData: function() {
          return {
            LN: { 1: "Stage 1" },
            ALL_CHORDS: [],
            LC: { 1: "#111" },
            CHORDS: { 1: [] }
          };
        }
      };
    },
    getAll: function() {
      return [{ id: "pianospark", instrument: "piano", available: true }];
    }
  };
  global.escHTML = function(value) { return String(value); };
  S.level = 1;
  S.playerLevel = 1;
  S.selectedLevel = 1;
  S.sessions = 1;
  S.todayPracticeSeconds = 0;
  S.dailyGoalMinutes = 10;
  S.goalReachedToday = false;
  S.goalStreak = 0;

  eval(loadJS("js/pages/practice.js"));

  sv2HomeDashboard();
  assert.strictEqual(requestedThemeInstrument, "piano");
});

test("practice home level labels fall back to generic names when LN entries are missing", function() {
  eval(loadJS("js/pages/practice.js"));
  assert.strictEqual(getPracticeLevelName({ 1: "First Groove" }, 7), "Level 7");
  assert.strictEqual(getPracticeLevelName({ 1: "First Groove" }, 1), "First Groove");
});

test("practice tab renders a loading card when instrument curriculum data is unavailable", function() {
  window.sparkCore = null;
  global.escHTML = function(value) { return String(value); };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() { return {}; },
        ui: {}
      };
    },
    getAll: function() { return []; }
  };

  eval(loadJS("js/pages/practice.js"));

  var html = practiceTab();
  assert.ok(html.indexOf("Loading practice dashboard") >= 0);
});

test("startPracticeItem launches the matching daily practice item", function() {
  window.sparkCore = null;
  global.escHTML = function(value) { return String(value); };
  S.practicePlan = {
    items: [
      { id: "guided_session_1", type: "guided_session", completed: false }
    ]
  };

  eval(loadJS("js/pages/practice.js"));

  var launchedItem = null;
  global.launchPracticeItem = function(item) {
    launchedItem = item;
  };

  startPracticeItem("guided_session_1");

  assert.ok(launchedItem);
  assert.strictEqual(launchedItem.id, "guided_session_1");
  assert.strictEqual(launchedItem.type, "guided_session");
  assert.strictEqual(window.startPracticeItem, startPracticeItem);
});

test("startPracticeItem surfaces feedback when the plan or launcher is unavailable", function() {
  window.sparkCore = null;
  global.escHTML = function(value) { return String(value); };
  eval(loadJS("js/pages/practice.js"));

  startPracticeItem("guided_session_1");
  assert.deepStrictEqual(toasts, ["That practice item couldn't be started right now."]);

  toasts.length = 0;
  S.practicePlan = {
    items: [
      { id: "guided_session_1", type: "guided_session", completed: false }
    ]
  };
  global.launchPracticeItem = function() {
    return false;
  };

  startPracticeItem("guided_session_1");
  assert.deepStrictEqual(toasts, ["That practice item couldn't be started right now."]);
});

test("startPracticeItem fails safely when a core-owned plan is active but the legacy bridge is unavailable", function() {
  var core = createDefaultSparkCore();
  var originalBridge = window.SparkPracticeBridge;
  var originalLaunchPracticeItem = global.launchPracticeItem;
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.launchPracticeItem = function() {
    throw new Error("should not launch from stale cached practice plan");
  };
  S.practicePlan = {
    items: [
      { id: "stale_practice_item", type: "guided_session", completed: false }
    ]
  };
  try {
    core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
    window.SparkPracticeBridge = undefined;
    eval(loadJS("js/pages/practice.js"));

    startPracticeItem("stale_practice_item");
    assert.deepStrictEqual(toasts, ["That practice item couldn't be started right now."]);
  } finally {
    window.SparkPracticeBridge = originalBridge;
    global.launchPracticeItem = originalLaunchPracticeItem;
  }
});

test("practice page falls back gracefully when a core-owned plan is active but the legacy bridge is unavailable", function() {
  var core = createDefaultSparkCore();
  var originalBridge = window.SparkPracticeBridge;
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.getPracticeStats = function() {
    return { streak: 0, todayMinutes: 0, totalMinutes: 0 };
  };
  try {
    core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
    window.SparkPracticeBridge = undefined;
    eval(loadJS("js/pages/practice.js"));

    var html = practicePage();
    assert.ok(html.indexOf("Today's Practice Plan") >= 0);
    assert.ok(html.indexOf("No practice plan is available right now.") >= 0);
  } finally {
    window.SparkPracticeBridge = originalBridge;
  }
});

test("shared plan page falls back gracefully when a core-owned plan is active but the legacy bridge is unavailable", function() {
  var core = createDefaultSparkCore();
  var originalBridge = window.SparkPracticeBridge;
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  try {
    core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
    window.SparkPracticeBridge = undefined;
    eval(loadJS("js/pages/plan.js"));

    var html = planPage();
    assert.ok(html.indexOf("Today's Practice Plan") >= 0);
    assert.ok(html.indexOf("No practice plan is available right now.") >= 0);
  } finally {
    window.SparkPracticeBridge = originalBridge;
  }
});

test("piano plan page renders a safe empty state when no plan is available", function() {
  global.escHTML = function(value) { return String(value); };
  global.ensurePracticePlan = function() { return null; };
  eval(loadJS("js/instruments/piano/pages/plan.js"));

  var html = pianoPlanPage();
  assert.ok(html.indexOf("Today's Practice Plan") >= 0);
  assert.ok(html.indexOf("No practice plan is available right now.") >= 0);
});

test("practice and plan buttons route practice item launches through shared actions", function() {
  assert.ok(loadJS("js/pages/practice.js").indexOf("onclick=\"act(\\'startPracticeItem\\'") >= 0);
  assert.ok(loadJS("js/pages/plan.js").indexOf("onclick=\"act(\\'startPracticeItem\\'") >= 0);
  assert.ok(loadJS("js/instruments/piano/pages/practice.js").indexOf("onclick=\"act(\\'startPracticeItem\\'") >= 0);
  assert.ok(loadJS("js/instruments/piano/pages/plan.js").indexOf("onclick=\"act(\\'startPracticeItem\\'") >= 0);
});

test("shared app dispatcher keeps start_guided_session wired for non-piano guided launches", function() {
  assert.ok(loadJS("js/app.js").indexOf('if(a==="start_guided_session")') >= 0);
});

test("shared app dispatcher keeps ear training and drill actions wired for shared pages", function() {
  var appSource = loadJS("js/app.js");
  assert.ok(appSource.indexOf('if(a==="start_ear")') >= 0);
  assert.ok(appSource.indexOf('if(a==="startEarTrain")') >= 0);
  assert.ok(appSource.indexOf('if(a==="startDrill")') >= 0);
  assert.ok(appSource.indexOf('if(a==="practiceSkillNow")') >= 0);
  assert.ok(appSource.indexOf('if(a==="drillSwitch")') >= 0);
  assert.ok(appSource.indexOf('if(a==="repeatLegacyPracticeDrill")') >= 0);
  assert.ok(appSource.indexOf('if(a==="repeatLegacyPracticeSession")') >= 0);
});

test("shared app performance launch paths mirror hydrated selection payloads into legacy song state", function() {
  var appSource = loadJS("js/app.js");
  assert.ok(appSource.indexOf('var sharedSelectionRequest = openPerformanceSongSelectionRequest({') >= 0);
  assert.ok(appSource.indexOf('var selectedSongData = SONGS[sgIdx];') >= 0);
  assert.ok(appSource.indexOf('if (sharedSelectionRequest && sharedSelectionRequest.songData) {') >= 0);
  assert.ok(appSource.indexOf('selectedSongData = sharedSelectionRequest.songData;') >= 0);
  assert.ok(appSource.indexOf('appWrite("performSongData", selectedSongData);') >= 0);
  assert.ok(appSource.indexOf('appWrite("performSongId", selectedSongId);') >= 0);
  assert.ok(appSource.indexOf('var planSelectionRequest = openPerformanceSongSelectionRequest({') >= 0);
  assert.ok(appSource.indexOf('if(!planSelectionRequest || !planSelectionRequest.songData){') >= 0);
  assert.ok(appSource.indexOf('var techniqueSelectionRequest = openPerformanceSongSelectionRequest({') >= 0);
  assert.ok(appSource.indexOf('if(!techniqueSelectionRequest || !techniqueSelectionRequest.songData){') >= 0);
  assert.ok(appSource.indexOf('appWrite("performSongData", planSelectionRequest.songData || null);') >= 0);
});

test("finger exercise card can fall back to SparkCore finger exercise runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.FINGER_EXERCISES = [
    { id: "spider_walk", name: "Spider Walk", desc: "Walk each finger in order.", duration: 90, frequency: "Daily", tier: 1, goal: "Clean finger independence" }
  ];
  S.fingerExActive = undefined;
  S.fingerExId = undefined;
  S.fingerExTimer = undefined;
  S.fingerStats = {};

  eval(loadJS("js/pages/shared.js"));

  core.openLegacyFingerExercise({
    exerciseId: "spider_walk",
    durationSec: 90,
    exerciseCount: 0
  });
  var cardHtml = fingerExerciseCard();
  assert.ok(cardHtml.indexOf("Spider Walk") >= 0);
  assert.ok(cardHtml.indexOf("1:30") >= 0);
  assert.ok(cardHtml.indexOf("Stop") >= 0);

  S.fingerExActive = undefined;
  S.fingerExId = undefined;
  S.fingerExTimer = undefined;
  core.completeLegacyFingerExercise({
    exerciseId: "spider_walk",
    durationSec: 90,
    exerciseCount: 3
  });
  cardHtml = fingerExerciseCard();
  assert.ok(cardHtml.indexOf("3x") >= 0);
});

test("strum page can fall back to SparkCore strum runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.strumHandSVG = function(direction, active) { return "<div>" + direction + ":" + active + "</div>"; };
  global.strumHTML = function(pattern, beat) { return "<div>" + pattern.join("-") + "|" + beat + "</div>"; };
  S.selectedStrum = undefined;
  S.strumActive = undefined;
  S._strumBeat = undefined;
  S.strumTone = "classic";

  eval(loadJS("js/pages/session.js"));

  core.openLegacyStrumPattern({
    pattern: { name: "Island Groove", desc: "Syncopated groove", bpm: 76, pattern: ["D", "D", "U", "U", "D", "U"] }
  });
  core.syncLegacyStrumRuntimeState({
    active: true,
    beat: 2
  });
  var strumHtml = strumDetailPage();
  assert.ok(strumHtml.indexOf("Island Groove") >= 0);
  assert.ok(strumHtml.indexOf("76 BPM") >= 0);
  assert.ok(strumHtml.indexOf("D-D-U-U-D-U|2") >= 0);
  assert.ok(strumHtml.indexOf("Stop") >= 0);
});

test("quiz page can fall back to SparkCore quiz runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.clickableDiv = function() { return ""; };
  global.SparkInstruments = {
    getActive: function() {
      return {
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.quizQ = undefined;
  S.quizOpts = undefined;
  S.quizAns = undefined;
  S.quizScore = 2;
  S.quizTotal = 3;
  S.quizStreak = 1;

  eval(loadJS("js/pages/session.js"));

  core.syncLegacyQuizRuntimeState({
    question: { name: "C Major", short: "C" },
    options: [
      { name: "C Major", short: "C" },
      { name: "G Major", short: "G" }
    ],
    answer: "G Major",
    score: 2,
    total: 3,
    streak: 1
  });
  var quizHtml = quizPage();
  assert.ok(quizHtml.indexOf("C Major?") >= 0);
  assert.ok(quizHtml.indexOf("2/3") >= 0);
  assert.ok(quizHtml.indexOf("G Major") >= 0);
  assert.ok(quizHtml.indexOf("Not quite!") >= 0);
});

test("quiz tab can fall back to SparkCore quiz score state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  S.quizCorrect = undefined;

  eval(loadJS("js/pages/practice.js"));

  core.syncLegacyQuizRuntimeState({
    score: 7,
    total: 10,
    streak: 2
  });
  var quizTabHtml = quizTab();
  assert.ok(quizTabHtml.indexOf("Correct: <strong>7</strong>") >= 0);
});

test("ear training page can fall back to SparkCore ear training runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  S.earTrainQ = undefined;
  S.earTrainOpts = undefined;
  S.earTrainAns = undefined;
  S.earTrainScore = 3;
  S.earTrainTotal = 5;
  S.earTrainStreak = 2;

  eval(loadJS("js/pages/practice.js"));

  core.syncLegacyEarTrainingRuntimeState({
    question: "C Major",
    options: ["C Major", "G Major", "A Minor"],
    answer: null,
    score: 3,
    total: 5,
    streak: 2
  });
  var activeHtml = earTrainTab();
  assert.ok(activeHtml.indexOf("What chord is this?") >= 0);
  assert.ok(activeHtml.indexOf("C Major") >= 0);
  assert.ok(activeHtml.indexOf("G Major") >= 0);

  S.earTrainScore = undefined;
  S.earTrainTotal = undefined;
  S.earTrainStreak = undefined;
  core.syncLegacyEarTrainingRuntimeState({
    answer: "G Major",
    score: 3,
    total: 6,
    streak: 0
  });
  var answeredHtml = earTrainPage();
  assert.ok(answeredHtml.indexOf("3/6") >= 0);
  assert.ok(answeredHtml.indexOf("It was C Major") >= 0);
});

test("song detail page uses SparkCore song runtime for active playback rendering", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.strumHandSVG = function(direction, active) { return "<div>" + direction + ":" + active + "</div>"; };
  global.strumHTML = function(pattern, beat) { return "<div>" + pattern.join("-") + "|" + beat + "</div>"; };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [{ name: "C", short: "C" }, { name: "G", short: "G" }]
          };
        },
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.selectedSong = undefined;
  S.songPlaying = undefined;
  S.songBeat = undefined;
  S.strumTone = "classic";

  eval(loadJS("js/pages/session.js"));

  core.openSongSession({
    songData: {
      title: "Fire Road",
      artist: "Spark Suite",
      bpm: 96,
      chords: ["C", "G"],
      progression: ["C", "G", "C", "G"],
      pattern: ["D", "D", "U", "U"]
    },
    source: "builtin"
  });
  core.syncSongRuntimeState("play", { songBeat: 2 });
  var songHtml = songDetailPage();
  assert.ok(songHtml.indexOf("U:true") >= 0);
  assert.ok(songHtml.indexOf("D-D-U-U|2") >= 0);
  assert.ok(songHtml.indexOf("Pause") >= 0);
});

test("SparkCore can open and complete guided sessions through explicit helpers", function() {
  var core = createDefaultSparkCore();
  var plan = core.openGuidedSession({ sessionNum: 2 });

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "guided_session");
  assert.strictEqual(core.getRuntimeState().activeScreen, "guided_session");
  assert.strictEqual(core.getRuntimeState().guidedStep, "spark");

  var result = core.completeGuidedSession();
  assert.strictEqual(result.planCompleted, true);
  assert.strictEqual(core.getRuntimeState().activeScreen, "guided_done");
  assert.strictEqual(core.getRuntimeState().transport.status, "completed");
});

test("SparkCore can build guided continuation requests from guided runtime progress", function() {
  var core = createDefaultSparkCore();
  var request;

  S.guidedSession = 3;
  request = core.buildGuidedContinuationRequest();
  assert.strictEqual(request.action, "guidedStart");
  assert.strictEqual(request.sessionNum, 3);

  S.guidedSession = 2;
  core.openGuidedSession({ sessionNum: 2 });
  core.completeGuidedSession();
  request = core.buildGuidedContinuationRequest();
  assert.strictEqual(request.action, "guidedStart");
  assert.strictEqual(request.sessionNum, 3);
});

test("SparkCore can apply guided navigation requests explicitly", function() {
  var core = createDefaultSparkCore();
  core.openGuidedSession({ sessionNum: 1 });

  var doneState = core.applyGuidedNavigationRequest("guided_done");
  assert.strictEqual(doneState.activeScreen, "guided_done");
  assert.strictEqual(doneState.transport.status, "completed");

  var homeState = core.applyGuidedNavigationRequest("guided_home");
  assert.strictEqual(homeState.activeScreen, "home");
  assert.strictEqual(homeState.activeTab, "practice");
  assert.strictEqual(homeState.guidedStep, null);
  assert.strictEqual(homeState.guidedNewMovePhase, null);
  assert.strictEqual(homeState.transport.status, "idle");
});

test("SparkCore can track guided runtime step and phase state explicitly", function() {
  var core = createDefaultSparkCore();
  core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 1 });

  core.syncGuidedRuntimeState({
    guidedStep: "newMove",
    guidedNewMovePhase: "shadow",
    transport: { status: "running", positionMs: 18000 }
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.activeFlow, "guided_session");
  assert.strictEqual(state.activeScreen, "guided_session");
  assert.strictEqual(state.guidedStep, "newMove");
  assert.strictEqual(state.guidedNewMovePhase, "shadow");
  assert.strictEqual(state.transport.status, "running");
  assert.strictEqual(state.transport.positionMs, 18000);
});

test("SparkCore can open, sync, navigate, and complete song sessions explicitly", function() {
  var core = createDefaultSparkCore();
  var request = core.openSongSession({
    songData: {
      title: "Fire Road",
      artist: "Spark Suite",
      bpm: 96,
      chords: ["C", "G"],
      progression: ["C", "G", "C", "G"],
      pattern: ["D", "D", "U", "U"]
    },
    source: "builtin"
  });

  assert.strictEqual(request.songData.title, "Fire Road");
  assert.strictEqual(core.getRuntimeState().activeFlow, "song_session");
  assert.strictEqual(core.getRuntimeState().activeScreen, "song");
  assert.strictEqual(core.getRuntimeState().activeTab, "songs");
  assert.strictEqual(core.getRuntimeState().songSessionSource, "builtin");
  assert.strictEqual(core.getRuntimeState().songPlaying, false);
  assert.strictEqual(core.getRuntimeState().transport.status, "ready");

  core.syncSongRuntimeState("play", { songBeat: 0 });
  assert.strictEqual(core.getRuntimeState().songPlaying, true);
  assert.strictEqual(core.getRuntimeState().transport.status, "running");

  core.syncSongRuntimeState("tick", { songBeat: 2 });
  assert.strictEqual(core.getRuntimeState().songBeat, 2);

  var doneRequest = core.completeSongSession();
  assert.strictEqual(doneRequest.activeScreen, "song_done");
  assert.strictEqual(core.getRuntimeState().activeScreen, "song_done");
  assert.strictEqual(core.getRuntimeState().songPlaying, false);
  assert.strictEqual(core.getRuntimeState().transport.status, "completed");

  var homeState = core.applySongNavigationRequest("songs_home");
  assert.strictEqual(homeState.activeScreen, "home");
  assert.strictEqual(homeState.activeTab, "songs");
  assert.strictEqual(homeState.transport.status, "idle");
});

test("SparkCore can track song browser state explicitly", function() {
  var core = createDefaultSparkCore();
  var state = core.applySongBrowserRequest("songs_subtab", {
    songsSubTab: "community",
    songFilter: "fire",
    songSort: "title",
    songSortAsc: false,
    communityTab: "submit",
    communitySearch: "suite",
    communitySort: "newest"
  });

  assert.strictEqual(state.activeTab, "songs");
  assert.strictEqual(state.songsSubTab, "community");
  assert.strictEqual(state.songFilter, "fire");
  assert.strictEqual(state.songSort, "title");
  assert.strictEqual(state.songSortAsc, false);
  assert.strictEqual(state.communityTab, "submit");
  assert.strictEqual(state.communitySearch, "suite");
  assert.strictEqual(state.communitySort, "newest");
});

test("SparkCore can track dashboard recommendation, insight, and challenge snapshots explicitly", function() {
  var core = createDefaultSparkCore();
  var state = core.applyDashboardRequest({
    recommendations: [{ id: "rec_1", title: "Practice G to C" }],
    insights: { strongestSkills: [{ id: "timing" }] },
    challenges: [{ id: "daily_1", title: "Daily Challenge" }],
    refreshedAt: 12345
  });

  assert.strictEqual(state.dashboardRecommendations.length, 1);
  assert.strictEqual(state.dashboardRecommendations[0].id, "rec_1");
  assert.strictEqual(state.dashboardInsights.strongestSkills[0].id, "timing");
  assert.strictEqual(state.dashboardChallenges[0].id, "daily_1");
  assert.strictEqual(state.lastDashboardRefreshAt, 12345);
});

test("SparkCore can refresh and initialize dashboard snapshots through explicit helpers", function() {
  var core = createDefaultSparkCore();
  var refreshState = core.refreshDashboardSnapshot({
    recommendations: [{ id: "rec_1", title: "Practice G to C" }],
    insights: { strongestSkills: [{ id: "timing" }] },
    challenges: [{ id: "daily_1", title: "Daily Challenge" }],
    refreshedAt: 12345
  });
  assert.strictEqual(refreshState.dashboardRecommendations[0].id, "rec_1");
  assert.strictEqual(refreshState.dashboardInsights.strongestSkills[0].id, "timing");
  assert.strictEqual(refreshState.lastDashboardRefreshAt, 12345);

  var initState = core.initializeDashboardChallenges({
    challenges: [{ id: "daily_2", title: "Weekly Challenge" }],
    refreshedAt: 67890
  });
  assert.strictEqual(initState.dashboardChallenges[0].id, "daily_2");
  assert.strictEqual(initState.dashboardRecommendations[0].id, "rec_1");
  assert.strictEqual(initState.lastDashboardRefreshAt, 67890);
});

test("SparkCore can track dashboard navigation and recommendation lookup explicitly", function() {
  var core = createDefaultSparkCore();
  core.applyDashboardRequest({
    recommendations: [{ id: "rec_1", title: "Practice G to C" }]
  });

  var recommendationState = core.applyDashboardNavigationRequest("recommendations");
  assert.strictEqual(recommendationState.activeScreen, "recommendations");

  var insightState = core.applyDashboardNavigationRequest("insights");
  assert.strictEqual(insightState.activeScreen, "insights");

  var backState = core.applyDashboardNavigationRequest("dashboard_back");
  assert.strictEqual(backState.activeScreen, "home_dash");

  var homeState = core.applyDashboardNavigationRequest("home_dash");
  assert.strictEqual(homeState.activeScreen, "home_dash");

  var recommendation = core.getDashboardRecommendationById("rec_1");
  assert.strictEqual(recommendation.title, "Practice G to C");
  assert.strictEqual(core.getDashboardRecommendationById("missing"), null);
});

test("SparkCore can open dashboard sections through an explicit helper", function() {
  var core = createDefaultSparkCore();

  assert.strictEqual(core.openDashboardSection("recommendations").activeScreen, "recommendations");
  assert.strictEqual(core.openDashboardSection("career").activeScreen, "career");
  assert.strictEqual(core.openDashboardSection("insights").activeScreen, "insights");
  assert.strictEqual(core.openDashboardSection("challenges").activeScreen, "challenges");
  assert.strictEqual(core.openDashboardSection("home_dash").activeScreen, "home_dash");
});

test("SparkCore can return from dashboard-family and home-family screens explicitly", function() {
  var core = createDefaultSparkCore();

  core.openDashboardSection("recommendations");
  assert.strictEqual(core.returnFromHomeFamily({ currentScreen: "recommendations" }).activeScreen, "home_dash");

  var state = core.returnFromHomeFamily({ currentScreen: "home" });
  assert.strictEqual(state.activeScreen, "home");
  assert.strictEqual(state.transport.status, "idle");
});

test("SparkCore can open utility screens through an explicit helper", function() {
  var core = createDefaultSparkCore();

  assert.strictEqual(core.openUtilityScreen("settings").activeScreen, "settings");
  assert.strictEqual(core.openUtilityScreen("curriculum").activeScreen, "curriculum");
  assert.strictEqual(core.openUtilityScreen("cloud_settings").activeScreen, "cloud_settings");
  assert.strictEqual(core.openUtilityScreen("midi_settings").activeScreen, "midi_settings");
  assert.strictEqual(core.openUtilityScreen("midi_import").activeScreen, "midi_import");
});

test("SparkCore can open the skill tree through an explicit helper", function() {
  var core = createDefaultSparkCore();
  var state = core.openSkillTree();

  assert.strictEqual(state.activeScreen, "skill_tree");
  assert.strictEqual(state.skillTreeFocus, "overview");
});

test("SparkCore can track skill tree focus through an explicit helper", function() {
  var core = createDefaultSparkCore();
  core.openSkillTree();

  var state = core.setSkillTreeFocus("rhythm");
  assert.strictEqual(state.activeScreen, "skill_tree");
  assert.strictEqual(state.skillTreeFocus, "rhythm");
});

test("SparkCore can open and close the stem player through explicit helpers", function() {
  var core = createDefaultSparkCore();

  var openState = core.openStemPlayer();
  assert.strictEqual(openState.activeScreen, "stems");
  assert.strictEqual(openState.activeTab, "songs");
  assert.strictEqual(openState.songsSubTab, "stems");

  var closeState = core.closeStemPlayer();
  assert.strictEqual(closeState.activeScreen, "home");
  assert.strictEqual(closeState.activeTab, "songs");
  assert.strictEqual(closeState.songsSubTab, "stems");
  assert.strictEqual(closeState.transport.status, "idle");
});

test("SparkCore can return from utility-family screens explicitly", function() {
  var core = createDefaultSparkCore();

  core.openUtilityScreen("settings");
  assert.strictEqual(core.returnFromUtilityFamily({ currentScreen: "settings" }).activeScreen, "home");

  core.openUtilityScreen("midi_import");
  var state = core.returnFromUtilityFamily({ currentScreen: "midi_import" });
  assert.strictEqual(state.activeScreen, "home");
  assert.strictEqual(state.transport.status, "idle");
});

test("SparkCore can track settings, midi, cloud, and midi-import utility snapshots explicitly", function() {
  var core = createDefaultSparkCore();

  var settingsState = core.syncSettingsState({ theme: "retro" });
  assert.strictEqual(settingsState.settingsTheme, "retro");

  var midiState = core.syncMidiSettingsState({
    midiEnabled: true,
    activeDeviceId: "dev_1",
    activeDeviceName: "Keyboard",
    activeProfileId: "profile_1",
    activeProfileName: "Default Piano",
    deviceOptions: [{ id: "dev_1", name: "Keyboard" }],
    profileOptions: [{ id: "profile_1", name: "Default Piano", type: "piano" }]
  });
  assert.strictEqual(midiState.midiEnabled, true);
  assert.strictEqual(midiState.midiActiveDeviceId, "dev_1");
  assert.strictEqual(midiState.midiActiveDeviceName, "Keyboard");
  assert.strictEqual(midiState.midiActiveProfileId, "profile_1");
  assert.strictEqual(midiState.midiActiveProfileName, "Default Piano");
  assert.strictEqual(midiState.midiDeviceOptions[0].id, "dev_1");
  assert.strictEqual(midiState.midiProfileOptions[0].type, "piano");

  var cloudState = core.syncCloudSettingsState({
    loggedIn: true,
    email: "player@sparksuite.dev",
    lastSyncStatus: "ok",
    lastSyncAt: 1712102400000
  });
  assert.strictEqual(cloudState.cloudLoggedIn, true);
  assert.strictEqual(cloudState.cloudEmail, "player@sparksuite.dev");
  assert.strictEqual(cloudState.cloudLastSyncStatus, "ok");
  assert.strictEqual(cloudState.cloudLastSyncAt, 1712102400000);

  var openedCloudState = core.openCloudSettings({
    loggedIn: true,
    email: "player@sparksuite.dev",
    lastSyncStatus: "idle"
  });
  assert.strictEqual(openedCloudState.activeScreen, "cloud_settings");
  assert.strictEqual(openedCloudState.cloudLoggedIn, true);

  var syncingCloudState = core.applyCloudWorkflowRequest("sync_start", {
    loggedIn: true,
    email: "player@sparksuite.dev",
    lastSyncStatus: "syncing"
  });
  assert.strictEqual(syncingCloudState.cloudLastSyncStatus, "syncing");

  var completedCloudState = core.applyCloudWorkflowRequest("sync_done", {
    loggedIn: true,
    email: "player@sparksuite.dev",
    lastSyncStatus: "ok",
    lastSyncAt: 1712102400000
  });
  assert.strictEqual(completedCloudState.cloudLastSyncStatus, "ok");
  assert.strictEqual(completedCloudState.cloudLastSyncAt, 1712102400000);

  var midiImportState = core.syncMidiImportState({
    summary: {
      sourceName: "lesson.mid",
      trackCount: 2,
      tracks: [
        { id: "t1", name: "Piano RH", noteCount: 24 },
        { id: "t2", name: "Piano LH", noteCount: 18 }
      ]
    },
    assignments: { t1: "melody", t2: "left_hand" },
    seedMode: "piano_left_hand",
    seedTitle: "Imported LH"
  });
  assert.strictEqual(midiImportState.midiImportSummary.sourceName, "lesson.mid");
  assert.strictEqual(midiImportState.midiImportSummary.trackCount, 2);
  assert.strictEqual(midiImportState.midiImportAssignments.t1, "melody");
  assert.strictEqual(midiImportState.midiImportSeedMode, "piano_left_hand");
  assert.strictEqual(midiImportState.midiImportSeedTitle, "Imported LH");

  var curriculumState = core.syncCurriculumState({
    curriculums: [{ id: "starter", title: "Starter Path", trackCount: 2 }],
    packs: [{ id: "pack_1", title: "Road Pack", type: "songs" }]
  });
  assert.strictEqual(curriculumState.curriculumSummaries[0].id, "starter");
  assert.strictEqual(curriculumState.curriculumSummaries[0].trackCount, 2);
  assert.strictEqual(curriculumState.curriculumPackSummaries[0].title, "Road Pack");

  var curriculumLoadingState = core.applyCurriculumWorkflowRequest("curriculum_load_start", {
    manifestPath: "/data/curriculum.json"
  });
  assert.strictEqual(curriculumLoadingState.curriculumLoading, true);
  assert.strictEqual(curriculumLoadingState.curriculumLastManifestPath, "/data/curriculum.json");
  assert.strictEqual(curriculumLoadingState.curriculumLastLoadStatus, "loading");

  var curriculumDoneState = core.applyCurriculumWorkflowRequest("curriculum_load_done", {
    manifestPath: "/data/curriculum.json",
    status: "ok"
  });
  assert.strictEqual(curriculumDoneState.curriculumLoading, false);
  assert.strictEqual(curriculumDoneState.curriculumLastLoadStatus, "ok");

  var contentLoadingState = core.applyCurriculumWorkflowRequest("content_load_start", {
    manifestPath: "/data/content.json"
  });
  assert.strictEqual(contentLoadingState.contentLoading, true);
  assert.strictEqual(contentLoadingState.contentLastManifestPath, "/data/content.json");
  assert.strictEqual(contentLoadingState.contentLastLoadStatus, "loading");

  var contentDoneState = core.applyCurriculumWorkflowRequest("content_load_done", {
    manifestPath: "/data/content.json",
    status: "ok"
  });
  assert.strictEqual(contentDoneState.contentLoading, false);
  assert.strictEqual(contentDoneState.contentLastLoadStatus, "ok");
});

test("SparkCore can build and apply dashboard recommendation launch requests", function() {
  var core = createDefaultSparkCore();
  core.applyDashboardRequest({
    recommendations: [{ id: "rec_song", title: "Play Fire Road" }]
  });

  var request = core.launchDashboardRecommendation("rec_song");
  assert.strictEqual(request.recommendationId, "rec_song");
  assert.strictEqual(request.recommendation.title, "Play Fire Road");
  assert.strictEqual(request.launch, null);
  assert.strictEqual(core.getRuntimeState().activeScreen, "recommendations");
  assert.strictEqual(core.getRuntimeState().lastDashboardRecommendationId, "rec_song");
});

test("SparkCore can build guided dashboard recommendation launches without UI parsing", function() {
  var core = createDefaultSparkCore();
  core.applyDashboardRequest({
    recommendations: [{
      id: "guided_session_4",
      type: "lesson",
      title: "Session 4",
      meta: { lessonId: "guided_session_4" }
    }]
  });

  var request = core.launchDashboardRecommendation("guided_session_4");
  assert.strictEqual(request.recommendationId, "guided_session_4");
  assert.strictEqual(request.launch.action, "guidedStart");
  assert.strictEqual(request.launch.value, 4);
});

test("SparkCore can build module lesson dashboard launches without UI-owned curriculum logic", function() {
  var core = createDefaultSparkCore();
  var previousGetActive = SparkInstruments.getActive;
  SparkInstruments.getActive = function() {
    return {
      instrument: "bass",
      getCurriculumMap: function() {
        return [{ id: "bass_level_4", title: "Walking Lines", skill: "walking_bass" }];
      },
      getExercisesForLesson: function(lessonId) {
        if (lessonId !== "bass_level_4") return [];
        return [{
          id: "bass_walk_lines_01",
          name: "Walk Lines 01",
          focus: "walking_bass",
          type: "bassline"
        }];
      }
    };
  };
  try {
    core.applyDashboardRequest({
      recommendations: [{
        id: "bass_level_4",
        type: "lesson",
        title: "Walking Lines",
        meta: { lessonId: "bass_level_4" }
      }]
    });

    var request = core.launchDashboardRecommendation("bass_level_4");
    assert.strictEqual(request.recommendationId, "bass_level_4");
    assert.strictEqual(request.launch.action, "planStartModuleExercise");
    assert.deepStrictEqual(JSON.parse(request.launch.value), {
      instrument: "bass",
      lessonId: "bass_level_4",
      skill: "walking_bass",
      exerciseId: "bass_walk_lines_01",
      exerciseName: "Walk Lines 01",
      exerciseFocus: "walking_bass",
      exerciseType: "bassline"
    });
  } finally {
    SparkInstruments.getActive = previousGetActive;
  }
});

test("SparkCore can update dashboard challenge snapshots after reward claim", function() {
  var core = createDefaultSparkCore();
  core.applyDashboardRequest({
    challenges: [
      { id: "daily_1", title: "Daily Challenge", completed: true, claimed: false }
    ]
  });

  var state = core.applyDashboardChallengeReward("daily_1");
  assert.strictEqual(state.dashboardChallenges[0].id, "daily_1");
  assert.strictEqual(state.dashboardChallenges[0].claimed, true);
});

test("SparkCore can mirror performance runtime state explicitly", function() {
  var core = createDefaultSparkCore();
  core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });

  core.syncPerformanceRuntimeState("start", {
    chartId: "night_drive_chart",
    songIndex: 1,
    songTitle: "Night Drive",
    difficulty: "hard",
    arrangementType: "rhythm_chords",
    speed: 0.75,
    mode: "midi",
    countIn: true
  });
  core.syncPerformanceRuntimeState("tick", { sec: 12.4, status: "running" });
  core.syncPerformanceRuntimeState("set_loop", { loop: { startSec: 10, endSec: 14, phraseId: "phrase_2" } });

  var runningState = core.getRuntimeState();
  assert.strictEqual(runningState.activeFlow, "performance_song");
  assert.strictEqual(runningState.activeScreen, "perform");
  assert.strictEqual(runningState.performanceChartId, "night_drive_chart");
  assert.strictEqual(runningState.performanceSongIndex, 1);
  assert.strictEqual(runningState.performanceSongTitle, "Night Drive");
  assert.strictEqual(runningState.performanceDifficultyId, "hard");
  assert.strictEqual(runningState.performanceArrangementType, "rhythm_chords");
  assert.strictEqual(runningState.performanceSpeed, 0.75);
  assert.strictEqual(runningState.performanceInputMode, "midi");
  assert.strictEqual(runningState.transport.status, "running");
  assert.strictEqual(runningState.transport.positionMs, 12400);
  assert.deepStrictEqual(runningState.performanceLoop, { startSec: 10, endSec: 14, phraseId: "phrase_2" });

  core.syncPerformanceRuntimeState("pause");
  assert.strictEqual(core.getRuntimeState().transport.status, "paused");

  core.syncPerformanceRuntimeState("finish", { screen: "perform_done" });
  var finishedState = core.getRuntimeState();
  assert.strictEqual(finishedState.activeScreen, "perform_done");
  assert.strictEqual(finishedState.transport.status, "completed");
  assert.strictEqual(finishedState.performanceLoop, null);
});

test("SparkCore retains performance result payload for result-screen consumers", function() {
  var core = createDefaultSparkCore();
  core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });

  core.syncPerformanceRuntimeState("finish", {
    screen: "perform_done",
    results: {
      title: "Night Drive",
      artist: "Spark Suite",
      score: 1234,
      accuracy: 88,
      stars: 4
    }
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.activeScreen, "perform_done");
  assert.strictEqual(state.performanceResults.title, "Night Drive");
  assert.strictEqual(state.performanceResults.score, 1234);
  assert.strictEqual(state.performanceResults.accuracy, 88);
});

test("SparkCore can mirror performance runtime configuration changes", function() {
  var core = createDefaultSparkCore();
  core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "normal"
  });

  core.syncPerformanceRuntimeState("configure", {
    arrangementType: "lead",
    difficulty: "pro",
    speed: 0.5,
    mode: "mic",
    preset: "guitar_solo"
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.performanceArrangementType, "lead");
  assert.strictEqual(state.performanceDifficultyId, "pro");
  assert.strictEqual(state.performanceSpeed, 0.5);
  assert.strictEqual(state.performanceInputMode, "mic");
  assert.strictEqual(state.performancePracticePreset, "guitar_solo");
});

test("SparkCore can track performance screen transitions for stats, editor, and calibration", function() {
  var core = createDefaultSparkCore();
  core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });

  core.syncPerformanceRuntimeState("open_stats");
  var statsState = core.getRuntimeState();
  assert.strictEqual(statsState.activeScreen, "performance_stats");
  assert.strictEqual(statsState.transport.status, "idle");

  core.syncPerformanceRuntimeState("open_editor");
  var editorState = core.getRuntimeState();
  assert.strictEqual(editorState.activeScreen, "performance_editor");
  assert.strictEqual(editorState.transport.status, "idle");

  core.syncPerformanceRuntimeState("open_calibration", { source: "mic" });
  var calibrationScreenState = core.getRuntimeState();
  assert.strictEqual(calibrationScreenState.activeScreen, "perform_calibration");
  assert.strictEqual(calibrationScreenState.performanceCalibrationSource, "mic");
  assert.strictEqual(calibrationScreenState.performanceCalibrationMode, false);

  // calibration_source: standalone source change
  core.syncPerformanceRuntimeState("calibration_source", { source: "midi" });
  var sourceChangedState = core.getRuntimeState();
  assert.strictEqual(sourceChangedState.performanceCalibrationSource, "midi");
  assert.strictEqual(sourceChangedState.activeScreen, "perform_calibration");

  // switch back to mic for remaining calibration tests
  core.syncPerformanceRuntimeState("calibration_source", { source: "mic" });
  assert.strictEqual(core.getRuntimeState().performanceCalibrationSource, "mic");

  core.syncPerformanceRuntimeState("calibration_start");
  var calibrationRunningState = core.getRuntimeState();
  assert.strictEqual(calibrationRunningState.performanceCalibrationMode, true);
  assert.strictEqual(calibrationRunningState.transport.status, "calibrating");
  assert.strictEqual(calibrationRunningState.performanceCalibrationSource, "mic");

  core.syncPerformanceRuntimeState("calibration_stop");
  var calibrationStoppedState = core.getRuntimeState();
  assert.strictEqual(calibrationStoppedState.performanceCalibrationMode, false);
  assert.strictEqual(calibrationStoppedState.transport.status, "idle");

  // calibration_reset: distinct from stop — preserves source, resets mode
  core.syncPerformanceRuntimeState("calibration_start");
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, true);
  core.syncPerformanceRuntimeState("calibration_reset");
  var calibrationResetState = core.getRuntimeState();
  assert.strictEqual(calibrationResetState.performanceCalibrationMode, false);
  assert.strictEqual(calibrationResetState.transport.status, "idle");
  assert.strictEqual(calibrationResetState.activeScreen, "perform_calibration");
  assert.strictEqual(calibrationResetState.performanceCalibrationSource, "mic");

  core.syncPerformanceRuntimeState("calibration_apply", {
    source: "mic",
    globalOffsetMs: 12,
    midiOffsetMs: -4,
    micOffsetMs: 18
  });
  var calibrationAppliedState = core.getRuntimeState();
  assert.strictEqual(calibrationAppliedState.performanceTimingOffsetMs, 12);
  assert.strictEqual(calibrationAppliedState.performanceMidiOffsetMs, -4);
  assert.strictEqual(calibrationAppliedState.performanceMicOffsetMs, 18);

  // start action clears calibrationMode
  core.syncPerformanceRuntimeState("calibration_start");
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, true);
  core.syncPerformanceRuntimeState("start", { chartId: "night_drive_chart" });
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, false);

  core.syncPerformanceRuntimeState("configure_editor", {
    mode: "lead",
    snap: "1/16",
    chartId: "custom_chart",
    chartTitle: "Lead Builder",
    source: "library",
    dirty: true,
    selectedEventId: 7,
    bpm: 132,
    eventCount: 18,
    phraseCount: 4
  });
  var editorConfiguredState = core.getRuntimeState();
  assert.strictEqual(editorConfiguredState.performanceEditorMode, "lead");
  assert.strictEqual(editorConfiguredState.performanceEditorSnap, "1/16");
  assert.strictEqual(editorConfiguredState.performanceEditorChartId, "custom_chart");
  assert.strictEqual(editorConfiguredState.performanceEditorChartTitle, "Lead Builder");
  assert.strictEqual(editorConfiguredState.performanceEditorSource, "library");
  assert.strictEqual(editorConfiguredState.performanceEditorDirty, true);
  assert.strictEqual(editorConfiguredState.performanceEditorSelectedEventId, 7);
  assert.strictEqual(editorConfiguredState.performanceEditorSelectedEventLabel, null);
  assert.strictEqual(editorConfiguredState.performanceEditorSelectedEventTime, null);
  assert.strictEqual(editorConfiguredState.performanceEditorSelectedEventDuration, null);
  assert.strictEqual(editorConfiguredState.performanceEditorBpm, 132);
  assert.strictEqual(editorConfiguredState.performanceEditorEventCount, 18);
  assert.strictEqual(editorConfiguredState.performanceEditorPhraseCount, 4);

  core.syncPerformanceRuntimeState("configure_editor", {
    selectedEventId: 9,
    selectedEventLabel: "Am",
    selectedEventTime: 12.5,
    selectedEventDuration: 1.25
  });
  var selectedEventState = core.getRuntimeState();
  assert.strictEqual(selectedEventState.performanceEditorSelectedEventId, 9);
  assert.strictEqual(selectedEventState.performanceEditorSelectedEventLabel, "Am");
  assert.strictEqual(selectedEventState.performanceEditorSelectedEventTime, 12.5);
  assert.strictEqual(selectedEventState.performanceEditorSelectedEventDuration, 1.25);

  core.syncPerformanceRuntimeState("configure_editor", {
    selectedPhraseId: 2,
    selectedPhraseName: "Bridge",
    selectedPhraseStart: 16,
    selectedPhraseEnd: 24
  });
  var selectedPhraseState = core.getRuntimeState();
  assert.strictEqual(selectedPhraseState.performanceEditorSelectedPhraseId, 2);
  assert.strictEqual(selectedPhraseState.performanceEditorSelectedPhraseName, "Bridge");
  assert.strictEqual(selectedPhraseState.performanceEditorSelectedPhraseStart, 16);
  assert.strictEqual(selectedPhraseState.performanceEditorSelectedPhraseEnd, 24);

  core.syncPerformanceRuntimeState("configure_editor", {
    selectedPhraseId: null,
    selectedPhraseName: null,
    selectedPhraseStart: null,
    selectedPhraseEnd: null,
    phraseCount: 3
  });
  var clearedPhraseState = core.getRuntimeState();
  assert.strictEqual(clearedPhraseState.performanceEditorSelectedPhraseId, null);
  assert.strictEqual(clearedPhraseState.performanceEditorSelectedPhraseName, null);
  assert.strictEqual(clearedPhraseState.performanceEditorSelectedPhraseStart, null);
  assert.strictEqual(clearedPhraseState.performanceEditorSelectedPhraseEnd, null);
  assert.strictEqual(clearedPhraseState.performanceEditorPhraseCount, 3);

  core.syncPerformanceRuntimeState("configure_stats", {
    focus: "weak"
  });
  var statsConfiguredState = core.getRuntimeState();
  assert.strictEqual(statsConfiguredState.performanceStatsFocus, "weak");

  core.syncPerformanceRuntimeState("close_editor", { screen: "home" });
  var homeState = core.getRuntimeState();
  assert.strictEqual(homeState.activeScreen, "home");
});

test("SparkCore exposes a compact performance editor document view", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceEditorDocument({
    id: "custom_chart",
    title: "Lead Builder",
    bpm: 132,
    events: [
      { id: 9, laneLabel: "Am", t: 12.5, dur: 1.25 }
    ],
    phrases: [
      { id: 2, name: "Bridge", startSec: 16, endSec: 24 }
    ]
  }, {
    source: "library",
    dirty: true,
    mode: "lead",
    snap: "1/16",
    eventCount: 18,
    phraseCount: 4,
    selectedEventId: 9,
    selectedPhraseId: 2
  });

  var documentView = core.getPerformanceEditorDocumentView();
  assert.ok(documentView.chart);
  assert.strictEqual(documentView.chart.id, "custom_chart");
  assert.strictEqual(documentView.chartId, "custom_chart");
  assert.strictEqual(documentView.title, "Lead Builder");
  assert.strictEqual(documentView.source, "library");
  assert.strictEqual(documentView.dirty, true);
  assert.strictEqual(documentView.mode, "lead");
  assert.strictEqual(documentView.snap, "1/16");
  assert.strictEqual(documentView.bpm, 132);
  assert.strictEqual(documentView.eventCount, 18);
  assert.strictEqual(documentView.phraseCount, 4);
  assert.strictEqual(documentView.selectedEvent.id, 9);
  assert.strictEqual(documentView.selectedEvent.label, "Am");
  assert.strictEqual(documentView.selectedPhrase.id, 2);
  assert.strictEqual(documentView.selectedPhrase.name, "Bridge");

  documentView.chart.title = "Changed Outside";
  assert.strictEqual(core.getPerformanceEditorDocumentView().chart.title, "Lead Builder");
});

test("SparkCore can derive editor document runtime state from a chart payload", function() {
  var core = createDefaultSparkCore();
  var chart = {
    id: "custom_chart",
    title: "Roadmap Builder",
    bpm: 128,
    events: [
      { id: 4, laneLabel: "C", t: 2.5, dur: 1 }
    ],
    phrases: [
      { id: 1, name: "Verse", startSec: 0, endSec: 8 }
    ]
  };

  core.syncPerformanceEditorDocument(chart, {
    source: "song",
    dirty: true,
    mode: "chords",
    snap: "1/8",
    selectedEventId: 4,
    selectedPhraseId: 1
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.activeScreen, "performance_editor");
  assert.strictEqual(state.performanceEditorChartId, "custom_chart");
  assert.strictEqual(state.performanceEditorChartTitle, "Roadmap Builder");
  assert.strictEqual(state.performanceEditorSource, "song");
  assert.strictEqual(state.performanceEditorDirty, true);
  assert.strictEqual(state.performanceEditorBpm, 128);
  assert.strictEqual(state.performanceEditorEventCount, 1);
  assert.strictEqual(state.performanceEditorPhraseCount, 1);
  assert.strictEqual(state.performanceEditorSelectedEventLabel, "C");
  assert.strictEqual(state.performanceEditorSelectedEventTime, 2.5);
  assert.strictEqual(state.performanceEditorSelectedPhraseName, "Verse");
  assert.strictEqual(state.performanceEditorSelectedPhraseEnd, 8);

  core.syncPerformanceEditorDocument(null, {
    action: "open_editor",
    source: "blank",
    dirty: false,
    mode: "lead",
    snap: "free",
    selectedEventId: null,
    selectedPhraseId: null
  });

  var blankState = core.getRuntimeState();
  assert.strictEqual(blankState.activeScreen, "performance_editor");
  assert.strictEqual(blankState.performanceEditorChartId, null);
  assert.strictEqual(blankState.performanceEditorSource, "blank");
  assert.strictEqual(blankState.performanceEditorDirty, false);
  assert.strictEqual(blankState.performanceEditorMode, "lead");
  assert.strictEqual(blankState.performanceEditorSnap, "free");
});

test("SparkCore can apply editor chart mutations through a core-owned document copy", function() {
  var core = createDefaultSparkCore();
  var blank = core.applyPerformanceEditorMutation("new_blank", { mode: "chords" });
  core.syncPerformanceEditorDocument(blank.chart, {
    action: "open_editor",
    source: "blank",
    dirty: true,
    mode: "chords",
    snap: "1/8"
  });

  var addedEvent = core.applyPerformanceEditorMutation("add_event", { mode: "chords" });
  assert.ok(addedEvent.chart);
  assert.strictEqual(addedEvent.chart.events.length, 1);
  assert.strictEqual(addedEvent.chart.events[0].id, 1);

  core.syncPerformanceEditorDocument(addedEvent.chart, {
    source: "blank",
    dirty: true,
    selectedEventId: null,
    selectedPhraseId: null
  });

  var selectedEvent = core.applyPerformanceEditorMutation("select_event", { id: 1 });
  assert.strictEqual(selectedEvent.selectedEventId, 1);

  var updatedEvent = core.applyPerformanceEditorMutation("update_event", {
    id: 1,
    prop: "label",
    val: "G"
  });
  assert.strictEqual(updatedEvent.chart.events[0].laneLabel, "G");
  assert.strictEqual(updatedEvent.chart.events[0].chord, "G");

  core.syncPerformanceEditorDocument(updatedEvent.chart, {
    source: "blank",
    dirty: true,
    selectedEventId: 1,
    selectedPhraseId: null
  });

  var deletedEvent = core.applyPerformanceEditorMutation("delete_event", { id: 1 });
  assert.strictEqual(deletedEvent.chart.events.length, 0);
  assert.strictEqual(deletedEvent.selectedEventId, null);

  var titled = core.applyPerformanceEditorMutation("set_title", { title: "Edited in Core" });
  assert.strictEqual(titled.chart.title, "Edited in Core");

  var addedPhrase = core.applyPerformanceEditorMutation("add_phrase");
  assert.strictEqual(addedPhrase.chart.phrases.length, 2);
  assert.strictEqual(addedPhrase.selectedPhraseId, 1);

  core.syncPerformanceEditorDocument(addedPhrase.chart, {
    source: "blank",
    dirty: true,
    selectedPhraseId: addedPhrase.selectedPhraseId
  });

  var updatedPhrase = core.applyPerformanceEditorMutation("update_phrase", {
    id: 1,
    prop: "name",
    val: "Chorus"
  });
  assert.strictEqual(updatedPhrase.chart.phrases[1].name, "Chorus");

  var deletedPhrase = core.applyPerformanceEditorMutation("delete_phrase", { id: 1 });
  assert.strictEqual(deletedPhrase.chart.phrases.length, 1);
  assert.strictEqual(deletedPhrase.selectedPhraseId, null);
});

test("SparkCore can manage the editor library from the core-owned document workflow", function() {
  var core = createDefaultSparkCore();
  var chart = {
    id: "library_chart",
    title: "Saved Core Chart",
    bpm: 110,
    events: [{ id: 1, laneLabel: "C", t: 0, dur: 1 }],
    phrases: [{ id: 0, name: "Phrase 1", startSec: 0, endSec: 8 }]
  };

  core.syncPerformanceEditorDocument(chart, {
    action: "open_editor",
    source: "blank",
    dirty: true,
    mode: "chords",
    snap: "1/8"
  });

  var saved = core.applyPerformanceEditorMutation("save_to_library");
  assert.strictEqual(saved.library.length, 1);
  assert.strictEqual(saved.library[0].title, "Saved Core Chart");

  var loaded = core.applyPerformanceEditorMutation("load_from_library", { index: 0 });
  assert.ok(loaded.chart);
  assert.strictEqual(loaded.chart.id, "library_chart");
  assert.strictEqual(loaded.selectedEventId, null);
  assert.strictEqual(loaded.selectedPhraseId, null);

  var deleted = core.applyPerformanceEditorMutation("delete_from_library", { index: 0 });
  assert.strictEqual(deleted.library.length, 0);
});

test("SparkCore can expose export and preview artifacts from the core-owned editor document", function() {
  var core = createDefaultSparkCore();
  var chart = {
    id: "preview_chart",
    title: "Preview Chart",
    bpm: 95,
    events: [{ id: 1, laneLabel: "Dm", t: 1, dur: 1 }],
    phrases: [{ id: 0, name: "Phrase 1", startSec: 0, endSec: 8 }]
  };

  core.syncPerformanceEditorDocument(chart, {
    action: "open_editor",
    source: "library",
    dirty: false,
    mode: "chords",
    snap: "1/8"
  });

  var exportData = core.getPerformanceEditorExportData();
  assert.ok(exportData.chart);
  assert.strictEqual(exportData.chart.id, "preview_chart");
  assert.strictEqual(exportData.fileName, "Preview_Chart.json");
  assert.ok(exportData.json.indexOf("\"title\": \"Preview Chart\"") >= 0);

  var previewChart = core.getPerformanceEditorPreviewChart();
  assert.ok(previewChart);
  assert.strictEqual(previewChart.title, "Preview Chart");
  previewChart.title = "Changed Locally";
  assert.strictEqual(core.getPerformanceEditorPreviewChart().title, "Preview Chart");

  core.syncPerformanceRuntimeState("configure", {
    difficulty: "hard",
    speed: 0.8,
    mode: "mic",
    preset: "guitar_solo",
    arrangementType: "lead"
  });

  var previewRequest = core.startPerformanceEditorPreview();
  assert.ok(previewRequest);
  assert.strictEqual(previewRequest.chartId, "preview_chart");
  assert.strictEqual(previewRequest.arrangementType, "lead");
  assert.strictEqual(previewRequest.difficulty, "hard");
  assert.strictEqual(previewRequest.speed, 0.8);
  assert.strictEqual(previewRequest.mode, "mic");
  assert.strictEqual(previewRequest.preset, "guitar_solo");
  assert.strictEqual(core.getRuntimeState().activeScreen, "perform");
  assert.strictEqual(core.getRuntimeState().performanceChartId, "preview_chart");
  assert.strictEqual(core.getRuntimeState().transport.status, "running");
});

test("SparkCore can open performance stats, editor, and calibration through explicit helpers", function() {
  var core = createDefaultSparkCore();

  var statsRequest = core.openPerformanceStats({ focus: "weak" });
  assert.strictEqual(statsRequest.focus, "weak");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_stats");
  assert.strictEqual(core.getRuntimeState().performanceStatsFocus, "weak");

  var editorRequest = core.openPerformanceEditor(null, {
    source: "blank",
    mode: "lead",
    snap: "1/16"
  });
  assert.strictEqual(editorRequest.source, "blank");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_editor");
  assert.strictEqual(core.getRuntimeState().performanceEditorMode, "lead");
  assert.strictEqual(core.getRuntimeState().performanceEditorSnap, "1/16");

  var calibrationRequest = core.openPerformanceCalibration({ source: "mic" });
  assert.strictEqual(calibrationRequest.source, "mic");
  assert.strictEqual(core.getRuntimeState().activeScreen, "perform_calibration");
  assert.strictEqual(core.getRuntimeState().performanceCalibrationSource, "mic");
});

test("SparkCore can open performance song selection through an explicit helper", function() {
  var core = createDefaultSparkCore();

  var selectionRequest = core.openPerformanceSongSelection({
    songId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });

  assert.strictEqual(selectionRequest.songId, "night_drive");
  assert.strictEqual(selectionRequest.songIndex, 1);
  assert.strictEqual(selectionRequest.songTitle, "Night Drive");
  assert.ok(selectionRequest.songData);
  assert.strictEqual(selectionRequest.songData.title, "Night Drive");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_song");
  assert.strictEqual(core.getRuntimeState().performanceChartId, "night_drive");
  assert.strictEqual(core.getRuntimeState().performanceSongIndex, 1);
  assert.strictEqual(core.getRuntimeState().performanceSongTitle, "Night Drive");
  assert.strictEqual(core.getRuntimeState().performanceArrangementType, "rhythm_chords");
  assert.strictEqual(core.getRuntimeState().performanceDifficultyId, "hard");
});

test("SparkCore can resolve legacy perf song ids through the active instrument songs", function() {
  var core = createDefaultSparkCore();

  var selectionRequest = core.openPerformanceSongSelection({
    songId: "fire_road_perf",
    arrangementType: "chords",
    difficultyId: "normal"
  });

  assert.strictEqual(selectionRequest.songId, "fire_road");
  assert.ok(selectionRequest.songData);
  assert.strictEqual(selectionRequest.songData.title, "Fire Road");
  assert.strictEqual(core.getRuntimeState().performanceChartId, "fire_road");
  assert.strictEqual(core.getRuntimeState().performanceSongTitle, "Fire Road");
});

test("SparkCore can open performance song selection from direct song data", function() {
  var core = createDefaultSparkCore();
  var songData = {
    title: "Career Anthem",
    artist: "Spark Career",
    bpm: 92,
    chords: ["C", "G"],
    progression: ["C", "G", "Am", "F"]
  };

  var selectionRequest = core.openPerformanceSongSelection({
    songId: "career_anthem",
    songData: songData,
    arrangementType: "chords",
    difficultyId: "normal"
  });

  assert.strictEqual(selectionRequest.songId, "career_anthem");
  assert.strictEqual(selectionRequest.songData.title, "Career Anthem");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_song");
  assert.strictEqual(core.getRuntimeState().performanceChartId, "career_anthem");
  assert.strictEqual(core.getRuntimeState().performanceSongData.title, "Career Anthem");
  assert.strictEqual(core.getRuntimeState().performanceSongTitle, "Career Anthem");
});

test("SparkCore can hydrate performance song selection from chart library metadata", function() {
  var core = createDefaultSparkCore();
  var originalGetPerformanceChartLibrary = global.getPerformanceChartLibrary;
  global.getPerformanceChartLibrary = function() {
    return [
      {
        id: "ukulele_island_package",
        title: "Island Loop",
        artist: "SparkSuite Ukulele",
        bpm: 78,
        instrument: "ukulele",
        sourceType: "imported_package"
      }
    ];
  };
  try {
    var selectionRequest = core.openPerformanceSongSelection({
      songId: "ukulele_island_package",
      arrangementType: "ukulele_strum",
      difficultyId: "normal"
    });

    assert.strictEqual(selectionRequest.songId, "ukulele_island_package");
    assert.strictEqual(selectionRequest.songData.title, "Island Loop");
    assert.strictEqual(core.getRuntimeState().performanceSongData.title, "Island Loop");
    assert.strictEqual(core.getRuntimeState().performanceSongTitle, "Island Loop");
  } finally {
    global.getPerformanceChartLibrary = originalGetPerformanceChartLibrary;
  }
});

test("SparkCore can hydrate chart metadata when the active context only exposes instrumentId", function() {
  var core = createDefaultSparkCore();
  var originalGetPerformanceChartLibrary = global.getPerformanceChartLibrary;
  core.instrumentManager.getActiveContext = function() {
    return {
      instrumentId: "ukespark",
      instrumentType: "ukulele",
      songs: []
    };
  };
  global.getPerformanceChartLibrary = function(options) {
    options = options || {};
    if (options.instrument === "ukespark") return [];
    return [
      {
        id: "ukulele_island_package",
        title: "Island Loop",
        artist: "SparkSuite Ukulele",
        bpm: 78,
        instrument: "ukulele",
        sourceType: "imported_package"
      }
    ];
  };
  try {
    var selectionRequest = core.openPerformanceSongSelection({
      songId: "ukulele_island_package",
      arrangementType: "ukulele_strum",
      difficultyId: "normal"
    });

    assert.strictEqual(selectionRequest.songId, "ukulele_island_package");
    assert.strictEqual(selectionRequest.songData.title, "Island Loop");
    assert.strictEqual(core.getRuntimeState().performanceSongData.title, "Island Loop");
  } finally {
    global.getPerformanceChartLibrary = originalGetPerformanceChartLibrary;
  }
});

test("SparkCore can open career song selection through an explicit helper", function() {
  var core = createDefaultSparkCore();
  var request = core.openCareerSongSelection({
    songId: "career_anthem",
    songData: {
      title: "Career Anthem",
      artist: "Spark Career"
    },
    arrangementType: "lead",
    difficultyId: "hard"
  });

  assert.strictEqual(request.songId, "career_anthem");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_song");
  assert.strictEqual(core.getRuntimeState().performanceSongData.title, "Career Anthem");
  assert.strictEqual(core.getRuntimeState().performanceArrangementType, "lead");
  assert.strictEqual(core.getRuntimeState().performanceDifficultyId, "hard");
});

test("SparkCore can open performance daily challenge selection through an explicit helper", function() {
  var core = createDefaultSparkCore();
  var request = core.openPerformanceDailyChallenge({
    songId: "fire_road",
    songData: {
      title: "Fire Road",
      artist: "Spark Suite"
    },
    songTitle: "Fire Road",
    arrangementType: "chords",
    difficultyId: "normal",
    songIndex: 0
  });

  assert.strictEqual(request.songId, "fire_road");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_song");
  assert.strictEqual(core.getRuntimeState().performanceSongTitle, "Fire Road");

  var fallback = core.openPerformanceDailyChallenge({});
  assert.strictEqual(fallback.activeScreen, "home");
  assert.strictEqual(fallback.activeTab, "songs");
});

test("SparkCore falls back to the first performance chart for empty daily challenges", function() {
  var core = createDefaultSparkCore();
  var originalGetPerformanceChartLibrary = global.getPerformanceChartLibrary;
  var fallbackCharts = [
    {
      id: "daily_demo_song",
      title: "Daily Demo Song",
      artist: "SparkSuite",
      instrument: "guitar",
      sourceType: "built_in"
    }
  ];
  global.getPerformanceChartLibrary = function(options) {
    if (options && options.instrument === "guitar") {
      return fallbackCharts;
    }
    return fallbackCharts;
  };
  core.updateRuntimeState({ activeInstrumentId: "guitar" });
  try {
    var fallback = core.openPerformanceDailyChallenge({
      arrangementType: "chords",
      difficultyId: "easy"
    });

    assert.strictEqual(fallback.songId, "daily_demo_song");
    assert.strictEqual(fallback.songData.title, "Daily Demo Song");
    assert.strictEqual(core.getRuntimeState().activeScreen, "performance_song");
    assert.strictEqual(core.getRuntimeState().performanceSongTitle, "Daily Demo Song");
  } finally {
    global.getPerformanceChartLibrary = originalGetPerformanceChartLibrary;
  }
});

test("SparkCore prefers active instrument type over app id for daily performance challenges", function() {
  var core = createDefaultSparkCore();
  var originalGetPerformanceChartLibrary = global.getPerformanceChartLibrary;
  core.instrumentManager.getActiveContext = function() {
    return {
      instrumentId: "ukespark",
      instrumentType: "ukulele",
      songs: []
    };
  };
  global.getPerformanceChartLibrary = function(options) {
    options = options || {};
    if (options.instrument === "ukulele") {
      return [{
        id: "ukulele_daily_song",
        title: "Island Daily",
        artist: "SparkSuite Ukulele",
        instrument: "ukulele",
        sourceType: "built_in"
      }];
    }
    if (options.instrument === "ukespark") {
      return [];
    }
    return [{
      id: "guitar_daily_song",
      title: "Guitar Daily",
      artist: "SparkSuite Guitar",
      instrument: "guitar",
      sourceType: "built_in"
    }];
  };
  core.updateRuntimeState({ activeInstrumentId: "ukespark", activeInstrumentType: "ukulele" });
  try {
    var selection = core.openPerformanceDailyChallenge({
      arrangementType: "ukulele_strum",
      difficultyId: "easy"
    });

    assert.strictEqual(selection.songId, "ukulele_daily_song");
    assert.strictEqual(selection.songData.title, "Island Daily");
  } finally {
    global.getPerformanceChartLibrary = originalGetPerformanceChartLibrary;
  }
});

test("SparkCore startPracticeFromLesson uses the active instrument type for playable launches", function() {
  var core = createDefaultSparkCore();
  var originalGateway = window.SparkExecutionGateway;
  var captured = null;
  window.SparkExecutionGateway = {
    runPlayablePayload: function(payload, options) {
      captured = { payload: payload, options: options };
      return true;
    }
  };
  core.updateRuntimeState({ activeInstrumentId: "pianospark", activeInstrumentType: "piano" });
  try {
    var ok = core.startPracticeFromLesson({
      type: "timing",
      tempo: 84,
      label: "Timing Builder"
    });

    assert.strictEqual(ok, true);
    assert.ok(captured);
    assert.strictEqual(captured.options.instrument, "piano");
  } finally {
    window.SparkExecutionGateway = originalGateway;
  }
});

test("SparkCore can start a selected performance song through an explicit helper", function() {
  var core = createDefaultSparkCore();
  core.openPerformanceSongSelection({
    songId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard",
    targetTechnique: "tap"
  });

  var startRequest = core.startSelectedPerformanceSong({
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard",
    speed: 0.8,
    mode: "mic",
    preset: "guitar_solo",
    countIn: true,
    targetTechnique: "tap"
  });

  assert.strictEqual(startRequest.chartId, "night_drive");
  assert.strictEqual(startRequest.songIndex, 1);
  assert.strictEqual(startRequest.songTitle, "Night Drive");
  assert.strictEqual(startRequest.arrangementType, "rhythm_chords");
  assert.strictEqual(startRequest.difficulty, "hard");
  assert.strictEqual(startRequest.speed, 0.8);
  assert.strictEqual(startRequest.mode, "mic");
  assert.strictEqual(startRequest.preset, "guitar_solo");
  assert.strictEqual(startRequest.targetTechnique, "tap");
  assert.strictEqual(core.getRuntimeState().activeScreen, "perform");
  assert.strictEqual(core.getRuntimeState().transport.status, "count_in");
  assert.strictEqual(core.getRuntimeState().performanceTargetTechnique, "tap");
});

test("SparkCore can build retry launch requests from performance runtime state", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard"
  });
  core.syncPerformanceRuntimeState("configure", {
    speed: 0.75,
    mode: "mic",
    preset: "guitar_solo",
    targetTechnique: "open"
  });

  var retryRequest = core.startPerformanceRetrySession({
    chartId: "night_drive"
  });
  assert.strictEqual(retryRequest.chartId, "night_drive");
  assert.strictEqual(retryRequest.arrangementType, "rhythm_chords");
  assert.strictEqual(retryRequest.difficulty, "hard");
  assert.strictEqual(retryRequest.speed, 0.75);
  assert.strictEqual(retryRequest.mode, "mic");
  assert.strictEqual(retryRequest.preset, "guitar_solo");
  assert.strictEqual(retryRequest.targetTechnique, "open");
  assert.strictEqual(retryRequest.songIndex, 1);
  assert.strictEqual(retryRequest.songTitle, "Night Drive");
  assert.strictEqual(core.getRuntimeState().activeScreen, "perform");
  assert.strictEqual(core.getRuntimeState().performanceChartId, "night_drive");
  assert.strictEqual(core.getRuntimeState().performanceTargetTechnique, "open");
  assert.strictEqual(core.getRuntimeState().transport.status, "running");

  var phraseRetryRequest = core.startPerformanceRetrySession({
    chartId: "night_drive",
    targetPhraseIndex: 2
  });
  assert.strictEqual(phraseRetryRequest.targetPhraseIndex, 2);
  assert.strictEqual(phraseRetryRequest.chartId, "night_drive");
});

test("SparkCore preserves focused imported technique through performance finish", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songTitle: "Night Drive",
    targetTechnique: "forced"
  });
  core.syncPerformanceRuntimeState("start", {
    chartId: "night_drive",
    difficulty: "hard",
    arrangementType: "rhythm_chords",
    speed: 1,
    mode: "midi",
    preset: "full_mix",
    targetTechnique: "forced"
  });
  core.syncPerformanceRuntimeState("finish", {
    screen: "perform_done",
    results: { title: "Night Drive", accuracy: 82 },
    targetTechnique: "forced"
  });

  assert.strictEqual(core.getRuntimeState().activeScreen, "perform_done");
  assert.strictEqual(core.getRuntimeState().performanceTargetTechnique, "forced");
});

test("SparkCore can build and apply calibration requests from runtime state", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("open_calibration", {
    source: "mic",
    globalOffsetMs: 12,
    midiOffsetMs: -4,
    micOffsetMs: 18
  });

  var startRequest = core.applyPerformanceCalibrationRequest("calibration_start", {
    source: "mic"
  });
  assert.strictEqual(startRequest.source, "mic");
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, true);
  assert.strictEqual(core.getRuntimeState().transport.status, "calibrating");

  var applyRequest = core.applyPerformanceCalibrationRequest("calibration_apply", {
    source: "mic",
    appliedOffsetMs: 10,
    globalOffsetMs: 22,
    midiOffsetMs: -4,
    micOffsetMs: 28
  });
  assert.strictEqual(applyRequest.appliedOffsetMs, 10);
  assert.strictEqual(core.getRuntimeState().performanceTimingOffsetMs, 22);
  assert.strictEqual(core.getRuntimeState().performanceMicOffsetMs, 28);

  var resetRequest = core.applyPerformanceCalibrationRequest("calibration_reset", {
    source: "mic",
    globalOffsetMs: 22,
    midiOffsetMs: -4,
    micOffsetMs: 0
  });
  assert.strictEqual(resetRequest.source, "mic");
  assert.strictEqual(core.getRuntimeState().performanceMicOffsetMs, 0);
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, false);
  assert.strictEqual(core.getRuntimeState().transport.status, "idle");
});

test("SparkCore can build performance completion requests from runtime state", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard"
  });

  var completionRequest = core.buildPerformanceCompletionRequest({
    performanceResults: {
      title: "Night Drive",
      accuracy: 88,
      stars: 4,
      score: 12345
    },
    xpAwarded: 9
  });

  assert.strictEqual(completionRequest.flow, SparkSessionTypes.FLOW_PERFORMANCE_SONG);
  assert.strictEqual(completionRequest.markPlanComplete, true);
  assert.strictEqual(completionRequest.chartId, "night_drive");
  assert.strictEqual(completionRequest.arrangementType, "rhythm_chords");
  assert.strictEqual(completionRequest.difficultyId, "hard");
  assert.strictEqual(completionRequest.songIndex, 1);
  assert.strictEqual(completionRequest.songTitle, "Night Drive");
  assert.strictEqual(completionRequest.xpAwarded, 9);
  assert.strictEqual(completionRequest.performanceResults.accuracy, 88);
});

test("SparkCore can build and apply performance navigation requests", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard"
  });
  core.syncPerformanceRuntimeState("finish", {
    screen: "perform_done",
    results: {
      title: "Night Drive",
      accuracy: 88
    }
  });

  var songsHomeRequest = core.buildPerformanceNavigationRequest("songs_home");
  assert.strictEqual(songsHomeRequest.activeScreen, "home");
  assert.strictEqual(songsHomeRequest.activeTab, "songs");
  assert.strictEqual(songsHomeRequest.transport.status, "idle");

  var songsHomeState = core.applyPerformanceNavigationRequest("songs_home");
  assert.strictEqual(songsHomeState.activeScreen, "home");
  assert.strictEqual(songsHomeState.activeTab, "songs");
  assert.strictEqual(songsHomeState.transport.status, "idle");

  var songDetailState = core.applyPerformanceNavigationRequest("song_detail");
  assert.strictEqual(songDetailState.activeScreen, "performance_song");
  assert.strictEqual(songDetailState.activeTab, "songs");
  assert.strictEqual(songDetailState.performanceSongTitle, "Night Drive");

  var stopReturnState = core.applyPerformanceNavigationRequest("return_after_stop");
  assert.strictEqual(stopReturnState.activeScreen, "performance_song");
  assert.strictEqual(stopReturnState.activeTab, "songs");
});

test("SparkCore can mirror performance song selection state explicitly", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard"
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.activeFlow, "performance_song");
  assert.strictEqual(state.activeScreen, "performance_song");
  assert.strictEqual(state.performanceChartId, "night_drive");
  assert.strictEqual(state.performanceSongIndex, 1);
  assert.strictEqual(state.performanceSongTitle, "Night Drive");
  assert.strictEqual(state.performanceArrangementType, "rhythm_chords");
  assert.strictEqual(state.performanceDifficultyId, "hard");
  assert.strictEqual(state.transport.status, "ready");
  assert.strictEqual(state.transport.positionMs, 0);
});

test("SparkCore runtime state can track shell navigation back to home tabs", function() {
  var core = createDefaultSparkCore();
  core.updateRuntimeState({
    activeScreen: "perform_done",
    activeTab: "songs",
    transport: { status: "completed", positionMs: 22000 }
  });

  var state = core.updateRuntimeState({
    activeScreen: "home",
    activeTab: "practice",
    transport: { status: "idle", positionMs: 0 }
  });

  assert.strictEqual(state.activeScreen, "home");
  assert.strictEqual(state.activeTab, "practice");
  assert.strictEqual(state.transport.status, "idle");
  assert.strictEqual(state.transport.positionMs, 0);
});

test("SparkCore performance runtime state can return from song detail back to songs home", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard"
  });

  var state = core.updateRuntimeState({
    activeScreen: "home",
    activeTab: "songs",
    transport: { status: "idle", positionMs: 0 }
  });

  assert.strictEqual(state.activeScreen, "home");
  assert.strictEqual(state.activeTab, "songs");
  assert.strictEqual(state.transport.status, "idle");
});

test("SparkCore guided runtime state can transition from done screen back to home", function() {
  var core = createDefaultSparkCore();
  core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 1 });
  core.syncGuidedRuntimeState({
    activeScreen: "guided_done",
    guidedStep: null,
    guidedNewMovePhase: null,
    transport: { status: "completed", positionMs: 0 }
  });
  var state = core.syncGuidedRuntimeState({
    activeScreen: "home",
    guidedStep: null,
    guidedNewMovePhase: null,
    transport: { status: "idle", positionMs: 0 }
  });

  assert.strictEqual(state.activeScreen, "home");
  assert.strictEqual(state.transport.status, "idle");
});

test("SparkPracticeBridge can project active session plans into legacy practice-plan shape", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
  var projected = SparkPracticeBridge.toLegacyPlan(plan);

  assert.strictEqual(projected.id, plan.id);
  assert.strictEqual(projected.flow, "daily_practice");
  assert.strictEqual(projected.focus, plan.focus);
  assert.strictEqual(projected.items.length, plan.segments.length);
  assert.strictEqual(projected.items[0].id, plan.segments[0].id);
  assert.ok(projected.items[0].label);
  assert.strictEqual(projected.completedItems, 0);
});

test("completeSession marks a single session segment complete through progress engine", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  var result = core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    itemId: plan.segments[0].id,
    result: {
      exerciseId: "transition_1",
      accuracy: 0.72,
      transitions: { "G->C": 0.72 },
      phrases: [{ id: "phrase_1", accuracy: 0.66 }]
    }
  });

  assert.strictEqual(result.completedItems, 1);
  assert.strictEqual(S.practicePlan.items[0].completed, true);
  assert.strictEqual(S.practicePlanComplete, false);
  assert.ok(result.itemResultSummary);
  assert.strictEqual(result.itemResultSummary.practiceResult.exerciseId, "transition_1");
  assert.strictEqual(result.itemResultSummary.adaptiveUpdate.exerciseId, "transition_1");
  assert.strictEqual(S.adaptiveState.transition_1.accuracy, 0.72);
  assert.strictEqual(S.practiceHistory.length, 1);
  assert.strictEqual(S.practiceHistory[0].exerciseId, "transition_1");
  assert.strictEqual(S.weakSpots.transitions["G->C"].attempts, 1);
  assert.strictEqual(S.weakSpots.phrases.phrase_1.attempts, 1);
});

test("completeSession finalizes the migrated daily plan and awards completion progress", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  core.completeSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, itemId: plan.segments[0].id });
  var result = core.completeSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, itemId: plan.segments[1].id });

  assert.strictEqual(result.planCompleted, true);
  assert.strictEqual(result.xpAwarded, 20);
  assert.strictEqual(result.completionSummary.sessionId, plan.id);
  assert.strictEqual(result.completionSummary.flow, "daily_practice");
  assert.strictEqual(result.completionSummary.focus, plan.focus);
  assert.strictEqual(result.completionSummary.itemCount, 2);
  assert.strictEqual(S.practicePlanComplete, true);
  assert.strictEqual(S.xp, 20);
  assert.strictEqual(S.practicePlanHistory.length, 1);
  assert.strictEqual(S.practicePlanHistory[0].sessionId, plan.id);
  assert.strictEqual(S.practicePlanHistory[0].flow, "daily_practice");
  assert.ok(lastProgressEvent);
  assert.strictEqual(lastProgressEvent.xpAwarded, 20);
});

test("completeSession preserves instrument ids in runtime state instead of collapsing to instrument types", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  plan.instrumentId = "pianospark";
  plan.instrumentType = "piano";
  core.currentPlan = plan;
  core.updateRuntimeState({
    activeInstrumentId: "pianospark",
    activeInstrumentType: "piano"
  });

  core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    itemId: plan.segments[0].id
  });

  assert.strictEqual(core.runtimeState.activeInstrumentId, "pianospark");
  assert.strictEqual(core.runtimeState.activeInstrumentType, "piano");
});

test("completeSession returns engine-owned rhythm learning summary while bridge syncs legacy mastery state", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  var result = core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    markPlanComplete: true,
    gameplayResult: {
      gameplay: { accuracy: 0.5 },
      learning: {
        skills: [{ id: "gtr_alt_strum_basic", delta: 0.08 }],
        weakAreas: ["late_strums"]
      }
    }
  });

  assert.strictEqual(result.xpAwarded, 30);
  assert.deepStrictEqual(result.sessionStatePatch.mastery.rhythm, { gtr_alt_strum_basic: 8 });
  assert.deepStrictEqual(result.sessionStatePatch.weakSpots.rhythmHighway, ["late_strums"]);
  assert.strictEqual(result.completionSummary.flow, "daily_practice");
  assert.strictEqual(result.completionSummary.xpAwarded, 30);
  assert.strictEqual(core.getLastSessionOutcome(), result);
  assert.strictEqual(S.mastery.rhythm.gtr_alt_strum_basic, 8);
  assert.deepStrictEqual(S.weakSpots.rhythmHighway, ["late_strums"]);
});

test("startSession routes guided sessions through core and syncs guided state", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 2 });
  var view = core.getActiveSessionView();

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "guided_session");
  assert.strictEqual(plan.segments.length, 1);
  assert.strictEqual(view.plan.context.guidedPlan.title, "Second Spark");
  assert.strictEqual(view.runtimeState.activeScreen, "guided_session");
  assert.strictEqual(S.guidedSession, 2);
  assert.strictEqual(S.guidedPlan.title, "Second Spark");
  assert.strictEqual(S.guidedStep, "spark");
});

test("completeSession advances guided progress without mutating the daily practice plan", function() {
  var core = createDefaultSparkCore();
  core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
  core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 1 });

  var result = core.completeSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, markPlanComplete: true });

  assert.strictEqual(result.planCompleted, true);
  assert.strictEqual(result.xpAwarded, 30);
  assert.deepStrictEqual(result.sessionStatePatch.guided.completedSessionNums, [1]);
  assert.strictEqual(result.sessionStatePatch.guided.nextGuidedSession, 2);
  assert.strictEqual(result.sessionStatePatch.guided.chordProgress.C, 25);
  assert.deepStrictEqual(S.completedGuidedSessions, [1]);
  assert.strictEqual(S.guidedSession, 2);
  assert.strictEqual(S.chordProgress.C, 25);
  assert.ok(S.practicePlan);
  assert.strictEqual(S.practicePlan.items.length, 2);
});

test("startSession routes performance song selection through core and syncs the legacy song state", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });
  var view = core.getActiveSessionView();

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "performance_song");
  assert.strictEqual(plan.segments.length, 1);
  assert.strictEqual(view.plan.context.performanceSong.songId, "night_drive");
  assert.strictEqual(view.runtimeState.performanceArrangementType, "rhythm_chords");
  assert.strictEqual(view.runtimeState.performanceDifficultyId, "hard");
  assert.strictEqual(S.performSongId, "night_drive");
  assert.strictEqual(S.performSongData.title, "Night Drive");
  assert.strictEqual(S.performArrangementType, "rhythm_chords");
  assert.strictEqual(S.performDifficulty, "hard");
});

test("createDefaultSparkCore registers ukulele and builds a ukulele-ready practice context", function() {
  SparkInstrumentAdapter = {
    getAppId: function() { return "ukespark"; },
    getInstrumentType: function() { return "ukulele"; },
    getCurriculumMap: function() { return SparkUkuleleLessons; },
    getCurriculum: function() { return { SESSIONS: SparkUkuleleLessons }; },
    getSongs: function() { return SparkUkuleleModule.getSongs(); }
  };

  var core = createDefaultSparkCore();
  var context = core.instrumentManager.getActiveContext();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  assert.strictEqual(context.instrumentType, "ukulele");
  assert.ok(context.adapter);
  assert.strictEqual(context.curriculumMap[0].id, "uke_01");
  assert.ok(context.rhythmAdapter);
  assert.strictEqual(context.rhythmAdapter.getLaneCount(), 4);
  assert.strictEqual(plan.segments.length, 2);
  assert.strictEqual(S.practicePlan.curriculum.nextLessonId, "uke_01");
});

test("createDefaultSparkCore can recover active instrument context when SparkInstrumentAdapter is unavailable", function() {
  SparkInstrumentAdapter = undefined;
  SparkInstruments = {
    getActive: function() {
      return {
        id: "pianospark",
        instrument: "piano",
        getData: function() {
          return {
            SESSIONS: [
              { num: 1, title: "Piano Spark 1", spark: { text: "Start" }, newMove: { chord: "C" } }
            ]
          };
        },
        getSongs: function() {
          return [{ title: "River Walk", artist: "Piano Suite" }];
        }
      };
    }
  };

  var core = createDefaultSparkCore();
  var context = core.instrumentManager.getActiveContext();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  assert.strictEqual(context.appId, "pianospark");
  assert.strictEqual(context.instrumentType, "piano");
  assert.strictEqual(context.songs[0].title, "River Walk");
  assert.strictEqual(plan.instrumentId, "pianospark");
  assert.strictEqual(plan.instrumentType, "piano");
  assert.strictEqual(S.practicePlan.instrumentId, "pianospark");
  assert.strictEqual(S.practicePlan.instrumentType, "piano");
});

test("ukulele guided sessions get a renderable guided plan shape", function() {
  SparkInstrumentAdapter = {
    getAppId: function() { return "ukespark"; },
    getInstrumentType: function() { return "ukulele"; },
    getCurriculumMap: function() { return SparkUkuleleLessons; },
    getCurriculum: function() { return { SESSIONS: SparkUkuleleLessons }; },
    getSongs: function() { return SparkUkuleleModule.getSongs(); }
  };

  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 1 });
  var guidedPlan = plan.context && plan.context.guidedPlan;

  assert.strictEqual(plan.flow, "guided_session");
  assert.ok(guidedPlan);
  assert.strictEqual(guidedPlan.title, "First Strum");
  assert.ok(guidedPlan.spark && guidedPlan.spark.text);
  assert.ok(guidedPlan.newMove && guidedPlan.newMove.text);
  assert.ok(guidedPlan.songSlice && guidedPlan.songSlice.text);
  assert.ok(guidedPlan.victoryLap && guidedPlan.victoryLap.text);
});

test("ukulele rhythm adapter selects richer chart variants as lessons progress", function() {
  var adapter = new SparkUkuleleRhythmAdapter();
  var switchingPayload = adapter.createPayload({
    curriculum: { nextLessonId: "uke_03" }
  });
  var patternPayload = adapter.createPayload({
    curriculum: { nextLessonId: "uke_04" }
  });
  var melodyPayload = adapter.createPayload({
    curriculum: { nextLessonId: "uke_07" }
  });
  var performancePayload = adapter.createPayload({
    curriculum: { nextLessonId: "uke_08" }
  });

  assert.strictEqual(switchingPayload.chartId, "uke_switch_flow_01");
  assert.strictEqual(patternPayload.chartId, "uke_island_pattern_01");
  assert.strictEqual(melodyPayload.chartId, "uke_melody_lift_01");
  assert.strictEqual(performancePayload.chartId, "uke_stage_flow_01");
  assert.ok(patternPayload.songChart.tracks.guitar.notes.length >= 8);
  assert.ok(performancePayload.songChart.tracks.guitar.notes.length >= 12);
});

test("createDefaultSparkCore registers piano as a first-class instrument adapter", function() {
  var pianoSongs = [
    { title: "Midnight Train", artist: "Piano Suite" },
    { title: "River Walk", artist: "Piano Suite" }
  ];
  var pianoSessions = [
    { num: 1, title: "Piano Spark 1", spark: { text: "Start" }, newMove: { chord: "C" } },
    { num: 2, title: "Piano Spark 2", spark: { text: "Continue" }, newMove: { chord: "G" } }
  ];

  SparkInstrumentAdapter = {
    getAppId: function() { return "pianospark"; },
    getInstrumentType: function() { return "piano"; },
    getCurriculumMap: function() { return [{ num: 1, title: "White Keys Only" }]; },
    getCurriculum: function() { return { SESSIONS: pianoSessions }; },
    getSongs: function() { return pianoSongs; }
  };

  var core = createDefaultSparkCore();
  var context = core.instrumentManager.getActiveContext();
  var performancePlan = core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songIndex: 1,
    arrangementType: "melody",
    difficultyId: "pro"
  });

  assert.ok(context.adapter);
  assert.strictEqual(context.instrumentType, "piano");
  assert.strictEqual(context.adapter.getType(), "piano");
  assert.strictEqual(context.curriculumMap[0].title, "White Keys Only");
  assert.strictEqual(context.songs[1].title, "River Walk");
  assert.strictEqual(performancePlan.context.performanceSong.songId, "river_walk");
  assert.strictEqual(S.performSongData.title, "River Walk");
  assert.strictEqual(S.performArrangementType, "melody");
  assert.strictEqual(S.performDifficulty, "pro");
});

test("createDefaultSparkCore registers bass as a first-class instrument adapter", function() {
  SparkInstrumentAdapter = {
    getAppId: function() { return "bassspark"; },
    getInstrumentType: function() { return "bass"; },
    getCurriculumMap: function() { return SparkBassModule.getCurriculumMap(); },
    getCurriculum: function() { return { SESSIONS: SparkBassModule.getCurriculumMap() }; },
    getSongs: function() { return SparkBassModule.getSongs(); }
  };

  var core = createDefaultSparkCore();
  var context = core.instrumentManager.getActiveContext();
  var performancePlan = core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songIndex: 0,
    arrangementType: "groove",
    difficultyId: "hard"
  });

  assert.ok(context.adapter);
  assert.strictEqual(context.instrumentType, "bass");
  assert.strictEqual(context.adapter.getType(), "bass");
  assert.strictEqual(context.curriculumMap[0].title, "First Groove");
  assert.strictEqual(context.songs[0].title, "Seven Nation Army");
  assert.ok(context.rhythmAdapter);
  assert.strictEqual(context.rhythmAdapter.getLaneCount(), 4);
  assert.strictEqual(performancePlan.context.performanceSong.songId, "seven_nation_army");
  assert.strictEqual(S.performSongData.title, "Seven Nation Army");
  assert.strictEqual(S.performArrangementType, "groove");
  assert.strictEqual(S.performDifficulty, "hard");
});

test("bass rhythm adapter selects richer chart variants as sessions progress", function() {
  var adapter = new SparkBassRhythmAdapter();
  var rootPayload = adapter.createPayload({
    curriculum: { nextLessonId: "session_1" }
  });
  var groovePayload = adapter.createPayload({
    curriculum: { nextLessonId: "session_11" }
  });
  var walkingPayload = adapter.createPayload({
    curriculum: { nextLessonId: "session_16" }
  });
  var ghostPayload = adapter.createPayload({
    curriculum: { nextLessonId: "session_21" }
  });
  var funkPayload = adapter.createPayload({
    curriculum: { nextLessonId: "session_27" }
  });

  assert.strictEqual(rootPayload.chartId, "bass_root_pulse_01");
  assert.strictEqual(groovePayload.chartId, "bass_fifth_drive_01");
  assert.strictEqual(walkingPayload.chartId, "bass_walk_intro_01");
  assert.strictEqual(ghostPayload.chartId, "bass_ghost_grid_01");
  assert.strictEqual(funkPayload.chartId, "bass_funk_push_01");
  assert.strictEqual(rootPayload.songChart.metadata.laneCount, 4);
  assert.ok(walkingPayload.songChart.tracks.guitar.notes.length >= 6);
  assert.ok(funkPayload.songChart.tracks.guitar.notes.length >= 16);
});

test("SparkBassModule exposes authored advanced exercises for later-phase bass skills", function() {
  var walking = SparkBassModule.getExercises("walking_bass");
  var slap = SparkBassModule.getExercises("slap");
  var ghost = SparkBassModule.getExercises("ghost_notes");

  assert.strictEqual(walking[0].id, "bass_walk_lines_01");
  assert.strictEqual(walking[0].focus, "walking_bass");
  assert.strictEqual(slap[0].id, "bass_slap_pop_01");
  assert.strictEqual(slap[0].focus, "slap");
  assert.strictEqual(ghost[0].id, "bass_ghost_grid_02");
  assert.strictEqual(ghost[0].focus, "ghost_notes");
});

test("completeSession routes performance completion rewards through core", function() {
  var core = createDefaultSparkCore();
  core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });

  var result = core.completeSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    markPlanComplete: true,
    performanceResults: {
      accuracy: 88,
      stars: 4,
      score: 1234,
      maxCombo: 18,
      totalEvents: 6
    },
    rewardSummary: {
      xpGained: 320,
      totalXP: 1240,
      level: 5,
      previousLevel: 4,
      leveledUp: true,
      nextLevelXP: 1400,
      summary: {
        timingScore: 420,
        maxCombo: 18,
        milestones: 2,
        sessionBonus: 25
      }
    },
    targetTechnique: "tap"
  });

  assert.strictEqual(result.planCompleted, true);
  assert.strictEqual(result.xpAwarded, 320);
  assert.strictEqual(result.rewardSummary.totalXP, 1240);
  assert.strictEqual(result.performanceSummary.songId, "night_drive");
  assert.strictEqual(result.performanceSummary.arrangementType, "rhythm_chords");
  assert.strictEqual(result.performanceSummary.difficultyId, "hard");
  assert.strictEqual(result.performanceSummary.accuracy, 88);
  assert.strictEqual(result.performanceSummary.stars, 4);
  assert.strictEqual(result.performanceSummary.rewardSummary.level, 5);
  assert.strictEqual(result.masterySummary.skillId, "tap");
  assert.ok(result.masterySummary.mastery > 0.75);
  assert.strictEqual(result.masterySummary.unlocked, true);
  assert.ok(typeof result.masterySummary.lastPracticed === "number");
  assert.strictEqual(result.performanceSummary.masterySummary.skillId, "tap");
  assert.ok(S.skillMastery.tap);
  assert.strictEqual(S.xp, 320);
  assert.strictEqual(S.xpToast.amount, 320);
  assert.strictEqual(S.playerXP, 1240);
  assert.strictEqual(S.playerLevel, 5);
});

test("completeSession applies psychology comeback multipliers to performance rewards", function() {
  var core = createDefaultSparkCore();
  S.psychologyComeback = true;
  S.streak = 2;
  S.playerXP = 400;
  core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });

  var result = core.completeSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    markPlanComplete: true,
    performanceResults: {
      accuracy: 88,
      stars: 4,
      score: 1234,
      maxCombo: 18,
      totalEvents: 6
    },
    rewardSummary: {
      xpGained: 100,
      totalXP: 500,
      level: 3,
      previousLevel: 3,
      leveledUp: false,
      nextLevelXP: 700,
      summary: {
        timingScore: 420,
        maxCombo: 18,
        milestones: 2,
        sessionBonus: 25
      }
    }
  });

  assert.strictEqual(result.xpAwarded, 200);
  assert.strictEqual(result.rewardSummary.xpGained, 200);
  assert.strictEqual(result.rewardSummary.totalXP, 600);
  assert.strictEqual(result.psychologySummary.rewardMultiplier, 2);
  assert.strictEqual(result.psychologySummary.comeback, true);
  assert.strictEqual(S.psychologyComeback, false);
});

test("completeSession can carry focused bass rhythm drill progress into bass skill state", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE
  });

  plan.segments = [
    SparkSessionSegment.create({
      id: "bass_walk_lines_01",
      type: SparkSessionSegmentTypes.RHYTHM_HIGHWAY,
      label: "Walk Lines 01",
      meta: {}
    })
  ];

  var result = core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    itemId: "bass_walk_lines_01",
    gameplayContext: {
      instrument: "bass",
      exerciseFocus: "walking_bass"
    },
    gameplayResult: {
      gameplay: {
        accuracy: 0.74,
        maxCombo: 11
      },
      learning: {
        weakAreas: ["late"]
      }
    }
  });

  assert.ok(result.sessionStatePatch.bassSkillProgress);
  assert.ok(result.sessionStatePatch.bassSkillProgress.walking_bass);
  assert.ok(result.sessionStatePatch.bassSkillProgress.walking_bass.timing < result.sessionStatePatch.bassSkillProgress.walking_bass.accuracy);
  assert.ok(S.bassSkillProgress.walking_bass);
});

test("adaptive skill selector prioritizes weaker older skills", function() {
  var now = Date.now();
  var selected = selectAdaptiveNextSkill({
    chord_switching: {
      mastery: 0.8,
      lastPracticed: now - (1 * 24 * 60 * 60 * 1000)
    },
    strumming_patterns: {
      mastery: 0.6,
      lastPracticed: now - (5 * 24 * 60 * 60 * 1000)
    }
  });

  assert.strictEqual(selected, "strumming_patterns");
});

test("curriculum adaptive context surfaces review skill and next lesson", function() {
  S.skillMastery = {
    chord_switching: {
      mastery: 0.62,
      lastPracticed: Date.now() - (4 * 24 * 60 * 60 * 1000)
    }
  };

  var context = SparkCurriculumService.buildAdaptiveSessionContext({
    skills: S.skillMastery
  }, {
    curriculumMap: [
      { id: "session_1", title: "First Spark" },
      { id: "session_2", title: "Second Spark" }
    ]
  });

  assert.strictEqual(context.reviewSkillId, "chord_switching");
  assert.strictEqual(context.nextLessonId, "session_1");
  assert.ok(context.reviewScore < 0.62);
  assert.ok(context.reviewDaysSincePractice >= 3.9);
});

test("daily practice sessions carry adaptive review context from skill mastery", function() {
  var core = createDefaultSparkCore();
  S.skillMastery = {
    strumming_patterns: {
      mastery: 0.58,
      lastPracticed: Date.now() - (6 * 24 * 60 * 60 * 1000)
    }
  };

  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, forceRebuild: true });

  assert.strictEqual(plan.context.adaptiveSession.reviewSkillId, "strumming_patterns");
  assert.strictEqual(plan.context.adaptiveSession.nextLessonId, "session_1");
  assert.ok(plan.context.adaptiveSession.reviewScore < 0.58);
});

test("daily practice sessions carry psychology shaping context and update streak state", function() {
  var core = createDefaultSparkCore();
  S.streak = 6;
  S.lastSessionDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, forceRebuild: true });

  assert.ok(plan.context.psychology);
  assert.strictEqual(plan.context.psychology.streak, 7);
  assert.strictEqual(plan.context.psychology.rewardMultiplier, 1.5);
  assert.strictEqual(plan.context.psychology.comeback, false);
  assert.strictEqual(S.streak, 7);
  assert.strictEqual(S.practiceStreak, 7);
});

test("daily practice sessions mark comeback sessions for returning players", function() {
  var core = createDefaultSparkCore();
  S.streak = 4;
  S.lastSessionDate = new Date(Date.now() - (3 * 86400000)).toISOString().slice(0, 10);

  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, forceRebuild: true });

  assert.strictEqual(plan.context.psychology.comeback, true);
  assert.strictEqual(plan.context.psychology.rewardMultiplier, 2);
  assert.strictEqual(plan.context.psychology.sessionType, "comeback");
  assert.deepStrictEqual(plan.context.psychology.structure, ["easy_win", "review", "reward"]);
  assert.strictEqual(S.psychologyComeback, true);
});

test("legacy practice plan labels use a readable ASCII chord transition separator", function() {
  var plan = new SessionPlan({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    segments: [{
      id: "transition_gc",
      type: "transition",
      exerciseIds: ["ex_transition_gc"]
    }],
    exercises: [{
      id: "ex_transition_gc",
      type: "transition",
      data: {
        core: {
          chords: ["G", "C"]
        }
      }
    }]
  });

  var legacyPlan = plan.toLegacyPracticePlan();
  assert.strictEqual(legacyPlan.items[0].label, "G -> C");
});

test("shared plan subtitles use a readable ASCII separator", function() {
  eval(loadJS("js/pages/plan.js"));
  assert.strictEqual(formatPlanItemSubtitle({
    type: "performance_song",
    meta: {
      instrument: "ukulele",
      exerciseFocus: "rhythm_flow"
    }
  }), "ukulele | rhythm flow | performance song");
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
