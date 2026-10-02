// Blue Ocean Market V30.65.0 — Pink Salt operational + channel-agnostic commerce foundation.
const VERSION='30.65.0';
function install({app,db,auth,allow,currentUnit,enforceUnit,audit}){
  const num=v=>Number(v||0), text=v=>String(v??'').trim();
  const hasCol=(t,c)=>db.prepare(`PRAGMA table_info(${t})`).all().some(x=>x.name===c);
  const addCol=(t,c,d)=>{if(!hasCol(t,c))db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${d}`)};
  const pinkUnit=()=>db.prepare("SELECT id FROM business_units WHERE lower(name) LIKE '%pink%salt%' AND status!='Archived' ORDER BY id LIMIT 1").get()?.id||null;
  function guard(req,res){const bu=Number(pinkUnit()||0),selected=Number(currentUnit(req)||0);if(!bu){res.status(409).json({error:'Pink Salt business unit is not available.'});return null}if(!selected||selected!==bu||!enforceUnit(req,bu)){res.status(403).json({error:'Select the Pink Salt business unit to use this workspace.'});return null}return bu}

  // Extend, never replace, the proven Pink Salt product/order/customer model.
  addCol('pink_salt_products','name_en',"TEXT DEFAULT ''");
  addCol('pink_salt_products','name_ko',"TEXT DEFAULT ''");
  addCol('pink_salt_products','product_family',"TEXT DEFAULT ''");
  addCol('pink_salt_products','variant_label',"TEXT DEFAULT ''");
  addCol('pink_salt_products','product_category',"TEXT DEFAULT 'Pink Salt'");
  addCol('pink_salt_products','grind_mesh',"TEXT DEFAULT ''");
  addCol('pink_salt_products','unit_of_measure',"TEXT DEFAULT 'unit'");
  addCol('pink_salt_products','barcode',"TEXT DEFAULT ''");
  addCol('pink_salt_products','sellable','INTEGER NOT NULL DEFAULT 1');
  addCol('pink_salt_products','shelf_life_days','INTEGER NOT NULL DEFAULT 0');
  addCol('pink_salt_products','origin_country',"TEXT DEFAULT ''");
  addCol('pink_salt_products','ingredients_en',"TEXT DEFAULT ''");
  addCol('pink_salt_products','ingredients_ko',"TEXT DEFAULT ''");
  addCol('pink_salt_products','storage_instructions_en',"TEXT DEFAULT ''");
  addCol('pink_salt_products','storage_instructions_ko',"TEXT DEFAULT ''");
  addCol('pink_salt_products','website_ready','INTEGER NOT NULL DEFAULT 0');
  addCol('pink_salt_production_batches','lot_no',"TEXT DEFAULT ''");
  addCol('pink_salt_production_batches','best_before_date','TEXT');
  addCol('pink_salt_orders','source_channel_id','INTEGER');
  addCol('pink_salt_orders','external_order_id',"TEXT DEFAULT ''");
  addCol('pink_salt_orders','fulfillment_status',"TEXT DEFAULT 'Unfulfilled'");
  addCol('pink_salt_orders','external_payment_reference',"TEXT DEFAULT ''");
  addCol('pink_salt_orders','external_shipment_reference',"TEXT DEFAULT ''");
  addCol('pink_salt_orders','external_settlement_reference',"TEXT DEFAULT ''");

  db.exec(`
    CREATE TABLE IF NOT EXISTS commerce_channels(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_unit_id INTEGER,
      name TEXT NOT NULL,
      channel_type TEXT NOT NULL DEFAULT 'Other',
      integration_mode TEXT NOT NULL DEFAULT 'Manual',
      currency TEXT NOT NULL DEFAULT 'KRW',
      active INTEGER NOT NULL DEFAULT 1,
      system_key TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      capabilities_json TEXT DEFAULT '{}',
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(business_unit_id,name)
    );
    CREATE TABLE IF NOT EXISTS commerce_price_lists(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_unit_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'KRW',
      purpose TEXT DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(business_unit_id,name)
    );
    CREATE TABLE IF NOT EXISTS commerce_price_list_items(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      price_list_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      unit_price REAL NOT NULL DEFAULT 0,
      min_quantity INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      effective_from TEXT,
      effective_to TEXT,
      notes TEXT DEFAULT '',
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(price_list_id,product_id,min_quantity,effective_from),
      FOREIGN KEY(price_list_id) REFERENCES commerce_price_lists(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS commerce_product_channels(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_unit_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      channel_id INTEGER NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      publication_status TEXT NOT NULL DEFAULT 'Not Published',
      external_product_id TEXT DEFAULT '',
      external_variant_id TEXT DEFAULT '',
      external_seller_sku TEXT DEFAULT '',
      price_list_id INTEGER,
      inventory_mode TEXT NOT NULL DEFAULT 'Shared',
      allocated_units REAL NOT NULL DEFAULT 0,
      safety_stock_units REAL NOT NULL DEFAULT 0,
      max_sellable_units REAL,
      sync_enabled INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'Not Configured',
      last_sync_at TEXT,
      sync_error TEXT DEFAULT '',
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id,channel_id),
      FOREIGN KEY(channel_id) REFERENCES commerce_channels(id) ON DELETE CASCADE,
      FOREIGN KEY(price_list_id) REFERENCES commerce_price_lists(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS pink_salt_customer_addresses(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_unit_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      address_type TEXT NOT NULL DEFAULT 'Shipping',
      recipient_name TEXT DEFAULT '', phone TEXT DEFAULT '',
      address_line1 TEXT DEFAULT '', address_line2 TEXT DEFAULT '',
      city TEXT DEFAULT '', region TEXT DEFAULT '', postal_code TEXT DEFAULT '', country TEXT DEFAULT '',
      is_default INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES pink_salt_customers(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS commerce_shipments(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_unit_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      channel_id INTEGER,
      courier TEXT DEFAULT '', service_name TEXT DEFAULT '', tracking_number TEXT DEFAULT '',
      external_shipment_id TEXT DEFAULT '',
      shipment_status TEXT NOT NULL DEFAULT 'Unfulfilled',
      shipping_cost_krw REAL NOT NULL DEFAULT 0,
      customer_delivery_charge_krw REAL NOT NULL DEFAULT 0,
      shipped_at TEXT, delivered_at TEXT,
      notes TEXT DEFAULT '', created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS commerce_external_transactions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_unit_id INTEGER NOT NULL,
      channel_id INTEGER,
      order_id INTEGER,
      transaction_type TEXT NOT NULL,
      external_reference TEXT NOT NULL,
      provider TEXT DEFAULT '', currency TEXT NOT NULL DEFAULT 'KRW', amount REAL NOT NULL DEFAULT 0,
      fee_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Pending',
      payload_json TEXT DEFAULT '{}',
      occurred_at TEXT, created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(channel_id,transaction_type,external_reference)
    );
    CREATE INDEX IF NOT EXISTS idx_commerce_product_channels_bu ON commerce_product_channels(business_unit_id,channel_id,enabled);
    CREATE INDEX IF NOT EXISTS idx_ps_customer_addresses_customer ON pink_salt_customer_addresses(customer_id,active);
    CREATE INDEX IF NOT EXISTS idx_commerce_shipments_order ON commerce_shipments(order_id,shipment_status);
    CREATE INDEX IF NOT EXISTS idx_commerce_external_order ON commerce_external_transactions(order_id,transaction_type);
  `);

  const bu=Number(pinkUnit()||0);
  if(bu){
    db.prepare("UPDATE pink_salt_products SET name_en=CASE WHEN trim(COALESCE(name_en,''))='' THEN name ELSE name_en END, product_category=CASE WHEN trim(COALESCE(product_category,''))='' THEN 'Pink Salt' ELSE product_category END WHERE business_unit_id=?").run(bu);
    const internal=db.prepare("SELECT id FROM commerce_channels WHERE business_unit_id=? AND system_key='internal'").get(bu);
    if(!internal)db.prepare("INSERT INTO commerce_channels(business_unit_id,name,channel_type,integration_mode,currency,active,system_key,notes) VALUES(?,?,'Internal','Manual','KRW',1,'internal',?)").run(bu,'Internal Sales','Built-in Blue Ocean operational sales channel.');
    const retail=db.prepare("SELECT id FROM commerce_price_lists WHERE business_unit_id=? AND name='Retail'").get(bu);
    if(!retail)db.prepare("INSERT INTO commerce_price_lists(business_unit_id,name,currency,purpose,active) VALUES(?,'Retail','KRW','Default retail/channel pricing foundation',1)").run(bu);
  }

  function stock(productId){
    const on=num(db.prepare('SELECT COALESCE(SUM(quantity_units),0) q FROM pink_salt_finished_stock_movements WHERE product_id=?').get(productId)?.q);
    const reserved=num(db.prepare("SELECT COALESCE(SUM(oi.quantity_units),0) q FROM pink_salt_order_items oi JOIN pink_salt_orders o ON o.id=oi.order_id WHERE oi.product_id=? AND o.status='Reserved'").get(productId)?.q);
    return {on_hand_units:on,reserved_units:reserved,available_to_sell_units:Math.max(0,on-reserved)};
  }

  app.get('/api/commerce/foundation-v365',auth,allow('sales','inventory','dashboard','purchases','finance'),(req,res)=>{
    const b=guard(req,res);if(!b)return;
    const channels=db.prepare('SELECT * FROM commerce_channels WHERE business_unit_id=? ORDER BY active DESC,name').all(b);
    const priceLists=db.prepare('SELECT * FROM commerce_price_lists WHERE business_unit_id=? ORDER BY active DESC,name').all(b);
    const products=db.prepare(`SELECT p.*,
      (SELECT COUNT(*) FROM commerce_product_channels pc WHERE pc.product_id=p.id AND pc.enabled=1) enabled_channels,
      (SELECT COUNT(*) FROM commerce_product_channels pc WHERE pc.product_id=p.id) configured_channels
      FROM pink_salt_products p WHERE p.business_unit_id=? ORDER BY p.active DESC,p.name,p.sku`).all(b).map(p=>({...p,...stock(p.id)}));
    const mappings=db.prepare(`SELECT pc.*,c.name channel_name,c.channel_type,c.integration_mode,pl.name price_list_name
      FROM commerce_product_channels pc JOIN commerce_channels c ON c.id=pc.channel_id
      LEFT JOIN commerce_price_lists pl ON pl.id=pc.price_list_id
      WHERE pc.business_unit_id=? ORDER BY c.name,pc.product_id`).all(b);
    res.json({version:VERSION,channels,price_lists:priceLists,products,mappings});
  });

  app.post('/api/commerce/channels-v365',auth,allow('sales','inventory'),(req,res)=>{
    const b=guard(req,res);if(!b)return;const name=text(req.body.name);if(!name)return res.status(400).json({error:'Channel name is required.'});
    const type=text(req.body.channel_type)||'Other',mode=text(req.body.integration_mode)||'Manual';
    if(!['Own Website','Marketplace','Social Commerce','B2B Portal','Internal','Other'].includes(type))return res.status(400).json({error:'Invalid channel type.'});
    if(!['Manual','API','File Import / Export','Webhook','Connector Pending'].includes(mode))return res.status(400).json({error:'Invalid integration mode.'});
    try{const r=db.prepare('INSERT INTO commerce_channels(business_unit_id,name,channel_type,integration_mode,currency,active,notes,created_by) VALUES(?,?,?,?,?,?,?,?)').run(b,name,type,mode,text(req.body.currency)||'KRW',req.body.active===false||String(req.body.active)==='0'?0:1,text(req.body.notes),req.user.id);audit(req.user,'commerce_channel',r.lastInsertRowid,'create',JSON.stringify({name,type,mode}));res.json({id:Number(r.lastInsertRowid)})}catch(e){res.status(409).json({error:'A commerce channel with this name already exists for Pink Salt.'})}
  });

  app.put('/api/commerce/channels-v365/:id',auth,allow('sales','inventory'),(req,res)=>{
    const b=guard(req,res);if(!b)return;const x=db.prepare('SELECT * FROM commerce_channels WHERE id=? AND business_unit_id=?').get(req.params.id,b);if(!x)return res.status(404).json({error:'Commerce channel not found.'});if(x.system_key==='internal'&&req.body.active===false)return res.status(409).json({error:'Internal Sales is a protected system channel.'});
    db.prepare('UPDATE commerce_channels SET name=?,channel_type=?,integration_mode=?,currency=?,active=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(text(req.body.name)||x.name,text(req.body.channel_type)||x.channel_type,text(req.body.integration_mode)||x.integration_mode,text(req.body.currency)||x.currency,req.body.active===undefined?x.active:(req.body.active===false||String(req.body.active)==='0'?0:1),text(req.body.notes??x.notes),x.id);audit(req.user,'commerce_channel',x.id,'update',JSON.stringify(req.body));res.json({ok:true});
  });

  app.put('/api/commerce/products-v365/:productId/channel/:channelId',auth,allow('sales','inventory'),(req,res)=>{
    const b=guard(req,res);if(!b)return;const p=db.prepare('SELECT * FROM pink_salt_products WHERE id=? AND business_unit_id=?').get(req.params.productId,b),c=db.prepare('SELECT * FROM commerce_channels WHERE id=? AND business_unit_id=?').get(req.params.channelId,b);if(!p||!c)return res.status(404).json({error:'Product or channel not found.'});
    const enabled=req.body.enabled===true||String(req.body.enabled)==='1'||String(req.body.enabled).toLowerCase()==='true';
    const mode=text(req.body.inventory_mode)||'Shared';if(!['Shared','Allocated','Maximum Quantity'].includes(mode))return res.status(400).json({error:'Invalid inventory mode.'});
    const publication=enabled?(text(req.body.publication_status)||'Ready'):'Not Published';
    db.prepare(`INSERT INTO commerce_product_channels(business_unit_id,product_id,channel_id,enabled,publication_status,external_product_id,external_variant_id,external_seller_sku,price_list_id,inventory_mode,allocated_units,safety_stock_units,max_sellable_units,sync_enabled,sync_status,created_by)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(product_id,channel_id) DO UPDATE SET enabled=excluded.enabled,publication_status=excluded.publication_status,external_product_id=excluded.external_product_id,external_variant_id=excluded.external_variant_id,external_seller_sku=excluded.external_seller_sku,price_list_id=excluded.price_list_id,inventory_mode=excluded.inventory_mode,allocated_units=excluded.allocated_units,safety_stock_units=excluded.safety_stock_units,max_sellable_units=excluded.max_sellable_units,sync_enabled=excluded.sync_enabled,sync_status=CASE WHEN excluded.sync_enabled=1 THEN 'Connector Pending' ELSE 'Manual' END,updated_at=CURRENT_TIMESTAMP`)
      .run(b,p.id,c.id,enabled?1:0,publication,text(req.body.external_product_id),text(req.body.external_variant_id),text(req.body.external_seller_sku),num(req.body.price_list_id)||null,mode,Math.max(0,num(req.body.allocated_units)),Math.max(0,num(req.body.safety_stock_units)),req.body.max_sellable_units===''||req.body.max_sellable_units==null?null:Math.max(0,num(req.body.max_sellable_units)),req.body.sync_enabled?1:0,req.body.sync_enabled?'Connector Pending':'Manual',req.user.id);
    db.prepare('UPDATE pink_salt_products SET website_ready=CASE WHEN EXISTS(SELECT 1 FROM commerce_product_channels pc JOIN commerce_channels cc ON cc.id=pc.channel_id WHERE pc.product_id=? AND pc.enabled=1 AND cc.channel_type=\'Own Website\') THEN 1 ELSE 0 END,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(p.id,p.id);
    audit(req.user,'commerce_product_channel',p.id,'configure',JSON.stringify({channel_id:c.id,channel:c.name,enabled,inventory_mode:mode}));res.json({ok:true,...stock(p.id)});
  });

  app.get('/api/commerce/products-v365/:productId',auth,allow('sales','inventory','dashboard'),(req,res)=>{
    const b=guard(req,res);if(!b)return;const p=db.prepare('SELECT * FROM pink_salt_products WHERE id=? AND business_unit_id=?').get(req.params.productId,b);if(!p)return res.status(404).json({error:'Product not found.'});const mappings=db.prepare(`SELECT pc.*,c.name channel_name,c.channel_type,c.integration_mode,pl.name price_list_name FROM commerce_channels c LEFT JOIN commerce_product_channels pc ON pc.channel_id=c.id AND pc.product_id=? LEFT JOIN commerce_price_lists pl ON pl.id=pc.price_list_id WHERE c.business_unit_id=? ORDER BY c.active DESC,c.name`).all(p.id,b);res.json({product:{...p,...stock(p.id)},mappings});
  });
}
module.exports={install,VERSION};
