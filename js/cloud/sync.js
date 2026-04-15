(function(){

  function cloudSyncRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function cloudSyncRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = cloudSyncRoot();
    if(!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function cloudSyncWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = cloudSyncRoot();
    if(!root) return value;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    if(parts.length) cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function _ensureCloudSync(){
    var cloudSync = cloudSyncRead("cloudSync", null);
    if(!cloudSync || typeof cloudSync !== "object" || Array.isArray(cloudSync)){
      cloudSync = { lastSyncStatus: null, lastSyncAt: 0, dirtyKeys: [] };
    }
    if(!Array.isArray(cloudSync.dirtyKeys)) cloudSync.dirtyKeys = [];
    cloudSyncWrite("cloudSync", cloudSync);
    return cloudSync;
  }

  async function syncSparkNow(){
    if(!isLoggedInSpark()) return false;
    _ensureCloudSync();
    try{
      cloudSyncWrite(["cloudSync", "lastSyncStatus"], "syncing");
      cloudSyncWrite("cloudLastError", null);
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("sync_start", { lastSyncStatus: "syncing", lastError: null });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      if(typeof render === "function") render();
      var snapshot = buildCloudSnapshot();
      var result = await sparkApiRequest("/api/sync/push", "POST", {
        snapshot: snapshot
      });
      if(result && result.snapshot){
        applyCloudSnapshot(result.snapshot);
      }
      cloudSyncWrite(["cloudSync", "lastSyncAt"], Date.now());
      cloudSyncWrite(["cloudSync", "lastSyncStatus"], "ok");
      cloudSyncWrite(["cloudSync", "dirtyKeys"], []);
      cloudSyncWrite("cloudLastError", null);
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("sync_done", {
        lastSyncStatus: "ok",
        lastSyncAt: cloudSyncRead(["cloudSync", "lastSyncAt"], 0),
        lastError: null
      });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      saveState();
      return true;
    }catch(e){
      console.error("Spark sync failed", e);
      cloudSyncWrite(["cloudSync", "lastSyncStatus"], "error");
      cloudSyncWrite("cloudLastError", String((e && e.message) || e || "Cloud sync failed."));
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("sync_error", {
        lastSyncStatus: "error",
        lastError: cloudSyncRead("cloudLastError", null)
      });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      saveState();
      return false;
    }
  }

  async function pullSparkCloud(){
    if(!isLoggedInSpark()) return false;
    _ensureCloudSync();
    try{
      cloudSyncWrite(["cloudSync", "lastSyncStatus"], "syncing");
      cloudSyncWrite("cloudLastError", null);
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("pull_start", { lastSyncStatus: "syncing", lastError: null });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      var result = await sparkApiRequest("/api/sync/pull", "GET");
      if(result && result.snapshot){
        applyCloudSnapshot(result.snapshot);
      }
      cloudSyncWrite(["cloudSync", "lastSyncAt"], Date.now());
      cloudSyncWrite(["cloudSync", "lastSyncStatus"], "ok");
      cloudSyncWrite("cloudLastError", null);
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("pull_done", {
        lastSyncStatus: "ok",
        lastSyncAt: cloudSyncRead(["cloudSync", "lastSyncAt"], 0),
        lastError: null
      });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      saveState();
      return true;
    }catch(e){
      console.error("Spark pull failed", e);
      cloudSyncWrite(["cloudSync", "lastSyncStatus"], "error");
      cloudSyncWrite("cloudLastError", String((e && e.message) || e || "Cloud pull failed."));
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("pull_error", {
        lastSyncStatus: "error",
        lastError: cloudSyncRead("cloudLastError", null)
      });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      saveState();
      return false;
    }
  }

  window.syncSparkNow = syncSparkNow;
  window.pullSparkCloud = pullSparkCloud;

})();
