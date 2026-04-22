// js/utils/finger_stats.js
// Namespaced accessor for S.fingerStats so finger-exercise progress
// doesn't bleed across instruments. Guitar spider-walks vs. piano
// Hanon exercises are different practice entirely — sharing a single
// global map mixed their completion counts and best-speeds together.
//
// State shape:
//   S.fingerStats = {
//     guitar: { "G-SPIDER-1": 12, "G-HAMMER-2": 3, ... },   // legacy: scalar
//     piano:  { "P-ADV-3": { completions, lastDone, bestTrillSpeed }, ... },
//     ...
//   }
//
// Legacy shape was a flat map whose values were either scalars (guitar)
// or records (piano). Migration parks the flat map in the `guitar`
// bucket; piano will rebuild cleanly on the next session.
//
// Record shape varies — guitar uses a scalar counter, piano uses
// records with different fields. The helper doesn't enforce schema;
// it just partitions by instrument.
(function() {
  var DEFAULT_INSTRUMENT = "guitar";

  function getActiveInstrumentType() {
    var active = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive
      ? SparkInstruments.getActive()
      : null;
    return (active && (active.instrument || active.instrumentType)) || DEFAULT_INSTRUMENT;
  }

  // Flat/legacy shape: values are primitives or records with fields like
  // `completions`/`bestTrillSpeed`. Namespaced shape: values are buckets
  // (objects containing records under instrument-specific keys).
  function isLegacyFlatShape(obj) {
    if (!obj || typeof obj !== "object") return false;
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      var v = obj[k];
      if (v == null || typeof v === "number" || typeof v === "string" || typeof v === "boolean") return true;
      if (typeof v === "object") {
        // If it looks like a stat record, legacy.
        if (Object.prototype.hasOwnProperty.call(v, "completions")
          || Object.prototype.hasOwnProperty.call(v, "bestTrillSpeed")
          || Object.prototype.hasOwnProperty.call(v, "bestSpeed")
          || Object.prototype.hasOwnProperty.call(v, "best")
          || Object.prototype.hasOwnProperty.call(v, "lastDone")) {
          return true;
        }
        return false;
      }
    }
    return false;
  }

  function ensureShape() {
    if (typeof S === "undefined" || S === null) return;
    if (!S.fingerStats || typeof S.fingerStats !== "object") {
      S.fingerStats = {};
      return;
    }
    if (isLegacyFlatShape(S.fingerStats)) {
      S.fingerStats = { guitar: S.fingerStats };
    }
  }

  function bucketFor(instrumentType) {
    ensureShape();
    var key = instrumentType || getActiveInstrumentType();
    if (!S.fingerStats[key] || typeof S.fingerStats[key] !== "object") {
      S.fingerStats[key] = {};
    }
    return S.fingerStats[key];
  }

  var SparkFingerStats = {
    get: function(exerciseId, opts) {
      opts = opts || {};
      var bucket = bucketFor(opts.instrument);
      return bucket[exerciseId];
    },

    set: function(exerciseId, value, opts) {
      opts = opts || {};
      var bucket = bucketFor(opts.instrument);
      bucket[exerciseId] = value;
      return bucket[exerciseId];
    },

    // Ensure a record exists; returns a live reference to mutate.
    ensure: function(exerciseId, defaults, opts) {
      opts = opts || {};
      var bucket = bucketFor(opts.instrument);
      if (bucket[exerciseId] === undefined || bucket[exerciseId] === null) {
        bucket[exerciseId] = defaults !== undefined ? JSON.parse(JSON.stringify(defaults)) : {};
      }
      return bucket[exerciseId];
    },

    // Increment a scalar counter (for guitar-style S.fingerStats[id] = N).
    increment: function(exerciseId, delta, opts) {
      opts = opts || {};
      var bucket = bucketFor(opts.instrument);
      bucket[exerciseId] = (bucket[exerciseId] || 0) + (Number(delta) || 0);
      return bucket[exerciseId];
    },

    all: function(opts) {
      opts = opts || {};
      return bucketFor(opts.instrument);
    },

    reset: function(opts) {
      opts = opts || {};
      if (opts.allInstruments) {
        S.fingerStats = {};
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

  var _globalScope = (typeof globalThis !== "undefined") ? globalThis
    : (typeof window !== "undefined") ? window
    : (typeof global !== "undefined") ? global
    : {};
  _globalScope.SparkFingerStats = SparkFingerStats;
})();
