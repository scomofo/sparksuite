var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
require("../js/sparksuite/core/feel_system.js");
var Feel = window.SparkFeelSystem;

console.log("=== Feel System Tests ===");

test("timing constants defined", function() {
  assert.strictEqual(Feel.timing.FAST, 120);
  assert.strictEqual(Feel.timing.MED, 180);
  assert.strictEqual(Feel.timing.SLOW, 240);
});

test("judge returns perfect for small delta", function() {
  assert.strictEqual(Feel.judge(10), "perfect");
  assert.strictEqual(Feel.judge(-10), "perfect");
});

test("judge returns good for medium delta", function() {
  assert.strictEqual(Feel.judge(50), "good");
  assert.strictEqual(Feel.judge(-50), "good");
});

test("judge returns miss for large delta", function() {
  assert.strictEqual(Feel.judge(100), "miss");
});

test("judge applies input offset", function() {
  // With INPUT_OFFSET_MS = -15, a raw delta of 40 becomes 25 (perfect)
  assert.strictEqual(Feel.judge(40), "perfect");
});

test("hit animation values defined", function() {
  assert.strictEqual(Feel.hitAnimation.perfect.scale, 1.15);
  assert.strictEqual(Feel.hitAnimation.miss.shake, 6);
});

test("typography scale defined", function() {
  assert.strictEqual(Feel.typography.h1, 28);
  assert.strictEqual(Feel.typography.caption, 13);
});

test("spacing system defined", function() {
  assert.deepStrictEqual(Feel.spacing, [4, 8, 16, 24, 32]);
});

test("audio feedback events defined", function() {
  assert.strictEqual(Feel.audio.hit_perfect, "tick_soft");
  assert.strictEqual(Feel.audio.miss, "tap_low");
});

test("results animation values defined", function() {
  assert.strictEqual(Feel.results.starStagger, 120);
  assert.strictEqual(Feel.results.countUpDuration, 800);
});

test("frame timing constants defined", function() {
  assert.strictEqual(Feel.frame.TARGET_FPS, 60);
  assert.strictEqual(Feel.frame.FRAME_TIME, 16.67);
});

test("easing curve defined", function() {
  assert.strictEqual(Feel.easing, "cubic-bezier(0.22, 1, 0.36, 1)");
});

test("lane flash values defined", function() {
  assert.strictEqual(Feel.laneFlash.opacity, 0.2);
  assert.strictEqual(Feel.laneFlash.duration, 100);
});

test("transition values defined", function() {
  assert.strictEqual(Feel.transition.screen.scale, 0.98);
  assert.strictEqual(Feel.transition.button.scale, 0.96);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
