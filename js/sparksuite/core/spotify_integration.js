(function() {
  /**
   * SparkCore Spotify Play-Along integration methods.
   * Adds initSpotify, startSpotifySession, playback control,
   * and session completion to SparkCore.
   *
   * Load this file AFTER spark_core.js.
   */
  var SparkCore = window.SparkCoreRuntime;
  if (typeof SparkCore === "undefined" || !SparkCore) return;

  /**
   * Initialize Spotify integration. Call once after obtaining an OAuth token.
   */
  SparkCore.prototype.initSpotify = function(token) {
    this.spotifyClient = new SparkSpotifyClient(token);
    this.spotifySearch = new SparkSpotifySearch(this.spotifyClient);
    this.trackAnalyzer = new SparkTrackAnalyzer(this.spotifyClient);
    this.playbackEngine = new SparkPlaybackEngine(this.spotifyClient);
    this.chartService = new SparkChartGenerationService({
      analyzer: this.trackAnalyzer,
      builder: new SparkChartBuilder(),
      scaler: new SparkDifficultyScaler(),
      progressionEngine: new SparkChordProgressionEngine()
    });
    window.sparkChartService = this.chartService;
    this.updateRuntimeState({ spotifyConnected: true });
  };

  /**
   * Start a Spotify play-along session.
   * @param {Object} input - { trackId, difficulty, instrument }
   * @returns {Promise<SessionPlan>}
   */
  SparkCore.prototype.startSpotifySession = function(input) {
    input = input || {};
    var self = this;
    var instrumentContext = this.instrumentManager.getActiveContext();

    return this.sessionEngine.buildSpotifyPlayAlongSession({
      trackId: input.trackId,
      difficulty: input.difficulty || "easy",
      instrument: input.instrument || "guitar",
      instrumentContext: instrumentContext
    }).then(function(plan) {
      self.currentPlan = plan;
      self.updateRuntimeState({
        activeFlow: "spotify_play_along",
        activePlanId: plan.id,
        activeSegmentId: plan.segments && plan.segments.length ? plan.segments[0].id : null,
        activeScreen: "spotify_play_along",
        spotifyTrackId: input.trackId,
        spotifyDifficulty: input.difficulty || "easy",
        spotifyPlaying: false
      });
      return plan;
    });
  };

  /**
   * Start Spotify playback for the current play-along session.
   */
  SparkCore.prototype.startSpotifyPlayback = function(options) {
    if (!this.playbackEngine || !this.currentPlan) return Promise.resolve(false);
    var ctx = this.currentPlan.context && this.currentPlan.context.spotifyPlayAlong;
    if (!ctx || !ctx.playAlongChart) return Promise.resolve(false);
    var self = this;
    return this.playbackEngine.start(ctx.playAlongChart.trackUri, options).then(function() {
      self.updateRuntimeState({ spotifyPlaying: true });
      return true;
    });
  };

  /**
   * Stop Spotify playback.
   */
  SparkCore.prototype.stopSpotifyPlayback = function() {
    if (!this.playbackEngine) return Promise.resolve(false);
    var self = this;
    return this.playbackEngine.stop().then(function() {
      self.updateRuntimeState({ spotifyPlaying: false });
      return true;
    });
  };

  /**
   * Seek to a specific position (for looping/restart).
   */
  SparkCore.prototype.seekSpotify = function(positionMs) {
    if (!this.playbackEngine) return Promise.resolve(false);
    return this.playbackEngine.seekTo(positionMs);
  };

  /**
   * Complete a Spotify play-along session with results.
   * Runs practice intelligence to recommend next session adaptations.
   */
  SparkCore.prototype.completeSpotifySession = function(results) {
    results = results || {};
    this.stopSpotifyPlayback();

    var analysis = null;
    if (this.practiceIntelligence) {
      analysis = this.practiceIntelligence.analyze(results);
    }

    this.lastSessionOutcome = {
      flow: "spotify_play_along",
      results: results,
      analysis: analysis,
      plan: this.currentPlan
    };

    this.updateRuntimeState({
      spotifyPlaying: false,
      spotifyTrackId: null
    });

    return {
      results: results,
      analysis: analysis,
      suggestedDifficulty: analysis && this.practiceIntelligence
        ? this.practiceIntelligence.suggestDifficulty(this.runtimeState.spotifyDifficulty, analysis)
        : null,
      suggestedMode: analysis && this.practiceIntelligence
        ? this.practiceIntelligence.suggestMode(analysis)
        : null
    };
  };

  /**
   * Handle a voice command during a Spotify session.
   */
  SparkCore.prototype.handleSpotifyVoiceCommand = function(command) {
    if (!command || command.action === "none") return;
    switch (command.action) {
      case "slow":
        if (this.playbackEngine) this.playbackEngine._calibrationOffsetMs -= 50;
        break;
      case "fast":
        if (this.playbackEngine) this.playbackEngine._calibrationOffsetMs += 50;
        break;
      case "pause":
        this.stopSpotifyPlayback();
        break;
      case "play":
        this.startSpotifyPlayback();
        break;
      case "restart":
        this.seekSpotify(0);
        break;
      case "simplify":
        this.updateRuntimeState({ spotifyDifficulty: "easy" });
        break;
      case "challenge":
        this.updateRuntimeState({ spotifyDifficulty: "hard" });
        break;
    }
  };
})();
