// js/sparksuite/services/achievements.js
(function() {

  var SUITE_ACHIEVEMENTS = [
    { id: "first_lesson", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.lessonsCompleted >= 1) return true; }
      return false;
    }},
    { id: "first_session", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.sessionsCompleted >= 1) return true; }
      return false;
    }},
    { id: "streak_3", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.streakDays >= 3) return true; }
      return false;
    }},
    { id: "streak_7", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.streakDays >= 7) return true; }
      return false;
    }},
    { id: "xp_100", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.xp >= 100) return true; }
      return false;
    }},
    { id: "xp_1000", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.xp >= 1000) return true; }
      return false;
    }},
    { id: "dual_instrument_starter", check: function(p) {
      var count = 0;
      for (var appId in p.apps) { if (p.apps[appId].stats.lessonsCompleted >= 1) count++; }
      return count >= 2;
    }}
  ];

  var SparkAchievements = {
    definitions: SUITE_ACHIEVEMENTS,

    evaluate: function(profile) {
      var existing = profile.suiteRewards ? profile.suiteRewards.badges : [];
      var newlyEarned = [];
      for (var i = 0; i < SUITE_ACHIEVEMENTS.length; i++) {
        var a = SUITE_ACHIEVEMENTS[i];
        if (existing.indexOf(a.id) >= 0) continue;
        if (a.check(profile)) newlyEarned.push(a.id);
      }
      return newlyEarned;
    },

    applyEarned: function(profile, earnedIds) {
      if (!profile.suiteRewards) profile.suiteRewards = { badges: [], cosmetics: [], challengeProgress: {} };
      for (var i = 0; i < earnedIds.length; i++) {
        if (profile.suiteRewards.badges.indexOf(earnedIds[i]) < 0) {
          profile.suiteRewards.badges.push(earnedIds[i]);
        }
      }
    }
  };

  window.SparkAchievements = SparkAchievements;
})();
