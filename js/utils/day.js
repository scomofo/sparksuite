// js/utils/day.js
// One definition of "what day is it" for streaks, daily goals, and daily
// plan caches.
//
// These all used `new Date().toISOString().slice(0,10)`, which is the UTC
// calendar day. The arithmetic was sound but the attribution was not: at
// UTC-7 the day flips at 5pm local, so an evening practice session counted
// as tomorrow and the daily-goal ring reset mid-evening; at UTC+13 it flips
// at 1pm. Practising Monday evening and Tuesday morning could land on one
// UTC day and fail to advance a streak, while a genuine two-day-consecutive
// pair could read as a gap.
//
// Everything here works on the viewer's LOCAL calendar day. Differences are
// computed from the calendar values via Date.UTC rather than by subtracting
// timestamps, so a DST transition inside the interval cannot make a day
// count 23 or 25 hours long and round the wrong way.
//
// NOTE ON EXISTING SAVES: dates stored before this change are UTC days. For
// a user west of UTC a stored date can be one day ahead of the local day it
// actually belonged to, so the first comparison after upgrading may be off
// by one. That resolves itself after one session, and the streak-freeze
// rule already absorbs a single missed day.
(function() {
  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  // Local calendar day as YYYY-MM-DD. Accepts a Date, a timestamp, an
  // ISO string, or nothing (meaning now). Returns null for junk so callers
  // can tell "unknown" from "today".
  //
  // A value that is already a calendar day is returned as-is rather than
  // re-parsed. `new Date("2026-08-31")` is UTC midnight, which in any
  // negative-offset zone reads back as the 30th — round-tripping a stored
  // day through an instant would shift it backwards and turn a one-day
  // streak gap into two.
  function toISO(value) {
    var m;
    if (typeof value === "string") {
      m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
      if (m) return m[1] + "-" + m[2] + "-" + m[3];
    }
    var d;
    if (value == null) d = new Date();
    else if (value instanceof Date) d = value;
    else d = new Date(value);
    if (!d || isNaN(d.getTime())) return null;
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function today() {
    return toISO(new Date());
  }

  function parts(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    if (!m) {
      // Tolerate legacy values such as Date.toDateString() output.
      var normalized = toISO(iso);
      if (!normalized) return null;
      m = /^(\d{4})-(\d{2})-(\d{2})/.exec(normalized);
      if (!m) return null;
    }
    return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  }

  // Whole calendar days from one day-string to another. Positive when `to`
  // is later. Null when either side cannot be read.
  function daysBetween(fromISO, toISOValue) {
    var a = parts(fromISO);
    var b = parts(toISOValue);
    if (!a || !b) return null;
    return Math.round(
      (Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000
    );
  }

  function addDays(iso, delta) {
    var p = parts(iso);
    if (!p) return null;
    var shifted = new Date(Date.UTC(p.y, p.m - 1, p.d));
    shifted.setUTCDate(shifted.getUTCDate() + (delta || 0));
    return shifted.getUTCFullYear() + "-" +
      pad(shifted.getUTCMonth() + 1) + "-" +
      pad(shifted.getUTCDate());
  }

  var SparkDay = {
    today: today,
    toISO: toISO,
    daysBetween: daysBetween,
    addDays: addDays
  };

  // Reachable from every context this loads in: the browser (window), Node
  // requires (module.exports), and a bare vm sandbox, which has neither —
  // without the globalThis branch the helper would define itself and then
  // be discarded, leaving callers with a silent ReferenceError.
  if (typeof window !== "undefined") window.SparkDay = SparkDay;
  else if (typeof globalThis !== "undefined") globalThis.SparkDay = SparkDay;
  if (typeof module !== "undefined" && module.exports) module.exports = SparkDay;
})();
