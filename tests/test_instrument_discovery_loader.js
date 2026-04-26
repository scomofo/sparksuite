const assert = require("assert");
const fs = require("fs");

const appended = [];
const existing = [
  { getAttribute(name) { return name === "data-deferred-src" ? "js/instruments/guitar/register.js" : null; } },
  { getAttribute(name) { return name === "src" ? "js/instruments/discovery_loader.js" : null; } }
];

global.window = global;
global.document = {
  readyState: "complete",
  querySelectorAll(selector) {
    assert.strictEqual(selector, "script[src],script[data-deferred-src]");
    return existing;
  },
  createElement(tag) {
    assert.strictEqual(tag, "script");
    return {
      attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; }
    };
  },
  body: {
    appendChild(script) {
      appended.push(script);
      if (typeof script.onload === "function") script.onload();
    }
  },
  head: null,
  documentElement: null,
  addEventListener() {}
};

global.SPARK_INSTRUMENT_MANIFEST = [
  {
    id: "chordspark",
    scripts: [
      "js/instruments/guitar/pages.js",
      "js/instruments/guitar/register.js",
      "js/instruments/guitar/app.js"
    ]
  },
  {
    id: "pianospark",
    scripts: [
      "js/instruments/piano/data.js",
      "js/instruments/guitar/pages.js"
    ]
  }
];

eval(fs.readFileSync("js/instruments/discovery_loader.js", "utf8"));

assert(global.SparkInstrumentDiscovery, "loader must expose SparkInstrumentDiscovery");
assert.deepStrictEqual(
  appended.map((script) => script.src),
  [
    "js/instruments/guitar/pages.js",
    "js/instruments/guitar/app.js",
    "js/instruments/piano/data.js"
  ],
  "loader should append missing manifest scripts once, in order"
);
assert(appended.every((script) => script.async === false), "discovered scripts must preserve ordered execution");
assert(appended.every((script) => script.attributes["data-spark-discovered"] === "true"), "discovered scripts must be marked");

let callbackCalled = false;
global.SparkInstrumentDiscovery.loadAll(() => {
  callbackCalled = true;
});
assert(callbackCalled, "loadAll callback should fire when nothing remains to load");

console.log("test_instrument_discovery_loader passed");
