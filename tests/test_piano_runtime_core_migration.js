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
  global.document = {
    body: {
      classList: {
        toggle: function() {}
      }
    },
    addEventListener: function() {},
    getElementById: function() { return null; }
  };
  global.prompt = function() { return ""; };
  global.SparkSessionTypes = {
    FLOW_GUIDED_SESSION: "guided_session",
    FLOW_PERFORMANCE_SONG: "performance_song"
  };
  global.S = {
    currentSession: 2,
    guidedSession: 2,
    completedSessions: [],
    chordProg: {},
    level: 1,
    lhLevel: 1,
    bpm: 72,
    sessionPlan: null,
    sessionStep: null,
    screen: "home",
    _showroomOverride: null,
    _showroomLessonId: null,
    launcherView: null,
    fingerWarmUpDone: false,
    paused: false,
    performDifficulty: "normal",
    performArrangementType: "block_chords",
    performSongData: null,
    performSongId: ""
  };
  global.PIANO_DATA = {
    CURRICULUM: [{ num: 1, title: "First Steps", sessions: "1-3", lhPattern: "R1" }],
    LH_PATTERNS: [{ id: "R1" }],
    BADGES: []
  };
  global.PIANO_CURRICULUM = global.PIANO_DATA.CURRICULUM;
  global.PIANO_SESSIONS = [
    { num: 1, title: "Session 1", bpm: 70, spark: { text: "start" }, newMove: { chord: "C" } },
    { num: 2, title: "Session 2", bpm: 84, spark: { text: "next" }, newMove: { chord: "G" } }
  ];
  global.PIANO_SONGS = [];
  global.PIANO_DATA.SONGS = [
    { title: "Midnight Train", artist: "Piano Suite", bpm: 72, chords: ["C", "G"], progression: ["C", "G"], style: "block" },
    { title: "River Walk", artist: "Piano Suite", bpm: 88, chords: ["F", "Am"], progression: ["F", "Am", "F"], style: "block" }
  ];
  global.PIANO_SONGS = global.PIANO_DATA.SONGS;
  global.PIANO_DATA.FINGER_EXERCISES = [];
  global.PIANO_DATA.LC = {};
  global.PIANO_DATA.LN = {};
  global.PIANO_DATA.CHORDS = {};
  global.PIANO_DATA.SCALES = [];
  global.PIANO_DATA.FINGER_BADGES = [];
  global.PIANO_DATA.DAILY_TYPES = [];
  global.PIANO_DATA.PLAY_STYLES = [];
  global.PIANO_DATA.REWARD_PHASES = [];
  global.PIANO_DATA.CHORD_COLORS = {};

  global.saveStateCalls = 0;
  global.renderCalls = 0;
  global.practiceDateChecks = 0;
  global.levelChecks = 0;
  global.confettiCalls = 0;
  global.toasts = [];
  global.playedSounds = [];
  global.sparkCoreCalls = [];
  global.performanceStarts = [];
  global.performanceNavigationCalls = [];
  global.performanceCalibrationOpenCalls = [];
  global.songRuntimeCalls = [];
  global.dashboardNavigationCalls = [];
  global.dashboardSectionCalls = [];
  global.homeReturnCalls = [];
  global.utilityScreenCalls = [];
  global.utilityReturnCalls = [];
  global.midiSettingsSyncCalls = [];
  global.curriculumSyncCalls = [];
  global.midiImportSyncCalls = [];
  global.cloudWorkflowCalls = [];
  global.stemPlayerCalls = [];
  global.dashboardRequestCalls = [];
  global.dashboardRefreshCalls = [];
  global.dashboardInitCalls = [];
  global.dashboardChallengeRewardCalls = [];
  delete global.runSparkActionFamilies;

  global.saveState = function() { saveStateCalls++; };
  global.render = function() { renderCalls++; };
  global.showToast = function(msg) { toasts.push(msg); };
  global.checkPracticeDate = function() { practiceDateChecks++; };
  global.checkLevelUp = function() { levelChecks++; };
  global.pianoCheckBadges = function() { return []; };
  global.pianoShowConfetti = function() { confettiCalls++; };
  global.stopMetronome = function() {};
  global.stopLHPattern = function() {};
  global.stopWatchDemo = function() {};
  global.stopDetection = function() {};
  global.addPracticeSecond = function() {};
  global.applyPerformanceDifficultyToState = function(value) { S.performDifficulty = value || "normal"; };
  global.normalizeSongId = function(song) {
    var title = song && song.title ? song.title : "";
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  };
  global.buildPerformanceChartFromSong = function(song, arrangementType) {
    return {
      id: (song && song.title ? song.title.toLowerCase().replace(/[^a-z0-9]+/g, "_") : "generated"),
      title: song && song.title ? song.title : "Generated",
      arrangementType: arrangementType || "block_chords",
      events: [{ id: 1, t: 0, dur: 1, laneLabel: "C" }]
    };
  };
  global.startPerformance = function(chart, options) {
    performanceStarts.push({ chart: chart, options: options });
  };
  global.stopPerformance = function() {};
  global.clickableDiv = function() {};
  global.ifThenCard = function() {};
  global.fireMicro = function() {};
  global.escHTML = function(v) { return String(v); };
  global.getRewardPhase = function() { return null; };
  global.allChordKeys = function() { return []; };
  global.allChords = function() { return []; };
  global.findChord = function() { return null; };
  global.chordsForLevel = function() { return []; };
  global.chordsUpToLevel = function() { return []; };
  global.chordMidi = function() { return []; };
  global.chordFingers = function() { return []; };
  global.chordNoteNames = function() { return []; };
  global.getAvailableExercises = function() { return []; };
  global.getSessionExercise = function() { return null; };
  global.getWarmUpExercise = function() { return null; };
  global.resetProgress = function() {};
  global.undoReset = function() {};
  global.startOnboarding = function() {};
  global.continueOnboarding = function() {};
  global.PerformanceTransport = { now: function() { return 0; } };
  global.PerformanceInput = { heldMidiNotes: {}, recentMidiNoteOns: [], latestPitchClasses: [] };
  global.PianoAudio = {
    playSound: function(name) { playedSounds.push(name); }
  };
  global.T = {};
  global.metronomeInterval = null;

  global.sparkCore = {
    startSession: function(payload) {
      sparkCoreCalls.push({ fn: "startSession", payload: payload });
      if (payload.flow === "performance_song") {
        return {
          context: {
            performanceSong: {
              songData: global.PIANO_DATA.SONGS[payload.songIndex],
              songId: "river_walk",
              arrangementType: payload.arrangementType,
              difficultyId: payload.difficultyId
            }
          }
        };
      }
      return {
        context: {
          guidedSession: 2,
          guidedPlan: {
            num: 2,
            title: "Session 2",
            bpm: 84,
            spark: { text: "next" },
            newMove: { chord: "G" }
          }
        }
      };
    },
    completeSession: function(payload) {
      sparkCoreCalls.push({ fn: "completeSession", payload: payload });
      return {
        audioCue: "levelup",
        sessionStatePatch: {
          guided: {
            completedSessionNums: [2],
            nextGuidedSession: 3,
            chordProgress: { G: 25 }
          }
        }
      };
    }
  };
  global.sparkCore.openGuidedSession = function(payload) {
    sparkCoreCalls.push({ fn: "openGuidedSession", payload: payload });
    return {
      context: {
        guidedSession: 2,
        guidedPlan: {
          num: 2,
          title: "Session 2",
          bpm: 84,
          spark: { text: "next" },
          newMove: { chord: "G" }
        }
      }
    };
  };
  global.sparkCore.completeGuidedSession = function(payload) {
    sparkCoreCalls.push({ fn: "completeGuidedSession", payload: payload || {} });
    return {
      audioCue: "levelup",
      sessionStatePatch: {
        guided: {
          completedSessionNums: [2],
          nextGuidedSession: 3,
          chordProgress: { G: 25 }
        }
      }
    };
  };
  global.sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        context: {
          performanceSong: {
            songData: global.PIANO_DATA.SONGS[1],
            songId: "river_walk",
            arrangementType: "block_chords",
            difficultyId: "normal"
          }
        }
      }
    };
  };
  global.sparkCore.openPerformanceSongSelection = function(payload) {
    sparkCoreCalls.push({ fn: "openPerformanceSongSelection", payload: payload });
    return payload;
  };
  global.sparkCore.openDashboardPracticePlan = function(payload) {
    sparkCoreCalls.push({ fn: "openDashboardPracticePlan", payload: payload || {} });
    return payload || {};
  };
  global.sparkCore.openPracticePlanScreen = function(payload) {
    sparkCoreCalls.push({ fn: "openPracticePlanScreen", payload: payload || {} });
    return payload || {};
  };
  global.sparkCore.openCareerSongSelection = function(payload) {
    sparkCoreCalls.push({ fn: "openCareerSongSelection", payload: payload });
    return payload;
  };
  global.sparkCore.startSelectedPerformanceSong = function(payload) {
    sparkCoreCalls.push({ fn: "startSelectedPerformanceSong", payload: payload });
    return payload;
  };
  global.sparkCore.syncPerformanceRuntimeState = function(action, payload) {
    sparkCoreCalls.push({ fn: "syncPerformanceRuntimeState", action: action, payload: payload });
    return payload;
  };
  global.sparkCore.applyPerformanceNavigationRequest = function(target) {
    performanceNavigationCalls.push(target);
    return { activeScreen: "home", activeTab: "songs" };
  };
  global.openPerformanceSongSelectionRequest = function(payload) {
    return global.sparkCore.openPerformanceSongSelection(payload);
  };
  global.openDashboardPracticePlanRequest = function(payload) {
    return global.sparkCore.openDashboardPracticePlan(payload);
  };
  global.openPracticePlanScreenRequest = function(payload) {
    return global.sparkCore.openPracticePlanScreen(payload);
  };
  global.openCareerSongSelectionRequest = function(payload) {
    return global.sparkCore.openCareerSongSelection(payload);
  };
  global.openGuidedSessionRequest = function(payload) {
    return global.sparkCore.openGuidedSession(payload);
  };
  global.completeGuidedSessionRequest = function(payload) {
    return global.sparkCore.completeGuidedSession(payload);
  };
  global.startSelectedPerformanceSongRequest = function(payload) {
    return global.sparkCore.startSelectedPerformanceSong(payload);
  };
  global.applyPerformanceNavigationRequest = function(target) {
    return global.sparkCore.applyPerformanceNavigationRequest(target);
  };
  global.openPerformanceCalibrationRequest = function(payload) {
    performanceCalibrationOpenCalls.push(payload || {});
    return payload || {};
  };
  global.openSongSessionRequest = function(payload) {
    songRuntimeCalls.push({ fn: "openSongSessionRequest", payload: payload });
    return payload;
  };
  global.syncSongRuntimeRequest = function(action, payload) {
    songRuntimeCalls.push({ fn: "syncSongRuntimeRequest", action: action, payload: payload });
    return payload;
  };
  global.applySongNavigationRequest = function(target, payload) {
    songRuntimeCalls.push({ fn: "applySongNavigationRequest", target: target, payload: payload || {} });
    return { activeScreen: "home", activeTab: "songs" };
  };
  global.applyDashboardNavigationRequest = function(target) {
    dashboardNavigationCalls.push(target);
    return { activeScreen: target };
  };
  global.openDashboardSectionRequest = function(target) {
    dashboardSectionCalls.push(target);
    return { activeScreen: target };
  };
  global.returnFromHomeFamilyRequest = function(payload) {
    homeReturnCalls.push(payload);
    return { activeScreen: payload && payload.currentScreen === "home_dash" ? "home_dash" : "home" };
  };
  global.openUtilityScreenRequest = function(target) {
    utilityScreenCalls.push(target);
    return { activeScreen: target };
  };
  global.returnFromUtilityFamilyRequest = function(payload) {
    utilityReturnCalls.push(payload);
    return { activeScreen: "home" };
  };
  global.syncMidiSettingsStateRequest = function(payload) {
    midiSettingsSyncCalls.push(payload || {});
    return payload || {};
  };
  global.syncCurriculumStateRequest = function(payload) {
    curriculumSyncCalls.push(payload || {});
    return payload || {};
  };
  global.syncMidiImportStateRequest = function(payload) {
    if (!payload) {
      payload = {
        summary: S.importedMidi ? {
          sourceName: S.importedMidi.sourceName || null,
          trackCount: Array.isArray(S.importedMidi.tracks) ? S.importedMidi.tracks.length : 0
        } : null,
        assignments: S.importedMidiAssignments || {},
        seedMode: null,
        seedTitle: S.importedMidiSeedPreview && S.importedMidiSeedPreview.title ? S.importedMidiSeedPreview.title : null
      };
    }
    midiImportSyncCalls.push(payload);
    return payload;
  };
  global.applyCloudWorkflowRequest = function(action, payload) {
    cloudWorkflowCalls.push({ action: action, payload: payload || {} });
    return payload || {};
  };
  global.openStemPlayerRequest = function() {
    stemPlayerCalls.push({ fn: "openStemPlayerRequest" });
    return { activeScreen: "stems" };
  };
  global.closeStemPlayerRequest = function() {
    stemPlayerCalls.push({ fn: "closeStemPlayerRequest" });
    return { activeScreen: "home" };
  };
  global.applyDashboardRequest = function(payload) {
    dashboardRequestCalls.push(payload);
    return payload;
  };
  global.refreshDashboardSnapshotRequest = function(payload) {
    dashboardRefreshCalls.push(payload);
    return payload;
  };
  global.initializeDashboardChallengesRequest = function(payload) {
    dashboardInitCalls.push(payload);
    return payload;
  };
  global.applyDashboardChallengeRewardRequest = function(challengeId) {
    dashboardChallengeRewardCalls.push(challengeId);
    return { challengeId: challengeId };
  };
  global.generateRecommendations = function() {
    S.recommendations = [{ id: "rec_1", title: "Practice River Walk" }];
    return S.recommendations;
  };
  global.generatePersonalInsights = function() {
    S.personalInsights = { strongestSkills: [{ id: "timing" }] };
    return S.personalInsights;
  };
  global.initializeChallengesForCurrentCycle = function() {
    S.activeChallenges = [{ id: "daily_1", title: "Daily Challenge" }];
    return S.activeChallenges;
  };
  global.getPerformanceRetryRequest = function(payload) {
    sparkCoreCalls.push({ fn: "getPerformanceRetryRequest", payload: payload });
    return payload;
  };
}

resetState();
eval(loadJS("js/instruments/piano/app.js"));

console.log("\n--- Piano Runtime Core Migration ---");

test("start_guided_session delegates to sparkCore and syncs piano session aliases", function() {
  pianoAct("start_guided_session");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "openGuidedSession");
  assert.strictEqual(S.currentSession, 2);
  assert.strictEqual(S.sessionPlan.title, "Session 2");
  assert.strictEqual(S.sessionStep, "spark");
  assert.strictEqual(S.screen, "session");
  assert.strictEqual(S.adaptiveBpm, 84);
});

test("start_guided_session honors requested session and clears showroom override", function() {
  S._showroomOverride = "lesson";
  S._showroomLessonId = "1";
  S.launcherView = "path";

  pianoAct("start_guided_session", "1");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].payload.sessionNum, 1);
  assert.strictEqual(S._showroomOverride, null);
  assert.strictEqual(S._showroomLessonId, null);
  assert.strictEqual(S.launcherView, null);
  assert.strictEqual(S.screen, "session");
});

test("piano guided actions let the shared action family own showroom lesson launches", function() {
  var familyCalls = [];
  global.runSparkActionFamilies = function(action, value) {
    familyCalls.push([action, value]);
    return true;
  };

  assert.strictEqual(pianoAct("start_guided_session", "1"), true);
  assert.strictEqual(pianoAct("resume_guided_session"), true);

  assert.deepStrictEqual(familyCalls, [
    ["start_guided_session", "1"],
    ["resume_guided_session", undefined]
  ]);
  assert.deepStrictEqual(sparkCoreCalls, []);
  assert.strictEqual(S.screen, "home");
});

test("start_guided_session legacy fallback honors requested piano lesson number", function() {
  delete global.openGuidedSessionRequest;
  global.sparkCore = null;
  S.currentSession = 2;

  pianoAct("start_guided_session", "1");

  assert.strictEqual(S.currentSession, 1);
  assert.strictEqual(S.sessionPlan.title, "Session 1");
  assert.strictEqual(S.sessionStep, "spark");
  assert.strictEqual(S.screen, "session");
});

test("start_session opens the piano chord practice session screen", function() {
  var originalSetInterval = global.setInterval;
  var originalClearInterval = global.clearInterval;
  var intervalCalls = [];
  global.setInterval = function(fn, ms) {
    intervalCalls.push({ fn: fn, ms: ms });
    return 123;
  };
  global.clearInterval = function() {};
  S.practiceLen = 90;

  try {
    pianoAct("start_session", "C");
  } finally {
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  }

  assert.strictEqual(S.chord, "C");
  assert.strictEqual(S.screen, "session");
  assert.strictEqual(S.timer, 90);
  assert.strictEqual(S.active, true);
  assert.strictEqual(intervalCalls.length, 1);
});

test("resume_guided_session reopens the active piano guided shell without restarting it", function() {
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: {
            guidedSession: 2,
            guidedPlan: {
              num: 2,
              title: "Session 2",
              bpm: 84,
              spark: { text: "next" },
              newMove: { chord: "G" }
            }
          }
        },
        runtimeState: {
          activeScreen: "guided_session",
          guidedStep: "songSlice",
          guidedNewMovePhase: null
        }
      };
    }
  };

  pianoAct("resume_guided_session");

  assert.strictEqual(sparkCoreCalls.length, 0);
  assert.strictEqual(S.currentSession, 2);
  assert.strictEqual(S.guidedSession, 2);
  assert.strictEqual(S.sessionPlan.title, "Session 2");
  assert.strictEqual(S.sessionStep, "songSlice");
  assert.strictEqual(S.screen, "session");
  assert.strictEqual(saveStateCalls, 1);
});

test("resume_guided_session clears any stale guided stop confirmation", function() {
  S.guidedStopConfirm = true;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: {
            guidedSession: 2,
            guidedPlan: {
              num: 2,
              title: "Session 2",
              bpm: 84,
              spark: { text: "next" },
              newMove: { chord: "G" }
            }
          }
        },
        runtimeState: {
          activeScreen: "guided_session",
          guidedStep: "spark"
        }
      };
    }
  };

  pianoAct("resume_guided_session");

  assert.strictEqual(S.guidedStopConfirm, false);
  assert.strictEqual(S.screen, "session");
});
test("complete_victory_lap delegates to sparkCore and syncs piano completion aliases", function() {
  S.sessionPlan = {
    num: 2,
    title: "Session 2",
    bpm: 84,
    newMove: { chord: "G" }
  };
  S.sessionStep = "victoryLap";
  S.screen = "session";

  pianoAct("complete_victory_lap");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "completeGuidedSession");
  assert.deepStrictEqual(S.completedSessions, [2]);
  assert.strictEqual(S.currentSession, 3);
  assert.strictEqual(S.guidedSession, 3);
  assert.strictEqual(S.chordProg.G, 25);
  assert.strictEqual(S.screen, "home");
  assert.strictEqual(S.sessionPlan, null);
  assert.ok(playedSounds.indexOf("levelup") >= 0);
  assert.strictEqual(confettiCalls, 1);
});

test("open_perform_song delegates to sparkCore and syncs piano performance aliases", function() {
  pianoAct("open_perform_song", "1");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "openPerformanceSongSelection");
  assert.strictEqual(sparkCoreCalls[0].payload.songIndex, 1);
  assert.strictEqual(S.performSongData.title, "River Walk");
  assert.strictEqual(S.performSongId, "river_walk");
  assert.strictEqual(S.performArrangementType, "block_chords");
  assert.strictEqual(S.performDifficulty, "normal");
  assert.strictEqual(S.screen, "performSong");
});

test("open_perform_song does not depend on the legacy song id helper", function() {
  delete global.normalizeSongId;

  pianoAct("open_perform_song", "1");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].payload.songId, "river_walk");
  assert.strictEqual(S.performSongId, "river_walk");
  assert.strictEqual(S.screen, "performSong");
});

test("openPlan delegates piano dashboard practice entry to the shared helper", function() {
  pianoAct("openPlan");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "openPracticePlanScreen");
  assert.strictEqual(S.screen, "practicePlan");
});

test("openCareerSong delegates to shared performance selection helper and syncs piano aliases", function() {
  global.getCareerItem = function(type, id) {
    if (type !== "songs" || id !== "career_river") return null;
    return { title: "Career River", artist: "Piano Suite", bpm: 76, chords: ["C"], progression: ["C", "G"] };
  };

  pianoAct("openCareerSong", "career_river");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "openCareerSongSelection");
  assert.strictEqual(sparkCoreCalls[0].payload.songId, "career_river");
  assert.strictEqual(sparkCoreCalls[0].payload.songData.title, "Career River");
  assert.strictEqual(S.performSongData.title, "Career River");
  assert.strictEqual(S.performSongId, "career_river");
  assert.strictEqual(S.screen, "performSong");
});

test("performStart delegates launch request construction to sparkCore helpers", function() {
  S.performSongData = { title: "River Walk", artist: "Piano Suite" };
  S.performArrangementType = "block_chords";
  S.performDifficulty = "hard";
  S.performSpeed = 0.8;
  S.performMode = "mic";

  pianoAct("performStart");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "startSelectedPerformanceSong");
  assert.strictEqual(sparkCoreCalls[0].payload.difficulty, "hard");
  assert.strictEqual(sparkCoreCalls[0].payload.speed, 0.8);
  assert.strictEqual(performanceStarts.length, 1);
  assert.strictEqual(performanceStarts[0].options.difficulty, "hard");
  assert.strictEqual(performanceStarts[0].options.speed, 0.8);
  assert.strictEqual(performanceStarts[0].options.mode, "mic");
});

test("piano performance controls let the shared action family own shared run actions", function() {
  var familyCalls = [];
  global.runSparkActionFamilies = function(action, value) {
    familyCalls.push([action, value]);
    return true;
  };

  assert.strictEqual(pianoAct("performStart"), true);
  assert.strictEqual(pianoAct("pausePerform"), true);
  assert.strictEqual(pianoAct("resumePerform"), true);
  assert.strictEqual(pianoAct("performRetry"), true);
  assert.strictEqual(pianoAct("stopPerform"), true);

  assert.deepStrictEqual(familyCalls, [
    ["performStartFromSong", undefined],
    ["pausePerform", undefined],
    ["resumePerform", undefined],
    ["performRetry", undefined],
    ["stopPerform", undefined]
  ]);
  assert.strictEqual(performanceStarts.length, 0);
});

test("select_song mirrors piano song detail selection into song-session core helpers", function() {
  pianoAct("select_song", "1");

  assert.strictEqual(S.songIdx, 1);
  assert.strictEqual(S.songChordIdx, 0);
  assert.strictEqual(S.songPlaying, false);
  assert.strictEqual(S.bpm, global.PIANO_DATA.SONGS[1].bpm);
  assert.strictEqual(songRuntimeCalls.length, 1);
  assert.strictEqual(songRuntimeCalls[0].fn, "openSongSessionRequest");
  assert.strictEqual(songRuntimeCalls[0].payload.songData.title, "River Walk");
  assert.strictEqual(songRuntimeCalls[0].payload.source, "builtin");
});

test("play_song mirrors piano song playback state into song-session core helpers", function() {
  S.songIdx = 1;
  S.songChordIdx = 0;
  S.bpm = 88;

  pianoAct("play_song");

  assert.strictEqual(S.songPlaying, true);
  assert.strictEqual(songRuntimeCalls.length, 1);
  assert.strictEqual(songRuntimeCalls[0].fn, "syncSongRuntimeRequest");
  assert.strictEqual(songRuntimeCalls[0].action, "play");
  assert.strictEqual(songRuntimeCalls[0].payload.songData.title, "River Walk");

  pianoAct("play_song");

  assert.strictEqual(S.songPlaying, false);
  assert.strictEqual(songRuntimeCalls.length, 2);
  assert.strictEqual(songRuntimeCalls[1].fn, "syncSongRuntimeRequest");
  assert.strictEqual(songRuntimeCalls[1].action, "pause");
});

test("song_back mirrors piano song exit into song-session navigation helper", function() {
  S.songIdx = 1;
  S.songPlaying = true;
  T.song = 42;

  pianoAct("song_back");

  assert.strictEqual(S.songIdx, null);
  assert.strictEqual(S.songPlaying, false);
  assert.strictEqual(songRuntimeCalls.length, 1);
  assert.strictEqual(songRuntimeCalls[0].fn, "applySongNavigationRequest");
  assert.strictEqual(songRuntimeCalls[0].target, "songs_home");
});

test("dashboard entry actions mirror piano navigation into shared dashboard helpers", function() {
  pianoAct("openRecommendations");
  pianoAct("openInsights");
  pianoAct("openChallengeHub");
  pianoAct("openHomeDash");

  assert.deepStrictEqual(dashboardSectionCalls, ["recommendations", "insights", "challenges", "home_dash"]);
  assert.strictEqual(S.screen, "homeDash");
});

test("refreshHome mirrors piano dashboard snapshots into shared helper", function() {
  S.activeChallenges = [{ id: "daily_1", title: "Daily Challenge" }];

  pianoAct("refreshHome");

  assert.strictEqual(dashboardRefreshCalls.length, 1);
  assert.strictEqual(dashboardRefreshCalls[0].recommendations[0].id, "rec_1");
  assert.strictEqual(dashboardRefreshCalls[0].insights.strongestSkills[0].id, "timing");
  assert.strictEqual(dashboardRefreshCalls[0].challenges[0].id, "daily_1");
});

test("initChallenges mirrors piano dashboard snapshots into shared init helper", function() {
  S.activeChallenges = [{ id: "daily_1", title: "Daily Challenge" }];

  pianoAct("initChallenges");

  assert.strictEqual(dashboardInitCalls.length, 1);
  assert.strictEqual(dashboardInitCalls[0].challenges[0].id, "daily_1");
});

test("claimChallengeReward mirrors piano challenge claims into shared dashboard helper", function() {
  global.claimedChallengeIds = [];
  global.claimChallengeReward = function(id) {
    claimedChallengeIds.push(id);
  };

  pianoAct("claimChallengeReward", "daily_1");

  assert.deepStrictEqual(claimedChallengeIds, ["daily_1"]);
  assert.deepStrictEqual(dashboardChallengeRewardCalls, ["daily_1"]);
});

test("go_home returns piano dashboard-family screens through shared dashboard back helper", function() {
  S.screen = "recommendations";

  pianoAct("go_home");

  assert.deepStrictEqual(homeReturnCalls, [{ currentScreen: "home_dash" }]);
  assert.strictEqual(S.screen, "homeDash");
});

test("go_home returns piano utility-family screens through shared utility helper", function() {
  S.screen = "midi_settings";

  pianoAct("go_home");

  assert.deepStrictEqual(utilityReturnCalls, [{ currentScreen: "midi_settings" }]);
  assert.strictEqual(S.screen, "home");
});

test("openCalibration mirrors piano calibration entry into shared performance helper", function() {
  pianoAct("openCalibration");

  assert.strictEqual(performanceCalibrationOpenCalls.length, 1);
  assert.strictEqual(S.screen, "perfCalibrate");
});

test("utility screen entry actions mirror piano navigation into shared utility helper", function() {
  pianoAct("openSettings");
  pianoAct("openCurriculum");
  pianoAct("openCloudSettings");
  pianoAct("openMidiSettings");
  pianoAct("openMidiImport");

  assert.deepStrictEqual(utilityScreenCalls, ["settings", "curriculum", "cloud_settings", "midi_settings", "midi_import"]);
  assert.strictEqual(curriculumSyncCalls.length, 1);
  assert.strictEqual(midiImportSyncCalls.length, 1);
  assert.strictEqual(cloudWorkflowCalls.length, 1);
  assert.strictEqual(cloudWorkflowCalls[0].action, "open");
  assert.strictEqual(S.screen, "midi_import");
});

test("piano cloud actions mirror into shared cloud workflow helper", function() {
  pianoAct("cloudSync");
  pianoAct("cloudPull");

  assert.strictEqual(cloudWorkflowCalls.length, 2);
  assert.strictEqual(cloudWorkflowCalls[0].action, "sync_start");
  assert.strictEqual(cloudWorkflowCalls[1].action, "pull_start");
});

test("piano cloud conflict action forwards to shared resolver", function() {
  var strategies = [];
  global.resolveCloudConflict = function(strategy) {
    strategies.push(strategy);
  };

  pianoAct("cloudResolveConflict", "newest");

  assert.deepStrictEqual(strategies, ["newest"]);
});

test("piano midi import actions mirror into shared midi import sync helper", function() {
  S.importedMidi = {
    sourceName: "lesson.mid",
    tracks: [
      { id: "t1", name: "Piano RH", notes: [{}, {}] },
      { id: "t2", name: "Piano LH", notes: [{}] }
    ]
  };
  S.importedMidiAssignments = { t1: "melody", t2: "left_hand" };
  global.setMidiTrackAssignment = function(trackId, role) {
    S.importedMidiAssignments[trackId] = role;
  };
  global.buildSeedChartFromImportedMidi = function(_midi, _assignments, mode) {
    return { title: mode === "piano_left_hand" ? "Imported LH" : "Imported Seed" };
  };

  pianoAct("assignMidiTrack", "t1|single_note");
  pianoAct("buildMidiSeedChart", "piano_left_hand");

  assert.strictEqual(midiImportSyncCalls.length, 2);
  assert.strictEqual(midiImportSyncCalls[midiImportSyncCalls.length - 2].summary.sourceName, "lesson.mid");
  assert.strictEqual(midiImportSyncCalls[midiImportSyncCalls.length - 2].assignments.t1, "single_note");
  assert.strictEqual(midiImportSyncCalls[midiImportSyncCalls.length - 1].seedMode, "piano_left_hand");
});

test("piano midi actions mirror into shared midi settings sync helper", function() {
  pianoAct("setMidiDevice", "dev_1");
  pianoAct("setMidiProfile", "profile_1");
  pianoAct("createDefaultPianoProfile");
  pianoAct("openMidiSettings");

  assert.strictEqual(midiSettingsSyncCalls.length, 4);
  assert.deepStrictEqual(utilityScreenCalls, ["midi_settings"]);
  assert.strictEqual(S.screen, "midi_settings");
});

test("stem player actions mirror piano navigation into shared stem helpers", function() {
  pianoAct("stemOpen");
  pianoAct("stemBack");

  assert.deepStrictEqual(stemPlayerCalls, [
    { fn: "openStemPlayerRequest" },
    { fn: "closeStemPlayerRequest" }
  ]);
  assert.strictEqual(S.screen, "home");
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
