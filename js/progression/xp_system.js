(function() {
  function toNumber(value, fallback) {
    return typeof value === "number" && isFinite(value) ? value : (fallback || 0);
  }

  function calculateSessionXP(options) {
    options = options || {};
    var timingScore = toNumber(options.timingScore, 0);
    var combo = toNumber(options.combo, 0);
    var milestones = toNumber(options.milestones, 0);
    var streak = toNumber(options.streak, 0);
    var sessionBonus = toNumber(options.sessionBonus, 25);
    var xp = 0;

    xp += timingScore * 0.5;
    xp += combo * 2;
    xp += milestones * 50;
    xp += streak * 5;
    xp += sessionBonus;

    return Math.floor(xp);
  }

  window.calculateSessionXP = calculateSessionXP;
  window.calculateXP = calculateSessionXP;
})();
