(function(){

  function cloudUiRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function cloudUiRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = cloudUiRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor) return fallback;
    for(i=0;i<parts.length;i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function cloudSettingsPage(){
    var runtimeState = window.sparkCore && typeof window.sparkCore.getRuntimeState === "function"
      ? window.sparkCore.getRuntimeState()
      : null;
    var loggedIn = runtimeState && runtimeState.cloudLoggedIn != null
      ? !!runtimeState.cloudLoggedIn
      : isLoggedInSpark();
    var email = runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "cloudEmail")
      ? runtimeState.cloudEmail
      : ((cloudUiRead("cloudAuth", {}) || {}).email || null);
    var emailDraft = cloudUiRead("cloudEmailDraft", email || "") || "";
    var passwordDraft = cloudUiRead("cloudPasswordDraft", "") || "";
    var syncStatus = runtimeState && runtimeState.cloudLastSyncStatus
      ? runtimeState.cloudLastSyncStatus
      : (((cloudUiRead("cloudSync", {}) || {}).lastSyncStatus) || "idle");
    var syncAt = runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "cloudLastSyncAt")
      ? runtimeState.cloudLastSyncAt
      : (((cloudUiRead("cloudSync", {}) || {}).lastSyncAt) || null);
    var lastError = runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "cloudLastError")
      ? runtimeState.cloudLastError
      : (cloudUiRead("cloudLastError", null) || null);
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
      h += '<div class="setting-row"><label>Email</label>';
      h += '<input type="email" value="' + escHTML(emailDraft) + '" autocomplete="username" oninput="act(\'cloudEmailDraft\', this.value)"/></div>';
      h += '<div class="setting-row"><label>Password</label>';
      h += '<input type="password" value="' + escHTML(passwordDraft) + '" autocomplete="current-password" oninput="act(\'cloudPasswordDraft\', this.value)"/></div>';
      h += '<button onclick="act(\'cloudLoginPrompt\')">Login</button>';
    }
    if(lastError){
      h += '<div style="margin-top:8px;color:#FF6B6B"><b>Error:</b> ' + escHTML(lastError) + '</div>';
    }
    h += '</div>';
    return h;
  }

  window.cloudSettingsPage = cloudSettingsPage;

})();
