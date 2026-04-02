const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function getCrashLogPath(){
  return path.join(app.getPath('userData'), 'spark-crash.log');
}

function logCrash(message){
  try{
    fs.appendFileSync(getCrashLogPath(), `[${new Date().toISOString()}] ${message}\n`, 'utf8');
  }catch(e){}
}

module.exports = { logCrash, getCrashLogPath };
