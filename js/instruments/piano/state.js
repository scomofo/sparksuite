/* ───────── PianoSpark – state.js ───────── */
/* Expanded: curriculum tracking, stickiness, onboarding, reward engine */

var PERSIST = [
  "xp","streak","lastPractice","sessions","chordProg",
  "earned","level","history","dailyGoal","dailyPracticed",
  "quizCorrect","drillsDone","dailiesDone","songsDone",
  "darkMode","volume","customSets","practiceLen","tone",
  // New curriculum fields
  "currentSession","lhLevel","keyboardSize","stylePrefs",
  "onboardingComplete","practiceIntention","transitionStats",
  "focusMode","adaptiveBpm","personalBests","completedSessions",
  // Reward engine persistent fields
  "rewardPhase","totalActions","jackpotsHit",
  "actionsSinceReward","nextRewardAt",
  // Finger exercise fields
  "fingerStats","fingerExercisesDone","fingerDaysLogged","fingerBadges",
  // Settings that were previously missing
  "bpm","quizTotal",
  // MIDI
  "midiEnabled",
  // Performance mode
  "performMode","performDifficulty","performArrangementType","performSpeed",
  "performanceStats","performanceHistory","performanceMastery",
  // Practice plan
  "practicePlan","practicePlanDate","practicePlanHistory",
  // Audio
  "reverbAmount","metronomeSound","a4Tuning","pitchDetectionMode",
  // Brain systems – weak spots, adaptive, progress, mastery, unlocks
  "weakSpots","practiceHistory","adaptiveState",
  "weeklyPracticePlan","practiceStreak","lastPracticeDate",
  "totalPracticeMinutes","todayPracticeMinutes",
  "mastery","unlocks",
  // Meta progression
  "playerXP","playerLevel","playerAchievements","playerStats","xpLog",
  // Content library
  "contentLibrary",
  // Meta progression – challenges, goals, skill tree
  "dailyChallenges","weeklyGoals","skillTree","metaProgress","challengeHistory",
  // Analytics visualization
  "analytics",
  // Audio latency calibration
  "audioLatencyMs","inputLatencyMs","calibrationOffsets",
  // MIDI device mapping + profiles
  "activeMidiDeviceId","midiProfiles","activeMidiProfileId","midiRoutingMode",
  // MIDI import
  "importedMidiAssignments",
  // Cloud sync + accounts
  "cloudAuth","cloudProfile","cloudSync",
  // Desktop info + feedback
  "desktopInfo","feedbackDraft",
  // Curriculum
  "completedCurriculumLessons",
  // Editor library (for cloud sync)
  "editorLibrary",
  // Recommendation engine
  "recommendationHistory","recommendationSettings",
  // Career mode
  "careerProgress","activeCareerId","activeCareerTier","activeCareerStage",
  // Insights / analytics dashboard
  "insightSnapshots","personalInsights",
  // Challenge system expansion
  "activeChallenges","seasonalEvents","activeEventId",
  "packCompletion","challengeRewards",
  // Onboarding flow
  "onboardingFlow","firstRun",
  // Settings / platform maturity
  "settings","profile","tutorialProgress","releaseInfo"
];

// Consolidated timer object (like ChordSpark's T)
var T = {
  session: null, drill: null, daily: null, song: null,
  metro: null, rhythm: null, runner: null, build: null,
  undo: null, reward: null, feedback: null, watch: null,
  shadow: null, sessionStep: null, prog: null,
  chordChange: null
};

var S = {
  // Navigation
  screen: SCR.HOME,
  tab: TAB.PRACTICE,

  // Progression
  xp: 0,
  streak: 0,
  lastPractice: null,
  sessions: 0,
  chordProg: {},   // { "C": 0..100, ... }
  earned: [],      // badge ids
  level: 1,
  history: [],     // [{ type, chord, ts, dur }]

  // Curriculum tracking (new)
  currentSession: 1,        // 1-50
  lhLevel: 1,               // 1-7 (rhythm level)
  completedSessions: [],     // [1,2,3,...] session nums
  transitionStats: {},       // { "C_F": { attempts:0, clean:0, avgMs:0 } }

  // Onboarding (new)
  onboardingComplete: false,
  onboardingStep: 0,        // 0-4 (5 screens)
  keyboardSize: 61,          // 88/76/61/49/25
  stylePrefs: [],            // ["Pop","Jazz",...]
  practiceIntention: "",     // "When I finish dinner, I will open PianoSpark"

  // Settings
  darkMode: false,
  volume: 0.7,
  practiceLen: 60,
  dailyGoal: 10,   // minutes
  dailyPracticed: 0, // seconds today
  bpm: 80,
  tone: "grand",
  metronomeSound: "sine",  // "sine" | "woodblock" | "clap" | "hihat"
  a4Tuning: 440,           // Hz, 432–446 range
  pitchDetectionMode: "fft", // "fft" | "yin"
  focusMode: false,
  midiEnabled: false,
  reverbAmount: 0.18,  // 0 = dry, 1 = fully wet

  // Adaptive difficulty (new)
  adaptiveBpm: 60,
  personalBests: { bpm:0, streak:0, sessionsInRow:0, longestSession:0 },

  // Reward engine state (new - stickiness #1 + #4)
  rewardPhase: 1,
  totalActions: 0,
  actionsSinceReward: 0,
  nextRewardAt: 1,          // randomized threshold
  jackpotPending: false,
  jackpotsHit: 0,
  surpriseQueue: [],

  // Guided session state (new)
  sessionStep: null,        // "spark"|"review"|"newMove"|"songSlice"|"victoryLap"
  newMovePhase: null,       // "watch"|"shadow"|"try"|"refine"
  sessionPlan: null,        // current SESSION_PLANS entry
  sessionTimer: 0,          // countdown for current step
  interleavedChords: [],    // older chords mixed into current session (stickiness #8)
  lastReviewChords: [],     // track what was reviewed recently

  // Delayed feedback (stickiness #5)
  feedbackDelay: false,
  feedbackTimer: null,
  feedbackMessage: "",

  // Finger exercise tracking
  fingerStats: {},          // { "P-OFF-1": { completions:0, lastDone:null, bestTrillSpeed:0 } }
  fingerExercisesDone: 0,   // total completions
  fingerDaysLogged: 0,      // days with at least one exercise
  fingerBadges: [],         // finger-specific badge ids
  fingerWarmUpDone: false,  // for current session
  chordChangeCount: 0,      // for 60-second challenge
  chordChangeTimer: 0,      // countdown
  chordChangeActive: false,
  chordChangePair: [],      // [chordA, chordB]

  // Legacy session state
  active: false,
  chord: null,
  timer: 0,
  paused: false,

  // Drill
  drillChords: [],
  drillIdx: 0,
  drillTimer: 0,
  drillActive: false,

  // Daily challenge
  dailyType: null,
  dailyTimer: 0,
  dailyActive: false,
  dailyScore: 0,
  dailiesDone: 0,

  // Quiz
  quizQ: null,
  quizAns: null,
  quizCorrect: 0,

  // Ear training
  earChord: null,
  earRevealed: false,

  // Songs
  songIdx: null,
  songPlaying: false,
  songChordIdx: 0,
  songSort: "level",
  songSortAsc: true,
  songFilter: "",
  // Stem Separation
  stemFile: null,
  stemStatus: "idle",
  stemProgress: 0,
  stemError: null,
  stemPaths: null,
  stemPlaying: false,
  stemVolume: 0.8,
  stemCurrentTime: 0,
  stemDuration: 0,
  stemToggles: { vocals:true, drums:true, bass:true, guitar:false, piano:false, other:false },
  // Song Audio Import
  songAudioData: {},
  songAudioImporting: false,
  songAudioProgress: 0,
  songAudioImportingSongId: null,

  // Play styles
  styleIdx: 0,

  // Rhythm game
  rhythmActive: false,
  rhythmScore: 0,
  rhythmCombo: 0,
  rhythmBeat: 0,

  // Runner game
  runnerActive: false,
  runnerScore: 0,
  runnerTarget: null,
  runnerLane: 1,

  // Build mode
  buildChords: [],
  buildPlaying: false,

  // Chord detection
  detecting: false,
  detectedNotes: [],

  // Custom practice sets
  customSets: [],

  // Stats
  drillsDone: 0,
  songsDone: [],
  quizTotal: 0,

  // Practice clips (session-only; object URLs don't survive reload)
  practiceClips: [],

  // Performance mode
  performMode:"midi",
  performDifficulty:"normal",
  performSongId:null,
  performSongData:null,
  performArrangementType:"block_chords",
  performChartId:null,
  performChart:null,
  performPlaying:false,
  performPaused:false,
  performCurrentSec:0,
  performSpeed:1.0,
  performScrollSpeed:180,
  performScore:0,
  performCombo:0,
  performMaxCombo:0,
  performAccuracy:0,
  performPhraseIdx:0,
  performPhraseStats:[],
  performResults:null,
  performStarRating:0,
  performInputNotes:[],
  performInputMidi:[],
  performLoop:null,
  performWindowPerfectMs:70,
  performWindowGoodMs:140,
  performWindowMissMs:220,
  performanceStats:{},
  performanceHistory:[],
  performanceLastSummary:null,
  performanceMode:null,
  performanceResult:null,
  performancePhraseStats:{},
  performanceRetryTarget:null,
  performanceCurrentPhrase:null,
  performanceMastery:{
    songs:{},
    phrases:{},
    leftHand:{},
    melody:{}
  },

  // Practice plan
  practicePlan:null,
  practicePlanDate:null,
  practicePlanComplete:false,
  practicePlanHistory:[],
  practicePlanFocus:"",

  // Brain systems – weak spots, adaptive difficulty, progress tracking
  weakSpots: { transitions:{}, chords:{}, rhythm:{}, phrases:{} },
  adaptiveState: {},
  practiceHistory: [],
  weeklyPracticePlan: null,
  practiceStreak: 0,
  lastPracticeDate: null,
  totalPracticeMinutes: 0,
  todayPracticeMinutes: 0,

  // Meta progression
  playerXP: 0,
  playerLevel: 1,
  playerAchievements: {},
  playerStats: {
    songsCompleted:0,
    lessonsCompleted:0,
    exercisesCompleted:0,
    totalPracticeMinutes:0,
    streakBest:0
  },
  xpLog: [],
  contentLibrary: {
    rhythmPatterns:[],
    lhPatterns:[],
    chordProgressions:[],
    exercises:[]
  },

  // Meta progression – challenges, goals, skill tree
  dailyChallenges: [],
  weeklyGoals: [],
  skillTree: {},
  metaProgress: {
    challengesCompleted:0,
    goalsCompleted:0,
    skillPoints:0
  },
  challengeHistory: [],

  // Analytics visualization
  analytics: {
    performanceHistory: [],
    practiceHistory: [],
    accuracyHistory: [],
    masteryHistory: [],
    xpHistory: [],
    streakHistory: []
  },

  // Audio latency calibration
  audioLatencyMs: 0,
  inputLatencyMs: 0,
  calibrationOffsets: [],
  lastClickTime: 0,
  timingWindows: {
    perfect: 40,
    good: 90,
    ok: 150
  },

  // Mastery & progression
  mastery: {
    chords:{}, transitions:{}, rhythm:{},
    scales:{}, fingers:{}, songs:{}, lessons:{}
  },
  unlocks: { lessons:{}, songs:{}, exercises:{} },
  progressionTree: null,

  // MIDI device mapping + profiles (Phase 1)
  midiDevices: [],
  activeMidiDeviceId: null,
  midiProfiles: {},
  activeMidiProfileId: null,
  midiRoutingMode: "default", // default | guitar | piano | custom

  // MIDI import (Phase 2)
  importedMidi: null,
  importedMidiTracks: [],
  importedMidiAssignments: {},
  importedMidiSeedPreview: null,

  // Cloud sync + accounts (Phase 5)
  cloudAuth: {
    userId: null,
    email: null,
    token: null,
    loggedIn: false
  },
  cloudProfile: {
    displayName: "",
    createdAt: null,
    updatedAt: null
  },
  cloudSync: {
    lastSyncAt: null,
    lastSyncStatus: "idle", // idle | syncing | ok | error
    dirtyKeys: [],
    syncEnabled: true
  },

  // Desktop info (Phase 3/4/6)
  desktopInfo: {
    channel: "dev",       // dev | beta | stable
    version: "dev",
    buildNumber: 0,
    lastUpdateCheckAt: null,
    updateStatus: "idle", // idle | checking | available | none | error
    lastBackupAt: null
  },
  feedbackDraft: {
    text: "",
    email: ""
  },
  releaseInfo: null,
  releaseNotes: [],

  // Curriculum (Phase 7)
  completedCurriculumLessons: [],
  editorLibrary: [],

  // Recommendation engine (Phase 8)
  recommendations: [],
  lastRecommendationRun: null,
  recommendationHistory: [],
  recommendationSettings: {
    preferWeakSpots: true,
    preferCurriculum: true,
    preferVariety: true,
    maxSuggestions: 5
  },

  // Career mode (Phase 9)
  careerProgress: {
    unlockedTiers: {},
    unlockedStages: {},
    unlockedSongs: {},
    songRatings: {},
    stageCompletion: {},
    tierCompletion: {}
  },
  activeCareerId: "career_main",
  activeCareerTier: null,
  activeCareerStage: null,

  // Insights / analytics dashboard (Phase 10)
  insightSnapshots: [],
  personalInsights: {
    weakestSkills: [],
    strongestSkills: [],
    masteryTrend: {},
    practiceTrend: {},
    recommendationQuality: {},
    careerTrend: {},
    packProgress: {}
  },
  lastInsightRun: null,

  // Challenge system expansion (Phase 11)
  activeChallenges: [],
  seasonalEvents: [],
  activeEventId: null,
  packCompletion: {
    lessons: {},
    songs: {},
    drills: {},
    packs: {}
  },
  challengeRewards: {
    claimed: {},
    eventClaimed: {},
    packClaimed: {}
  },

  // Onboarding flow (Phase 14)
  onboardingFlow: {
    completed: false,
    startedAt: null,
    completedAt: null,
    currentStep: "welcome",
    instrument: "piano",
    skillLevel: null,
    goals: [],
    midiSetupDone: false,
    calibrationDone: false,
    starterContentUnlocked: false
  },
  firstRun: true,

  // Settings / platform maturity (Phase 13)
  settings: {
    audioLatencyMs: 0,
    metronomeVolume: 0.6,
    noteSpeed: 1.0,
    difficultyAutoAdjust: true,
    theme: "dark",
    showFingerHints: true,
    practiceReminder: true,
    cloudSyncEnabled: false,
    uiVolume: 0.5
  },
  profile: {
    displayName: "",
    avatar: "default",
    instrumentPrimary: "piano",
    joinDate: 0,
    totalPracticeMinutes: 0,
    favoriteSongs: [],
    achievements: []
  },
  tutorialProgress: {
    completed: {},
    skipped: {}
  },
};

// Debounced save — prevents localStorage thrashing on rapid actions
var _saveTimer = null;
function saveState(immediate) {
  if (immediate) { _doSave(); return; }
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(_doSave, 300);
}
function _doSave() {
  var obj = buildPersistedStateSnapshot(S, PERSIST);
  // Cap history
  obj.history = capArray(obj.history, 500);
  try { localStorage.setItem("pianospark_state", JSON.stringify(obj)); }
  catch(e) { console.error("PianoSpark: saveState failed", e); }
}

function loadState() {
  try {
    var raw = localStorage.getItem("pianospark_state");
    if (!raw) return;
    var obj = safeJsonParse(raw, null);
    if (!obj) return;

    // Detect old format (level 1-3, no currentSession) and migrate
    if (obj.level !== undefined && obj.currentSession === undefined) {
      migrateOldState(obj);
      return;
    }

    // Type validation
    var typeChecks = {
      xp:"number", streak:"number", sessions:"number", level:"number",
      quizCorrect:"number", drillsDone:"number", dailiesDone:"number",
      darkMode:"boolean", volume:"number", practiceLen:"number",
      dailyGoal:"number", dailyPracticed:"number",
      currentSession:"number", lhLevel:"number", keyboardSize:"number",
      onboardingComplete:"boolean", focusMode:"boolean",
      adaptiveBpm:"number", rewardPhase:"number", totalActions:"number",
      jackpotsHit:"number",
      actionsSinceReward:"number", nextRewardAt:"number",
      bpm:"number", quizTotal:"number",
      fingerExercisesDone:"number", fingerDaysLogged:"number",
      midiEnabled:"boolean",
      reverbAmount:"number", a4Tuning:"number",
      practiceStreak:"number", totalPracticeMinutes:"number",
      todayPracticeMinutes:"number",
      playerXP:"number", playerLevel:"number",
      audioLatencyMs:"number", inputLatencyMs:"number"
    };
    var arrayFields = ["earned","history","customSets","songsDone",
                       "completedSessions","stylePrefs","interleavedChords",
                       "lastReviewChords","surpriseQueue","fingerBadges",
                       "practiceHistory","xpLog",
                       "dailyChallenges","weeklyGoals","challengeHistory",
                       "calibrationOffsets"];
    var objectFields = ["chordProg","transitionStats","personalBests","fingerStats",
                        "weakSpots","adaptiveState","mastery","unlocks",
                        "playerAchievements","playerStats","contentLibrary",
                        "skillTree","metaProgress","analytics"];
    var stringFields = ["practiceIntention","tone","lastPractice","metronomeSound",
                        "pitchDetectionMode","lastPracticeDate"];

    // Filter obj to only validated fields, then apply
    var validated = {};
    for (var i = 0; i < PERSIST.length; i++) {
      var k = PERSIST[i];
      if (obj[k] === undefined) continue;
      var val = obj[k];
      if (typeChecks[k] && typeof val !== typeChecks[k]) continue;
      if (arrayFields.indexOf(k) >= 0 && !Array.isArray(val)) continue;
      if (objectFields.indexOf(k) >= 0 && (typeof val !== "object" || val === null || Array.isArray(val))) continue;
      if (stringFields.indexOf(k) >= 0 && typeof val !== "string") continue;
      validated[k] = val;
    }
    applyPersistedStateSnapshot(S, validated, PERSIST);
  } catch(e) { console.error("PianoSpark: loadState failed — data may be corrupted", e); }

  // Init chord progress for all chords
  var all = allChords();
  for (var j = 0; j < all.length; j++) {
    if (S.chordProg[all[j].short] === undefined) S.chordProg[all[j].short] = 0;
  }
  // Ensure arrays
  if (!Array.isArray(S.earned)) S.earned = [];
  if (!Array.isArray(S.history)) S.history = [];
  if (!Array.isArray(S.customSets)) S.customSets = [];
  if (!Array.isArray(S.songsDone)) S.songsDone = [];
  if (!Array.isArray(S.completedSessions)) S.completedSessions = [];
  if (!Array.isArray(S.stylePrefs)) S.stylePrefs = [];
  // Ensure objects
  if (typeof S.transitionStats !== "object" || S.transitionStats === null) S.transitionStats = {};
  if (typeof S.personalBests !== "object" || S.personalBests === null) {
    S.personalBests = { bpm:0, streak:0, sessionsInRow:0, longestSession:0 };
  }
  // Ensure finger exercise state
  if (!Array.isArray(S.fingerBadges)) S.fingerBadges = [];
  if (typeof S.fingerStats !== "object" || S.fingerStats === null) S.fingerStats = {};
  // Ensure brain system state
  if (!Array.isArray(S.practiceHistory)) S.practiceHistory = [];
  if (typeof S.weakSpots !== "object" || S.weakSpots === null) {
    S.weakSpots = { transitions:{}, chords:{}, rhythm:{}, phrases:{} };
  }
  if (typeof S.adaptiveState !== "object" || S.adaptiveState === null) S.adaptiveState = {};
  if (typeof S.mastery !== "object" || S.mastery === null) {
    S.mastery = { chords:{}, transitions:{}, rhythm:{}, scales:{}, fingers:{}, songs:{}, lessons:{} };
  }
  if (typeof S.unlocks !== "object" || S.unlocks === null) {
    S.unlocks = { lessons:{}, songs:{}, exercises:{} };
  }
  // Meta progression defaults
  if (typeof S.playerAchievements !== "object" || S.playerAchievements === null) S.playerAchievements = {};
  if (typeof S.playerStats !== "object" || S.playerStats === null) {
    S.playerStats = { songsCompleted:0, lessonsCompleted:0, exercisesCompleted:0, totalPracticeMinutes:0, streakBest:0 };
  }
  if (!Array.isArray(S.xpLog)) S.xpLog = [];
  if (typeof S.contentLibrary !== "object" || S.contentLibrary === null) {
    S.contentLibrary = { rhythmPatterns:[], lhPatterns:[], chordProgressions:[], exercises:[] };
  }
  // Meta progression – challenges, goals, skill tree defaults
  if (!Array.isArray(S.dailyChallenges)) S.dailyChallenges = [];
  if (!Array.isArray(S.weeklyGoals)) S.weeklyGoals = [];
  if (!Array.isArray(S.challengeHistory)) S.challengeHistory = [];
  if (typeof S.skillTree !== "object" || S.skillTree === null) S.skillTree = {};
  if (typeof S.metaProgress !== "object" || S.metaProgress === null) {
    S.metaProgress = { challengesCompleted:0, goalsCompleted:0, skillPoints:0 };
  }
  // Analytics defaults
  if (typeof S.analytics !== "object" || S.analytics === null) {
    S.analytics = { performanceHistory:[], practiceHistory:[], accuracyHistory:[], masteryHistory:[], xpHistory:[], streakHistory:[] };
  }
  // Audio calibration defaults
  if (!Array.isArray(S.calibrationOffsets)) S.calibrationOffsets = [];
  if (typeof S.audioLatencyMs !== "number") S.audioLatencyMs = 0;
  if (typeof S.inputLatencyMs !== "number") S.inputLatencyMs = 0;

  checkStreak();
  // Reset daily counter if date has changed (so dashboard shows 0 before first practice)
  var today = new Date().toDateString();
  if (S.lastPractice && S.lastPractice !== today) {
    S.dailyPracticed = 0;
  }
}

// Migrate from old 3-level format to new 8-level curriculum
function migrateOldState(obj) {
  // Map old level (1-3) to approximate session number
  var oldLevel = obj.level || 1;
  var sessionMap = { 1: 1, 2: 9, 3: 15 };
  S.currentSession = sessionMap[oldLevel] || 1;
  S.level = oldLevel <= 2 ? oldLevel : Math.min(oldLevel + 1, 4);

  // Carry over what we can
  if (typeof obj.xp === "number") S.xp = obj.xp;
  if (typeof obj.streak === "number") S.streak = obj.streak;
  if (typeof obj.sessions === "number") S.sessions = obj.sessions;
  if (typeof obj.volume === "number") S.volume = obj.volume;
  if (typeof obj.darkMode === "boolean") S.darkMode = obj.darkMode;
  if (typeof obj.dailyGoal === "number") S.dailyGoal = obj.dailyGoal;
  if (typeof obj.dailyPracticed === "number") S.dailyPracticed = obj.dailyPracticed;
  if (typeof obj.quizCorrect === "number") S.quizCorrect = obj.quizCorrect;
  if (typeof obj.drillsDone === "number") S.drillsDone = obj.drillsDone;
  if (typeof obj.dailiesDone === "number") S.dailiesDone = obj.dailiesDone;
  if (typeof obj.practiceLen === "number") S.practiceLen = obj.practiceLen;
  if (obj.lastPractice) S.lastPractice = obj.lastPractice;
  if (Array.isArray(obj.earned)) S.earned = obj.earned;
  if (Array.isArray(obj.history)) S.history = obj.history;
  if (Array.isArray(obj.customSets)) S.customSets = obj.customSets;
  if (Array.isArray(obj.songsDone)) S.songsDone = obj.songsDone;
  if (obj.tone) S.tone = obj.tone;

  // Map old chord progress (old format used numeric level keys)
  if (obj.chordProg && typeof obj.chordProg === "object") {
    S.chordProg = obj.chordProg;
  }

  // Mark completed sessions based on old session count
  S.completedSessions = [];
  for (var i = 1; i < S.currentSession; i++) {
    S.completedSessions.push(i);
  }

  // Set onboarding as complete for migrated users
  S.onboardingComplete = true;

  // Set adaptive BPM from old BPM or default
  S.adaptiveBpm = 70;

  saveState();
}

function resetProgress() {
  var backup = buildPersistedStateSnapshot(S, PERSIST);
  // Deep-clone to prevent mutation
  backup = safeJsonParse(JSON.stringify(backup), {});
  backupPersistedState("pianospark_undo", S, PERSIST);

  S.xp = 0; S.streak = 0; S.sessions = 0; S.level = 1;
  S.chordProg = {}; S.earned = []; S.history = [];
  S.quizCorrect = 0; S.drillsDone = 0; S.dailiesDone = 0;
  S.songsDone = []; S.dailyPracticed = 0;
  S.currentSession = 1; S.lhLevel = 1;
  S.completedSessions = []; S.transitionStats = {};
  S.onboardingComplete = false; S.onboardingStep = 0;
  S.practiceIntention = ""; S.stylePrefs = [];
  S.focusMode = false; S.adaptiveBpm = 60;
  S.personalBests = { bpm:0, streak:0, sessionsInRow:0, longestSession:0 };
  S.rewardPhase = 1; S.totalActions = 0;
  S.actionsSinceReward = 0; S.nextRewardAt = 1;
  S.jackpotsHit = 0; S.surpriseQueue = [];
  S.fingerStats = {}; S.fingerExercisesDone = 0;
  S.fingerDaysLogged = 0; S.fingerBadges = [];
  S.playerXP = 0; S.playerLevel = 1;
  S.playerAchievements = {};
  S.playerStats = { songsCompleted:0, lessonsCompleted:0, exercisesCompleted:0, totalPracticeMinutes:0, streakBest:0 };
  S.xpLog = [];
  S.contentLibrary = { rhythmPatterns:[], lhPatterns:[], chordProgressions:[], exercises:[] };
  S.dailyChallenges = []; S.weeklyGoals = []; S.challengeHistory = [];
  S.skillTree = {}; S.metaProgress = { challengesCompleted:0, goalsCompleted:0, skillPoints:0 };
  S.analytics = { performanceHistory:[], practiceHistory:[], accuracyHistory:[], masteryHistory:[], xpHistory:[], streakHistory:[] };
  S.audioLatencyMs = 0; S.inputLatencyMs = 0; S.calibrationOffsets = [];

  var all = allChords();
  for (var j = 0; j < all.length; j++) S.chordProg[all[j].short] = 0;

  // Save immediately so a crash during undo window doesn't lose the reset
  saveState(true);

  // 5-second undo window
  S._undoBackup = backup;
  S._undoTimer = setTimeout(function() {
    S._undoBackup = null;
    removePersistedBackup("pianospark_undo");
    saveState();
  }, 5000);
}

function recoverFromCrash() {
  try {
    if (!restorePersistedState("pianospark_crash", S, PERSIST)) return;
    removePersistedBackup("pianospark_crash");
    saveState(true);
  } catch(e) { console.error("PianoSpark: recoverFromCrash failed", e); }
}

function undoReset() {
  if (!S._undoBackup) return false;
  clearTimeout(S._undoTimer);
  applyPersistedStateSnapshot(S, S._undoBackup, PERSIST);
  S._undoBackup = null;
  removePersistedBackup("pianospark_undo");
  saveState(true);
  return true;
}

function exportState() {
  var obj = buildPersistedStateSnapshot(S, PERSIST);
  var json = JSON.stringify(obj, null, 2);
  var blob = new Blob([json], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "pianospark_export.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function autoExportForJeeves() {
  backupPersistedState("pianospark_jeeves_export", S, PERSIST);
}

function checkStreak() {
  if (!S.lastPractice) return;
  // Use date strings instead of millisecond math (timezone-safe)
  var today = new Date().toDateString();
  var last = S.lastPractice;
  if (last === today) return; // already counted today
  var yesterday = new Date(Date.now() - 86400000).toDateString();
  if (last !== yesterday) S.streak = 0; // missed more than one day — reset
}

function checkPracticeDate() {
  var today = new Date().toDateString();
  if (S.lastPractice !== today) {
    var yesterday = new Date(Date.now() - 86400000).toDateString();
    if (S.lastPractice === yesterday) {
      S.streak++;
    } else if (S.lastPractice) {
      // Returning after absence - check for comeback badge
      var last = new Date(S.lastPractice);
      var now = new Date();
      var daysSince = Math.floor((now - last) / 86400000);
      if (daysSince >= 3 && S.earned.indexOf("comeback") < 0) {
        S.earned.push("comeback");
      }
      S.streak = 1;
    } else {
      S.streak = 1;
    }
    S.dailyPracticed = 0;
  }
  S.lastPractice = today;
  // Update personal best streak
  if (S.streak > S.personalBests.streak) {
    S.personalBests.streak = S.streak;
  }
  saveState();
}

function addPracticeSecond() {
  S.dailyPracticed++;
  if (S.dailyPracticed % 60 === 0) saveState();
}

function addXP(n) {
  S.xp += n;
  saveState();
}

function addHistory(type, detail) {
  var entry = { type: type, ts: Date.now() };
  if (detail.chord !== undefined) entry.chord = detail.chord;
  if (detail.dur !== undefined) entry.dur = detail.dur;
  if (detail.chords !== undefined) entry.chords = detail.chords;
  if (detail.score !== undefined) entry.score = detail.score;
  if (detail.session !== undefined) entry.session = detail.session;
  S.history.push(entry);
  saveState();
}

// Get current session plan
function getCurrentSessionPlan() {
  if (S.currentSession < 1 || S.currentSession > SESSION_PLANS.length) return null;
  return SESSION_PLANS[S.currentSession - 1];
}

// Get current curriculum level object
function getCurrentLevel() {
  for (var i = 0; i < CURRICULUM.length; i++) {
    if (CURRICULUM[i].num === S.level) return CURRICULUM[i];
  }
  return CURRICULUM[0];
}

// Calculate level from session number
function levelForSession(sessionNum) {
  for (var i = 0; i < CURRICULUM.length; i++) {
    var parts = CURRICULUM[i].sessions.split("-");
    var start = parseInt(parts[0]);
    var end = parseInt(parts[1]);
    if (sessionNum >= start && sessionNum <= end) return CURRICULUM[i].num;
  }
  return 8;
}

// Update transition stats
function recordTransition(fromChord, toChord, wasClean, timeMs) {
  var key = fromChord + "_" + toChord;
  if (!S.transitionStats[key]) {
    S.transitionStats[key] = { attempts: 0, clean: 0, avgMs: 0 };
  }
  var stat = S.transitionStats[key];
  stat.attempts++;
  if (wasClean) stat.clean++;
  stat.avgMs = Math.round((stat.avgMs * (stat.attempts - 1) + timeMs) / stat.attempts);
  saveState();
}
