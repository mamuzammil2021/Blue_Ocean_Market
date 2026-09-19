'use strict';
const {execFile}=require('child_process');

function renderChromePdf(chrome,args,{timeout=30000}={}){
  return new Promise((resolve,reject)=>{
    execFile(chrome,args,{stdio:'ignore',timeout},(error)=>{
      if(error){
        const e=new Error(error.killed?'PDF generation timed out.':'PDF generation failed. Chrome/Chromium could not render the report.');
        e.cause=error;return reject(e);
      }
      resolve();
    });
  });
}
module.exports={renderChromePdf};
