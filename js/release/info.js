(function(){

  async function fetchReleaseJson(path){
    var res = await fetch(path);
    if(!res.ok){
      throw new Error("Release fetch failed: " + path);
    }
    return await res.json();
  }

  async function loadReleaseInfo(){
    try{
      S.releaseInfo = await fetchReleaseJson("release/manifest.json");
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
