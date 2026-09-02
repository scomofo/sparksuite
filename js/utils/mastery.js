// js/utils/mastery.js
// Namespaced accessor for S.mastery so per-instrument mastery of chords /
// lessons / rhythm / scales / finger exercises / songs doesn't bleed
// across instruments. Mastering a ukulele chord should not mark the same
// chord name mastered on piano.
//
// State shape:
//   S.mastery = {
//     guitar:  { chords:{}, transitions:{}, rhythm:{}, scales:{},
//                fingers:{}, songs:{}, lessons:{}, capo:{} },
//     bass:    { chords:{}, ... },
//     ukulele: { chords:{}, ... },
//     piano:   { chords:{}, ... }
//   }
//
// Legacy shape had the categories at the top level:
//   S.mastery = { chords:{}, transitions:{}, rhythm:{}, lessons:{}, ... }
// Migration parks the legacy object inside the `guitar` bucket (pre-
// launcher SparkSuite was guitar only).
//
// SCALE: values are percentages, 0-100. ProgressEngine.toMasteryPercent is
// the one place that converts an incoming accuracy into this scale, and
// ProgressEngine.blendCategoryMastery is the one place that writes it.
// Readers compare against percentages (js/progression/unlocks.js) and render
// them without scaling (progress_ui.js, piano practice summary).
//
// Older saves predate that decision and can hold 0-1 fractions, so
// migrateScale() rescales them once, guarded by S.masteryScaleVersion.
(function() {
  var DEFAULT_INSTRUMENT = "guitar";
  var MASTERY_SCALE_VERSION = 1;

  var LEGACY_CATEGORIES = [
    "chords", "transitions", "rhythm", "scales",
    "fingers", "songs", "lessons", "capo"
  ];

  function getActiveInstrumentType() {
    var active = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive
      ? SparkInstruments.getActive()
      : null;
    return (active && (active.instrument || active.instrumentType)) || DEFAULT_INSTRUMENT;
  }

  function isLegacyFlatShape(obj) {
    if (!obj || typeof obj !== "object") return false;
    for (var i = 0; i < LEGACY_CATEGORIES.length; i++) {
      if (Object.prototype.hasOwnProperty.call(obj, LEGACY_CATEGORIES[i])) {
        return true;
      }
    }
    return false;
  }

  function makeEmptyInstrumentBranch() {
    return { chords: {}, transitions: {}, rhythm: {}, scales: {}, fingers: {}, songs: {}, lessons: {} };
  }

  // One-time rescale of pre-0-100 saves. A stored value in (0, 1] is a
  // fraction from the old convention: on the percent scale it would be a
  // sub-1% reading, which no real session produces. Exactly 1 is the one
  // ambiguous input and resolves to 100 (a perfect score), which is the
  // reading that matters. Runs once per profile, pinned by the version flag,
  // so values can never be scaled twice.
  function migrateScale() {
    if (S.masteryScaleVersion === MASTERY_SCALE_VERSION) return;
    var instrument;
    var category;
    var skillId;
    var branch;
    var map;
    var value;
    for (instrument in S.mastery) {
      if (!Object.prototype.hasOwnProperty.call(S.mastery, instrument)) continue;
      branch = S.mastery[instrument];
      if (!branch || typeof branch !== "object") continue;
      for (category in branch) {
        if (!Object.prototype.hasOwnProperty.call(branch, category)) continue;
        map = branch[category];
        if (!map || typeof map !== "object") continue;
        for (skillId in map) {
          if (!Object.prototype.hasOwnProperty.call(map, skillId)) continue;
          value = map[skillId];
          if (typeof value === "number" && value > 0 && value <= 1) {
            map[skillId] = value * 100;
          }
        }
      }
    }
    S.masteryScaleVersion = MASTERY_SCALE_VERSION;
  }

  function ensureShape() {
    if (typeof S === "undefined" || S === null) return;
    if (!S.mastery || typeof S.mastery !== "object") {
      S.mastery = {};
      S.masteryScaleVersion = MASTERY_SCALE_VERSION;
      return;
    }
    if (isLegacyFlatShape(S.mastery)) {
      S.mastery = { guitar: S.mastery };
    }
    migrateScale();
  }

  function bucketFor(instrumentType) {
    ensureShape();
    var key = instrumentType || getActiveInstrumentType();
    if (!S.mastery[key] || typeof S.mastery[key] !== "object") {
      S.mastery[key] = makeEmptyInstrumentBranch();
    }
    return S.mastery[key];
  }

  function categoryMap(category, instrumentType) {
    var branch = bucketFor(instrumentType);
    if (!branch[category] || typeof branch[category] !== "object") {
      branch[category] = {};
    }
    return branch[category];
  }

  var SparkMastery = {
    // Read a specific skill's mastery value within a category.
    get: function(category, skillId, opts) {
      opts = opts || {};
      var map = categoryMap(category, opts.instrument);
      return map[skillId];
    },

    // Write a specific skill's mastery value.
    set: function(category, skillId, value, opts) {
      opts = opts || {};
      var map = categoryMap(category, opts.instrument);
      map[skillId] = value;
      return map[skillId];
    },

    // Returns the live map for a single category (e.g. mastery.lessons
    // for the active instrument). Mutations persist — it's a live
    // reference into the state.
    category: function(category, opts) {
      opts = opts || {};
      return categoryMap(category, opts.instrument);
    },

    // Returns the live per-instrument mastery branch in the OLD flat
    // shape ({chords,transitions,...}) — useful when passing a mastery
    // context object into per-instrument module callbacks that still
    // expect the legacy field layout.
    all: function(opts) {
      opts = opts || {};
      return bucketFor(opts.instrument);
    },

    reset: function(opts) {
      opts = opts || {};
      if (opts.allInstruments) {
        S.mastery = {};
        return;
      }
      var branch = bucketFor(opts.instrument);
      for (var k in branch) {
        if (Object.prototype.hasOwnProperty.call(branch, k)) delete branch[k];
      }
    },

    ensureShape: ensureShape,
    _isLegacyFlatShape: isLegacyFlatShape
  };

  var _globalScope = (typeof globalThis !== "undefined") ? globalThis
    : (typeof window !== "undefined") ? window
    : (typeof global !== "undefined") ? global
    : {};
  _globalScope.SparkMastery = SparkMastery;
})();
