// ===== SparkSuite: Play Along Controller =====
// Glue layer connecting play-along page UI to SparkCore play-along pipeline.
(function() {
  var playAlongState = new SparkPlayAlongStateService();
  var playAlongActions = new SparkPlayAlongActionService(playAlongState);
  var playAlongRenderer = new SparkPlayAlongRenderer(playAlongState);

  function requestRender() {
    if (typeof render === "function") render();
  }

  function withRender(fn, context) {
    return function(value) {
      return fn.call(context, value, requestRender);
    };
  }

  function withLaunch(fn, context) {
    return function(value) {
      return fn.call(context, value, launchPreparedParams);
    };
  }

  function withLaunchAndRender(fn, context) {
    return function(value) {
      return fn.call(context, value, launchPreparedParams, requestRender);
    };
  }

  function withLaunchPair(fn, context) {
    return function(first, second) {
      return fn.call(context, first, second, launchPreparedParams);
    };
  }

  window.sparkPlayAlongStop = playAlongRenderer.finishSessionResults.bind(playAlongRenderer, requestRender);
  window.sparkPlayAlongStartLoop = playAlongRenderer.startSessionLoop.bind(playAlongRenderer, window.sparkPlayAlongStop);

  var launchPreparedParams = playAlongActions.createLaunchHandler(requestRender, sparkPlayAlongStartLoop);
  window.sparkPlayAlongSelectWithFile = playAlongActions.createSearchSelectionWithFileHandler(launchPreparedParams);
  window.sparkPlayAlongSelect = playAlongActions.createSearchSelectionHandler(launchPreparedParams, window.sparkPlayAlongSelectWithFile);

  // ---- Search ----

  window.sparkPlayAlongSearch = playAlongActions.searchAndRenderTracks.bind(playAlongActions);

  // ---- Select Track ----

  window.sparkPlayAlongLaunchDemo = withLaunch(playAlongActions.handleDemoLaunch, playAlongActions);

  window.sparkPlayAlongLaunchRecent = withLaunch(playAlongState.launchRecent, playAlongState);

  window.sparkPlayAlongSaveTrack = withRender(playAlongActions.saveSearchResultAndRender, playAlongActions);

  window.sparkPlayAlongLaunchSaved = withLaunch(playAlongState.launchSaved, playAlongState);

  window.sparkPlayAlongRemoveSaved = withRender(playAlongState.removeSavedTrackWithRender, playAlongState);

  window.sparkPlayAlongClearSaved = playAlongState.clearSavedTracksWithRender.bind(playAlongState, requestRender);

  window.sparkPlayAlongLaunchBookmark = withLaunch(playAlongState.launchBookmark, playAlongState);

  window.sparkPlayAlongLaunchBookmarkByKey = withLaunchPair(playAlongState.launchBookmarkByKey, playAlongState);

  window.sparkPlayAlongRemoveRecent = withRender(playAlongState.removeRecentWithRender, playAlongState);

  window.sparkPlayAlongClearRecent = playAlongState.clearRecentWithRender.bind(playAlongState, requestRender);

  window.sparkPlayAlongRemoveBookmark = withRender(playAlongState.removeBookmarkWithRender, playAlongState);

  window.sparkPlayAlongClearBookmarks = playAlongState.clearBookmarksWithRender.bind(playAlongState, requestRender);

  // ---- Set Difficulty ----

  window.sparkPlayAlongSetDifficulty = withRender(playAlongActions.setDifficultyAndRender, playAlongActions);

  // ---- Load Local File ----

  window.sparkPlayAlongLoadFile = withLaunch(playAlongActions.handleLocalFileLaunch, playAlongActions);

  // ---- Toggle Debug ----

  window.sparkPlayAlongToggleDebug = playAlongActions.toggleDebugDashboard.bind(playAlongActions);

  // ---- Play Again ----

  window.sparkPlayAlongAgain = playAlongState.replayOrShowHome.bind(playAlongState, launchPreparedParams, requestRender);

  window.sparkPlayAlongReplay = window.sparkPlayAlongAgain;

  window.sparkPlayAlongReplayDrill = playAlongState.replayDrill.bind(playAlongState, launchPreparedParams);

  window.sparkPlayAlongReplayFullSong = playAlongState.replayFullSong.bind(playAlongState, launchPreparedParams);

  window.sparkPlayAlongTogglePause = playAlongState.togglePause.bind(playAlongState, requestRender);

  window.sparkPlayAlongToggleLoop = playAlongState.toggleLoopWithRender.bind(playAlongState, requestRender);

  window.sparkPlayAlongSetLoopTarget = withRender(playAlongState.setLoopTargetWithRender, playAlongState);

  window.sparkPlayAlongPrevSection = playAlongState.prevSection.bind(playAlongState, requestRender);

  window.sparkPlayAlongNextSection = playAlongState.nextSection.bind(playAlongState, requestRender);

  window.sparkPlayAlongBookmarkCurrentSection = playAlongState.saveCurrentSectionBookmarkWithRender.bind(playAlongState, requestRender);

  window.sparkPlayAlongJumpToWeakSection = playAlongState.launchWeakSection.bind(playAlongState, launchPreparedParams);

  window.sparkPlayAlongJumpToSectionRecommendation = withLaunchPair(playAlongState.launchSectionRecommendation, playAlongState);

  window.sparkPlayAlongPickNew = playAlongState.resetToHome.bind(playAlongState, requestRender);

  window.sparkPlayAlongStartDrill = withLaunchAndRender(playAlongState.startDrill, playAlongState);

  // ---- Navigation Helper ----

  window.openPlayAlong = playAlongState.showHome.bind(playAlongState, requestRender);

  // ---- Spotify Connect ----

  window.sparkPlayAlongConnectSpotify = playAlongActions.connectSpotifyAndRender.bind(playAlongActions, requestRender);

  window.sparkPlayAlongSaveClientId = playAlongActions.saveSpotifyClientIdAndConnectAndRender.bind(playAlongActions, requestRender);

  window.handleSpotifyConnectAction = window.sparkPlayAlongConnectSpotify;

})();
