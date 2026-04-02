(function(){

  var Templates = {
    rhythm:[
      { name:"8th Strum", pattern:["D","D","U","U","D","U"] },
      { name:"Waltz", pattern:["D","-","D","U","D","U"] }
    ],
    pianoLH:[
      { name:"1-5-8", notes:["C2","G2","C3"] },
      { name:"Alberti", notes:["C2","G2","E2","G2"] }
    ],
    chordProgressions:[
      { name:"Pop I-V-vi-IV", chords:["C","G","Am","F"] }
    ]
  };

  function applyRhythmTemplate(templateName, startBar){
    var t = findTemplate("rhythm", templateName);
    if(!t) return;
    if(typeof generateRhythmEvents === "function") generateRhythmEvents(t.pattern, startBar);
  }

  function applyLHPatternTemplate(templateName, startBar){
    var t = findTemplate("pianoLH", templateName);
    if(!t) return;
    if(typeof generateLHEvents === "function") generateLHEvents(t.notes, startBar);
  }

  function applyChordProgressionTemplate(templateName, startBar){
    var t = findTemplate("chordProgressions", templateName);
    if(!t) return;
    if(typeof generateChordBars === "function") generateChordBars(t.chords, startBar);
  }

  function findTemplate(type, name){
    var arr = Templates[type] || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].name === name) return arr[i];
    }
    return null;
  }

  window.Templates = Templates;
  window.applyRhythmTemplate = applyRhythmTemplate;
  window.applyLHPatternTemplate = applyLHPatternTemplate;
  window.applyChordProgressionTemplate = applyChordProgressionTemplate;

})();
