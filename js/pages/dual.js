// ===== ChordSpark: Dual Instrument View (Piano + Guitar) =====

// Piano keyboard SVG renderer
// Draws a 2-octave keyboard (C3-B4) with highlighted notes and finger numbers
function pianoSVG(pianoChord,sz){
  sz=sz||300;
  var w=sz,h=sz*0.45;
  // White keys: C D E F G A B (x2 octaves = 14 keys)
  var whiteNames=["C","D","E","F","G","A","B"];
  var octaves=[3,4];
  var wKeys=[];
  for(var o=0;o<octaves.length;o++){
    for(var n=0;n<whiteNames.length;n++){
      wKeys.push(whiteNames[n]+octaves[o]);
    }
  }
  var wW=w/wKeys.length,wH=h;
  // Black key positions relative to each group of 7 white keys
  var blackOffsets=[0.65,1.75,3.6,4.7,5.75]; // C# D# F# G# A#
  var blackNames=["C#","D#","F#","G#","A#"];
  var bKeys=[];
  for(var o=0;o<octaves.length;o++){
    for(var b=0;b<blackOffsets.length;b++){
      bKeys.push({
        name:blackNames[b]+octaves[o],
        x:(o*7+blackOffsets[b])*wW
      });
    }
  }
  var bW=wW*0.6,bH=h*0.6;

  // Which notes are active?
  var activeNotes=pianoChord?pianoChord.notes:[];
  var activeFingers=pianoChord?pianoChord.fingers:[];
  // Build lookup: noteName → finger
  var noteFingerMap={};
  for(var i=0;i<activeNotes.length;i++){
    noteFingerMap[activeNotes[i]]=activeFingers[i]||"";
  }

  var s='<svg width="'+w+'" height="'+(h+30)+'" viewBox="0 0 '+w+' '+(h+30)+'" role="img" aria-label="Piano keyboard">';

  // White keys
  for(var i=0;i<wKeys.length;i++){
    var x=i*wW,active=!!noteFingerMap[wKeys[i]];
    var fill=active?"#4ECDC4":"#fff";
    var stroke="#999";
    s+='<rect x="'+x+'" y="0" width="'+(wW-1)+'" height="'+wH+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1" rx="0 0 3 3"/>';
    if(active){
      // Finger number
      s+='<circle cx="'+(x+wW/2)+'" cy="'+(wH-16)+'" r="10" fill="#fff" stroke="#4ECDC4" stroke-width="2"/>';
      s+='<text x="'+(x+wW/2)+'" y="'+(wH-12)+'" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">'+noteFingerMap[wKeys[i]]+'</text>';
    }
    // Note label
    var noteLetter=wKeys[i].replace(/[0-9]/g,"");
    if(noteLetter==="C"){
      s+='<text x="'+(x+wW/2)+'" y="'+(h+16)+'" text-anchor="middle" font-size="10" fill="var(--text-muted)">'+wKeys[i]+'</text>';
    }
  }

  // Black keys
  for(var i=0;i<bKeys.length;i++){
    var bk=bKeys[i],active=!!noteFingerMap[bk.name];
    var fill=active?"#FF6B6B":"#333";
    s+='<rect x="'+bk.x+'" y="0" width="'+bW+'" height="'+bH+'" fill="'+fill+'" stroke="#222" stroke-width="1" rx="0 0 3 3"/>';
    if(active){
      s+='<circle cx="'+(bk.x+bW/2)+'" cy="'+(bH-14)+'" r="8" fill="#fff" stroke="#FF6B6B" stroke-width="2"/>';
      s+='<text x="'+(bk.x+bW/2)+'" y="'+(bH-10)+'" text-anchor="middle" font-size="10" font-weight="bold" fill="#333">'+noteFingerMap[bk.name]+'</text>';
    }
  }

  s+='</svg>';
  return s;
}

// Guitar SVG with Sticky Anchor overlay
function dualGuitarSVG(chord,sz,anchorOn){
  // Render the base guitar SVG
  var base=chordSVG(chord,sz,chord.name,false);
  if(!anchorOn)return base;

  // Check if this chord is in the anchor set
  var isAnchorChord=GUITAR_ANCHOR.activeChords.indexOf(chord.name)!==-1;
  if(!isAnchorChord)return base;

  // Overlay anchor indicator: pulsing ring on the anchor position
  var w=sz,h=sz*1.3,pL=35,pR=20,pT=30,pB=20,fC=4,sC=6;
  var fH=(h-pT-pB)/fC,sW=(w-pL-pR)/(sC-1);
  var anchorCx=pL+GUITAR_ANCHOR.targetString*sW;
  var anchorCy=pT+(GUITAR_ANCHOR.fret-0.5)*fH;

  // Insert the anchor ring before the closing </svg>
  var anchorSvg='<circle cx="'+anchorCx+'" cy="'+anchorCy+'" r="16" fill="none" stroke="#FFE66D" stroke-width="3" stroke-dasharray="4 3" style="animation:anchorPulse 1.5s ease-in-out infinite"/>';
  anchorSvg+='<text x="'+anchorCx+'" y="'+(anchorCy+22)+'" text-anchor="middle" font-size="9" fill="#FFE66D" font-weight="bold">ANCHOR</text>';

  return base.replace('</svg>',anchorSvg+'</svg>');
}

// Main dual tab page
function dualTab(){
  var chordName=S.dualChord||"G Major";
  // Find the guitar chord object
  var guitarChord=null;
  for(var i=0;i<ALL_CHORDS.length;i++){
    if(ALL_CHORDS[i].name===chordName){guitarChord=ALL_CHORDS[i];break;}
  }
  // Get piano chord (from data or dynamically)
  var pianoChord=PIANO_CHORDS[chordName]||null;
  if(!pianoChord){
    // Dynamic calculation via ChordEngine
    var root=chordName.split(" ")[0];
    var quality=chordName.indexOf("Minor")!==-1?"Minor":"Major";
    var notes=ChordEngine.get(root,quality);
    if(notes){
      pianoChord={notes:notes.map(function(n){return n+"4";}),fingers:[1,3,5],quality:quality};
    }
  }

  var h='<div class="text-center">';
  h+='<h2 style="font-size:22px;font-weight:900;color:var(--text-primary);margin:8px 0">&#127929; Dual View</h2>';
  h+='<p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Piano + Guitar &mdash; same chord, both instruments</p>';

  // Chord selector chips
  var dualChords=["G Major","C Major","D Major","A Minor","E Minor","A Major","F Major","D Minor","E Major"];
  h+='<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:16px">';
  for(var i=0;i<dualChords.length;i++){
    var dc=dualChords[i],sel=chordName===dc;
    var short=dc.replace(" Major","").replace(" Minor","m");
    h+='<button onclick="act(\'dualChord\',\''+dc+'\')" style="padding:6px 14px;border-radius:12px;font-size:13px;font-weight:700;background:'+(sel?"linear-gradient(135deg,#4ECDC4,#45B7D1)":"var(--input-bg)")+';color:'+(sel?"#fff":"var(--text-muted)")+';border:2px solid '+(sel?"#4ECDC4":"var(--border)")+';transition:all .2s">'+short+'</button>';
  }
  h+='</div>';

  // Current chord header
  h+='<div style="margin-bottom:12px">';
  h+='<span style="font-size:28px;font-weight:900;color:var(--text-primary)">'+chordName+'</span>';
  if(pianoChord){
    h+=' <span style="font-size:12px;padding:3px 10px;border-radius:10px;background:'+(pianoChord.quality==="Minor"?"#FF6B6B22":"#4ECDC422")+';color:'+(pianoChord.quality==="Minor"?"#FF6B6B":"#4ECDC4")+';font-weight:700">'+pianoChord.quality+'</span>';
  }
  h+='</div>';

  // Listen button
  if(guitarChord){
    h+='<button onclick="act(\'dualPreview\',\''+chordName+'\')" style="margin-bottom:16px;background:none;font-size:14px;color:var(--text-muted)">&#128264; Listen</button>';
  }

  // Two cards side by side
  h+='<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">';

  // Piano card
  h+='<div class="card" style="flex:1;min-width:260px;max-width:360px;text-align:center">';
  h+='<h3 style="margin:0 0 8px;font-size:15px;font-weight:800;color:var(--text-primary)">&#127929; Piano</h3>';
  if(pianoChord){
    h+='<div class="flex-center" style="overflow-x:auto">'+pianoSVG(pianoChord,300)+'</div>';
    h+='<div style="margin-top:10px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap">';
    for(var i=0;i<pianoChord.notes.length;i++){
      h+='<span style="background:var(--chip-bg);padding:4px 12px;border-radius:10px;font-size:13px;font-weight:700;color:var(--chip-color)">'+pianoChord.notes[i]+' <span style="opacity:0.6">('+pianoChord.fingers[i]+')</span></span>';
    }
    h+='</div>';
  }else{
    h+='<p style="color:var(--text-muted);font-size:13px">No piano voicing available for this chord.</p>';
  }
  h+='</div>';

  // Guitar card
  h+='<div class="card" style="flex:1;min-width:200px;max-width:280px;text-align:center">';
  h+='<h3 style="margin:0 0 8px;font-size:15px;font-weight:800;color:var(--text-primary)">&#127930; Guitar</h3>';
  if(guitarChord){
    h+='<div class="flex-center">'+dualGuitarSVG(guitarChord,200,S.dualAnchorOn)+'</div>';
  }else{
    h+='<p style="color:var(--text-muted);font-size:13px">No guitar diagram available for this chord.</p>';
  }
  h+='</div>';

  h+='</div>'; // end flex row

  // Anchor mode toggle
  var isAnchorChord=GUITAR_ANCHOR.activeChords.indexOf(chordName)!==-1;
  h+='<div class="card" style="margin-bottom:16px">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between">';
  h+='<div><h4 style="margin:0;font-size:14px;font-weight:800;color:var(--text-primary)">&#128204; Sticky Anchor</h4>';
  h+='<p style="margin:4px 0 0;font-size:11px;color:var(--text-muted)">'+GUITAR_ANCHOR.instruction+'</p></div>';
  h+='<button onclick="act(\'toggleAnchor\')" style="padding:8px 16px;border-radius:12px;font-size:12px;font-weight:700;background:'+(S.dualAnchorOn?"#FFE66D":"var(--input-bg)")+';color:'+(S.dualAnchorOn?"#333":"var(--text-muted)")+';border:2px solid '+(S.dualAnchorOn?"#FFE66D":"var(--border)")+'">'+(S.dualAnchorOn?"ON":"OFF")+'</button>';
  h+='</div>';
  if(S.dualAnchorOn&&isAnchorChord){
    h+='<div style="margin-top:10px;background:#FFE66D11;border:1px solid #FFE66D44;border-radius:10px;padding:8px 12px;font-size:12px;color:#FFE66D;font-weight:600">&#9989; Ring finger is anchored on B-string fret 3 for this chord</div>';
  }else if(S.dualAnchorOn&&!isAnchorChord){
    h+='<div style="margin-top:10px;font-size:11px;color:var(--text-muted);font-style:italic">Anchor applies to G, C, Cadd9, and D transitions only</div>';
  }
  h+='</div>';

  // Quick theory card
  if(pianoChord){
    var quality=pianoChord.quality||"Major";
    var ivs=ChordEngine.intervals[quality];
    h+='<div class="card"><h4 style="margin:0 0 6px;font-size:14px;font-weight:800;color:var(--text-primary)">&#127911; How it\'s built</h4>';
    h+='<p style="margin:0;font-size:12px;color:var(--text-muted);line-height:1.6">'+quality+' triad = intervals <strong>'+ivs.join(', ')+'</strong> semitones from root. ';
    var root=pianoChord.notes[0].replace(/[0-9]/g,"");
    var builtNotes=ChordEngine.get(root,quality);
    if(builtNotes)h+='Notes: <strong>'+builtNotes.join(' &ndash; ')+'</strong>';
    h+='</p></div>';
  }

  h+='</div>';
  return h;
}
