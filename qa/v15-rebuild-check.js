const fs=require('fs'),cp=require('child_process'),path=require('path');
const root=path.resolve(__dirname,'..');
for(const f of ['server/server.js','server/db.js','client.js']){const r=cp.spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});if(r.status){console.error('FAIL syntax',f);console.error(r.stderr);process.exit(1)}console.log('PASS syntax',f)}
const c=fs.readFileSync(path.join(root,'client.js'),'utf8');
const s=fs.readFileSync(path.join(root,'server/server.js'),'utf8');
const checks={
 'single selected-unit dashboard': c.includes("if(unit.name==='MIMI Resturant') return mimiDashboard(c);") && c.includes("if(unit.name==='Excavator') return excavatorDashboard(c);"),
 'MIMI tables dedicated area': c.includes("['restaurantTables','Restaurant Tables']") && c.includes('restaurantTablesPage'),
 'MIMI POS does not contain table manager label': c.includes('Table management is under Restaurant Tables'),
 'Excavator persistent machine workflow': c.includes('Save & Continue Later') && c.includes('Open / Continue'),
 'Excavator separate transactions': c.includes('Purchase','Logistics','Repair') && c.includes('/transactions'),
 'Excavator transaction edit/void': s.includes('/transactions/:txid') && c.includes('voidExcavatorTransaction'),
 'Excavator parts': c.includes('Parts Inventory') && s.includes('/api/excavator/parts-stock'),
 'multiple stage documents': c.includes('multiple') && c.includes('name="files" type="file" multiple'),
 'KRW base': c.includes('Base currency KRW') && s.includes("currency:'KRW'"),
 'CEO scope enforcement': s.includes('x-business-unit-id') && s.includes('You cannot access another business unit')
};
let bad=0;for(const [k,v] of Object.entries(checks)){console.log((v?'PASS ':'FAIL ')+k);if(!v)bad++}if(bad)process.exit(2);console.log('V15 rebuild static checks passed.');
