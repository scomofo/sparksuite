(function(){

  function ensurePracticePlan(){
    var today = new Date().toISOString().slice(0,10);
    if(S.practicePlan && S.practicePlanDate===today) return S.practicePlan;
    return buildPracticePlan();
  }

  function buildPracticePlan(){
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
    S.practicePlanComplete = true;
    if(!Array.isArray(S.practicePlanHistory)) S.practicePlanHistory = [];
    S.practicePlanHistory.push({
      date: S.practicePlanDate,
      focus: S.practicePlanFocus,
      itemCount: S.practicePlan ? S.practicePlan.items.length : 0,
      completedAt: Date.now()
    });
    if(S.practicePlanHistory.length > 30) S.practicePlanHistory.shift();
    saveState();
  }

  window.ensurePracticePlan = ensurePracticePlan;
  window.buildPracticePlan = buildPracticePlan;
  window.completePracticePlan = completePracticePlan;

})();
