'use strict';
const {createDatabase}=require('../../server/postgres/connection');
const {migrate}=require('../../server/postgres/migrate');
async function main(){const db=createDatabase();try{console.log(JSON.stringify(await migrate(db)))}finally{await db.close()}}
main().catch(error=>{console.error('[postgres:migrate]',error.code||error.message);process.exitCode=1});
