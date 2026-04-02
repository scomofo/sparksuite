const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function getLogPath(){
  return path.join(app.getPath('userData'), 'spark.log');
}

function writeLog(line){
  try{
    fs.appendFileSync(getLogPath(), `[${new Date().toISOString()}] ${line}\n`, 'utf8');
  }catch(e){}
}

module.exports = { writeLog, getLogPath };
