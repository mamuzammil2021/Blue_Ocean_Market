const fs=require('fs');
const server=fs.readFileSync('server/server.js','utf8');
const db=fs.readFileSync('server/db.js','utf8');
const client=fs.readFileSync('client.js','utf8');
const checks=[
 ['buyer type persisted',db.includes("buyer_type TEXT DEFAULT 'International'")&&server.includes('buyer_type')],
 ['advance allocation ledger',db.includes('excavator_buyer_payment_allocations')&&server.includes('INSERT INTO excavator_buyer_payment_allocations')],
 ['existing buyer advance shown',client.includes('Available advance')&&client.includes('fillExcavatorBuyer')],
 ['existing buyer complete data autofill',client.includes('exExistingContact')&&client.includes('exExistingAddress')],
 ['new buyer auto-create on sale',server.includes('INSERT INTO excavator_buyers')&&server.includes('new_buyer_name')],
 ['buyer records updated after sale',server.includes("UPDATE excavator_assets SET selling_price=?,customer_id=NULL,buyer_id=?")&&server.includes('advance_allocated_krw')],
 ['local/international tag',client.includes("x.buyer_type==='Local'")],
 ['country flag',client.includes('function countryFlag')],
 ['Pakistan-only resale UI',client.includes('d.resale_profit_eligible?')],
 ['Pakistan-only resale API',server.includes('Resale Profit Share is available only for Pakistani buyers.')],
 ['purchase must be fully paid before sale',server.includes('complete purchase price has been paid')],
 ['sale has no payment-status completion condition',!server.includes('All required sale/payment completion conditions are satisfied')],
 ['sale payment date required',server.includes("if(!paymentDate)return res.status(400).json({error:'Payment Date is required.'})")],
 ['sale payment reference required',server.includes("if(!paymentReference)return res.status(400).json({error:'Payment Reference is required.'})")],
 ['PDF includes buyer type',server.includes("row('Buyer Type'")],
 ['PDF includes advance allocation',server.includes("section('11. Buyer Advance Allocation')")],
 ['PDF says sale cleared by advance',server.includes("'Cleared before sale completion'")],
 ['supplier action machine removed',!client.includes('Action → Machine')],
 ['sold non-CEO actions hidden',client.includes("closed&&me.role!=='CEO / Owner'?'':")],
 ['supplier machine availability excludes purchased/sold',server.includes("status='Available'")&&server.includes("markMatchingSupplierListingsUnavailable")&&server.includes("markMatchingSupplierListingsSold")],
];
let ok=true;for(const [n,v] of checks){console.log((v?'PASS ':'FAIL ')+n);if(!v)ok=false}if(!ok)process.exit(1);
