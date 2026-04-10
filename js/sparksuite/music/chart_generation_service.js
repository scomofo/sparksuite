(function() {
  /**
   * SparkChartGenerationService — orchestrates the full chart pipeline:
   *   TrackAnalyzer → ChordProgressionEngine → ChartBuilder → DifficultyScaler
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
    var instrument = params.instrument || "guitar";
    var cacheKey = trackId + "_" + difficulty + "_" + instrument;
    var self = this;

    if (this._chartCache[cacheKey]) {
      return Promise.resolve(this._chartCache[cacheKey]);
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
      return chart;
    });
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

  ChartGenerationService.prototype.clearCache = function() {
    this._chartCache = {};
  };

  window.SparkChartGenerationService = ChartGenerationService;
})();
