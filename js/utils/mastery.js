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
(function() {
  var DEFAULT_INSTRUMENT = "guitar";

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

  function ensureShape() {
    if (typeof S === "undefined" || S === null) return;
    if (!S.mastery || typeof S.mastery !== "object") {
      S.mastery = {};
      return;
    }
    if (isLegacyFlatShape(S.mastery)) {
      S.mastery = { guitar: S.mastery };
    }
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
