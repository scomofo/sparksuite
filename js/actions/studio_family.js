(function() {
  function getStudioCore() {
    if (typeof window !== "undefined" && window.sparkCore) return window.sparkCore;
    if (typeof sparkCore !== "undefined") return sparkCore;
    return null;
  }

  function getStudioSessionRuntime() {
    if (typeof window !== "undefined" && window.SparkSessionRuntime) return window.SparkSessionRuntime;
    if (typeof SparkSessionRuntime !== "undefined") return SparkSessionRuntime;
    return null;
  }

  function completeRuntimePlanItem(itemId) {
    var core = getStudioCore();
    var runtime = getStudioSessionRuntime();
    var view = core && typeof core.getActiveSessionView === "function"
      ? core.getActiveSessionView()
      : null;
    var plan = view && view.plan ? view.plan : null;
    var segments = plan && Array.isArray(plan.segments) ? plan.segments : [];
    var hasSegment = false;
    var i;

    if (!itemId || !core || !runtime || !plan || plan.flow !== "daily_practice" || typeof runtime.completeSegmentById !== "function") {
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
        autoAdvance: false,
        scheduleTick: false,
        syncState: false
      });
    }

    return runtime.completeSegmentById(itemId, null, {
      autoAdvance: false
    }) !== false;
  }

  function isStudioGuidedSessionActive() {
    var core = getStudioCore();
    var view = core && typeof core.getActiveSessionView === "function"
      ? core.getActiveSessionView()
      : null;
    return !!(view &&
      view.plan &&
      view.plan.flow === "guided_session" &&
      view.runtimeState &&
      view.runtimeState.activeScreen === "guided_session");
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

  function handleStudioAction(a, v) {
    if (a === "planStartPerformanceSong") {
      var parts = String(v || "").split("|");
      var songId = parts[0] || "";
      var arrangementType = parts[1] || "chords";
      var difficultyId = parts[2] || "normal";
      setLegacyFields({ performTargetTechnique: null });
      var planSongCore = getStudioCore();
      if (planSongCore && typeof planSongCore.startSession === "function") {
        openPerformanceSongSelectionRequest({
          songId: songId,
          targetTechnique: null,
          arrangementType: arrangementType,
          difficultyId: difficultyId
        });
        setLegacyFields({ screen: SCR.PERFORM_SONG });
        render();
        return true;
      }
      for (var psi = 0; psi < SONGS.length; psi++) {
        var planSongId = typeof resolvePerformanceSongId === "function"
          ? resolvePerformanceSongId(SONGS[psi], SONGS[psi] && SONGS[psi].title)
          : (SONGS[psi].title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
        if (planSongId === songId) {
          setLegacyFields({
            performSongData: SONGS[psi],
            performSongId: songId,
            performArrangementType: arrangementType,
            performDifficulty: difficultyId,
            screen: SCR.PERFORM_SONG
          });
          render();
          return true;
        }
      }
      return true;
    }

    if (a === "planStartPerformancePhrase") {
      var phraseParts = String(v || "").split("|");
      var phraseSongId = phraseParts[0] || "";
      var phraseArrangementType = phraseParts[1] || "chords";
      var phraseDifficultyId = phraseParts[2] || "normal";
      var phraseId = phraseParts[3];
      setLegacyFields({ performTargetPhrase: phraseId != null && phraseId !== "" ? parseInt(phraseId, 10) : null });
      act("planStartPerformanceSong", phraseSongId + "|" + phraseArrangementType + "|" + phraseDifficultyId);
      return true;
    }

    if (a === "planStartPerformanceTechnique") {
      var techniqueParts = String(v || "").split("|");
      var techniqueSongId = techniqueParts[0] || "";
      var techniqueArrangementType = techniqueParts[1] || "imported_chart";
      var techniqueDifficultyId = techniqueParts[2] || "normal";
      var techniqueKey = techniqueParts[3] || null;
      setLegacyFields({ performTargetTechnique: techniqueKey });
      var techniqueCore = getStudioCore();
      if (techniqueCore && typeof techniqueCore.startSession === "function") {
        openPerformanceSongSelectionRequest({
          songId: techniqueSongId,
          arrangementType: techniqueArrangementType,
          difficultyId: techniqueDifficultyId,
          targetTechnique: techniqueKey
        });
        setLegacyFields({ screen: SCR.PERFORM_SONG });
        render();
        return true;
      }
      act("planStartPerformanceSong", techniqueSongId + "|" + techniqueArrangementType + "|" + techniqueDifficultyId);
      return true;
    }

    if (a === "openSkillTree") {
      openSkillTreeRequest();
      setLegacyFields({ screen: SCR.SKILL_TREE });
      render();
      return true;
    }

    if (a === "openLearningPath") {
      if (typeof window !== "undefined" && typeof window.SparkShowroomNavigate === "function" && typeof window.SparkPath !== "undefined") {
        window.SparkShowroomNavigate("path");
        return true;
      }
      return handleStudioAction("openSkillTree", v);
    }

    if (a === "planStartWarmup") {
      setLegacyFields({ screen: SCR.HOME, tab: TAB.PRACTICE }, false);
      render();
      return true;
    }

    if (a === "planStartTransition" && v) {
      var transitionParts = v.split("|");
      if (transitionParts.length >= 2) {
        var drillChords = [];
        var from = findChordByName(transitionParts[0]);
        var to = findChordByName(transitionParts[1]);
        if (from) drillChords.push(from);
        if (to) drillChords.push(to);
        setLegacyFields({
          drillChords: drillChords,
          drillIdx: 0,
          drillTimer: 60,
          screen: SCR.DRILL
        }, false);
        render();
      }
      return true;
    }

    if (a === "planStartRhythm") {
      setLegacyFields({
        rhythmBpm: parseInt(v, 10) || 90,
        rhythmActive: false,
        screen: SCR.HOME,
        tab: "games"
      }, false);
      render();
      return true;
    }

    if (a === "planStartModuleExercise") {
      var moduleExercise = resolveModuleExerciseLaunchOptions(v);
      var modulePayload = buildModuleExerciseRhythmPayload(moduleExercise);
      if (modulePayload && typeof startRhythmHighwayPayload === "function") {
        startRhythmHighwayPayload(modulePayload, S.rhythmHighwayPreset, {
          source: "module_exercise",
          label: moduleExercise && (moduleExercise.exerciseName || moduleExercise.lessonId || moduleExercise.skill) || "Module exercise",
          instrument: moduleExercise && moduleExercise.instrument || null,
          exerciseId: moduleExercise && moduleExercise.exerciseId || null,
          exerciseFocus: moduleExercise && (moduleExercise.exerciseFocus || moduleExercise.skill) || null
        });
        return true;
      }
      act("tab", TAB.PRACTICE);
      return true;
    }

    if (a === "planStartRhythmHighway") {
      if (typeof startRhythmHighwaySegment === "function" && startRhythmHighwaySegment(v, S.rhythmHighwayPreset)) return true;
      render();
      return true;
    }

    if (a === "rhythmHighwayPreset") {
      var nextPreset = v || "spark_learning";
      setLegacyFields({ rhythmHighwayPreset: nextPreset }, false);
      if (S.activeCoreSegmentId && typeof startRhythmHighwaySegment === "function") {
        startRhythmHighwaySegment(S.activeCoreSegmentId, nextPreset);
        return true;
      }
      render();
      return true;
    }

    if (a === "skillTreeFocus") {
      var nextFocus = v || "overview";
      setLegacyFields({ skillTreeFocus: nextFocus }, false);
      setSkillTreeFocusRequest(nextFocus);
      render();
      return true;
    }

    if (a === "openPlan") {
      if (isStudioGuidedSessionActive()) {
        setLegacyFields({ screen: SCR.GUIDED }, false);
      } else {
        if (getStudioCore()) openPracticePlanScreenRequest();
        setLegacyFields({ screen: SCR.PLAN }, false);
      }
      render();
      return true;
    }

    if (a === "completePlan") {
      if (getStudioCore()) completeDailyPracticePlanRequest();
      else completePracticePlan();
      render();
      return true;
    }

    if (a === "regeneratePlan") {
      if (getStudioCore()) openDailyPracticePlanRequest({ forceRebuild: true });
      else buildPracticePlan();
      render();
      return true;
    }

    if (a === "editorSelectEvent") {
      var selectedEventId = parseInt(v, 10);
      var selectedEventMutation = applyPerformanceEditorCoreMutation("select_event", { id: selectedEventId });
      var selectedEventChart = selectedEventMutation && selectedEventMutation.chart ? selectedEventMutation.chart : S.performEditorChart;
      var selectedEditorEvent = null;
      if (selectedEventChart && selectedEventChart.events) {
        for (var selectedIdx = 0; selectedIdx < selectedEventChart.events.length; selectedIdx++) {
          if (selectedEventChart.events[selectedIdx].id === selectedEventId) {
            selectedEditorEvent = selectedEventChart.events[selectedIdx];
            break;
          }
        }
      }
      setLegacyFields({ performEditorSelectedEventId: selectedEventId, performEditorChart: selectedEventChart }, false);
      syncPerformanceEditorDocumentState(selectedEventChart, {
        source: selectedEventChart ? "existing" : "blank",
        dirty: !!S.performEditorDirty,
        selectedEventId: selectedEventId,
        selectedEvent: selectedEditorEvent
      });
      render();
      return true;
    }

    if (a === "editorAddEvent") {
      if (S.performEditorChart) {
        var addEventMutation = applyPerformanceEditorCoreMutation("add_event", { mode: S.performEditorMode });
        var addEventChart = addEventMutation && addEventMutation.chart ? addEventMutation.chart : S.performEditorChart;
        setLegacyFields({ performEditorChart: addEventChart, performEditorDirty: true }, false);
        syncPerformanceEditorDocumentState(addEventChart, {
          source: "existing",
          dirty: true,
          selectedEventId: S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null,
          selectedEvent: null
        });
        render();
      }
      return true;
    }

    if (a === "editorDeleteEvent") {
      if (S.performEditorChart) {
        var deleteEventId = parseInt(v, 10);
        var deleteEventMutation = applyPerformanceEditorCoreMutation("delete_event", { id: deleteEventId });
        var deleteEventChart = deleteEventMutation && deleteEventMutation.chart
          ? deleteEventMutation.chart
          : Object.assign({}, S.performEditorChart, {
            events: (S.performEditorChart.events || []).filter(function(e) { return e.id !== deleteEventId; })
          });
        var nextSelectedEventId = S.performEditorSelectedEventId === deleteEventId ? null : S.performEditorSelectedEventId;
        setLegacyFields({
          performEditorChart: deleteEventChart,
          performEditorSelectedEventId: nextSelectedEventId,
          performEditorDirty: true
        }, false);
        syncPerformanceEditorDocumentState(deleteEventChart, {
          source: "existing",
          dirty: true,
          selectedEventId: nextSelectedEventId != null ? nextSelectedEventId : null,
          selectedEvent: null
        });
        render();
      }
      return true;
    }

    if (a === "editorEvt") {
      try {
        var eventPatch = JSON.parse(v);
        if (S.performEditorChart) {
          var editorMutation = applyPerformanceEditorCoreMutation("update_event", eventPatch);
          var updatedEventChart = editorMutation && editorMutation.chart ? editorMutation.chart : S.performEditorChart;
          var editedEvent = null;
          for (var ee = 0; ee < updatedEventChart.events.length; ee++) {
            if (updatedEventChart.events[ee].id === eventPatch.id) {
              editedEvent = updatedEventChart.events[ee];
              break;
            }
          }
          setLegacyFields({ performEditorChart: updatedEventChart, performEditorDirty: true }, false);
          syncPerformanceEditorDocumentState(updatedEventChart, {
            source: "existing",
            dirty: true,
            selectedEventId: S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null,
            selectedEvent: editedEvent || null
          });
          render();
        }
      } catch (e) {}
      return true;
    }

    if (a === "editorAddPhrase") {
      if (S.performEditorChart) {
        var addPhraseMutation = applyPerformanceEditorCoreMutation("add_phrase");
        var addPhraseChart = addPhraseMutation && addPhraseMutation.chart ? addPhraseMutation.chart : S.performEditorChart;
        var phrases = addPhraseChart.phrases;
        var addedPhrase = phrases[phrases.length - 1];
        setLegacyFields({ performEditorChart: addPhraseChart, performEditorDirty: true }, false);
        syncPerformanceEditorDocumentState(addPhraseChart, {
          source: "existing",
          dirty: true,
          selectedPhraseId: addedPhrase.id,
          selectedPhrase: addedPhrase
        });
        render();
      }
      return true;
    }

    if (a === "editorSelectPhrase") {
      var selectedPhraseId = parseInt(v, 10);
      var selectedPhraseMutation = applyPerformanceEditorCoreMutation("select_phrase", { id: selectedPhraseId });
      var selectedPhraseChart = selectedPhraseMutation && selectedPhraseMutation.chart ? selectedPhraseMutation.chart : S.performEditorChart;
      var selectedPhrase = null;
      if (selectedPhraseChart && selectedPhraseChart.phrases) {
        for (var phraseIndex = 0; phraseIndex < selectedPhraseChart.phrases.length; phraseIndex++) {
          if (selectedPhraseChart.phrases[phraseIndex].id === selectedPhraseId) {
            selectedPhrase = selectedPhraseChart.phrases[phraseIndex];
            break;
          }
        }
      }
      setLegacyFields({ performEditorChart: selectedPhraseChart, performEditorSelectedPhraseId: selectedPhrase ? selectedPhrase.id : null }, false);
      syncPerformanceEditorDocumentState(selectedPhraseChart, {
        source: selectedPhraseChart ? "existing" : "blank",
        dirty: !!S.performEditorDirty,
        selectedPhraseId: selectedPhrase ? selectedPhrase.id : null,
        selectedPhrase: selectedPhrase
      });
      render();
      return true;
    }

    if (a === "editorPhrase") {
      try {
        var phrasePatch = JSON.parse(v);
        var updatedPhrase = null;
        if (S.performEditorChart && S.performEditorChart.phrases) {
          var phraseMutation = applyPerformanceEditorCoreMutation("update_phrase", phrasePatch);
          var updatedPhraseChart = phraseMutation && phraseMutation.chart ? phraseMutation.chart : S.performEditorChart;
          for (var phraseEditIndex = 0; phraseEditIndex < updatedPhraseChart.phrases.length; phraseEditIndex++) {
            if (updatedPhraseChart.phrases[phraseEditIndex].id === phrasePatch.id) {
              updatedPhrase = updatedPhraseChart.phrases[phraseEditIndex];
              break;
            }
          }
          setLegacyFields({ performEditorChart: updatedPhraseChart, performEditorDirty: true }, false);
          syncPerformanceEditorDocumentState(updatedPhraseChart, {
            source: "existing",
            dirty: true,
            selectedPhraseId: updatedPhrase ? updatedPhrase.id : null,
            selectedPhrase: updatedPhrase
          });
          render();
        }
      } catch (e) {}
      return true;
    }

    if (a === "editorDeletePhrase") {
      var deletePhraseId = parseInt(v, 10);
      if (S.performEditorChart && S.performEditorChart.phrases) {
        var deletePhraseMutation = applyPerformanceEditorCoreMutation("delete_phrase", { id: deletePhraseId });
        var deletePhraseChart = deletePhraseMutation && deletePhraseMutation.chart ? deletePhraseMutation.chart : S.performEditorChart;
        setLegacyFields({
          performEditorChart: deletePhraseChart,
          performEditorSelectedPhraseId: null,
          performEditorDirty: true
        }, false);
        syncPerformanceEditorDocumentState(deletePhraseChart, {
          source: "existing",
          dirty: true,
          selectedPhraseId: null,
          selectedPhrase: null
        });
        render();
      }
      return true;
    }

    if (a === "editorSave") {
      if (S.performEditorChart) {
        var copy = JSON.parse(JSON.stringify(S.performEditorChart));
        var saveMutation = applyPerformanceEditorCoreMutation("save_to_library");
        var nextEditorLibrary;
        if (saveMutation && Array.isArray(saveMutation.library)) nextEditorLibrary = saveMutation.library;
        else {
          nextEditorLibrary = Array.isArray(S.performEditorLibrary) ? S.performEditorLibrary.slice() : [];
          var exists = -1;
          for (var si = 0; si < nextEditorLibrary.length; si++) {
            if (nextEditorLibrary[si].id === S.performEditorChart.id) {
              exists = si;
              break;
            }
          }
          if (exists >= 0) nextEditorLibrary[exists] = copy;
          else nextEditorLibrary.push(copy);
        }
        setLegacyFields({ performEditorLibrary: nextEditorLibrary, performEditorDirty: false }, false);
        syncPerformanceEditorDocumentState(copy, {
          source: "library",
          dirty: false,
          selectedEventId: S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null
        });
        saveState();
        render();
      }
      return true;
    }

    if (a === "editorLoad") {
      var idx = parseInt(v, 10);
      var loadMutation = applyPerformanceEditorCoreMutation("load_from_library", { index: idx });
      if (loadMutation && Array.isArray(loadMutation.library)) {
        setLegacyFields({ performEditorLibrary: loadMutation.library }, false);
      }
      if ((loadMutation && loadMutation.chart) || (S.performEditorLibrary && S.performEditorLibrary[idx])) {
        var loadedEditorChart = loadMutation && loadMutation.chart ? loadMutation.chart : JSON.parse(JSON.stringify(S.performEditorLibrary[idx]));
        setLegacyFields({
          performEditorChart: loadedEditorChart,
          performEditorDirty: false,
          performEditorSelectedEventId: null,
          performEditorSelectedPhraseId: null
        }, false);
        syncPerformanceEditorDocumentState(loadedEditorChart, {
          source: "library",
          dirty: false,
          selectedEventId: null,
          selectedPhraseId: null
        });
        render();
      }
      return true;
    }

    if (a === "editorDelete") {
      var di = parseInt(v, 10);
      var deleteMutation = applyPerformanceEditorCoreMutation("delete_from_library", { index: di });
      if (deleteMutation && Array.isArray(deleteMutation.library)) {
        setLegacyFields({ performEditorLibrary: deleteMutation.library }, false);
        saveState();
        render();
        return true;
      }
      if (S.performEditorLibrary && S.performEditorLibrary[di]) {
        var deletedEditorLibrary = S.performEditorLibrary.slice();
        deletedEditorLibrary.splice(di, 1);
        setLegacyFields({ performEditorLibrary: deletedEditorLibrary }, false);
        saveState();
        render();
      }
      return true;
    }

    if (a === "importSongAudio") {
      if (!window.electron || !window.electron.stems) {
        alert("Stem separation requires the desktop app.");
        return true;
      }
      var importSongId = v;
      window.electron.stems.openFile().then(function(result) {
        if (!result) return;
        setLegacyFields({ songAudioImporting: true, songAudioProgress: 0, songAudioImportingSongId: importSongId });
        render();

        var unsubProgress = window.electron.stems.onProgress(function(data) {
          if (data && data.progress != null) {
            setLegacyFields({ songAudioProgress: Math.round(data.progress) }, false);
            render();
          }
        });

        window.electron.stems.checkCache(result.filePath).then(function(cached) {
          if (cached) return cached;
          return window.electron.stems.separate(result.filePath);
        }).then(function(stemPaths) {
          unsubProgress();
          if (!stemPaths) {
            setLegacyFields({ songAudioImporting: false });
            render();
            return;
          }

          var stemNames = Object.keys(stemPaths);
          var urlMap = {};

          function loadNextUrl(idx) {
            if (idx >= stemNames.length) {
              S.songAudioData[importSongId] = {
                mp3Path: result.filePath,
                detectedBpm: null,
                stemPaths: stemPaths,
                stemUrls: urlMap,
                importedAt: new Date().toISOString()
              };
              setLegacyFields({ songAudioImporting: false, songAudioProgress: 0 }, false);
              saveState();
              render();
              return;
            }
            var name = stemNames[idx];
            window.electron.stems.getFileUrl(stemPaths[name]).then(function(url) {
              urlMap[name] = url;
              loadNextUrl(idx + 1);
            });
          }
          loadNextUrl(0);
        }).catch(function(err) {
          unsubProgress();
          setLegacyFields({ songAudioImporting: false, songAudioProgress: 0 });
          alert("Stem separation failed: " + (err.message || err));
          render();
        });
      });
      return true;
    }

    if (a === "removeSongAudio") {
      delete S.songAudioData[v];
      saveState();
      render();
      return true;
    }

    if (a === "completePlanItem") {
      if (!completeRuntimePlanItem(v) && getStudioCore()) completeDailyPracticePlanRequest({ itemId: v });
      else if (typeof markPracticePlanItem === "function") markPracticePlanItem(v);
      render();
      return true;
    }

    if (a === "rhythmHighwayLane") {
      var laneMask = (1 << parseInt(v, 10));
      var nextHeldMask = (S.rhythmHighwayHeldMask & laneMask) ? (S.rhythmHighwayHeldMask & ~laneMask) : (S.rhythmHighwayHeldMask | laneMask);
      setLegacyFields({ rhythmHighwayHeldMask: nextHeldMask }, false);
      render();
      return true;
    }

    if (a === "rhythmHighwayStrum") {
      if (typeof _sparkRhythmHighwayStrum === "function") _sparkRhythmHighwayStrum();
      render();
      return true;
    }

    if (a === "rhythmHighwayLoopWindow") {
      if (typeof _createRhythmHighwayLoopSpec === "function" && S.activeCoreSegmentId) {
        var studioCore = getStudioCore();
        var segment = studioCore && typeof studioCore.getSegmentById === "function" ? studioCore.getSegmentById(S.activeCoreSegmentId) : null;
        var payload = segment && segment.meta ? segment.meta.gameplayPayload : null;
        var loopSpec = _createRhythmHighwayLoopSpec(payload, S.rhythmHighwaySnapshot);
        if (loopSpec && typeof startRhythmHighwaySegment === "function") {
          setLegacyFields({ rhythmHighwayLoop: loopSpec }, false);
          startRhythmHighwaySegment(S.activeCoreSegmentId, S.rhythmHighwayPreset, loopSpec);
          return true;
        }
      }
      render();
      return true;
    }

    if (a === "rhythmHighwayClearLoop") {
      setLegacyFields({ rhythmHighwayLoop: null }, false);
      if (S.activeCoreSegmentId && typeof startRhythmHighwaySegment === "function") {
        startRhythmHighwaySegment(S.activeCoreSegmentId, S.rhythmHighwayPreset, null);
        return true;
      }
      render();
      return true;
    }

    if (a === "restartRhythmHighway") {
      if (S.activeCoreSegmentId && typeof startRhythmHighwaySegment === "function") {
        startRhythmHighwaySegment(S.activeCoreSegmentId, S.rhythmHighwayPreset, S.rhythmHighwayLoop);
      }
      return true;
    }

    return false;
  }

  window.registerSparkActionFamily("studio", handleStudioAction);
})();
