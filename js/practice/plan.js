(function(){

  function practicePlanRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis!=="undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function practicePlanRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = practicePlanRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function practicePlanWrite(path, value){
    if(typeof SparkState!=="undefined" && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var root = practicePlanRoot();
    if(root) root[path] = value;
    return value;
  }

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

    var plan = {
      date: new Date().toISOString().slice(0,10),
      items: items
    };
    practicePlanWrite("practicePlan", plan);
    return plan;
  }

  function getNextPracticeItem(){
    var plan = practicePlanRead("practicePlan", null);
    if(!plan || !plan.items) return null;
    for(var i=0;i<plan.items.length;i++){
      if(!plan.items[i].completed){
        return plan.items[i];
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

    var plan = practicePlanRead("practicePlan", null);
    if(!plan || !plan.items) return;

    for(var i=0;i<plan.items.length;i++){
      if(plan.items[i].id===id){
        plan.items[i].completed = true;
        break;
      }
    }
    practicePlanWrite("practicePlan", plan);

    if(result){
      updateWeakSpotsFromPerformance(result);
      updateAdaptiveFromResult(result);
      var practiceHistory = Array.isArray(practicePlanRead("practiceHistory", [])) ? practicePlanRead("practiceHistory", []) : [];
      practiceHistory.push(result);
      practicePlanWrite("practiceHistory", practiceHistory);
    }

    saveState();
  }

  // Weekly plan generator
  function generateWeeklyPracticePlan(){
    if(typeof buildPracticePlan === "function" && buildPracticePlan !== generateDailyPracticePlan){
      var cachedDailyPlan = practicePlanRead("practicePlan", null);
      var cachedDailyPlanDate = practicePlanRead("practicePlanDate", null);
      var cachedDailyPlanInstrumentId = practicePlanRead("practicePlanInstrumentId", null);
      var cachedDailyPlanInstrumentType = practicePlanRead("practicePlanInstrumentType", null);
      var cachedDailyPlanComplete = practicePlanRead("practicePlanComplete", false);
      var cachedDailyPlanFocus = practicePlanRead("practicePlanFocus", null);
      var sharedDays = [];
      for(var d=0; d<7; d++){
        sharedDays.push(buildPracticePlan());
      }
      practicePlanWrite("practicePlan", cachedDailyPlan);
      practicePlanWrite("practicePlanDate", cachedDailyPlanDate);
      practicePlanWrite("practicePlanInstrumentId", cachedDailyPlanInstrumentId);
      practicePlanWrite("practicePlanInstrumentType", cachedDailyPlanInstrumentType);
      practicePlanWrite("practicePlanComplete", cachedDailyPlanComplete);
      practicePlanWrite("practicePlanFocus", cachedDailyPlanFocus);
      var sharedWeeklyPlan = {
        weekStart: new Date().toISOString().slice(0,10),
        days: sharedDays
      };
      practicePlanWrite("weeklyPracticePlan", sharedWeeklyPlan);
      return sharedWeeklyPlan;
    }
    var cachedDailyPlan = practicePlanRead("practicePlan", null);
    var days = [];
    for(var i=0;i<7;i++){
      days.push(generateDailyPracticePlan());
    }
    practicePlanWrite("practicePlan", cachedDailyPlan);
    var weeklyPlan = {
      weekStart: new Date().toISOString().slice(0,10),
      days: days
    };
    practicePlanWrite("weeklyPracticePlan", weeklyPlan);
    return weeklyPlan;
  }

  window.generateDailyPracticePlan = generateDailyPracticePlan;
  window.getNextPracticeItem = getNextPracticeItem;
  window.completePracticeItem = completePracticeItem;
  window.generateWeeklyPracticePlan = generateWeeklyPracticePlan;

})();
