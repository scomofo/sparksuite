#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);

function run(){
  const result = spawnSync('node',['scripts/generate_instrument_pipeline_final.js',...args,'--apply'],{encoding:'utf-8'});

  const ok = result.status === 0;

  fs.writeFileSync('.preview_validation.json', JSON.stringify({
    ok,
    updatedAt: Date.now(),
    output: result.stdout + '\n' + result.stderr
  },null,2));

  if(ok){
    fs.writeFileSync('.preview_reload', Date.now().toString());
  }
}

run();

fs.watch('.',{recursive:true},(_,f)=>{
  if(!f) return;
  if(f.includes('instrument')||f.includes('generated')){
    console.log('🔁 change:',f);
    run();
  }
});
