function normalizeSongId(song){return String(song&&song.title||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");}
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
// Piano act() writes screen ids like SCR.SESSION, which need to produce the
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

function pianoAppState() {
  if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
    var sparkRoot = SparkState.getRoot();
    if (sparkRoot) return sparkRoot;
  }
  if (typeof globalThis !== "undefined") {
    return globalThis.__sparkState || globalThis.S || null;
  }
  return null;
}

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
  var state = pianoAppState();
  if (!state || state.currentSession < 1 || state.currentSession > plans.length) return null;
  return plans[state.currentSession - 1];
}

function getCurrentLevel() {
  var curriculum = typeof PIANO_CURRICULUM !== "undefined" ? PIANO_CURRICULUM : [];
  var state = pianoAppState();
  if (!state) return curriculum[0] || null;
  for (var i = 0; i < curriculum.length; i++) {
    if (curriculum[i].num === state.level) return curriculum[i];
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
  var state = pianoAppState();
  if (!state) return;
  state.xp = (state.xp || 0) + n;
  if (typeof saveState === "function") saveState();
}

function addHistory(type, detail) {
  var state = pianoAppState();
  if (!state) return;
  if (!Array.isArray(state.history)) state.history = [];
  var entry = { type: type, ts: Date.now() };
  if (detail && detail.chord !== undefined) entry.chord = detail.chord;
  if (detail && detail.dur !== undefined) entry.dur = detail.dur;
  if (detail && detail.chords !== undefined) entry.chords = detail.chords;
  if (detail && detail.score !== undefined) entry.score = detail.score;
  if (detail && detail.session !== undefined) entry.session = detail.session;
  state.history.push(entry);
  if (typeof saveState === "function") saveState();
}

function recordTransition(fromChord, toChord, wasClean, timeMs) {
  var state = pianoAppState();
  if (!state) return;
  if (!state.transitionStats) state.transitionStats = {};
  var key = fromChord + "_" + toChord;
  if (!state.transitionStats[key]) {
    state.transitionStats[key] = { attempts: 0, clean: 0, avgMs: 0 };
  }
  var stat = state.transitionStats[key];
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
var saveState = function() { if (window.saveState) window.saveState(); };
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
function render() {
  if (typeof window.render === "function") return window.render();
  return legacyPianoRender();
}
function pianoConfirmOverlayHTML(dialog) {
  var title = escHTML(dialog && dialog.title ? dialog.title : "Are you sure?");
  var message = dialog && dialog.message
    ? '<p style="margin:0 0 16px;color:var(--text-muted);font-size:14px;line-height:1.5">' + escHTML(dialog.message) + '</p>'
    : '';
  var confirmLabel = escHTML(dialog && dialog.confirmLabel ? dialog.confirmLabel : "Confirm");
  var cancelLabel = escHTML(dialog && dialog.cancelLabel ? dialog.cancelLabel : "Cancel");
  var html = '<div class="shortcut-overlay" onclick="act(\'cancel_confirm\')">';
  html += '<div class="shortcut-modal" onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="piano-confirm-dialog-title">';
  html += '<h3 id="piano-confirm-dialog-title" style="margin:0 0 10px;font-size:18px;font-weight:900;color:var(--text-primary)">' + title + '</h3>';
  html += message;
  html += '<div style="display:flex;gap:10px;justify-content:flex-end">';
  html += '<button id="piano-confirm-cancel-btn" class="btn btn-secondary" onclick="act(\'cancel_confirm\')">' + cancelLabel + '</button>';
  html += '<button class="btn btn-danger" onclick="act(\'confirm_action\')">' + confirmLabel + '</button>';
  html += '</div></div></div>';
  return html;
}
function withPianoConfirmOverlay(html) {
  return state.confirmDialog ? html + pianoConfirmOverlayHTML(state.confirmDialog) : html;
}
function setPianoRootHTML(root, html) {
  root.innerHTML = withPianoConfirmOverlay(html);
  if (state.confirmDialog) {
    var cancelBtn = document.getElementById("piano-confirm-cancel-btn");
    if (cancelBtn) cancelBtn.focus();
  }
}

function pianoHeaderMarkup() {
  return typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "";
}

function pianoBackButtonMarkup(useBtnClass) {
  if (useBtnClass) {
    return '<div style="padding:8px"><button class="btn" onclick="act(\'go_home\')">Back</button></div>';
  }
  return '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>';
}

function renderPianoPageShell(root, bodyHtml, options) {
  options = options || {};
  var html = pianoHeaderMarkup();
  if (options.backButton) {
    html += pianoBackButtonMarkup(!!options.backButtonClass);
  }
  html += bodyHtml || "";
  setPianoRootHTML(root, html);
}

var PIANO_DASHBOARD_SCREEN_IDS = {};
PIANO_DASHBOARD_SCREEN_IDS[SCR.RECOMMENDATIONS] = true;
PIANO_DASHBOARD_SCREEN_IDS[SCR.INSIGHTS] = true;
PIANO_DASHBOARD_SCREEN_IDS[SCR.CHALLENGES] = true;
PIANO_DASHBOARD_SCREEN_IDS[SCR.CAREER] = true;
PIANO_DASHBOARD_SCREEN_IDS[SCR.HOME_DASH] = true;

var PIANO_UTILITY_SCREEN_KEYS = {};
PIANO_UTILITY_SCREEN_KEYS[SCR.SETTINGS] = "settings";
PIANO_UTILITY_SCREEN_KEYS[SCR.CURRICULUM] = "curriculum";
PIANO_UTILITY_SCREEN_KEYS[SCR.CLOUD_SETTINGS] = "cloud_settings";
PIANO_UTILITY_SCREEN_KEYS[SCR.MIDI_SETTINGS] = "midi_settings";
PIANO_UTILITY_SCREEN_KEYS[SCR.MIDI_IMPORT] = "midi_import";

function isPianoDashboardScreen(screen) {
  return !!PIANO_DASHBOARD_SCREEN_IDS[screen];
}

function isPianoUtilityScreen(screen) {
  return !!PIANO_UTILITY_SCREEN_KEYS[screen];
}

function pianoUtilityRequestScreen(screen) {
  return PIANO_UTILITY_SCREEN_KEYS[screen] || null;
}

function pianoHomeFamilyRequestScreen(screen) {
  return isPianoDashboardScreen(screen) ? "home_dash" : "home";
}

function openPianoDashboardScreen(state, target, screen) {
  if (typeof openDashboardSectionRequest === "function") {
    openDashboardSectionRequest(target);
  }
  state.screen = screen;
}

function openPianoUtilityScreen(state, target, screen, syncRequest) {
  if (typeof openUtilityScreenRequest === "function") {
    openUtilityScreenRequest(target);
  }
  if (typeof syncRequest === "function") {
    syncRequest();
  }
  state.screen = screen;
}

function resetPianoSessionFlowState(state, screen) {
  state.screen = screen;
  state.sessionStep = null;
  state.sessionPlan = null;
  state.newMovePhase = null;
}

function openPianoHomeDashboard(state) {
  openPianoDashboardScreen(state, "home_dash", SCR.HOME_DASH);
}

function openPianoPracticePlan(state) {
  if (typeof openPracticePlanScreenRequest === "function") {
    openPracticePlanScreenRequest();
  } else if (typeof openDashboardPracticePlanRequest === "function") {
    openDashboardPracticePlanRequest();
  }
  state.screen = SCR.PLAN;
}

function openPianoCalibration(state) {
  if (typeof openPerformanceCalibrationRequest === "function") {
    openPerformanceCalibrationRequest();
  }
  state.screen = SCR.CALIBRATION;
}

function openPianoStemPlayer(state) {
  if (typeof openStemPlayerRequest === "function") {
    openStemPlayerRequest();
  }
  state.screen = SCR.STEM_PLAYER;
  render();
}

function closePianoStemPlayer(state) {
  if (typeof closeStemPlayerRequest === "function") {
    closeStemPlayerRequest();
  }
  cleanupStems();
  state.screen = SCR.HOME;
  state.tab = TAB.SONGS;
  state._songTab = "stems";
  render();
}

function syncPianoMidiSettingsState(payload) {
  if (typeof syncMidiSettingsStateRequest === "function") {
    syncMidiSettingsStateRequest(payload);
  }
}

function syncPianoMidiImportState(payload) {
  if (typeof syncMidiImportStateRequest === "function") {
    syncMidiImportStateRequest(payload);
  }
}

function applyPianoCloudWorkflow(action, payload) {
  if (typeof applyCloudWorkflowRequest === "function") {
    applyCloudWorkflowRequest(action, payload || {});
  }
}

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
  var state = pianoAppState();
  if (!state || state.paused || !state.active) return;
  state.timer--;
  addPracticeSecond();
  if (state.timer % 30 === 0 && state.timer > 0) addXP(5);
  var elapsed = state.practiceLen - state.timer;
  var msg = pianoFireMicro(elapsed, state.practiceLen);
  if (msg) showToast(msg);
  if (state.timer <= 0) { completeLegacySession(); return; }
  render();
}

function completeLegacySession() {
  var state = pianoAppState();
  if (!state) return;
  if (T.session) { clearInterval(T.session); T.session = null; }
  state.active = false;
  state.sessions++;
  addXP(20);
  var prog = (state.chordProg[state.chord] || 0) + 15;
  state.chordProg[state.chord] = Math.min(100, prog);
  addHistory("session", { chord: state.chord, dur: state.practiceLen });
  checkPracticeDate();
  checkLevelUp();
  checkReward("session_complete");
  var badges = pianoCheckBadges();
  if (badges.length) showToast("Badge earned! " + badges.map(function(b) { return BADGES.find(function(x) { return x.id === b; }).icon; }).join(" "));
  else playSound("complete");
  if (state.detecting) stopDetection();
  saveState();
  render();
}

function tickDrill() {
  var state = pianoAppState();
  if (!state || !state.drillActive) return;
  state.drillTimer--;
  addPracticeSecond();
  if (state.drillTimer <= 0) { completeDrill(); return; }
  render();
}

function completeDrill() {
  var state = pianoAppState();
  if (!state) return;
  if (T.drill) { clearInterval(T.drill); T.drill = null; }
  state.drillActive = false;
  state.drillsDone++;
  addXP(30);
  addHistory("drill", { chords: state.drillChords.join(",") });
  checkPracticeDate();
  checkReward("drill_complete");
  pianoCheckBadges();
  playSound("complete");
  saveState();
  render();
}

function tickDaily() {
  var state = pianoAppState();
  if (!state || !state.dailyActive) return;
  state.dailyTimer--;
  addPracticeSecond();
  if (state.dailyTimer <= 0) { completeDaily(); return; }
  render();
}

function completeDaily() {
  var state = pianoAppState();
  if (!state) return;
  if (T.daily) { clearInterval(T.daily); T.daily = null; }
  state.dailyActive = false;
  state.dailiesDone++;
  addXP(40);
  addHistory("daily", { score: state.dailyScore });
  checkPracticeDate();
  checkReward("daily_complete");
  pianoCheckBadges();
  playSound("complete");
  saveState();
  render();
}

// ── Guided session step timer ──
function tickSessionStep() {
  var state = pianoAppState();
  if (!state || state.paused) return;
  state.sessionTimer--;
  addPracticeSecond();
  if (state.sessionTimer <= 0) {
    advanceSessionStep();
    return;
  }
  render();
}

// ── Level up check (8 levels) ──
function checkLevelUp() {
  var state = pianoAppState();
  if (!state || state.level >= 8) return;
  // Level up when all sessions for current level are completed
  var curr = CURRICULUM[state.level - 1];
  if (!curr) return;
  var parts = curr.sessions.split("-");
  var lastSession = parseInt(parts.length > 1 ? parts[1] : parts[0]);
  if (state.currentSession > lastSession) {
    state.level = Math.min(8, state.level + 1);
    playSound("levelup");
    showToast("Level Up! You're now Level " + state.level + ": " + LN[state.level] + "!");
    pianoShowConfetti();
    pianoCheckBadges();
    saveState();
  }
}

// ── Reward engine (stickiness #1 + #4) ──
function checkReward(actionType) {
  var state = pianoAppState();
  if (!state) return;
  state.totalActions++;
  state.actionsSinceReward++;

  var phase = getRewardPhase(state.currentSession);
  if (!phase) return;

  var shouldReward = false;
  var isJackpot = false;
  var xpAmount = 25;

  if (phase.schedule === "continuous") {
    shouldReward = true;
    xpAmount = phase.xpPerAction || 25;
  } else if (phase.schedule === "VR-2-3") {
    if (state.actionsSinceReward >= state.nextRewardAt) {
      shouldReward = true;
      state.nextRewardAt = 2 + Math.floor(Math.random() * 2); // 2-3
    }
  } else if (phase.schedule === "VR-5-8") {
    if (state.actionsSinceReward >= state.nextRewardAt) {
      shouldReward = true;
      state.nextRewardAt = 5 + Math.floor(Math.random() * 4); // 5-8
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
    state.actionsSinceReward = 0;
    addXP(xpAmount);
    if (isJackpot) {
      state.jackpotsHit++;
      playSound("jackpot");
      showToast("JACKPOT! +" + xpAmount + " XP!");
    } else {
      playSound("reward");
    }
  }
}

// ── Adaptive difficulty (stickiness #6) ──
function adaptBpm(wasClean) {
  var state = pianoAppState();
  if (!state) return;
  if (wasClean) {
    state._cleanStreak = (state._cleanStreak || 0) + 1;
    state._missStreak = 0;
    if (state._cleanStreak >= 3) {
      state.adaptiveBpm = Math.min(200, state.adaptiveBpm + 3);
      state._cleanStreak = 0;
      if (state.adaptiveBpm > state.personalBests.bpm) {
        state.personalBests.bpm = state.adaptiveBpm;
        if (state.earned.indexOf("speed_demon") < 0) {
          state.earned.push("speed_demon");
          showToast("New personal best BPM!");
        }
      }
    }
  } else {
    state._missStreak = (state._missStreak || 0) + 1;
    state._cleanStreak = 0;
    if (state._missStreak >= 2) {
      state.adaptiveBpm = Math.max(40, state.adaptiveBpm - 5);
      state._missStreak = 0;
    }
  }
  saveState();
}

// ── Interleaving (stickiness #8) ──
function pickReviewChords() {
  var state = pianoAppState();
  if (!state) return ["C"];
  // Select chords from 3-5 sessions ago, not yesterday
  var targetSession = Math.max(1, state.currentSession - Math.floor(Math.random() * 3 + 3));
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
    var available = chordsUpToLevel(state.level).map(function(c) { return c.short; })
      .filter(function(c) { return chords.indexOf(c) < 0; });
    shuffleArray(available);
    while (chords.length < 2 && available.length > 0) chords.push(available.shift());
  }

  // Don't repeat what was just reviewed
  return chords.filter(function(ch) { return state.lastReviewChords.indexOf(ch) < 0; }).slice(0, 3);
}

// ── Quiz generation ──
function genQuiz() {
  var state = pianoAppState();
  var pool = typeof chordsUpToLevel === "function" ? chordsUpToLevel(Math.min(((state && state.level) || 1) + 1, 8)) : [];
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
  var state = pianoAppState();
  if (!state) return;
  var pool = chordsUpToLevel(state.level).map(function(c) { return c.short; });
  state.runnerTarget = pool[Math.floor(Math.random() * pool.length)];
}

// ── Rhythm game ──
function rhythmTick() {
  var state = pianoAppState();
  if (!state || !state.rhythmActive) return;
  state.rhythmBeat++;
  playSound("tick");
  render();
}

// ── Song playback ──
function songTick() {
  var state = pianoAppState();
  if (!state || !state.songPlaying || state.songIdx === null) return;
  var song = SONGS[state.songIdx];
  if (!song) return;
  state.songChordIdx++;
  if (state.songChordIdx >= song.progression.length) {
    state.songChordIdx = 0;
    if (!state.songsDone) state.songsDone = [];
    if (state.songsDone.indexOf(song.title) < 0) {
      state.songsDone.push(song.title);
      addXP(15);
      pianoCheckBadges();
    }
  }
  var chord = song.progression[state.songChordIdx];
  if (typeof window.syncSongRuntimeRequest === "function") {
    window.syncSongRuntimeRequest("tick", {
      songData: song,
      source: "builtin",
      songBeat: state.songChordIdx
    });
  }
  playChordByName(chord, song.style || "block");
  render();
}

// ── Build playback ──
var buildIdx = 0;
function buildTick() {
  var state = pianoAppState();
  if (!state || !state.buildPlaying || !state.buildChords.length) return;
  if (buildIdx >= state.buildChords.length) buildIdx = 0;
  playChordByName(state.buildChords[buildIdx], "block");
  buildIdx++;
  render();
}

// ── Guided session flow ──
function startGuidedSession() {
  var state = pianoAppState();
  if (!state) return;
  if (typeof window.openGuidedSessionRequest === "function") {
    var guidedSession = parseInt(state.currentSession, 10);
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
    var guidedSession = parseInt(state.currentSession, 10);
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

  state.sessionPlan = plan;
  state.screen = SCR.SESSION;
  state.sessionStep = "spark";
  state.newMovePhase = null;
  state.feedbackMessage = "";
  state.adaptiveBpm = plan.bpm;
  state.paused = false;
  state.fingerWarmUpDone = false;

  checkPracticeDate();
  playSound("start");
  saveState();
  render();
}

function syncPianoGuidedPlanFromCore(plan) {
  var state = pianoAppState();
  var guidedPlan = plan && plan.context ? plan.context.guidedPlan : null;
  if (!state || !guidedPlan) return null;

  var guidedSession = plan.context.guidedSession || guidedPlan.num || state.currentSession || 1;
  state.guidedPlan = guidedPlan;
  state.guidedSession = guidedSession;
  state.currentSession = guidedSession;
  state.sessionPlan = guidedPlan;
  state.screen = SCR.SESSION;
  state.sessionStep = "spark";
  state.guidedStep = "spark";
  state.newMovePhase = null;
  state.feedbackMessage = "";
  state.adaptiveBpm = guidedPlan.bpm || state.bpm;
  state.paused = false;
  state.guidedPaused = false;
  state.fingerWarmUpDone = false;
  return guidedPlan;
}

function syncPianoPerformanceSongFromCore(plan) {
  var state = pianoAppState();
  var performanceSong = plan && plan.context ? plan.context.performanceSong : null;
  if (!state || !performanceSong) return null;

  state.performSongData = performanceSong.songData || null;
  state.performSongId = performanceSong.songId || normalizeSongId(performanceSong.songData);
  state.performArrangementType = performanceSong.arrangementType || state.performArrangementType || "block_chords";
  if (performanceSong.difficultyId) state.performDifficulty = performanceSong.difficultyId;
  state.screen = SCR.PERFORM_SONG;
  return performanceSong;
}

function advanceSessionStep() {
  var state = pianoAppState();
  if (!state) return;
  if (T.sessionStep) { clearInterval(T.sessionStep); T.sessionStep = null; }
  stopMetronome();
  stopLHPattern();
  stopWatchDemo();

  var steps = ["spark","review","newMove","songSlice","victoryLap"];
  var idx = steps.indexOf(state.sessionStep);

  // Record what was reviewed so we don't repeat it and can show transition tips
  if (state.sessionStep === "review" && state.sessionPlan && state.sessionPlan.review) {
    state.lastReviewChords = state.sessionPlan.review.chords || [];
  }

  if (idx < steps.length - 1) {
    state.sessionStep = steps[idx + 1];
    state.sessionTimer = 0;

    // Set up phase for New Move
    if (state.sessionStep === "newMove") {
      state.newMovePhase = "watch";
    }
  }
  render();
}

function advanceNewMovePhase() {
  var state = pianoAppState();
  if (!state) return;
  var phases = ["watch","shadow","try","refine"];
  var idx = phases.indexOf(state.newMovePhase);
  if (idx < phases.length - 1) {
    state.newMovePhase = phases[idx + 1];
    state.feedbackMessage = "";
    if (state.detecting) stopDetection();
  } else {
    // Done with New Move, advance to next session step
    advanceSessionStep();
    return;
  }
  render();
}

function completeGuidedSession() {
  var state = pianoAppState();
  if (!state) return;
  if (T.sessionStep) { clearInterval(T.sessionStep); T.sessionStep = null; }
  stopMetronome();
  stopLHPattern();
  if (state.detecting) stopDetection();

  var plan = state.sessionPlan;
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
    resetPianoSessionFlowState(state, SCR.HOME);
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
    resetPianoSessionFlowState(state, SCR.HOME);
    saveState();
    render();
    return;
  }

  if (plan) {
    // Mark session complete
    if (state.completedSessions.indexOf(plan.num) < 0) {
      state.completedSessions.push(plan.num);
    }
    state.sessions++;
    state.currentSession = Math.min(50, plan.num + 1);

    // Progress chord
    if (plan.newMove && plan.newMove.chord) {
      var prog = (state.chordProg[plan.newMove.chord] || 0) + 15;
      state.chordProg[plan.newMove.chord] = Math.min(100, prog);
    }

    addXP(50);
    addHistory("guided_session", { session: plan.num, chord: plan.newMove ? plan.newMove.chord : null });

    // Update LH level
    var newLvl = CURRICULUM[Math.min(state.level, 8) - 1];
    if (newLvl && newLvl.lhPattern) {
      var patIdx = LH_PATTERNS.findIndex(function(p) { return p.id === newLvl.lhPattern; });
      if (patIdx >= 0 && patIdx + 1 > state.lhLevel) state.lhLevel = patIdx + 1;
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

  resetPianoSessionFlowState(state, SCR.HOME);
  saveState();
  render();
}

function syncPianoGuidedCompletionFromCore(result, plan) {
  var state = pianoAppState();
  var guidedPatch = result && result.sessionStatePatch ? result.sessionStatePatch.guided : null;
  if (!state) return;
  if (!Array.isArray(state.completedSessions)) state.completedSessions = [];
  if (!state.chordProg || typeof state.chordProg !== "object") state.chordProg = {};

  if (guidedPatch && Array.isArray(guidedPatch.completedSessionNums)) {
    for (var i = 0; i < guidedPatch.completedSessionNums.length; i++) {
      if (state.completedSessions.indexOf(guidedPatch.completedSessionNums[i]) < 0) {
        state.completedSessions.push(guidedPatch.completedSessionNums[i]);
      }
    }
  } else if (plan && state.completedSessions.indexOf(plan.num) < 0) {
    state.completedSessions.push(plan.num);
  }

  if (guidedPatch && guidedPatch.chordProgress) {
    for (var chordName in guidedPatch.chordProgress) {
      state.chordProg[chordName] = Math.min((state.chordProg[chordName] || 0) + guidedPatch.chordProgress[chordName], 100);
    }
  } else if (plan && plan.newMove && plan.newMove.chord) {
    state.chordProg[plan.newMove.chord] = Math.min((state.chordProg[plan.newMove.chord] || 0) + 15, 100);
  }

  if (guidedPatch && guidedPatch.nextGuidedSession != null) {
    state.currentSession = guidedPatch.nextGuidedSession;
    state.guidedSession = guidedPatch.nextGuidedSession;
  } else if (plan && plan.num != null) {
    state.currentSession = Math.min(50, plan.num + 1);
    state.guidedSession = state.currentSession;
  }

  if (plan) {
    var newLvl = CURRICULUM[Math.min(state.level, 8) - 1];
    if (newLvl && newLvl.lhPattern) {
      var patIdx = LH_PATTERNS.findIndex(function(p) { return p.id === newLvl.lhPattern; });
      if (patIdx >= 0 && patIdx + 1 > state.lhLevel) state.lhLevel = patIdx + 1;
    }
  }
}

// ── Finger exercise helpers ──
function completeFingerExercise(exerciseId) {
  var state = pianoAppState();
  if (!state) return;
  if (!state.fingerStats[exerciseId]) {
    state.fingerStats[exerciseId] = { completions: 0, lastDone: null, bestTrillSpeed: 0 };
  }
  var stats = state.fingerStats[exerciseId];
  stats.completions++;
  var today = new Date().toDateString();
  var wasNewDay = !stats.lastDone || new Date(stats.lastDone).toDateString() !== today;
  stats.lastDone = Date.now();
  state.fingerExercisesDone++;

  // Track days — skip exerciseId since its lastDone was just updated
  if (wasNewDay) {
    var anyDoneToday = false;
    for (var id in state.fingerStats) {
      if (id.charAt(0) === '_') continue;
      if (id === exerciseId) continue;
      if (state.fingerStats[id].lastDone && new Date(state.fingerStats[id].lastDone).toDateString() === today) {
        anyDoneToday = true; break;
      }
    }
    if (!anyDoneToday) state.fingerDaysLogged++;
  }

  addXP(10);
  checkReward("finger_exercise");
  checkFingerBadges();
  saveState();
}

function tickChordChange() {
  var state = pianoAppState();
  if (!state || !state.chordChangeActive) return;
  state.chordChangeTimer--;
  if (state.chordChangeTimer <= 0) {
    finishChordChange();
    return;
  }
  render();
}

function finishChordChange() {
  var state = pianoAppState();
  if (!state) return;
  if (T.chordChange) { clearInterval(T.chordChange); T.chordChange = null; }
  state.chordChangeActive = false;

  // Record result
  if (!state.fingerStats._chordChangeBest) state.fingerStats._chordChangeBest = 0;
  if (state.chordChangeCount > state.fingerStats._chordChangeBest) {
    state.fingerStats._chordChangeBest = state.chordChangeCount;
    showToast("New personal best: " + state.chordChangeCount + " changes!");
  }

  // Record pair-specific best
  if (state.chordChangePair.length === 2) {
    var pairKey = "_cc_" + state.chordChangePair[0] + "_" + state.chordChangePair[1];
    if (!state.fingerStats[pairKey]) state.fingerStats[pairKey] = { best: 0 };
    if (state.chordChangeCount > state.fingerStats[pairKey].best) {
      state.fingerStats[pairKey].best = state.chordChangeCount;
    }
  }

  addXP(Math.floor(state.chordChangeCount / 2));
  addHistory("chord_change", { score: state.chordChangeCount, chords: state.chordChangePair.join(",") });
  checkFingerBadges();
  checkReward("chord_change");
  playSound("complete");
  saveState();
  render();
}

function checkFingerBadges() {
  var state = pianoAppState();
  if (!state) return;
  var newBadges = [];
  function check(id, cond) {
    if (cond && state.fingerBadges.indexOf(id) < 0) {
      state.fingerBadges.push(id);
      newBadges.push(id);
    }
  }

  // Table Tapper: 7 days of off-instrument exercises
  check("table_tapper", state.fingerDaysLogged >= 7);

  // Spider Fingers: all Tier 2 exercises completed at least once
  var tier2 = getExercisesByTier(2);
  var allTier2Done = tier2.length > 0 && tier2.every(function(ex) {
    return state.fingerStats[ex.id] && state.fingerStats[ex.id].completions > 0;
  });
  check("spider_fingers", allTier2Done);

  // 30 Club / 60 Club
  var best = state.fingerStats._chordChangeBest || 0;
  check("thirty_club", best >= 30);
  check("sixty_club", best >= 60);

  // Pinky Power: trill exercise done 5+ times
  var trillStats = state.fingerStats["P-ADV-3"];
  check("pinky_power", trillStats && trillStats.completions >= 5);

  // Cortot Master: Independence Gauntlet done 3+ times
  var gauntletStats = state.fingerStats["P-ADV-4"];
  check("cortot_master", gauntletStats && gauntletStats.completions >= 3);

  // Thumb Ninja: thumb under exercise done 5+ times
  var thumbStats = state.fingerStats["P-ADV-2"];
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
  var state = pianoAppState();
  if (!state) return;
  var _handled = true;
  switch (action) {
    case "tab":
      state.tab = param;
      if (state.songPlaying) {
        state.songPlaying = false;
        if (T.song) { clearInterval(T.song); T.song = null; }
      }
      if (state.buildPlaying) {
        state.buildPlaying = false;
        if (T.build) { clearInterval(T.build); T.build = null; }
        buildIdx = 0;
      }
      break;

    case "pianoGameTab":
      state._gameTab = param || "drill";
      break;

    case "pianoSongTab":
      state._songTab = param || "library";
      break;

    case "pianoToolTab":
      state._toolTab = param || "stats";
      break;

    case "toggle_dark":
      state.darkMode = !state.darkMode;
      document.body.classList.toggle("dark", state.darkMode);
      saveState();
      break;

    case "toggle_focus":
      state.focusMode = !state.focusMode;
      document.body.classList.toggle("focus-mode", state.focusMode);
      saveState();
      break;

    case "view_level":
      state._viewLevel = parseInt(param);
      break;

    // ── Onboarding ──
    case "onboard_never":
      state.currentSession = 1;
      state.onboardingStep = 1;
      break;

    case "onboard_placement":
      state._placementIdx = 0;
      state._inPlacement = true;
      break;

    case "placement_pass":
      state._placementIdx = (state._placementIdx || 0) + 1;
      if (state._placementIdx >= PLACEMENT_TESTS.length) {
        // Passed all - start at session 21+
        state.currentSession = PLACEMENT_TESTS[PLACEMENT_TESTS.length - 1].passesTo || 21;
        state.level = levelForSession(state.currentSession);
        state._inPlacement = false;
        state.onboardingStep = 1;
      }
      break;

    case "placement_fail": {
      var test = PLACEMENT_TESTS[state._placementIdx || 0];
      state.currentSession = test ? test.failsTo : 1;
      state.level = levelForSession(state.currentSession);
      state._inPlacement = false;
      state.onboardingStep = 1;
      break;
    }

    case "skip_placement":
      state.currentSession = 1;
      state.level = 1;
      state._inPlacement = false;
      state.onboardingStep = 1;
      break;

    case "onboard_next":
      state.onboardingStep = (state.onboardingStep || 0) + 1;
      if (state.onboardingStep > 4) state.onboardingStep = 4;
      break;

    case "onboard_back":
      state.onboardingStep = Math.max(0, (state.onboardingStep || 0) - 1);
      break;

    case "set_keyboard":
      state.keyboardSize = parseInt(param);
      break;

    case "toggle_style_pref": {
      var idx = state.stylePrefs.indexOf(param);
      if (idx >= 0) state.stylePrefs.splice(idx, 1);
      else state.stylePrefs.push(param);
      break;
    }

    case "set_intention":
      state.practiceIntention = param || "";
      saveState();
      break;

    case "onboard_complete":
      state.onboardingComplete = true;
      // Mark completed sessions up to current
      for (var cs = 1; cs < state.currentSession; cs++) {
        if (state.completedSessions.indexOf(cs) < 0) state.completedSessions.push(cs);
      }
      state.level = levelForSession(state.currentSession);
      saveState();
      startGuidedSession();
      return; // startGuidedSession calls render

    // ── Guided sessions ──
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
      if (isPianoUtilityScreen(state.screen) && typeof returnFromUtilityFamilyRequest === "function") {
        returnFromUtilityFamilyRequest({
          currentScreen: pianoUtilityRequestScreen(state.screen)
        });
      } else if (typeof returnFromHomeFamilyRequest === "function") {
        returnFromHomeFamilyRequest({
          currentScreen: pianoHomeFamilyRequestScreen(state.screen)
        });
      }
      resetPianoSessionFlowState(state, isPianoDashboardScreen(state.screen) ? SCR.HOME_DASH : SCR.HOME);
      break;
    case "openCalibration":
      openPianoCalibration(state);
      break;

    // ── Legacy practice ──
    case "start_session":
      state.chord = param;
      state.timer = state.practiceLen;
      state.active = true;
      state.paused = false;
      checkPracticeDate();
      playSound("start");
      if (T.session) clearInterval(T.session);
      T.session = setInterval(tickSession, 1000);
      break;

    case "stop_session_confirm":
      state.confirmDialog = {
        title: "End session early?",
        message: "You'll leave the current session and lose the rest of this run.",
        action: "stop_session",
        confirmLabel: "End Session",
        cancelLabel: "Keep Going"
      };
      render();
      break;

    case "stop_session":
      if (state.screen === SCR.SESSION) {
        // Stop guided session — clear both guided and legacy timers
        if (T.sessionStep) { clearInterval(T.sessionStep); T.sessionStep = null; }
        if (T.session) { clearInterval(T.session); T.session = null; }
        stopMetronome(); stopLHPattern(); stopWatchDemo();
        if (state.detecting) stopDetection();
        state.active = false;
        resetPianoSessionFlowState(state, SCR.HOME);
      } else {
        if (T.session) { clearInterval(T.session); T.session = null; }
        state.active = false;
        if (state.detecting) stopDetection();
        stopMetronome();
      }
      break;

    case "pause":
      state.paused = !state.paused;
      break;

    case "play_chord": {
      var chordToPlay = param ? findChord(param) : (state.chord ? findChord(state.chord) : null);
      if (chordToPlay) playChord(chordToPlay);
      checkReward("play_chord");
      break;
    }

    case "toggle_detect":
      if (state.detecting) {
        if (state.pitchDetectionMode === "yin") stopYinDetection();
        else stopDetection();
      } else {
        if (state.midiEnabled) stopMidi(); // mic and MIDI share detected-note runtime
        if (state.pitchDetectionMode === "yin") startYinDetection();
        else startDetection();
      }
      break;

    case "set_pitch_detection":
      state.pitchDetectionMode = param; // "fft" | "yin"
      saveState();
      break;

    case "toggle_midi":
      if (state.midiEnabled) stopMidi();
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
      state.practiceLen = parseInt(param);
      saveState();
      break;

    // ── Drill ──
    case "start_drill": {
      var chords = [];
      if (param === "level") {
        chords = chordsForLevel(state.level).map(function(c) { return c.short; });
        if (chords.length < 2) chords = chordsUpToLevel(state.level).map(function(c) { return c.short; });
      } else if (param === "all") {
        chords = chordsUpToLevel(state.level).filter(function(c) { return (state.chordProg[c.short] || 0) > 0; }).map(function(c) { return c.short; });
        if (chords.length < 3) chords = chordsUpToLevel(state.level).slice(0, 6).map(function(c) { return c.short; });
      } else if (param === "random") {
        var all = chordsUpToLevel(state.level).map(function(c) { return c.short; });
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
      state.drillChords = chords;
      state.drillIdx = 0;
      state.drillTimer = 30;
      state.drillActive = true;
      playSound("start");
      if (T.drill) clearInterval(T.drill);
      T.drill = setInterval(tickDrill, 1000);
      break;
    }

    case "drill_custom": {
      var set = state.customSets[parseInt(param)];
      if (set) {
        state.tab = "games";
        state.drillChords = set.chords.slice();
        state.drillIdx = 0;
        state.drillTimer = 30;
        state.drillActive = true;
        playSound("start");
        if (T.drill) clearInterval(T.drill);
        T.drill = setInterval(tickDrill, 1000);
      }
      break;
    }

    case "drill_next":
      state.drillIdx++;
      if (state.drillIdx >= state.drillChords.length) state.drillIdx = 0;
      playChordByName(state.drillChords[state.drillIdx]);
      checkReward("drill_chord");
      break;

    case "stop_drill":
      if (T.drill) { clearInterval(T.drill); T.drill = null; }
      state.drillActive = false;
      break;

    // ── Daily ──
    case "start_daily": {
      var dt = DAILY_TYPES.find(function(d) { return d.id === param; });
      if (!dt) break;
      state.dailyType = param;
      state.dailyTimer = dt.dur;
      state.dailyActive = true;
      state.dailyScore = 0;
      var dPool = chordsUpToLevel(state.level).map(function(c) { return c.short; });
      state.chord = dPool[Math.floor(Math.random() * dPool.length)];
      playSound("start");
      if (T.daily) clearInterval(T.daily);
      T.daily = setInterval(tickDaily, 1000);
      break;
    }

    case "daily_action": {
      state.dailyScore++;
      var daPool = chordsUpToLevel(state.level).map(function(c) { return c.short; });
      state.chord = daPool[Math.floor(Math.random() * daPool.length)];
      playSound("tick");
      checkReward("daily_action");
      break;
    }

    case "stop_daily":
      if (T.daily) { clearInterval(T.daily); T.daily = null; }
      state.dailyActive = false;
      break;

    // ── Quiz ──
    case "start_quiz":
      state.quizQ = genQuiz();
      state.quizAns = null;
      break;

    case "quiz_answer":
      if (state.quizAns) break;
      state.quizAns = param;
      state.quizTotal = (state.quizTotal || 0) + 1;
      if (param === state.quizQ.answer) {
        state.quizCorrect++;
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
      state.quizQ = genQuiz();
      state.quizAns = null;
      break;

    // ── Ear training ──
    case "start_ear": {
      var ePool = chordsUpToLevel(Math.min(state.level + 1, 8));
      var ec = ePool[Math.floor(Math.random() * ePool.length)];
      state.earChord = ec.short;
      state.earRevealed = false;
      playChord(ec);
      break;
    }

    case "ear_play":
      if (state.earChord) playChordByName(state.earChord);
      break;

    case "ear_guess":
      state.earRevealed = true;
      if (param === state.earChord) {
        addXP(10);
        playSound("complete");
        checkReward("ear_correct");
      } else {
        playSound("wrong");
      }
      break;

    case "next_ear": {
      var nePool = chordsUpToLevel(Math.min(state.level + 1, 8));
      var nec = nePool[Math.floor(Math.random() * nePool.length)];
      state.earChord = nec.short;
      state.earRevealed = false;
      playChord(nec);
      break;
    }

    // ── Styles ──
    case "select_style":
      state.styleIdx = parseInt(param);
      break;

    case "play_style": {
      var ps = PLAY_STYLES[state.styleIdx];
      if (!ps) break;
      var demoChord = findChord("C");
      if (demoChord) playChord(demoChord, ps.id);
      break;
    }

    case "start_metronome":
      startMetronome(state.adaptiveBpm || state.bpm);
      break;

    case "stop_metronome":
      stopMetronome();
      break;

    // ── Songs ──
    case "song_sort":
      if (state.songSort === param) { state.songSortAsc = !state.songSortAsc; }
      else { state.songSort = param; state.songSortAsc = true; }
      break;
    case "song_filter":
      state.songFilter = param || "";
      break;
    case "select_song":
      state.songIdx = parseInt(param);
      state.songChordIdx = 0;
      state.songPlaying = false;
      state.bpm = SONGS[parseInt(param)].bpm;
      if (typeof window.openSongSessionRequest === "function" && SONGS[state.songIdx]) {
        window.openSongSessionRequest({
          songData: SONGS[state.songIdx],
          source: "builtin",
          songBeat: 0
        });
      }
      break;

    case "play_song":
      if (state.songPlaying) {
        state.songPlaying = false;
        if (typeof window.syncSongRuntimeRequest === "function" && SONGS[state.songIdx]) {
          window.syncSongRuntimeRequest("pause", {
            songData: SONGS[state.songIdx],
            source: "builtin",
            songBeat: state.songChordIdx
          });
        }
        if (T.song) { clearInterval(T.song); T.song = null; }
        stopMetronome();
        if (typeof stopMidiBacking === "function") stopMidiBacking();
      } else {
        state.songPlaying = true;
        var song = SONGS[state.songIdx];
        if (song) {
          if (typeof window.syncSongRuntimeRequest === "function") {
            window.syncSongRuntimeRequest("play", {
              songData: song,
              source: "builtin",
              songBeat: state.songChordIdx
            });
          }
          var interval = (60000 / state.bpm) * 2;
          playChordByName(song.progression[0], song.style || "block");
          T.song = setInterval(songTick, interval);
          startMetronome(state.bpm);
          // Play MIDI backing track if available
          if (song.midi && typeof loadMidiBacking === "function") {
            loadMidiBacking(song.midi).then(function() {
              if (state.songPlaying) playMidiBacking(0, 1);
            }).catch(function() {});
          }
        }
      }
      break;

    case "song_back":
      if (typeof window.applySongNavigationRequest === "function") {
        window.applySongNavigationRequest("songs_home");
      }
      state.songIdx = null;
      state.songPlaying = false;
      if (T.song) { clearInterval(T.song); T.song = null; }
      stopMetronome();
      break;

    // ── Stems ──
    case "stemOpenFile":
      if (!window.electron) break;
      state.stemError = null; render();
      window.electron.stems.openFile().then(function(result) {
        if (!result) return;
        state.stemFile = result; state.stemStatus = "idle"; render();
        window.electron.stems.checkCache(result.filePath).then(function(cached) {
          if (cached) {
            state.stemPaths = cached;
            _loadStemFileUrls(cached);
          } else {
            act("stemSeparate");
          }
        });
      });
      break;
    case "stemSeparate":
      if (!window.electron || !state.stemFile) break;
      state.stemStatus = "separating"; state.stemProgress = 0; state.stemError = null; render();
      var removeProgress = window.electron.stems.onProgress(function(data) {
        var match = data.line.match(/(\d+)%/);
        if (match) { state.stemProgress = parseInt(match[1]); render(); }
      });
      window.electron.stems.separate(state.stemFile.filePath).then(function(result) {
        removeProgress();
        state.stemPaths = result.stemPaths;
        _loadStemFileUrls(result.stemPaths);
        render();
      }).catch(function(err) {
        removeProgress();
        state.stemStatus = "error"; state.stemError = err.message; render();
      });
      break;
    case "stemCancel":
      if (window.electron) window.electron.stems.cancel();
      state.stemStatus = "idle"; state.stemProgress = 0; render();
      break;
    case "stemOpen":
      openPianoStemPlayer(state);
      break;
    case "stemBack":
      closePianoStemPlayer(state);
      break;
    case "stemToggle":
      state.stemToggles[param] = !state.stemToggles[param];
      setStemMuted(param, !state.stemToggles[param]);
      break;
    case "stemSolo":
      for (var sk in state.stemToggles) state.stemToggles[sk] = (sk === param);
      for (var sk2 in state.stemToggles) setStemMuted(sk2, !state.stemToggles[sk2]);
      break;
    case "stemAll":
      for (var sk3 in state.stemToggles) { state.stemToggles[sk3] = true; setStemMuted(sk3, false); }
      break;
    case "stemPlay":
      if (state.stemPlaying) pauseStems(); else playStems();
      break;
    case "stemSeek":
      seekStems(parseFloat(param)); break;
    case "stemVolume":
      state.stemVolume = parseFloat(param); setStemVolume(state.stemVolume); break;

    // ── Practice Plan ──
    case "openPlan":
      openPianoPracticePlan(state);
      break;
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
            difficultyId: state.performDifficulty || "normal"
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
            difficultyId: state.performDifficulty || "normal"
          });
          if (corePlan && corePlan.context && corePlan.context.performanceSong) {
            syncPianoPerformanceSongFromCore(corePlan);
            break;
          }
        }
        state.performSongData = song;
        state.performSongId = normalizeSongId(song);
        state.performArrangementType = "block_chords";
        state.screen = SCR.PERFORM_SONG;
      }
      break;
    }
    case "performDifficulty":
      applyPerformanceDifficultyToState(param || "normal");
      if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
        window.sparkCore.syncPerformanceRuntimeState("configure", {
          difficulty: state.performDifficulty
        });
      }
      saveState();
      break;
    case "performArrangement":
      state.performArrangementType = param || "block_chords";
      if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
        window.sparkCore.syncPerformanceRuntimeState("configure", {
          arrangementType: state.performArrangementType
        });
      }
      saveState();
      break;
    case "importSongAudio":
      if(!window.electron||!window.electron.stems){showToast("Song audio import is only available in the desktop build.");break;}
      var importSongId=param;
      window.electron.stems.openFile().then(function(result){
        if(!result)return;
        state.songAudioImporting=true;
        state.songAudioProgress=0;
        render();

        var unsubProgress=window.electron.stems.onProgress(function(data){
          if(data&&data.progress!=null){state.songAudioProgress=Math.round(data.progress);render();}
        });

        window.electron.stems.checkCache(result.filePath).then(function(cached){
          if(cached) return cached;
          return window.electron.stems.separate(result.filePath);
        }).then(function(stemPaths){
          unsubProgress();
          if(!stemPaths){state.songAudioImporting=false;render();return;}
          var stemNames=Object.keys(stemPaths);
          var urlMap={};
          function loadNext(idx){
            if(idx>=stemNames.length){
              state.songAudioData[importSongId]={
                mp3Path:result.filePath,
                detectedBpm:null,
                stemPaths:stemPaths,
                stemUrls:urlMap,
                importedAt:new Date().toISOString()
              };
              state.songAudioImporting=false;
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
          state.songAudioImporting=false;
          showToast("Stem separation failed: " + (err.message || err));
          render();
        });
      });
      break;
    case "removeSongAudio":
      delete state.songAudioData[param];
      saveState();render();
      break;
    case "performStart": {
      var chart = buildPerformanceChartFromSong(state.performSongData, "builtin", state.performArrangementType);
      var startRequest = typeof window.startSelectedPerformanceSongRequest === "function"
        ? window.startSelectedPerformanceSongRequest({
            chart: chart,
            chartId: chart && chart.id ? chart.id : null,
            songTitle: state.performSongData && state.performSongData.title ? state.performSongData.title : null,
            difficulty: state.performDifficulty,
            arrangementType: state.performArrangementType,
            speed: state.performSpeed || 1,
            preset: state.performPracticePreset || null,
            mode: state.performMode || "midi",
            countIn: !!state.performCountIn
          })
        : null;
      startPerformance(chart, {
        difficulty:startRequest && startRequest.difficulty ? startRequest.difficulty : state.performDifficulty,
        speed:startRequest && startRequest.speed ? startRequest.speed : (state.performSpeed || 1),
        preset:startRequest ? startRequest.preset : (state.performPracticePreset || null),
        mode:startRequest && startRequest.mode ? startRequest.mode : (state.performMode || "midi")
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
      if(state.performSongData){
        var chart = buildPerformanceChartFromSong(state.performSongData, "builtin", state.performArrangementType);
        var retryRequest = typeof window.getPerformanceRetryRequest === "function"
          ? window.getPerformanceRetryRequest({
              chart: chart,
              chartId: chart && chart.id ? chart.id : null,
              difficulty: state.performDifficulty,
              arrangementType: state.performArrangementType,
              speed: state.performSpeed || 1,
              mode: state.performMode || "midi",
              preset: state.performPracticePreset || null
            })
          : null;
        startPerformance(chart, {
          difficulty:retryRequest && retryRequest.difficulty ? retryRequest.difficulty : state.performDifficulty,
          speed:retryRequest && retryRequest.speed ? retryRequest.speed : (state.performSpeed || 1),
          preset:retryRequest ? retryRequest.preset : (state.performPracticePreset || null),
          mode:retryRequest && retryRequest.mode ? retryRequest.mode : (state.performMode || "midi")
        });
      }
      return;
    case "stopPerform":
      stopPerformance();
      if (typeof window.applyPerformanceNavigationRequest === "function") {
        window.applyPerformanceNavigationRequest("songs_home");
      }
      state.screen = SCR.HOME;
      state.tab = TAB.SONGS;
      render();
      return;

    // ── Rhythm ──
    case "start_rhythm":
      state.rhythmActive = true;
      state.rhythmScore = 0;
      state.rhythmCombo = 0;
      state.rhythmBeat = 0;
      state._rhythmStart = performance.now();
      state._rhythmInterval = 60000 / state.bpm;
      if (T.rhythm) clearInterval(T.rhythm);
      T.rhythm = setInterval(rhythmTick, state._rhythmInterval);
      startMetronome(state.bpm);
      break;

    case "rhythm_hit": {
      var elapsed = performance.now() - state._rhythmStart;
      var beatInterval = state._rhythmInterval;
      var beatPhase = (elapsed % beatInterval) / beatInterval;
      var accuracy = Math.min(beatPhase, 1 - beatPhase);
      if (accuracy < 0.15) {
        state.rhythmScore += 10 * (state.rhythmCombo + 1);
        state.rhythmCombo++;
        playSound("tick");
      } else if (accuracy < 0.3) {
        state.rhythmScore += 5;
        state.rhythmCombo = 0;
      } else {
        state.rhythmCombo = 0;
        playSound("wrong");
      }
      break;
    }

    case "stop_rhythm":
      state.rhythmActive = false;
      if (T.rhythm) { clearInterval(T.rhythm); T.rhythm = null; }
      stopMetronome();
      addXP(Math.floor(state.rhythmScore / 10));
      addHistory("rhythm", { score: state.rhythmScore });
      break;

    // ── Runner ──
    case "start_runner":
      state.runnerActive = true;
      state.runnerScore = 0;
      spawnRunnerTarget();
      if (T.runner) clearInterval(T.runner);
      T.runner = setInterval(function() {
        state.runnerScore = Math.max(0, state.runnerScore - 1);
        spawnRunnerTarget();
        render();
      }, 4000);
      break;

    case "runner_pick":
      if (param === state.runnerTarget) {
        state.runnerScore += 10;
        playSound("tick");
        addXP(2);
        checkReward("runner_correct");
      } else {
        state.runnerScore = Math.max(0, state.runnerScore - 5);
        playSound("wrong");
      }
      spawnRunnerTarget();
      break;

    case "stop_runner":
      state.runnerActive = false;
      if (T.runner) { clearInterval(T.runner); T.runner = null; }
      addHistory("runner", { score: state.runnerScore });
      break;

    // ── Build ──
    case "build_add":
      state.buildChords.push(param);
      break;

    case "build_remove":
      state.buildChords.splice(parseInt(param), 1);
      break;

    case "build_clear":
      state.buildChords = [];
      state.buildPlaying = false;
      if (T.build) { clearInterval(T.build); T.build = null; }
      break;

    case "build_play":
      if (state.buildPlaying) {
        state.buildPlaying = false;
        if (T.build) { clearInterval(T.build); T.build = null; }
        buildIdx = 0;
      } else {
        state.buildPlaying = true;
        buildIdx = 0;
        buildTick();
        T.build = setInterval(buildTick, (60000 / state.bpm) * 2);
      }
      break;

    // ── Custom sets ──
    case "new_custom":
      state.customSetEditorOpen = true;
      state.customSetDraftName = state.customSetDraftName || "";
      state.customSetDraftChords = state.customSetDraftChords || "";
      break;

    case "set_custom_name":
      state.customSetDraftName = String(param || "").slice(0, 50);
      break;

    case "set_custom_chords":
      state.customSetDraftChords = String(param || "");
      break;

    case "save_custom": {
      var name = String(state.customSetDraftName || "").trim();
      var chordStr = String(state.customSetDraftChords || "");
      var parsed = chordStr.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
      var valid = parsed.filter(function(c) { return findChord(c); });
      var invalid = parsed.filter(function(c) { return !findChord(c); });
      if (!name) {
        showToast("Add a set name first.");
        break;
      }
      if (valid.length < 2) {
        showToast("Need at least 2 valid chords." + (invalid.length ? " Unknown: " + invalid.join(", ") : ""));
        break;
      }
      if (invalid.length) showToast("Skipped unknown: " + invalid.join(", "));
      state.customSets.push({ name: name, chords: valid });
      state.customSetEditorOpen = false;
      state.customSetDraftName = "";
      state.customSetDraftChords = "";
      saveState();
      break;
    }

    case "cancel_custom":
      state.customSetEditorOpen = false;
      state.customSetDraftName = "";
      state.customSetDraftChords = "";
      saveState();
      break;

    case "del_custom":
      state.customSets.splice(parseInt(param), 1);
      saveState();
      break;

    // ── Settings ──
    case "set_bpm":
      state.bpm = Math.max(40, Math.min(200, parseInt(param) || 72));
      break;

    case "set_volume":
      setVolume(parseInt(param) / 100);
      saveState();
      break;

    case "set_reverb":
      setReverb(parseInt(param) / 100);
      break;

    case "set_tone":
      state.tone = param;
      saveState();
      break;

    case "set_metronome_sound":
      state.metronomeSound = param; // "sine" | "woodblock" | "clap" | "hihat"
      saveState();
      break;

    case "set_a4_tuning":
      state.a4Tuning = Math.max(432, Math.min(446, parseInt(param)));
      saveState();
      break;

    case "set_goal":
      state.dailyGoal = parseInt(param);
      saveState();
      break;

    case "reset_confirm":
      state.confirmDialog = {
        title: "Reset all progress?",
        message: "This clears your saved Piano progress. You can undo once right after reset.",
        action: "reset",
        confirmLabel: "Reset Progress",
        cancelLabel: "Cancel"
      };
      render();
      break;

    case "cancel_confirm":
      state.confirmDialog = null;
      render();
      break;

    case "confirm_action":
      var pendingConfirm = state.confirmDialog;
      state.confirmDialog = null;
      if (pendingConfirm && pendingConfirm.action) {
        act(pendingConfirm.action, pendingConfirm.value);
      } else {
        render();
      }
      break;

    case "reset":
      resetProgress();
      break;

    case "undo_reset":
      undoReset();
      break;

    // ── Finger exercises ──
    case "complete_warmup":
      state.fingerWarmUpDone = true;
      completeFingerExercise(param || "P-OFF-1");
      break;

    case "skip_warmup":
      state.fingerWarmUpDone = true;
      break;

    case "complete_finger_exercise":
      completeFingerExercise(param);
      break;

    case "start_chord_change": {
      var parts = param.split(",");
      if (parts.length !== 2) break;
      state.chordChangePair = parts;
      state.chordChangeCount = 0;
      state.chordChangeTimer = 60;
      state.chordChangeActive = true;
      playSound("start");
      if (T.chordChange) clearInterval(T.chordChange);
      T.chordChange = setInterval(tickChordChange, 1000);
      break;
    }

    case "chord_change_tap":
      if (!state.chordChangeActive) break;
      state.chordChangeCount++;
      playSound("tick");
      break;

    case "stop_chord_change":
      finishChordChange();
      break;

    // ── MIDI Device/Profile actions ──
    case "setMidiDevice":
      state.activeMidiDeviceId = param;
      syncPianoMidiSettingsState();
      saveState();
      break;

    case "setMidiProfile":
      if(typeof setActiveMidiProfile === "function") setActiveMidiProfile(param);
      else showToast("MIDI profiles aren't available right now.");
      syncPianoMidiSettingsState();
      break;

    case "createDefaultPianoProfile":
      if(typeof createDefaultPianoProfile === "function") createDefaultPianoProfile();
      else showToast("Piano MIDI profiles aren't available right now.");
      syncPianoMidiSettingsState();
      break;

    case "createDefaultGuitarProfile":
      if(typeof createDefaultGuitarProfile === "function") createDefaultGuitarProfile();
      else showToast("Guitar MIDI profiles aren't available right now.");
      syncPianoMidiSettingsState();
      break;

    case "openMidiSettings":
      openPianoUtilityScreen(state, "midi_settings", SCR.MIDI_SETTINGS, syncPianoMidiSettingsState);
      break;

    case "openMidiImport":
      openPianoUtilityScreen(state, "midi_import", SCR.MIDI_IMPORT, syncPianoMidiImportState);
      break;

    // ── MIDI Import actions ──
    case "importMidiFile":
      if(typeof handleMidiImport === "function") handleMidiImport(param);
      else showToast("MIDI import isn't available right now.");
      return;

    case "assignMidiTrack": {
      var atParts = String(param).split("|");
      if(typeof setMidiTrackAssignment === "function") setMidiTrackAssignment(atParts[0], atParts[1]);
      else showToast("MIDI track assignment isn't available right now.");
      syncPianoMidiImportState();
      break;
    }

    case "buildMidiSeedChart": {
      if (typeof buildSeedChartFromImportedMidi !== "function") {
        showToast("MIDI seed chart building isn't available right now.");
        return;
      }
      var seedChart = buildSeedChartFromImportedMidi(state.importedMidi, state.importedMidiAssignments, param);
      state.importedMidiSeedPreview = seedChart;
      syncPianoMidiImportState({ seedMode: param, seedChart: seedChart });
      if(seedChart && typeof openEditor === "function"){
        openEditor("chart", seedChart);
        render();
      } else {
        showToast("No usable seed chart could be built from that MIDI import.");
        render();
      }
      break;
    }

    // ── Cloud Sync actions ──
    case "cloudSync":
      var syncUnavailableError;
      state.cloudLastError = null;
      applyPianoCloudWorkflow("sync_start", { lastSyncStatus: "syncing", lastError: null });
      if(typeof syncSparkNow === "function") {
        syncSparkNow();
        return;
      }
      syncUnavailableError = "Cloud sync is unavailable right now.";
      state.cloudLastError = syncUnavailableError;
      applyPianoCloudWorkflow("sync_error", { lastSyncStatus: "error", lastError: syncUnavailableError });
      render();
      return;

    case "cloudPull":
      var pullUnavailableError;
      state.cloudLastError = null;
      applyPianoCloudWorkflow("pull_start", { lastSyncStatus: "syncing", lastError: null });
      if(typeof pullSparkCloud === "function") {
        pullSparkCloud();
        return;
      }
      pullUnavailableError = "Cloud pull is unavailable right now.";
      state.cloudLastError = pullUnavailableError;
      applyPianoCloudWorkflow("pull_error", { lastSyncStatus: "error", lastError: pullUnavailableError });
      render();
      return;

    case "cloudLogout":
      state.cloudLastError = null;
      if(typeof logoutSpark === "function") logoutSpark();
      else showToast("Cloud logout is unavailable right now.");
      applyPianoCloudWorkflow("logout", { lastError: null });
      render();
      return;

    case "cloudEmailDraft":
      state.cloudEmailDraft = String(v == null ? "" : v);
      state.cloudLastError = null;
      render();
      return;

    case "cloudPasswordDraft":
      state.cloudPasswordDraft = String(v == null ? "" : v);
      state.cloudLastError = null;
      render();
      return;

    case "cloudLoginPrompt": {
      var clEmail = String(state.cloudEmailDraft || ((state.cloudAuth && state.cloudAuth.email) || "") || "").trim();
      var clPassword = String(state.cloudPasswordDraft || "");
      var clError;
      if(!clEmail || !clPassword){
        showToast("Enter both email and password to log in.");
        return;
      }
      state.cloudLastError = null;
      if(typeof loginSpark !== "function"){
        clError = "Cloud login is unavailable right now.";
        state.cloudLastError = clError;
        applyPianoCloudWorkflow("login_error", { lastSyncStatus: "error", lastError: clError });
        render();
        return;
      }
      loginSpark(clEmail, clPassword).then(function(){
        state.cloudEmailDraft = clEmail;
        state.cloudPasswordDraft = "";
        state.cloudLastError = null;
        applyPianoCloudWorkflow("login", { lastError: null });
        render();
      }).catch(function(err){
        clError = String((err && err.message) || err || "Cloud login failed.");
        state.cloudLastError = clError;
        applyPianoCloudWorkflow("login_error", { lastSyncStatus: "error", lastError: clError });
        render();
      });
      return;
    }

    case "openCloudSettings":
      openPianoUtilityScreen(state, "cloud_settings", SCR.CLOUD_SETTINGS, function() {
        applyPianoCloudWorkflow("open");
      });
      break;

    case "openCurriculum":
        openPianoUtilityScreen(state, "curriculum", SCR.CURRICULUM, syncCurriculumStateRequest);
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
        if(typeof generateRecommendations === "function") generateRecommendations();
        openPianoDashboardScreen(state, "recommendations", SCR.RECOMMENDATIONS);
        break;
    case "launchRecommendation":
      if(typeof launchRecommendationById === "function") launchRecommendationById(param);
      else showToast("Recommendations aren't available right now.");
      return;
    case "launchAnalyticsRecommendation":
      var pianoAnalyticsSummary = typeof buildAnalyticsSummary === "function" ? buildAnalyticsSummary() : null;
      var pianoAnalyticsIndex = parseInt(param, 10);
      var pianoAnalyticsItems = pianoAnalyticsSummary && Array.isArray(pianoAnalyticsSummary.recommendations) ? pianoAnalyticsSummary.recommendations : [];
      if(pianoAnalyticsIndex >= 0 && pianoAnalyticsIndex < pianoAnalyticsItems.length && typeof launchPracticeItem === "function"){
        if(!launchPracticeItem(pianoAnalyticsItems[pianoAnalyticsIndex])) showToast("That practice item couldn't be started right now.");
      }
      return;

    // ── Career mode ──
    case "openCareer":
        openPianoDashboardScreen(state, "career", SCR.CAREER);
        break;
    case "openCareerSong":
      if(typeof getCareerItem === "function"){
        var cSong = getCareerItem("songs", param);
        if(cSong && typeof window.openCareerSongSelectionRequest === "function"){
          window.openCareerSongSelectionRequest({
            songId: param,
            songData: cSong,
            songTitle: cSong.title || null,
            arrangementType: state.performArrangementType || "block_chords",
            difficultyId: state.performDifficulty || "normal"
          });
        }
        if(cSong){
          state.performSongData = cSong;
          state.performSongId = param;
          state.screen = SCR.PERFORM_SONG;
        } else {
          showToast("This career song isn't available yet.");
        }
      } else {
        showToast("This career song isn't available yet.");
      }
      break;

    // ── Insights ──
    case "openInsights":
        if((!state.personalInsights || !state.lastInsightRun) && typeof generatePersonalInsights === "function") generatePersonalInsights();
        openPianoDashboardScreen(state, "insights", SCR.INSIGHTS);
        break;

    // ── Challenge hub ──
    case "openChallengeHub":
        if((state.activeChallenges || []).length === 0 && typeof initializeChallengesForCurrentCycle === "function") initializeChallengesForCurrentCycle();
        openPianoDashboardScreen(state, "challenges", SCR.CHALLENGES);
        break;
    case "claimChallengeReward":
      var pianoClaimedReward = false;
      if(typeof claimChallengeReward === "function") {
        claimChallengeReward(param);
        pianoClaimedReward = true;
      }
      if (typeof applyDashboardChallengeRewardRequest === "function" && applyDashboardChallengeRewardRequest(param) !== null) {
        pianoClaimedReward = true;
      }
      if(!pianoClaimedReward) showToast("Challenge rewards aren't available right now.");
      break;

    // ── Home dashboard ──
    case "openHome":
    case "openHomeDash":
      if((state.activeChallenges || []).length === 0 && typeof initializeChallengesForCurrentCycle === "function") initializeChallengesForCurrentCycle();
      if((!state.personalInsights || !state.lastInsightRun) && typeof generatePersonalInsights === "function") generatePersonalInsights();
      openPianoHomeDashboard(state);
      break;
    case "refreshHome":
      if(typeof generateRecommendations === "function") generateRecommendations();
      if(typeof generatePersonalInsights === "function") generatePersonalInsights();
      if(typeof initializeChallengesForCurrentCycle === "function") initializeChallengesForCurrentCycle();
      if (typeof refreshDashboardSnapshotRequest === "function") {
        refreshDashboardSnapshotRequest({
          recommendations: state.recommendations || [],
          insights: state.personalInsights || null,
          challenges: state.activeChallenges || [],
          refreshedAt: Date.now()
        });
      }
      break;
    case "initChallenges":
      if(typeof initializeChallengesForCurrentCycle === "function") initializeChallengesForCurrentCycle();
      if (typeof initializeDashboardChallengesRequest === "function") {
        initializeDashboardChallengesRequest({
          recommendations: state.recommendations || [],
          insights: state.personalInsights || null,
          challenges: state.activeChallenges || [],
          refreshedAt: Date.now()
        });
      }
      break;

    // ── Practice plan ──
    case "openPracticePlan":
      openPianoPracticePlan(state);
      break;

    // ── Onboarding flow ──
    case "openOnboarding":
      if(typeof startOnboarding === "function") startOnboarding();
      else showToast("Onboarding isn't available right now.");
      return;
    case "resumeOnboarding":
      if(typeof continueOnboarding === "function") continueOnboarding();
      else showToast("Onboarding isn't available right now.");
      return;

    // ── Settings ──
    case "openSettings":
        openPianoUtilityScreen(state, "settings", SCR.SETTINGS);
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
function legacyPianoRender() {
  var root = document.getElementById("app");
  if (!root) return;
  var state = pianoAppState();
  if (!state) return;
  var bodyHtml = null;
  var shellPageRenderers = {};
  var backPageRenderers = {};

  // Onboarding check
  if (!state.onboardingComplete) {
    if (state._inPlacement) {
      setPianoRootHTML(root, placementTestPage());
    } else {
      setPianoRootHTML(root, (typeof pianoOnboardingPage === "function" ? pianoOnboardingPage() : ""));
    }
    return;
  }

  // Session/performance screens that keep the standard shell without an extra back button.
  if (state.screen === SCR.SESSION && !state.sessionPlan) {
    // fall through to legacy home render if the session payload is missing
  } else {
    shellPageRenderers[SCR.SESSION] = typeof pianoSessionPage === "function" ? pianoSessionPage : null;
  }
  shellPageRenderers[SCR.STEM_PLAYER] = typeof pianoStemsPlayerPage === "function" ? pianoStemsPlayerPage : null;
  shellPageRenderers[SCR.PLAN] = typeof pianoPlanPage === "function" ? pianoPlanPage : null;
  shellPageRenderers[SCR.PERFORM_SONG] = typeof pianoPerformSongPage === "function" ? pianoPerformSongPage : null;
  shellPageRenderers[SCR.PERFORM] = typeof pianoPerformPage === "function" ? pianoPerformPage : null;
  shellPageRenderers[SCR.PERFORM_DONE] = typeof pianoPerformDonePage === "function" ? pianoPerformDonePage : null;
  if (shellPageRenderers[state.screen]) {
    renderPianoPageShell(root, shellPageRenderers[state.screen]());
    return;
  }

  // Calibration screen
  if (state.screen === SCR.CALIBRATION && typeof calibrationPage === "function") {
    renderPianoPageShell(root, calibrationPage(), { backButton: true, backButtonClass: true });
    return;
  }

  // Onboarding flow screen (new)
  if (state.screen === SCR.ONBOARDING_FLOW && typeof onboardingFlowPage === "function") {
    setPianoRootHTML(root, onboardingFlowPage());
    return;
  }

  shellPageRenderers[SCR.HOME_DASH] = typeof homeDashboardPage === "function" ? homeDashboardPage : null;
  if (shellPageRenderers[state.screen]) {
    renderPianoPageShell(root, shellPageRenderers[state.screen]());
    return;
  }

  backPageRenderers[SCR.MIDI_SETTINGS] = typeof midiSettingsPage === "function" ? midiSettingsPage : null;
  backPageRenderers[SCR.MIDI_IMPORT] = typeof midiImportPage === "function" ? midiImportPage : null;
  backPageRenderers[SCR.CLOUD_SETTINGS] = typeof cloudSettingsPage === "function" ? cloudSettingsPage : null;
  backPageRenderers[SCR.CURRICULUM] = typeof curriculumPage === "function" ? curriculumPage : null;
  backPageRenderers[SCR.RECOMMENDATIONS] = typeof recommendationsPage === "function" ? recommendationsPage : null;
  backPageRenderers[SCR.CAREER] = typeof careerPage === "function" ? careerPage : null;
  backPageRenderers[SCR.INSIGHTS] = typeof insightsDashboardPage === "function" ? insightsDashboardPage : null;
  backPageRenderers[SCR.CHALLENGES] = typeof challengeHubPage === "function" ? challengeHubPage : null;
  backPageRenderers[SCR.SETTINGS] = typeof settingsPage === "function" ? settingsPage : null;
  if (backPageRenderers[state.screen]) {
    bodyHtml = backPageRenderers[state.screen]();
    renderPianoPageShell(root, bodyHtml, { backButton: true });
    return;
  }

  // Legacy active session
  if (state.active && state.chord) {
    renderPianoPageShell(root, (typeof pianoTabNavHTML === "function" ? pianoTabNavHTML() : "") + legacySessionHTML());
    return;
  }

  // Home screen with tabs
  var html = (typeof pianoTabNavHTML === "function" ? pianoTabNavHTML() : "");
  html += '<main class="tab-content">';
  switch (state.tab) {
    case TAB.PRACTICE: html += typeof pianoPracticeTab === "function" ? pianoPracticeTab() : ""; break;
    case TAB.GAMES:    html += typeof pianoGamesTab === "function" ? pianoGamesTab() : ""; break;
    case TAB.SONGS:    html += typeof pianoSongsTab === "function" ? pianoSongsTab() : ""; break;
    case TAB.TOOLS:    html += typeof pianoToolsTab === "function" ? pianoToolsTab() : ""; break;
  }
  html += '</main>';
  renderPianoPageShell(root, html);
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
  var state = pianoAppState();
  if (!state) return;
  if (e.key === "Escape" && state.confirmDialog) {
    e.preventDefault();
    act("cancel_confirm");
    return;
  }

  switch (e.key) {
    case " ":
      e.preventDefault();
      // In perform mode: spacebar = simulate note hit for testing
      if (state.screen === SCR.PERFORM && state.performPlaying && state.performChart && !state.performPaused) {
        var nowSec = PerformanceTransport.now();
        var chart = state.performChart;
        for (var si = 0; si < chart.events.length; si++) {
          var evt = chart.events[si];
          if (evt._scored) continue;
          var delta = Math.abs(nowSec - evt.t) * 1000;
          if (delta < (state.performWindowMissMs || 220)) {
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
      if (state.active || state.screen === SCR.SESSION) act("pause");
      break;
    case "ArrowLeft":
      state.bpm = Math.max(40, state.bpm - 5);
      state.adaptiveBpm = Math.max(40, state.adaptiveBpm - 5);
      saveState(); render();
      break;
    case "ArrowRight":
      state.bpm = Math.min(200, state.bpm + 5);
      state.adaptiveBpm = Math.min(200, state.adaptiveBpm + 5);
      saveState(); render();
      break;
    case "m": case "M":
      if (metronomeInterval) stopMetronome();
      else startMetronome(state.adaptiveBpm || state.bpm);
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
