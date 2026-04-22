(function() {
  "use strict";

  // Single timing authority for all SparkSuite components.
  // Bind to any audio engine and use getTimeMs() everywhere.
  var SparkTimeSource = {
    _engine: null,

    // Bind to an audio engine (SparkAudioEngine, SparkStemMixer, or SparkPlaybackEngine)
    bind: function(engine) {
      this._engine = engine;
    },

    // Get current time in ms. THE ONLY timing function anything should call.
    getTimeMs: function() {
      if (this._engine && typeof this._engine.getTimeMs === "function") {
        return this._engine.getTimeMs();
      }
      if (this._engine && typeof this._engine.getTimeSec === "function") {
        return this._engine.getTimeSec() * 1000;
      }
      return 0;
    },

    // Get time in seconds
    getTimeSec: function() {
      return this.getTimeMs() / 1000;
    },

    // Check if bound engine is playing
    isPlaying: function() {
      if (this._engine && typeof this._engine.isPlaying === "function") {
        return this._engine.isPlaying();
      }
      return false;
    }
  };

  window.SparkTimeSource = SparkTimeSource;
})();
