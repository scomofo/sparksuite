(function() {
  'use strict';

  class SparkHarmonicAnalyzer {
    constructor(analyserNode) {
      this.analyser = analyserNode;
    }

    getPeaks(threshold) {
      if (typeof threshold === 'undefined') threshold = 180;
      if (!this.analyser) return [];

      var data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(data);

      var peaks = [];
      for (var i = 1; i < data.length - 1; i++) {
        if (data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1]) {
          peaks.push(i);
        }
      }
      return peaks;
    }

    getPeakFrequencies(sampleRate, fftSize, threshold) {
      if (typeof threshold === 'undefined') threshold = 180;
      var bins = this.getPeaks(threshold);
      var binWidth = sampleRate / fftSize;
      var frequencies = [];
      for (var i = 0; i < bins.length; i++) {
        frequencies.push(bins[i] * binWidth);
      }
      return frequencies;
    }
  }

  window.SparkHarmonicAnalyzer = SparkHarmonicAnalyzer;
})();
