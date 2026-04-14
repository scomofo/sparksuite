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

  window.sparkPlayAlongSearch = controllerBindings.search;

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

  window.sparkPlayAlongToggleDebug = controllerBindings.toggleDebug;

  // ---- Play Again ----

  window.sparkPlayAlongAgain = controllerBindings.again;

  window.sparkPlayAlongReplayDrill = controllerBindings.replayDrill;

  window.sparkPlayAlongReplayFullSong = controllerBindings.replayFullSong;

  window.sparkPlayAlongTogglePause = controllerBindings.withRenderOnly(playAlongState.togglePause, playAlongState);

  window.sparkPlayAlongToggleLoop = controllerBindings.withRenderOnly(playAlongState.toggleLoopWithRender, playAlongState);

  window.sparkPlayAlongSetLoopTarget = controllerBindings.withRender(playAlongState.setLoopTargetWithRender, playAlongState);

  window.sparkPlayAlongPrevSection = controllerBindings.withRenderOnly(playAlongState.prevSection, playAlongState);

  window.sparkPlayAlongNextSection = controllerBindings.withRenderOnly(playAlongState.nextSection, playAlongState);

  window.sparkPlayAlongBookmarkCurrentSection = controllerBindings.withRenderOnly(playAlongState.saveCurrentSectionBookmarkWithRender, playAlongState);

  window.sparkPlayAlongJumpToWeakSection = controllerBindings.jumpToWeakSection;

  window.sparkPlayAlongJumpToSectionRecommendation = controllerBindings.jumpToSectionRecommendation;

  window.sparkPlayAlongPickNew = controllerBindings.withRenderOnly(playAlongState.resetToHome, playAlongState);

  window.sparkPlayAlongStartDrill = controllerBindings.withLaunchAndRender(playAlongState.startDrill, playAlongState);

  // ---- Navigation Helper ----

  window.openPlayAlong = controllerBindings.openHome;

  // ---- Spotify Connect ----

  window.sparkPlayAlongConnectSpotify = controllerBindings.connectSpotify;

  window.sparkPlayAlongSaveClientId = controllerBindings.saveSpotifyClientId;
  window.sparkPlayAlongReplay = window.sparkPlayAlongAgain;
  window.handleSpotifyConnectAction = window.sparkPlayAlongConnectSpotify;

})();
