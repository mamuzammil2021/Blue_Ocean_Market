'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
function assertFrontendIntegrity(root=path.resolve(__dirname,'..')){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'server/frontend-manifest.json'),'utf8'));
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
 if(manifest.version!==version)throw new Error('Frontend release manifest version does not match package.json');
 const files=Object.entries(manifest.files||{});if(!files.length)throw new Error('Frontend release manifest is empty');
 for(const [name,expected] of files){
  if(!/^public\/[a-zA-Z0-9_.-]+\.(?:js|html)$/.test(name))throw new Error('Invalid frontend manifest path');
  const filename=path.join(root,name);
  if(!fs.existsSync(filename)||crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex')!==expected)throw new Error('Frontend release integrity failed: '+name+'. Copy the complete matching release before starting.');
 }
 return {version,files:files.length};
}
module.exports={assertFrontendIntegrity};
