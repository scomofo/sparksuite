(function(){

  function generateDailyPracticePlan(){
    if(typeof ensurePracticePlan === "function" && ensurePracticePlan !== generateDailyPracticePlan){
      return ensurePracticePlan();
    }
    if(window.sparkCore && typeof window.sparkCore.startSession === "function"){
      var corePlan = window.sparkCore.startSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE
      });
      return corePlan ? corePlan.toLegacyPracticePlan() : null;
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
      date: new Date().toISOString().slice(0,10),
      items: items
    };

    return S.practicePlan;
  }

  function getNextPracticeItem(){
    if(!S.practicePlan) generateDailyPracticePlan();
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
    if(window.sparkCore && typeof window.sparkCore.completeSession === "function"){
      return window.sparkCore.completeSession({
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
      S.practiceHistory.push(result);
    }

    saveState();
  }

  // Weekly plan generator
  function generateWeeklyPracticePlan(){
    if(typeof buildPracticePlan === "function" && buildPracticePlan !== generateDailyPracticePlan){
      var sharedDays = [];
      for(var d=0; d<7; d++){
        sharedDays.push(buildPracticePlan());
      }
      S.weeklyPracticePlan = {
        weekStart: new Date().toISOString().slice(0,10),
        days: sharedDays
      };
      return S.weeklyPracticePlan;
    }
    var days = [];
    for(var i=0;i<7;i++){
      days.push(generateDailyPracticePlan());
    }
    S.weeklyPracticePlan = {
      weekStart: new Date().toISOString().slice(0,10),
      days: days
    };
    return S.weeklyPracticePlan;
  }

  window.generateDailyPracticePlan = generateDailyPracticePlan;
  window.getNextPracticeItem = getNextPracticeItem;
  window.completePracticeItem = completePracticeItem;
  window.generateWeeklyPracticePlan = generateWeeklyPracticePlan;

})();
