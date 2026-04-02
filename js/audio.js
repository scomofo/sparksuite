// ===== AUDIO =====
var AC=window.AudioContext||window.webkitAudioContext||null;
var audioCtx=null;
var tunerR={stream:null,analyser:null,ctx:null,anim:null};
var chordR={stream:null,analyser:null,ctx:null,anim:null};

// ===== GUITAR WAV AUDIO =====
// Maps chord names (full) to WAV file stems for real guitar samples
var CHORD_FILE_MAP={
  "E Major":"E","A Major":"A","D Major":"D","G Major":"G","C Major":"C",
  "B Major":"B","F Major":"F",
  "E Minor":"Em","A Minor":"Am","D Minor":"Dm","B Minor":"Bm","F Minor":"Fm",
  "F# Minor":"F#m",
  "G7":"G7","C7":"C7","A7":"A7","E7":"E7","D7":"D7","B7":"B7",
  "Am7":"Am7","Em7":"Em7","Dm7":"Dm7",
  "Dsus2":"Dsus2","Dsus4":"Dsus4","Asus2":"Asus2","Asus4":"Asus4",
  "Cadd9":"Cadd9","Gadd9":"Gadd9",
  "E5 Power":"E5","E5":"E5","A5":"A5",
  "Em7 Full":"Em7","F Mini Barre":"F",
  "G Minor":"Gm","C Minor":"Cm",
  "F Major 7":"Fmaj7"
};
var GUITAR_AUDIO_BASE="./guitar_chords/";
var _chordAudioCache={};
var _chordAudioCacheOrder=[]; // insertion-order keys for LRU eviction
var _CHORD_AUDIO_CACHE_MAX=30;
var _guitarAudioReady=false;

function preloadGuitarAudio(){
  // Only preload if guitar tone is active to avoid ERR_FILE_NOT_FOUND spam
  if(typeof S!=="undefined"&&S.strumTone!=="guitar")return;
  var keys=Object.keys(CHORD_FILE_MAP);
  for(var i=0;i<keys.length;i++){
    var fileStem=CHORD_FILE_MAP[keys[i]];
    if(_chordAudioCache[fileStem])continue;
    try{
      var audio=new Audio(GUITAR_AUDIO_BASE+"chord_"+fileStem+".wav");
      audio.preload="auto";
      audio.onerror=function(){};// suppress console errors for missing files
      _cacheAudio(fileStem,audio);
    }catch(e){}
  }
  _guitarAudioReady=true;
}

function _cacheAudio(fileStem,audio){
  if(!_chordAudioCache[fileStem]){
    // Evict oldest entry if cache is full
    if(_chordAudioCacheOrder.length>=_CHORD_AUDIO_CACHE_MAX){
      var oldest=_chordAudioCacheOrder.shift();
      try{_chordAudioCache[oldest].src="";}catch(e){}
      delete _chordAudioCache[oldest];
    }
    _chordAudioCacheOrder.push(fileStem);
  }
  _chordAudioCache[fileStem]=audio;
}

function playGuitarChord(chordName){
  var fileStem=CHORD_FILE_MAP[chordName];
  if(!fileStem)return false;
  var audio=_chordAudioCache[fileStem];
  if(!audio){
    // Lazy-load on first use
    try{
      audio=new Audio(GUITAR_AUDIO_BASE+"chord_"+fileStem+".wav");
      _cacheAudio(fileStem,audio);
    }catch(e){return false;}
  }
  try{
    audio.currentTime=0;
    audio.play().catch(function(e){console.warn("ChordSpark: Guitar audio play failed:",e.message);});
    return true;
  }catch(e){return false;}
}

// Note frequencies (octave 4)
var NOTE_FREQ={
  "C":261.63,"C#":277.18,"D":293.66,"D#":311.13,"E":329.63,
  "F":349.23,"F#":369.99,"G":392.00,"G#":415.30,"A":440.00,
  "A#":466.16,"B":493.88
};

// Guitar string open note octaves for chord voicing
var GUITAR_STRING_NOTES=[
  {note:"E",octave:2},{note:"A",octave:2},{note:"D",octave:3},
  {note:"G",octave:3},{note:"B",octave:3},{note:"E",octave:4}
];

function snd(type){
  if(!S.soundOn)return;
  try{
    if(!audioCtx&&AC)audioCtx=new AC();
    if(!audioCtx)return;
    if(audioCtx.state==="suspended")audioCtx.resume();
    var o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);
    var fr={start:523,complete:659,tick:880,badge:784,click:1200,levelup:440,correct:880,wrong:220};
    o.frequency.value=fr[type]||440;
    g.gain.value=(type==="tick"||type==="click")?0.05:0.12;
    o.type=(type==="badge"||type==="levelup")?"triangle":type==="wrong"?"sawtooth":"sine";
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+((type==="complete"||type==="levelup")?0.6:0.15));
    o.stop(audioCtx.currentTime+0.7);
  }catch(e){}
}

// ===== STRUM TONES =====
var STRUM_TONES={
  classic:{type:"triangle",gain:0.18,attack:0.01,decay:2.5,stagger:0.025},
  nylon:{type:"sine",gain:0.20,attack:0.02,decay:3.0,stagger:0.030},
  steel:{type:"sawtooth",gain:0.10,attack:0.005,decay:1.8,stagger:0.020},
  electric:{type:"square",gain:0.08,attack:0.003,decay:2.0,stagger:0.022,distortion:true}
};

function makeDistortionCurve(amount){
  var k=typeof amount==="number"?amount:50;
  var n=44100,curve=new Float32Array(n);
  for(var i=0;i<n;i++){
    var x=i*2/n-1;
    curve[i]=(3+k)*x*20*(Math.PI/180)/(Math.PI+k*Math.abs(x));
  }
  return curve;
}

// ===== CHORD SOUND PREVIEW =====
function strumChord(chordName){
  try{
    if(!audioCtx&&AC)audioCtx=new AC();
    if(audioCtx&&audioCtx.state==="suspended")audioCtx.resume();
    var notes=CHORD_NOTES[chordName];
    if(!notes||notes.length===0){console.warn("ChordSpark: No notes for chord:",chordName);return;}
    sendMIDINotes(chordName);
    // Use real guitar WAV when "guitar" tone is selected
    if(S.strumTone==="guitar"){
      if(playGuitarChord(chordName))return;
      // Fall through to synth if WAV not available
      console.log("ChordSpark: Guitar WAV not available for",chordName,"- using synth");
    }
    if(!audioCtx){console.warn("ChordSpark: No AudioContext available");return;}
    var tone=STRUM_TONES[S.strumTone]||STRUM_TONES.classic;
    var freqs=[];
    for(var i=0;i<notes.length;i++){
      var base=NOTE_FREQ[notes[i]];
      if(!base)continue;
      if(base>330)base/=2;
      if(base<80)base*=2;
      freqs.push(base);
    }
    var now=audioCtx.currentTime;
    var distNode=null;
    if(tone.distortion){
      distNode=audioCtx.createWaveShaper();
      distNode.curve=makeDistortionCurve(100);
      distNode.oversample="4x";
      distNode.connect(audioCtx.destination);
    }
    for(var i=0;i<freqs.length;i++){
      var o=audioCtx.createOscillator();
      var g=audioCtx.createGain();
      o.connect(g);g.connect(distNode||audioCtx.destination);
      o.frequency.value=freqs[i];
      o.type=tone.type;
      var startT=now+i*tone.stagger;
      g.gain.setValueAtTime(0,startT);
      g.gain.linearRampToValueAtTime(tone.gain,startT+tone.attack);
      g.gain.exponentialRampToValueAtTime(0.001,startT+tone.decay);
      o.start(startT);
      o.stop(startT+tone.decay+0.1);
    }
  }catch(e){}
}

// ===== METRONOME =====
function metroClick(accent){
  if(!S.soundOn)return;
  try{
    if(!audioCtx&&AC)audioCtx=new AC();
    if(!audioCtx)return;
    var o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);
    o.frequency.value=accent?1200:800;o.type="sine";
    g.gain.value=accent?0.18:0.10;
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.06);
    o.stop(audioCtx.currentTime+0.08);
  }catch(e){}
}

var _metroNextTime=0;
var _metroLookahead=0.1; // seconds to look ahead
var _metroScheduleInterval=25; // ms between scheduler calls
function startMetronome(){
  S.metronomeOn=true;S._metroBeat=0;
  if(!audioCtx&&AC)audioCtx=new AC();
  if(audioCtx)_metroNextTime=audioCtx.currentTime;
  _metroSchedule();
  render();
}
function _metroSchedule(){
  if(!S.metronomeOn)return;
  if(audioCtx){
    var secPerBeat=60/S.metronomeBpm;
    while(_metroNextTime<audioCtx.currentTime+_metroLookahead){
      metroClick(S._metroBeat===0);
      S._metroBeat=(S._metroBeat+1)%S._metroBeats;
      _metroNextTime+=secPerBeat;
    }
  }
  T.metro=setTimeout(_metroSchedule,_metroScheduleInterval);
  render();
}

function stopMetronome(){
  S.metronomeOn=false;clearTimeout(T.metro);T.metro=null;render();
}

// ===== TUNER (YIN algorithm) =====
var _tunerPrevDetecting=false;
// Smoothing: require stable note for several consecutive frames before displaying
var _tunerHistory=[];
var _tunerHistorySize=5; // frames to average
var _tunerLastStableNote="";
var _tunerLastStableCents=0;
var _tunerStableCount=0;
var _tunerStableThreshold=5; // consecutive same-note frames to accept (higher = less flicker)

function autoCorrelate(buf,sr){
  var sz=buf.length,rms=0;
  for(var i=0;i<sz;i++)rms+=buf[i]*buf[i];
  rms=Math.sqrt(rms/sz);
  // Hysteresis: higher threshold to start, lower to continue
  var threshold=_tunerPrevDetecting?0.01:0.02;
  if(rms<threshold){_tunerPrevDetecting=false;return -1;}
  _tunerPrevDetecting=true;

  // YIN step 1: Difference function
  var halfSz=Math.floor(sz/2);
  var d=new Float32Array(halfSz);
  for(var tau=0;tau<halfSz;tau++){
    d[tau]=0;
    for(var j=0;j<halfSz;j++){
      var delta=buf[j]-buf[j+tau];
      d[tau]+=delta*delta;
    }
  }

  // YIN step 2: Cumulative mean normalized difference
  var dn=new Float32Array(halfSz);
  dn[0]=1;
  var runningSum=0;
  for(var tau=1;tau<halfSz;tau++){
    runningSum+=d[tau];
    dn[tau]=d[tau]*tau/runningSum;
  }

  // YIN step 3: Absolute threshold (find first tau below threshold)
  var yinThreshold=0.12;
  var tauEst=-1;
  // Min period: ~2000 Hz max; Max period: ~50 Hz min (covers low E ~82Hz)
  var minTau=Math.floor(sr/2000);
  var maxTau=Math.min(halfSz-1,Math.floor(sr/50));
  for(var tau=minTau;tau<maxTau;tau++){
    if(dn[tau]<yinThreshold){
      // Find the local minimum after dropping below threshold
      while(tau+1<maxTau&&dn[tau+1]<dn[tau])tau++;
      tauEst=tau;
      break;
    }
  }
  if(tauEst===-1){
    // Fallback: find global minimum in range
    var minVal=Infinity;
    for(var tau=minTau;tau<maxTau;tau++){
      if(dn[tau]<minVal){minVal=dn[tau];tauEst=tau;}
    }
    if(minVal>0.4)return -1; // Not confident enough
  }

  // YIN step 4: Parabolic interpolation
  if(tauEst>0&&tauEst<halfSz-1){
    var x1=dn[tauEst-1],x2=dn[tauEst],x3=dn[tauEst+1];
    var a=(x1+x3-2*x2)/2,b=(x3-x1)/2;
    if(a!==0){
      var shift=-b/(2*a);
      if(Math.abs(shift)<=1)tauEst+=shift;
    }
  }

  return sr/tauEst;
}

// Smooth tuner output: median filter on frequency, stable note detection
function smoothTunerResult(freq){
  if(freq<0){
    _tunerHistory=[];
    _tunerStableCount=0;
    return {note:null,freq:0,cents:0};
  }
  // Add to history and keep last N
  _tunerHistory.push(freq);
  if(_tunerHistory.length>_tunerHistorySize)_tunerHistory.shift();

  // Median filter to reject outliers
  var sorted=_tunerHistory.slice().sort(function(a,b){return a-b;});
  var medianFreq=sorted[Math.floor(sorted.length/2)];

  // Compute note from median frequency
  var nn=12*Math.log2(medianFreq/440);
  var nr=Math.round(nn);
  var ct=Math.round((nn-nr)*100);
  var idx=((nr%12)+12)%12;
  var noteName=NOTE_NAMES[(idx+9)%12];

  // Stability check: only change displayed note if new note is consistent
  if(noteName===_tunerLastStableNote){
    _tunerStableCount=Math.min(_tunerStableCount+1,_tunerStableThreshold+1);
    // Smooth cents with exponential moving average
    _tunerLastStableCents=Math.round(_tunerLastStableCents*0.6+ct*0.4);
  }else{
    _tunerStableCount++;
    if(_tunerStableCount>=_tunerStableThreshold){
      _tunerLastStableNote=noteName;
      _tunerLastStableCents=ct;
      _tunerStableCount=0;
    }
  }

  return {
    note:_tunerLastStableNote||noteName,
    freq:Math.round(medianFreq*10)/10,
    cents:_tunerLastStableNote?_tunerLastStableCents:ct
  };
}

// ===== CHORD DETECTION =====
function getExpectedNotes(chordName){return CHORD_NOTES[chordName]||[];}

// Stable chord detection state
var _chordNoteHistory=[];
var _chordHistorySize=8; // frames to accumulate
var _chordFrameCount=0;
var _chordUpdateInterval=3; // only process every Nth frame (reduce CPU)

function detectFromFFT(analyser,sampleRate){
  var bufLen=analyser.frequencyBinCount;
  var dataArray=new Float32Array(bufLen);
  analyser.getFloatFrequencyData(dataArray); // dB scale, more precise than byte
  var nyquist=sampleRate/2,binSize=nyquist/bufLen;

  // Find max amplitude and noise floor (median of all bins)
  var allVals=[];
  var maxVal=-Infinity;
  for(var i=0;i<bufLen;i++){
    if(dataArray[i]>maxVal)maxVal=dataArray[i];
    allVals.push(dataArray[i]);
  }
  allVals.sort(function(a,b){return a-b;});
  var noiseFloor=allVals[Math.floor(allVals.length*0.5)]; // median as noise floor

  // Reject if signal too weak (less than 30dB above noise)
  if(maxVal<-55||maxVal-noiseFloor<30)return [];

  // Threshold: 45% of dynamic range above noise
  var threshold=noiseFloor+(maxVal-noiseFloor)*0.45;

  // Harmonic Product Spectrum (HPS) to find fundamental frequencies
  // Downsample the spectrum and multiply — fundamentals align, harmonics don't
  var hpsOrder=3; // multiply original with 2x and 3x downsampled
  var hpsLen=Math.floor(bufLen/hpsOrder);
  var hps=new Float32Array(hpsLen);
  for(var i=0;i<hpsLen;i++){
    // Convert from dB to linear for multiplication, then back
    hps[i]=dataArray[i];
    for(var h=2;h<=hpsOrder;h++){
      hps[i]+=dataArray[i*h]; // addition in dB = multiplication in linear
    }
  }

  // Find peaks in HPS spectrum (these are likely fundamentals, not harmonics)
  var peaks=[];
  for(var i=6;i<hpsLen-6;i++){
    var freq=i*binSize;
    if(freq<60||freq>2000)continue; // guitar fundamental range (low E ~82Hz, harmonics up to ~2kHz)
    if(hps[i]<threshold*hpsOrder)continue; // scaled threshold for HPS
    // Local maximum within ±6 bins
    var isPeak=true;
    for(var j=1;j<=6;j++){
      if(hps[i]<hps[i-j]||hps[i]<hps[i+j]){isPeak=false;break;}
    }
    if(isPeak){
      // Parabolic interpolation for sub-bin frequency accuracy
      var alpha=hps[i-1],beta=hps[i],gamma=hps[i+1];
      var p=0.5*(alpha-gamma)/(alpha-2*beta+gamma);
      if(isNaN(p)||Math.abs(p)>1)p=0;
      var exactFreq=(i+p)*binSize;
      peaks.push({freq:exactFreq,amp:hps[i]});
    }
  }

  // Sort peaks by amplitude (strongest first) and take top 8
  peaks.sort(function(a,b){return b.amp-a.amp;});
  peaks=peaks.slice(0,8);

  // Map peaks to note names, keeping only the strongest per note class
  var notes={};
  for(var i=0;i<peaks.length;i++){
    var nn=12*Math.log2(peaks[i].freq/440),nr=Math.round(nn),idx=((nr%12)+12)%12;
    var name=NOTE_NAMES[(idx+9)%12];
    // Only accept if the peak is close enough to a real note (within 30 cents)
    var cents=Math.abs((nn-nr)*100);
    if(cents>30)continue;
    if(!notes[name]||peaks[i].amp>notes[name])notes[name]=peaks[i].amp;
  }
  return Object.keys(notes);
}

// Accumulate detected notes over several frames for stability
function getStableChordNotes(rawNotes){
  _chordNoteHistory.push(rawNotes);
  if(_chordNoteHistory.length>_chordHistorySize)_chordNoteHistory.shift();

  // Count how often each note appears across recent frames
  var counts={};
  for(var i=0;i<_chordNoteHistory.length;i++){
    var frame=_chordNoteHistory[i];
    for(var j=0;j<frame.length;j++){
      counts[frame[j]]=(counts[frame[j]]||0)+1;
    }
  }

  // Only include notes detected in at least 55% of recent frames
  var minCount=Math.max(3,Math.floor(_chordNoteHistory.length*0.55));
  var stable=[];
  for(var note in counts){
    if(counts[note]>=minCount)stable.push(note);
  }
  return stable;
}

function startChordDetect(){
  if(!AC){S.chordDetectErr="Audio not supported";render();return;}
  _chordNoteHistory=[];_chordFrameCount=0;
  navigator.mediaDevices.getUserMedia(getAudioConstraint()).then(function(st){
    chordR.stream=st;
    var ctx=new AC(),src=ctx.createMediaStreamSource(st),an=ctx.createAnalyser();
    an.fftSize=16384; // Higher resolution: ~2.7 Hz/bin at 44.1kHz
    an.smoothingTimeConstant=0.4; // Balanced: less lag, JS-level history handles stability
    src.connect(an);
    chordR.ctx=ctx;chordR.analyser=an;S.chordDetectOn=true;S.chordDetectErr=null;render();
    function det(){
      if(!S.chordDetectOn)return;
      _chordFrameCount++;
      // Only process every Nth frame to reduce CPU and improve stability
      if(_chordFrameCount%_chordUpdateInterval===0){
        var rawNotes=detectFromFFT(an,ctx.sampleRate);
        var found=getStableChordNotes(rawNotes);
        S.detectedNotes=found;
        if(S.screen===SCR.PERFORM&&S.performMode==="mic"&&typeof PerformanceInput!=="undefined"){PerformanceInput.onMicUpdate(S.detectedNotes);}
        var expected=getExpectedNotes(S.currentChord?S.currentChord.name:"");
        if(expected.length>0&&found.length>0){
          var hits=0;for(var i=0;i<expected.length;i++)if(found.indexOf(expected[i])!==-1)hits++;
          // Penalize wrong notes: extra notes not in the chord reduce score
          var wrong=0;for(var i=0;i<found.length;i++)if(expected.indexOf(found[i])===-1)wrong++;
          var accuracy=hits/expected.length;
          var penalty=wrong>0?wrong/(found.length+expected.length):0;
          S.chordMatch=Math.max(0,Math.round((accuracy-penalty)*100));
        }else{S.chordMatch=-1;}
        // Update only the chord check section, not full DOM rebuild
        updateChordCheckUI();
      }
      chordR.anim=requestAnimationFrame(det);
    }det();
  }).catch(function(){S.chordDetectErr="Microphone access denied";render();});
}

function stopChordDetect(){
  S.chordDetectOn=false;S.detectedNotes=[];S.chordMatch=-1;
  if(chordR.anim)cancelAnimationFrame(chordR.anim);
  if(chordR.stream)chordR.stream.getTracks().forEach(function(t){t.stop();});
  if(chordR.ctx)chordR.ctx.close();
  chordR={stream:null,analyser:null,ctx:null,anim:null};render();
}

// ===== AI COACH FEEDBACK =====
function getCoachFeedback(chordName,detectedNotes,expectedNotes){
  if(!expectedNotes||expectedNotes.length===0)return [];
  var tips=[];
  var missing=[];
  for(var i=0;i<expectedNotes.length;i++){
    if(detectedNotes.indexOf(expectedNotes[i])===-1)missing.push(expectedNotes[i]);
  }
  if(missing.length===0)return ["Great job! All notes are ringing clearly."];
  // Map notes to guitar strings for the current chord
  var chord=null;
  for(var i=0;i<ALL_CHORDS.length;i++)if(ALL_CHORDS[i].name===chordName){chord=ALL_CHORDS[i];break;}
  if(!chord)return [];
  for(var i=0;i<missing.length;i++){
    var note=missing[i];
    // Find which string plays this note — prefer fretted (non-open) strings,
    // then lowest-numbered string when multiple match the same note name
    var stringIdx=-1;
    var openMatch=-1;
    for(var s=0;s<6;s++){
      if(chord.frets[s]>=0){
        var openNote=GUITAR_STRING_NOTES[s].note;
        var openIdx=NOTE_NAMES.indexOf(openNote);
        var frettedIdx=(openIdx+chord.frets[s])%12;
        if(NOTE_NAMES[frettedIdx]===note){
          if(chord.frets[s]>0){stringIdx=s;break;} // prefer fretted
          else if(openMatch===-1){openMatch=s;}
        }
      }
    }
    if(stringIdx===-1)stringIdx=openMatch;
    if(stringIdx>=0){
      if(chord.frets[stringIdx]===0){
        tips.push("The "+STRING_NAMES[stringIdx]+" string ("+note+") should ring open - check your fingers aren't touching it");
      }else{
        tips.push("Press harder on the "+STRING_NAMES[stringIdx]+" string, fret "+chord.frets[stringIdx]+" for the "+note+" note");
      }
    }else{
      tips.push("The "+note+" note is missing - check your finger positions");
    }
  }
  return tips.slice(0,3); // Max 3 tips
}

// ===== AUDIO INPUT DEVICE SELECTION =====
function getAudioConstraint(){
  if(S.audioInputId){
    return {audio:{deviceId:{exact:S.audioInputId}}};
  }
  return {audio:true};
}

function refreshAudioInputs(){
  // Request mic permission first so labels are available
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){
    st.getTracks().forEach(function(t){t.stop();});
    return navigator.mediaDevices.enumerateDevices();
  }).then(function(devices){
    S.audioInputDevices=[];
    for(var i=0;i<devices.length;i++){
      if(devices[i].kind==="audioinput"){
        S.audioInputDevices.push({id:devices[i].deviceId,name:devices[i].label||"Input "+(S.audioInputDevices.length+1)});
      }
    }
    render();
  }).catch(function(){});
}

var _audioTestStream=null,_audioTestCtx=null,_audioTestAnim=null;
function testAudioInput(deviceId){
  stopAudioTest();
  S.audioTestingId=deviceId;S.audioTestLevel=0;render();
  navigator.mediaDevices.getUserMedia({audio:{deviceId:{exact:deviceId}}}).then(function(st){
    _audioTestStream=st;
    _audioTestCtx=new AC();
    var src=_audioTestCtx.createMediaStreamSource(st);
    var an=_audioTestCtx.createAnalyser();
    an.fftSize=512;src.connect(an);
    var buf=new Float32Array(an.fftSize);
    function poll(){
      if(S.audioTestingId!==deviceId)return;
      an.getFloatTimeDomainData(buf);
      var peak=0;
      for(var i=0;i<buf.length;i++){var v=Math.abs(buf[i]);if(v>peak)peak=v;}
      S.audioTestLevel=Math.round(Math.min(peak*200,100));
      // Update meter directly to avoid full re-render flicker
      var el=document.getElementById("audio-test-meter");
      var lbl=document.getElementById("audio-test-label");
      if(el){
        el.style.width=S.audioTestLevel+"%";
        el.style.background=S.audioTestLevel>10?"#4ECDC4":"var(--text-muted)";
      }
      if(lbl){
        lbl.textContent=S.audioTestLevel>10?"Signal detected — strum to confirm":"No signal — try another device";
        lbl.style.color=S.audioTestLevel>10?"#4ECDC4":"var(--text-muted)";
      }
      _audioTestAnim=requestAnimationFrame(poll);
    }poll();
  }).catch(function(){S.audioTestingId="";S.audioTestLevel=0;render();});
}
function stopAudioTest(){
  S.audioTestingId="";S.audioTestLevel=0;
  if(_audioTestAnim)cancelAnimationFrame(_audioTestAnim);
  if(_audioTestStream)_audioTestStream.getTracks().forEach(function(t){t.stop();});
  if(_audioTestCtx)try{_audioTestCtx.close();}catch(e){}
  _audioTestStream=null;_audioTestCtx=null;_audioTestAnim=null;
}

// ===== MIDI OUTPUT & INPUT =====
var _midiAccess=null;
var _midiInputNotes={}; // currently held MIDI notes {noteNum: true}

function initMIDI(){
  if(!navigator.requestMIDIAccess){S.midiEnabled=false;return;}
  navigator.requestMIDIAccess().then(function(access){
    _midiAccess=access;
    updateMIDIDevices();
    _setupMIDIInputs();
    access.onstatechange=function(){updateMIDIDevices();_setupMIDIInputs();render();};
    if(S.midiOutputId){
      var out=_midiAccess.outputs.get(S.midiOutputId);
      if(out)S.midiOutput=out;
    }
    if(!S.midiOutput){
      _midiAccess.outputs.forEach(function(port){
        if(!S.midiOutput)S.midiOutput=port;
      });
    }
    render();
  }).catch(function(){S.midiEnabled=false;render();});
}

// MIDI input: listen to all connected MIDI inputs for note on/off
function _setupMIDIInputs(){
  if(!_midiAccess)return;
  _midiAccess.inputs.forEach(function(input){
    input.onmidimessage=_handleMIDIMessage;
  });
}

function _handleMIDIMessage(event){
  var cmd=event.data[0]&0xf0,note=event.data[1],vel=event.data[2];
  // Forward to performance input when perform mode is active
  if(S.screen===SCR.PERFORM&&typeof PerformanceInput!=="undefined"){PerformanceInput.onMidiMessage(event);}
  if(cmd===0x90&&vel>0){
    // Note On
    _midiInputNotes[note]=true;
    _processMIDIChord();
  }else if(cmd===0x80||(cmd===0x90&&vel===0)){
    // Note Off
    delete _midiInputNotes[note];
  }
}

function _processMIDIChord(){
  // Convert held MIDI notes to note names for chord detection
  var noteNames=[];
  for(var n in _midiInputNotes){
    var idx=parseInt(n)%12;
    noteNames.push(NOTE_NAMES[idx]);
  }
  // Deduplicate
  var unique=[];
  for(var i=0;i<noteNames.length;i++){
    if(unique.indexOf(noteNames[i])===-1)unique.push(noteNames[i]);
  }
  if(unique.length>=2){
    // Feed into chord detection
    S.detectedNotes=unique;
    // Forward to performance input in mic mode
    if(S.screen===SCR.PERFORM&&S.performMode==="mic"&&typeof PerformanceInput!=="undefined"){PerformanceInput.onMicUpdate(unique);}
    var expected=getExpectedNotes(S.currentChord?S.currentChord.name:"");
    if(expected.length>0){
      var hits=0;for(var i=0;i<expected.length;i++)if(unique.indexOf(expected[i])!==-1)hits++;
      var wrong=0;for(var i=0;i<unique.length;i++)if(expected.indexOf(unique[i])===-1)wrong++;
      var accuracy=hits/expected.length;
      var penalty=wrong>0?wrong/(unique.length+expected.length):0;
      S.chordMatch=Math.max(0,Math.round((accuracy-penalty)*100));
    }
    updateChordCheckUI();
  }
}

function updateMIDIDevices(){
  S.midiDevices=[];
  if(!_midiAccess)return;
  _midiAccess.outputs.forEach(function(port){
    S.midiDevices.push({id:port.id,name:port.name||"MIDI Output"});
  });
}

function selectMIDIDevice(id){
  if(!_midiAccess)return;
  var out=_midiAccess.outputs.get(id);
  if(out){S.midiOutput=out;S.midiOutputId=id;saveState();}
  render();
}

function sendMIDINotes(chordName){
  if(!S.midiEnabled||!S.midiOutput)return;
  var notes=CHORD_NOTES[chordName];
  if(!notes||notes.length===0)return;
  var out=S.midiOutput;
  var midiNotes=[];
  for(var i=0;i<notes.length;i++){
    var noteIdx=NOTE_NAMES.indexOf(notes[i]);
    if(noteIdx===-1)continue;
    var midiNote=48+noteIdx;
    if(i===0)midiNotes.push(midiNote-12);
    midiNotes.push(midiNote);
  }
  for(var i=0;i<midiNotes.length;i++){
    out.send([0x90,midiNotes[i],80],performance.now()+i*25);
  }
  setTimeout(function(){
    if(!out)return;
    try{for(var i=0;i<midiNotes.length;i++)out.send([0x80,midiNotes[i],0]);}catch(e){}
  },500);
}

// ===== STEM PLAYBACK =====
var _stemAudios={};
var _stemTimeUpdater=null;
var STEM_NAMES=["vocals","drums","bass","guitar","piano","other"];
var STEM_COLORS={vocals:"#FF6B6B",drums:"#FFE66D",bass:"#4ECDC4",guitar:"#FF8A5C",piano:"#45B7D1",other:"#A78BFA"};
var STEM_ICONS={vocals:"&#127908;",drums:"&#129345;",bass:"&#127928;",guitar:"&#127930;",piano:"&#127929;",other:"&#127926;"};

function loadStemUrls(urlMap){
  cleanupStems();
  var keys=Object.keys(urlMap);
  var loaded=0;
  for(var i=0;i<keys.length;i++){
    var name=keys[i];
    var audio=new Audio();
    audio.preload="auto";
    audio.src=urlMap[name];
    audio.muted=!S.stemToggles[name];
    audio.volume=S.stemVolume;
    _stemAudios[name]=audio;
  }
  // Use first stem for duration/time tracking
  var first=_stemAudios[keys[0]];
  if(first){
    first.addEventListener("loadedmetadata",function(){
      S.stemDuration=first.duration;
      render();
    });
  }
}

function playStems(){
  var keys=Object.keys(_stemAudios);
  if(keys.length===0)return;
  for(var i=0;i<keys.length;i++){
    _stemAudios[keys[i]].play().catch(function(){});
  }
  S.stemPlaying=true;
  // Update time display
  clearInterval(_stemTimeUpdater);
  _stemTimeUpdater=setInterval(function(){
    var first=_stemAudios[Object.keys(_stemAudios)[0]];
    if(first){
      S.stemCurrentTime=first.currentTime;
      if(first.ended){
        S.stemPlaying=false;
        clearInterval(_stemTimeUpdater);
      }
      render();
    }
  },250);
  render();
}

function pauseStems(){
  var keys=Object.keys(_stemAudios);
  for(var i=0;i<keys.length;i++){
    _stemAudios[keys[i]].pause();
  }
  S.stemPlaying=false;
  clearInterval(_stemTimeUpdater);
  render();
}

function seekStems(time){
  var keys=Object.keys(_stemAudios);
  for(var i=0;i<keys.length;i++){
    _stemAudios[keys[i]].currentTime=time;
  }
  S.stemCurrentTime=time;
  render();
}

function setStemMuted(name,muted){
  if(_stemAudios[name]){
    _stemAudios[name].muted=muted;
  }
}

function setStemVolume(vol){
  var keys=Object.keys(_stemAudios);
  for(var i=0;i<keys.length;i++){
    _stemAudios[keys[i]].volume=vol;
  }
}

function setStemPlaybackRate(rate){
  var keys=Object.keys(_stemAudios);
  for(var i=0;i<keys.length;i++){
    _stemAudios[keys[i]].playbackRate=rate;
  }
}

function getFirstStemAudio(){
  var keys=Object.keys(_stemAudios);
  return keys.length?_stemAudios[keys[0]]:null;
}

function cleanupStems(){
  var keys=Object.keys(_stemAudios);
  for(var i=0;i<keys.length;i++){
    try{_stemAudios[keys[i]].pause();_stemAudios[keys[i]].src="";}catch(e){}
  }
  _stemAudios={};
  clearInterval(_stemTimeUpdater);
  S.stemPlaying=false;
  S.stemCurrentTime=0;
  S.stemDuration=0;
}
