(function(){

  async function loadContentManifest(path){
    var res = await fetch(path);
    return await res.json();
  }

  async function loadContentFile(path){
    var res = await fetch(path);
    return await res.json();
  }

  async function loadAllContent(manifestPath){
    if(typeof window !== "undefined" && window.sparkCore && typeof window.sparkCore.applyCurriculumWorkflowRequest === "function"){
      window.sparkCore.applyCurriculumWorkflowRequest("content_load_start", { manifestPath: manifestPath });
    }
    try{
      var manifest = await loadContentManifest(manifestPath);
      if(manifest.lessons){
        registerContent("lessons", await loadContentFile(manifest.lessons));
      }
      if(manifest.songs){
        registerContent("songs", await loadContentFile(manifest.songs));
      }
      if(manifest.drills){
        registerContent("drills", await loadContentFile(manifest.drills));
      }
      if(manifest.templates){
        registerContent("templates", await loadContentFile(manifest.templates));
      }
      if(manifest.packs){
        registerContent("packs", await loadContentFile(manifest.packs));
      }
      if(typeof window !== "undefined" && window.sparkCore && typeof window.sparkCore.applyCurriculumWorkflowRequest === "function"){
        window.sparkCore.applyCurriculumWorkflowRequest("content_load_done", { manifestPath: manifestPath, status: "ok" });
      }
      return manifest;
    }catch(err){
      if(typeof window !== "undefined" && window.sparkCore && typeof window.sparkCore.applyCurriculumWorkflowRequest === "function"){
        window.sparkCore.applyCurriculumWorkflowRequest("content_load_error", { manifestPath: manifestPath, status: "error" });
      }
      throw err;
    }
  }

  window.loadAllContent = loadAllContent;

})();
