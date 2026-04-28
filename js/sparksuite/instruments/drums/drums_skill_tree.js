(function(){
  window.SparkDrumsSkillTree=[
    {id:"kit_orientation",name:"Kit Orientation",category:"fundamentals",prerequisites:[]},
    {id:"counting_quarters",name:"Count Quarter Notes",category:"rhythm",prerequisites:[]},
    {id:"single_strokes",name:"Single Strokes",category:"rudiments",prerequisites:["counting_quarters"]},
    {id:"metronome_lock",name:"Metronome Lock",category:"timing",prerequisites:["counting_quarters"]},
    {id:"kick_control",name:"Kick Control",category:"coordination",prerequisites:["counting_quarters"]},
    {id:"basic_backbeat",name:"Basic Backbeat",category:"groove",prerequisites:["kick_control","metronome_lock"]},
    {id:"groove_consistency",name:"Groove Consistency",category:"timing",prerequisites:["basic_backbeat"]},
    {id:"one_bar_fills",name:"One-Bar Fills",category:"fills",prerequisites:["basic_backbeat"]}
  ];
})();
