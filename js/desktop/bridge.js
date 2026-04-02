(function(){

  function isDesktopBuild() {
    return typeof window.sparkDesktop !== 'undefined';
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

  async function openImportFileDesktopAware() {
    if (!isDesktopBuild()) return false;
    var result = await window.sparkDesktop.openJson();
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
    return {
      exportedAt: Date.now(),
      app: (S.releaseInfo && S.releaseInfo.appId) || "chordspark",
      version: (S.releaseInfo && S.releaseInfo.version) || "dev",
      state: S
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
