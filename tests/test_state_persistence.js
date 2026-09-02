// ===== State Persistence Tests =====
// Run: node tests/test_state_persistence.js
//
// Regression guard for the js/core/ retirement: state.js depends on
// persistence helpers (buildPersistedStateSnapshot et al.) that used to
// live in js/core/persistence.js. When that file was deleted, every
// saveState() silently failed and nothing ever persisted. These tests
// eval state.js standalone and exercise a full save -> load round trip.

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS: ' + name);
  } catch (e) {
    failed++;
    console.error('  FAIL: ' + name);
    console.error('    ' + e.message);
  }
}

function loadSource(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

function makeLocalStorageStub(store) {
  return {
    getItem: function(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function(k, v) { store[k] = String(v); },
    removeItem: function(k) { delete store[k]; }
  };
}

function makeContext(store) {
  var ctx = {
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Date: Date,
    Math: Math,
    JSON: JSON,
    localStorage: makeLocalStorageStub(store),
    SCR: { HOME: 'home', EDITOR: 'editor' },
    TAB: { PRACTICE: 'practice' }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(loadSource('js/utils/day.js'), ctx);
  vm.runInContext(loadSource('js/utils/ids.js'), ctx);
  vm.runInContext(loadSource('js/state.js'), ctx);
  return ctx;
}

console.log('=== State Persistence Tests ===');

test('saveState writes a snapshot to localStorage', function() {
  var store = {};
  var ctx = makeContext(store);
  ctx.S.xp = 123;
  ctx.S.streak = 4;
  ctx.saveState(true);
  var keys = Object.keys(store);
  assert.ok(keys.length > 0, 'expected saveState(true) to write to localStorage, got nothing');
  var snapshot = JSON.parse(store[keys[0]]);
  assert.strictEqual(snapshot.xp, 123);
  assert.strictEqual(snapshot.streak, 4);
});

test('loadState restores a saved snapshot', function() {
  var store = {};
  var ctx = makeContext(store);
  ctx.S.xp = 77;
  ctx.S.level = 3;
  ctx.saveState(true);

  var ctx2 = makeContext(store); // fresh context, same storage = app restart
  assert.strictEqual(ctx2.S.xp, 77, 'xp should survive a reload');
  assert.strictEqual(ctx2.S.level, 3, 'level should survive a reload');
});

test('saveState caps history at 500 entries', function() {
  var store = {};
  var ctx = makeContext(store);
  ctx.S.history = [];
  for (var i = 0; i < 600; i++) ctx.S.history.push({ i: i });
  ctx.saveState(true);
  var snapshot = JSON.parse(store[Object.keys(store)[0]]);
  assert.strictEqual(snapshot.history.length, 500);
  assert.strictEqual(snapshot.history[499].i, 599, 'should keep the newest entries');
});

test('generateId returns prefixed unique ids', function() {
  var ctx = makeContext({});
  var a = ctx.generateId('seed');
  var b = ctx.generateId('seed');
  assert.ok(/^seed_[a-z0-9]+$/.test(a), 'unexpected id format: ' + a);
  assert.notStrictEqual(a, b);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
