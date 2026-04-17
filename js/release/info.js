(function(){
  function releaseInfoRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function releaseInfoWrite(path, value){
    var root = releaseInfoRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    if(!cursor || !parts.length) return value;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function releaseInfoRead(path, fallback){
    var root = releaseInfoRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    if(!cursor) return fallback;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  async function loadReleaseInfo(){
    try{
      var res = await fetch("release/manifest.json");
      releaseInfoWrite("releaseInfo", await res.json());
    }catch(e){
      console.warn("Release info unavailable", e);
      releaseInfoWrite("releaseInfo", null);
    }
  }

  function getReleaseVersion(){
    return releaseInfoRead(["releaseInfo", "version"], "dev") || "dev";
  }

  window.loadReleaseInfo = loadReleaseInfo;
  window.getReleaseVersion = getReleaseVersion;

})();
