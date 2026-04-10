(function() {
  function SessionEngine(practiceEngine, curriculumEngine, psychologyEngine) {
    this.practiceEngine = practiceEngine;
    this.curriculumEngine = curriculumEngine;
    this.psychologyEngine = psychologyEngine;
  }

  SessionEngine.prototype.buildSession = function(flow, context) {
    context = context || {};

    var curriculumContext = this.curriculumEngine.getDailyPracticeContext(context.instrumentContext || {});

    var difficulty = this.psychologyEngine.getDifficulty(context.user || {});

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
      rewards: buildRewards(),
      context: {
        curriculum: curriculumContext
      }
    });
  };

  function buildRewards() {
    return {
      xp: 25,
      unlocks: [],
      achievements: []
    };
  }

  window.SparkSuiteSessionEngine = SessionEngine;
})();
