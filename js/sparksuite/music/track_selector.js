(function() {
  /**
   * SparkTrackSelector -- bridge between song picker UI and gameplay engine.
   * Generates chart + starts playback in one call. Also tracks recent songs.
   */
  var RECENT_KEY = "sparksuite_recent_tracks";
  var MAX_RECENT = 20;

  function TrackSelector(options) {
    options = options || {};
    this.chartService = options.chartService || null;
    this.playbackEngine = options.playbackEngine || null;
  }

  /**
   * Select a track: generate chart and start playback.
   * @param {Object} track - { id, uri, name, artist, duration, image }
   * @param {Object} [options] - { difficulty, instrument }
   * @returns {Promise<{track, chart}>}
   */
  TrackSelector.prototype.select = function(track, options) {
    options = options || {};
    var difficulty = options.difficulty || "easy";
    var instrument = options.instrument || "guitar";
    var self = this;

    if (!this.chartService) return Promise.reject(new Error("TrackSelector: no chartService"));

    return this.chartService.generate({
      trackId: track.id,
      difficulty: difficulty,
      instrument: instrument
    }).then(function(chart) {
      self._saveRecent(track);

      // Start playback if engine available
      var playbackPromise = self.playbackEngine
        ? self.playbackEngine.start(track.uri, { audioOffsetMs: (chart.audio && chart.audio.offset_ms) || 0 })
        : Promise.resolve();

      return playbackPromise.then(function() {
        return { track: track, chart: chart };
      });
    });
  };

  /**
   * Get recently played tracks.
   */
  TrackSelector.prototype.getRecent = function() {
    try {
      var raw = localStorage.getItem(RECENT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  };

  TrackSelector.prototype._saveRecent = function(track) {
    try {
      var recent = this.getRecent();
      // Remove duplicate
      recent = recent.filter(function(t) { return t.id !== track.id; });
      recent.unshift({ id: track.id, uri: track.uri, name: track.name, artist: track.artist, image: track.image });
      if (recent.length > MAX_RECENT) recent.length = MAX_RECENT;
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch (e) { /* storage unavailable */ }
  };

  TrackSelector.prototype.clearRecent = function() {
    try { localStorage.removeItem(RECENT_KEY); } catch (e) {}
  };

  window.SparkTrackSelector = TrackSelector;
})();
