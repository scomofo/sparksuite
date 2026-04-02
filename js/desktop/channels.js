(function(){

  function getReleaseChannel(){
    return (S.desktopInfo && S.desktopInfo.channel) || "dev";
  }

  function setReleaseChannel(channel){
    if(!S.desktopInfo) S.desktopInfo = {};
    S.desktopInfo.channel = channel || "dev";
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
