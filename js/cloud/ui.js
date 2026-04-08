(function(){

  function cloudSettingsPage(){
    var runtimeState = window.sparkCore && typeof window.sparkCore.getRuntimeState === "function"
      ? window.sparkCore.getRuntimeState()
      : null;
    var loggedIn = runtimeState && runtimeState.cloudLoggedIn != null
      ? !!runtimeState.cloudLoggedIn
      : isLoggedInSpark();
    var email = runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "cloudEmail")
      ? runtimeState.cloudEmail
      : (S.cloudAuth ? (S.cloudAuth.email || null) : null);
    var syncStatus = runtimeState && runtimeState.cloudLastSyncStatus
      ? runtimeState.cloudLastSyncStatus
      : ((S.cloudSync && S.cloudSync.lastSyncStatus) || "idle");
    var syncAt = runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "cloudLastSyncAt")
      ? runtimeState.cloudLastSyncAt
      : (S.cloudSync ? (S.cloudSync.lastSyncAt || null) : null);
    var h = '<div class="card">';
    h += '<div><b>Cloud Sync</b></div>';
    if(loggedIn){
      h += '<div>Signed in as: ' + escHTML(email || "") + '</div>';
      h += '<div>Status: ' + escHTML(syncStatus || "idle") + '</div>';
      if(syncAt){
        h += '<div>Last sync: ' + new Date(syncAt).toLocaleString() + '</div>';
      }
      h += '<button onclick="act(\'cloudPull\')">Pull Cloud Save</button> ';
      h += '<button onclick="act(\'cloudSync\')">Sync Now</button> ';
      h += '<button onclick="act(\'cloudLogout\')">Logout</button>';
    }else{
      h += '<div>Not signed in</div>';
      h += '<button onclick="act(\'cloudLoginPrompt\')">Login</button>';
    }
    h += '</div>';
    return h;
  }

  window.cloudSettingsPage = cloudSettingsPage;

})();
