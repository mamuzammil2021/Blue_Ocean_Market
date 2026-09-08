const multer=require('multer');
const path=require('path');
const {calculateSaltRequirements}=require('./v309-calculations');

const VERSION='30.10.0';

function install({app,db,auth,allow,currentUnit,enforceUnit,audit,notify,uploads,financeSync,voidFinanceBySource,accounting}){
  const upload=multer({dest:uploads,limits:{fileSize:20*1024*1024}});
  const num=v=>Number(v||0);
  const text=v=>String(v??'').trim();
  const bool=v=>['1','true','yes','on'].includes(String(v).toLowerCase())?1:0;
  const today=()=>new Date().toISOString().slice(0,10);
  const columnExists=(table,col)=>db.prepare(`PRAGMA table_info(${table})`).all().some(x=>x.name===col);
  const ensureColumn=(table,col,definition)=>{if(!columnExists(table,col)){try{db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`)}catch(e){console.error('V30.4 migration',table,col,e.message)}}};
  const nextNo=(prefix,table)=>`${prefix}-${new Date().getFullYear()}-${String(Number(db.prepare(`SELECT COUNT(*) c FROM ${table}`).get().c||0)+1).padStart(5,'0')}`;
  const json=v=>{try{return typeof v==='string'?JSON.parse(v):v||{}}catch(_){return{}}};

  db.exec(`
  CREATE TABLE IF NOT EXISTS pink_salt_suppliers(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    country TEXT DEFAULT 'Pakistan',
    payment_terms TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_unit_id,name),
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_imports(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    import_no TEXT NOT NULL UNIQUE,
    supplier_id INTEGER,
    supplier_name TEXT DEFAULT '',
    supplier_invoice_no TEXT DEFAULT '',
    container_no TEXT DEFAULT '',
    bill_of_lading TEXT DEFAULT '',
    origin_country TEXT DEFAULT 'Pakistan',
    destination_country TEXT DEFAULT 'South Korea',
    purchase_date TEXT,
    expected_arrival TEXT,
    actual_arrival TEXT,
    received_at TEXT,
    status TEXT NOT NULL DEFAULT 'Draft',
    invoice_currency TEXT NOT NULL DEFAULT 'USD',
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(supplier_id) REFERENCES pink_salt_suppliers(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_import_items(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_id INTEGER NOT NULL,
    salt_grade TEXT NOT NULL,
    specification TEXT DEFAULT '',
    bag_size_kg REAL NOT NULL,
    bag_count REAL NOT NULL,
    total_weight_kg REAL NOT NULL,
    unit_price_original REAL NOT NULL DEFAULT 0,
    line_amount_original REAL NOT NULL DEFAULT 0,
    fx_rate_to_krw REAL NOT NULL DEFAULT 1,
    line_amount_krw REAL NOT NULL DEFAULT 0,
    landed_cost_krw REAL NOT NULL DEFAULT 0,
    received_weight_kg REAL NOT NULL DEFAULT 0,
    storage_location TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(import_id) REFERENCES pink_salt_imports(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS pink_salt_import_payments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_id INTEGER NOT NULL,
    payment_date TEXT NOT NULL,
    original_currency TEXT NOT NULL DEFAULT 'KRW',
    original_amount REAL NOT NULL,
    fx_rate_to_krw REAL NOT NULL DEFAULT 1,
    krw_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'Bank',
    reference TEXT NOT NULL,
    receipt_file TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(import_id) REFERENCES pink_salt_imports(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS pink_salt_import_costs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_id INTEGER NOT NULL,
    cost_date TEXT NOT NULL,
    cost_type TEXT NOT NULL,
    original_currency TEXT NOT NULL DEFAULT 'KRW',
    original_amount REAL NOT NULL,
    fx_rate_to_krw REAL NOT NULL DEFAULT 1,
    krw_amount REAL NOT NULL,
    allocation_method TEXT NOT NULL DEFAULT 'Weight',
    reference TEXT DEFAULT '',
    receipt_file TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(import_id) REFERENCES pink_salt_imports(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS pink_salt_raw_stock_movements(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    import_item_id INTEGER NOT NULL,
    movement_date TEXT NOT NULL,
    movement_type TEXT NOT NULL,
    quantity_kg REAL NOT NULL,
    reference_type TEXT DEFAULT '',
    reference_id INTEGER,
    reference TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(import_item_id) REFERENCES pink_salt_import_items(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_packaging_items(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Pouch / Bag',
    unit TEXT DEFAULT 'pcs',
    supplier_name TEXT DEFAULT '',
    reorder_level REAL NOT NULL DEFAULT 0,
    last_unit_cost_krw REAL NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_unit_id,sku),
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_packaging_movements(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    packaging_item_id INTEGER NOT NULL,
    movement_date TEXT NOT NULL,
    movement_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_cost_krw REAL NOT NULL DEFAULT 0,
    reference_type TEXT DEFAULT '',
    reference_id INTEGER,
    reference TEXT DEFAULT '',
    receipt_file TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(packaging_item_id) REFERENCES pink_salt_packaging_items(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_products(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    salt_grade TEXT NOT NULL,
    pack_weight_g REAL NOT NULL,
    packaging_style TEXT DEFAULT 'Retail Pack',
    selling_price_krw REAL NOT NULL DEFAULT 0,
    reorder_level_units REAL NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_unit_id,sku),
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_bom_lines(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    packaging_item_id INTEGER NOT NULL,
    quantity_per_unit REAL NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    UNIQUE(product_id,packaging_item_id),
    FOREIGN KEY(product_id) REFERENCES pink_salt_products(id) ON DELETE CASCADE,
    FOREIGN KEY(packaging_item_id) REFERENCES pink_salt_packaging_items(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_gift_box_components(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    salt_grade TEXT NOT NULL,
    pouches_per_box REAL NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id,salt_grade),
    FOREIGN KEY(product_id) REFERENCES pink_salt_products(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS pink_salt_production_batches(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    batch_no TEXT NOT NULL UNIQUE,
    production_date TEXT NOT NULL,
    import_item_id INTEGER NOT NULL,
    input_weight_kg REAL NOT NULL,
    actual_output_weight_kg REAL NOT NULL DEFAULT 0,
    waste_weight_kg REAL NOT NULL DEFAULT 0,
    waste_reason TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Draft',
    notes TEXT DEFAULT '',
    completed_by INTEGER,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(import_item_id) REFERENCES pink_salt_import_items(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_production_outputs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_batch_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity_units REAL NOT NULL,
    output_weight_kg REAL NOT NULL,
    unit_cost_krw REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(production_batch_id) REFERENCES pink_salt_production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES pink_salt_products(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_production_inputs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_batch_id INTEGER NOT NULL,
    import_item_id INTEGER NOT NULL,
    salt_grade TEXT NOT NULL,
    input_weight_kg REAL NOT NULL,
    required_output_weight_kg REAL NOT NULL DEFAULT 0,
    waste_weight_kg REAL NOT NULL DEFAULT 0,
    raw_unit_cost_krw REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(production_batch_id) REFERENCES pink_salt_production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY(import_item_id) REFERENCES pink_salt_import_items(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_production_packaging(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_batch_id INTEGER NOT NULL,
    packaging_item_id INTEGER NOT NULL,
    quantity_used REAL NOT NULL,
    unit_cost_krw REAL NOT NULL DEFAULT 0,
    FOREIGN KEY(production_batch_id) REFERENCES pink_salt_production_batches(id) ON DELETE CASCADE,
    FOREIGN KEY(packaging_item_id) REFERENCES pink_salt_packaging_items(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_finished_stock_movements(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    production_batch_id INTEGER,
    movement_date TEXT NOT NULL,
    movement_type TEXT NOT NULL,
    quantity_units REAL NOT NULL,
    unit_cost_krw REAL NOT NULL DEFAULT 0,
    reference_type TEXT DEFAULT '',
    reference_id INTEGER,
    reference TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(product_id) REFERENCES pink_salt_products(id),
    FOREIGN KEY(production_batch_id) REFERENCES pink_salt_production_batches(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_waste(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    waste_date TEXT NOT NULL,
    waste_type TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    reason TEXT NOT NULL,
    estimated_cost_krw REAL NOT NULL DEFAULT 0,
    attachment_file TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_customers(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    customer_type TEXT DEFAULT 'Ecommerce',
    sales_channel TEXT DEFAULT '',
    contact_person TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_orders(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    order_no TEXT NOT NULL UNIQUE,
    order_date TEXT NOT NULL,
    customer_id INTEGER,
    customer_name TEXT DEFAULT '',
    sales_channel TEXT NOT NULL,
    order_type TEXT DEFAULT 'Retail',
    payment_method TEXT DEFAULT 'Bank',
    payment_status TEXT DEFAULT 'Paid',
    reference TEXT DEFAULT '',
    subtotal_krw REAL NOT NULL DEFAULT 0,
    discount_krw REAL NOT NULL DEFAULT 0,
    delivery_fee_krw REAL NOT NULL DEFAULT 0,
    platform_fee_krw REAL NOT NULL DEFAULT 0,
    total_krw REAL NOT NULL DEFAULT 0,
    cost_total_krw REAL NOT NULL DEFAULT 0,
    gross_profit_krw REAL NOT NULL DEFAULT 0,
    prepaid_applied_krw REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft',
    completed_at TEXT,
    receipt_file TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(customer_id) REFERENCES pink_salt_customers(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_order_items(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity_units REAL NOT NULL,
    unit_price_krw REAL NOT NULL,
    line_total_krw REAL NOT NULL,
    unit_cost_krw REAL NOT NULL DEFAULT 0,
    line_cost_krw REAL NOT NULL DEFAULT 0,
    FOREIGN KEY(order_id) REFERENCES pink_salt_orders(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES pink_salt_products(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_customer_payments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    customer_id INTEGER,
    payment_date TEXT NOT NULL,
    payment_role TEXT NOT NULL DEFAULT 'Sale Payment',
    original_currency TEXT NOT NULL DEFAULT 'KRW',
    original_amount REAL NOT NULL,
    fx_rate_to_krw REAL NOT NULL DEFAULT 1,
    krw_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'Bank',
    reference TEXT NOT NULL,
    receipt_file TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Active',
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(order_id) REFERENCES pink_salt_orders(id) ON DELETE CASCADE,
    FOREIGN KEY(customer_id) REFERENCES pink_salt_customers(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_customer_refunds(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    customer_id INTEGER,
    refund_date TEXT NOT NULL,
    original_currency TEXT NOT NULL DEFAULT 'KRW',
    original_amount REAL NOT NULL,
    fx_rate_to_krw REAL NOT NULL DEFAULT 1,
    krw_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'Bank',
    reference TEXT NOT NULL,
    receipt_file TEXT DEFAULT '',
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(order_id) REFERENCES pink_salt_orders(id) ON DELETE CASCADE,
    FOREIGN KEY(customer_id) REFERENCES pink_salt_customers(id)
  );
  CREATE TABLE IF NOT EXISTS pink_salt_attachments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT DEFAULT '',
    size_bytes INTEGER NOT NULL DEFAULT 0,
    uploaded_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
  );
  CREATE INDEX IF NOT EXISTS idx_ps_import_items_import ON pink_salt_import_items(import_id);
  CREATE INDEX IF NOT EXISTS idx_ps_raw_item ON pink_salt_raw_stock_movements(import_item_id);
  CREATE INDEX IF NOT EXISTS idx_ps_packaging_item ON pink_salt_packaging_movements(packaging_item_id);
  CREATE INDEX IF NOT EXISTS idx_ps_finished_product ON pink_salt_finished_stock_movements(product_id);
  CREATE INDEX IF NOT EXISTS idx_ps_orders_bu ON pink_salt_orders(business_unit_id);
  CREATE INDEX IF NOT EXISTS idx_ps_customer_payments_order ON pink_salt_customer_payments(order_id,status);
  CREATE INDEX IF NOT EXISTS idx_ps_customer_refunds_order ON pink_salt_customer_refunds(order_id,status);
  CREATE INDEX IF NOT EXISTS idx_ps_attach_entity ON pink_salt_attachments(entity_type,entity_id);
  `);
  ensureColumn('pink_salt_imports','received_at','TEXT');
  ensureColumn('pink_salt_imports','invoice_fx_rate_to_krw','REAL NOT NULL DEFAULT 1');
  ensureColumn('pink_salt_orders','prepaid_applied_krw','REAL NOT NULL DEFAULT 0');
  ensureColumn('pink_salt_orders','completed_at','TEXT');
  ensureColumn('pink_salt_import_costs','payment_method',"TEXT DEFAULT 'Bank'");
  ensureColumn('pink_salt_packaging_movements','payment_method',"TEXT DEFAULT 'Bank'");
  ensureColumn('pink_salt_products','gift_pouch_weight_g','REAL NOT NULL DEFAULT 0');
  try{db.prepare("UPDATE pink_salt_imports SET received_at=COALESCE(received_at,updated_at,created_at) WHERE status='Received' AND received_at IS NULL").run();db.prepare("UPDATE pink_salt_orders SET completed_at=COALESCE(completed_at,updated_at,created_at) WHERE status='Completed' AND completed_at IS NULL").run()}catch(e){console.error('V30.3 date migration:',e.message)}
  try{
    db.prepare(`INSERT INTO pink_salt_production_inputs(production_batch_id,import_item_id,salt_grade,input_weight_kg,required_output_weight_kg,waste_weight_kg,raw_unit_cost_krw)
      SELECT b.id,b.import_item_id,x.salt_grade,b.input_weight_kg,b.actual_output_weight_kg,b.waste_weight_kg,
             CASE WHEN x.received_weight_kg>0 THEN x.landed_cost_krw/x.received_weight_kg ELSE 0 END
      FROM pink_salt_production_batches b JOIN pink_salt_import_items x ON x.id=b.import_item_id
      WHERE NOT EXISTS(SELECT 1 FROM pink_salt_production_inputs pi WHERE pi.production_batch_id=b.id)`).run();
  }catch(e){console.error('V30.6 production-input migration:',e.message)}

  const pinkUnit=()=>db.prepare("SELECT id FROM business_units WHERE name='Pink Salt' AND status!='Archived'").get()?.id||null;
  function guard(req,res){const p=Number(pinkUnit()||0);if(!p){res.status(409).json({error:'Pink Salt business unit is not available.'});return null}const current=Number(currentUnit(req)||0);if(!current||current!==p||!enforceUnit(req,p)){res.status(403).json({error:'Select the Pink Salt business unit to use this workspace.'});return null}return p}
  function requireEntity(table,id,businessUnitId,extra=''){const row=db.prepare(`SELECT * FROM ${table} WHERE id=?${extra?` AND ${extra}`:''}`).get(Number(id),...(extra?[businessUnitId]:[]));return row||null}
  function rawBalance(importItemId){return Number(db.prepare('SELECT COALESCE(SUM(quantity_kg),0) q FROM pink_salt_raw_stock_movements WHERE import_item_id=?').get(importItemId)?.q||0)}
  function packBalance(id){return Number(db.prepare("SELECT COALESCE(SUM(quantity),0) q FROM pink_salt_packaging_movements WHERE packaging_item_id=? AND COALESCE(status,'Active')!='Voided'").get(id)?.q||0)}
  function finishedBalance(id){return Number(db.prepare('SELECT COALESCE(SUM(quantity_units),0) q FROM pink_salt_finished_stock_movements WHERE product_id=?').get(id)?.q||0)}
  function finishedReserved(id,excludeOrderId=null){let sql="SELECT COALESCE(SUM(oi.quantity_units),0) q FROM pink_salt_order_items oi JOIN pink_salt_orders o ON o.id=oi.order_id WHERE oi.product_id=? AND o.status='Reserved'",args=[id];if(excludeOrderId){sql+=' AND o.id<>?';args.push(excludeOrderId)}return Number(db.prepare(sql).get(...args)?.q||0)}
  function finishedAvailable(id,excludeOrderId=null){return Math.max(0,finishedBalance(id)-finishedReserved(id,excludeOrderId))}
  function weightedProductCost(id){const r=db.prepare("SELECT COALESCE(SUM(CASE WHEN quantity_units>0 THEN quantity_units*unit_cost_krw ELSE 0 END),0) cost,COALESCE(SUM(CASE WHEN quantity_units>0 THEN quantity_units ELSE 0 END),0) qty FROM pink_salt_finished_stock_movements WHERE product_id=? AND movement_type='Production Output'").get(id);return Number(r?.qty||0)>0?Number(r.cost||0)/Number(r.qty):0}
  function giftComponents(productId){return db.prepare('SELECT * FROM pink_salt_gift_box_components WHERE product_id=? ORDER BY id').all(Number(productId))}
  function productPouchCount(productId){
    const rows=db.prepare(`SELECT b.quantity_per_unit,p.category FROM pink_salt_bom_lines b JOIN pink_salt_packaging_items p ON p.id=b.packaging_item_id WHERE b.product_id=?`).all(Number(productId));
    return rows.filter(x=>text(x.category)==='Pouch / Bag').reduce((n,x)=>n+num(x.quantity_per_unit),0);
  }
  function productSaltRequirements(product,quantity){
    return calculateSaltRequirements({
      packagingStyle:product.packaging_style,
      saltGrade:product.salt_grade,
      packWeightG:product.pack_weight_g,
      giftPouchWeightG:product.gift_pouch_weight_g,
      giftComponents:giftComponents(product.id),
      pouchCount:product.packaging_style==='Bulk Pack'?productPouchCount(product.id):0,
      quantityUnits:quantity
    });
  }
  function validateProductDefinition(bu,body,existing=null){
    const style=text(body.packaging_style??existing?.packaging_style)||'Retail Pack',isGift=style==='Gift Box / Set';
    const rawComponents=Array.isArray(body.gift_components)?body.gift_components:json(body.gift_components),components=[];
    if(isGift){
      for(const c of Array.isArray(rawComponents)?rawComponents:[]){
        const grade=text(c.salt_grade),count=num(c.pouches_per_box);
        if(grade&&count>0){if(!Number.isInteger(count))throw new Error('Gift-box pouches per category must be a whole number.');components.push({salt_grade:grade,pouches_per_box:count})}
      }
      if(!components.length)throw new Error('A gift box requires at least one salt category.');
      const unique=new Set(components.map(x=>x.salt_grade.toLowerCase()));
      if(unique.size!==components.length)throw new Error('Each gift-box salt category can only be added once.');
    }
    const pouchWeight=isGift?num(body.gift_pouch_weight_g??existing?.gift_pouch_weight_g):0,totalPouches=components.reduce((n,x)=>n+x.pouches_per_box,0);
    if(isGift&&totalPouches<=1)throw new Error('A gift box must contain more than one pouch.');
    if(isGift&&pouchWeight<=0)throw new Error('Gift-box pouch weight is required and applies equally to every salt category.');
    const packWeight=isGift?pouchWeight*totalPouches:num(body.pack_weight_g??existing?.pack_weight_g);
    const grade=isGift?(components.length===1?components[0].salt_grade:'Mixed Gift Box'):text(body.salt_grade??existing?.salt_grade);
    if(!grade||packWeight<=0)throw new Error('Salt category and pack weight are required.');
    const rawBom=Array.isArray(body.bom)?body.bom:json(body.bom),bom=(Array.isArray(rawBom)?rawBom:[]).filter(x=>num(x.packaging_item_id)&&num(x.quantity_per_unit)>0).map(x=>{const quantity=num(x.quantity_per_unit);if(!Number.isInteger(quantity))throw new Error('Packing recipe quantities must be whole numbers.');return {packaging_item_id:num(x.packaging_item_id),quantity_per_unit:quantity,notes:text(x.notes)}});
    const packagingById=new Map();
    for(const b of bom){
      const p=db.prepare('SELECT * FROM pink_salt_packaging_items WHERE id=? AND business_unit_id=? AND active=1').get(b.packaging_item_id,bu);
      if(!p)throw new Error('Packing recipe contains an invalid or inactive packaging material.');
      packagingById.set(b.packaging_item_id,p);
    }
    if(isGift){
      let pouches=0,boxes=0;
      for(const b of bom){const p=packagingById.get(b.packaging_item_id);if(p.category==='Pouch / Bag')pouches+=b.quantity_per_unit;if(p.category==='Gift Box')boxes+=b.quantity_per_unit}
      if(pouches+1e-6<totalPouches)throw new Error(`Gift-box BOM needs at least ${totalPouches} pouch units per box.`);
      if(boxes+1e-6<1)throw new Error('Gift-box BOM needs at least one Gift Box packaging unit per box.');
    }
    return {style,components,pouchWeight,totalPouches,packWeight,grade,bom};
  }
  function importLandedRecalc(importId){
    const imp=db.prepare('SELECT * FROM pink_salt_imports WHERE id=?').get(importId);if(!imp)return;
    const items=db.prepare('SELECT * FROM pink_salt_import_items WHERE import_id=? ORDER BY id').all(importId),shared=Number(db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_import_costs WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").get(importId)?.v||0),weight=items.reduce((n,x)=>n+Number(x.total_weight_kg||0),0);
    const st=db.prepare('UPDATE pink_salt_import_items SET landed_cost_krw=? WHERE id=?');
    for(const item of items){const base=Number(item.line_amount_krw||0),alloc=weight>0?shared*(Number(item.total_weight_kg||0)/weight):0;st.run(base+alloc,item.id)}
  }
  function attachCentralDoc(bu,user,file,title,category='Pink Salt'){
    try{const cols=db.prepare('PRAGMA table_info(documents)').all().map(x=>x.name);const hasWorkflow=cols.includes('workflow_status');const sql=hasWorkflow?'INSERT INTO documents(title,category,version,business_unit_id,file_path,approved,uploaded_by,workflow_status) VALUES(?,?,?,?,?,?,?,?)':'INSERT INTO documents(title,category,version,business_unit_id,file_path,approved,uploaded_by) VALUES(?,?,?,?,?,?,?)';const args=[title,category,'1.0',bu,file.filename,0,user.id];if(hasWorkflow)args.push('Draft');return Number(db.prepare(sql).run(...args).lastInsertRowid)}catch(_){return null}
  }
  function saveAttachment(bu,user,entityType,entityId,file,title){if(!file)return null;const r=db.prepare('INSERT INTO pink_salt_attachments(business_unit_id,entity_type,entity_id,title,original_name,file_path,mime_type,size_bytes,uploaded_by) VALUES(?,?,?,?,?,?,?,?,?)').run(bu,entityType,entityId,title||file.originalname,file.originalname,'/uploads/'+file.filename,file.mimetype||'',file.size||0,user.id);attachCentralDoc(bu,user,file,title||file.originalname,'Pink Salt');return Number(r.lastInsertRowid)}
  function attachments(entityType,entityId){return db.prepare('SELECT a.*,u.name uploaded_by_name FROM pink_salt_attachments a LEFT JOIN users u ON u.id=a.uploaded_by WHERE entity_type=? AND entity_id=? ORDER BY a.id DESC').all(entityType,Number(entityId))}

  // V30.3 — Pink Salt action state, notifications and payment-gated receiving.
  function importFinancialState(importId){
    const imp=db.prepare('SELECT * FROM pink_salt_imports WHERE id=?').get(Number(importId));if(!imp)return null;
    const totals=db.prepare('SELECT COALESCE(SUM(line_amount_original),0) original,COALESCE(SUM(line_amount_krw),0) krw FROM pink_salt_import_items WHERE import_id=?').get(imp.id);
    const paid=db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_import_payments WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").get(imp.id)?.v||0;
    const allocated=db.prepare("SELECT COALESCE(SUM(amount_krw),0) v FROM pink_salt_supplier_advance_allocations WHERE import_id=? AND COALESCE(status,'Active')='Active'").get(imp.id)?.v||0;
    const purchaseKrw=num(totals?.krw),cashPaidKrw=num(paid),advanceAllocatedKrw=num(allocated),paidKrw=cashPaidKrw+advanceAllocatedKrw,outstanding=Math.max(0,purchaseKrw-paidKrw);
    let paymentStatus=paidKrw<=0?'Unpaid':outstanding<=0.01?'Fully Paid / Ready to Receive':'Partially Paid';
    return {purchase_original:num(totals?.original),purchase_krw:purchaseKrw,cash_paid_krw:cashPaidKrw,advance_allocated_krw:advanceAllocatedKrw,paid_krw:paidKrw,outstanding_krw:outstanding,payment_status:paymentStatus,ready_to_receive:outstanding<=0.01&&purchaseKrw>0};
  }
  function pinkRecipients(businessUnitId,{finance=false,managers=true,staff=false}={}){
    const roles=[];if(managers)roles.push('CEO / Owner','Business Unit Manager','Operations Manager');if(finance)roles.push('Finance / Admin');if(staff)roles.push('Sales / Business Development','Staff Member');
    const unique=[...new Set(roles)];if(!unique.length)return[];
    const marks=unique.map(()=>'?').join(',');return db.prepare(`SELECT id FROM users WHERE active=1 AND role IN (${marks}) AND (role='CEO / Owner' OR business_unit_id=?)`).all(...unique,Number(businessUnitId)).map(x=>Number(x.id));
  }
  function notifyPink(businessUnitId,level,title,message,entityType='',entityId=null,actionView='dashboard',options={}){
    for(const uid of pinkRecipients(businessUnitId,options)){try{notify(uid,level,title,message,businessUnitId,entityType,entityId,actionView,entityId)}catch(_){}}
  }
  function notifyPinkOnce(businessUnitId,level,title,message,entityType='',entityId=null,actionView='dashboard',options={}){
    for(const uid of pinkRecipients(businessUnitId,options)){try{const exists=db.prepare("SELECT 1 FROM notifications WHERE user_id=? AND title=? AND message=? AND COALESCE(business_unit_id,0)=COALESCE(?,0) AND read_at IS NULL LIMIT 1").get(uid,title,message,businessUnitId);if(!exists)notify(uid,level,title,message,businessUnitId,entityType,entityId,actionView,entityId)}catch(_){}}
  }
  function checkPackagingLowStock(packagingItemId){const x=db.prepare(`SELECT p.*,COALESCE(SUM(CASE WHEN COALESCE(m.status,'Active')!='Voided' THEN m.quantity ELSE 0 END),0) available FROM pink_salt_packaging_items p LEFT JOIN pink_salt_packaging_movements m ON m.packaging_item_id=p.id WHERE p.id=? GROUP BY p.id`).get(Number(packagingItemId));if(!x||!x.active||num(x.reorder_level)<=0||num(x.available)>num(x.reorder_level))return;notifyPinkOnce(x.business_unit_id,num(x.available)<=0?'critical':'warning',num(x.available)<=0?'Pink Salt packaging out of stock':'Pink Salt packaging low stock',`${x.sku} · ${x.name}: ${num(x.available).toLocaleString()} ${x.unit} available (reorder level ${num(x.reorder_level).toLocaleString()}).`,'pink_salt_packaging',x.id,'psPackaging',{finance:false,managers:true,staff:true})}
  function checkFinishedLowStock(productId){const p=db.prepare('SELECT * FROM pink_salt_products WHERE id=?').get(Number(productId));if(!p||!p.active||num(p.reorder_level_units)<=0)return;const available=finishedAvailable(p.id);if(available>num(p.reorder_level_units))return;notifyPinkOnce(p.business_unit_id,available<=0?'critical':'warning',available<=0?'Pink Salt finished product out of stock':'Pink Salt finished product low stock',`${p.sku} · ${p.name}: ${available.toLocaleString()} available (reorder level ${num(p.reorder_level_units).toLocaleString()}).`,'pink_salt_product',p.id,'psFinished',{finance:false,managers:true,staff:true})}


  // V30.1 — Pink Salt Finance + Accounting integration.
  // Operational users enter the transaction once in Pink Salt; Finance and Accounting are synchronized here.
  function flushAccounting(){try{accounting?.processQueue?.(1000)}catch(e){console.error('Pink Salt accounting queue:',e.message)}}
  function syncPinkFinance(data){if(typeof financeSync!=='function')return null;const id=financeSync(data);flushAccounting();return id}
  function voidPinkFinance(sourceType,sourceId,reason,userId,businessUnitId){if(typeof voidFinanceBySource!=='function')return 0;const n=voidFinanceBySource(sourceType,sourceId,reason,userId,businessUnitId);flushAccounting();return n}
  function activeJournal(sourceType,sourceId){return db.prepare("SELECT * FROM accounting_journal_entries WHERE source_type=? AND source_id=? AND status IN ('Pending Review','Correction Required','Posted') ORDER BY id DESC LIMIT 1").get(sourceType,Number(sourceId))}
  function postOperationalJournal({businessUnitId,transactionDate,sourceType,sourceId,sourceLabel,description,createdBy,lines}){
    if(!accounting?.postJournal||!lines?.length)return null;
    // V30.18: a pending proposal is already the active accounting representation.
    // Do not create a second proposal while the first one is waiting in Posting Control.
    const existing=activeJournal(sourceType,sourceId);if(existing)return existing.id;
    if(accounting.isPeriodClosed?.(businessUnitId,transactionDate))throw new Error('This accounting period is closed. Reopen the period before posting this Pink Salt transaction.');
    return accounting.postJournal({businessUnitId,transactionDate,sourceType,sourceId,sourceLabel,description,createdBy,lines});
  }
  function importTotals(importId){const r=db.prepare('SELECT COALESCE(SUM(line_amount_original),0) original,COALESCE(SUM(line_amount_krw),0) krw FROM pink_salt_import_items WHERE import_id=?').get(importId);return {original:num(r?.original),krw:num(r?.krw)}}
  function activePayments(orderId){return db.prepare("SELECT * FROM pink_salt_customer_payments WHERE order_id=? AND status='Active' ORDER BY payment_date,id").all(Number(orderId))}
  function activeRefunds(orderId){return db.prepare("SELECT * FROM pink_salt_customer_refunds WHERE order_id=? AND status='Active' ORDER BY refund_date,id").all(Number(orderId))}
  function orderFinancials(orderId){const o=db.prepare('SELECT * FROM pink_salt_orders WHERE id=?').get(Number(orderId));if(!o)return null;const payments=activePayments(o.id),refunds=activeRefunds(o.id),paid=payments.reduce((n,x)=>n+num(x.krw_amount),0),refunded=refunds.reduce((n,x)=>n+num(x.krw_amount),0),net=Math.max(0,paid-refunded),outstanding=o.status==='Cancelled'?0:Math.max(0,num(o.total_krw)-net),credit=o.status==='Cancelled'?Math.max(0,net):Math.max(0,net-num(o.total_krw));return {...o,payments,refunds,paid_krw:paid,refunded_krw:refunded,net_paid_krw:net,outstanding_krw:outstanding,customer_credit_krw:credit}}
  function refreshOrderPaymentStatus(orderId){const x=orderFinancials(orderId);if(!x)return null;let status='Pending';if(x.status==='Cancelled')status=x.net_paid_krw<=0?'Refunded':x.refunded_krw>0?'Partially Refunded':'Credit Held';else if(x.net_paid_krw+0.005>=num(x.total_krw))status='Paid';else if(x.net_paid_krw>0)status='Partially Paid';db.prepare('UPDATE pink_salt_orders SET payment_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status,x.id);return status}
  // Import initiation is an operational commitment, not a Finance cash/payment row.
  function postImportCommitmentJournal(importId){const imp=db.prepare('SELECT * FROM pink_salt_imports WHERE id=?').get(Number(importId));if(!imp)return null;const total=importTotals(imp.id);if(total.krw<=0)return null;return postOperationalJournal({businessUnitId:imp.business_unit_id,transactionDate:imp.purchase_date||today(),sourceType:'Pink Salt Import Commitment',sourceId:imp.id,sourceLabel:`Pink Salt Import Commitment · ${imp.import_no}`,description:'Recognize Pink Salt purchase commitment and supplier payable without creating a Finance payment entry.',createdBy:imp.created_by,lines:[{account_id:accounting.accountId('PINK_SALT_IN_TRANSIT'),debit_krw:total.krw,credit_krw:0,original_amount:total.original||total.krw,original_currency:imp.invoice_currency||'KRW',fx_rate:num(imp.invoice_fx_rate_to_krw)||1,entity_type:'Pink Salt Import',entity_id:imp.id,memo:`Import commitment · ${imp.import_no}`},{account_id:accounting.accountId('ACCOUNTS_PAYABLE'),debit_krw:0,credit_krw:total.krw,original_amount:total.original||total.krw,original_currency:imp.invoice_currency||'KRW',fx_rate:num(imp.invoice_fx_rate_to_krw)||1,entity_type:'Pink Salt Supplier',entity_id:imp.supplier_id||null,memo:`Supplier payable · ${imp.supplier_name||''}`}]})}
  function migrateLegacyImportPurchaseFinance(){try{const rows=db.prepare("SELECT id,source_id,business_unit_id FROM finance_entries WHERE source_type='Pink Salt Import Purchase' AND status!='Voided'").all();for(const f of rows){db.prepare("UPDATE finance_entries SET status='Voided',void_reason='V30.3: import initiation is not a Finance payment',voided_at=CURRENT_TIMESTAMP WHERE id=?").run(f.id);try{db.prepare("INSERT INTO accounting_sync_queue(finance_entry_id,queued_at) VALUES(?,CURRENT_TIMESTAMP) ON CONFLICT(finance_entry_id) DO UPDATE SET queued_at=CURRENT_TIMESTAMP").run(f.id)}catch(_){}}flushAccounting();for(const i of db.prepare('SELECT id FROM pink_salt_imports').all())postImportCommitmentJournal(i.id)}catch(e){console.error('V30.3 import Finance migration:',e.message)}}
  function syncImportPayment(paymentId){const p=db.prepare(`SELECT p.*,i.business_unit_id,i.import_no,i.supplier_name FROM pink_salt_import_payments p JOIN pink_salt_imports i ON i.id=p.import_id WHERE p.id=?`).get(Number(paymentId));if(!p||String(p.status||'Active')==='Voided')return null;return syncPinkFinance({businessUnitId:p.business_unit_id,type:'Payment',category:'Pink Salt Supplier Payment',amount:p.krw_amount,description:`Supplier payment · ${p.import_no} · ${p.supplier_name||''}`,paymentMethod:p.payment_method,reference:p.reference,createdBy:p.created_by,sourceType:'Pink Salt Import Payment',sourceId:p.id,receiptFile:p.receipt_file,originalAmount:p.original_amount,originalCurrency:p.original_currency,fxRate:p.fx_rate_to_krw,transactionDate:p.payment_date,sourceLabel:`Pink Salt Supplier Payment · ${p.import_no}`,sourceRecordId:p.import_id,sourcePaymentId:p.id})}
  function syncImportCost(costId){const c=db.prepare(`SELECT c.*,i.business_unit_id,i.import_no FROM pink_salt_import_costs c JOIN pink_salt_imports i ON i.id=c.import_id WHERE c.id=?`).get(Number(costId));if(!c||String(c.status||'Active')==='Voided')return null;return syncPinkFinance({businessUnitId:c.business_unit_id,type:'Inventory Cost',category:`Pink Salt Import Cost · ${c.cost_type}`,amount:c.krw_amount,description:`${c.cost_type} · ${c.import_no}`,paymentMethod:c.payment_method||'Bank',reference:c.reference,createdBy:c.created_by,sourceType:'Pink Salt Import Cost',sourceId:c.id,receiptFile:c.receipt_file,originalAmount:c.original_amount,originalCurrency:c.original_currency,fxRate:c.fx_rate_to_krw,transactionDate:c.cost_date,sourceLabel:`Pink Salt Import Cost · ${c.cost_type}`,sourceRecordId:c.import_id,sourcePaymentId:c.id})}
  function syncPackagingPurchase(movementId){const m=db.prepare(`SELECT m.*,p.sku,p.name FROM pink_salt_packaging_movements m JOIN pink_salt_packaging_items p ON p.id=m.packaging_item_id WHERE m.id=?`).get(Number(movementId));if(!m||m.movement_type!=='Purchase Receipt'||String(m.status||'Active')==='Voided')return null;const amount=Math.max(0,num(m.quantity)*num(m.unit_cost_krw));if(!amount)return null;return syncPinkFinance({businessUnitId:m.business_unit_id,type:'Inventory',category:'Pink Salt Packaging Purchase',amount,description:`Packaging material payable · ${m.sku} · ${m.name}`,paymentMethod:'Supplier Payable',reference:m.reference||m.sku,createdBy:m.created_by,sourceType:'Pink Salt Packaging Purchase',sourceId:m.id,receiptFile:m.receipt_file,transactionDate:m.movement_date,sourceLabel:`Pink Salt Packaging · ${m.sku}`,sourceRecordId:m.packaging_item_id,sourcePaymentId:m.id})}
  function supplierHasCategoryV315(supplier,type){const cats=json(supplier?.supplier_categories_json);return Array.isArray(cats)&&cats.includes(type)}
  function supplierAdvanceAvailableV315(supplierId){try{const advances=num(db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_supplier_advances WHERE supplier_id=? AND status='Active'").get(supplierId)?.v),imports=num(db.prepare("SELECT COALESCE(SUM(amount_krw),0) v FROM pink_salt_supplier_advance_allocations WHERE supplier_id=? AND status='Active'").get(supplierId)?.v),pack=num(db.prepare("SELECT COALESCE(SUM(amount_krw),0) v FROM pink_salt_supplier_packaging_allocations WHERE supplier_id=? AND status='Active'").get(supplierId)?.v),refunds=num(db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_supplier_advance_refunds WHERE supplier_id=? AND status='Active'").get(supplierId)?.v);return Math.max(0,advances-imports-pack-refunds)}catch(_){return 0}}
  function advanceAvailableV315(advanceId){try{const a=db.prepare("SELECT krw_amount FROM pink_salt_supplier_advances WHERE id=? AND status='Active'").get(advanceId);if(!a)return 0;const imports=num(db.prepare("SELECT COALESCE(SUM(amount_krw),0) v FROM pink_salt_supplier_advance_allocations WHERE advance_id=? AND status='Active'").get(advanceId)?.v),pack=num(db.prepare("SELECT COALESCE(SUM(amount_krw),0) v FROM pink_salt_supplier_packaging_allocations WHERE advance_id=? AND status='Active'").get(advanceId)?.v);return Math.max(0,num(a.krw_amount)-imports-pack)}catch(_){return 0}}
  function allocatePackagingCreditV315({bu,supplier,movement,amount,date,user}){let remaining=Math.max(0,num(amount)),allocated=0;if(remaining<=.005)return 0;const advances=db.prepare("SELECT * FROM pink_salt_supplier_advances WHERE supplier_id=? AND status='Active' ORDER BY advance_date,id").all(supplier.id);for(const adv of advances){const take=Math.min(remaining,advanceAvailableV315(adv.id));if(take<=.005)continue;const aid=Number(db.prepare("INSERT INTO pink_salt_supplier_packaging_allocations(advance_id,packaging_movement_id,supplier_id,amount_krw,allocation_date,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?)").run(adv.id,movement.id,supplier.id,take,date,`Auto allocation · ${movement.reference||movement.id}`,'Applied automatically when packaging stock was received',user.id).lastInsertRowid);if(accounting?.postJournal){const jid=accounting.postJournal({businessUnitId:bu,transactionDate:date,sourceType:'Pink Salt Supplier Packaging Allocation',sourceId:aid,sourceLabel:`Packaging Allocation · ${movement.reference||movement.id}`,description:'Apply supplier payment/advance balance against packaging-material accounts payable.',createdBy:user.id,lines:[{account_id:accounting.accountId('ACCOUNTS_PAYABLE'),debit_krw:take,credit_krw:0,entity_type:'Pink Salt Supplier',entity_id:supplier.id,memo:`Packaging payable settled · ${movement.reference||movement.id}`},{account_id:accounting.accountId('PINK_SALT_SUPPLIER_ADVANCES'),debit_krw:0,credit_krw:take,entity_type:'Pink Salt Supplier',entity_id:supplier.id,memo:`Supplier balance applied · ${adv.reference}`} ]});db.prepare('UPDATE pink_salt_supplier_packaging_allocations SET journal_entry_id=? WHERE id=?').run(jid,aid)}remaining-=take;allocated+=take;if(remaining<=.005)break}return allocated}
  function syncOrderSale(orderId){const o=db.prepare('SELECT * FROM pink_salt_orders WHERE id=?').get(Number(orderId));if(!o||o.status!=='Completed')return null;const saleId=syncPinkFinance({businessUnitId:o.business_unit_id,type:'Revenue',category:'Pink Salt Sales',amount:o.total_krw,description:`Pink Salt sale · ${o.order_no} · ${o.customer_name||''}`,paymentMethod:o.payment_method||'Receivable',reference:o.reference||o.order_no,createdBy:o.created_by,sourceType:'Pink Salt Sale',sourceId:o.id,receiptFile:o.receipt_file,transactionDate:o.order_date,sourceLabel:`Pink Salt Sale · ${o.order_no}`,sourceRecordId:o.id});if(num(o.platform_fee_krw)>0)syncPinkFinance({businessUnitId:o.business_unit_id,type:'Expense',category:'Marketplace / Platform Fees',amount:o.platform_fee_krw,description:`${o.sales_channel||'Sales channel'} fee · ${o.order_no}`,paymentMethod:o.payment_method||'Marketplace Settlement',reference:o.reference||o.order_no,createdBy:o.created_by,sourceType:'Pink Salt Platform Fee',sourceId:o.id,receiptFile:o.receipt_file,transactionDate:o.order_date,sourceLabel:`Pink Salt Platform Fee · ${o.order_no}`,sourceRecordId:o.id});return saleId}
  function syncCustomerPayment(paymentId){const p=db.prepare(`SELECT p.*,o.business_unit_id,o.order_no,o.customer_name FROM pink_salt_customer_payments p JOIN pink_salt_orders o ON o.id=p.order_id WHERE p.id=?`).get(Number(paymentId));if(!p||p.status!=='Active')return null;return syncPinkFinance({businessUnitId:p.business_unit_id,type:'Receipt',category:p.payment_role==='Advance'?'Pink Salt Customer Advance':'Pink Salt Customer Payment',amount:p.krw_amount,description:`${p.payment_role} · ${p.order_no} · ${p.customer_name||''}`,paymentMethod:p.payment_method,reference:p.reference,createdBy:p.created_by,sourceType:'Pink Salt Customer Payment',sourceId:p.id,receiptFile:p.receipt_file,originalAmount:p.original_amount,originalCurrency:p.original_currency,fxRate:p.fx_rate_to_krw,transactionDate:p.payment_date,sourceLabel:`Pink Salt ${p.payment_role} · ${p.order_no}`,sourceRecordId:p.order_id,sourcePaymentId:p.id})}
  function syncCustomerRefund(refundId){const r=db.prepare(`SELECT r.*,o.business_unit_id,o.order_no,o.customer_name FROM pink_salt_customer_refunds r JOIN pink_salt_orders o ON o.id=r.order_id WHERE r.id=?`).get(Number(refundId));if(!r||r.status!=='Active')return null;return syncPinkFinance({businessUnitId:r.business_unit_id,type:'Refund',category:'Pink Salt Customer Refund',amount:r.krw_amount,description:`Customer refund · ${r.order_no} · ${r.customer_name||''}`,paymentMethod:r.payment_method,reference:r.reference,createdBy:r.created_by,sourceType:'Pink Salt Customer Refund',sourceId:r.id,receiptFile:r.receipt_file,originalAmount:r.original_amount,originalCurrency:r.original_currency,fxRate:r.fx_rate_to_krw,transactionDate:r.refund_date,sourceLabel:`Pink Salt Refund · ${r.order_no}`,sourceRecordId:r.order_id,sourcePaymentId:r.id})}
  function wasteEstimatedCost(source,id,qty){if(source==='Raw Salt'){const x=db.prepare('SELECT landed_cost_krw,received_weight_kg FROM pink_salt_import_items WHERE id=?').get(id);return num(x?.received_weight_kg)>0?qty*num(x.landed_cost_krw)/num(x.received_weight_kg):0}if(source==='Finished Product')return qty*weightedProductCost(id);if(source==='Packaging'){const x=db.prepare('SELECT last_unit_cost_krw FROM pink_salt_packaging_items WHERE id=?').get(id);return qty*num(x?.last_unit_cost_krw)}return 0}
  function syncWaste(wasteId){const w=db.prepare('SELECT * FROM pink_salt_waste WHERE id=?').get(Number(wasteId));if(!w||w.source_type==='Production'||num(w.estimated_cost_krw)<=0)return null;return syncPinkFinance({businessUnitId:w.business_unit_id,type:'Expense',category:'Pink Salt Waste / Stock Loss',amount:w.estimated_cost_krw,description:`${w.waste_type} · ${w.reason}`,paymentMethod:'Non-cash Inventory Adjustment',reference:`PS-WASTE-${w.id}`,createdBy:w.created_by,sourceType:'Pink Salt Waste',sourceId:w.id,receiptFile:w.attachment_file,transactionDate:w.waste_date,sourceLabel:`Pink Salt Waste · #${w.id}`,sourceRecordId:w.source_id})}
  function postImportReceiptJournal(importId){const imp=db.prepare('SELECT * FROM pink_salt_imports WHERE id=?').get(Number(importId));if(!imp||imp.status!=='Received')return null;const purchase=importTotals(imp.id).krw,cutoff=imp.received_at||imp.updated_at||imp.actual_arrival||imp.created_at;const costs=num(db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_import_costs WHERE import_id=? AND created_at<=? AND COALESCE(status,'Active')!='Voided'").get(imp.id,cutoff)?.v),amount=purchase+costs;if(amount<=0)return null;return postOperationalJournal({businessUnitId:imp.business_unit_id,transactionDate:imp.actual_arrival||today(),sourceType:'Pink Salt Import Receipt',sourceId:imp.id,sourceLabel:`Pink Salt Import Receipt · ${imp.import_no}`,description:'Transfer received Pink Salt from inventory in transit to raw-salt inventory.',createdBy:imp.created_by,lines:[{account_id:accounting.accountId('PINK_SALT_RAW_INVENTORY'),debit_krw:amount,credit_krw:0,entity_type:'Pink Salt Import',entity_id:imp.id,memo:`Raw stock received · ${imp.import_no}`},{account_id:accounting.accountId('PINK_SALT_IN_TRANSIT'),debit_krw:0,credit_krw:amount,entity_type:'Pink Salt Import',entity_id:imp.id,memo:`Release inventory in transit · ${imp.import_no}`}]})}
  function postProductionJournal(batchId){
    const b=db.prepare('SELECT * FROM pink_salt_production_batches WHERE id=?').get(Number(batchId));
    if(!b||b.status!=='Completed')return null;
    const inputs=db.prepare(`SELECT pi.*,i.import_no FROM pink_salt_production_inputs pi JOIN pink_salt_import_items x ON x.id=pi.import_item_id JOIN pink_salt_imports i ON i.id=x.import_id WHERE pi.production_batch_id=? ORDER BY pi.id`).all(b.id);
    const rawCost=inputs.reduce((n,x)=>n+num(x.input_weight_kg)*num(x.raw_unit_cost_krw),0);
    const packCost=num(db.prepare('SELECT COALESCE(SUM(quantity_used*unit_cost_krw),0) v FROM pink_salt_production_packaging WHERE production_batch_id=?').get(b.id)?.v);
    const storedFinished=num(db.prepare('SELECT COALESCE(SUM(quantity_units*unit_cost_krw),0) v FROM pink_salt_production_outputs WHERE production_batch_id=?').get(b.id)?.v),consumed=rawCost+packCost,finished=Math.min(consumed,Math.max(0,storedFinished)),waste=Math.max(0,consumed-finished);
    if(consumed<=0)return null;
    const lines=[];
    if(finished)lines.push({account_id:accounting.accountId('PINK_SALT_FINISHED_INVENTORY'),debit_krw:finished,credit_krw:0,entity_type:'Pink Salt Production',entity_id:b.id,memo:`Finished stock produced · ${b.batch_no}`});
    if(waste)lines.push({account_id:accounting.accountId('PINK_SALT_WASTE_EXPENSE'),debit_krw:waste,credit_krw:0,entity_type:'Pink Salt Production',entity_id:b.id,memo:`Production / repacking loss · ${b.batch_no}`});
    for(const x of inputs){const cost=num(x.input_weight_kg)*num(x.raw_unit_cost_krw);if(cost)lines.push({account_id:accounting.accountId('PINK_SALT_RAW_INVENTORY'),debit_krw:0,credit_krw:cost,entity_type:'Pink Salt Import',entity_id:x.import_item_id,memo:`${x.salt_grade} raw salt consumed · ${x.import_no}`})}
    if(packCost)lines.push({account_id:accounting.accountId('PINK_SALT_PACKAGING_INVENTORY'),debit_krw:0,credit_krw:packCost,entity_type:'Pink Salt Production',entity_id:b.id,memo:`Packaging consumed · ${b.batch_no}`});
    return postOperationalJournal({businessUnitId:b.business_unit_id,transactionDate:b.production_date,sourceType:'Pink Salt Production',sourceId:b.id,sourceLabel:`Pink Salt Production · ${b.batch_no}`,description:'Repacking converts raw salt and packaging inventory into finished Pink Salt goods.',createdBy:b.completed_by||b.created_by,lines})
  }
  function postCancellationCreditJournal(orderId){const o=db.prepare('SELECT * FROM pink_salt_orders WHERE id=?').get(Number(orderId));if(!o||o.status!=='Cancelled')return null;const paid=num(db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_customer_payments WHERE order_id=? AND status='Active' AND payment_role='Sale Payment'").get(o.id)?.v),amount=Math.max(0,paid);if(amount<=0)return null;return postOperationalJournal({businessUnitId:o.business_unit_id,transactionDate:today(),sourceType:'Pink Salt Sale Cancellation Credit',sourceId:o.id,sourceLabel:`Pink Salt Cancellation Credit · ${o.order_no}`,description:'Reclassify customer payment from receivable credit to refundable customer advance after sale cancellation.',createdBy:o.created_by,lines:[{account_id:accounting.accountId('ACCOUNTS_RECEIVABLE'),debit_krw:amount,credit_krw:0,entity_type:'Pink Salt Customer',entity_id:o.customer_id||null,memo:`Clear credit receivable · ${o.order_no}`},{account_id:accounting.accountId('CUSTOMER_ADVANCES'),debit_krw:0,credit_krw:amount,entity_type:'Pink Salt Customer',entity_id:o.customer_id||null,memo:`Refundable customer credit · ${o.order_no}`}]})}
  function backfillPinkSaltFinance(){try{
    migrateLegacyImportPurchaseFinance();for(const i of db.prepare('SELECT * FROM pink_salt_imports').all()){postImportCommitmentJournal(i.id);if(i.status==='Received')postImportReceiptJournal(i.id)}
    for(const p of db.prepare("SELECT id FROM pink_salt_import_payments WHERE COALESCE(status,'Active')!='Voided'").all())syncImportPayment(p.id);
    for(const c of db.prepare("SELECT id FROM pink_salt_import_costs WHERE COALESCE(status,'Active')!='Voided'").all())syncImportCost(c.id);
    for(const m of db.prepare("SELECT id FROM pink_salt_packaging_movements WHERE movement_type='Purchase Receipt' AND COALESCE(status,'Active')!='Voided'").all())syncPackagingPurchase(m.id);
    for(const b of db.prepare("SELECT id FROM pink_salt_production_batches WHERE status='Completed'").all())postProductionJournal(b.id);
    for(const w of db.prepare("SELECT id FROM pink_salt_waste WHERE source_type!='Production'").all())syncWaste(w.id);
    for(const o of db.prepare("SELECT * FROM pink_salt_orders").all()){
      const existingPayment=db.prepare("SELECT id FROM pink_salt_customer_payments WHERE order_id=? AND status='Active' LIMIT 1").get(o.id);
      if(!existingPayment&&o.payment_status==='Paid'&&num(o.total_krw)>0&&text(o.reference)&&text(o.receipt_file)){db.prepare("INSERT INTO pink_salt_customer_payments(business_unit_id,order_id,customer_id,payment_date,payment_role,original_currency,original_amount,fx_rate_to_krw,krw_amount,payment_method,reference,receipt_file,status,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?, 'Active',?,?)").run(o.business_unit_id,o.id,o.customer_id||null,o.order_date||today(),o.status==='Reserved'?'Advance':'Sale Payment','KRW',o.total_krw,1,o.total_krw,o.payment_method||'Bank',o.reference,o.receipt_file,'Migrated from V30 order payment',o.created_by)}
      if(o.status==='Completed'){const advances=num(db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_customer_payments WHERE order_id=? AND status='Active' AND payment_role='Advance'").get(o.id)?.v);db.prepare('UPDATE pink_salt_orders SET prepaid_applied_krw=? WHERE id=?').run(Math.min(num(o.total_krw),advances),o.id);syncOrderSale(o.id)}
      if(o.status==='Cancelled')postCancellationCreditJournal(o.id);refreshOrderPaymentStatus(o.id)
    }
    for(const p of db.prepare("SELECT id FROM pink_salt_customer_payments WHERE status='Active'").all())syncCustomerPayment(p.id);
    for(const r of db.prepare("SELECT id FROM pink_salt_customer_refunds WHERE status='Active'").all())syncCustomerRefund(r.id);
    flushAccounting();
  }catch(e){console.error('V30.1 Pink Salt Finance backfill:',e.message)}}

  app.get('/api/pink-salt/dashboard',auth,allow('dashboard','inventory','purchases','sales','finance'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;
    const raw=db.prepare('SELECT COALESCE(SUM(quantity_kg),0) q FROM pink_salt_raw_stock_movements WHERE business_unit_id=?').get(bu).q;
    const finished=db.prepare('SELECT COALESCE(SUM(quantity_units),0) q,COALESCE(SUM(quantity_units*unit_cost_krw),0) v FROM pink_salt_finished_stock_movements WHERE business_unit_id=?').get(bu);
    const pack=db.prepare(`SELECT COUNT(*) c FROM (SELECT p.id,p.reorder_level,COALESCE(SUM(m.quantity),0) q FROM pink_salt_packaging_items p LEFT JOIN pink_salt_packaging_movements m ON m.packaging_item_id=p.id WHERE p.business_unit_id=? AND p.active=1 GROUP BY p.id HAVING p.reorder_level>0 AND q<=p.reorder_level)`).get(bu).c;
    const imports=db.prepare("SELECT COUNT(*) c FROM pink_salt_imports WHERE business_unit_id=? AND status NOT IN ('Received','Cancelled','Voided')").get(bu).c;
    const orders=db.prepare("SELECT COUNT(*) c FROM pink_salt_orders WHERE business_unit_id=? AND status NOT IN ('Completed','Cancelled')").get(bu).c,month=today().slice(0,7);
    const sales=db.prepare("SELECT COALESCE(SUM(total_krw),0) revenue,COALESCE(SUM(gross_profit_krw),0) gross FROM pink_salt_orders WHERE business_unit_id=? AND status='Completed' AND substr(order_date,1,7)=?").get(bu,month);
    const waste=db.prepare("SELECT COALESCE(SUM(CASE WHEN unit='kg' THEN quantity ELSE 0 END),0) kg,COALESCE(SUM(estimated_cost_krw),0) cost FROM pink_salt_waste WHERE business_unit_id=? AND substr(waste_date,1,7)=?").get(bu,month);
    const top=db.prepare(`SELECT p.sku,p.name,COALESCE(SUM(oi.quantity_units),0) units,COALESCE(SUM(oi.line_total_krw),0) revenue FROM pink_salt_order_items oi JOIN pink_salt_orders o ON o.id=oi.order_id JOIN pink_salt_products p ON p.id=oi.product_id WHERE o.business_unit_id=? AND o.status='Completed' GROUP BY p.id ORDER BY units DESC LIMIT 5`).all(bu);
    const importSupplierPayable=db.prepare(`SELECT MAX(0,COALESCE((SELECT SUM(x.line_amount_krw) FROM pink_salt_import_items x JOIN pink_salt_imports i ON i.id=x.import_id WHERE i.business_unit_id=? AND i.status NOT IN ('Cancelled','Voided')),0)-COALESCE((SELECT SUM(p.krw_amount) FROM pink_salt_import_payments p JOIN pink_salt_imports i ON i.id=p.import_id WHERE i.business_unit_id=? AND COALESCE(p.status,'Active')!='Voided'),0)-COALESCE((SELECT SUM(a.amount_krw) FROM pink_salt_supplier_advance_allocations a JOIN pink_salt_imports i ON i.id=a.import_id WHERE i.business_unit_id=? AND COALESCE(a.status,'Active')='Active'),0)) v`).get(bu,bu,bu).v;const packagingSupplierPayable=(()=>{try{return num(db.prepare(`SELECT COALESCE(SUM(MAX(0,m.quantity*m.unit_cost_krw-COALESCE((SELECT SUM(a.amount_krw) FROM pink_salt_supplier_packaging_allocations a WHERE a.packaging_movement_id=m.id AND a.status='Active'),0))),0) v FROM pink_salt_packaging_movements m WHERE m.business_unit_id=? AND m.movement_type='Purchase Receipt' AND COALESCE(m.status,'Active')!='Voided'`).get(bu)?.v)}catch(_){return 0}})();const supplierPayable=num(importSupplierPayable)+num(packagingSupplierPayable);
    const receivables=db.prepare(`SELECT COALESCE(SUM(CASE WHEN o.status='Completed' THEN MAX(0,o.total_krw-COALESCE((SELECT SUM(p.krw_amount) FROM pink_salt_customer_payments p WHERE p.order_id=o.id AND p.status='Active'),0)+COALESCE((SELECT SUM(r.krw_amount) FROM pink_salt_customer_refunds r WHERE r.order_id=o.id AND r.status='Active'),0)) ELSE 0 END),0) v FROM pink_salt_orders o WHERE o.business_unit_id=?`).get(bu).v;
    const receipts=db.prepare(`SELECT COALESCE(SUM(p.krw_amount),0) v FROM pink_salt_customer_payments p JOIN pink_salt_orders o ON o.id=p.order_id WHERE o.business_unit_id=? AND p.status='Active' AND substr(p.payment_date,1,7)=?`).get(bu,month).v;
    res.json({raw_kg:num(raw),finished_units:num(finished.q),finished_value_krw:num(finished.v),packaging_low:num(pack),pending_imports:num(imports),open_orders:num(orders),month_revenue_krw:num(sales.revenue),month_gross_profit_krw:num(sales.gross),month_waste_kg:num(waste.kg),month_waste_cost_krw:num(waste.cost),supplier_payable_krw:num(supplierPayable),customer_receivables_krw:num(receivables),month_customer_receipts_krw:num(receipts),top_products:top});
  });

  app.get('/api/pink-salt/suppliers',auth,allow('purchases','inventory','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;res.json(db.prepare('SELECT s.*,(SELECT COUNT(*) FROM pink_salt_imports i WHERE i.supplier_id=s.id) imports FROM pink_salt_suppliers s WHERE s.business_unit_id=? ORDER BY s.active DESC,s.name').all(bu))});
  app.post('/api/pink-salt/suppliers',auth,allow('purchases','inventory','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const name=text(req.body.name);if(!name)return res.status(400).json({error:'Supplier name is required.'});const cats=(()=>{const v=json(req.body.categories||req.body.supplier_categories_json);return Array.isArray(v)&&v.length?v.map(text).filter(Boolean):['Import / Raw Salt Supplier']})();try{const r=db.prepare('INSERT INTO pink_salt_suppliers(business_unit_id,name,contact_person,phone,email,address,country,payment_terms,notes,active,created_by,supplier_categories_json,credit_terms_days,credit_limit_krw) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(bu,name,text(req.body.contact_person),text(req.body.phone),text(req.body.email),text(req.body.address),text(req.body.country)||'Pakistan',text(req.body.payment_terms),text(req.body.notes),req.body.active===undefined?1:bool(req.body.active),req.user.id,JSON.stringify(cats),Math.max(0,Math.trunc(num(req.body.credit_terms_days))),Math.max(0,num(req.body.credit_limit_krw)));audit(req.user,'pink_salt_supplier',r.lastInsertRowid,'create',JSON.stringify({name,categories:cats}));res.json({id:Number(r.lastInsertRowid)})}catch(e){res.status(409).json({error:'A Pink Salt supplier with this name already exists.'})}});
  app.put('/api/pink-salt/suppliers/:id',auth,allow('purchases','inventory','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const x=db.prepare('SELECT * FROM pink_salt_suppliers WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!x)return res.status(404).json({error:'Supplier not found.'});const cats=req.body.categories||req.body.supplier_categories_json,catJson=cats===undefined?x.supplier_categories_json:JSON.stringify((()=>{const v=json(cats);return Array.isArray(v)?v.map(text).filter(Boolean):[]})());db.prepare('UPDATE pink_salt_suppliers SET name=?,contact_person=?,phone=?,email=?,address=?,country=?,payment_terms=?,notes=?,active=?,supplier_categories_json=?,credit_terms_days=?,credit_limit_krw=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(text(req.body.name)||x.name,req.body.contact_person??x.contact_person,req.body.phone??x.phone,req.body.email??x.email,req.body.address??x.address,req.body.country??x.country,req.body.payment_terms??x.payment_terms,req.body.notes??x.notes,req.body.active===undefined?x.active:bool(req.body.active),catJson,req.body.credit_terms_days===undefined?x.credit_terms_days:Math.max(0,Math.trunc(num(req.body.credit_terms_days))),req.body.credit_limit_krw===undefined?x.credit_limit_krw:Math.max(0,num(req.body.credit_limit_krw)),x.id);audit(req.user,'pink_salt_supplier',x.id,'update',x.name);res.json({ok:true})});

  app.get('/api/pink-salt/imports',auth,allow('purchases','inventory','finance','dashboard'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const rows=db.prepare(`SELECT i.*,s.name supplier,(SELECT COUNT(*) FROM pink_salt_import_items x WHERE x.import_id=i.id) item_count,(SELECT COALESCE(SUM(total_weight_kg),0) FROM pink_salt_import_items x WHERE x.import_id=i.id) total_weight_kg,(SELECT COALESCE(SUM(line_amount_original),0) FROM pink_salt_import_items x WHERE x.import_id=i.id) purchase_original,(SELECT COALESCE(SUM(line_amount_krw),0) FROM pink_salt_import_items x WHERE x.import_id=i.id) purchase_krw,(SELECT COALESCE(SUM(krw_amount),0) FROM pink_salt_import_costs c WHERE c.import_id=i.id AND COALESCE(c.status,'Active')!='Voided') import_costs_krw,(SELECT COALESCE(SUM(krw_amount),0) FROM pink_salt_import_payments p WHERE p.import_id=i.id AND COALESCE(p.status,'Active')!='Voided') cash_paid_krw,(SELECT COALESCE(SUM(amount_krw),0) FROM pink_salt_supplier_advance_allocations a WHERE a.import_id=i.id AND COALESCE(a.status,'Active')='Active') advance_allocated_krw FROM pink_salt_imports i LEFT JOIN pink_salt_suppliers s ON s.id=i.supplier_id WHERE i.business_unit_id=? ORDER BY i.id DESC`).all(bu);for(const x of rows){x.paid_krw=num(x.cash_paid_krw)+num(x.advance_allocated_krw);x.outstanding_krw=Math.max(0,num(x.purchase_krw)-num(x.paid_krw));x.payment_status=num(x.paid_krw)<=0?'Unpaid':x.outstanding_krw<=0.01?'Fully Paid / Ready to Receive':'Partially Paid';x.ready_to_receive=x.outstanding_krw<=0.01&&num(x.purchase_krw)>0}res.json(rows)});

  app.get('/api/pink-salt/imports/:id',auth,allow('purchases','inventory','finance','dashboard'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const imp=db.prepare('SELECT i.*,s.name supplier FROM pink_salt_imports i LEFT JOIN pink_salt_suppliers s ON s.id=i.supplier_id WHERE i.id=? AND i.business_unit_id=?').get(req.params.id,bu);if(!imp)return res.status(404).json({error:'Import not found.'});const items=db.prepare('SELECT x.*,COALESCE((SELECT SUM(m.quantity_kg) FROM pink_salt_raw_stock_movements m WHERE m.import_item_id=x.id),0) available_kg FROM pink_salt_import_items x WHERE x.import_id=? ORDER BY x.id').all(imp.id),payments=db.prepare('SELECT * FROM pink_salt_import_payments WHERE import_id=? ORDER BY payment_date,id').all(imp.id),costs=db.prepare('SELECT * FROM pink_salt_import_costs WHERE import_id=? ORDER BY cost_date,id').all(imp.id),advance_allocations=db.prepare("SELECT a.*,s.reference advance_reference,s.receipt_file advance_receipt_file FROM pink_salt_supplier_advance_allocations a JOIN pink_salt_supplier_advances s ON s.id=a.advance_id WHERE a.import_id=? ORDER BY a.allocation_date,a.id").all(imp.id),state=importFinancialState(imp.id);res.json({...imp,items,payments,costs,advance_allocations,...state,attachments:attachments('Import',imp.id)})});

  app.post('/api/pink-salt/imports',auth,allow('purchases','inventory','finance'),upload.array('attachments',12),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;
    let items=json(req.body.items);
    if(!Array.isArray(items)||!items.length)return res.status(400).json({error:'Add at least one salt category to this import.'});
    const currency=text(req.body.invoice_currency)||'USD',invoiceRate=currency==='KRW'?1:num(req.body.invoice_fx_rate_to_krw);
    if(invoiceRate<=0)return res.status(400).json({error:'A valid import exchange rate to KRW is required.'});
    for(const x of items){if(!text(x.salt_grade)||num(x.bag_size_kg)<=0||num(x.bag_count)<=0||!Number.isInteger(num(x.bag_count))||num(x.unit_price_original)<=0)return res.status(400).json({error:'Each salt item requires category, bag size, whole-number bag count and unit price.'})}
    let supplierId=num(req.body.supplier_id)||null,supplier=supplierId?db.prepare('SELECT * FROM pink_salt_suppliers WHERE id=? AND business_unit_id=?').get(supplierId,bu):null;if(supplier&&!supplierHasCategoryV315(supplier,'Import / Raw Salt Supplier'))return res.status(400).json({error:'Select a supplier categorized for Import / Raw Salt.'});
    if(supplierId&&!supplier)return res.status(400).json({error:'Selected supplier is invalid.'});
    const requestedSupplier=json(req.body.new_supplier);
    if(!supplierId&&!text(requestedSupplier?.name))return res.status(400).json({error:'Select an existing supplier or add a new supplier.'});
    const tx=db.transaction(()=>{
      let createdSupplierId=null;
      if(!supplierId){
        const ns={name:text(requestedSupplier.name),contact_person:text(requestedSupplier.contact_person),phone:text(requestedSupplier.phone),email:text(requestedSupplier.email),address:text(requestedSupplier.address),country:text(requestedSupplier.country)||'Pakistan',payment_terms:text(requestedSupplier.payment_terms),notes:text(requestedSupplier.notes)};
        supplier=db.prepare(`SELECT * FROM pink_salt_suppliers WHERE business_unit_id=? AND (lower(trim(name))=lower(trim(?)) OR (?<>'' AND lower(trim(email))=lower(trim(?))) OR (?<>'' AND trim(phone)=trim(?))) ORDER BY active DESC,id LIMIT 1`).get(bu,ns.name,ns.email,ns.email,ns.phone,ns.phone);
        if(!supplier){
          const sr=db.prepare('INSERT INTO pink_salt_suppliers(business_unit_id,name,contact_person,phone,email,address,country,payment_terms,notes,active,created_by,supplier_categories_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(bu,ns.name,ns.contact_person,ns.phone,ns.email,ns.address,ns.country,ns.payment_terms,ns.notes,1,req.user.id,JSON.stringify(['Import / Raw Salt Supplier']));
          supplierId=Number(sr.lastInsertRowid);createdSupplierId=supplierId;
          supplier=db.prepare('SELECT * FROM pink_salt_suppliers WHERE id=?').get(supplierId);
          audit(req.user,'pink_salt_supplier',supplierId,'create_from_import',ns.name);
        }else supplierId=supplier.id;
      }
      const no=text(req.body.import_no)||nextNo('PS-IMP','pink_salt_imports');
      const r=db.prepare('INSERT INTO pink_salt_imports(business_unit_id,import_no,supplier_id,supplier_name,supplier_invoice_no,container_no,bill_of_lading,origin_country,destination_country,purchase_date,expected_arrival,status,invoice_currency,invoice_fx_rate_to_krw,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(bu,no,supplierId,supplier?.name||'',text(req.body.supplier_invoice_no),text(req.body.container_no),text(req.body.bill_of_lading),text(req.body.origin_country)||'Pakistan',text(req.body.destination_country)||'South Korea',req.body.purchase_date||today(),req.body.expected_arrival||null,text(req.body.status)||'Ordered',currency,invoiceRate,text(req.body.notes),req.user.id);
      const id=Number(r.lastInsertRowid),ins=db.prepare('INSERT INTO pink_salt_import_items(import_id,salt_grade,specification,bag_size_kg,bag_count,total_weight_kg,unit_price_original,line_amount_original,fx_rate_to_krw,line_amount_krw,storage_location,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
      for(const x of items){const weight=num(x.total_weight_kg)||num(x.bag_size_kg)*num(x.bag_count),lineOrig=num(x.line_amount_original)||(num(x.unit_price_original)*num(x.bag_count)),lineKrw=lineOrig*invoiceRate;ins.run(id,text(x.salt_grade),text(x.specification),num(x.bag_size_kg),num(x.bag_count),weight,num(x.unit_price_original),lineOrig,invoiceRate,lineKrw,text(x.storage_location),text(x.notes))}
      for(const f of req.files||[])saveAttachment(bu,req.user,'Import',id,f,'Import / Shipping Document');
      importLandedRecalc(id);audit(req.user,'pink_salt_import',id,'create',JSON.stringify({import_no:no,item_count:items.length,finance_payment_created:false,supplier_id:supplierId,supplier_created:!!createdSupplierId}));
      return {id,createdSupplierId,supplierId,supplierName:supplier?.name||''};
    });
    try{
      const result=tx();postImportCommitmentJournal(result.id);const state=importFinancialState(result.id);
      notifyPink(bu,'info','Pink Salt import created',`${db.prepare('SELECT import_no FROM pink_salt_imports WHERE id=?').get(result.id)?.import_no}: supplier purchase ${currency} ${state.purchase_original.toLocaleString()} / ₩${Math.round(state.purchase_krw).toLocaleString()}. No Finance payment is created until Supplier Payment is recorded.`,'pink_salt_import',result.id,'psImports',{finance:true,managers:true});
      res.json({id:result.id,supplier_id:result.supplierId,supplier_name:result.supplierName,supplier_created:!!result.createdSupplierId,...state,finance_payment_created:false});
    }catch(e){res.status(409).json({error:e.message.includes('UNIQUE')?'Import number or supplier already exists.':e.message})}
  });

  app.put('/api/pink-salt/imports/:id',auth,allow('purchases','inventory','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const x=db.prepare('SELECT * FROM pink_salt_imports WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!x)return res.status(404).json({error:'Import not found.'});return res.status(409).json({error:'Use the controlled Edit Import workflow so approvals, finance, stock and audit history stay synchronized.'})});
  app.post('/api/pink-salt/imports/:id/receive',auth,allow('purchases','inventory'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const imp=db.prepare('SELECT * FROM pink_salt_imports WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!imp)return res.status(404).json({error:'Import not found.'});if(imp.status==='Received')return res.status(409).json({error:'This shipment has already been received.'});if(['Cancelled','Voided'].includes(imp.status))return res.status(409).json({error:'Cancelled or voided imports cannot be received.'});const state=importFinancialState(imp.id);if(!state?.ready_to_receive)return res.status(409).json({error:`Shipment cannot be received until the supplier purchase is fully paid. Outstanding balance: ₩${Math.round(state?.outstanding_krw||0).toLocaleString()}.`,payment_required:true,payment_status:state?.payment_status,outstanding_krw:state?.outstanding_krw||0});const received=json(req.body.items),rows=db.prepare('SELECT * FROM pink_salt_import_items WHERE import_id=?').all(imp.id),byId=new Map((Array.isArray(received)?received:[]).map(x=>[Number(x.id),x])),arrival=req.body.actual_arrival||today();const tx=db.transaction(()=>{const ins=db.prepare('INSERT INTO pink_salt_raw_stock_movements(business_unit_id,import_item_id,movement_date,movement_type,quantity_kg,reference_type,reference_id,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)');for(const item of rows){const input=byId.get(item.id),qty=input?num(input.received_weight_kg):num(item.total_weight_kg);if(qty<0)throw new Error('Received weight cannot be negative.');db.prepare('UPDATE pink_salt_import_items SET received_weight_kg=?,storage_location=? WHERE id=?').run(qty,text(input?.storage_location)||item.storage_location,item.id);if(qty>0)ins.run(bu,item.id,arrival,'Import Receipt',qty,'Import',imp.id,imp.import_no,'Shipment received into raw stock',req.user.id)}db.prepare("UPDATE pink_salt_imports SET status='Received',actual_arrival=?,received_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(arrival,imp.id);audit(req.user,'pink_salt_import',imp.id,'receive',JSON.stringify({items:rows.length,supplier_outstanding_krw:0}));});try{tx();postImportReceiptJournal(imp.id);notifyPink(bu,'info','Pink Salt shipment received',`${imp.import_no}: shipment received into raw salt stock after supplier payment was fully cleared.`,'pink_salt_import',imp.id,'psImports',{finance:false,managers:true,staff:true});res.json({ok:true})}catch(e){res.status(409).json({error:e.message})}});

  app.post('/api/pink-salt/imports/:id/payments',auth,allow('purchases','finance'),upload.single('receipt'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const imp=db.prepare('SELECT * FROM pink_salt_imports WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!imp)return res.status(404).json({error:'Import not found.'});if(imp.status==='Received')return res.status(409).json({error:'Supplier payments cannot be added after the shipment has been received. Use an approved Finance correction if required.'});if(['Cancelled','Voided'].includes(imp.status))return res.status(409).json({error:'Supplier payments cannot be added to a cancelled or voided import.'});const currency=text(req.body.original_currency)||imp.invoice_currency||'KRW',amount=num(req.body.original_amount),rate=currency==='KRW'?1:num(req.body.fx_rate_to_krw);if(amount<=0||rate<=0||!text(req.body.reference))return res.status(400).json({error:'Payment amount, exchange rate and reference are required.'});if(!req.file)return res.status(400).json({error:'Payment receipt / evidence is required.'});const krw=amount*rate,before=importFinancialState(imp.id);if(krw>(before?.outstanding_krw||0)+0.01)return res.status(409).json({error:`Supplier payment exceeds the outstanding import balance of ₩${Math.round(before?.outstanding_krw||0).toLocaleString()}.`,outstanding_krw:before?.outstanding_krw||0});const paymentDate=req.body.payment_date||today(),reference=text(req.body.reference),dup=db.prepare("SELECT id FROM pink_salt_import_payments WHERE import_id=? AND payment_date=? AND lower(trim(reference))=lower(trim(?)) AND ABS(krw_amount-?)<0.01 AND COALESCE(status,'Active')!='Voided' LIMIT 1").get(imp.id,paymentDate,reference,krw);if(dup)return res.status(409).json({error:`This supplier payment is already recorded as payment #${dup.id}.`,existing_id:dup.id});const r=db.prepare('INSERT INTO pink_salt_import_payments(import_id,payment_date,original_currency,original_amount,fx_rate_to_krw,krw_amount,payment_method,reference,receipt_file,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(imp.id,paymentDate,currency,amount,rate,krw,text(req.body.payment_method)||'Bank',reference,req.file.filename,text(req.body.notes),req.user.id),id=Number(r.lastInsertRowid);saveAttachment(bu,req.user,'Import',imp.id,req.file,'Import Payment Receipt / Evidence');audit(req.user,'pink_salt_import_payment',id,'create',JSON.stringify({import_id:imp.id,krw}));syncImportPayment(id);const after=importFinancialState(imp.id);if(after.ready_to_receive)notifyPink(bu,'info','Pink Salt import fully paid',`${imp.import_no}: supplier payment is fully cleared. Shipment is ready to receive.`,'pink_salt_import',imp.id,'psImports',{finance:true,managers:true,staff:true});else notifyPink(bu,'warning','Pink Salt supplier payment recorded',`${imp.import_no}: ₩${Math.round(after.outstanding_krw).toLocaleString()} remains outstanding before shipment can be received.`,'pink_salt_import',imp.id,'psImports',{finance:true,managers:true});res.json({id,krw_amount:krw,...after})});

  app.post('/api/pink-salt/imports/:id/costs',auth,allow('purchases','finance'),upload.single('receipt'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const imp=db.prepare('SELECT * FROM pink_salt_imports WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!imp)return res.status(404).json({error:'Import not found.'});if(['Cancelled','Voided'].includes(imp.status))return res.status(409).json({error:'Import costs cannot be added to a cancelled or voided import.'});const currency=text(req.body.original_currency)||'KRW',amount=num(req.body.original_amount),rate=currency==='KRW'?1:num(req.body.fx_rate_to_krw),reference=text(req.body.reference);if(amount<=0||rate<=0||!text(req.body.cost_type)||!reference)return res.status(400).json({error:'Cost type, amount, exchange rate and reference are required.'});if(!req.file)return res.status(400).json({error:'Import-cost receipt / evidence is required.'});const krw=amount*rate,costDate=req.body.cost_date||today(),costType=text(req.body.cost_type),dup=db.prepare("SELECT id FROM pink_salt_import_costs WHERE import_id=? AND cost_date=? AND cost_type=? AND lower(trim(reference))=lower(trim(?)) AND ABS(krw_amount-?)<0.01 AND COALESCE(status,'Active')!='Voided' LIMIT 1").get(imp.id,costDate,costType,reference,krw);if(dup)return res.status(409).json({error:`This import cost is already recorded as cost #${dup.id}.`,existing_id:dup.id});const r=db.prepare('INSERT INTO pink_salt_import_costs(import_id,cost_date,cost_type,original_currency,original_amount,fx_rate_to_krw,krw_amount,allocation_method,reference,receipt_file,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(imp.id,costDate,costType,currency,amount,rate,krw,text(req.body.allocation_method)||'Weight',reference,req.file.filename,text(req.body.notes),req.user.id),id=Number(r.lastInsertRowid);db.prepare("UPDATE pink_salt_import_costs SET payment_method=? WHERE id=?").run(text(req.body.payment_method)||'Bank',id);saveAttachment(bu,req.user,'Import',imp.id,req.file,`${text(req.body.cost_type)} Evidence`);importLandedRecalc(imp.id);audit(req.user,'pink_salt_import_cost',id,'create',JSON.stringify({import_id:imp.id,krw}));syncImportCost(id);res.json({id,krw_amount:krw})});
  app.post('/api/pink-salt/imports/:id/attachments',auth,allow('purchases','inventory','finance','documents'),upload.single('file'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const imp=db.prepare('SELECT id FROM pink_salt_imports WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!imp)return res.status(404).json({error:'Import not found.'});if(!req.file)return res.status(400).json({error:'File is required.'});res.json({id:saveAttachment(bu,req.user,'Import',imp.id,req.file,text(req.body.title)||req.file.originalname)})});

  app.get('/api/pink-salt/raw-stock',auth,allow('inventory','purchases','dashboard','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;res.json(db.prepare(`SELECT x.id,x.salt_grade,x.specification,x.bag_size_kg,x.bag_count,x.total_weight_kg,x.received_weight_kg,x.storage_location,x.landed_cost_krw,i.id import_id,i.import_no,i.container_no,i.actual_arrival,i.invoice_currency,s.name supplier,COALESCE(SUM(m.quantity_kg),0) available_kg,CASE WHEN x.received_weight_kg>0 THEN x.landed_cost_krw/x.received_weight_kg ELSE 0 END landed_cost_per_kg FROM pink_salt_import_items x JOIN pink_salt_imports i ON i.id=x.import_id LEFT JOIN pink_salt_suppliers s ON s.id=i.supplier_id LEFT JOIN pink_salt_raw_stock_movements m ON m.import_item_id=x.id WHERE i.business_unit_id=? AND i.status='Received' GROUP BY x.id ORDER BY i.id DESC,x.id`).all(bu))});

  app.get('/api/pink-salt/packaging',auth,allow('inventory','purchases','dashboard','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;res.json(db.prepare(`SELECT p.*,s.name supplier,COALESCE(SUM(CASE WHEN COALESCE(m.status,'Active')!='Voided' THEN m.quantity ELSE 0 END),0) available_quantity,MAX(CASE WHEN m.movement_type='Purchase Receipt' AND COALESCE(m.status,'Active')!='Voided' THEN m.movement_date END) last_received_date FROM pink_salt_packaging_items p LEFT JOIN pink_salt_suppliers s ON s.id=p.supplier_id LEFT JOIN pink_salt_packaging_movements m ON m.packaging_item_id=p.id WHERE p.business_unit_id=? GROUP BY p.id ORDER BY p.active DESC,p.name`).all(bu))});
  app.post('/api/pink-salt/packaging',auth,allow('inventory','purchases'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;
    const sku=text(req.body.sku),name=text(req.body.name),unit=text(req.body.unit)||'pcs',reorder=num(req.body.reorder_level);
    if(!sku||!name)return res.status(400).json({error:'Packaging SKU and name are required.'});
    if(reorder<0)return res.status(400).json({error:'Reorder level cannot be negative.'});
    if(String(unit).toLowerCase()!=='kg'&&!Number.isInteger(reorder))return res.status(400).json({error:'Packaging reorder level must be a whole number unless the unit is kg.'});
    try{const supplierId=num(req.body.supplier_id)||null,supplier=supplierId?db.prepare('SELECT * FROM pink_salt_suppliers WHERE id=? AND business_unit_id=? AND active=1').get(supplierId,bu):null;if(supplierId&&(!supplier||!supplierHasCategoryV315(supplier,'Packaging Material Supplier')))return res.status(400).json({error:'Selected supplier must be categorized as a Packaging Material Supplier.'});const r=db.prepare('INSERT INTO pink_salt_packaging_items(business_unit_id,sku,name,category,unit,supplier_name,reorder_level,last_unit_cost_krw,notes,created_by,supplier_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(bu,sku,name,text(req.body.category)||'Pouch / Bag',unit,supplier?.name||text(req.body.supplier_name),reorder,num(req.body.last_unit_cost_krw),text(req.body.notes),req.user.id,supplierId);audit(req.user,'pink_salt_packaging',r.lastInsertRowid,'create',sku);res.json({id:Number(r.lastInsertRowid)})}catch(e){res.status(409).json({error:'Packaging SKU already exists.'})}
  });
  app.put('/api/pink-salt/packaging/:id',auth,allow('inventory','purchases'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;const x=db.prepare('SELECT * FROM pink_salt_packaging_items WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!x)return res.status(404).json({error:'Packaging item not found.'});
    const unit=text(req.body.unit??x.unit)||'pcs',reorder=num(req.body.reorder_level??x.reorder_level);
    if(reorder<0)return res.status(400).json({error:'Reorder level cannot be negative.'});
    if(String(unit).toLowerCase()!=='kg'&&!Number.isInteger(reorder))return res.status(400).json({error:'Packaging reorder level must be a whole number unless the unit is kg.'});
    const supplierId=req.body.supplier_id===undefined?x.supplier_id:(num(req.body.supplier_id)||null),supplier=supplierId?db.prepare('SELECT * FROM pink_salt_suppliers WHERE id=? AND business_unit_id=? AND active=1').get(supplierId,bu):null;if(supplierId&&(!supplier||!supplierHasCategoryV315(supplier,'Packaging Material Supplier')))return res.status(400).json({error:'Selected supplier must be categorized as a Packaging Material Supplier.'});db.prepare('UPDATE pink_salt_packaging_items SET name=?,category=?,unit=?,supplier_name=?,reorder_level=?,last_unit_cost_krw=?,notes=?,active=?,supplier_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.name??x.name,req.body.category??x.category,unit,supplier?.name||(req.body.supplier_name??x.supplier_name),reorder,num(req.body.last_unit_cost_krw??x.last_unit_cost_krw),req.body.notes??x.notes,req.body.active===undefined?x.active:bool(req.body.active),supplierId,x.id);res.json({ok:true})
  });
  app.post('/api/pink-salt/packaging/:id/receive',auth,allow('inventory','purchases','finance'),upload.single('receipt'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;
    const x=db.prepare('SELECT * FROM pink_salt_packaging_items WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!x)return res.status(404).json({error:'Packaging item not found.'});
    const supplierId=num(req.body.supplier_id||x.supplier_id),supplier=supplierId?db.prepare('SELECT * FROM pink_salt_suppliers WHERE id=? AND business_unit_id=? AND active=1').get(supplierId,bu):null;if(!supplier||!supplierHasCategoryV315(supplier,'Packaging Material Supplier'))return res.status(400).json({error:'Select a valid packaging-material supplier before receiving stock.'});
    const qty=num(req.body.quantity),enteredUnit=num(req.body.unit_cost_krw),enteredTotal=num(req.body.total_amount_krw),mode=text(req.body.calculation_mode)||'Unit Cost';if(String(x.unit||'pcs').toLowerCase()!=='kg'&&!Number.isInteger(qty))return res.status(400).json({error:'Packaging quantity must be a whole number unless the unit is kg.'});
    const total=mode==='Total Amount'?enteredTotal:(qty*enteredUnit),cost=mode==='Total Amount'&&qty>0?enteredTotal/qty:enteredUnit,reference=text(req.body.reference);if(qty<=0||cost<=0||total<=0||!reference)return res.status(400).json({error:'Received quantity and either unit cost or total amount, plus supplier invoice/reference, are required.'});if(!req.file)return res.status(400).json({error:'Packaging invoice / delivery evidence is required.'});
    const movementDate=req.body.movement_date||today(),terms=Math.max(0,Math.trunc(num(supplier.credit_terms_days)||0)),dueDate=text(req.body.due_date)||(terms?new Date(new Date(movementDate+'T00:00:00').getTime()+terms*86400000).toISOString().slice(0,10):movementDate),dup=db.prepare("SELECT id FROM pink_salt_packaging_movements WHERE business_unit_id=? AND packaging_item_id=? AND movement_date=? AND movement_type='Purchase Receipt' AND lower(trim(reference))=lower(trim(?)) AND ABS(quantity-?)<0.000001 AND ABS(unit_cost_krw-?)<0.01 AND COALESCE(status,'Active')!='Voided' LIMIT 1").get(bu,x.id,movementDate,reference,qty,cost);if(dup)return res.status(409).json({error:`This packaging purchase is already recorded as movement #${dup.id}.`,existing_id:dup.id});
    let id,allocated=0;try{db.transaction(()=>{const r=db.prepare('INSERT INTO pink_salt_packaging_movements(business_unit_id,packaging_item_id,movement_date,movement_type,quantity,unit_cost_krw,reference_type,reference,receipt_file,notes,created_by,supplier_id,due_date) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(bu,x.id,movementDate,'Purchase Receipt',qty,cost,'Packaging Purchase',reference,req.file.filename,text(req.body.notes),req.user.id,supplier.id,dueDate);id=Number(r.lastInsertRowid);db.prepare('UPDATE pink_salt_packaging_items SET last_unit_cost_krw=?,supplier_name=?,supplier_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(cost,supplier.name,supplier.id,x.id);saveAttachment(bu,req.user,'Packaging',x.id,req.file,'Packaging Invoice / Delivery Evidence');audit(req.user,'pink_salt_packaging_movement',id,'receive',JSON.stringify({packaging_item_id:x.id,supplier_id:supplier.id,qty,unit_cost_krw:cost,total_amount_krw:total,calculation_mode:mode,due_date:dueDate}));const movement={id,reference};if(bool(req.body.apply_available_credit)){const availableCredit=supplierAdvanceAvailableV315(supplier.id),toApply=Math.min(total,availableCredit);if(toApply>.005)allocated=allocatePackagingCreditV315({bu,supplier,movement,amount:toApply,date:movementDate,user:req.user})}})();syncPackagingPurchase(id);const available=packBalance(x.id),outstanding=Math.max(0,total-allocated);notifyPink(bu,'info','Pink Salt packaging received',`${x.sku} · ${x.name}: ${qty.toLocaleString()} ${x.unit} received from ${supplier.name}. Supplier payable ₩${Math.round(outstanding).toLocaleString()}${allocated>0?` after applying ₩${Math.round(allocated).toLocaleString()} available supplier credit`:''}.`,'pink_salt_packaging',x.id,'psPackaging',{finance:true,managers:true,staff:true});checkPackagingLowStock(x.id);res.json({id,available_quantity:available,unit_cost_krw:cost,total_amount_krw:total,supplier_id:supplier.id,due_date:dueDate,allocated_credit_krw:allocated,outstanding_krw:outstanding})}catch(e){res.status(409).json({error:e.message})}
  });

  app.get('/api/pink-salt/products',auth,allow('inventory','sales','purchases','dashboard'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const rows=db.prepare(`SELECT p.*,COALESCE(SUM(m.quantity_units),0) on_hand_units FROM pink_salt_products p LEFT JOIN pink_salt_finished_stock_movements m ON m.product_id=p.id WHERE p.business_unit_id=? GROUP BY p.id ORDER BY p.active DESC,p.name`).all(bu);for(const x of rows){x.reserved_units=finishedReserved(x.id);x.available_units=Math.max(0,Number(x.on_hand_units||0)-Number(x.reserved_units||0));x.unit_cost_krw=weightedProductCost(x.id);x.bom=db.prepare('SELECT b.*,p.sku packaging_sku,p.name packaging_name,p.unit packaging_unit,p.category packaging_category FROM pink_salt_bom_lines b JOIN pink_salt_packaging_items p ON p.id=b.packaging_item_id WHERE b.product_id=? ORDER BY p.name').all(x.id);x.gift_components=giftComponents(x.id);x.gift_total_pouches=x.gift_components.reduce((n,c)=>n+num(c.pouches_per_box),0)}res.json(rows)});
  app.post('/api/pink-salt/products',auth,allow('inventory','sales','purchases'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const sku=text(req.body.sku),name=text(req.body.name);if(!sku||!name)return res.status(400).json({error:'SKU and product name are required.'});try{const def=validateProductDefinition(bu,req.body),tx=db.transaction(()=>{const r=db.prepare('INSERT INTO pink_salt_products(business_unit_id,sku,name,salt_grade,pack_weight_g,gift_pouch_weight_g,packaging_style,selling_price_krw,reorder_level_units,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(bu,sku,name,def.grade,def.packWeight,def.pouchWeight,def.style,num(req.body.selling_price_krw),num(req.body.reorder_level_units),text(req.body.notes),req.user.id),id=Number(r.lastInsertRowid),bomIns=db.prepare('INSERT INTO pink_salt_bom_lines(product_id,packaging_item_id,quantity_per_unit,notes) VALUES(?,?,?,?)'),giftIns=db.prepare('INSERT INTO pink_salt_gift_box_components(product_id,salt_grade,pouches_per_box) VALUES(?,?,?)');for(const b of def.bom)bomIns.run(id,b.packaging_item_id,b.quantity_per_unit,b.notes);for(const c of def.components)giftIns.run(id,c.salt_grade,c.pouches_per_box);audit(req.user,'pink_salt_product',id,'create',JSON.stringify({sku,mixed_gift_box:def.components.length>0,pouch_weight_g:def.pouchWeight,total_pouches:def.totalPouches}));return id});res.json({id:tx()})}catch(e){res.status(409).json({error:e.message.includes('UNIQUE')?'Finished product SKU or gift-box salt category already exists.':e.message})}});
  app.put('/api/pink-salt/products/:id',auth,allow('inventory','sales','purchases'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const x=db.prepare('SELECT * FROM pink_salt_products WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!x)return res.status(404).json({error:'Finished product not found.'});try{const def=validateProductDefinition(bu,req.body,x),tx=db.transaction(()=>{db.prepare('UPDATE pink_salt_products SET name=?,salt_grade=?,pack_weight_g=?,gift_pouch_weight_g=?,packaging_style=?,selling_price_krw=?,reorder_level_units=?,notes=?,active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.name??x.name,def.grade,def.packWeight,def.pouchWeight,def.style,num(req.body.selling_price_krw??x.selling_price_krw),num(req.body.reorder_level_units??x.reorder_level_units),req.body.notes??x.notes,req.body.active===undefined?x.active:bool(req.body.active),x.id);db.prepare('DELETE FROM pink_salt_bom_lines WHERE product_id=?').run(x.id);db.prepare('DELETE FROM pink_salt_gift_box_components WHERE product_id=?').run(x.id);const bomIns=db.prepare('INSERT INTO pink_salt_bom_lines(product_id,packaging_item_id,quantity_per_unit,notes) VALUES(?,?,?,?)'),giftIns=db.prepare('INSERT INTO pink_salt_gift_box_components(product_id,salt_grade,pouches_per_box) VALUES(?,?,?)');for(const b of def.bom)bomIns.run(x.id,b.packaging_item_id,b.quantity_per_unit,b.notes);for(const c of def.components)giftIns.run(x.id,c.salt_grade,c.pouches_per_box);audit(req.user,'pink_salt_product',x.id,'update',JSON.stringify({mixed_gift_box:def.components.length>0,pouch_weight_g:def.pouchWeight,total_pouches:def.totalPouches}))});tx();res.json({ok:true,pack_weight_g:def.packWeight})}catch(e){res.status(409).json({error:e.message})}});

  app.get('/api/pink-salt/production',auth,allow('inventory','purchases','dashboard'),(req,res)=>{const bu=guard(req,res);if(!bu)return;res.json(db.prepare(`SELECT b.*,(SELECT GROUP_CONCAT(z.label,' + ') FROM (SELECT DISTINCT i.import_no||' · '||pi.salt_grade label FROM pink_salt_production_inputs pi JOIN pink_salt_import_items x ON x.id=pi.import_item_id JOIN pink_salt_imports i ON i.id=x.import_id WHERE pi.production_batch_id=b.id) z) raw_sources,(SELECT GROUP_CONCAT(p.sku||' × '||o.quantity_units,', ') FROM pink_salt_production_outputs o JOIN pink_salt_products p ON p.id=o.product_id WHERE o.production_batch_id=b.id) outputs FROM pink_salt_production_batches b WHERE b.business_unit_id=? ORDER BY b.id DESC`).all(bu))});
  app.get('/api/pink-salt/production/:id',auth,allow('inventory','purchases','dashboard'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const b=db.prepare('SELECT * FROM pink_salt_production_batches WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!b)return res.status(404).json({error:'Production batch not found.'});const inputs=db.prepare(`SELECT pi.*,i.import_no,i.container_no FROM pink_salt_production_inputs pi JOIN pink_salt_import_items x ON x.id=pi.import_item_id JOIN pink_salt_imports i ON i.id=x.import_id WHERE pi.production_batch_id=? ORDER BY pi.id`).all(b.id);res.json({...b,inputs,raw_sources:inputs.map(x=>`${x.import_no} · ${x.salt_grade}`).join(' + '),outputs:db.prepare('SELECT o.*,p.sku,p.name,p.packaging_style,p.gift_pouch_weight_g FROM pink_salt_production_outputs o JOIN pink_salt_products p ON p.id=o.product_id WHERE o.production_batch_id=?').all(b.id),packaging:db.prepare('SELECT x.*,p.sku,p.name,p.category FROM pink_salt_production_packaging x JOIN pink_salt_packaging_items p ON p.id=x.packaging_item_id WHERE x.production_batch_id=?').all(b.id),attachments:attachments('Production',b.id)})});
  // Compatibility wording retained for inherited QA: Production input exceeds available raw salt. Finished output weight cannot exceed raw-salt input.
  app.post('/api/pink-salt/production',auth,allow('inventory','purchases'),upload.array('attachments',8),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;
    const outputs=json(req.body.outputs),requestedInputs=json(req.body.inputs);
    if(!Array.isArray(outputs)||!outputs.length)return res.status(400).json({error:'Add at least one finished product output.'});
    const needed=new Map(),requiredByGrade=new Map(),outDefs=[];
    for(const o of outputs){
      const p=db.prepare('SELECT * FROM pink_salt_products WHERE id=? AND business_unit_id=? AND active=1').get(num(o.product_id),bu),quantity=num(o.quantity_units);
      if(!p||quantity<=0||!Number.isInteger(quantity))return res.status(400).json({error:'Every output requires a valid finished product and whole-number quantity.'});
      const requirements=productSaltRequirements(p,quantity),outputWeight=[...requirements.values()].reduce((n,x)=>n+x,0),bom=db.prepare('SELECT * FROM pink_salt_bom_lines WHERE product_id=?').all(p.id);
      for(const [grade,kg] of requirements)requiredByGrade.set(grade,(requiredByGrade.get(grade)||0)+kg);
      for(const bl of bom)needed.set(bl.packaging_item_id,(needed.get(bl.packaging_item_id)||0)+num(bl.quantity_per_unit)*quantity);
      outDefs.push({product:p,quantity,requirements,outputWeight,bom});
    }
    const sourceInputs=Array.isArray(requestedInputs)&&requestedInputs.length?requestedInputs:[{import_item_id:req.body.import_item_id,input_weight_kg:req.body.input_weight_kg}],byImport=new Map();
    for(const x of sourceInputs){const id=num(x.import_item_id),weight=num(x.input_weight_kg);if(id&&weight>0)byImport.set(id,(byImport.get(id)||0)+weight)}
    if(!byImport.size)return res.status(400).json({error:'Add a raw-salt input batch for every required salt category.'});
    const inputRows=[];
    for(const [id,weight] of byImport){const item=db.prepare(`SELECT x.*,i.business_unit_id,i.import_no FROM pink_salt_import_items x JOIN pink_salt_imports i ON i.id=x.import_id WHERE x.id=? AND i.business_unit_id=? AND i.status='Received'`).get(id,bu);if(!item)return res.status(400).json({error:'Select only received raw-salt batches.'});if(weight>rawBalance(id)+1e-6)return res.status(400).json({error:`Production input exceeds available ${item.salt_grade} raw salt in ${item.import_no}.`});if(!requiredByGrade.has(text(item.salt_grade)))return res.status(400).json({error:`${item.salt_grade} is not required by the selected finished outputs.`});inputRows.push({item,weight,rate:num(item.received_weight_kg)>0?num(item.landed_cost_krw)/num(item.received_weight_kg):0})}
    const suppliedByGrade=new Map();for(const x of inputRows)suppliedByGrade.set(text(x.item.salt_grade),(suppliedByGrade.get(text(x.item.salt_grade))||0)+x.weight);
    for(const [grade,required] of requiredByGrade){const supplied=suppliedByGrade.get(grade)||0;if(supplied+0.005<required)return res.status(400).json({error:`Not enough ${grade} input. Required ${required.toFixed(3)} kg, entered ${supplied.toFixed(3)} kg.`})}
    for(const [pid,quantity] of needed){
      const packaging=db.prepare('SELECT * FROM pink_salt_packaging_items WHERE id=? AND business_unit_id=? AND active=1').get(pid,bu);
      if(!packaging)return res.status(400).json({error:`Production BOM contains an invalid or inactive packaging material (${pid}). Update the finished product BOM before repacking.`});
      const available=packBalance(pid);
      if(available+1e-6<quantity)return res.status(400).json({error:`Not enough packaging material: ${packaging.name}. Required ${quantity}, available ${available}.`});
    }
    const input=inputRows.reduce((n,x)=>n+x.weight,0),actual=[...requiredByGrade.values()].reduce((n,x)=>n+x,0),waste=Math.max(0,input-actual),productionDate=req.body.production_date||today();
    if(actual-input>0.005)return res.status(400).json({error:'Finished output weight cannot exceed total raw-salt input.'});
    if(accounting?.isPeriodClosed?.(bu,productionDate))return res.status(409).json({error:'This accounting period is closed. Reopen the period before completing this repacking batch.'});
    try{
      const tx=db.transaction(()=>{
        const batchNo=text(req.body.batch_no)||nextNo('PS-PROD','pink_salt_production_batches'),primary=inputRows[0],r=db.prepare("INSERT INTO pink_salt_production_batches(business_unit_id,batch_no,production_date,import_item_id,input_weight_kg,actual_output_weight_kg,waste_weight_kg,waste_reason,status,notes,completed_by,created_by,completed_at) VALUES(?,?,?,?,?,?,?,?, 'Completed',?,?,?,CURRENT_TIMESTAMP)").run(bu,batchNo,productionDate,primary.item.id,input,actual,waste,text(req.body.waste_reason)||(waste>0?'Repacking loss':''),text(req.body.notes),req.user.id,req.user.id),batchId=Number(r.lastInsertRowid);
        const inputIns=db.prepare('INSERT INTO pink_salt_production_inputs(production_batch_id,import_item_id,salt_grade,input_weight_kg,required_output_weight_kg,waste_weight_kg,raw_unit_cost_krw) VALUES(?,?,?,?,?,?,?)'),rawMove=db.prepare('INSERT INTO pink_salt_raw_stock_movements(business_unit_id,import_item_id,movement_date,movement_type,quantity_kg,reference_type,reference_id,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)'),gradeRates=new Map();
        for(const [grade,supplied] of suppliedByGrade){const rows=inputRows.filter(x=>text(x.item.salt_grade)===grade),totalCost=rows.reduce((n,x)=>n+x.weight*x.rate,0);gradeRates.set(grade,supplied>0?totalCost/supplied:0)}
        for(const x of inputRows){const grade=text(x.item.salt_grade),required=requiredByGrade.get(grade)||0,supplied=suppliedByGrade.get(grade)||0,requiredShare=supplied>0?required*(x.weight/supplied):0,wasteShare=Math.max(0,x.weight-requiredShare);inputIns.run(batchId,x.item.id,grade,x.weight,requiredShare,wasteShare,x.rate);rawMove.run(bu,x.item.id,productionDate,'Production Consumption',-x.weight,'Production',batchId,batchNo,`${grade} raw salt consumed for repacking`,req.user.id)}
        const packUsed=db.prepare('INSERT INTO pink_salt_production_packaging(production_batch_id,packaging_item_id,quantity_used,unit_cost_krw) VALUES(?,?,?,?)'),packMove=db.prepare('INSERT INTO pink_salt_packaging_movements(business_unit_id,packaging_item_id,movement_date,movement_type,quantity,unit_cost_krw,reference_type,reference_id,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
        for(const [pid,quantity] of needed){const p=db.prepare('SELECT * FROM pink_salt_packaging_items WHERE id=? AND business_unit_id=? AND active=1').get(pid,bu);if(!p)throw new Error(`Production BOM packaging material ${pid} is no longer available.`);const cost=num(p.last_unit_cost_krw);packUsed.run(batchId,pid,quantity,cost);packMove.run(bu,pid,productionDate,'Production Consumption',-quantity,cost,'Production',batchId,batchNo,'Packaging consumed from finished-product BOM during repacking',req.user.id)}
        const outIns=db.prepare('INSERT INTO pink_salt_production_outputs(production_batch_id,product_id,quantity_units,output_weight_kg,unit_cost_krw) VALUES(?,?,?,?,?)'),finIns=db.prepare('INSERT INTO pink_salt_finished_stock_movements(business_unit_id,product_id,production_batch_id,movement_date,movement_type,quantity_units,unit_cost_krw,reference_type,reference_id,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');let finishedRawCost=0;
        for(const o of outDefs){const rawCost=[...o.requirements].reduce((n,[grade,kg])=>n+kg*num(gradeRates.get(grade)),0),packCost=o.bom.reduce((n,b)=>n+num(b.quantity_per_unit)*o.quantity*num(db.prepare('SELECT last_unit_cost_krw FROM pink_salt_packaging_items WHERE id=?').get(b.packaging_item_id)?.last_unit_cost_krw),0),unitCost=(rawCost+packCost)/(o.quantity||1);finishedRawCost+=rawCost;outIns.run(batchId,o.product.id,o.quantity,o.outputWeight,unitCost);finIns.run(bu,o.product.id,batchId,productionDate,'Production Output',o.quantity,unitCost,'Production',batchId,batchNo,'Finished stock produced',req.user.id)}
        const totalRawCost=inputRows.reduce((n,x)=>n+x.weight*x.rate,0),wasteCost=Math.max(0,totalRawCost-finishedRawCost);
        if(waste>0)db.prepare('INSERT INTO pink_salt_waste(business_unit_id,waste_date,waste_type,source_type,source_id,quantity,unit,reason,estimated_cost_krw,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(bu,productionDate,'Repacking Loss','Production',batchId,waste,'kg',text(req.body.waste_reason)||'Repacking loss',wasteCost,text(req.body.notes),req.user.id);
        for(const f of req.files||[])saveAttachment(bu,req.user,'Production',batchId,f,'Production / Repacking Evidence');audit(req.user,'pink_salt_production',batchId,'complete',JSON.stringify({batch_no:batchNo,input_kg:input,output_kg:actual,waste_kg:waste,salt_categories:[...requiredByGrade.keys()],required_salt_kg_by_category:Object.fromEntries(requiredByGrade),packaging_consumed:Object.fromEntries(needed)}));return batchId
      });
      const id=tx();let accounting_sync_warning='';try{postProductionJournal(id)}catch(syncError){accounting_sync_warning=syncError.message||'Accounting journal synchronization failed.';console.error('Pink Salt production accounting sync:',accounting_sync_warning)}const batch=db.prepare('SELECT batch_no FROM pink_salt_production_batches WHERE id=?').get(id);notifyPink(bu,'info','Pink Salt repacking completed',`${batch?.batch_no||('Batch #'+id)}: ${input.toLocaleString()} kg input → ${actual.toLocaleString()} kg finished output; ${waste.toLocaleString()} kg waste.`,'pink_salt_production',id,'psProduction',{finance:false,managers:true,staff:true});if(input>0&&waste/input>=0.05)notifyPinkOnce(bu,'warning','High Pink Salt repacking waste',`${batch?.batch_no||('Batch #'+id)} recorded ${(waste/input*100).toFixed(1)}% waste. Review the production batch.`,'pink_salt_production',id,'psProduction',{finance:false,managers:true});for(const pid of needed.keys())checkPackagingLowStock(pid);for(const o of outDefs)checkFinishedLowStock(o.product.id);res.json({id,batch_no:batch?.batch_no||'',actual_output_weight_kg:actual,waste_weight_kg:waste,input_weight_kg:input,salt_categories:[...requiredByGrade.keys()],required_salt_kg_by_category:Object.fromEntries(requiredByGrade),packaging_consumed:Object.fromEntries(needed),accounting_sync_warning})
    }catch(e){res.status(409).json({error:e.message.includes('UNIQUE')?'Production batch number already exists.':e.message})}
  });

  app.get('/api/pink-salt/waste',auth,allow('inventory','dashboard','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;res.json(db.prepare('SELECT w.*,u.name created_by_name FROM pink_salt_waste w LEFT JOIN users u ON u.id=w.created_by WHERE w.business_unit_id=? ORDER BY w.waste_date DESC,w.id DESC').all(bu))});
  app.post('/api/pink-salt/waste',auth,allow('inventory','finance'),upload.single('attachment'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;const source=text(req.body.source_type),id=num(req.body.source_id),qty=num(req.body.quantity),reason=text(req.body.reason);if(!source||!id||qty<=0||!reason)return res.status(400).json({error:'Waste source, quantity and reason are required.'});
    let unit=source==='Raw Salt'?'kg':source==='Finished Product'?'pcs':'';
    if(source==='Packaging'){const px=db.prepare('SELECT unit FROM pink_salt_packaging_items WHERE id=? AND business_unit_id=?').get(id,bu);if(!px)return res.status(400).json({error:'Packaging item not found.'});unit=text(px.unit)||'pcs'}
    if(source==='Finished Product'&&!Number.isInteger(qty))return res.status(400).json({error:'Quantity must be a whole number.'});
    if(source==='Packaging'&&String(unit).toLowerCase()!=='kg'&&!Number.isInteger(qty))return res.status(400).json({error:'Packaging quantity must be a whole number unless the unit is kg.'});
    const tx=db.transaction(()=>{if(source==='Raw Salt'){const x=db.prepare(`SELECT x.*,i.business_unit_id FROM pink_salt_import_items x JOIN pink_salt_imports i ON i.id=x.import_id WHERE x.id=? AND i.business_unit_id=?`).get(id,bu);if(!x)throw new Error('Raw salt batch not found.');if(qty>rawBalance(id)+1e-6)throw new Error('Waste quantity exceeds available raw stock.');db.prepare('INSERT INTO pink_salt_raw_stock_movements(business_unit_id,import_item_id,movement_date,movement_type,quantity_kg,reference_type,reference_id,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)').run(bu,id,req.body.waste_date||today(),'Waste',-qty,'Waste',null,'Manual Waste',reason,req.user.id)}else if(source==='Finished Product'){const x=db.prepare('SELECT * FROM pink_salt_products WHERE id=? AND business_unit_id=?').get(id,bu);if(!x)throw new Error('Finished product not found.');if(qty>finishedAvailable(id)+1e-6)throw new Error('Waste quantity exceeds unreserved finished stock.');db.prepare('INSERT INTO pink_salt_finished_stock_movements(business_unit_id,product_id,movement_date,movement_type,quantity_units,unit_cost_krw,reference_type,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)').run(bu,id,req.body.waste_date||today(),'Waste',-qty,weightedProductCost(id),'Waste','Manual Waste',reason,req.user.id)}else if(source==='Packaging'){const x=db.prepare('SELECT * FROM pink_salt_packaging_items WHERE id=? AND business_unit_id=?').get(id,bu);if(!x)throw new Error('Packaging item not found.');if(qty>packBalance(id)+1e-6)throw new Error('Waste quantity exceeds available packaging stock.');db.prepare('INSERT INTO pink_salt_packaging_movements(business_unit_id,packaging_item_id,movement_date,movement_type,quantity,unit_cost_krw,reference_type,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)').run(bu,id,req.body.waste_date||today(),'Waste',-qty,num(x.last_unit_cost_krw),'Waste','Manual Waste',reason,req.user.id)}else throw new Error('Invalid waste source.');const estimated=num(req.body.estimated_cost_krw)||wasteEstimatedCost(source,id,qty),r=db.prepare('INSERT INTO pink_salt_waste(business_unit_id,waste_date,waste_type,source_type,source_id,quantity,unit,reason,estimated_cost_krw,attachment_file,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(bu,req.body.waste_date||today(),text(req.body.waste_type)||'Damage / Loss',source,id,qty,unit,reason,estimated,req.file?.filename||'',text(req.body.notes),req.user.id),wid=Number(r.lastInsertRowid);if(req.file)saveAttachment(bu,req.user,'Waste',wid,req.file,'Waste / Damage Evidence');return wid});try{const wid=tx();syncWaste(wid);res.json({id:wid})}catch(e){res.status(400).json({error:e.message})}
  });

  app.get('/api/pink-salt/customers',auth,allow('sales','finance','dashboard'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const rows=db.prepare(`SELECT c.*,(SELECT COUNT(*) FROM pink_salt_orders o WHERE o.customer_id=c.id AND o.status='Completed') completed_orders,(SELECT COALESCE(SUM(total_krw),0) FROM pink_salt_orders o WHERE o.customer_id=c.id AND o.status='Completed') lifetime_sales_krw FROM pink_salt_customers c WHERE c.business_unit_id=? ORDER BY c.active DESC,c.name`).all(bu);for(const c of rows){const orders=db.prepare("SELECT id,total_krw,status FROM pink_salt_orders WHERE customer_id=? AND status IN ('Completed','Cancelled')").all(c.id);c.paid_krw=orders.reduce((n,o)=>n+(orderFinancials(o.id)?.net_paid_krw||0),0);c.outstanding_krw=orders.reduce((n,o)=>n+(orderFinancials(o.id)?.outstanding_krw||0),0);c.customer_credit_krw=orders.reduce((n,o)=>n+(orderFinancials(o.id)?.customer_credit_krw||0),0)}res.json(rows)});
  app.post('/api/pink-salt/customers',auth,allow('sales','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const name=text(req.body.name);if(!name)return res.status(400).json({error:'Customer / store name is required.'});const r=db.prepare('INSERT INTO pink_salt_customers(business_unit_id,name,customer_type,sales_channel,contact_person,phone,email,address,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)').run(bu,name,text(req.body.customer_type)||'Ecommerce',text(req.body.sales_channel),text(req.body.contact_person),text(req.body.phone),text(req.body.email),text(req.body.address),text(req.body.notes),req.user.id);audit(req.user,'pink_salt_customer',r.lastInsertRowid,'create',name);res.json({id:Number(r.lastInsertRowid)})});
  app.put('/api/pink-salt/customers/:id',auth,allow('sales','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const x=db.prepare('SELECT * FROM pink_salt_customers WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!x)return res.status(404).json({error:'Customer not found.'});db.prepare('UPDATE pink_salt_customers SET name=?,customer_type=?,sales_channel=?,contact_person=?,phone=?,email=?,address=?,notes=?,active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.name??x.name,req.body.customer_type??x.customer_type,req.body.sales_channel??x.sales_channel,req.body.contact_person??x.contact_person,req.body.phone??x.phone,req.body.email??x.email,req.body.address??x.address,req.body.notes??x.notes,req.body.active===undefined?x.active:bool(req.body.active),x.id);res.json({ok:true})});

  app.get('/api/pink-salt/orders',auth,allow('sales','finance','dashboard','inventory'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const rows=db.prepare(`SELECT o.*,c.name customer,(SELECT COUNT(*) FROM pink_salt_order_items i WHERE i.order_id=o.id) item_count FROM pink_salt_orders o LEFT JOIN pink_salt_customers c ON c.id=o.customer_id WHERE o.business_unit_id=? ORDER BY o.order_date DESC,o.id DESC`).all(bu);for(const o of rows){const f=orderFinancials(o.id);o.paid_krw=f?.net_paid_krw||0;o.refunded_krw=f?.refunded_krw||0;o.outstanding_krw=f?.outstanding_krw||0;o.customer_credit_krw=f?.customer_credit_krw||0}res.json(rows)});
  app.get('/api/pink-salt/orders/:id',auth,allow('sales','finance','dashboard','inventory'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const o=db.prepare('SELECT o.*,c.name customer FROM pink_salt_orders o LEFT JOIN pink_salt_customers c ON c.id=o.customer_id WHERE o.id=? AND o.business_unit_id=?').get(req.params.id,bu);if(!o)return res.status(404).json({error:'Order not found.'});const f=orderFinancials(o.id);res.json({...o,paid_krw:f?.net_paid_krw||0,refunded_krw:f?.refunded_krw||0,outstanding_krw:f?.outstanding_krw||0,customer_credit_krw:f?.customer_credit_krw||0,payments:f?.payments||[],refunds:f?.refunds||[],items:db.prepare('SELECT i.*,p.sku,p.name,p.pack_weight_g FROM pink_salt_order_items i JOIN pink_salt_products p ON p.id=i.product_id WHERE i.order_id=?').all(o.id),attachments:attachments('Order',o.id)})});
  app.post('/api/pink-salt/orders',auth,allow('sales','finance'),upload.single('receipt'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const items=json(req.body.items);if(!Array.isArray(items)||!items.length)return res.status(400).json({error:'Add at least one product to the order.'});const customerId=num(req.body.customer_id)||null,customer=customerId?db.prepare('SELECT * FROM pink_salt_customers WHERE id=? AND business_unit_id=?').get(customerId,bu):null;if(customerId&&!customer)return res.status(400).json({error:'Selected customer is invalid.'});const requested=new Map();let subtotal=0,cost=0;const clean=[];for(const it of items){const p=db.prepare('SELECT * FROM pink_salt_products WHERE id=? AND business_unit_id=? AND active=1').get(num(it.product_id),bu),qty=num(it.quantity_units);if(!p||qty<=0||!Number.isInteger(qty))return res.status(400).json({error:'Every order line needs a valid product and whole-number quantity.'});requested.set(p.id,(requested.get(p.id)||0)+qty);const price=num(it.unit_price_krw)||num(p.selling_price_krw),unitCost=weightedProductCost(p.id);clean.push({p,qty,price,unitCost});subtotal+=qty*price;cost+=qty*unitCost}for(const [pid,qty] of requested){const available=finishedAvailable(pid),p=clean.find(x=>x.p.id===pid)?.p;if(qty>available+1e-6)return res.status(400).json({error:`Not enough available finished stock for ${p?.sku||pid}. Required ${qty}, available ${available}.`})}const total=Math.max(0,subtotal-num(req.body.discount_krw)+num(req.body.delivery_fee_krw)),profit=total-cost-num(req.body.platform_fee_krw),no=text(req.body.order_no)||nextNo('PS-SALE','pink_salt_orders'),status=text(req.body.order_status)==='Reserved'?'Reserved':'Completed',requestedPayment=text(req.body.payment_status)||'Pending',paidNow=requestedPayment==='Paid';if(paidNow&&(!text(req.body.reference)||!req.file))return res.status(400).json({error:'Payment reference and receipt / evidence are required when the order is marked Paid.'});let autoPaymentId=null;const tx=db.transaction(()=>{const r=db.prepare('INSERT INTO pink_salt_orders(business_unit_id,order_no,order_date,customer_id,customer_name,sales_channel,order_type,payment_method,payment_status,reference,subtotal_krw,discount_krw,delivery_fee_krw,platform_fee_krw,total_krw,cost_total_krw,gross_profit_krw,status,receipt_file,prepaid_applied_krw,completed_at,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(bu,no,req.body.order_date||today(),customerId,customer?.name||text(req.body.customer_name),text(req.body.sales_channel)||customer?.sales_channel||'Direct',text(req.body.order_type)||'Retail',text(req.body.payment_method)||'Bank','Pending',text(req.body.reference),subtotal,num(req.body.discount_krw),num(req.body.delivery_fee_krw),num(req.body.platform_fee_krw),total,cost,profit,status,req.file?.filename||'',0,status==='Completed'?new Date().toISOString():null,text(req.body.notes),req.user.id),orderId=Number(r.lastInsertRowid),ins=db.prepare('INSERT INTO pink_salt_order_items(order_id,product_id,quantity_units,unit_price_krw,line_total_krw,unit_cost_krw,line_cost_krw) VALUES(?,?,?,?,?,?,?)'),move=db.prepare('INSERT INTO pink_salt_finished_stock_movements(business_unit_id,product_id,movement_date,movement_type,quantity_units,unit_cost_krw,reference_type,reference_id,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)');for(const x of clean){ins.run(orderId,x.p.id,x.qty,x.price,x.qty*x.price,x.unitCost,x.qty*x.unitCost);if(status==='Completed')move.run(bu,x.p.id,req.body.order_date||today(),'Sale',-x.qty,x.unitCost,'Order',orderId,no,'Finished stock sold',req.user.id)}if(req.file)saveAttachment(bu,req.user,'Order',orderId,req.file,'Sales Payment / Order Evidence');if(paidNow&&total>0){const pr=db.prepare("INSERT INTO pink_salt_customer_payments(business_unit_id,order_id,customer_id,payment_date,payment_role,original_currency,original_amount,fx_rate_to_krw,krw_amount,payment_method,reference,receipt_file,status,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?, 'Active',?,?)").run(bu,orderId,customerId,req.body.order_date||today(),status==='Reserved'?'Advance':'Sale Payment','KRW',total,1,total,text(req.body.payment_method)||'Bank',text(req.body.reference),req.file.filename,'Payment recorded with order',req.user.id);autoPaymentId=Number(pr.lastInsertRowid)}audit(req.user,'pink_salt_order',orderId,status==='Completed'?'complete':'reserve',JSON.stringify({order_no:no,total_krw:total,gross_profit_krw:profit}));return orderId});try{const id=tx();if(status==='Completed')syncOrderSale(id);if(autoPaymentId)syncCustomerPayment(autoPaymentId);const paymentStatus=refreshOrderPaymentStatus(id);notifyPink(bu,status==='Completed'?'info':'warning',status==='Completed'?'Pink Salt sale completed':'Pink Salt order reserved',`${no}: ${customer?.name||text(req.body.customer_name)||'Customer'} · ₩${Math.round(total).toLocaleString()} · ${paymentStatus}.`,'pink_salt_order',id,'psSales',{finance:status==='Completed'||paidNow,managers:true,staff:true});if(status==='Completed')for(const [pid] of requested)checkFinishedLowStock(pid);res.json({id,order_no:no,total_krw:total,gross_profit_krw:profit,status,payment_status:paymentStatus})}catch(e){res.status(409).json({error:e.message.includes('UNIQUE')?'Order number already exists.':e.message})}});
  app.post('/api/pink-salt/orders/:id/complete',auth,allow('sales','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const o=db.prepare('SELECT * FROM pink_salt_orders WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!o)return res.status(404).json({error:'Order not found.'});if(o.status==='Completed')return res.json({ok:true,status:'Completed',payment_status:refreshOrderPaymentStatus(o.id)});if(o.status==='Cancelled')return res.status(409).json({error:'Cancelled orders cannot be completed.'});const items=db.prepare('SELECT i.*,p.sku FROM pink_salt_order_items i JOIN pink_salt_products p ON p.id=i.product_id WHERE i.order_id=?').all(o.id);const requested=new Map();for(const it of items)requested.set(it.product_id,(requested.get(it.product_id)||0)+num(it.quantity_units));for(const [pid,qty] of requested){const available=finishedAvailable(pid,o.id),sku=items.find(x=>x.product_id===pid)?.sku;if(qty>available+1e-6)return res.status(409).json({error:`Not enough stock to complete ${sku||pid}. Required ${qty}, available ${available}.`})}const advances=num(db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_customer_payments WHERE order_id=? AND status='Active' AND payment_role='Advance'").get(o.id)?.v),prepaid=Math.min(num(o.total_krw),advances),completion=req.body.completion_date||today();const tx=db.transaction(()=>{const move=db.prepare('INSERT INTO pink_salt_finished_stock_movements(business_unit_id,product_id,movement_date,movement_type,quantity_units,unit_cost_krw,reference_type,reference_id,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)');for(const it of items)move.run(bu,it.product_id,completion,'Sale',-num(it.quantity_units),num(it.unit_cost_krw),'Order',o.id,o.order_no,'Reserved order completed and dispatched',req.user.id);db.prepare("UPDATE pink_salt_orders SET status='Completed',prepaid_applied_krw=?,completed_at=CURRENT_TIMESTAMP,reference=COALESCE(NULLIF(?,''),reference),updated_at=CURRENT_TIMESTAMP WHERE id=?").run(prepaid,text(req.body.reference),o.id);audit(req.user,'pink_salt_order',o.id,'complete','Reserved order completed')});try{tx();syncOrderSale(o.id);const payment_status=refreshOrderPaymentStatus(o.id);notifyPink(bu,'info','Pink Salt reserved order completed',`${o.order_no}: order completed and finished stock dispatched. Payment status: ${payment_status}.`,'pink_salt_order',o.id,'psSales',{finance:true,managers:true,staff:true});for(const [pid] of requested)checkFinishedLowStock(pid);res.json({ok:true,status:'Completed',payment_status,prepaid_applied_krw:prepaid})}catch(e){res.status(409).json({error:e.message})}});
  app.post('/api/pink-salt/orders/:id/cancel',auth,allow('sales','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const o=db.prepare('SELECT * FROM pink_salt_orders WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!o)return res.status(404).json({error:'Order not found.'});if(o.status==='Cancelled')return res.json({ok:true,payment_status:refreshOrderPaymentStatus(o.id)});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Cancellation reason is required.'});const wasCompleted=o.status==='Completed';const tx=db.transaction(()=>{if(wasCompleted){for(const it of db.prepare('SELECT * FROM pink_salt_order_items WHERE order_id=?').all(o.id))db.prepare('INSERT INTO pink_salt_finished_stock_movements(business_unit_id,product_id,movement_date,movement_type,quantity_units,unit_cost_krw,reference_type,reference_id,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(bu,it.product_id,today(),'Sale Cancellation',it.quantity_units,it.unit_cost_krw,'Order',o.id,o.order_no,reason,req.user.id)}db.prepare("UPDATE pink_salt_orders SET status='Cancelled',notes=COALESCE(notes,'')||?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(` | CANCELLED: ${reason}`,o.id);audit(req.user,'pink_salt_order',o.id,'cancel',reason)});try{tx();if(wasCompleted){voidPinkFinance('Pink Salt Sale',o.id,`Sale cancelled: ${reason}`,req.user.id,bu);voidPinkFinance('Pink Salt Platform Fee',o.id,`Sale cancelled: ${reason}`,req.user.id,bu);postCancellationCreditJournal(o.id)}const payment_status=refreshOrderPaymentStatus(o.id),f=orderFinancials(o.id);notifyPink(bu,'warning','Pink Salt order cancelled',`${o.order_no}: order cancelled. ${f?.customer_credit_krw>0?'Customer credit ₩'+Math.round(f.customer_credit_krw).toLocaleString()+' requires refund/settlement.':'No customer credit remains.'}`,'pink_salt_order',o.id,'psSales',{finance:true,managers:true,staff:true});res.json({ok:true,payment_status,customer_credit_krw:f?.customer_credit_krw||0})}catch(e){res.status(409).json({error:e.message})}});

  app.post('/api/pink-salt/orders/:id/payments',auth,allow('sales','finance'),upload.single('receipt'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const o=db.prepare('SELECT * FROM pink_salt_orders WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!o)return res.status(404).json({error:'Order not found.'});if(o.status==='Cancelled')return res.status(409).json({error:'Use Customer Refund for a cancelled order.'});const currency=text(req.body.original_currency)||'KRW',original=num(req.body.original_amount),rate=currency==='KRW'?1:num(req.body.fx_rate_to_krw),amount=original*rate,reference=text(req.body.reference);if(original<=0||rate<=0||!reference)return res.status(400).json({error:'Payment amount, exchange rate and reference are required.'});if(!req.file)return res.status(400).json({error:'Customer payment receipt / evidence is required.'});const current=orderFinancials(o.id),remaining=Math.max(0,num(o.total_krw)-num(current?.net_paid_krw));if(amount>remaining+0.01)return res.status(409).json({error:`Payment exceeds this order's outstanding amount of ₩${Math.round(remaining).toLocaleString()}.`});const paymentDate=req.body.payment_date||today(),dup=db.prepare("SELECT id FROM pink_salt_customer_payments WHERE order_id=? AND payment_date=? AND lower(trim(reference))=lower(trim(?)) AND ABS(krw_amount-?)<0.01 AND COALESCE(status,'Active')!='Voided' LIMIT 1").get(o.id,paymentDate,reference,amount);if(dup)return res.status(409).json({error:`This customer payment is already recorded as payment #${dup.id}.`,existing_id:dup.id});const role=o.status==='Reserved'?'Advance':'Sale Payment',r=db.prepare("INSERT INTO pink_salt_customer_payments(business_unit_id,order_id,customer_id,payment_date,payment_role,original_currency,original_amount,fx_rate_to_krw,krw_amount,payment_method,reference,receipt_file,status,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?, 'Active',?,?)").run(bu,o.id,o.customer_id||null,paymentDate,role,currency,original,rate,amount,text(req.body.payment_method)||'Bank',reference,req.file.filename,text(req.body.notes),req.user.id),id=Number(r.lastInsertRowid);saveAttachment(bu,req.user,'Order',o.id,req.file,`${role} Receipt / Evidence`);audit(req.user,'pink_salt_customer_payment',id,'create',JSON.stringify({order_id:o.id,krw_amount:amount,payment_role:role}));syncCustomerPayment(id);const payment_status=refreshOrderPaymentStatus(o.id),f=orderFinancials(o.id);notifyPink(bu,f.outstanding_krw<=0.01?'info':'warning',f.outstanding_krw<=0.01?'Pink Salt customer payment cleared':'Pink Salt customer payment received',`${o.order_no}: ₩${Math.round(amount).toLocaleString()} received. Outstanding ₩${Math.round(f.outstanding_krw).toLocaleString()}.`,'pink_salt_order',o.id,'psSales',{finance:true,managers:true});res.json({id,krw_amount:amount,payment_role:role,payment_status,paid_krw:f.net_paid_krw,outstanding_krw:f.outstanding_krw})});

  app.post('/api/pink-salt/orders/:id/refunds',auth,allow('sales','finance'),upload.single('receipt'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const o=db.prepare('SELECT * FROM pink_salt_orders WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!o)return res.status(404).json({error:'Order not found.'});if(o.status!=='Cancelled')return res.status(409).json({error:'Customer refunds are available after the order is cancelled. Cancel the order first so stock and accounting are reversed correctly.'});const currency=text(req.body.original_currency)||'KRW',original=num(req.body.original_amount),rate=currency==='KRW'?1:num(req.body.fx_rate_to_krw),amount=original*rate,reference=text(req.body.reference),reason=text(req.body.reason);if(original<=0||rate<=0||!reference||!reason)return res.status(400).json({error:'Refund amount, exchange rate, reference and reason are required.'});if(!req.file)return res.status(400).json({error:'Customer refund receipt / evidence is required.'});const f=orderFinancials(o.id),available=num(f?.customer_credit_krw);if(amount>available+0.01)return res.status(409).json({error:`Refund exceeds available customer credit of ₩${Math.round(available).toLocaleString()}.`});const refundDate=req.body.refund_date||today(),dup=db.prepare("SELECT id FROM pink_salt_customer_refunds WHERE order_id=? AND refund_date=? AND lower(trim(reference))=lower(trim(?)) AND ABS(krw_amount-?)<0.01 AND COALESCE(status,'Active')!='Voided' LIMIT 1").get(o.id,refundDate,reference,amount);if(dup)return res.status(409).json({error:`This customer refund is already recorded as refund #${dup.id}.`,existing_id:dup.id});const r=db.prepare("INSERT INTO pink_salt_customer_refunds(business_unit_id,order_id,customer_id,refund_date,original_currency,original_amount,fx_rate_to_krw,krw_amount,payment_method,reference,receipt_file,reason,status,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?, 'Active',?,?)").run(bu,o.id,o.customer_id||null,refundDate,currency,original,rate,amount,text(req.body.payment_method)||'Bank',reference,req.file.filename,reason,text(req.body.notes),req.user.id),id=Number(r.lastInsertRowid);saveAttachment(bu,req.user,'Order',o.id,req.file,'Customer Refund Receipt / Evidence');audit(req.user,'pink_salt_customer_refund',id,'create',JSON.stringify({order_id:o.id,krw_amount:amount}));syncCustomerRefund(id);const payment_status=refreshOrderPaymentStatus(o.id),after=orderFinancials(o.id);notifyPink(bu,'info','Pink Salt customer refund recorded',`${o.order_no}: ₩${Math.round(amount).toLocaleString()} refunded. Remaining customer credit ₩${Math.round(after.customer_credit_krw).toLocaleString()}.`,'pink_salt_order',o.id,'psSales',{finance:true,managers:true});res.json({id,krw_amount:amount,payment_status,customer_credit_krw:after.customer_credit_krw})});
  app.get('/api/pink-salt/trace/:kind/:id',auth,allow('inventory','sales','purchases','finance','dashboard'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const kind=text(req.params.kind),id=num(req.params.id);if(kind==='product'){const product=db.prepare('SELECT * FROM pink_salt_products WHERE id=? AND business_unit_id=?').get(id,bu);if(!product)return res.status(404).json({error:'Product not found.'});product.gift_components=giftComponents(product.id);const batches=db.prepare(`SELECT b.id,b.batch_no,b.production_date,b.input_weight_kg,b.waste_weight_kg,o.quantity_units,o.output_weight_kg,(SELECT GROUP_CONCAT(z.label,' + ') FROM (SELECT DISTINCT i.import_no||' / '||pi.salt_grade label FROM pink_salt_production_inputs pi JOIN pink_salt_import_items x ON x.id=pi.import_item_id JOIN pink_salt_imports i ON i.id=x.import_id WHERE pi.production_batch_id=b.id) z) raw_sources FROM pink_salt_production_outputs o JOIN pink_salt_production_batches b ON b.id=o.production_batch_id WHERE o.product_id=? ORDER BY b.id DESC`).all(id),orders=db.prepare(`SELECT o.order_no,o.order_date,o.customer_name,o.sales_channel,oi.quantity_units FROM pink_salt_order_items oi JOIN pink_salt_orders o ON o.id=oi.order_id WHERE oi.product_id=? AND o.status='Completed' ORDER BY o.id DESC`).all(id);return res.json({kind,product,batches,orders})}if(kind==='import-item'){const item=db.prepare(`SELECT x.*,i.import_no,i.container_no,i.actual_arrival,s.name supplier FROM pink_salt_import_items x JOIN pink_salt_imports i ON i.id=x.import_id LEFT JOIN pink_salt_suppliers s ON s.id=i.supplier_id WHERE x.id=? AND i.business_unit_id=?`).get(id,bu);if(!item)return res.status(404).json({error:'Raw batch not found.'});const production=db.prepare(`SELECT b.*,pi.input_weight_kg category_input_weight_kg,pi.required_output_weight_kg,pi.waste_weight_kg category_waste_weight_kg,(SELECT GROUP_CONCAT(p.sku||' × '||o.quantity_units,', ') FROM pink_salt_production_outputs o JOIN pink_salt_products p ON p.id=o.product_id WHERE o.production_batch_id=b.id) outputs FROM pink_salt_production_inputs pi JOIN pink_salt_production_batches b ON b.id=pi.production_batch_id WHERE pi.import_item_id=? ORDER BY b.id DESC`).all(id);return res.json({kind,item,available_kg:rawBalance(id),production})}res.status(400).json({error:'Unsupported traceability type.'})});


  setTimeout(backfillPinkSaltFinance,250);

  app.get('/api/pink-salt/health',auth,(req,res)=>{const bu=guard(req,res);if(!bu)return;res.json({ok:true,version:VERSION,business_unit_id:bu,tables:21,finance_integration:true})});
  console.info('Blue Ocean Market V30.9.0 Pink Salt packaging calculation core loaded');
}

module.exports={install,VERSION};
