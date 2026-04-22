(function() {
  function PracticeEngine(psychologyEngine) {
    this.psychologyEngine = psychologyEngine;
  }

  PracticeEngine.prototype.buildDailyPracticePlan = function(context) {
    context = context || {};
    var rawSegments = buildDailyPracticeSegments(context);
    var exercises = [];
    var segments = [];

    for (var i = 0; i < rawSegments.length; i++) {
      var seg = rawSegments[i];
      var exId = "ex_" + i;

      var exercise = {
        id: exId,
        type: mapExerciseType(seg),
        difficulty: context.difficulty || "normal"
      };
      exercise.data = {
        presentation: {
          label: seg.label,
          reason: seg.desc
        },
        core: buildCore(seg),
        gameplay: buildGameplay(seg, context)
      };

      exercises.push(exercise);

      segments.push({
        id: seg.id || ("seg_" + i),
        type: mapSegmentType(seg.type),
        exerciseIds: [exId]
      });
    }

    return {
      segments: segments,
      exercises: exercises,
      focus: this.psychologyEngine.getFocusLabel(rawSegments)
    };
  };

  function buildDailyPracticeSegments(context) {
    if (window.SparkPracticeBridge && typeof window.SparkPracticeBridge.buildDailyPracticeSegments === "function") {
      return window.SparkPracticeBridge.buildDailyPracticeSegments(context);
    }

    if (typeof buildPracticeCandidates !== "function") {
      return [];
    }

    var candidates = buildPracticeCandidates();
    var segments = [];
    for (var i = 0; i < candidates.length; i++) {
      segments.push(createFallbackSegment(candidates[i], context));
    }
    return segments;
  }

  function createFallbackSegment(candidate, context) {
    candidate = candidate || {};
    var meta = clone(candidate.meta || {});
    if (context && context.curriculum && context.curriculum.nextLessonId) {
      meta.curriculumLessonId = context.curriculum.nextLessonId;
    }

    return {
      id: candidate.id || null,
      type: candidate.type === "rhythm" ? SparkSessionSegmentTypes.RHYTHM_HIGHWAY : (candidate.type || "practice"),
      label: candidate.label,
      desc: candidate.reason || "",
      durationSec: meta.durationSec || 0,
      meta: meta
    };
  }

  function buildCore(seg) {
    var meta = seg && seg.meta ? seg.meta : {};
    var chords = null;

    if (meta.from && meta.to) {
      chords = [meta.from, meta.to];
    } else if (typeof meta.key === "string" && meta.key.indexOf("|") >= 0) {
      chords = meta.key.split("|");
    } else if (Array.isArray(meta.chords)) {
      chords = meta.chords.slice();
    }

    return {
      skill: meta.skill || meta.exerciseFocus || null,
      chords: chords,
      pattern: meta.pattern || null,
      from: meta.from || null,
      to: meta.to || null
    };
  }

  function buildGameplay(seg, context) {
    var instrumentContext = context.instrumentContext || {};
    var rhythmAdapter = instrumentContext.rhythmAdapter;

    if (!rhythmAdapter) return null;
    if (!seg || seg.type !== SparkSessionSegmentTypes.RHYTHM_HIGHWAY) return null;

    return rhythmAdapter.createPayload({
      segment: seg,
      curriculum: context.curriculum || null,
      instrumentContext: instrumentContext
    });
  }

  function mapExerciseType(seg) {
    if (!seg) return "practice";
    if (seg.type === SparkSessionSegmentTypes.RHYTHM_HIGHWAY) return "rhythm";
    if (seg.type === SparkSessionSegmentTypes.TRANSITION) return "chord_transition";
    return seg.type || "practice";
  }

  function mapSegmentType(type) {
    if (type === SparkSessionSegmentTypes.RHYTHM_HIGHWAY) return "song";
    if (type === SparkSessionSegmentTypes.PERFORMANCE_SONG) return "song";
    if (type === SparkSessionSegmentTypes.CHALLENGE) return "challenge";
    return "practice";
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  window.SparkSuitePracticeEngineV2 = PracticeEngine;
  window.SparkSuitePracticeEngine = window.SparkSuitePracticeEngine || PracticeEngine;
})();
