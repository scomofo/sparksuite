(function() {
  var cachedFallbackPsychologyEngine = null;

  function ProgressEngine(storage, psychologyEngine) {
    this.storage = storage || null;
    this.psychologyEngine = psychologyEngine || null;
    this.eventBus = null;
  }

  ProgressEngine.prototype.setEventBus = function(eventBus) {
    this.eventBus = eventBus || null;
    return this.eventBus;
  };

  ProgressEngine.prototype.setPsychologyEngine = function(psychologyEngine) {
    this.psychologyEngine = psychologyEngine || null;
    return this.psychologyEngine;
  };

  ProgressEngine.prototype.emit = function(type, payload) {
    emitProgressEvent(this, type, payload);
  };

  ProgressEngine.prototype.calculatePerformanceScore = function(performance) {
    performance = performance || {};
    var accuracy = typeof performance.accuracy === "number" ? performance.accuracy : 0;
    var timing = performance.timing && typeof performance.timing.score === "number"
      ? performance.timing.score
      : accuracy;
    return accuracy * 0.7 + timing * 0.3;
  };

  ProgressEngine.prototype.smoothMastery = function(current, score) {
    current = typeof current === "number" ? current : 0;
    score = typeof score === "number" ? score : 0;
    return Number((current * 0.75 + score * 0.25).toFixed(3));
  };

  ProgressEngine.prototype.buildPerformanceResultsView = function(results, options) {
    results = results || {};
    options = options || {};
    var phrases = normalizePerformancePhraseResults(results.phrases || [], this, options);
    var weakest = getWeakestPerformancePhrase(phrases);
    return {
      metrics: {
        accuracyFormatted: formatResultNumber(results.accuracy) + "%",
        scoreFormatted: formatResultNumber(results.score),
        starsFormatted: formatResultNumber(results.stars),
        maxComboFormatted: formatResultNumber(results.maxCombo),
        masteryFormatted: String(options.mastery || "None")
      },
      phrases: phrases,
      weakestPhraseId: weakest ? weakest.phraseId : null,
      weakestPhraseAccuracy: weakest ? weakest.accuracy : null
    };
  };

  ProgressEngine.prototype.hasPerformedAnyPhrase = function(results, chart) {
    var phraseStats = results && results.phraseStats;
    var phrases = chart && chart.phrases;
    if (!Array.isArray(phraseStats) || !phraseStats.length || !Array.isArray(phrases) || !phrases.length) return false;
    for (var i = 0; i < phraseStats.length; i++) {
      if (phrases[i] && phraseStats[i] && phraseStats[i].total > 0) return true;
    }
    return false;
  };

  ProgressEngine.prototype.canPracticeWeakestPhrase = function(chart, results) {
    return this.hasPerformedAnyPhrase(results, chart);
  };

  ProgressEngine.prototype.buildPerformSongState = function(results, chart) {
    return {
      canPracticeWeakestPhrase: this.canPracticeWeakestPhrase(chart, results),
      showWeakestPhraseAction: this.canPracticeWeakestPhrase(chart, results)
    };
  };

  ProgressEngine.prototype.buildPerformanceDoneState = function(results, chart, runtimeState) {
    runtimeState = runtimeState || {};
    if (!results) {
      return {
        hasResults: false,
        action: "performDoneSongs",
        label: "Songs"
      };
    }

    var phrases = normalizePerformanceResultPhrases(results.phraseStats || []);
    var bestPhrase = getBestPerformancePhrase(phrases);
    var weakestPhrase = getWeakestPerformancePhrase(phrases);
    var chartId = runtimeState.performanceChartId || (chart && chart.id) || "unknown";
    var totalEvents = clampProgressNumber(results.totalEvents, 0, 999999999, 0);
    var accuracy = ProgressEngine.toAccuracyPercent(results.accuracy, ProgressEngine.ACCURACY_PERCENT);

    return {
      hasResults: true,
      title: firstProgressTextToken(results.title, results.songTitle, chartId, "Performance"),
      artist: firstProgressTextToken(results.artist, "Unknown Artist"),
      chartId: chartId,
      targetTechnique: Object.prototype.hasOwnProperty.call(runtimeState, "performanceTargetTechnique")
        ? runtimeState.performanceTargetTechnique
        : null,
      metrics: {
        stars: clampProgressNumber(results.stars, 0, 5, 0),
        score: clampProgressNumber(results.score, 0, 999999999, 0),
        accuracy: accuracy,
        maxCombo: clampProgressNumber(results.maxCombo, 0, 999999999, 0),
        totalEvents: totalEvents,
        missedEvents: totalEvents - Math.round(accuracy * totalEvents / 100)
      },
      phrases: phrases,
      bestPhrase: bestPhrase,
      weakestPhrase: weakestPhrase,
      showWeakestPhraseAction: this.canPracticeWeakestPhrase(chart, results),
      rawResults: results
    };
  };

  ProgressEngine.prototype.buildLegacyGuidedSessionCompletion = function(plan, options) {
    options = options || {};
    var rewards = getLegacyCompletionRewards(this, plan, options);
    var outcome = {
      completedSessionNums: [],
      sessionsDelta: 0,
      currentSession: null,
      chordProgress: {},
      xpAwarded: 0,
      historyEntry: null,
      lhLevel: null,
      rewardTrigger: rewards.rewardTrigger,
      audioCue: rewards.audioCue
    };
    if (!plan) return outcome;

    var sessionNum = typeof plan.num === "number" && isFinite(plan.num) ? plan.num : null;
    var chordName = plan.newMove && plan.newMove.chord ? plan.newMove.chord : null;
    if (sessionNum != null) {
      outcome.completedSessionNums.push(sessionNum);
      outcome.sessionsDelta = 1;
      outcome.currentSession = Math.min(50, sessionNum + 1);
    }
    if (chordName) outcome.chordProgress[chordName] = rewards.chordProgressIncrement;
    outcome.xpAwarded = rewards.xpAwarded;
    outcome.historyEntry = { type: "guided_session", detail: { session: sessionNum, chord: chordName } };
    outcome.lhLevel = calculateLegacyLhLevel(options.curriculum, options.lhPatterns, options.level, options.lhLevel);
    return outcome;
  };

  ProgressEngine.prototype.calculateNextReview = function(mastery) {
    mastery = typeof mastery === "number" ? mastery : 0;
    var days = mastery > 0.85 ? 7 : mastery > 0.7 ? 3 : 1;
    var date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  ProgressEngine.prototype.updateMastery = function(payload) {
    payload = payload || {};
    var userId = payload.userId || null;
    var instrument = payload.instrument || null;
    var skillId = payload.skillId || null;
    var performance = payload.performance || {};
    var performanceScore = this.calculatePerformanceScore(performance);
    var profile;
    var current;
    var nextMastery;

    if (!skillId) throw new Error("updateMastery requires skillId");

    if (this.storage && typeof this.storage.getUserProfile === "function" && typeof this.storage.updateUserProfile === "function") {
      profile = this.storage.getUserProfile(userId) || {};
      current = profile.mastery && profile.mastery[skillId] && typeof profile.mastery[skillId].mastery === "number"
        ? profile.mastery[skillId].mastery
        : 0;
      nextMastery = this.smoothMastery(current, performanceScore);
      var updatedProfile = this.storage.updateUserProfile(userId, {
        mastery: mergeNamedObjects(profile.mastery || {}, buildMasteryEntry(skillId, instrument, nextMastery, performance))
      });
      this.emit("progress.mastery.updated", {
        userId: userId,
        skillId: skillId,
        instrument: instrument,
        mastery: nextMastery
      });
      return updatedProfile;
    }

    if (typeof SparkMastery !== "undefined" && typeof SparkMastery.get === "function" && typeof SparkMastery.set === "function") {
      current = SparkMastery.get("lessons", skillId) || 0;
      nextMastery = this.smoothMastery(current, performanceScore);
      SparkMastery.set("lessons", skillId, nextMastery);
      this.emit("progress.mastery.updated", {
        userId: userId,
        skillId: skillId,
        instrument: instrument,
        mastery: nextMastery
      });
      return buildMasteryValue(skillId, instrument, nextMastery, performance);
    }

    if (typeof S !== "undefined") {
      if (!S.mastery || typeof S.mastery !== "object") S.mastery = {};
      if (!S.mastery.lessons || typeof S.mastery.lessons !== "object") S.mastery.lessons = {};
      current = S.mastery.lessons[skillId] && typeof S.mastery.lessons[skillId].mastery === "number"
        ? S.mastery.lessons[skillId].mastery
        : 0;
      nextMastery = this.smoothMastery(current, performanceScore);
      S.mastery.lessons[skillId] = buildMasteryValue(skillId, instrument, nextMastery, performance);
      if (typeof saveState === "function") saveState();
      this.emit("progress.mastery.updated", {
        userId: userId,
        skillId: skillId,
        instrument: instrument,
        mastery: nextMastery
      });
      return S.mastery.lessons[skillId];
    }

    throw new Error("No mastery store available");
  };

  ProgressEngine.prototype.addXp = function(user, amount) {
    amount = typeof amount === "number" ? amount : 0;
    if (typeof SparkInstrumentProgress !== "undefined" && typeof SparkInstrumentProgress.addXp === "function") {
      SparkInstrumentProgress.addXp(amount);
      this.emit("progress.xp.awarded", {
        amount: amount,
        totalXp: typeof S !== "undefined" ? (S.xp || 0) : amount
      });
      return { xp: typeof S !== "undefined" ? (S.xp || 0) : amount };
    }
    var nextXp = Math.max(0, ((user && user.xp) || 0) + amount);
    this.emit("progress.xp.awarded", {
      amount: amount,
      totalXp: nextXp
    });
    return { xp: nextXp };
  };

  ProgressEngine.prototype.completeSession = function(plan, payload) {
    payload = payload || {};
    if (!plan) return { completedItems: 0, totalItems: 0, planCompleted: false, xpAwarded: 0 };
    if (plan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION) return completeGuidedSession(this, plan, payload);
    if (plan.flow === SparkSessionTypes.FLOW_PERFORMANCE_SONG) return completePerformanceSong(this, plan, payload);

    var progress = payload.itemId ? SparkProgressBridge.completePlanItem(plan, payload.itemId, payload.result) : {
      completedItems: plan.segments.length,
      totalItems: plan.segments.length,
      planCompleted: true
    };

    // Reward integrity: force-completing a plan counts as earned only with
    // evidence of work — a segment already done, an item being completed
    // now, gameplay results, or the caller explicitly vouching via
    // payload.earnedCompletion. Otherwise it is a skip. Inferred here
    // (not just trusted from callers) because completeDailyPracticePlan
    // and its request wrappers force markPlanComplete unconditionally.
    var earnedCompletion = payload.earnedCompletion;
    if (payload.markPlanComplete) {
      if (earnedCompletion === undefined && !payload.itemId && !payload.gameplayResult) {
        earnedCompletion = false;
        for (var s = 0; s < plan.segments.length; s++) {
          if (plan.segments[s].completed) { earnedCompletion = true; break; }
        }
      }
      for (var i = 0; i < plan.segments.length; i++) plan.segments[i].completed = true;
      progress.completedItems = plan.segments.length;
      progress.totalItems = plan.segments.length;
      progress.planCompleted = true;
      SparkProgressBridge.syncPlanToState(plan);
    }

    if (progress.planCompleted) {
      // An unearned completion (zero items actually done — the "Skip
      // today" path) still finalizes the plan so the day is closed out,
      // but awards nothing: no XP, no toast, no orchestrator credit.
      // History records it as a skip.
      if (earnedCompletion === false) {
        var skipSummary = buildCompletionSummary(plan, 0, 0);
        skipSummary.skipped = true;
        SparkProgressBridge.finalizePlan(plan, {
          xpAwarded: 0,
          sessionStatePatch: {},
          completionSummary: skipSummary
        });
        // The segments were force-marked above so the day closes out, but
        // the reported progress must say what actually happened: nothing.
        progress.completedItems = 0;
        progress.xpAwarded = 0;
        progress.sessionStatePatch = {};
        progress.completionSummary = skipSummary;
        emitProgressEvent(this, "progress.session.completed", {
          sessionId: plan.id,
          flow: plan.flow,
          xpAwarded: 0,
          skipped: true,
          completedItems: progress.completedItems,
          totalItems: progress.totalItems
        });
        return progress;
      }
      var summary = SparkPerformanceBridge.buildPerformanceSummary(plan);
      var xpAwarded = 20;
      var sessionStatePatch = {
        xpToast: { amount: 20, time: Date.now() }
      };
      if (payload.gameplayResult) {
        xpAwarded += Math.max(0, Math.round(ProgressEngine.toAccuracyFraction(
          payload.gameplayResult.gameplay && payload.gameplayResult.gameplay.accuracy,
          ProgressEngine.ACCURACY_FRACTION
        ) * 20));
        sessionStatePatch = mergeSessionStatePatch(sessionStatePatch, buildGameplayLearningPatch(payload.gameplayResult.learning, payload.gameplayContext, payload.gameplayResult.gameplay));
        sessionStatePatch.xpToast.amount = xpAwarded;
      }
      var completionSummary = buildCompletionSummary(plan, xpAwarded, summary.durationSec);
      if (typeof SparkProgressOrchestrator !== "undefined") {
        SparkProgressOrchestrator.evaluateAll({
          type: "session",
          xpAwarded: xpAwarded,
          duration: summary.durationSec,
          streakUpdated: false
        });
      }
      SparkProgressBridge.finalizePlan(plan, {
        xpAwarded: xpAwarded,
        sessionStatePatch: sessionStatePatch,
        completionSummary: completionSummary
      });
      progress.xpAwarded = xpAwarded;
      progress.sessionStatePatch = sessionStatePatch;
      progress.completionSummary = completionSummary;
      emitProgressEvent(this, "progress.session.completed", {
        sessionId: plan.id,
        flow: plan.flow,
        xpAwarded: xpAwarded,
        completedItems: progress.completedItems,
        totalItems: progress.totalItems
      });
    } else if (typeof saveState === "function") {
      saveState();
    }

    return progress;
  };

  function completeGuidedSession(engine, plan, payload) {
    var progress = payload.itemId ? SparkProgressBridge.completePlanItem(plan, payload.itemId, payload.result) : {
      completedItems: plan.segments.length,
      totalItems: plan.segments.length,
      planCompleted: true
    };

    // markPlanComplete forces full completion (used by the final-completion
    // path). Evaluate it BEFORE the reward gate so planCompleted reflects it.
    if (payload.markPlanComplete && Array.isArray(plan.segments)) {
      for (var i = 0; i < plan.segments.length; i++) plan.segments[i].completed = true;
      progress.completedItems = plan.segments.length;
      progress.totalItems = plan.segments.length;
      progress.planCompleted = true;
      SparkProgressBridge.syncPlanToState(plan);
    }

    // advanceGuidedSession calls completeSession({itemId}) on EVERY block-type
    // transition, not just at the end. Reward/progression side-effects (XP,
    // session count, chord progress, advancing S.guidedSession) must fire ONCE —
    // only when the guided session is actually finished. Without this gate a
    // multi-block session inflated XP/sessions/chord-progress ~Nx and advanced
    // S.guidedSession on the first block transition (before the user finished).
    // For an incomplete (mid-block) completion, segment progress is already
    // persisted by completePlanItem; return without rewards.
    if (!progress.planCompleted) {
      // Persist the segment progress completePlanItem just recorded — the old
      // unconditional code saved at the end of this function on every call.
      if (typeof saveState === "function") saveState();
      return progress;
    }

    var guidedPlan = plan.context ? plan.context.guidedPlan : null;
    var totalGuidedSessions = plan.context && plan.context.totalGuidedSessions ? plan.context.totalGuidedSessions : 1;
    var outcome = null;
    var sessionStatePatch = {
      guided: {
        completedSessionNums: [],
        nextGuidedSession: null,
        chordProgress: {}
      }
    };

    if (guidedPlan) {
      sessionStatePatch.guided.completedSessionNums.push(guidedPlan.num);
      if (guidedPlan.newMove && guidedPlan.newMove.chord) {
        sessionStatePatch.guided.chordProgress[guidedPlan.newMove.chord] = 25;
      }
      sessionStatePatch.guided.nextGuidedSession = Math.min(totalGuidedSessions || guidedPlan.num + 1, guidedPlan.num + 1);
      if (typeof SparkSession !== "undefined" && typeof SparkSession.processResults === "function") {
        outcome = SparkSession.processResults({
          type: "guided",
          chordName: guidedPlan.newMove ? guidedPlan.newMove.chord : null,
          duration: 300
        });
      }
    }

    if (outcome) {
      sessionStatePatch.xpToast = { amount: outcome.xpEarned, time: Date.now(), jackpot: outcome.jackpot };
      progress.xpAwarded = outcome.xpEarned || 0;
      progress.audioCue = outcome.jackpot || outcome.leveledUp ? "levelup" : "complete";
    } else {
      sessionStatePatch.xpToast = { amount: 30, time: Date.now() };
      progress.xpAwarded = 30;
      progress.audioCue = "complete";
    }

    SparkProgressBridge.applySessionStatePatch(sessionStatePatch);
    progress.sessionStatePatch = sessionStatePatch;
    if (typeof saveState === "function") saveState();
    emitProgressEvent(engine, "progress.session.completed", {
      sessionId: plan.id,
      flow: plan.flow,
      xpAwarded: progress.xpAwarded || 0,
      completedItems: progress.completedItems,
      totalItems: progress.totalItems
    });
    return progress;
  }

  function completePerformanceSong(engine, plan, payload) {
    var progress = payload.itemId ? SparkProgressBridge.completePlanItem(plan, payload.itemId, payload.result) : {
      completedItems: plan.segments.length,
      totalItems: plan.segments.length,
      planCompleted: true
    };

    if (payload.markPlanComplete && Array.isArray(plan.segments)) {
      for (var i = 0; i < plan.segments.length; i++) plan.segments[i].completed = true;
      progress.completedItems = plan.segments.length;
      progress.totalItems = plan.segments.length;
      progress.planCompleted = true;
    }

    if (progress.planCompleted) {
      var performanceResults = payload.performanceResults || {};
      var xpAwarded = typeof payload.xpAwarded === "number"
        ? payload.xpAwarded
        : Math.max(5, Math.round(ProgressEngine.toAccuracyPercent(
            performanceResults.accuracy,
            ProgressEngine.ACCURACY_PERCENT
          ) / 10));
      SparkProgressBridge.applyLegacyReward({
        xpDelta: xpAwarded,
        toastAmount: xpAwarded
      });
      progress.xpAwarded = xpAwarded;
      progress.sessionStatePatch = {
        xpToast: {
          amount: xpAwarded,
          time: Date.now()
        }
      };
      progress.performanceSummary = buildPerformanceCompletionSummary(plan, performanceResults, xpAwarded);
      emitProgressEvent(engine, "progress.session.completed", {
        sessionId: plan.id,
        flow: plan.flow,
        xpAwarded: xpAwarded,
        completedItems: progress.completedItems,
        totalItems: progress.totalItems
      });
    }

    if (typeof saveState === "function") saveState();
    return progress;
  }

  function buildGameplayLearningPatch(learning, gameplayContext, gameplay) {
    learning = learning || {};
    var patch = {
      mastery: {
        rhythm: {}
      },
      weakSpots: {}
    };
    var skills = Array.isArray(learning.skills) ? learning.skills : [];
    for (var i = 0; i < skills.length; i++) {
      patch.mastery.rhythm[skills[i].id] = Math.round((skills[i].delta || 0) * 100);
    }
    if (Array.isArray(learning.weakAreas)) {
      patch.weakSpots.rhythmHighway = learning.weakAreas.slice();
    }
    var instrumentSkillPatch = buildInstrumentSkillProgressPatch(gameplayContext, learning, gameplay);
    if (instrumentSkillPatch) {
      for (var skillKey in instrumentSkillPatch) {
        if (Object.prototype.hasOwnProperty.call(instrumentSkillPatch, skillKey)) {
          patch[skillKey] = instrumentSkillPatch[skillKey];
        }
      }
    }
    return patch;
  }

  // Instrument-agnostic: an instrument opts into rhythm-drill skill progress
  // by declaring getCapabilities().skillProgress = { stateKey, movementBasis }
  // on its adapter. No instrument names live in this engine.
  function resolveInstrumentSkillProgressConfig(instrumentType) {
    var registry = typeof window !== "undefined" ? window.SparkSuiteInstrumentAdapters : null;
    var factory = registry && instrumentType ? registry[instrumentType] : null;
    if (typeof factory !== "function") return null;
    try {
      var adapter = factory();
      var caps = adapter && typeof adapter.getCapabilities === "function" ? adapter.getCapabilities() : null;
      var config = caps ? caps.skillProgress : null;
      return config && typeof config.stateKey === "string" && config.stateKey ? config : null;
    } catch (err) {
      return null;
    }
  }

  function buildInstrumentSkillProgressPatch(gameplayContext, learning, gameplay) {
    gameplayContext = gameplayContext || {};
    var instrument = gameplayContext.instrument || null;
    var focus = gameplayContext.exerciseFocus || null;
    if (!instrument || !focus) return null;
    var skillConfig = resolveInstrumentSkillProgressConfig(instrument);
    if (!skillConfig) return null;

    var accuracy = ProgressEngine.toAccuracyFraction(gameplay.accuracy, ProgressEngine.ACCURACY_FRACTION);
    var maxCombo = typeof gameplay.maxCombo === "number" ? gameplay.maxCombo : 0;
    var comboFactor = Math.max(0, Math.min(1, maxCombo / 20));
    var weakAreas = Array.isArray(learning.weakAreas) ? learning.weakAreas : [];
    var latePenalty = weakAreas.indexOf("late") >= 0 || weakAreas.indexOf("late_strums") >= 0 ? 0.18 : 0;
    var fretPenalty = weakAreas.indexOf("wrong_fret") >= 0 ? 0.18 : 0;
    var groove = clampUnit(accuracy * 0.7 + comboFactor * 0.3 - latePenalty / 2);
    var timing = clampUnit(accuracy - latePenalty);
    var movement = clampUnit(accuracy - fretPenalty);
    var control = clampUnit((accuracy + groove) / 2 - (fretPenalty / 2));
    var entry = {
      groove: groove,
      timing: timing,
      accuracy: accuracy,
      movement: skillConfig.movementBasis === "movement" ? movement : control
    };

    var skillPatch = {};
    skillPatch[skillConfig.stateKey] = buildSkillProgressMap(focus, entry);
    return skillPatch;
  }

  function buildSkillProgressMap(skill, entry) {
    var out = {};
    out[skill] = entry;
    return out;
  }

  function clampUnit(value) {
    return Math.max(0, Math.min(1, value || 0));
  }

  function buildCompletionSummary(plan, xpAwarded, durationSec) {
    var legacyPlan = plan && typeof plan.toLegacyPracticePlan === "function" ? plan.toLegacyPracticePlan() : null;
    return {
      sessionId: plan ? plan.id : null,
      flow: plan ? plan.flow : null,
      date: plan ? plan.generatedDate : null,
      focus: plan ? plan.focus : "",
      itemCount: legacyPlan ? legacyPlan.totalItems : (plan && plan.segments ? plan.segments.length : 0),
      durationSec: durationSec || 0,
      xpAwarded: xpAwarded || 0,
      completedAt: Date.now()
    };
  }

  function buildPerformanceCompletionSummary(plan, performanceResults, xpAwarded) {
    var performanceSong = plan && plan.context ? plan.context.performanceSong : null;
    return {
      sessionId: plan ? plan.id : null,
      flow: plan ? plan.flow : null,
      songId: performanceSong ? performanceSong.songId : "",
      arrangementType: performanceSong ? performanceSong.arrangementType : "",
      difficultyId: performanceSong ? performanceSong.difficultyId : "",
      accuracy: performanceResults.accuracy || 0,
      stars: performanceResults.stars || 0,
      score: performanceResults.score || 0,
      xpAwarded: xpAwarded || 0,
      completedAt: Date.now()
    };
  }

  function mergeSessionStatePatch(basePatch, nextPatch) {
    basePatch = basePatch || {};
    nextPatch = nextPatch || {};

    if (nextPatch.guided) basePatch.guided = nextPatch.guided;

    if (nextPatch.mastery) {
      if (!basePatch.mastery) basePatch.mastery = {};
      if (nextPatch.mastery.rhythm) {
        if (!basePatch.mastery.rhythm) basePatch.mastery.rhythm = {};
        for (var skillId in nextPatch.mastery.rhythm) {
          basePatch.mastery.rhythm[skillId] = nextPatch.mastery.rhythm[skillId];
        }
      }
    }

    if (nextPatch.weakSpots) {
      if (!basePatch.weakSpots) basePatch.weakSpots = {};
      for (var weakSpotKey in nextPatch.weakSpots) {
        basePatch.weakSpots[weakSpotKey] = Array.isArray(nextPatch.weakSpots[weakSpotKey])
          ? nextPatch.weakSpots[weakSpotKey].slice()
          : nextPatch.weakSpots[weakSpotKey];
      }
    }

    if (nextPatch.bassSkillProgress) {
      if (!basePatch.bassSkillProgress) basePatch.bassSkillProgress = {};
      mergeNamedSkillPatch(basePatch.bassSkillProgress, nextPatch.bassSkillProgress);
    }

    if (nextPatch.ukuleleSkillProgress) {
      if (!basePatch.ukuleleSkillProgress) basePatch.ukuleleSkillProgress = {};
      mergeNamedSkillPatch(basePatch.ukuleleSkillProgress, nextPatch.ukuleleSkillProgress);
    }

    if (nextPatch.xpToast) basePatch.xpToast = nextPatch.xpToast;
    return basePatch;
  }

  function mergeNamedSkillPatch(target, incoming) {
    for (var skillId in incoming) {
      target[skillId] = incoming[skillId];
    }
  }

  function mergeNamedObjects(target, incoming) {
    var merged = clone(target || {});
    var key;
    for (key in incoming) {
      if (Object.prototype.hasOwnProperty.call(incoming, key)) merged[key] = incoming[key];
    }
    return merged;
  }

  function buildMasteryEntry(skillId, instrument, mastery, performance) {
    var entry = {};
    entry[skillId] = buildMasteryValue(skillId, instrument, mastery, performance);
    return entry;
  }

  function buildMasteryValue(skillId, instrument, mastery, performance) {
    return {
      instrument: instrument,
      skillId: skillId,
      mastery: mastery,
      lastAccuracy: performance.accuracy,
      lastTiming: performance.timing || null,
      updatedAt: new Date().toISOString(),
      nextReviewAt: calculateNextReviewAt(mastery)
    };
  }

  function calculateNextReviewAt(mastery) {
    mastery = typeof mastery === "number" ? mastery : 0;
    var days = mastery > 0.85 ? 7 : mastery > 0.7 ? 3 : 1;
    var date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  function formatResultNumber(value) {
    return String(typeof value === "number" && isFinite(value) ? value : 0);
  }

  function normalizePerformancePhraseResults(phrases, engine, options) {
    var view = [];
    var i;
    var phrase;
    var accuracy;
    var psychologyEngine = getProgressPsychologyEngine(engine, options);
    if (!Array.isArray(phrases)) return view;
    for (i = 0; i < phrases.length; i++) {
      phrase = phrases[i] || {};
      accuracy = phrase.total ? Math.round(((phrase.hits || 0) / phrase.total) * 100) : 0;
      view.push({
        phraseId: phrase.phraseId,
        name: phrase.name,
        accuracy: accuracy,
        accuracyFormatted: accuracy + "%",
        rating: psychologyEngine && typeof psychologyEngine.getPerformancePhraseRating === "function"
          ? psychologyEngine.getPerformancePhraseRating(accuracy)
          : getFallbackPerformancePhraseRating(accuracy)
      });
    }
    return view;
  }

  function normalizePerformanceResultPhrases(phraseStats) {
    var view = [];
    var i;
    var phrase;
    var total;
    var accuracy;
    if (!Array.isArray(phraseStats)) return view;
    for (i = 0; i < phraseStats.length; i++) {
      phrase = phraseStats[i] || {};
      total = clampProgressNumber(phrase.total, 0, 999999999, 0);
      accuracy = total > 0 ? Math.round(clampProgressNumber(phrase.scoreSum, 0, 999999999, 0) / total * 100) : 0;
      view.push({
        phraseId: phrase.id || phrase.phraseId || null,
        name: firstProgressTextToken(phrase.name, "Phrase " + (i + 1)),
        total: total,
        scoreSum: clampProgressNumber(phrase.scoreSum, 0, 999999999, 0),
        perfects: clampProgressNumber(phrase.perfects, 0, 999999999, 0),
        goods: clampProgressNumber(phrase.goods, 0, 999999999, 0),
        oks: clampProgressNumber(phrase.oks, 0, 999999999, 0),
        misses: clampProgressNumber(phrase.misses, 0, 999999999, 0),
        accuracy: accuracy
      });
    }
    return view;
  }

  function firstProgressTextToken() {
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] === "string" && arguments[i].trim()) return arguments[i].trim();
    }
    return "";
  }

  function clampProgressNumber(value, min, max, fallback) {
    var numeric = Number(value);
    if (!isFinite(numeric)) return fallback;
    return Math.max(min, Math.min(max, numeric));
  }

  function getBestPerformancePhrase(phrases) {
    var best = null;
    var i;
    if (!Array.isArray(phrases)) return null;
    for (i = 0; i < phrases.length; i++) {
      if (!best || phrases[i].accuracy > best.accuracy) best = phrases[i];
    }
    return best;
  }

  function getWeakestPerformancePhrase(phrases) {
    var weakest = null;
    var weakestAcc = Infinity;
    var i;
    var phrase;
    var accuracy;
    if (!Array.isArray(phrases)) return null;
    for (i = 0; i < phrases.length; i++) {
      phrase = phrases[i];
      accuracy = phrase && typeof phrase.accuracy === "number" ? phrase.accuracy : null;
      if (accuracy == null) continue;
      if (accuracy < weakestAcc) {
        weakestAcc = accuracy;
        weakest = phrase;
      }
    }
    return weakest;
  }

  function calculateLegacyLhLevel(curriculum, lhPatterns, level, currentLhLevel) {
    if (!Array.isArray(curriculum) || !Array.isArray(lhPatterns)) return null;
    if (!curriculum.length) return null;
    var maxLevel = Math.min(8, curriculum.length);
    var normalizedLevel = typeof level === "number" && isFinite(level) ? level : 1;
    normalizedLevel = Math.max(1, Math.min(maxLevel, normalizedLevel));
    var idx = normalizedLevel - 1;
    var newLvl = curriculum[idx];
    var current = typeof currentLhLevel === "number" ? currentLhLevel : 0;
    if (!newLvl || !newLvl.lhPattern) return null;
    for (var i = 0; i < lhPatterns.length; i++) {
      if (lhPatterns[i] && lhPatterns[i].id === newLvl.lhPattern) {
        return i + 1 > current ? i + 1 : null;
      }
    }
    return null;
  }

  function getLegacyCompletionRewards(engine, plan, options) {
    var defaults = {
      rewardTrigger: "session_complete",
      audioCue: "complete",
      xpAwarded: 50,
      chordProgressIncrement: 15
    };
    var psychologyEngine = getProgressPsychologyEngine(engine, options);
    var rewards = psychologyEngine && typeof psychologyEngine.getSessionCompletionRewards === "function"
      ? psychologyEngine.getSessionCompletionRewards({
        plan: plan || null,
        level: options.level,
        curriculum: options.curriculum,
        lhPatterns: options.lhPatterns,
        rewardTrigger: defaults.rewardTrigger,
        audioCue: defaults.audioCue,
        xpAwarded: defaults.xpAwarded,
        chordProgressIncrement: defaults.chordProgressIncrement
      })
      : null;
    rewards = rewards || {};
    return {
      rewardTrigger: rewards.rewardTrigger || defaults.rewardTrigger,
      audioCue: rewards.audioCue || defaults.audioCue,
      xpAwarded: typeof rewards.xpAwarded === "number" ? rewards.xpAwarded : defaults.xpAwarded,
      chordProgressIncrement: typeof rewards.chordProgressIncrement === "number" ? rewards.chordProgressIncrement : defaults.chordProgressIncrement
    };
  }

  function getProgressPsychologyEngine(engine, options) {
    options = options || {};
    if (options.psychologyEngine) return options.psychologyEngine;
    if (engine && engine.psychologyEngine) return engine.psychologyEngine;
    if (typeof window !== "undefined" && window.sparkCore && window.sparkCore.psychologyEngine) return window.sparkCore.psychologyEngine;
    if (typeof SparkSuitePsychologyEngine !== "undefined") {
      if (!cachedFallbackPsychologyEngine) cachedFallbackPsychologyEngine = new SparkSuitePsychologyEngine();
      return cachedFallbackPsychologyEngine;
    }
    return null;
  }

  function getFallbackPerformancePhraseRating(accuracy) {
    if (accuracy >= 90) return "excellent";
    if (accuracy >= 70) return "good";
    return "poor";
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function emitProgressEvent(engine, type, payload) {
    if (engine && engine.eventBus && typeof engine.eventBus.emit === "function") {
      engine.eventBus.emit(type, payload || {});
    }
  }

  /*
   * Meta skill tree — unlock policy.
   *
   * The costs below and the affordability rules are progression policy, so
   * they live here rather than in js/meta/skill_tree_meta.js, which used to
   * own both. These are exposed as statics rather than instance methods
   * because the decision is pure: callers outside the engine tree can reach
   * it without constructing a ProgressEngine, and therefore without keeping
   * a fallback copy of the rules around to drift.
   */
  var META_SKILL_TREE = {
    rhythm_1: { unlocked: true, cost: 0 },
    rhythm_2: { unlocked: false, cost: 2 },
    chords_barre: { unlocked: false, cost: 3 },
    lh_patterns: { unlocked: false, cost: 2 },
    melody_mode: { unlocked: false, cost: 2 },
    speed_training: { unlocked: false, cost: 3 },
    sight_reading: { unlocked: false, cost: 4 }
  };

  function copySkillNode(node) {
    var next = {};
    var key;
    for (key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) next[key] = node[key];
    }
    return next;
  }

  function copySkillTree(tree) {
    var next = {};
    var key;
    for (key in tree) {
      if (Object.prototype.hasOwnProperty.call(tree, key)) next[key] = copySkillNode(tree[key]);
    }
    return next;
  }

  ProgressEngine.getDefaultMetaSkillTree = function() {
    return copySkillTree(META_SKILL_TREE);
  };

  /*
   * Category mastery (SparkMastery / S.mastery) is on a 0-100 scale.
   *
   * Accuracy reaches this boundary in both conventions — scoring_engine.js
   * emits 0-1, js/performance/scoring.js emits 0-100 — so normalize once
   * here rather than defending in every consumer. A value at or below 1 is
   * read as a fraction: on the percent scale those are sub-1% readings,
   * indistinguishable from noise, whereas 1 as a fraction means a perfect
   * score, which is the reading that matters. Same heuristic the psychology
   * engine already applies (psychology_engine.js:99, :109).
   */
  ProgressEngine.MASTERY_SCALE_MAX = 100;

  ProgressEngine.toMasteryPercent = function(value) {
    var n = typeof value === "number" && isFinite(value) ? value : 0;
    if (n < 0) n = 0;
    if (n <= 1) n = n * 100;
    return Math.max(0, Math.min(ProgressEngine.MASTERY_SCALE_MAX, n));
  };

  /*
   * Accuracy reaches ProgressEngine on TWO different scales, because the two
   * scorers report differently:
   *
   *   gameplayResult.gameplay.accuracy   0..1    SparkScoringEngine.toSummary()
   *   performanceResults.accuracy        0..100  finalizePerformanceResults()
   *
   * Every consumer used to clamp rather than convert, so a value arriving on
   * the wrong scale was silently flattened instead of rejected: 0.95 clamped
   * into the percent range reads as 1% accuracy, and 95 clamped into the
   * fraction range reads as a flawless run. Both corrupt XP and mastery
   * without raising anything.
   *
   * Unlike toMasteryPercent above, these do not guess from the value — the
   * caller names the scale its source produces, so a mismatch is a visible
   * error at the call site rather than a plausible-looking number.
   */
  ProgressEngine.ACCURACY_FRACTION = "fraction";
  ProgressEngine.ACCURACY_PERCENT = "percent";

  ProgressEngine.toAccuracyPercent = function(value, sourceScale) {
    var n = typeof value === "number" && isFinite(value) ? value : Number(value);
    if (!isFinite(n) || n < 0) n = 0;
    if (sourceScale === ProgressEngine.ACCURACY_FRACTION) n = n * 100;
    return Math.max(0, Math.min(100, n));
  };

  ProgressEngine.toAccuracyFraction = function(value, sourceScale) {
    return ProgressEngine.toAccuracyPercent(value, sourceScale) / 100;
  };

  /*
   * Blend one performance into a category's stored mastery and persist it.
   * Uses the same 0.75/0.25 weighting as smoothMastery, so there is one
   * blend rule rather than the two that used to coexist. Static because the
   * progression cascade needs it without holding an engine instance.
   */
  ProgressEngine.blendCategoryMastery = function(category, skillId, accuracy) {
    if (!category || !skillId) return null;

    var next = ProgressEngine.toMasteryPercent(accuracy);
    var current;
    var blended;

    if (typeof SparkMastery !== "undefined" && SparkMastery
        && typeof SparkMastery.get === "function" && typeof SparkMastery.set === "function") {
      current = SparkMastery.get(category, skillId);
      blended = typeof current === "number" ? (current * 0.75) + (next * 0.25) : next;
      SparkMastery.set(category, skillId, blended);
      return blended;
    }

    if (typeof S === "undefined" || !S) return null;
    if (!S.mastery || typeof S.mastery !== "object") S.mastery = {};
    if (!S.mastery[category] || typeof S.mastery[category] !== "object") S.mastery[category] = {};
    current = S.mastery[category][skillId];
    blended = typeof current === "number" ? (current * 0.75) + (next * 0.25) : next;
    S.mastery[category][skillId] = blended;
    return blended;
  };

  /*
   * Decide whether a skill can be unlocked. Pure: takes the current tree and
   * point balance, returns the outcome plus the resulting tree and balance.
   * The caller persists them; this never touches S or storage.
   *
   * Refusal order is deliberate — a zero balance refuses before cost is
   * considered, so a free skill still cannot be taken with no points, which
   * is the behaviour the meta layer had.
   */
  ProgressEngine.evaluateSkillUnlock = function(request) {
    request = request || {};
    var tree = request.skillTree && typeof request.skillTree === "object"
      ? request.skillTree
      : ProgressEngine.getDefaultMetaSkillTree();
    var skillId = request.skillId || null;
    var available = typeof request.skillPoints === "number" ? request.skillPoints : 0;
    var node = skillId && Object.prototype.hasOwnProperty.call(tree, skillId) ? tree[skillId] : null;
    var cost = node && typeof node.cost === "number" ? node.cost : 0;

    function refuse(reason) {
      return {
        unlocked: false,
        reason: reason,
        cost: cost,
        skillTree: tree,
        skillPoints: available
      };
    }

    if (!node) return refuse("unknown_skill");
    if (node.unlocked) return refuse("already_unlocked");
    if (available <= 0) return refuse("no_skill_points");
    if (cost > available) return refuse("insufficient_skill_points");

    var nextTree = copySkillTree(tree);
    nextTree[skillId].unlocked = true;

    return {
      unlocked: true,
      reason: "unlocked",
      cost: cost,
      skillTree: nextTree,
      skillPoints: available - cost
    };
  };

  window.SparkSuiteProgressEngine = ProgressEngine;
})();
