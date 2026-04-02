(function(){

  async function loadReleaseInfo(){
    try{
      var res = await fetch("release/manifest.json");
      S.releaseInfo = await res.json();
    }catch(e){
      console.warn("Release info unavailable", e);
      S.releaseInfo = null;
    }
  }

  function getReleaseVersion(){
    return S.releaseInfo && S.releaseInfo.version || "dev";
  }

  window.loadReleaseInfo = loadReleaseInfo;
  window.getReleaseVersion = getReleaseVersion;

})();
