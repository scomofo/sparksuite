(function(){

  // Read-only mastery accessors over SparkMastery (js/utils/mastery.js), with
  // a legacy S.mastery fallback.
  //
  // This file used to also define updateMastery() and
  // updateMasteryFromPerformance(). Both are gone:
  //   - updateMasteryFromPerformance had no callers anywhere in the repo.
  //   - updateMastery was declared inside this IIFE and never exported, so the
  //     only code that reached for it (progress_orchestrator.js step 5, via
  //     `typeof updateMastery === "function"`) never found it. It was
  //     unreachable, and its 0.7/0.3 blend was a second copy of a rule the
  //     engine already owns as ProgressEngine.smoothMastery (0.75/0.25).
  // See the note at progress_orchestrator.js step 5 for what still needs
  // deciding before that cascade step can be wired up.

  function getMastery(skillType, skillId){
    if (typeof SparkMastery !== "undefined") {
      return SparkMastery.get(skillType, skillId) || 0;
    }
    if(!S.mastery[skillType]) return 0;
    return S.mastery[skillType][skillId] || 0;
  }

  function getAverageMastery(skillType){
    var bucket = typeof SparkMastery !== "undefined"
      ? SparkMastery.category(skillType)
      : (S.mastery[skillType] || {});
    var total = 0;
    var count = 0;
    for(var k in bucket){
      total += bucket[k];
      count++;
    }
    return count ? total / count : 0;
  }

  window.getMastery = getMastery;
  window.getAverageMastery = getAverageMastery;

})();
