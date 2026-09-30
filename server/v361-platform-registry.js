const VERSION='30.61.0';

function install({app,db,auth,audit,access}){
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_modules(
      module_key TEXT PRIMARY KEY,
      module_name TEXT NOT NULL,
      business_unit_aware INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      source TEXT NOT NULL DEFAULT 'core',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS platform_entities(
      entity_type TEXT PRIMARY KEY,
      module_key TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      table_name TEXT,
      display_field TEXT,
      route_template TEXT,
      performance_class TEXT NOT NULL DEFAULT 'Standard',
      search_enabled INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS platform_entity_capabilities(
      entity_type TEXT NOT NULL,
      capability_key TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY(entity_type,capability_key)
    );
    CREATE TABLE IF NOT EXISTS platform_related_records(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_entity_type TEXT NOT NULL,
      source_entity_id INTEGER NOT NULL,
      target_entity_type TEXT NOT NULL,
      target_entity_id INTEGER NOT NULL,
      relationship_type TEXT NOT NULL DEFAULT 'Related',
      business_unit_id INTEGER,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(source_entity_type,source_entity_id,target_entity_type,target_entity_id,relationship_type)
    );
    CREATE INDEX IF NOT EXISTS idx_platform_related_source ON platform_related_records(source_entity_type,source_entity_id);
    CREATE INDEX IF NOT EXISTS idx_platform_related_target ON platform_related_records(target_entity_type,target_entity_id);
    CREATE TABLE IF NOT EXISTS meeting_business_units(
      meeting_id INTEGER NOT NULL,
      business_unit_id INTEGER NOT NULL,
      PRIMARY KEY(meeting_id,business_unit_id),
      FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
      FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
    );
    CREATE INDEX IF NOT EXISTS idx_meeting_bu_unit ON meeting_business_units(business_unit_id,meeting_id);
    CREATE TABLE IF NOT EXISTS task_business_units(
      task_id INTEGER NOT NULL,
      business_unit_id INTEGER NOT NULL,
      PRIMARY KEY(task_id,business_unit_id),
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
    );
    CREATE INDEX IF NOT EXISTS idx_task_bu_unit ON task_business_units(business_unit_id,task_id);
  `);

  const moduleRows=[
    ['meetings','Meetings',1],['tasks','Tasks',1],['documents','Documents',1],['approvals','Approvals',1],
    ['notifications','Notifications',1],['audit','Audit',1],['accounting','Accounting',1],['finance','Finance',1],
    ['excavator','Excavator',1],['pink_salt','Pink Salt',1],['restaurant','MIMI Restaurant',1],['payroll','Employees & Payroll',1]
  ];
  const insModule=db.prepare(`INSERT INTO platform_modules(module_key,module_name,business_unit_aware,source)
    VALUES(?,?,?,'v30.61') ON CONFLICT(module_key) DO UPDATE SET module_name=excluded.module_name,business_unit_aware=excluded.business_unit_aware,active=1,updated_at=CURRENT_TIMESTAMP`);
  for(const row of moduleRows) insModule.run(...row);

  const entities=[
    ['meeting','meetings','Meeting','meetings','title','meetings','Standard'],
    ['task','tasks','Task','tasks','title','tasks','High Volume'],
    ['document','documents','Document','documents','title','documents','Standard'],
    ['approval','approvals','Approval','approvals','type','approvals','High Volume'],
    ['finance_transaction','finance','Finance Transaction','finance_entries','description','finance','High Volume'],
    ['employee','payroll','Employee','employees','name','payroll','Standard'],
    ['excavator_machine','excavator','Excavator Machine','excavator_assets','machine_name','excavator','Standard'],
    ['excavator_buyer','excavator','Excavator Buyer','excavator_buyers','name','excavatorBuyers','Standard'],
    ['excavator_supplier','excavator','Excavator Supplier','excavator_suppliers','name','excavatorSuppliers','Standard']
  ];
  const insEntity=db.prepare(`INSERT INTO platform_entities(entity_type,module_key,entity_name,table_name,display_field,route_template,performance_class)
    VALUES(?,?,?,?,?,?,?) ON CONFLICT(entity_type) DO UPDATE SET module_key=excluded.module_key,entity_name=excluded.entity_name,table_name=excluded.table_name,display_field=excluded.display_field,route_template=excluded.route_template,performance_class=excluded.performance_class,active=1,updated_at=CURRENT_TIMESTAMP`);
  for(const row of entities) insEntity.run(...row);

  const caps=['related_records','tasks','meetings','documents','approvals','notifications','audit','search'];
  const capabilityMap={
    meeting:['related_records','tasks','documents','notifications','audit','search'],
    task:['related_records','meetings','documents','notifications','audit','search'],
    document:['related_records','tasks','meetings','approvals','notifications','audit','search'],
    approval:['related_records','tasks','meetings','documents','notifications','audit','search'],
    finance_transaction:['related_records','tasks','meetings','documents','approvals','notifications','audit','search'],
    employee:['related_records','tasks','meetings','documents','approvals','notifications','audit','search'],
    excavator_machine:['related_records','tasks','meetings','documents','approvals','notifications','audit','search'],
    excavator_buyer:['related_records','tasks','meetings','documents','notifications','audit','search'],
    excavator_supplier:['related_records','tasks','meetings','documents','notifications','audit','search']
  };
  const insCap=db.prepare('INSERT OR REPLACE INTO platform_entity_capabilities(entity_type,capability_key,enabled) VALUES(?,?,1)');
  for(const [entity,list] of Object.entries(capabilityMap)) for(const cap of list) if(caps.includes(cap)) insCap.run(entity,cap);

  // Safe backfill only: existing single-BU records retain their current behavior and also become registry-scoped.
  db.prepare(`INSERT OR IGNORE INTO meeting_business_units(meeting_id,business_unit_id)
    SELECT id,business_unit_id FROM meetings WHERE business_unit_id IS NOT NULL`).run();
  db.prepare(`INSERT OR IGNORE INTO task_business_units(task_id,business_unit_id)
    SELECT id,business_unit_id FROM tasks WHERE business_unit_id IS NOT NULL`).run();

  function allowedUnit(user,bu){
    bu=Number(bu||0); if(!bu)return false;
    if(user?.role==='CEO / Owner')return true;
    return access?.isAssigned ? access.isAssigned(user.id,bu) : Number(user?.business_unit_id)===bu;
  }
  function entityExists(type,id){
    const e=db.prepare('SELECT * FROM platform_entities WHERE entity_type=? AND active=1').get(String(type||''));
    if(!e||!e.table_name||!/^[_a-zA-Z0-9]+$/.test(e.table_name))return null;
    try{return db.prepare(`SELECT * FROM ${e.table_name} WHERE id=?`).get(Number(id))?e:null}catch(_){return null}
  }

  app.get('/api/platform/registry',auth,(req,res)=>{
    const modules=db.prepare('SELECT module_key,module_name,business_unit_aware,active FROM platform_modules WHERE active=1 ORDER BY module_name').all();
    const entities=db.prepare(`SELECT e.*,GROUP_CONCAT(CASE WHEN c.enabled=1 THEN c.capability_key END) capability_csv
      FROM platform_entities e LEFT JOIN platform_entity_capabilities c ON c.entity_type=e.entity_type
      WHERE e.active=1 GROUP BY e.entity_type ORDER BY e.module_key,e.entity_name`).all().map(x=>({...x,capabilities:String(x.capability_csv||'').split(',').filter(Boolean)}));
    res.json({version:VERSION,modules,entities});
  });

  app.get('/api/platform/related/:entityType/:entityId',auth,(req,res)=>{
    const type=String(req.params.entityType||''),id=Number(req.params.entityId||0); if(!entityExists(type,id))return res.status(404).json({error:'Registered record not found'});
    const rows=db.prepare(`SELECT r.*,pe.entity_name target_entity_name,pe.module_key target_module
      FROM platform_related_records r LEFT JOIN platform_entities pe ON pe.entity_type=r.target_entity_type
      WHERE r.source_entity_type=? AND r.source_entity_id=? ORDER BY r.created_at DESC,r.id DESC`).all(type,id);
    res.json(rows);
  });

  app.post('/api/platform/related',auth,(req,res)=>{
    const sourceType=String(req.body.source_entity_type||''),targetType=String(req.body.target_entity_type||'');
    const sourceId=Number(req.body.source_entity_id||0),targetId=Number(req.body.target_entity_id||0),bu=req.body.business_unit_id?Number(req.body.business_unit_id):null;
    if(!entityExists(sourceType,sourceId)||!entityExists(targetType,targetId))return res.status(400).json({error:'Both records must be registered platform entities'});
    if(bu&&!allowedUnit(req.user,bu))return res.status(403).json({error:'You are not authorized for this business unit'});
    const rel=String(req.body.relationship_type||'Related').trim().slice(0,80)||'Related';
    const r=db.prepare(`INSERT OR IGNORE INTO platform_related_records(source_entity_type,source_entity_id,target_entity_type,target_entity_id,relationship_type,business_unit_id,created_by)
      VALUES(?,?,?,?,?,?,?)`).run(sourceType,sourceId,targetType,targetId,rel,bu,req.user.id);
    if(audit)audit(req.user,'platform_related_record',r.lastInsertRowid||null,'link',JSON.stringify({sourceType,sourceId,targetType,targetId,relationship_type:rel,business_unit_id:bu}));
    res.json({ok:true,id:Number(r.lastInsertRowid||0)});
  });

  return {VERSION};
}

module.exports={install,VERSION};
