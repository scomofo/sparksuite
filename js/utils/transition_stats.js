// js/utils/transition_stats.js
// Namespaced accessor for S.transitionStats so chord-transition stats
// (C→G, etc.) don't bleed across instruments. Guitar C→G != piano C→G
// != bass C→G — each instrument has its own finger/hand mechanics and
// practice them against different chord voicings.
//
// State shape:
//   S.transitionStats = {
//     guitar:  { "C->G": { attempts, clean, avgMs, ... }, ... },
//     bass:    { ... },
//     ukulele: { ... },
//     piano:   { ... }
//   }
//
// Legacy shape was a flat key -> stat-record map. On first access we
// migrate into the `guitar` bucket (pre-launcher SparkSuite was guitar
// only); any piano stats that happened to land in the flat map before
// migration will re-accumulate correctly on the next practice session.
//
// Record shape varies across instruments (guitar uses {attempts,avgTime,
// best}; piano uses {attempts,clean,avgMs}); this helper preserves that
// flexibility by returning live references — callers mutate fields as
// before. All it enforces is the per-instrument partition.
(function() {
  var DEFAULT_INSTRUMENT = "guitar";

  function getActiveInstrumentType() {
    var active = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive
      ? SparkInstruments.getActive()
      : null;
    return (active && (active.instrument || active.instrumentType)) || DEFAULT_INSTRUMENT;
  }

  // Legacy shape detection: a non-namespaced record has fields like
  // `attempts`, `avgMs`, `clean`, `avgTime`, `best`. Namespaced buckets
  // are keyed by instrument type and hold records inside. We can tell
  // them apart by peeking at a value: records have primitive fields,
  // namespaced buckets contain only objects of records.
  function isLegacyFlatShape(obj) {
    if (!obj || typeof obj !== "object") return false;
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      var v = obj[k];
      if (!v || typeof v !== "object") continue;
      // If the value has typical stat-record fields, treat as legacy.
      if (Object.prototype.hasOwnProperty.call(v, "attempts")
        || Object.prototype.hasOwnProperty.call(v, "avgMs")
        || Object.prototype.hasOwnProperty.call(v, "avgTime")
        || Object.prototype.hasOwnProperty.call(v, "clean")
        || Object.prototype.hasOwnProperty.call(v, "best")) {
        return true;
      }
      // Otherwise (value is itself a map of records) treat as namespaced.
      return false;
    }
    return false;
  }

  function ensureShape() {
    if (typeof S === "undefined" || S === null) return;
    if (!S.transitionStats || typeof S.transitionStats !== "object") {
      S.transitionStats = {};
      return;
    }
    if (isLegacyFlatShape(S.transitionStats)) {
      S.transitionStats = { guitar: S.transitionStats };
    }
  }

  function bucketFor(instrumentType) {
    ensureShape();
    var key = instrumentType || getActiveInstrumentType();
    if (!S.transitionStats[key] || typeof S.transitionStats[key] !== "object") {
      S.transitionStats[key] = {};
    }
    return S.transitionStats[key];
  }

  var SparkTransitionStats = {
    // Returns the live record for the given transition key. Mutations
    // made to the returned object are persisted (it's a live reference
    // into the active instrument's bucket).
    get: function(transitionKey, opts) {
      opts = opts || {};
      return bucketFor(opts.instrument)[transitionKey] || null;
    },

    // Ensure a record exists at `transitionKey`, seeded with `defaults`
    // when missing. Returns the (existing or newly-initialized) record
    // as a live reference. This is the primary write path:
    //
    //   var rec = SparkTransitionStats.ensure("C->G", { attempts:0, clean:0 });
    //   rec.attempts++;
    //
    // Schema is not enforced — guitar and piano legitimately use
    // different record shapes.
    ensure: function(transitionKey, defaults, opts) {
      opts = opts || {};
      var bucket = bucketFor(opts.instrument);
      if (!bucket[transitionKey]) {
        bucket[transitionKey] = defaults ? JSON.parse(JSON.stringify(defaults)) : {};
      }
      return bucket[transitionKey];
    },

    // Returns the live per-instrument bucket for iteration. Same
    // caveat as get() — mutations persist. Prefer ensure() for writes.
    all: function(opts) {
      opts = opts || {};
      return bucketFor(opts.instrument);
    },

    reset: function(opts) {
      opts = opts || {};
      if (opts.allInstruments) {
        S.transitionStats = {};
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
  _globalScope.SparkTransitionStats = SparkTransitionStats;
})();
