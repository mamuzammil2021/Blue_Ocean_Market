'use strict';
// Offline, owner-only migration. The runtime connection module never imports
// better-sqlite3. Importing cannot update an existing PostgreSQL installation.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const Database=require('better-sqlite3');
const catalog=require('./catalog-v306950.json');
const {identifier:q}=require('./connection');
const {assertMigrationsCurrent}=require('./migrate');
const table=n=>`bom.${q(n)}`;

function decimal(value){
  const s=String(value);
  const match=s.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);
  if(!match)throw new Error('Non-finite or invalid numeric value in migration');
  let digits=(match[2]+(match[3]||'')).replace(/^0+/,'')||'0';
  let scale=(match[3]||'').length-Number(match[4]||0);
  if(!Number.isSafeInteger(scale)||Math.abs(scale)>100000)throw new Error('Numeric exponent is outside migration limits');
  if(digits==='0')return '0';
  while(digits.endsWith('0')){digits=digits.slice(0,-1);scale--}
  return (match[1]==='-'?'-':'')+digits+'e'+(-scale);
}

function canonical(c,value){
  if(value===null)return null;
  if(c.type==='TEXT'){
    if(typeof value!=='string')throw new Error(`Expected text in ${c.name}; SQLite storage type must be corrected explicitly`);
    if(value.includes('\0'))throw new Error(`NUL text cannot be imported into PostgreSQL (${c.name})`);
    return ['text',value];
  }
  if(c.type==='INTEGER'){
    const s=String(value);
    if(!/^-?\d+$/.test(s))throw new Error(`Expected integral value in ${c.name}`);
    const n=BigInt(s);
    if(n<-(2n**63n)||n>=2n**63n)throw new Error(`Value outside PostgreSQL BIGINT range (${c.name})`);
    return ['integer',n.toString()];
  }
  if(c.type==='REAL')return ['numeric',decimal(value)];
  throw new Error(`Unsupported migration type ${c.type}`);
}

function fingerprint(t,rows){
  // Sorted per-row hashes preserve duplicate multiplicity and ignore engine row
  // order/collation. Values and JSON strings are never included in the report.
  const hashes=rows.map(row=>crypto.createHash('sha256').update(JSON.stringify(t.columns.map(c=>canonical(c,row[c.name])))).digest('hex')).sort();
  return crypto.createHash('sha256').update(hashes.join('\n')).digest('hex');
}

function inspect(source){
  const integrity=source.pragma('quick_check');
  if(integrity.length!==1||Object.values(integrity[0])[0]!=='ok')throw new Error('SQLite integrity check failed');
  const violations=source.pragma('foreign_key_check');
  if(violations.length)throw new Error(`SQLite contains ${violations.length} foreign-key violations; no data was imported`);
  const found=source.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND substr(name,1,7)<>'sqlite_' ORDER BY name").all();
  if(found.length!==catalog.tables.length||found.some((t,i)=>t.name!==catalog.tables[i].name||t.sql!==catalog.tables[i].sql))throw new Error('SQLite schema differs from the verified V30.69.50 catalog; review and regenerate the catalog before importing');
  const result=[];
  for(const t of catalog.tables){
    const rows=source.prepare(`SELECT ${t.columns.map(c=>q(c.name)).join(',')} FROM ${q(t.name)}`).safeIntegers(true).all();
    for(const row of rows){
      for(const c of t.columns){
        const value=row[c.name];
        if((c.notnull||c.pk)&&value===null)throw new Error(`NULL in a required column (${t.name}.${c.name})`);
        try{canonical(c,value)}catch(error){throw new Error(`${t.name}: ${error.message}`)}
      }
    }
    result.push({name:t.name,rows:rows.length,sha256:fingerprint(t,rows)});
  }
  return result;
}

async function compare(source,db){
  const report=[];
  for(const t of catalog.tables){
    const original=source.prepare(`SELECT ${t.columns.map(c=>q(c.name)).join(',')} FROM ${q(t.name)}`).safeIntegers(true).all();
    const target=await db.all(`SELECT ${t.columns.map(c=>q(c.name)).join(',')} FROM ${table(t.name)}`);
    const sourceHash=fingerprint(t,original),targetHash=fingerprint(t,target);
    report.push({name:t.name,sourceRows:original.length,targetRows:target.length,sha256:sourceHash,match:original.length===target.length&&sourceHash===targetHash});
  }
  return report;
}

async function importSnapshot(source,db,{batchRows=100,failAfterTable}={}){
  if(!Number.isInteger(batchRows)||batchRows<1||batchRows>1000)throw new Error('batchRows must be between 1 and 1000');
  // Inspect before acquiring locks. A single read transaction pins the SQLite
  // snapshot; callers must supply a private snapshot, not a writable live file.
  if(source.inTransaction)throw new Error('SQLite snapshot already has an open transaction');
  source.exec('BEGIN');
  try{
    const preflight=inspect(source);
    await assertMigrationsCurrent(db);
    return await db.transaction(async()=>{
      await db.query('SELECT pg_advisory_xact_lock(1112493391, 2)');
      const existing=await db.all("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='bom' ORDER BY tablename");
      const allowed=new Set([...catalog.tables.map(t=>t.name),'_pg_migrations','_pg_imports','_pg_maintenance','_pg_auth_epoch']);
      if(existing.some(t=>!allowed.has(t.tablename)))throw new Error('Unrecognized PostgreSQL application tables; import refused');
      await db.query(`LOCK TABLE ${catalog.tables.map(t=>table(t.name)).join(',')} IN ACCESS EXCLUSIVE MODE`);
      for(const t of catalog.tables){
        if((await db.one(`SELECT COUNT(*)::text AS n FROM ${table(t.name)}`)).n!=='0')throw new Error(`PostgreSQL destination is not empty (${t.name}); import refused`);
      }
      await db.query(`CREATE TABLE IF NOT EXISTS bom._pg_imports (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        schema_sha256 TEXT NOT NULL, report_json JSONB NOT NULL,
        imported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
      await db.query('SET CONSTRAINTS ALL DEFERRED');
      // Avoid generating new business events or altering NULL historical entry
      // times. These three specific triggers are restored in this transaction;
      // immutable ledgers and all constraints remain enforced.
      const triggers=[['finance_entries','trg_v290_finance_insert'],['finance_entries','trg_v290_finance_update'],['excavator_buyer_payment_allocations','set_excavator_allocation_entry_time_v352']];
      for(const [t,tr] of triggers)await db.query(`ALTER TABLE ${table(t)} DISABLE TRIGGER ${q(tr)}`);
      const sequences=[];
      for(const t of catalog.tables){
        const columns=t.columns.map(c=>q(c.name)).join(',');
        const iterator=source.prepare(`SELECT ${columns} FROM ${q(t.name)}`).safeIntegers(true).iterate();
        let batch=[];
        async function flush(){
          if(!batch.length)return;
          const values=[];
          const tuples=batch.map(row=>'('+t.columns.map(c=>{
            const v=row[c.name];
            values.push(typeof v==='bigint'?v.toString():v);
            return '$'+values.length;
          }).join(',')+')');
          await db.query(`INSERT INTO ${table(t.name)} (${columns}) VALUES ${tuples.join(',')}`,values);
          batch=[];
        }
        // PostgreSQL protocol allows at most 65,535 parameters per statement.
        const size=Math.min(batchRows,Math.floor(60000/t.columns.length));
        for(const row of iterator){batch.push(row);if(batch.length>=size)await flush()}
        await flush();
        const pk=t.columns.filter(c=>c.pk);
        if(pk.length===1&&pk[0].type==='INTEGER'){
          const col=pk[0].name;
          const max=source.prepare(`SELECT MAX(${q(col)}) AS n FROM ${q(t.name)}`).safeIntegers(true).get().n;
          const old=source.prepare('SELECT seq FROM sqlite_sequence WHERE name=?').safeIntegers(true).get(t.name)?.seq;
          const floor=[max||0n,old||0n,0n].reduce((a,b)=>a>b?a:b);
          if(floor>=2n**63n-1n)throw new Error(`Identity sequence is exhausted (${t.name})`);
          sequences.push({table:t.name,column:col,floor:floor.toString()});
        }
        if(failAfterTable===t.name)throw new Error('Injected import rollback test failure');
      }
      await db.query('SET CONSTRAINTS ALL IMMEDIATE');
      for(const [t,tr] of triggers)await db.query(`ALTER TABLE ${table(t)} ENABLE TRIGGER ${q(tr)}`);
      const tables=await compare(source,db);
      if(tables.some(t=>!t.match))throw new Error('PostgreSQL data reconciliation failed; the import was rolled back');
      const report={baselineVersion:catalog.baselineVersion,schemaSha256:catalog.schemaSha256,tables,tableCount:tables.length,rowCount:tables.reduce((n,t)=>n+t.sourceRows,0),matched:true};
      await db.query('INSERT INTO bom._pg_imports(schema_sha256,report_json) VALUES($1,$2::jsonb)',[catalog.schemaSha256,JSON.stringify(report)]);
      // ALTER SEQUENCE RESTART is transactional (setval is not). Rollback cannot
      // leave reset sequences behind. Keep SQLite AUTOINCREMENT high-water marks.
      for(const sequence of sequences){
        const {name}=await db.one('SELECT pg_get_serial_sequence($1,$2) AS name',[`bom.${q(sequence.table)}`,sequence.column]);
        if(!name)throw new Error(`Missing identity sequence for ${sequence.table}`);
        const [schema,seq]=name.split('.').map(s=>s.replace(/^"|"$/g,''));
        if(schema!=='bom'||!seq||name.split('.').length!==2)throw new Error('Unexpected identity sequence name');
        await db.query(`ALTER SEQUENCE ${q(schema)}.${q(seq)} RESTART WITH ${BigInt(sequence.floor)+1n}`);
      }
      return {...report,preflightTables:preflight.length};
    });
  }finally{source.exec('ROLLBACK')}
}

async function withSnapshot(file,work){
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'bom-pg-import-'));
  const snapshot=path.join(directory,'source.sqlite');
  let live,source;
  try{
    live=new Database(path.resolve(file),{readonly:true,fileMustExist:true});
    await live.backup(snapshot);
    live.close();live=null;
    source=new Database(snapshot,{readonly:true,fileMustExist:true});
    return await work(source);
  }finally{
    source?.close();live?.close();fs.rmSync(directory,{recursive:true,force:true});
  }
}

module.exports={importSnapshot,withSnapshot,inspect,compare,fingerprint,decimal,canonical};
