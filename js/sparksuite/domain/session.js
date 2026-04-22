(function() {
  function SessionPlan(input) {
    input = input || {};
    this.id = input.id || ("plan_" + Math.random().toString(36).slice(2, 10));
    this.flow = input.flow || "generic";
    this.generatedDate = input.generatedDate || new Date().toISOString().slice(0, 10);
    this.instrumentId = input.instrumentId || null;
    this.instrumentType = input.instrumentType || null;
    this.focus = input.focus || "Well-rounded practice";
    this.lesson = input.lesson || null;
    this.difficulty = input.difficulty || null;
    this.segments = Array.isArray(input.segments) ? input.segments : [];
    this.exercises = Array.isArray(input.exercises) ? input.exercises : [];
    this.rewards = input.rewards || { xp: 0, unlocks: [], achievements: [] };
    this.context = input.context || {};
  }

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
