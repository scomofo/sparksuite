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

  function buildFullLocalBackup(options){
    options = options || {};
    var storage = resolveBackupStorage();
    var userId = options.userId || null;
    var userData = null;
    var debugBundle = null;
    var payload;
    if (storage && typeof exportSparkUserData === "function") {
      userData = exportSparkUserData({
        storage: storage,
        userId: userId || undefined
      });
    }
    if (typeof buildSparkDebugBundle === "function") {
      debugBundle = buildSparkDebugBundle({
        sparkCore: getSparkCoreHandle(),
        storage: storage
      });
    }
    payload = {
      exportedAt: Date.now(),
      app: resolveDesktopBackupAppId(),
      version: (S.releaseInfo && S.releaseInfo.version) || "dev",
      schemaVersion: storage && typeof storage.getCurrentSchemaVersion === "function"
        ? storage.getCurrentSchemaVersion()
        : null,
      userData: userData,
      debugBundle: debugBundle
    };
    payload.integrity = summarizeFullLocalBackup(payload);
    return payload;
  }

  function summarizeFullLocalBackup(payload) {
    var userData = payload && payload.userData ? payload.userData : null;
    var profile = userData && userData.profile ? userData.profile : null;
    var journal = userData && Array.isArray(userData.practiceJournal) ? userData.practiceJournal : [];
    var debugBundle = payload && payload.debugBundle ? payload.debugBundle : null;
    return {
      hasCanonicalUserData: !!(userData && profile),
      hasDebugBundle: !!debugBundle,
      profileUserId: profile && profile.userId ? profile.userId : null,
      selectedInstrument: profile && profile.selectedInstrument ? profile.selectedInstrument : null,
      practiceJournalCount: journal.length,
      schemaVersion: userData && userData.schemaVersion ? userData.schemaVersion : payload.schemaVersion || null
    };
  }

  async function exportFullBackupDesktopAware(options){
    var payload = buildFullLocalBackup(options);
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
  window.summarizeFullLocalBackup = summarizeFullLocalBackup;

})();
