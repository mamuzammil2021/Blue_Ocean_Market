'use strict';
const fs=require('fs'),path=require('path');
async function applyPending(storage,db){
 const old=path.join(storage.dataDir,'.test-reset-pending.json');
 if(fs.existsSync(old))throw Error('A legacy SQLite reset marker exists. Review/remove it before starting the PostgreSQL build; it will not be applied to PostgreSQL.');
 const file=path.join(storage.dataDir,'.postgres-reset-seed.json');
 if(!fs.existsSync(file))return null;
 const marker=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!/^[a-f0-9-]{36}$/.test(marker.operationId))throw Error('Invalid PostgreSQL reset seed marker');
 const committed=await db.maybeOne("SELECT id FROM bom._pg_maintenance WHERE id=$1 AND action='full'",[marker.operationId]);
 if(committed){process.env.SEED_DEMO_USERS=marker.demo?'true':'false';process.env.SEED_DEMO_DATA=marker.demo?'true':'false'}
 return {file,committed:!!committed};
}
module.exports={applyPending};
