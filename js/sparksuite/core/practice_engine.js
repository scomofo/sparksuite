(function() {
  function PracticeEngine(psychologyEngine) {
    this.psychologyEngine = psychologyEngine;
  }

  PracticeEngine.prototype.buildDailyPracticePlan = function(context) {
    context = context || {};
    var segments = SparkPracticeBridge.buildDailyPracticeSegments(context);
    segments = this.attachGameplayPayloads(segments, context);
    return {
      segments: segments,
      focus: this.psychologyEngine.getFocusLabel(segments)
    };
  };

  PracticeEngine.prototype.attachGameplayPayloads = function(segments, context) {
    context = context || {};
    var instrumentContext = context.instrumentContext || {};
    var rhythmAdapter = instrumentContext.rhythmAdapter || null;
    if (!rhythmAdapter) return segments;

    for (var i = 0; i < segments.length; i++) {
      if (segments[i].type !== SparkSessionSegmentTypes.RHYTHM_HIGHWAY) continue;
      segments[i].meta.gameplayPayload = rhythmAdapter.createPayload({
        segment: segments[i],
        curriculum: context.curriculum || null,
        instrumentContext: instrumentContext
      });
      segments[i].meta.enginePreset = segments[i].meta.gameplayPayload.enginePreset;
      segments[i].meta.chartId = segments[i].meta.gameplayPayload.chartId;
    }
    return segments;
  };

  window.SparkSuitePracticeEngine = PracticeEngine;
})();
