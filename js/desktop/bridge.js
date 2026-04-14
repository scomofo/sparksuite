(function(){

  function getDesktopBridgeRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function desktopBridgeRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = getDesktopBridgeRoot();
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

  function desktopBridgeWrite(path, value) {
    if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      return SparkState.write(path, value);
    }
    var root = getDesktopBridgeRoot();
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

  function isDesktopBuild() {
    return typeof window.sparkDesktop !== 'undefined';
  }

  async function exportEditorObjectDesktopAware() {
    var chart = desktopBridgeRead("performEditorChart", null);
    if (!chart) return false;
    if (isDesktopBuild()) {
      var result = await window.sparkDesktop.saveJson(chart);
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
    desktopBridgeWrite(["desktopInfo", "updateStatus"], "checking");
    if(typeof render === "function") render();
    var result = await window.sparkDesktop.checkForUpdates();
    if(!result || !result.ok){
      desktopBridgeWrite(["desktopInfo", "updateStatus"], "error");
      saveState();
      return false;
    }
    desktopBridgeWrite(["desktopInfo", "lastUpdateCheckAt"], Date.now());
    desktopBridgeWrite(["desktopInfo", "updateStatus"], result.updateAvailable ? "available" : "none");
    desktopBridgeWrite(["desktopInfo", "version"], result.currentVersion || desktopBridgeRead(["desktopInfo", "version"], null));
    desktopBridgeWrite(["desktopInfo", "latestVersion"], result.latestVersion || null);
    desktopBridgeWrite(["desktopInfo", "updateNotes"], result.notes || "");
    saveState();
    if(typeof render === "function") render();
    return true;
  }

  function buildFullLocalBackup(){
    return {
      exportedAt: Date.now(),
      app: desktopBridgeRead(["releaseInfo", "appId"], "chordspark") || "chordspark",
      version: desktopBridgeRead(["releaseInfo", "version"], "dev") || "dev",
      state: getDesktopBridgeRoot()
    };
  }

  async function exportFullBackupDesktopAware(){
    var payload = buildFullLocalBackup();
    if(isDesktopBuild()){
      var result = await window.sparkDesktop.saveJson(payload);
      if(result && result.ok){
        desktopBridgeWrite(["desktopInfo", "lastBackupAt"], Date.now());
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
