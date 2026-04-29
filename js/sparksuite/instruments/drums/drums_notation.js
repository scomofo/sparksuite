(function() {
  window.SparkDrumsNotation = {
    lanes: [
      { id: "kick", label: "Kick", staff: "bass", laneIndex: 0 },
      { id: "snare", label: "Snare", staff: "middle", laneIndex: 1 },
      { id: "hat", label: "Hat", staff: "top", laneIndex: 2 },
      { id: "aux", label: "Aux", staff: "aux", laneIndex: 3 }
    ],
    symbols: {
      kick: { mark: "o", name: "Bass drum" },
      snare: { mark: "o", name: "Snare" },
      rim: { mark: "x", name: "Rim" },
      hi_hat_closed: { mark: "x", name: "Closed hi-hat" },
      hi_hat_open: { mark: "o", name: "Open hi-hat" },
      ride: { mark: "x", name: "Ride" },
      crash: { mark: "X", name: "Crash" },
      tom_high: { mark: "o", name: "High tom" },
      tom_mid: { mark: "o", name: "Mid tom" },
      tom_low: { mark: "o", name: "Low tom" }
    }
  };
})();
