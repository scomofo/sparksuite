(function(){

  window.SparkCareer = {
    careers: {},
    tiers: {},
    stages: {},
    songs: {},
    sourceInstrumentId: null
  };

  function getCareerRegistryStateRoot(){
    if(typeof globalThis!=="undefined" && globalThis.__sparkState) return globalThis.__sparkState;
    if(typeof globalThis!=="undefined" && globalThis.S) return globalThis.S;
    if(typeof window!=="undefined" && window.__sparkState) return window.__sparkState;
    if(typeof window!=="undefined" && window.S) return window.S;
    return null;
  }

  function careerRegistryRead(path, fallback){
    if(typeof SparkState!=="undefined" && SparkState && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = getCareerRegistryStateRoot();
    for(var i=0;i<parts.length;i++){
      if(!cursor || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function careerRegistryWrite(path, value){
    if(typeof SparkState!=="undefined" && SparkState && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var parts = Array.isArray(path) ? path.slice() : [path];
    var root = getCareerRegistryStateRoot();
    if(!root || !parts.length) return value;
    var cursor = root;
    for(var i=0;i<parts.length-1;i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]]!=="object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length-1]] = value;
    return value;
  }

  function getCareerActiveInstrument(){
    if(typeof SparkInstruments==="undefined" || !SparkInstruments || typeof SparkInstruments.getActive!=="function") return null;
    return SparkInstruments.getActive();
  }

  function resetCareerRegistry(sourceInstrumentId){
    SparkCareer.careers = {};
    SparkCareer.tiers = {};
    SparkCareer.stages = {};
    SparkCareer.songs = {};
    SparkCareer.sourceInstrumentId = sourceInstrumentId || null;
  }

  function buildDefaultCareerContent(activeInstrument){
    if(!activeInstrument || typeof activeInstrument.getData!=="function") return null;
    var data = activeInstrument.getData() || {};
    var songs = Array.isArray(data.SONGS) ? data.SONGS.filter(function(song){
      return song && typeof song === "object";
    }) : [];
    if(!songs.length) return null;

    songs = songs.slice().sort(function(a, b){
      var levelA = Number(a.level || 0);
      var levelB = Number(b.level || 0);
      if(levelA !== levelB) return levelA - levelB;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });

    var instrumentId = activeInstrument.id || activeInstrument.instrument || "instrument";
    var instrumentName = activeInstrument.name || activeInstrument.instrument || "Instrument";
    var careerId = "career_" + instrumentId;
    var tierIds = [];
    var stageItems = [];
    var tierItems = [];
    var songItems = [];
    var songsPerStage = 3;
    var stagesPerTier = 2;
    var stageIds = [];

    for(var i=0;i<songs.length;i++){
      var sourceSong = songs[i];
      var songId = "career_song_" + instrumentId + "_" + i;
      var careerSong = {};
      for(var key in sourceSong){
        if(Object.prototype.hasOwnProperty.call(sourceSong, key)) careerSong[key] = sourceSong[key];
      }
      careerSong.id = songId;
      careerSong.sourceIndex = i;
      careerSong.sourceInstrumentId = instrumentId;
      if(!careerSong.title) careerSong.title = "Song " + (i + 1);
      songItems.push(careerSong);
    }

    for(var stageIndex=0; stageIndex * songsPerStage < songItems.length; stageIndex++){
      var stageSongItems = songItems.slice(stageIndex * songsPerStage, (stageIndex + 1) * songsPerStage);
      var stageId = "career_stage_" + instrumentId + "_" + stageIndex;
      stageIds.push(stageId);
      stageItems.push({
        id: stageId,
        title: "Stage " + (stageIndex + 1),
        songs: stageSongItems.map(function(song){ return song.id; })
      });
    }

    for(var tierIndex=0; tierIndex * stagesPerTier < stageItems.length; tierIndex++){
      var tierStageItems = stageItems.slice(tierIndex * stagesPerTier, (tierIndex + 1) * stagesPerTier);
      var tierId = "career_tier_" + instrumentId + "_" + tierIndex;
      tierIds.push(tierId);
      tierItems.push({
        id: tierId,
        title: "Tier " + (tierIndex + 1),
        stages: tierStageItems.map(function(stage){ return stage.id; })
      });
    }

    return {
      sourceInstrumentId: instrumentId,
      career: {
        id: careerId,
        title: instrumentName + " Career",
        instrumentId: instrumentId,
        tiers: tierIds
      },
      tiers: tierItems,
      stages: stageItems,
      songs: songItems
    };
  }

  function ensureCareerContent(){
    var activeInstrument = getCareerActiveInstrument();
    if(!activeInstrument) return;
    var sourceInstrumentId = activeInstrument.id || activeInstrument.instrument || null;
    if(
      SparkCareer.sourceInstrumentId === "manual" ||
      (SparkCareer.sourceInstrumentId === sourceInstrumentId && Object.keys(SparkCareer.careers || {}).length)
    ){
      return;
    }
    var content = buildDefaultCareerContent(activeInstrument);
    if(!content) return;
    resetCareerRegistry(content.sourceInstrumentId);
    registerCareerContent("careers", [content.career]);
    registerCareerContent("tiers", content.tiers);
    registerCareerContent("stages", content.stages);
    registerCareerContent("songs", content.songs);
    careerRegistryWrite(["activeCareerId"], content.career.id);
    if(typeof ensureCareerProgress==="function") ensureCareerProgress();
    if(typeof evaluateCareerUnlocks==="function") evaluateCareerUnlocks(content.career.id);
  }

  function registerCareerContent(type, items){
    if(!SparkCareer[type]) SparkCareer[type] = {};
    if(type === "careers" && items && items.length){
      SparkCareer.sourceInstrumentId = SparkCareer.sourceInstrumentId || "manual";
    }
    for(var i=0;i<items.length;i++){
      SparkCareer[type][items[i].id] = items[i];
    }
  }

  function getCareerItem(type, id){
    ensureCareerContent();
    if(type === "careers" && (!id || !SparkCareer[type] || !SparkCareer[type][id])){
      var activeCareerId = careerRegistryRead(["activeCareerId"], null);
      if(activeCareerId && SparkCareer.careers && SparkCareer.careers[activeCareerId]) return SparkCareer.careers[activeCareerId];
    }
    return SparkCareer[type] ? SparkCareer[type][id] : null;
  }

  window.registerCareerContent = registerCareerContent;
  window.getCareerItem = getCareerItem;
  window.ensureCareerContent = ensureCareerContent;

})();
