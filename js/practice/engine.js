(function(){

  function getPracticeCore(){
    return window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  }

  function currentInstrumentType(){
    var active = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive
      ? SparkInstruments.getActive()
      : null;
    return (active && (active.instrument || active.instrumentType)) || null;
  }

  function ensurePracticePlan(opts){
    opts = opts || {};
    var today = new Date().toISOString().slice(0,10);
    var currentInstrument = currentInstrumentType();
    // The cached plan is keyed by both date AND instrument — switching
    // instruments forces a rebuild so a bass user doesn't see yesterday's
    // ukulele items. If either drifts, fall through to buildPracticePlan().
    var cacheValid = S.practicePlan
      && S.practicePlanDate === today
      && (!currentInstrument || S.practicePlanInstrument === currentInstrument);

    var core = getPracticeCore();
    if(core && typeof core.startSession === "function"){
      var forceRebuild = !!opts.forceRebuild || !cacheValid;
      var plan = core.startSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        forceRebuild: forceRebuild
      });
      if(plan){
        S.practicePlanInstrument = currentInstrument;
        if(typeof saveState === "function") saveState();
        return plan.toLegacyPracticePlan();
      }
      // fall through to cache / buildPracticePlan() when startSession fails
    }

    if(cacheValid) return S.practicePlan;
    return buildPracticePlan();
  }

  function buildPracticePlan(){
    var core = getPracticeCore();
    if(core && typeof core.startSession === "function"){
      var plan = core.startSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        forceRebuild: true
      });
      if (plan) return plan.toLegacyPracticePlan();
    }

    var today = new Date().toISOString().slice(0,10);
    var items = [];

    // The selectors module exports the *Candidate family — the old *Item /
    // *Transition / *Target names this fallback used were never defined,
    // so every plan rebuild that missed the core engine threw.
    // 1. Always warmup
    var warmup = typeof selectWarmupCandidate === "function" ? selectWarmupCandidate() : null;
    if(warmup) items.push(warmup);

    // 2. Weakest transition
    var transition = typeof selectWeakTransitionCandidate === "function" ? selectWeakTransitionCandidate() : null;
    if(transition) items.push(transition);

    // 3. Weak song/phrase
    var song = typeof selectWeakPerformanceCandidate === "function" ? selectWeakPerformanceCandidate() : null;
    if(song) items.push(song);

    // 4. Rhythm if needed
    var rhythm = typeof selectRhythmCandidate === "function" ? selectRhythmCandidate() : null;
    if(rhythm) items.push(rhythm);

    // 5. Finger exercise
    if(items.length < 4){
      var finger = typeof selectFingerCandidate === "function" ? selectFingerCandidate() : null;
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
    S.practicePlanInstrument = currentInstrumentType();
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

  // True when at least one plan item was actually completed. Marking a
  // plan complete with zero items done is a skip, not an accomplishment —
  // unearned completion credit corrodes the reward loop, so the page
  // renders "Skip today" and completePracticePlan withholds the credit.
  function practicePlanHasEarnedCompletion(){
    var items = S.practicePlan && Array.isArray(S.practicePlan.items) ? S.practicePlan.items : [];
    for(var i=0;i<items.length;i++){
      var value = items[i] ? items[i].completed : null;
      if(value === true || value === 1 || value === "1" ||
         (typeof value === "string" && value.trim().toLowerCase() === "true")) return true;
    }
    return false;
  }

  function completePracticePlan(){
    var earned = practicePlanHasEarnedCompletion();
    var core = getPracticeCore();
    if(core && typeof core.completeSession === "function"){
      // earnedCompletion tells ProgressEngine.completeSession whether this
      // completion deserves a reward: with zero items done it still marks
      // the plan finished for today (so the UI stops nagging) but withholds
      // the XP and toast. The core is the single progression driver — the
      // dual-path shadow observer that used to run beside it is retired
      // (Phase 7).
      core.completeSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        markPlanComplete: true,
        earnedCompletion: earned
      });
      return;
    }

    S.practicePlanComplete = true;
    if(!Array.isArray(S.practicePlanHistory)) S.practicePlanHistory = [];
    S.practicePlanHistory.push({
      date: S.practicePlanDate,
      focus: S.practicePlanFocus,
      itemCount: S.practicePlan && S.practicePlan.items ? S.practicePlan.items.length : 0,
      skipped: !earned,
      completedAt: Date.now()
    });
    if(S.practicePlanHistory.length > 30) S.practicePlanHistory.shift();
    saveState();
  }

  window.ensurePracticePlan = ensurePracticePlan;
  window.buildPracticePlan = buildPracticePlan;
  window.completePracticePlan = completePracticePlan;
  window.practicePlanHasEarnedCompletion = practicePlanHasEarnedCompletion;

})();
