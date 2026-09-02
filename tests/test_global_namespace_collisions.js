/*
 * Instrument modules must not overwrite shared globals.
 *
 * js/instruments/piano/app.js exports helpers onto window so piano's pages can
 * reach them. Those scripts are deferred, so they execute AFTER every normal
 * <script> — meaning an un-namespaced export silently replaces the shared
 * implementation, for every user, whatever instrument they picked.
 *
 * That is what happened to checkLevelUp: piano's advances the per-instrument
 * curriculum level (S.level, capped at 8) while js/meta/levels.js owns a
 * different checkLevelUp that advances the suite player level from the XP
 * curve. Piano's won, so awardXP() and the progression cascade stopped
 * advancing S.playerLevel entirely.
 *
 * This test compares piano's bare-name window exports against the globals
 * defined by non-instrument code and fails on any overlap.
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..");
var passed = 0;
function test(name, fn) {
  try { fn(); console.log("  PASS " + name); passed++; }
  catch (e) { console.error("  FAIL " + name + ": " + (e && e.message)); process.exitCode = 1; }
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

var pianoApp = read("js/instruments/piano/app.js");

/*
 * Piano's own guarded re-exports are fine and deliberately excluded:
 *   window.X = typeof X !== "undefined" ? X : window.X;
 * only ever re-assigns the value already visible, so it cannot clobber.
 * Unguarded exports are the hazard.
 */
function unguardedExports(src) {
  var names = [];
  var re = /^window\.([A-Za-z0-9_]+)\s*=\s*(.*)$/gm;
  var m;
  while ((m = re.exec(src))) {
    if (/typeof\s+[A-Za-z0-9_]+\s*!==\s*["']undefined["']\s*\?/.test(m[2])) continue;
    names.push(m[1]);
  }
  return names;
}

// Globals owned by shared, non-instrument code.
var SHARED_FILES = [
  "js/meta/levels.js", "js/meta/xp.js", "js/meta/achievements.js",
  "js/ui.js", "js/state.js", "js/audio.js", "js/data.js",
  "js/utils/day.js", "js/utils/mastery.js", "js/utils/instrument_progress.js",
  "js/progression/mastery.js", "js/progression/unlocks.js", "js/meta/skill_tree_meta.js"
];

var sharedGlobals = {};
SHARED_FILES.forEach(function (rel) {
  var src = read(rel);
  var re = /window\.([A-Za-z0-9_]+)\s*=/g;
  var m;
  while ((m = re.exec(src))) {
    if (!sharedGlobals[m[1]]) sharedGlobals[m[1]] = rel;
  }
});

test("piano does not overwrite any shared global", function() {
  var collisions = unguardedExports(pianoApp)
    .filter(function (n) { return Object.prototype.hasOwnProperty.call(sharedGlobals, n); })
    .map(function (n) { return n + " (shared owner: " + sharedGlobals[n] + ")"; });
  assert.deepStrictEqual(
    collisions,
    [],
    "piano exports these under names shared code already owns; because piano loads " +
      "deferred, piano's version wins for every user. Namespace them (pianoX): " +
      collisions.join(", ")
  );
});

test("piano's level-up helper is namespaced", function() {
  assert.ok(
    /window\.pianoCheckLevelUp\s*=/.test(pianoApp),
    "piano's curriculum level-up must export as pianoCheckLevelUp"
  );
  assert.ok(
    !/^window\.checkLevelUp\s*=/m.test(pianoApp),
    "piano must not export the bare checkLevelUp — js/meta/levels.js owns that name"
  );
});

test("the suite level-up rule is the one js/meta/levels.js defines", function() {
  var levels = read("js/meta/levels.js");
  assert.ok(/window\.checkLevelUp\s*=\s*checkLevelUp/.test(levels));
  assert.ok(
    /S\.playerXP\s*>=\s*nextXP/.test(levels),
    "the suite rule advances S.playerLevel from the S.playerXP curve"
  );
});

test("the two level rules stay on separate fields", function() {
  var levels = read("js/meta/levels.js");
  assert.ok(!/\bS\.level\b/.test(levels), "the suite rule must not touch S.level");
  var pianoRule = pianoApp.slice(pianoApp.indexOf("function checkLevelUp()"));
  pianoRule = pianoRule.slice(0, pianoRule.indexOf("\n}"));
  assert.ok(/S\.level/.test(pianoRule), "piano's rule advances the per-instrument S.level");
  assert.ok(!/S\.playerLevel/.test(pianoRule), "piano's rule must not touch the suite level");
});

test("the progression cascade calls the suite rule", function() {
  var orch = read("js/sparksuite/core/progress_orchestrator.js");
  var idx = orch.indexOf("checkLevelUp()");
  assert.ok(idx > -1, "the cascade still calls checkLevelUp");
  var around = orch.slice(Math.max(0, idx - 300), idx + 300);
  assert.ok(
    /S\.playerLevel/.test(around),
    "the cascade brackets the call with S.playerLevel checks, so it expects the suite rule"
  );
});

console.log("PASS: instrument modules do not clobber shared globals (" + passed + " checks)");
