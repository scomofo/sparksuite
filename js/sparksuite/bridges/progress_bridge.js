(function() {
  function getStateFacade() {
    return typeof SparkState !== "undefined" ? SparkState : null;
  }

  function getBridgeRoot() {
    var stateFacade = getStateFacade();
    if (stateFacade && typeof stateFacade.getRoot === "function") {
      var sparkRoot = stateFacade.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function bridgeRead(path, fallback) {
    var stateFacade = getStateFacade();
    var root = getBridgeRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (stateFacade && typeof stateFacade.read === "function") return stateFacade.read(path, fallback);
    if (!cursor) return fallback;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function bridgeWrite(path, value) {
    var stateFacade = getStateFacade();
    var root = getBridgeRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (stateFacade && typeof stateFacade.write === "function") return stateFacade.write(path, value);
    if (!cursor || !parts.length) return value;
    for (i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function bridgeIncrement(path, delta) {
    var stateFacade = getStateFacade();
    if (stateFacade && typeof stateFacade.increment === "function") return stateFacade.increment(path, delta);
    delta = typeof delta === "number" ? delta : 0;
    return bridgeWrite(path, (bridgeRead(path, 0) || 0) + delta);
  }

  function bridgeEnsureArray(path) {
    var current = bridgeRead(path, null);
    if (!Array.isArray(current)) {
      current = [];
      bridgeWrite(path, current);
    }
    return current;
  }

  function bridgeEnsureObject(path) {
    var current = bridgeRead(path, null);
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      current = {};
      bridgeWrite(path, current);
    }
    return current;
  }

  function syncPlanToState(plan) {
    if (!plan) return null;
    var stateFacade = getStateFacade();
    if (stateFacade && typeof stateFacade.setCurrentPlanId === "function") stateFacade.setCurrentPlanId(plan.id);
    else bridgeWrite("activeSessionPlanId", plan.id);
    if (plan.flow === SparkSessionTypes.FLOW_DAILY_PRACTICE) return syncDailyPracticePlanToState(plan);
    if (plan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION) return syncGuidedSessionToState(plan);
    if (plan.flow === SparkSessionTypes.FLOW_PERFORMANCE_SONG) return syncPerformanceSongToState(plan);
    return null;
  }

  function syncDailyPracticePlanToState(plan) {
    var legacyPlan = plan ? plan.toLegacyPracticePlan() : null;
    bridgeWrite("practicePlan", legacyPlan);
    bridgeWrite("practicePlanDate", legacyPlan ? legacyPlan.generatedDate : null);
    bridgeWrite("practicePlanFocus", legacyPlan ? legacyPlan.focus : "");
    bridgeWrite("practicePlanComplete", legacyPlan ? legacyPlan.completedItems >= legacyPlan.totalItems : false);
    return legacyPlan;
  }

  function syncGuidedSessionToState(plan) {
    var guidedPlan = plan && plan.context ? plan.context.guidedPlan : null;
    if (!guidedPlan) return null;
    bridgeWrite("guidedPlan", guidedPlan);
    bridgeWrite("guidedSession", plan.context.guidedSession || guidedPlan.num || bridgeRead("guidedSession", 1) || 1);
    bridgeWrite("guidedStep", "spark");
    bridgeWrite("newMovePhase", null);
    bridgeWrite("guidedPaused", false);
    return guidedPlan;
  }

  function syncPerformanceSongToState(plan) {
    var performanceSong = plan && plan.context ? plan.context.performanceSong : null;
    if (!performanceSong) return null;
    bridgeWrite("performSongData", performanceSong.songData || null);
    bridgeWrite("performSongId", performanceSong.songId || "");
    bridgeWrite("performArrangementType", performanceSong.arrangementType || "chords");
    if (performanceSong.difficultyId) bridgeWrite("performDifficulty", performanceSong.difficultyId);
    return performanceSong;
  }

  function completePlanItem(plan, itemId, result) {
    if (!plan || !Array.isArray(plan.segments)) return { completedItems: 0, totalItems: 0, planCompleted: false };

    var completedItems = 0;
    for (var i = 0; i < plan.segments.length; i++) {
      var segment = plan.segments[i];
      if (segment.id === itemId) {
        segment.completed = true;
      }
      if (segment.completed) completedItems++;
    }

    var itemResultSummary = result ? buildLegacyItemResultSummary(result) : null;
    applyItemResultSummary(itemResultSummary);

    syncPlanToState(plan);
    return {
      completedItems: completedItems,
      totalItems: plan.segments.length,
      planCompleted: completedItems >= plan.segments.length,
      itemResultSummary: itemResultSummary
    };
  }

  function finalizePlan(plan, summary) {
    summary = summary || {};
    applySessionStatePatch(summary.sessionStatePatch);
    bridgeWrite("practicePlanComplete", true);
    var completionSummary = summary.completionSummary || buildLegacyCompletionSummary(plan, summary.xpAwarded);
    var practicePlanHistory = bridgeEnsureArray("practicePlanHistory");
    practicePlanHistory.push({
      date: completionSummary.date,
      focus: completionSummary.focus,
      itemCount: completionSummary.itemCount,
      completedAt: completionSummary.completedAt,
      sessionId: completionSummary.sessionId,
      flow: completionSummary.flow,
      durationSec: completionSummary.durationSec || 0
    });
    if (practicePlanHistory.length > 30) practicePlanHistory.shift();

    if (summary.xpAwarded) {
      bridgeIncrement("xp", summary.xpAwarded);
    }

    if (typeof SparkLearningBrain !== "undefined" && typeof SparkLearningBrain.analyzeUser === "function" && bridgeRead("skillGraph", null)) {
      var brainAnalysis = SparkLearningBrain.analyzeUser(bridgeRead("skillGraph", null), null, bridgeRead("weakSpots", null) || null);
      bridgeWrite("lastBrainAnalysis", brainAnalysis);
      bridgeWrite("recommendedFocus", brainAnalysis && brainAnalysis.focusSkill ? brainAnalysis.focusSkill : (completionSummary.focus || null));
      bridgeWrite("personalInsights", {
        weakestSkills: brainAnalysis && brainAnalysis.focusSkill ? [{ id: brainAnalysis.focusSkill, value: brainAnalysis.confidence || 0 }] : [],
        strongestSkills: brainAnalysis && brainAnalysis.strongestSkill ? [{ id: brainAnalysis.strongestSkill, value: brainAnalysis.strongestValue || 0 }] : [],
        masteryTrend: {},
        practiceTrend: {},
        recommendationQuality: {
          smartCoach: {
            focusSkill: brainAnalysis && brainAnalysis.focusSkill ? brainAnalysis.focusSkill : (completionSummary.focus || null),
            weakArea: brainAnalysis ? brainAnalysis.primaryWeakArea || null : null,
            weakLane: brainAnalysis ? brainAnalysis.weakLane : null,
            recommendedDifficultyId: brainAnalysis ? brainAnalysis.recommendedDifficultyId || null : null
          }
        },
        careerTrend: {},
        packProgress: {},
        coach: {
          message: brainAnalysis && brainAnalysis.coachMessage ? brainAnalysis.coachMessage : ""
        }
      });
    }

    if (typeof saveState === "function") saveState();
  }

  function applySessionStatePatch(patch) {
    patch = patch || {};

    if (patch.guided) {
      var completedGuidedSessions = bridgeEnsureArray("completedGuidedSessions");
      var completedSessionNums = Array.isArray(patch.guided.completedSessionNums) ? patch.guided.completedSessionNums : [];
      for (var i = 0; i < completedSessionNums.length; i++) {
        if (completedGuidedSessions.indexOf(completedSessionNums[i]) < 0) {
          completedGuidedSessions.push(completedSessionNums[i]);
        }
      }

      var chordProgressState = bridgeEnsureObject("chordProgress");
      var chordProgress = patch.guided.chordProgress || {};
      for (var chordName in chordProgress) {
        chordProgressState[chordName] = Math.min((chordProgressState[chordName] || 0) + chordProgress[chordName], 100);
      }

      if (patch.guided.nextGuidedSession != null) bridgeWrite("guidedSession", patch.guided.nextGuidedSession);
    }

    if (patch.mastery && patch.mastery.rhythm) {
      var mastery = bridgeEnsureObject("mastery");
      if (!mastery.rhythm || typeof mastery.rhythm !== "object") mastery.rhythm = {};
      for (var skillId in patch.mastery.rhythm) {
        var prev = mastery.rhythm[skillId] || 0;
        mastery.rhythm[skillId] = Math.max(0, Math.min(100, prev + patch.mastery.rhythm[skillId]));
      }
    }

    if (patch.weakSpots) {
      var weakSpots = bridgeEnsureObject("weakSpots");
      for (var weakSpotKey in patch.weakSpots) {
        weakSpots[weakSpotKey] = Array.isArray(patch.weakSpots[weakSpotKey])
          ? patch.weakSpots[weakSpotKey].slice()
          : patch.weakSpots[weakSpotKey];
      }
    }

    if (patch.bassSkillProgress) {
      var bassSkillProgress = bridgeEnsureObject("bassSkillProgress");
      mergeInstrumentSkillProgress(bassSkillProgress, patch.bassSkillProgress);
    }

    if (patch.ukuleleSkillProgress) {
      var ukuleleSkillProgress = bridgeEnsureObject("ukuleleSkillProgress");
      mergeInstrumentSkillProgress(ukuleleSkillProgress, patch.ukuleleSkillProgress);
    }

    if (patch.xpToast) bridgeWrite("xpToast", patch.xpToast);
  }

  function mergeInstrumentSkillProgress(target, incoming) {
    for (var skillId in incoming) {
      var next = incoming[skillId] || {};
      var prev = target[skillId] || null;
      if (!prev) {
        target[skillId] = clone(next);
        continue;
      }
      target[skillId] = {
        groove: averageUnit(prev.groove, next.groove),
        timing: averageUnit(prev.timing, next.timing),
        accuracy: averageUnit(prev.accuracy, next.accuracy),
        movement: averageUnit(prev.movement, next.movement)
      };
    }
  }

  function averageUnit(prev, next) {
    if (typeof prev !== "number") return typeof next === "number" ? next : 0;
    if (typeof next !== "number") return prev;
    return Math.round((((prev + next) / 2) * 100)) / 100;
  }

  function applyLegacyReward(reward) {
    reward = reward || {};
    var xpDelta = reward.xpDelta || 0;
    if (xpDelta) {
      bridgeIncrement(["xp"], xpDelta);
    }
    if (reward.toastAmount) {
      var nextToast = {
        amount: reward.toastAmount,
        time: reward.time || Date.now()
      };
      if (reward.jackpot) nextToast.jackpot = true;
      bridgeWrite(["xpToast"], nextToast);
    }
    return {
      xpDelta: xpDelta,
      toastAmount: reward.toastAmount || 0,
      jackpot: !!reward.jackpot
    };
  }

  function applyPracticeSessionRecord(result) {
    if (!result) return null;

    var record = clone(result);
    record.ts = record.ts || Date.now();

    var practiceHistory = bridgeEnsureArray("practiceHistory");
    practiceHistory.push(record);

    var durationMin = record.durationMin || 0;
    if (durationMin) {
      bridgeIncrement("totalPracticeMinutes", durationMin);
      bridgeIncrement("todayPracticeMinutes", durationMin);
    }

    var today = new Date().toISOString().slice(0, 10);
    var lastPracticeDate = bridgeRead("lastPracticeDate", null);
    if (lastPracticeDate !== today) {
      var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastPracticeDate === yesterday) {
        bridgeIncrement("practiceStreak", 1);
      } else {
        bridgeWrite("practiceStreak", 1);
      }
      bridgeWrite("lastPracticeDate", today);
    }

    return record;
  }

  function applyLegacySessionOutcome(update) {
    update = update || {};

    if (update.streak) {
      if (update.streak.increment) {
        bridgeIncrement(["streak"], update.streak.increment);
      }
      if (update.streak.lastSessionDate) {
        bridgeWrite(["lastSessionDate"], update.streak.lastSessionDate);
      }
    }

    if (update.sessionsDelta) {
      bridgeIncrement(["sessions"], update.sessionsDelta);
    }

    if (typeof update.xpDelta === "number" || update.toastAmount || update.jackpot) {
      applyLegacyReward({
        xpDelta: update.xpDelta || 0,
        toastAmount: update.toastAmount || 0,
        jackpot: !!update.jackpot
      });
    }

    if (update.chordProgress) {
      for (var chordName in update.chordProgress) {
        var stateFacade = getStateFacade();
        if (stateFacade && typeof stateFacade.incrementChordProgress === "function") {
          stateFacade.incrementChordProgress(chordName, update.chordProgress[chordName], 100);
        } else {
          var chordProgress = bridgeEnsureObject("chordProgress");
          chordProgress[chordName] = Math.min((chordProgress[chordName] || 0) + update.chordProgress[chordName], 100);
        }
      }
    }

    if (typeof update.level === "number") {
      var stateFacade = getStateFacade();
      if (stateFacade && typeof stateFacade.setLevel === "function") stateFacade.setLevel(update.level);
      else bridgeWrite("level", update.level);
    }

    return {
      streak: update.streak || null,
      sessionsDelta: update.sessionsDelta || 0,
      xpDelta: update.xpDelta || 0,
      chordProgress: update.chordProgress || null,
      level: typeof update.level === "number" ? update.level : null
    };
  }

  function applyLegacyActivityCompletion(update) {
    update = update || {};

    if (update.setFlags) {
      for (var flagKey in update.setFlags) {
        bridgeWrite(flagKey, update.setFlags[flagKey]);
      }
    }

    if (update.incrementFields) {
      for (var incrementKey in update.incrementFields) {
        bridgeIncrement(incrementKey, update.incrementFields[incrementKey]);
      }
    }

    if (update.maxFields) {
      for (var maxKey in update.maxFields) {
        bridgeWrite(maxKey, Math.max(bridgeRead(maxKey, 0) || 0, update.maxFields[maxKey]));
      }
    }

    if (update.resultFields) {
      for (var resultKey in update.resultFields) {
        bridgeWrite(resultKey, clone(update.resultFields[resultKey]));
      }
    }

    if (typeof update.xpDelta === "number" || update.toastAmount || update.jackpot) {
      applyLegacyReward({
        xpDelta: update.xpDelta || 0,
        toastAmount: update.toastAmount || 0,
        jackpot: !!update.jackpot
      });
    }

    if (update.history && typeof logHistory === "function") {
      logHistory(update.history.type, update.history.detail, update.history.xp || 0);
    }

    if (update.emit && typeof _sparkEmit === "function") {
      _sparkEmit(update.emit.type, clone(update.emit.payload || {}));
    }

    if (update.checkBadges && typeof checkBadges === "function") {
      checkBadges();
    }

    if (update.save !== false && typeof saveState === "function") {
      saveState();
    }

    return {
      xpDelta: update.xpDelta || 0,
      setFlags: update.setFlags || null,
      incrementFields: update.incrementFields || null,
      maxFields: update.maxFields || null,
      resultFields: update.resultFields || null
    };
  }

  function applyLegacyActivityRuntime(update) {
    update = update || {};

    if (update.setFields) {
      for (var fieldKey in update.setFields) {
        bridgeWrite(fieldKey, update.setFields[fieldKey]);
      }
    }

    if (update.incrementFields) {
      for (var incrementKey in update.incrementFields) {
        bridgeIncrement(incrementKey, update.incrementFields[incrementKey]);
      }
    }

    if (Array.isArray(update.clearIntervals) && typeof T === "object" && T) {
      for (var i = 0; i < update.clearIntervals.length; i++) {
        var intervalKey = update.clearIntervals[i];
        if (T[intervalKey]) {
          clearInterval(T[intervalKey]);
          T[intervalKey] = null;
        }
      }
    }

    if (Array.isArray(update.clearTimeouts) && typeof T === "object" && T) {
      for (var j = 0; j < update.clearTimeouts.length; j++) {
        var timeoutKey = update.clearTimeouts[j];
        if (T[timeoutKey]) {
          clearTimeout(T[timeoutKey]);
          T[timeoutKey] = null;
        }
      }
    }

    if (Array.isArray(update.cancelAnimationFrames) && typeof cancelAnimationFrame === "function") {
      for (var k = 0; k < update.cancelAnimationFrames.length; k++) {
        if (update.cancelAnimationFrames[k]) cancelAnimationFrame(update.cancelAnimationFrames[k]);
      }
    }

    return {
      setFields: update.setFields || null,
      incrementFields: update.incrementFields || null,
      clearIntervals: update.clearIntervals || null,
      clearTimeouts: update.clearTimeouts || null,
      cancelAnimationFrames: update.cancelAnimationFrames || null
    };
  }

  function buildLegacyCompletionSummary(plan, xpAwarded) {
    return {
      sessionId: plan ? plan.id : null,
      flow: plan ? plan.flow : null,
      date: plan ? plan.generatedDate : bridgeRead("practicePlanDate", null),
      focus: plan ? plan.focus : bridgeRead("practicePlanFocus", ""),
      itemCount: plan && Array.isArray(plan.segments) ? plan.segments.length : (bridgeRead("practicePlan", null) ? bridgeRead(["practicePlan","items"], []).length : 0),
      durationSec: 0,
      xpAwarded: xpAwarded || 0,
      completedAt: Date.now()
    };
  }

  function buildLegacyItemResultSummary(result) {
    if (!result) return null;
    return {
      practiceResult: clone(result),
      weakSpotUpdate: buildWeakSpotUpdate(result),
      adaptiveUpdate: result.exerciseId ? {
        exerciseId: result.exerciseId,
        accuracy: result.accuracy,
        ts: Date.now()
      } : null
    };
  }

  function applyItemResultSummary(summary) {
    if (!summary) return;

    if (summary.weakSpotUpdate) applyWeakSpotUpdate(summary.weakSpotUpdate);

    if (summary.adaptiveUpdate) applyAdaptiveUpdate(summary.adaptiveUpdate);

    if (summary.practiceResult) {
      bridgeEnsureArray("practiceHistory").push(clone(summary.practiceResult));
    }
  }

  function buildWeakSpotUpdate(result) {
    var update = {};
    if (result.transitions) update.transitions = clone(result.transitions);
    if (result.chords) update.chords = clone(result.chords);
    if (result.rhythm) update.rhythm = clone(result.rhythm);
    if (Array.isArray(result.phrases)) update.phrases = clone(result.phrases);
    return hasOwnKeys(update) ? update : null;
  }

  function applyWeakSpotUpdate(update) {
    if (!update) return;
    var weakSpots = bridgeEnsureObject("weakSpots");
    if (!weakSpots.transitions) weakSpots.transitions = {};
    if (!weakSpots.chords) weakSpots.chords = {};
    if (!weakSpots.rhythm) weakSpots.rhythm = {};
    if (!weakSpots.phrases) weakSpots.phrases = {};

    if (update.transitions) {
      for (var transitionKey in update.transitions) {
        updateWeakMetric(weakSpots.transitions, transitionKey, update.transitions[transitionKey]);
      }
    }
    if (update.chords) {
      for (var chordKey in update.chords) {
        updateWeakMetric(weakSpots.chords, chordKey, update.chords[chordKey]);
      }
    }
    if (update.rhythm) {
      for (var rhythmKey in update.rhythm) {
        updateWeakMetric(weakSpots.rhythm, rhythmKey, update.rhythm[rhythmKey]);
      }
    }
    if (Array.isArray(update.phrases)) {
      for (var i = 0; i < update.phrases.length; i++) {
        updateWeakMetric(weakSpots.phrases, update.phrases[i].id, update.phrases[i].accuracy);
      }
    }
  }

  function applyAdaptiveUpdate(update) {
    if (!update || !update.exerciseId) return null;
    var adaptiveState = bridgeEnsureObject("adaptiveState");
    adaptiveState[update.exerciseId] = {
      accuracy: update.accuracy,
      ts: update.ts || Date.now()
    };
    return adaptiveState[update.exerciseId];
  }

  function updateWeakMetric(bucket, key, accuracy) {
    if (!bucket[key]) {
      bucket[key] = { accuracy: accuracy, attempts: 1 };
    } else {
      var prev = bucket[key];
      prev.accuracy = (prev.accuracy * prev.attempts + accuracy) / (prev.attempts + 1);
      prev.attempts++;
    }
  }

  function hasOwnKeys(value) {
    for (var key in value) return true;
    return false;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  var stateBridgeApi = {
    syncPlanToState: syncPlanToState,
    syncDailyPracticePlanToState: syncDailyPracticePlanToState,
    syncGuidedSessionToState: syncGuidedSessionToState,
    syncPerformanceSongToState: syncPerformanceSongToState,
    applySessionStatePatch: applySessionStatePatch,
    applyLegacyReward: applyLegacyReward,
    applyLegacySessionOutcome: applyLegacySessionOutcome,
    applyLegacyActivityCompletion: applyLegacyActivityCompletion,
    applyLegacyActivityRuntime: applyLegacyActivityRuntime,
    applyPracticeSessionRecord: applyPracticeSessionRecord,
    applyWeakSpotUpdate: applyWeakSpotUpdate,
    applyAdaptiveUpdate: applyAdaptiveUpdate,
    buildLegacyCompletionSummary: buildLegacyCompletionSummary,
    buildLegacyItemResultSummary: buildLegacyItemResultSummary,
    applyItemResultSummary: applyItemResultSummary,
    completePlanItem: completePlanItem,
    finalizePlan: finalizePlan
  };

  window.SparkStateBridge = stateBridgeApi;
})();
