(function(){

  function isOnboardingComplete(){
    return !!(S.onboarding && S.onboarding.completed);
  }

  function getCurrentOnboardingStep(){
    return (S.onboarding && S.onboarding.currentStep) || "welcome";
  }

  function setCurrentOnboardingStep(stepId){
    if(!S.onboarding) return;
    S.onboarding.currentStep = stepId;
    saveState();
  }

  function markOnboardingStarted(){
    if(!S.onboarding) return;
    if(!S.onboarding.startedAt){
      S.onboarding.startedAt = Date.now();
    }
    saveState();
  }

  function markOnboardingComplete(){
    if(!S.onboarding) return;
    S.onboarding.completed = true;
    S.onboarding.completedAt = Date.now();
    S.firstRun = false;
    saveState();
  }

  function resetOnboarding(){
    S.onboarding = {
      completed: false,
      startedAt: null,
      completedAt: null,
      currentStep: "welcome",
      instrument: null,
      skillLevel: null,
      goals: [],
      midiSetupDone: false,
      calibrationDone: false,
      starterContentUnlocked: false
    };
    S.firstRun = true;
    saveState();
  }

  window.isOnboardingComplete = isOnboardingComplete;
  window.getCurrentOnboardingStep = getCurrentOnboardingStep;
  window.setCurrentOnboardingStep = setCurrentOnboardingStep;
  window.markOnboardingStarted = markOnboardingStarted;
  window.markOnboardingComplete = markOnboardingComplete;
  window.resetOnboarding = resetOnboarding;

})();
