(function() {
  function getMediaCore() {
    return window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  }

  function applyMediaFamilyRuntimeUpdate(update, fallback) {
    if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
      SparkProgressBridge.applyLegacyActivityRuntime(update || {});
      return true;
    }
    if (typeof fallback === "function") fallback();
    return false;
  }

  function setLegacyFields(setFields, clearIntervals, save) {
    applyMediaFamilyRuntimeUpdate({
      setFields: setFields,
      clearIntervals: clearIntervals || [],
      save: save
    }, function() {
      var key;
      for (key in setFields) {
        if (Object.prototype.hasOwnProperty.call(setFields, key)) S[key] = setFields[key];
      }
      if (Array.isArray(clearIntervals)) {
        clearIntervals.forEach(function(name) {
          if (T && T[name]) clearInterval(T[name]);
        });
      }
    });
  }

  function handleMediaAction(a, v) {
    if (a === "openStrum") {
      var sp;
      for (var i = 0; i < STRUM_PATTERNS.length; i++) {
        if (STRUM_PATTERNS[i].name === v) sp = STRUM_PATTERNS[i];
      }
      if (sp && sp.level <= S.level) {
        var core = getMediaCore();
        if (core && typeof core.openLegacyStrumPattern === "function") {
          core.openLegacyStrumPattern({ pattern: sp });
        }
        setLegacyFields({
          selectedStrum: sp,
          strumActive: false,
          _strumBeat: -1,
          screen: SCR.STRUM
        }, ["strum"]);
        render();
      }
      return true;
    }

    if (a === "toggleStrum") {
      snd("click");
      var nextStrumActive = !S.strumActive;
      var core = getMediaCore();
      if (core && typeof core.syncLegacyStrumRuntimeState === "function") {
        core.syncLegacyStrumRuntimeState({
          pattern: S.selectedStrum,
          active: nextStrumActive,
          beat: nextStrumActive ? 0 : -1
        });
      }
      setLegacyFields(
        nextStrumActive ? { strumActive: true, _strumBeat: 0 } : { strumActive: false, _strumBeat: -1 },
        nextStrumActive ? [] : ["strum"]
      );
      if (S.strumActive) {
        var p = S.selectedStrum.pattern;
        var ms = 60000 / S.selectedStrum.bpm / (p.length > 4 ? 2 : 1);
        var chordName = S.currentChord ? S.currentChord.name : "E Major";
        if (p[0] !== "x") strumChord(chordName);
        render();
        T.strum = setInterval(function() {
          S._strumBeat = (S._strumBeat + 1) % p.length;
          if (core && typeof core.syncLegacyStrumRuntimeState === "function") {
            core.syncLegacyStrumRuntimeState({
              pattern: S.selectedStrum,
              active: true,
              beat: S._strumBeat
            });
          }
          if (p[S._strumBeat] !== "x") strumChord(chordName);
          render();
        }, ms);
      } else {
        clearInterval(T.strum);
        S._strumBeat = -1;
        render();
      }
      return true;
    }

    if (a === "stemOpenFile") {
      if (!window.electron) return true;
      setLegacyFields({ stemError: null });
      render();
      window.electron.stems.openFile().then(function(result) {
        if (!result) return;
        setLegacyFields({ stemFile: result, stemError: null, stemStatus: "idle" });
        render();
        window.electron.stems.checkCache(result.filePath).then(function(cached) {
          if (cached) {
            setLegacyFields({ stemPaths: cached, stemStatus: "ready" });
            render();
            _loadStemFileUrls(cached);
          } else {
            act("stemSeparate");
          }
        });
      });
      return true;
    }

    if (a === "stemSeparate") {
      if (!window.electron || !S.stemFile) return true;
      setLegacyFields({ stemStatus: "separating", stemProgress: 0, stemError: null });
      render();
      var removeProgress = window.electron.stems.onProgress(function(data) {
        if (data.line) {
          applyMediaFamilyRuntimeUpdate({
            setFields: { stemProgress: Math.min(95, S.stemProgress + 2) },
            save: false
          }, function() {
            S.stemProgress = Math.min(95, S.stemProgress + 2);
          });
          render();
        }
      });
      window.electron.stems.separate(S.stemFile.filePath).then(function(result) {
        removeProgress();
        setLegacyFields({ stemPaths: result.stemPaths, stemStatus: "ready", stemProgress: 100 });
        render();
        _loadStemFileUrls(result.stemPaths);
      }).catch(function(err) {
        removeProgress();
        setLegacyFields({ stemStatus: "error", stemError: err.message || "Separation failed" });
        render();
      });
      return true;
    }

    if (a === "stemCancel") {
      if (window.electron) window.electron.stems.cancel();
      setLegacyFields({ stemStatus: "idle", stemProgress: 0 });
      render();
      return true;
    }

    if (a === "stemOpen") {
      openStemPlayerRequest();
      setLegacyFields({ screen: SCR.STEMS });
      render();
      return true;
    }

    if (a === "stemBack") {
      cleanupStems();
      closeStemPlayerRequest();
      setLegacyFields({ screen: SCR.HOME, tab: TAB.SONGS, songsSubTab: "stems" });
      render();
      return true;
    }

    if (a === "stemToggle") {
      S.stemToggles[v] = !S.stemToggles[v];
      setStemMuted(v, !S.stemToggles[v]);
      render();
      return true;
    }

    if (a === "stemPlay") {
      if (S.stemPlaying) pauseStems();
      else playStems();
      return true;
    }

    if (a === "stemSeek") {
      seekStems(parseFloat(v));
      render();
      return true;
    }

    if (a === "stemVolume") {
      S.stemVolume = parseFloat(v);
      setStemVolume(S.stemVolume);
      render();
      return true;
    }

    if (a === "setTone") {
      if (STRUM_TONES[v] || v === "guitar") {
        S.strumTone = v;
        saveState();
        render();
      }
      return true;
    }

    if (a === "selectScale") {
      S.selectedScale = v;
      render();
      return true;
    }

    return false;
  }

  window.registerSparkActionFamily("media", handleMediaAction);
})();
