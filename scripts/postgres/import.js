'use strict';
const fs=require('node:fs');
const {createDatabase}=require('../../server/postgres/connection');
const {withSnapshot,importSnapshot,inspect}=require('../../server/postgres/import-sqlite');
async function main(){
  const [mode,file,reportFile]=process.argv.slice(2);
  if(!['inspect','import'].includes(mode)||!file||!reportFile)throw new Error('Usage: node scripts/postgres/import.js inspect|import source.sqlite report.json');
  // Never truncate an existing report or place operational data in source control.
  const fd=fs.openSync(reportFile,'wx',0o600);
  try{
    const report=await withSnapshot(file,async source=>{
      if(mode==='inspect')return {mode,tables:inspect(source)};
      if(process.env.PG_IMPORT_EMPTY_DATABASE!=='true')throw new Error('Set PG_IMPORT_EMPTY_DATABASE=true only for the dedicated empty migration destination');
      const db=createDatabase();try{return await importSnapshot(source,db)}finally{await db.close()}
    });
    fs.writeFileSync(fd,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({mode,tables:report.tableCount||report.tables.length,matched:report.matched,report:reportFile}));
  }catch(error){fs.closeSync(fd);fs.unlinkSync(reportFile);throw error}
  fs.closeSync(fd);
}
main().catch(error=>{console.error('[postgres:import]',error.code||error.message);process.exitCode=1});
