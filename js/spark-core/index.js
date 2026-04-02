// js/spark-core/index.js
// Barrel — all spark-core modules are loaded as individual scripts.
// This file exists as a namespace convenience and suite version marker.
(function() {
  window.SparkCore = {
    version: "0.1.0",
    Profile: window.SparkProfile,
    Storage: window.SparkStorage,
    Events: window.SparkEvents,
    Progress: window.SparkProgress,
    Achievements: window.SparkAchievements,
    Content: window.SparkContent,
    ContentNormalizer: window.SparkContentNormalizer
  };
})();
