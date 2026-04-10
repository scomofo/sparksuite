(function() {
  function MultiChartBuilder() {
    this.chartGenerator = typeof SparkAudioChartGenerator !== "undefined" ? new SparkAudioChartGenerator() : null;
    this.classifier = new SparkPartClassifier();
  }

  MultiChartBuilder.prototype.build = function(stems, options) {
    options = options || {};
    var result = {};
    for (var name in stems) {
      if (!stems[name]) continue;
      var role = this.classifier.classifyStem(name);
      if (role === "percussion") continue;
      var chart = this.chartGenerator
        ? this.chartGenerator.generate(stems[name], {
            trackId: (options.trackId || "multi") + "_" + name,
            difficulty: options.difficulty || "normal",
            instrument: role === "bass" ? "bass" : "guitar",
            title: (options.title || "Track") + " (" + name + ")"
          })
        : null;
      if (chart) result[role] = chart;
    }
    return result;
  };

  MultiChartBuilder.prototype.getAvailableRoles = function(charts) {
    return Object.keys(charts);
  };

  window.SparkMultiChartBuilder = MultiChartBuilder;
})();
