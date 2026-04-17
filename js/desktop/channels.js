(function(){
  function desktopChannelRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function desktopChannelRead(path, fallback){
    var root = desktopChannelRoot();
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

  function desktopChannelWrite(path, value){
    var root = desktopChannelRoot();
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

  function getReleaseChannel(){
    return desktopChannelRead(["desktopInfo", "channel"], "dev") || "dev";
  }

  function setReleaseChannel(channel){
    desktopChannelWrite(["desktopInfo", "channel"], channel || "dev");
    saveState();
  }

  function isDevChannel(){
    return getReleaseChannel() === "dev";
  }

  function isBetaChannel(){
    return getReleaseChannel() === "beta";
  }

  function isStableChannel(){
    return getReleaseChannel() === "stable";
  }

  function showDebugTools(){
    return isDevChannel() || isBetaChannel();
  }

  window.getReleaseChannel = getReleaseChannel;
  window.setReleaseChannel = setReleaseChannel;
  window.isDevChannel = isDevChannel;
  window.isBetaChannel = isBetaChannel;
  window.isStableChannel = isStableChannel;
  window.showDebugTools = showDebugTools;

})();
