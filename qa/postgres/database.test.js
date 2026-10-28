'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const Database=require('better-sqlite3');
const {createDatabase}=require('../../server/postgres/connection');
const {migrate,assertMigrationsCurrent}=require('../../server/postgres/migrate');
const {importSnapshot,withSnapshot,compare,decimal}=require('../../server/postgres/import-sqlite');
const catalog=require('../../server/postgres/catalog-v306950.json');
const {generate,checks}=require('../../scripts/postgres/build-schema');
const root=path.resolve(__dirname,'../..');

async function engine(){
  if(process.env.TEST_DATABASE_URL){
    // Must be a dedicated, disposable database. No production URL fallback.
    const db=createDatabase({env:{DATABASE_URL:process.env.TEST_DATABASE_URL,PG_POOL_MAX:'5'}});
    const occupied=await db.all("SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname='bom'");
    if(occupied.length){await db.close();throw new Error('TEST_DATABASE_URL must point at a new empty disposable database')}
    return {db,label:'native-postgresql',close:()=>db.close()};
  }
  const {PGlite}=require('@electric-sql/pglite');
  const p=new PGlite();await p.waitReady;
  await p.exec('SET search_path TO bom,pg_catalog');
  // PGlite runs the PostgreSQL SQL engine in WASM. It is useful for schema/import
  // testing, but cannot validate real multi-session locking or Render behavior.
  const run=async(sql,values=[])=>values.length?p.query(sql,values):((await p.exec(sql)).at(-1)||{rows:[]});
  const db=createDatabase({pool:{query:run,connect:async()=>({query:run,release(){}})}});
  return {db,label:'pglite-postgresql-sql-engine',close:()=>p.close()};
}

function syntheticSnapshot(file){
  const result=cp.spawnSync(process.execPath,['qa/postgres/make-sqlite-source.cjs',file],{cwd:root,env:{...process.env,DATABASE_URL:''},encoding:'utf8',timeout:120000,maxBuffer:1024*1024});
  if(result.status!==0)throw new Error('Could not create disposable baseline fixture: '+String(result.stderr||result.error));
}

test('schema generation is reproducible and CHECK lexer ignores literal text',()=>{
  assert.equal(generate(),fs.readFileSync(path.join(root,'server/postgres/migrations/001-full-schema.sql'),'utf8'));
  assert.deepEqual(checks("CREATE TABLE x(a TEXT DEFAULT 'check(x)',b REAL CHECK(b>=0),c TEXT CHECK(c IN ('(a)','x')))"),['CHECK(b>=0)',"CHECK(c IN ('(a)','x'))"]);
  assert.equal(decimal('1.2000'),'12e-1');assert.equal(decimal('120e-2'),'12e-1');assert.equal(decimal('-0.000'),'0');
  assert.throws(()=>decimal(Infinity));assert.throws(()=>decimal('NaN'));
});

test('full schema and synthetic import reconcile, rollback, constraints and ledgers',{timeout:180000},async t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'bom-pg-qa-'));
  const snapshot=path.join(temp,'source.sqlite');
  let instance;
  const results=[];
  async function check(name,work){await t.test(name,async()=>{await work();results.push(name)})}
  try{
    syntheticSnapshot(snapshot);
    instance=await engine();const {db}=instance;
    await check('all 271 application tables migrate; reruns do not change the schema',async()=>{
      const first=await migrate(db);assert(first.installed.length>=5);
      assert.equal((await migrate(db)).installed.length,0);
      await assertMigrationsCurrent(db);
      const tables=await db.all("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='bom' AND left(tablename,1)<>'_'");
      assert.equal(tables.length,catalog.tables.length);
      const ready=await db.readiness();assert.equal(ready.ready,true);assert.equal(ready.schema,'bom');
    });
    await check('a mid-import failure rolls back every row and restores triggers',async()=>{
      await assert.rejects(withSnapshot(snapshot,s=>importSnapshot(s,db,{failAfterTable:'finance_entries'})),/Injected/);
      for(const table of ['business_units','finance_entries','users'])assert.equal((await db.one(`SELECT COUNT(*)::text AS n FROM bom.${table}`)).n,'0');
      const triggers=await db.all("SELECT tgenabled FROM pg_catalog.pg_trigger WHERE tgname IN ('trg_v290_finance_insert','trg_v290_finance_update','set_excavator_allocation_entry_time_v352') AND NOT tgisinternal");
      assert.equal(triggers.length,3);assert(triggers.every(t=>t.tgenabled==='O'));
    });
    await check('every imported row and all 3453 columns match, including Korean and exact numerics',async()=>{
      const report=await withSnapshot(snapshot,s=>importSnapshot(s,db));
      assert.equal(report.tableCount,271);assert.equal(report.matched,true);assert(report.rowCount>1000);assert(report.tables.every(t=>t.match));
      assert.equal((await db.one('SELECT name FROM bom.users WHERE email=$1',['qa@blueocean.local'])).name,"한글 · O'Hara");
      await db.transaction(async()=>{
        await db.query("CREATE TEMP TABLE precision_check(n NUMERIC, i BIGINT)");
        await db.query('INSERT INTO precision_check VALUES($1,$2)',['9007199254740993.0123456789','9007199254740993']);
        const value=await db.one('SELECT n::text,i::text FROM precision_check');
        assert.equal(value.n,'9007199254740993.0123456789');assert.equal(value.i,'9007199254740993');
      });
    });
    await check('import refuses a nonempty destination',async()=>{
      await assert.rejects(withSnapshot(snapshot,s=>importSnapshot(s,db)),/not empty/);
    });
    await check('foreign keys and imported identity sequences are enforced',async()=>{
      await assert.rejects(db.query("INSERT INTO bom.tasks(title,owner_id) VALUES('invalid',-9000000000)"),e=>e.code==='23503');
      const before=await db.one('SELECT MAX(id)::text AS n FROM bom.users');
      const created=await db.one("INSERT INTO bom.users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id::text",['QA second','qa-pg-second@blueocean.local','unusable-test-hash','Staff']);
      assert(BigInt(created.id)>BigInt(before.n));
      await db.query('DELETE FROM bom.users WHERE id=$1',[created.id]);
    });
    await check('receiving facts stay immutable in PostgreSQL',async()=>{
      const source=new Database(snapshot,{readonly:true});
      const user=source.prepare('SELECT id FROM users LIMIT 1').get().id;
      const bu=source.prepare("SELECT id FROM business_units WHERE name='Pink Salt'").get().id;
      source.close();
      const row=await db.one(`INSERT INTO bom.pink_receiving_history(business_unit_id,entity_type,entity_id,action,before_json,after_json,reason,created_by)
        VALUES($1,'QA',1,'test','{}','{ "x": 1 }','synthetic',$2) RETURNING id::text`,[bu,user]);
      await assert.rejects(db.query('UPDATE bom.pink_receiving_history SET reason=$1 WHERE id=$2',['changed',row.id]),e=>e.code==='23514');
      await assert.rejects(db.query('DELETE FROM bom.pink_receiving_history WHERE id=$1',[row.id]),e=>e.code==='23514');
      assert.equal((await db.one('SELECT after_json FROM bom.pink_receiving_history WHERE id=$1',[row.id])).after_json,'{ "x": 1 }');
      // Reset/restore work has a separate owner-only path; app deletes never
      // bypass the trigger. Reconciliation below ignores this one test row.
    });
    await check('finance inserts and updates queue synchronization natively',async()=>{
      const bu=(await db.one("SELECT id FROM bom.business_units WHERE name='Pink Salt'")).id;
      const row=await db.one("INSERT INTO bom.finance_entries(business_unit_id,type,category,amount) VALUES($1,'Expense','QA',0.1) RETURNING id::text",[bu]);
      assert.equal((await db.one('SELECT COUNT(*)::text AS n FROM bom.accounting_sync_queue WHERE finance_entry_id=$1',[row.id])).n,'1');
      await db.query('UPDATE bom.finance_entries SET amount=0.2 WHERE id=$1',[row.id]);
      assert.equal((await db.one('SELECT COUNT(*)::text AS n FROM bom.accounting_sync_queue WHERE finance_entry_id=$1',[row.id])).n,'1');
      await db.query('DELETE FROM bom.accounting_sync_queue WHERE finance_entry_id=$1',[row.id]);
      await db.query('DELETE FROM bom.finance_entries WHERE id=$1',[row.id]);
    });
    await check('reconciliation detects a changed historical amount',async()=>{
      await withSnapshot(snapshot,async source=>{
        const bu=source.prepare("SELECT id FROM business_units WHERE name='Pink Salt'").get().id;
        // Use a disposable transaction to demonstrate mismatch detection.
        await assert.rejects(db.transaction(async()=>{
          await db.query("INSERT INTO bom.finance_entries(business_unit_id,type,category,amount) VALUES($1,'Expense','QA',12.34)",[bu]);
          const report=await compare(source,db);
          assert.equal(report.find(x=>x.name==='finance_entries').match,false);
          throw new Error('rollback comparator test');
        }),/rollback comparator/);
      });
    });
    await check('an incompatible source schema is rejected before destination changes',async()=>{
      const bad=path.join(temp,'bad.sqlite');fs.copyFileSync(snapshot,bad);
      const altered=new Database(bad);altered.exec('ALTER TABLE users ADD COLUMN unexpected TEXT');altered.close();
      await assert.rejects(withSnapshot(bad,s=>importSnapshot(s,db)),/schema differs/);
    });
    await check('changed migration files cannot be silently reapplied',async()=>{
      const directory=path.join(temp,'migrations');fs.cpSync(path.join(root,'server/postgres/migrations'),directory,{recursive:true});
      fs.appendFileSync(path.join(directory,'001-full-schema.sql'),'\n-- altered\n');
      await assert.rejects(migrate(db,{directory}),/was changed/);
      await assertMigrationsCurrent(db);
    });
    if(instance.label==='native-postgresql'){
      await check('real concurrent sessions prevent overspending and duplicate operations',async()=>{
        await db.query('CREATE TABLE bom._qa_balance(id INTEGER PRIMARY KEY,available INTEGER NOT NULL CHECK(available>=0))');
        await db.query('CREATE TABLE bom._qa_operation(operation_key TEXT PRIMARY KEY,quantity INTEGER NOT NULL)');
        await db.query('INSERT INTO bom._qa_balance VALUES(1,10)');
        const spend=(key,quantity)=>db.transaction(async()=>{
          const inserted=await db.all('INSERT INTO bom._qa_operation VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING operation_key',[key,quantity]);
          if(!inserted.length)return 'replayed';
          const changed=await db.all('UPDATE bom._qa_balance SET available=available-$1 WHERE id=1 AND available>=$1 RETURNING available',[quantity]);
          if(!changed.length)throw new Error('insufficient');
          return 'created';
        });
        const first=await Promise.allSettled([spend('one',6),spend('two',6)]);
        assert.equal(first.filter(r=>r.status==='fulfilled').length,1);
        assert.equal((await db.one('SELECT available FROM bom._qa_balance')).available,4);
        assert.equal((await db.one('SELECT COUNT(*)::text AS n FROM bom._qa_operation')).n,'1');
        await db.query('DELETE FROM bom._qa_operation');await db.query('UPDATE bom._qa_balance SET available=10');
        const duplicate=await Promise.all([spend('same',6),spend('same',6)]);
        assert.deepEqual(duplicate.sort(),['created','replayed']);
        assert.equal((await db.one('SELECT available FROM bom._qa_balance')).available,4);
        await db.query('DROP TABLE bom._qa_operation,bom._qa_balance');
      });
    }
    if(process.env.PG_QA_REPORT){
      fs.writeFileSync(process.env.PG_QA_REPORT,JSON.stringify({scope:'PostgreSQL schema/import foundation; not full application acceptance',engine:instance.label,tables:catalog.tables.length,columns:catalog.tables.reduce((n,t)=>n+t.columns.length,0),passed:results},null,2)+'\n');
    }
  }finally{await instance?.close();fs.rmSync(temp,{recursive:true,force:true})}
});
