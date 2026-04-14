// ===== SparkSuite: Play Along Controller =====
// Glue layer connecting play-along page UI to SparkCore play-along pipeline.
(function() {
  var playAlongState = new SparkPlayAlongStateService();
  var playAlongActions = new SparkPlayAlongActionService(playAlongState);
  var playAlongRenderer = new SparkPlayAlongRenderer(playAlongState);

  function requestRender() {
    if (typeof render === "function") render();
  }

  function launchPreparedParams(params) {
    if (!params) return false;
    launchPlayAlongSession(params);
    return true;
  }

  function launchFrom(factory) {
    var params = typeof factory === "function" ? factory() : factory;
    return launchPreparedParams(params);
  }

  function renderOnSuccess(changed) {
    if (!changed) return false;
    requestRender();
    return true;
  }

  function renderAfter(action) {
    var result = typeof action === "function" ? action() : action;
    requestRender();
    return result;
  }

  function showHomeAndRender() {
    playAlongState.showHomeScreen();
    requestRender();
    return true;
  }

  function launchSearchSelection(index, overrides) {
    return launchFrom(function() {
      return playAlongActions.prepareSearchLaunch(index, overrides);
    });
  }

  function stepSection(delta) {
    return playAlongState.stepSection(delta, requestRender);
  }

  // ---- Search ----

  window.sparkPlayAlongSearch = function(query) {
    return playAlongActions.searchAndRenderTracks(query);
  };

  // ---- Select Track ----

  window.sparkPlayAlongSelect = function(index) {
    if (playAlongActions.shouldUseCachedSearchChart(index)) {
      launchSearchSelection(index);
      return;
    }

    return playAlongActions.showSearchUploadPromptForIndex(index, sparkPlayAlongSelectWithFile, function(params) {
      launchPreparedParams(params);
    });
  };

  window.sparkPlayAlongSelectWithFile = function(index, file) {
    if (!file) return;
    return launchSearchSelection(index, {
      audioFile: file,
    });
  };

  window.sparkPlayAlongLaunchDemo = function(index) {
    return launchFrom(function() {
      return playAlongState.prepareFreshLaunch(playAlongActions.getDemoLaunchParams(index));
    });
  };

  window.sparkPlayAlongLaunchRecent = function(index) {
    return launchFrom(function() {
      return playAlongState.prepareRecentLaunch(index);
    });
  };

  window.sparkPlayAlongSaveTrack = function(index) {
    return playAlongActions.saveSearchResult(index).then(function(saved) {
      if (saved) requestRender();
      return saved;
    });
  };

  window.sparkPlayAlongLaunchSaved = function(index) {
    return launchFrom(function() {
      return playAlongState.prepareSavedLaunch(index);
    });
  };

  window.sparkPlayAlongRemoveSaved = function(index) {
    return renderOnSuccess(playAlongState.removeSavedTrack(index));
  };

  window.sparkPlayAlongClearSaved = function() {
    return renderOnSuccess(playAlongState.clearSavedTracks());
  };

  window.sparkPlayAlongLaunchBookmark = function(index) {
    return launchFrom(function() {
      return playAlongState.prepareBookmarkLaunchByIndex(index);
    });
  };

  window.sparkPlayAlongLaunchBookmarkByKey = function(trackId, sectionIndex) {
    return launchFrom(function() {
      return playAlongState.prepareBookmarkLaunchByKey(trackId, sectionIndex);
    });
  };

  window.sparkPlayAlongRemoveRecent = function(index) {
    return renderOnSuccess(playAlongState.removeRecent(index));
  };

  window.sparkPlayAlongClearRecent = function() {
    return renderOnSuccess(playAlongState.clearRecent());
  };

  window.sparkPlayAlongRemoveBookmark = function(index) {
    return renderOnSuccess(playAlongState.removeBookmark(index));
  };

  window.sparkPlayAlongClearBookmarks = function() {
    return renderOnSuccess(playAlongState.clearBookmarks());
  };

  // ---- Set Difficulty ----

  window.sparkPlayAlongSetDifficulty = function(level) {
    return renderAfter(function() {
      return playAlongActions.setDifficulty(level);
    });
  };

  // ---- Load Local File ----

  window.sparkPlayAlongLoadFile = function(file) {
    if (!file) return;
    return launchFrom(function() {
      return playAlongState.prepareLocalFileLaunch(file, playAlongActions.getInstrumentId());
    });
  };

  // ---- Game Loop ----

  window.sparkPlayAlongStartLoop = function() {
    playAlongState.startRenderLoop({
      enforceLoopWindow: enforceLoopWindow,
      onFrame: function(result) {
        playAlongRenderer.renderFrame(result, playAlongState.getActiveChart());
      }
    });
  };

  // ---- Stop ----

  window.sparkPlayAlongStop = function() {
    playAlongState.stopSessionForResults();
    renderAfter(true);
    playAlongRenderer.scheduleResultsHeatmap();
  };

  // ---- Toggle Debug ----

  window.sparkPlayAlongToggleDebug = function() {
    window._playAlongDebug = !window._playAlongDebug;

    if (window._playAlongDebug && typeof SparkDebugDashboard !== "undefined") {
      window._playAlongDashboard = new SparkDebugDashboard(document.body);
      window._playAlongDashboard.show();
    } else if (!window._playAlongDebug && window._playAlongDashboard) {
      window._playAlongDashboard.hide();
    }
  };

  // ---- Play Again ----

  window.sparkPlayAlongAgain = function() {
    var params = playAlongState.getReplayParams();
    if (launchFrom(params)) return;
    showHomeAndRender();
  };

  window.sparkPlayAlongReplay = function() {
    return window.sparkPlayAlongAgain();
  };

  window.sparkPlayAlongReplayDrill = function() {
    var drills = playAlongState.getOutcomeDrills();
    if (drills.length > 0) {
      return window.sparkPlayAlongStartDrill(0);
    }
    return window.sparkPlayAlongReplay();
  };

  window.sparkPlayAlongReplayFullSong = function() {
    return launchFrom(function() {
      return playAlongState.prepareFullSongReplayLaunch();
    });
  };

  window.sparkPlayAlongTogglePause = function() {
    return renderAfter(function() {
      return playAlongState.togglePauseTransport();
    });
  };

  window.sparkPlayAlongToggleLoop = function() {
    playAlongState.clearError();
    return renderAfter(function() {
      playAlongState.toggleLoop();
      return playAlongState.isLoopEnabled();
    });
  };

  window.sparkPlayAlongSetLoopTarget = function(target) {
    return renderOnSuccess(playAlongState.setLoopTarget(target));
  };

  window.sparkPlayAlongPrevSection = function() {
    return stepSection(-1);
  };

  window.sparkPlayAlongNextSection = function() {
    return stepSection(1);
  };

  window.sparkPlayAlongBookmarkCurrentSection = function() {
    return renderOnSuccess(playAlongState.saveCurrentSectionBookmark());
  };

  window.sparkPlayAlongJumpToWeakSection = function() {
    return launchFrom(function() {
      return playAlongState.prepareWeakSectionLaunch();
    });
  };

  window.sparkPlayAlongJumpToSectionRecommendation = function(trackId, sectionIndex) {
    return launchFrom(function() {
      return playAlongState.prepareSectionRecommendationLaunch(trackId, sectionIndex);
    });
  };

  window.sparkPlayAlongPickNew = function() {
    playAlongState.resetSelectedDrillState();
    showHomeAndRender();
  };

  window.sparkPlayAlongStartDrill = function(index) {
    var params = playAlongState.prepareDrillLaunch(index);
    if (params) return launchFrom(params);
    if (params === null) return false;
    playAlongState.writeValue("screen", SCR.PLAY_ALONG);
    requestRender();
    return true;
  };

  // ---- Navigation Helper ----

  window.openPlayAlong = function() {
    showHomeAndRender();
  };

  function launchPlayAlongSession(params) {
    if (!params) return Promise.resolve(false);
    if (!params.instrument) params.instrument = playAlongActions.getInstrumentId();
    return playAlongState.beginSessionLaunch(params).then(function(started) {
      if (!started) return false;
      return playAlongState.activateStartedSession(requestRender, sparkPlayAlongStartLoop);
    }).catch(function(err) {
      console.error("[PlayAlong] Failed:", err);
      playAlongState.setError(err);
      showHomeAndRender();
      return false;
    });
  }

  function enforceLoopWindow() {
    return playAlongState.enforceLoopWindow(sparkPlayAlongStop);
  }

  // ---- Spotify Connect ----

  window.sparkPlayAlongConnectSpotify = function() {
    return playAlongActions.connectSpotify(requestRender);
  };

  window.sparkPlayAlongSaveClientId = function() {
    return playAlongActions.saveSpotifyClientIdAndConnect(requestRender);
  };

  // Handle spotifyConnect action from act() dispatcher
  window.handleSpotifyConnectAction = window.sparkPlayAlongConnectSpotify;

})();
