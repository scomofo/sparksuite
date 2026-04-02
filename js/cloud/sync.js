(function(){

  async function syncSparkNow(){
    if(!isLoggedInSpark()) return false;
    try{
      S.cloudSync.lastSyncStatus = "syncing";
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
      saveState();
      return true;
    }catch(e){
      console.error("Spark sync failed", e);
      S.cloudSync.lastSyncStatus = "error";
      saveState();
      return false;
    }
  }

  async function pullSparkCloud(){
    if(!isLoggedInSpark()) return false;
    try{
      S.cloudSync.lastSyncStatus = "syncing";
      var result = await sparkApiRequest("/api/sync/pull", "GET");
      if(result && result.snapshot){
        applyCloudSnapshot(result.snapshot);
      }
      S.cloudSync.lastSyncAt = Date.now();
      S.cloudSync.lastSyncStatus = "ok";
      saveState();
      return true;
    }catch(e){
      console.error("Spark pull failed", e);
      S.cloudSync.lastSyncStatus = "error";
      saveState();
      return false;
    }
  }

  window.syncSparkNow = syncSparkNow;
  window.pullSparkCloud = pullSparkCloud;

})();
