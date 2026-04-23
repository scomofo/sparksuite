(function() {
  function setLegacyFields(setFields, save) {
    if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
      SparkProgressBridge.applyLegacyActivityRuntime({ setFields: setFields, save: save });
    } else {
      var key;
      for (key in setFields) {
        if (Object.prototype.hasOwnProperty.call(setFields, key)) S[key] = setFields[key];
      }
    }
  }

  function handleShellAction(a, v) {
    if (a === "switchInstrumentBack") {
      if (typeof SparkInstruments !== "undefined" && SparkInstruments.deactivate) {
        SparkInstruments.deactivate();
      }
      S.activeInstrument = null;
      if (typeof saveState === "function") saveState();
      render();
      return true;
    }

    if (a === "switchInstrument" && v) {
      SparkInstruments.activate(v);
      S.activeInstrument = v;
      S.screen = SCR.HOME;
      S.tab = TAB.PRACTICE;
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
      if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
        window.sparkCore.updateRuntimeState({
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
