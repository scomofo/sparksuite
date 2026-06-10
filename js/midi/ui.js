(function(){

  function getMidiUiRuntimeState(){
    var core = (typeof window !== "undefined" && window && window.sparkCore)
      ? window.sparkCore
      : (typeof sparkCore !== "undefined" ? sparkCore : null);
    if(!core || typeof core.getRuntimeState !== "function") return null;
    return core.getRuntimeState();
  }

  function midiSettingsPage(){
    var runtimeState = getMidiUiRuntimeState();
    var activeDeviceName = runtimeState && runtimeState.midiActiveDeviceName
      ? runtimeState.midiActiveDeviceName
      : ((getActiveMidiDevice() && getActiveMidiDevice().name) || "None");
    var activeProfileName = runtimeState && runtimeState.midiActiveProfileName
      ? runtimeState.midiActiveProfileName
      : ((getActiveMidiProfile() && getActiveMidiProfile().name) || "None");
    var devs = runtimeState && Array.isArray(runtimeState.midiDeviceOptions) && runtimeState.midiDeviceOptions.length
      ? runtimeState.midiDeviceOptions
      : (S.midiDevices || []);
    var profiles = runtimeState && Array.isArray(runtimeState.midiProfileOptions) && runtimeState.midiProfileOptions.length
      ? runtimeState.midiProfileOptions
      : (S.midiProfiles || {});
    var activeProfileId = runtimeState && runtimeState.midiActiveProfileId
      ? runtimeState.midiActiveProfileId
      : S.activeMidiProfileId;
    var usingProfileArray = Array.isArray(profiles);
    var h = '<div class="card">';
    h += '<div class="card-section-heading">MIDI Settings</div>';
    h += '<div>Active Device: ' + escHTML(activeDeviceName) + '</div>';
    h += '<div>Active Profile: ' + escHTML(activeProfileName) + '</div>';
    h += '<button onclick="act(\'refreshMidiDevices\')">Refresh Devices</button> ';
    h += '<button onclick="act(\'createDefaultPianoProfile\')">New Piano Profile</button> ';
    h += '<button onclick="act(\'createDefaultGuitarProfile\')">New Guitar Profile</button>';
    h += '</div>';

    h += '<div class="card">';
    h += '<div class="card-section-heading">Available Devices</div>';
    for(var i=0;i<devs.length;i++){
      h += '<div>';
      h += escHTML(devs[i].name) + ' ';
      h += '<button onclick="act(\'setMidiDevice\', \''+devs[i].id+'\')">Use</button>';
      h += '</div>';
    }
    if(!devs.length) h += '<div>No MIDI devices detected</div>';
    h += '</div>';

    h += '<div class="card">';
    h += '<div class="card-section-heading">Saved Profiles</div>';
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
