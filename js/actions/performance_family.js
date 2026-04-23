(function() {
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

  function handlePerformanceAction(a, v) {
    if (a === "openPerform" || a === "startPerform") {
      startPerformance(v);
      return true;
    }

    if (a === "showroomStartPerf") {
      if (v && typeof startPerformance === "function") {
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
      S.screen = SCR.HOME;
      S.tab = TAB.PRACTICE;
      render();
      return true;
    }

    if (a === "performSong") {
      var songIdx = parseInt(v, 10);
      if (!isNaN(songIdx) && SONGS[songIdx]) {
        var chart = buildPerformanceChartFromSong(SONGS[songIdx], "builtin");
        if (chart) startPerformance(chart);
      }
      return true;
    }

    if (a === "performSongRhythm") {
      var rhythmSongIdx = parseInt(v, 10);
      if (!isNaN(rhythmSongIdx) && SONGS[rhythmSongIdx]) {
        var rhythmChart = buildPerformanceChartFromSong(SONGS[rhythmSongIdx], "builtin", "rhythm_chords");
        if (rhythmChart) {
          setLegacyFields({ performArrangementType: "rhythm_chords" });
          startPerformance(rhythmChart);
        }
      }
      return true;
    }

    if (a === "openPerformSong") {
      var selectedSongIdx = parseInt(v, 10);
      if (!isNaN(selectedSongIdx) && SONGS[selectedSongIdx]) {
        var selectedSongId = typeof resolvePerformanceSongId === "function"
          ? resolvePerformanceSongId(SONGS[selectedSongIdx], SONGS[selectedSongIdx].title)
          : (SONGS[selectedSongIdx].title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
        setLegacyFields({ performTargetTechnique: null });
        if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
          openPerformanceSongSelectionRequest({
            songIndex: selectedSongIdx,
            songId: selectedSongId,
            songTitle: SONGS[selectedSongIdx].title || null,
            targetTechnique: null,
            arrangementType: S.performArrangementType || "chords",
            difficultyId: S.performDifficulty || "normal"
          });
        } else {
          S.performSongData = SONGS[selectedSongIdx];
          S.performSongId = selectedSongId;
          S.performTargetTechnique = null;
        }
        setLegacyFields({ screen: SCR.PERFORM_SONG });
        render();
      }
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
      openPerformanceCalibrationRequest();
      setLegacyFields({ screen: SCR.PERFORM_CALIBRATE });
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
        micOffsetMs: S.performMicOffsetMs || 0
      });
      render();
      return true;
    }

    if (a === "performCalibrationReset") {
      var resetSource = typeof getPerformanceCalibrationView === "function" ? getPerformanceCalibrationView().source : (S.performCalibrationSource || "midi");
      var resetPatch = { performCalibrationHits: [] };
      if (resetSource === "midi") resetPatch.performMidiOffsetMs = 0;
      if (resetSource === "mic") resetPatch.performMicOffsetMs = 0;
      applyPerformanceCalibrationRequest("calibration_reset", {
        source: resetSource,
        globalOffsetMs: S.performTimingOffsetMs || 0,
        midiOffsetMs: resetSource === "midi" ? 0 : (S.performMidiOffsetMs || 0),
        micOffsetMs: resetSource === "mic" ? 0 : (S.performMicOffsetMs || 0)
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
      if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
        window.sparkCore.syncPerformanceRuntimeState("configure_stats", {
          focus: v || "overview"
        });
      }
      render();
      return true;
    }

    if (a === "performCalibrationBack") {
      if (typeof stopPerformanceCalibration === "function") stopPerformanceCalibration();
      applyPerformanceNavigationRequest("songs_home", { performanceCalibrationMode: false });
      goHomeSongs();
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
      if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
        window.sparkCore.syncPerformanceRuntimeState("close_editor", { screen: "home" });
      }
      goHomeSongs();
      render();
      return true;
    }

    if (a === "editorMode") {
      syncPerformanceEditorDocumentState(S.performEditorChart, { mode: v });
      S.performEditorMode = v;
      render();
      return true;
    }

    if (a === "editorSnap") {
      syncPerformanceEditorDocumentState(S.performEditorChart, { snap: v });
      S.performEditorSnap = v;
      render();
      return true;
    }

    if (a === "editorNew") {
      var newEditorChartResult = applyPerformanceEditorCoreMutation("new_blank", { mode: S.performEditorMode });
      S.performEditorChart = newEditorChartResult && newEditorChartResult.chart
        ? newEditorChartResult.chart
        : { id: "custom_" + Date.now(), title: "New Chart", artist: "Custom", bpm: 90, beatsPerBar: 4, arrangementType: S.performEditorMode, events: [], phrases: [{ id: 0, name: "Phrase 1", startSec: 0, endSec: 8 }] };
      syncPerformanceEditorDocumentState(S.performEditorChart, {
        source: "blank",
        dirty: true,
        selectedEventId: null,
        selectedPhraseId: null
      });
      S.performEditorDirty = true;
      render();
      return true;
    }

    if (a === "editorFromSong") {
      if (S.performSongData) {
        var editorChart = buildPerformanceChartFromSong(S.performSongData, "builtin", S.performEditorMode);
        if (editorChart) {
          S.performEditorChart = editorChart;
          syncPerformanceEditorDocumentState(editorChart, {
            source: "song",
            dirty: true,
            selectedEventId: null,
            selectedPhraseId: null
          });
          S.performEditorDirty = true;
          render();
        }
      }
      return true;
    }

    if (a === "editorTitle") {
      if (S.performEditorChart) {
        var titleMutation = applyPerformanceEditorCoreMutation("set_title", { title: v });
        S.performEditorChart = titleMutation && titleMutation.chart ? titleMutation.chart : S.performEditorChart;
        S.performEditorChart.title = v;
        syncPerformanceEditorDocumentState(S.performEditorChart, { source: "existing", dirty: true });
        S.performEditorDirty = true;
        render();
      }
      return true;
    }

    if (a === "editorBpm") {
      if (S.performEditorChart) {
        var bpmValue = parseInt(v, 10) || 90;
        var bpmMutation = applyPerformanceEditorCoreMutation("set_bpm", { bpm: bpmValue });
        S.performEditorChart = bpmMutation && bpmMutation.chart ? bpmMutation.chart : S.performEditorChart;
        S.performEditorChart.bpm = bpmValue;
        syncPerformanceEditorDocumentState(S.performEditorChart, { source: "existing", dirty: true });
        S.performEditorDirty = true;
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
            S.performSongData = SONGS[di];
            S.performSongId = challenge.songId;
            S.performArrangementType = challenge.arrangementType || "chords";
            S.performDifficulty = challenge.difficultyId || "normal";
            setLegacyFields({ screen: SCR.PERFORM_SONG });
            render();
            return true;
          }
        }
      }
      openPerformanceDailyChallengeRequest({});
      goHomeSongs(SCR.HOME);
      render();
      return true;
    }

    if (a === "performArrangement") {
      S.performArrangementType = v || "chords";
      if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
        var arrangementState = window.sparkCore.getRuntimeState();
        window.sparkCore.syncPerformanceRuntimeState("configure", {
          arrangementType: S.performArrangementType,
          songIndex: arrangementState.performanceSongIndex,
          songTitle: arrangementState.performanceSongTitle
        });
      }
      saveState();
      render();
      return true;
    }

    if (a === "performStartFromSong") {
      var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
        ? window.sparkCore.getActiveSessionView()
        : null;
      var performanceSong = coreView && coreView.plan && coreView.plan.flow === "performance_song" && coreView.plan.context
        ? coreView.plan.context.performanceSong || null
        : null;
      var selectedSong = performanceSong && performanceSong.songData ? performanceSong.songData : S.performSongData;
      var selectedSongIndex = coreView && coreView.runtimeState && Object.prototype.hasOwnProperty.call(coreView.runtimeState, "performanceSongIndex")
        ? coreView.runtimeState.performanceSongIndex
        : null;
      var selectedSongTitle = coreView && coreView.runtimeState && coreView.runtimeState.performanceSongTitle
        ? coreView.runtimeState.performanceSongTitle
        : (selectedSong && selectedSong.title ? selectedSong.title : null);
      var arrangementType = performanceSong && performanceSong.arrangementType ? performanceSong.arrangementType : S.performArrangementType;
      var difficultyId = coreView && coreView.runtimeState && coreView.runtimeState.performanceDifficultyId
        ? coreView.runtimeState.performanceDifficultyId
        : S.performDifficulty;
      var speed = coreView && coreView.runtimeState && coreView.runtimeState.performanceSpeed
        ? coreView.runtimeState.performanceSpeed
        : S.performSpeed;
      var targetTechnique = coreView && coreView.runtimeState && Object.prototype.hasOwnProperty.call(coreView.runtimeState, "performanceTargetTechnique")
        ? coreView.runtimeState.performanceTargetTechnique
        : S.performTargetTechnique;
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
      S.performMode = v;
      S.performInputSource = v;
      PerformanceInput.start(v);
      if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
        window.sparkCore.syncPerformanceRuntimeState("configure", { mode: v });
      }
      saveState();
      render();
      return true;
    }

    if (a === "performDifficulty") {
      applyPerformanceDifficultyToState(v || "normal");
      if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
        window.sparkCore.syncPerformanceRuntimeState("configure", {
          difficulty: S.performDifficulty,
          songIndex: window.sparkCore.getRuntimeState().performanceSongIndex,
          songTitle: window.sparkCore.getRuntimeState().performanceSongTitle
        });
      }
      saveState();
      render();
      return true;
    }

    if (a === "performSpeed") {
      S.performSpeed = parseFloat(v);
      PerformanceTransport.setSpeed(S.performSpeed);
      if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
        window.sparkCore.syncPerformanceRuntimeState("configure", {
          speed: S.performSpeed,
          songIndex: window.sparkCore.getRuntimeState().performanceSongIndex,
          songTitle: window.sparkCore.getRuntimeState().performanceSongTitle
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
      if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
        window.sparkCore.syncPerformanceRuntimeState("configure", { preset: S.performPracticePreset });
      }
      render();
      return true;
    }

    if (a === "performCalibrate") {
      startCalibration();
      return true;
    }

    if (a === "performRetry") {
      var retryRequest = getPerformanceRetryRequest({
        chartId: S.performChartId
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
      S.performDebug = !S.performDebug;
      render();
      return true;
    }

    if (a === "performRetryPhrase") {
      if (S.performChart && S.performResults && S.performResults.phraseStats) {
        var targetTechniqueRetry = null;
        if (window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function") {
          var retryCoreView = window.sparkCore.getActiveSessionView();
          if (retryCoreView && retryCoreView.runtimeState && Object.prototype.hasOwnProperty.call(retryCoreView.runtimeState, "performanceTargetTechnique")) {
            targetTechniqueRetry = retryCoreView.runtimeState.performanceTargetTechnique;
          }
        }
        if (!targetTechniqueRetry) targetTechniqueRetry = S.performTargetTechnique || null;
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
          S.performTargetPhrase = weakIdx;
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
      act("tab", "songs");
      return true;
    }

    return false;
  }

  window.registerSparkActionFamily("performance", handlePerformanceAction);
})();
