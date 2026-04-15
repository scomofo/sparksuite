(function() {
  'use strict';

  var TIMING_WINDOWS = {
    PERFECT: 50,
    GOOD: 100,
    OK: 160
  };

  function getTimingGrade(offsetMs) {
    var abs = Math.abs(typeof offsetMs === 'number' ? offsetMs : Infinity);
    if (abs <= TIMING_WINDOWS.PERFECT) return 'perfect';
    if (abs <= TIMING_WINDOWS.GOOD) return 'good';
    if (abs <= TIMING_WINDOWS.OK) return 'ok';
    return 'miss';
  }

  function getTimingScore(grade) {
    switch (grade) {
      case 'perfect': return 100;
      case 'good': return 70;
      case 'ok': return 40;
      default: return 0;
    }
  }

  window.PERFORMANCE_TIMING_WINDOWS = TIMING_WINDOWS;
  window.getPerformanceTimingGrade = getTimingGrade;
  window.getPerformanceTimingScore = getTimingScore;
})();
