/* ───────── PianoSpark – app.js (instrument module) ───────── */
/* Wrapped for SparkSuite: helpers exposed globally, act/render namespaced */
(function() {

// ── EARLY EXPORTS: hoisted function declarations are available immediately ──
// These must run before anything else to guarantee piano pages can access them.
window.pianoAct = function(a, v) { return act(a, v); };
window.pianoRender = function() { return render(); };
window.getCurrentSessionPlan = function() { return getCurrentSessionPlan(); };
window.getCurrentLevel = function() { return getCurrentLevel(); };
window.levelForSession = function(s) { return levelForSession(s); };
window.addXP = function(n) { return addXP(n); };
window.addHistory = function(t, d) { return addHistory(t, d); };
window.recordTransition = function(a, b) { return recordTransition(a, b); };
window.genQuiz = function() { return genQuiz(); };
window.shuffleArray = function(arr) { return shuffleArray(arr); };
window.startGuidedSession = function() { return startGuidedSession(); };
window.advanceSessionStep = function() { return advanceSessionStep(); };
window.adaptBpm = function() { return adaptBpm(); };
window.checkLevelUp = function() { return checkLevelUp(); };
window.checkReward = function(t) { return checkReward(t); };
window.pickReviewChords = function() { return pickReviewChords(); };

// Map piano numeric SCR to SparkSuite string SCR for act() compatibility
var _pianoSCR = typeof PIANO_SCR !== "undefined" ? PIANO_SCR : {};
// Override local SCR/TAB references to use SparkSuite's string constants
// Piano act() does S.screen = SCR.SESSION etc, which needs to produce the
// string value that SparkSuite's router understands
var SCR = {
  HOME: "home", SESSION: "session", ONBOARDING: "onboarding",
  STEM_PLAYER: "stems", PERFORM: "perform", PERFORM_DONE: "performDone",
  PERFORM_SONG: "performSong", PLAN: "practicePlan",
  MIDI_SETTINGS: "midi_settings", MIDI_IMPORT: "midi_import",
  CLOUD_SETTINGS: "cloud_settings", CALIBRATION: "perfCalibrate",
  CURRICULUM: "curriculum", RECOMMENDATIONS: "recommendations",
  CAREER: "career", INSIGHTS: "insights", CHALLENGES: "challenges",
  HOME_DASH: "homeDash", ONBOARDING_FLOW: "onboarding", SETTINGS: "settings"
};
var TAB = { PRACTICE: "practice", GAMES: "games", SONGS: "songs", TOOLS: "tools" };

// Timer holder (piano uses T.session, T.drill, etc.)
if (typeof window.T === "undefined") window.T = {};
var T = window.T;

// ── Piano audio aliases (from PianoAudio namespace to avoid clobbering shared audio.js) ──
var _pa = typeof PianoAudio !== "undefined" ? PianoAudio : {};
var playSound = _pa.playSound || function(){};
var startMetronome = _pa.startMetronome || function(){};
var stopMetronome = _pa.stopMetronome || function(){};
var playNote = _pa.playNote || function(){};
var playChord = _pa.playChord || function(){};
var playChordByName = _pa.playChordByName || function(){};
var playBassNote = _pa.playBassNote || function(){};
var playLHPattern = _pa.playLHPattern || function(){};
var stopLHPattern = _pa.stopLHPattern || function(){};
var playSplitPractice = _pa.playSplitPractice || function(){};
var playWatchDemo = _pa.playWatchDemo || function(){};
var stopWatchDemo = _pa.stopWatchDemo || function(){};
var playChordWithVerbal = _pa.playChordWithVerbal || function(){};
var playWavChord = _pa.playWavChord || function(){};
var startDetection = _pa.startDetection || function(){};
var stopDetection = _pa.stopDetection || function(){};
var getChordMatch = _pa.getChordMatch || function(){ return null; };
var getCoachFeedback = _pa.getCoachFeedback || function(){ return ""; };
var recordDetectionScore = _pa.recordDetectionScore || function(){};
var getDetectionConfidence = _pa.getDetectionConfidence || function(){ return 0; };
var resetDetectionConfidence = _pa.resetDetectionConfidence || function(){};
var startYinDetection = _pa.startYinDetection || function(){};
var stopYinDetection = _pa.stopYinDetection || function(){};
var startRecording = _pa.startRecording || function(){};
var stopRecording = _pa.stopRecording || function(){};
var isRecording = _pa.isRecording || function(){ return false; };
var playClip = _pa.playClip || function(){};
var deleteClip = _pa.deleteClip || function(){};
var startMidi = _pa.startMidi || function(){};
var stopMidi = _pa.stopMidi || function(){};
var getMidiInputNames = _pa.getMidiInputNames || function(){ return []; };
var loadStemUrls = _pa.loadStemUrls || function(){};
var playStems = _pa.playStems || function(){};
var pauseStems = _pa.pauseStems || function(){};
var seekStems = _pa.seekStems || function(){};
var setStemMuted = _pa.setStemMuted || function(){};
var setStemVolume = _pa.setStemVolume || function(){};
var setStemPlaybackRate = _pa.setStemPlaybackRate || function(){};
var getFirstStemAudio = _pa.getFirstStemAudio || function(){ return null; };
var cleanupStems = _pa.cleanupStems || function(){};
var ensureAudio = _pa.ensureAudio || function(){};
var setReverb = _pa.setReverb || function(){};
var setVolume = _pa.setVolume || function(){};
var preloadWavs = _pa.preloadWavs || function(){};

// ── Piano data aliases (resolve from PIANO_DATA to avoid stale shared globals) ──
var _pd = typeof PIANO_DATA !== "undefined" ? PIANO_DATA : {};
var CHORDS = _pd.CHORDS || {};
var CURRICULUM = _pd.CURRICULUM || [];
var SESSION_PLANS = _pd.SESSION_PLANS || [];
var SONGS = _pd.SONGS || (typeof PIANO_SONGS !== "undefined" ? PIANO_SONGS : []);
var BADGES = _pd.BADGES || [];
var LH_PATTERNS = _pd.LH_PATTERNS || [];
var FINGER_EXERCISES = _pd.FINGER_EXERCISES || [];
var FINGER_BADGES = _pd.FINGER_BADGES || [];
var DAILY_TYPES = _pd.DAILY_TYPES || [];
var PLAY_STYLES = _pd.PLAY_STYLES || [];
var REWARD_PHASES = _pd.REWARD_PHASES || [];
var CHORD_COLORS = _pd.CHORD_COLORS || {};
var LC = _pd.LC || {};
var LN = _pd.LN || {};
var SCALES = _pd.SCALES || [];

// ── Piano helper functions (formerly in helpers.js) ──
function getCurrentSessionPlan() {
  var plans = typeof PIANO_SESSIONS !== "undefined" ? PIANO_SESSIONS : [];
  if (!S || S.currentSession < 1 || S.currentSession > plans.length) return null;
  return plans[S.currentSession - 1];
}

function getCurrentLevel() {
  var curriculum = typeof PIANO_CURRICULUM !== "undefined" ? PIANO_CURRICULUM : [];
  for (var i = 0; i < curriculum.length; i++) {
    if (curriculum[i].num === S.level) return curriculum[i];
  }
  return curriculum[0] || null;
}

function levelForSession(sessionNum) {
  var curriculum = typeof PIANO_CURRICULUM !== "undefined" ? PIANO_CURRICULUM : [];
  for (var i = 0; i < curriculum.length; i++) {
    var parts = curriculum[i].sessions.split("-");
    var start = parseInt(parts[0]);
    var end = parseInt(parts[1]);
    if (sessionNum >= start && sessionNum <= end) return curriculum[i].num;
  }
  return 8;
}

function addXP(n) {
  if (typeof S !== "undefined") {
    S.xp = (S.xp || 0) + n;
    if (typeof saveState === "function") saveState();
  }
}

function addHistory(type, detail) {
  if (typeof S === "undefined") return;
  if (!Array.isArray(S.history)) S.history = [];
  var entry = { type: type, ts: Date.now() };
  if (detail && detail.chord !== undefined) entry.chord = detail.chord;
  if (detail && detail.dur !== undefined) entry.dur = detail.dur;
  if (detail && detail.chords !== undefined) entry.chords = detail.chords;
  if (detail && detail.score !== undefined) entry.score = detail.score;
  if (detail && detail.session !== undefined) entry.session = detail.session;
  S.history.push(entry);
  if (typeof saveState === "function") saveState();
}

function recordTransition(fromChord, toChord, wasClean, timeMs) {
  if (typeof S === "undefined") return;
  if (!S.transitionStats) S.transitionStats = {};
  var key = fromChord + "_" + toChord;
  if (!S.transitionStats[key]) {
    S.transitionStats[key] = { attempts: 0, clean: 0, avgMs: 0 };
  }
  var stat = S.transitionStats[key];
  stat.attempts++;
  if (wasClean) stat.clean++;
  stat.avgMs = Math.round((stat.avgMs * (stat.attempts - 1) + timeMs) / stat.attempts);
}

// Import shared globals
var addPracticeSecond = window.addPracticeSecond || function() {};
var checkStreak = window.checkStreak || function() {};
var clickableDiv = window.clickableDiv;
var ifThenCard = window.ifThenCard;
// getChordMatch aliased from PianoAudio above
var fireMicro = window.fireMicro;
var escHTML = window.escHTML;
var saveState = function(immediate) { return window.saveState(immediate); };
var showToast = window.showToast || function() {};
var checkPracticeDate = window.checkPracticeDate || function() {};
var getRewardPhase = window.getRewardPhase || function() { return null; };
var allChordKeys = window.allChordKeys || function() { return []; };
var allChords = window.allChords || function() { return []; };
var findChord = window.findChord || function() { return null; };
var chordsForLevel = window.chordsForLevel || function() { return []; };
var chordsUpToLevel = window.chordsUpToLevel || function() { return []; };
var chordMidi = window.chordMidi || function() { return []; };
var chordFingers = window.chordFingers || function() { return []; };
var chordNoteNames = window.chordNoteNames || function() { return []; };
var getAvailableExercises = window.getAvailableExercises || function() { return []; };
var getSessionExercise = window.getSessionExercise || function() { return null; };
var getWarmUpExercise = window.getWarmUpExercise || function() { return null; };
var render = function() { return window.render(); };

// ── Utility ──
function shuffleArray(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// ── Timer ticks ──
function tickSession() {
  if (S.paused || !S.active) return;
  S.timer--;
  addPracticeSecond();
  if (S.timer % 30 === 0 && S.timer > 0) addXP(5);
  var elapsed = S.practiceLen - S.timer;
  var msg = pianoFireMicro(elapsed, S.practiceLen);
  if (msg) showToast(msg);
  if (S.timer <= 0) { completeLegacySession(); return; }
  render();
}

function completeLegacySession() {
  if (T.session) { clearInterval(T.session); T.session = null; }
  S.active = false;
  S.sessions++;
  addXP(20);
  var prog = (S.chordProg[S.chord] || 0) + 15;
  S.chordProg[S.chord] = Math.min(100, prog);
  addHistory("session", { chord: S.chord, dur: S.practiceLen });
  checkPracticeDate();
  checkLevelUp();
  checkReward("session_complete");
  var badges = pianoCheckBadges();
  if (badges.length) showToast("Badge earned! " + badges.map(function(b) { return BADGES.find(function(x) { return x.id === b; }).icon; }).join(" "));
  else playSound("complete");
  if (S.detecting) stopDetection();
  saveState();
  render();
}

function tickDrill() {
  if (!S.drillActive) return;
  S.drillTimer--;
  addPracticeSecond();
  if (S.drillTimer <= 0) { completeDrill(); return; }
  render();
}

function completeDrill() {
  if (T.drill) { clearInterval(T.drill); T.drill = null; }
  S.drillActive = false;
  S.drillsDone++;
  addXP(30);
  addHistory("drill", { chords: S.drillChords.join(",") });
  checkPracticeDate();
  checkReward("drill_complete");
  pianoCheckBadges();
  playSound("complete");
  saveState();
  render();
}

function tickDaily() {
  if (!S.dailyActive) return;
  S.dailyTimer--;
  addPracticeSecond();
  if (S.dailyTimer <= 0) { completeDaily(); return; }
  render();
}

function completeDaily() {
  if (T.daily) { clearInterval(T.daily); T.daily = null; }
  S.dailyActive = false;
  S.dailiesDone++;
  addXP(40);
  addHistory("daily", { score: S.dailyScore });
  checkPracticeDate();
  checkReward("daily_complete");
  pianoCheckBadges();
  playSound("complete");
  saveState();
  render();
}

// ── Guided session step timer ──
function tickSessionStep() {
  if (S.paused) return;
  S.sessionTimer--;
  addPracticeSecond();
  if (S.sessionTimer <= 0) {
    advanceSessionStep();
    return;
  }
  render();
}

// ── Level up check (8 levels) ──
function checkLevelUp() {
  if (S.level >= 8) return;
  // Level up when all sessions for current level are completed
  var curr = CURRICULUM[S.level - 1];
  if (!curr) return;
  var parts = curr.sessions.split("-");
  var lastSession = parseInt(parts.length > 1 ? parts[1] : parts[0]);
  if (S.currentSession > lastSession) {
    S.level = Math.min(8, S.level + 1);
    playSound("levelup");
    showToast("Level Up! You're now Level " + S.level + ": " + LN[S.level] + "!");
    pianoShowConfetti();
    pianoCheckBadges();
    saveState();
  }
}

// ── Reward engine (stickiness #1 + #4) ──
function checkReward(actionType) {
  S.totalActions++;
  S.actionsSinceReward++;

  var phase = getRewardPhase(S.currentSession);
  if (!phase) return;

  var shouldReward = false;
  var isJackpot = false;
  var xpAmount = 25;

  if (phase.schedule === "continuous") {
    shouldReward = true;
    xpAmount = phase.xpPerAction || 25;
  } else if (phase.schedule === "VR-2-3") {
    if (S.actionsSinceReward >= S.nextRewardAt) {
      shouldReward = true;
      S.nextRewardAt = 2 + Math.floor(Math.random() * 2); // 2-3
    }
  } else if (phase.schedule === "VR-5-8") {
    if (S.actionsSinceReward >= S.nextRewardAt) {
      shouldReward = true;
      S.nextRewardAt = 5 + Math.floor(Math.random() * 4); // 5-8
      if (Math.random() < (phase.jackpotChance || 0)) {
        isJackpot = true;
        xpAmount = 25 * (phase.jackpotMultiplier || 10);
      }
    }
  } else if (phase.schedule === "intrinsic") {
    // Rare surprise rewards
    if (Math.random() < 0.08) {
      shouldReward = true;
      if (Math.random() < (phase.jackpotChance || 0)) {
        isJackpot = true;
        xpAmount = 25 * (phase.jackpotMultiplier || 15);
      }
    }
  }

  if (shouldReward) {
    S.actionsSinceReward = 0;
    addXP(xpAmount);
    if (isJackpot) {
      S.jackpotsHit++;
      playSound("jackpot");
      showToast("JACKPOT! +" + xpAmount + " XP!");
    } else {
      playSound("reward");
    }
  }
}

// ── Adaptive difficulty (stickiness #6) ──
function adaptBpm(wasClean) {
  if (wasClean) {
    S._cleanStreak = (S._cleanStreak || 0) + 1;
    S._missStreak = 0;
    if (S._cleanStreak >= 3) {
      S.adaptiveBpm = Math.min(200, S.adaptiveBpm + 3);
      S._cleanStreak = 0;
      if (S.adaptiveBpm > S.personalBests.bpm) {
        S.personalBests.bpm = S.adaptiveBpm;
        if (S.earned.indexOf("speed_demon") < 0) {
          S.earned.push("speed_demon");
          showToast("New personal best BPM!");
        }
      }
    }
  } else {
    S._missStreak = (S._missStreak || 0) + 1;
    S._cleanStreak = 0;
    if (S._missStreak >= 2) {
      S.adaptiveBpm = Math.max(40, S.adaptiveBpm - 5);
      S._missStreak = 0;
    }
  }
  saveState();
}

// ── Interleaving (stickiness #8) ──
function pickReviewChords() {
  // Select chords from 3-5 sessions ago, not yesterday
  var targetSession = Math.max(1, S.currentSession - Math.floor(Math.random() * 3 + 3));
  var plan = SESSION_PLANS[targetSession - 1];
  if (!plan) return ["C"];

  var chords = [];
  if (plan.newMove && plan.newMove.chord) chords.push(plan.newMove.chord);
  if (plan.review && plan.review.chords) {
    plan.review.chords.forEach(function(ch) {
      if (chords.indexOf(ch) < 0) chords.push(ch);
    });
  }

  // Ensure at least 2 chords — use shuffle-slice to avoid infinite loop
  if (chords.length < 2) {
    var available = chordsUpToLevel(S.level).map(function(c) { return c.short; })
      .filter(function(c) { return chords.indexOf(c) < 0; });
    shuffleArray(available);
    while (chords.length < 2 && available.length > 0) chords.push(available.shift());
  }

  // Don't repeat what was just reviewed
  return chords.filter(function(ch) { return S.lastReviewChords.indexOf(ch) < 0; }).slice(0, 3);
}

// ── Quiz generation ──
function genQuiz() {
  var pool = typeof chordsUpToLevel === "function" ? chordsUpToLevel(Math.min((S.level || 1) + 1, 8)) : [];
  if (pool.length < 4) pool = typeof chordsUpToLevel === "function" ? chordsUpToLevel(3) : [];
  if (!pool.length) return { answer: "C", options: ["C", "F", "G", "Am"] };
  var answer = pool[Math.floor(Math.random() * pool.length)].short;
  // Shuffle pool then pick up to 3 distractors — avoids infinite loop if pool is small
  var shuffled = shuffleArray(pool.slice());
  var options = [answer];
  for (var i = 0; i < shuffled.length && options.length < 4; i++) {
    if (shuffled[i].short !== answer) options.push(shuffled[i].short);
  }
  shuffleArray(options);
  return { answer: answer, options: options };
}

// ── Runner game ──
function spawnRunnerTarget() {
  var pool = chordsUpToLevel(S.level).map(function(c) { return c.short; });
  S.runnerTarget = pool[Math.floor(Math.random() * pool.length)];
}

// ── Rhythm game ──
function rhythmTick() {
  if (!S.rhythmActive) return;
  S.rhythmBeat++;
  playSound("tick");
  render();
}

// ── Song playback ──
function songTick() {
  if (!S.songPlaying || S.songIdx === null) return;
  var song = SONGS[S.songIdx];
  if (!song) return;
  S.songChordIdx++;
  if (S.songChordIdx >= song.progression.length) {
    S.songChordIdx = 0;
    if (!S.songsDone) S.songsDone = [];
    if (S.songsDone.indexOf(song.title) < 0) {
      S.songsDone.push(song.title);
      addXP(15);
      pianoCheckBadges();
    }
  }
  var chord = song.progression[S.songChordIdx];
  if (typeof window.syncSongRuntimeRequest === "function") {
    window.syncSongRuntimeRequest("tick", {
      songData: song,
      source: "builtin",
      songBeat: S.songChordIdx
    });
  }
  playChordByName(chord, song.style || "block");
  render();
}

// ── Build playback ──
var buildIdx = 0;
function buildTick() {
  if (!S.buildPlaying || !S.buildChords.length) return;
  if (buildIdx >= S.buildChords.length) buildIdx = 0;
  playChordByName(S.buildChords[buildIdx], "block");
  buildIdx++;
  render();
}

// ── Guided session flow ──
function startGuidedSession() {
  if (typeof window.openGuidedSessionRequest === "function") {
    var guidedSession = parseInt(S.currentSession, 10);
    if (isNaN(guidedSession) || guidedSession < 1) guidedSession = 1;
    var corePlan = window.openGuidedSessionRequest({
      sessionNum: guidedSession
    });
    if (corePlan && corePlan.context && corePlan.context.guidedPlan) {
      syncPianoGuidedPlanFromCore(corePlan);
      checkPracticeDate();
      playSound("start");
      saveState();
      render();
      return;
    }
  } else if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
    var guidedSession = parseInt(S.currentSession, 10);
    if (isNaN(guidedSession) || guidedSession < 1) guidedSession = 1;
    var corePlan = window.sparkCore.startSession({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      sessionNum: guidedSession
    });
    if (corePlan && corePlan.context && corePlan.context.guidedPlan) {
      syncPianoGuidedPlanFromCore(corePlan);
      checkPracticeDate();
      playSound("start");
      saveState();
      render();
      return;
    }
  }

  var plan = getCurrentSessionPlan();
  if (!plan) { showToast("No more sessions!"); render(); return; }

  S.sessionPlan = plan;
  S.screen = SCR.SESSION;
  S.sessionStep = "spark";
  S.newMovePhase = null;
  S.feedbackMessage = "";
  S.adaptiveBpm = plan.bpm;
  S.paused = false;
  S.fingerWarmUpDone = false;

  checkPracticeDate();
  playSound("start");
  saveState();
  render();
}

function syncPianoGuidedPlanFromCore(plan) {
  var guidedPlan = plan && plan.context ? plan.context.guidedPlan : null;
  if (!guidedPlan) return null;

  var guidedSession = plan.context.guidedSession || guidedPlan.num || S.currentSession || 1;
  S.guidedPlan = guidedPlan;
  S.guidedSession = guidedSession;
  S.currentSession = guidedSession;
  S.sessionPlan = guidedPlan;
  S.screen = SCR.SESSION;
  S.sessionStep = "spark";
  S.guidedStep = "spark";
  S.newMovePhase = null;
  S.feedbackMessage = "";
  S.adaptiveBpm = guidedPlan.bpm || S.bpm;
  S.paused = false;
  S.guidedPaused = false;
  S.fingerWarmUpDone = false;
  return guidedPlan;
}

function syncPianoPerformanceSongFromCore(plan) {
  var performanceSong = plan && plan.context ? plan.context.performanceSong : null;
  if (!performanceSong) return null;

  S.performSongData = performanceSong.songData || null;
  S.performSongId = performanceSong.songId || normalizeSongId(performanceSong.songData);
  S.performArrangementType = performanceSong.arrangementType || S.performArrangementType || "block_chords";
  if (performanceSong.difficultyId) S.performDifficulty = performanceSong.difficultyId;
  S.screen = SCR.PERFORM_SONG;
  return performanceSong;
}

function advanceSessionStep() {
  if (T.sessionStep) { clearInterval(T.sessionStep); T.sessionStep = null; }
  stopMetronome();
  stopLHPattern();
  stopWatchDemo();

  var steps = ["spark","review","newMove","songSlice","victoryLap"];
  var idx = steps.indexOf(S.sessionStep);

  // Record what was reviewed so we don't repeat it and can show transition tips
  if (S.sessionStep === "review" && S.sessionPlan && S.sessionPlan.review) {
    S.lastReviewChords = S.sessionPlan.review.chords || [];
  }

  if (idx < steps.length - 1) {
    S.sessionStep = steps[idx + 1];
    S.sessionTimer = 0;

    // Set up phase for New Move
    if (S.sessionStep === "newMove") {
      S.newMovePhase = "watch";
    }
  }
  render();
}

function advanceNewMovePhase() {
  var phases = ["watch","shadow","try","refine"];
  var idx = phases.indexOf(S.newMovePhase);
  if (idx < phases.length - 1) {
    S.newMovePhase = phases[idx + 1];
    S.feedbackMessage = "";
    if (S.detecting) stopDetection();
  } else {
    // Done with New Move, advance to next session step
    advanceSessionStep();
    return;
  }
  render();
}

function completeGuidedSession() {
  if (T.sessionStep) { clearInterval(T.sessionStep); T.sessionStep = null; }
  stopMetronome();
  stopLHPattern();
  if (S.detecting) stopDetection();

  var plan = S.sessionPlan;
  if (typeof window.completeGuidedSessionRequest === "function") {
    var guidedResult = window.completeGuidedSessionRequest();
    syncPianoGuidedCompletionFromCore(guidedResult, plan);
    checkPracticeDate();
    checkLevelUp();
    var coreBadges = pianoCheckBadges();
    pianoShowConfetti();
    if (coreBadges.length) {
      showToast("Session complete! Badge earned! " + coreBadges.map(function(b) {
        var badge = BADGES.find(function(x) { return x.id === b; });
        return badge ? badge.icon : "";
      }).join(" "));
    } else {
      showToast("Session " + (plan ? plan.num : "") + " complete!");
    }
    playSound(guidedResult && guidedResult.audioCue === "levelup" ? "levelup" : "complete");
    S.screen = SCR.HOME;
    S.sessionStep = null;
    S.sessionPlan = null;
    S.newMovePhase = null;
    saveState();
    render();
    return;
  } else if (window.sparkCore && typeof window.sparkCore.completeSession === "function") {
    var guidedResult = window.sparkCore.completeSession({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      markPlanComplete: true
    });
    if (typeof window.sparkCore.syncGuidedRuntimeState === "function") {
      window.sparkCore.syncGuidedRuntimeState({
        activeScreen: "guided_done",
        guidedStep: null,
        guidedNewMovePhase: null,
        transport: { status: "completed", positionMs: 0 }
      });
    }
    syncPianoGuidedCompletionFromCore(guidedResult, plan);
    checkPracticeDate();
    checkLevelUp();
    var coreBadges = pianoCheckBadges();
    pianoShowConfetti();
    if (coreBadges.length) {
      showToast("Session complete! Badge earned! " + coreBadges.map(function(b) {
        var badge = BADGES.find(function(x) { return x.id === b; });
        return badge ? badge.icon : "";
      }).join(" "));
    } else {
      showToast("Session " + (plan ? plan.num : "") + " complete!");
    }
    playSound(guidedResult && guidedResult.audioCue === "levelup" ? "levelup" : "complete");
    S.screen = SCR.HOME;
    S.sessionStep = null;
    S.sessionPlan = null;
    S.newMovePhase = null;
    saveState();
    render();
    return;
  }

  if (plan) {
    // Mark session complete
    if (S.completedSessions.indexOf(plan.num) < 0) {
      S.completedSessions.push(plan.num);
    }
    S.sessions++;
    S.currentSession = Math.min(50, plan.num + 1);

    // Progress chord
    if (plan.newMove && plan.newMove.chord) {
      var prog = (S.chordProg[plan.newMove.chord] || 0) + 15;
      S.chordProg[plan.newMove.chord] = Math.min(100, prog);
    }

    addXP(50);
    addHistory("guided_session", { session: plan.num, chord: plan.newMove ? plan.newMove.chord : null });

    // Update LH level
    var newLvl = CURRICULUM[Math.min(S.level, 8) - 1];
    if (newLvl && newLvl.lhPattern) {
      var patIdx = LH_PATTERNS.findIndex(function(p) { return p.id === newLvl.lhPattern; });
      if (patIdx >= 0 && patIdx + 1 > S.lhLevel) S.lhLevel = patIdx + 1;
    }
  }

  checkPracticeDate();
  checkLevelUp();
  checkReward("session_complete");
  var badges = pianoCheckBadges();

  pianoShowConfetti();
  if (badges.length) {
    showToast("Session complete! Badge earned! " + badges.map(function(b) {
      var badge = BADGES.find(function(x) { return x.id === b; });
      return badge ? badge.icon : "";
    }).join(" "));
  } else {
    showToast("Session " + (plan ? plan.num : "") + " complete!");
    playSound("complete");
  }

  S.screen = SCR.HOME;
  S.sessionStep = null;
  S.sessionPlan = null;
  S.newMovePhase = null;
  saveState();
  render();
}

function syncPianoGuidedCompletionFromCore(result, plan) {
  var guidedPatch = result && result.sessionStatePatch ? result.sessionStatePatch.guided : null;
  if (!Array.isArray(S.completedSessions)) S.completedSessions = [];
  if (!S.chordProg || typeof S.chordProg !== "object") S.chordProg = {};

  if (guidedPatch && Array.isArray(guidedPatch.completedSessionNums)) {
    for (var i = 0; i < guidedPatch.completedSessionNums.length; i++) {
      if (S.completedSessions.indexOf(guidedPatch.completedSessionNums[i]) < 0) {
        S.completedSessions.push(guidedPatch.completedSessionNums[i]);
      }
    }
  } else if (plan && S.completedSessions.indexOf(plan.num) < 0) {
    S.completedSessions.push(plan.num);
  }

  if (guidedPatch && guidedPatch.chordProgress) {
    for (var chordName in guidedPatch.chordProgress) {
      S.chordProg[chordName] = Math.min((S.chordProg[chordName] || 0) + guidedPatch.chordProgress[chordName], 100);
    }
  } else if (plan && plan.newMove && plan.newMove.chord) {
    S.chordProg[plan.newMove.chord] = Math.min((S.chordProg[plan.newMove.chord] || 0) + 15, 100);
  }

  if (guidedPatch && guidedPatch.nextGuidedSession != null) {
    S.currentSession = guidedPatch.nextGuidedSession;
    S.guidedSession = guidedPatch.nextGuidedSession;
  } else if (plan && plan.num != null) {
    S.currentSession = Math.min(50, plan.num + 1);
    S.guidedSession = S.currentSession;
  }

  if (plan) {
    var newLvl = CURRICULUM[Math.min(S.level, 8) - 1];
    if (newLvl && newLvl.lhPattern) {
      var patIdx = LH_PATTERNS.findIndex(function(p) { return p.id === newLvl.lhPattern; });
      if (patIdx >= 0 && patIdx + 1 > S.lhLevel) S.lhLevel = patIdx + 1;
    }
  }
}

// ── Finger exercise helpers ──
function completeFingerExercise(exerciseId) {
  if (!S.fingerStats[exerciseId]) {
    S.fingerStats[exerciseId] = { completions: 0, lastDone: null, bestTrillSpeed: 0 };
  }
  var stats = S.fingerStats[exerciseId];
  stats.completions++;
  var today = new Date().toDateString();
  var wasNewDay = !stats.lastDone || new Date(stats.lastDone).toDateString() !== today;
  stats.lastDone = Date.now();
  S.fingerExercisesDone++;

  // Track days — skip exerciseId since its lastDone was just updated
  if (wasNewDay) {
    var anyDoneToday = false;
    for (var id in S.fingerStats) {
      if (id.charAt(0) === '_') continue;
      if (id === exerciseId) continue;
      if (S.fingerStats[id].lastDone && new Date(S.fingerStats[id].lastDone).toDateString() === today) {
        anyDoneToday = true; break;
      }
    }
    if (!anyDoneToday) S.fingerDaysLogged++;
  }

  addXP(10);
  checkReward("finger_exercise");
  checkFingerBadges();
  saveState();
}

function tickChordChange() {
  if (!S.chordChangeActive) return;
  S.chordChangeTimer--;
  if (S.chordChangeTimer <= 0) {
    finishChordChange();
    return;
  }
  render();
}

function finishChordChange() {
  if (T.chordChange) { clearInterval(T.chordChange); T.chordChange = null; }
  S.chordChangeActive = false;

  // Record result
  if (!S.fingerStats._chordChangeBest) S.fingerStats._chordChangeBest = 0;
  if (S.chordChangeCount > S.fingerStats._chordChangeBest) {
    S.fingerStats._chordChangeBest = S.chordChangeCount;
    showToast("New personal best: " + S.chordChangeCount + " changes!");
  }

  // Record pair-specific best
  if (S.chordChangePair.length === 2) {
    var pairKey = "_cc_" + S.chordChangePair[0] + "_" + S.chordChangePair[1];
    if (!S.fingerStats[pairKey]) S.fingerStats[pairKey] = { best: 0 };
    if (S.chordChangeCount > S.fingerStats[pairKey].best) {
      S.fingerStats[pairKey].best = S.chordChangeCount;
    }
  }

  addXP(Math.floor(S.chordChangeCount / 2));
  addHistory("chord_change", { score: S.chordChangeCount, chords: S.chordChangePair.join(",") });
  checkFingerBadges();
  checkReward("chord_change");
  playSound("complete");
  saveState();
  render();
}

function checkFingerBadges() {
  var newBadges = [];
  function check(id, cond) {
    if (cond && S.fingerBadges.indexOf(id) < 0) {
      S.fingerBadges.push(id);
      newBadges.push(id);
    }
  }

  // Table Tapper: 7 days of off-instrument exercises
  check("table_tapper", S.fingerDaysLogged >= 7);

  // Spider Fingers: all Tier 2 exercises completed at least once
  var tier2 = getExercisesByTier(2);
  var allTier2Done = tier2.length > 0 && tier2.every(function(ex) {
    return S.fingerStats[ex.id] && S.fingerStats[ex.id].completions > 0;
  });
  check("spider_fingers", allTier2Done);

  // 30 Club / 60 Club
  var best = S.fingerStats._chordChangeBest || 0;
  check("thirty_club", best >= 30);
  check("sixty_club", best >= 60);

  // Pinky Power: trill exercise done 5+ times
  var trillStats = S.fingerStats["P-ADV-3"];
  check("pinky_power", trillStats && trillStats.completions >= 5);

  // Cortot Master: Independence Gauntlet done 3+ times
  var gauntletStats = S.fingerStats["P-ADV-4"];
  check("cortot_master", gauntletStats && gauntletStats.completions >= 3);

  // Thumb Ninja: thumb under exercise done 5+ times
  var thumbStats = S.fingerStats["P-ADV-2"];
  check("thumb_ninja", thumbStats && thumbStats.completions >= 5);

  if (newBadges.length) {
    playSound("badge");
    var names = newBadges.map(function(id) {
      var b = FINGER_BADGES.find(function(fb) { return fb.id === id; });
      return b ? b.icon : "";
    }).join(" ");
    showToast("Finger badge earned! " + names);
    saveState();
  }
}

// ── Action dispatcher ──
function act(action, param) {
  var _handled = true;
  switch (action) {
    case "tab":
      S.tab = param;
      if (S.songPlaying) {
        S.songPlaying = false;
        if (T.song) { clearInterval(T.song); T.song = null; }
      }
      if (S.buildPlaying) {
        S.buildPlaying = false;
        if (T.build) { clearInterval(T.build); T.build = null; }
        buildIdx = 0;
      }
      break;

    case "toggle_dark":
      S.darkMode = !S.darkMode;
      document.body.classList.toggle("dark", S.darkMode);
      saveState();
      break;

    case "toggle_focus":
      S.focusMode = !S.focusMode;
      document.body.classList.toggle("focus-mode", S.focusMode);
      saveState();
      break;

    case "view_level":
      S._viewLevel = parseInt(param);
      break;

    // ── Onboarding ──
    case "onboard_never":
      S.currentSession = 1;
      S.onboardingStep = 1;
      break;

    case "onboard_placement":
      S._placementIdx = 0;
      S._inPlacement = true;
      break;

    case "placement_pass":
      S._placementIdx = (S._placementIdx || 0) + 1;
      if (S._placementIdx >= PLACEMENT_TESTS.length) {
        // Passed all - start at session 21+
        S.currentSession = PLACEMENT_TESTS[PLACEMENT_TESTS.length - 1].passesTo || 21;
        S.level = levelForSession(S.currentSession);
        S._inPlacement = false;
        S.onboardingStep = 1;
      }
      break;

    case "placement_fail": {
      var test = PLACEMENT_TESTS[S._placementIdx || 0];
      S.currentSession = test ? test.failsTo : 1;
      S.level = levelForSession(S.currentSession);
      S._inPlacement = false;
      S.onboardingStep = 1;
      break;
    }

    case "skip_placement":
      S.currentSession = 1;
      S.level = 1;
      S._inPlacement = false;
      S.onboardingStep = 1;
      break;

    case "onboard_next":
      S.onboardingStep = (S.onboardingStep || 0) + 1;
      if (S.onboardingStep > 4) S.onboardingStep = 4;
      break;

    case "onboard_back":
      S.onboardingStep = Math.max(0, (S.onboardingStep || 0) - 1);
      break;

    case "set_keyboard":
      S.keyboardSize = parseInt(param);
      break;

    case "toggle_style_pref": {
      var idx = S.stylePrefs.indexOf(param);
      if (idx >= 0) S.stylePrefs.splice(idx, 1);
      else S.stylePrefs.push(param);
      break;
    }

    case "set_intention":
      S.practiceIntention = param || "";
      saveState();
      break;

    case "onboard_complete":
      S.onboardingComplete = true;
      // Mark completed sessions up to current
      for (var cs = 1; cs < S.currentSession; cs++) {
        if (S.completedSessions.indexOf(cs) < 0) S.completedSessions.push(cs);
      }
      S.level = levelForSession(S.currentSession);
      saveState();
      startGuidedSession();
      return; // startGuidedSession calls render

    // ── Guided sessions ──
    case "practiceStartItem":
      if(typeof startPracticeItem==="function"){startPracticeItem(param);}
      else if(typeof window.startPracticeItem==="function"){window.startPracticeItem(param);}
      return;

    case "start_guided_session":
      startGuidedSession();
      return;

    case "next_step":
      advanceSessionStep();
      return;

    case "advance_phase":
      advanceNewMovePhase();
      return;

    case "play_watch_demo":
      playWatchDemo(param);
      break;

    case "complete_victory_lap":
      completeGuidedSession();
      return;

    case "go_home":
      var _pianoDashboardScreen = S.screen === SCR.RECOMMENDATIONS || S.screen === SCR.INSIGHTS || S.screen === SCR.CHALLENGES || S.screen === SCR.CAREER || S.screen === SCR.HOME_DASH;
      var _pianoUtilityScreen = S.screen === SCR.SETTINGS || S.screen === SCR.CURRICULUM || S.screen === SCR.CLOUD_SETTINGS || S.screen === SCR.MIDI_SETTINGS || S.screen === SCR.MIDI_IMPORT;
      if (_pianoUtilityScreen && typeof returnFromUtilityFamilyRequest === "function") {
        returnFromUtilityFamilyRequest({
          currentScreen: S.screen === SCR.SETTINGS ? "settings"
            : S.screen === SCR.CURRICULUM ? "curriculum"
            : S.screen === SCR.CLOUD_SETTINGS ? "cloud_settings"
            : S.screen === SCR.MIDI_SETTINGS ? "midi_settings"
            : "midi_import"
        });
      } else if (typeof returnFromHomeFamilyRequest === "function") {
        returnFromHomeFamilyRequest({
          currentScreen: _pianoDashboardScreen ? "home_dash" : "home"
        });
      }
      S.screen = _pianoDashboardScreen ? SCR.HOME_DASH : SCR.HOME;
      S.sessionStep = null;
      S.sessionPlan = null;
      break;
    case "openCalibration":
      if (typeof openPerformanceCalibrationRequest === "function") {
        openPerformanceCalibrationRequest();
      }
      S.screen = SCR.CALIBRATION;
      break;

    // ── Legacy practice ──
    case "start_session":
      S.chord = param;
      S.timer = S.practiceLen;
      S.active = true;
      S.paused = false;
      checkPracticeDate();
      playSound("start");
      if (T.session) clearInterval(T.session);
      T.session = setInterval(tickSession, 1000);
      break;

    case "stop_session":
      if (S.screen === SCR.SESSION) {
        // Stop guided session — clear both guided and legacy timers
        if (T.sessionStep) { clearInterval(T.sessionStep); T.sessionStep = null; }
        if (T.session) { clearInterval(T.session); T.session = null; }
        stopMetronome(); stopLHPattern(); stopWatchDemo();
        if (S.detecting) stopDetection();
        S.active = false;
        S.screen = SCR.HOME;
        S.sessionStep = null;
        S.sessionPlan = null;
      } else {
        if (T.session) { clearInterval(T.session); T.session = null; }
        S.active = false;
        if (S.detecting) stopDetection();
        stopMetronome();
      }
      break;

    case "pause":
      S.paused = !S.paused;
      break;

    case "play_chord": {
      var chordToPlay = param ? findChord(param) : (S.chord ? findChord(S.chord) : null);
      if (chordToPlay) playChord(chordToPlay);
      checkReward("play_chord");
      break;
    }

    case "toggle_detect":
      if (S.detecting) {
        if (S.pitchDetectionMode === "yin") stopYinDetection();
        else stopDetection();
      } else {
        if (S.midiEnabled) stopMidi(); // mic and MIDI share S.detectedNotes
        if (S.pitchDetectionMode === "yin") startYinDetection();
        else startDetection();
      }
      break;

    case "set_pitch_detection":
      S.pitchDetectionMode = param; // "fft" | "yin"
      saveState();
      break;

    case "toggle_midi":
      if (S.midiEnabled) stopMidi();
      else startMidi();
      break;

    case "toggle_record":
      if (isRecording()) stopRecording();
      else startRecording();
      break;

    case "play_clip":
      playClip(param);
      break;

    case "delete_clip":
      deleteClip(parseInt(param));
      break;

    case "set_practice_len":
      S.practiceLen = parseInt(param);
      saveState();
      break;

    // ── Drill ──
    case "start_drill": {
      var chords = [];
      if (param === "level") {
        chords = chordsForLevel(S.level).map(function(c) { return c.short; });
        if (chords.length < 2) chords = chordsUpToLevel(S.level).map(function(c) { return c.short; });
      } else if (param === "all") {
        chords = chordsUpToLevel(S.level).filter(function(c) { return (S.chordProg[c.short] || 0) > 0; }).map(function(c) { return c.short; });
        if (chords.length < 3) chords = chordsUpToLevel(S.level).slice(0, 6).map(function(c) { return c.short; });
      } else if (param === "random") {
        var all = chordsUpToLevel(S.level).map(function(c) { return c.short; });
        for (var ri = all.length - 1; ri > 0; ri--) {
          var rj = Math.floor(Math.random() * (ri + 1));
          var rt = all[ri]; all[ri] = all[rj]; all[rj] = rt;
        }
        chords = all.slice(0, 6);
      }
      for (var di = chords.length - 1; di > 0; di--) {
        var dj = Math.floor(Math.random() * (di + 1));
        var dtmp = chords[di]; chords[di] = chords[dj]; chords[dj] = dtmp;
      }
      S.drillChords = chords;
      S.drillIdx = 0;
      S.drillTimer = 30;
      S.drillActive = true;
      playSound("start");
      if (T.drill) clearInterval(T.drill);
      T.drill = setInterval(tickDrill, 1000);
      break;
    }

    case "drill_custom": {
      var set = S.customSets[parseInt(param)];
      if (set) {
        S.drillChords = set.chords.slice();
        S.drillIdx = 0;
        S.drillTimer = 30;
        S.drillActive = true;
        playSound("start");
        if (T.drill) clearInterval(T.drill);
        T.drill = setInterval(tickDrill, 1000);
      }
      break;
    }

    case "drill_next":
      S.drillIdx++;
      if (S.drillIdx >= S.drillChords.length) S.drillIdx = 0;
      playChordByName(S.drillChords[S.drillIdx]);
      checkReward("drill_chord");
      break;

    case "stop_drill":
      if (T.drill) { clearInterval(T.drill); T.drill = null; }
      S.drillActive = false;
      break;

    // ── Daily ──
    case "start_daily": {
      var dt = DAILY_TYPES.find(function(d) { return d.id === param; });
      if (!dt) break;
      S.dailyType = param;
      S.dailyTimer = dt.dur;
      S.dailyActive = true;
      S.dailyScore = 0;
      var dPool = chordsUpToLevel(S.level).map(function(c) { return c.short; });
      S.chord = dPool[Math.floor(Math.random() * dPool.length)];
      playSound("start");
      if (T.daily) clearInterval(T.daily);
      T.daily = setInterval(tickDaily, 1000);
      break;
    }

    case "daily_action": {
      S.dailyScore++;
      var daPool = chordsUpToLevel(S.level).map(function(c) { return c.short; });
      S.chord = daPool[Math.floor(Math.random() * daPool.length)];
      playSound("tick");
      checkReward("daily_action");
      break;
    }

    case "stop_daily":
      if (T.daily) { clearInterval(T.daily); T.daily = null; }
      S.dailyActive = false;
      break;

    // ── Quiz ──
    case "start_quiz":
      S.quizQ = genQuiz();
      S.quizAns = null;
      break;

    case "quiz_answer":
      if (S.quizAns) break;
      S.quizAns = param;
      S.quizTotal = (S.quizTotal || 0) + 1;
      if (param === S.quizQ.answer) {
        S.quizCorrect++;
        addXP(10);
        playSound("complete");
        checkReward("quiz_correct");
      } else {
        playSound("wrong");
      }
      pianoCheckBadges();
      saveState();
      break;

    case "next_quiz":
      S.quizQ = genQuiz();
      S.quizAns = null;
      break;

    // ── Ear training ──
    case "start_ear": {
      var ePool = chordsUpToLevel(Math.min(S.level + 1, 8));
      var ec = ePool[Math.floor(Math.random() * ePool.length)];
      S.earChord = ec.short;
      S.earRevealed = false;
      playChord(ec);
      break;
    }

    case "ear_play":
      if (S.earChord) playChordByName(S.earChord);
      break;

    case "ear_guess":
      S.earRevealed = true;
      if (param === S.earChord) {
        addXP(10);
        playSound("complete");
        checkReward("ear_correct");
      } else {
        playSound("wrong");
      }
      break;

    case "next_ear": {
      var nePool = chordsUpToLevel(Math.min(S.level + 1, 8));
      var nec = nePool[Math.floor(Math.random() * nePool.length)];
      S.earChord = nec.short;
      S.earRevealed = false;
      playChord(nec);
      break;
    }

    // ── Styles ──
    case "select_style":
      S.styleIdx = parseInt(param);
      break;

    case "play_style": {
      var ps = PLAY_STYLES[S.styleIdx];
      if (!ps) break;
      var demoChord = findChord("C");
      if (demoChord) playChord(demoChord, ps.id);
      break;
    }

    case "start_metronome":
      startMetronome(S.adaptiveBpm || S.bpm);
      break;

    case "stop_metronome":
      stopMetronome();
      break;

    // ── Songs ──
    case "song_sort":
      if (S.songSort === param) { S.songSortAsc = !S.songSortAsc; }
      else { S.songSort = param; S.songSortAsc = true; }
      break;
    case "song_filter":
      S.songFilter = param || "";
      break;
    case "select_song":
      S.songIdx = parseInt(param);
      S.songChordIdx = 0;
      S.songPlaying = false;
      S.bpm = SONGS[parseInt(param)].bpm;
      if (typeof window.openSongSessionRequest === "function" && SONGS[S.songIdx]) {
        window.openSongSessionRequest({
          songData: SONGS[S.songIdx],
          source: "builtin",
          songBeat: 0
        });
      }
      break;

    case "play_song":
      if (S.songPlaying) {
        S.songPlaying = false;
        if (typeof window.syncSongRuntimeRequest === "function" && SONGS[S.songIdx]) {
          window.syncSongRuntimeRequest("pause", {
            songData: SONGS[S.songIdx],
            source: "builtin",
            songBeat: S.songChordIdx
          });
        }
        if (T.song) { clearInterval(T.song); T.song = null; }
        stopMetronome();
        if (typeof stopMidiBacking === "function") stopMidiBacking();
      } else {
        S.songPlaying = true;
        var song = SONGS[S.songIdx];
        if (song) {
          if (typeof window.syncSongRuntimeRequest === "function") {
            window.syncSongRuntimeRequest("play", {
              songData: song,
              source: "builtin",
              songBeat: S.songChordIdx
            });
          }
          var interval = (60000 / S.bpm) * 2;
          playChordByName(song.progression[0], song.style || "block");
          T.song = setInterval(songTick, interval);
          startMetronome(S.bpm);
          // Play MIDI backing track if available
          if (song.midi && typeof loadMidiBacking === "function") {
            loadMidiBacking(song.midi).then(function() {
              if (S.songPlaying) playMidiBacking(0, 1);
            }).catch(function() {});
          }
        }
      }
      break;

    case "song_back":
      if (typeof window.applySongNavigationRequest === "function") {
        window.applySongNavigationRequest("songs_home");
      }
      S.songIdx = null;
      S.songPlaying = false;
      if (T.song) { clearInterval(T.song); T.song = null; }
      stopMetronome();
      break;

    // ── Stems ──
    case "stemOpenFile":
      if (!window.electron) break;
      S.stemError = null; render();
      window.electron.stems.openFile().then(function(result) {
        if (!result) return;
        S.stemFile = result; S.stemStatus = "idle"; render();
        window.electron.stems.checkCache(result.filePath).then(function(cached) {
          if (cached) {
            S.stemPaths = cached;
            _loadStemFileUrls(cached);
          } else {
            act("stemSeparate");
          }
        });
      });
      break;
    case "stemSeparate":
      if (!window.electron || !S.stemFile) break;
      S.stemStatus = "separating"; S.stemProgress = 0; S.stemError = null; render();
      var removeProgress = window.electron.stems.onProgress(function(data) {
        var match = data.line.match(/(\d+)%/);
        if (match) { S.stemProgress = parseInt(match[1]); render(); }
      });
      window.electron.stems.separate(S.stemFile.filePath).then(function(result) {
        removeProgress();
        S.stemPaths = result.stemPaths;
        _loadStemFileUrls(result.stemPaths);
        render();
      }).catch(function(err) {
        removeProgress();
        S.stemStatus = "error"; S.stemError = err.message; render();
      });
      break;
    case "stemCancel":
      if (window.electron) window.electron.stems.cancel();
      S.stemStatus = "idle"; S.stemProgress = 0; render();
      break;
    case "stemOpen":
      if (typeof openStemPlayerRequest === "function") {
        openStemPlayerRequest();
      }
      S.screen = SCR.STEM_PLAYER; render(); break;
    case "stemBack":
      if (typeof closeStemPlayerRequest === "function") {
        closeStemPlayerRequest();
      }
      cleanupStems(); S.screen = SCR.HOME; S.tab = TAB.SONGS; S._songTab = "stems"; render();
      break;
    case "stemToggle":
      S.stemToggles[param] = !S.stemToggles[param];
      setStemMuted(param, !S.stemToggles[param]);
      break;
    case "stemSolo":
      for (var sk in S.stemToggles) S.stemToggles[sk] = (sk === param);
      for (var sk in S.stemToggles) setStemMuted(sk, !S.stemToggles[sk]);
      break;
    case "stemAll":
      for (var sk in S.stemToggles) { S.stemToggles[sk] = true; setStemMuted(sk, false); }
      break;
    case "stemPlay":
      if (S.stemPlaying) pauseStems(); else playStems();
      break;
    case "stemSeek":
      seekStems(parseFloat(param)); break;
    case "stemVolume":
      S.stemVolume = parseFloat(param); setStemVolume(S.stemVolume); break;

    // ── Practice Plan ──
    case "openPlan":
      if (typeof openPracticePlanScreenRequest === "function") {
        openPracticePlanScreenRequest();
      } else if (typeof openDashboardPracticePlanRequest === "function") {
        openDashboardPracticePlanRequest();
      }
      S.screen = SCR.PLAN; break;
    case "completePlan":
      completePracticePlan(); break;
    case "regeneratePlan":
      buildPracticePlan(); break;

    // ── Performance Mode ──
    case "open_perform_song": {
      var idx = parseInt(param);
      var song = SONGS[idx];
      if(song){
        if (typeof window.openPerformanceSongSelectionRequest === "function") {
          window.openPerformanceSongSelectionRequest({
            songIndex: idx,
            songId: normalizeSongId(song),
            songTitle: song.title || null,
            arrangementType: "block_chords",
            difficultyId: S.performDifficulty || "normal"
          });
          if (window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function") {
            var coreView = window.sparkCore.getActiveSessionView();
            if (coreView && coreView.plan && coreView.plan.context && coreView.plan.context.performanceSong) {
              syncPianoPerformanceSongFromCore(coreView.plan);
              break;
            }
          }
        } else if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
          var corePlan = window.sparkCore.startSession({
            flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
            songIndex: idx,
            songId: normalizeSongId(song),
            arrangementType: "block_chords",
            difficultyId: S.performDifficulty || "normal"
          });
          if (corePlan && corePlan.context && corePlan.context.performanceSong) {
            syncPianoPerformanceSongFromCore(corePlan);
            break;
          }
        }
        S.performSongData = song;
        S.performSongId = normalizeSongId(song);
        S.performArrangementType = "block_chords";
        S.screen = SCR.PERFORM_SONG;
      }
      break;
    }
    case "performDifficulty":
      applyPerformanceDifficultyToState(param || "normal");
      if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
        window.sparkCore.syncPerformanceRuntimeState("configure", {
          difficulty: S.performDifficulty
        });
      }
      saveState();
      break;
    case "performArrangement":
      S.performArrangementType = param || "block_chords";
      if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
        window.sparkCore.syncPerformanceRuntimeState("configure", {
          arrangementType: S.performArrangementType
        });
      }
      saveState();
      break;
    case "importSongAudio":
      if(!window.electron||!window.electron.stems){alert("Requires desktop app.");break;}
      var importSongId=param;
      window.electron.stems.openFile().then(function(result){
        if(!result)return;
        S.songAudioImporting=true;
        S.songAudioProgress=0;
        render();

        var unsubProgress=window.electron.stems.onProgress(function(data){
          if(data&&data.progress!=null){S.songAudioProgress=Math.round(data.progress);render();}
        });

        window.electron.stems.checkCache(result.filePath).then(function(cached){
          if(cached) return cached;
          return window.electron.stems.separate(result.filePath);
        }).then(function(stemPaths){
          unsubProgress();
          if(!stemPaths){S.songAudioImporting=false;render();return;}
          var stemNames=Object.keys(stemPaths);
          var urlMap={};
          function loadNext(idx){
            if(idx>=stemNames.length){
              S.songAudioData[importSongId]={
                mp3Path:result.filePath,
                detectedBpm:null,
                stemPaths:stemPaths,
                stemUrls:urlMap,
                importedAt:new Date().toISOString()
              };
              S.songAudioImporting=false;
              saveState();render();
              return;
            }
            window.electron.stems.getFileUrl(stemPaths[stemNames[idx]]).then(function(url){
              urlMap[stemNames[idx]]=url;
              loadNext(idx+1);
            });
          }
          loadNext(0);
        }).catch(function(err){
          unsubProgress();
          S.songAudioImporting=false;
          alert("Stem separation failed: "+(err.message||err));
          render();
        });
      });
      break;
    case "removeSongAudio":
      delete S.songAudioData[param];
      saveState();render();
      break;
    case "performStart": {
      var chart = buildPerformanceChartFromSong(S.performSongData, S.performArrangementType);
      var startRequest = typeof window.startSelectedPerformanceSongRequest === "function"
        ? window.startSelectedPerformanceSongRequest({
            chart: chart,
            chartId: chart && chart.id ? chart.id : null,
            songTitle: S.performSongData && S.performSongData.title ? S.performSongData.title : null,
            difficulty: S.performDifficulty,
            arrangementType: S.performArrangementType,
            speed: S.performSpeed || 1,
            preset: S.performPracticePreset || null,
            mode: S.performMode || "midi",
            countIn: !!S.performCountIn
          })
        : null;
      startPerformance(chart, {
        difficulty:startRequest && startRequest.difficulty ? startRequest.difficulty : S.performDifficulty,
        speed:startRequest && startRequest.speed ? startRequest.speed : (S.performSpeed || 1),
        preset:startRequest ? startRequest.preset : (S.performPracticePreset || null),
        mode:startRequest && startRequest.mode ? startRequest.mode : (S.performMode || "midi")
      });
      return;
    }
    case "pausePerform":
      pausePerformance();
      return;
    case "resumePerform":
      resumePerformance();
      return;
    case "performRetry":
      if(S.performSongData){
        var chart = buildPerformanceChartFromSong(S.performSongData, S.performArrangementType);
        var retryRequest = typeof window.getPerformanceRetryRequest === "function"
          ? window.getPerformanceRetryRequest({
              chart: chart,
              chartId: chart && chart.id ? chart.id : null,
              difficulty: S.performDifficulty,
              arrangementType: S.performArrangementType,
              speed: S.performSpeed || 1,
              mode: S.performMode || "midi",
              preset: S.performPracticePreset || null
            })
          : null;
        startPerformance(chart, {
          difficulty:retryRequest && retryRequest.difficulty ? retryRequest.difficulty : S.performDifficulty,
          speed:retryRequest && retryRequest.speed ? retryRequest.speed : (S.performSpeed || 1),
          preset:retryRequest ? retryRequest.preset : (S.performPracticePreset || null),
          mode:retryRequest && retryRequest.mode ? retryRequest.mode : (S.performMode || "midi")
        });
      }
      return;
    case "stopPerform":
      stopPerformance();
      if (typeof window.applyPerformanceNavigationRequest === "function") {
        window.applyPerformanceNavigationRequest("songs_home");
      }
      S.screen = SCR.HOME;
      S.tab = TAB.SONGS;
      render();
      return;

    // ── Rhythm ──
    case "start_rhythm":
      S.rhythmActive = true;
      S.rhythmScore = 0;
      S.rhythmCombo = 0;
      S.rhythmBeat = 0;
      S._rhythmStart = performance.now();
      S._rhythmInterval = 60000 / S.bpm;
      if (T.rhythm) clearInterval(T.rhythm);
      T.rhythm = setInterval(rhythmTick, S._rhythmInterval);
      startMetronome(S.bpm);
      break;

    case "rhythm_hit": {
      var elapsed = performance.now() - S._rhythmStart;
      var beatInterval = S._rhythmInterval;
      var beatPhase = (elapsed % beatInterval) / beatInterval;
      var accuracy = Math.min(beatPhase, 1 - beatPhase);
      if (accuracy < 0.15) {
        S.rhythmScore += 10 * (S.rhythmCombo + 1);
        S.rhythmCombo++;
        playSound("tick");
      } else if (accuracy < 0.3) {
        S.rhythmScore += 5;
        S.rhythmCombo = 0;
      } else {
        S.rhythmCombo = 0;
        playSound("wrong");
      }
      break;
    }

    case "stop_rhythm":
      S.rhythmActive = false;
      if (T.rhythm) { clearInterval(T.rhythm); T.rhythm = null; }
      stopMetronome();
      addXP(Math.floor(S.rhythmScore / 10));
      addHistory("rhythm", { score: S.rhythmScore });
      break;

    // ── Runner ──
    case "start_runner":
      S.runnerActive = true;
      S.runnerScore = 0;
      spawnRunnerTarget();
      if (T.runner) clearInterval(T.runner);
      T.runner = setInterval(function() {
        S.runnerScore = Math.max(0, S.runnerScore - 1);
        spawnRunnerTarget();
        render();
      }, 4000);
      break;

    case "runner_pick":
      if (param === S.runnerTarget) {
        S.runnerScore += 10;
        playSound("tick");
        addXP(2);
        checkReward("runner_correct");
      } else {
        S.runnerScore = Math.max(0, S.runnerScore - 5);
        playSound("wrong");
      }
      spawnRunnerTarget();
      break;

    case "stop_runner":
      S.runnerActive = false;
      if (T.runner) { clearInterval(T.runner); T.runner = null; }
      addHistory("runner", { score: S.runnerScore });
      break;

    // ── Build ──
    case "build_add":
      S.buildChords.push(param);
      break;

    case "build_remove":
      S.buildChords.splice(parseInt(param), 1);
      break;

    case "build_clear":
      S.buildChords = [];
      S.buildPlaying = false;
      if (T.build) { clearInterval(T.build); T.build = null; }
      break;

    case "build_play":
      if (S.buildPlaying) {
        S.buildPlaying = false;
        if (T.build) { clearInterval(T.build); T.build = null; }
        buildIdx = 0;
      } else {
        S.buildPlaying = true;
        buildIdx = 0;
        buildTick();
        T.build = setInterval(buildTick, (60000 / S.bpm) * 2);
      }
      break;

    // ── Custom sets ──
    case "new_custom": {
      var name = prompt("Set name:");
      if (!name || !name.trim()) break;
      var chordStr = prompt("Chords (comma-separated, e.g. C,Am,F,G):");
      if (!chordStr) break;
      var parsed = chordStr.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
      var valid = parsed.filter(function(c) { return findChord(c); });
      var invalid = parsed.filter(function(c) { return !findChord(c); });
      if (valid.length < 2) {
        showToast("Need at least 2 valid chords." + (invalid.length ? " Unknown: " + invalid.join(", ") : ""));
        break;
      }
      if (invalid.length) showToast("Skipped unknown: " + invalid.join(", "));
      S.customSets.push({ name: name.trim().slice(0, 50), chords: valid });
      saveState();
      break;
    }

    case "del_custom":
      S.customSets.splice(parseInt(param), 1);
      saveState();
      break;

    // ── Settings ──
    case "set_bpm":
      S.bpm = Math.max(40, Math.min(200, parseInt(param) || 72));
      break;

    case "set_volume":
      setVolume(parseInt(param) / 100);
      saveState();
      break;

    case "set_reverb":
      setReverb(parseInt(param) / 100);
      break;

    case "set_tone":
      S.tone = param;
      saveState();
      break;

    case "set_metronome_sound":
      S.metronomeSound = param; // "sine" | "woodblock" | "clap" | "hihat"
      saveState();
      break;

    case "set_a4_tuning":
      S.a4Tuning = Math.max(432, Math.min(446, parseInt(param)));
      saveState();
      break;

    case "set_goal":
      S.dailyGoal = parseInt(param);
      saveState();
      break;

    case "reset":
      resetProgress();
      break;

    case "undo_reset":
      undoReset();
      break;

    // ── Finger exercises ──
    case "complete_warmup":
      S.fingerWarmUpDone = true;
      completeFingerExercise(param || "P-OFF-1");
      break;

    case "skip_warmup":
      S.fingerWarmUpDone = true;
      break;

    case "complete_finger_exercise":
      completeFingerExercise(param);
      break;

    case "start_chord_change": {
      var parts = param.split(",");
      if (parts.length !== 2) break;
      S.chordChangePair = parts;
      S.chordChangeCount = 0;
      S.chordChangeTimer = 60;
      S.chordChangeActive = true;
      playSound("start");
      if (T.chordChange) clearInterval(T.chordChange);
      T.chordChange = setInterval(tickChordChange, 1000);
      break;
    }

    case "chord_change_tap":
      if (!S.chordChangeActive) break;
      S.chordChangeCount++;
      playSound("tick");
      break;

    case "stop_chord_change":
      finishChordChange();
      break;

    // ── MIDI Device/Profile actions ──
    case "setMidiDevice":
      S.activeMidiDeviceId = param;
      if (typeof syncMidiSettingsStateRequest === "function") syncMidiSettingsStateRequest();
      saveState();
      break;

    case "setMidiProfile":
      if(typeof setActiveMidiProfile === "function") setActiveMidiProfile(param);
      if (typeof syncMidiSettingsStateRequest === "function") syncMidiSettingsStateRequest();
      break;

    case "createDefaultPianoProfile":
      if(typeof createDefaultPianoProfile === "function") createDefaultPianoProfile();
      if (typeof syncMidiSettingsStateRequest === "function") syncMidiSettingsStateRequest();
      break;

    case "createDefaultGuitarProfile":
      if(typeof createDefaultGuitarProfile === "function") createDefaultGuitarProfile();
      if (typeof syncMidiSettingsStateRequest === "function") syncMidiSettingsStateRequest();
      break;

    case "openMidiSettings":
      if (typeof openUtilityScreenRequest === "function") {
        openUtilityScreenRequest("midi_settings");
      }
      if (typeof syncMidiSettingsStateRequest === "function") syncMidiSettingsStateRequest();
      S.screen = SCR.MIDI_SETTINGS;
      break;

    case "openMidiImport":
      if (typeof openUtilityScreenRequest === "function") {
        openUtilityScreenRequest("midi_import");
      }
      if (typeof syncMidiImportStateRequest === "function") syncMidiImportStateRequest();
      S.screen = SCR.MIDI_IMPORT;
      break;

    // ── MIDI Import actions ──
    case "importMidiFile":
      if(typeof handleMidiImport === "function") handleMidiImport(param);
      return;

    case "assignMidiTrack": {
      var atParts = String(param).split("|");
      if(typeof setMidiTrackAssignment === "function") setMidiTrackAssignment(atParts[0], atParts[1]);
      if (typeof syncMidiImportStateRequest === "function") syncMidiImportStateRequest();
      break;
    }

    case "buildMidiSeedChart": {
      var seedChart = typeof buildSeedChartFromImportedMidi === "function"
        ? buildSeedChartFromImportedMidi(S.importedMidi, S.importedMidiAssignments, param)
        : null;
      S.importedMidiSeedPreview = seedChart;
      if (typeof syncMidiImportStateRequest === "function") syncMidiImportStateRequest({ seedMode: param, seedChart: seedChart });
      if(seedChart && typeof openEditor === "function"){
        openEditor("chart", seedChart);
      }
      break;
    }

    // ── Cloud Sync actions ──
    case "cloudSync":
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("sync_start", { lastSyncStatus: "syncing" });
      if(typeof syncSparkNow === "function") syncSparkNow();
      return;

    case "cloudPull":
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("pull_start", { lastSyncStatus: "syncing" });
      if(typeof pullSparkCloud === "function") pullSparkCloud();
      return;

    case "cloudLogout":
      if(typeof logoutSpark === "function") logoutSpark();
      break;

    case "cloudLoginPrompt": {
      var clEmail = prompt("Email:");
      var clPassword = prompt("Password:");
      if(clEmail && clPassword && typeof loginSpark === "function"){
        loginSpark(clEmail, clPassword).then(function(){ if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("login"); render(); });
      }
      return;
    }

    case "openCloudSettings":
      if (typeof openUtilityScreenRequest === "function") {
        openUtilityScreenRequest("cloud_settings");
      }
      if (typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("open");
      S.screen = SCR.CLOUD_SETTINGS;
      break;

    case "openCurriculum":
      if (typeof openUtilityScreenRequest === "function") {
        openUtilityScreenRequest("curriculum");
      }
      if (typeof syncCurriculumStateRequest === "function") {
        syncCurriculumStateRequest();
      }
      S.screen = SCR.CURRICULUM;
      break;

    // ── Desktop / Release actions ──
    case "checkUpdates":
      if(typeof checkForDesktopUpdates === "function") checkForDesktopUpdates();
      return;

    case "exportBackup":
      if(typeof exportFullBackupDesktopAware === "function") exportFullBackupDesktopAware();
      return;

    case "exportFeedback":
      if(typeof exportFeedbackDesktopAware === "function") exportFeedbackDesktopAware();
      return;

    // ── Recommendation engine ──
    case "openRecommendations":
      if (typeof openDashboardSectionRequest === "function") {
        openDashboardSectionRequest("recommendations");
      }
      S.screen = SCR.RECOMMENDATIONS;
      break;
    case "launchRecommendation":
      if(typeof launchRecommendationById === "function") launchRecommendationById(param);
      return;

    // ── Career mode ──
    case "openCareer":
      if (typeof openDashboardSectionRequest === "function") {
        openDashboardSectionRequest("career");
      }
      S.screen = SCR.CAREER;
      break;
    case "openCareerSong":
      if(typeof getCareerItem === "function"){
        var cSong = getCareerItem("songs", param);
        if(cSong && typeof window.openCareerSongSelectionRequest === "function"){
          window.openCareerSongSelectionRequest({
            songId: param,
            songData: cSong,
            songTitle: cSong.title || null,
            arrangementType: S.performArrangementType || "block_chords",
            difficultyId: S.performDifficulty || "normal"
          });
        }
        if(cSong){
          S.performSongData = cSong;
          S.performSongId = param;
        }
      }
      S.screen = SCR.PERFORM_SONG;
      break;

    // ── Insights ──
    case "openInsights":
      if (typeof openDashboardSectionRequest === "function") {
        openDashboardSectionRequest("insights");
      }
      S.screen = SCR.INSIGHTS;
      break;

    // ── Challenge hub ──
    case "openChallengeHub":
      if (typeof openDashboardSectionRequest === "function") {
        openDashboardSectionRequest("challenges");
      }
      S.screen = SCR.CHALLENGES;
      break;
    case "claimChallengeReward":
      if(typeof claimChallengeReward === "function") claimChallengeReward(param);
      if (typeof applyDashboardChallengeRewardRequest === "function") {
        applyDashboardChallengeRewardRequest(param);
      }
      break;

    // ── Home dashboard ──
    case "openHome":
    case "openHomeDash":
      if (typeof openDashboardSectionRequest === "function") {
        openDashboardSectionRequest("home_dash");
      }
      S.screen = SCR.HOME_DASH;
      break;
    case "refreshHome":
      if(typeof generateRecommendations === "function") generateRecommendations();
      if(typeof generatePersonalInsights === "function") generatePersonalInsights();
      if (typeof refreshDashboardSnapshotRequest === "function") {
        refreshDashboardSnapshotRequest({
          recommendations: S.recommendations || [],
          insights: S.personalInsights || null,
          challenges: S.activeChallenges || [],
          refreshedAt: Date.now()
        });
      }
      break;
    case "initChallenges":
      if(typeof initializeChallengesForCurrentCycle === "function") initializeChallengesForCurrentCycle();
      if (typeof initializeDashboardChallengesRequest === "function") {
        initializeDashboardChallengesRequest({
          recommendations: S.recommendations || [],
          insights: S.personalInsights || null,
          challenges: S.activeChallenges || [],
          refreshedAt: Date.now()
        });
      }
      break;

    // ── Practice plan ──
    case "openPracticePlan":
      S.screen = SCR.PLAN;
      break;

    // ── Onboarding flow ──
    case "openOnboarding":
      if(typeof startOnboarding === "function") startOnboarding();
      return;
    case "resumeOnboarding":
      if(typeof continueOnboarding === "function") continueOnboarding();
      return;

    // ── Settings ──
    case "openSettings":
      if (typeof openUtilityScreenRequest === "function") {
        openUtilityScreenRequest("settings");
      }
      S.screen = SCR.SETTINGS;
      break;

    default:
      _handled = false;
      break;
  }

  // Call SparkSuite's global render, not piano's local render
  if (typeof window.render === "function") window.render();
  return _handled;
}

// ── Render (piano-specific, NOT used by SparkSuite — kept for reference) ──
function render() {
  var root = document.getElementById("app");
  if (!root) return;

  // Onboarding check
  if (!S.onboardingComplete) {
    if (S._inPlacement) {
      root.innerHTML = placementTestPage();
    } else {
      root.innerHTML = (typeof pianoOnboardingPage === "function" ? pianoOnboardingPage() : "");
    }
    return;
  }

  // Session screen
  if (S.screen === SCR.SESSION && S.sessionPlan) {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + (typeof pianoSessionPage === "function" ? pianoSessionPage() : "");
    return;
  }

  // Stem player screen
  if (S.screen === SCR.STEM_PLAYER) {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + (typeof pianoStemsPlayerPage === "function" ? pianoStemsPlayerPage() : "");
    return;
  }

  // Practice plan screen
  if (S.screen === SCR.PLAN) {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + (typeof pianoPlanPage === "function" ? pianoPlanPage() : "");
    return;
  }

  // MIDI settings screen
  if (S.screen === SCR.MIDI_SETTINGS && typeof midiSettingsPage === "function") {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + midiSettingsPage();
    return;
  }

  // MIDI import screen
  if (S.screen === SCR.MIDI_IMPORT && typeof midiImportPage === "function") {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + midiImportPage();
    return;
  }

  // Cloud settings screen
  if (S.screen === SCR.CLOUD_SETTINGS && typeof cloudSettingsPage === "function") {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + cloudSettingsPage();
    return;
  }

  // Curriculum screen
  if (S.screen === SCR.CURRICULUM && typeof curriculumPage === "function") {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + curriculumPage();
    return;
  }

  // Performance mode screens
  if (S.screen === SCR.PERFORM_SONG) {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + (typeof pianoPerformSongPage === "function" ? pianoPerformSongPage() : "");
    return;
  }
  if (S.screen === SCR.PERFORM) {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + (typeof pianoPerformPage === "function" ? pianoPerformPage() : "");
    return;
  }
  if (S.screen === SCR.PERFORM_DONE) {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + (typeof pianoPerformDonePage === "function" ? pianoPerformDonePage() : "");
    return;
  }

  // Calibration screen
  if (S.screen === SCR.CALIBRATION && typeof calibrationPage === "function") {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + '<div style="padding:8px"><button class="btn" onclick="act(\'go_home\')">Back</button></div>' + calibrationPage();
    return;
  }

  // Onboarding flow screen (new)
  if (S.screen === SCR.ONBOARDING_FLOW && typeof onboardingFlowPage === "function") {
    root.innerHTML = onboardingFlowPage();
    return;
  }

  // Home dashboard screen
  if (S.screen === SCR.HOME_DASH && typeof homeDashboardPage === "function") {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + homeDashboardPage();
    return;
  }

  // Recommendations screen
  if (S.screen === SCR.RECOMMENDATIONS && typeof recommendationsPage === "function") {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + recommendationsPage();
    return;
  }

  // Career mode screen
  if (S.screen === SCR.CAREER && typeof careerPage === "function") {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + careerPage();
    return;
  }

  // Insights dashboard screen
  if (S.screen === SCR.INSIGHTS && typeof insightsDashboardPage === "function") {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + insightsDashboardPage();
    return;
  }

  // Challenge hub screen
  if (S.screen === SCR.CHALLENGES && typeof challengeHubPage === "function") {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + challengeHubPage();
    return;
  }

  // Settings screen
  if (S.screen === SCR.SETTINGS && typeof settingsPage === "function") {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + settingsPage();
    return;
  }

  // Legacy active session
  if (S.active && S.chord) {
    root.innerHTML = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + (typeof pianoTabNavHTML === "function" ? pianoTabNavHTML() : "") + legacySessionHTML();
    return;
  }

  // Home screen with tabs
  var html = (typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "") + (typeof pianoTabNavHTML === "function" ? pianoTabNavHTML() : "");
  html += '<main class="tab-content">';
  switch (S.tab) {
    case TAB.PRACTICE: html += typeof pianoPracticeTab === "function" ? pianoPracticeTab() : ""; break;
    case TAB.GAMES:    html += typeof pianoGamesTab === "function" ? pianoGamesTab() : ""; break;
    case TAB.SONGS:    html += typeof pianoSongsTab === "function" ? pianoSongsTab() : ""; break;
    case TAB.TOOLS:    html += typeof pianoToolsTab === "function" ? pianoToolsTab() : ""; break;
  }
  html += '</main>';
  root.innerHTML = html;
}

// ── Additional exports (non-hoisted helpers) ──
window.clickableDiv = typeof clickableDiv !== "undefined" ? clickableDiv : window.clickableDiv;
window.ifThenCard = typeof ifThenCard !== "undefined" ? ifThenCard : window.ifThenCard;
window.getChordMatch = typeof getChordMatch !== "undefined" ? getChordMatch : window.getChordMatch;
window.getCoachFeedback = typeof getCoachFeedback !== "undefined" ? getCoachFeedback : window.getCoachFeedback;
window.addPracticeSecond = typeof addPracticeSecond !== "undefined" ? addPracticeSecond : window.addPracticeSecond;
window.fireMicro = typeof fireMicro !== "undefined" ? fireMicro : window.fireMicro;

// ── Keyboard shortcuts ──
document.addEventListener("keydown", function(e) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      // In perform mode: spacebar = simulate note hit for testing
      if (S.screen === SCR.PERFORM && S.performPlaying && S.performChart && !S.performPaused) {
        var nowSec = PerformanceTransport.now();
        var chart = S.performChart;
        for (var si = 0; si < chart.events.length; si++) {
          var evt = chart.events[si];
          if (evt._scored) continue;
          var delta = Math.abs(nowSec - evt.t) * 1000;
          if (delta < (S.performWindowMissMs || 220)) {
            // Inject the exact target data the scorer expects
            if (evt.target && Array.isArray(evt.target.midi) && evt.target.midi.length) {
              // Block chord: scorer checks heldMidiNotes
              PerformanceInput.heldMidiNotes = {};
              for (var mi = 0; mi < evt.target.midi.length; mi++) {
                PerformanceInput.heldMidiNotes[evt.target.midi[mi]] = true;
              }
              PerformanceInput.recentMidiNoteOns.push({note: evt.target.midi[0], tSec: nowSec});
            } else if (evt.target && typeof evt.target.midi === "number") {
              // LH note: scorer checks single MIDI note
              PerformanceInput.heldMidiNotes = {};
              PerformanceInput.heldMidiNotes[evt.target.midi] = true;
              PerformanceInput.recentMidiNoteOns.push({note: evt.target.midi, tSec: nowSec});
            }
            // Also set pitch classes as fallback
            var pc = evt.target && evt.target.notes ? evt.target.notes : ["C"];
            PerformanceInput.latestPitchClasses = Array.isArray(pc) ? pc.slice() : [pc];
            PerformanceInput._updatePitchClasses && PerformanceInput._updatePitchClasses();
            break;
          }
        }
        break;
      }
      if (S.active || S.screen === SCR.SESSION) act("pause");
      break;
    case "ArrowLeft":
      S.bpm = Math.max(40, S.bpm - 5);
      S.adaptiveBpm = Math.max(40, S.adaptiveBpm - 5);
      saveState(); render();
      break;
    case "ArrowRight":
      S.bpm = Math.min(200, S.bpm + 5);
      S.adaptiveBpm = Math.min(200, S.adaptiveBpm + 5);
      saveState(); render();
      break;
    case "m": case "M":
      if (metronomeInterval) stopMetronome();
      else startMetronome(S.adaptiveBpm || S.bpm);
      break;
    case "d": case "D":
      act("toggle_dark");
      break;
    case "?":
      showToast("Space:Pause | \u2190\u2192:BPM | M:Metro | D:Dark | 1-4:Tabs");
      break;
    case "1": act("tab", TAB.PRACTICE); break;
    case "2": act("tab", TAB.GAMES); break;
    case "3": act("tab", TAB.SONGS); break;
    case "4": act("tab", TAB.TOOLS); break;
  }
});

// Do NOT call loadState() or render() — SparkSuite manages that
})();
