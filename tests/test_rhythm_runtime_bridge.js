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
eval(loadJS('js/sparksuite/core/metronome_runtime_adapter.js'));
eval(loadJS('js/sparksuite/core/waveform_runtime_adapter.js'));
eval(loadJS('js/sparksuite/core/rhythm_runtime_bridge.js'));

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

function createGameplayStub() {
  return {
    bound: false,
    unbound: false,
    updates: 0,
    bindRuntimeSync: function(runtimeSync) {
      this.bound = true;
      var self = this;
      return runtimeSync.bind('gameplay_stub', {
        update: function() {
          self.updates += 1;
        }
      });
    },
    unbindRuntimeSync: function() {
      this.unbound = true;
    }
  };
}

test('loads a rhythm runtime payload and exposes runtime state', function() {
  var bridge = new SparkRhythmRuntimeBridge({
    runtime: { timingCore: new SparkTimingCore() }
  });

  var state = bridge.load({ chartId: 'chart_01' }, {
    durationSec: 30,
    beatGrid: { bpm: 120, time_signature: '4/4' },
    captions: [{ id: 'c1', startSec: 0, endSec: 1, text: 'Count' }]
  });

  assert.strictEqual(state.status, 'ready');
  assert.strictEqual(state.transport.durationSec, 30);
  assert.strictEqual(state.captions.cueCount, 1);
});

test('binds gameplay, metronome, and waveform adapters', function() {
  var gameplay = createGameplayStub();
  var bridge = new SparkRhythmRuntimeBridge({
    runtime: { timingCore: new SparkTimingCore() },
    gameplay: gameplay,
    metronome: new SparkMetronomeRuntimeAdapter({ lookaheadSec: 0.25 }),
    waveform: new SparkWaveformRuntimeAdapter({ windowSec: 8 })
  });

  bridge.load({ chartId: 'chart_01' }, {
    durationSec: 10,
    beatGrid: { bpm: 120, time_signature: '4/4' }
  });
  bridge.play();
  performance._t += 250;
  bridge.tick();

  assert.strictEqual(gameplay.bound, true);
  assert.ok(gameplay.updates > 0);
  assert.ok(bridge.metronome.getEvents().length > 0);
  assert.ok(bridge.waveform.getState().positionSec >= 0.24);
});

test('supports lifecycle delegation', function() {
  var bridge = new SparkRhythmRuntimeBridge({
    runtime: { timingCore: new SparkTimingCore() }
  });

  bridge.load({ chartId: 'chart_01' }, { durationSec: 10 });
  assert.strictEqual(bridge.play().status, 'running');
  assert.strictEqual(bridge.pause().status, 'paused');
  assert.strictEqual(bridge.seek(4).transport.positionSec, 4);
  assert.strictEqual(bridge.stop().status, 'stopped');
});

test('destroy unbinds adapters', function() {
  var gameplay = createGameplayStub();
  var bridge = new SparkRhythmRuntimeBridge({
    runtime: { timingCore: new SparkTimingCore() },
    gameplay: gameplay
  });

  bridge.load({ chartId: 'chart_01' }, { durationSec: 10 });
  bridge.destroy();

  assert.strictEqual(gameplay.unbound, true);
});
