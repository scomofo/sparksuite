(function(){

  function isDesktopBuild() {
    return typeof window.sparkDesktop !== 'undefined';
  }

  function resolveDesktopBackupAppId() {
    if (S.releaseInfo && S.releaseInfo.appId) return S.releaseInfo.appId;
    if (typeof SparkInstruments !== "undefined" && typeof SparkInstruments.getActive === "function") {
      var active = SparkInstruments.getActive();
      var activeId = active ? (active.id || active.appId || active.instrumentId || null) : null;
      if (activeId) return activeId;
    }
    return "sparksuite";
  }

  function getSparkCoreHandle() {
    if (typeof window !== "undefined" && window.sparkCore) return window.sparkCore;
    if (typeof sparkCore !== "undefined") return sparkCore;
    return null;
  }

  function resolveBackupStorage() {
    var core = getSparkCoreHandle();
    if (core && core.storage) return core.storage;
    if (typeof SparkSuiteStorage === "function") {
      return new SparkSuiteStorage();
    }
    return null;
  }

  async function exportEditorObjectDesktopAware() {
    if (!S.performEditorChart) return false;
    if (isDesktopBuild()) {
      var result = await window.sparkDesktop.saveJson(S.performEditorChart);
      return !!(result && result.ok);
    }
    // Fall back to browser export if available
    if (typeof exportEditorObject === "function") return exportEditorObject();
    return false;
  }

  async function openImportFileDesktopAware(options) {
    if (!isDesktopBuild()) return false;
    var result = await window.sparkDesktop.openJson(options || null);
    if (!result || !result.ok) return false;
    return result;
  }

  async function checkForDesktopUpdates(){
    if(!isDesktopBuild() || !window.sparkDesktop.checkForUpdates) return false;
    S.desktopInfo.updateStatus = "checking";
    if(typeof render === "function") render();
    var result = await window.sparkDesktop.checkForUpdates();
    if(!result || !result.ok){
      S.desktopInfo.updateStatus = "error";
      saveState();
      return false;
    }
    S.desktopInfo.lastUpdateCheckAt = Date.now();
    S.desktopInfo.updateStatus = result.updateAvailable ? "available" : "none";
    S.desktopInfo.version = result.currentVersion || S.desktopInfo.version;
    S.desktopInfo.latestVersion = result.latestVersion || null;
    S.desktopInfo.updateNotes = result.notes || "";
    saveState();
    if(typeof render === "function") render();
    return true;
  }

  function buildFullLocalBackup(){
    var storage = resolveBackupStorage();
    var userData = null;
    var debugBundle = null;
    if (storage && typeof exportSparkUserData === "function") {
      userData = exportSparkUserData({
        storage: storage
      });
    }
    if (typeof buildSparkDebugBundle === "function") {
      debugBundle = buildSparkDebugBundle({
        sparkCore: getSparkCoreHandle(),
        storage: storage
      });
    }
    return {
      exportedAt: Date.now(),
      app: resolveDesktopBackupAppId(),
      version: (S.releaseInfo && S.releaseInfo.version) || "dev",
      schemaVersion: storage && typeof storage.getCurrentSchemaVersion === "function"
        ? storage.getCurrentSchemaVersion()
        : null,
      userData: userData,
      debugBundle: debugBundle
    };
  }

  async function exportFullBackupDesktopAware(){
    var payload = buildFullLocalBackup();
    if(isDesktopBuild()){
      var result = await window.sparkDesktop.saveJson(payload);
      if(result && result.ok){
        S.desktopInfo.lastBackupAt = Date.now();
        saveState();
        return true;
      }
      return false;
    }
    return false;
  }

  window.isDesktopBuild = isDesktopBuild;
  window.exportEditorObjectDesktopAware = exportEditorObjectDesktopAware;
  window.openImportFileDesktopAware = openImportFileDesktopAware;
  window.checkForDesktopUpdates = checkForDesktopUpdates;
  window.buildFullLocalBackup = buildFullLocalBackup;
  window.exportFullBackupDesktopAware = exportFullBackupDesktopAware;

})();
