(function(){

  function skillTreeMetaRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function skillTreeMetaRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = skillTreeMetaRoot();
    if(!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function skillTreeMetaWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = skillTreeMetaRoot();
    if(!root) return value;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    if(parts.length) cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function initializeMetaSkillTree(){
    skillTreeMetaWrite("skillTree", {
      rhythm_1:{ unlocked:true, cost:0 },
      rhythm_2:{ unlocked:false, cost:2 },
      chords_barre:{ unlocked:false, cost:3 },
      lh_patterns:{ unlocked:false, cost:2 },
      melody_mode:{ unlocked:false, cost:2 },
      speed_training:{ unlocked:false, cost:3 },
      sight_reading:{ unlocked:false, cost:4 }
    });
  }

  function unlockSkill(skillId){
    var skillTree = skillTreeMetaRead("skillTree", {}) || {};
    var skill = skillTree[skillId];
    var skillPoints = skillTreeMetaRead(["metaProgress", "skillPoints"], 0) || 0;
    if(!skill) return;
    if(skillPoints <= 0) return;
    if(skill.unlocked) return;
    if(skill.cost > skillPoints) return;
    skill.unlocked = true;
    skillTreeMetaWrite("skillTree", skillTree);
    skillTreeMetaWrite(["metaProgress", "skillPoints"], skillPoints - skill.cost);
    saveState();
  }

  function awardSkillPoint(){
    skillTreeMetaWrite(["metaProgress", "skillPoints"], (skillTreeMetaRead(["metaProgress", "skillPoints"], 0) || 0) + 1);
    saveState();
  }

  window.initializeMetaSkillTree = initializeMetaSkillTree;
  window.unlockMetaSkill = unlockSkill;
  window.awardSkillPoint = awardSkillPoint;

})();
