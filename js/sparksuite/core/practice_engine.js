(function() {
  function normalizeSegmentType(type) {
    if (type === "rhythm_highway" || type === "rhythm" || type === "finger" || type === "warmup" || type === "transition") return "practice";
    if (type === "performance_song" || type === "performance_phrase") return "song";
    if (type === "challenge") return "challenge";
    return "practice";
  }

  function PracticeEngine(psychologyEngine) {
    this.psychologyEngine = psychologyEngine;
  }

  PracticeEngine.prototype.buildDailyPracticePlan = function(context) {
    context = context || {};
    var rawSegments = SparkPracticeBridge.buildDailyPracticeSegments(context);
    var instrumentContext = context.instrumentContext || {};
    var rhythmAdapter = instrumentContext.rhythmAdapter || null;

    var segments = [];
    var exercises = [];

    for (var i = 0; i < rawSegments.length; i++) {
      var seg = rawSegments[i];
      var exId = seg.id || ("ex_" + i);
      var segType = normalizeSegmentType(seg.type);

      // Build gameplay payload from instrument adapter (not mutation)
      var gameplayPayload = null;
      var enginePreset = null;
      var chartId = null;
      if (rhythmAdapter && seg.type === (typeof SparkSessionSegmentTypes !== "undefined" ? SparkSessionSegmentTypes.RHYTHM_HIGHWAY : "rhythm_highway")) {
        gameplayPayload = rhythmAdapter.createPayload({
          segment: seg,
          curriculum: context.curriculum || null,
          instrumentContext: instrumentContext
        });
        enginePreset = gameplayPayload ? gameplayPayload.enginePreset : null;
        chartId = gameplayPayload ? gameplayPayload.chartId : null;
      } else if (seg.meta) {
        gameplayPayload = seg.meta.gameplayPayload || null;
        enginePreset = seg.meta.enginePreset || null;
        chartId = seg.meta.chartId || null;
      }

      segments.push({
        id: seg.id || ("seg_" + i),
        type: segType,
        exerciseIds: [exId]
      });

      exercises.push({
        id: exId,
        type: segType,
        difficulty: seg.difficulty || "normal",
        data: {
          core: {
            skill: (seg.meta && seg.meta.skill) || null,
            chords: (seg.meta && seg.meta.chords) || null,
            pattern: (seg.meta && seg.meta.pattern) || null,
            instrument: (seg.meta && seg.meta.instrument) || null,
            durationSec: seg.durationSec || 60
          },
          gameplay: {
            payload: gameplayPayload,
            preset: enginePreset,
            chartId: chartId
          }
        }
      });
    }

    var focus = this.psychologyEngine.getFocusLabel(rawSegments);
    return {
      segments: segments,
      exercises: exercises,
      focus: focus,
      rewards: { xp: exercises.length * 10 }
    };
  };

  window.SparkSuitePracticeEngine = PracticeEngine;
})();
