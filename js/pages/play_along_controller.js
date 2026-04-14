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
      var html = "";
      for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i];
        var name = escapeForAttr(t.name || "");
        var artist = escapeForAttr(t.artist || "");
        var imgTag = t.image
          ? "<img src=\"" + escapeForAttr(t.image) + "\" width=\"40\" height=\"40\" class=\"song-item-art\"/>"
          : "";
        html += "<div class=\"song-item\" onclick=\"sparkPlayAlongSelect(" + i + ")\">"
          + imgTag
          + "<div class=\"song-item-info\">"
          + "<strong class=\"song-item-name\">" + name + "</strong>"
          + "<span class=\"song-item-artist\">" + artist + "</span>"
          + "</div>"
          + "<button class=\"btn btn-sm\" onclick=\"event.stopPropagation();sparkPlayAlongSaveTrack(" + i + ")\">Save</button>"
          + "</div>";
      }
      if (resultsEl) resultsEl.innerHTML = html;
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
      launchPlayAlongSession(playAlongActions.buildLaunchParams(track));
      return;
    }

    var resultsEl = document.getElementById("play-along-results");
    if (!resultsEl) return;
    resultsEl.innerHTML = playAlongActions.buildUploadPromptMarkup(track);

    var fileInput = document.getElementById("play-along-audio-input");
    var skipBtn = document.getElementById("play-along-skip-btn");

    if (fileInput) {
      fileInput.addEventListener("change", function() {
        var file = fileInput.files && fileInput.files[0];
        if (file) {
          sparkPlayAlongSelectWithFile(index, file);
        }
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener("click", function() {
        launchPlayAlongSession(playAlongActions.buildLaunchParams(track));
      });
    }
  };

  window.sparkPlayAlongSelectWithFile = function(index, file) {
    var track = playAlongActions.getSearchResult(index);
    if (!track || !file) return;

    playAlongState.resetSelectedDrillState();
    launchPlayAlongSession(playAlongActions.buildLaunchParams(track, {
      audioFile: file,
    }));
  };

  window.sparkPlayAlongLaunchDemo = function(index) {
    var demo = playAlongActions.getDemo(index);
    if (!demo) return false;
    playAlongState.resetSelectedDrillState();
    launchPlayAlongSession(playAlongActions.buildLaunchParams(demo, {
      trackId: demo.trackId,
      trackUri: demo.trackUri || null,
      title: demo.title || null,
      audioOffsetMs: demo.audioOffsetMs || 0,
      difficulty: demo.difficulty || playAlongActions.getDifficulty(),
      instrument: demo.instrument || "guitar"
    }));
    return true;
  };

  window.sparkPlayAlongLaunchRecent = function(index) {
    var params = playAlongState.getRecentLaunchParams(index);
    if (!params) return false;
    playAlongState.resetSelectedDrillState();
    launchPlayAlongSession(params);
    return true;
  };

  window.sparkPlayAlongSaveTrack = function(index) {
    var track = playAlongActions.getSearchResult(index);
    if (!track) return Promise.resolve(false);

    return playAlongActions.enrichSavedTrack(track).then(function(saved) {
      if (!playAlongState.saveTrack(saved)) return false;
      render();
      return true;
    });
  };

  window.sparkPlayAlongLaunchSaved = function(index) {
    var params = playAlongState.getSavedLaunchParams(index);
    if (!params) return false;
    playAlongState.resetSelectedDrillState();
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
    var item = playAlongState.getBookmark(index);
    if (!item || !item.params) return false;
    playAlongState.clearError();
    playAlongState.prepareBookmarkLaunch(item);
    launchPlayAlongSession(playAlongState.cloneValue(item.params));
    return true;
  };

  window.sparkPlayAlongLaunchBookmarkByKey = function(trackId, sectionIndex) {
    var index = playAlongState.findBookmarkIndex(trackId, sectionIndex);
    return index >= 0 ? window.sparkPlayAlongLaunchBookmark(index) : false;
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
    if (!file) return;

    playAlongState.resetSelectedDrillState();
    launchPlayAlongSession({
      audioFile: file,
      difficulty: playAlongState.getDifficulty(),
      instrument: playAlongActions.getInstrumentId()
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
    var outcome = null;
    playAlongState.stopRenderLoop();
    outcome = playAlongState.completeSession();
    if (outcome) {
      outcome = playAlongState.enrichOutcomeWithLoopSummary(outcome, playAlongState.buildCurrentSectionBookmark());
      playAlongState.setLastOutcome(outcome);
    }
    playAlongState.writeValue("screen", SCR.PLAY_ALONG_RESULTS);
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
      playAlongState.writeValue("screen", SCR.PLAY_ALONG);
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
    var params = playAlongState.getReplayParams();
    if (!playAlongState.prepareFullSongReplay() || !params) return false;
    playAlongState.clearError();
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
    var sectionSummary = playAlongState.getSectionSummary();
    var params = playAlongState.getReplayParams();
    if (!sectionSummary || !params) return false;
    playAlongState.resetSelectedDrillState();
    playAlongState.activateSectionLoop(sectionSummary.sectionIndex || 0);
    return launchPlayAlongSession(params);
  };

  window.sparkPlayAlongJumpToSectionRecommendation = function(trackId, sectionIndex) {
    var params = playAlongState.getSectionRecommendationLaunchParams(trackId);
    if (!params) return false;
    playAlongState.resetSelectedDrillState();
    playAlongState.activateSectionLoop(sectionIndex || 0);
    return launchPlayAlongSession(params);
  };

  window.sparkPlayAlongPickNew = function() {
    playAlongState.resetSelectedDrillState();
    playAlongState.writeValue("screen", SCR.PLAY_ALONG);
    render();
  };

  window.sparkPlayAlongStartDrill = function(index) {
    var drills = playAlongState.getOutcomeDrills();
    var drill = drills[index] || null;
    if (!drill) return false;
    playAlongState.selectDrill(drill);
    playAlongState.clearError();
    var params = playAlongState.getActiveParams();
    if (params) {
      launchPlayAlongSession(params);
      return true;
    }
    playAlongState.writeValue("screen", SCR.PLAY_ALONG);
    render();
    return true;
  };

  // ---- Navigation Helper ----

  window.openPlayAlong = function() {
    playAlongState.writeValue("screen", SCR.PLAY_ALONG);
    render();
  };

  // ---- Utility ----

  function escapeForAttr(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function launchPlayAlongSession(params) {
    if (!params) return Promise.resolve(false);
    if (!params.instrument) params.instrument = playAlongActions.getInstrumentId();
    playAlongState.clearError();
    playAlongState.rememberLaunch(params);
    return playAlongState.startSession(params).then(function(started) {
      if (!started) return false;
      playAlongState.writeValue("screen", SCR.PLAY_ALONG_SESSION);
      playAlongState.writeValue("playAlongPaused", false);
      playAlongState.applySelectedDrillState();
      render();
      sparkPlayAlongStartLoop();
      return true;
    }).catch(function(err) {
      console.error("[PlayAlong] Failed:", err);
      playAlongState.setError(err);
      playAlongState.writeValue("screen", SCR.PLAY_ALONG);
      render();
      return false;
    });
  }

  function enforceLoopWindow() {
    return playAlongState.enforceLoopWindow(sparkPlayAlongStop);
  }

  // ---- Spotify Connect ----

  window.sparkPlayAlongConnectSpotify = function() {
    // Check if auth manager exists
    if (typeof SparkSpotifyAuthManager === "undefined") {
      alert("Spotify integration not loaded.");
      return;
    }

    var authManager = new SparkSpotifyAuthManager();

    // Check if already connected
    if (authManager.isConnected()) {
      authManager.getValidToken().then(function(token) {
        if (token && playAlongState.initSpotify(token)) {
          if (typeof render === "function") render();
        }
      });
      return;
    }

    // Need to configure first — check if client ID is set
    var clientId = localStorage.getItem("sparksuite_spotify_client_id");
    if (!clientId) {
      // Show inline input instead of prompt (blocked in Electron)
      var container = document.getElementById("play-along-results") || document.getElementById("app");
      if (container) {
        container.innerHTML = "<div class=card style=padding:20px;text-align:center>" +
          "<div style=font-size:14px;font-weight:700;margin-bottom:8px>Spotify Client ID</div>" +
          "<div style=font-size:12px;color:var(--text-dim);margin-bottom:12px>Get yours at developer.spotify.com/dashboard</div>" +
          "<input id=spotify-client-id-input class=input type=text placeholder=Paste client ID here style=width:100%;margin-bottom:8px>" +
          "<button class=btn onclick=sparkPlayAlongSaveClientId() style=background:var(--accent);color:#fff>Save and Connect</button>" +
          "</div>";
      }
      return;
    }

    // Determine redirect URI based on environment
    var redirectUri = window.location.origin + window.location.pathname.replace(/[^\/]*$/, "") + "index.html";
    if (redirectUri.indexOf("file://") === 0) {
      redirectUri = "http://127.0.0.1:3456/callback";
    }

    SparkSpotifyAuthManager.configure({
      clientId: clientId.trim(),
      redirectUri: redirectUri
    });

    // Start OAuth flow (PKCE - getAuthUrl is async)
    authManager.getAuthUrl().then(function(url) {
      if (typeof window.electron !== "undefined" && window.electron.shell) {
        window.electron.shell.openExternal(url);
      } else {
        window.location.href = url;
      }
    }).catch(function(err) {
      console.error("Spotify auth URL generation failed:", err);
    });

    if (window.electron && window.electron.spotify && window.electron.spotify.onCallback) {
      window.electron.spotify.onCallback(function(code) {
        authManager.exchangeCode(code).then(function(tokenData) {
          if (tokenData && tokenData.access_token && playAlongState.initSpotify(tokenData.access_token)) {
            if (typeof render === "function") render();
          }
        });
      });
    }
  };


  window.sparkPlayAlongSaveClientId = function() {
    var input = document.getElementById("spotify-client-id-input");
    if (!input || !input.value.trim()) return;
    localStorage.setItem("sparksuite_spotify_client_id", input.value.trim());
    sparkPlayAlongConnectSpotify();
  };

  // Handle spotifyConnect action from act() dispatcher
  window.handleSpotifyConnectAction = function() {
    window.sparkPlayAlongConnectSpotify();
  };

})();
