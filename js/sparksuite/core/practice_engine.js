(function() {
  function PracticeEngine(psychologyEngine) {
    this.psychologyEngine = psychologyEngine;
  }

  PracticeEngine.prototype.setCalibrationDependencies = function(dependencies) {
    return {};
  };

  PracticeEngine.prototype.getCalibrationDependencies = function() {
    return {};
  };

  PracticeEngine.prototype.startCalibration = function(state, options) {
    state = state || {};
    options = options || {};
    var bpm = Number(options.bpm || 80);
    if (!isFinite(bpm) || bpm < 20 || bpm > 300) throw new Error("Invalid calibration BPM: " + options.bpm);
    return Object.assign({}, state, {
      calibrationRunning: true,
      calibrationOffsets: [],
      calibrationBpm: bpm,
      calibrationEffect: "startMetronome"
    });
  };

  PracticeEngine.prototype.stopCalibration = function(state) {
    state = state || {};
    return Object.assign({}, state, {
      calibrationRunning: false,
      calibrationOffsets: state.calibrationOffsets || [],
      calibrationEffect: "stopMetronome"
    });
  };

  PracticeEngine.prototype.getValidatedShellAction = function(action) {
    var allowed = {
      sessionPauseBlock: true,
      sessionResumeBlock: true,
      sessionSkipBlock: true,
      openPracticePlan: true
    };
    return allowed[action] ? action : "openPracticePlan";
  };

  PracticeEngine.prototype.resolveStrumChordNotes = function(chordName, context) {
    context = context || {};
    var activeData = context.activeInstrumentData || null;
    var globalChordNotes = context.chordNotes || (typeof CHORD_NOTES !== "undefined" ? CHORD_NOTES : null);
    if (activeData && activeData.CHORD_NOTES && activeData.CHORD_NOTES[chordName]) {
      return activeData.CHORD_NOTES[chordName];
    }
    return globalChordNotes ? globalChordNotes[chordName] : null;
  };

  PracticeEngine.prototype.generateEarTrainingQuestion = function(context) {
    context = context || {};
    var data = context.instrumentData || {};
    var random = typeof context.random === "function" ? context.random : Math.random;
    var level = parseInt(context.level, 10);
    var pool = [];
    var all = Array.isArray(data.ALL_CHORDS) ? data.ALL_CHORDS : [];
    var levelChords = data.CHORDS || {};
    var l;
    var i;
    var questionChord;
    var options;
    var attempts;
    var candidate;
    var fallbackPool;
    var fallbackName;
    var swapIdx;
    var tmp;
    function pickChord(source) {
      return source.length ? source[Math.floor(random() * source.length)] : null;
    }
    if (isNaN(level) || level < 1) level = 1;
    for (l = 1; l <= level; l++) {
      if (Array.isArray(levelChords[l])) pool = pool.concat(levelChords[l]);
    }
    if (!pool.length && Array.isArray(levelChords[1])) pool = levelChords[1].slice();
    if (!pool.length) pool = all.slice();
    if (!pool.length) return null;

    questionChord = pickChord(pool);
    options = [questionChord.name];
    attempts = 0;
    while (options.length < 4 && attempts < 100) {
      candidate = pickChord(all) || pickChord(pool);
      if (candidate && candidate.name && options.indexOf(candidate.name) === -1) options.push(candidate.name);
      attempts++;
    }
    if (options.length < 4) {
      fallbackPool = all.concat(pool);
      for (i = 0; i < fallbackPool.length && options.length < 4; i++) {
        fallbackName = fallbackPool[i] && fallbackPool[i].name;
        if (fallbackName && options.indexOf(fallbackName) === -1) options.push(fallbackName);
      }
      while (options.length < 4) options.push("");
    }
    for (i = options.length - 1; i > 0; i--) {
      swapIdx = Math.floor(random() * (i + 1));
      tmp = options[i];
      options[i] = options[swapIdx];
      options[swapIdx] = tmp;
    }
    return { question: questionChord.name, options: options };
  };

  PracticeEngine.prototype.buildDailyPracticePlan = function(context) {
    context = context || {};
    var miniSession = buildUkuleleMiniSessionPracticePlan(context);
    if (miniSession) return miniSession;
    var templated = buildTemplatePracticePlan(context);
    if (templated) return templated;
    var generated = this.generateExercises(context);
    return {
      segments: generated.segments,
      exercises: generated.exercises,
      focus: this.psychologyEngine.getFocusLabel(generated.sourceSegments || generated.segments),
      rewards: [{ type: "xp", amount: 40 }],
      source: generated.source
    };
  };

  function buildUkuleleMiniSessionPracticePlan(context) {
    if (!context.ukuleleMiniSessionId || typeof SparkUkuleleMiniSessions === "undefined" || !SparkUkuleleMiniSessions || typeof SparkUkuleleMiniSessions.buildPracticePlan !== "function") {
      return null;
    }
    return SparkUkuleleMiniSessions.buildPracticePlan({
      miniSessionId: context.ukuleleMiniSessionId,
      favorites: context.favoriteSongs || []
    });
  }

  function buildTemplatePracticePlan(context) {
    var lesson;
    var templatePlan;
    if (!context.practiceTemplateId || typeof SparkPracticeTemplates === "undefined" || !SparkPracticeTemplates || typeof SparkPracticeTemplates.buildPlan !== "function") {
      return null;
    }
    lesson = context.curriculum && context.curriculum.nextLesson ? context.curriculum.nextLesson : null;
    templatePlan = SparkPracticeTemplates.buildPlan({
      templateId: context.practiceTemplateId,
      instrumentType: context.instrumentContext ? context.instrumentContext.instrumentType : null,
      skill: lesson ? (lesson.skill || lesson.skillId || null) : null,
      lessonId: lesson ? lesson.id : (context.curriculum && context.curriculum.nextLessonId ? context.curriculum.nextLessonId : null),
      difficulty: context.difficulty || "easy"
    });
    return {
      segments: templatePlan.segments,
      exercises: templatePlan.exercises,
      focus: templatePlan.template.label,
      rewards: [{ type: "xp", amount: 40 }],
      source: "practice_template",
      practiceTemplate: templatePlan.template
    };
  }

  PracticeEngine.prototype.generateExercises = function(context) {
    context = context || {};
    var sourceSegments = this.attachGameplayPayloads(buildDailyPracticeSegments(context), context);
    var instrumentExercises = resolveInstrumentExercises(context);
    var segments = [];
    var exercises = [];
    var source = instrumentExercises.length ? "instrument+bridge" : "bridge";
    var i;
    var normalized;

    if (!sourceSegments.length && instrumentExercises.length) {
      sourceSegments = buildSegmentsFromInstrumentExercises(instrumentExercises, context);
      source = "instrument";
    }

    for (i = 0; i < sourceSegments.length; i++) {
      normalized = normalizeSegmentAndExercise(sourceSegments[i], instrumentExercises[i] || null, context, i);
      segments.push(normalized.segment);
      exercises.push(normalized.exercise);
    }

    return {
      segments: segments,
      exercises: exercises,
      source: source,
      sourceSegments: sourceSegments
    };
  };

  PracticeEngine.prototype.attachGameplayPayloads = function(segments, context) {
    context = context || {};
    segments = Array.isArray(segments) ? segments : [];
    var instrumentContext = context.instrumentContext || {};
    var rhythmAdapter = instrumentContext.rhythmAdapter || null;
    var i;
    if (!rhythmAdapter) return segments;

    for (i = 0; i < segments.length; i++) {
      if (!segments[i] || segments[i].type !== SparkSessionSegmentTypes.RHYTHM_HIGHWAY) continue;
      if (!segments[i].meta) segments[i].meta = {};
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

  PracticeEngine.prototype.analyzeResults = function(results) {
    results = results || {};
    var total = Math.max(results.total || 0, 1);
    var hits = Math.max(0, results.hits || 0);
    return {
      accuracy: hits / total,
      timing: results.timing || null,
      misses: Math.max(0, total - hits),
      raw: results
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
    var i;
    for (i = 0; i < candidates.length; i++) {
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

  function resolveInstrumentExercises(context) {
    var instrumentContext = context && context.instrumentContext ? context.instrumentContext : {};
    var adapter = instrumentContext.adapter || null;
    var lesson = context && context.curriculum ? context.curriculum.nextLesson : null;
    var skill = lesson ? (lesson.skill || lesson.skillId || null) : null;
    var exercises;
    var picked;
    var recommendation;
    if (!adapter || typeof adapter.getExercises !== "function" || !skill) return [];
    exercises = adapter.getExercises(skill) || [];
    if (!Array.isArray(exercises) || !exercises.length) return [];
    picked = adapter && typeof adapter.pickPracticeExercise === "function"
      ? adapter.pickPracticeExercise(lesson, exercises, buildInstrumentState(instrumentContext))
      : null;
    if (picked) {
      recommendation = adapter && typeof adapter.getPracticeRecommendation === "function"
        ? adapter.getPracticeRecommendation(lesson, picked, buildInstrumentState(instrumentContext))
        : null;
      return [attachExerciseRecommendation(picked, recommendation)].concat(filterRemainingExercises(exercises, picked)).slice(0, 3);
    }
    return exercises.slice(0, 3);
  }

  function attachExerciseRecommendation(exercise, recommendation) {
    var copy = clone(exercise);
    if (recommendation) copy.recommendation = clone(recommendation);
    return copy;
  }

  function filterRemainingExercises(exercises, selected) {
    var out = [];
    var i;
    for (i = 0; i < exercises.length; i++) {
      if (!exercises[i] || !selected || exercises[i].id === selected.id) continue;
      out.push(exercises[i]);
    }
    return out;
  }

  function buildInstrumentState(instrumentContext) {
    return {
      instrumentType: instrumentContext ? instrumentContext.instrumentType : null,
      completedLessonIds: getCompletedLessonIds(instrumentContext ? instrumentContext.instrumentType : null)
    };
  }

  function getCompletedLessonIds(instrumentType) {
    var completed = [];
    var mastery;
    var key;
    var v2Completed;
    if (typeof S !== "undefined" && S && Array.isArray(S.completedLessons)) {
      completed = S.completedLessons.slice();
    }
    mastery = typeof SparkMastery !== "undefined" && SparkMastery && typeof SparkMastery.category === "function"
      ? SparkMastery.category("lessons")
      : ((typeof S !== "undefined" && S && S.mastery && S.mastery.lessons) || {});
    for (key in mastery) {
      if (mastery[key] && completed.indexOf(key) === -1) completed.push(key);
    }
    v2Completed = instrumentType && typeof S !== "undefined" && S && S.curriculumV2CompletedSessions
      ? S.curriculumV2CompletedSessions[instrumentType]
      : null;
    if (Array.isArray(v2Completed)) {
      for (key = 0; key < v2Completed.length; key++) {
        if (completed.indexOf(v2Completed[key]) === -1) completed.push(v2Completed[key]);
      }
    }
    return completed;
  }

  function buildSegmentsFromInstrumentExercises(exercises, context) {
    var lesson = context && context.curriculum ? context.curriculum.nextLesson : null;
    var out = [];
    var i;
    for (i = 0; i < exercises.length; i++) {
      out.push({
        id: exercises[i].id || ("practice_" + i),
        type: mapInstrumentSegmentType(exercises[i].type),
        label: exercises[i].name || humanizeToken(exercises[i].type || "practice"),
        desc: buildInstrumentExerciseDescription(exercises[i], lesson),
        durationSec: exercises[i].durationSec || exercises[i].duration || 90,
        meta: buildInstrumentExerciseMeta(exercises[i], context)
      });
    }
    return out;
  }

  function normalizeSegmentAndExercise(rawSegment, authoredExercise, context, index) {
    rawSegment = rawSegment || {};
    var meta = clone(rawSegment.meta || {});
    var lesson = context && context.curriculum ? context.curriculum.nextLesson : null;
    var difficulty = context && context.difficulty ? context.difficulty : "normal";
    var segType = normalizeSegmentType(rawSegment.type, authoredExercise);
    var exId = normalizeExerciseId(rawSegment, authoredExercise, index);
    var durationSec = rawSegment.durationSec || (authoredExercise && (authoredExercise.durationSec || authoredExercise.duration)) || 60;
    var segment = createSegment(rawSegment, segType, exId, meta, durationSec, authoredExercise);
    var exercise = createExercise(exId, segType, rawSegment, authoredExercise, meta, lesson, context, difficulty, durationSec);
    return {
      segment: segment,
      exercise: exercise
    };
  }

  function createSegment(rawSegment, segType, exerciseId, meta, durationSec, authoredExercise) {
    var base = {
      id: rawSegment.id || ("seg_" + exerciseId),
      type: segType,
      label: rawSegment.label || humanizeToken(authoredExercise && authoredExercise.name) || humanizeToken(segType),
      desc: rawSegment.desc || rawSegment.description || "",
      durationSec: durationSec,
      completed: !!rawSegment.completed,
      meta: meta
    };
    if (authoredExercise && authoredExercise.id) base.meta.instrumentExerciseId = authoredExercise.id;
    if (authoredExercise && authoredExercise.type) base.meta.exerciseType = authoredExercise.type;
    if (typeof SparkSessionSegment !== "undefined" && SparkSessionSegment && typeof SparkSessionSegment.create === "function") {
      base = SparkSessionSegment.create(base);
    }
    base.exerciseIds = [exerciseId];
    return base;
  }

  function createExercise(exerciseId, segType, rawSegment, authoredExercise, meta, lesson, context, difficulty, durationSec) {
    var type = mapExerciseType(segType, authoredExercise);
    var presentationLabel = rawSegment.label || authoredExercise && (authoredExercise.name || authoredExercise.id) || humanizeToken(type);
    var presentationReason = rawSegment.desc || rawSegment.description || buildInstrumentExerciseDescription(authoredExercise, lesson);
    return {
      id: exerciseId,
      type: type,
      difficulty: difficulty,
      data: {
        presentation: {
          label: presentationLabel,
          reason: presentationReason
        },
        core: buildCore(rawSegment, authoredExercise, meta, lesson, context, durationSec),
        gameplay: buildGameplay(rawSegment, authoredExercise, meta)
      }
    };
  }

  function buildCore(rawSegment, authoredExercise, meta, lesson, context, durationSec) {
    var skill = meta.skill || meta.exerciseFocus || (lesson && (lesson.skill || lesson.skillId)) || (authoredExercise && authoredExercise.focus) || null;
    var chords = null;
    var progression = authoredExercise && Array.isArray(authoredExercise.progression) ? authoredExercise.progression.slice() : null;
    if (authoredExercise && authoredExercise.chord) chords = [authoredExercise.chord];
    else if (authoredExercise && authoredExercise.from && authoredExercise.to) chords = [authoredExercise.from, authoredExercise.to];
    else if (meta.from && meta.to) chords = [meta.from, meta.to];
    else if (typeof meta.key === "string" && meta.key.indexOf("|") >= 0) chords = meta.key.split("|");
    else if (Array.isArray(meta.chords)) chords = meta.chords.slice();
    else if (progression) chords = progression;
    return {
      skill: skill,
      chords: chords,
      pattern: meta.pattern || (authoredExercise && authoredExercise.pattern) || null,
      from: meta.from || (authoredExercise && authoredExercise.from) || null,
      to: meta.to || (authoredExercise && authoredExercise.to) || null,
      notes: authoredExercise && Array.isArray(authoredExercise.notes) ? authoredExercise.notes.slice() : null,
      instrument: context && context.instrumentContext ? context.instrumentContext.instrumentType : null,
      durationSec: durationSec,
      tempo: meta.tempo || (authoredExercise && authoredExercise.tempo) || null,
      songId: meta.songId || (authoredExercise && authoredExercise.id && /song|perform/.test(authoredExercise.type || "") ? authoredExercise.id : null),
      lessonId: lesson && lesson.id ? lesson.id : (meta.curriculumLessonId || null)
    };
  }

  function buildGameplay(rawSegment, authoredExercise, meta) {
    return {
      payload: meta.gameplayPayload || null,
      preset: meta.enginePreset || null,
      chartId: meta.chartId || (authoredExercise && authoredExercise.chartId) || null
    };
  }

  function buildInstrumentExerciseMeta(exercise, context) {
    var lesson = context && context.curriculum ? context.curriculum.nextLesson : null;
    var meta = {
      skill: lesson ? (lesson.skill || lesson.skillId || null) : null
    };
    if (exercise && exercise.from) meta.from = exercise.from;
    if (exercise && exercise.to) meta.to = exercise.to;
    if (exercise && exercise.pattern) meta.pattern = exercise.pattern;
    if (exercise && exercise.tempo) meta.tempo = exercise.tempo;
    if (exercise && exercise.id) meta.instrumentExerciseId = exercise.id;
    if (exercise && exercise.type) meta.exerciseType = exercise.type;
    return meta;
  }

  function buildInstrumentExerciseDescription(exercise, lesson) {
    if (exercise && exercise.recommendation && exercise.recommendation.reason) {
      return exercise.recommendation.reason;
    }
    if (exercise && exercise.focus) {
      return "Focus on " + humanizeToken(exercise.focus) + ".";
    }
    if (lesson && lesson.title) {
      return "Supports " + lesson.title + ".";
    }
    return "";
  }

  function normalizeSegmentType(rawType, authoredExercise) {
    var authoredType = authoredExercise && authoredExercise.type ? authoredExercise.type : "";
    if (rawType === SparkSessionSegmentTypes.RHYTHM_HIGHWAY) return SparkSessionSegmentTypes.RHYTHM_HIGHWAY;
    if (rawType === SparkSessionSegmentTypes.CHALLENGE) return SparkSessionSegmentTypes.CHALLENGE;
    if (rawType === SparkSessionSegmentTypes.TRANSITION) return SparkSessionSegmentTypes.TRANSITION;
    if (/song|perform/.test(authoredType)) return SparkSessionSegmentTypes.PERFORMANCE_SONG || "song";
    if (/transition/.test(authoredType)) return SparkSessionSegmentTypes.TRANSITION || "transition";
    return SparkSessionSegmentTypes.normalize
      ? SparkSessionSegmentTypes.normalize(rawType || "practice")
      : (rawType || "practice");
  }

  function mapExerciseType(segType, authoredExercise) {
    if (authoredExercise && authoredExercise.type) return authoredExercise.type;
    if (segType === SparkSessionSegmentTypes.RHYTHM_HIGHWAY) return "rhythm";
    if (segType === SparkSessionSegmentTypes.TRANSITION) return "chord_transition";
    if (segType === SparkSessionSegmentTypes.PERFORMANCE_SONG || segType === "song") return "song";
    if (segType === SparkSessionSegmentTypes.CHALLENGE) return "challenge";
    return segType || "practice";
  }

  function mapInstrumentSegmentType(type) {
    if (/song|perform/.test(type || "")) return SparkSessionSegmentTypes.PERFORMANCE_SONG || "song";
    if (/transition/.test(type || "")) return SparkSessionSegmentTypes.TRANSITION || "transition";
    return SparkSessionSegmentTypes.normalize
      ? SparkSessionSegmentTypes.normalize("practice")
      : "practice";
  }

  function normalizeExerciseId(rawSegment, authoredExercise, index) {
    return (authoredExercise && authoredExercise.id)
      || (rawSegment && rawSegment.id ? "ex_" + rawSegment.id : null)
      || ("ex_practice_" + index);
  }

  function humanizeToken(value) {
    if (!value) return "";
    return String(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  window.SparkSuitePracticeEngine = PracticeEngine;
})();
