(function() {
  function SessionPlan(input) {
    input = input || {};
    this.id = input.id || ("plan_" + Math.random().toString(36).slice(2, 10));
    this.flow = input.flow || "generic";
    this.generatedDate = input.generatedDate || new Date().toISOString().slice(0, 10);
    this.instrumentId = input.instrumentId || null;
    this.instrumentType = input.instrumentType || null;
    this.focus = input.focus || "Well-rounded practice";
    this.segments = Array.isArray(input.segments) ? input.segments : [];
    this.exercises = Array.isArray(input.exercises) ? input.exercises : [];
    this.lesson = input.lesson || null;
    this.difficulty = input.difficulty || null;
    this.rewards = Object.prototype.hasOwnProperty.call(input, "rewards") ? input.rewards : [];
    this.context = input.context || {};
  }

  function findExerciseById(exercises, id) {
    var i;
    if (!Array.isArray(exercises) || !id) return null;
    for (i = 0; i < exercises.length; i++) {
      if (exercises[i] && exercises[i].id === id) return exercises[i];
    }
    return null;
  }

  function titleizeToken(value) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, function(ch) { return ch.toUpperCase(); });
  }

  function buildLegacyItemLabel(segment, exercise, flow) {
    var core = exercise && exercise.data && exercise.data.core ? exercise.data.core : {};
    var songId = core.songId || (segment && segment.meta && segment.meta.songId) || null;
    var skill = core.skill || (segment && segment.meta && segment.meta.skill) || null;
    var chordNames = core.chords || (segment && segment.meta && segment.meta.chordNames) || null;
    var chordName = core.chordName || (segment && segment.meta && segment.meta.chordName) || null;

    if (segment && segment.label && segment.label !== segment.type) return segment.label;
    if (flow === "guided_session" && core.sessionNum != null) return "Guided Session " + core.sessionNum;
    if (songId) return titleizeToken(songId);
    if (Array.isArray(chordNames) && chordNames.length) return chordNames.join(" -> ");
    if (chordName) return chordName;
    if (skill) return titleizeToken(skill);
    if (segment && segment.id) return titleizeToken(segment.id);
    return titleizeToken(segment && segment.type ? segment.type : "practice");
  }

  function buildLegacyItemType(segment, exercise, flow) {
    var core = exercise && exercise.data && exercise.data.core ? exercise.data.core : {};
    var segmentType = segment && segment.type ? segment.type : "practice";
    if (flow === "guided_session" && core.sessionNum != null) return "guided_session";
    if (flow === "performance_song" && core.songId) return "performance_song";
    return segmentType;
  }

  function buildLegacyItemMeta(segment, exercise) {
    var meta = {};
    var core = exercise && exercise.data && exercise.data.core ? exercise.data.core : {};
    var key;
    if (segment && segment.meta) {
      for (key in segment.meta) {
        if (Object.prototype.hasOwnProperty.call(segment.meta, key)) meta[key] = segment.meta[key];
      }
    }
    if (core.skill != null) meta.skill = core.skill;
    if (core.chords != null) meta.chords = core.chords;
    if (core.chordName != null) meta.chordName = core.chordName;
    if (core.instrument != null) meta.instrument = core.instrument;
    if (core.durationSec != null) meta.durationSec = core.durationSec;
    if (core.sessionNum != null) meta.guidedSession = core.sessionNum;
    if (core.songId != null) meta.songId = core.songId;
    if (core.arrangementType != null) meta.arrangementType = core.arrangementType;
    if (core.difficultyId != null) meta.difficultyId = core.difficultyId;
    if (core.mode != null) meta.mode = core.mode;
    return meta;
  }

  function convertLegacyPlanItem(segment, exercises, flow) {
    var exerciseId = segment && Array.isArray(segment.exerciseIds) ? segment.exerciseIds[0] : null;
    var exercise = findExerciseById(exercises, exerciseId);
    var core = exercise && exercise.data && exercise.data.core ? exercise.data.core : {};
    return {
      id: segment && segment.id ? segment.id : (exerciseId || null),
      type: buildLegacyItemType(segment, exercise, flow),
      label: buildLegacyItemLabel(segment, exercise, flow),
      desc: segment && segment.desc ? segment.desc : "",
      durationSec: segment && segment.durationSec ? segment.durationSec : (core.durationSec || 0),
      completed: !!(segment && segment.completed),
      exerciseIds: segment && Array.isArray(segment.exerciseIds) ? segment.exerciseIds.slice() : [],
      meta: buildLegacyItemMeta(segment, exercise)
    };
  }

  SessionPlan.prototype.toLegacyPracticePlan = function() {
    var items = [];
    for (var i = 0; i < this.segments.length; i++) {
      items.push(convertLegacyPlanItem(this.segments[i], this.exercises, this.flow));
    }
    return {
      id: this.id,
      flow: this.flow,
      generatedDate: this.generatedDate,
      instrumentId: this.instrumentId,
      instrumentType: this.instrumentType,
      focus: this.focus,
      items: items,
      totalItems: items.length,
      completedItems: items.filter(function(item) { return item.completed; }).length,
      curriculum: this.context.curriculum || null
    };
  };

  window.SessionPlan = SessionPlan;
})();
