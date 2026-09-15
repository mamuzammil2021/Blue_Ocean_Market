// Applies a previously authorized reset/restore before SQLite is opened.
'use strict';
const fs=require('fs');
const path=require('path');

function clearDir(dir){fs.mkdirSync(dir,{recursive:true});for(const name of fs.readdirSync(dir)){if(name==='.gitkeep')continue;fs.rmSync(path.join(dir,name),{recursive:true,force:true})}}
function safeInside(child,parent){const rel=path.relative(path.resolve(parent),path.resolve(child));return rel===''||(!rel.startsWith('..')&&!path.isAbsolute(rel))}
function applyPending(storage){
  const marker=path.join(storage.dataDir,'.test-reset-pending.json');
  if(!fs.existsSync(marker))return null;
  const p=JSON.parse(fs.readFileSync(marker,'utf8'));
  const env=String(process.env.APP_ENV||'').toLowerCase();if(!['development','testing'].includes(env)||String(process.env.ALLOW_TEST_DATA_RESET||'').toLowerCase()!=='true')throw new Error('A development/test reset marker exists, but reset is no longer enabled. Restore APP_ENV=development (or testing) and ALLOW_TEST_DATA_RESET=true, or remove the marker manually after review.');
  const dbPath=path.join(storage.dataDir,'blue-ocean.sqlite'),completion=path.join(storage.dataDir,'.test-reset-completed.json');
  const removeDb=()=>{for(const f of [dbPath,dbPath+'-wal',dbPath+'-shm'])fs.rmSync(f,{force:true})};
  if(p.action==='full'||p.action==='full_demo'){
    removeDb();clearDir(storage.uploadDir);
    if(p.action==='full_demo'){process.env.SEED_DEMO_USERS='true';process.env.SEED_DEMO_DATA='true'}
  }else if(p.action==='restore'){
    const root=path.join(storage.dataDir,'backups','pre-reset'),source=path.resolve(String(p.backup_path||'')),sourceDb=path.join(source,'blue-ocean.sqlite'),sourceUploads=path.join(source,'uploads');
    if(!safeInside(source,root)||!fs.existsSync(sourceDb))throw new Error('The requested pre-reset backup is missing or outside the authorized backup directory.');
    removeDb();fs.copyFileSync(sourceDb,dbPath);clearDir(storage.uploadDir);if(fs.existsSync(sourceUploads))fs.cpSync(sourceUploads,storage.uploadDir,{recursive:true,force:true});
  }else throw new Error(`Unknown test reset marker action: ${p.action}`);
  const completed={...p,completed_at:new Date().toISOString(),status:'Completed'};fs.writeFileSync(completion,JSON.stringify(completed,null,2));fs.rmSync(marker,{force:true});
  console.log(`[test-reset] applied ${p.action}${p.backup_name?' using '+p.backup_name:''}`);
  return completed;
}
module.exports={applyPending};
