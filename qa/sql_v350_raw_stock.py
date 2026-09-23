#!/usr/bin/env python3
"""Exercise exact V30.50 paged stock and full-unit KPI SQL against a real SQLite fixture."""
import sqlite3,subprocess,json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
q=json.loads(subprocess.check_output(['node','-e',"const x=require('./server/v350-raw-pages');process.stdout.write(JSON.stringify({page:x.STOCK_PAGE_SQL,summary:x.STOCK_SUMMARY_SQL}));"],cwd=root,text=True))
db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
db.executescript('''
CREATE TABLE pink_salt_imports(id INTEGER PRIMARY KEY,business_unit_id INTEGER,import_no TEXT,container_no TEXT,actual_arrival TEXT,invoice_currency TEXT,status TEXT,supplier_id INTEGER);
CREATE TABLE pink_salt_suppliers(id INTEGER PRIMARY KEY,business_unit_id INTEGER,name TEXT);
CREATE TABLE pink_salt_import_items(id INTEGER PRIMARY KEY,import_id INTEGER,salt_grade TEXT,specification TEXT,bag_size_kg REAL,bag_count INTEGER,total_weight_kg REAL,received_weight_kg REAL,storage_location TEXT,landed_cost_krw REAL);
CREATE TABLE pink_salt_raw_stock_movements(id INTEGER PRIMARY KEY,import_item_id INTEGER,quantity_kg REAL);
INSERT INTO pink_salt_suppliers VALUES(1,2,'Supplier A'),(2,3,'Other BU');
INSERT INTO pink_salt_imports VALUES(1,2,'I-1','CN-A','2026-09-01','USD','Received',1),(2,2,'I-2','CN-B','2026-09-02','USD','Received',1),(3,2,'I-3','CN-C','2026-09-03','USD','Ordered',1),(4,3,'I-4','CN-D','2026-09-04','USD','Received',2);
INSERT INTO pink_salt_import_items VALUES(1,1,'Mesh','fine',25,4,100,100,'A1',1000),(2,1,'2-3 mm','medium',25,2,50,50,'A2',600),(3,2,'3–5 mm','coarse',25,1,25,25,'B1',300),(4,3,'Mesh','unreceived',25,8,200,0,'X',2000),(5,4,'Mesh','foreign',25,40,1000,1000,'Z',5000);
INSERT INTO pink_salt_raw_stock_movements VALUES(1,1,100),(2,1,-20),(3,2,50),(4,2,-10),(5,3,25),(6,5,1000);
''')
s=dict(db.execute(q['summary'],(2,)).fetchone());assert s=={'total_kg':145,'active_batches':3,'mesh_kg':80,'mm_2_3_kg':40,'mm_3_5_kg':25},s
rows=[dict(x) for x in db.execute(q['page'].replace('%WHERE%',"i.business_unit_id=? AND i.status='Received'"),(2,25,0))]
assert [x['id'] for x in rows]==[3,1,2],rows
assert [x['available_kg'] for x in rows]==[25,80,40],rows
assert rows[1]['landed_cost_per_kg']==10,rows[1]
filtered=[dict(x) for x in db.execute(q['page'].replace('%WHERE%',"i.business_unit_id=? AND i.status='Received' AND (x.salt_grade LIKE ? OR x.specification LIKE ? OR x.storage_location LIKE ? OR i.import_no LIKE ? OR i.container_no LIKE ?)"),(2,*['%Mesh%']*5,25,0))]
assert len(filtered)==1 and filtered[0]['id']==1,filtered
assert len(list(db.execute(q['page'].replace('%WHERE%',"i.business_unit_id=? AND i.status='Received'"),(2,1,1))))==1
for x in rows:
 orig=db.execute('SELECT COALESCE(SUM(quantity_kg),0) FROM pink_salt_raw_stock_movements WHERE import_item_id=?',(x['id'],)).fetchone()[0]
 assert orig==x['available_kg'],x
print('PASS actual production stock sums equal paged SQL, including signed stock movements')
print('PASS full-unit category KPIs independent of current page, filters and foreign BU')
print('PASS unreceived imports excluded, selected-page sort and search preserved')
