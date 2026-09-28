'use strict';
// V30.57 safety gate: no automatic replacement of live COA codes based on draft spreadsheet.
const fs=require('fs'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
const rows=fs.readFileSync(path.join(root,'accounting_spec/COA_COMPATIBILITY.csv'),'utf8').trim().split(/\r?\n/);
const ruleRows=fs.readFileSync(path.join(root,'accounting_spec/POSTING_RULE_COVERAGE.csv'),'utf8').trim().split(/\r?\n/);
const source=fs.readFileSync(path.join(root,'server/v290.js'),'utf8');
const summary=JSON.parse(fs.readFileSync(path.join(root,'accounting_spec/COVERAGE_SUMMARY.json')));
assert.equal(rows.length-1,138,'All workbook COA rows must be preserved');
assert.equal(ruleRows.length-1,61,'All workbook posting rules must be preserved');
assert.equal(summary.exact_code_collisions,30);
assert(source.includes("['1000','Cash / Bank Clearing'"),'Preserve existing live code 1000');
assert(source.includes("['1100','Accounts Receivable'"),'Preserve existing live code 1100');
assert(source.includes("['1200','Excavator Inventory'"),'Preserve existing live code 1200');
assert(!fs.existsSync(path.join(root,'server/v357-auto-seed-draft-coa.js')),'Do not auto-seed draft codes before mapping approval');
console.log('V30.57 COA compatibility gate: 138 draft rows, 61 draft rules, 30 differing code/name collisions; live seed preserved.');
