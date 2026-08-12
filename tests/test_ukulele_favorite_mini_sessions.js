var assert = require("assert");
var fs = require("fs");
var path = require("path");

global.window = global;

function loadJS(file) {
  require("vm").runInThisContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), { filename: path.join(__dirname, "..", file) });
}

loadJS("js/sparksuite/instruments/ukulele/ukulele_songs.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_mini_sessions.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_module.js");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

console.log("\n--- Ukulele Favorite Mini Sessions ---");

test("ukulele mini-session builder returns three favorite-based sessions", function() {
  var sessions = SparkUkuleleMiniSessions.buildFromFavorites({
    favorites: ["Riptide", "I'm Yours", "Lava"]
  });

  assert.strictEqual(sessions.length, 3);
  sessions.forEach(function(session) {
    assert.ok(session.id);
    assert.strictEqual(session.instrument, "ukulele");
    assert.strictEqual(session.durationSec, 720);
    assert.ok(session.favoriteSource);
    assert.strictEqual(session.blocks.length, 5);
    assert.strictEqual(session.blocks.reduce(function(total, block) {
      return total + block.durationSec;
    }, 0), 720);
    assert.ok(session.progression.length >= 3);
  });
});

test("favorite mini-sessions include the authored ADHD-friendly set structure", function() {
  var sessions = SparkUkuleleMiniSessions.buildFromFavorites({
    favorites: ["Riptide", "I'm Yours", "Can't Help Falling in Love", "Stand By Me", "Somewhere Over the Rainbow", "Lava"]
  });
  var setA = sessions[0];
  var setB = sessions[1];
  var setC = sessions[2];

  assert.strictEqual(setA.id, "uke_favorites_set_a");
  assert.strictEqual(setA.title, "Set A - Strum Stability");
  assert.deepStrictEqual(setA.songTitles, ["Riptide", "I'm Yours"]);
  assert.strictEqual(setA.blocks[4].type, "record");
  assert.strictEqual(setB.title, "Set B - Smooth Changes");
  assert.deepStrictEqual(setB.songTitles, ["Can't Help Falling in Love", "Stand By Me"]);
  assert.strictEqual(setC.title, "Set C - Melody & Touch");
  assert.deepStrictEqual(setC.songTitles, ["Somewhere Over the Rainbow", "Lava"]);
  assert.ok(setC.blocks.some(function(block) {
    return block.label === "Picking Warm-up" && block.pattern === "T I M R | T I M R";
  }));
});

test("ukulele mini-session builder falls back to familiar repertoire when favorites are empty", function() {
  var sessions = SparkUkuleleMiniSessions.buildFromFavorites({});
  var titles = sessions.map(function(session) { return session.favoriteSource.title; });

  assert.strictEqual(sessions.length, 3);
  assert.ok(titles.indexOf("Somewhere Over the Rainbow") >= 0);
  assert.ok(titles.indexOf("Riptide") >= 0);
  assert.ok(titles.indexOf("Can't Help Falling in Love") >= 0);
});

test("ukulele module exposes favorite mini-sessions", function() {
  var sessions = SparkUkuleleModule.getMiniSessions({ favorites: ["Stand By Me"] });

  assert.strictEqual(sessions.length, 3);
  assert.ok(sessions[0].tags.indexOf("favorites") >= 0);
  assert.ok(sessions[0].blocks[0].label);
});

test("ukulele module exposes printable mini-session one-pagers", function() {
  var pages = SparkUkuleleModule.getMiniSessionPrintables();

  assert.strictEqual(pages.length, 3);
  assert.strictEqual(pages[1].title, "Set B - Smooth Changes");
  assert.strictEqual(pages[1].chordShapes.Em, "0432");
});

test("mini-session builder can convert a set into practice-plan segments", function() {
  var plan = SparkUkuleleMiniSessions.buildPracticePlan({
    miniSessionId: "uke_favorites_set_a",
    favorites: ["Riptide", "I'm Yours"]
  });

  assert.strictEqual(plan.source, "ukulele_favorite_mini_session");
  assert.strictEqual(plan.miniSession.id, "uke_favorites_set_a");
  assert.strictEqual(plan.segments.length, 5);
  assert.strictEqual(plan.exercises.length, 5);
  assert.strictEqual(plan.segments[1].meta.songTitle, "Riptide");
  assert.strictEqual(plan.exercises[4].data.core.mode, "ukulele_favorite_mini_session");
});

test("printable one-pagers include chord shapes, tab guidance, weekly flow, and capture rule", function() {
  var pages = SparkUkuleleMiniSessions.getPrintableOnePagers();
  var setA = pages[0];
  var setC = pages[2];
  var markdown = SparkUkuleleMiniSessions.renderPrintableOnePager("uke_favorites_set_c");

  assert.strictEqual(pages.length, 3);
  assert.strictEqual(setA.title, "Set A - Strum Stability");
  assert.strictEqual(setA.chordShapes.Am, "2000");
  assert.strictEqual(setA.corePattern.strum, "D D U U D U");
  assert.deepStrictEqual(setA.loops[0].progression, ["Am", "G", "C", "F"]);
  assert.strictEqual(setC.pickingPattern.fingers, "T I M R");
  assert.ok(setC.tabs.some(function(tab) {
    return tab.label === "C chord arpeggio" && tab.lines[0].indexOf("A|----3") === 0;
  }));
  assert.deepStrictEqual(SparkUkuleleMiniSessions.getWeeklyFlow(), ["A", "B", "C", "A", "B", "C", "review recordings"]);
  assert.strictEqual(SparkUkuleleMiniSessions.getCaptureRule().songOneSec, 30);
  assert.ok(markdown.indexOf("Set C - Melody & Touch") >= 0);
  assert.ok(markdown.indexOf("A|--3---5---7--") >= 0);
});

if (failed > 0) {
  console.error("\n" + passed + " passed, " + failed + " failed");
  process.exit(1);
}

console.log("\n" + passed + " passed, " + failed + " failed");
