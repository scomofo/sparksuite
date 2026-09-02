(function(){

  function getPracticePlanCore(){
    if(typeof window !== "undefined" && window.sparkCore){
      return window.sparkCore;
    }
    if(typeof sparkCore !== "undefined"){
      return sparkCore;
    }
    return null;
  }

  function generateDailyPracticePlan(){
    if(typeof ensurePracticePlan === "function" && ensurePracticePlan !== generateDailyPracticePlan){
      return ensurePracticePlan();
    }
    var core = getPracticePlanCore();
    if(core && typeof core.startSession === "function"){
      var corePlan = core.startSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE
      });
      if (corePlan) return corePlan.toLegacyPracticePlan();
    }

    var weak = getTopWeakSpots();

    var items = [];

    // Warmup
    items.push({
      id:"warmup",
      type:"warmup",
      duration:5
    });

    // Weak transitions
    for(var i=0;i<weak.transitions.length;i++){
      items.push({
        id:"transition_"+weak.transitions[i].key,
        type:"transition",
        target:weak.transitions[i].key,
        bpm:70
      });
    }

    // Weak rhythm
    for(var r=0;r<weak.rhythm.length;r++){
      items.push({
        id:"rhythm_"+weak.rhythm[r].key,
        type:"rhythm",
        target:weak.rhythm[r].key,
        bpm:80
      });
    }

    // Weak phrases
    for(var p=0;p<weak.phrases.length;p++){
      items.push({
        id:"phrase_"+weak.phrases[p].key,
        type:"phrase",
        target:weak.phrases[p].key,
        speed:0.7
      });
    }

    // Song slot
    items.push({
      id:"song_slot",
      type:"song",
      difficulty:"normal"
    });

    // Apply adaptive
    for(var j=0;j<items.length;j++){
      items[j] = applyAdaptiveToExercise(items[j]);
    }

    S.practicePlan = {
      date: SparkDay.today(),
      items: items
    };

    return S.practicePlan;
  }

  function getNextPracticeItem(){
    if(!S.practicePlan || !S.practicePlan.items) return null;
    for(var i=0;i<S.practicePlan.items.length;i++){
      if(!S.practicePlan.items[i].completed){
        return S.practicePlan.items[i];
      }
    }

    return null;
  }

  function completePracticeItem(id, result){
    if(typeof markPracticePlanItem === "function" && markPracticePlanItem !== completePracticeItem && result == null){
      return markPracticePlanItem(id);
    }
    var core = getPracticePlanCore();
    if(core && typeof core.completeSession === "function"){
      return core.completeSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        itemId: id,
        result: result
      });
    }

    if(!S.practicePlan || !S.practicePlan.items) return;

    for(var i=0;i<S.practicePlan.items.length;i++){
      if(S.practicePlan.items[i].id===id){
        S.practicePlan.items[i].completed = true;
        break;
      }
    }

    if(result){
      updateWeakSpotsFromPerformance(result);
      updateAdaptiveFromResult(result);
      if(!Array.isArray(S.practiceHistory)) S.practiceHistory = [];
      S.practiceHistory.push(result);
    }

    saveState();
  }

  // Weekly plan generator
  function generateWeeklyPracticePlan(){
    if(typeof buildPracticePlan === "function" && buildPracticePlan !== generateDailyPracticePlan){
      var previousPlan = S.practicePlan || null;
      var previousPlanDate = S.practicePlanDate || null;
      var previousPlanComplete = !!S.practicePlanComplete;
      var sharedDays = [];
      for(var d=0; d<7; d++){
        sharedDays.push(buildPracticePlan());
      }
      S.practicePlan = previousPlan;
      S.practicePlanDate = previousPlanDate;
      S.practicePlanComplete = previousPlanComplete;
      S.weeklyPracticePlan = {
        weekStart: SparkDay.today(),
        days: sharedDays
      };
      return S.weeklyPracticePlan;
    }
    var previousLegacyPlan = S.practicePlan || null;
    var previousLegacyPlanDate = S.practicePlanDate || null;
    var previousLegacyPlanComplete = !!S.practicePlanComplete;
    var days = [];
    for(var i=0;i<7;i++){
      days.push(generateDailyPracticePlan());
    }
    S.practicePlan = previousLegacyPlan;
    S.practicePlanDate = previousLegacyPlanDate;
    S.practicePlanComplete = previousLegacyPlanComplete;
    S.weeklyPracticePlan = {
      weekStart: SparkDay.today(),
      days: days
    };
    return S.weeklyPracticePlan;
  }

  window.generateDailyPracticePlan = generateDailyPracticePlan;
  window.getNextPracticeItem = getNextPracticeItem;
  window.completePracticeItem = completePracticeItem;
  window.generateWeeklyPracticePlan = generateWeeklyPracticePlan;

})();
