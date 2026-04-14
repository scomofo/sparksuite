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
    return playAlongActions.launchPreparedParams(params, requestRender, sparkPlayAlongStartLoop);
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
    return playAlongState.removeSavedTrackWithRender(index, requestRender);
  };

  window.sparkPlayAlongClearSaved = function() {
    return playAlongState.clearSavedTracksWithRender(requestRender);
  };

  window.sparkPlayAlongLaunchBookmark = function(index) {
    return playAlongState.launchBookmark(index, launchPreparedParams);
  };

  window.sparkPlayAlongLaunchBookmarkByKey = function(trackId, sectionIndex) {
    return playAlongState.launchBookmarkByKey(trackId, sectionIndex, launchPreparedParams);
  };

  window.sparkPlayAlongRemoveRecent = function(index) {
    return playAlongState.removeRecentWithRender(index, requestRender);
  };

  window.sparkPlayAlongClearRecent = function() {
    return playAlongState.clearRecentWithRender(requestRender);
  };

  window.sparkPlayAlongRemoveBookmark = function(index) {
    return playAlongState.removeBookmarkWithRender(index, requestRender);
  };

  window.sparkPlayAlongClearBookmarks = function() {
    return playAlongState.clearBookmarksWithRender(requestRender);
  };

  // ---- Set Difficulty ----

  window.sparkPlayAlongSetDifficulty = function(level) {
    return playAlongActions.setDifficultyAndRender(level, requestRender);
  };

  // ---- Load Local File ----

  window.sparkPlayAlongLoadFile = function(file) {
    return playAlongActions.handleLocalFileLaunch(file, launchPreparedParams);
  };

  // ---- Game Loop ----

  window.sparkPlayAlongStartLoop = function() {
    return playAlongRenderer.startSessionLoop(sparkPlayAlongStop);
  };

  // ---- Stop ----

  window.sparkPlayAlongStop = function() {
    return playAlongRenderer.finishSessionResults(requestRender);
  };

  // ---- Toggle Debug ----

  window.sparkPlayAlongToggleDebug = function() {
    return playAlongActions.toggleDebugDashboard();
  };

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

  window.sparkPlayAlongTogglePause = function() {
    return playAlongState.togglePause(requestRender);
  };

  window.sparkPlayAlongToggleLoop = function() {
    return playAlongState.toggleLoopWithRender(requestRender);
  };

  window.sparkPlayAlongSetLoopTarget = function(target) {
    return playAlongState.setLoopTargetWithRender(target, requestRender);
  };

  window.sparkPlayAlongPrevSection = function() {
    return playAlongState.prevSection(requestRender);
  };

  window.sparkPlayAlongNextSection = function() {
    return playAlongState.nextSection(requestRender);
  };

  window.sparkPlayAlongBookmarkCurrentSection = function() {
    return playAlongState.saveCurrentSectionBookmarkWithRender(requestRender);
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

  window.openPlayAlong = playAlongState.showHome.bind(playAlongState, requestRender);

  // ---- Spotify Connect ----

  window.sparkPlayAlongConnectSpotify = playAlongActions.connectSpotifyAndRender.bind(playAlongActions, requestRender);

  window.sparkPlayAlongSaveClientId = playAlongActions.saveSpotifyClientIdAndConnectAndRender.bind(playAlongActions, requestRender);

  // Handle spotifyConnect action from act() dispatcher
  window.handleSpotifyConnectAction = window.sparkPlayAlongConnectSpotify;

})();
