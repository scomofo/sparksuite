// js/spark-core/index.js
// Barrel — all spark-core modules are loaded as individual scripts.
// This file bridges the legacy namespace to the new composition root.
(function() {
  window.SparkCore = {
    version: "0.3.0",

    // Legacy module references (backward compatibility)
    Profile: window.SparkProfile,
    Storage: window.SparkStorage,
    Events: window.SparkEvents,
    Progress: window.SparkProgress,
    Achievements: window.SparkAchievements,
    Content: window.SparkContent,
    ContentNormalizer: window.SparkContentNormalizer,

    // Core engines (v0.2.0 globals)
    Session: window.SparkSession,
    Psychology: window.SparkPsychology,
    InstrumentAdapter: window.SparkInstrumentAdapter,
    ProgressOrchestrator: window.SparkProgressOrchestrator,

    // Service registry: single resolution point for engines
    getServices: function() {
      return {
        session: window.SparkSession,
        psychology: window.SparkPsychology,
        instrumentAdapter: window.SparkInstrumentAdapter,
        progressOrchestrator: window.SparkProgressOrchestrator,
        profile: window.SparkProfile,
        storage: window.SparkStorage,
        events: window.SparkEvents,
        progress: window.SparkProgress,
        achievements: window.SparkAchievements,
        content: window.SparkContent,
        contentNormalizer: window.SparkContentNormalizer
      };
    }
  };
})();
