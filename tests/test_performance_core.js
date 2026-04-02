// tests/test_performance_core.js
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  PASS: ' + name); }
  catch (e) { failed++; console.error('  FAIL: ' + name + '\n    ' + e.message); }
}

global.window = global;
global.performance = { now: function() { return Date.now(); } };
global.SparkEvents = { emit: function() {}, clear: function() {}, getPending: function() { return []; }, on: function() {}, off: function() {} };

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

eval(loadJS('js/performance-core/chart-contract.js'));
eval(loadJS('js/performance-core/transport-contract.js'));
eval(loadJS('js/performance-core/performance-events.js'));

console.log('\n--- PerformanceCore: Chart Contract ---');

test('normalizeChartEvents adds missing _scored flags', function() {
  var events = [{ t: 0, dur: 1, type: 'chord', notes: ['E','G','B'], laneLabel: 'Em' }];
  var result = PerfChartContract.normalizeEvents(events);
  assert.strictEqual(result[0]._scored, false);
  assert.strictEqual(result[0]._hit, false);
});

test('normalizeChartEvents sorts by time', function() {
  var events = [
    { t: 2, dur: 1, type: 'chord', notes: ['G'], laneLabel: 'G' },
    { t: 0, dur: 1, type: 'chord', notes: ['E'], laneLabel: 'E' }
  ];
  var result = PerfChartContract.normalizeEvents(events);
  assert.strictEqual(result[0].t, 0);
  assert.strictEqual(result[1].t, 2);
});

test('validateEvent rejects missing notes', function() {
  var result = PerfChartContract.validateEvent({ t: 0, dur: 1, type: 'chord' });
  assert.strictEqual(result.valid, false);
});

test('validateEvent accepts valid chord event', function() {
  var result = PerfChartContract.validateEvent({ t: 0, dur: 1, type: 'chord', notes: ['C','E','G'], laneLabel: 'C' });
  assert.strictEqual(result.valid, true);
});

console.log('\n--- PerformanceCore: Transport Contract ---');

test('wall-clock mode returns elapsed time', function() {
  var state = PerfTransportContract.createState();
  PerfTransportContract.setMode(state, 'wall-clock');
  PerfTransportContract.start(state, 0);
  // Immediately after start, now() should be near 0
  var t = PerfTransportContract.now(state);
  assert.ok(t >= 0 && t < 0.5, 'should be near 0, got ' + t);
});

test('audio-clock mode returns audioEl currentTime', function() {
  var state = PerfTransportContract.createState();
  PerfTransportContract.setMode(state, 'audio-clock');
  var fakeAudio = { currentTime: 5.5, paused: false, ended: false };
  PerfTransportContract.setAudioSource(state, fakeAudio);
  PerfTransportContract.start(state, 0);
  assert.strictEqual(PerfTransportContract.now(state), 5.5);
});

test('mode defaults to wall-clock', function() {
  var state = PerfTransportContract.createState();
  assert.strictEqual(state.mode, 'wall-clock');
});

console.log('\n--- PerformanceCore: Performance Events ---');

test('emitPerformanceEvent calls SparkEvents.emit', function() {
  var captured = [];
  var orig = SparkEvents.emit;
  SparkEvents.emit = function(type, payload) { captured.push({ type: type, payload: payload }); };
  PerfEvents.emit('performance_started', { chartId: 'test' });
  SparkEvents.emit = orig;
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].type, 'performance_started');
});

// Summary
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
