(function(){
  function onboardingEngineRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function onboardingEngineWrite(path, value){
    var root = onboardingEngineRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    if(!cursor || !parts.length) return value;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function onboardingEngineRead(path, fallback){
    var root = onboardingEngineRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    if(!cursor) return fallback;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function startOnboarding(){
    markOnboardingStarted();
    onboardingEngineWrite("screen", SCR.ONBOARDING);
    if(!onboardingEngineRead(["onboarding", "currentStep"], null)){
      onboardingEngineWrite(["onboarding", "currentStep"], "welcome");
    }
    render();
  }

  function continueOnboarding(){
    if(isOnboardingComplete()){
      onboardingEngineWrite("screen", SCR.HOME_DASH);
      render();
      return;
    }
    onboardingEngineWrite("screen", SCR.ONBOARDING);
    render();
  }

  function goToNextOnboardingStep(){
    var cur = getCurrentOnboardingStep();
    var idx = getOnboardingStepIndex(cur);
    var arr = SparkOnboardingSteps || [];
    if(idx < 0 || idx >= arr.length - 1){
      finishOnboardingFlow();
      return;
    }
    setCurrentOnboardingStep(arr[idx + 1].id);
    render();
  }

  function goToPreviousOnboardingStep(){
    var cur = getCurrentOnboardingStep();
    var idx = getOnboardingStepIndex(cur);
    var arr = SparkOnboardingSteps || [];
    if(idx <= 0) return;
    setCurrentOnboardingStep(arr[idx - 1].id);
    render();
  }

  function finishOnboardingFlow(){
    runFinalOnboardingSetup();
    markOnboardingComplete();
    onboardingEngineWrite("screen", SCR.HOME_DASH);
    render();
  }

  function runFinalOnboardingSetup(){
    if(typeof generateDailyPracticePlan === "function"){
      generateDailyPracticePlan();
    }
    if(typeof generateRecommendations === "function"){
      generateRecommendations();
    }
    if(typeof generatePersonalInsights === "function"){
      generatePersonalInsights();
    }
    if(typeof initializeChallengesForCurrentCycle === "function"){
      initializeChallengesForCurrentCycle();
    }
  }

  window.startOnboarding = startOnboarding;
  window.continueOnboarding = continueOnboarding;
  window.goToNextOnboardingStep = goToNextOnboardingStep;
  window.goToPreviousOnboardingStep = goToPreviousOnboardingStep;
  window.finishOnboardingFlow = finishOnboardingFlow;
  window.runFinalOnboardingSetup = runFinalOnboardingSetup;

})();
