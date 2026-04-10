/* ===== MIDI Backing Track Playback ===== */
/* Parses standard MIDI files and plays them via Web Audio API as backing tracks */

(function(){

  var _midiCtx = null;       // AudioContext for MIDI playback
  var _midiGain = null;      // Master gain node
  var _midiNotes = [];       // Parsed note schedule [{t, dur, midi, ch, vel}, ...]
  var _midiOscs = [];        // Active scheduled oscillator nodes
  var _midiPlaying = false;
  var _midiStartTime = 0;    // AudioContext time when playback started
  var _midiOffsetSec = 0;    // Seek offset
  var _midiSpeed = 1;
  var _midiVolume = 0.5;
  var _midiLoaded = false;
  var _midiSrc = null;

  // GM-ish instrument detection: channels 1-9 = melodic, channel 10 = drums
  var DRUM_CHANNEL = 9; // 0-indexed (MIDI channel 10)

  /* ---- Lightweight MIDI parser (Standard MIDI File format 0 & 1) ---- */

  function parseMidiBuffer(buf){
    var data = new Uint8Array(buf);
    var pos = 0;

    function read(n){
      var out = [];
      for(var i=0;i<n;i++) out.push(data[pos++]);
      return out;
    }
    function readU16(){ return (data[pos++]<<8)|data[pos++]; }
    function readU32(){ return (data[pos++]<<24)|(data[pos++]<<16)|(data[pos++]<<8)|data[pos++]; }
    function readVLQ(){
      var val=0;
      for(var i=0;i<4;i++){
        var b=data[pos++];
        val=(val<<7)|(b&0x7F);
        if(!(b&0x80)) break;
      }
      return val;
    }
    function readStr(n){
      var s="";
      for(var i=0;i<n;i++) s+=String.fromCharCode(data[pos++]);
      return s;
    }

    // Header chunk
    var hdrTag = readStr(4);
    if(hdrTag !== "MThd") throw new Error("Not a MIDI file");
    var hdrLen = readU32();
    var format = readU16();
    var nTracks = readU16();
    var division = readU16();
    var ticksPerBeat = division & 0x7FFF;

    // Parse all tracks
    var tracks = [];
    for(var t=0;t<nTracks;t++){
      var trkTag = readStr(4);
      var trkLen = readU32();
      var trkEnd = pos + trkLen;
      var events = [];
      var runningStatus = 0;

      while(pos < trkEnd){
        var delta = readVLQ();
        var status = data[pos];

        if(status < 0x80){
          // Running status
          status = runningStatus;
        } else {
          pos++;
          if(status < 0xF0) runningStatus = status;
        }

        var type = status & 0xF0;
        var ch = status & 0x0F;

        if(type === 0x90){ // Note On
          var note = data[pos++];
          var vel = data[pos++];
          events.push({delta:delta, type:"noteOn", ch:ch, note:note, vel:vel});
        } else if(type === 0x80){ // Note Off
          var note = data[pos++];
          var vel = data[pos++];
          events.push({delta:delta, type:"noteOff", ch:ch, note:note, vel:vel});
        } else if(type === 0xA0){ pos+=2; events.push({delta:delta, type:"skip"});
        } else if(type === 0xB0){ pos+=2; events.push({delta:delta, type:"skip"});
        } else if(type === 0xC0){ pos+=1; events.push({delta:delta, type:"skip"});
        } else if(type === 0xD0){ pos+=1; events.push({delta:delta, type:"skip"});
        } else if(type === 0xE0){ pos+=2; events.push({delta:delta, type:"skip"});
        } else if(status === 0xFF){ // Meta event
          var metaType = data[pos++];
          var metaLen = readVLQ();
          if(metaType === 0x51 && metaLen === 3){ // Tempo
            var usPerBeat = (data[pos]<<16)|(data[pos+1]<<8)|data[pos+2];
            events.push({delta:delta, type:"tempo", usPerBeat:usPerBeat});
          }
          pos += metaLen;
        } else if(status === 0xF0 || status === 0xF7){ // SysEx
          var sysLen = readVLQ();
          pos += sysLen;
          events.push({delta:delta, type:"skip"});
        } else {
          // Unknown, try to skip safely
          events.push({delta:delta, type:"skip"});
        }
      }
      pos = trkEnd; // Ensure we're at the right position
      tracks.push(events);
    }

    // Convert to absolute time in seconds
    var notes = [];
    var usPerBeat = 500000; // default 120 BPM

    for(var t=0;t<tracks.length;t++){
      var tickTime = 0;
      var secTime = 0;
      var lastTick = 0;
      var localTempo = usPerBeat;
      var activeNotes = {}; // key: ch_note -> {startSec, vel}

      for(var e=0;e<tracks[t].length;e++){
        var evt = tracks[t][e];
        tickTime += evt.delta;
        var deltaTicks = tickTime - lastTick;
        secTime += (deltaTicks / ticksPerBeat) * (localTempo / 1000000);
        lastTick = tickTime;

        if(evt.type === "tempo"){
          localTempo = evt.usPerBeat;
        } else if(evt.type === "noteOn" && evt.vel > 0){
          var key = evt.ch + "_" + evt.note;
          activeNotes[key] = {startSec: secTime, vel: evt.vel, ch: evt.ch, midi: evt.note};
        } else if(evt.type === "noteOff" || (evt.type === "noteOn" && evt.vel === 0)){
          var key = evt.ch + "_" + evt.note;
          if(activeNotes[key]){
            var n = activeNotes[key];
            notes.push({
              t: n.startSec,
              dur: Math.max(0.01, secTime - n.startSec),
              midi: n.midi,
              ch: n.ch,
              vel: n.vel / 127
            });
            delete activeNotes[key];
          }
        }
      }
    }

    notes.sort(function(a,b){ return a.t - b.t; });
    return {notes: notes, bpm: Math.round(60000000 / usPerBeat)};
  }

  /* ---- MIDI note -> frequency ---- */
  function midiToFreq(midi){
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /* ---- Playback engine ---- */

  function ensureMidiCtx(){
    if(!_midiCtx){
      _midiCtx = new (window.AudioContext || window.webkitAudioContext)();
      _midiGain = _midiCtx.createGain();
      _midiGain.gain.value = _midiVolume;
      _midiGain.connect(_midiCtx.destination);
    }
    if(_midiCtx.state === "suspended") _midiCtx.resume();
  }

  function scheduleNotes(fromSec, speed){
    cancelScheduledNotes();
    if(!_midiNotes.length) return;

    ensureMidiCtx();
    var now = _midiCtx.currentTime;
    speed = speed || 1;

    for(var i=0;i<_midiNotes.length;i++){
      var n = _midiNotes[i];
      if(n.ch === DRUM_CHANNEL) continue; // Skip drum channel for clean backing

      var noteStart = (n.t - fromSec) / speed;
      var noteDur = n.dur / speed;

      if(noteStart + noteDur < 0) continue; // Already past
      if(noteStart < 0){ noteDur += noteStart; noteStart = 0; }

      var startAt = now + noteStart;
      var endAt = startAt + noteDur;

      if (_midiOscs.length > 128) continue;
      // Scaled tone
      var osc = _midiCtx.createOscillator();
      var gain = _midiCtx.createGain();
      osc.connect(gain);
      gain.connect(_midiGain);

      osc.type = n.midi < 48 ? "triangle" : "sine"; // Bass = triangle, treble = sine
      osc.frequency.value = midiToFreq(n.midi);

      var noteScale = Math.min(1, 200 / (_midiNotes.length || 1));
      var vol = n.vel * 0.4 * noteScale;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(vol, startAt + 0.01);
      gain.gain.setValueAtTime(vol * 0.8, endAt - Math.min(0.05, noteDur * 0.3));
      gain.gain.exponentialRampToValueAtTime(0.001, endAt);

      osc.start(startAt);
      osc.stop(endAt + 0.01);

      _midiOscs.push({osc:osc, gain:gain});
    }
  }

  function cancelScheduledNotes(){
    for(var i=0;i<_midiOscs.length;i++){
      try{ _midiOscs[i].osc.stop(); }catch(e){}
      try{ _midiOscs[i].osc.disconnect(); }catch(e){}
      try{ _midiOscs[i].gain.disconnect(); }catch(e){}
    }
    _midiOscs = [];
  }

  /* ---- Public API ---- */

  function loadMidiBacking(src){
    if(_midiSrc === src && _midiLoaded) return Promise.resolve();
    _midiSrc = src;
    _midiLoaded = false;
    _midiNotes = [];

    return fetch(src)
      .then(function(r){
        if(!r.ok) throw new Error("MIDI fetch failed: " + r.status);
        return r.arrayBuffer();
      })
      .then(function(buf){
        var parsed = parseMidiBuffer(buf);
        _midiNotes = parsed.notes;
        _midiLoaded = true;
        console.log("MIDI backing loaded:", src, _midiNotes.length, "notes");
      });
  }

  function playMidiBacking(fromSec, speed){
    if(!_midiLoaded || !_midiNotes.length) return;
    _midiPlaying = true;
    _midiOffsetSec = fromSec || 0;
    _midiSpeed = speed || 1;
    scheduleNotes(_midiOffsetSec, _midiSpeed);
  }

  function stopMidiBacking(){
    _midiPlaying = false;
    cancelScheduledNotes();
  }

  function pauseMidiBacking(){
    _midiPlaying = false;
    cancelScheduledNotes();
  }

  function seekMidiBacking(sec, speed){
    cancelScheduledNotes();
    if(_midiPlaying){
      _midiOffsetSec = sec;
      scheduleNotes(sec, speed || _midiSpeed);
    }
  }

  function setMidiBackingVolume(vol){
    _midiVolume = Math.max(0, Math.min(1, vol));
    if(_midiGain) _midiGain.gain.value = _midiVolume;
  }

  function isMidiBackingLoaded(){ return _midiLoaded; }
  function isMidiBackingPlaying(){ return _midiPlaying; }

  // Expose
  window.loadMidiBacking = loadMidiBacking;
  window.playMidiBacking = playMidiBacking;
  window.stopMidiBacking = stopMidiBacking;
  window.pauseMidiBacking = pauseMidiBacking;
  window.seekMidiBacking = seekMidiBacking;
  window.setMidiBackingVolume = setMidiBackingVolume;
  window.isMidiBackingLoaded = isMidiBackingLoaded;
  window.isMidiBackingPlaying = isMidiBackingPlaying;

})();
