(function(){
  function _ensureCloudSync(){if(!S.cloudSync)S.cloudSync={lastSyncStatus:null,lastSyncAt:0,dirtyKeys:[],categoryTimestamps:{}};if(!S.cloudSync.categoryTimestamps)S.cloudSync.categoryTimestamps={};}

  function detectCloudConflicts(local,cloud){
    var lastSync=S.cloudSync?(S.cloudSync.lastSyncAt||0):0;
    var cats=["profile","progression","practice","planning","editor","devices","settings"];
    var conflicts=[];
    for(var i=0;i<cats.length;i++){var c=cats[i];var lt=local[c]&&local[c].lastModifiedAt?local[c].lastModifiedAt:0;var ct=cloud[c]&&cloud[c].lastModifiedAt?cloud[c].lastModifiedAt:0;if(lt>lastSync&&ct>lastSync&&lt!==ct)conflicts.push({category:c,localTs:lt,cloudTs:ct});}
    return conflicts;
  }

  function resolveCloudConflict(strategy){
    var pending=S.cloudSync&&S.cloudSync.pendingConflict;if(!pending)return;
    if(strategy==="local"){S.cloudSync.pendingConflict=null;S.cloudSync.lastSyncStatus="idle";syncSparkNow();}
    else if(strategy==="cloud"){S.cloudSync.pendingConflict=null;S.cloudSync.lastSyncStatus="idle";pullSparkCloud();}
    else if(strategy==="newest"){
      var cl=pending.cloudSnapshot,lo=pending.localSnapshot,cats=["profile","progression","practice","planning","editor","devices","settings"],merged={version:1};
      for(var i=0;i<cats.length;i++){var c=cats[i];var lt=lo[c]&&lo[c].lastModifiedAt?lo[c].lastModifiedAt:0;var ct=cl[c]&&cl[c].lastModifiedAt?cl[c].lastModifiedAt:0;merged[c]=ct>lt?cl[c]:lo[c];}
      applyCloudSnapshot(merged);S.cloudSync.pendingConflict=null;S.cloudSync.lastSyncAt=Date.now();S.cloudSync.lastSyncStatus="ok";S.cloudSync.dirtyKeys=[];saveState();
    }
    if(typeof render==="function")render();
  }

  async function syncSparkNow(){
    if(!isLoggedInSpark())return false;_ensureCloudSync();
    try{
      S.cloudSync.lastSyncStatus="syncing";
      if(typeof applyCloudWorkflowRequest==="function")applyCloudWorkflowRequest("sync_start",{lastSyncStatus:"syncing"});
      else if(typeof syncCloudSettingsStateRequest==="function")syncCloudSettingsStateRequest();
      if(typeof render==="function")render();
      var snapshot=buildCloudSnapshot();
      var result=await sparkApiRequest("/api/sync/push","POST",{snapshot:snapshot});
      if(result&&result.snapshot){
        var conflicts=detectCloudConflicts(snapshot,result.snapshot);
        if(conflicts.length>0){S.cloudSync.lastSyncStatus="conflict";S.cloudSync.pendingConflict={conflicts:conflicts,localSnapshot:snapshot,cloudSnapshot:result.snapshot};saveState();if(typeof render==="function")render();return false;}
        applyCloudSnapshot(result.snapshot);
      }
      S.cloudSync.lastSyncAt=Date.now();S.cloudSync.lastSyncStatus="ok";S.cloudSync.dirtyKeys=[];
      if(typeof applyCloudWorkflowRequest==="function")applyCloudWorkflowRequest("sync_done",{lastSyncStatus:"ok",lastSyncAt:S.cloudSync.lastSyncAt});
      else if(typeof syncCloudSettingsStateRequest==="function")syncCloudSettingsStateRequest();
      saveState();return true;
    }catch(e){
      console.error("Spark sync failed",e);S.cloudSync.lastSyncStatus="error";
      if(typeof applyCloudWorkflowRequest==="function")applyCloudWorkflowRequest("sync_error",{lastSyncStatus:"error"});
      else if(typeof syncCloudSettingsStateRequest==="function")syncCloudSettingsStateRequest();
      saveState();return false;
    }
  }

  async function pullSparkCloud(){
    if(!isLoggedInSpark())return false;_ensureCloudSync();
    try{
      S.cloudSync.lastSyncStatus="syncing";
      if(typeof applyCloudWorkflowRequest==="function")applyCloudWorkflowRequest("pull_start",{lastSyncStatus:"syncing"});
      else if(typeof syncCloudSettingsStateRequest==="function")syncCloudSettingsStateRequest();
      var result=await sparkApiRequest("/api/sync/pull","GET");
      if(result&&result.snapshot)applyCloudSnapshot(result.snapshot);
      S.cloudSync.lastSyncAt=Date.now();S.cloudSync.lastSyncStatus="ok";
      if(typeof applyCloudWorkflowRequest==="function")applyCloudWorkflowRequest("pull_done",{lastSyncStatus:"ok",lastSyncAt:S.cloudSync.lastSyncAt});
      else if(typeof syncCloudSettingsStateRequest==="function")syncCloudSettingsStateRequest();
      saveState();return true;
    }catch(e){
      console.error("Spark pull failed",e);S.cloudSync.lastSyncStatus="error";
      if(typeof applyCloudWorkflowRequest==="function")applyCloudWorkflowRequest("pull_error",{lastSyncStatus:"error"});
      else if(typeof syncCloudSettingsStateRequest==="function")syncCloudSettingsStateRequest();
      saveState();return false;
    }
  }

  window.syncSparkNow=syncSparkNow;
  window.pullSparkCloud=pullSparkCloud;
  window.resolveCloudConflict=resolveCloudConflict;
})();