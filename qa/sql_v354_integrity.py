#!/usr/bin/env python3
"""Execute the actual V30.54 migration SQL against synthetic persistent-DB scenarios.
No real company database, attachments, or existing user's records are read or modified.
"""
import re
import sqlite3
from pathlib import Path

source=Path(__file__).resolve().parents[1].joinpath('server/v354-finance-integrity.js').read_text()
def query(pattern):
    match=re.search(pattern,source,re.S)
    assert match, 'Migration SQL not found: '+pattern[:90]
    return match.group(1)

schema=query(r"db\.exec\(`(CREATE TABLE IF NOT EXISTS finance_integrity_cases_v354[\s\S]*?)`\);")
select_mirrors=query(r"const rows=db\.prepare\(`(SELECT f\.\*,p\.payment_type[\s\S]*?ORDER BY f\.id)`\)\.all\(\);")
select_posted=query(r"const posted=db\.prepare\(`(SELECT id,journal_no[\s\S]*?LIMIT 1)`\)\.get\(f\.id,f\.id\);")
update_ghost=query(r"db\.prepare\(`(UPDATE finance_entries SET status='Voided'[\s\S]*?status!='Voided')`\)\.run\(REASON,f\.id\);")
update_purchase=query(r"const operational=db\.prepare\(`(UPDATE finance_entries SET cash_effect=0,finance_role='Purchase / Payable'[\s\S]*?)`\)\.run\(\);")

c=sqlite3.connect(':memory:')
c.row_factory=sqlite3.Row
c.executescript('''
CREATE TABLE finance_entries(id INTEGER PRIMARY KEY,business_unit_id INTEGER,source_type TEXT,source_id INTEGER,status TEXT,amount REAL,krw_amount REAL,cash_effect INTEGER,finance_role TEXT,payment_method TEXT,payment_account_id INTEGER,verification_status TEXT,void_reason TEXT,voided_at TEXT,updated_at TEXT,reference TEXT,receipt_file TEXT);
CREATE TABLE excavator_payments(id INTEGER PRIMARY KEY,asset_id INTEGER,payment_type TEXT,source_type TEXT,notes TEXT,status TEXT,amount REAL,reference TEXT,receipt_file TEXT);
CREATE TABLE excavator_transactions(id INTEGER PRIMARY KEY,asset_id INTEGER,type TEXT,amount REAL);
CREATE TABLE accounting_journal_entries(id INTEGER PRIMARY KEY,finance_entry_id INTEGER,source_type TEXT,source_id INTEGER,status TEXT,journal_no TEXT);
CREATE TABLE audit_log(id INTEGER PRIMARY KEY,user_id INTEGER,entity TEXT,entity_id INTEGER,action TEXT,details TEXT);
''')
c.executescript(schema)
# A genuine purchase was settled in two real cash movements, and an advance plus one new receipt settles a sale.
c.executemany('INSERT INTO excavator_payments(id,asset_id,payment_type,source_type,notes,status,amount,reference,receipt_file) VALUES(?,?,?,?,?,?,?,?,?)',[
 (20,1,'Sale','Excavator Sale','Settlement mirror — no duplicate Finance cash event','Paid',9500,'Multiple payment records',''),
 (21,2,'Sale','Excavator Sale','Settlement mirror — no duplicate Finance cash event','Paid',9500,'Multiple payment records',''),
 (22,3,'Sale','','Actual separate legacy sale receipt','Paid',500,'valid-sale-reference','receipt.png'),
 (23,1,'Purchase','','Real token','Paid',2000,'token-123','token.png'),
 (24,1,'Purchase','','Real balance','Paid',3000,'balance-456','balance.png')])
c.execute("INSERT INTO excavator_transactions VALUES(30,1,'Purchase',5000)")
c.execute("INSERT INTO excavator_transactions VALUES(31,1,'Local Sale',9500)")
items=[
(1,1,'Excavator Payment',23,'Recorded',2000,2000,-1,'Machine Payment','Bank',1,'Verified / Correct',None,None,None,'token-123','token.png'),
(2,1,'Excavator Payment',24,'Recorded',3000,3000,-1,'Machine Payment','Bank',1,'Verified / Correct',None,None,None,'balance-456','balance.png'),
(3,1,'Excavator Buyer Payment',50,'Recorded',9000,9000,1,'Buyer Receipt','Bank',1,'Verified / Correct',None,None,None,'advance-789','advance.png'),
(4,1,'Excavator Buyer Payment',51,'Recorded',500,500,1,'Buyer Receipt','Bank',1,'Verified / Correct',None,None,None,'new-500','new.png'),
(5,1,'Excavator Cost Transaction',30,'Recorded',5000,5000,-1,'Machine Cost','',1,'Pending Verification',None,None,None,'',''),
(6,1,'Excavator Sale',31,'Recorded',9500,9500,0,'Sale / Revenue','Operational',None,'Pending Verification',None,None,None,'Sale 31',''),
(7,1,'Excavator Payment',20,'Recorded',9500,9500,-1,'Machine Payment','Mixed Settlement',None,'Pending Verification',None,None,None,'Multiple payment records',''),
(8,1,'Excavator Payment',21,'Recorded',9500,9500,-1,'Machine Payment','Mixed Settlement',None,'Verified / Correct',None,None,None,'Multiple payment records',''),
(9,1,'Excavator Payment',22,'Recorded',500,500,1,'Buyer Receipt','Bank',1,'Verified / Correct',None,None,None,'valid-sale-reference','receipt.png')]
c.executemany('INSERT INTO finance_entries VALUES('+','.join('?'*17)+')',items)
c.executemany('INSERT INTO accounting_journal_entries VALUES(?,?,?,?,?,?)',[
(10,5,'Finance Entry',5,'Posted','JE-PURCHASE-10'),
(11,6,'Finance Entry',6,'Pending Review','JE-SALE-11'),
(12,7,'Finance Entry',7,'Pending Review','JE-GHOST-12'),
(13,8,'Finance Entry',8,'Posted','JE-GHOST-13')])

upsert_case='''INSERT INTO finance_integrity_cases_v354(finance_entry_id,business_unit_id,source_payment_id,case_type,resolution_status,amount_krw,original_cash_effect,note) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(finance_entry_id) DO UPDATE SET resolution_status=excluded.resolution_status,note=excluded.note,updated_at=CURRENT_TIMESTAMP'''
reason='V30.54 integrity quarantine: Excavator sale settlement mirror is not a cash payment.'
def scan():
  quarantined,posted=0,0
  with c:
    for f in c.execute(select_mirrors).fetchall():
      j=c.execute(select_posted,(f['id'],f['id'])).fetchone()
      status='Needs Controlled Reversal' if j else 'Quarantined Before Posting'
      c.execute(upsert_case,(f['id'],f['business_unit_id'],f['source_id'],'EXCAVATOR_SALE_SETTLEMENT_MIRROR',status,float(f['krw_amount']),f['cash_effect'],reason))
      if j: posted+=1
      else:
        c.execute(update_ghost,(reason,f['id']))
        c.execute("INSERT INTO audit_log(entity,entity_id,action,details) VALUES('finance',?,'v354-duplicate-mirror-quarantine',?)",(f['id'],reason))
        quarantined+=1
    purchases=c.execute(update_purchase).rowcount
  return quarantined,posted,purchases

assert scan()==(1,1,1), 'Expected one quarantine, one posted hold, one purchase recognition correction'
assert c.execute('SELECT status,cash_effect FROM finance_entries WHERE id=7').fetchone()[:]==('Voided',0)
assert c.execute('SELECT status,cash_effect FROM finance_entries WHERE id=5').fetchone()[:]==('Recorded',0)
assert c.execute('SELECT status FROM accounting_journal_entries WHERE id=10').fetchone()[0]=='Posted', 'Legitimate purchase recognition must stay posted'
assert c.execute('SELECT status FROM accounting_journal_entries WHERE id=13').fetchone()[0]=='Posted', 'Historical posted case must NOT be silently rewritten'
assert c.execute('SELECT status FROM accounting_journal_entries WHERE id=12').fetchone()[0]=='Pending Review', 'Unposted proposal is handled by existing Accounting sync; do not delete history here'
assert c.execute('SELECT resolution_status FROM finance_integrity_cases_v354 WHERE finance_entry_id=8').fetchone()[0]=='Needs Controlled Reversal'
assert c.execute('SELECT COUNT(*) FROM finance_entries').fetchone()[0]==9
assert c.execute('SELECT SUM(CASE WHEN cash_effect>0 THEN amount ELSE 0 END),SUM(CASE WHEN cash_effect<0 THEN amount ELSE 0 END) FROM finance_entries WHERE id IN (1,2,3,4,5,6,7) AND status!=\'Voided\'').fetchone()[:]==(9500.0,5000.0)
assert c.execute('SELECT reference,receipt_file FROM finance_entries WHERE id=4').fetchone()[:]==('new-500','new.png')
assert c.execute('SELECT status FROM finance_entries WHERE id=9').fetchone()[0]=='Recorded', 'Real standalone sale receipt must be preserved'
assert scan()==(0,1,0), 'Re-running startup must not re-create ghost entries or reclassify purchase'
assert c.execute('SELECT COUNT(*) FROM finance_integrity_cases_v354').fetchone()[0]==2
assert c.execute('SELECT COUNT(*) FROM audit_log').fetchone()[0]==1
print('PASS actual V30.54 SQLite migration SQL: purchase 5,000 is operational, sale 9,500 mirror quarantined, 500 new receipt preserved')
print('PASS already-posted legacy duplicate is held for controlled reversal; legitimate journals and evidence remain unchanged')
print('PASS repeated-startup idempotence and exact cash movements (9,500 in / 5,000 out for fixture)')
