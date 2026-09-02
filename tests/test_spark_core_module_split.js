/*
 * SparkCore is split across lifecycle modules that each attach methods to
 * SparkCore.prototype. The split is only safe while a few invariants hold, and
 * every one of them fails silently in the browser if it breaks:
 *
 *  - spark_core.js must load first, since the modules read window.SparkCoreRuntime.
 *  - spark_core_boot.js must load LAST. It runs `new SparkCore(...)`, and the
 *    constructor calls createInitialRuntimeState() and createErrorBoundary(),
 *    both of which live in lifecycle modules. Boot ahead of them throws.
 *  - Every module on disk needs a <script> tag, or its methods just vanish.
 *  - No method may be defined by two modules, or the later one silently wins.
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..");
var modules = require("./spark_core_modules.js").sparkCoreModules();

var passed = 0;
function test(name, fn) {
  try { fn(); console.log("  PASS " + name); passed++; }
  catch (e) { console.error("  FAIL " + name + ": " + (e && e.message)); process.exitCode = 1; }
}

function read(rel) { return fs.readFileSync(path.join(repoRoot, rel), "utf8"); }
function strip(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/[^\n]*/gm, "");
}

test("spark_core.js loads first and boot loads last", function () {
  assert.strictEqual(modules[0], "js/sparksuite/core/spark_core.js",
    "the constructor and window.SparkCoreRuntime must exist before any module attaches to it");
  assert.strictEqual(modules[modules.length - 1], "js/sparksuite/core/spark_core_boot.js",
    "boot constructs SparkCore, whose constructor calls methods the modules provide");
});

test("every module on disk is loaded by index.html", function () {
  var onDisk = fs.readdirSync(path.join(repoRoot, "js/sparksuite/core"))
    .filter(function (f) { return /^spark_core(_[a-z_]+)?\.js$/.test(f); })
    .map(function (f) { return "js/sparksuite/core/" + f; })
    .sort();
  assert.deepStrictEqual(modules.slice().sort(), onDisk,
    "a module without a <script> tag contributes nothing at runtime");
});

test("no method is defined by two modules", function () {
  var owner = {};
  var dupes = [];
  modules.forEach(function (file) {
    var seen = {};
    var re = /^\s*SparkCore\.prototype\.([A-Za-z0-9_$]+)\s*=/gm;
    var m;
    var src = strip(read(file));
    while ((m = re.exec(src))) {
      // A module may reassign its own method (the error-boundary wrap pattern);
      // two different modules claiming one name is the failure.
      if (seen[m[1]]) continue;
      seen[m[1]] = true;
      if (owner[m[1]]) dupes.push(m[1] + " in both " + owner[m[1]] + " and " + file);
      owner[m[1]] = file;
    }
  });
  assert.deepStrictEqual(dupes, [], "duplicate definitions across modules silently clobber");
  assert.ok(Object.keys(owner).length > 100,
    "expected SparkCore's full method surface, found " + Object.keys(owner).length);
});

test("the core file exposes the helpers the modules alias", function () {
  var core = read("js/sparksuite/core/spark_core.js");
  assert.ok(/SparkCore\._internal\s*=\s*\{/.test(core), "modules read SparkCore._internal");
  ["getSparkErrorApi", "createCoreError", "_normalizeSegType", "getGuidedBlockTypeForStep"]
    .forEach(function (h) {
      assert.ok(new RegExp("\\b" + h + "\\b").test(core), h + " must stay in the core file");
    });
});

test("every helper a module aliases is actually published", function () {
  var core = read("js/sparksuite/core/spark_core.js");
  var block = core.slice(core.indexOf("SparkCore._internal"));
  block = block.slice(0, block.indexOf("};"));
  modules.forEach(function (file) {
    var src = read(file);
    var re = /var\s+([A-Za-z0-9_$]+)\s*=\s*_internal\.([A-Za-z0-9_$]+)\s*;/g;
    var m;
    while ((m = re.exec(src))) {
      assert.ok(new RegExp("\\b" + m[2] + "\\s*:").test(block),
        file + " aliases _internal." + m[2] + ", which the core file does not publish");
    }
  });
});

test("modules attach to the prototype rather than redeclaring the constructor", function () {
  modules.slice(1).forEach(function (file) {
    var src = strip(read(file));
    assert.ok(!/^\s*function\s+SparkCore\s*\(/m.test(src),
      file + " must not redeclare the SparkCore constructor");
    assert.ok(/var\s+SparkCore\s*=\s*window\.SparkCoreRuntime\s*;/.test(src),
      file + " must take SparkCore from window.SparkCoreRuntime");
  });
});

test("only boot constructs the default instance", function () {
  modules.forEach(function (file) {
    var src = strip(read(file));
    var constructs = /window\.sparkCore\s*=/.test(src);
    if (file === "js/sparksuite/core/spark_core_boot.js") {
      assert.ok(constructs, "boot must publish window.sparkCore");
    } else {
      assert.ok(!constructs, file + " must not construct the default instance");
    }
  });
});

console.log("PASS: SparkCore lifecycle split holds (" + passed + " checks, " + modules.length + " modules)");
