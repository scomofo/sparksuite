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
    playAlongState.launchSession(params, playAlongActions.getInstrumentId(), requestRender, sparkPlayAlongStartLoop);
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

  // ---- Search ----

  window.sparkPlayAlongSearch = function(query) {
    return playAlongActions.searchAndRenderTracks(query);
  };

  // ---- Select Track ----

  window.sparkPlayAlongSelect = function(index) {
    return playAlongActions.handleSearchSelection(index, launchPreparedParams, sparkPlayAlongSelectWithFile);
  };

  window.sparkPlayAlongSelectWithFile = function(index, file) {
    return playAlongActions.handleSearchSelectionWithFile(index, file, launchPreparedParams);
  };

  window.sparkPlayAlongLaunchDemo = function(index) {
    return playAlongActions.handleDemoLaunch(index, launchPreparedParams);
  };

  window.sparkPlayAlongLaunchRecent = function(index) {
    return playAlongState.launchRecent(index, launchPreparedParams);
  };

  window.sparkPlayAlongSaveTrack = function(index) {
    return playAlongActions.saveSearchResultAndRender(index, requestRender);
  };

  window.sparkPlayAlongLaunchSaved = function(index) {
    return playAlongState.launchSaved(index, launchPreparedParams);
  };

  window.sparkPlayAlongRemoveSaved = function(index) {
    return renderOnSuccess(playAlongState.removeSavedTrack(index));
  };

  window.sparkPlayAlongClearSaved = function() {
    return renderOnSuccess(playAlongState.clearSavedTracks());
  };

  window.sparkPlayAlongLaunchBookmark = function(index) {
    return playAlongState.launchBookmark(index, launchPreparedParams);
  };

  window.sparkPlayAlongLaunchBookmarkByKey = function(trackId, sectionIndex) {
    return playAlongState.launchBookmarkByKey(trackId, sectionIndex, launchPreparedParams);
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
    return playAlongActions.handleLocalFileLaunch(file, launchPreparedParams);
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
    return playAlongState.replayDrill(launchPreparedParams);
  };

  window.sparkPlayAlongReplayFullSong = function() {
    return playAlongState.replayFullSong(launchPreparedParams);
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
    return playAlongState.launchWeakSection(launchPreparedParams);
  };

  window.sparkPlayAlongJumpToSectionRecommendation = function(trackId, sectionIndex) {
    return playAlongState.launchSectionRecommendation(trackId, sectionIndex, launchPreparedParams);
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
