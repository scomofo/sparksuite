(function(){

  window.SparkOnboardingSteps = [
    {
      id: "welcome",
      title: "Welcome",
      canSkip: false
    },
    {
      id: "instrument",
      title: "Choose Instrument",
      canSkip: false
    },
    {
      id: "skill_level",
      title: "Choose Skill Level",
      canSkip: false
    },
    {
      id: "goals",
      title: "Choose Goals",
      canSkip: false
    },
    {
      id: "midi_setup",
      title: "MIDI Setup",
      canSkip: true
    },
    {
      id: "calibration",
      title: "Latency Calibration",
      canSkip: true
    },
    {
      id: "starter_unlocks",
      title: "Starter Content",
      canSkip: false
    },
    {
      id: "first_plan",
      title: "First Practice Plan",
      canSkip: false
    },
    {
      id: "first_recommendations",
      title: "First Recommendations",
      canSkip: false
    },
    {
      id: "finish",
      title: "You're Ready",
      canSkip: false
    }
  ];

  function getOnboardingStepById(id){
    var arr = SparkOnboardingSteps || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].id === id) return arr[i];
    }
    return null;
  }

  function getOnboardingStepIndex(id){
    var arr = SparkOnboardingSteps || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].id === id) return i;
    }
    return -1;
  }

  window.getOnboardingStepById = getOnboardingStepById;
  window.getOnboardingStepIndex = getOnboardingStepIndex;

})();
