#!/usr/bin/env python3
"""Run the *actual* V30.50 import-page SQL against production-shaped SQLite fixtures; compare legacy row totals."""
import sqlite3,subprocess,json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
js=r'''const m=require('./server/v350-import-pages');const q=m.pageSQL({search:'S',status:'Open'});process.stdout.write(JSON.stringify({sql:m.IMPORT_PAGE_SQL,filter:q}));'''
data=json.loads(subprocess.check_output(['node','-e',js],cwd=root,text=True));con=sqlite3.connect(':memory:');con.row_factory=sqlite3.Row
con.executescript('''
CREATE TABLE pink_salt_suppliers(id INTEGER PRIMARY KEY,business_unit_id INTEGER,name TEXT);
CREATE TABLE pink_salt_imports(id INTEGER PRIMARY KEY,business_unit_id INTEGER,import_no TEXT,supplier_id INTEGER,supplier_name TEXT,supplier_invoice_no TEXT,container_no TEXT,status TEXT,invoice_currency TEXT);
CREATE TABLE pink_salt_import_items(id INTEGER PRIMARY KEY,import_id INTEGER,total_weight_kg REAL,line_amount_original REAL,line_amount_krw REAL);
CREATE TABLE pink_salt_import_costs(id INTEGER PRIMARY KEY,import_id INTEGER,krw_amount REAL,status TEXT);
CREATE TABLE pink_salt_import_payments(id INTEGER PRIMARY KEY,import_id INTEGER,krw_amount REAL,status TEXT);
CREATE TABLE pink_salt_supplier_advance_allocations(id INTEGER PRIMARY KEY,import_id INTEGER,amount_krw REAL,status TEXT);
INSERT INTO pink_salt_suppliers VALUES (1,2,'Sea Salt Supplier'),(2,3,'External Supplier');
INSERT INTO pink_salt_imports VALUES(1,2,'S-01',1,'','INV1','CN1','Open','USD'),(2,2,'S-02',1,'','INV2','CN2','Open','USD'),(3,2,'S-03',1,'','INV3','CN3','Received','USD'),(4,3,'S-04',2,'','INV4','CN4','Open','USD');
INSERT INTO pink_salt_import_items VALUES(1,1,100,500,1000),(2,1,50,300,600),(3,2,25,200,400),(4,3,80,900,2000),(5,4,500,5000,9999);
INSERT INTO pink_salt_import_costs VALUES(1,1,120,'Active'),(2,1,7777,'Voided'),(3,4,9000,'Active');
INSERT INTO pink_salt_import_payments VALUES(1,1,300,'Active'),(2,1,8888,'Voided'),(3,2,400,'Active'),(4,4,9000,'Active');
INSERT INTO pink_salt_supplier_advance_allocations VALUES(1,1,250,'Active'),(2,1,9999,'Reversed'),(3,4,9000,'Active');
''')
rows=[dict(x) for x in con.execute(data['sql'].replace('%WHERE%',"i.business_unit_id=?"),(2,25,0))]
assert [x['id'] for x in rows]==[3,2,1],rows
x={r['id']:r for r in rows};assert (x[1]['total_weight_kg'],x[1]['purchase_original'],x[1]['purchase_krw'])==(150,800,1600),x[1]
assert (x[1]['import_costs_krw'],x[1]['cash_paid_krw'],x[1]['advance_allocated_krw'])==(120,300,250),x[1]
assert x[2]['cash_paid_krw']==400 and x[2]['advance_allocated_krw']==0,x[2]
assert len(list(con.execute(data['sql'].replace('%WHERE%',"i.business_unit_id=?"),(2,1,1))))==1
filter=data['filter'];filtered=[dict(x) for x in con.execute(data['sql'].replace('%WHERE%',filter['where']),(2,*filter['args'],25,0))]
assert [x['id'] for x in filtered]==[2,1],filtered
for row in rows:
 id=row['id'];old=con.execute('''SELECT (SELECT COUNT(*) FROM pink_salt_import_items WHERE import_id=?),
 (SELECT COALESCE(SUM(total_weight_kg),0) FROM pink_salt_import_items WHERE import_id=?),
 (SELECT COALESCE(SUM(line_amount_original),0) FROM pink_salt_import_items WHERE import_id=?),
 (SELECT COALESCE(SUM(line_amount_krw),0) FROM pink_salt_import_items WHERE import_id=?),
 (SELECT COALESCE(SUM(krw_amount),0) FROM pink_salt_import_costs WHERE import_id=? AND COALESCE(status,'Active')!='Voided'),
 (SELECT COALESCE(SUM(krw_amount),0) FROM pink_salt_import_payments WHERE import_id=? AND COALESCE(status,'Active')!='Voided'),
 (SELECT COALESCE(SUM(amount_krw),0) FROM pink_salt_supplier_advance_allocations WHERE import_id=? AND COALESCE(status,'Active')='Active')''',(id,)*7).fetchone()
 assert list(old)==[row[k] for k in ('item_count','total_weight_kg','purchase_original','purchase_krw','import_costs_krw','cash_paid_krw','advance_allocated_krw')],(id,old,row)
print('PASS real V30.50 selected-page SQL equals legacy import financial calculations')
print('PASS voided/reversed payments and costs excluded; foreign business unit isolated')
print('PASS server-side search, status and LIMIT/OFFSET applied before aggregates')
