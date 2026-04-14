(function(){

  function cloudProfileRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function cloudProfileRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = cloudProfileRoot();
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

  function cloudProfileWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = cloudProfileRoot();
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

  async function fetchCloudProfile(){
    if(!isLoggedInSpark()) return null;
    var data = await sparkApiRequest("/api/profile", "GET");
    cloudProfileWrite("cloudProfile", data.profile || {});
    saveState();
    return cloudProfileRead("cloudProfile", {});
  }

  async function updateCloudProfile(patch){
    if(!isLoggedInSpark()) return false;
    var data = await sparkApiRequest("/api/profile", "POST", {
      patch: patch
    });
    cloudProfileWrite("cloudProfile", data.profile || cloudProfileRead("cloudProfile", {}));
    saveState();
    return true;
  }

  window.fetchCloudProfile = fetchCloudProfile;
  window.updateCloudProfile = updateCloudProfile;

})();
