(function() {
  function getPerformanceActionCore() {
    if (typeof window !== "undefined" && window.sparkCore) return window.sparkCore;
    if (typeof sparkCore !== "undefined") return sparkCore;
    return null;
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

  function goHomeSongs(screen) {
    if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
      SparkProgressBridge.applyLegacyActivityRuntime({ setFields: { screen: screen || SCR.HOME, tab: TAB.SONGS } });
    } else {
      S.screen = screen || SCR.HOME;
      S.tab = TAB.SONGS;
    }
  }

  function resolveLegacyPerformanceSongId(song) {
    return typeof resolvePerformanceSongId === "function"
      ? resolvePerformanceSongId(song, song && song.title)
      : ((song && song.title) || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  }

  function getLegacyPerformanceMicOffsetMs() {
    if (typeof S.performMicOffsetMs === "number" && isFinite(S.performMicOffsetMs)) return S.performMicOffsetMs;
    return 0;
  }

  function resolveShowroomPerformanceAppId(hint) {
    var targetHint = hint != null ? String(hint).toLowerCase() : "";
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getAll !== "function") {
      return null;
    }
    var all = SparkInstruments.getAll() || [];
    var fallback = null;
    for (var i = 0; i < all.length; i++) {
      var inst = all[i];
      if (!inst) continue;
      if (!fallback && (inst.id || inst.appId)) fallback = inst.id || inst.appId;
      var instType = String(inst.instrument || inst.instrumentType || "").toLowerCase();
      if (targetHint && instType === targetHint) return inst.id || inst.appId || null;
    }
    return fallback;
  }

  function ensureShowroomPerformanceInstrument(hint) {
    if (S && S.activeInstrument) return S.activeInstrument;
    var appId = resolveShowroomPerformanceAppId(hint);
    if (!appId) return null;
    if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.activate === "function") {
      SparkInstruments.activate(appId);
    }
    if (typeof S !== "undefined") {
      setLegacyFields({ launcherView: null, _showroomOverride: null }, false);
    }
    return appId;
  }

  function preparePerformanceSongSelection(songIndex, options) {
    var song;
    var songId;
    var arrangementType;
    var difficultyId;
    var openScreen;
    options = options || {};
    if (isNaN(songIndex) || !SONGS[songIndex]) return false;
    song = SONGS[songIndex];
    songId = resolveLegacyPerformanceSongId(song);
    arrangementType = options.arrangementType || S.performArrangementType || "chords";
    difficultyId = options.difficultyId || S.performDifficulty || "normal";
    openScreen = Object.prototype.hasOwnProperty.call(options, "openScreen") ? !!options.openScreen : true;

    setLegacyFields({
      performSongData: song,
      performSongId: songId,
      performTargetTechnique: Object.prototype.hasOwnProperty.call(options, "targetTechnique") ? options.targetTechnique : null,
      performArrangementType: arrangementType,
      performDifficulty: difficultyId
    });

    var core = getPerformanceActionCore();
    if (core && typeof core.startSession === "function") {
      openPerformanceSongSelectionRequest({
        songIndex: songIndex,
        songId: songId,
        songTitle: song.title || null,
        targetTechnique: Object.prototype.hasOwnProperty.call(options, "targetTechnique") ? options.targetTechnique : null,
        arrangementType: arrangementType,
        difficultyId: difficultyId
      });
    }

    if (openScreen) {
      setLegacyFields({ screen: SCR.PERFORM_SONG });
      render();
    }
    return true;
  }

  function handlePerformanceAction(a, v) {
    if (a === "openPerform" || a === "startPerform") {
      startPerformance(v);
      return true;
    }

    if (a === "showroomStartPerf") {
      if (v && typeof v === "object" && typeof startPerformance === "function") {
        startPerformance(v);
        return true;
      }
      if (S.performChart && typeof startPerformance === "function") {
        startPerformance(S.performChart);
        return true;
      }
      if (S.selectedSong && typeof buildPerformanceChartFromSong === "function") {
        var showroomChart = buildPerformanceChartFromSong(S.selectedSong, "imported");
        if (showroomChart) {
          startPerformance(showroomChart);
          return true;
        }
      }
      if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.launchInstrumentPerformance === "function") {
        var appId = null;
        if (S && S.activeInstrument) appId = S.activeInstrument;
        if (!appId && v != null && typeof v !== "object") appId = resolveShowroomPerformanceAppId(v);
        if (!appId) appId = resolveShowroomPerformanceAppId(null);
        if (appId) {
          SparkInstruments.launchInstrumentPerformance(appId);
          return true;
        }
      }
      setLegacyFields({ screen: SCR.HOME, tab: TAB.PRACTICE }, false);
      render();
      return true;
    }

    if (a === "showroomPlayLibrarySong") {
      var rawPayload = v != null ? String(v) : "";
      var parts = rawPayload.split("|");
      var songKey = parts[0] || "";
      var instrumentType = parts[1] || "";
      var inst = typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function"
        ? SparkInstruments.getActive()
        : null;
      if ((!inst || !inst.getData || instrumentType) && typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getAll === "function") {
        var allInst = SparkInstruments.getAll() || [];
        for (var ai = 0; ai < allInst.length; ai++) {
          var candidateInst = allInst[ai];
          if (!candidateInst) continue;
          var candidateType = candidateInst.instrument || candidateInst.instrumentType || "";
          if (instrumentType && candidateType !== instrumentType) continue;
          if (typeof candidateInst.getData === "function") {
            inst = candidateInst;
            break;
          }
        }
        if (inst && typeof SparkInstruments.activate === "function" && (!S.activeInstrument || S.activeInstrument !== (inst.id || inst.appId))) {
          SparkInstruments.activate(inst.id || inst.appId);
        }
      }
      var data = inst && typeof inst.getData === "function" ? inst.getData() : null;
      var songs = data && Array.isArray(data.SONGS) ? data.SONGS : [];
      var selected = null;
      for (var si = 0; si < songs.length; si++) {
        var candidate = songs[si];
        if (!candidate) continue;
        if (String(candidate.id || "") === songKey || String(candidate.title || "") === songKey || String(candidate.name || "") === songKey) {
          selected = candidate;
          break;
        }
      }
      if (selected) {
        setLegacyFields({ selectedSong: selected }, false);
        return handlePerformanceAction("showroomStartPerf");
      }
      if (inst && typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.launchInstrumentPerformance === "function") {
        SparkInstruments.launchInstrumentPerformance(inst.id || inst.appId);
        return true;
      }
      if (typeof S !== "undefined") {
        setLegacyFields({ _showroomSongId: songKey || null }, false);
      }
      if (typeof showMicroToast === "function") showMicroToast("This song's performance chart isn't ready yet.", "&#127925;");
      render();
      return true;
    }

    if (a === "performSong") {
      var songIdx = parseInt(v, 10);
      if (preparePerformanceSongSelection(songIdx, {
        arrangementType: S.performArrangementType || "chords",
        difficultyId: S.performDifficulty || "normal",
        openScreen: false
      })) {
        return handlePerformanceAction("performStartFromSong");
      }
      return true;
    }

    if (a === "performSongRhythm") {
      var rhythmSongIdx = parseInt(v, 10);
      if (preparePerformanceSongSelection(rhythmSongIdx, {
        arrangementType: "rhythm_chords",
        difficultyId: S.performDifficulty || "normal",
        openScreen: false
      })) {
        return handlePerformanceAction("performStartFromSong");
      }
      return true;
    }

    if (a === "openPerformSong") {
      var selectedSongIdx = parseInt(v, 10);
      preparePerformanceSongSelection(selectedSongIdx, {
        arrangementType: S.performArrangementType || "chords",
        difficultyId: S.performDifficulty || "normal",
        targetTechnique: null,
        openScreen: true
      });
      return true;
    }

    if (a === "openPerfStats") {
      openPerformanceStatsRequest({ focus: "overview" });
      setLegacyFields({ screen: SCR.PERF_STATS });
      render();
      return true;
    }

    if (a === "openEditor") {
      setLegacyFields({ performEditorChart: null, performEditorDirty: false, screen: SCR.PERF_EDITOR });
      openPerformanceEditorRequest(null, {
        action: "open_editor",
        source: "blank",
        dirty: false,
        mode: S.performEditorMode || "chords",
        snap: S.performEditorSnap || "1/8",
        selectedEventId: null,
        selectedPhraseId: null
      });
      render();
      return true;
    }

    if (a === "openPerformCalibration") {
      var calibrationCore = getPerformanceActionCore();
      var calibrationRuntime = calibrationCore && typeof calibrationCore.getRuntimeState === "function"
        ? calibrationCore.getRuntimeState()
        : null;
      var calibrationReturnScreen = S.screen === SCR.PERFORM_SONG ||
          (calibrationRuntime && calibrationRuntime.activeScreen === "performance_song")
        ? SCR.PERFORM_SONG
        : null;
      openPerformanceCalibrationRequest();
      setLegacyFields({
        screen: SCR.PERFORM_CALIBRATE,
        performCalibrationReturnScreen: calibrationReturnScreen
      });
      render();
      return true;
    }

    if (a === "performCalibrateSource") {
      applyPerformanceCalibrationRequest("calibration_source", { source: v || "midi" });
      setLegacyFields({ performCalibrationSource: v || "midi" });
      render();
      return true;
    }

    if (a === "performCalibrationStart") {
      var calStartSource = typeof getPerformanceCalibrationView === "function" ? getPerformanceCalibrationView().source : (S.performCalibrationSource || "midi");
      applyPerformanceCalibrationRequest("calibration_start", { source: calStartSource });
      startPerformanceCalibrationRun();
      render();
      return true;
    }

    if (a === "performCalibrationStop") {
      applyPerformanceCalibrationRequest("calibration_stop");
      stopPerformanceCalibration();
      render();
      return true;
    }

    if (a === "performCalibrationApply") {
      var appliedOffset = applyCalibrationOffset();
      applyPerformanceCalibrationRequest("calibration_apply", {
        source: S.performCalibrationSource || "midi",
        appliedOffsetMs: appliedOffset,
        globalOffsetMs: S.performTimingOffsetMs || 0,
        midiOffsetMs: S.performMidiOffsetMs || 0,
        micOffsetMs: getLegacyPerformanceMicOffsetMs()
      });
      render();
      return true;
    }

    if (a === "performCalibrationReset") {
      var resetSource = typeof getPerformanceCalibrationView === "function" ? getPerformanceCalibrationView().source : (S.performCalibrationSource || "midi");
      var resetPatch = { performCalibrationHits: [] };
      if (resetSource === "midi") resetPatch.performMidiOffsetMs = 0;
      if (resetSource === "mic") {
        resetPatch.performMicOffsetMs = 0;
        resetPatch.performAudioOffsetMs = 0;
      }
      applyPerformanceCalibrationRequest("calibration_reset", {
        source: resetSource,
        globalOffsetMs: S.performTimingOffsetMs || 0,
        midiOffsetMs: resetSource === "midi" ? 0 : (S.performMidiOffsetMs || 0),
        micOffsetMs: resetSource === "mic" ? 0 : getLegacyPerformanceMicOffsetMs()
      });
      setLegacyFields(resetPatch, false);
      saveState();
      render();
      return true;
    }

    if (a === "performStatsBack") {
      applyPerformanceNavigationRequest("songs_home");
      goHomeSongs();
      render();
      return true;
    }

    if (a === "performStatsFocus") {
      var statsCore = getPerformanceActionCore();
      if (statsCore && typeof statsCore.syncPerformanceRuntimeState === "function") {
        statsCore.syncPerformanceRuntimeState("configure_stats", {
          focus: v || "overview"
        });
      }
      render();
      return true;
    }

    if (a === "performCalibrationBack") {
      var returnToPerformanceSong = S.performCalibrationReturnScreen === SCR.PERFORM_SONG;
      if (typeof stopPerformanceCalibration === "function") stopPerformanceCalibration();
      applyPerformanceNavigationRequest(returnToPerformanceSong ? "song_detail" : "songs_home", { performanceCalibrationMode: false });
      setLegacyFields({ performCalibrationReturnScreen: null }, false);
      goHomeSongs(returnToPerformanceSong ? SCR.PERFORM_SONG : SCR.HOME);
      render();
      return true;
    }

    if (a === "performCalibrateTap") {
      var nowMs = performance.now();
      var beatIdx = typeof getCalibrationBeatIndex === "function" ? getCalibrationBeatIndex() : 0;
      var startMs = typeof getCalibrationStartMs === "function" ? getCalibrationStartMs() : 0;
      var interval = typeof getCalibrationBeatIntervalMs === "function" ? getCalibrationBeatIntervalMs() : 1000;
      var targetMs = startMs + (beatIdx * interval);
      recordCalibrationHit(targetMs, nowMs);
      render();
      return true;
    }

    if (a === "editorBack") {
      var editorCore = getPerformanceActionCore();
      if (editorCore && typeof editorCore.syncPerformanceRuntimeState === "function") {
        editorCore.syncPerformanceRuntimeState("close_editor", { screen: "home" });
      }
      goHomeSongs();
      render();
      return true;
    }

    if (a === "editorMode") {
      syncPerformanceEditorDocumentState(S.performEditorChart, { mode: v });
      setLegacyFields({ performEditorMode: v }, false);
      render();
      return true;
    }

    if (a === "editorSnap") {
      syncPerformanceEditorDocumentState(S.performEditorChart, { snap: v });
      setLegacyFields({ performEditorSnap: v }, false);
      render();
      return true;
    }

    if (a === "editorNew") {
      var newEditorChartResult = applyPerformanceEditorCoreMutation("new_blank", { mode: S.performEditorMode });
      var newEditorChart = newEditorChartResult && newEditorChartResult.chart
        ? newEditorChartResult.chart
        : { id: "custom_" + Date.now(), title: "New Chart", artist: "Custom", bpm: 90, beatsPerBar: 4, arrangementType: S.performEditorMode, events: [], phrases: [{ id: 0, name: "Phrase 1", startSec: 0, endSec: 8 }] };
      setLegacyFields({ performEditorChart: newEditorChart, performEditorDirty: true }, false);
      syncPerformanceEditorDocumentState(newEditorChart, {
        source: "blank",
        dirty: true,
        selectedEventId: null,
        selectedPhraseId: null
      });
      render();
      return true;
    }

    if (a === "editorFromSong") {
      if (S.performSongData) {
        var editorChart = buildPerformanceChartFromSong(S.performSongData, "builtin", S.performEditorMode);
        if (editorChart) {
          setLegacyFields({ performEditorChart: editorChart, performEditorDirty: true }, false);
          syncPerformanceEditorDocumentState(editorChart, {
            source: "song",
            dirty: true,
            selectedEventId: null,
            selectedPhraseId: null
          });
          render();
        }
      }
      return true;
    }

    if (a === "editorTitle") {
      if (S.performEditorChart) {
        var titleMutation = applyPerformanceEditorCoreMutation("set_title", { title: v });
        var titledEditorChart = titleMutation && titleMutation.chart
          ? titleMutation.chart
          : Object.assign({}, S.performEditorChart, { title: v });
        setLegacyFields({ performEditorChart: titledEditorChart, performEditorDirty: true }, false);
        syncPerformanceEditorDocumentState(titledEditorChart, { source: "existing", dirty: true });
        render();
      }
      return true;
    }

    if (a === "editorBpm") {
      if (S.performEditorChart) {
        var bpmValue = parseInt(v, 10) || 90;
        var bpmMutation = applyPerformanceEditorCoreMutation("set_bpm", { bpm: bpmValue });
        var bpmEditorChart = bpmMutation && bpmMutation.chart
          ? bpmMutation.chart
          : Object.assign({}, S.performEditorChart, { bpm: bpmValue });
        setLegacyFields({ performEditorChart: bpmEditorChart, performEditorDirty: true }, false);
        syncPerformanceEditorDocumentState(bpmEditorChart, { source: "existing", dirty: true });
        render();
      }
      return true;
    }

    if (a === "editorExport") {
      var exportData = getPerformanceEditorExportData();
      if (exportData.chart) {
        var json = exportData.json;
        var blob = new Blob([json], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = exportData.fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      }
      return true;
    }

    if (a === "editorPreview") {
      var previewRequest = getPerformanceEditorPreviewRequest();
      if (previewRequest && previewRequest.chart && previewRequest.chart.events && previewRequest.chart.events.length) {
        startPerformance(previewRequest.chart, {
          difficulty: previewRequest.difficulty,
          speed: previewRequest.speed,
          preset: previewRequest.preset,
          mode: previewRequest.mode
        });
      }
      return true;
    }

    if (a === "openPerformanceDaily") {
      ensureShowroomPerformanceInstrument("guitar");
      var challenge = choosePerformanceDailyChallenge();
      if (!challenge) {
        render();
        return true;
      }
      if (challenge.songId) {
        for (var di = 0; di < SONGS.length; di++) {
          var dsid = typeof resolvePerformanceSongId === "function"
            ? resolvePerformanceSongId(SONGS[di], SONGS[di].title)
            : (SONGS[di].title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
          if (dsid === challenge.songId) {
            openPerformanceDailyChallengeRequest({
              songId: challenge.songId,
              songData: SONGS[di],
              songTitle: SONGS[di].title || null,
              arrangementType: challenge.arrangementType || "chords",
              difficultyId: challenge.difficultyId || "normal",
              songIndex: di,
              targetTechnique: challenge.techniqueKey || null
            });
            setLegacyFields({
              performSongData: SONGS[di],
              performSongId: challenge.songId,
              performArrangementType: challenge.arrangementType || "chords",
              performDifficulty: challenge.difficultyId || "normal",
              screen: SCR.PERFORM_SONG
            });
            render();
            return true;
          }
        }
      }
      openPerformanceDailyChallengeRequest({});
      setLegacyFields({ songsSubTab: "perform" }, false);
      if (typeof applySongBrowserRequest === "function") {
        applySongBrowserRequest("songs_subtab", { songsSubTab: "perform" });
      }
      goHomeSongs(SCR.HOME);
      render();
      return true;
    }

    if (a === "performArrangement") {
      var nextArrangementType = v || "chords";
      setLegacyFields({ performArrangementType: nextArrangementType }, false);
      var arrangementCore = getPerformanceActionCore();
      if (arrangementCore && typeof arrangementCore.syncPerformanceRuntimeState === "function") {
        var arrangementState = typeof arrangementCore.getRuntimeState === "function" ? arrangementCore.getRuntimeState() : {};
        arrangementCore.syncPerformanceRuntimeState("configure", {
          arrangementType: nextArrangementType,
          songIndex: arrangementState.performanceSongIndex,
          songTitle: arrangementState.performanceSongTitle
        });
      }
      saveState();
      render();
      return true;
    }

    if (a === "performStartFromSong") {
      var startCore = getPerformanceActionCore();
      var coreView = startCore && typeof startCore.getActiveSessionView === "function"
        ? startCore.getActiveSessionView()
        : null;
      var performanceSong = coreView && coreView.plan && coreView.plan.flow === "performance_song" && coreView.plan.context
        ? coreView.plan.context.performanceSong || null
        : null;
      var selectedSong = performanceSong && performanceSong.songData ? performanceSong.songData : S.performSongData;
      var songContext = startCore && typeof startCore.projectRuntimeStateFields === "function"
        ? startCore.projectRuntimeStateFields("performanceSongContext", coreView && coreView.runtimeState, {
          performanceSongTitle: selectedSong && selectedSong.title ? selectedSong.title : null,
          performanceDifficultyId: S.performDifficulty,
          performanceSpeed: S.performSpeed,
          performanceTargetTechnique: S.performTargetTechnique
        })
        : null;
      var selectedSongIndex = songContext ? songContext.performanceSongIndex : null;
      var selectedSongTitle = songContext ? songContext.performanceSongTitle : (selectedSong && selectedSong.title ? selectedSong.title : null);
      var arrangementType = performanceSong && performanceSong.arrangementType ? performanceSong.arrangementType : S.performArrangementType;
      var difficultyId = songContext ? songContext.performanceDifficultyId : S.performDifficulty;
      var speed = songContext ? songContext.performanceSpeed : S.performSpeed;
      var targetTechnique = songContext ? songContext.performanceTargetTechnique : S.performTargetTechnique;
      var selectedSongId = selectedSong && typeof resolvePerformanceSongId === "function"
        ? resolvePerformanceSongId(selectedSong, selectedSongTitle || (selectedSong && selectedSong.title))
        : (selectedSongTitle || (selectedSong && selectedSong.title) || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
      var activeInstrumentType = typeof getActivePerformanceInstrumentType === "function"
        ? getActivePerformanceInstrumentType()
        : ((selectedSong && (selectedSong.instrument || selectedSong.instrumentType || selectedSong.adapterType)) || "guitar");
      var explicitVariantChartId = typeof resolvePerformanceChartVariantId === "function"
        ? resolvePerformanceChartVariantId(selectedSongId, {
          instrument: activeInstrumentType,
          arrangementType: arrangementType
        })
        : null;
      if (selectedSong) {
        var performanceChart = explicitVariantChartId ? null : buildPerformanceChartFromSong(selectedSong, "builtin", arrangementType);
        if (explicitVariantChartId || performanceChart) {
          var startRequest = startSelectedPerformanceSongRequest({
            chart: performanceChart,
            chartId: explicitVariantChartId || (performanceChart && performanceChart.id) || null,
            songIndex: selectedSongIndex,
            songTitle: selectedSongTitle,
            difficulty: difficultyId,
            arrangementType: arrangementType,
            speed: speed,
            targetTechnique: targetTechnique,
            preset: S.performPracticePreset,
            mode: S.performMode,
            countIn: !!S.performCountIn
          });
          startPerformance(explicitVariantChartId || performanceChart, {
            difficulty: startRequest.difficulty,
            speed: startRequest.speed,
            preset: startRequest.preset,
            mode: startRequest.mode,
            instrument: activeInstrumentType
          });
        }
      }
      return true;
    }

    if (a === "performSongBack") {
      setLegacyFields({ performTargetTechnique: null });
      applyPerformanceNavigationRequest("songs_home");
      goHomeSongs();
      render();
      return true;
    }

    if (a === "pausePerform") {
      pausePerformance();
      return true;
    }

    if (a === "resumePerform") {
      resumePerformance();
      return true;
    }

    if (a === "stopPerform") {
      stopPerformance();
      var performanceStopState = applyPerformanceNavigationRequest("return_after_stop");
      var shouldReturnToSong = performanceStopState && performanceStopState.activeScreen === "performance_song";
      goHomeSongs(shouldReturnToSong ? SCR.PERFORM_SONG : SCR.HOME);
      render();
      return true;
    }

    if (a === "performMode") {
      setLegacyFields({ performMode: v, performInputSource: v }, false);
      PerformanceInput.start(v);
      var modeCore = getPerformanceActionCore();
      if (modeCore && typeof modeCore.syncPerformanceRuntimeState === "function") {
        modeCore.syncPerformanceRuntimeState("configure", { mode: v });
      }
      saveState();
      render();
      return true;
    }

    if (a === "performDifficulty") {
      applyPerformanceDifficultyToState(v || "normal");
      var difficultyCore = getPerformanceActionCore();
      var difficultyState = difficultyCore && typeof difficultyCore.getRuntimeState === "function" ? difficultyCore.getRuntimeState() : {};
      if (difficultyCore && typeof difficultyCore.syncPerformanceRuntimeState === "function") {
        difficultyCore.syncPerformanceRuntimeState("configure", {
          difficulty: S.performDifficulty,
          songIndex: difficultyState.performanceSongIndex,
          songTitle: difficultyState.performanceSongTitle
        });
      }
      saveState();
      render();
      return true;
    }

    if (a === "performSpeed") {
      var nextPerformanceSpeed = parseFloat(v);
      setLegacyFields({ performSpeed: nextPerformanceSpeed }, false);
      PerformanceTransport.setSpeed(nextPerformanceSpeed);
      var speedCore = getPerformanceActionCore();
      var speedState = speedCore && typeof speedCore.getRuntimeState === "function" ? speedCore.getRuntimeState() : {};
      if (speedCore && typeof speedCore.syncPerformanceRuntimeState === "function") {
        speedCore.syncPerformanceRuntimeState("configure", {
          speed: nextPerformanceSpeed,
          songIndex: speedState.performanceSongIndex,
          songTitle: speedState.performanceSongTitle
        });
      }
      saveState();
      render();
      return true;
    }

    if (a === "performLoopPhrase") {
      var phrase = getPerformancePhraseForTime(S.performChart, S.performCurrentSec);
      if (phrase) setPerformanceLoop({ startSec: phrase.startSec, endSec: phrase.endSec, phraseId: phrase.id });
      return true;
    }

    if (a === "performClearLoop") {
      clearPerformanceLoop();
      return true;
    }

    if (a === "performPracticePreset") {
      applyPerformanceStemPreset(v);
      var presetCore = getPerformanceActionCore();
      if (presetCore && typeof presetCore.syncPerformanceRuntimeState === "function") {
        presetCore.syncPerformanceRuntimeState("configure", { preset: S.performPracticePreset });
      }
      render();
      return true;
    }

    if (a === "performCalibrate") {
      if (typeof S !== "undefined" && S && typeof SCR !== "undefined" && S.screen === SCR.PERFORM &&
          typeof SparkPerformanceRunCalibration !== "undefined" && SparkPerformanceRunCalibration &&
          typeof SparkPerformanceRunCalibration.start === "function") {
        SparkPerformanceRunCalibration.start();
      } else if (typeof startCalibration === "function") {
        startCalibration();
      }
      return true;
    }

    if (a === "performCalibrateStop") {
      if (typeof stopCalibration === "function") stopCalibration();
      return true;
    }

    if (a === "performCalibrationTap") {
      if (typeof S !== "undefined" && S && typeof SCR !== "undefined" && S.screen === SCR.PERFORM &&
          typeof SparkPerformanceRunCalibration !== "undefined" && SparkPerformanceRunCalibration &&
          typeof SparkPerformanceRunCalibration.tap === "function") {
        SparkPerformanceRunCalibration.tap();
      } else if (typeof recordCalibrationTap === "function") recordCalibrationTap();
      return true;
    }

    if (a === "performCalibrationCancel") {
      if (typeof S !== "undefined" && S && typeof SCR !== "undefined" && S.screen === SCR.PERFORM &&
          typeof SparkPerformanceRunCalibration !== "undefined" && SparkPerformanceRunCalibration &&
          typeof SparkPerformanceRunCalibration.cancel === "function") {
        SparkPerformanceRunCalibration.cancel();
      } else if (typeof cancelCalibration === "function") cancelCalibration();
      return true;
    }

    if (a === "performRetry") {
      var retryRequest = getPerformanceRetryRequest({
        chartId: S.performChartId,
        targetTechnique: S.performTargetTechnique || null
      });
      startPerformance(retryRequest.chartId, {
        difficulty: retryRequest.difficulty,
        speed: retryRequest.speed,
        preset: retryRequest.preset,
        mode: retryRequest.mode,
        targetTechnique: retryRequest.targetTechnique
      });
      return true;
    }

    if (a === "performDebug") {
      setLegacyFields({ performDebug: !S.performDebug }, false);
      render();
      return true;
    }

    if (a === "performRetryPhrase") {
      if (S.performChart && S.performChart.phrases && S.performChart.phrases.length &&
          S.performResults && S.performResults.phraseStats && S.performResults.phraseStats.length) {
        var retryCore = getPerformanceActionCore();
        var retryCoreView = retryCore && typeof retryCore.getActiveSessionView === "function"
          ? retryCore.getActiveSessionView()
          : null;
        var targetTechniqueRetry = retryCore && typeof retryCore.projectRuntimeStateFields === "function"
          ? retryCore.projectRuntimeStateFields("performanceSongContext", retryCoreView && retryCoreView.runtimeState, {
            performanceTargetTechnique: S.performTargetTechnique
          }).performanceTargetTechnique
          : (S.performTargetTechnique || null);
        var candidateIndices = null;
        if (targetTechniqueRetry && typeof getPerformancePhraseIndicesForTechnique === "function") {
          candidateIndices = getPerformancePhraseIndicesForTechnique(S.performChart, targetTechniqueRetry);
          if (!candidateIndices || !candidateIndices.length) candidateIndices = null;
        }
        var weakIdx = candidateIndices && candidateIndices.length ? candidateIndices[0] : 0;
        var weakAvg = Infinity;
        for (var wi = 0; wi < S.performResults.phraseStats.length; wi++) {
          if (candidateIndices && candidateIndices.indexOf(wi) === -1) continue;
          var wp = S.performResults.phraseStats[wi];
          var wa = wp.total > 0 ? wp.scoreSum / wp.total : 0;
          if (wa < weakAvg) {
            weakAvg = wa;
            weakIdx = wi;
          }
        }
        var weakPhrase = S.performChart.phrases[weakIdx];
        if (weakPhrase) {
          setLegacyFields({ performTargetPhrase: weakIdx }, false);
          var retryPhraseRequest = getPerformanceRetryRequest({
            chart: S.performChart,
            chartId: S.performChartId || (S.performChart && S.performChart.id) || "generated",
            targetPhraseIndex: weakIdx
          });
          startPerformance(retryPhraseRequest.chartId || retryPhraseRequest.chart, {
            mode: retryPhraseRequest.mode,
            difficulty: retryPhraseRequest.difficulty,
            speed: retryPhraseRequest.speed,
            targetTechnique: retryPhraseRequest.targetTechnique
          });
          setTimeout(function() {
            if (S.performChart && S.performChart.phrases[weakIdx]) {
              var retryPhrase = S.performChart.phrases[weakIdx];
              setPerformanceLoop({ startSec: retryPhrase.startSec, endSec: retryPhrase.endSec, phraseId: retryPhrase.id });
              render();
            }
          }, 100);
        }
      }
      return true;
    }

    if (a === "performDoneSongs") {
      applyPerformanceNavigationRequest("songs_home");
      setLegacyFields({ songsSubTab: "perform" }, false);
      if (typeof applySongBrowserRequest === "function") {
        applySongBrowserRequest("songs_subtab", { songsSubTab: "perform" });
      }
      goHomeSongs(SCR.HOME);
      render();
      return true;
    }

    return false;
  }

  window.registerSparkActionFamily("performance", handlePerformanceAction);
})();
