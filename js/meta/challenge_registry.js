(function(){

  window.SparkChallenges = {
    definitions: {},
    seasonalEvents: {},
    packRewards: {}
  };

  function registerChallengeDefinitions(items){
    for(var i=0;i<items.length;i++){
      SparkChallenges.definitions[items[i].id] = items[i];
    }
  }

  function registerSeasonalEvents(items){
    for(var i=0;i<items.length;i++){
      SparkChallenges.seasonalEvents[items[i].id] = items[i];
    }
  }

  function registerPackRewards(items){
    for(var i=0;i<items.length;i++){
      SparkChallenges.packRewards[items[i].id] = items[i];
    }
  }

  function getChallengeDefinition(id){
    return SparkChallenges.definitions[id] || null;
  }

  function getSeasonalEvent(id){
    return SparkChallenges.seasonalEvents[id] || null;
  }

  function getPackReward(id){
    return SparkChallenges.packRewards[id] || null;
  }

  window.registerChallengeDefinitions = registerChallengeDefinitions;
  window.registerSeasonalEvents = registerSeasonalEvents;
  window.registerPackRewards = registerPackRewards;
  window.getChallengeDefinition = getChallengeDefinition;
  window.getSeasonalEvent = getSeasonalEvent;
  window.getPackReward = getPackReward;

})();
