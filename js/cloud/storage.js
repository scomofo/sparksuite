(function(){

  var CLOUD_CATEGORIES=["profile","progression","practice","planning","editor","devices","settings"];

  function _categoryTimestamps(){
    if(!S.cloudSync) return {};
    return S.cloudSync.categoryTimestamps||{};
  }

  function buildCloudSnapshot(){
    var ts=_categoryTimestamps();
    return {
      version:1,
      profile:{playerXP:S.playerXP||0,playerLevel:S.playerLevel||1,playerAchievements:S.playerAchievements||{},playerStats:S.playerStats||{},lastModifiedAt:ts.profile||0},
      progression:{mastery:S.mastery||{},unlocks:S.unlocks||{},metaProgress:S.metaProgress||{},lastModifiedAt:ts.progression||0},
      practice:{practiceHistory:S.practiceHistory||[],practiceStreak:S.practiceStreak||0,lastPracticeDate:S.lastPracticeDate||null,totalPracticeMinutes:S.totalPracticeMinutes||0,lastModifiedAt:ts.practice||0},
      planning:{weeklyPracticePlan:S.weeklyPracticePlan||null,dailyChallenges:S.dailyChallenges||[],weeklyGoals:S.weeklyGoals||[],lastModifiedAt:ts.planning||0},
      editor:{editorLibrary:S.performEditorLibrary||[],contentLibrary:S.contentLibrary||{},lastModifiedAt:ts.editor||0},
      devices:{midiProfiles:S.midiProfiles||{},activeMidiProfileId:S.activeMidiProfileId||null,inputLatencyMs:S.inputLatencyMs||0,audioLatencyMs:S.audioLatencyMs||0,lastModifiedAt:ts.devices||0},
      settings:{midiRoutingMode:S.midiRoutingMode||"default",lastModifiedAt:ts.settings||0}
    };
  }

  function applyCloudSnapshot(snapshot){
    if(!snapshot||typeof snapshot!=="object")return false;
    if(snapshot.version!==1){console.warn("Cloud snapshot: unknown version",snapshot.version);return false;}
    if(!S.cloudSync)S.cloudSync={};
    if(!S.cloudSync.categoryTimestamps)S.cloudSync.categoryTimestamps={};
    for(var i=0;i<CLOUD_CATEGORIES.length;i++){var cat=CLOUD_CATEGORIES[i];if(snapshot[cat]&&snapshot[cat].lastModifiedAt)S.cloudSync.categoryTimestamps[cat]=snapshot[cat].lastModifiedAt;}
    if(snapshot.profile){S.playerXP=snapshot.profile.playerXP||0;S.playerLevel=snapshot.profile.playerLevel||1;S.playerAchievements=snapshot.profile.playerAchievements||{};S.playerStats=snapshot.profile.playerStats||{};}
    if(snapshot.progression){S.mastery=snapshot.progression.mastery||{};S.unlocks=snapshot.progression.unlocks||{};S.metaProgress=snapshot.progression.metaProgress||{};}
    if(snapshot.practice){S.practiceHistory=snapshot.practice.practiceHistory||[];S.practiceStreak=snapshot.practice.practiceStreak||0;S.lastPracticeDate=snapshot.practice.lastPracticeDate||null;S.totalPracticeMinutes=snapshot.practice.totalPracticeMinutes||0;}
    if(snapshot.planning){S.weeklyPracticePlan=snapshot.planning.weeklyPracticePlan||null;S.dailyChallenges=snapshot.planning.dailyChallenges||[];S.weeklyGoals=snapshot.planning.weeklyGoals||[];}
    if(snapshot.editor){S.performEditorLibrary=snapshot.editor.editorLibrary||[];S.contentLibrary=snapshot.editor.contentLibrary||{};}
    if(snapshot.devices){S.midiProfiles=snapshot.devices.midiProfiles||{};S.activeMidiProfileId=snapshot.devices.activeMidiProfileId||null;S.inputLatencyMs=snapshot.devices.inputLatencyMs||0;S.audioLatencyMs=snapshot.devices.audioLatencyMs||0;}
    if(snapshot.settings){S.midiRoutingMode=snapshot.settings.midiRoutingMode||"default";}
    saveState();return true;
  }

  function markCloudDirty(key){
    if(!S.cloudSync||!S.cloudSync.dirtyKeys)return;
    if(S.cloudSync.dirtyKeys.indexOf(key)<0)S.cloudSync.dirtyKeys.push(key);
    if(!S.cloudSync.categoryTimestamps)S.cloudSync.categoryTimestamps={};
    var m={playerXP:"profile",playerLevel:"profile",mastery:"progression",unlocks:"progression",practiceHistory:"practice",practiceStreak:"practice",weeklyPracticePlan:"planning",performEditorLibrary:"editor",contentLibrary:"editor",midiProfiles:"devices",midiRoutingMode:"settings"};
    if(m[key])S.cloudSync.categoryTimestamps[m[key]]=Date.now();
    saveState();
  }

  window.buildCloudSnapshot=buildCloudSnapshot;
  window.applyCloudSnapshot=applyCloudSnapshot;
  window.markCloudDirty=markCloudDirty;

})();