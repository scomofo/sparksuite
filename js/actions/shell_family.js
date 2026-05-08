(function() {
  function getShellCore() {
    return window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  }

  function applyShellFamilyRuntimeUpdate(update, fallback) {
    if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
      SparkProgressBridge.applyLegacyActivityRuntime(update || {});
      return true;
    }
    if (typeof fallback === "function") fallback();
    return false;
  }

  function setLegacyFields(setFields, save) {
    applyShellFamilyRuntimeUpdate({ setFields: setFields, save: save }, function() {
      var key;
      for (key in setFields) {
        if (Object.prototype.hasOwnProperty.call(setFields, key)) S[key] = setFields[key];
      }
    });
  }

  function applyShellEffects(effects) {
    var i;
    if (!Array.isArray(effects)) return;
    for (i = 0; i < effects.length; i++) {
      if (!effects[i]) continue;
      if (effects[i].type === "scrollToTop") {
        if (typeof window === "undefined" || typeof window.scrollTo !== "function") continue;
        if (typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(function() { window.scrollTo(0, 0); });
        } else {
          setTimeout(function() { window.scrollTo(0, 0); }, 0);
        }
      } else if (effects[i].type === "fetchCommunity" && typeof fetchCommunity === "function") {
        fetchCommunity();
      }
    }
  }

  function handleShellAction(a, v) {
    if (a === "openLauncherView") {
      if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.openLauncherView === "function") {
        SparkInstruments.openLauncherView(v || "home");
        return true;
      }
      return false;
    }

    if (a === "showLauncher") {
      if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.showLauncher === "function") {
        SparkInstruments.showLauncher();
        return true;
      }
      return false;
    }

    if (a === "launcherSelectInstrument" && v) {
      if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.selectInstrument === "function") {
        SparkInstruments.selectInstrument(v);
        return true;
      }
      return false;
    }

    if (a === "launcherLaunchPerformance" && v) {
      if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.launchInstrumentPerformance === "function") {
        SparkInstruments.launchInstrumentPerformance(v);
        return true;
      }
      return false;
    }

    if (a === "switchInstrumentBack") {
      if (typeof SparkInstruments !== "undefined" && SparkInstruments.deactivate) {
        SparkInstruments.deactivate();
      }
      setLegacyFields({ activeInstrument: null }, false);
      if (typeof saveState === "function") saveState();
      render();
      return true;
    }

    if (a === "switchInstrument" && v) {
      SparkInstruments.activate(v);
      setLegacyFields({ activeInstrument: v, screen: SCR.HOME, tab: TAB.PRACTICE }, false);
      saveState();
      render();
      return true;
    }

    if (a === "tab") {
      setLegacyFields({
        tab: v,
        screen: SCR.HOME,
        earTrainQ: null,
        earTrainAns: null,
        selectedVoicing: 0
      });
      var core = getShellCore();
      if (!core || typeof core.buildShellTabChangeRequest !== "function") return false;
      var shellRequest = core.buildShellTabChangeRequest(v, {
        songsSubTab: S.songsSubTab
      });
      if (core && typeof core.updateRuntimeState === "function") {
        core.updateRuntimeState(shellRequest.runtimeState);
      }
      stopAllTimers();
      render();
      applyShellEffects(shellRequest && shellRequest.runtimeState ? shellRequest.runtimeState.shellEffects : []);
      return true;
    }

    return false;
  }

  window.registerSparkActionFamily("shell", handleShellAction);
})();
