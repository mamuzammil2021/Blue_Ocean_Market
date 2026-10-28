'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createDatabase,configuration,identifier}=require('../../server/postgres/connection');

test('one required database URL, bounded pool, no global precision coercion',()=>{
  assert.throws(()=>configuration({}),/DATABASE_URL/);
  for(const value of ['file:foo','sqlite:///data.db','postgresql://host/','postgresql://host'])assert.throws(()=>configuration({DATABASE_URL:value}));
  assert.throws(()=>configuration({DATABASE_URL:'postgres://user:pw@localhost/bom',PG_POOL_MAX:'0'}));
  const c=configuration({DATABASE_URL:'postgres://user:pw@localhost/bom'});
  assert.equal(c.max,5);assert.equal(c.options,'-c search_path=bom,pg_catalog -c timezone=UTC');
  assert.equal(identifier('a"b'),'"a""b"');assert.throws(()=>identifier('x\0y'));
});

function poolFixture(){
  const events=[];let sequence=0;
  const pool={query:async(s,v)=>{events.push({client:'pool',sql:s,values:v});return {rows:[]}},connect:async()=>{
    const client=++sequence;
    return {query:async(s,v)=>{events.push({client,sql:s,values:v});if(s==='FAIL')throw new Error('injected');return {rows:[],command:s==='COMMIT'?'COMMIT':undefined}},release(broken){events.push({client,released:true,broken})}};
  }};
  return {db:createDatabase({pool}),events};
}

test('transaction and nested savepoints keep one client and rollback locally',async()=>{
  const {db,events}=poolFixture();
  await db.transaction(async()=>{
    await db.query('OUTER');
    await db.transaction(async()=>{await db.query('CHILD');await db.transaction(async()=>db.query('GRANDCHILD'))});
    await assert.rejects(db.transaction(async()=>db.query('FAIL')),/injected/);
    await db.query('AFTER');
  });
  assert(events.every(e=>e.client===1));
  assert(events.some(e=>e.sql==='ROLLBACK TO SAVEPOINT bom_savepoint_3'));
  assert(events.some(e=>e.sql==='COMMIT'));
  assert.equal(events.at(-1).released,true);
  assert.equal(events.at(-1).broken,false);
});

test('separate concurrent requests never share transaction context',async()=>{
  const {db,events}=poolFixture();
  await Promise.all([db.transaction(async()=>{await Promise.resolve();await db.query('REQUEST_A')}),db.transaction(async()=>db.query('REQUEST_B'))]);
  const a=events.find(e=>e.sql==='REQUEST_A'),b=events.find(e=>e.sql==='REQUEST_B');
  assert.notEqual(a.client,b.client);
  assert.equal(events.filter(e=>e.sql==='COMMIT').length,2);
  assert.equal(events.filter(e=>e.released).length,2);
});

test('failed transactions roll back and release; detached work is rejected',async()=>{
  const {db,events}=poolFixture();let delayed;
  await assert.rejects(db.transaction(async()=>db.query('FAIL')),/injected/);
  assert(events.some(e=>e.sql==='ROLLBACK'));
  await db.transaction(async()=>{delayed=new Promise(resolve=>setTimeout(async()=>{try{await db.query('LATE');resolve(null)}catch(e){resolve(e)}},5))});
  assert.match((await delayed).message,/outlived/);
  assert(!events.some(e=>e.sql==='LATE'));
  await db.close();await assert.rejects(db.query('CLOSED'),/closed/);
});

test('overlapping nested siblings fail before a sibling savepoint can interfere',async()=>{
  const {db}=poolFixture();
  await db.transaction(async()=>{
    let release;
    const wait=new Promise(resolve=>release=resolve);
    const first=db.transaction(async()=>wait);
    await assert.rejects(db.transaction(async()=>{}),/Overlapping/);
    release();await first;
  });
});
