var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;
var tests = [];

function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

function bootstrap() {
  global.window = global;
  loadJS("js/sparksuite/music/chart_types.js");
}

console.log("=== Chart Types Tests ===");

test("play along chart normalizes section start and end fields", function() {
  var chart = new SparkPlayAlongChart({
    sections: [
      { name: "Verse", start: 1200, end: 4200 },
      { name: "Bad", start: 5000, end: 5000 }
    ]
  });

  var sections = chart.getSections();
  assert.strictEqual(sections.length, 1);
  assert.deepStrictEqual(sections[0], {
    name: "Verse",
    startMs: 1200,
    endMs: 4200,
    start: 1200,
    end: 4200
  });
});

test("play along chart timeline exposes timeMs and preserves null lane", function() {
  var chart = new SparkPlayAlongChart({
    songChart: {
      tempoMap: { ppq: 480 },
      tracks: {
        lead: {
          notes: [
            { tick: 480, tickLength: 240, lane: null, label: "Open" },
            { tick: 960, tickLength: 480, lane: 2, label: "Lane 3" }
          ]
        }
      }
    },
    audio: { bpm: 120 }
  });

  var timeline = chart.getTimeline();
  assert.strictEqual(timeline.length, 2);
  assert.strictEqual(timeline[0].time, 500);
  assert.strictEqual(timeline[0].timeMs, 500);
  assert.strictEqual(timeline[0].durationMs, 250);
  assert.strictEqual(timeline[0].lane, null);
  assert.strictEqual(timeline[1].lane, 2);
});

Promise.resolve().then(async function() {
  for (var i = 0; i < tests.length; i++) {
    try {
      bootstrap();
      await tests[i].fn();
      passed++;
      console.log("  PASS: " + tests[i].name);
    } catch (err) {
      failed++;
      console.error("  FAIL: " + tests[i].name + " -- " + err.message);
    }
  }
  console.log("\n" + passed + " passed, " + failed + " failed");
  if (failed > 0) process.exit(1);
}).catch(function(err) {
  console.error(err);
  process.exit(1);
});
