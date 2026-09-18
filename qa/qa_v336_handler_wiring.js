'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),pub=path.join(root,'public');
const files=fs.readdirSync(pub).filter(f=>f.endsWith('.js'));
const sources=files.map(f=>[f,fs.readFileSync(path.join(pub,f),'utf8')]);
const all=sources.map(x=>x[1]).join('\n');
const attrs=[];
const attrRe=/\bon(?:click|change|input|submit|keydown|keyup|blur|focus)\\?=[\\]?(["'`])([\s\S]{0,1200}?)\1/gi;
for(const [file,src] of sources){let m;while((m=attrRe.exec(src)))attrs.push([file,m[2]])}
const skip=new Set(['if','for','while','switch','catch','function','return','typeof','void','new','Math','Number','String','Object','Array','Date','Promise','JSON','parseInt','parseFloat','isNaN','setTimeout','clearTimeout','requestAnimationFrame','encodeURIComponent','decodeURIComponent','event','confirm','alert']);
const refs=[];
for(const [file,code] of attrs){const r=/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g;let m;while((m=r.exec(code)))if(!skip.has(m[1]))refs.push([file,m[1],code.slice(0,160)])}
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function defined(name){const n=esc(name);return [new RegExp(`function\\s+${n}\\s*\\(`),new RegExp(`(?:const|let|var)\\s+${n}\\s*=`),new RegExp(`window\\.${n}\\s*=`),new RegExp(`\\b${n}\\s*=\\s*(?:async\\s*)?function`),new RegExp(`\\b${n}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>`),new RegExp(`\\b${n}\\s*=\\s*(?:async\\s*)?[A-Za-z_$][\\w$]*\\s*=>`)].some(x=>x.test(all))}
const missing=refs.filter(x=>!defined(x[1]));
const unique=new Set(refs.map(x=>x[1]));
console.log(`Inline event attributes scanned: ${attrs.length}`);
console.log(`Inline call references scanned: ${refs.length}`);
console.log(`Unique named handler/call targets: ${unique.size}`);
if(missing.length){for(const [file,name,code] of missing.slice(0,50))console.error('MISSING',file,name,code);console.error(`FAIL ${missing.length} unresolved inline call references`);process.exit(1)}
console.log('PASS 0 unresolved inline named handler/call targets');
