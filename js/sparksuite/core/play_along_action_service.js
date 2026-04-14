(function() {
  function escapeHtml(value) {
    if (!value) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function SparkPlayAlongActionService(stateService) {
    this.stateService = stateService || null;
    this.searchResults = [];
  }

  SparkPlayAlongActionService.bootstrapController = function() {
    if (typeof window === "undefined") return;
    var stateService = new SparkPlayAlongStateService();
    var actionService = new SparkPlayAlongActionService(stateService);
    var renderer = new SparkPlayAlongRenderer(stateService);
    var onRender = function() {
      if (typeof render === "function") render();
    };
    var stop = renderer.finishSessionResults.bind(renderer, onRender);
    var startLoop = renderer.startSessionLoop.bind(renderer, stop);
    var controllerBindings = actionService.createControllerBindings(onRender, startLoop);
    Object.assign(window, {
      sparkPlayAlongStop: stop,
      sparkPlayAlongStartLoop: startLoop,
      sparkPlayAlongSelectWithFile: controllerBindings.searchSelectWithFile,
      sparkPlayAlongSelect: controllerBindings.searchSelect,
      sparkPlayAlongSearch: controllerBindings.search,
      sparkPlayAlongLaunchDemo: controllerBindings.launchDemo,
      sparkPlayAlongLaunchRecent: controllerBindings.launchRecent,
      sparkPlayAlongSaveTrack: controllerBindings.saveTrack,
      sparkPlayAlongLaunchSaved: controllerBindings.launchSaved,
      sparkPlayAlongRemoveSaved: controllerBindings.removeSaved,
      sparkPlayAlongClearSaved: controllerBindings.clearSaved,
      sparkPlayAlongLaunchBookmark: controllerBindings.launchBookmark,
      sparkPlayAlongLaunchBookmarkByKey: controllerBindings.launchBookmarkByKey,
      sparkPlayAlongRemoveRecent: controllerBindings.removeRecent,
      sparkPlayAlongClearRecent: controllerBindings.clearRecent,
      sparkPlayAlongRemoveBookmark: controllerBindings.removeBookmark,
      sparkPlayAlongClearBookmarks: controllerBindings.clearBookmarks,
      sparkPlayAlongSetDifficulty: controllerBindings.setDifficulty,
      sparkPlayAlongLoadFile: controllerBindings.loadFile,
      sparkPlayAlongToggleDebug: controllerBindings.toggleDebug,
      sparkPlayAlongAgain: controllerBindings.again,
      sparkPlayAlongReplayDrill: controllerBindings.replayDrill,
      sparkPlayAlongReplayFullSong: controllerBindings.replayFullSong,
      sparkPlayAlongTogglePause: controllerBindings.togglePause,
      sparkPlayAlongToggleLoop: controllerBindings.toggleLoop,
      sparkPlayAlongSetLoopTarget: controllerBindings.setLoopTarget,
      sparkPlayAlongPrevSection: controllerBindings.prevSection,
      sparkPlayAlongNextSection: controllerBindings.nextSection,
      sparkPlayAlongBookmarkCurrentSection: controllerBindings.bookmarkCurrentSection,
      sparkPlayAlongJumpToWeakSection: controllerBindings.jumpToWeakSection,
      sparkPlayAlongJumpToSectionRecommendation: controllerBindings.jumpToSectionRecommendation,
      sparkPlayAlongPickNew: controllerBindings.pickNew,
      sparkPlayAlongStartDrill: controllerBindings.startDrill,
      openPlayAlong: controllerBindings.openHome,
      sparkPlayAlongConnectSpotify: controllerBindings.connectSpotify,
      sparkPlayAlongSaveClientId: controllerBindings.saveSpotifyClientId,
      sparkPlayAlongReplay: controllerBindings.again,
      handleSpotifyConnectAction: controllerBindings.connectSpotify
    });
  };

  SparkPlayAlongActionService.prototype.createControllerBindings = function(onRender, onStartLoop) {
    var actionService = this;
    var stateService = this.stateService;
    var launchPreparedSession = function(params) {
      return stateService.launchPreparedSession(params, onRender, onStartLoop);
    };
    var bindings = {
      search: function(query) {
        var resultsEl = actionService.getSearchResultsContainer();
        if (!actionService.searchTracks(query, function(tracks) {
          actionService.renderSearchResults(resultsEl, tracks);
        })) {
          actionService.clearSearchResultsMarkup(resultsEl);
          return false;
        }
        return true;
      },
      toggleDebug: function() {
        window._playAlongDebug = !window._playAlongDebug;

        if (window._playAlongDebug && typeof SparkDebugDashboard !== "undefined") {
          window._playAlongDashboard = new SparkDebugDashboard(document.body);
          window._playAlongDashboard.show();
        } else if (!window._playAlongDebug && window._playAlongDashboard) {
          window._playAlongDashboard.hide();
        }

        return !!window._playAlongDebug;
      },
      again: stateService.replayOrShowHome.bind(stateService, launchPreparedSession, onRender),
      replayDrill: stateService.replayDrill.bind(stateService, launchPreparedSession),
      replayFullSong: stateService.replayFullSong.bind(stateService, launchPreparedSession),
      launchDemo: function(value) {
        var params = stateService.prepareFreshLaunch(actionService.getDemoLaunchParams(value));
        launchPreparedSession(params);
        return !!params;
      },
      launchRecent: function(value) {
        return stateService.launchRecent(value, launchPreparedSession);
      },
      saveTrack: function(value) {
        return actionService.saveSearchResult(value).then(function(saved) {
          if (saved) onRender();
          return saved;
        });
      },
      launchSaved: function(value) {
        return stateService.launchSaved(value, launchPreparedSession);
      },
      removeSaved: function(value) {
        return stateService.removeSavedTrackWithRender(value, onRender);
      },
      clearSaved: function() {
        return stateService.clearSavedTracksWithRender(onRender);
      },
      launchBookmark: function(value) {
        return stateService.launchBookmark(value, launchPreparedSession);
      },
      launchBookmarkByKey: function(first, second) {
        return stateService.launchBookmarkByKey(first, second, launchPreparedSession);
      },
      removeRecent: function(value) {
        return stateService.removeRecentWithRender(value, onRender);
      },
      clearRecent: function() {
        return stateService.clearRecentWithRender(onRender);
      },
      removeBookmark: function(value) {
        return stateService.removeBookmarkWithRender(value, onRender);
      },
      clearBookmarks: function() {
        return stateService.clearBookmarksWithRender(onRender);
      },
      setDifficulty: function(value) {
        var result = actionService.setDifficulty(value);
        onRender();
        return result;
      },
      loadFile: function(value) {
        var params;
        if (!value) return false;
        params = stateService.prepareLocalFileLaunch(value, stateService.getInstrumentId());
        launchPreparedSession(params);
        return !!params;
      },
      togglePause: function() {
        return stateService.togglePause(onRender);
      },
      toggleLoop: function() {
        return stateService.toggleLoopWithRender(onRender);
      },
      setLoopTarget: function(value) {
        return stateService.setLoopTargetWithRender(value, onRender);
      },
      prevSection: function() {
        return stateService.prevSection(onRender);
      },
      nextSection: function() {
        return stateService.nextSection(onRender);
      },
      bookmarkCurrentSection: function() {
        return stateService.saveCurrentSectionBookmarkWithRender(onRender);
      },
      pickNew: function() {
        return stateService.resetToHome(onRender);
      },
      startDrill: function(value) {
        return stateService.startDrill(value, launchPreparedSession, onRender);
      },
      openHome: stateService.showHome.bind(stateService, onRender),
      connectSpotify: function() {
        return actionService.connectSpotify(function() {
          onRender();
        });
      },
      saveSpotifyClientId: function() {
        if (!actionService.saveSpotifyClientIdFromPrompt()) return false;
        return actionService.connectSpotify(function() {
          onRender();
        });
      },
      jumpToWeakSection: stateService.launchWeakSection.bind(stateService, launchPreparedSession),
      jumpToSectionRecommendation: function(first, second) {
        return stateService.launchSectionRecommendation(first, second, launchPreparedSession);
      },
      searchSelectWithFile: function(index, file) {
        if (!file) return false;
        launchPreparedSession(actionService.prepareSearchLaunch(index, { audioFile: file }));
        return true;
      }
    };
    bindings.searchSelect = function(index) {
      if (actionService.shouldUseCachedSearchChart(index)) {
        launchPreparedSession(actionService.prepareSearchLaunch(index));
        return true;
      }
      return actionService.showSearchUploadPromptForIndex(index, bindings.searchSelectWithFile, launchPreparedSession);
    };
    return bindings;
  };

  SparkPlayAlongActionService.prototype.getDifficulty = function() {
    return this.stateService.getDifficulty();
  };

  SparkPlayAlongActionService.prototype.setDifficulty = function(level) {
    return this.stateService.setDifficulty(level);
  };

  SparkPlayAlongActionService.prototype.setSearchResults = function(results) {
    this.searchResults = Array.isArray(results) ? results.slice() : [];
    return this.searchResults;
  };

  SparkPlayAlongActionService.prototype.clearSearchResults = function() {
    this.searchResults = [];
    return this.searchResults;
  };

  SparkPlayAlongActionService.prototype.getSearchResult = function(index) {
    return this.searchResults[index] || null;
  };

  SparkPlayAlongActionService.prototype.getSearchLaunchParams = function(index, overrides) {
    var track = this.getSearchResult(index);
    if (!track) return null;
    return this.buildLaunchParams(track, overrides);
  };

  SparkPlayAlongActionService.prototype.prepareSearchLaunch = function(index, overrides) {
    var params = this.getSearchLaunchParams(index, overrides);
    if (!params) return null;
    return this.stateService.prepareFreshLaunch(params);
  };

  SparkPlayAlongActionService.prototype.shouldUseCachedSearchChart = function(index) {
    var track = this.getSearchResult(index);
    return !!(track && this.hasCachedChart(track.id));
  };

  SparkPlayAlongActionService.prototype.searchTracks = function(query, onResults) {
    var core = this.stateService.getCore();
    if (!query || query.length < 2) {
      if (typeof onResults === "function") onResults(this.clearSearchResults());
      return false;
    }
    if (!core || !core.spotifySearch || typeof core.spotifySearch.searchDebounced !== "function") return false;

    core.spotifySearch.searchDebounced(query, function(tracks) {
      var results = this.setSearchResults(tracks || []);
      if (typeof onResults === "function") onResults(results);
    }.bind(this));
    return true;
  };

  SparkPlayAlongActionService.prototype.buildSearchResultsMarkup = function(tracks) {
    var html = "";
    var i;
    var track;
    var name;
    var artist;
    var imgTag;
    tracks = Array.isArray(tracks) ? tracks : [];
    for (i = 0; i < tracks.length; i++) {
      track = tracks[i] || {};
      name = escapeHtml(track.name || "");
      artist = escapeHtml(track.artist || "");
      imgTag = track.image
        ? "<img src=\"" + escapeHtml(track.image) + "\" width=\"40\" height=\"40\" class=\"song-item-art\"/>"
        : "";
      html += "<div class=\"song-item\" onclick=\"act('playAlongSelect'," + i + ")\">"
        + imgTag
        + "<div class=\"song-item-info\">"
        + "<strong class=\"song-item-name\">" + name + "</strong>"
        + "<span class=\"song-item-artist\">" + artist + "</span>"
        + "</div>"
        + "<button class=\"btn btn-sm\" onclick=\"event.stopPropagation();act('playAlongSaveTrack'," + i + ")\">Save</button>"
        + "</div>";
    }
    return html;
  };

  SparkPlayAlongActionService.prototype.getSearchResultsContainer = function() {
    return document.getElementById("play-along-results");
  };

  SparkPlayAlongActionService.prototype.getSpotifyPromptContainer = function() {
    return this.getSearchResultsContainer() || document.getElementById("app");
  };

  SparkPlayAlongActionService.prototype.renderSearchResults = function(container, tracks) {
    if (!container) return false;
    container.innerHTML = this.buildSearchResultsMarkup(tracks);
    return true;
  };

  SparkPlayAlongActionService.prototype.clearSearchResultsMarkup = function(container) {
    if (!container) return false;
    container.innerHTML = "";
    return true;
  };

  SparkPlayAlongActionService.prototype.hasCachedChart = function(trackId) {
    var core = this.stateService.getCore();
    return !!(core && core.chartService &&
      typeof core.chartService.hasCachedChart === "function" &&
      core.chartService.hasCachedChart(trackId));
  };

  SparkPlayAlongActionService.prototype.buildLaunchParams = function(track, overrides) {
    var params;
    overrides = overrides || {};
    if (!track) return null;
    params = {
      trackId: overrides.trackId != null ? overrides.trackId : (track.id || track.trackId || null),
      trackUri: overrides.trackUri != null ? overrides.trackUri : (track.uri || track.trackUri || null),
      title: overrides.title != null ? overrides.title : (track.name || track.title || null),
      artist: overrides.artist != null ? overrides.artist : (track.artist || null),
      audioOffsetMs: overrides.audioOffsetMs != null ? overrides.audioOffsetMs : (track.audioOffsetMs || 0),
      difficulty: overrides.difficulty || track.difficulty || this.getDifficulty(),
      instrument: overrides.instrument || track.instrument || this.stateService.getInstrumentId()
    };
    if (Object.prototype.hasOwnProperty.call(overrides, "audioFile")) {
      params.audioFile = overrides.audioFile;
    }
    return params;
  };

  SparkPlayAlongActionService.prototype.buildUploadPromptMarkup = function(track) {
    var songLabel = (track.name || "this track") + (track.artist ? " by " + track.artist : "");
    return "<div class=\"play-along-upload-prompt\">"
      + "<p>Drop an audio file to build an accurate chart for <strong>" + escapeHtml(songLabel) + "</strong></p>"
      + "<input type=\"file\" id=\"play-along-audio-input\" accept=\"audio/*\" />"
      + "<button class=\"btn btn-sm\" id=\"play-along-skip-btn\">Skip (use default)</button>"
      + "</div>";
  };

  SparkPlayAlongActionService.prototype.showUploadPrompt = function(container, index, onSelectWithFile, onSkip) {
    var track = this.getSearchResult(index);
    if (!container || !track) return false;
    container.innerHTML = this.buildUploadPromptMarkup(track);
    this.bindUploadPromptHandlers(index, onSelectWithFile, onSkip);
    return true;
  };

  SparkPlayAlongActionService.prototype.showSearchUploadPrompt = function(container, index, onSelectWithFile, onSkipLaunch) {
    return this.showUploadPrompt(container, index, onSelectWithFile, function(selectedIndex) {
      if (typeof onSkipLaunch === "function") {
        onSkipLaunch(this.prepareSearchLaunch(selectedIndex));
      }
    }.bind(this));
  };

  SparkPlayAlongActionService.prototype.showSearchUploadPromptForIndex = function(index, onSelectWithFile, onSkipLaunch) {
    var container = this.getSearchResultsContainer();
    if (!container) return false;
    return this.showSearchUploadPrompt(container, index, onSelectWithFile, onSkipLaunch);
  };

  SparkPlayAlongActionService.prototype.bindUploadPromptHandlers = function(index, onSelectWithFile, onSkip) {
    var track = this.getSearchResult(index);
    var fileInput = document.getElementById("play-along-audio-input");
    var skipBtn = document.getElementById("play-along-skip-btn");
    if (!track) return false;

    if (fileInput) {
      fileInput.addEventListener("change", function() {
        var file = fileInput.files && fileInput.files[0];
        if (file && typeof onSelectWithFile === "function") {
          onSelectWithFile(index, file);
        }
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener("click", function() {
        if (typeof onSkip === "function") onSkip(index, track);
      });
    }

    return !!(fileInput || skipBtn);
  };

  SparkPlayAlongActionService.prototype.getSpotifyClientId = function() {
    if (typeof localStorage === "undefined" || !localStorage) return "";
    return localStorage.getItem("sparksuite_spotify_client_id") || "";
  };

  SparkPlayAlongActionService.prototype.saveSpotifyClientId = function(value) {
    var clientId = value && String(value).trim();
    if (!clientId || typeof localStorage === "undefined" || !localStorage) return false;
    localStorage.setItem("sparksuite_spotify_client_id", clientId);
    return true;
  };

  SparkPlayAlongActionService.prototype.saveSpotifyClientIdFromPrompt = function() {
    var input = document.getElementById("spotify-client-id-input");
    return !!(input && this.saveSpotifyClientId(input.value));
  };

  SparkPlayAlongActionService.prototype.createSpotifyAuthManager = function() {
    if (typeof SparkSpotifyAuthManager === "undefined") return null;
    return new SparkSpotifyAuthManager();
  };

  SparkPlayAlongActionService.prototype.buildSpotifyClientIdPromptMarkup = function() {
    return "<div class=card style=padding:20px;text-align:center>"
      + "<div style=font-size:14px;font-weight:700;margin-bottom:8px>Spotify Client ID</div>"
      + "<div style=font-size:12px;color:var(--text-dim);margin-bottom:12px>Get yours at developer.spotify.com/dashboard</div>"
      + "<input id=spotify-client-id-input class=input type=text placeholder=Paste client ID here style=width:100%;margin-bottom:8px>"
      + "<button class=btn onclick=\"act('playAlongSaveClientId')\" style=background:var(--accent);color:#fff>Save and Connect</button>"
      + "</div>";
  };

  SparkPlayAlongActionService.prototype.showSpotifyClientIdPrompt = function(container) {
    if (!container) return false;
    container.innerHTML = this.buildSpotifyClientIdPromptMarkup();
    return true;
  };

  SparkPlayAlongActionService.prototype.getSpotifyRedirectUri = function() {
    var redirectUri = window.location.origin + window.location.pathname.replace(/[^\/]*$/, "") + "index.html";
    if (redirectUri.indexOf("file://") === 0) {
      redirectUri = "http://127.0.0.1:3456/callback";
    }
    return redirectUri;
  };

  SparkPlayAlongActionService.prototype.configureSpotifyAuth = function(clientId) {
    if (typeof SparkSpotifyAuthManager === "undefined" || !clientId) return false;
    SparkSpotifyAuthManager.configure({
      clientId: String(clientId).trim(),
      redirectUri: this.getSpotifyRedirectUri()
    });
    return true;
  };

  SparkPlayAlongActionService.prototype.openSpotifyAuthUrl = function(url) {
    if (!url) return false;
    if (typeof window.electron !== "undefined" && window.electron.shell) {
      window.electron.shell.openExternal(url);
    } else {
      window.location.href = url;
    }
    return true;
  };

  SparkPlayAlongActionService.prototype.bindSpotifyCallback = function(authManager, onTokenData) {
    if (!authManager || !window.electron || !window.electron.spotify || !window.electron.spotify.onCallback) {
      return false;
    }
    window.electron.spotify.onCallback(function(code) {
      authManager.exchangeCode(code).then(function(tokenData) {
        if (typeof onTokenData === "function") onTokenData(tokenData);
      });
    });
    return true;
  };

  SparkPlayAlongActionService.prototype.resumeSpotifyConnection = function(authManager, onToken) {
    if (!authManager || typeof authManager.isConnected !== "function" || !authManager.isConnected()) {
      return Promise.resolve(false);
    }
    return authManager.getValidToken().then(function(token) {
      if (typeof onToken === "function") onToken(token);
      return !!token;
    });
  };

  SparkPlayAlongActionService.prototype.requestSpotifyAuthUrl = function(authManager) {
    if (!authManager || typeof authManager.getAuthUrl !== "function") {
      return Promise.reject(new Error("Spotify auth manager unavailable"));
    }
    return authManager.getAuthUrl();
  };

  SparkPlayAlongActionService.prototype.connectSpotify = function(onConnected) {
    var authManager = this.createSpotifyAuthManager();
    if (!authManager) {
      alert("Spotify integration not loaded.");
      return Promise.resolve(false);
    }

    return this.resumeSpotifyConnection(authManager, function(token) {
      if (token && this.stateService.initSpotify(token)) {
        if (typeof onConnected === "function") onConnected();
      }
    }.bind(this)).then(function(reused) {
      var clientId;
      if (reused) return true;

      clientId = this.getSpotifyClientId();
      if (!clientId) {
        this.showSpotifyClientIdPrompt(this.getSpotifyPromptContainer());
        return false;
      }

      if (!this.configureSpotifyAuth(clientId)) return false;

      this.requestSpotifyAuthUrl(authManager).then(function(url) {
        this.openSpotifyAuthUrl(url);
      }.bind(this)).catch(function(err) {
        console.error("Spotify auth URL generation failed:", err);
      });

      this.bindSpotifyCallback(authManager, function(tokenData) {
        if (tokenData && tokenData.access_token && this.stateService.initSpotify(tokenData.access_token)) {
          if (typeof onConnected === "function") onConnected();
        }
      }.bind(this));

      return true;
    }.bind(this));
  };

  SparkPlayAlongActionService.prototype.createSavedTrack = function(track) {
    if (!track) return null;
    return {
      trackId: track.id,
      trackUri: track.uri || null,
      title: track.name || "Spotify Track",
      artist: track.artist || "",
      image: track.image || null,
      duration: track.duration || 0,
      bpm: null,
      source: "spotify",
      savedAt: Date.now(),
      params: this.buildLaunchParams(track)
    };
  };

  SparkPlayAlongActionService.prototype.enrichSavedTrack = function(track) {
    var core = this.stateService.getCore();
    var saved = this.createSavedTrack(track);
    if (!saved) return Promise.resolve(null);
    if (!core || !core.spotifyClient || typeof core.spotifyClient.getAudioFeatures !== "function") {
      return Promise.resolve(saved);
    }
    return core.spotifyClient.getAudioFeatures(track.id).then(function(features) {
      if (features && typeof features.tempo === "number") {
        saved.bpm = Math.round(features.tempo);
      }
      return saved;
    }).catch(function() {
      return saved;
    });
  };

  SparkPlayAlongActionService.prototype.saveSearchResult = function(index) {
    var track = this.getSearchResult(index);
    if (!track) {
      return Promise.resolve(false);
    }
    return this.enrichSavedTrack(track).then(function(saved) {
      return !!this.stateService.saveTrack(saved);
    }.bind(this));
  };

  SparkPlayAlongActionService.prototype.getDemo = function(index) {
    var demos = typeof window !== "undefined" && typeof window.getSparkPlayAlongDemos === "function"
      ? window.getSparkPlayAlongDemos()
      : [];
    return demos[index] || null;
  };

  SparkPlayAlongActionService.prototype.getDemoLaunchParams = function(index) {
    var demo = this.getDemo(index);
    if (!demo) return null;
    return this.buildLaunchParams(demo, {
      trackId: demo.trackId,
      trackUri: demo.trackUri || null,
      title: demo.title || null,
      audioOffsetMs: demo.audioOffsetMs || 0,
      difficulty: demo.difficulty || this.getDifficulty(),
      instrument: demo.instrument || "guitar"
    });
  };

  window.SparkPlayAlongActionService = SparkPlayAlongActionService;
})();
