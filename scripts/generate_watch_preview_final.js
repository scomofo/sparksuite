#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);

function run(){
  try {
    execSync(`node scripts/generate_instrument_pipeline_final.js ${args.join(' ')} --apply`, { stdio:'inherit'});
    fs.writeFileSync('.preview_reload', Date.now().toString());
    localStorage && localStorage.setItem && localStorage.setItem('preview_reload', Date.now());
  } catch(e){
    console.log('Failed run');
  }
}

run();

fs.watch('.', {recursive:true}, (e,f)=>{
  if(!f) return;
  if(f.includes('instrument')||f.includes('generated')){
    console.log('🔁 change detected:',f);
    run();
  }
});
