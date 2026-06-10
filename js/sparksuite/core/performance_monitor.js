(function() {
  function getNow() {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  function SparkPerformanceMonitor(options) {
    options = options || {};
    this.eventBus = options.eventBus || null;
    this.budgets = options.budgets || (typeof SparkPerformanceBudgets !== "undefined" ? SparkPerformanceBudgets : {});
  }

  SparkPerformanceMonitor.prototype.measure = function(label, budgetKey, fn) {
    var startedAt = getNow();
    var result = fn();
    this.report(label, budgetKey, getNow() - startedAt);
    return result;
  };

  SparkPerformanceMonitor.prototype.measureAsync = function(label, budgetKey, fn) {
    var self = this;
    var startedAt = getNow();
    return Promise.resolve().then(fn).then(function(result) {
      self.report(label, budgetKey, getNow() - startedAt);
      return result;
    });
  };

  SparkPerformanceMonitor.prototype.report = function(label, budgetKey, durationMs) {
    var budgetMs = this.budgets ? this.budgets[budgetKey] : null;
    var payload = {
      label: label,
      budgetKey: budgetKey,
      durationMs: durationMs,
      budgetMs: budgetMs
    };
    if (this.eventBus && typeof this.eventBus.emit === "function") {
      this.eventBus.emit("performance.measured", payload);
      if (typeof budgetMs === "number" && durationMs > budgetMs) {
        this.eventBus.emit("performance.budget_exceeded", payload);
      }
    }
    if (typeof budgetMs === "number" && durationMs > budgetMs && typeof console !== "undefined" && console.warn) {
      console.warn("[Spark Performance]", label, payload);
    }
    return payload;
  };

  if (typeof window !== "undefined") {
    window.SparkPerformanceMonitor = SparkPerformanceMonitor;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      SparkPerformanceMonitor: SparkPerformanceMonitor
    };
  }
})();
