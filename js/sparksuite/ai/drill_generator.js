(function() {
  var DRILL_TYPES = {
    LOOP: "loop_drill",
    SLOW: "slow_drill",
    CHORD_SWITCH: "chord_switch_drill",
    TIMING: "timing_drill"
  };

  function DrillGenerator() {}

  DrillGenerator.prototype.generate = function(heatmap, chart) {
    if (!heatmap || !heatmap.length) return null;
    var worst = this._findWeakest(heatmap);
    if (!worst) return null;
    var drillType = this._classifyDrill(worst);
    return {
      type: drillType,
      startMs: worst.time || worst.startMs || 0,
      endMs: (worst.time || worst.startMs || 0) + 4000,
      focus: worst.chord || "general",
      confidence: worst.confidence,
      speed: drillType === DRILL_TYPES.SLOW ? 0.75 : 1.0,
      repetitions: 4
    };
  };

  DrillGenerator.prototype.generateMultiple = function(heatmap, chart, count) {
    count = count || 3;
    if (!heatmap || !heatmap.length) return [];
    var sorted = heatmap.slice().sort(function(a, b) { return (a.confidence || 0) - (b.confidence || 0); });
    var drills = [];
    for (var i = 0; i < Math.min(count, sorted.length); i++) {
      var d = this.generate([sorted[i]], chart);
      if (d) drills.push(d);
    }
    return drills;
  };

  DrillGenerator.prototype._findWeakest = function(heatmap) {
    var worst = null, worstConf = Infinity;
    for (var i = 0; i < heatmap.length; i++) {
      var conf = heatmap[i].confidence != null ? heatmap[i].confidence : (heatmap[i].intensity != null ? 1 - heatmap[i].intensity : 1);
      if (conf < worstConf) { worstConf = conf; worst = heatmap[i]; }
    }
    return worst;
  };

  DrillGenerator.prototype._classifyDrill = function(area) {
    if (area.confidence < 0.3) return DRILL_TYPES.SLOW;
    if (area.chord) return DRILL_TYPES.CHORD_SWITCH;
    if (area.timing === "late" || area.timing === "early") return DRILL_TYPES.TIMING;
    return DRILL_TYPES.LOOP;
  };

  DrillGenerator.DRILL_TYPES = DRILL_TYPES;
  window.SparkDrillGenerator = DrillGenerator;
})();
