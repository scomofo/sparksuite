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

global.SparkCalibrationEngine = function() {};
global.SparkCalibrationEngine.prototype.applyOffsetSec = function(value) { return value; };

global.SparkTimingEngine = function() {};
global.SparkTimingEngine.prototype.tickToSeconds = function(tempoMap, tick) {
  return tempoMap && typeof tempoMap.tickToSeconds === 'function' ? tempoMap.tickToSeconds(tick) : tick / 1000;
};

global.SparkEnginePresetRegistry = {
  get: function() {
    return { hitWindowMs: { miss: 100 } };
  }
};

global.SparkInputJudge = function() {};
global.SparkInputJudge.prototype.resolve = function() {
  return { note: null, judgement: 'miss', reason: 'none' };
};

global.SparkScoringEngine = function() {};
global.SparkScoringEngine.prototype.apply = function() { return { scoreDelta: 0 }; };
global.SparkScoringEngine.prototype.toSummary = function() {
  return {
    gameplay: { score: 0, accuracy: 0, maxCombo: 0 },
    learning: { skillHits: {}, weakReasons: {}, laneErrors: {} }
  };
};

global.SparkReplayEngine = function() {};
global.SparkReplayEngine.prototype.record = function() {};
global.SparkReplayEngine.prototype.export = function() { return []; };

global.SparkGameplayResult = function(value) { return value; };

eval(loadJS('js/sparksuite/core/timing_core.js'));
eval(loadJS('js/sparksuite/core/transport_engine.js'));
eval(loadJS('js/sparksuite/core/caption_sync_engine.js'));
eval(loadJS('js/sparksuite/core/runtime_sync_engine.js'));
eval(loadJS('js/sparksuite/core/rhythm_gameplay_engine.js'));

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

function createChart() {
  return {
    tempoMap: {
      tickToSeconds: function(tick) { return tick / 1000; }
    },
    tracks: {
      guitar: {
        notes: [
          { id: 'n1', tick: 0, tickLength: 0, laneMask: 1, label: 'A' },
          { id: 'n2', tick: 500, tickLength: 0, laneMask: 2, label: 'B' },
          { id: 'n3', tick: 1000, tickLength: 0, laneMask: 4, label: 'C' }
        ]
      }
    }
  };
}

test('rhythm gameplay updates from runtime transport state', function() {
  var engine = new SparkRhythmGameplayEngine({ chart: createChart() });
  var snapshot = engine.updateFromRuntimeState({
    transport: { positionSec: 0.5 }
  });

  assert.strictEqual(snapshot.songTimeSec, 0.5);
  assert.ok(snapshot.notes.length >= 1);
});

test('rhythm gameplay binds to RuntimeSyncEngine updates', function() {
  var runtime = new SparkRuntimeSyncEngine({ timingCore: new SparkTimingCore() });
  var engine = new SparkRhythmGameplayEngine({ chart: createChart() });

  engine.bindRuntimeSync(runtime);
  runtime.load({ durationSec: 5 });
  runtime.play();

  performance._t += 600;
  runtime.tick();

  assert.ok(engine.lastSnapshot);
  assert.ok(engine.lastSnapshot.songTimeSec >= 0.59);
});

test('rhythm gameplay can unbind runtime sync updates', function() {
  var runtime = new SparkRuntimeSyncEngine({ timingCore: new SparkTimingCore() });
  var engine = new SparkRhythmGameplayEngine({ chart: createChart() });

  engine.bindRuntimeSync(runtime);
  engine.unbindRuntimeSync();

  runtime.load({ durationSec: 5 });
  runtime.play();
  performance._t += 600;
  runtime.tick();

  assert.strictEqual(engine.lastSnapshot, null);
});
