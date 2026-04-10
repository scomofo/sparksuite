(function() {
  /**
   * SparkHeatmapGenerator -- aggregates performance events into spatial buckets.
   * Each bucket covers a 2-second time window per lane.
   */
  var BUCKET_SIZE_MS = 2000;

  function HeatmapGenerator() {}

  /**
   * Generate heatmap data from performance events.
   * @param {Array} events - from PerformanceTracker.getSummary()
   * @returns {Object} keyed by "timeBucket_lane" -> { hits, misses, intensity }
   */
  HeatmapGenerator.prototype.generate = function(events) {
    var buckets = {};

    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      var timeBucket = Math.floor(e.time / BUCKET_SIZE_MS);
      var key = timeBucket + "_" + e.lane;

      if (!buckets[key]) {
        buckets[key] = { hits: 0, misses: 0, timeBucket: timeBucket, lane: e.lane };
      }

      if (e.hit) buckets[key].hits++;
      else buckets[key].misses++;
    }

    // Calculate intensity (0-1, higher = more misses)
    for (var k in buckets) {
      var b = buckets[k];
      var total = b.hits + b.misses;
      b.intensity = total > 0 ? b.misses / total : 0;
    }

    return buckets;
  };

  /**
   * Find clusters of high-miss areas for targeted practice.
   * @returns {Array} [{startMs, endMs, lanes, intensity}]
   */
  HeatmapGenerator.prototype.findClusters = function(heatmap, threshold) {
    threshold = threshold || 0.5;
    var clusters = [];

    for (var key in heatmap) {
      var b = heatmap[key];
      if (b.intensity >= threshold) {
        clusters.push({
          startMs: b.timeBucket * BUCKET_SIZE_MS,
          endMs: (b.timeBucket + 1) * BUCKET_SIZE_MS,
          lane: b.lane,
          intensity: b.intensity
        });
      }
    }

    return clusters.sort(function(a, b) { return b.intensity - a.intensity; });
  };

  window.SparkHeatmapGenerator = HeatmapGenerator;
})();
