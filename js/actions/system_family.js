(function() {
  var _showroomTapTempoTimes = [];

  function showMicroToast(message, icon) {
    S.microToast = { msg: message, icon: icon || "&#9889;", time: Date.now() };
  }

  function setMetronomeBpmValue(bpm) {
    if (bpm < 40 || bpm > 200) return false;
    S.metronomeBpm = bpm;
    syncMetronomeRuntimeRequest({
      active: !!S.metronomeOn,
      bpm: S.metronomeBpm,
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
              S.tunerNote = result.note;
              S.tunerFreq = result.freq;
              S.tunerCents = result.cents;
              syncTunerRuntimeRequest({ active: true, note: result.note, freq: result.freq, cents: result.cents, error: null });
            } else if (f < 0) {
              S.tunerNote = null;
              S.tunerFreq = 0;
              S.tunerCents = 0;
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
      S.practiceIntention = v || "";
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
        S.performSongData = nextSong;
        S.performSongId = v;
      }
      if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
        SparkProgressBridge.applyLegacyActivityRuntime({
          setFields: { currentSong: nextSong, performSongData: nextSong, performSongId: v, screen: SCR.PERFORM_SONG }
        });
      } else {
        S.currentSong = nextSong;
        S.performSongData = nextSong;
        S.performSongId = v;
        S.screen = SCR.PERFORM_SONG;
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
      openPracticePlanScreenRequest();
      openScreen(SCR.PLAN);
      render();
      return true;
    }

    if (a === "setTheme") {
      if (S.settings) S.settings.theme = v;
      if (typeof applyThemeSetting === "function") applyThemeSetting();
      saveState();
      render();
      return true;
    }

    if (a === "songSort") {
      if (S.songSort === v) S.songSortAsc = !S.songSortAsc;
      else {
        S.songSort = v;
        S.songSortAsc = true;
      }
      applySongBrowserRequest("song_sort", {
        songSort: S.songSort,
        songSortAsc: S.songSortAsc
      });
      render();
      return true;
    }

    if (a === "songFilter") {
      S.songFilter = v || "";
      applySongBrowserRequest("song_filter", { songFilter: S.songFilter });
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
      if (idx < steps.length - 1) {
        S.guidedStep = steps[idx + 1];
        if (S.guidedStep === "newMove") S.newMovePhase = "watch";
        if (window.sparkCore && typeof window.sparkCore.syncGuidedRuntimeState === "function") {
          window.sparkCore.syncGuidedRuntimeState({
            guidedStep: S.guidedStep,
            guidedNewMovePhase: S.newMovePhase || null
          });
        }
      }
      render();
      return true;
    }

    if (a === "guidedAdvancePhase") {
      var phases = ["watch", "shadow", "try", "refine"];
      var pi = phases.indexOf(S.newMovePhase);
      if (pi < phases.length - 1) {
        S.newMovePhase = phases[pi + 1];
        if (window.sparkCore && typeof window.sparkCore.syncGuidedRuntimeState === "function") {
          window.sparkCore.syncGuidedRuntimeState({
            guidedStep: S.guidedStep,
            guidedNewMovePhase: S.newMovePhase
          });
        }
      } else {
        act("guidedNext");
        return true;
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
      S.screen = SCR.HOME;
      S.tab = TAB.PRACTICE;
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
      S.audioInputId = v;
      syncAudioInputRuntimeRequest({
        devices: S.audioInputDevices || [],
        inputId: S.audioInputId || null,
        testingId: "",
        testLevel: 0
      });
      saveState();
      render();
      return true;
    }

    if (a === "toggleMidi") {
      S.midiEnabled = !S.midiEnabled;
      if (S.midiEnabled) initMIDI();
      else {
        S.midiOutput = null;
        S.midiDevices = [];
      }
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
      S.focusMode = !S.focusMode;
      if (S.focusMode && [TAB.PRACTICE, TAB.DRILL, TAB.DAILY, TAB.STATS, TAB.GUIDE].indexOf(S.tab) === -1) {
        S.tab = TAB.PRACTICE;
      }
      saveState();
      render();
      return true;
    }

    if (a === "dismissBreak") {
      S.breakDismissed = true;
      S.sessionStartTime = Date.now();
      render();
      return true;
    }

    if (a === "toggleShortcuts") {
      S.showShortcuts = !S.showShortcuts;
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
      if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
        var _gsPlan = window.sparkCore.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: _gsNum });
        if (_gsPlan && _gsPlan.context && _gsPlan.context.guidedPlan) {
          S.screen = SCR.GUIDED;
          render();
          return true;
        }
      }
      var _inst = SparkInstruments.getActive();
      var _sessions = _inst && _inst.getData ? (_inst.getData().SESSIONS || []) : (typeof SESSIONS !== "undefined" ? SESSIONS : []);
      if (_gsNum > 0 && _gsNum <= _sessions.length) {
        S.guidedPlan = _sessions[_gsNum - 1];
        S.guidedSession = _gsNum;
        S.guidedStep = "spark";
        S.newMovePhase = null;
        S.screen = SCR.GUIDED;
        render();
        return true;
      }
      S.screen = SCR.HOME;
      render();
      return true;
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
