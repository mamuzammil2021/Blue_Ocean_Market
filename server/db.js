const Database=require('better-sqlite3');
const bcrypt=require('bcryptjs');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'); fs.mkdirSync(path.join(root,'data'),{recursive:true});
const db=new Database(path.join(root,'data','blue-ocean.sqlite'));
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
// Production scope: only the four approved business units are available. Remove legacy/demo units and their unit-scoped data on startup.
const keepSet=new Set(units);
const legacyUnits=db.prepare('SELECT id,name FROM business_units').all().filter(x=>!keepSet.has(x.name));
for(const u of legacyUnits){
  const uid=u.id;
  db.prepare('DELETE FROM restaurant_waste WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM restaurant_closings WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM restaurant_buffet_items WHERE buffet_id IN (SELECT id FROM restaurant_buffets WHERE business_unit_id=?)').run(uid);
  db.prepare('DELETE FROM restaurant_buffets WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM restaurant_weekly_menus WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM restaurant_recipes WHERE menu_item_id IN (SELECT id FROM restaurant_menu_items WHERE business_unit_id=?)').run(uid);
  db.prepare('DELETE FROM restaurant_menu_items WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM restaurant_order_items WHERE order_id IN (SELECT id FROM restaurant_orders WHERE business_unit_id=?)').run(uid);
  db.prepare('DELETE FROM restaurant_orders WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM restaurant_tables WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM finance_entries WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM purchase_items WHERE purchase_id IN (SELECT id FROM purchases WHERE business_unit_id=?)').run(uid);
  db.prepare('DELETE FROM purchases WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE business_unit_id=?)').run(uid);
  db.prepare('DELETE FROM sales WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM approvals WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM kpis WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM documents WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM meetings WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM customers WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM tasks WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM products WHERE business_unit_id=?').run(uid);
  db.prepare('UPDATE users SET business_unit_id=NULL, active=0 WHERE business_unit_id=?').run(uid);
  db.prepare('DELETE FROM business_units WHERE id=?').run(uid);
}

const adminEmail=process.env.ADMIN_EMAIL||'admin@blueocean.local', adminPassword=process.env.ADMIN_PASSWORD||'Admin@123';
let admin=db.prepare('SELECT id FROM users WHERE email=?').get(adminEmail);
if(!admin){const r=db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Abdullah Muzammil',adminEmail,bcrypt.hashSync(adminPassword,12),'CEO / Owner'); admin={id:r.lastInsertRowid};}
const unitId=n=>db.prepare('SELECT id FROM business_units WHERE name=?').get(n)?.id;
const mimi=unitId('MIMI Resturant');
const seedProduct=db.prepare('INSERT OR IGNORE INTO products(business_unit_id,sku,name,category,supplier,item_type,unit,opening_stock,current_stock,reorder_level,cost_price,selling_price,tax_rate) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)');
if(mimi){seedProduct.run(mimi,'MIMI-001','Chicken Biryani','Main Course','MIMI Kitchen','PRODUCT','plate',0,0,5,280,450,0);seedProduct.run(mimi,'MIMI-002','Chicken Burger','Fast Food','MIMI Kitchen','PRODUCT','pcs',0,0,5,220,380,0);seedProduct.run(mimi,'MIMI-003','Tea','Beverage','MIMI Kitchen','PRODUCT','cup',0,0,10,45,100,0);seedProduct.run(mimi,'MIMI-004','Delivery Service','Service','MIMI','SERVICE','service',0,0,0,0,250,0);for(let i=1;i<=12;i++)db.prepare('INSERT OR IGNORE INTO restaurant_tables(business_unit_id,name,capacity) VALUES(?,?,?)').run(mimi,`Table ${i}`,i<=4?2:i<=10?4:6);}
if(db.prepare('SELECT COUNT(*) c FROM users').get().c===1){const defs=[['Ahmed Khan','Business Unit Manager','MIMI Resturant'],['Bilal Ahmed','Finance / Admin','Excavator'],['Hassan Raza','Sales / Business Development','Mango / Seasonal'],['Usman Ali','Business Unit Manager','Pink Salt'],['Sara Ali','Staff Member','MIMI Resturant']];const st=db.prepare('INSERT INTO users(name,email,password_hash,role,business_unit_id) VALUES(?,?,?,?,?)');defs.forEach(([n,r,b])=>st.run(n,n.toLowerCase().replace(/\s+/g,'.')+'@blueocean.local',bcrypt.hashSync('ChangeMe@123',12),r,unitId(b)));}

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
 country TEXT DEFAULT 'Pakistan',
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
try{db.exec("ALTER TABLE excavator_buyers ADD COLUMN buyer_type TEXT DEFAULT 'International'")}catch(e){}
try{db.exec("UPDATE excavator_buyers SET buyer_type=CASE WHEN lower(country)='south korea' OR lower(country)='korea' OR lower(country)='republic of korea' THEN 'Local' ELSE 'International' END WHERE buyer_type IS NULL OR buyer_type=''")}catch(e){}
try{db.exec("CREATE INDEX IF NOT EXISTS idx_buyer_payment_alloc_payment ON excavator_buyer_payment_allocations(payment_id)")}catch(e){}
try{db.exec("CREATE INDEX IF NOT EXISTS idx_buyer_payment_alloc_asset ON excavator_buyer_payment_allocations(asset_id)")}catch(e){}
try{const legacy=db.prepare("SELECT id,buyer_id,asset_id,krw_amount,created_by FROM excavator_buyer_payments WHERE asset_id IS NOT NULL").all();const ins=db.prepare("INSERT INTO excavator_buyer_payment_allocations(payment_id,buyer_id,asset_id,amount_krw,allocation_date,created_by,notes) VALUES(?,?,?, ?,CURRENT_TIMESTAMP,?,?)");for(const p of legacy){const exists=db.prepare('SELECT 1 FROM excavator_buyer_payment_allocations WHERE payment_id=? AND asset_id=?').get(p.id,p.asset_id);if(!exists)ins.run(p.id,p.buyer_id,p.asset_id,p.krw_amount,p.created_by,'Migrated from legacy payment allocation');}}catch(e){console.error('Buyer allocation migration',e.message)}
try{db.exec("ALTER TABLE excavator_assets ADD COLUMN buyer_id INTEGER")}catch(e){}
try{
  // UI owns form required-field validation. Keep the API defensive, but do not let
  // SQLite reject incomplete form submissions with low-level NOT NULL errors.
  const paymentCols=db.prepare('PRAGMA table_info(excavator_buyer_payments)').all();
  const dateCol=paymentCols.find(x=>x.name==='payment_date');
  const refCol=paymentCols.find(x=>x.name==='reference');
  if(dateCol?.notnull || refCol?.notnull){
    db.pragma('foreign_keys=OFF');
    db.exec(`CREATE TABLE excavator_buyer_payments_v26_tmp(
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
    INSERT INTO excavator_buyer_payments_v26_tmp
      (id,buyer_id,asset_id,payment_type,original_amount,currency,fx_rate,krw_amount,payment_date,method,reference,receipt_file,receipt_document_id,notes,created_by,created_at)
      SELECT id,buyer_id,asset_id,payment_type,original_amount,currency,fx_rate,krw_amount,payment_date,method,reference,receipt_file,receipt_document_id,notes,created_by,created_at
      FROM excavator_buyer_payments;
    DROP TABLE excavator_buyer_payments;
    ALTER TABLE excavator_buyer_payments_v26_tmp RENAME TO excavator_buyer_payments;`);
    db.pragma('foreign_keys=ON');
  }
}catch(e){try{db.pragma('foreign_keys=ON')}catch(_){} console.error('V26.1 buyer payment schema migration',e.message)}

for(const [t,c,d] of [['finance_entries','verification_status',"TEXT DEFAULT 'Pending Verification'"],['finance_entries','verified_by','INTEGER'],['finance_entries','verified_at','TEXT'],['finance_entries','verification_note',"TEXT DEFAULT ''"],['finance_entries','source_type',"TEXT DEFAULT 'Manual'"],['finance_entries','source_id','INTEGER'],['excavator_assets','supplier_id','INTEGER'],['excavator_assets','purchase_token','REAL DEFAULT 0'],['excavator_assets','purchase_balance','REAL DEFAULT 0'],['excavator_assets','purchase_payment_status',"TEXT DEFAULT 'Pending'"]]){try{db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${d}`)}catch(e){}}
