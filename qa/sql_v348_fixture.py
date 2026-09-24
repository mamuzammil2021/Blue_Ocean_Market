"""Dependency-free SQLite execution of production V30.48 batch query strings."""
from pathlib import Path
import sqlite3,json,subprocess
root=Path(__file__).resolve().parents[1]
# Capture the SQL executed by the CURRENT V30.48/V30.49 selected-row bulk functions.
# The old source-string regex became stale once v349 added parameterized page-ID bounds.
js=r"""
const bulk=require('./server/v348-pink-salt-bulk');let queries=[];
const db={prepare(sql){return {all(...args){queries.push({sql,args});return []}}}};
bulk.financialsBulk(db,2,[{id:10,total_krw:1500,status:'Completed'},{id:12,total_krw:400,status:'Cancelled'}],'2026-09-23');
bulk.customersBulk(db,2,'2026-09-23',[{id:1}]);
process.stdout.write(JSON.stringify(queries.filter(x=>x.sql.includes('GROUP BY'))));
"""
queries=json.loads(subprocess.check_output(['node','-e',js],cwd=root,text=True))
assert len(queries)==4,(len(queries),queries)
db=sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE pink_salt_orders(id INTEGER PRIMARY KEY,business_unit_id INTEGER,customer_id INTEGER,status TEXT,order_date TEXT,total_krw REAL,due_date TEXT);
CREATE TABLE pink_salt_customer_payments(order_id INTEGER,krw_amount REAL,status TEXT);
CREATE TABLE pink_salt_customer_receipt_allocations(order_id INTEGER,receipt_id INTEGER,amount_krw REAL,status TEXT);
CREATE TABLE pink_salt_customer_receipts(id INTEGER PRIMARY KEY,business_unit_id INTEGER,customer_id INTEGER,gross_settlement_krw REAL,status TEXT);
CREATE TABLE pink_salt_customer_refunds(order_id INTEGER,krw_amount REAL,status TEXT);
''')
db.executemany('INSERT INTO pink_salt_orders VALUES(?,?,?,?,?,?,?)',[(10,2,1,'Completed','2026-09-01',1500,'2026-09-20'),(11,2,2,'Completed','2026-09-03',900,'2026-11-01'),(12,2,1,'Cancelled','2026-09-05',400,None),(13,3,3,'Completed','2026-09-04',9999,'2026-09-20')]);
db.executemany('INSERT INTO pink_salt_customer_payments VALUES(?,?,?)',[(10,200,'Active'),(10,50,'Voided'),(12,100,'Active'),(13,9999,'Active')]);
db.executemany('INSERT INTO pink_salt_customer_receipts VALUES(?,?,?,?,?)',[(20,2,1,1200,'Active'),(21,2,1,90,'Voided'),(22,3,3,1000,'Active')]);
db.executemany('INSERT INTO pink_salt_customer_receipt_allocations VALUES(?,?,?,?)',[(10,20,900,'Active'),(10,21,90,'Active'),(10,20,30,'Cancelled'),(13,22,999,'Active')]);
db.executemany('INSERT INTO pink_salt_customer_refunds VALUES(?,?,?)',[(10,100,'Active'),(10,80,'Voided'),(13,999,'Active')]);
values=[dict(db.execute(q['sql'],q['args']).fetchall()) for q in queries]
assert all(q['sql'].count('?')==len(q['args']) for q in queries),'all scoped ID bounds are bound parameters'
print('SQL grouped query count:',len(queries));print('SQL grouped values:',values)
assert values[0]=={10:200,12:100},values[0]
assert values[1]=={10:900},values[1]
assert values[2]=={10:100},values[2]
assert values[3]=={20:900},values[3]
assert values[0].get(13) is None and values[1].get(13) is None and values[2].get(13) is None, "Cross-BU totals must not leak"
print('V30.48 SQL fixture passed')
