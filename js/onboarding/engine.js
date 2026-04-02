(function(){

  function startOnboarding(){
    markOnboardingStarted();
    S.screen = SCR.ONBOARDING;
    if(!S.onboarding.currentStep){
      S.onboarding.currentStep = "welcome";
    }
    render();
  }

  function continueOnboarding(){
    if(isOnboardingComplete()){
      S.screen = SCR.HOME_DASH;
      render();
      return;
    }
    S.screen = SCR.ONBOARDING;
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
    S.screen = SCR.HOME_DASH;
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
