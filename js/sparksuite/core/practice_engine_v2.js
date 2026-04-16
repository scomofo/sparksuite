(function() {
  function PracticeEngineV2(psychologyEngine) {
    this.psychologyEngine = psychologyEngine || null;
  }

  PracticeEngineV2.prototype.buildDailyPracticePlan = function(context) {
    context = context || {};

    var rawSegments = typeof SparkPracticeBridge !== "undefined" && SparkPracticeBridge && typeof SparkPracticeBridge.buildDailyPracticeSegments === "function"
      ? SparkPracticeBridge.buildDailyPracticeSegments(context)
      : buildFallbackSegments(context);

    var exercises = [];
    var segments = [];

    for (var i = 0; i < rawSegments.length; i++) {
      var seg = rawSegments[i] || {};
      var exId = "ex_" + i;
      var normalizedType = normalizeExerciseType(seg.type);
      var exercise = {
        id: exId,
        type: normalizedType,
        difficulty: context.difficulty || "normal",
        data: {
          core: buildCoreData(seg, normalizedType),
          presentation: {
            label: seg.label || seg.type || "Practice item",
            reason: seg.desc || ""
          },
          gameplay: buildGameplayData(seg, normalizedType, context)
        }
      };

      exercises.push(exercise);
      segments.push({
        id: "seg_" + i,
        type: mapSegmentType(seg.type),
        exerciseIds: [exId]
      });
    }

    return {
      segments: segments,
      exercises: exercises,
      focus: resolveFocusLabel(this.psychologyEngine, rawSegments)
    };
  };

  function normalizeExerciseType(type) {
    if (type === SparkSessionSegmentTypes.RHYTHM_HIGHWAY || type === "rhythm") return "rhythm";
    if (type === SparkSessionSegmentTypes.TRANSITION || type === "transition") return "chord_transition";
    if (type === SparkSessionSegmentTypes.PERFORMANCE_SONG || type === "performance_song") return "performance_song";
    return type || "practice";
  }

  function mapSegmentType(type) {
    if (type === SparkSessionSegmentTypes.RHYTHM_HIGHWAY || type === SparkSessionSegmentTypes.PERFORMANCE_SONG) return "song";
    return "practice";
  }

  function buildCoreData(seg, normalizedType) {
    var meta = seg && seg.meta ? seg.meta : {};
    var core = {};
    var chordNames;

    if (normalizedType === "chord_transition") {
      chordNames = buildTransitionChords(meta);
      if (chordNames) core.chords = chordNames;
    }
    if (meta.skill != null) core.skill = meta.skill;
    if (meta.exerciseFocus != null) core.exerciseFocus = meta.exerciseFocus;
    if (seg && seg.durationSec != null) core.durationSec = seg.durationSec;
    return core;
  }

  function buildGameplayData(seg, normalizedType, context) {
    if (normalizedType !== "rhythm") return null;
    var rhythmAdapter = context && context.instrumentContext ? context.instrumentContext.rhythmAdapter : null;
    if (!rhythmAdapter || typeof rhythmAdapter.createPayload !== "function") return null;
    return rhythmAdapter.createPayload({
      curriculum: context.curriculum || null,
      segment: seg
    });
  }

  function buildTransitionChords(meta) {
    if (!meta) return null;
    if (Array.isArray(meta.chords) && meta.chords.length) return meta.chords.slice();
    if (meta.from || meta.to) return [meta.from || "", meta.to || ""].filter(Boolean);
    if (typeof meta.key === "string" && meta.key) return meta.key.split("|").filter(Boolean);
    return null;
  }

  function resolveFocusLabel(psychologyEngine, rawSegments) {
    if (psychologyEngine && typeof psychologyEngine.getFocusLabel === "function") {
      return psychologyEngine.getFocusLabel(rawSegments);
    }
    return "Well-rounded practice";
  }

  function buildFallbackSegments(context) {
    var candidates = typeof buildPracticeCandidates === "function" ? buildPracticeCandidates(context) : [];
    var segments = [];
    for (var i = 0; i < candidates.length; i++) {
      segments.push(mapCandidateToSegment(candidates[i], context));
    }
    return segments;
  }

  function mapCandidateToSegment(candidate, context) {
    candidate = candidate || {};
    var meta = clone(candidate.meta || {});
    if (context && context.curriculum && context.curriculum.nextLessonId) {
      meta.curriculumLessonId = context.curriculum.nextLessonId;
    }
    return {
      id: candidate.id || ("candidate_" + Math.random().toString(36).slice(2, 8)),
      type: candidate.type === "rhythm" ? SparkSessionSegmentTypes.RHYTHM_HIGHWAY : (candidate.type || SparkSessionSegmentTypes.PRACTICE),
      label: candidate.label,
      desc: candidate.reason || "",
      durationSec: meta.durationSec || 120,
      meta: meta
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  window.SparkSuitePracticeEngineV2 = PracticeEngineV2;
  window.SparkSuitePracticeEngine = window.SparkSuitePracticeEngine || PracticeEngineV2;
})();
