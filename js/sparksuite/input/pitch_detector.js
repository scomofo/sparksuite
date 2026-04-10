(function() {
  'use strict';

  class SparkPitchDetector {
    detect(samples, sampleRate) {
      if (!samples || samples.length === 0) return null;

      var size = samples.length;
      var rms = 0;
      for (var i = 0; i < size; i++) {
        rms += samples[i] * samples[i];
      }
      rms = Math.sqrt(rms / size);
      if (rms < 0.01) return null;

      var maxOffset = Math.min(1000, Math.floor(size / 2));
      var bestOffset = -1;
      var bestCorrelation = 0;

      for (var offset = 8; offset < maxOffset; offset++) {
        var correlation = 0;
        for (var j = 0; j < size - offset; j++) {
          correlation += samples[j] * samples[j + offset];
        }
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = offset;
        }
      }

      if (bestOffset === -1 || bestCorrelation <= 0) return null;

      return sampleRate / bestOffset;
    }
  }

  window.SparkPitchDetector = SparkPitchDetector;
})();
