var assert = require('assert');
var fs = require('fs');
var path = require('path');

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

function loadVM(file) {
  var full = path.join(__dirname, '..', file);
  require('vm').runInThisContext(fs.readFileSync(full, 'utf8'), { filename: full });
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
eval(loadJS('js/sparksuite/core/waveform_runtime_adapter.js'));

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
  return new SparkRuntimeSyncEngine({ timingCore: new SparkTimingCore() });
}

test('creates waveform viewport state from transport', function() {
  var waveform = new SparkWaveformRuntimeAdapter({ windowSec: 8, leadSec: 2 });
  var state = waveform.update({
    transport: { status: 'running', positionSec: 5, durationSec: 60 }
  });

  assert.strictEqual(state.status, 'running');
  assert.strictEqual(state.positionSec, 5);
  assert.strictEqual(state.windowStartSec, 3);
  assert.strictEqual(state.windowEndSec, 11);
  assert.ok(state.cursorRatio > 0);
});

test('clamps viewport near start of track', function() {
  var waveform = new SparkWaveformRuntimeAdapter({ windowSec: 8, leadSec: 2 });
  var state = waveform.update({
    transport: { positionSec: 1, durationSec: 60 }
  });

  assert.strictEqual(state.windowStartSec, 0);
  assert.strictEqual(state.windowEndSec, 8);
});

test('clamps viewport near end of track', function() {
  var waveform = new SparkWaveformRuntimeAdapter({ windowSec: 8, leadSec: 2 });
  var state = waveform.update({
    transport: { positionSec: 59, durationSec: 60 }
  });

  assert.strictEqual(state.windowStartSec, 52);
  assert.strictEqual(state.windowEndSec, 60);
});

test('applies zoom to visible window length', function() {
  var waveform = new SparkWaveformRuntimeAdapter({ windowSec: 8, leadSec: 0, zoom: 2 });
  var state = waveform.update({
    transport: { positionSec: 10, durationSec: 60 }
  });

  assert.strictEqual(state.windowSec, 4);
  assert.strictEqual(state.windowEndSec - state.windowStartSec, 4);
});

test('binds to RuntimeSyncEngine ticks', function() {
  var runtime = createRuntime();
  var waveform = new SparkWaveformRuntimeAdapter({ windowSec: 8, leadSec: 2 });

  waveform.bindRuntimeSync(runtime);
  runtime.load({ durationSec: 20, beatGrid: { bpm: 120, time_signature: '4/4' } });
  runtime.play();

  performance._t += 1000;
  runtime.tick();

  var state = waveform.getState();
  assert.ok(state.positionSec >= 0.99);
  assert.strictEqual(state.durationSec, 20);
});

test('retains loaded waveform data in runtime state', function() {
  var waveform = new SparkWaveformRuntimeAdapter({ windowSec: 8 });
  waveform.loadWaveform({ peaks: [0, 0.5, 1], sampleRate: 44100 });
  var state = waveform.update({
    transport: { positionSec: 2, durationSec: 10 }
  });

  assert.deepStrictEqual(state.waveform.peaks, [0, 0.5, 1]);
});
