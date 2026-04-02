(function(){

  function validateContentEntry(type, item){
    var errors = [];
    if(!item.id) errors.push(type + " missing id");
    if(!item.title) errors.push(type + " missing title");
    if(type==="lessons" && !Array.isArray(item.exercises)){
      errors.push("lesson missing exercises");
    }
    if(type==="songs" && !Array.isArray(item.arrangements)){
      errors.push("song missing arrangements");
    }
    return errors;
  }

  function validateAllRegisteredContent(){
    var out = [];
    for(var type in SparkContent){
      var bucket = SparkContent[type];
      for(var id in bucket){
        var errs = validateContentEntry(type, bucket[id]);
        for(var i=0;i<errs.length;i++){
          out.push(errs[i]);
        }
      }
    }
    return out;
  }

  window.validateAllRegisteredContent = validateAllRegisteredContent;

})();
