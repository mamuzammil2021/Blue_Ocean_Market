const fs=require('fs');
const path=require('path');
const express=require('express');
const nativeStatic=express.static;
const publicDir=path.join(__dirname,'..','public');

// Keep the verified V28.3 browser client untouched and append the V28.4 layer at delivery time.
express.static=function(root,options){
  const middleware=nativeStatic(root,options);
  return function(req,res,next){
    if(path.resolve(root)===path.resolve(publicDir)&&req.path==='/client.js'){
      try{
        const base=fs.readFileSync(path.join(publicDir,'client.js'),'utf8');
        const extension=fs.readFileSync(path.join(publicDir,'v284-client.js'),'utf8');
        res.set('Content-Type','application/javascript; charset=utf-8');
        res.set('Cache-Control','no-store, no-cache, must-revalidate');
        res.set('X-Blue-Ocean-Version','28.4.0');
        return res.send(base+'\n\n'+extension+'\n');
      }catch(e){return next(e)}
    }
    middleware(req,res,next);
  };
};

require('./server-v284-bootstrap');
