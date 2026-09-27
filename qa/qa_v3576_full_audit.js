#!/usr/bin/env node
'use strict';
// Runs each historical release assertion independently; no failures are skipped
// or converted to passes. Source-only failures remain visible for migration.
const {spawnSync}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..'),pkg=require('../package.json');
const files=[...new Set([...pkg.scripts['qa:release'].matchAll(/node (qa\/[^\s&]+\.js)/g)].map(m=>m[1]))];
if(!files.includes('qa/qa_v3575_consolidated_gate.js'))files.push('qa/qa_v3575_consolidated_gate.js');
const results=[];
for(const file of files){const r=spawnSync(process.execPath,[file],{cwd:root,encoding:'utf8',timeout:90000,maxBuffer:2*1024*1024});const passed=r.status===0&&!r.error;results.push({file,passed,exit_code:r.status,issue:passed?'':String(r.stderr||r.stdout||r.error).split('\n').filter(Boolean).slice(0,3).join(' ').slice(0,450)});console.log(`${passed?'PASS':'FAIL'} ${file}${passed?'':' — '+results.at(-1).issue}`)}
const report={source_version:pkg.version,ran_at:new Date().toISOString(),passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results};
fs.writeFileSync(path.join(root,'qa/V30_57_6_FULL_AUDIT_RESULTS.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Full independent audit: ${report.passed} passed; ${report.failed} failed. No failed historical assertion was weakened.`);
if(report.failed)process.exitCode=1;
