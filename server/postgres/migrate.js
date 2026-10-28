'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');

async function migrate(db,{directory=path.join(__dirname,'migrations')}={}){
  const files=fs.readdirSync(directory).filter(n=>/^\d{3}-[a-z0-9-]+\.sql$/.test(n)).sort();
  if(!files.length)throw new Error('No PostgreSQL schema migrations are present');
  return db.transaction(async()=>{
    // Serialize migration processes in this database before creating metadata.
    await db.query('SELECT pg_advisory_xact_lock(1112493391, 1)');
    await db.query('CREATE SCHEMA IF NOT EXISTS bom');
    await db.query(`CREATE TABLE IF NOT EXISTS bom._pg_migrations (
      filename TEXT PRIMARY KEY, sha256 TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    const applied=new Map((await db.all('SELECT filename,sha256 FROM bom._pg_migrations')).map(x=>[x.filename,x.sha256]));
    for(const name of applied.keys())if(!files.includes(name))throw new Error(`Previously applied PostgreSQL migration is missing: ${name}`);
    const installed=[];
    for(const filename of files){
      const sql=fs.readFileSync(path.join(directory,filename),'utf8');
      const hash=crypto.createHash('sha256').update(sql).digest('hex');
      if(applied.has(filename)){
        if(applied.get(filename)!==hash)throw new Error(`Applied PostgreSQL migration was changed: ${filename}`);
        continue;
      }
      await db.query(sql);
      await db.query('INSERT INTO bom._pg_migrations(filename,sha256) VALUES($1,$2)',[filename,hash]);
      installed.push(filename);
    }
    return {installed,total:files.length};
  });
}

async function assertMigrationsCurrent(db){
  const expected=fs.readdirSync(path.join(__dirname,'migrations')).filter(n=>/^\d{3}-[a-z0-9-]+\.sql$/.test(n)).sort();
  const rows=await db.all('SELECT filename,sha256 FROM bom._pg_migrations ORDER BY filename');
  if(rows.length!==expected.length)throw new Error('PostgreSQL schema migrations are not current');
  for(let i=0;i<expected.length;i++){
    const sha=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'migrations',expected[i]))).digest('hex');
    if(rows[i].filename!==expected[i]||rows[i].sha256!==sha)throw new Error('PostgreSQL schema migrations are not current');
  }
}

module.exports={migrate,assertMigrationsCurrent};
