/**
 * SessionPlan Contract (V2 — canonical)
 *
 * {
 *   id: string,
 *   flow: string,              // FLOW_DAILY_PRACTICE | FLOW_GUIDED_SESSION | FLOW_PERFORMANCE_SONG
 *   segments: [{
 *     id: string,
 *     type: string,            // "practice" | "song" | "challenge"
 *     exerciseIds: string[]
 *   }],
 *   exercises: [{
 *     id: string,
 *     type: string,            // "practice" | "song" | "challenge"
 *     difficulty: string,
 *     data: {
 *       core: { skill, chords, pattern, instrument, durationSec },
 *       gameplay: { payload, preset, chartId }
 *     }
 *   }],
 *   rewards: { xp: number },
 *   difficulty: string,
 *   instrumentId: string
 * }
 *
 * UI presentation (label, desc, reason) is NOT part of this contract.
 * UI layers derive display text from exercise.data.core fields.
 */
(function() {
  function SessionPlan(input) {
    input = input || {};
    this.id = input.id || ("plan_" + Math.random().toString(36).slice(2, 10));
    this.flow = input.flow || "generic";
    this.generatedDate = input.generatedDate || new Date().toISOString().slice(0, 10);
    this.instrumentId = input.instrumentId || null;
    this.focus = input.focus || "Well-rounded practice";
    this.lesson = Object.prototype.hasOwnProperty.call(input, "lesson") ? input.lesson : null;
    this.difficulty = Object.prototype.hasOwnProperty.call(input, "difficulty") ? input.difficulty : null;
    this.segments = Array.isArray(input.segments) ? input.segments : [];
    this.exercises = Array.isArray(input.exercises) ? input.exercises : [];
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
