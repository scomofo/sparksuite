(function(){

  function cloudAuthRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function cloudAuthRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = cloudAuthRoot();
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

  function cloudAuthWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = cloudAuthRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor || !parts.length) return value;
    for(i=0;i<parts.length-1;i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length-1]] = value;
    return value;
  }

  async function loginSpark(email, password){
    var data = await sparkApiRequest("/api/auth/login", "POST", {
      email: email,
      password: password
    });
    cloudAuthWrite("cloudAuth", {
      userId: data.userId,
      email: data.email,
      token: data.token,
      loggedIn: true
    });
    if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("login");
    else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
    saveState();
    return true;
  }

  function logoutSpark(){
    cloudAuthWrite("cloudAuth", {
      userId: null,
      email: null,
      token: null,
      loggedIn: false
    });
    if(typeof applyCloudWorkflowRequest === "function") applyCloudWorkflowRequest("logout");
    else if(typeof syncCloudSettingsStateRequest === "function") syncCloudSettingsStateRequest();
    saveState();
  }

  function isLoggedInSpark(){
    var auth = cloudAuthRead("cloudAuth", {}) || {};
    return !!(auth && auth.loggedIn && auth.token);
  }

  window.loginSpark = loginSpark;
  window.logoutSpark = logoutSpark;
  window.isLoggedInSpark = isLoggedInSpark;

})();
