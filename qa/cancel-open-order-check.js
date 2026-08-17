const fs=require('fs');
const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
function ok(c,m){if(!c)throw new Error(m);console.log('PASS:',m)}
ok(html.includes('async function cancelOpenOrder(id)'), 'cancelOpenOrder function exists');
ok(html.includes("/api/restaurant/orders/'+id+'/cancel"), 'cancel API is called');
ok(html.includes("onclick=\"cancelOpenOrder(${id})\""), 'open-order button calls cancel without immediately closing modal');
ok(html.includes("confirm('Cancel this open order?"), 'confirmation is required');
ok(html.includes("prompt('Cancellation reason:'"), 'cancellation reason is requested');
