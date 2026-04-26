(function() {
  var _showroomTapTempoTimes = [];

  function showMicroToast(message, icon) {
    S.microToast = { msg: message, icon: icon || "&#9889;", time: Date.now() };
  }

  function setMetronomeBpmValue(bpm) {
    if (bpm < 40 || bpm > 200) return false;
    setLegacyFields({ metronomeBpm: bpm }, false);
    syncMetronomeRuntimeRequest({
      active: !!S.metronomeOn,
      bpm: bpm,
      beat: S._metroBeat,
      beatsPerBar: S._metroBeats
    });
    if (S.metronomeOn) {
      clearTimeout(T.metro);
      T.metro = null;
      if (typeof _metroNextTime === "number" && audioCtx) _metroNextTime = audioCtx.currentTime;
      _metroSchedule();
    }
    render();
    return true;
  }

  function setLegacyFields(setFields, save) {
    if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
      SparkProgressBridge.applyLegacyActivityRuntime({ setFields: setFields, save: save });
    } else {
      var key;
      for (key in setFields) {
        if (Object.prototype.hasOwnProperty.call(setFields, key)) S[key] = setFields[key];
      }
    }
  }

  function openScreen(screen) {
    setLegacyFields({ screen: screen });
  }

  function setGuidedLegacyState(setFields, save) {
    setLegacyFields(setFields || {}, save);
    if (Object.prototype.hasOwnProperty.call(setFields || {}, "guidedSession")) {
      S.guidedSession = setFields.guidedSession;
    }
    if (Object.prototype.hasOwnProperty.call(setFields || {}, "guidedStep")) {
      S.guidedStep = setFields.guidedStep;
    }
    if (Object.prototype.hasOwnProperty.call(setFields || {}, "newMovePhase")) {
      S.newMovePhase = setFields.newMovePhase;
    }
  }

  function getSparkCoreHandle() {
    return window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  }

  function getAccessibilitySettingsHandle() {
    var core = getSparkCoreHandle();
    if (core && typeof core.getAccessibilitySettings === "function") {
      return core.getAccessibilitySettings();
    }
    return (S.settings && S.settings.accessibility) || {};
  }

  function persistAccessibilitySettings(patch) {
    var core = getSparkCoreHandle();
    var current = getAccessibilitySettingsHandle();
    var next = typeof SparkNormalizeAccessibilitySettings === "function"
      ? SparkNormalizeAccessibilitySettings(Object.assign({}, current, patch || {}))
      : Object.assign({}, current, patch || {});
    if (!S.settings) S.settings = {};
    S.settings.accessibility = next;
    if (core && typeof core.syncAccessibilitySettings === "function") {
      core.syncAccessibilitySettings(next);
    }
    if (core && core.storage && typeof core.storage.updateUserProfile === "function") {
      core.storage.updateUserProfile("default", {
        settings: {
          accessibility: next
        }
      });
    }
    if (typeof saveState === "function") saveState();
    return next;
  }

  function getSessionRuntimeHandle() {
    return window.SparkSessionRuntime || (typeof SparkSessionRuntime !== "undefined" ? SparkSessionRuntime : null);
  }

  function syncGuidedSessionRuntime(options) {
    var core = getSparkCoreHandle();
    var runtime = getSessionRuntimeHandle();
    var view;
    var runtimeState;
    options = options || {};
    if (core && typeof core.syncSessionRuntime === "function") {
      return core.syncSessionRuntime({
        segmentId: null,
        status: undefined,
        positionMs: undefined,
        autoAdvance: !!options.autoAdvance,
        scheduleTick: options.scheduleTick !== false,
        syncState: false
      });
    }
    if (!core || !runtime || typeof runtime.attachSession !== "function" || typeof core.getActiveSessionView !== "function") {
      return false;
    }
    view = core.getActiveSessionView();
    runtimeState = view && view.runtimeState ? view.runtimeState : null;
    if (!view || !view.plan || view.plan.flow !== "guided_session") return false;
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

  function isGuidedSessionActive() {
    var core = getSparkCoreHandle();
    var view = core && typeof core.getActiveSessionView === "function"
      ? core.getActiveSessionView()
      : null;
    return !!(view &&
      view.plan &&
      view.plan.flow === "guided_session" &&
      view.runtimeState &&
      view.runtimeState.activeScreen === "guided_session");
  }

  function getActiveGuidedSessionNumber() {
    var core = getSparkCoreHandle();
    var view = core && typeof core.getActiveSessionView === "function"
      ? core.getActiveSessionView()
      : null;
    var context = view && view.plan && view.plan.context ? view.plan.context : null;
    if (!view || !view.plan || view.plan.flow !== "guided_session") return null;
    if (context && context.guidedSession != null) return parseInt(context.guidedSession, 10) || null;
    if (view.plan.lesson && view.plan.lesson.num != null) return parseInt(view.plan.lesson.num, 10) || null;
    return null;
  }

  function mirrorGuidedRuntimeFields(runtimeState) {
    if (!runtimeState) return;
    S.guidedActivityId = runtimeState.guidedActivityId || null;
    S.guidedActivityKind = runtimeState.guidedActivityKind || null;
    S.guidedBlockType = runtimeState.guidedBlockType || null;
  }

  function handleSystemAction(a, v) {
    if (a === "startTuner") {
      if (!AC) {
        syncTunerRuntimeRequest({ active: false, error: "Audio not supported" });
        setLegacyFields({ tunerErr: "Audio not supported" });
        render();
        return true;
      }
      navigator.mediaDevices.getUserMedia(getAudioConstraint()).then(function(st) {
        tunerR.stream = st;
        var ctx = new AC();
        var src = ctx.createMediaStreamSource(st);
        var an = ctx.createAnalyser();
        an.fftSize = 8192;
        src.connect(an);
        tunerR.ctx = ctx;
        tunerR.analyser = an;
        syncTunerRuntimeRequest({ active: true, error: null, note: null, freq: 0, cents: 0 });
        setLegacyFields({ tunerActive: true, tunerErr: null });
        _tunerHistory = [];
        _tunerStableCount = 0;
        _tunerLastStableNote = "";
        render();
        var buf = new Float32Array(an.fftSize);
        var _tunerFrameCount = 0;

        function det() {
          _tunerFrameCount++;
          if (_tunerFrameCount % 2 === 0) {
            an.getFloatTimeDomainData(buf);
            var f = autoCorrelate(buf, ctx.sampleRate);
            var result = smoothTunerResult(f);
            if (result.note) {
              setLegacyFields({
                tunerNote: result.note,
                tunerFreq: result.freq,
                tunerCents: result.cents
              }, false);
              syncTunerRuntimeRequest({ active: true, note: result.note, freq: result.freq, cents: result.cents, error: null });
            } else if (f < 0) {
              setLegacyFields({
                tunerNote: null,
                tunerFreq: 0,
                tunerCents: 0
              }, false);
              syncTunerRuntimeRequest({ active: true, note: null, freq: 0, cents: 0, error: null });
            }
            updateTunerUI();
          }
          tunerR.anim = requestAnimationFrame(det);
        }

        det();
      }).catch(function() {
        syncTunerRuntimeRequest({ active: false, error: "Microphone access denied" });
        setLegacyFields({ tunerErr: "Microphone access denied" });
        render();
      });
      return true;
    }

    if (a === "stopTuner") {
      if (tunerR.anim) cancelAnimationFrame(tunerR.anim);
      if (tunerR.stream) tunerR.stream.getTracks().forEach(function(t) { t.stop(); });
      if (tunerR.ctx) tunerR.ctx.close();
      syncTunerRuntimeRequest({ active: false, note: null, freq: 0, cents: 0, error: null });
      setLegacyFields({ tunerActive: false, tunerNote: null, tunerFreq: 0, tunerCents: 0 });
      render();
      return true;
    }

    if (a === "toggleMetro") {
      if (S.metronomeOn) stopMetronome();
      else startMetronome();
      return true;
    }

    if (a === "metroBpm") {
      var bpm = parseInt(v, 10);
      return setMetronomeBpmValue(bpm);
    }

    if (a === "showroomTapTempo") {
      var tapNow = Date.now();
      _showroomTapTempoTimes.push(tapNow);
      if (_showroomTapTempoTimes.length > 5) _showroomTapTempoTimes.shift();
      if (_showroomTapTempoTimes.length < 2) {
        showMicroToast("Tap a few beats to set the tempo.", "&#128079;");
        render();
        return true;
      }
      var intervals = [];
      for (var i = 1; i < _showroomTapTempoTimes.length; i++) {
        intervals.push(_showroomTapTempoTimes[i] - _showroomTapTempoTimes[i - 1]);
      }
      var total = 0;
      for (var j = 0; j < intervals.length; j++) total += intervals[j];
      var derivedBpm = Math.round(60000 / Math.max(1, total / intervals.length));
      derivedBpm = Math.max(40, Math.min(200, derivedBpm));
      showMicroToast("Tempo set to " + derivedBpm + " BPM.", "&#127932;");
      return setMetronomeBpmValue(derivedBpm);
    }

    if (a === "showroomManageSubscription") {
      showMicroToast("Subscription management is coming soon.", "&#11088;");
      render();
      return true;
    }

    if (a === "showroomFocusLibrarySearch") {
      if (typeof document !== "undefined") {
        var searchInput = document.getElementById("showroom-library-search");
        if (searchInput && typeof searchInput.focus === "function") {
          searchInput.focus();
          if (typeof searchInput.select === "function") searchInput.select();
        }
      }
      return true;
    }

    if (a === "showroomLibraryCategory") {
      if (typeof window !== "undefined" && window.SparkShowroom && typeof window.SparkShowroom.setLibraryCategory === "function") {
        window.SparkShowroom.setLibraryCategory(v);
        return true;
      }
      return false;
    }

    if (a === "showroomLibraryLevel") {
      if (typeof window !== "undefined" && window.SparkShowroom && typeof window.SparkShowroom.setLibraryLevel === "function") {
        window.SparkShowroom.setLibraryLevel(v);
        return true;
      }
      return false;
    }

    if (a === "showroomOpenQuickTools") {
      showMicroToast("Quick tools are available below. More are on the way.", "&#128295;");
      render();
      return true;
    }

    if (a === "showroomOpenTrendingScores") {
      showMicroToast("Leaderboard details are coming soon. Browse the top songs below for now.", "&#127942;");
      render();
      return true;
    }

    if (a === "showroomToggleRecorder") {
      try {
        if (typeof isRecording === "function" && isRecording()) {
          if (typeof stopRecording === "function") stopRecording();
          showMicroToast("Recorder stopped.", "&#9209;");
        } else if (typeof startRecording === "function") {
          startRecording();
          showMicroToast("Recorder started.", "&#127908;");
        } else {
          showMicroToast("Recorder isn't available for this instrument yet.", "&#127908;");
        }
      } catch (err) {
        console.error("Showroom recorder toggle failed", err);
        showMicroToast("Recorder couldn't start right now.", "&#9888;");
      }
      render();
      return true;
    }

    if (a === "showroomToneGenerator") {
      showMicroToast("Tone Generator is coming soon.", "&#127911;");
      render();
      return true;
    }

    if (a === "showroomOpenSignIn") {
      showMicroToast("Sign in is coming soon.", "&#128274;");
      render();
      return true;
    }

    if (a === "toggleChordDetect") {
      if (S.chordDetectOn) stopChordDetect();
      else startChordDetect();
      return true;
    }

    if (a === "toggleDark") {
      setLegacyFields({ darkMode: !S.darkMode }, false);
      saveState();
      applyTheme();
      render();
      return true;
    }

    if (a === "setIntention") {
      setLegacyFields({ practiceIntention: v || "" }, false);
      return true;
    }

    if (a === "completeOnboarding") {
      setLegacyFields({ onboardingDone: true }, false);
      saveState();
      render();
      return true;
    }

    if (a === "openRecommendations") {
      openDashboardSectionRequest("recommendations");
      openScreen(SCR.RECOMMENDATIONS);
      render();
      return true;
    }

    if (a === "openCareer") {
      openDashboardSectionRequest("career");
      openScreen(SCR.CAREER);
      render();
      return true;
    }

    if (a === "openCareerSong") {
      var nextSong = null;
      if (typeof getCareerItem === "function") nextSong = getCareerItem("songs", v);
      if (nextSong) {
        openCareerSongSelectionRequest({
          songId: v,
          songData: nextSong,
          songTitle: nextSong.title || null,
          arrangementType: S.performArrangementType || "chords",
          difficultyId: S.performDifficulty || "normal"
        });
      }
      setLegacyFields({ currentSong: nextSong, performSongData: nextSong, performSongId: v, screen: SCR.PERFORM_SONG }, false);
      if (!window.SparkProgressBridge || typeof SparkProgressBridge.applyLegacyActivityRuntime !== "function") {
        S.currentSong = nextSong;
        S.performSongData = nextSong;
        S.performSongId = v;
      }
      render();
      return true;
    }

    if (a === "openInsights") {
      openDashboardSectionRequest("insights");
      openScreen(SCR.INSIGHTS);
      render();
      return true;
    }

    if (a === "openChallengeHub") {
      openDashboardSectionRequest("challenges");
      openScreen(SCR.CHALLENGES);
      render();
      return true;
    }

    if (a === "openHomeDash") {
      openDashboardSectionRequest("home_dash");
      openScreen(SCR.HOME_DASH);
      render();
      return true;
    }

    if (a === "openSettings") {
      openUtilityScreenRequest("settings");
      syncSettingsStateRequest({ theme: S.settings ? S.settings.theme : null });
      openScreen(SCR.SETTINGS);
      render();
      return true;
    }

    if (a === "openOnboarding") {
      if (typeof startOnboarding === "function") startOnboarding();
      return true;
    }

    if (a === "resumeOnboarding") {
      if (typeof continueOnboarding === "function") continueOnboarding();
      return true;
    }

    if (a === "onboardingSetInstrument") {
      if (typeof setOnboardingInstrument === "function") setOnboardingInstrument(v);
      render();
      return true;
    }

    if (a === "onboardingSetSkillLevel") {
      if (typeof setOnboardingSkillLevel === "function") setOnboardingSkillLevel(v);
      render();
      return true;
    }

    if (a === "onboardingToggleGoal") {
      if (typeof toggleOnboardingGoal === "function") toggleOnboardingGoal(v);
      render();
      return true;
    }

    if (a === "onboardingMidiSetupDone") {
      if (typeof markOnboardingMidiSetupDone === "function") markOnboardingMidiSetupDone();
      render();
      return true;
    }

    if (a === "onboardingCalibrationDone") {
      if (typeof markOnboardingCalibrationDone === "function") markOnboardingCalibrationDone();
      render();
      return true;
    }

    if (a === "onboardingUnlockStarterContent") {
      if (typeof applyStarterUnlocksFromOnboarding === "function") applyStarterUnlocksFromOnboarding();
      render();
      return true;
    }

    if (a === "onboardingGeneratePlan") {
      if (typeof generateInitialPracticePlanFromOnboarding === "function") generateInitialPracticePlanFromOnboarding();
      render();
      return true;
    }

    if (a === "onboardingGenerateRecommendations") {
      if (typeof generateInitialRecommendationsFromOnboarding === "function") generateInitialRecommendationsFromOnboarding();
      render();
      return true;
    }

    if (a === "onboardingFinish") {
      if (typeof finishOnboardingFlow === "function") finishOnboardingFlow();
      return true;
    }

    if (a === "onboardingBack") {
      if (typeof goToPreviousOnboardingStep === "function") goToPreviousOnboardingStep();
      render();
      return true;
    }

    if (a === "onboardingNext") {
      if (typeof goToNextOnboardingStep === "function") goToNextOnboardingStep();
      render();
      return true;
    }

    if (a === "refreshHome") {
      if (typeof generateRecommendations === "function") generateRecommendations();
      if (typeof generatePersonalInsights === "function") generatePersonalInsights();
      refreshDashboardSnapshotRequest({
        recommendations: S.recommendations || [],
        insights: S.personalInsights || null,
        challenges: S.activeChallenges || [],
        refreshedAt: Date.now()
      });
      render();
      return true;
    }

    if (a === "launchRecommendation") {
      if (typeof launchRecommendationById === "function") launchRecommendationById(v);
      return true;
    }

    if (a === "claimChallengeReward") {
      if (typeof claimChallengeReward === "function") claimChallengeReward(v);
      applyDashboardChallengeRewardRequest(v);
      render();
      return true;
    }

    if (a === "initChallenges") {
      if (typeof initializeChallengesForCurrentCycle === "function") initializeChallengesForCurrentCycle();
      initializeDashboardChallengesRequest({
        recommendations: S.recommendations || [],
        insights: S.personalInsights || null,
        challenges: S.activeChallenges || [],
        refreshedAt: Date.now()
      });
      render();
      return true;
    }

    if (a === "openPracticePlan") {
      if (isGuidedSessionActive()) {
        openScreen(SCR.GUIDED);
      } else {
        openPracticePlanScreenRequest();
        openScreen(SCR.PLAN);
      }
      render();
      return true;
    }

    if (a === "setTheme") {
      var nextSettings = Object.assign({}, S.settings || {}, { theme: v });
      setLegacyFields({ settings: nextSettings }, false);
      if (typeof applyThemeSetting === "function") applyThemeSetting();
      saveState();
      render();
      return true;
    }

    if (a === "toggleAccessibilitySetting") {
      var accessibility = getAccessibilitySettingsHandle();
      persistAccessibilitySettings((function() {
        var patch = {};
        patch[v] = !accessibility[v];
        return patch;
      })());
      render();
      return true;
    }

    if (a === "setAccessibilityNoteSize") {
      persistAccessibilitySettings({ noteSize: v });
      render();
      return true;
    }

    if (a === "songSort") {
      var nextSongSort = S.songSort === v ? S.songSort : v;
      var nextSongSortAsc = S.songSort === v ? !S.songSortAsc : true;
      setLegacyFields({ songSort: nextSongSort, songSortAsc: nextSongSortAsc }, false);
      applySongBrowserRequest("song_sort", {
        songSort: nextSongSort,
        songSortAsc: nextSongSortAsc
      });
      render();
      return true;
    }

    if (a === "songFilter") {
      var nextSongFilter = v || "";
      setLegacyFields({ songFilter: nextSongFilter }, false);
      applySongBrowserRequest("song_filter", { songFilter: nextSongFilter });
      render();
      return true;
    }

    if (a === "stemSolo") {
      var stemKey;
      for (stemKey in S.stemToggles) S.stemToggles[stemKey] = (stemKey === v);
      for (stemKey in S.stemToggles) setStemMuted(stemKey, !S.stemToggles[stemKey]);
      render();
      return true;
    }

    if (a === "stemAll") {
      var allStemKey;
      for (allStemKey in S.stemToggles) {
        S.stemToggles[allStemKey] = true;
        setStemMuted(allStemKey, false);
      }
      render();
      return true;
    }

    if (a === "guidedNext") {
      var steps = ["spark", "review", "newMove", "songSlice", "victoryLap"];
      var idx = steps.indexOf(S.guidedStep);
      var guidedCore = getSparkCoreHandle();
      var previousGuidedStep = S.guidedStep;
      if (idx < steps.length - 1) {
        S.guidedStep = steps[idx + 1];
        if (S.guidedStep === "newMove") S.newMovePhase = "watch";
        if (guidedCore && typeof guidedCore.advanceGuidedSession === "function") {
          mirrorGuidedRuntimeFields((guidedCore.advanceGuidedSession({
            guidedNewMovePhase: S.newMovePhase || null
          }) || {}).runtimeState || null);
          syncGuidedSessionRuntime({
            autoAdvance: false,
            scheduleTick: S.guidedStep !== previousGuidedStep
          });
        } else if (guidedCore && typeof guidedCore.syncGuidedRuntimeState === "function") {
          mirrorGuidedRuntimeFields(guidedCore.syncGuidedRuntimeState({
            guidedStep: S.guidedStep,
            guidedNewMovePhase: S.newMovePhase || null
          }));
        }
      }
      render();
      return true;
    }

    if (a === "guidedAdvancePhase") {
      var phases = ["watch", "shadow", "try", "refine"];
      var pi = phases.indexOf(S.newMovePhase);
      var guidedPhaseCore = getSparkCoreHandle();
      if (pi < phases.length - 1) {
        S.newMovePhase = phases[pi + 1];
        if (guidedPhaseCore && typeof guidedPhaseCore.syncGuidedRuntimeState === "function") {
          mirrorGuidedRuntimeFields(guidedPhaseCore.syncGuidedRuntimeState({
            guidedStep: S.guidedStep,
            guidedNewMovePhase: S.newMovePhase
          }));
          syncGuidedSessionRuntime({
            autoAdvance: false,
            scheduleTick: true
          });
        }
      } else {
        act("guidedNext");
        return true;
      }
      render();
      return true;
    }

    if (a === "guidedSkipBlock") {
      var guidedSkipCore = getSparkCoreHandle();
      if (guidedSkipCore && typeof guidedSkipCore.skipGuidedBlock === "function") {
        var guidedSkipResult = guidedSkipCore.skipGuidedBlock({});
        var guidedSkipState = guidedSkipResult && guidedSkipResult.runtimeState ? guidedSkipResult.runtimeState : null;
        mirrorGuidedRuntimeFields(guidedSkipState || null);
        if (guidedSkipState && guidedSkipState.guidedStep != null) {
          S.guidedStep = guidedSkipState.guidedStep;
          S.newMovePhase = guidedSkipState.guidedNewMovePhase || null;
        }
        if (guidedSkipState && guidedSkipState.activeScreen === "guided_done") {
          S.screen = SCR.GUIDED_DONE || "guided_done";
        } else {
          syncGuidedSessionRuntime({
            autoAdvance: false,
            scheduleTick: true
          });
        }
      } else if (S.guidedStep === "spark") {
        act("guidedNext");
        return true;
      } else if (S.guidedStep === "review" || S.guidedStep === "newMove") {
        S.guidedStep = "songSlice";
        S.newMovePhase = null;
      } else if (S.guidedStep === "songSlice") {
        S.guidedStep = "victoryLap";
        S.newMovePhase = null;
      } else if (S.guidedStep === "victoryLap") {
        act("guidedComplete");
        return true;
      }
      render();
      return true;
    }

    if (a === "guidedExtendBlock") {
      var guidedExtendCore = getSparkCoreHandle();
      if (guidedExtendCore && typeof guidedExtendCore.extendGuidedBlock === "function") {
        var guidedExtendResult = guidedExtendCore.extendGuidedBlock({});
        var guidedExtendState = guidedExtendResult && guidedExtendResult.runtimeState ? guidedExtendResult.runtimeState : null;
        mirrorGuidedRuntimeFields(guidedExtendState || null);
        if (guidedExtendState && guidedExtendState.guidedStep != null) {
          S.guidedStep = guidedExtendState.guidedStep;
          S.newMovePhase = guidedExtendState.guidedNewMovePhase || null;
        }
        syncGuidedSessionRuntime({
          autoAdvance: false,
          scheduleTick: true
        });
      } else if (S.guidedStep === "victoryLap" && S.guidedPlan && S.guidedPlan.blockActivities && S.guidedPlan.blockActivities.cooldown) {
        S.guidedPlan.blockActivities.cooldown.duration_sec = (parseInt(S.guidedPlan.blockActivities.cooldown.duration_sec, 10) || 0) + 300;
      }
      render();
      return true;
    }

    if (a === "guidedPauseBlock") {
      var guidedPauseRuntime = getSessionRuntimeHandle();
      var guidedPauseCore = getSparkCoreHandle();
      if (guidedPauseCore) {
        syncGuidedSessionRuntime({
          autoAdvance: false,
          scheduleTick: false
        });
      }
      if (guidedPauseRuntime && typeof guidedPauseRuntime.pauseActiveSegment === "function") {
        guidedPauseRuntime.pauseActiveSegment();
      } else if (guidedPauseRuntime && typeof guidedPauseRuntime.syncSegmentTransport === "function") {
        guidedPauseRuntime.syncSegmentTransport("pause");
      } else if (guidedPauseCore && typeof guidedPauseCore.syncGuidedRuntimeState === "function") {
        guidedPauseCore.syncGuidedRuntimeState({
          transport: { status: "paused" }
        });
      }
      render();
      return true;
    }

    if (a === "guidedResumeBlock") {
      var guidedResumeRuntime = getSessionRuntimeHandle();
      var guidedResumeCore = getSparkCoreHandle();
      if (guidedResumeCore) {
        syncGuidedSessionRuntime({
          autoAdvance: false,
          scheduleTick: false
        });
      }
      if (guidedResumeRuntime && typeof guidedResumeRuntime.resumeActiveSegment === "function") {
        guidedResumeRuntime.resumeActiveSegment();
      } else if (guidedResumeRuntime && typeof guidedResumeRuntime.syncSegmentTransport === "function") {
        guidedResumeRuntime.syncSegmentTransport("resume");
      } else if (guidedResumeCore && typeof guidedResumeCore.syncGuidedRuntimeState === "function") {
        guidedResumeCore.syncGuidedRuntimeState({
          transport: { status: "running" }
        });
      }
      render();
      return true;
    }

    if (a === "guidedConfirmStop") {
      if (typeof confirm !== "function" || confirm("End session early?")) {
        act("guidedStop");
      }
      return true;
    }

    if (a === "guidedStop") {
      clearTimeout(T.session);
      clearTimeout(T.drill);
      clearTimeout(T.daily);
      clearInterval(T.metro);
      clearInterval(T.strum);
      if (S.metronomeOn) stopMetronome();
      applyGuidedNavigationRequest("guided_home");
      setLegacyFields({ screen: SCR.HOME, tab: TAB.PRACTICE }, false);
      render();
      return true;
    }

    if (a === "guidedComplete") {
      var guidedCompleteCore = getSparkCoreHandle();
      if (guidedCompleteCore && typeof guidedCompleteCore.completeGuidedSession === "function") {
        mirrorGuidedRuntimeFields(guidedCompleteCore.completeGuidedSession({}) || null);
      }
      setLegacyFields({ screen: SCR.GUIDED_DONE || "guided_done" }, false);
      render();
      return true;
    }

    if (a === "refreshAudioInputs") {
      refreshAudioInputs();
      return true;
    }

    if (a === "testAudioInput") {
      testAudioInput(v);
      return true;
    }

    if (a === "stopAudioTest") {
      stopAudioTest();
      render();
      return true;
    }

    if (a === "selectAudioInput") {
      stopAudioTest();
      setLegacyFields({ audioInputId: v }, false);
      syncAudioInputRuntimeRequest({
        devices: S.audioInputDevices || [],
        inputId: v || null,
        testingId: "",
        testLevel: 0
      });
      saveState();
      render();
      return true;
    }

    if (a === "toggleMidi") {
      var nextMidiEnabled = !S.midiEnabled;
      var midiPatch = { midiEnabled: nextMidiEnabled };
      if (!nextMidiEnabled) {
        midiPatch.midiOutput = null;
        midiPatch.midiDevices = [];
      }
      setLegacyFields(midiPatch, false);
      if (nextMidiEnabled) initMIDI();
      syncMidiSettingsStateRequest();
      saveState();
      render();
      return true;
    }

    if (a === "selectMidiDevice") {
      selectMIDIDevice(v);
      saveState();
      render();
      return true;
    }

    if (a === "toggleFocus") {
      var nextFocusMode = !S.focusMode;
      var focusPatch = { focusMode: nextFocusMode };
      if (nextFocusMode && [TAB.PRACTICE, TAB.DRILL, TAB.DAILY, TAB.STATS, TAB.GUIDE].indexOf(S.tab) === -1) {
        focusPatch.tab = TAB.PRACTICE;
      }
      setLegacyFields(focusPatch, false);
      saveState();
      render();
      return true;
    }

    if (a === "dismissBreak") {
      setLegacyFields({ breakDismissed: true, sessionStartTime: Date.now() }, false);
      render();
      return true;
    }

    if (a === "toggleShortcuts") {
      setLegacyFields({ showShortcuts: !S.showShortcuts }, false);
      render();
      return true;
    }

    if (a === "undoReset") {
      undoReset();
      return true;
    }

    if (a === "reset") {
      if (typeof resetProgress === "function") resetProgress();
      return true;
    }

    if (a === "start_guided_session") {
      var _gsNum = parseInt(v, 10) || S.guidedSession || 1;
      var guidedStartCore = getSparkCoreHandle();
      var activeGuidedSessionNum = getActiveGuidedSessionNumber();
      var requestedGuidedSessionNum = parseInt(v, 10);
      if (guidedStartCore && isGuidedSessionActive() && (!requestedGuidedSessionNum || requestedGuidedSessionNum === activeGuidedSessionNum)) {
        mirrorGuidedRuntimeFields(guidedStartCore.getRuntimeState ? guidedStartCore.getRuntimeState() : null);
        setGuidedLegacyState({ guidedSession: activeGuidedSessionNum || S.guidedSession || _gsNum, screen: SCR.GUIDED }, false);
        syncGuidedSessionRuntime({
          autoAdvance: false,
          scheduleTick: true
        });
        render();
        return true;
      }
      if (guidedStartCore && typeof guidedStartCore.startSession === "function") {
        var _gsPlan = guidedStartCore.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: _gsNum });
        if (_gsPlan && _gsPlan.context && _gsPlan.context.guidedPlan) {
          mirrorGuidedRuntimeFields(guidedStartCore.getRuntimeState ? guidedStartCore.getRuntimeState() : null);
          setGuidedLegacyState({ guidedSession: _gsPlan.context.guidedSession || _gsNum, screen: SCR.GUIDED }, false);
          syncGuidedSessionRuntime({
            autoAdvance: false,
            scheduleTick: false
          });
          render();
          return true;
        }
      }
      var _inst = SparkInstruments.getActive();
      var _sessions = _inst && _inst.getData ? (_inst.getData().SESSIONS || []) : (typeof SESSIONS !== "undefined" ? SESSIONS : []);
      if (_gsNum > 0 && _gsNum <= _sessions.length) {
        S.guidedPlan = _sessions[_gsNum - 1];
        setGuidedLegacyState({ guidedSession: _gsNum, guidedStep: "spark", newMovePhase: null, screen: SCR.GUIDED }, false);
        render();
        return true;
      }
      setLegacyFields({ screen: SCR.HOME }, false);
      render();
      return true;
    }

    if (a === "resume_guided_session") {
      var guidedResumeCore = getSparkCoreHandle();
      var resumeGuidedSessionNum = getActiveGuidedSessionNumber();
      if (guidedResumeCore && isGuidedSessionActive()) {
        mirrorGuidedRuntimeFields(guidedResumeCore.getRuntimeState ? guidedResumeCore.getRuntimeState() : null);
        setGuidedLegacyState({ guidedSession: resumeGuidedSessionNum || S.guidedSession || 1, screen: SCR.GUIDED }, false);
        syncGuidedSessionRuntime({
          autoAdvance: false,
          scheduleTick: true
        });
        render();
        return true;
      }
      return handleSystemAction("start_guided_session", v);
    }

    if (a === "guidedDoneHome") {
      applyGuidedNavigationRequest("guided_home");
      act("tab", "practice");
      return true;
    }

    return false;
  }

  window.registerSparkActionFamily("system", handleSystemAction);
})();
