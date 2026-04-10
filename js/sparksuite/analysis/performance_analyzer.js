(function() {
  'use strict';

  class SparkPerformanceAnalyzer {
    analyze(expectedNote, detectedNote, timingErrorMs) {
      var correctNote = expectedNote === detectedNote;
      var absTime = Math.abs(timingErrorMs);
      var timing = absTime;
      var rating = this.rate(absTime, correctNote);

      return {
        correctNote: correctNote,
        timing: timing,
        rating: rating
      };
    }

    rate(absTimingMs, correctNote) {
      if (!correctNote) return 'miss';
      if (absTimingMs < 40) return 'perfect';
      if (absTimingMs < 80) return 'good';
      if (absTimingMs < 120) return 'ok';
      return 'miss';
    }
  }

  window.SparkPerformanceAnalyzer = SparkPerformanceAnalyzer;
})();
