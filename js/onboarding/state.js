(function(){
  function getOnboardingStateFacade(){
    return typeof SparkState !== "undefined" ? SparkState : null;
  }

  function getOnboardingStateRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function readOnboardingState(path, fallback){
    var facade = getOnboardingStateFacade();
    var root = getOnboardingStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(facade && typeof facade.read === "function") return facade.read(path, fallback);
    if(!cursor) return fallback;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function writeOnboardingState(path, value){
    var facade = getOnboardingStateFacade();
    var root = getOnboardingStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(facade && typeof facade.write === "function") return facade.write(path, value);
    if(!cursor || !parts.length) return value;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function createDefaultOnboardingState(){
    return {
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
  }

  function ensureOnboardingState(){
    var onboarding = readOnboardingState("onboarding", null);
    if(!onboarding || typeof onboarding !== "object" || Array.isArray(onboarding)){
      onboarding = createDefaultOnboardingState();
      writeOnboardingState("onboarding", onboarding);
    }
    return onboarding;
  }

  function isOnboardingComplete(){
    return !!readOnboardingState(["onboarding", "completed"], false);
  }

  function getCurrentOnboardingStep(){
    return readOnboardingState(["onboarding", "currentStep"], "welcome");
  }

  function setCurrentOnboardingStep(stepId){
    ensureOnboardingState();
    writeOnboardingState(["onboarding", "currentStep"], stepId);
    saveState();
  }

  function markOnboardingStarted(){
    var onboarding = ensureOnboardingState();
    if(!onboarding.startedAt){
      writeOnboardingState(["onboarding", "startedAt"], Date.now());
    }
    saveState();
  }

  function markOnboardingComplete(){
    ensureOnboardingState();
    writeOnboardingState(["onboarding", "completed"], true);
    writeOnboardingState(["onboarding", "completedAt"], Date.now());
    writeOnboardingState("firstRun", false);
    saveState();
  }

  function resetOnboarding(){
    writeOnboardingState("onboarding", createDefaultOnboardingState());
    writeOnboardingState("firstRun", true);
    saveState();
  }

  window.isOnboardingComplete = isOnboardingComplete;
  window.getCurrentOnboardingStep = getCurrentOnboardingStep;
  window.setCurrentOnboardingStep = setCurrentOnboardingStep;
  window.markOnboardingStarted = markOnboardingStarted;
  window.markOnboardingComplete = markOnboardingComplete;
  window.resetOnboarding = resetOnboarding;

})();
