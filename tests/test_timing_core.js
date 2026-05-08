var assert = require('assert');
var fs = require('fs');
var path = require('path');

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

global.window = global;
eval(loadJS('js/sparksuite/core/timing_core.js'));

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

var timing = new SparkTimingCore({
  globalOffsetMs: 10,
  midiOffsetMs: 15,
  micOffsetMs: 20
});

test('creates normalized beat grid metadata', function() {
  var grid = timing.createBeatGrid({ bpm: 120, time_signature: '4/4', downbeats_s: [0, 2, 4] });
  assert.strictEqual(grid.secondsPerBeat, 0.5);
  assert.strictEqual(grid.beatsPerBar, 4);
  assert.strictEqual(grid.downbeats.length, 3);
});

test('converts seconds to bar and beat positions', function() {
  var grid = timing.createBeatGrid({ bpm: 120, time_signature: '4/4' });
  var result = timing.secondsToBarBeat(2.5, grid);
  assert.strictEqual(result.barNumber, 2);
  assert.strictEqual(result.beatNumber, 2);
});

test('applies latency compensation by input mode', function() {
  var compensated = timing.applyLatencyCompensation(1, 'midi');
  assert.ok(Math.abs(compensated - 0.975) < 0.001);
});

test('creates transport snapshots with beat metadata', function() {
  var transport = timing.createTransport({ durationSec: 120, positionSec: 5, beatGrid: { bpm: 120, time_signature: '4/4' }, status: 'running' });
  assert.strictEqual(transport.status, 'running');
  assert.strictEqual(transport.barBeat.barNumber, 3);
  assert.strictEqual(transport.positionMs, 5000);
});

test('schedules cues within lookahead windows', function() {
  var transport = timing.createTransport({ positionSec: 10, beatGrid: { bpm: 120 } });
  var cues = timing.scheduleCues([{ id: 'a', timeSec: 10.02 }, { id: 'b', timeSec: 11.5 }], transport, { lookaheadSec: 0.1 });
  assert.strictEqual(cues.length, 1);
  assert.strictEqual(cues[0].id, 'a');
});

test('validates beat grid ordering', function() {
  var validation = timing.validateBeatGrid({ bpm: 100, downbeats_s: [0, 4, 2] });
  assert.strictEqual(validation.ok, false);
  assert.strictEqual(validation.issues[0].code, 'downbeats_not_ascending');
});
