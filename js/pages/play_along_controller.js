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

  // ---- Search ----

  window.sparkPlayAlongSearch = function(query) {
    return playAlongActions.searchAndRenderTracks(query);
  };

  // ---- Select Track ----

  window.sparkPlayAlongSelect = function(index) {
    return playAlongActions.handleSearchSelection(index, function(params) {
      launchPreparedParams(params);
    }, sparkPlayAlongSelectWithFile);
  };

  window.sparkPlayAlongSelectWithFile = function(index, file) {
    return playAlongActions.handleSearchSelectionWithFile(index, file, function(params) {
      launchPreparedParams(params);
    });
  };

  window.sparkPlayAlongLaunchDemo = function(index) {
    return playAlongActions.handleDemoLaunch(index, function(params) {
      launchPreparedParams(params);
    });
  };

  window.sparkPlayAlongLaunchRecent = function(index) {
    return launchFrom(function() {
      return playAlongState.prepareRecentLaunch(index);
    });
  };

  window.sparkPlayAlongSaveTrack = function(index) {
    return playAlongActions.saveSearchResultAndRender(index, requestRender);
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
    return playAlongActions.handleLocalFileLaunch(file, function(params) {
      launchPreparedParams(params);
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
    return playAlongRenderer.finishSessionResults(function() {
      playAlongState.stopSessionForResults();
    }, requestRender);
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
    return playAlongState.replayOrShowHome(launchPreparedParams, requestRender);
  };

  window.sparkPlayAlongReplay = function() {
    return window.sparkPlayAlongAgain();
  };

  window.sparkPlayAlongReplayDrill = function() {
    return launchFrom(function() {
      return playAlongState.prepareReplayDrillLaunch();
    });
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
    return playAlongState.prevSection(requestRender);
  };

  window.sparkPlayAlongNextSection = function() {
    return playAlongState.nextSection(requestRender);
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
    return playAlongState.resetToHome(requestRender);
  };

  window.sparkPlayAlongStartDrill = function(index) {
    return playAlongState.startDrill(index, launchPreparedParams, requestRender);
  };

  // ---- Navigation Helper ----

  window.openPlayAlong = function() {
    return playAlongState.showHome(requestRender);
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
      playAlongState.showHome(requestRender);
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
