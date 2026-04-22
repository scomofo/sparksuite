// js/utils/normalize.js
// Shared value-shape normalization primitives used across page renderers.
//
// Before this module existed, each page (tools, analytics, session, perform,
// editor, practice, guided, perform_song, perform_calibration, shared) had
// its own near-identical copy of `normalize<Page>Number`, `normalize<Page>
// TextToken`, etc. — ~15 copies in total, mostly copy-pasted bodies.
//
// Per-page wrappers still exist as one-liners delegating here, so existing
// call sites stay unchanged but the actual logic lives in one place.
(function() {

  // Coerce to a finite number; otherwise return fallback. Accepts numbers
  // and number-shaped strings ("12", "3.14"). Rejects NaN, Infinity, null,
  // undefined, objects.
  function num(value, fallback) {
    var n = typeof value === "number" ? value : Number(value);
    return isFinite(n) ? n : fallback;
  }

  // Strict — only accepts a primitive number. Used where string-coercion
  // would silently mask a real type bug (e.g. practice goal numbers that
  // must come from typed code paths).
  function strictNum(value, fallback) {
    return typeof value === "number" && isFinite(value) ? value : fallback;
  }

  // Round to integer. No min/max. Returns fallback on non-number.
  function integer(value, fallback) {
    var n = num(value, fallback);
    if (!isFinite(n)) return fallback;
    return Math.round(n);
  }

  // Non-negative integer. Returns fallback if value rounds below zero.
  // Use for tally / count fields (Today's Time minutes, badges earned).
  function count(value, fallback) {
    var n = num(value, fallback);
    if (!isFinite(n)) return fallback;
    n = Math.round(n);
    if (n < 0) return fallback;
    return n;
  }

  // Integer clamped to [0, 100]. Use for progress / percent fills.
  function percent(value, fallback) {
    var n = num(value, fallback);
    if (!isFinite(n)) return fallback;
    n = Math.round(n);
    if (n < 0) return 0;
    if (n > 100) return 100;
    return n;
  }

  // Positive integer (n > 0). Returns fallback for zero/negative.
  // Use for BPM and other "must be > 0 to be meaningful" fields.
  function positiveInt(value, fallback) {
    var n = num(value, fallback);
    if (!isFinite(n)) return fallback;
    n = Math.round(n);
    if (n <= 0) return fallback;
    return n;
  }

  // Trim a string and reject empty / sentinel string values that often
  // leak in from stale cached state ("undefined", "null", "nan").
  // Returns "" when the input is anything other than a meaningful string.
  function textToken(value) {
    if (typeof value !== "string") return "";
    var text = value.trim();
    if (!text) return "";
    var lower = text.toLowerCase();
    if (lower === "undefined" || lower === "null" || lower === "nan") return "";
    return text;
  }

  // Format a Hz value (positive number) as a string for display. Returns
  // the fallback string when the value is missing or non-positive.
  function formatHz(value, fallback) {
    var n = num(value, null);
    if (n == null || n <= 0) return fallback;
    return String(n);
  }

  window.SparkNormalize = {
    number:      num,
    strictNumber:strictNum,
    integer:     integer,
    count:       count,
    percent:     percent,
    positiveInt: positiveInt,
    textToken:   textToken,
    formatHz:    formatHz
  };
})();
