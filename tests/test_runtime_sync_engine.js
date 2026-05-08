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
eval(loadJS('js/sparksuite/core/caption_sync_engine.js'));
eval(loadJS('js/sparksuite/core/runtime_sync_engine.js'));

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

function createRuntime() {
  return new SparkRuntimeSyncEngine({
    timingCore: new SparkTimingCore(),
    captions: { preloadSec: 2 }
  });
}

test('loads transport and caption state together', function() {
  var runtime = createRuntime();

  var state = runtime.load({
    id: 'lesson_01',
    durationSec: 30,
    beatGrid: { bpm: 100, time_signature: '4/4' },
    captions: [
      { id: 'a', startSec: 0, endSec: 1, text: 'Start' },
      { id: 'b', startSec: 1, endSec: 2, text: 'Next' }
    ]
  });

  assert.strictEqual(state.status, 'ready');
  assert.strictEqual(state.transport.durationSec, 30);
  assert.strictEqual(state.captions.cueCount, 2);
});

test('play and tick propagate transport into captions', function() {
  var runtime = createRuntime();

  runtime.load({
    durationSec: 10,
    captions: [
      { id: 'a', startSec: 0, endSec: 1, text: 'One' },
      { id: 'b', startSec: 1, endSec: 2, text: 'Two' }
    ]
  });

  runtime.play();
  performance._t += 1100;
  var state = runtime.tick();

  assert.strictEqual(state.status, 'running');
  assert.strictEqual(state.captions.activeText, 'Two');
});

test('seek updates runtime caption state', function() {
  var runtime = createRuntime();

  runtime.load({
    durationSec: 10,
    captions: [
      { id: 'a', startSec: 0, endSec: 1, text: 'One' },
      { id: 'b', startSec: 3, endSec: 4, text: 'Four' }
    ]
  });

  var state = runtime.seek(3.25);

  assert.strictEqual(state.transport.positionSec, 3.25);
  assert.strictEqual(state.captions.activeText, 'Four');
});

test('subscribers receive runtime state changes', function() {
  var runtime = createRuntime();
  var reasons = [];

  runtime.subscribe(function(state) {
    reasons.push(state.reason);
  });

  runtime.load({ durationSec: 5 });
  runtime.play();
  runtime.pause();

  assert.deepStrictEqual(reasons.slice(0, 3), ['load', 'play', 'pause']);
});

test('bound adapters receive runtime updates on tick', function() {
  var runtime = createRuntime();
  var received = null;

  runtime.bind('test_adapter', {
    update: function(state) {
      received = state;
    }
  });

  runtime.load({ durationSec: 5 });
  runtime.play();
  performance._t += 250;
  runtime.tick();

  assert.ok(received);
  assert.ok(received.transport.positionSec >= 0.24);
});
