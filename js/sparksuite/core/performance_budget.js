(function() {
  var SparkPerformanceBudgets = Object.freeze({
    inputProcessingMs: 4,
    hitDetectionMs: 2,
    frameRenderMs: 16.7,
    sessionPlanBuildMs: 100,
    chartLoadMs: 250,
    storageReadMs: 100,
    storageWriteMs: 100,
    debugBundleExportMs: 500
  });

  if (typeof window !== "undefined") {
    window.SparkPerformanceBudgets = SparkPerformanceBudgets;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      SparkPerformanceBudgets: SparkPerformanceBudgets
    };
  }
})();
