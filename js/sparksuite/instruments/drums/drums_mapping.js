(function() {
  window.SparkDrumsMapping = {
    primaryKeys: {
      kick: "A",
      snare: "S",
      hi_hat_closed: "D",
      aux: "F"
    },
    extendedKeys: {
      hi_hat_open: "F",
      ride: "J",
      crash: "K",
      tom_high: "L",
      tom_mid: ";",
      tom_low: "'",
      rim: "W"
    },
    semanticToLane: {
      kick: "kick",
      snare: "snare",
      rim: "snare",
      hi_hat_closed: "hat",
      hi_hat_open: "aux",
      ride: "aux",
      crash: "aux",
      tom_high: "aux",
      tom_mid: "aux",
      tom_low: "aux"
    },
    laneIndex: {
      kick: 0,
      snare: 1,
      hat: 2,
      aux: 3
    },
    gmMidi: {
      kick: [35, 36],
      snare: [38, 40],
      rim: [37],
      hi_hat_closed: [42],
      hi_hat_open: [46],
      ride: [51],
      crash: [49],
      tom_high: [48],
      tom_mid: [47],
      tom_low: [45]
    }
  };
})();
