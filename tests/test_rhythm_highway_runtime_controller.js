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

var nextRafId = 1;
var rafCallbacks = {};
global.requestAnimationFrame = function(callback) {
  var id = nextRafId++;
  rafCallbacks[id] = callback;
  return id;
};
global.cancelAnimationFrame = function(id) {
  delete rafCallbacks[id];
};

function flushRaf(ms) {
  performance._t += ms || 16;
  var ids = Object.keys(rafCallbacks);
  ids.forEach(function(id) {
    var callback = rafCallbacks[id];
    delete rafCallbacks[id];
    callback(performance._t);
  });
}

eval(loadJS('js/sparksuite/core/timing_core.js'));
eval(loadJS('js/sparksuite/core/transport_engine.js'));
eval(loadJS('js/sparksuite/core/caption_sync_engine.js'));
eval(loadJS('js/sparksuite/core/runtime_sync_engine.js'));
eval(loadJS('js/sparksuite/core/metronome_runtime_adapter.js'));
eval(loadJS('js/sparksuite/core/waveform_runtime_adapter.js'));
eval(loadJS('js/sparksuite/core/rhythm_runtime_bridge.js'));
eval(loadJS('js/sparksuite/core/rhythm_highway_runtime_controller.js'));

function test(name, fn) {
  try {
    rafCallbacks = {};
    performance._t = 0;
    fn();
    console.log('PASS:', name);
  } catch (err) {
    console.error('FAIL:', name);
    console.error(err.message);
    process.exitCode = 1;
  }
}

test('loads and plays through rhythm runtime bridge', function() {
  var renders = 0;
  var controller = new SparkRhythmHighwayRuntimeController({
    bridgeOptions: { runtime: { timingCore: new SparkTimingCore() } },
    onRender: function() { renders += 1; }
  });

  var loaded = controller.load({ chartId: 'chart_01' }, { durationSec: 5 });
  assert.strictEqual(loaded.status, 'ready');

  var playing = controller.play();
  assert.strictEqual(playing.status, 'running');

  flushRaf(100);
  assert.ok(renders > 0);
});

test('pause cancels active frame lifecycle', function() {
  var controller = new SparkRhythmHighwayRuntimeController({
    bridgeOptions: { runtime: { timingCore: new SparkTimingCore() } }
  });

  controller.load({ chartId: 'chart_01' }, { durationSec: 5 });
  controller.play();
  assert.ok(controller.raf);

  var paused = controller.pause();
  assert.strictEqual(paused.status, 'paused');
  assert.strictEqual(controller.raf, null);
});

test('seek delegates to runtime bridge', function() {
  var controller = new SparkRhythmHighwayRuntimeController({
    bridgeOptions: { runtime: { timingCore: new SparkTimingCore() } }
  });

  controller.load({ chartId: 'chart_01' }, { durationSec: 5 });
  var state = controller.seek(2.5);

  assert.strictEqual(state.transport.positionSec, 2.5);
});

test('finalize callback fires when transport completes', function() {
  var finalized = false;
  var controller = new SparkRhythmHighwayRuntimeController({
    bridgeOptions: { runtime: { timingCore: new SparkTimingCore() } },
    onFinalize: function() { finalized = true; }
  });

  controller.load({ chartId: 'chart_01' }, { durationSec: 0.1 });
  controller.play();
  flushRaf(250);

  assert.strictEqual(finalized, true);
  assert.strictEqual(controller.running, false);
});

test('destroy cleans up runtime controller state', function() {
  var controller = new SparkRhythmHighwayRuntimeController({
    bridgeOptions: { runtime: { timingCore: new SparkTimingCore() } }
  });

  controller.load({ chartId: 'chart_01' }, { durationSec: 5 });
  controller.play();
  assert.ok(controller.raf);

  controller.destroy();
  assert.strictEqual(controller.running, false);
  assert.strictEqual(controller.raf, null);
});
