(function(){

  function midiUiRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function midiUiRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = midiUiRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor) return fallback;
    for(i=0;i<parts.length;i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function midiSettingsPage(){
    var runtimeState = window.sparkCore && typeof window.sparkCore.getRuntimeState === "function"
      ? window.sparkCore.getRuntimeState()
      : null;
    var activeDeviceName = runtimeState && runtimeState.midiActiveDeviceName
      ? runtimeState.midiActiveDeviceName
      : ((getActiveMidiDevice() && getActiveMidiDevice().name) || "None");
    var activeProfileName = runtimeState && runtimeState.midiActiveProfileName
      ? runtimeState.midiActiveProfileName
      : ((getActiveMidiProfile() && getActiveMidiProfile().name) || "None");
    var devs = runtimeState && Array.isArray(runtimeState.midiDeviceOptions) && runtimeState.midiDeviceOptions.length
      ? runtimeState.midiDeviceOptions
      : (midiUiRead("midiDevices", []) || []);
    var profiles = runtimeState && Array.isArray(runtimeState.midiProfileOptions) && runtimeState.midiProfileOptions.length
      ? runtimeState.midiProfileOptions
      : (midiUiRead("midiProfiles", {}) || {});
    var activeProfileId = runtimeState && runtimeState.midiActiveProfileId
      ? runtimeState.midiActiveProfileId
      : midiUiRead("activeMidiProfileId", null);
    var usingProfileArray = Array.isArray(profiles);
    var h = '<div class="card">';
    h += '<div><b>MIDI Settings</b></div>';
    h += '<div>Active Device: ' + escHTML(activeDeviceName) + '</div>';
    h += '<div>Active Profile: ' + escHTML(activeProfileName) + '</div>';
    h += '<button onclick="refreshMidiDevices()">Refresh Devices</button> ';
    h += '<button onclick="act(\'createDefaultPianoProfile\')">New Piano Profile</button> ';
    h += '<button onclick="act(\'createDefaultGuitarProfile\')">New Guitar Profile</button>';
    h += '</div>';

    h += '<div class="card">';
    h += '<div><b>Available Devices</b></div>';
    for(var i=0;i<devs.length;i++){
      h += '<div>';
      h += escHTML(devs[i].name) + ' ';
      h += '<button onclick="act(\'setMidiDevice\', \''+devs[i].id+'\')">Use</button>';
      h += '</div>';
    }
    if(!devs.length) h += '<div>No MIDI devices detected</div>';
    h += '</div>';

    h += '<div class="card">';
    h += '<div><b>Saved Profiles</b></div>';
    var profileIds = usingProfileArray ? [] : Object.keys(profiles);
    if (usingProfileArray) {
      for (var pIdx = 0; pIdx < profiles.length; pIdx++) profileIds.push(profiles[pIdx].id);
    }
    for(var j=0;j<profileIds.length;j++){
      var p = usingProfileArray ? profiles[j] : profiles[profileIds[j]];
      var active = (profileIds[j] === activeProfileId) ? ' (active)' : '';
      h += '<div>';
      h += escHTML(p.name) + ' [' + p.type + ']' + active + ' ';
      h += '<button onclick="act(\'setMidiProfile\', \''+profileIds[j]+'\')">Use</button>';
      h += '</div>';
    }
    if(!profileIds.length) h += '<div>No profiles created</div>';
    h += '</div>';

    return h;
  }

  window.midiSettingsPage = midiSettingsPage;

})();
