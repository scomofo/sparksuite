// js/sparksuite/services/progress.js
(function() {

  function _daysBetween(dateA, dateB) {
    var a = new Date(dateA + "T00:00:00Z");
    var b = new Date(dateB + "T00:00:00Z");
    return Math.round((b - a) / 86400000);
  }

  var SparkProgress = {
    awardXp: function(profile, appId, amount) {
      var app = profile.apps[appId];
      if (!app) return;
      app.stats.xp += amount;
    },

    completeLesson: function(profile, appId, lessonId, meta) {
      var app = profile.apps[appId];
      if (!app) return;
      meta = meta || {};
      if (app.completedLessonIds.indexOf(lessonId) >= 0) return;
      app.completedLessonIds.push(lessonId);
      app.stats.lessonsCompleted++;
      if (meta.xp) app.stats.xp += meta.xp;
    },

    completeSession: function(profile, appId, sessionType, meta) {
      var app = profile.apps[appId];
      if (!app) return;
      meta = meta || {};
      app.stats.sessionsCompleted++;
      if (meta.xp) app.stats.xp += meta.xp;
    },

    recordDrillAnswer: function(profile, appId, skillId, isCorrect, accuracy) {
      var app = profile.apps[appId];
      if (!app) return;
      var score = isCorrect ? (accuracy || 100) : 0;
      if (typeof calculateMasteryFromAccuracy === "function") {
        app.mastery[skillId] = calculateMasteryFromAccuracy(app.mastery[skillId], score);
      } else {
        var prev = app.mastery[skillId] || 0;
        app.mastery[skillId] = prev * 0.7 + score * 0.3;
      }
    },

    updateStreak: function(profile, appId, isoDate) {
      var app = profile.apps[appId];
      if (!app) return;
      var last = app._lastStreakDate;
      if (last === isoDate) return;
      if (last && _daysBetween(last, isoDate) === 1) {
        app.stats.streakDays++;
      } else {
        app.stats.streakDays = 1;
      }
      app._lastStreakDate = isoDate;
    },

    unlock: function(profile, appId, unlockId) {
      var app = profile.apps[appId];
      if (!app) return;
      if (app.unlockedIds.indexOf(unlockId) >= 0) return;
      app.unlockedIds.push(unlockId);
    },

    startSession: function(profile, appId, sessionType) {
      // Hook point — emit event, no state change needed
    }
  };

  window.SparkProgress = SparkProgress;
})();
