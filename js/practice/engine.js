(function(){

  function practiceEngineRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis!=="undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function practiceEngineRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = practiceEngineRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function practiceEngineWrite(path, value){
    if(typeof SparkState!=="undefined" && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var root = practiceEngineRoot();
    if(root) root[path] = value;
    return value;
  }

  function getActivePracticeInstrument(){
    var active = typeof SparkInstruments!=="undefined" && SparkInstruments && typeof SparkInstruments.getActive==="function"
      ? SparkInstruments.getActive()
      : null;
    return {
      instrumentId: active ? (active.id || null) : practiceEngineRead("activeInstrument", null),
      instrumentType: active ? (active.instrument || null) : null
    };
  }

  function practicePlanMatchesActiveInstrument(plan){
    var active = getActivePracticeInstrument();
    var planInstrumentId = plan ? (plan.instrumentId || practiceEngineRead("practicePlanInstrumentId", null)) : null;
    var planInstrumentType = plan ? (plan.instrumentType || practiceEngineRead("practicePlanInstrumentType", null)) : null;
    if(!plan) return false;
    if(planInstrumentId && active.instrumentId) return planInstrumentId === active.instrumentId;
    if(planInstrumentType && active.instrumentType) return planInstrumentType === active.instrumentType;
    return false;
  }

  function getCachedPracticePlanForActiveInstrument(){
    var today = new Date().toISOString().slice(0,10);
    var plan = practiceEngineRead("practicePlan", null);
    if(!plan) return null;
    if(practiceEngineRead("practicePlanDate", null)!==today) return null;
    if(!practicePlanMatchesActiveInstrument(plan)) return null;
    return plan;
  }

  function ensurePracticePlan(opts){
    opts = opts || {};
    if(window.sparkCore && typeof window.sparkCore.startSession === "function"){
      var plan = window.sparkCore.startSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        forceRebuild: !!opts.forceRebuild
      });
      return plan ? plan.toLegacyPracticePlan() : null;
    }

    var plan = getCachedPracticePlanForActiveInstrument();
    if(plan) return plan;
    return buildPracticePlan();
  }

  function buildPracticePlan(){
    if(window.sparkCore && typeof window.sparkCore.startSession === "function"){
      var plan = window.sparkCore.startSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        forceRebuild: true
      });
      return plan ? plan.toLegacyPracticePlan() : null;
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
      instrumentId: getActivePracticeInstrument().instrumentId,
      instrumentType: getActivePracticeInstrument().instrumentType,
      focus: focus,
      items: items
    };

    practiceEngineWrite("practicePlan", plan);
    practiceEngineWrite("practicePlanDate", today);
    practiceEngineWrite("practicePlanInstrumentId", plan.instrumentId || null);
    practiceEngineWrite("practicePlanInstrumentType", plan.instrumentType || null);
    practiceEngineWrite("practicePlanComplete", false);
    practiceEngineWrite("practicePlanFocus", focus);
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

    var practicePlanHistory = Array.isArray(practiceEngineRead("practicePlanHistory", [])) ? practiceEngineRead("practicePlanHistory", []) : [];
    var practicePlan = practiceEngineRead("practicePlan", null);
    practiceEngineWrite("practicePlanComplete", true);
    practicePlanHistory.push({
      date: practiceEngineRead("practicePlanDate", null),
      focus: practiceEngineRead("practicePlanFocus", null),
      itemCount: practicePlan && practicePlan.items ? practicePlan.items.length : 0,
      completedAt: Date.now()
    });
    if(practicePlanHistory.length > 30) practicePlanHistory.shift();
    practiceEngineWrite("practicePlanHistory", practicePlanHistory);
    saveState();
  }

  window.ensurePracticePlan = ensurePracticePlan;
  window.buildPracticePlan = buildPracticePlan;
  window.completePracticePlan = completePracticePlan;
  window.getCachedPracticePlanForActiveInstrument = getCachedPracticePlanForActiveInstrument;

})();
