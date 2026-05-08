(function() {
  function SessionEngine(practiceEngine, curriculumEngine, psychologyEngine) {
    this.practiceEngine = practiceEngine;
    this.curriculumEngine = curriculumEngine;
    this.psychologyEngine = psychologyEngine;
  }

  SessionEngine.prototype.buildSession = function(flow, context) {
    context = context || {};

    var curriculumContext = this.curriculumEngine.getDailyPracticeContext(context.instrumentContext || {});
    if (context.lessonId) curriculumContext.nextLessonId = context.lessonId;
    var difficulty = getDifficulty(this.psychologyEngine, context.user || {});

    var practicePlan = this.practiceEngine.buildDailyPracticePlan({
      curriculum: curriculumContext,
      instrumentContext: context.instrumentContext || {},
      difficulty: difficulty
    });

    return new SessionPlan({
      flow: flow,
      instrumentId: context.instrumentContext ? context.instrumentContext.appId : null,
      focus: practicePlan.focus,
      difficulty: difficulty,
      segments: practicePlan.segments,
      exercises: practicePlan.exercises,
      lesson: curriculumContext ? (curriculumContext.nextLesson || null) : null,
      rewards: buildRewards(),
      context: {
        curriculum: curriculumContext
      }
    });
  };

  function getDifficulty(psychologyEngine, user) {
    if (psychologyEngine && typeof psychologyEngine.getSessionDifficulty === "function") {
      return psychologyEngine.getSessionDifficulty(user);
    }
    if (psychologyEngine && typeof psychologyEngine.getDifficulty === "function") {
      return psychologyEngine.getDifficulty(user);
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

  window.SparkSuiteSessionEngineV2 = SessionEngine;
  window.SparkSuiteSessionEngine = window.SparkSuiteSessionEngine || SessionEngine;
})();
