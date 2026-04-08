(function() {
  function PsychologyEngine() {}

  PsychologyEngine.prototype.getFocusLabel = function(segments) {
    segments = segments || [];
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].type === SparkSessionSegmentTypes.TRANSITION) return "Smooth chord transitions";
      if (segments[i].type === SparkSessionSegmentTypes.PERFORMANCE_SONG || segments[i].type === SparkSessionSegmentTypes.PERFORMANCE_PHRASE) return "Song mastery";
      if (segments[i].type === SparkSessionSegmentTypes.RHYTHM) return "Rhythm accuracy";
    }
    return "Well-rounded practice";
  };

  PsychologyEngine.prototype.shouldReward = function(sessionCount) {
    return typeof SparkPsychology !== "undefined" ? SparkPsychology.shouldReward(sessionCount) : false;
  };

  window.SparkSuitePsychologyEngine = PsychologyEngine;
})();
