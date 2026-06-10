(function(){

  function getContentLoaderCore(){
    return (typeof window !== "undefined" && window.sparkCore)
      || (typeof sparkCore !== "undefined" ? sparkCore : null);
  }

  async function fetchContentJson(path){
    var res = await fetch(path);
    if(!res.ok){
      throw new Error("Content fetch failed: " + path);
    }
    return await res.json();
  }

  async function loadContentManifest(path){
    return await fetchContentJson(path);
  }

  async function loadContentFile(path){
    return await fetchContentJson(path);
  }

  async function loadAllContent(manifestPath){
    var core = getContentLoaderCore();
    if(core && typeof core.applyCurriculumWorkflowRequest === "function"){
      core.applyCurriculumWorkflowRequest("content_load_start", { manifestPath: manifestPath });
    }
    try{
      var manifest = await loadContentManifest(manifestPath);
      var pending = {};
      if(manifest.lessons){
        pending.lessons = await loadContentFile(manifest.lessons);
      }
      if(manifest.songs){
        pending.songs = await loadContentFile(manifest.songs);
      }
      if(manifest.drills){
        pending.drills = await loadContentFile(manifest.drills);
      }
      if(manifest.templates){
        pending.templates = await loadContentFile(manifest.templates);
      }
      if(manifest.packs){
        pending.packs = await loadContentFile(manifest.packs);
      }
      for(var type in pending){
        if(Object.prototype.hasOwnProperty.call(pending, type)){
          registerContent(type, pending[type]);
        }
      }
      if(core && typeof core.applyCurriculumWorkflowRequest === "function"){
        core.applyCurriculumWorkflowRequest("content_load_done", { manifestPath: manifestPath, status: "ok" });
      }
      return manifest;
    }catch(err){
      if(core && typeof core.applyCurriculumWorkflowRequest === "function"){
        core.applyCurriculumWorkflowRequest("content_load_error", { manifestPath: manifestPath, status: "error" });
      }
      throw err;
    }
  }

  window.loadAllContent = loadAllContent;

})();
