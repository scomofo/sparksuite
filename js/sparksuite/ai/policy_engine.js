(function() {
  var ALPHA = 0.1;

  var ACTIONS = {
    SLOW_DOWN: "slow_down",
    FOCUS_DRILL: "focus_drill",
    ADVANCE: "advance",
    MAINTAIN: "maintain",
    SIMPLIFY: "simplify"
  };

  function PolicyEngine() {}

  PolicyEngine.prototype.decide = function(model) {
    model = model || {};
    var struggles = model.struggleAreas ? Object.keys(model.struggleAreas).length : 0;
    var consistency = model.consistency || 0.5;

    if (consistency < 0.4) return { action: ACTIONS.SIMPLIFY, reason: "very low consistency" };
    if (consistency < 0.5) return { action: ACTIONS.SLOW_DOWN, reason: "low consistency" };
    if (struggles > 3) return { action: ACTIONS.FOCUS_DRILL, reason: struggles + " struggle areas" };
    if (consistency > 0.85) return { action: ACTIONS.ADVANCE, reason: "high consistency" };
    return { action: ACTIONS.MAINTAIN, reason: "steady progress" };
  };

  PolicyEngine.prototype.update = function(model, performance) {
    model = model || {};
    performance = performance || {};

    model.consistency = (model.consistency || 0.5) * (1 - ALPHA) + (performance.consistency || 0.5) * ALPHA;
    model.consistency = Math.round(model.consistency * 1000) / 1000;

    if (performance.accuracy > 0.9 && model.preferredTempo < 1.5) {
      model.preferredTempo = Math.round((model.preferredTempo + 0.05) * 100) / 100;
    }
    if (performance.accuracy < 0.5 && model.preferredTempo > 0.5) {
      model.preferredTempo = Math.round((model.preferredTempo - 0.05) * 100) / 100;
    }

    model.sessionsCompleted = (model.sessionsCompleted || 0) + 1;
    model.lastSessionDate = new Date().toISOString().slice(0, 10);

    return model;
  };

  PolicyEngine.prototype.adaptSession = function(baseSession, action) {
    if (!action) return baseSession;
    var adapted = JSON.parse(JSON.stringify(baseSession || {}));
    adapted.policyAction = action.action;
    adapted.policyReason = action.reason;

    if (action.action === ACTIONS.SLOW_DOWN || action.action === ACTIONS.SIMPLIFY) {
      adapted.speedMultiplier = 0.75;
      adapted.difficulty = "easy";
    } else if (action.action === ACTIONS.ADVANCE) {
      adapted.speedMultiplier = 1.0;
      adapted.difficulty = adapted.difficulty === "easy" ? "normal" : "hard";
    }

    return adapted;
  };

  PolicyEngine.ACTIONS = ACTIONS;
  window.SparkPolicyEngine = PolicyEngine;
})();
