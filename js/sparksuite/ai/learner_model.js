(function() {
  var STORAGE_PREFIX = "sparksuite_learner_";

  function LearnerModel() {}

  LearnerModel.prototype.load = function(userId) {
    userId = userId || "default";
    try {
      var raw = localStorage.getItem(STORAGE_PREFIX + userId);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      userId: userId,
      skillLevels: {},
      preferredTempo: 1.0,
      struggleAreas: {},
      consistency: 0.5,
      sessionsCompleted: 0,
      totalReward: 0,
      lastSessionDate: null
    };
  };

  LearnerModel.prototype.save = function(userId, model) {
    userId = userId || "default";
    try { localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(model)); } catch (e) {}
  };

  LearnerModel.prototype.updateSkill = function(model, skillId, delta) {
    if (!model.skillLevels) model.skillLevels = {};
    var cur = model.skillLevels[skillId] || 0;
    model.skillLevels[skillId] = Math.max(0, Math.min(1, cur + delta));
    return model;
  };

  LearnerModel.prototype.recordStruggle = function(model, area) {
    if (!model.struggleAreas) model.struggleAreas = {};
    model.struggleAreas[area] = (model.struggleAreas[area] || 0) + 1;
    return model;
  };

  LearnerModel.prototype.clearStruggle = function(model, area) {
    if (model.struggleAreas) delete model.struggleAreas[area];
    return model;
  };

  window.SparkLearnerModel = LearnerModel;
})();
