// ===== SparkSuite: Play Along Controller =====
// Glue layer connecting play-along page UI to SparkCore play-along pipeline.
(function() {
  var playAlongState = new SparkPlayAlongStateService();
  var playAlongActions = new SparkPlayAlongActionService(playAlongState);
  var playAlongRenderer = new SparkPlayAlongRenderer(playAlongState);

  // ---- Search ----

  window.sparkPlayAlongSearch = function(query) {
    var resultsEl = document.getElementById("play-along-results");
    if (!playAlongActions.searchTracks(query, function(tracks) {
      if (resultsEl) resultsEl.innerHTML = playAlongActions.buildSearchResultsMarkup(tracks);
    })) {
      if (resultsEl) resultsEl.innerHTML = "";
    }
  };

  // ---- Select Track ----

  window.sparkPlayAlongSelect = function(index) {
    var track = playAlongActions.getSearchResult(index);
    if (!track) return;

    playAlongState.resetSelectedDrillState();

    if (playAlongActions.hasCachedChart(track.id)) {
      launchPlayAlongSession(playAlongActions.getSearchLaunchParams(index));
      return;
    }

    var resultsEl = document.getElementById("play-along-results");
    if (!resultsEl) return;
    resultsEl.innerHTML = playAlongActions.buildUploadPromptMarkup(track);
    playAlongActions.bindUploadPromptHandlers(index, sparkPlayAlongSelectWithFile, function(selectedIndex) {
      launchPlayAlongSession(playAlongActions.getSearchLaunchParams(selectedIndex));
    });
  };

  window.sparkPlayAlongSelectWithFile = function(index, file) {
    var params;
    if (!file) return;

    playAlongState.resetSelectedDrillState();
    params = playAlongActions.getSearchLaunchParams(index, {
      audioFile: file,
    });
    if (!params) return;
    launchPlayAlongSession(params);
  };

  window.sparkPlayAlongLaunchDemo = function(index) {
    var params = playAlongState.prepareFreshLaunch(playAlongActions.getDemoLaunchParams(index));
    if (!params) return false;
    launchPlayAlongSession(params);
    return true;
  };

  window.sparkPlayAlongLaunchRecent = function(index) {
    var params = playAlongState.prepareRecentLaunch(index);
    if (!params) return false;
    launchPlayAlongSession(params);
    return true;
  };

  window.sparkPlayAlongSaveTrack = function(index) {
    return playAlongActions.saveSearchResult(index).then(function(saved) {
      if (saved) render();
      return saved;
    });
  };

  window.sparkPlayAlongLaunchSaved = function(index) {
    var params = playAlongState.prepareSavedLaunch(index);
    if (!params) return false;
    launchPlayAlongSession(params);
    return true;
  };

  window.sparkPlayAlongRemoveSaved = function(index) {
    if (!playAlongState.removeSavedTrack(index)) return false;
    render();
    return true;
  };

  window.sparkPlayAlongClearSaved = function() {
    if (!playAlongState.clearSavedTracks()) return false;
    render();
    return true;
  };

  window.sparkPlayAlongLaunchBookmark = function(index) {
    var params = playAlongState.prepareBookmarkLaunchByIndex(index);
    if (!params) return false;
    launchPlayAlongSession(params);
    return true;
  };

  window.sparkPlayAlongLaunchBookmarkByKey = function(trackId, sectionIndex) {
    var params = playAlongState.prepareBookmarkLaunchByKey(trackId, sectionIndex);
    if (!params) return false;
    launchPlayAlongSession(params);
    return true;
  };

  window.sparkPlayAlongRemoveRecent = function(index) {
    if (!playAlongState.removeRecent(index)) return false;
    render();
    return true;
  };

  window.sparkPlayAlongClearRecent = function() {
    if (!playAlongState.clearRecent()) return false;
    render();
    return true;
  };

  window.sparkPlayAlongRemoveBookmark = function(index) {
    if (!playAlongState.removeBookmark(index)) return false;
    render();
    return true;
  };

  window.sparkPlayAlongClearBookmarks = function() {
    if (!playAlongState.clearBookmarks()) return false;
    render();
    return true;
  };

  // ---- Set Difficulty ----

  window.sparkPlayAlongSetDifficulty = function(level) {
    playAlongActions.setDifficulty(level);
    render();
  };

  // ---- Load Local File ----

  window.sparkPlayAlongLoadFile = function(file) {
    var params;
    if (!file) return;
    params = playAlongState.prepareLocalFileLaunch(file, playAlongActions.getInstrumentId());
    if (!params) return false;
    launchPlayAlongSession(params);
    return true;
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
    render();

    // Draw heatmap after render
    setTimeout(function() {
      var heatmapCanvas = document.getElementById("play-along-heatmap");
      playAlongState.drawHeatmap(heatmapCanvas);
    }, 0);
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
    if (params) {
      launchPlayAlongSession(params);
    } else {
      playAlongState.showHomeScreen();
      render();
    }
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
    var params = playAlongState.prepareFullSongReplayLaunch();
    if (!params) return false;
    return launchPlayAlongSession(params);
  };

  window.sparkPlayAlongTogglePause = function() {
    var paused = playAlongState.togglePauseTransport();
    render();
    return paused;
  };

  window.sparkPlayAlongToggleLoop = function() {
    playAlongState.clearError();
    playAlongState.toggleLoop();
    render();
    return playAlongState.isLoopEnabled();
  };

  window.sparkPlayAlongSetLoopTarget = function(target) {
    if (!playAlongState.setLoopTarget(target)) return false;
    render();
    return true;
  };

  window.sparkPlayAlongPrevSection = function() {
    return playAlongState.stepSection(-1, render);
  };

  window.sparkPlayAlongNextSection = function() {
    return playAlongState.stepSection(1, render);
  };

  window.sparkPlayAlongBookmarkCurrentSection = function() {
    var bookmark = playAlongState.buildCurrentSectionBookmark();
    if (!bookmark) return false;
    playAlongState.rememberBookmark(bookmark);
    render();
    return true;
  };

  window.sparkPlayAlongJumpToWeakSection = function() {
    var params = playAlongState.prepareWeakSectionLaunch();
    if (!params) return false;
    return launchPlayAlongSession(params);
  };

  window.sparkPlayAlongJumpToSectionRecommendation = function(trackId, sectionIndex) {
    var params = playAlongState.prepareSectionRecommendationLaunch(trackId, sectionIndex);
    if (!params) return false;
    return launchPlayAlongSession(params);
  };

  window.sparkPlayAlongPickNew = function() {
    playAlongState.resetSelectedDrillState();
    playAlongState.showHomeScreen();
    render();
  };

  window.sparkPlayAlongStartDrill = function(index) {
    var params = playAlongState.prepareDrillLaunch(index);
    if (params) {
      launchPlayAlongSession(params);
      return true;
    }
    if (params === null) return false;
    playAlongState.writeValue("screen", SCR.PLAY_ALONG);
    render();
    return true;
  };

  // ---- Navigation Helper ----

  window.openPlayAlong = function() {
    playAlongState.showHomeScreen();
    render();
  };

  function launchPlayAlongSession(params) {
    if (!params) return Promise.resolve(false);
    if (!params.instrument) params.instrument = playAlongActions.getInstrumentId();
    return playAlongState.beginSessionLaunch(params).then(function(started) {
      if (!started) return false;
      playAlongState.showSessionScreen();
      playAlongState.applySelectedDrillState();
      render();
      sparkPlayAlongStartLoop();
      return true;
    }).catch(function(err) {
      console.error("[PlayAlong] Failed:", err);
      playAlongState.setError(err);
      playAlongState.showHomeScreen();
      render();
      return false;
    });
  }

  function enforceLoopWindow() {
    return playAlongState.enforceLoopWindow(sparkPlayAlongStop);
  }

  // ---- Spotify Connect ----

  window.sparkPlayAlongConnectSpotify = function() {
    var authManager = playAlongActions.createSpotifyAuthManager();
    if (!authManager) {
      alert("Spotify integration not loaded.");
      return;
    }

    // Check if already connected
    playAlongActions.resumeSpotifyConnection(authManager, function(token) {
      if (token && playAlongState.initSpotify(token)) {
        if (typeof render === "function") render();
      }
    }).then(function(reused) {
      var clientId;
      var container;
      if (reused) return;

    // Need to configure first — check if client ID is set
      clientId = playAlongActions.getSpotifyClientId();
      if (!clientId) {
        container = document.getElementById("play-along-results") || document.getElementById("app");
        playAlongActions.showSpotifyClientIdPrompt(container);
        return;
      }

      if (!playAlongActions.configureSpotifyAuth(clientId)) return;

      playAlongActions.requestSpotifyAuthUrl(authManager).then(function(url) {
        playAlongActions.openSpotifyAuthUrl(url);
      }).catch(function(err) {
        console.error("Spotify auth URL generation failed:", err);
      });

      playAlongActions.bindSpotifyCallback(authManager, function(tokenData) {
        if (tokenData && tokenData.access_token && playAlongState.initSpotify(tokenData.access_token)) {
          if (typeof render === "function") render();
        }
      });
    });
  };


  window.sparkPlayAlongSaveClientId = function() {
    var input = document.getElementById("spotify-client-id-input");
    if (!input || !playAlongActions.saveSpotifyClientId(input.value)) return;
    sparkPlayAlongConnectSpotify();
  };

  // Handle spotifyConnect action from act() dispatcher
  window.handleSpotifyConnectAction = function() {
    window.sparkPlayAlongConnectSpotify();
  };

})();
