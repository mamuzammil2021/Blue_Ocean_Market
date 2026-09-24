#!/usr/bin/env python3
"""Runs the exact V30.49 production summary SQL captured from the JS module against SQLite fixtures."""
import json, sqlite3, subprocess, pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
capture=r'''
const m=require('./server/v349-pink-pages');let calls=[];const db={prepare(sql){return{get(...args){calls.push({sql,args});return {n:0,credit:0}}}}};
m.orderSummary(db,2,'2026-09-23');m.customerSummary(db,2,'2026-09-23');process.stdout.write(JSON.stringify(calls));
'''
queries=json.loads(subprocess.check_output(['node','-e',capture],cwd=ROOT,text=True))
db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
db.executescript('''
CREATE TABLE pink_salt_customers(id INTEGER PRIMARY KEY,business_unit_id INTEGER,name TEXT,customer_type TEXT,sales_channel TEXT);
CREATE TABLE pink_salt_orders(id INTEGER PRIMARY KEY,business_unit_id INTEGER,customer_id INTEGER,status TEXT,total_krw REAL,gross_profit_krw REAL,due_date TEXT,order_no TEXT,order_date TEXT,customer_name TEXT,reference TEXT,sales_channel TEXT);
CREATE TABLE pink_salt_customer_payments(id INTEGER PRIMARY KEY,order_id INTEGER,krw_amount REAL,status TEXT);
CREATE TABLE pink_salt_customer_refunds(id INTEGER PRIMARY KEY,order_id INTEGER,krw_amount REAL,status TEXT);
CREATE TABLE pink_salt_customer_receipts(id INTEGER PRIMARY KEY,business_unit_id INTEGER,customer_id INTEGER,gross_settlement_krw REAL,status TEXT);
CREATE TABLE pink_salt_customer_receipt_allocations(id INTEGER PRIMARY KEY,receipt_id INTEGER,order_id INTEGER,amount_krw REAL,status TEXT);
INSERT INTO pink_salt_customers VALUES(1,2,'Alice','Store','Direct'),(2,2,'Bob','Store','Wholesale'),(3,3,'CrossBU','Store','Direct');
INSERT INTO pink_salt_orders VALUES(10,2,1,'Completed',1500,300,'2026-09-01','O10','2026-09-01','Alice','R10','Direct'),(11,2,2,'Completed',900,150,'2026-12-01','O11','2026-09-04','Bob','R11','Wholesale'),(12,2,1,'Reserved',300,50,NULL,'O12','2026-09-05','Alice','R12','Direct'),(13,2,1,'Cancelled',1000,200,'2026-08-01','O13','2026-09-06','Alice','R13','Direct'),(14,3,3,'Completed',50000,5000,'2026-07-01','O14','2026-09-07','CrossBU','R14','Direct');
INSERT INTO pink_salt_customer_payments VALUES(1,10,200,'Active'),(2,10,9999,'Voided'),(3,14,50000,'Active');
INSERT INTO pink_salt_customer_refunds VALUES(1,10,100,'Active'),(2,10,9999,'Voided');
INSERT INTO pink_salt_customer_receipts VALUES(1,2,1,1200,'Active'),(2,2,2,100,'Active'),(3,2,1,9999,'Voided'),(4,3,3,40000,'Active');
INSERT INTO pink_salt_customer_receipt_allocations VALUES(1,1,10,900,'Active'),(2,3,10,1000,'Active'),(3,4,14,40000,'Active');
''')
result=[dict(db.execute(x['sql'],x['args']).fetchone()) for x in queries]
assert result[0]['total_orders']==4 and result[0]['open_orders']==1,result[0]
assert result[0]['sales_krw']==2400 and result[0]['gross_profit_krw']==450,result[0]
assert result[0]['receivable_krw']==1400 and result[0]['overdue_krw']==500,result[0]
assert result[1]['receivable_krw']==1400 and result[2]['credit']==400,result[1:3]
assert result[3]['n']==2 and result[4]['n']==2,result[3:]
print('PASS exact production financial CTE: full-batch, overdue, voided/cancelled excluded')
print('PASS cross-BU records excluded from summaries and credit')
print('PASS customer receivable 1400 and unallocated credit 400 match fixture ledger')
print('V30.49 SQLite fixture PASS')
