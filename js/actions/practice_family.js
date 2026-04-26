(function() {
  function getPracticeActionCore() {
    return window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  }

  function applyPracticeFamilyRuntimeUpdate(update, fallback) {
    if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
      SparkProgressBridge.applyLegacyActivityRuntime(update || {});
      return true;
    }
    if (typeof fallback === "function") fallback();
    return false;
  }

  function applyPracticeFamilyCompletionUpdate(update, fallback) {
    if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityCompletion === "function") {
      SparkProgressBridge.applyLegacyActivityCompletion(update || {});
      return true;
    }
    if (typeof fallback === "function") fallback();
    return false;
  }

  function getPracticeActionRuntime() {
    return window.SparkSessionRuntime || (typeof SparkSessionRuntime !== "undefined" ? SparkSessionRuntime : null);
  }

  function clearPracticeFamilyTimeout(timeoutKey, fallback) {
    return applyPracticeFamilyRuntimeUpdate({
      clearTimeouts: timeoutKey ? [timeoutKey] : []
    }, fallback);
  }

  function setPracticeFamilyTimerActive(nextTimerActive, fallback, options) {
    var update = {
      setFields: { timerActive: !!nextTimerActive }
    };
    var opts = options || {};
    if (opts.resetTimer === true) update.setFields.timer = 0;
    if (opts.clearTimeoutKey) update.clearTimeouts = [opts.clearTimeoutKey];
    return applyPracticeFamilyRuntimeUpdate(update, fallback);
  }

  function syncActivePracticeRuntime(options) {
    var core = getPracticeActionCore();
    var runtime = getPracticeActionRuntime();
    var view = core && typeof core.getActiveSessionView === "function"
      ? core.getActiveSessionView()
      : null;
    var runtimeState = view && view.runtimeState ? view.runtimeState : null;
    options = options || {};

    if (core && typeof core.syncSessionRuntime === "function") {
      return core.syncSessionRuntime({
        segmentId: runtimeState && runtimeState.activeSegmentId ? runtimeState.activeSegmentId : null,
        status: runtimeState && runtimeState.transport ? runtimeState.transport.status : "ready",
        positionMs: runtimeState && runtimeState.transport ? runtimeState.transport.positionMs : 0,
        autoAdvance: !!options.autoAdvance,
        scheduleTick: options.scheduleTick !== false,
        syncState: false
      });
    }

    if (!view || !view.plan || view.plan.flow !== "daily_practice" || !runtime || typeof runtime.attachSession !== "function") {
      return false;
    }

    runtime.attachSession(view.plan, {
      segmentId: runtimeState && runtimeState.activeSegmentId ? runtimeState.activeSegmentId : null,
      status: runtimeState && runtimeState.transport ? runtimeState.transport.status : "ready",
      positionMs: runtimeState && runtimeState.transport ? runtimeState.transport.positionMs : 0,
      autoAdvance: !!options.autoAdvance,
      scheduleTick: options.scheduleTick !== false,
      syncState: false
    });
    return true;
  }

  function startRuntimePracticeItem(itemId) {
    var core = getPracticeActionCore();
    var runtime = getPracticeActionRuntime();
    var view = core && typeof core.getActiveSessionView === "function"
      ? core.getActiveSessionView()
      : null;
    var plan = view && view.plan ? view.plan : null;
    var segments = plan && Array.isArray(plan.segments) ? plan.segments : [];
    var hasSegment = false;
    var i;

    if (!itemId || !core || !runtime || !plan || plan.flow !== "daily_practice" || typeof runtime.runSegmentById !== "function") {
      return false;
    }

    for (i = 0; i < segments.length; i++) {
      if (segments[i] && segments[i].id === itemId) {
        hasSegment = true;
        break;
      }
    }
    if (!hasSegment) return false;

    if (typeof core.syncSessionRuntime === "function") {
      core.syncSessionRuntime({
        segmentId: itemId,
        status: "ready",
        positionMs: 0,
        autoAdvance: true,
        scheduleTick: false,
        syncState: false
      });
    }

    return runtime.runSegmentById(itemId, {
      autoAdvance: true
    }) !== false;
  }

  function handlePracticeAction(a, v) {
    if (a === "practiceStartItem") {
      if (startRuntimePracticeItem(v)) return true;
      if (typeof startPracticeItem === "function") {
        startPracticeItem(v);
        return true;
      }
      return true;
    }

    if (a === "sessionPauseBlock") {
      var pauseRuntime = getPracticeActionRuntime();
      syncActivePracticeRuntime({ autoAdvance: true, scheduleTick: false });
      if (pauseRuntime && typeof pauseRuntime.pauseActiveSegment === "function") {
        pauseRuntime.pauseActiveSegment({});
        render();
        return true;
      }
      if (pauseRuntime && typeof pauseRuntime.syncSegmentTransport === "function") {
        pauseRuntime.syncSegmentTransport("pause", {});
        render();
        return true;
      }
      return false;
    }

    if (a === "sessionResumeBlock") {
      var resumeRuntime = getPracticeActionRuntime();
      syncActivePracticeRuntime({ autoAdvance: true, scheduleTick: false });
      if (resumeRuntime && typeof resumeRuntime.resumeActiveSegment === "function") {
        resumeRuntime.resumeActiveSegment({ scheduleTick: true });
        render();
        return true;
      }
      if (resumeRuntime && typeof resumeRuntime.syncSegmentTransport === "function") {
        resumeRuntime.syncSegmentTransport("resume", { scheduleTick: true });
        render();
        return true;
      }
      return false;
    }

    if (a === "sessionSkipBlock") {
      var skipRuntime = getPracticeActionRuntime();
      syncActivePracticeRuntime({ autoAdvance: true, scheduleTick: false });
      if (skipRuntime && typeof skipRuntime.skipActiveSegment === "function") {
        skipRuntime.skipActiveSegment({ autoAdvance: true });
        render();
        return true;
      }
      return false;
    }

    if (a === "selLevel" && parseInt(v, 10) <= S.level) {
      S.selectedLevel = parseInt(v, 10);
      render();
      return true;
    }

    if (a === "toggleTimer") {
      var nextTimerActive = !S.timerActive;
      setPracticeFamilyTimerActive(nextTimerActive, function() {
        S.timerActive = nextTimerActive;
      }, {
        clearTimeoutKey: nextTimerActive ? null : "session"
      });
      syncLegacyPracticeRuntimeRequest(nextTimerActive ? "resume" : "pause", {
        remainingSec: S.timer,
        timerActive: nextTimerActive,
        mode: S.lastChordName ? "chord" : "quickStart",
        chordName: S.currentChord ? S.currentChord.name : null,
        durationSec: 120
      });
      if (nextTimerActive) T.session = setTimeout(tickS, 1000);
      render();
      return true;
    }

    if (a === "completeSessionHome") {
      var core = getPracticeActionCore();
      if (core && typeof core.returnFromLegacyPracticeFamily === "function") {
        core.returnFromLegacyPracticeFamily({ activeTab: "practice" });
      }
      act("tab", "practice");
      return true;
    }

    if (a === "drillDoneHome") {
      var core = getPracticeActionCore();
      if (core && typeof core.returnFromLegacyPracticeFamily === "function") {
        core.returnFromLegacyPracticeFamily({ activeTab: "practice" });
      }
      act("tab", "drill");
      return true;
    }

    if (a === "doneSession") {
      clearPracticeFamilyTimeout("session", function() {
        clearTimeout(T.session);
        T.session = null;
      });
      if (S.metronomeOn) stopMetronome();
      if (S.chordDetectOn) stopChordDetect();
      setPracticeFamilyTimerActive(true, function() {
        S.timerActive = true;
        S.timer = 0;
      }, {
        resetTimer: true
      });
      syncLegacyPracticeRuntimeRequest("set_remaining", {
        remainingSec: 0,
        timerActive: true,
        mode: S.lastChordName ? "chord" : "quickStart",
        chordName: S.currentChord ? S.currentChord.name : null,
        durationSec: 120
      });
      tickS();
      return true;
    }

    if (a === "startDaily" && S.dailyChallenge) {
      var durationSec = S.dailyChallenge.id === "hold" ? 30 : S.dailyChallenge.id === "marathon" ? 180 : 60;
      applyPracticeFamilyRuntimeUpdate({
        setFields: { dailyTimer: durationSec, dailyComplete: false, screen: SCR.DAILY },
        clearTimeouts: ["daily"]
      }, function() {
        clearTimeout(T.daily);
        T.daily = null;
        S.dailyTimer = durationSec;
        S.dailyComplete = false;
        S.screen = SCR.DAILY;
      });
      openLegacyDailyChallengeRequest({
        challengeId: S.dailyChallenge.id,
        durationSec: durationSec
      });
      snd("start");
      render();
      T.daily = setTimeout(tickDy, 1000);
      return true;
    }

    if (a === "completeDaily") {
      var xp;
      clearPracticeFamilyTimeout("daily", function() {
        clearTimeout(T.daily);
        T.daily = null;
      });
      snd("complete");
      xp = (S.dailyChallenge && S.dailyChallenge.xp) || 40;
      completeLegacyDailyChallengeRequest({
        challengeId: S.dailyChallenge ? S.dailyChallenge.id : null,
        durationSec: S.dailyChallenge && S.dailyChallenge.id === "hold" ? 30 : S.dailyChallenge && S.dailyChallenge.id === "marathon" ? 180 : 60
      });
      applyPracticeFamilyCompletionUpdate({
        xpDelta: xp,
        setFlags: { dailyComplete: true },
        incrementFields: { dailyDone: 1 },
        history: { type: "daily", detail: S.dailyChallenge ? S.dailyChallenge.title : "Challenge", xp: xp },
        checkBadges: true
      }, function() {
        S.dailyComplete = true;
        S.dailyDone++;
        if (window.SparkProgressBridge) SparkProgressBridge.applyLegacyReward({ xpDelta: xp });
        else S.xp += xp;
        logHistory("daily", S.dailyChallenge ? S.dailyChallenge.title : "Challenge", xp);
        checkBadges();
        saveState();
      });
      trigC();
      render();
      return true;
    }

    if (a === "dailyDoneHome") {
      returnFromLegacyDailyChallengeRequest({ activeTab: "daily" });
      act("tab", "daily");
      return true;
    }

    if (a === "replayEarTrain" && S.earTrainQ) {
      strumChord(S.earTrainQ);
      return true;
    }

    if (a === "answerEarTrain" && S.earTrainAns === null) {
      var earTrainOk = v === S.earTrainQ;
      var nextEarTrainTotal = (S.earTrainTotal || 0) + 1;
      var nextEarTrainScore = (S.earTrainScore || 0) + (earTrainOk ? 1 : 0);
      var nextEarTrainStreak = earTrainOk ? ((S.earTrainStreak || 0) + 1) : 0;
      var core = getPracticeActionCore();
      if (core && typeof core.syncLegacyEarTrainingRuntimeState === "function") {
        core.syncLegacyEarTrainingRuntimeState({
          question: S.earTrainQ,
          options: S.earTrainOpts,
          answer: v,
          score: nextEarTrainScore,
          total: nextEarTrainTotal,
          streak: nextEarTrainStreak
        });
      }
      applyPracticeFamilyRuntimeUpdate({
        setFields: { earTrainAns: v },
        incrementFields: { earTrainTotal: 1 }
      }, function() {
        S.earTrainAns = v;
        S.earTrainTotal++;
      });
      if (earTrainOk) {
        snd("correct");
        applyPracticeFamilyCompletionUpdate({
          xpDelta: 15,
          incrementFields: { earTrainScore: 1, earTrainStreak: 1 },
          history: { type: "ear", detail: S.earTrainQ, xp: 15 },
          checkBadges: true
        }, function() {
          S.earTrainScore++;
          S.earTrainStreak++;
          if (window.SparkProgressBridge) SparkProgressBridge.applyLegacyReward({ xpDelta: 15 });
          else S.xp += 15;
          logHistory("ear", S.earTrainQ, 15);
          checkBadges();
          saveState();
        });
      } else {
        snd("wrong");
        applyPracticeFamilyRuntimeUpdate({
          setFields: { earTrainStreak: 0 }
        }, function() {
          S.earTrainStreak = 0;
        });
      }
      render();
      setTimeout(function() { act("startEarTrain"); }, 1500);
      return true;
    }

    if (a === "previewChord") {
      strumChord(v);
      return true;
    }

    if (a === "selectVoicing") {
      _prevChordKey = S.currentChord ? S.currentChord.name + "_v" + S.selectedVoicing : "";
      S.selectedVoicing = parseInt(v, 10);
      render();
      return true;
    }

    return false;
  }

  window.registerSparkActionFamily("practice", handlePracticeAction);
})();
