/*
 * Day boundaries follow the viewer's local calendar day, not UTC.
 *
 * Streaks, the daily-goal ring and the daily-plan cache all derived "today"
 * from `new Date().toISOString().slice(0,10)`. That is the UTC day: at
 * UTC-7 it flips at 5pm local, so an evening session counted as tomorrow
 * and the goal ring reset mid-evening; at UTC+13 it flips at 1pm.
 *
 * These tests run under a fixed non-UTC timezone (TZ is set below before
 * anything reads a Date) so a regression to UTC-derived days fails here
 * rather than only for users west of Greenwich.
 */
process.env.TZ = "America/Los_Angeles"; // UTC-7/-8

var assert = require("assert");
var SparkDay = require("../js/utils/day.js");

var passed = 0;
function test(name, fn) {
  try { fn(); console.log("  PASS " + name); passed++; }
  catch (e) { console.error("  FAIL " + name + ": " + (e && e.message)); process.exitCode = 1; }
}

// --- The bug this exists to prevent ---------------------------------------

test("an evening session counts as today, not tomorrow", function() {
  // 2026-09-02 19:30 local (UTC-7) is 2026-09-03 02:30 UTC.
  var evening = new Date(2026, 8, 2, 19, 30, 0);
  assert.strictEqual(evening.toISOString().slice(0, 10), "2026-09-03", "precondition: UTC has already rolled over");
  assert.strictEqual(SparkDay.toISO(evening), "2026-09-02", "the local day is what the user experienced");
});

test("evening then next-morning is one day apart, not zero", function() {
  // The pair that silently failed to advance a streak: Monday 18:00 and
  // Tuesday 10:00 local both landed on the same UTC day.
  var monEvening = new Date(2026, 8, 7, 18, 0, 0);
  var tueMorning = new Date(2026, 8, 8, 10, 0, 0);
  assert.strictEqual(
    monEvening.toISOString().slice(0, 10),
    tueMorning.toISOString().slice(0, 10),
    "precondition: UTC collapses these two sessions onto one day"
  );
  assert.strictEqual(
    SparkDay.daysBetween(SparkDay.toISO(monEvening), SparkDay.toISO(tueMorning)),
    1,
    "locally they are consecutive days, so the streak advances"
  );
});

test("a late-night session and the next afternoon are one day apart", function() {
  var lateNight = new Date(2026, 8, 2, 23, 45, 0);
  var nextDay = new Date(2026, 8, 3, 14, 0, 0);
  assert.strictEqual(SparkDay.daysBetween(SparkDay.toISO(lateNight), SparkDay.toISO(nextDay)), 1);
});

// --- Calendar arithmetic --------------------------------------------------

test("DST transitions do not distort the day count", function() {
  // 2026-03-08 is US spring-forward: that local day is only 23 hours long.
  assert.strictEqual(SparkDay.daysBetween("2026-03-07", "2026-03-08"), 1, "23-hour day still counts as one");
  // 2026-11-01 is fall-back: 25 hours.
  assert.strictEqual(SparkDay.daysBetween("2026-10-31", "2026-11-01"), 1, "25-hour day still counts as one");
  assert.strictEqual(SparkDay.daysBetween("2026-03-01", "2026-03-31"), 30);
});

test("addDays crosses month and year boundaries", function() {
  assert.strictEqual(SparkDay.addDays("2026-12-31", 1), "2027-01-01");
  assert.strictEqual(SparkDay.addDays("2026-01-01", -1), "2025-12-31");
  assert.strictEqual(SparkDay.addDays("2028-02-28", 1), "2028-02-29", "2028 is a leap year");
  assert.strictEqual(SparkDay.addDays("2026-03-08", -1), "2026-03-07", "across spring-forward");
});

test("daysBetween is signed and symmetric", function() {
  assert.strictEqual(SparkDay.daysBetween("2026-09-10", "2026-09-03"), -7);
  assert.strictEqual(SparkDay.daysBetween("2026-09-03", "2026-09-10"), 7);
  assert.strictEqual(SparkDay.daysBetween("2026-09-03", "2026-09-03"), 0);
});

// --- Robustness -----------------------------------------------------------

test("a stored day-string is never re-parsed through an instant", function() {
  // `new Date("2026-08-31")` is UTC midnight, which in any negative-offset
  // zone reads back as the 30th. Round-tripping a stored day through a Date
  // shifted it backwards and turned a one-day streak gap into two, firing
  // the streak freeze on a day the user had not actually missed.
  assert.strictEqual(SparkDay.toISO("2026-08-31"), "2026-08-31");
  assert.strictEqual(SparkDay.daysBetween("2026-08-31", "2026-09-01"), 1);
  assert.strictEqual(SparkDay.toISO(SparkDay.toISO("2026-08-31")), "2026-08-31", "idempotent");
  // A full instant still converts to the local day it falls in.
  assert.strictEqual(SparkDay.toISO("2026-09-01T02:30:00.000Z"), "2026-08-31", "02:30 UTC is the previous evening at UTC-7");
});

test("legacy and malformed values are handled, not thrown on", function() {
  // Older saves stored Date.toDateString() output.
  assert.strictEqual(SparkDay.toISO("Wed Sep 02 2026"), "2026-09-02");
  assert.strictEqual(SparkDay.toISO("not a date"), null);
  assert.strictEqual(SparkDay.toISO(null), SparkDay.today(), "null means now");
  assert.strictEqual(SparkDay.daysBetween("garbage", "2026-01-01"), null);
  assert.strictEqual(SparkDay.addDays("garbage", 1), null);
});

test("today() is a well-formed local day", function() {
  var t = SparkDay.today();
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(t), "shape is YYYY-MM-DD");
  var now = new Date();
  assert.strictEqual(
    t,
    now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0")
  );
});

// --- No day-boundary logic reaches for the UTC day any more ---------------

test("no loaded source derives a day from toISOString", function() {
  var fs = require("fs");
  var path = require("path");
  var root = path.resolve(__dirname, "..");
  var indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  var offenders = [];

  function walk(dir) {
    fs.readdirSync(dir).forEach(function (entry) {
      var full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) return walk(full);
      if (!/\.js$/.test(full) || /\.generated\.js$/.test(full)) return;
      var rel = path.relative(root, full).split(path.sep).join("/");
      if (rel === "js/utils/day.js" || rel === "js/spark-highway.js") return;
      if (indexHtml.indexOf(rel) === -1) return; // only code the app loads
      var src = fs.readFileSync(full, "utf8");
      if (/toISOString\(\)\s*\.\s*(?:split\(\s*["']T["']\s*\)\s*\[0\]|slice\(\s*0\s*,\s*10\s*\))/.test(src)) {
        offenders.push(rel);
      }
    });
  }
  walk(path.join(root, "js"));

  assert.deepStrictEqual(
    offenders,
    [],
    "these derive a calendar day from the UTC date — use SparkDay instead: " + offenders.join(", ")
  );
});

console.log("PASS: day boundaries are local, DST-safe, and UTC-free (" + passed + " checks, TZ=" + process.env.TZ + ")");
