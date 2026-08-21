const Database=require('better-sqlite3');
const bcrypt=require('bcryptjs');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const dataDir=process.env.DATA_DIR?path.resolve(process.env.DATA_DIR):path.join(root,'data');
fs.mkdirSync(dataDir,{recursive:true});
const db=new Database(path.join(dataDir,'blue-ocean.sqlite'));
db.pragma('journal_mode=WAL'); db.pragma('foreign_keys=ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL,business_unit_id INTEGER,active INTEGER NOT NULL DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(business_unit_id) REFERENCES business_units(id));
CREATE TABLE IF NOT EXISTS business_units(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE NOT NULL,manager_id INTEGER,status TEXT NOT NULL DEFAULT 'Active',notes TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(manager_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,owner_id INTEGER NOT NULL,business_unit_id INTEGER,priority TEXT DEFAULT 'Normal',status TEXT DEFAULT 'Not Started',due_date TEXT,expected_result TEXT DEFAULT '',recurring TEXT DEFAULT 'None',created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(owner_id) REFERENCES users(id),FOREIGN KEY(business_unit_id) REFERENCES business_units(id));
CREATE TABLE IF NOT EXISTS task_history(id INTEGER PRIMARY KEY AUTOINCREMENT,task_id INTEGER,user_id INTEGER,action TEXT,note TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL,sku TEXT NOT NULL,name TEXT NOT NULL,category TEXT DEFAULT 'General',supplier TEXT DEFAULT '',item_type TEXT NOT NULL DEFAULT 'PRODUCT',unit TEXT DEFAULT 'pcs',opening_stock REAL DEFAULT 0,current_stock REAL DEFAULT 0,reorder_level REAL DEFAULT 0,cost_price REAL DEFAULT 0,selling_price REAL DEFAULT 0,tax_rate REAL DEFAULT 0,active INTEGER DEFAULT 1,UNIQUE(business_unit_id,sku),FOREIGN KEY(business_unit_id) REFERENCES business_units(id));
CREATE TABLE IF NOT EXISTS stock_movements(id INTEGER PRIMARY KEY AUTOINCREMENT,product_id INTEGER,type TEXT,quantity REAL,unit_cost REAL DEFAULT 0,reason TEXT DEFAULT '',reference_type TEXT,reference_id INTEGER,user_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE IF NOT EXISTS customers(id INTEGER PRIMARY KEY AUTOINCREMENT,company TEXT NOT NULL,contact TEXT DEFAULT '',phone TEXT DEFAULT '',email TEXT DEFAULT '',source TEXT DEFAULT '',business_unit_id INTEGER,stage TEXT DEFAULT 'Lead',potential_value REAL DEFAULT 0,next_followup TEXT,notes TEXT DEFAULT '',owner_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(business_unit_id) REFERENCES business_units(id));
CREATE TABLE IF NOT EXISTS sales(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL,invoice_no TEXT UNIQUE NOT NULL,customer_id INTEGER,customer_name TEXT DEFAULT '',order_type TEXT DEFAULT 'Sale',payment_method TEXT DEFAULT 'Cash',subtotal REAL DEFAULT 0,discount REAL DEFAULT 0,tax REAL DEFAULT 0,total REAL DEFAULT 0,cost_total REAL DEFAULT 0,gross_profit REAL DEFAULT 0,status TEXT DEFAULT 'Completed',receipt_file TEXT DEFAULT '',notes TEXT DEFAULT '',created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(business_unit_id) REFERENCES business_units(id),FOREIGN KEY(customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS sale_items(id INTEGER PRIMARY KEY AUTOINCREMENT,sale_id INTEGER NOT NULL,product_id INTEGER,item_type TEXT DEFAULT 'PRODUCT',item_name TEXT NOT NULL,quantity REAL,unit_price REAL,unit_cost REAL DEFAULT 0,tax_rate REAL DEFAULT 0,line_total REAL,FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE IF NOT EXISTS purchases(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL,purchase_no TEXT UNIQUE NOT NULL,supplier_name TEXT DEFAULT '',payment_method TEXT DEFAULT 'Cash',subtotal REAL DEFAULT 0,tax REAL DEFAULT 0,total REAL DEFAULT 0,attachment_file TEXT DEFAULT '',status TEXT DEFAULT 'Received',notes TEXT DEFAULT '',created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(business_unit_id) REFERENCES business_units(id));
CREATE TABLE IF NOT EXISTS purchase_items(id INTEGER PRIMARY KEY AUTOINCREMENT,purchase_id INTEGER NOT NULL,product_id INTEGER,item_name TEXT NOT NULL,quantity REAL,unit_cost REAL,line_total REAL,FOREIGN KEY(purchase_id) REFERENCES purchases(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS finance_entries(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL,type TEXT NOT NULL,category TEXT NOT NULL,amount REAL NOT NULL,description TEXT DEFAULT '',due_date TEXT,status TEXT DEFAULT 'Recorded',receipt_file TEXT DEFAULT '',payment_method TEXT DEFAULT '',reference TEXT DEFAULT '',created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(business_unit_id) REFERENCES business_units(id));
CREATE TABLE IF NOT EXISTS approvals(id INTEGER PRIMARY KEY AUTOINCREMENT,type TEXT,requester_id INTEGER,business_unit_id INTEGER,amount REAL DEFAULT 0,reason TEXT DEFAULT '',status TEXT DEFAULT 'Pending',attachment_file TEXT DEFAULT '',current_step TEXT DEFAULT 'Finance Check',decided_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,decided_at TEXT);
CREATE TABLE IF NOT EXISTS daily_reports(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,report_date TEXT,completed TEXT,pending TEXT,blockers TEXT,tomorrow_priority TEXT,need_approval INTEGER DEFAULT 0,need_help TEXT,status TEXT DEFAULT 'Green',UNIQUE(user_id,report_date));
CREATE TABLE IF NOT EXISTS kpis(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,business_unit_id INTEGER,name TEXT,target REAL DEFAULT 0,actual REAL DEFAULT 0,period TEXT DEFAULT 'Monthly',updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS documents(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,category TEXT,version TEXT DEFAULT '1.0',business_unit_id INTEGER,file_path TEXT,approved INTEGER DEFAULT 0,uploaded_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS meetings(id INTEGER PRIMARY KEY AUTOINCREMENT,meeting_date TEXT,title TEXT,summary TEXT DEFAULT '',business_unit_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(business_unit_id) REFERENCES business_units(id));
CREATE TABLE IF NOT EXISTS meeting_actions(id INTEGER PRIMARY KEY AUTOINCREMENT,meeting_id INTEGER,title TEXT,owner_id INTEGER,due_date TEXT,status TEXT DEFAULT 'Open');
CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,level TEXT,title TEXT,message TEXT,read_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,entity TEXT,entity_id INTEGER,action TEXT,details TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS password_resets(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,token TEXT UNIQUE,expires_at TEXT,used INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS restaurant_tables(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER,name TEXT,capacity INTEGER DEFAULT 4,status TEXT DEFAULT 'Available',UNIQUE(business_unit_id,name));
CREATE TABLE IF NOT EXISTS restaurant_orders(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER,table_id INTEGER,order_no TEXT UNIQUE,order_type TEXT DEFAULT 'Dine-in',customer_name TEXT DEFAULT '',status TEXT DEFAULT 'Open',subtotal REAL DEFAULT 0,discount REAL DEFAULT 0,tax REAL DEFAULT 0,total REAL DEFAULT 0,payment_method TEXT DEFAULT '',sale_id INTEGER,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,closed_at TEXT);
CREATE TABLE IF NOT EXISTS restaurant_order_items(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER,product_id INTEGER,item_name TEXT,quantity REAL,unit_price REAL,unit_cost REAL,line_total REAL,kitchen_status TEXT DEFAULT 'Pending',notes TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS restaurant_waste(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER,product_id INTEGER,quantity REAL,reason TEXT,estimated_cost REAL,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS restaurant_closings(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER,business_date TEXT,cash_sales REAL DEFAULT 0,card_sales REAL DEFAULT 0,other_sales REAL DEFAULT 0,cash_counted REAL DEFAULT 0,variance REAL DEFAULT 0,notes TEXT,closed_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(business_unit_id,business_date));
CREATE TABLE IF NOT EXISTS restaurant_menu_items(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL,product_id INTEGER,name TEXT NOT NULL,category TEXT DEFAULT 'General',price REAL DEFAULT 0,active INTEGER DEFAULT 1,available INTEGER DEFAULT 1,description TEXT DEFAULT '',FOREIGN KEY(business_unit_id) REFERENCES business_units(id),FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE IF NOT EXISTS restaurant_weekly_menus(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL,menu_date TEXT NOT NULL,meal_period TEXT DEFAULT 'All Day',menu_item_id INTEGER NOT NULL,published INTEGER DEFAULT 0,notes TEXT DEFAULT '',FOREIGN KEY(business_unit_id) REFERENCES business_units(id),FOREIGN KEY(menu_item_id) REFERENCES restaurant_menu_items(id));
CREATE TABLE IF NOT EXISTS restaurant_buffets(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL,name TEXT NOT NULL,buffet_date TEXT NOT NULL,start_time TEXT,end_time TEXT,price REAL DEFAULT 0,capacity INTEGER DEFAULT 0,status TEXT DEFAULT 'Draft',notes TEXT DEFAULT '',created_by INTEGER,FOREIGN KEY(business_unit_id) REFERENCES business_units(id));
CREATE TABLE IF NOT EXISTS restaurant_buffet_items(id INTEGER PRIMARY KEY AUTOINCREMENT,buffet_id INTEGER NOT NULL,menu_item_id INTEGER NOT NULL,quantity REAL DEFAULT 1,FOREIGN KEY(buffet_id) REFERENCES restaurant_buffets(id) ON DELETE CASCADE,FOREIGN KEY(menu_item_id) REFERENCES restaurant_menu_items(id));
CREATE TABLE IF NOT EXISTS restaurant_recipes(id INTEGER PRIMARY KEY AUTOINCREMENT,menu_item_id INTEGER NOT NULL,product_id INTEGER NOT NULL,quantity REAL NOT NULL,unit TEXT DEFAULT 'pcs',UNIQUE(menu_item_id,product_id),FOREIGN KEY(menu_item_id) REFERENCES restaurant_menu_items(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE IF NOT EXISTS excavator_assets(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL,asset_no TEXT NOT NULL,type TEXT DEFAULT 'Excavator',make TEXT DEFAULT '',model TEXT DEFAULT '',year INTEGER,serial_no TEXT DEFAULT '',condition_status TEXT DEFAULT 'Used',status TEXT DEFAULT 'Available',purchase_date TEXT,purchase_price REAL DEFAULT 0,customer_id INTEGER,selling_price REAL DEFAULT 0,notes TEXT DEFAULT '',created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(business_unit_id,asset_no),FOREIGN KEY(business_unit_id) REFERENCES business_units(id),FOREIGN KEY(customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS excavator_repairs(id INTEGER PRIMARY KEY AUTOINCREMENT,asset_id INTEGER NOT NULL,repair_date TEXT,vendor TEXT DEFAULT '',description TEXT DEFAULT '',amount REAL DEFAULT 0,status TEXT DEFAULT 'Completed',attachment_file TEXT DEFAULT '',created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(asset_id) REFERENCES excavator_assets(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS excavator_logistics(id INTEGER PRIMARY KEY AUTOINCREMENT,asset_id INTEGER NOT NULL,logistics_date TEXT,mode TEXT DEFAULT 'Sea',provider TEXT DEFAULT '',origin TEXT DEFAULT '',destination TEXT DEFAULT '',tracking_no TEXT DEFAULT '',amount REAL DEFAULT 0,status TEXT DEFAULT 'Planned',attachment_file TEXT DEFAULT '',created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(asset_id) REFERENCES excavator_assets(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS excavator_payments(id INTEGER PRIMARY KEY AUTOINCREMENT,asset_id INTEGER NOT NULL,payment_type TEXT DEFAULT 'Purchase',amount REAL DEFAULT 0,due_date TEXT,paid_date TEXT,status TEXT DEFAULT 'Pending',method TEXT DEFAULT 'Bank',reference TEXT DEFAULT '',notes TEXT DEFAULT '',created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(asset_id) REFERENCES excavator_assets(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS excavator_parts(id INTEGER PRIMARY KEY AUTOINCREMENT,asset_id INTEGER,part_name TEXT NOT NULL,condition_status TEXT DEFAULT 'New',source TEXT DEFAULT 'Purchased',purchase_date TEXT,cost REAL DEFAULT 0,quantity REAL DEFAULT 1,used_for_repair INTEGER DEFAULT 0,sold_export INTEGER DEFAULT 0,sale_price REAL DEFAULT 0,sale_date TEXT,status TEXT DEFAULT 'In Stock',notes TEXT DEFAULT '',created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(asset_id) REFERENCES excavator_assets(id) ON DELETE SET NULL);
CREATE TABLE IF NOT EXISTS excavator_documents(id INTEGER PRIMARY KEY AUTOINCREMENT,asset_id INTEGER NOT NULL,stage TEXT NOT NULL,transaction_type TEXT DEFAULT '',transaction_id INTEGER,title TEXT NOT NULL,original_name TEXT NOT NULL,file_path TEXT NOT NULL,mime_type TEXT DEFAULT '',size_bytes INTEGER DEFAULT 0,uploaded_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(asset_id) REFERENCES excavator_assets(id) ON DELETE CASCADE);

`);
try{db.exec("ALTER TABLE meetings ADD COLUMN business_unit_id INTEGER");}catch(e){}
try{db.exec("ALTER TABLE restaurant_menu_items ADD COLUMN price_mode TEXT DEFAULT 'Fixed'");}catch(e){}
try{db.exec("ALTER TABLE restaurant_menu_items ADD COLUMN tax_rate REAL DEFAULT 0");}catch(e){}
const units=['MIMI Resturant','Excavator','Mango / Seasonal','Pink Salt'];
try{db.exec("ALTER TABLE excavator_assets ADD COLUMN lifecycle_stage TEXT DEFAULT 'Purchased'");}catch(e){}
try{db.exec("ALTER TABLE excavator_assets ADD COLUMN machine_name TEXT DEFAULT ''");}catch(e){}
const addUnit=db.prepare('INSERT OR IGNORE INTO business_units(name,notes) VALUES(?,?)'); units.forEach(x=>addUnit.run(x,`${x} management workspace`));
// Add required workspaces without deleting or mutating historical/custom business units.

let admin=db.prepare("SELECT id FROM users WHERE role='CEO / Owner' ORDER BY id LIMIT 1").get();
if(!admin){
  const adminEmail=String(process.env.ADMIN_EMAIL||'').trim(),adminPassword=String(process.env.ADMIN_PASSWORD||'');
  if(!adminEmail||adminPassword.length<12)throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) are required for first startup.');
  const r=db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Abdullah Muzammil',adminEmail,bcrypt.hashSync(adminPassword,12),'CEO / Owner');admin={id:r.lastInsertRowid};
}
const unitId=n=>db.prepare('SELECT id FROM business_units WHERE name=?').get(n)?.id;
const mimi=unitId('MIMI Resturant');
const seedProduct=db.prepare('INSERT OR IGNORE INTO products(business_unit_id,sku,name,category,supplier,item_type,unit,opening_stock,current_stock,reorder_level,cost_price,selling_price,tax_rate) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)');
if(mimi){seedProduct.run(mimi,'MIMI-001','Chicken Biryani','Main Course','MIMI Kitchen','PRODUCT','plate',0,0,5,280,450,0);seedProduct.run(mimi,'MIMI-002','Chicken Burger','Fast Food','MIMI Kitchen','PRODUCT','pcs',0,0,5,220,380,0);seedProduct.run(mimi,'MIMI-003','Tea','Beverage','MIMI Kitchen','PRODUCT','cup',0,0,10,45,100,0);seedProduct.run(mimi,'MIMI-004','Delivery Service','Service','MIMI','SERVICE','service',0,0,0,0,250,0);for(let i=1;i<=12;i++)db.prepare('INSERT OR IGNORE INTO restaurant_tables(business_unit_id,name,capacity) VALUES(?,?,?)').run(mimi,`Table ${i}`,i<=4?2:i<=10?4:6);}
const demoPassword=String(process.env.DEMO_USER_PASSWORD||'');
if(process.env.SEED_DEMO_USERS==='true'&&demoPassword.length>=12&&db.prepare('SELECT COUNT(*) c FROM users').get().c===1){const defs=[['Ahmed Khan','Business Unit Manager','MIMI Resturant'],['Bilal Ahmed','Finance / Admin','Excavator'],['Hassan Raza','Sales / Business Development','Mango / Seasonal'],['Usman Ali','Business Unit Manager','Pink Salt'],['Sara Ali','Staff Member','MIMI Resturant']];const st=db.prepare('INSERT INTO users(name,email,password_hash,role,business_unit_id) VALUES(?,?,?,?,?)');defs.forEach(([n,r,b])=>st.run(n,n.toLowerCase().replace(/\s+/g,'.')+'@blueocean.local',bcrypt.hashSync(demoPassword,12),r,unitId(b)));}

if(mimi){
  const mp=db.prepare('INSERT OR IGNORE INTO restaurant_menu_items(business_unit_id,product_id,name,category,price,active,available,description) VALUES(?,?,?,?,?,?,?,?)');
  db.prepare('SELECT id,name,selling_price,category FROM products WHERE business_unit_id=? AND active=1').all(mimi).forEach(x=>mp.run(mimi,x.id,x.name,x.category,x.selling_price,1,1,''));
}


// V20: migrate databases created by earlier versions.
function v20EnsureColumn(table, column, definition) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(x => x.name);
    if (cols.length && !cols.includes(column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  } catch (e) {
    console.error(`V20 migration ${table}.${column}:`, e.message);
  }
}
try {
  // V22: full compatibility for Excavator transaction tables from earlier versions.
  v20EnsureColumn('excavator_transactions','asset_id','INTEGER');
  v20EnsureColumn('excavator_transactions','type',"TEXT DEFAULT 'Other Cost'");
  v20EnsureColumn('excavator_transactions','stage',"TEXT DEFAULT 'Purchased'");
  v20EnsureColumn('excavator_transactions','transaction_date','TEXT');
  v20EnsureColumn('excavator_transactions','counterparty',"TEXT DEFAULT ''");
  v20EnsureColumn('excavator_transactions','amount','REAL DEFAULT 0');
  v20EnsureColumn('excavator_transactions','currency',"TEXT DEFAULT 'KRW'");
  v20EnsureColumn('excavator_transactions','status',"TEXT DEFAULT 'Open'");
  v20EnsureColumn('excavator_transactions','notes',"TEXT DEFAULT ''");
  v20EnsureColumn('excavator_transactions','metadata',"TEXT DEFAULT ''");
  v20EnsureColumn('excavator_transactions','created_by','INTEGER');
  v20EnsureColumn('notifications','read_at','TEXT');
} catch (e) {
  console.error('V20 database migration:', e.message);
}

// V14 Excavator lifecycle and transaction layer
try{db.exec(`
CREATE TABLE IF NOT EXISTS excavator_transactions(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 asset_id INTEGER NOT NULL,
 type TEXT NOT NULL,
 stage TEXT NOT NULL,
 transaction_date TEXT,
 counterparty TEXT DEFAULT '',
 amount REAL DEFAULT 0,
 currency TEXT DEFAULT 'KRW',
 status TEXT DEFAULT 'Open',
 notes TEXT DEFAULT '',
 metadata TEXT DEFAULT '',
 created_by INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(asset_id) REFERENCES excavator_assets(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS excavator_lifecycle_events(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 asset_id INTEGER NOT NULL,
 from_stage TEXT,
 to_stage TEXT NOT NULL,
 note TEXT DEFAULT '',
 user_id INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(asset_id) REFERENCES excavator_assets(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS excavator_part_stock(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 business_unit_id INTEGER NOT NULL,
 part_no TEXT DEFAULT '',
 part_name TEXT NOT NULL,
 condition_status TEXT DEFAULT 'Used',
 quantity REAL DEFAULT 0,
 unit_cost REAL DEFAULT 0,
 supplier TEXT DEFAULT '',
 location TEXT DEFAULT '',
 status TEXT DEFAULT 'In Stock',
 notes TEXT DEFAULT '',
 created_by INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
);
`)}catch(e){console.error('V14 schema',e.message)}

// V26.5 traceability schema
for(const [t,c,d] of [['finance_entries','void_reason',"TEXT DEFAULT ''"],['finance_entries','voided_by','INTEGER'],['finance_entries','voided_at','TEXT'],['notifications','business_unit_id','INTEGER'],['notifications','entity_type',"TEXT DEFAULT ''"],['notifications','entity_id','INTEGER'],['notifications','action_view',"TEXT DEFAULT ''"],['notifications','action_id','INTEGER'],['excavator_buyer_payments','status',"TEXT DEFAULT 'Active'"]]){try{db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${d}`)}catch(_) {}}
try{db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_bu ON notifications(business_unit_id,created_at)')}catch(e){}
try{db.exec('CREATE INDEX IF NOT EXISTS idx_finance_source ON finance_entries(source_type,source_id)')}catch(e){}

// V27.4 — finance verification/source integrity indexes. Keep source uniqueness scoped by business unit.
try{db.exec('CREATE INDEX IF NOT EXISTS idx_finance_unit_source_v274 ON finance_entries(business_unit_id,source_type,source_id)')}catch(e){}
try{db.exec('CREATE INDEX IF NOT EXISTS idx_finance_verification_v274 ON finance_entries(business_unit_id,verification_status,status)')}catch(e){}
module.exports=db;

// V24.4 schema
try{db.exec(`
CREATE TABLE IF NOT EXISTS excavator_suppliers(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL,name TEXT NOT NULL,location TEXT DEFAULT '',contact_person TEXT DEFAULT '',phone TEXT DEFAULT '',email TEXT DEFAULT '',address TEXT DEFAULT '',notes TEXT DEFAULT '',active INTEGER DEFAULT 1,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(business_unit_id) REFERENCES business_units(id));
CREATE TABLE IF NOT EXISTS excavator_supplier_requirements(id INTEGER PRIMARY KEY AUTOINCREMENT,supplier_id INTEGER NOT NULL,requirement TEXT DEFAULT '',machine_type TEXT DEFAULT '',make TEXT DEFAULT '',model TEXT DEFAULT '',min_year INTEGER,max_year INTEGER,condition_status TEXT DEFAULT '',budget_max REAL DEFAULT 0,action_type TEXT DEFAULT 'Buy',exchange_machine TEXT DEFAULT '',status TEXT DEFAULT 'Active',notes TEXT DEFAULT '',created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(supplier_id) REFERENCES excavator_suppliers(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS excavator_supplier_machines(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  machine_name TEXT DEFAULT '',
  machine_type TEXT DEFAULT 'Excavator',
  make TEXT DEFAULT '',
  model TEXT DEFAULT '',
  year INTEGER,
  serial_no TEXT DEFAULT '',
  condition_status TEXT DEFAULT 'Used',
  asking_price REAL DEFAULT 0,
  location TEXT DEFAULT '',
  status TEXT DEFAULT 'Available',
  notes TEXT DEFAULT '',
  created_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(supplier_id) REFERENCES excavator_suppliers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS finance_attachments(id INTEGER PRIMARY KEY AUTOINCREMENT,finance_entry_id INTEGER NOT NULL,title TEXT DEFAULT '',original_name TEXT NOT NULL,file_path TEXT NOT NULL,mime_type TEXT DEFAULT '',size_bytes INTEGER DEFAULT 0,uploaded_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(finance_entry_id) REFERENCES finance_entries(id) ON DELETE CASCADE);
`)}catch(e){console.error('V24.4 schema',e.message)}

// V26 Buyer management schema
try{db.exec(`
CREATE TABLE IF NOT EXISTS excavator_buyers(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 business_unit_id INTEGER NOT NULL,
 name TEXT NOT NULL,
 country TEXT DEFAULT '',
 location TEXT DEFAULT '',
 contact_person TEXT DEFAULT '',
 phone TEXT DEFAULT '',
 whatsapp TEXT DEFAULT '',
 email TEXT DEFAULT '',
 address TEXT DEFAULT '',
 payment_terms TEXT DEFAULT '',
 notes TEXT DEFAULT '',
 active INTEGER DEFAULT 1,
 buyer_type TEXT DEFAULT 'International',
 created_by INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
);
CREATE TABLE IF NOT EXISTS excavator_buyer_payments(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 buyer_id INTEGER NOT NULL,
 asset_id INTEGER,
 payment_type TEXT DEFAULT 'Advance',
 original_amount REAL DEFAULT 0,
 currency TEXT DEFAULT 'KRW',
 fx_rate REAL DEFAULT 1,
 krw_amount REAL DEFAULT 0,
 payment_date TEXT,
 method TEXT DEFAULT 'Bank',
 reference TEXT,
 receipt_file TEXT DEFAULT '',
 receipt_document_id INTEGER,
 notes TEXT DEFAULT '',
 created_by INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(buyer_id) REFERENCES excavator_buyers(id) ON DELETE CASCADE,
 FOREIGN KEY(asset_id) REFERENCES excavator_assets(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS excavator_buyer_payment_allocations(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 payment_id INTEGER NOT NULL,
 buyer_id INTEGER NOT NULL,
 asset_id INTEGER NOT NULL,
 amount_krw REAL NOT NULL DEFAULT 0,
 allocation_date TEXT DEFAULT CURRENT_TIMESTAMP,
 created_by INTEGER,
 notes TEXT DEFAULT '',
 FOREIGN KEY(payment_id) REFERENCES excavator_buyer_payments(id) ON DELETE CASCADE,
 FOREIGN KEY(buyer_id) REFERENCES excavator_buyers(id) ON DELETE CASCADE,
 FOREIGN KEY(asset_id) REFERENCES excavator_assets(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS excavator_buyer_requirements(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 buyer_id INTEGER NOT NULL,
 requirement TEXT DEFAULT '',
 machine_type TEXT DEFAULT '',
 make TEXT DEFAULT '',
 model TEXT DEFAULT '',
 min_year INTEGER,
 max_year INTEGER,
 budget_max REAL DEFAULT 0,
 quantity REAL DEFAULT 1,
 status TEXT DEFAULT 'Active',
 notes TEXT DEFAULT '',
 created_by INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(buyer_id) REFERENCES excavator_buyers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS excavator_buyer_resale_shares(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 buyer_id INTEGER NOT NULL,
 asset_id INTEGER NOT NULL,
 resale_price_pkr REAL DEFAULT 0,
 resale_profit_pkr REAL DEFAULT 0,
 share_percent REAL DEFAULT 0,
 our_share_pkr REAL DEFAULT 0,
 amount_received_pkr REAL DEFAULT 0,
 outstanding_pkr REAL DEFAULT 0,
 received INTEGER DEFAULT 0,
 received_date TEXT,
 reference TEXT DEFAULT '',
 receipt_file TEXT DEFAULT '',
 receipt_document_id INTEGER,
 notes TEXT DEFAULT '',
 created_by INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(buyer_id) REFERENCES excavator_buyers(id) ON DELETE CASCADE,
 FOREIGN KEY(asset_id) REFERENCES excavator_assets(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS excavator_buyer_documents(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 buyer_id INTEGER NOT NULL,
 payment_id INTEGER,
 asset_id INTEGER,
 title TEXT DEFAULT '',
 original_name TEXT NOT NULL,
 file_path TEXT NOT NULL,
 mime_type TEXT DEFAULT '',
 size_bytes INTEGER DEFAULT 0,
 uploaded_by INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(buyer_id) REFERENCES excavator_buyers(id) ON DELETE CASCADE
);
`)}catch(e){console.error('V26 buyer schema',e.message)}
// V26.7: Buyer-payment status migration must run AFTER the buyer-payment table exists.
// The older V26.5 migration ran before this table was created on a fresh database,
// leaving the status column missing and causing the Buyers API queries to fail.
try{db.exec("ALTER TABLE excavator_buyer_payments ADD COLUMN status TEXT DEFAULT 'Active'")}catch(e){}
try{db.exec("UPDATE excavator_buyer_payments SET status='Active' WHERE status IS NULL OR status=''")}catch(e){}
try{db.exec("CREATE INDEX IF NOT EXISTS idx_buyer_payments_buyer_status ON excavator_buyer_payments(buyer_id,status,payment_date)")}catch(e){}
try{db.exec("ALTER TABLE excavator_buyers ADD COLUMN buyer_type TEXT DEFAULT 'International'")}catch(e){}
try{db.exec("ALTER TABLE excavator_assets ADD COLUMN supplier_machine_id INTEGER")}catch(e){}
try{db.exec("UPDATE excavator_buyers SET buyer_type=CASE WHEN lower(country)='south korea' OR lower(country)='korea' OR lower(country)='republic of korea' THEN 'Local' ELSE 'International' END WHERE buyer_type IS NULL OR buyer_type=''")}catch(e){}
try{db.exec("CREATE INDEX IF NOT EXISTS idx_buyer_payment_alloc_payment ON excavator_buyer_payment_allocations(payment_id)")}catch(e){}
try{db.exec("CREATE INDEX IF NOT EXISTS idx_buyer_payment_alloc_asset ON excavator_buyer_payment_allocations(asset_id)")}catch(e){}
try{const legacy=db.prepare("SELECT id,buyer_id,asset_id,krw_amount,created_by FROM excavator_buyer_payments WHERE asset_id IS NOT NULL").all();const ins=db.prepare("INSERT INTO excavator_buyer_payment_allocations(payment_id,buyer_id,asset_id,amount_krw,allocation_date,created_by,notes) VALUES(?,?,?, ?,CURRENT_TIMESTAMP,?,?)");for(const p of legacy){const exists=db.prepare('SELECT 1 FROM excavator_buyer_payment_allocations WHERE payment_id=? AND asset_id=?').get(p.id,p.asset_id);if(!exists)ins.run(p.id,p.buyer_id,p.asset_id,p.krw_amount,p.created_by,'Migrated from legacy payment allocation');}}catch(e){console.error('Buyer allocation migration',e.message)}
try{db.exec("ALTER TABLE excavator_assets ADD COLUMN buyer_id INTEGER")}catch(e){}
// V28 keeps historical buyer-payment constraints in place. Required payment date,
// reference and evidence are enforced by the API without rebuilding or dropping tables.

for(const [t,c,d] of [['finance_entries','verification_status',"TEXT DEFAULT 'Pending Verification'"],['finance_entries','verified_by','INTEGER'],['finance_entries','verified_at','TEXT'],['finance_entries','verification_note',"TEXT DEFAULT ''"],['finance_entries','source_type',"TEXT DEFAULT 'Manual'"],['finance_entries','source_id','INTEGER'],['excavator_assets','supplier_id','INTEGER'],['excavator_assets','purchase_token','REAL DEFAULT 0'],['excavator_assets','purchase_balance','REAL DEFAULT 0'],['excavator_assets','purchase_payment_status',"TEXT DEFAULT 'Pending'"]]){try{db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${d}`)}catch(e){}}

// V27.0 — configurable approvals, people/performance, structured reporting,
// sale-update traceability and final compatibility migrations.
function v27EnsureColumn(table,column,definition){
  try{
    const cols=db.prepare(`PRAGMA table_info(${table})`).all().map(x=>x.name);
    if(cols.length && !cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }catch(e){console.error(`V27 migration ${table}.${column}:`,e.message)}
}

// Retain compatibility columns through additive migrations only.
// Re-assert it at the end of all buyer-payment migrations.
v27EnsureColumn('excavator_buyer_payments','status',"TEXT DEFAULT 'Active'");
try{db.exec("UPDATE excavator_buyer_payments SET status='Active' WHERE status IS NULL OR status=''")}catch(e){}

for(const [t,c,d] of [
  ['finance_entries','updated_at','TEXT'],
  ['finance_entries','transaction_date','TEXT'],
  ['finance_entries','original_amount','REAL'],
  ['finance_entries','original_currency',"TEXT DEFAULT 'KRW'"],
  ['finance_entries','fx_rate','REAL DEFAULT 1'],
  ['finance_entries','krw_amount','REAL'],
  ['finance_entries','source_record_id','INTEGER'],
  ['finance_entries','source_payment_id','INTEGER'],
  ['finance_entries','source_label',"TEXT DEFAULT ''"],
  ['finance_entries','correction_reason',"TEXT DEFAULT ''"],
  ['finance_entries','submitted_at','TEXT'],
  ['finance_entries','resubmitted_at','TEXT'],
  ['audit_log','business_unit_id','INTEGER'],
  ['sales','void_reason',"TEXT DEFAULT ''"],
  ['sales','voided_by','INTEGER'],
  ['sales','voided_at','TEXT'],
  ['approvals','action_key',"TEXT DEFAULT 'general.request'"],
  ['approvals','source_entity',"TEXT DEFAULT ''"],
  ['approvals','source_id','INTEGER'],
  ['approvals','priority',"TEXT DEFAULT 'Normal'"],
  ['approvals','required_level','INTEGER DEFAULT 2'],
  ['approvals','current_level','INTEGER DEFAULT 0'],
  ['approvals','decision_note',"TEXT DEFAULT ''"],
  ['approvals','updated_at','TEXT'],
  ['approvals','executed_at','TEXT'],
  ['tasks','description',"TEXT DEFAULT ''"],
  ['tasks','complexity',"TEXT DEFAULT 'Medium'"],
  ['tasks','work_points','REAL DEFAULT 2'],
  ['tasks','progress_percent','REAL DEFAULT 0'],
  ['tasks','start_date','TEXT'],
  ['tasks','completed_at','TEXT'],
  ['tasks','related_module',"TEXT DEFAULT ''"],
  ['tasks','related_entity_type',"TEXT DEFAULT ''"],
  ['tasks','related_entity_id','INTEGER'],
  ['tasks','attachments_json',"TEXT DEFAULT '[]'"],
  ['tasks','review_required','INTEGER DEFAULT 0'],
  ['tasks','review_status',"TEXT DEFAULT 'Not Required'"],
  ['tasks','reviewed_by','INTEGER'],
  ['tasks','reviewed_at','TEXT'],
  ['tasks','assigned_by','INTEGER'],
  ['tasks','updated_at','TEXT'],
  ['tasks','returned_count','INTEGER DEFAULT 0'],
  ['excavator_transactions','updated_by','INTEGER'],
  ['excavator_transactions','updated_at','TEXT'],
  ['excavator_buyer_payment_allocations','status',"TEXT DEFAULT 'Active'"],
  ['excavator_buyer_payment_allocations','void_reason',"TEXT DEFAULT ''"],
  ['excavator_buyer_payment_allocations','voided_by','INTEGER'],
  ['excavator_buyer_payment_allocations','voided_at','TEXT'],
  ['documents','workflow_status',"TEXT DEFAULT 'Draft'"],
  ['documents','reviewed_by','INTEGER'],
  ['documents','reviewed_at','TEXT'],
  ['documents','workflow_note',"TEXT DEFAULT ''"]
]) v27EnsureColumn(t,c,d);

try{db.exec(`
CREATE TABLE IF NOT EXISTS approval_rules(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_unit_id INTEGER NOT NULL,
  action_key TEXT NOT NULL,
  action_name TEXT NOT NULL,
  condition_type TEXT DEFAULT 'Amount Above',
  threshold_amount REAL DEFAULT 0,
  approver_level INTEGER DEFAULT 2,
  require_dual INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  created_by INTEGER,
  updated_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_unit_id,action_key),
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
);
CREATE TABLE IF NOT EXISTS approval_history(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  approval_id INTEGER NOT NULL,
  business_unit_id INTEGER NOT NULL,
  user_id INTEGER,
  action TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  note TEXT DEFAULT '',
  old_status TEXT DEFAULT '',
  new_status TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(approval_id) REFERENCES approvals(id) ON DELETE CASCADE,
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
);
CREATE INDEX IF NOT EXISTS idx_approval_rules_unit ON approval_rules(business_unit_id,active,action_key);
CREATE INDEX IF NOT EXISTS idx_approval_history_request ON approval_history(approval_id,created_at);

CREATE TABLE IF NOT EXISTS task_comments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER,
  comment TEXT NOT NULL,
  attachment_file TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tasks_unit_owner ON tasks(business_unit_id,owner_id,status,due_date);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id,created_at);

CREATE TABLE IF NOT EXISTS work_report_rules(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_unit_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT '*',
  cadence TEXT NOT NULL DEFAULT 'Daily',
  recipient_mode TEXT NOT NULL DEFAULT 'Manager',
  active INTEGER DEFAULT 1,
  instructions TEXT DEFAULT '',
  created_by INTEGER,
  updated_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_unit_id,role,cadence),
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
);
CREATE TABLE IF NOT EXISTS work_reports(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_unit_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'Daily',
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  work_completed TEXT DEFAULT '',
  tasks_summary TEXT DEFAULT '',
  achievements TEXT DEFAULT '',
  issues_blockers TEXT DEFAULT '',
  pending_decisions TEXT DEFAULT '',
  next_plan TEXT DEFAULT '',
  kpi_updates TEXT DEFAULT '',
  linked_records TEXT DEFAULT '',
  attachments_json TEXT DEFAULT '[]',
  status TEXT DEFAULT 'Submitted',
  recipient_mode TEXT DEFAULT 'Manager',
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER,
  reviewed_at TEXT,
  review_note TEXT DEFAULT '',
  version INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,report_type,period_start,period_end),
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS work_report_versions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL DEFAULT '{}',
  attachments_json TEXT NOT NULL DEFAULT '[]',
  saved_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(report_id) REFERENCES work_reports(id) ON DELETE CASCADE,
  UNIQUE(report_id,version)
);
CREATE INDEX IF NOT EXISTS idx_work_report_versions_report ON work_report_versions(report_id,version);
CREATE TABLE IF NOT EXISTS work_report_actions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  business_unit_id INTEGER NOT NULL,
  user_id INTEGER,
  action TEXT NOT NULL,
  note TEXT DEFAULT '',
  task_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(report_id) REFERENCES work_reports(id) ON DELETE CASCADE,
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
);
CREATE TABLE IF NOT EXISTS work_report_reminders(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  period_key TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rule_id,user_id,period_key)
);
CREATE INDEX IF NOT EXISTS idx_work_reports_unit ON work_reports(business_unit_id,report_type,period_start,status);
CREATE INDEX IF NOT EXISTS idx_work_reports_user ON work_reports(user_id,period_start,period_end);

CREATE TABLE IF NOT EXISTS performance_alert_log(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  business_unit_id INTEGER NOT NULL,
  alert_key TEXT NOT NULL,
  period_key TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,business_unit_id,alert_key,period_key),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
);
CREATE INDEX IF NOT EXISTS idx_performance_alert_log_unit ON performance_alert_log(business_unit_id,period_key);

CREATE TABLE IF NOT EXISTS performance_kpi_rules(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_unit_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT '*',
  name TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  weight REAL DEFAULT 0,
  target REAL DEFAULT 100,
  direction TEXT DEFAULT 'Higher Is Better',
  active INTEGER DEFAULT 1,
  created_by INTEGER,
  updated_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_unit_id,role,metric_key),
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
);
CREATE TABLE IF NOT EXISTS performance_reviews(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_unit_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  period_type TEXT DEFAULT 'Monthly',
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  system_score REAL DEFAULT 0,
  manager_score REAL DEFAULT 0,
  self_score REAL DEFAULT 0,
  final_score REAL DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  self_note TEXT DEFAULT '',
  manager_note TEXT DEFAULT '',
  reviewed_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,period_type,period_start,period_end),
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_unit ON performance_reviews(business_unit_id,period_start,period_end);
`)}catch(e){console.error('V27 schema:',e.message)}

try{v27EnsureColumn('work_reports','attachments_json',"TEXT DEFAULT '[]'")}catch(e){}

// Seed editable unit-specific defaults. They are intentionally independent per unit.
try{
  const units27=db.prepare("SELECT id FROM business_units WHERE status!='Archived'").all();
  const addRule=db.prepare(`INSERT OR IGNORE INTO approval_rules
    (business_unit_id,action_key,action_name,condition_type,threshold_amount,approver_level,require_dual,notes)
    VALUES(?,?,?,?,?,?,?,?)`);
  const defaults=[
    ['finance.large_payment','Large Payment / Expense','Amount Above',5000000,3,0,'Finance review for high-value payments.'],
    ['excavator.machine_purchase','Large Machine Purchase','Amount Above',20000000,4,0,'CEO approval above configured purchase threshold.'],
    ['sale.loss_or_low_margin','Loss / Below-Margin Sale','Exception',0,4,0,'CEO approval for loss-making or exceptional sales.'],
    ['payment.void','Payment Void / Reversal','Always',0,5,1,'Dual Finance + CEO approval before financial reversal.'],
    ['completed_sale.update','Completed Sale Update','Always',0,4,0,'Controlled update of a completed sale.'],
    ['document.delete','Important Document Delete','Always',0,4,0,'High-risk document deletion.'],
    ['inventory.writeoff','Inventory Write-off','Amount Above',1000000,2,0,'Manager approval above unit threshold.'],
    ['buyer.advance_refund','Buyer Advance Refund','Amount Above',5000000,5,1,'Dual approval for material buyer refunds.']
  ];
  for(const u of units27) for(const r of defaults) addRule.run(u.id,...r);

  const addKpi=db.prepare(`INSERT OR IGNORE INTO performance_kpi_rules
    (business_unit_id,role,name,metric_key,weight,target,direction) VALUES(?,?,?,?,?,?,?)`);
  const roleWeights={
    '*':[['Productivity','productivity',30],['Quality / First-pass Accuracy','quality',25],['Timeliness','timeliness',20],['Reliability','reliability',15],['Business Results','business_results',10]],
    'Finance / Admin':[['Productivity','productivity',20],['Quality / Accuracy','quality',35],['Timeliness','timeliness',25],['Reliability','reliability',20],['Business Results','business_results',0]],
    'Sales / Business Development':[['Productivity','productivity',25],['Quality','quality',15],['Timeliness','timeliness',15],['Reliability','reliability',10],['Business Results','business_results',35]]
  };
  for(const u of units27) for(const [role,rows] of Object.entries(roleWeights)) for(const [name,key,weight] of rows) addKpi.run(u.id,role,name,key,weight,100,'Higher Is Better');
}catch(e){console.error('V27 seed:',e.message)}


// V27.3 — full meeting management on the existing Meetings module.
for(const [t,c,d] of [
  ['meetings','organizer_id','INTEGER'],['meetings','meeting_type',"TEXT DEFAULT 'Unit Meeting'"],
  ['meetings','start_time','TEXT'],['meetings','duration_minutes','INTEGER DEFAULT 60'],
  ['meetings','location',"TEXT DEFAULT ''"],['meetings','online_link',"TEXT DEFAULT ''"],
  ['meetings','agenda',"TEXT DEFAULT ''"],['meetings','minutes',"TEXT DEFAULT ''"],
  ['meetings','decisions',"TEXT DEFAULT ''"],['meetings','status',"TEXT DEFAULT 'Draft'"],
  ['meetings','scope_mode',"TEXT DEFAULT 'Unit'"],['meetings','priority',"TEXT DEFAULT 'Normal'"],
  ['meetings','recurrence',"TEXT DEFAULT 'None'"],['meetings','attachments_json',"TEXT DEFAULT '[]'"],
  ['meetings','updated_at','TEXT'],['meeting_actions','task_id','INTEGER'],
  ['meeting_actions','notes',"TEXT DEFAULT ''"],['meeting_actions','created_by','INTEGER'],
  ['meeting_actions','created_at','TEXT DEFAULT CURRENT_TIMESTAMP']
]) v27EnsureColumn(t,c,d);
try{db.exec(`
CREATE TABLE IF NOT EXISTS meeting_attendees(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 meeting_id INTEGER NOT NULL,
 user_id INTEGER NOT NULL,
 response_status TEXT DEFAULT 'Invited',
 attendance_status TEXT DEFAULT 'Pending',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(meeting_id,user_id),
 FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user ON meeting_attendees(user_id,meeting_id);
CREATE INDEX IF NOT EXISTS idx_meetings_unit_date ON meetings(business_unit_id,meeting_date,status);
`)}catch(e){console.error('V27.3 meeting schema:',e.message)}

// V27.5 — bilingual UI preference and Finance review workflow compatibility.
v27EnsureColumn('users','preferred_language',"TEXT DEFAULT 'ko'");
try{db.exec("UPDATE users SET preferred_language='ko' WHERE preferred_language IS NULL OR preferred_language NOT IN ('en','ko')")}catch(e){console.error('V27.5 language migration:',e.message)}
try{db.exec('CREATE INDEX IF NOT EXISTS idx_finance_review_queue_v275 ON finance_entries(business_unit_id,verification_status,status,created_at)')}catch(e){}

// V27.8 — Korean is the company default. Existing inherited defaults migrate once;
// a language explicitly chosen by a user is preserved thereafter.
v27EnsureColumn('users','language_explicit',"INTEGER DEFAULT 0");
try{db.exec("UPDATE users SET preferred_language='ko' WHERE COALESCE(language_explicit,0)=0; UPDATE users SET preferred_language='ko' WHERE preferred_language IS NULL OR preferred_language NOT IN ('en','ko')")}catch(e){console.error('V27.8 Korean-first language migration:',e.message)}

// V28.0 — mobile-first operations, structured buyer requirements, mandatory
// Excavator payment evidence, and a complete Finance correction work queue.
for(const [table,column,definition] of [
  ['excavator_buyer_requirements','machine_name',"TEXT DEFAULT ''"],
  ['excavator_buyer_requirements','serial_no',"TEXT DEFAULT ''"],
  ['excavator_buyer_requirements','condition_status',"TEXT DEFAULT ''"],
  ['excavator_buyer_requirements','location',"TEXT DEFAULT ''"],
  ['excavator_payments','receipt_file',"TEXT DEFAULT ''"],
  ['excavator_payments','receipt_document_id','INTEGER'],
  ['excavator_parts','attachment_file',"TEXT DEFAULT ''"]
]) v27EnsureColumn(table,column,definition);
try{db.exec(`
CREATE TABLE IF NOT EXISTS finance_correction_requests(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finance_entry_id INTEGER NOT NULL,
  business_unit_id INTEGER NOT NULL,
  assigned_to INTEGER NOT NULL,
  requested_by INTEGER NOT NULL,
  reason TEXT NOT NULL,
  requested_changes TEXT DEFAULT '',
  severity TEXT DEFAULT 'Normal',
  status TEXT DEFAULT 'Open',
  response_note TEXT DEFAULT '',
  response_attachment TEXT DEFAULT '',
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  due_at TEXT,
  first_viewed_at TEXT,
  responded_at TEXT,
  resolved_at TEXT,
  outcome TEXT DEFAULT '',
  resubmission_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(finance_entry_id) REFERENCES finance_entries(id) ON DELETE CASCADE,
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
  FOREIGN KEY(assigned_to) REFERENCES users(id),
  FOREIGN KEY(requested_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_finance_correction_unit_status ON finance_correction_requests(business_unit_id,status,due_at);
CREATE INDEX IF NOT EXISTS idx_finance_correction_assignee ON finance_correction_requests(assigned_to,status,due_at);
CREATE INDEX IF NOT EXISTS idx_finance_correction_entry ON finance_correction_requests(finance_entry_id,id);
`)}catch(e){console.error('V28 Finance correction schema:',e.message)}

// V28.1 — live action queues, aligned machine requirements, smart matching,
// exchange proposals, and complete creator-owned Finance correction history.
for(const [table,column,definition] of [
  ['excavator_supplier_requirements','machine_name',"TEXT DEFAULT ''"],
  ['excavator_supplier_requirements','budget_min','REAL DEFAULT 0'],
  ['excavator_supplier_requirements','quantity','REAL DEFAULT 1'],
  ['excavator_supplier_requirements','updated_at','TEXT'],
  ['excavator_buyer_requirements','budget_min','REAL DEFAULT 0'],
  ['excavator_buyer_requirements','action_type',"TEXT DEFAULT 'Buy'"],
  ['excavator_buyer_requirements','exchange_machine',"TEXT DEFAULT ''"],
  ['excavator_buyer_requirements','updated_at','TEXT'],
  ['finance_correction_requests','task_id','INTEGER'],
  ['finance_correction_requests','reminder_count','INTEGER DEFAULT 0'],
  ['finance_correction_requests','last_reminder_at','TEXT'],
  ['finance_correction_requests','source_snapshot_json',"TEXT DEFAULT '{}'"],
  ['finance_correction_requests','changed_fields_json',"TEXT DEFAULT '[]'"]
]) v27EnsureColumn(table,column,definition);
try{db.exec(`
CREATE TABLE IF NOT EXISTS finance_correction_history(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  correction_request_id INTEGER NOT NULL,
  finance_entry_id INTEGER NOT NULL,
  business_unit_id INTEGER NOT NULL,
  user_id INTEGER,
  action TEXT NOT NULL,
  note TEXT DEFAULT '',
  data_json TEXT DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(correction_request_id) REFERENCES finance_correction_requests(id) ON DELETE CASCADE,
  FOREIGN KEY(finance_entry_id) REFERENCES finance_entries(id) ON DELETE CASCADE,
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_finance_correction_history_request ON finance_correction_history(correction_request_id,id);

CREATE TABLE IF NOT EXISTS excavator_requirement_matches(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_unit_id INTEGER NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_id INTEGER NOT NULL,
  machine_source TEXT NOT NULL,
  machine_id INTEGER NOT NULL,
  buyer_id INTEGER,
  supplier_id INTEGER,
  score REAL DEFAULT 0,
  match_level TEXT DEFAULT 'Close Match',
  matched_fields_json TEXT DEFAULT '[]',
  status TEXT DEFAULT 'New',
  notified_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requirement_type,requirement_id,machine_source,machine_id),
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
);
CREATE INDEX IF NOT EXISTS idx_requirement_matches_unit_status ON excavator_requirement_matches(business_unit_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_requirement_matches_requirement ON excavator_requirement_matches(requirement_type,requirement_id,status);

CREATE TABLE IF NOT EXISTS excavator_exchange_proposals(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_unit_id INTEGER NOT NULL,
  match_id INTEGER,
  requirement_type TEXT NOT NULL,
  requirement_id INTEGER NOT NULL,
  requested_machine_source TEXT NOT NULL,
  requested_machine_id INTEGER NOT NULL,
  offered_machine_source TEXT DEFAULT '',
  offered_machine_id INTEGER,
  buyer_id INTEGER,
  supplier_id INTEGER,
  requested_machine_value REAL DEFAULT 0,
  offered_machine_value REAL DEFAULT 0,
  balance_amount REAL DEFAULT 0,
  balance_direction TEXT DEFAULT 'To Be Agreed',
  inspection_condition TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'Draft',
  created_by INTEGER,
  reviewed_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
  FOREIGN KEY(match_id) REFERENCES excavator_requirement_matches(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_exchange_proposals_unit_status ON excavator_exchange_proposals(business_unit_id,status,updated_at);
`)}catch(e){console.error('V28.1 workflow schema:',e.message)}
