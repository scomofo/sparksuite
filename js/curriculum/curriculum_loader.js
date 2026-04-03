(function(){

  async function loadCurriculumManifest(path){
    if(typeof window !== "undefined" && window.sparkCore && typeof window.sparkCore.applyCurriculumWorkflowRequest === "function"){
      window.sparkCore.applyCurriculumWorkflowRequest("curriculum_load_start", { manifestPath: path });
    }
    try{
      var res = await fetch(path);
      var manifest = await res.json();
      if(manifest.curriculums){
        registerCurriculum("curriculums", await (await fetch(manifest.curriculums)).json());
      }
      if(manifest.tracks){
        registerCurriculum("tracks", await (await fetch(manifest.tracks)).json());
      }
      if(manifest.units){
        registerCurriculum("units", await (await fetch(manifest.units)).json());
      }
      if(manifest.lessons){
        registerCurriculum("lessons", await (await fetch(manifest.lessons)).json());
      }
      if(typeof window !== "undefined" && window.sparkCore && typeof window.sparkCore.applyCurriculumWorkflowRequest === "function"){
        window.sparkCore.applyCurriculumWorkflowRequest("curriculum_load_done", { manifestPath: path, status: "ok" });
      }
      return manifest;
    }catch(err){
      if(typeof window !== "undefined" && window.sparkCore && typeof window.sparkCore.applyCurriculumWorkflowRequest === "function"){
        window.sparkCore.applyCurriculumWorkflowRequest("curriculum_load_error", { manifestPath: path, status: "error" });
      }
      throw err;
    }
  }

  window.loadCurriculumManifest = loadCurriculumManifest;

})();
