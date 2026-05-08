#!/usr/bin/env node
/* Generate browser-loadable performance chart data for file:// launches. */

var fs = require("fs");
var path = require("path");

var root = path.join(__dirname, "..");
var sourceDir = path.join(root, "data", "performance_charts");
var outputPath = path.join(root, "js", "performance", "chart_data.generated.js");
var files = fs.readdirSync(sourceDir).filter(function(file) {
  return /\.json$/.test(file);
}).sort();
var data = {};

files.forEach(function(file) {
  var id = path.basename(file, ".json");
  data[id] = JSON.parse(fs.readFileSync(path.join(sourceDir, file), "utf8"));
});

fs.writeFileSync(outputPath, [
  "// AUTO-GENERATED from data/performance_charts/*.json",
  "// Regenerate with: node scripts/generate-chart-data.js",
  "(function() {",
  "  var generated = " + JSON.stringify(data, null, 2).replace(/</g, "\\u003c") + ";",
  "  var charts = {};",
  "  for (var chartId in generated) {",
  "    if (Object.prototype.hasOwnProperty.call(generated, chartId)) charts[chartId] = generated[chartId];",
  "  }",
  "  var registry = Object.freeze(charts);",
  "  window.__SPARK_PERFORMANCE_CHART_PRELOAD__ = registry;",
  "  if (window.SparkPerformanceChartEngine && typeof window.SparkPerformanceChartEngine.preloadCharts === \"function\") {",
  "    window.SparkPerformanceChartEngine.preloadCharts(registry);",
  "    window.SparkPerformanceChartEngine._generatedHydrated = true;",
  "  }",
  "  Object.defineProperty(window, \"PERFORMANCE_CHART_DATA\", {",
  "    get: function() { return registry; },",
  "    enumerable: true,",
  "    configurable: true",
  "  });",
  "})();",
  ""
].join("\n"), "utf8");

console.log("Wrote " + outputPath + " with " + files.length + " charts");
