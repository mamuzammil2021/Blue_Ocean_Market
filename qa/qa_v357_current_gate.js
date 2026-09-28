#!/usr/bin/env node
'use strict';
// Current-source test gate. Historical QA files remain unmodified and are NOT counted as passing.
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const tests=[
 'qa_v357_coa_compatibility.js',
 'qa_v3572_consolidated.js',
 'qa_v3572_fixed_asset_fixture.js',
 'qa_v3572_real_sqlite.js',
 'qa_v3573_interbu_readonly.js',
 'qa_v3575_integrity_review.js',
 'qa_v3576_asset_lifecycle.js',
 'qa_v3576_interbu_elimination.js',
 'qa_v3577_accrual_settlement.js','qa_v3577_inventory_review.js',
 'qa_v3562_financing_integration.js',
];
const results=[];
for(const file of tests){const run=spawnSync(process.execPath,['qa/'+file],{encoding:'utf8',timeout:60000});const passed=run.status===0&&!run.error;results.push({file,passed,exit_code:run.status,detail:(run.stderr||'').trim().slice(-700)});console.log(`${passed?'PASS':'FAIL'} ${file}`);if(!passed)console.error(results.at(-1).detail||run.stdout.slice(-700));}
const source=fs.readFileSync('server/v357-realworld.js','utf8');
const checks={no_finance_insert:!/INSERT\s+INTO\s+finance_entries/i.test(source),cash_neutral_journal_proposals:source.includes("no_cash_movement:true"),posted_reversal_only_in_official_subledger:source.includes("const hasPostedReversal=id=>")&&source.includes("status='Posted' LIMIT 1"),accounting_date_round_trip:source.includes("d.toISOString().slice(0,10)===v")};
for(const [name,ok] of Object.entries(checks)){results.push({file:name,passed:ok});console.log(`${ok?'PASS':'FAIL'} ${name}`)}
const passed=results.every(x=>x.passed);
console.log(`CURRENT SOURCE GATE ${passed?'PASS':'FAIL'} (${results.filter(x=>x.passed).length}/${results.length}); inherited qa:release remains independently blocked by historic exact-version assertions; live Render QA NOT PERFORMED.`);
if(!passed)process.exitCode=1;
