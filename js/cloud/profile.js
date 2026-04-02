(function(){

  async function fetchCloudProfile(){
    if(!isLoggedInSpark()) return null;
    var data = await sparkApiRequest("/api/profile", "GET");
    S.cloudProfile = data.profile || {};
    saveState();
    return S.cloudProfile;
  }

  async function updateCloudProfile(patch){
    if(!isLoggedInSpark()) return false;
    var data = await sparkApiRequest("/api/profile", "POST", {
      patch: patch
    });
    S.cloudProfile = data.profile || S.cloudProfile;
    saveState();
    return true;
  }

  window.fetchCloudProfile = fetchCloudProfile;
  window.updateCloudProfile = updateCloudProfile;

})();
