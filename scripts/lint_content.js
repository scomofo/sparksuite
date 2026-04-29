const fs = require("fs");
const path = require("path");

global.window = global;
global.document = {
  getElementById: function() { return null; },
  querySelector: function() { return null; },
  querySelectorAll: function() { return []; },
  createElement: function() { return { getContext: function() { return {}; }, style: {} }; }
};
global.localStorage = {
  getItem: function() { return null; },
  setItem: function() {},
  removeItem: function() {},
  clear: function() {}
};
global.navigator = { userAgent: "node", requestMIDIAccess: null };
global.AudioContext = null;
global.webkitAudioContext = null;
global.Audio = function() { return { preload: "", play: function() { return Promise.resolve(); } }; };
global.performance = { now: function() { return Date.now(); } };
global.S = { completedLessons: [], mastery: { chords: {}, lessons: {}, rhythm: {} }, chordProgress: {}, playerLevel: 1 };
global.SparkHighway = { GUITAR_SKIN: { laneCount: 6, labels: ["E", "A", "D", "G", "B", "e"] }, PIANO_SKIN: { laneCount: 24 } };
global.escHTML = function(s) { return String(s); };
global.SparkProfile = {
  createEmpty: function() { return { schemaVersion: 1, suite: "spark", userId: "local-user", apps: {}, suiteRewards: { badges: [], cosmetics: [], challengeProgress: {} } }; },
  ensureApp: function(p, id, inst) { p.apps = p.apps || {}; if (!p.apps[id]) p.apps[id] = { instrument: inst, stats: { level: 1, xp: 0, streakDays: 0 } }; }
};
global.SparkStorage = { load: function() { return SparkProfile.createEmpty(); } };
global.saveState = function() {};
global.SparkChordProgress = {
  get: function() { return 0; },
  all: function() { return {}; },
  ensureShape: function() {}
};
global.SparkTransitionStats = {
  all: function() { return {}; },
  ensureShape: function() {}
};

const repoRoot = path.resolve(__dirname, "..");

function loadJS(file) {
  const full = path.join(repoRoot, file);
  if (!fs.existsSync(full)) return false;
  global.eval(fs.readFileSync(full, "utf8"));
  return true;
}

[
  "js/spark-core/instrument-adapter.js",
  "js/sparksuite/content/validate_instrument_module.js",
  "js/launcher.js",
  "js/data.js",
  "js/progression/skill_tree.js",
  "js/instruments/piano/data.js",
  "js/instruments/bass/data.js",
  "js/sparksuite/instruments/guitar/guitar_rhythm_adapter.js",
  "js/sparksuite/instruments/guitar/guitar_adapter.js",
  "js/sparksuite/instruments/guitar/index.js",
  "js/sparksuite/instruments/piano/piano_adapter.js",
  "js/sparksuite/instruments/piano/index.js",
  "js/sparksuite/instruments/bass/bass_module.js",
  "js/sparksuite/instruments/bass/bass_adapter.js",
  "js/sparksuite/instruments/bass/index.js",
  "js/sparksuite/instruments/drums/drums_skill_tree.js",
  "js/sparksuite/instruments/drums/drums_curriculum.js",
  "js/sparksuite/instruments/drums/drums_lessons.js",
  "js/sparksuite/instruments/drums/drums_exercises.js",
  "js/sparksuite/instruments/drums/drums_patterns.js",
  "js/sparksuite/instruments/drums/drums_songs.js",
  "js/sparksuite/instruments/drums/drums_kits.js",
  "js/sparksuite/instruments/drums/drums_mapping.js",
  "js/sparksuite/instruments/drums/drums_notation.js",
  "js/sparksuite/instruments/drums/drums_progression.js",
  "js/sparksuite/instruments/drums/drums_packs.js",
  "js/sparksuite/instruments/drums/drums_chart_library.js",
  "js/sparksuite/instruments/drums/drums_runtime_adapter.js",
  "js/sparksuite/instruments/drums/drums_rhythm_adapter.js",
  "js/sparksuite/instruments/drums/drums_module.js",
  "js/sparksuite/instruments/drums/drums_adapter.js",
  "js/sparksuite/instruments/drums/index.js",
  "js/sparksuite/instruments/ukulele/ukulele_chords.js",
  "js/sparksuite/instruments/ukulele/ukulele_scales.js",
  "js/sparksuite/instruments/ukulele/ukulele_tuning.js",
  "js/sparksuite/instruments/ukulele/ukulele_lessons.js",
  "js/sparksuite/instruments/ukulele/ukulele_skill_tree.js",
  "js/sparksuite/instruments/ukulele/ukulele_exercises.js",
  "js/sparksuite/instruments/ukulele/ukulele_module.js",
  "js/sparksuite/instruments/ukulele/ukulele_adapter.js",
  "js/sparksuite/instruments/ukulele/index.js"
].forEach(loadJS);

const instruments = global.SparkSuiteInstrumentAdapters || {};
const instrumentIds = Object.keys(instruments).sort();

if (!instrumentIds.length) {
  console.error("No SparkSuite instrument adapters registered");
  process.exit(1);
}

instrumentIds.forEach(function(id) {
  const adapter = instruments[id]();
  global.SparkValidateInstrumentModule(adapter, id);
  const lessons = adapter.getLessons();
  console.log("OK " + id + ": " + lessons.length + " lessons valid");
});
