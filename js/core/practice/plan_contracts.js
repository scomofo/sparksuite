(function(){
  function createPracticePlan(){
    return {
      date: new Date().toISOString().slice(0,10),
      items: []
    };
  }

  function createPracticeItem(type, target){
    return {
      id: generateId("practice"),
      type: type,
      target: target || null,
      bpm: 80,
      completed: false
    };
  }

  window.createPracticePlan = createPracticePlan;
  window.createPracticeItem = createPracticeItem;
})();
