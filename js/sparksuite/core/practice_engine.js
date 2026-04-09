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
    var segments = SparkPracticeBridge.buildDailyPracticeSegments(context);
    segments = this.attachGameplayPayloads(segments, context);
    var focus = this.psychologyEngine.getFocusLabel(segments);
    return {
      segments: segments.map(function(seg, i) {
        return { id: seg.id || ("seg_" + i), type: normalizeSegmentType(seg.type), exerciseIds: [seg.id || ("ex_" + i)] };
      }),
      exercises: segments.map(function(seg, i) {
        return {
          id: seg.id || ("ex_" + i),
          type: normalizeSegmentType(seg.type),
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
              payload: (seg.meta && seg.meta.gameplayPayload) || null,
              preset: (seg.meta && seg.meta.enginePreset) || null,
              chartId: (seg.meta && seg.meta.chartId) || null
            }
          }
        };
      }),
      focus: focus,
      rewards: { xp: segments.length * 10 }
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
