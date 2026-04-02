// js/performance-core/transport-contract.js
(function() {

  var PerfTransportContract = {
    createState: function() {
      return {
        mode: "wall-clock",
        _playing: false,
        _startedPerfMs: 0,
        _offsetSec: 0,
        _pausedSec: 0,
        _speed: 1,
        _audioSource: null
      };
    },

    setMode: function(state, mode) {
      state.mode = mode; // "wall-clock" | "audio-clock"
    },

    setAudioSource: function(state, audioEl) {
      state._audioSource = audioEl;
    },

    start: function(state, fromSec) {
      state._offsetSec = fromSec || 0;
      state._startedPerfMs = performance.now();
      state._playing = true;
      state._pausedSec = 0;
    },

    now: function(state) {
      if (state.mode === "audio-clock" && state._audioSource) {
        var a = state._audioSource;
        if (!a.paused && !a.ended) return a.currentTime;
      }
      if (!state._playing) return state._pausedSec;
      var elapsedMs = performance.now() - state._startedPerfMs;
      return state._offsetSec + (elapsedMs / 1000) * state._speed;
    }
  };

  window.PerfTransportContract = PerfTransportContract;
})();
