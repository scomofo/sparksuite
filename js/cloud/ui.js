(function(){

  function cloudSettingsPage(){
    var runtimeState=window.sparkCore&&typeof window.sparkCore.getRuntimeState==="function"?window.sparkCore.getRuntimeState():null;
    var loggedIn=runtimeState&&runtimeState.cloudLoggedIn!=null?!!runtimeState.cloudLoggedIn:isLoggedInSpark();
    var email=runtimeState&&Object.prototype.hasOwnProperty.call(runtimeState,"cloudEmail")?runtimeState.cloudEmail:(S.cloudAuth?(S.cloudAuth.email||null):null);
    var syncStatus=runtimeState&&runtimeState.cloudLastSyncStatus?runtimeState.cloudLastSyncStatus:((S.cloudSync&&S.cloudSync.lastSyncStatus)||"idle");
    var syncAt=runtimeState&&Object.prototype.hasOwnProperty.call(runtimeState,"cloudLastSyncAt")?runtimeState.cloudLastSyncAt:(S.cloudSync?(S.cloudSync.lastSyncAt||null):null);
    var h="<div class=\"card\">";
    h+="<div><b>Cloud Sync</b></div>";
    if(loggedIn){
      h+="<div>Signed in as: "+escHTML(email||"")+"</div>";
      if(syncStatus==="syncing")h+="<div style=\"color:#3b82f6\"><span class=\"spinner-inline\"></span> Syncing...</div>";
      else if(syncStatus==="ok")h+="<div style=\"color:#22c55e\">Sync complete</div>";
      else if(syncStatus==="error")h+="<div style=\"color:#ef4444\">Sync failed <button onclick=\"act('cloudSync')\">Retry</button></div>";
      else if(syncStatus==="conflict"){h+="<div style=\"border:1px solid #f59e0b;padding:8px;border-radius:6px;margin:8px 0\">";h+="<div style=\"color:#f59e0b;font-weight:bold\">Sync Conflict</div>";h+="<div>Both local and cloud data changed since last sync.</div>";h+="<button onclick=\"resolveCloudConflict('local')\">Keep Local</button> ";h+="<button onclick=\"resolveCloudConflict('cloud')\">Keep Cloud</button> ";h+="<button onclick=\"resolveCloudConflict('newest')\">Newest Per-Category</button>";h+="</div>";}
      else h+="<div>Status: "+escHTML(syncStatus||"idle")+"</div>";
      if(syncAt){var ago=Math.round((Date.now()-syncAt)/60000);var agoText=ago<1?"just now":(ago===1?"1 min ago":ago+" min ago");h+="<div style=\"color:#9ca3af;font-size:0.85em\">Last synced: "+agoText+"</div>";}
      h+="<div style=\"margin-top:8px\">";
      h+="<button onclick=\"act('cloudPull')\">Pull Cloud Save</button> ";
      h+="<button onclick=\"act('cloudSync')\">Sync Now</button> ";
      h+="<button onclick=\"act('cloudLogout')\">Logout</button>";
      h+="</div>";
    }else{
      h+="<div>Not signed in</div>";
      h+="<button onclick=\"act('cloudLoginPrompt')\">Login</button>";
    }
    h+="</div>";
    return h;
  }

  window.cloudSettingsPage=cloudSettingsPage;

})();
