(function(){
  function PianoRuntimeAdapter(){}
  PianoRuntimeAdapter.prototype.getLaneCount=function(){return 8;};
  PianoRuntimeAdapter.prototype.getLaneLabels=function(){return ["C","D","E","F","G","A","B","C"];};
  PianoRuntimeAdapter.prototype.getDefaultInputMode=function(){return "midi_or_keyboard";};
  window.SparkPianoRuntimeAdapter=PianoRuntimeAdapter;
})();