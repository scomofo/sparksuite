(function() {
  var CURRENT_PROFILE_SCHEMA_VERSION = typeof SparkCurrentProfileSchemaVersion === "number"
    ? SparkCurrentProfileSchemaVersion
    : 4;

  var migrations = {
    1: migrateV1ToV2,
    2: migrateV2ToV3,
    3: migrateV3ToV4
  };

  function migrateProfile(profile) {
    var next = clone(profile || {});

    if (!next.schemaVersion) {
      next.schemaVersion = 1;
    }

    while (next.schemaVersion < CURRENT_PROFILE_SCHEMA_VERSION) {
      var migrate = migrations[next.schemaVersion];
      if (typeof migrate !== "function") {
        throw new Error("Missing profile migration for version " + next.schemaVersion);
      }
      next = migrate(next);
    }

    return next;
  }

  function migrateV1ToV2(profile) {
    return {
      schemaVersion: 2,
      userId: profile.userId || "default",
      xp: typeof profile.xp === "number" ? profile.xp : 0,
      level: typeof profile.level === "number" ? profile.level : 1,
      selectedInstrument: profile.selectedInstrument || "guitar",
      mastery: profile.mastery || {},
      streaks: profile.streaks || {},
      achievements: Array.isArray(profile.achievements) ? profile.achievements.slice() : []
    };
  }

  function migrateV2ToV3(profile) {
    var gameplay = profile.settings && profile.settings.gameplay ? profile.settings.gameplay : {};
    var accessibility = profile.settings && profile.settings.accessibility ? profile.settings.accessibility : {};
    return {
      schemaVersion: 3,
      userId: profile.userId || "default",
      xp: typeof profile.xp === "number" ? profile.xp : 0,
      level: typeof profile.level === "number" ? profile.level : 1,
      selectedInstrument: profile.selectedInstrument || "guitar",
      mastery: profile.mastery || {},
      streaks: profile.streaks || {},
      achievements: Array.isArray(profile.achievements) ? profile.achievements.slice() : [],
      settings: {
        gameplay: {
          inputLatencyOffsetMs: typeof gameplay.inputLatencyOffsetMs === "number" ? gameplay.inputLatencyOffsetMs : 0,
          hitWindowMs: typeof gameplay.hitWindowMs === "number" ? gameplay.hitWindowMs : 140,
          noteSpeed: typeof gameplay.noteSpeed === "number" ? gameplay.noteSpeed : 0.32
        },
        accessibility: {
          reducedMotion: !!accessibility.reducedMotion,
          highContrast: !!accessibility.highContrast,
          noteSize: accessibility.noteSize || "normal",
          laneLabels: accessibility.laneLabels !== false,
          colorblindSafeLanes: !!accessibility.colorblindSafeLanes
        }
      }
    };
  }

  function migrateV3ToV4(profile) {
    var gameplay = profile.settings && profile.settings.gameplay ? profile.settings.gameplay : {};
    var accessibility = profile.settings && profile.settings.accessibility ? profile.settings.accessibility : {};
    var normalizeAccessibility = typeof SparkNormalizeAccessibilitySettings === "function"
      ? SparkNormalizeAccessibilitySettings
      : function(settings) {
          settings = settings && typeof settings === "object" ? settings : {};
          return {
            reducedMotion: !!settings.reducedMotion,
            highContrast: !!settings.highContrast,
            noteSize: settings.noteSize || "normal",
            laneLabels: settings.laneLabels !== false,
            colorblindSafeLanes: !!settings.colorblindSafeLanes,
            metronomeVisualOnly: !!settings.metronomeVisualOnly,
            disableFailureAnimations: !!settings.disableFailureAnimations,
            keyboardRemapping: settings.keyboardRemapping && typeof settings.keyboardRemapping === "object" ? clone(settings.keyboardRemapping) : {},
            leftHandedLayout: !!settings.leftHandedLayout,
            slowerDefaultSpeed: !!settings.slowerDefaultSpeed,
            audioCueVolume: typeof settings.audioCueVolume === "number" ? settings.audioCueVolume : 0.8,
            metronomeVolume: typeof settings.metronomeVolume === "number" ? settings.metronomeVolume : 0.6
          };
        };

    return {
      schemaVersion: 4,
      userId: profile.userId || "default",
      xp: typeof profile.xp === "number" ? profile.xp : 0,
      level: typeof profile.level === "number" ? profile.level : 1,
      selectedInstrument: profile.selectedInstrument || "guitar",
      mastery: profile.mastery || {},
      streaks: profile.streaks || {},
      achievements: Array.isArray(profile.achievements) ? profile.achievements.slice() : [],
      settings: {
        gameplay: {
          inputLatencyOffsetMs: typeof gameplay.inputLatencyOffsetMs === "number" ? gameplay.inputLatencyOffsetMs : 0,
          hitWindowMs: typeof gameplay.hitWindowMs === "number" ? gameplay.hitWindowMs : 140,
          noteSpeed: typeof gameplay.noteSpeed === "number" ? gameplay.noteSpeed : 0.32
        },
        accessibility: normalizeAccessibility(accessibility)
      }
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  if (typeof window !== "undefined") {
    window.SparkProfileMigrations = migrations;
    window.SparkMigrateProfile = migrateProfile;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.SparkProfileMigrations = migrations;
    globalThis.SparkMigrateProfile = migrateProfile;
  }
  if (typeof module !== "undefined") {
    module.exports = {
      migrations: migrations,
      migrateProfile: migrateProfile
    };
  }
})();
