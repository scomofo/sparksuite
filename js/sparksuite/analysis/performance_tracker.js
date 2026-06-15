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

  PerformanceTracker.prototype.getEvents = function() {
    return this.events.slice();
  };

  PerformanceTracker.prototype.computeSummary = function() {
    var events = this.events;
    var total = events.length;
    if (!total) return { accuracy: 0, timing: 0, consistency: 0, weakAreas: [] };
    var hits = 0;
    var sumAbsErr = 0;
    var sumErr = 0;
    var i;
    for (i = 0; i < total; i++) {
      if (events[i].hit) hits++;
      sumAbsErr += Math.abs(events[i].error || 0);
      sumErr += (events[i].error || 0);
    }
    var accuracy = hits / total;
    var timing = Math.max(0, 1 - sumAbsErr / (total * 200));
    var avgErr = sumErr / total;
    var variance = 0;
    for (i = 0; i < total; i++) {
      var d = (events[i].error || 0) - avgErr;
      variance += d * d;
    }
    var consistency = Math.max(0, 1 - Math.sqrt(variance / total) / 200);
    return {
      accuracy: Math.round(accuracy * 1000) / 1000,
      timing: Math.round(timing * 1000) / 1000,
      consistency: Math.round(consistency * 1000) / 1000,
      weakAreas: []
    };
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
