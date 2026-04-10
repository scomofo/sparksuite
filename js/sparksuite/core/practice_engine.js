(function() {
  function PracticeEngine(psychologyEngine) {
    this.psychologyEngine = psychologyEngine;
  }

  PracticeEngine.prototype.buildDailyPracticePlan = function(context) {
    context = context || {};
    var segments = SparkPracticeBridge.buildDailyPracticeSegments(context);
    segments = this.attachGameplayPayloads(segments, context);
    var exercises = this.buildExercisesFromSegments(segments);
    return {
      segments: segments,
      exercises: exercises,
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

  PracticeEngine.prototype.buildExercisesFromSegments = function(segments) {
    var exercises = [];
    for (var i = 0; i < segments.length; i++) {
      var segment = segments[i] || {};
      var meta = segment.meta || {};
      var exerciseId = meta.exerciseId || ("ex_" + (segment.id || ("practice_" + i)));
      var normalizedType = mapSegmentType(segment.type);
      if (!Array.isArray(segment.exerciseIds) || !segment.exerciseIds.length) {
        segment.exerciseIds = [exerciseId];
      }
      exercises.push({
        id: exerciseId,
        type: normalizedType,
        difficulty: segment.difficulty || meta.difficultyId || meta.difficulty || "normal",
        data: {
          core: {
            skill: meta.skill || null,
            chords: meta.chords || meta.chordNames || (meta.chordName ? [meta.chordName] : null),
            pattern: meta.pattern || null,
            instrument: meta.instrument || null,
            durationSec: segment.durationSec || 0,
            songId: meta.songId || null,
            chartId: meta.chartId || null,
            arrangementType: meta.arrangementType || null,
            difficultyId: meta.difficultyId || null,
            mode: meta.mode || null
          },
          gameplay: {
            payload: meta.gameplayPayload || null,
            preset: meta.enginePreset || null,
            chartId: meta.chartId || null
          }
        }
      });
    }
    return exercises;
  };

  function mapSegmentType(type) {
    if (type === SparkSessionSegmentTypes.PERFORMANCE_SONG) return "song";
    if (type === "song") return "song";
    if (type === "challenge") return "challenge";
    return "practice";
  }

  window.SparkSuitePracticeEngine = PracticeEngine;
})();
