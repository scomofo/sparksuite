// ===== SparkSuite: Play Along Controller =====
// Glue layer connecting play-along page UI to SparkCore play-along pipeline.
(function() {
  var playAlongState = new SparkPlayAlongStateService();
  var playAlongActions = new SparkPlayAlongActionService(playAlongState);
  var playAlongRenderer = new SparkPlayAlongRenderer(playAlongState);

  function requestRender() {
    if (typeof render === "function") render();
  }

  window.sparkPlayAlongStop = function() {
    return playAlongRenderer.finishSessionResults(requestRender);
  };

  window.sparkPlayAlongStartLoop = function() {
    return playAlongRenderer.startSessionLoop(sparkPlayAlongStop);
  };

  var launchPreparedParams = playAlongActions.createLaunchHandler(requestRender, sparkPlayAlongStartLoop);

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
    return playAlongState.removeSavedTrackWithRender(index, requestRender);
  };

  window.sparkPlayAlongClearSaved = playAlongState.clearSavedTracksWithRender.bind(playAlongState, requestRender);

  window.sparkPlayAlongLaunchBookmark = function(index) {
    return playAlongState.launchBookmark(index, launchPreparedParams);
  };

  window.sparkPlayAlongLaunchBookmarkByKey = function(trackId, sectionIndex) {
    return playAlongState.launchBookmarkByKey(trackId, sectionIndex, launchPreparedParams);
  };

  window.sparkPlayAlongRemoveRecent = function(index) {
    return playAlongState.removeRecentWithRender(index, requestRender);
  };

  window.sparkPlayAlongClearRecent = playAlongState.clearRecentWithRender.bind(playAlongState, requestRender);

  window.sparkPlayAlongRemoveBookmark = function(index) {
    return playAlongState.removeBookmarkWithRender(index, requestRender);
  };

  window.sparkPlayAlongClearBookmarks = playAlongState.clearBookmarksWithRender.bind(playAlongState, requestRender);

  // ---- Set Difficulty ----

  window.sparkPlayAlongSetDifficulty = function(level) {
    return playAlongActions.setDifficultyAndRender(level, requestRender);
  };

  // ---- Load Local File ----

  window.sparkPlayAlongLoadFile = function(file) {
    return playAlongActions.handleLocalFileLaunch(file, launchPreparedParams);
  };

  // ---- Toggle Debug ----

  window.sparkPlayAlongToggleDebug = playAlongActions.toggleDebugDashboard.bind(playAlongActions);

  // ---- Play Again ----

  window.sparkPlayAlongAgain = function() {
    return playAlongState.replayOrShowHome(launchPreparedParams, requestRender);
  };

  window.sparkPlayAlongReplay = window.sparkPlayAlongAgain;

  window.sparkPlayAlongReplayDrill = function() {
    return playAlongState.replayDrill(launchPreparedParams);
  };

  window.sparkPlayAlongReplayFullSong = function() {
    return playAlongState.replayFullSong(launchPreparedParams);
  };

  window.sparkPlayAlongTogglePause = playAlongState.togglePause.bind(playAlongState, requestRender);

  window.sparkPlayAlongToggleLoop = playAlongState.toggleLoopWithRender.bind(playAlongState, requestRender);

  window.sparkPlayAlongSetLoopTarget = function(target) {
    return playAlongState.setLoopTargetWithRender(target, requestRender);
  };

  window.sparkPlayAlongPrevSection = playAlongState.prevSection.bind(playAlongState, requestRender);

  window.sparkPlayAlongNextSection = playAlongState.nextSection.bind(playAlongState, requestRender);

  window.sparkPlayAlongBookmarkCurrentSection = playAlongState.saveCurrentSectionBookmarkWithRender.bind(playAlongState, requestRender);

  window.sparkPlayAlongJumpToWeakSection = function() {
    return playAlongState.launchWeakSection(launchPreparedParams);
  };

  window.sparkPlayAlongJumpToSectionRecommendation = function(trackId, sectionIndex) {
    return playAlongState.launchSectionRecommendation(trackId, sectionIndex, launchPreparedParams);
  };

  window.sparkPlayAlongPickNew = playAlongState.resetToHome.bind(playAlongState, requestRender);

  window.sparkPlayAlongStartDrill = function(index) {
    return playAlongState.startDrill(index, launchPreparedParams, requestRender);
  };

  // ---- Navigation Helper ----

  window.openPlayAlong = playAlongState.showHome.bind(playAlongState, requestRender);

  // ---- Spotify Connect ----

  window.sparkPlayAlongConnectSpotify = playAlongActions.connectSpotifyAndRender.bind(playAlongActions, requestRender);

  window.sparkPlayAlongSaveClientId = playAlongActions.saveSpotifyClientIdAndConnectAndRender.bind(playAlongActions, requestRender);

  // Handle spotifyConnect action from act() dispatcher
  window.handleSpotifyConnectAction = window.sparkPlayAlongConnectSpotify;

})();
