(function() {
  /**
   * SparkTrackAnalyzer — extracts musical metadata from Spotify audio features.
   * Returns data the ChartEngine needs to generate gameplay charts.
   */
  function TrackAnalyzer(spotifyClient) {
    this.spotify = spotifyClient;
    this._cache = {};
  }

  TrackAnalyzer.prototype.analyze = function(trackId) {
    var self = this;
    if (this._cache[trackId]) return Promise.resolve(this._cache[trackId]);

    return this.spotify.getAudioFeatures(trackId).then(function(features) {
      var analysis = {
        trackId: trackId,
        bpm: Math.round(features.tempo || 120),
        key: features.key,
        mode: features.mode,
        timeSignature: features.time_signature || 4,
        energy: features.energy || 0.5,
        danceability: features.danceability || 0.5,
        valence: features.valence || 0.5
      };
      self._cache[trackId] = analysis;
      return analysis;
    }).catch(function() {
      console.warn("[TrackAnalyzer] Audio features unavailable, using defaults");
      var fallback = { trackId: trackId, bpm: 120, key: 0, mode: 1, timeSignature: 4, energy: 0.5, danceability: 0.5, valence: 0.5 };
      self._cache[trackId] = fallback;
      return fallback;
    });
  };

  TrackAnalyzer.prototype.analyzeWithMetadata = function(trackId) {
    var self = this;
    return Promise.all([
      this.analyze(trackId),
      this.spotify.getTrack(trackId)
    ]).then(function(results) {
      var analysis = results[0];
      var track = results[1];
      analysis.title = track.name || "";
      analysis.artist = (track.artists && track.artists.length) ? track.artists[0].name : "";
      analysis.durationMs = track.duration_ms || 0;
      analysis.albumArt = (track.album && track.album.images && track.album.images.length)
        ? track.album.images[0].url : null;
      return analysis;
    });
  };

  TrackAnalyzer.prototype.clearCache = function() {
    this._cache = {};
  };

  window.SparkTrackAnalyzer = TrackAnalyzer;
})();
