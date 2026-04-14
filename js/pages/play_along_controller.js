// ===== SparkSuite: Play Along Controller =====
// Glue layer connecting play-along page UI to SparkCore play-along pipeline.
(function() {
  var playAlongState = new SparkPlayAlongStateService();
  var playAlongActions = new SparkPlayAlongActionService(playAlongState);
  var playAlongRenderer = new SparkPlayAlongRenderer(playAlongState);

  function requestRender() {
    if (typeof render === "function") render();
  }

  window.sparkPlayAlongStop = playAlongRenderer.createStopHandler(requestRender);
  window.sparkPlayAlongStartLoop = playAlongRenderer.createStartLoopHandler(window.sparkPlayAlongStop);

  var controllerBindings = playAlongActions.createControllerBindings(requestRender, window.sparkPlayAlongStartLoop);
  window.sparkPlayAlongSelectWithFile = controllerBindings.searchSelectWithFile;
  window.sparkPlayAlongSelect = controllerBindings.searchSelect;

  // ---- Search ----

  window.sparkPlayAlongSearch = playAlongActions.searchAndRenderTracks.bind(playAlongActions);

  // ---- Select Track ----

  window.sparkPlayAlongLaunchDemo = controllerBindings.withLaunch(playAlongActions.handleDemoLaunch, playAlongActions);

  window.sparkPlayAlongLaunchRecent = controllerBindings.withLaunch(playAlongState.launchRecent, playAlongState);

  window.sparkPlayAlongSaveTrack = controllerBindings.withRender(playAlongActions.saveSearchResultAndRender, playAlongActions);

  window.sparkPlayAlongLaunchSaved = controllerBindings.withLaunch(playAlongState.launchSaved, playAlongState);

  window.sparkPlayAlongRemoveSaved = controllerBindings.withRender(playAlongState.removeSavedTrackWithRender, playAlongState);

  window.sparkPlayAlongClearSaved = controllerBindings.withRenderOnly(playAlongState.clearSavedTracksWithRender, playAlongState);

  window.sparkPlayAlongLaunchBookmark = controllerBindings.withLaunch(playAlongState.launchBookmark, playAlongState);

  window.sparkPlayAlongLaunchBookmarkByKey = controllerBindings.withLaunchPair(playAlongState.launchBookmarkByKey, playAlongState);

  window.sparkPlayAlongRemoveRecent = controllerBindings.withRender(playAlongState.removeRecentWithRender, playAlongState);

  window.sparkPlayAlongClearRecent = controllerBindings.withRenderOnly(playAlongState.clearRecentWithRender, playAlongState);

  window.sparkPlayAlongRemoveBookmark = controllerBindings.withRender(playAlongState.removeBookmarkWithRender, playAlongState);

  window.sparkPlayAlongClearBookmarks = controllerBindings.withRenderOnly(playAlongState.clearBookmarksWithRender, playAlongState);

  // ---- Set Difficulty ----

  window.sparkPlayAlongSetDifficulty = controllerBindings.withRender(playAlongActions.setDifficultyAndRender, playAlongActions);

  // ---- Load Local File ----

  window.sparkPlayAlongLoadFile = controllerBindings.withLaunch(playAlongActions.handleLocalFileLaunch, playAlongActions);

  // ---- Toggle Debug ----

  window.sparkPlayAlongToggleDebug = playAlongActions.toggleDebugDashboard.bind(playAlongActions);

  // ---- Play Again ----

  window.sparkPlayAlongAgain = playAlongState.replayOrShowHome.bind(playAlongState, controllerBindings.launchPreparedParams, requestRender);

  window.sparkPlayAlongReplayDrill = playAlongState.replayDrill.bind(playAlongState, controllerBindings.launchPreparedParams);

  window.sparkPlayAlongReplayFullSong = playAlongState.replayFullSong.bind(playAlongState, controllerBindings.launchPreparedParams);

  window.sparkPlayAlongTogglePause = controllerBindings.withRenderOnly(playAlongState.togglePause, playAlongState);

  window.sparkPlayAlongToggleLoop = controllerBindings.withRenderOnly(playAlongState.toggleLoopWithRender, playAlongState);

  window.sparkPlayAlongSetLoopTarget = controllerBindings.withRender(playAlongState.setLoopTargetWithRender, playAlongState);

  window.sparkPlayAlongPrevSection = controllerBindings.withRenderOnly(playAlongState.prevSection, playAlongState);

  window.sparkPlayAlongNextSection = controllerBindings.withRenderOnly(playAlongState.nextSection, playAlongState);

  window.sparkPlayAlongBookmarkCurrentSection = controllerBindings.withRenderOnly(playAlongState.saveCurrentSectionBookmarkWithRender, playAlongState);

  window.sparkPlayAlongJumpToWeakSection = playAlongState.launchWeakSection.bind(playAlongState, controllerBindings.launchPreparedParams);

  window.sparkPlayAlongJumpToSectionRecommendation = controllerBindings.withLaunchPair(playAlongState.launchSectionRecommendation, playAlongState);

  window.sparkPlayAlongPickNew = controllerBindings.withRenderOnly(playAlongState.resetToHome, playAlongState);

  window.sparkPlayAlongStartDrill = controllerBindings.withLaunchAndRender(playAlongState.startDrill, playAlongState);

  // ---- Navigation Helper ----

  window.openPlayAlong = controllerBindings.withRenderOnly(playAlongState.showHome, playAlongState);

  // ---- Spotify Connect ----

  window.sparkPlayAlongConnectSpotify = controllerBindings.withRenderOnly(playAlongActions.connectSpotifyAndRender, playAlongActions);

  window.sparkPlayAlongSaveClientId = controllerBindings.withRenderOnly(playAlongActions.saveSpotifyClientIdAndConnectAndRender, playAlongActions);
  window.sparkPlayAlongReplay = window.sparkPlayAlongAgain;
  window.handleSpotifyConnectAction = window.sparkPlayAlongConnectSpotify;

})();
