(function() {
  function SessionPlan(input) {
    input = input || {};
    this.id = input.id || ("plan_" + Math.random().toString(36).slice(2, 10));
    this.flow = input.flow || "generic";
    this.generatedDate = input.generatedDate || new Date().toISOString().slice(0, 10);
    this.instrumentId = input.instrumentId || null;
    this.focus = input.focus || "Well-rounded practice";
    this.segments = Array.isArray(input.segments) ? input.segments : [];
    this.exercises = Array.isArray(input.exercises) ? input.exercises : [];
    this.lesson = input.lesson || null;
    this.difficulty = input.difficulty || null;
    this.rewards = Object.prototype.hasOwnProperty.call(input, "rewards") ? input.rewards : [];
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
})();
