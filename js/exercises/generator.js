(function(){

function generateExercise(type, options){
  options = options || {};

  if(type==="chord") return generateChordExercise(options);
  if(type==="transition") return generateTransitionExercise(options);
  if(type==="scale") return generateScaleExercise(options);
  if(type==="arpeggio") return generateArpeggioExercise(options);
  if(type==="rhythm") return generateRhythmExercise(options);
  if(type==="lead") return generateLeadExercise(options);
  if(type==="finger") return generateFingerExercise(options);

  return null;
}

// ── Helpers ──

function getChordsForLevel(level){
  if(typeof CHORDS==="undefined") return [];
  var arr = [];
  for(var i=1;i<=level;i++){
    if(CHORDS[i]) arr = arr.concat(CHORDS[i]);
  }
  return arr;
}

// ── Chord ──

function generateChordExercise(options){
  var level = options.level || S.level || 1;
  var chords = getChordsForLevel(level);
  if(!chords.length) return null;

  var chord = chords[Math.floor(Math.random()*chords.length)];

  return {
    id: "ex_chord_" + chord.name.replace(/\s+/g,"_"),
    type: "chord",
    title: chord.name + " Clean Strum",
    description: "Strum slowly and cleanly",
    bpm: 60,
    duration: 60,
    pattern: [chord.short],
    strum: ["D","D","D","D"],
    goal: { cleanStrums: 20 },
    meta: { chord: chord.name, level: level }
  };
}

// ── Transition ──

function generateTransitionExercise(options){
  var ts = S.transitionStats || {};
  var weakest = null;
  var worstScore = 999;

  for(var key in ts){
    var row = ts[key];
    if(!row || !row.avgTime) continue;
    if(row.avgTime < worstScore){
      worstScore = row.avgTime;
      weakest = key;
    }
  }

  if(!weakest){
    return {
      id:"ex_transition_basic",
      type:"transition",
      title:"Basic Transition Drill",
      description:"Switch between two chords",
      bpm:60,
      duration:60,
      pattern:["G","C"],
      goal:{cleanSwitches:20}
    };
  }

  var parts = weakest.split("->");

  return {
    id:"ex_transition_" + weakest.replace(/[^a-zA-Z0-9]/g,"_"),
    type:"transition",
    title:parts[0] + " \u2192 " + parts[1] + " Drill",
    description:"Practice this transition slowly and cleanly",
    bpm:60,
    duration:60,
    pattern:[parts[0], parts[1]],
    goal:{cleanSwitches:30},
    meta:{transition:weakest}
  };
}

// ── Scale ──

function generateScaleExercise(options){
  var keys = ["C","D","E","F","G","A"];
  var key = keys[Math.floor(Math.random()*keys.length)];
  var types = ["major","minorPent","blues"];
  var type = types[Math.floor(Math.random()*types.length)];

  return {
    id:"ex_scale_"+key+"_"+type,
    type:"scale",
    title:key+" "+type+" scale",
    description:"Play ascending and descending",
    bpm:70,
    duration:60,
    meta:{ key:key, scale:type }
  };
}

// ── Arpeggio ──

function generateArpeggioExercise(options){
  var level = S.level || 1;
  var chords = getChordsForLevel(level);
  if(!chords.length) return null;

  var chord = chords[Math.floor(Math.random()*chords.length)];

  return {
    id:"ex_arpeggio_"+chord.short,
    type:"arpeggio",
    title:chord.name+" Arpeggio",
    description:"Pick each string individually",
    bpm:60,
    duration:60,
    pattern:["P","I","M","A"],
    meta:{ chord: chord.name }
  };
}

// ── Rhythm ──

function generateRhythmExercise(options){
  if(typeof STRUM_PATTERNS==="undefined") return null;

  var pat = STRUM_PATTERNS[Math.floor(Math.random()*STRUM_PATTERNS.length)];

  return {
    id:"ex_rhythm_"+pat.name.replace(/\s+/g,"_"),
    type:"rhythm",
    title:pat.name,
    description:pat.desc,
    bpm:pat.bpm,
    duration:60,
    pattern:pat.pattern,
    meta:{ level:pat.level }
  };
}

// ── Lead ──

function generateLeadExercise(options){
  var keys = ["C","G","D","A","E"];
  var key = keys[Math.floor(Math.random()*keys.length)];

  return {
    id:"ex_lead_"+key,
    type:"lead",
    title:key+" Minor Pentatonic Lead",
    description:"Improvise using the minor pentatonic scale",
    bpm:80,
    duration:60,
    meta:{ key:key, scale:"minorPent" }
  };
}

// ── Finger ──

function generateFingerExercise(options){
  if(typeof FINGER_EXERCISES==="undefined") return null;

  var ex = FINGER_EXERCISES[Math.floor(Math.random()*FINGER_EXERCISES.length)];

  return {
    id:"ex_finger_"+ex.id,
    type:"finger",
    title:ex.name,
    description:ex.desc,
    duration:ex.duration,
    bpm:ex.bpm,
    meta:{ tier:ex.tier }
  };
}

window.generateExercise = generateExercise;
window.generateChordExercise = generateChordExercise;
window.generateTransitionExercise = generateTransitionExercise;
window.generateScaleExercise = generateScaleExercise;
window.generateArpeggioExercise = generateArpeggioExercise;
window.generateRhythmExercise = generateRhythmExercise;
window.generateLeadExercise = generateLeadExercise;
window.generateFingerExercise = generateFingerExercise;

})();
