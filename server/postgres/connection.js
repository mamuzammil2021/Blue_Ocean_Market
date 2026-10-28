'use strict';

const {Pool}=require('pg');
const {AsyncLocalStorage}=require('node:async_hooks');

function boundedInt(value,fallback,min,max,label){
  if(value===undefined||value==='')return fallback;
  const n=Number(value);
  if(!Number.isInteger(n)||n<min||n>max)throw new Error(`${label} must be an integer between ${min} and ${max}`);
  return n;
}

// Deliberately no SQLite fallback, dialect translation, global numeric parser,
// credentials in logs, or module-specific database URL.
function configuration(env=process.env){
  if(!env.DATABASE_URL)throw new Error('DATABASE_URL is required for PostgreSQL');
  let url;
  try{url=new URL(env.DATABASE_URL)}catch{throw new Error('DATABASE_URL must be a PostgreSQL connection URL')}
  if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||!url.pathname||url.pathname==='/')throw new Error('DATABASE_URL must name one PostgreSQL database');
  return {
    connectionString:env.DATABASE_URL,
    max:boundedInt(env.PG_POOL_MAX,5,1,50,'PG_POOL_MAX'),
    connectionTimeoutMillis:boundedInt(env.PG_CONNECT_TIMEOUT_MS,10000,100,120000,'PG_CONNECT_TIMEOUT_MS'),
    idleTimeoutMillis:30000,
    statement_timeout:boundedInt(env.PG_STATEMENT_TIMEOUT_MS,30000,100,3600000,'PG_STATEMENT_TIMEOUT_MS'),
    application_name:'blue-ocean-market',
    // pg honors sslmode/sslrootcert in DATABASE_URL. Certificate verification is
    // never disabled here. Internal Render connections can use the internal URL.
    options:'-c search_path=bom,pg_catalog -c timezone=UTC'
  };
}

function createDatabase({pool,env=process.env,onPoolError}={}){
  const owned=!pool;
  pool=pool||new Pool(configuration(env));
  const scope=new AsyncLocalStorage();
  let closed=false;
  if(owned)pool.on('error',error=>{
    // Driver error messages can contain SQL/values; only log the error code.
    if(onPoolError)onPoolError(error);else console.error('[postgres] idle connection error',error.code||'UNKNOWN');
  });
  function current(){
    if(closed)throw new Error('PostgreSQL connection is closed');
    const context=scope.getStore();
    if(context?.finished)throw new Error('A transaction query outlived its transaction callback');
    return context;
  }
  async function query(sql,values=[]){
    if(typeof sql!=='string'||!Array.isArray(values))throw new TypeError('query requires SQL and an array of parameters');
    const context=current();
    return (context?.client||pool).query(sql,values);
  }
  async function transaction(work,{isolation='READ COMMITTED',readOnly=false}={}){
    if(typeof work!=='function')throw new TypeError('transaction requires an async callback');
    const outer=current();
    if(outer){
      // Each async branch must use the shared outer transaction sequentially.
      // A child context permits deeper nesting but rejects sibling savepoints
      // that overlap (which could roll back each other's writes).
      if(outer.nesting)throw new Error('Overlapping nested PostgreSQL transactions are not supported');
      outer.nesting=true;
      const name=`bom_savepoint_${++outer.sequence.value}`;
      const child={client:outer.client,sequence:outer.sequence,finished:false,nesting:false};
      try{
        await outer.client.query(`SAVEPOINT ${name}`);
        try{const result=await scope.run(child,()=>work(api));await outer.client.query(`RELEASE SAVEPOINT ${name}`);return result}
        catch(error){await outer.client.query(`ROLLBACK TO SAVEPOINT ${name}`);await outer.client.query(`RELEASE SAVEPOINT ${name}`);throw error}
      }finally{child.finished=true;outer.nesting=false}
    }
    if(!['READ COMMITTED','REPEATABLE READ','SERIALIZABLE'].includes(isolation))throw new Error('Unsupported PostgreSQL transaction isolation');
    const client=await pool.connect();
    const context={client,sequence:{value:0},finished:false,nesting:false};
    let broken=false;
    try{
      await client.query(`BEGIN ISOLATION LEVEL ${isolation}${readOnly?' READ ONLY':''}`);
      const result=await scope.run(context,()=>work(api));
      const committed=await client.query('COMMIT');
      if(committed.command==='ROLLBACK')throw new Error('PostgreSQL transaction was aborted before commit');
      return result;
    }catch(error){
      try{await client.query('ROLLBACK')}catch{broken=true}
      throw error;
    }finally{
      context.finished=true;
      client.release(broken);
    }
  }
  const api={
    query,transaction,
    async all(sql,values=[]){return (await query(sql,values)).rows},
    async one(sql,values=[]){const rows=(await query(sql,values)).rows;if(rows.length!==1)throw new Error(`Expected exactly one PostgreSQL row; received ${rows.length}`);return rows[0]},
    async maybeOne(sql,values=[]){const rows=(await query(sql,values)).rows;if(rows.length>1)throw new Error('Expected at most one PostgreSQL row');return rows[0]},
    async readiness(){const r=await query('SELECT current_database() AS database, current_schema() AS schema, 1 AS ready');return {ready:r.rows[0]?.ready===1&&r.rows[0]?.schema==='bom',schema:r.rows[0]?.schema}},
    inTransaction(){return !!current()},
    async close(){if(scope.getStore())throw new Error('Cannot close PostgreSQL inside a transaction');if(closed)return;closed=true;if(owned)await pool.end()}
  };
  return api;
}

function identifier(value){
  if(typeof value!=='string'||!value||value.includes('\0'))throw new TypeError('Invalid PostgreSQL identifier');
  return '"'+value.replace(/"/g,'""')+'"';
}

module.exports={createDatabase,configuration,identifier};
