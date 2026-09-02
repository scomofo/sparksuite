(function(){

  // Applier only. The skill costs and the affordability rules are progression
  // policy and live in ProgressEngine (getDefaultMetaSkillTree /
  // evaluateSkillUnlock); this file asks for the decision and persists it.

  function progressEngine(){
    return typeof SparkSuiteProgressEngine !== "undefined" ? SparkSuiteProgressEngine : null;
  }

  function ensureMetaSkillTree(){
    if(S.skillTree) return S.skillTree;
    var engine = progressEngine();
    S.skillTree = engine && typeof engine.getDefaultMetaSkillTree === "function"
      ? engine.getDefaultMetaSkillTree()
      : {};
    return S.skillTree;
  }

  function unlockMetaSkill(skillId){
    var engine = progressEngine();
    if(!engine || typeof engine.evaluateSkillUnlock !== "function") return null;

    var outcome = engine.evaluateSkillUnlock({
      skillTree: ensureMetaSkillTree(),
      skillId: skillId,
      skillPoints: (S.metaProgress && S.metaProgress.skillPoints) || 0
    });

    if(!outcome || !outcome.unlocked) return outcome;

    S.skillTree = outcome.skillTree;
    S.metaProgress.skillPoints = outcome.skillPoints;
    saveState();
    return outcome;
  }

  function awardSkillPoint(){
    ensureMetaSkillTree();
    S.metaProgress.skillPoints++;
    saveState();
  }

  window.ensureMetaSkillTree = ensureMetaSkillTree;
  window.buildMetaSkillTree = ensureMetaSkillTree;
  window.unlockMetaSkill = unlockMetaSkill;
  window.awardSkillPoint = awardSkillPoint;

})();
