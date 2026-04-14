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

  // ---- Search ----

  window.sparkPlayAlongSearch = function(query) {
    var resultsEl = playAlongActions.getSearchResultsContainer();
    if (!playAlongActions.searchTracks(query, function(tracks) {
      playAlongActions.renderSearchResults(resultsEl, tracks);
    })) {
      playAlongActions.clearSearchResultsMarkup(resultsEl);
    }
  };

  // ---- Select Track ----

  window.sparkPlayAlongSelect = function(index) {
    if (playAlongActions.shouldUseCachedSearchChart(index)) {
      launchPreparedParams(playAlongActions.prepareSearchLaunch(index));
      return;
    }

    var resultsEl = playAlongActions.getSearchResultsContainer();
    if (!resultsEl) return;
    playAlongActions.showSearchUploadPrompt(resultsEl, index, sparkPlayAlongSelectWithFile, function(params) {
      launchPreparedParams(params);
    });
  };

  window.sparkPlayAlongSelectWithFile = function(index, file) {
    var params;
    if (!file) return;
    params = playAlongActions.prepareSearchLaunch(index, {
      audioFile: file,
    });
    launchPreparedParams(params);
  };

  window.sparkPlayAlongLaunchDemo = function(index) {
    return launchPreparedParams(
      playAlongState.prepareFreshLaunch(playAlongActions.getDemoLaunchParams(index))
    );
  };

  window.sparkPlayAlongLaunchRecent = function(index) {
    return launchPreparedParams(playAlongState.prepareRecentLaunch(index));
  };

  window.sparkPlayAlongSaveTrack = function(index) {
    return playAlongActions.saveSearchResult(index).then(function(saved) {
      if (saved) requestRender();
      return saved;
    });
  };

  window.sparkPlayAlongLaunchSaved = function(index) {
    return launchPreparedParams(playAlongState.prepareSavedLaunch(index));
  };

  window.sparkPlayAlongRemoveSaved = function(index) {
    return renderOnSuccess(playAlongState.removeSavedTrack(index));
  };

  window.sparkPlayAlongClearSaved = function() {
    return renderOnSuccess(playAlongState.clearSavedTracks());
  };

  window.sparkPlayAlongLaunchBookmark = function(index) {
    return launchPreparedParams(playAlongState.prepareBookmarkLaunchByIndex(index));
  };

  window.sparkPlayAlongLaunchBookmarkByKey = function(trackId, sectionIndex) {
    return launchPreparedParams(playAlongState.prepareBookmarkLaunchByKey(trackId, sectionIndex));
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
    var params;
    if (!file) return;
    params = playAlongState.prepareLocalFileLaunch(file, playAlongActions.getInstrumentId());
    return launchPreparedParams(params);
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
    playAlongState.stopRenderLoop();
    playAlongState.completeSessionForResults();
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
    if (launchPreparedParams(params)) return;
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
    return launchPreparedParams(playAlongState.prepareFullSongReplayLaunch());
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
    return playAlongState.stepSection(-1, requestRender);
  };

  window.sparkPlayAlongNextSection = function() {
    return playAlongState.stepSection(1, requestRender);
  };

  window.sparkPlayAlongBookmarkCurrentSection = function() {
    var bookmark = playAlongState.buildCurrentSectionBookmark();
    if (!bookmark) return false;
    playAlongState.rememberBookmark(bookmark);
    return renderOnSuccess(true);
  };

  window.sparkPlayAlongJumpToWeakSection = function() {
    return launchPreparedParams(playAlongState.prepareWeakSectionLaunch());
  };

  window.sparkPlayAlongJumpToSectionRecommendation = function(trackId, sectionIndex) {
    return launchPreparedParams(playAlongState.prepareSectionRecommendationLaunch(trackId, sectionIndex));
  };

  window.sparkPlayAlongPickNew = function() {
    playAlongState.resetSelectedDrillState();
    showHomeAndRender();
  };

  window.sparkPlayAlongStartDrill = function(index) {
    var params = playAlongState.prepareDrillLaunch(index);
    if (params) return launchPreparedParams(params);
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
      playAlongState.showSessionScreen();
      playAlongState.applySelectedDrillState();
      requestRender();
      sparkPlayAlongStartLoop();
      return true;
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
