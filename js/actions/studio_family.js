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

  function handleStudioAction(a, v) {
    if (a === "planStartPerformanceSong") {
      var parts = String(v || "").split("|");
      var songId = parts[0] || "";
      var arrangementType = parts[1] || "chords";
      var difficultyId = parts[2] || "normal";
      setLegacyFields({ performTargetTechnique: null });
      if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
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
        var planSongId = (SONGS[psi].title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
        if (planSongId === songId) {
          S.performSongData = SONGS[psi];
          S.performSongId = songId;
          S.performArrangementType = arrangementType;
          S.performDifficulty = difficultyId;
          setLegacyFields({ screen: SCR.PERFORM_SONG });
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
      if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
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

    if (a === "planStartWarmup") {
      S.screen = SCR.HOME;
      S.tab = TAB.PRACTICE;
      render();
      return true;
    }

    if (a === "planStartTransition" && v) {
      var transitionParts = v.split("|");
      if (transitionParts.length >= 2) {
        S.drillChords = [];
        var from = findChordByName(transitionParts[0]);
        var to = findChordByName(transitionParts[1]);
        if (from) S.drillChords.push(from);
        if (to) S.drillChords.push(to);
        S.drillIdx = 0;
        S.drillTimer = 60;
        S.screen = SCR.DRILL;
        render();
      }
      return true;
    }

    if (a === "planStartRhythm") {
      S.rhythmBpm = parseInt(v, 10) || 90;
      S.rhythmActive = false;
      S.screen = SCR.HOME;
      S.tab = "games";
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
      S.rhythmHighwayPreset = v || "spark_learning";
      if (S.activeCoreSegmentId && typeof startRhythmHighwaySegment === "function") {
        startRhythmHighwaySegment(S.activeCoreSegmentId, S.rhythmHighwayPreset);
        return true;
      }
      render();
      return true;
    }

    if (a === "skillTreeFocus") {
      S.skillTreeFocus = v || "overview";
      setSkillTreeFocusRequest(S.skillTreeFocus);
      render();
      return true;
    }

    if (a === "openPlan") {
      if (window.sparkCore) openPracticePlanScreenRequest();
      S.screen = SCR.PLAN;
      render();
      return true;
    }

    if (a === "completePlan") {
      if (window.sparkCore) completeDailyPracticePlanRequest();
      else completePracticePlan();
      render();
      return true;
    }

    if (a === "regeneratePlan") {
      if (window.sparkCore) openDailyPracticePlanRequest({ forceRebuild: true });
      else buildPracticePlan();
      render();
      return true;
    }

    if (a === "editorSelectEvent") {
      S.performEditorSelectedEventId = parseInt(v, 10);
      var selectedEventMutation = applyPerformanceEditorCoreMutation("select_event", { id: S.performEditorSelectedEventId });
      if (selectedEventMutation && selectedEventMutation.chart) S.performEditorChart = selectedEventMutation.chart;
      var selectedEditorEvent = null;
      if (S.performEditorChart && S.performEditorChart.events) {
        for (var selectedIdx = 0; selectedIdx < S.performEditorChart.events.length; selectedIdx++) {
          if (S.performEditorChart.events[selectedIdx].id === S.performEditorSelectedEventId) {
            selectedEditorEvent = S.performEditorChart.events[selectedIdx];
            break;
          }
        }
      }
      syncPerformanceEditorDocumentState(S.performEditorChart, {
        source: S.performEditorChart ? "existing" : "blank",
        dirty: !!S.performEditorDirty,
        selectedEventId: S.performEditorSelectedEventId,
        selectedEvent: selectedEditorEvent
      });
      render();
      return true;
    }

    if (a === "editorAddEvent") {
      if (S.performEditorChart) {
        var addEventMutation = applyPerformanceEditorCoreMutation("add_event", { mode: S.performEditorMode });
        if (addEventMutation && addEventMutation.chart) S.performEditorChart = addEventMutation.chart;
        syncPerformanceEditorDocumentState(S.performEditorChart, {
          source: "existing",
          dirty: true,
          selectedEventId: S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null,
          selectedEvent: null
        });
        S.performEditorDirty = true;
        render();
      }
      return true;
    }

    if (a === "editorDeleteEvent") {
      if (S.performEditorChart) {
        var deleteEventId = parseInt(v, 10);
        var deleteEventMutation = applyPerformanceEditorCoreMutation("delete_event", { id: deleteEventId });
        if (deleteEventMutation && deleteEventMutation.chart) S.performEditorChart = deleteEventMutation.chart;
        else S.performEditorChart.events = S.performEditorChart.events.filter(function(e) { return e.id !== deleteEventId; });
        if (S.performEditorSelectedEventId === deleteEventId) S.performEditorSelectedEventId = null;
        syncPerformanceEditorDocumentState(S.performEditorChart, {
          source: "existing",
          dirty: true,
          selectedEventId: S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null,
          selectedEvent: null
        });
        S.performEditorDirty = true;
        render();
      }
      return true;
    }

    if (a === "editorEvt") {
      try {
        var eventPatch = JSON.parse(v);
        if (S.performEditorChart) {
          var editorMutation = applyPerformanceEditorCoreMutation("update_event", eventPatch);
          var editedEvent = null;
          if (editorMutation && editorMutation.chart) S.performEditorChart = editorMutation.chart;
          for (var ee = 0; ee < S.performEditorChart.events.length; ee++) {
            if (S.performEditorChart.events[ee].id === eventPatch.id) {
              editedEvent = S.performEditorChart.events[ee];
              break;
            }
          }
          syncPerformanceEditorDocumentState(S.performEditorChart, {
            source: "existing",
            dirty: true,
            selectedEventId: S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null,
            selectedEvent: editedEvent || null
          });
          S.performEditorDirty = true;
          render();
        }
      } catch (e) {}
      return true;
    }

    if (a === "editorAddPhrase") {
      if (S.performEditorChart) {
        var addPhraseMutation = applyPerformanceEditorCoreMutation("add_phrase");
        if (addPhraseMutation && addPhraseMutation.chart) S.performEditorChart = addPhraseMutation.chart;
        var phrases = S.performEditorChart.phrases;
        var addedPhrase = phrases[phrases.length - 1];
        syncPerformanceEditorDocumentState(S.performEditorChart, {
          source: "existing",
          dirty: true,
          selectedPhraseId: addedPhrase.id,
          selectedPhrase: addedPhrase
        });
        S.performEditorDirty = true;
        render();
      }
      return true;
    }

    if (a === "editorSelectPhrase") {
      var selectedPhraseId = parseInt(v, 10);
      var selectedPhraseMutation = applyPerformanceEditorCoreMutation("select_phrase", { id: selectedPhraseId });
      if (selectedPhraseMutation && selectedPhraseMutation.chart) S.performEditorChart = selectedPhraseMutation.chart;
      var selectedPhrase = null;
      if (S.performEditorChart && S.performEditorChart.phrases) {
        for (var phraseIndex = 0; phraseIndex < S.performEditorChart.phrases.length; phraseIndex++) {
          if (S.performEditorChart.phrases[phraseIndex].id === selectedPhraseId) {
            selectedPhrase = S.performEditorChart.phrases[phraseIndex];
            break;
          }
        }
      }
      syncPerformanceEditorDocumentState(S.performEditorChart, {
        source: S.performEditorChart ? "existing" : "blank",
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
          if (phraseMutation && phraseMutation.chart) S.performEditorChart = phraseMutation.chart;
          for (var phraseEditIndex = 0; phraseEditIndex < S.performEditorChart.phrases.length; phraseEditIndex++) {
            if (S.performEditorChart.phrases[phraseEditIndex].id === phrasePatch.id) {
              updatedPhrase = S.performEditorChart.phrases[phraseEditIndex];
              break;
            }
          }
          syncPerformanceEditorDocumentState(S.performEditorChart, {
            source: "existing",
            dirty: true,
            selectedPhraseId: updatedPhrase ? updatedPhrase.id : null,
            selectedPhrase: updatedPhrase
          });
          S.performEditorDirty = true;
          render();
        }
      } catch (e) {}
      return true;
    }

    if (a === "editorDeletePhrase") {
      var deletePhraseId = parseInt(v, 10);
      if (S.performEditorChart && S.performEditorChart.phrases) {
        var deletePhraseMutation = applyPerformanceEditorCoreMutation("delete_phrase", { id: deletePhraseId });
        if (deletePhraseMutation && deletePhraseMutation.chart) S.performEditorChart = deletePhraseMutation.chart;
        syncPerformanceEditorDocumentState(S.performEditorChart, {
          source: "existing",
          dirty: true,
          selectedPhraseId: null,
          selectedPhrase: null
        });
        S.performEditorDirty = true;
        render();
      }
      return true;
    }

    if (a === "editorSave") {
      if (S.performEditorChart) {
        var copy = JSON.parse(JSON.stringify(S.performEditorChart));
        var saveMutation = applyPerformanceEditorCoreMutation("save_to_library");
        if (saveMutation && Array.isArray(saveMutation.library)) syncPerformanceEditorLibraryState(saveMutation.library);
        else {
          if (!Array.isArray(S.performEditorLibrary)) S.performEditorLibrary = [];
          var exists = -1;
          for (var si = 0; si < S.performEditorLibrary.length; si++) {
            if (S.performEditorLibrary[si].id === S.performEditorChart.id) {
              exists = si;
              break;
            }
          }
          if (exists >= 0) S.performEditorLibrary[exists] = copy;
          else S.performEditorLibrary.push(copy);
        }
        syncPerformanceEditorDocumentState(copy, {
          source: "library",
          dirty: false,
          selectedEventId: S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null
        });
        S.performEditorDirty = false;
        saveState();
        render();
      }
      return true;
    }

    if (a === "editorLoad") {
      var idx = parseInt(v, 10);
      var loadMutation = applyPerformanceEditorCoreMutation("load_from_library", { index: idx });
      if (loadMutation && Array.isArray(loadMutation.library)) syncPerformanceEditorLibraryState(loadMutation.library);
      if ((loadMutation && loadMutation.chart) || (S.performEditorLibrary && S.performEditorLibrary[idx])) {
        S.performEditorChart = loadMutation && loadMutation.chart ? loadMutation.chart : JSON.parse(JSON.stringify(S.performEditorLibrary[idx]));
        syncPerformanceEditorDocumentState(S.performEditorChart, {
          source: "library",
          dirty: false,
          selectedEventId: null,
          selectedPhraseId: null
        });
        S.performEditorDirty = false;
        S.performEditorSelectedEventId = null;
        render();
      }
      return true;
    }

    if (a === "editorDelete") {
      var di = parseInt(v, 10);
      var deleteMutation = applyPerformanceEditorCoreMutation("delete_from_library", { index: di });
      if (deleteMutation && Array.isArray(deleteMutation.library)) {
        syncPerformanceEditorLibraryState(deleteMutation.library);
        saveState();
        render();
        return true;
      }
      if (S.performEditorLibrary && S.performEditorLibrary[di]) {
        S.performEditorLibrary.splice(di, 1);
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
      if (window.sparkCore) completeDailyPracticePlanRequest({ itemId: v });
      else if (typeof markPracticePlanItem === "function") markPracticePlanItem(v);
      render();
      return true;
    }

    if (a === "rhythmHighwayLane") {
      var laneMask = (1 << parseInt(v, 10));
      S.rhythmHighwayHeldMask = (S.rhythmHighwayHeldMask & laneMask) ? (S.rhythmHighwayHeldMask & ~laneMask) : (S.rhythmHighwayHeldMask | laneMask);
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
        var segment = window.sparkCore && typeof window.sparkCore.getSegmentById === "function" ? window.sparkCore.getSegmentById(S.activeCoreSegmentId) : null;
        var payload = segment && segment.meta ? segment.meta.gameplayPayload : null;
        var loopSpec = _createRhythmHighwayLoopSpec(payload, S.rhythmHighwaySnapshot);
        if (loopSpec && typeof startRhythmHighwaySegment === "function") {
          S.rhythmHighwayLoop = loopSpec;
          startRhythmHighwaySegment(S.activeCoreSegmentId, S.rhythmHighwayPreset, loopSpec);
          return true;
        }
      }
      render();
      return true;
    }

    if (a === "rhythmHighwayClearLoop") {
      S.rhythmHighwayLoop = null;
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
