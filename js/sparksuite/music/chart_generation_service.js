(function() {
  function resolveChartInstrumentType(instrument) {
    var all;
    var i;
    var inst;
    if (!instrument) return "guitar";
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getAll !== "function") {
      return instrument;
    }
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      inst = all[i] || {};
      if (inst.id === instrument || inst.appId === instrument) {
        return inst.instrument || instrument;
      }
    }
    return instrument;
  }

  /**
   * SparkChartGenerationService -- orchestrates the full chart pipeline:
   *   TrackAnalyzer -> ChordProgressionEngine -> ChartBuilder -> DifficultyScaler
   *
   * This is the single entry point for generating a playable chart from a Spotify track ID.
   */
  function ChartGenerationService(options) {
    options = options || {};
    this.analyzer = options.analyzer || null;           // SparkTrackAnalyzer
    this.builder = options.builder || new SparkChartBuilder();
    this.scaler = options.scaler || new SparkDifficultyScaler();
    this.progressionEngine = options.progressionEngine || new SparkChordProgressionEngine();
    this._chartCache = {};
  }

  /**
   * Generate a play-along chart for a Spotify track.
   * @param {Object} params - { trackId, difficulty, instrument }
   * @returns {Promise<SparkPlayAlongChart>}
   */
  ChartGenerationService.prototype.generate = function(params) {
    params = params || {};
    var trackId = params.trackId;
    var difficulty = params.difficulty || "easy";
    var instrument = resolveChartInstrumentType(params.instrument);
    var cacheKey = trackId + "_" + difficulty + "_" + instrument;
    var self = this;

    if (this._chartCache[cacheKey]) {
      return Promise.resolve(this._chartCache[cacheKey]);
    }

    // Check localStorage for a persisted chart
    var storageKey = "sparksuite_chart_" + cacheKey;
    try {
      var stored = localStorage.getItem(storageKey);
      if (stored) {
        var parsed = JSON.parse(stored);
        var restoredChart = (typeof SparkPlayAlongChart !== "undefined" && SparkPlayAlongChart.fromJSON)
          ? SparkPlayAlongChart.fromJSON(parsed)
          : parsed;
        self._chartCache[cacheKey] = restoredChart;
        return Promise.resolve(restoredChart);
      }
    } catch (e) {
      // Ignore corrupt localStorage entry
    }

    return this.analyzer.analyzeWithMetadata(trackId).then(function(analysis) {
      analysis.instrument = instrument;

      // Get rhythm patterns for this difficulty
      var patterns = {
        rhythm: SparkPatternLibrary.rhythm[difficulty] || SparkPatternLibrary.rhythm.easy,
        strumming: SparkPatternLibrary.strumming[difficulty] || SparkPatternLibrary.strumming.easy
      };

      // Build chord timeline
      var chords = self.progressionEngine.buildChordTimeline(analysis, difficulty);

      // Build the chart
      var chart = self.builder.build({
        trackId: trackId,
        bpm: analysis.bpm,
        difficulty: difficulty,
        patterns: patterns,
        chords: chords,
        analysis: analysis
      });

      // Apply difficulty scaling
      chart = self.scaler.apply(chart, difficulty);

      self._chartCache[cacheKey] = chart;

      // Persist to localStorage
      self.cacheChart(trackId, chart, difficulty, instrument);

      return chart;
    });
  };

  /**
   * Persist a chart to localStorage keyed by track ID + difficulty + instrument.
   */
  ChartGenerationService.prototype.cacheChart = function(trackId, chart, difficulty, instrument) {
    if (!trackId || !chart) return;
    var diff = difficulty || "easy";
    var inst = resolveChartInstrumentType(instrument);
    var storageKey = "sparksuite_chart_" + trackId + "_" + diff + "_" + inst;
    try {
      var json = (chart && typeof chart.toJSON === "function") ? chart.toJSON() : chart;
      localStorage.setItem(storageKey, JSON.stringify(json));
    } catch (e) {
      // Storage full or unavailable
    }
  };

  /**
   * Check if a cached chart exists in localStorage for a given track ID.
   * Returns true if ANY difficulty/instrument combo is cached.
   */
  ChartGenerationService.prototype.hasCachedChart = function(trackId) {
    if (!trackId) return false;
    var prefix = "sparksuite_chart_" + trackId + "_";
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(prefix) === 0) return true;
      }
    } catch (e) {
      // localStorage unavailable
    }
    return false;
  };

  /**
   * Remove cached charts from localStorage.
   * If trackId is provided, removes all charts for that track.
   * If no trackId, removes ALL sparksuite chart caches.
   */
  ChartGenerationService.prototype.clearCache = function(trackId) {
    this._chartCache = {};
    try {
      var prefix = trackId ? ("sparksuite_chart_" + trackId + "_") : "sparksuite_chart_";
      var toRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(prefix) === 0) toRemove.push(key);
      }
      for (var j = 0; j < toRemove.length; j++) {
        localStorage.removeItem(toRemove[j]);
      }
    } catch (e) {
      // localStorage unavailable
    }
  };

  /**
   * Generate charts for all difficulties at once.
   */
  ChartGenerationService.prototype.generateAllDifficulties = function(trackId, instrument) {
    var self = this;
    return Promise.all([
      self.generate({ trackId: trackId, difficulty: "easy", instrument: instrument }),
      self.generate({ trackId: trackId, difficulty: "normal", instrument: instrument }),
      self.generate({ trackId: trackId, difficulty: "hard", instrument: instrument })
    ]).then(function(charts) {
      return { easy: charts[0], normal: charts[1], hard: charts[2] };
    });
  };

  window.SparkChartGenerationService = ChartGenerationService;
})();
