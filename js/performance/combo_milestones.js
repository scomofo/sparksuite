/* ===== ChordSpark Performance: Combo Milestones ===== */

window.PERFORMANCE_COMBO_MILESTONES = [5, 10, 20, 30, 50];

window.isPerformanceComboMilestone = function(combo) {
  combo = typeof combo === "number" ? combo : 0;
  return window.PERFORMANCE_COMBO_MILESTONES.indexOf(combo) >= 0;
};

window.getPerformanceComboMilestoneReward = function(combo) {
  combo = typeof combo === "number" ? combo : 0;
  if (combo >= 50) return 1000;
  if (combo >= 30) return 600;
  if (combo >= 20) return 400;
  if (combo >= 10) return 200;
  if (combo >= 5) return 100;
  return 0;
};

window.shouldTriggerPerformanceComboMilestone = function(combo, hitMilestones) {
  hitMilestones = Array.isArray(hitMilestones) ? hitMilestones : [];
  return window.isPerformanceComboMilestone(combo) && hitMilestones.indexOf(combo) === -1;
};
