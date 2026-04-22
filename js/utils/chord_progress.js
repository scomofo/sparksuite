// js/utils/chord_progress.js
// Namespaced accessor for S.chordProgress so per-instrument chord practice
// percentages don't bleed across the launcher's instrument picker.
//
// State shape:
//   S.chordProgress = {
//     guitar:  { "C": 85, "G": 100, ... },
//     bass:    { "E": 60, ... },
//     ukulele: { "C": 40, ... },
//     piano:   { "Cmaj": 70, ... }
//   }
//
// Legacy shape (pre-multi-instrument) was a flat chord-name -> pct map.
// `ensureShape()` migrates legacy data into the `guitar` bucket since the
// app was guitar-only before the launcher shipped.
//
// All reads/writes go through this module so the namespace is enforced in
// one place — call sites never touch S.chordProgress[name] directly.
(function() {
  var DEFAULT_INSTRUMENT = "guitar";

  function getActiveInstrumentType() {
    var active = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive
      ? SparkInstruments.getActive()
      : null;
    return (active && (active.instrument || active.instrumentType)) || DEFAULT_INSTRUMENT;
  }

  function isLegacyFlatShape(obj) {
    if (!obj || typeof obj !== "object") return false;
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      var v = obj[k];
      if (typeof v === "number") return true;
      if (v && typeof v === "object") return false;
    }
    return false;
  }

  function ensureShape() {
    if (typeof S === "undefined" || S === null) return;
    if (!S.chordProgress || typeof S.chordProgress !== "object") {
      S.chordProgress = {};
      return;
    }
    if (isLegacyFlatShape(S.chordProgress)) {
      S.chordProgress = { guitar: S.chordProgress };
    }
  }

  function bucketFor(instrumentType) {
    ensureShape();
    var key = instrumentType || getActiveInstrumentType();
    if (!S.chordProgress[key] || typeof S.chordProgress[key] !== "object") {
      S.chordProgress[key] = {};
    }
    return S.chordProgress[key];
  }

  function clampPct(n) {
    var v = Number(n);
    if (!isFinite(v)) return 0;
    if (v < 0) return 0;
    if (v > 100) return 100;
    return v;
  }

  var SparkChordProgress = {
    get: function(chordName, opts) {
      opts = opts || {};
      var bucket = bucketFor(opts.instrument);
      var value = bucket[chordName];
      return typeof value === "number" ? value : 0;
    },

    set: function(chordName, pct, opts) {
      opts = opts || {};
      var bucket = bucketFor(opts.instrument);
      bucket[chordName] = clampPct(pct);
      return bucket[chordName];
    },

    // Adds delta to the current value, clamped to [0, 100]. Returns the new value.
    add: function(chordName, delta, opts) {
      var current = SparkChordProgress.get(chordName, opts);
      return SparkChordProgress.set(chordName, current + (Number(delta) || 0), opts);
    },

    // Returns the live per-instrument map for read iteration. Callers must
    // NOT write through this reference — use set/add instead.
    all: function(opts) {
      opts = opts || {};
      return bucketFor(opts.instrument);
    },

    masteredCount: function(opts) {
      var bucket = SparkChordProgress.all(opts);
      var n = 0;
      for (var k in bucket) {
        if (Object.prototype.hasOwnProperty.call(bucket, k) && (bucket[k] || 0) >= 100) n++;
      }
      return n;
    },

    // Clear progress. Pass {allInstruments: true} for a full reset
    // (equivalent to S.chordProgress = {}); otherwise only the active/opts
    // instrument's bucket is emptied.
    reset: function(opts) {
      opts = opts || {};
      if (opts.allInstruments) {
        S.chordProgress = {};
        return;
      }
      var bucket = bucketFor(opts.instrument);
      for (var k in bucket) {
        if (Object.prototype.hasOwnProperty.call(bucket, k)) delete bucket[k];
      }
    },

    ensureShape: ensureShape,
    _isLegacyFlatShape: isLegacyFlatShape
  };

  // Use an indirection so test harnesses that regex-strip `window.X` /
  // `global.X` on loaded source don't break the export.
  var _globalScope = (typeof globalThis !== "undefined") ? globalThis
    : (typeof window !== "undefined") ? window
    : (typeof global !== "undefined") ? global
    : {};
  _globalScope.SparkChordProgress = SparkChordProgress;
})();
