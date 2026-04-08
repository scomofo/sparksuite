// js/spark-core/runtime/contracts.js
// Normalized contracts for session planning, results, and progress outcomes.
// These are factory functions that create contract-conforming objects.
(function() {

  /**
   * SessionPlan — returned by SessionEngine.buildSession()
   */
  function createSessionPlan(opts) {
    opts = opts || {};
    var segments = opts.segments || [];
    var duration = opts.estimatedDuration || opts.duration || 120;
    var plan = {
      sessionId: opts.sessionId || ("sp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8)),
      instrumentId: opts.instrumentId || null,
      instrumentType: opts.instrumentType || null,
      mode: opts.mode || "quickStart",
      lessonRef: opts.lessonRef || null,
      segments: segments,
      exercises: opts.exercises || [],
      goals: opts.goals || [],
      difficulty: opts.difficulty || 1,
      estimatedDuration: duration,
      chord: opts.chord || null,
      chordName: opts.chordName || null,
      metadata: opts.metadata || {},
      // Backward-compat aliases for legacy callers
      type: opts.type || opts.mode || "quickStart",
      chords: segments,
      duration: duration,
      level: opts.difficulty || opts.level || 1,
      plan: (opts.metadata && opts.metadata.plan) || null,
      sessionNum: (opts.metadata && opts.metadata.sessionNum) || null
    };
    return plan;
  }

  /**
   * SessionResult — submitted by pages/flows on completion
   */
  function createSessionResult(opts) {
    opts = opts || {};
    return {
      sessionId: opts.sessionId || null,
      mode: opts.mode || "session",
      instrumentId: opts.instrumentId || null,
      instrumentType: opts.instrumentType || null,
      exerciseResults: opts.exerciseResults || [],
      accuracy: opts.accuracy || 0,
      timing: opts.timing || null,
      duration: opts.duration || 0,
      songId: opts.songId || null,
      lessonRef: opts.lessonRef || null,
      chordName: opts.chordName || null,
      completed: opts.completed !== false
    };
  }

  /**
   * ProgressOutcome — returned by ProgressEngine after applying a result
   */
  function createProgressOutcome(opts) {
    opts = opts || {};
    return {
      xpEarned: opts.xpEarned || 0,
      levelUps: opts.levelUps || [],
      masteryChanges: opts.masteryChanges || {},
      unlocks: opts.unlocks || [],
      achievements: opts.achievements || [],
      streakChanges: opts.streakChanges || null,
      comebackBonus: opts.comebackBonus || 0,
      nextRecommendation: opts.nextRecommendation || null
    };
  }

  window.SparkContracts = {
    createSessionPlan: createSessionPlan,
    createSessionResult: createSessionResult,
    createProgressOutcome: createProgressOutcome
  };
})();
