(function(){
  function parse(output){
    if(!output) return [];

    const issues = [];

    const lines = output.split('\n');

    lines.forEach(line=>{
      if(line.includes('no exercises')){
        const match = line.match(/Skill ([a-zA-Z0-9_-]+)/);
        issues.push({
          type:'missing_exercise',
          severity:'error',
          label:line.trim(),
          skillId: match ? match[1] : null,
          keyword: match ? match[1] : line
        });
      }

      if(line.includes('missing skill')){
        issues.push({
          type:'missing_skill',
          severity:'error',
          label:line.trim(),
          keyword:line
        });
      }

      if(line.includes('duplicate')){
        issues.push({
          type:'duplicate_lesson',
          severity:'warning',
          label:line.trim(),
          keyword:line
        });
      }
    });

    return issues;
  }

  window.SparkParseValidationIssues = function(output){
    return parse(output);
  };
})();
