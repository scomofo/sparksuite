(function() {
  function PracticeEngineV2(psychologyEngine) {
    this.psychologyEngine = psychologyEngine || null;
  }

  PracticeEngineV2.prototype.buildDailyPracticePlan = function(context) {
    context = context || {};
    var candidates = getPracticeCandidates();
    var exercises = [];
    var segments = [];
    var totalXp = 0;
    var i;

    for (i = 0; i < candidates.length; i++) {
      var normalized = normalizeCandidate(candidates[i], context, exercises.length);
      exercises.push(normalized.exercise);
      segments.push(normalized.segment);
      totalXp += normalized.rewardXp;
    }

    if (!segments.length) {
      var fallback = createFallbackPractice(context);
      exercises.push(fallback.exercise);
      segments.push(fallback.segment);
      totalXp += fallback.rewardXp;
    }

    return {
      focus: getFocusLabel(this.psychologyEngine, segments),
      segments: segments,
      exercises: exercises,
      rewards: { xp: totalXp }
    };
  };

  function getPracticeCandidates() {
    if (typeof buildPracticeCandidates === "function") {
      var candidates = buildPracticeCandidates();
      if (Array.isArray(candidates)) return candidates.slice(0, 5);
    }
    return [];
  }

  function normalizeCandidate(candidate, context, index) {
    candidate = candidate || {};
    var segmentType = mapSegmentType(candidate.type);
    var exerciseType = inferExerciseType(candidate);
    var exerciseId = "ex_" + index;
    var exercise;
    var segment;
    var data = {
      presentation: {
        label: candidate.label || exerciseType,
        reason: candidate.reason || candidate.desc || ""
      },
      core: buildCore(candidate),
      gameplay: buildGameplay(candidate, context)
    };

    attachInstrumentExerciseData(data, context, candidate.meta || {});
    attachExerciseMetadata(data, context, candidate);

    exercise = {
      id: exerciseId,
      type: exerciseType,
      difficulty: resolveDifficulty(context),
      data: data
    };

    segment = {
      id: candidate.id || ("seg_" + index),
      type: segmentType,
      exerciseIds: [exerciseId]
    };

    return {
      segment: segment,
      exercise: exercise,
      rewardXp: inferRewardXp(segmentType)
    };
  }

  function attachInstrumentExerciseData(data, context, meta) {
    var module = resolveInstrumentModule(context);
    var exercises;
    var i;
    if (!module || typeof module.getExercises !== "function") return;
    if (!meta.skill) return;
    exercises = module.getExercises(meta.skill);
    if (!Array.isArray(exercises) || !exercises.length) return;

    if (meta.exerciseId) {
      for (i = 0; i < exercises.length; i++) {
        if (exercises[i] && exercises[i].id === meta.exerciseId) {
          data.core.authoredExercise = clone(exercises[i]);
          return;
        }
      }
    }
    data.core.authoredExercise = clone(exercises[0]);
  }

  function attachExerciseMetadata(data, context, candidate) {
    var meta = clone((candidate && candidate.meta) || {});
    var instrumentType = context.instrumentContext && context.instrumentContext.instrumentType
      ? context.instrumentContext.instrumentType
      : null;

    data.core.instrument = instrumentType;
    data.core.durationSec = inferDurationSec(candidate);
    data.core.meta = meta;

    if (meta.from || meta.to || meta.key) {
      data.core.chords = compact([meta.from, meta.to]);
      if (!data.core.transitionKey && meta.key) data.core.transitionKey = meta.key;
    }
    if (meta.chordName) data.core.chords = compact([meta.chordName]);
    if (meta.songId) data.core.songId = meta.songId;
    if (meta.arrangementType) data.core.arrangementType = meta.arrangementType;
    if (meta.difficultyId) data.core.difficultyId = meta.difficultyId;
    if (meta.exerciseFocus) data.core.exerciseFocus = meta.exerciseFocus;
    if (meta.skill) data.core.skill = meta.skill;
  }

  function buildCore(candidate) {
    var meta = clone((candidate && candidate.meta) || {});
    return {
      skill: meta.skill || null,
      chords: meta.chords || null,
      pattern: meta.pattern || null
    };
  }

  function buildGameplay(candidate, context) {
    var rhythmAdapter = context.instrumentContext && context.instrumentContext.rhythmAdapter
      ? context.instrumentContext.rhythmAdapter
      : null;
    if (!rhythmAdapter || typeof rhythmAdapter.createPayload !== "function") return null;

    return rhythmAdapter.createPayload({
      segment: {
        id: candidate.id || "segment",
        type: SparkSessionSegmentTypes ? SparkSessionSegmentTypes.RHYTHM_HIGHWAY : "rhythm_highway",
        meta: {
          skill: candidate.meta && candidate.meta.skill ? candidate.meta.skill : null
        }
      },
      curriculum: context.curriculum || null,
      instrumentContext: context.instrumentContext || {}
    });
  }

  function resolveDifficulty(context) {
    return context && context.difficulty ? context.difficulty : "normal";
  }

  function createFallbackPractice(context) {
    return normalizeCandidate({
      id: "practice_default",
      type: "warmup",
      label: "Quick warmup",
      reason: "Start with a short warmup",
      meta: { durationSec: 120 }
    }, context, 0);
  }

  function resolveInstrumentModule(context) {
    var instrumentType = context.instrumentContext && context.instrumentContext.instrumentType
      ? context.instrumentContext.instrumentType
      : null;
    var map = {
      bass: window.SparkBassModule,
      ukulele: window.SparkUkuleleModule,
      guitar: window.SparkGuitarModule,
      piano: window.SparkPianoModule
    };
    return instrumentType ? (map[instrumentType] || null) : null;
  }

  function mapSegmentType(candidateType) {
    switch (candidateType) {
      case "performance_song":
      case "performance_phrase":
      case "performance_technique":
      case "rhythm":
      case "rhythm_highway":
        return "song";
      default:
        return "practice";
    }
  }

  function inferExerciseType(candidate) {
    switch (candidate.type) {
      case "transition":
        return "chord_transition";
      case "performance_song":
      case "performance_phrase":
      case "performance_technique":
        return "song";
      case "rhythm":
      case "rhythm_highway":
        return "rhythm";
      case "warmup":
      case "finger":
        return "warmup";
      default:
        return String(candidate.type || "practice");
    }
  }

  function inferDurationSec(candidate) {
    if (candidate.meta && candidate.meta.durationSec) return candidate.meta.durationSec;
    switch (candidate.type) {
      case "transition": return 180;
      case "performance_song": return 240;
      case "performance_phrase": return 180;
      case "performance_technique": return 180;
      case "rhythm":
      case "rhythm_highway": return 120;
      default: return 120;
    }
  }

  function inferRewardXp(segmentType) {
    return segmentType === "song" ? 25 : 15;
  }

  function getFocusLabel(psychologyEngine, segments) {
    if (psychologyEngine && typeof psychologyEngine.getFocusLabel === "function") {
      return psychologyEngine.getFocusLabel(segments);
    }
    return segments.length ? String(segments[0].type || "practice") : "practice";
  }

  function compact(values) {
    var out = [];
    var i;
    for (i = 0; i < values.length; i++) {
      if (values[i]) out.push(values[i]);
    }
    return out;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || null));
  }

  window.SparkSuitePracticeEngineV2 = PracticeEngineV2;
})();
