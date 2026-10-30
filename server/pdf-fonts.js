'use strict';
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'fonts/noto-sans-kr'),css=fs.readFileSync(path.join(root,'index.css'),'utf8'),encoded=new Map();
const faces=[...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(([,body])=>{
 const file=body.match(/url\(\.\/files\/([^\)]+)\)/)?.[1],ranges=body.match(/unicode-range:\s*([^;]+);/)?.[1].split(',').map(x=>{const [a,b]=x.trim().replace(/^U\+/i,'').split('-');return [parseInt(a,16),parseInt(b||a,16)]});
 if(!file||path.basename(file)!==file||!ranges)throw Error('Invalid bundled PDF font metadata');
 return {file,ranges,body};
});
function style(markup){
 const text=String(markup).replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,''),points=[...new Set([...text].map(x=>x.codePointAt(0)))];
 const selected=faces.filter(f=>points.some(p=>f.ranges.some(([lo,hi])=>p>=lo&&p<=hi)));
 const rules=selected.map(f=>{if(!encoded.has(f.file))encoded.set(f.file,fs.readFileSync(path.join(root,f.file)).toString('base64'));return '@font-face{'+f.body.replace("'Noto Sans KR Variable'","'Noto Sans KR'").replace(/url\([^\)]+\)/,'url(data:font/woff2;base64,'+encoded.get(f.file)+')')+'}'}).join('\n');
 return rules+'\nbody{font-family:"Noto Sans KR",Arial,sans-serif!important}';
}
module.exports={style};
