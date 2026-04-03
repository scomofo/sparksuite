(function(){

  async function syncSparkNow(){
    if(!isLoggedInSpark()) return false;
    try{
      S.cloudSync.lastSyncStatus = "syncing";
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("sync_start", { lastSyncStatus: "syncing" });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      if(typeof render === "function") render();
      var snapshot = buildCloudSnapshot();
      var result = await sparkApiRequest("/api/sync/push", "POST", {
        snapshot: snapshot
      });
      if(result && result.snapshot){
        applyCloudSnapshot(result.snapshot);
      }
      S.cloudSync.lastSyncAt = Date.now();
      S.cloudSync.lastSyncStatus = "ok";
      S.cloudSync.dirtyKeys = [];
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("sync_done", {
        lastSyncStatus: "ok",
        lastSyncAt: S.cloudSync.lastSyncAt
      });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      saveState();
      return true;
    }catch(e){
      console.error("Spark sync failed", e);
      S.cloudSync.lastSyncStatus = "error";
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("sync_error", { lastSyncStatus: "error" });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      saveState();
      return false;
    }
  }

  async function pullSparkCloud(){
    if(!isLoggedInSpark()) return false;
    try{
      S.cloudSync.lastSyncStatus = "syncing";
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("pull_start", { lastSyncStatus: "syncing" });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      var result = await sparkApiRequest("/api/sync/pull", "GET");
      if(result && result.snapshot){
        applyCloudSnapshot(result.snapshot);
      }
      S.cloudSync.lastSyncAt = Date.now();
      S.cloudSync.lastSyncStatus = "ok";
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("pull_done", {
        lastSyncStatus: "ok",
        lastSyncAt: S.cloudSync.lastSyncAt
      });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      saveState();
      return true;
    }catch(e){
      console.error("Spark pull failed", e);
      S.cloudSync.lastSyncStatus = "error";
      if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("pull_error", { lastSyncStatus: "error" });
      else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
      saveState();
      return false;
    }
  }

  window.syncSparkNow = syncSparkNow;
  window.pullSparkCloud = pullSparkCloud;

})();
