(function(){

  function adaptiveRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function adaptiveRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = adaptiveRoot();
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

  function adaptiveWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = adaptiveRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor || !parts.length) return value;
    for(i=0;i<parts.length-1;i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length-1]] = value;
    return value;
  }

  function buildAdaptiveDecision(context){
    context = context || {};
    var type = context.targetType || "generic";
    if(type==="transition") return adaptTransition(context);
    if(type==="performance_phrase") return adaptPerformancePhrase(context);
    if(type==="performance_song") return adaptPerformanceSong(context);
    if(type==="rhythm") return adaptRhythm(context);
    if(type==="finger") return adaptFinger(context);
    if(type==="left_hand_pattern") return adaptLeftHand(context);
    return {
      targetType:type,
      difficultyAction:"keep",
      currentValue:context.currentValue || 0,
      nextValue:context.currentValue || 0,
      reason:"No adaptive rule matched"
    };
  }

  function adaptTransition(context){
    var bpm = context.currentValue || 60;
    var acc = context.accuracy || 0;
    var streak = context.successStreak || 0;
    if(acc >= 90 && streak >= 3){
      return makeDecision("transition","raise_bpm",bpm,bpm+8,"Transition is stable");
    }
    if(acc < 65){
      return makeDecision("transition","lower_bpm",bpm,Math.max(40,bpm-8),"Transition needs cleanup");
    }
    return makeDecision("transition","keep",bpm,bpm,"Transition is in working range");
  }

  function adaptPerformancePhrase(context){
    var speed = context.currentValue || 1.0;
    var acc = context.accuracy || 0;
    if(acc >= 92){
      return makeDecision("performance_phrase","escalate",speed,Math.min(1.0, speed + 0.1),"Phrase is nearly mastered");
    }
    if(acc < 70){
      return makeDecision("performance_phrase","simplify",speed,Math.max(0.5, speed - 0.1),"Phrase is still too difficult");
    }
    return makeDecision("performance_phrase","keep",speed,speed,"Phrase difficulty is appropriate");
  }

  function adaptPerformanceSong(context){
    var speed = context.currentValue || 1.0;
    var acc = context.accuracy || 0;
    var stars = context.stars || 0;
    if(acc >= 90 && stars >= 4){
      return makeDecision("performance_song","escalate",speed,Math.min(1.0, speed + 0.1),"Ready for a stronger run");
    }
    if(acc < 65){
      return makeDecision("performance_song","retry",speed,Math.max(0.6, speed - 0.1),"Song should be slowed down");
    }
    return makeDecision("performance_song","keep",speed,speed,"Song difficulty is in range");
  }

  function adaptRhythm(context){
    var bpm = context.currentValue || 90;
    var acc = context.accuracy || 0;
    if(acc >= 88){
      return makeDecision("rhythm","raise_bpm",bpm,bpm+5,"Timing is holding up well");
    }
    if(acc < 70){
      return makeDecision("rhythm","lower_bpm",bpm,Math.max(60,bpm-5),"Timing needs stabilization");
    }
    return makeDecision("rhythm","keep",bpm,bpm,"Rhythm challenge is appropriate");
  }

  function adaptFinger(context){
    var bpm = context.currentValue || 60;
    var success = context.successRate || 0;
    if(success >= 90){
      return makeDecision("finger","raise_bpm",bpm,bpm+4,"Finger control is improving");
    }
    if(success < 65){
      return makeDecision("finger","lower_bpm",bpm,Math.max(40,bpm-4),"Finger drill needs slower practice");
    }
    return makeDecision("finger","keep",bpm,bpm,"Finger drill is in range");
  }

  function adaptLeftHand(context){
    var bpm = context.currentValue || 70;
    var acc = context.accuracy || 0;
    if(acc >= 90){
      return makeDecision("left_hand_pattern","raise_bpm",bpm,bpm+4,"Left hand is steady");
    }
    if(acc < 68){
      return makeDecision("left_hand_pattern","simplify",bpm,Math.max(50,bpm-4),"Left hand needs simpler pacing");
    }
    return makeDecision("left_hand_pattern","keep",bpm,bpm,"Left-hand work is in range");
  }

  function makeDecision(targetType, action, currentValue, nextValue, reason){
    return {
      targetType:targetType,
      difficultyAction:action,
      currentValue:currentValue,
      nextValue:nextValue,
      reason:reason
    };
  }

  function recordAdaptiveDecision(decision){
    var adaptiveDecisions = adaptiveRead("adaptiveDecisions", []);
    if(!Array.isArray(adaptiveDecisions)) adaptiveDecisions = [];
    adaptiveDecisions.push({
      targetType: decision.targetType,
      difficultyAction: decision.difficultyAction,
      currentValue: decision.currentValue,
      nextValue: decision.nextValue,
      reason: decision.reason,
      ts: Date.now()
    });
    if(adaptiveDecisions.length > 100) adaptiveDecisions.shift();
    adaptiveWrite("adaptiveDecisions", adaptiveDecisions);
    adaptiveWrite("adaptiveLastDecision", decision);
    saveState();
  }

  window.buildAdaptiveDecision = buildAdaptiveDecision;
  window.recordAdaptiveDecision = recordAdaptiveDecision;

})();
