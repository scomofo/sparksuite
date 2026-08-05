// ===== SPARK PSYCHOLOGY ENGINE =====
// Variable reinforcement schedules, adaptive difficulty delegation,
// session structure definitions, and micro-moment gating.

window.SparkPsychology = (function () {

  // -----------------------------------------------------------------------
  // 1. shouldReward(sessionCount)
  // Variable reinforcement schedule — reward density thins as sessions grow
  // (Stretching the Ratios: builds extinction-resistant practice habits)
  // -----------------------------------------------------------------------
  function shouldReward(sessionCount) {
    var n = sessionCount || 0;
    if (n <= 5)  return true;                    // Phase 1: continuous (1–5)
    if (n <= 14) return Math.random() < 0.33;    // Phase 2: VR-3  (6–14)
    if (n <= 30) return Math.random() < 0.14;    // Phase 3: VR-7  (15–30)
    return Math.random() < 0.10;                 // Phase 4: VR-10 (31+)
  }

  // -----------------------------------------------------------------------
  // 2. getRewardPhase(sessionCount)
  // Returns { phase, probability, name } describing current VR phase
  // -----------------------------------------------------------------------
  function getRewardPhase(sessionCount) {
    var n = sessionCount || 0;
    if (n <= 5)  return { phase: 1, probability: 1.00, name: "Continuous" };
    if (n <= 14) return { phase: 2, probability: 0.33, name: "VR-3" };
    if (n <= 30) return { phase: 3, probability: 0.14, name: "VR-7" };
    return              { phase: 4, probability: 0.10, name: "VR-10" };
  }

  // -----------------------------------------------------------------------
  // 3. shouldJackpot()
  // Rare bonus event — fires ~1 in 15 chances
  // -----------------------------------------------------------------------
  function shouldJackpot() {
    return Math.random() < (1 / 15);
  }

  // -----------------------------------------------------------------------
  // 4. getAdaptiveDifficulty(context)
  // Delegates to buildAdaptiveDecision (adaptive.js) when available;
  // otherwise returns a safe "keep" decision.
  // -----------------------------------------------------------------------
  function getAdaptiveDifficulty(context) {
    context = context || {};
    if (typeof window.buildAdaptiveDecision === "function") {
      return window.buildAdaptiveDecision(context);
    }
    // Fallback — no adaptive rule available
    return {
      targetType:      context.targetType || "generic",
      difficultyAction: "keep",
      currentValue:    context.currentValue || 0,
      nextValue:       context.currentValue || 0,
      reason:          "buildAdaptiveDecision not available"
    };
  }

  // -----------------------------------------------------------------------
  // 5. getSessionStructure(instrumentType)
  // Returns ordered segment name array for the given instrument.
  // Instrument-agnostic: a custom block order comes from the instrument
  // adapter's getCapabilities().sessionStructure declaration.
  // -----------------------------------------------------------------------
  function getSessionStructure(instrumentType) {
    var registry = typeof window !== "undefined" ? window.SparkSuiteInstrumentAdapters : null;
    var factory = registry && instrumentType ? registry[instrumentType] : null;
    if (typeof factory === "function") {
      try {
        var adapter = factory();
        var caps = adapter && typeof adapter.getCapabilities === "function" ? adapter.getCapabilities() : null;
        if (caps && Array.isArray(caps.sessionStructure) && caps.sessionStructure.length) {
          return caps.sessionStructure.slice();
        }
      } catch (err) {}
    }
    return ["spark", "review", "newMove", "songSlice", "victoryLap"];
  }

  // -----------------------------------------------------------------------
  // 6. shouldFireMicro(id, alreadyFired)
  // Returns true only if this micro-moment id has not already fired
  // -----------------------------------------------------------------------
  function shouldFireMicro(id, alreadyFired) {
    var fired = Array.isArray(alreadyFired) ? alreadyFired : [];
    return fired.indexOf(id) === -1;
  }

  // -----------------------------------------------------------------------
  // 7. getComebackBonus(lastDate)
  // Returns XP bonus based on days elapsed since last session date
  // lastDate: Date object, ISO string, or ms timestamp — or null/undefined
  // -----------------------------------------------------------------------
  function getComebackBonus(lastDate) {
    if (!lastDate) return 0;
    var last = (lastDate instanceof Date) ? lastDate : new Date(lastDate);
    if (isNaN(last.getTime())) return 0;
    var now  = new Date();
    var days = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    if (days >= 30) return 80;
    if (days >= 7)  return 50;
    if (days >= 3)  return 20;
    return 0;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------
  return {
    shouldReward:         shouldReward,
    getRewardPhase:       getRewardPhase,
    shouldJackpot:        shouldJackpot,
    getAdaptiveDifficulty: getAdaptiveDifficulty,
    getSessionStructure:  getSessionStructure,
    shouldFireMicro:      shouldFireMicro,
    getComebackBonus:     getComebackBonus
  };

}());
