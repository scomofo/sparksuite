(function() {
  'use strict';

  class SparkPerformanceAnalyzer {
    analyze(expectedNote, detectedNote, timingErrorMs) {
      var correctNote = expectedNote === detectedNote;
      var absTime = Math.abs(timingErrorMs);
      var timing = absTime;
      var rating = this.rate(absTime, correctNote);
      var score = this.score(absTime, correctNote);

      return {
        correctNote: correctNote,
        timing: timing,
        rating: rating,
        score: score,
        hit: rating !== 'miss',
        error: timingErrorMs || 0,
        judgement: rating,
        expected: expectedNote,
        detected: detectedNote
      };
    }

    rate(absTimingMs, correctNote) {
      if (!correctNote) return 'miss';
      if (absTimingMs < 40) return 'perfect';
      if (absTimingMs < 80) return 'good';
      if (absTimingMs < 120) return 'ok';
      return 'miss';
    }

    score(absTimingMs, correctNote) {
      if (!correctNote) return 0;
      if (absTimingMs < 40) return 1;
      if (absTimingMs < 80) return 0.75;
      if (absTimingMs < 120) return 0.5;
      return 0;
    }
  }

  window.SparkPerformanceAnalyzer = SparkPerformanceAnalyzer;
})();
