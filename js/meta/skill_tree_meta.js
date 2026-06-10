(function(){

  function ensureMetaSkillTree(){
    if(S.skillTree) return S.skillTree;
    S.skillTree = {
      rhythm_1:{ unlocked:true, cost:0 },
      rhythm_2:{ unlocked:false, cost:2 },
      chords_barre:{ unlocked:false, cost:3 },
      lh_patterns:{ unlocked:false, cost:2 },
      melody_mode:{ unlocked:false, cost:2 },
      speed_training:{ unlocked:false, cost:3 },
      sight_reading:{ unlocked:false, cost:4 }
    };
    return S.skillTree;
  }

  function unlockSkill(skillId){
    ensureMetaSkillTree();
    if(!S.skillTree[skillId]) return;
    if(S.metaProgress.skillPoints <= 0) return;
    if(S.skillTree[skillId].unlocked) return;
    if(S.skillTree[skillId].cost > S.metaProgress.skillPoints) return;
    S.skillTree[skillId].unlocked = true;
    S.metaProgress.skillPoints -= S.skillTree[skillId].cost;
    saveState();
  }

  function awardSkillPoint(){
    ensureMetaSkillTree();
    S.metaProgress.skillPoints++;
    saveState();
  }

  window.ensureMetaSkillTree = ensureMetaSkillTree;
  window.buildMetaSkillTree = ensureMetaSkillTree;
  window.unlockMetaSkill = unlockSkill;
  window.awardSkillPoint = awardSkillPoint;

})();
