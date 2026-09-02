/*
 * SparkCore is split across several files by lifecycle, and the browser gets
 * them from the <script> tags in index.html. Tests that load SparkCore
 * directly need the same set in the same order, so this derives the list from
 * index.html rather than repeating it — a new lifecycle module is picked up by
 * every test as soon as its tag is added.
 */
var fs = require("fs");
var path = require("path");

var repoRoot = path.join(__dirname, "..");

function sparkCoreModules() {
  var html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  var re = /<script[^>]*src="(js\/sparksuite\/core\/spark_core[^"?]*\.js)"/g;
  var files = [];
  var m;
  while ((m = re.exec(html))) files.push(m[1]);
  if (!files.length) throw new Error("no SparkCore script tags found in index.html");
  return files;
}

// Loads every SparkCore module in browser order. `loader` is the test's own
// loadJS — either the variant that evaluates the file or the variant that
// returns its source, which is why the return value is evaluated when given.
function loadSparkCore(loader) {
  sparkCoreModules().forEach(function (file) {
    var src = loader(file);
    if (typeof src === "string") global.eval(src);
  });
}

module.exports = { sparkCoreModules: sparkCoreModules, loadSparkCore: loadSparkCore };
