// js/spark-core/profile-schema.js
(function() {

  function createEmptyAppProfile(instrument) {
    return {
      instrument: instrument,
      stats: {
        xp: 0,
        level: 1,
        streakDays: 0,
        sessionsCompleted: 0,
        lessonsCompleted: 0,
        // Per-instrument guided-session pointer. Previously a single global
        // S.guidedSession, which let guitar/bass/piano share one "current
        // session" and cross-contaminate each other's resume point.
        guidedSession: 1
      },
      mastery: {},
      completedLessonIds: [],
      // Per-instrument completed guided-session numbers. Previously a single
      // global S.completedGuidedSessions array shared by guitar and bass.
      completedGuidedSessions: [],
      unlockedIds: [],
      settings: {},
      songAudioData: {}
    };
  }

  var SparkProfile = {
    CURRENT_VERSION: 1,

    createEmpty: function() {
      return {
        schemaVersion: this.CURRENT_VERSION,
        suite: "spark",
        userId: "local-user",
        apps: {},
        suiteRewards: {
          badges: [],
          cosmetics: [],
          challengeProgress: {}
        }
      };
    },

    ensureApp: function(profile, appId, instrument) {
      if (!profile.apps) profile.apps = {};
      if (!profile.apps[appId]) {
        profile.apps[appId] = createEmptyAppProfile(instrument);
      }
      return profile.apps[appId];
    },

    migrate: function(profile) {
      if (!profile.suiteRewards) {
        profile.suiteRewards = { badges: [], cosmetics: [], challengeProgress: {} };
      }
      if (!profile.apps) profile.apps = {};
      for (var appId in profile.apps) {
        var app = profile.apps[appId];
        if (!app.stats) app.stats = { xp: 0, level: 1, streakDays: 0, sessionsCompleted: 0, lessonsCompleted: 0 };
        if (typeof app.stats.guidedSession !== "number") app.stats.guidedSession = 1;
        if (!app.mastery) app.mastery = {};
        if (!Array.isArray(app.completedGuidedSessions)) app.completedGuidedSessions = [];
        if (!app.completedLessonIds) app.completedLessonIds = [];
        if (!app.unlockedIds) app.unlockedIds = [];
        if (!app.settings) app.settings = {};
        if (!app.songAudioData) app.songAudioData = {};
      }
      profile.schemaVersion = this.CURRENT_VERSION;
      return profile;
    }
  };

  window.SparkProfile = SparkProfile;
})();
