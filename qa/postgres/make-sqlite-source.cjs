'use strict';
// One-time importer test source, not a runtime database or second backend.
const Database=require('better-sqlite3');
const catalog=require('../../server/postgres/catalog-v306950.json');
function create(file){
 const db=new Database(file);db.pragma('foreign_keys=OFF');
 try{
  for(const t of catalog.tables)db.exec(t.sql);
  for(const t of catalog.tables)for(const i of t.indexes)if(i.sql)db.exec(i.sql);
  for(const v of catalog.views)db.exec(v.sql);
  for(const t of catalog.triggers)db.exec(t.sql);
  db.transaction(()=>{
   db.prepare("INSERT INTO business_units(id,name) VALUES(1,'Pink Salt')").run();
   db.prepare("INSERT INTO users(id,name,email,password_hash,role,business_unit_id) VALUES(1,?,'qa@blueocean.local','unusable-synthetic-hash','CEO / Owner',1)").run("한글 · O'Hara");
   const audit=db.prepare('INSERT INTO audit_log(user_id,entity,entity_id,action,details) VALUES(1,?,?,?,?)');
   for(let i=0;i<1100;i++)audit.run('Synthetic',i+1,'Import test',JSON.stringify({n:i,unicode:'한글',amount:'0.10'}));
   db.prepare("INSERT INTO audit_log(id,entity,action) VALUES(2000,'Synthetic','Deleted high-water identity')").run();db.prepare('DELETE FROM audit_log WHERE id=2000').run();
   const finance=db.prepare("INSERT INTO finance_entries(business_unit_id,type,category,amount,description,created_by) VALUES(1,'Expense','Synthetic',?,?,1)");
   for(let i=0;i<40;i++)finance.run(i%2?100.05:0.1,'Synthetic numeric '+i);
  })();
  db.pragma('foreign_keys=ON');if(db.pragma('foreign_key_check').length)throw Error('Synthetic import source has invalid foreign keys');
 }finally{db.close()}
}
if(require.main===module)create(process.argv[2]);
module.exports={create};
