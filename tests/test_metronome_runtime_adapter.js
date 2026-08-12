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

test('schedules downbeat and beats from runtime state', function() {
  var metronome = new SparkMetronomeRuntimeAdapter({ lookaheadSec: 1 });
  var events = metronome.update({
    transport: {
      positionSec: 0,
      beatGrid: { secondsPerBeat: 0.5, beatsPerBar: 4 },
      barBeat: { absoluteBeat: 0 }
    }
  });

  assert.ok(events.length >= 2);
  assert.strictEqual(events[0].type, 'downbeat');
  assert.strictEqual(events[1].type, 'beat');
});

test('schedules subdivisions when subdivision is greater than one', function() {
  var metronome = new SparkMetronomeRuntimeAdapter({ lookaheadSec: 0.5, subdivision: 2 });
  var events = metronome.update({
    transport: {
      positionSec: 0,
      beatGrid: { secondsPerBeat: 0.5, beatsPerBar: 4 },
      barBeat: { absoluteBeat: 0 }
    }
  });

  assert.ok(events.some(function(event) { return event.type === 'subdivision'; }));
});

test('does not emit duplicate events across updates', function() {
  var metronome = new SparkMetronomeRuntimeAdapter({ lookaheadSec: 0.1 });
  var state = {
    transport: {
      positionSec: 0,
      beatGrid: { secondsPerBeat: 0.5, beatsPerBar: 4 },
      barBeat: { absoluteBeat: 0 }
    }
  };

  var first = metronome.update(state);
  var second = metronome.update(state);

  assert.ok(first.length > 0);
  assert.strictEqual(second.length, 0);
});

test('binds to RuntimeSyncEngine ticks', function() {
  var runtime = createRuntime();
  var metronome = new SparkMetronomeRuntimeAdapter({ lookaheadSec: 0.25 });

  metronome.bindRuntimeSync(runtime);
  runtime.load({ durationSec: 4, beatGrid: { bpm: 120, time_signature: '4/4' } });
  runtime.play();

  performance._t += 250;
  runtime.tick();

  assert.ok(metronome.getEvents().length > 0);
});

test('can disable scheduling', function() {
  var metronome = new SparkMetronomeRuntimeAdapter({ enabled: false });
  var events = metronome.update({
    transport: {
      positionSec: 0,
      beatGrid: { secondsPerBeat: 0.5, beatsPerBar: 4 },
      barBeat: { absoluteBeat: 0 }
    }
  });

  assert.strictEqual(events.length, 0);
});
