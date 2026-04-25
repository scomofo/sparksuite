(function() {
  function validateExerciseIds(exercises) {
    var seen = {};
    var i;
    var exercise;
    for (i = 0; i < exercises.length; i++) {
      exercise = exercises[i];
      if (!exercise || typeof exercise.id !== "string" || !exercise.id) {
        throw new Error("SessionPlan exercise at index " + i + " requires a string id");
      }
      if (seen[exercise.id]) {
        throw new Error("SessionPlan exercises contain duplicate id: " + exercise.id);
      }
      seen[exercise.id] = true;
    }
    return seen;
  }

  function validateSegmentReferences(segments, exerciseIds) {
    var i;
    var j;
    var segment;
    var ids;
    for (i = 0; i < segments.length; i++) {
      segment = segments[i];
      if (!segment || typeof segment.id !== "string" || !segment.id) {
        throw new Error("SessionPlan segment at index " + i + " requires a string id");
      }
      ids = Array.isArray(segment.exerciseIds) ? segment.exerciseIds : null;
      if (!ids) {
        continue;
      }
      for (j = 0; j < ids.length; j++) {
        if (!exerciseIds[ids[j]]) {
          throw new Error("SessionPlan segment " + segment.id + " references missing exercise: " + ids[j]);
        }
      }
    }
  }

  function SessionPlan(input) {
    input = input || {};
    this.id = input.id || ("plan_" + Math.random().toString(36).slice(2, 10));
    this.flow = input.flow || "generic";
    this.generatedDate = input.generatedDate || new Date().toISOString().slice(0, 10);
    this.instrumentId = input.instrumentId || null;
    this.instrumentType = input.instrumentType || null;
    this.focus = input.focus || "Well-rounded practice";
    this.lesson = input.lesson || null;
    this.lessonId = input.lessonId || (this.lesson && this.lesson.id) || null;
    this.skillId = input.skillId || (this.lesson && this.lesson.skill) || null;
    this.difficulty = input.difficulty || null;
    this.segments = Array.isArray(input.segments) ? input.segments : [];
    this.exercises = Array.isArray(input.exercises) ? input.exercises : [];
    this.rewards = input.rewards || { xp: 0, unlocks: [], achievements: [] };
    this.context = input.context || {};
    this.validate();
  }

  SessionPlan.prototype.validate = function() {
    var exerciseIds;
    if (typeof this.flow !== "string" || !this.flow) {
      throw new Error("SessionPlan requires a flow");
    }
    if (!Array.isArray(this.segments)) {
      throw new Error("SessionPlan segments must be an array");
    }
    if (!Array.isArray(this.exercises)) {
      throw new Error("SessionPlan exercises must be an array");
    }
    if (!this.rewards || typeof this.rewards !== "object") {
      throw new Error("SessionPlan rewards must be an object or array");
    }
    exerciseIds = validateExerciseIds(this.exercises);
    validateSegmentReferences(this.segments, exerciseIds);
    return true;
  };

  SessionPlan.prototype.toLegacyPracticePlan = function() {
    var items = [];
    for (var i = 0; i < this.segments.length; i++) {
      items.push(this.segments[i]);
    }
    return {
      id: this.id,
      flow: this.flow,
      generatedDate: this.generatedDate,
      focus: this.focus,
      items: items,
      totalItems: items.length,
      completedItems: items.filter(function(item) { return item.completed; }).length,
      curriculum: this.context.curriculum || null
    };
  };

  window.SessionPlan = SessionPlan;
  window.SparkSessionV2 = {
    getExercise: function(segment, session) {
      if (!segment || !session || !Array.isArray(session.exercises)) return null;
      var exerciseIds = Array.isArray(segment.exerciseIds) ? segment.exerciseIds : [];
      for (var i = 0; i < exerciseIds.length; i++) {
        for (var j = 0; j < session.exercises.length; j++) {
          if (session.exercises[j] && session.exercises[j].id === exerciseIds[i]) {
            return session.exercises[j];
          }
        }
      }
      return null;
    }
  };
})();
