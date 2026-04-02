(function(){

  function midiSettingsPage(){
    var h = '<div class="card">';
    h += '<div><b>MIDI Settings</b></div>';
    h += '<div>Active Device: ' + ((getActiveMidiDevice() && getActiveMidiDevice().name) || "None") + '</div>';
    h += '<div>Active Profile: ' + ((getActiveMidiProfile() && getActiveMidiProfile().name) || "None") + '</div>';
    h += '<button onclick="refreshMidiDevices()">Refresh Devices</button> ';
    h += '<button onclick="act(\'createDefaultPianoProfile\')">New Piano Profile</button> ';
    h += '<button onclick="act(\'createDefaultGuitarProfile\')">New Guitar Profile</button>';
    h += '</div>';

    h += '<div class="card">';
    h += '<div><b>Available Devices</b></div>';
    var devs = S.midiDevices || [];
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
    var profiles = S.midiProfiles || {};
    var profileIds = Object.keys(profiles);
    for(var j=0;j<profileIds.length;j++){
      var p = profiles[profileIds[j]];
      var active = (profileIds[j] === S.activeMidiProfileId) ? ' (active)' : '';
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
