const fs=require('fs'),assert=require('assert');
const s=fs.readFileSync('server/v305.js','utf8');
const section=s.split("app.post('/api/pink-salt/suppliers/:id/advance-refunds'")[1].split('\n  app.')[0];
assert(section.includes("requiredForNonCash:true,direction:'receipt'"),'Supplier refund must receive into company account');
assert(section.includes('Receive Into account currency must match Refund Currency'));
assert(section.includes('syncRefund(id)'));
const payment=s.split("app.post('/api/pink-salt/suppliers/:id/advances'")[1].split('\n  app.')[0];
assert(payment.includes('configuredPaymentAccount(req,s.business_unit_id,method,req.body.payment_account_id,{requiredForNonCash:true})'),'Supplier outgoing advances remain unchanged');
console.log('PASS: supplier refund receipt direction; account-currency rule; existing sync; outgoing advances unchanged');
