(function(){

  function ensurePracticePlan(opts){
    opts = opts || {};
    if(window.sparkCore && typeof window.sparkCore.startSession === "function"){
      var plan = window.sparkCore.startSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        forceRebuild: !!opts.forceRebuild
      });
      if (plan) return plan.toLegacyPracticePlan();
    }

    var today = new Date().toISOString().slice(0,10);
    if(S.practicePlan && S.practicePlanDate===today) return S.practicePlan;
    return buildPracticePlan();
  }

  function buildPracticePlan(){
    if(window.sparkCore && typeof window.sparkCore.startSession === "function"){
      var plan = window.sparkCore.startSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        forceRebuild: true
      });
      if (plan) return plan.toLegacyPracticePlan();
    }

    var today = new Date().toISOString().slice(0,10);
    var items = [];

    // 1. Always warmup
    var warmup = selectWarmupItem();
    if(warmup) items.push(warmup);

    // 2. Weakest transition
    var transition = selectWeakTransition();
    if(transition) items.push(transition);

    // 3. Weak song/phrase
    var song = selectWeakPerformanceTarget();
    if(song) items.push(song);

    // 4. Rhythm if needed
    var rhythm = selectRhythmItem();
    if(rhythm) items.push(rhythm);

    // 5. Finger exercise
    if(items.length < 4){
      var finger = selectFingerItem();
      if(finger) items.push(finger);
    }

    // Cap at 5
    if(items.length > 5) items = items.slice(0,5);

    var focus = determineFocus(items);

    var plan = {
      generatedDate: today,
      focus: focus,
      items: items
    };

    S.practicePlan = plan;
    S.practicePlanDate = today;
    S.practicePlanComplete = false;
    S.practicePlanFocus = focus;
    saveState();

    return plan;
  }

  function determineFocus(items){
    for(var i=0;i<items.length;i++){
      if(items[i].type==="transition") return "Smooth chord transitions";
      if(items[i].type==="performance_song") return "Song mastery";
      if(items[i].type==="rhythm") return "Rhythm accuracy";
    }
    return "Well-rounded practice";
  }

  function completePracticePlan(){
    if(window.sparkCore && typeof window.sparkCore.completeSession === "function"){
      window.sparkCore.completeSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        markPlanComplete: true
      });
      // Route through contract-based progress path
      if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
        var practiceResult = SparkContracts.createSessionResult({
          mode: "practice",
          instrumentId: typeof SparkInstruments !== "undefined" && SparkInstruments.getActive() ? SparkInstruments.getActive().id : null,
          instrumentType: typeof SparkInstruments !== "undefined" && SparkInstruments.getActive() ? SparkInstruments.getActive().instrument : null,
          completed: true
        });
        SparkProgressOrchestrator.applySessionOutcome(practiceResult);
      }
      return;
    }

    S.practicePlanComplete = true;
    if(!Array.isArray(S.practicePlanHistory)) S.practicePlanHistory = [];
    S.practicePlanHistory.push({
      date: S.practicePlanDate,
      focus: S.practicePlanFocus,
      itemCount: S.practicePlan && S.practicePlan.items ? S.practicePlan.items.length : 0,
      completedAt: Date.now()
    });
    if(S.practicePlanHistory.length > 30) S.practicePlanHistory.shift();
    saveState();
  }

  window.ensurePracticePlan = ensurePracticePlan;
  window.buildPracticePlan = buildPracticePlan;
  window.completePracticePlan = completePracticePlan;

})();
