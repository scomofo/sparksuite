// ===== SparkSuite: Play Along Controller =====
// Glue layer connecting play-along page UI to SparkCore play-along pipeline.
(function() {

  function playAlongControllerRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
      ? SparkState.getRoot()
      : (typeof globalThis !== "undefined" ? globalThis.__sparkState || null : null);
    if (!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function playAlongControllerWrite(path, value) {
    if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      return SparkState.write(path, value);
    }
    var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
      ? SparkState.getRoot()
      : (typeof globalThis !== "undefined" ? globalThis.__sparkState || null : null);
    if (!root) return value;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for (i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    if (parts.length) cursor[parts[parts.length - 1]] = value;
    return value;
  }

  var playAlongState = new SparkPlayAlongStateService();
  var playAlongActions = new SparkPlayAlongActionService({
    stateService: playAlongState,
    getInstrumentId: getPlayAlongInstrumentId
  });
  var playAlongRenderer = new SparkPlayAlongRenderer({
    stateService: playAlongState
  });

  function getPlayAlongInstrumentId() {
    var runtime = window.sparkCore && typeof window.sparkCore.getRuntimeState === "function"
      ? window.sparkCore.getRuntimeState()
      : null;
    if (runtime && runtime.activeInstrumentId) return runtime.activeInstrumentId;
    var active = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive ? SparkInstruments.getActive() : null;
    if (active && active.appId) return active.appId;
    return "guitar";
  }

  function getActivePlayAlongParams() {
    if (!window.sparkCore) return null;
    return typeof window.sparkCore.getActivePlayAlongParams === "function"
      ? window.sparkCore.getActivePlayAlongParams()
      : (window.sparkCore._activeParams || null);
  }

  function getActivePlayAlongChart() {
    if (!window.sparkCore) return null;
    return typeof window.sparkCore.getActivePlayAlongChart === "function"
      ? window.sparkCore.getActivePlayAlongChart()
      : (window.sparkCore._activeChart || null);
  }

  function getLastPlayAlongOutcome() {
    return window.sparkCore && typeof window.sparkCore.getLastSessionOutcome === "function"
      ? window.sparkCore.getLastSessionOutcome()
      : (window.sparkCore ? window.sparkCore.lastSessionOutcome : null);
  }

  function clearPlayAlongError() {
    playAlongControllerWrite("playAlongError", null);
  }

  function setPlayAlongError(err) {
    var message = err && err.message ? err.message : err;
    playAlongControllerWrite("playAlongError", {
      message: message ? String(message) : "Unable to start play-along session.",
      source: "play_along_session",
      retryable: true
    });
  }

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
    if (!window.sparkCore) return;

    clearSelectedDrillState();

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
    if (!window.sparkCore) return;

    clearSelectedDrillState();
    launchPlayAlongSession(playAlongActions.buildLaunchParams(track, {
      audioFile: file,
    }));
  };

  window.sparkPlayAlongLaunchDemo = function(index) {
    var demo = playAlongActions.getDemo(index);
    if (!demo) return false;
    clearSelectedDrillState();
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
    var params = playAlongActions.getRecentLaunchParams(index);
    if (!params) return false;
    clearSelectedDrillState();
    launchPlayAlongSession(params);
    return true;
  };

  window.sparkPlayAlongSaveTrack = function(index) {
    var track = playAlongActions.getSearchResult(index);
    if (!track) return Promise.resolve(false);

    function persistSavedTrack(saved) {
      if (!playAlongState.saveTrack(saved)) return false;
      render();
      return true;
    }

    return playAlongActions.enrichSavedTrack(track).then(function(saved) {
      return persistSavedTrack(saved);
    });
  };

  window.sparkPlayAlongLaunchSaved = function(index) {
    var params = playAlongActions.getSavedLaunchParams(index);
    if (!params) return false;
    clearSelectedDrillState();
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
    var item = playAlongActions.getBookmark(index);
    if (!item || !item.params) return false;
    clearPlayAlongError();
    playAlongState.prepareBookmarkLaunch(item);
    launchPlayAlongSession(clonePlainObject(item.params));
    return true;
  };

  window.sparkPlayAlongLaunchBookmarkByKey = function(trackId, sectionIndex) {
    var index = playAlongActions.findBookmarkIndex(trackId, sectionIndex);
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
    if (!window.sparkCore) return;

    clearSelectedDrillState();
    launchPlayAlongSession({
      audioFile: file,
      difficulty: playAlongControllerRead("spotifyDifficulty", "easy") || "easy",
      instrument: getPlayAlongInstrumentId()
    });
  };

  // ---- Game Loop ----

  window.sparkPlayAlongStartLoop = function() {
    if (!window.sparkCore || typeof window.sparkCore.startPlayAlongRenderLoop !== "function") return;
    window.sparkCore.startPlayAlongRenderLoop({
      enforceLoopWindow: enforceLoopWindow,
      onFrame: function(result) {
        playAlongRenderer.renderFrame(result, {
          chart: getActivePlayAlongChart()
        });
      }
    });
  };

  // ---- Stop ----

  window.sparkPlayAlongStop = function() {
    var outcome = null;
    if (window.sparkCore && typeof window.sparkCore.stopPlayAlongRenderLoop === "function") {
      window.sparkCore.stopPlayAlongRenderLoop();
    }
    if (window.sparkCore) {
      outcome = window.sparkCore.completePlayAlongSession();
      outcome = playAlongState.enrichOutcomeWithLoopSummary(outcome, buildCurrentSectionBookmark());
      window.sparkCore.lastSessionOutcome = outcome;
    }
    playAlongControllerWrite("screen", SCR.PLAY_ALONG_RESULTS);
    render();

    // Draw heatmap after render
    setTimeout(function() {
      var heatmapCanvas = document.getElementById("play-along-heatmap");
      if (heatmapCanvas && window.sparkCore && window.sparkCore.drawHeatmap) {
        window.sparkCore.drawHeatmap(heatmapCanvas);
      }
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
    var params = getActivePlayAlongParams();
    if (params) {
      launchPlayAlongSession(params);
    } else {
      playAlongControllerWrite("screen", SCR.PLAY_ALONG);
      render();
    }
  };

  window.sparkPlayAlongReplay = function() {
    return window.sparkPlayAlongAgain();
  };

  window.sparkPlayAlongReplayDrill = function() {
    var outcome = getLastPlayAlongOutcome();
    var drills = outcome && Array.isArray(outcome.drills) ? outcome.drills : [];
    if (drills.length > 0) {
      return window.sparkPlayAlongStartDrill(0);
    }
    return window.sparkPlayAlongReplay();
  };

  window.sparkPlayAlongReplayFullSong = function() {
    var params = getActivePlayAlongParams();
    if (!playAlongState.prepareFullSongReplay() || !params) return false;
    clearPlayAlongError();
    return launchPlayAlongSession(clonePlainObject(params));
  };

  window.sparkPlayAlongTogglePause = function() {
    if (!window.sparkCore) return false;

    if (playAlongState.getStateValue("playAlongPaused", false)) {
      resumePlayAlongTransport();
      playAlongState.togglePaused();
    } else {
      pausePlayAlongTransport();
      playAlongState.togglePaused();
    }
    render();
    return playAlongState.getStateValue("playAlongPaused", false);
  };

  window.sparkPlayAlongToggleLoop = function() {
    clearPlayAlongError();
    playAlongState.toggleLoop();
    render();
    return !!playAlongState.getStateValue("playAlongLoop", false);
  };

  window.sparkPlayAlongSetLoopTarget = function(target) {
    if (!playAlongState.setLoopTarget(target)) return false;
    render();
    return true;
  };

  window.sparkPlayAlongPrevSection = function() {
    return stepPlayAlongSection(-1);
  };

  window.sparkPlayAlongNextSection = function() {
    return stepPlayAlongSection(1);
  };

  window.sparkPlayAlongBookmarkCurrentSection = function() {
    var bookmark = buildCurrentSectionBookmark();
    if (!bookmark) return false;
    rememberPlayAlongBookmark(bookmark);
    render();
    return true;
  };

  window.sparkPlayAlongJumpToWeakSection = function() {
    var outcome = getLastPlayAlongOutcome();
    var sectionSummary = outcome && outcome.sectionSummary ? outcome.sectionSummary : null;
    var params = getActivePlayAlongParams();
    if (!sectionSummary || !params) return false;
    clearSelectedDrillState();
    playAlongState.activateSectionLoop(sectionSummary.sectionIndex || 0);
    return launchPlayAlongSession(clonePlainObject(params));
  };

  window.sparkPlayAlongJumpToSectionRecommendation = function(trackId, sectionIndex) {
    var params = null;
    var activeParams = getActivePlayAlongParams();
    if (activeParams && activeParams.trackId === trackId) {
      params = clonePlainObject(activeParams);
    }
    if (!params) {
      var recent = playAlongState.getRecent();
      for (var i = 0; i < recent.length; i++) {
        if (recent[i] && recent[i].trackId === trackId && recent[i].params) {
          params = clonePlainObject(recent[i].params);
          break;
        }
      }
    }
    if (!params) return false;
    clearSelectedDrillState();
    playAlongState.activateSectionLoop(sectionIndex || 0);
    return launchPlayAlongSession(params);
  };

  window.sparkPlayAlongPickNew = function() {
    clearSelectedDrillState();
    playAlongControllerWrite("screen", SCR.PLAY_ALONG);
    render();
  };

  window.sparkPlayAlongStartDrill = function(index) {
    var outcome = getLastPlayAlongOutcome();
    var drills = outcome && Array.isArray(outcome.drills) ? outcome.drills : [];
    var drill = drills[index] || null;
    if (!drill) return false;
    playAlongState.selectDrill(drill);
    clearPlayAlongError();
    var params = getActivePlayAlongParams();
    if (params) {
      launchPlayAlongSession(params);
      return true;
    }
    playAlongControllerWrite("screen", SCR.PLAY_ALONG);
    render();
    return true;
  };

  // ---- Navigation Helper ----

  window.openPlayAlong = function() {
    playAlongControllerWrite("screen", SCR.PLAY_ALONG);
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

  function pausePlayAlongTransport() {
    var core = window.sparkCore;
    if (!core || typeof core.pausePlayAlongTransport !== "function") return;
    core.pausePlayAlongTransport();
  }

  function resumePlayAlongTransport() {
    var core = window.sparkCore;
    if (!core || typeof core.resumePlayAlongTransport !== "function") return;
    core.resumePlayAlongTransport();
  }

  function resolveLoopRange() {
    return playAlongState.resolveLoopRange();
  }

  function clearSelectedDrillState() {
    clearPlayAlongError();
    playAlongState.clearSelectedDrillState();
  }

  function launchPlayAlongSession(params) {
    if (!window.sparkCore || !params) return Promise.resolve(false);
    if (!params.instrument) params.instrument = getPlayAlongInstrumentId();
    clearPlayAlongError();
    rememberPlayAlongLaunch(params);
    return window.sparkCore.startPlayAlongSession(params).then(function() {
      playAlongControllerWrite("screen", SCR.PLAY_ALONG_SESSION);
      playAlongControllerWrite("playAlongPaused", false);
      applySelectedDrillState();
      render();
      sparkPlayAlongStartLoop();
      return true;
    }).catch(function(err) {
      console.error("[PlayAlong] Failed:", err);
      setPlayAlongError(err);
      playAlongControllerWrite("screen", SCR.PLAY_ALONG);
      render();
      return false;
    });
  }

  function applySelectedDrillState() {
    playAlongState.applySelectedDrillState({
      seekToMs: seekPlayAlongToMs,
      setPlaybackRate: setPlayAlongPlaybackRate
    });
  }

  function setPlayAlongPlaybackRate(speed) {
    var core = window.sparkCore;
    if (!core || typeof core.setPlayAlongPlaybackRate !== "function") return;
    core.setPlayAlongPlaybackRate(speed);
  }

  function enforceLoopWindow() {
    if (!window.sparkCore) return false;
    return playAlongState.enforceLoopWindow({
      getPlaybackTimeMs: function() {
        return typeof window.sparkCore.getPlaybackTimeMs === "function" ? window.sparkCore.getPlaybackTimeMs() : 0;
      },
      seekToMs: seekPlayAlongToMs,
      stopLoop: sparkPlayAlongStop
    });
  }

  function seekPlayAlongToMs(targetMs) {
    var core = window.sparkCore;
    if (!core || typeof core.seekPlayAlongToMs !== "function") return false;
    return core.seekPlayAlongToMs(targetMs);
  }

  function rememberPlayAlongLaunch(params) {
    playAlongState.rememberLaunch(params);
  }

  function clonePlainObject(value) {
    return playAlongState.cloneValue(value);
  }

  function buildCurrentSectionBookmark() {
    return playAlongState.buildCurrentSectionBookmark();
  }

  function rememberPlayAlongBookmark(bookmark) {
    playAlongState.rememberBookmark(bookmark);
  }

  function stepPlayAlongSection(delta) {
    return playAlongState.stepSection(delta, {
      seekToMs: seekPlayAlongToMs,
      onAfterStep: render
    });
  }

  function syncPlayAlongSectionIndex() {
    var chart = getActivePlayAlongChart();
    playAlongState.syncSectionIndex(chart);
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
        if (token && window.sparkCore && typeof window.sparkCore.initSpotify === "function") {
          window.sparkCore.initSpotify(token);
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
          if (tokenData && tokenData.access_token && window.sparkCore) {
            window.sparkCore.initSpotify(tokenData.access_token);
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
