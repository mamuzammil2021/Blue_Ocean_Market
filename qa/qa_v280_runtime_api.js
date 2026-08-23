const base=process.env.V280_BASE_URL||'http://127.0.0.1:3218';
const adminEmail=process.env.V280_ADMIN_EMAIL;
const adminPassword=process.env.V280_ADMIN_PASSWORD;
const financeEmail=process.env.V280_FINANCE_EMAIL;
const financePassword=process.env.V280_FINANCE_PASSWORD;
const expectedVersion=process.env.V280_EXPECTED_VERSION||'28.1.0';
if(!adminEmail||!adminPassword||!financeEmail||!financePassword)throw new Error('V280 administrator and Finance QA credentials are required through environment variables.');
let failed=0;
function check(name,value,detail=''){if(value)console.log('PASS',name);else{failed++;console.error('FAIL',name,detail)}}
async function request(path,{token,unit,method='GET',body,form,expected}={}){
  const headers={};if(token)headers.Authorization='Bearer '+token;if(unit)headers['X-Business-Unit-ID']=String(unit);if(body!==undefined)headers['Content-Type']='application/json';
  const response=await fetch(base+path,{method,headers,body:form||body===undefined?form:JSON.stringify(body)});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={raw:text}}
  if(expected!==undefined&&response.status!==expected)throw new Error(`${method} ${path}: expected ${expected}, received ${response.status}: ${text}`);
  if(expected===undefined&&!response.ok)throw new Error(`${method} ${path}: ${response.status}: ${text}`);
  return {status:response.status,data};
}
function evidenceForm(values,fileField){const form=new FormData();for(const [key,value] of Object.entries(values)){if(value!==undefined&&value!==null)form.append(key,String(value))}if(fileField)form.append(fileField,new Blob(['V28.0 runtime receipt evidence'],{type:'text/plain'}),'v280-receipt.txt');return form}
async function login(email,password){return (await request('/api/auth/login',{method:'POST',body:{email,password}})).data.token}

(async()=>{
  const health=(await request('/api/health')).data;check(`runtime health reports V${expectedVersion}`,health.version===expectedVersion,JSON.stringify(health));
  const index=await (await fetch(base+'/')).text();check('runtime page is Korean-first and mobile-ready',index.includes('<html lang="ko"')&&index.includes('v280-mobile-ui')&&index.includes(`/client.js?v=${expectedVersion}`));
  const ceo=await login(adminEmail,adminPassword),finance=await login(financeEmail,financePassword);
  const units=(await request('/api/business-units',{token:ceo})).data,excavator=units.find(x=>x.name==='Excavator');check('Excavator business unit available',!!excavator);const unit=excavator.id;

  const supplier=(await request('/api/excavator/suppliers',{token:ceo,unit,method:'POST',body:{name:'V28 QA Supplier',location:'Busan'}})).data;
  await request(`/api/excavator/suppliers/${supplier.id}/machines`,{token:ceo,unit,method:'POST',body:{machine_name:'QA Match Machine',machine_type:'Excavator',make:'Doosan',model:'DX225',year:2021,condition_status:'Used',asking_price:900000,location:'Busan',status:'Available'}});
  const buyer=(await request('/api/excavator/buyers',{token:ceo,unit,method:'POST',body:{name:'V28 QA Buyer',buyer_type:'International',country:'Pakistan',location:'Lahore'}})).data;
  const requirement=(await request(`/api/excavator/buyers/${buyer.id}/requirements`,{token:ceo,unit,method:'POST',body:{requirement:'Doosan export excavator',machine_name:'QA Match Machine',machine_type:'Excavator',make:'Doosan',model:'DX225',min_year:2020,max_year:2023,condition_status:'Used',location:'Busan',budget_max:1000000,quantity:1,status:'Active'}})).data;
  const reqDetail=(await request(`/api/excavator/buyers/${buyer.id}/requirements/${requirement.id}`,{token:ceo,unit})).data;
  const matches=(await request(`/api/excavator/buyers/${buyer.id}/requirements/${requirement.id}/matches`,{token:ceo,unit})).data;
  check('structured buyer requirement persists',reqDetail.make==='Doosan'&&reqDetail.model==='DX225'&&Number(reqDetail.min_year)===2020);
  check('buyer requirement matches supplier machine',matches.matches.some(x=>x.make==='Doosan'&&x.model==='DX225'));

  const buyerPaymentValues={payment_type:'Advance',original_amount:250000,currency:'KRW',fx_rate:1,payment_date:'2026-08-20',method:'Bank',reference:'V28-BUYER-PAY'};
  const missingBuyerEvidence=await request(`/api/excavator/buyers/${buyer.id}/payments`,{token:ceo,unit,method:'POST',form:evidenceForm(buyerPaymentValues),expected:400});
  check('buyer payment is rejected without evidence',/evidence|receipt/i.test(missingBuyerEvidence.data.error||''));
  const savedBuyerPayment=(await request(`/api/excavator/buyers/${buyer.id}/payments`,{token:ceo,unit,method:'POST',form:evidenceForm(buyerPaymentValues,'receipt')})).data;
  const buyerDetail=(await request(`/api/excavator/buyers/${buyer.id}`,{token:ceo,unit})).data;
  check('buyer payment evidence is linked to documents',!!savedBuyerPayment.receipt_document_id&&buyerDetail.documents.some(x=>Number(x.payment_id)===Number(savedBuyerPayment.id)));

  const assetValues={asset_no:'V28-QA-'+Date.now(),machine_name:'QA Payment Excavator',type:'Excavator',make:'Hyundai',model:'R220',year:2022,condition_status:'Used',purchase_date:'2026-08-20',purchase_price:1000000,purchase_token:100000,token_paid_date:'2026-08-20',token_payment_method:'Bank',token_payment_reference:'V28-TOKEN',supplier_option:'Other / New Supplier',supplier_name:'V28 QA Token Supplier'};
  const missingTokenEvidence=await request('/api/excavator/assets',{token:ceo,unit,method:'POST',form:evidenceForm(assetValues),expected:400});
  check('purchase token is rejected without evidence',/evidence|receipt/i.test(missingTokenEvidence.data.error||''));
  const asset=(await request('/api/excavator/assets',{token:ceo,unit,method:'POST',form:evidenceForm(assetValues,'payment_evidence')})).data;
  check('machine purchase with token evidence saves',!!asset.id);

  const machinePaymentValues={payment_type:'Purchase',amount:50000,payment_date:'2026-08-20',method:'Bank',reference:'V28-MACHINE-PAY'};
  const missingMachineEvidence=await request(`/api/excavator/assets/${asset.id}/payments`,{token:ceo,unit,method:'POST',form:evidenceForm(machinePaymentValues),expected:400});
  check('machine payment is rejected without evidence',/evidence|receipt/i.test(missingMachineEvidence.data.error||''));
  const savedMachinePayment=(await request(`/api/excavator/assets/${asset.id}/payments`,{token:ceo,unit,method:'POST',form:evidenceForm(machinePaymentValues,'receipt')})).data;
  const machinePayments=(await request(`/api/excavator/assets/${asset.id}/payments`,{token:ceo,unit})).data;
  check('saved machine receipt is viewable',machinePayments.some(x=>Number(x.id)===Number(savedMachinePayment.id)&&String(x.receipt_url||'').startsWith('/uploads/')));
  const missingRepairEvidence=await request(`/api/excavator/assets/${asset.id}/repairs`,{token:ceo,unit,method:'POST',form:evidenceForm({repair_date:'2026-08-20',vendor:'QA Repair',description:'Hydraulic check',amount:5000,status:'Completed'}),expected:400});
  check('repair payment is rejected without evidence',/evidence|receipt/i.test(missingRepairEvidence.data.error||''));
  await request(`/api/excavator/assets/${asset.id}/repairs`,{token:ceo,unit,method:'POST',form:evidenceForm({repair_date:'2026-08-20',vendor:'QA Repair',description:'Hydraulic check',amount:5000,status:'Completed'},'evidence')});
  const missingPartEvidence=await request(`/api/excavator/assets/${asset.id}/parts`,{token:ceo,unit,method:'POST',form:evidenceForm({part_name:'QA Filter',cost:2500,quantity:2,status:'In Stock'}),expected:400});
  check('parts payment is rejected without evidence',/evidence|receipt/i.test(missingPartEvidence.data.error||''));
  const part=(await request(`/api/excavator/assets/${asset.id}/parts`,{token:ceo,unit,method:'POST',form:evidenceForm({part_name:'QA Filter',cost:2500,quantity:2,status:'In Stock'},'evidence')})).data;
  await request(`/api/excavator/assets/${asset.id}/parts/${part.id}`,{token:ceo,unit,method:'PUT',form:evidenceForm({part_name:'QA Filter Updated',cost:2600,quantity:2,status:'In Stock'})});
  check('edited parts retain mandatory evidence',!!part.id);
  const transactionValues={type:'Customs Duty',stage:'Purchased',transaction_date:'2026-08-20',counterparty:'QA Customs',amount:3000,currency:'KRW',status:'Open',notes:'Runtime evidence test'};
  const missingTransactionEvidence=await request(`/api/excavator/assets/${asset.id}/transactions`,{token:ceo,unit,method:'POST',form:evidenceForm(transactionValues),expected:400});
  check('other Excavator costs reject missing evidence',/evidence|receipt/i.test(missingTransactionEvidence.data.error||''));
  const transaction=(await request(`/api/excavator/assets/${asset.id}/transactions`,{token:ceo,unit,method:'POST',form:evidenceForm(transactionValues,'files')})).data;
  await request(`/api/excavator/assets/${asset.id}/transactions/${transaction.id}`,{token:ceo,unit,method:'PUT',body:{amount:3200,notes:'Corrected runtime evidence test'}});
  check('edited cost transaction retains mandatory evidence',!!transaction.id);
  const documents=(await request(`/api/excavator/assets/${asset.id}/documents`,{token:ceo,unit})).data;
  check('payment evidence is stored in Excavator documents',documents.some(x=>/Receipt|Evidence/i.test(x.title||'')));

  const financeEntryForm=evidenceForm({type:'Expense',category:'V28 QA Expense',original_amount:12000,original_currency:'KRW',fx_rate:1,transaction_date:'2026-08-20',description:'Finance correction runtime test',payment_method:'Bank',reference:'V28-FIN-CORR'},'attachments');
  const financeEntry=(await request('/api/finance',{token:finance,method:'POST',form:financeEntryForm})).data;
  await request(`/api/finance/${financeEntry.id}/verify`,{token:ceo,unit,method:'PUT',body:{verification_status:'Correction Required',verification_note:'Correct reference and confirm evidence',requested_changes:'Update reference and resubmit evidence',severity:'High'}});
  let corrections=(await request('/api/finance/corrections',{token:finance})).data,correction=corrections.find(x=>Number(x.finance_entry_id)===Number(financeEntry.id));
  check('correction request reaches record creator',!!correction&&correction.status==='Open');
  await request(`/api/finance/corrections/${correction.id}/view`,{token:finance,method:'POST',body:{}});
  const correctionForm=evidenceForm({amount:12000,description:'Finance correction runtime test corrected',reference:'V28-FIN-CORR-UPDATED',response_note:'Reference corrected and evidence reconfirmed'},'attachments');
  await request(`/api/finance/${financeEntry.id}`,{token:finance,method:'PUT',form:correctionForm});
  corrections=(await request('/api/finance/corrections',{token:finance})).data;correction=corrections.find(x=>Number(x.id)===Number(correction.id));
  check('assigned user can correct and resubmit',correction.status==='Resubmitted'&&Number(correction.resubmission_count)>=1);
  await request(`/api/finance/${financeEntry.id}/verify`,{token:ceo,unit,method:'PUT',body:{verification_status:'Verified / Correct',verification_note:'Correction verified'}});
  corrections=(await request('/api/finance/corrections',{token:finance})).data;correction=corrections.find(x=>Number(x.id)===Number(correction.id));
  check('verified correction closes the request',correction.status==='Resolved');
  const performance=(await request('/api/performance/summary',{token:finance})).data,financeUser=performance.find(x=>/bilal/i.test(x.name||''));
  check('Finance correction performance is recorded',Number(financeUser?.performance?.finance_corrections?.total)>=1&&Number(financeUser?.performance?.finance_corrections?.resubmissions)>=1);

  const financeRows=(await request('/api/finance',{token:ceo,unit})).data;
  check('Excavator evidence-backed payments reach Finance',financeRows.some(x=>x.source_type==='Excavator Buyer Payment'&&x.receipt_file)&&financeRows.some(x=>x.source_type==='Excavator Payment'&&x.receipt_file));
  if(failed)throw new Error(`V28.0 runtime API QA failed: ${failed}`);console.log('V28.0 runtime API QA PASS');
})().catch(error=>{console.error(error.stack||error);process.exit(1)});
