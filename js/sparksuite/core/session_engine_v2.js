(function() {
  function SessionEngineV2(practiceEngine, curriculumEngine, psychologyEngine) {
    this.practiceEngine = practiceEngine;
    this.curriculumEngine = curriculumEngine;
    this.psychologyEngine = psychologyEngine || null;
  }

  SessionEngineV2.prototype.buildSession = function(flow, context) {
    context = context || {};

    var curriculumContext = this.curriculumEngine.getDailyPracticeContext(context.instrumentContext || {});
    var difficulty = resolveDifficulty(this.psychologyEngine, context.user || {});
    var practicePlan = this.practiceEngine.buildDailyPracticePlan({
      curriculum: curriculumContext,
      instrumentContext: context.instrumentContext || {},
      difficulty: difficulty
    });

    return new SessionPlan({
      flow: flow,
      instrumentId: context.instrumentContext ? context.instrumentContext.appId : null,
      lesson: curriculumContext.nextLesson || null,
      focus: practicePlan.focus,
      difficulty: difficulty,
      segments: practicePlan.segments,
      exercises: practicePlan.exercises,
      rewards: buildRewards(),
      context: {
        curriculum: curriculumContext
      }
    });
  };

  function resolveDifficulty(psychologyEngine, user) {
    if (psychologyEngine && typeof psychologyEngine.getDifficulty === "function") {
      return psychologyEngine.getDifficulty(user);
    }
    if (psychologyEngine && typeof psychologyEngine.getSessionDifficulty === "function") {
      return psychologyEngine.getSessionDifficulty(user);
    }
    return "normal";
  }

  function buildRewards() {
    return {
      xp: 40,
      unlocks: [],
      achievements: []
    };
  }

  function getExercise(segment, plan) {
    if (!segment || !plan || !Array.isArray(plan.exercises) || !Array.isArray(segment.exerciseIds) || !segment.exerciseIds.length) {
      return null;
    }
    var exerciseId = segment.exerciseIds[0];
    for (var i = 0; i < plan.exercises.length; i++) {
      if (plan.exercises[i] && plan.exercises[i].id === exerciseId) return plan.exercises[i];
    }
    return null;
  }

  window.SparkSuiteSessionEngineV2 = SessionEngineV2;
  window.SparkSuiteSessionEngine = window.SparkSuiteSessionEngine || SessionEngineV2;
  window.SparkSessionV2 = {
    getExercise: getExercise
  };
})();
