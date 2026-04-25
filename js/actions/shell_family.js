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
      if (core && typeof core.updateRuntimeState === "function") {
        core.updateRuntimeState({
          activeScreen: "home",
          activeTab: v || null,
          transport: { status: "idle", positionMs: 0 }
        });
      }
      stopAllTimers();
      if (v === TAB.SONGS && S.songsSubTab === "community") fetchCommunity();
      render();
      return true;
    }

    return false;
  }

  window.registerSparkActionFamily("shell", handleShellAction);
})();
