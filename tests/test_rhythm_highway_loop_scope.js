/*
 * The rhythm highway "loop window" is a player-selected tick range that slices
 * the chart down to a section they want to drill. It is stored in
 * S.rhythmHighwayLoop and survives across launches.
 *
 * It used to be resolved as:
 *
 *   var resolvedLoopSpec = launchContext.loopSpec || S.rhythmHighwayLoop || null;
 *
 * which cannot express "no loop" — a null loopSpec falls straight through to the
 * stored window. startRhythmHighwaySegment ALWAYS sends `loopSpec: loopSpec || null`,
 * so any caller that omitted a loop silently inherited the previous run's range and
 * buildRhythmHighwayLoopPayload sliced the NEW chart with it. Picking a different
 * segment from the plan played it as an unrelated fragment.
 *
 * The loop is now per-launch: an explicitly present loopSpec is honoured literally.
 * That makes the direction of every call site load-bearing, because a caller that
 * passes nothing now gets NO loop — so the sites that legitimately keep the loop
 * (relaunching the SAME segment) must pass it, and this file pins both directions.
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..");
function read(rel) { return fs.readFileSync(path.join(repoRoot, rel), "utf8"); }
function strip(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/[^\n]*/gm, "");
}

var passed = 0;
function test(name, fn) {
  try { fn(); console.log("  PASS " + name); passed++; }
  catch (e) { console.error("  FAIL " + name + ": " + (e && e.message)); process.exitCode = 1; }
}

var highwaySrc = read("js/pages/rhythm_highway.js");
var studioSrc = strip(read("js/actions/studio_family.js"));

// Lift the real resolution statement out of source so these cannot drift from it.
function resolutionStatement() {
  var lines = highwaySrc.split("\n");
  var start = -1;
  for (var i = 0; i < lines.length; i++) {
    if (/var resolvedLoopSpec = /.test(lines[i])) { start = i; break; }
  }
  assert.ok(start > -1, "could not find the loop resolution in js/pages/rhythm_highway.js");
  var stmt = [];
  for (var j = start; j < lines.length; j++) {
    stmt.push(lines[j]);
    if (/;\s*$/.test(lines[j])) break;
  }
  return stmt.join("\n");
}
var RESOLVE = resolutionStatement();

function resolve(launchContext, storedLoop) {
  return new Function("launchContext", "S", RESOLVE + "; return resolvedLoopSpec;")(
    launchContext, { rhythmHighwayLoop: storedLoop || null }
  );
}

var STORED = { startTick: 0, endTick: 480, label: "bars 1-2 of the previous segment" };

// --- The resolution itself ------------------------------------------------

test("an explicit null means no loop, even with one stored", function () {
  assert.strictEqual(resolve({ loopSpec: null }, STORED), null,
    "this is what startRhythmHighwaySegment sends when the caller passes no loop");
});

test("an explicit loop is used", function () {
  var wanted = { startTick: 200, endTick: 400, label: "requested" };
  assert.strictEqual(resolve({ loopSpec: wanted }, STORED), wanted);
});

test("omitting the property entirely still falls back to the stored window", function () {
  assert.strictEqual(resolve({ source: "somewhere" }, STORED), STORED,
    "callers that never mention a loop keep the old behaviour");
});

test("nothing stored and nothing passed is still no loop", function () {
  assert.strictEqual(resolve({ loopSpec: null }, null), null);
  assert.strictEqual(resolve({}, null), null);
});

// --- The bug this fixes ---------------------------------------------------

test("picking a different segment does not inherit the previous loop", function () {
  // exactly what startRhythmHighwaySegment(segmentId, preset) builds
  var ctx = { segmentId: "segment-B", loopSpec: null, source: "core_segment", label: "Segment B" };
  assert.strictEqual(resolve(ctx, STORED), null,
    "Segment B must not be sliced by the range the player set on Segment A");
});

test("startRhythmHighwaySegment always sends the property, so its argument decides", function () {
  var seg = highwaySrc.slice(highwaySrc.indexOf("function startRhythmHighwaySegment"));
  seg = seg.slice(0, seg.indexOf("\n  }") + 4);
  assert.ok(/loopSpec: loopSpec \|\| null/.test(seg),
    "the property must always be present, or omitting a loop would fall back to the stored one");
});

// --- Call sites that must KEEP the loop -----------------------------------

test("changing the assist preset keeps the loop on the same segment", function () {
  var branch = studioSrc.slice(studioSrc.indexOf('a === "rhythmHighwayPreset"'));
  branch = branch.slice(0, branch.indexOf("\n    }") + 6);
  assert.ok(
    /startRhythmHighwaySegment\(S\.activeCoreSegmentId,\s*nextPreset,\s*S\.rhythmHighwayLoop\)/.test(branch),
    "this relaunches the SAME segment, so the player's loop must be passed through — " +
      "since the loop is no longer inherited, omitting it would silently drop their selection"
  );
});

test("restarting keeps the loop", function () {
  var branch = studioSrc.slice(studioSrc.indexOf('a === "restartRhythmHighway"'));
  branch = branch.slice(0, branch.indexOf("\n    }") + 6);
  assert.ok(/startRhythmHighwaySegment\([^)]*S\.rhythmHighwayLoop\)/.test(branch));
});

test("setting a loop window applies it", function () {
  var branch = studioSrc.slice(studioSrc.indexOf('a === "rhythmHighwayLoopWindow"'));
  branch = branch.slice(0, branch.indexOf("\n    }") + 6);
  assert.ok(/startRhythmHighwaySegment\([^)]*loopSpec\)/.test(branch));
});

// --- Call sites that must NOT keep the loop -------------------------------

test("clearing the loop actually clears it", function () {
  var branch = studioSrc.slice(studioSrc.indexOf('a === "rhythmHighwayClearLoop"'));
  branch = branch.slice(0, branch.indexOf("\n    }") + 6);
  assert.ok(/startRhythmHighwaySegment\([^)]*null\)/.test(branch), "must pass an explicit null");
  assert.strictEqual(resolve({ loopSpec: null }, STORED), null,
    "and that null must now win even if the stored value has not been cleared yet");
});

test("a module exercise does not inherit a loop from a different exercise", function () {
  var branch = studioSrc.slice(studioSrc.indexOf('a === "planStartModuleExercise"'));
  branch = branch.slice(0, branch.indexOf("\n    }") + 6);
  assert.ok(/loopSpec: null/.test(branch),
    "this calls startRhythmHighwayPayload directly, so it must set the property itself — " +
      "omitting it falls back to the stored window");
});

test("the engine-tier adapter sets the property rather than mutating stored state", function () {
  var body = strip(highwaySrc).slice(strip(highwaySrc).indexOf("function startPlayableRhythmHighwayPayload"));
  body = body.slice(0, body.indexOf("\n  }") + 4);
  assert.ok(/launchContext\.loopSpec = null/.test(body),
    "a per-call property is the fix; clearing S.rhythmHighwayLoop was a workaround");
  assert.strictEqual(/S\.rhythmHighwayLoop = null/.test(body), false,
    "the adapter must no longer reach into stored state");
  assert.ok(/hasOwnProperty\.call\(launchContext, "loopSpec"\)/.test(body),
    "a caller that supplied its own loopSpec must keep it");
});

console.log("PASS: rhythm highway loop is per-launch, never inherited (" + passed + " checks)");
