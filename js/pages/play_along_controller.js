// ===== SparkSuite: Play Along Controller =====
// Glue layer connecting play-along page UI to SparkCore play-along pipeline.
(function() {
  var playAlongState = new SparkPlayAlongStateService();
  var playAlongActions = new SparkPlayAlongActionService(playAlongState);
  var playAlongRenderer = new SparkPlayAlongRenderer(playAlongState);

  function requestRender() {
    if (typeof render === "function") render();
  }

  var rendererBindings = playAlongRenderer.createControllerBindings(requestRender);
  window.sparkPlayAlongStop = rendererBindings.stop;
  window.sparkPlayAlongStartLoop = rendererBindings.startLoop;

  var controllerBindings = playAlongActions.createControllerBindings(requestRender, window.sparkPlayAlongStartLoop);
  window.sparkPlayAlongSelectWithFile = controllerBindings.searchSelectWithFile;
  window.sparkPlayAlongSelect = controllerBindings.searchSelect;

  // ---- Search ----

  window.sparkPlayAlongSearch = controllerBindings.search;

  // ---- Select Track ----

  window.sparkPlayAlongLaunchDemo = controllerBindings.launchDemo;

  window.sparkPlayAlongLaunchRecent = controllerBindings.launchRecent;

  window.sparkPlayAlongSaveTrack = controllerBindings.saveTrack;

  window.sparkPlayAlongLaunchSaved = controllerBindings.launchSaved;

  window.sparkPlayAlongRemoveSaved = controllerBindings.removeSaved;

  window.sparkPlayAlongClearSaved = controllerBindings.clearSaved;

  window.sparkPlayAlongLaunchBookmark = controllerBindings.launchBookmark;

  window.sparkPlayAlongLaunchBookmarkByKey = controllerBindings.launchBookmarkByKey;

  window.sparkPlayAlongRemoveRecent = controllerBindings.removeRecent;

  window.sparkPlayAlongClearRecent = controllerBindings.clearRecent;

  window.sparkPlayAlongRemoveBookmark = controllerBindings.removeBookmark;

  window.sparkPlayAlongClearBookmarks = controllerBindings.clearBookmarks;

  // ---- Set Difficulty ----

  window.sparkPlayAlongSetDifficulty = controllerBindings.setDifficulty;

  // ---- Load Local File ----

  window.sparkPlayAlongLoadFile = controllerBindings.loadFile;

  // ---- Toggle Debug ----

  window.sparkPlayAlongToggleDebug = controllerBindings.toggleDebug;

  // ---- Play Again ----

  window.sparkPlayAlongAgain = controllerBindings.again;

  window.sparkPlayAlongReplayDrill = controllerBindings.replayDrill;

  window.sparkPlayAlongReplayFullSong = controllerBindings.replayFullSong;

  window.sparkPlayAlongTogglePause = controllerBindings.togglePause;

  window.sparkPlayAlongToggleLoop = controllerBindings.toggleLoop;

  window.sparkPlayAlongSetLoopTarget = controllerBindings.setLoopTarget;

  window.sparkPlayAlongPrevSection = controllerBindings.prevSection;

  window.sparkPlayAlongNextSection = controllerBindings.nextSection;

  window.sparkPlayAlongBookmarkCurrentSection = controllerBindings.bookmarkCurrentSection;

  window.sparkPlayAlongJumpToWeakSection = controllerBindings.jumpToWeakSection;

  window.sparkPlayAlongJumpToSectionRecommendation = controllerBindings.jumpToSectionRecommendation;

  window.sparkPlayAlongPickNew = controllerBindings.pickNew;

  window.sparkPlayAlongStartDrill = controllerBindings.startDrill;

  // ---- Navigation Helper ----

  window.openPlayAlong = controllerBindings.openHome;

  // ---- Spotify Connect ----

  window.sparkPlayAlongConnectSpotify = controllerBindings.connectSpotify;

  window.sparkPlayAlongSaveClientId = controllerBindings.saveSpotifyClientId;
  window.sparkPlayAlongReplay = window.sparkPlayAlongAgain;
  window.handleSpotifyConnectAction = window.sparkPlayAlongConnectSpotify;

})();
