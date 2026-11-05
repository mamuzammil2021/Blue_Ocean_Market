'use strict';
const fs=require('node:fs'),path=require('node:path');
function valid(file){
 const ext=path.extname(file.originalname||'').toLowerCase(),mime=String(file.mimetype||'').toLowerCase(),b=Buffer.alloc(32);let fd;
 try{fd=fs.openSync(file.path,'r');const n=fs.readSync(fd,b,0,b.length,0);if(n<12)return false;
 if(['.jpg','.jpeg'].includes(ext))return mime==='image/jpeg'&&b[0]===255&&b[1]===216&&b[2]===255;
 if(ext==='.png')return mime==='image/png'&&n>=24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&b.toString('ascii',12,16)==='IHDR'&&b.readUInt32BE(16)>0&&b.readUInt32BE(20)>0;
 if(ext==='.webp')return mime==='image/webp'&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
 if(ext==='.gif')return mime==='image/gif'&&['GIF87a','GIF89a'].includes(b.toString('ascii',0,6));return false;
 }finally{if(fd!==undefined)fs.closeSync(fd)}
}
module.exports={valid};
