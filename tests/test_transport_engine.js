var assert = require('assert');
var fs = require('fs');
var path = require('path');

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

global.window = global;
global.performance = {
  _t: 0,
  now: function() { return this._t; }
};

eval(loadJS('js/sparksuite/core/timing_core.js'));
eval(loadJS('js/sparksuite/core/transport_engine.js'));

function test(name, fn) {
  try {
    fn();
    console.log('PASS:', name);
  } catch (err) {
    console.error('FAIL:', name);
    console.error(err.message);
    process.exitCode = 1;
  }
}

var timingCore = new SparkTimingCore();

function createEngine() {
  return new SparkTransportEngine({ timingCore: timingCore });
}

test('loads transport sources with lesson timing metadata', function() {
  var engine = createEngine();
  var snapshot = engine.load({
    id: 'lesson_01',
    manifest: {
      lesson_id: 'lesson_01',
      duration_s: 120,
      tempo_bpm: 100,
      time_signature: '4/4'
    }
  });

  assert.strictEqual(snapshot.status, 'ready');
  assert.strictEqual(snapshot.durationSec, 120);
  assert.strictEqual(snapshot.beatGrid.bpm, 100);
});

test('transport advances while running', function() {
  var engine = createEngine();
  engine.load({ durationSec: 30 });
  engine.play();

  performance._t += 500;
  var snapshot = engine.tick();

  assert.ok(snapshot.positionSec >= 0.49);
  assert.strictEqual(snapshot.status, 'running');
});

test('transport pauses without losing position', function() {
  var engine = createEngine();
  engine.load({ durationSec: 30 });
  engine.play();

  performance._t += 1000;
  engine.tick();
  var paused = engine.pause();
  var pausedPosition = paused.positionSec;

  performance._t += 1000;
  var snapshot = engine.tick();

  assert.strictEqual(snapshot.positionSec, pausedPosition);
  assert.strictEqual(snapshot.status, 'paused');
});

test('transport seeks correctly', function() {
  var engine = createEngine();
  engine.load({ durationSec: 60 });
  var snapshot = engine.seek(12.5);

  assert.strictEqual(snapshot.positionSec, 12.5);
  assert.strictEqual(snapshot.positionMs, 12500);
});

test('transport emits cue windows from timing core', function() {
  var engine = createEngine();
  engine.load({
    durationSec: 60,
    cues: [
      { id: 'count_in', timeSec: 0.05 },
      { id: 'late', timeSec: 5 }
    ]
  });

  engine.play();
  var cues = engine.getDueCues({ lookaheadSec: 0.1 });

  assert.strictEqual(cues.length, 1);
  assert.strictEqual(cues[0].id, 'count_in');
});
