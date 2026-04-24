(function() {
  function getPracticeActionCore() {
    return window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  }

  function handlePracticeAction(a, v) {
    if (a === "practiceStartItem" && typeof startPracticeItem === "function") {
      startPracticeItem(v);
      return true;
    }

    if (a === "selLevel" && parseInt(v, 10) <= S.level) {
      S.selectedLevel = parseInt(v, 10);
      render();
      return true;
    }

    if (a === "toggleTimer") {
      S.timerActive = !S.timerActive;
      syncLegacyPracticeRuntimeRequest(S.timerActive ? "resume" : "pause", {
        remainingSec: S.timer,
        timerActive: S.timerActive,
        mode: S.lastChordName ? "chord" : "quickStart",
        chordName: S.currentChord ? S.currentChord.name : null,
        durationSec: 120
      });
      if (S.timerActive) T.session = setTimeout(tickS, 1000);
      else clearTimeout(T.session);
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
      clearTimeout(T.session);
      if (S.metronomeOn) stopMetronome();
      if (S.chordDetectOn) stopChordDetect();
      if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
        SparkProgressBridge.applyLegacyActivityRuntime({
          setFields: { timerActive: true, timer: 0 }
        });
      } else {
        S.timerActive = true;
        S.timer = 0;
      }
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
      if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
        SparkProgressBridge.applyLegacyActivityRuntime({
          setFields: { dailyTimer: durationSec, dailyComplete: false, screen: SCR.DAILY }
        });
      } else {
        S.dailyTimer = durationSec;
        S.dailyComplete = false;
        S.screen = SCR.DAILY;
      }
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
      clearTimeout(T.daily);
      snd("complete");
      xp = (S.dailyChallenge && S.dailyChallenge.xp) || 40;
      completeLegacyDailyChallengeRequest({
        challengeId: S.dailyChallenge ? S.dailyChallenge.id : null,
        durationSec: S.dailyChallenge && S.dailyChallenge.id === "hold" ? 30 : S.dailyChallenge && S.dailyChallenge.id === "marathon" ? 180 : 60
      });
      if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityCompletion === "function") {
        SparkProgressBridge.applyLegacyActivityCompletion({
          xpDelta: xp,
          setFlags: { dailyComplete: true },
          incrementFields: { dailyDone: 1 },
          history: { type: "daily", detail: S.dailyChallenge ? S.dailyChallenge.title : "Challenge", xp: xp },
          checkBadges: true
        });
      } else {
        S.dailyComplete = true;
        S.dailyDone++;
        if (window.SparkProgressBridge) SparkProgressBridge.applyLegacyReward({ xpDelta: xp });
        else S.xp += xp;
        logHistory("daily", S.dailyChallenge ? S.dailyChallenge.title : "Challenge", xp);
        checkBadges();
        saveState();
      }
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
      if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
        SparkProgressBridge.applyLegacyActivityRuntime({
          setFields: { earTrainAns: v },
          incrementFields: { earTrainTotal: 1 }
        });
      } else {
        S.earTrainAns = v;
        S.earTrainTotal++;
      }
      if (earTrainOk) {
        snd("correct");
        if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityCompletion === "function") {
          SparkProgressBridge.applyLegacyActivityCompletion({
            xpDelta: 15,
            incrementFields: { earTrainScore: 1, earTrainStreak: 1 },
            history: { type: "ear", detail: S.earTrainQ, xp: 15 },
            checkBadges: true
          });
        } else {
          S.earTrainScore++;
          S.earTrainStreak++;
          if (window.SparkProgressBridge) SparkProgressBridge.applyLegacyReward({ xpDelta: 15 });
          else S.xp += 15;
          logHistory("ear", S.earTrainQ, 15);
          checkBadges();
          saveState();
        }
      } else {
        snd("wrong");
        if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
          SparkProgressBridge.applyLegacyActivityRuntime({
            setFields: { earTrainStreak: 0 }
          });
        } else {
          S.earTrainStreak = 0;
        }
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
