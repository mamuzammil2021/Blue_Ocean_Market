const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const server=read('server/server.js'),client=read('public/client.js'),html=read('public/index.html'),pkg=require(path.join(root,'package.json'));
let failed=0;function check(name,ok){if(!ok){failed++;console.error('FAIL',name)}else console.log('PASS',name)}
check('current version',pkg.version==='27.9.0'&&server.includes("version:'27.9.0'")&&html.includes('/client.js?v=27.9.0'));
check('scoped integrity endpoint',server.includes("app.get('/api/system/integrity'")&&server.includes("allow('dashboard','finance')"));
check('duplicate Finance source detection',server.includes("duplicate_finance_source")&&server.includes('HAVING COUNT(*)>1'));
check('sold machine sale detection',server.includes("sold_without_sale")&&server.includes("lifecycle_stage='Sold / Completed'"));
check('sale Finance detection',server.includes('sale_without_finance')&&server.includes("source_type='Excavator Sale'"));
check('sale PDF detection',server.includes('sale_without_pdf')&&server.includes("title='Machine Sale Document'"));
check('buyer business-unit detection',server.includes('buyer_unit_mismatch'));
check('advance allocation overflow detection',server.includes('allocation_overflow')&&server.includes('SUM(x.amount_krw)'));
check('supplier availability detection',server.includes('orphan_supplier_listing'));
const integrityStart=server.indexOf("app.get('/api/system/integrity'");
const integrityRoute=server.slice(integrityStart,server.indexOf('\n});',integrityStart)+4);
check('integrity endpoint is read only',!integrityRoute.includes('UPDATE ')&&!integrityRoute.includes('DELETE ')&&!integrityRoute.includes('INSERT '));
check('CEO dashboard integrity card',client.includes('<h3>Data Integrity</h3>')&&client.includes('showIntegrity()'));
check('integrity results responsive table',client.includes('Cross-module Data Integrity')&&client.includes('table-wrap'));
if(failed){console.error(`V27.6 QA failed: ${failed}`);process.exit(1)}console.log('V27.6 complete QA PASS');
