(function() {
  window.SparkDrumsKits = {
    default: {
      id: "kit_drums_acoustic_starter",
      title: "Acoustic Starter Kit",
      pieces: ["kick", "snare", "hi_hat_closed", "hi_hat_open", "ride", "crash", "tom_high", "tom_mid", "tom_low", "rim"],
      lanePieces: {
        kick: ["kick"],
        snare: ["snare", "rim"],
        hat: ["hi_hat_closed", "hi_hat_open"],
        aux: ["ride", "crash", "tom_high", "tom_mid", "tom_low"]
      }
    }
  };
})();
