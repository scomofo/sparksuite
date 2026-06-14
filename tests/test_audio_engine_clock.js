// Regression tests for the SparkAudioEngine master clock:
//  - stop() must detach the old source's onended so a stale ended event from a
//    replaced source cannot flip _playing=false on the live source (which would
//    freeze getTimeSec and fire a spurious track-ended). [bug #3]
//  - setSpeed() must re-anchor the clock so position does not jump on a rate change.
var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) { return fs.readFileSync(path.join(__dirname, "..", file), "utf8"); }

function makeCtx() {
  return {
    currentTime: 0,
    state: "running",
    destination: {},
    createGain: function() { return { connect: function() {}, gain: { value: 1 } }; },
    createBufferSource: function() {
      return {
        buffer: null,
        playbackRate: { value: 1 },
        onended: null,
        connect: function() {},
        disconnect: function() {},
        start: function() {},
        stop: function() {}
      };
    }
  };
}

function setup() {
  global.window = global;
  var ctx = makeCtx();
  global.window.AudioContext = function() { return ctx; };
  global.window.webkitAudioContext = global.window.AudioContext;
  eval(loadJS("js/sparksuite/audio/audio_engine.js"));
  return { Engine: global.window.SparkAudioEngine, ctx: ctx };
}

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (err) { console.error("  FAIL: " + name); console.error("    " + err.message); process.exitCode = 1; }
}

console.log("\n--- AudioEngine master clock ---");

test("stop() nulls the old source's onended so a stale ended cannot freeze the clock", function() {
  var s = setup();
  var eng = new s.Engine();
  eng.buffer = {};
  eng.play(0);
  var firstSource = eng.source;
  assert.ok(firstSource && eng.isPlaying());

  eng.play(2); // replay -> stop() then new source
  var secondSource = eng.source;
  assert.notStrictEqual(firstSource, secondSource, "a new source should be created on replay");
  assert.strictEqual(firstSource.onended, null, "the replaced source's ended handler must be detached");
  assert.strictEqual(eng.isPlaying(), true, "engine should still be playing the new source");
});

test("a natural end-of-buffer still fires onEnded and marks not-playing", function() {
  var s = setup();
  var eng = new s.Engine();
  eng.buffer = {};
  var ended = false;
  eng._onEnded = function() { ended = true; };
  eng.play(0);
  // Natural completion: the source was NOT stopped, so its onended is intact and fires.
  assert.strictEqual(typeof eng.source.onended, "function");
  eng.source.onended();
  assert.strictEqual(eng.isPlaying(), false);
  assert.strictEqual(ended, true);
});

test("setSpeed re-anchors the clock so position does not jump, then advances at the new rate", function() {
  var s = setup();
  var eng = new s.Engine();
  eng.buffer = {};
  s.ctx.currentTime = 0;
  eng.play(0);
  s.ctx.currentTime = 4; // 4s real at speed 1.0 -> position ~4s
  var posBefore = eng.getTimeSec();
  eng.setSpeed(0.5);
  var posAfter = eng.getTimeSec();
  assert.ok(Math.abs(posAfter - posBefore) < 1e-9, "position must not jump when speed changes");
  assert.strictEqual(eng.source.playbackRate.value, 0.5);
  s.ctx.currentTime = 6; // +2s real at 0.5x -> +1s playback
  assert.ok(Math.abs(eng.getTimeSec() - (posAfter + 1)) < 1e-9, "clock should advance at the new rate");
});
