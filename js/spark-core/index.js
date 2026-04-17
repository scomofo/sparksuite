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
    PracticeEngine: window.SparkPracticeEngine,

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
        contentNormalizer: window.SparkContentNormalizer,
        curriculum: window.SparkCurriculumService,
        recommendations: window.SparkRecommendationService,
        practice: window.SparkPracticeEngine
      };
    },

    // Top-level orchestration methods (north-star API)

    /**
     * recommendNextAction() — combines curriculum queue + recommendations into single next action
     */
    recommendNextAction: function() {
      // Try curriculum learning queue first
      if (typeof SparkCurriculumService !== "undefined" && typeof SparkCurriculumService.buildLearningQueue === "function") {
        var queue = SparkCurriculumService.buildLearningQueue();
        if (queue && queue.length > 0) {
          return {
            source: "curriculum",
            action: queue[0].type,
            id: queue[0].id,
            label: queue[0].label,
            priority: queue[0].priority,
            queue: queue
          };
        }
      }

      // Fall back to recommendation engine
      if (typeof SparkRecommendationService !== "undefined" && typeof SparkRecommendationService.getActive === "function") {
        var recs = SparkRecommendationService.getActive();
        if (recs && recs.length > 0) {
          return {
            source: "recommendations",
            action: recs[0].type || "practice",
            id: recs[0].id,
            label: recs[0].title || recs[0].id,
            priority: "normal",
            queue: recs
          };
        }
      }

      // Default: suggest quickStart
      return {
        source: "default",
        action: "quickStart",
        id: null,
        label: "Quick Practice",
        priority: "normal",
        queue: []
      };
    },

    /**
     * startSession(opts) — builds a session plan via SessionEngine
     * Returns a SessionPlan contract
     */
    startSession: function(opts) {
      opts = opts || {};

      // Resolve instrument context
      if (!opts.instrumentId && typeof SparkInstrumentAdapter !== "undefined") {
        opts.instrumentId = SparkInstrumentAdapter.getAppId();
        opts.instrumentType = SparkInstrumentAdapter.getInstrumentType();
      }
      if (!opts.instrumentData && typeof SparkInstrumentAdapter !== "undefined") {
        opts.instrumentData = SparkInstrumentAdapter.getCurriculum();
      }

      if (typeof SparkSession !== "undefined") {
        var plan = SparkSession.buildSession(opts);
        if (typeof console !== "undefined" && console.debug) {
          console.debug("[SparkCore] startSession:", plan);
        }
        return plan;
      }

      // Fallback: return a minimal plan via contracts
      if (typeof SparkContracts !== "undefined") {
        return SparkContracts.createSessionPlan(opts);
      }
      return opts;
    },

    /**
     * completeSession(result) — processes session results through both legacy and contract paths
     * Returns a ProgressOutcome contract
     */
    completeSession: function(result) {
      result = result || {};
      var outcome = null;
      var instrumentId = result.instrumentId || null;
      var instrumentType = result.instrumentType || null;

      // Legacy path
      if (typeof SparkSession !== "undefined") {
        outcome = SparkSession.processResults(result);
      }

      if ((!instrumentId || !instrumentType) && typeof SparkInstrumentAdapter !== "undefined") {
        if (!instrumentId && typeof SparkInstrumentAdapter.getAppId === "function") instrumentId = SparkInstrumentAdapter.getAppId();
        if (!instrumentType && typeof SparkInstrumentAdapter.getInstrumentType === "function") instrumentType = SparkInstrumentAdapter.getInstrumentType();
      }

      // Contract path
      if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
        var sessionResult = SparkContracts.createSessionResult({
          mode: result.type || result.mode || "session",
          instrumentId: instrumentId,
          instrumentType: instrumentType,
          chordName: result.chordName || null,
          duration: result.duration || 0,
          accuracy: result.accuracy || 0,
          songId: result.songId || null,
          completed: true
        });
        var progressOutcome = SparkProgressOrchestrator.applySessionOutcome(sessionResult);
        if (typeof console !== "undefined" && console.debug) {
          console.debug("[SparkCore] completeSession outcome:", progressOutcome);
        }
        return progressOutcome;
      }

      return outcome || {};
    }
  };
})();
