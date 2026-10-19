'use strict';
// Run explicitly after intentional frontend changes, never implicitly during startup.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'..'),files={};
for(const name of fs.readdirSync(path.join(root,'public')).sort())if(/\.(?:js|html|css)$/.test(name))files['public/'+name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',name))).digest('hex');
fs.writeFileSync(path.join(root,'server/frontend-manifest.json'),JSON.stringify({version:require('../package.json').version,files},null,2)+'\n');
console.log('Frontend release manifest built: '+Object.keys(files).length+' files');
