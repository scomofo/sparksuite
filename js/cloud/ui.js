(function(){

  function cloudSettingsPage(){
    var h = '<div class="card">';
    h += '<div><b>Cloud Sync</b></div>';
    if(isLoggedInSpark()){
      h += '<div>Signed in as: ' + escHTML(S.cloudAuth.email || "") + '</div>';
      h += '<div>Status: ' + escHTML(S.cloudSync.lastSyncStatus || "idle") + '</div>';
      if(S.cloudSync.lastSyncAt){
        h += '<div>Last sync: ' + new Date(S.cloudSync.lastSyncAt).toLocaleString() + '</div>';
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
