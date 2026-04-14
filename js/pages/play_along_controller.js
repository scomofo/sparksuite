// ===== SparkSuite: Play Along Controller =====
// Glue layer connecting play-along page UI to SparkCore play-along pipeline.
(function() {
  var playAlongState = new SparkPlayAlongStateService();
  var playAlongActions = new SparkPlayAlongActionService(playAlongState);
  var playAlongRenderer = new SparkPlayAlongRenderer(playAlongState);

  function requestRender() {
    if (typeof render === "function") render();
  }

  window.sparkPlayAlongStop = playAlongRenderer.finishSessionResults.bind(playAlongRenderer, requestRender);
  window.sparkPlayAlongStartLoop = playAlongRenderer.startSessionLoop.bind(playAlongRenderer, window.sparkPlayAlongStop);

  var launchPreparedParams = playAlongActions.createLaunchHandler(requestRender, sparkPlayAlongStartLoop);
  var withRender = playAlongActions.createRenderHandler.bind(playAlongActions);
  var withRenderOnly = playAlongActions.createRenderOnlyHandler.bind(playAlongActions);
  var withLaunch = playAlongActions.createLaunchCallback.bind(playAlongActions);
  var withLaunchAndRender = playAlongActions.createLaunchAndRenderCallback.bind(playAlongActions);
  var withLaunchPair = playAlongActions.createLaunchPairCallback.bind(playAlongActions);
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

  window.sparkPlayAlongClearSaved = withRenderOnly(playAlongState.clearSavedTracksWithRender, playAlongState, requestRender);

  window.sparkPlayAlongLaunchBookmark = withLaunch(playAlongState.launchBookmark, playAlongState);

  window.sparkPlayAlongLaunchBookmarkByKey = withLaunchPair(playAlongState.launchBookmarkByKey, playAlongState);

  window.sparkPlayAlongRemoveRecent = withRender(playAlongState.removeRecentWithRender, playAlongState);

  window.sparkPlayAlongClearRecent = withRenderOnly(playAlongState.clearRecentWithRender, playAlongState, requestRender);

  window.sparkPlayAlongRemoveBookmark = withRender(playAlongState.removeBookmarkWithRender, playAlongState);

  window.sparkPlayAlongClearBookmarks = withRenderOnly(playAlongState.clearBookmarksWithRender, playAlongState, requestRender);

  // ---- Set Difficulty ----

  window.sparkPlayAlongSetDifficulty = withRender(playAlongActions.setDifficultyAndRender, playAlongActions);

  // ---- Load Local File ----

  window.sparkPlayAlongLoadFile = withLaunch(playAlongActions.handleLocalFileLaunch, playAlongActions);

  // ---- Toggle Debug ----

  window.sparkPlayAlongToggleDebug = playAlongActions.toggleDebugDashboard.bind(playAlongActions);

  // ---- Play Again ----

  window.sparkPlayAlongAgain = playAlongState.replayOrShowHome.bind(playAlongState, launchPreparedParams, requestRender);

  window.sparkPlayAlongReplayDrill = playAlongState.replayDrill.bind(playAlongState, launchPreparedParams);

  window.sparkPlayAlongReplayFullSong = playAlongState.replayFullSong.bind(playAlongState, launchPreparedParams);

  window.sparkPlayAlongTogglePause = withRenderOnly(playAlongState.togglePause, playAlongState, requestRender);

  window.sparkPlayAlongToggleLoop = withRenderOnly(playAlongState.toggleLoopWithRender, playAlongState, requestRender);

  window.sparkPlayAlongSetLoopTarget = withRender(playAlongState.setLoopTargetWithRender, playAlongState);

  window.sparkPlayAlongPrevSection = withRenderOnly(playAlongState.prevSection, playAlongState, requestRender);

  window.sparkPlayAlongNextSection = withRenderOnly(playAlongState.nextSection, playAlongState, requestRender);

  window.sparkPlayAlongBookmarkCurrentSection = withRenderOnly(playAlongState.saveCurrentSectionBookmarkWithRender, playAlongState, requestRender);

  window.sparkPlayAlongJumpToWeakSection = playAlongState.launchWeakSection.bind(playAlongState, launchPreparedParams);

  window.sparkPlayAlongJumpToSectionRecommendation = withLaunchPair(playAlongState.launchSectionRecommendation, playAlongState);

  window.sparkPlayAlongPickNew = withRenderOnly(playAlongState.resetToHome, playAlongState, requestRender);

  window.sparkPlayAlongStartDrill = withLaunchAndRender(playAlongState.startDrill, playAlongState);

  // ---- Navigation Helper ----

  window.openPlayAlong = withRenderOnly(playAlongState.showHome, playAlongState, requestRender);

  // ---- Spotify Connect ----

  window.sparkPlayAlongConnectSpotify = withRenderOnly(playAlongActions.connectSpotifyAndRender, playAlongActions, requestRender);

  window.sparkPlayAlongSaveClientId = withRenderOnly(playAlongActions.saveSpotifyClientIdAndConnectAndRender, playAlongActions, requestRender);
  window.sparkPlayAlongReplay = window.sparkPlayAlongAgain;
  window.handleSpotifyConnectAction = window.sparkPlayAlongConnectSpotify;

})();
