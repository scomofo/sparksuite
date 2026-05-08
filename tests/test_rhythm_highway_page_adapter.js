var assert = require('assert');
var fs = require('fs');
var path = require('path');

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

global.window = global;

eval(loadJS('js/sparksuite/core/rhythm_highway_page_adapter.js'));

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

function createControllerStub(events) {
  return {
    loaded: null,
    played: false,
    stopped: false,
    destroyed: false,
    load: function(payload, options) {
      this.loaded = { payload: payload, options: options };
      events.push('load');
      return { status: 'ready', payload: payload, options: options };
    },
    play: function() {
      this.played = true;
      events.push('play');
      return { status: 'running' };
    },
    stop: function() {
      this.stopped = true;
      events.push('stop');
      return { status: 'stopped' };
    },
    destroy: function() {
      this.destroyed = true;
      events.push('destroy');
    },
    getState: function() {
      return { status: this.played ? 'running' : 'ready' };
    }
  };
}

test('creates a runtime controller through the factory', function() {
  var createdOptions = null;
  var adapter = new SparkRhythmHighwayPageAdapter({
    controllerFactory: function(options) {
      createdOptions = options;
      return createControllerStub([]);
    }
  });

  var controller = adapter.createController({
    onRender: function() {},
    onFinalize: function() {},
    bridgeOptions: { id: 'bridge' }
  });

  assert.ok(controller);
  assert.strictEqual(createdOptions.bridgeOptions.id, 'bridge');
  assert.strictEqual(typeof createdOptions.onRender, 'function');
  assert.strictEqual(typeof createdOptions.onFinalize, 'function');
});

test('start loads and autoplays by default', function() {
  var events = [];
  var controller = createControllerStub(events);
  var adapter = new SparkRhythmHighwayPageAdapter({
    controllerFactory: function() { return controller; }
  });

  var state = adapter.start({ chartId: 'chart_01' }, {
    runtime: { durationSec: 10 }
  });

  assert.strictEqual(state.status, 'ready');
  assert.deepStrictEqual(events, ['load', 'play']);
  assert.strictEqual(controller.loaded.payload.chartId, 'chart_01');
  assert.strictEqual(controller.loaded.options.durationSec, 10);
});

test('start can load without autoplay', function() {
  var events = [];
  var controller = createControllerStub(events);
  var adapter = new SparkRhythmHighwayPageAdapter({
    controllerFactory: function() { return controller; }
  });

  adapter.start({ chartId: 'chart_01' }, {
    autoPlay: false,
    runtime: { durationSec: 10 }
  });

  assert.deepStrictEqual(events, ['load']);
  assert.strictEqual(controller.played, false);
});

test('stop delegates to active controller', function() {
  var events = [];
  var controller = createControllerStub(events);
  var adapter = new SparkRhythmHighwayPageAdapter({
    controllerFactory: function() { return controller; }
  });

  adapter.createController({});
  var state = adapter.stop();

  assert.strictEqual(state.status, 'stopped');
  assert.deepStrictEqual(events, ['stop']);
});

test('destroy cleans up active controller', function() {
  var events = [];
  var controller = createControllerStub(events);
  var adapter = new SparkRhythmHighwayPageAdapter({
    controllerFactory: function() { return controller; }
  });

  adapter.createController({});
  adapter.destroy();

  assert.strictEqual(controller.destroyed, true);
  assert.strictEqual(adapter.activeController, null);
});
