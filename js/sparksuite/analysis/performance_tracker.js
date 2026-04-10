(function() {
  /**
   * SparkPerformanceTracker -- records hit/miss events during gameplay.
   * Feeds into HeatmapGenerator for post-session visualization.
   */
  function PerformanceTracker() {
    this.events = [];
  }

  PerformanceTracker.prototype.record = function(event) {
    this.events.push({
      time: event.time || 0,
      lane: event.lane != null ? event.lane : -1,
      hit: !!event.hit,
      error: event.error || 0,
      judgement: event.judgement || null
    });
  };

  PerformanceTracker.prototype.getSummary = function() {
    return this.events.slice();
  };

  PerformanceTracker.prototype.getAccuracy = function() {
    if (!this.events.length) return 0;
    var hits = 0;
    for (var i = 0; i < this.events.length; i++) {
      if (this.events[i].hit) hits++;
    }
    return hits / this.events.length;
  };

  PerformanceTracker.prototype.reset = function() {
    this.events = [];
  };

  window.SparkPerformanceTracker = PerformanceTracker;
})();
