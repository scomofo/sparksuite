(function() {
  function syncPlanToState(plan) {
    if (!plan) return null;
    S.activeSessionPlanId = plan.id;
    if (plan.flow === SparkSessionTypes.FLOW_DAILY_PRACTICE) return syncDailyPracticePlanToState(plan);
    if (plan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION) return syncGuidedSessionToState(plan);
    if (plan.flow === SparkSessionTypes.FLOW_PERFORMANCE_SONG) return syncPerformanceSongToState(plan);
    return null;
  }

  function syncDailyPracticePlanToState(plan) {
    var legacyPlan = plan ? plan.toLegacyPracticePlan() : null;
    S.practicePlan = legacyPlan;
    S.practicePlanDate = legacyPlan ? legacyPlan.generatedDate : null;
    S.practicePlanFocus = legacyPlan ? legacyPlan.focus : "";
    S.practicePlanComplete = legacyPlan ? legacyPlan.completedItems >= legacyPlan.totalItems : false;
    S.practicePlanInstrument = plan && plan.instrumentType ? plan.instrumentType : (plan && plan.instrumentId ? plan.instrumentId : null);
    return legacyPlan;
  }

  function syncGuidedSessionToState(plan) {
    var guidedPlan = plan && plan.context ? plan.context.guidedPlan : null;
    if (!guidedPlan) return null;
    S.guidedPlan = guidedPlan;
    S.guidedSession = plan.context.guidedSession || guidedPlan.num || S.guidedSession || 1;
    S.guidedStep = "spark";
    S.newMovePhase = null;
    S.guidedPaused = false;
    return guidedPlan;
  }

  function syncPerformanceSongToState(plan) {
    var performanceSong = plan && plan.context ? plan.context.performanceSong : null;
    if (!performanceSong) return null;
    S.performSongData = performanceSong.songData || null;
    S.performSongId = performanceSong.songId || "";
    S.performArrangementType = performanceSong.arrangementType || "chords";
    if (performanceSong.difficultyId) S.performDifficulty = performanceSong.difficultyId;
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
    S.practicePlanComplete = true;
    var completionSummary = summary.completionSummary || buildLegacyCompletionSummary(plan, summary.xpAwarded);
    if (!Array.isArray(S.practicePlanHistory)) S.practicePlanHistory = [];
    S.practicePlanHistory.push({
      date: completionSummary.date,
      focus: completionSummary.focus,
      itemCount: completionSummary.itemCount,
      completedAt: completionSummary.completedAt,
      sessionId: completionSummary.sessionId,
      flow: completionSummary.flow,
      durationSec: completionSummary.durationSec || 0,
      skipped: completionSummary.skipped === true
    });
    if (S.practicePlanHistory.length > 30) S.practicePlanHistory.shift();

    if (summary.xpAwarded) {
      S.xp += summary.xpAwarded;
    }

    if (typeof saveState === "function") saveState();
  }

  function applySessionStatePatch(patch) {
    patch = patch || {};

    if (patch.guided) {
      if (!Array.isArray(S.completedGuidedSessions)) S.completedGuidedSessions = [];
      var completedSessionNums = Array.isArray(patch.guided.completedSessionNums) ? patch.guided.completedSessionNums : [];
      var guidedInstrumentKey = patch.guided.instrumentKey || null;
      if (guidedInstrumentKey) {
        if (!S.completedGuidedSessionsByInstrument || typeof S.completedGuidedSessionsByInstrument !== "object") S.completedGuidedSessionsByInstrument = {};
        if (!Array.isArray(S.completedGuidedSessionsByInstrument[guidedInstrumentKey])) S.completedGuidedSessionsByInstrument[guidedInstrumentKey] = [];
      }
      for (var i = 0; i < completedSessionNums.length; i++) {
        if (S.completedGuidedSessions.indexOf(completedSessionNums[i]) < 0) {
          S.completedGuidedSessions.push(completedSessionNums[i]);
        }
        if (guidedInstrumentKey) {
          if (S.completedGuidedSessionsByInstrument[guidedInstrumentKey].indexOf(completedSessionNums[i]) < 0) {
            S.completedGuidedSessionsByInstrument[guidedInstrumentKey].push(completedSessionNums[i]);
          }
        }
      }

      var chordProgress = patch.guided.chordProgress || {};
      if (typeof SparkChordProgress !== "undefined") {
        for (var chordName in chordProgress) {
          if (!Object.prototype.hasOwnProperty.call(chordProgress, chordName)) continue;
          SparkChordProgress.add(chordName, chordProgress[chordName]);
        }
      } else {
        if (!S.chordProgress || typeof S.chordProgress !== "object") S.chordProgress = {};
        for (var cn in chordProgress) {
          S.chordProgress[cn] = Math.min((S.chordProgress[cn] || 0) + chordProgress[cn], 100);
        }
      }

      if (patch.guided.nextGuidedSession != null) S.guidedSession = patch.guided.nextGuidedSession;
    }

    if (patch.mastery && patch.mastery.rhythm) {
      if (typeof SparkMastery !== "undefined") {
        for (var skillId in patch.mastery.rhythm) {
          if (!Object.prototype.hasOwnProperty.call(patch.mastery.rhythm, skillId)) continue;
          var prev = SparkMastery.get("rhythm", skillId) || 0;
          SparkMastery.set("rhythm", skillId, Math.max(0, Math.min(100, prev + patch.mastery.rhythm[skillId])));
        }
      } else {
        if (!S.mastery || typeof S.mastery !== "object") S.mastery = {};
        if (!S.mastery.rhythm || typeof S.mastery.rhythm !== "object") S.mastery.rhythm = {};
        for (var sid in patch.mastery.rhythm) {
          var prevLegacy = S.mastery.rhythm[sid] || 0;
          S.mastery.rhythm[sid] = Math.max(0, Math.min(100, prevLegacy + patch.mastery.rhythm[sid]));
        }
      }
    }

    if (patch.weakSpots) {
      if (!S.weakSpots || typeof S.weakSpots !== "object") S.weakSpots = {};
      for (var weakSpotKey in patch.weakSpots) {
        S.weakSpots[weakSpotKey] = Array.isArray(patch.weakSpots[weakSpotKey])
          ? patch.weakSpots[weakSpotKey].slice()
          : patch.weakSpots[weakSpotKey];
      }
    }

    // Instrument-agnostic merge: any per-instrument skill-progress patch key
    // (declared by the instrument adapter's skillProgress.stateKey capability,
    // e.g. bassSkillProgress, ukuleleSkillProgress) mirrors into the
    // same-named legacy S.* structure.
    for (var skillPatchKey in patch) {
      if (!Object.prototype.hasOwnProperty.call(patch, skillPatchKey)) continue;
      if (!/SkillProgress$/.test(skillPatchKey) || !patch[skillPatchKey]) continue;
      if (!S[skillPatchKey] || typeof S[skillPatchKey] !== "object") S[skillPatchKey] = {};
      mergeInstrumentSkillProgress(S[skillPatchKey], patch[skillPatchKey]);
    }

    if (patch.xpToast) S.xpToast = patch.xpToast;
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
      if (typeof SparkInstrumentProgress !== "undefined") {
        SparkInstrumentProgress.addXp(xpDelta);
      } else {
        S.xp = (S.xp || 0) + xpDelta;
      }
    }
    if (reward.toastAmount) {
      S.xpToast = {
        amount: reward.toastAmount,
        time: reward.time || Date.now()
      };
      if (reward.jackpot) S.xpToast.jackpot = true;
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

    if (!Array.isArray(S.practiceHistory)) S.practiceHistory = [];
    S.practiceHistory.push(record);

    var durationMin = record.durationMin || 0;
    if (durationMin) {
      S.totalPracticeMinutes = (S.totalPracticeMinutes || 0) + durationMin;
      S.todayPracticeMinutes = (S.todayPracticeMinutes || 0) + durationMin;
    }

    var today = new Date().toISOString().slice(0, 10);
    if (S.lastPracticeDate !== today) {
      var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (S.lastPracticeDate === yesterday) {
        S.practiceStreak = (S.practiceStreak || 0) + 1;
      } else {
        S.practiceStreak = 1;
      }
      S.lastPracticeDate = today;
    }

    return record;
  }

  function applyLegacySessionOutcome(update) {
    update = update || {};

    if (update.streak) {
      if (typeof SparkInstrumentProgress !== "undefined" && update.streak.increment) {
        SparkInstrumentProgress.updateStreak(update.streak.lastSessionDate);
      } else if (update.streak.increment) {
        S.streak = (S.streak || 0) + update.streak.increment;
      }
      if (update.streak.lastSessionDate) S.lastSessionDate = update.streak.lastSessionDate;
    }

    if (update.sessionsDelta) {
      if (typeof SparkInstrumentProgress !== "undefined") {
        for (var _bs = 0; _bs < update.sessionsDelta; _bs++) {
          SparkInstrumentProgress.completeSession("legacy_session");
        }
      } else {
        S.sessions = (S.sessions || 0) + update.sessionsDelta;
      }
    }

    if (typeof update.xpDelta === "number" || update.toastAmount || update.jackpot) {
      applyLegacyReward({
        xpDelta: update.xpDelta || 0,
        toastAmount: update.toastAmount || 0,
        jackpot: !!update.jackpot
      });
    }

    if (update.chordProgress) {
      if (typeof SparkChordProgress !== "undefined") {
        for (var cpName in update.chordProgress) {
          if (!Object.prototype.hasOwnProperty.call(update.chordProgress, cpName)) continue;
          SparkChordProgress.add(cpName, update.chordProgress[cpName]);
        }
      } else {
        if (!S.chordProgress || typeof S.chordProgress !== "object") S.chordProgress = {};
        for (var chordName in update.chordProgress) {
          S.chordProgress[chordName] = Math.min((S.chordProgress[chordName] || 0) + update.chordProgress[chordName], 100);
        }
      }
    }

    if (typeof update.level === "number") {
      if (typeof SparkInstrumentProgress !== "undefined") {
        SparkInstrumentProgress.setLevel(update.level);
      } else {
        S.level = update.level;
      }
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
        S[flagKey] = update.setFlags[flagKey];
      }
    }

    if (update.incrementFields) {
      for (var incrementKey in update.incrementFields) {
        S[incrementKey] = (S[incrementKey] || 0) + update.incrementFields[incrementKey];
      }
    }

    if (update.maxFields) {
      for (var maxKey in update.maxFields) {
        S[maxKey] = Math.max(S[maxKey] || 0, update.maxFields[maxKey]);
      }
    }

    if (update.resultFields) {
      for (var resultKey in update.resultFields) {
        S[resultKey] = clone(update.resultFields[resultKey]);
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
        S[fieldKey] = update.setFields[fieldKey];
      }
    }

    if (update.incrementFields) {
      for (var incrementKey in update.incrementFields) {
        S[incrementKey] = (S[incrementKey] || 0) + update.incrementFields[incrementKey];
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
      date: plan ? plan.generatedDate : S.practicePlanDate,
      focus: plan ? plan.focus : S.practicePlanFocus,
      itemCount: plan && Array.isArray(plan.segments) ? plan.segments.length : (S.practicePlan ? S.practicePlan.items.length : 0),
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
      if (!Array.isArray(S.practiceHistory)) S.practiceHistory = [];
      S.practiceHistory.push(clone(summary.practiceResult));
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
    if (!S.weakSpots || typeof S.weakSpots !== "object") S.weakSpots = {};
    if (!S.weakSpots.transitions) S.weakSpots.transitions = {};
    if (!S.weakSpots.chords) S.weakSpots.chords = {};
    if (!S.weakSpots.rhythm) S.weakSpots.rhythm = {};
    if (!S.weakSpots.phrases) S.weakSpots.phrases = {};

    if (update.transitions) {
      for (var transitionKey in update.transitions) {
        updateWeakMetric(S.weakSpots.transitions, transitionKey, update.transitions[transitionKey]);
      }
    }
    if (update.chords) {
      for (var chordKey in update.chords) {
        updateWeakMetric(S.weakSpots.chords, chordKey, update.chords[chordKey]);
      }
    }
    if (update.rhythm) {
      for (var rhythmKey in update.rhythm) {
        updateWeakMetric(S.weakSpots.rhythm, rhythmKey, update.rhythm[rhythmKey]);
      }
    }
    if (Array.isArray(update.phrases)) {
      for (var i = 0; i < update.phrases.length; i++) {
        updateWeakMetric(S.weakSpots.phrases, update.phrases[i].id, update.phrases[i].accuracy);
      }
    }
  }

  function applyAdaptiveUpdate(update) {
    if (!update || !update.exerciseId) return null;
    if (!S.adaptiveState || typeof S.adaptiveState !== "object") S.adaptiveState = {};
    S.adaptiveState[update.exerciseId] = {
      accuracy: update.accuracy,
      ts: update.ts || Date.now()
    };
    return S.adaptiveState[update.exerciseId];
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

  window.SparkProgressBridge = {
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
})();
