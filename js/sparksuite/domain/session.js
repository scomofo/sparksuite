(function() {
  function getSparkErrorApi() {
    function SparkFallbackError(code, message, context) {
      this.name = "SparkError";
      this.code = code;
      this.message = message || code;
      this.context = context || {};
    }
    SparkFallbackError.prototype = Object.create(Error.prototype);
    SparkFallbackError.prototype.constructor = SparkFallbackError;
    SparkFallbackError.prototype.toString = function() {
      return this.name + ": " + this.message;
    };
    if (typeof SparkError !== "undefined" && typeof SparkErrorCodes !== "undefined") {
      return {
        SparkError: SparkError,
        SparkErrorCodes: SparkErrorCodes
      };
    }
    if (typeof window !== "undefined" && window.SparkError && window.SparkErrorCodes) {
      return {
        SparkError: window.SparkError,
        SparkErrorCodes: window.SparkErrorCodes
      };
    }
    if (typeof require === "function") {
      try {
        return {
          SparkError: require("../core/spark_error.js").SparkError,
          SparkErrorCodes: require("../core/error_codes.js").SparkErrorCodes
        };
      } catch (error) {}
    }
    return {
      SparkError: SparkFallbackError,
      SparkErrorCodes: {
        SESSION_INVALID: "SESSION_INVALID",
        SESSION_INVALID_EXERCISE_REFERENCE: "SESSION_INVALID_EXERCISE_REFERENCE"
      }
    };
  }

  function createSessionError(code, message, context) {
    var api = getSparkErrorApi();
    return new api.SparkError(code, message, context || {});
  }

  function validateExerciseIds(exercises) {
    var seen = {};
    var i;
    var exercise;
    for (i = 0; i < exercises.length; i++) {
      exercise = exercises[i];
      if (!exercise || typeof exercise.id !== "string" || !exercise.id) {
        throw createSessionError(
          getSparkErrorApi().SparkErrorCodes.SESSION_INVALID,
          "SessionPlan exercise at index " + i + " requires a string id",
          { exerciseIndex: i }
        );
      }
      if (seen[exercise.id]) {
        throw createSessionError(
          getSparkErrorApi().SparkErrorCodes.SESSION_INVALID,
          "SessionPlan exercises contain duplicate id: " + exercise.id,
          { exerciseId: exercise.id, exerciseIndex: i }
        );
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
        throw createSessionError(
          getSparkErrorApi().SparkErrorCodes.SESSION_INVALID,
          "SessionPlan segment at index " + i + " requires a string id",
          { segmentIndex: i }
        );
      }
      ids = Array.isArray(segment.exerciseIds) ? segment.exerciseIds : null;
      if (!ids) {
        continue;
      }
      for (j = 0; j < ids.length; j++) {
        if (!exerciseIds[ids[j]]) {
          throw createSessionError(
            getSparkErrorApi().SparkErrorCodes.SESSION_INVALID_EXERCISE_REFERENCE,
            "SessionPlan segment " + segment.id + " references missing exercise: " + ids[j],
            { segmentId: segment.id, exerciseId: ids[j], exerciseIndex: j }
          );
        }
      }
    }
  }

  function assertSessionPlan(plan) {
    if (!plan || typeof plan !== "object") {
      throw createSessionError(
        getSparkErrorApi().SparkErrorCodes.SESSION_INVALID,
        "SessionPlan must be an object"
      );
    }
    if (typeof plan.flow !== "string" || !plan.flow) {
      throw createSessionError(
        getSparkErrorApi().SparkErrorCodes.SESSION_INVALID,
        "SessionPlan requires a flow"
      );
    }
    if (!Array.isArray(plan.segments)) {
      throw createSessionError(
        getSparkErrorApi().SparkErrorCodes.SESSION_INVALID,
        "SessionPlan segments must be an array"
      );
    }
    if (!Array.isArray(plan.exercises)) {
      throw createSessionError(
        getSparkErrorApi().SparkErrorCodes.SESSION_INVALID,
        "SessionPlan exercises must be an array"
      );
    }
    if (!plan.rewards || typeof plan.rewards !== "object") {
      throw createSessionError(
        getSparkErrorApi().SparkErrorCodes.SESSION_INVALID,
        "SessionPlan rewards must be an object or array"
      );
    }
    validateSegmentReferences(plan.segments, validateExerciseIds(plan.exercises));
    return plan;
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
    assertSessionPlan(this);
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
  window.assertSessionPlan = assertSessionPlan;
  window.SparkSessionV2 = {
    assertSessionPlan: assertSessionPlan,
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
