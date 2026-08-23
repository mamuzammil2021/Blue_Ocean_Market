const base=process.env.V281_BASE_URL||'http://127.0.0.1:3281';
const adminEmail=process.env.V281_ADMIN_EMAIL;
const adminPassword=process.env.V281_ADMIN_PASSWORD;
const qaUserPassword=process.env.V281_USER_PASSWORD;
const expectedVersion=process.env.V281_EXPECTED_VERSION||'28.1.0';
if(!adminEmail||!adminPassword||!qaUserPassword)throw new Error('V281_ADMIN_EMAIL, V281_ADMIN_PASSWORD and V281_USER_PASSWORD are required.');
let failed=0;
function check(name,value,detail=''){if(value)console.log('PASS',name);else{failed++;console.error('FAIL',name,detail)}}
async function request(url,{token,unit,method='GET',body,form,expected}={}){
  const headers={};
  if(token)headers.Authorization='Bearer '+token;
  if(unit)headers['X-Business-Unit-ID']=String(unit);
  if(body!==undefined)headers['Content-Type']='application/json';
  const response=await fetch(base+url,{method,headers,body:form||(body===undefined?undefined:JSON.stringify(body))});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={raw:text}}
  if(expected!==undefined&&response.status!==expected)throw new Error(`${method} ${url}: expected ${expected}, received ${response.status}: ${text}`);
  if(expected===undefined&&!response.ok)throw new Error(`${method} ${url}: ${response.status}: ${text}`);
  return {status:response.status,data};
}
async function login(email,password){return (await request('/api/auth/login',{method:'POST',body:{email,password}})).data}
function form(values,fileField){const result=new FormData();for(const [key,value] of Object.entries(values||{}))if(value!==undefined&&value!==null)result.append(key,String(value));if(fileField)result.append(fileField,new Blob(['V28.1 QA receipt evidence'],{type:'text/plain'}),'v281-evidence.txt');return result}

(async()=>{
  const health=(await request('/api/health')).data;
  check(`health reports V${expectedVersion}`,health.version===expectedVersion,JSON.stringify(health));
  const index=await (await fetch(base+'/')).text();
  check('served browser bundle is Korean-first with action navigation',index.includes('<html lang="ko"')&&index.includes(`/client.js?v=${expectedVersion}`)&&index.includes('v281-action-navigation'));

  const admin=await login(adminEmail,adminPassword),ceo=admin.token;
  const units=(await request('/api/business-units',{token:ceo})).data;
  const excavator=units.find(item=>item.name==='Excavator');
  check('Excavator business unit exists',!!excavator);
  const unit=excavator.id,suffix=Date.now(),password=qaUserPassword;
  const entryEmail=`v281.entry.${suffix}@example.test`,otherEmail=`v281.other.${suffix}@example.test`;
  const entryId=(await request('/api/users',{token:ceo,unit,method:'POST',body:{name:'V281 Entry User',email:entryEmail,password,role:'Sales / Business Development',business_unit_id:unit}})).data.id;
  await request('/api/users',{token:ceo,unit,method:'POST',body:{name:'V281 Other User',email:otherEmail,password,role:'Sales / Business Development',business_unit_id:unit}});
  const entry=(await login(entryEmail,password)).token,other=(await login(otherEmail,password)).token;
  const emptyCounts=(await request('/api/action-counts',{token:other})).data.counts;
  check('zero action counters are omitted',emptyCounts.finance===undefined&&emptyCounts.tasks===undefined);

  const assetNo=`V281-ASSET-${suffix}`;
  const asset=(await request('/api/excavator/assets',{token:ceo,unit,method:'POST',form:form({asset_no:assetNo,machine_name:'Smart Match Loader',type:'Loader',make:'Hyundai',model:'HL770',year:2022,condition_status:'Used',purchase_date:'2026-08-21',purchase_price:780000,supplier_option:'Other / New Supplier',supplier_name:`Asset Supplier ${suffix}`})})).data;
  check('company machine created for supplier requirement matching',!!asset.id);

  const supplier=(await request('/api/excavator/suppliers',{token:entry,unit,method:'POST',body:{name:`V281 Supplier ${suffix}`,location:'Busan'}})).data;
  const listing=(await request(`/api/excavator/suppliers/${supplier.id}/machines`,{token:entry,unit,method:'POST',body:{machine_name:'Smart Match Excavator',machine_type:'Excavator',make:'Doosan',model:'DX225',year:2021,condition_status:'Used',asking_price:900000,location:'Busan',status:'Available'}})).data;
  const buyer=(await request('/api/excavator/buyers',{token:entry,unit,method:'POST',body:{name:`V281 Buyer ${suffix}`,buyer_type:'International',country:'Pakistan',location:'Lahore'}})).data;
  const requirement=(await request(`/api/excavator/buyers/${buyer.id}/requirements`,{token:entry,unit,method:'POST',body:{requirement:'DX225 required outside supplier location',machine_name:'Smart Match Excavator',machine_type:'Excavator',make:'Doosan',model:'DX225',min_year:2020,max_year:2023,condition_status:'Used',budget_min:800000,budget_max:1000000,quantity:1,action_type:'Buy or Exchange',exchange_machine:'Trade-in available',status:'Active'}})).data;
  const buyerMatches=(await request(`/api/excavator/buyers/${buyer.id}/requirements/${requirement.id}/matches`,{token:entry,unit})).data;
  check('buyer requirement smart-matches without location',buyerMatches.matches.some(item=>Number(item.id)===Number(listing.id)&&item.score>=90&&item.match_level==='Exact Match'));
  const match=buyerMatches.matches.find(item=>Number(item.id)===Number(listing.id));
  check('match explains all required comparison fields',Array.isArray(match.matched_fields)&&['machine_name','machine_type','make','model','year','condition_status','budget'].every(field=>match.matched_fields.some(item=>item.field===field)));
  await request(`/api/excavator/buyers/${buyer.id}/requirements/${requirement.id}/matches`,{token:entry,unit});
  const storedMatches=(await request('/api/excavator/requirement-matches?requirement_type=Buyer',{token:entry,unit})).data.filter(item=>Number(item.requirement_id)===Number(requirement.id)&&Number(item.machine_id)===Number(listing.id));
  check('repeated matching does not create duplicates',storedMatches.length===1);
  const matchCounts=(await request('/api/action-counts',{token:entry})).data.counts;
  check('new buyer match appears on sidebar counter',Number(matchCounts.excavatorBuyers)>=1);
  const notifications=(await request('/api/notifications',{token:entry})).data;
  check('matching automatically notifies the relevant user',notifications.some(item=>item.title==='Machine requirement match'&&item.action_view==='excavatorBuyers'&&Number(item.action_id)===Number(buyer.id)));
  const exchange=(await request('/api/excavator/exchange-proposals',{token:entry,unit,method:'POST',body:{match_id:match.match_id,requested_machine_value:900000,offered_machine_value:650000,offered_machine_source:'Company trade-in',offered_machine_id:asset.id,inspection_condition:'Subject to inspection',notes:'V28.1 exchange test',status:'Proposed'}})).data;
  check('exchange proposal calculates balance',!!exchange.id&&Number(exchange.balance_amount)===250000&&exchange.balance_direction==='Payable to machine owner');

  const supplierRequirement=(await request(`/api/excavator/suppliers/${supplier.id}/requirements`,{token:entry,unit,method:'POST',body:{requirement:'Supplier seeks company loader',machine_name:'Smart Match Loader',machine_type:'Loader',make:'Hyundai',model:'HL770',min_year:2021,max_year:2024,condition_status:'Used',budget_min:700000,budget_max:850000,quantity:1,action_type:'Buy',status:'Active'}})).data;
  const supplierMatches=(await request(`/api/excavator/suppliers/${supplier.id}/requirements/${supplierRequirement.id}/matches`,{token:entry,unit})).data;
  check('supplier requirement uses the same fields and matches company assets',supplierMatches.matches.some(item=>Number(item.id)===Number(asset.id)&&item.score>=90));

  const paymentValues={payment_type:'Advance',original_amount:250000,currency:'KRW',fx_rate:1,payment_date:'2026-08-21',method:'Bank',reference:`V281-PAY-${suffix}`,notes:'Original payment'};
  const noEvidence=await request(`/api/excavator/buyers/${buyer.id}/payments`,{token:entry,unit,method:'POST',form:form(paymentValues),expected:400});
  check('Excavator buyer payment rejects missing evidence',/evidence|receipt/i.test(noEvidence.data.error||''));
  const payment=(await request(`/api/excavator/buyers/${buyer.id}/payments`,{token:entry,unit,method:'POST',form:form(paymentValues,'receipt')})).data;
  const entryFinance=(await request('/api/finance',{token:entry})).data;
  const finance=entryFinance.find(item=>item.source_type==='Excavator Buyer Payment'&&Number(item.source_id)===Number(payment.id));
  check('source payment creates creator-owned Finance record',!!finance&&Number(finance.created_by)===Number(entryId));
  const otherFinance=(await request('/api/finance',{token:other})).data;
  check('regular user cannot see another user Finance data',!otherFinance.some(item=>Number(item.id)===Number(finance.id)));
  await request(`/api/finance/${finance.id}/detail`,{token:other,expected:403});
  await request('/api/pnl',{token:other,expected:403});
  const companyFinance=(await request('/api/finance',{token:ceo,unit})).data;
  check('CEO can see authorized company Finance data',companyFinance.some(item=>Number(item.id)===Number(finance.id)));

  await request(`/api/finance/${finance.id}/verify`,{token:ceo,unit,method:'PUT',body:{verification_status:'Correction Required',verification_note:'Correct amount and bank reference',requested_changes:'Change amount and reference; reconfirm evidence',severity:'High'}});
  let corrections=(await request('/api/finance/corrections',{token:entry})).data;
  let correction=corrections.find(item=>Number(item.finance_entry_id)===Number(finance.id));
  check('correction is assigned only to original creator',!!correction&&Number(correction.assigned_to)===Number(entryId)&&correction.status==='Open');
  check('unrelated user has no correction visibility',(await request('/api/finance/corrections',{token:other})).data.length===0);
  let correctionDetail=(await request(`/api/finance/corrections/${correction.id}`,{token:entry})).data;
  const fieldNames=correctionDetail.form.fields.map(item=>item.name);
  check('correction form is source-specific',correctionDetail.form.source_type==='Excavator Buyer Payment'&&['payment_type','original_amount','currency','fx_rate','payment_date','method','reference','notes'].every(name=>fieldNames.includes(name))&&!fieldNames.includes('category'));
  check('correction creates linked pending task and initial history',!!correctionDetail.task&&correctionDetail.history.some(item=>item.action==='Correction Requested'));
  const pendingCounts=(await request('/api/action-counts',{token:entry})).data.counts;
  check('Finance and Tasks sidebar counters show pending work',Number(pendingCounts.finance)>=1&&Number(pendingCounts.tasks)>=1);
  const reminder=(await request(`/api/finance/corrections/${correction.id}/remind`,{token:ceo,unit,method:'POST',body:{message:'Please correct this before close of business',due_at:'2026-08-25'}})).data;
  check('reviewer can send correction reminder',Number(reminder.reminder_count)===1);
  correctionDetail=(await request(`/api/finance/corrections/${correction.id}`,{token:entry})).data;
  check('reminder is retained in full history',correctionDetail.history.some(item=>item.action==='Reminder Sent')&&Number(correctionDetail.correction.reminder_count)===1);

  await request(`/api/finance/${finance.id}`,{token:other,method:'PUT',form:form({...paymentValues,original_amount:275000,response_note:'Unauthorized attempt'}),expected:403});
  await request(`/api/finance/corrections/${correction.id}/view`,{token:entry,method:'POST',body:{}});
  const correctedReference=`V281-CORRECTED-${suffix}`;
  const corrected=(await request(`/api/finance/${finance.id}`,{token:entry,method:'PUT',form:form({payment_type:'Advance',original_amount:275000,currency:'KRW',fx_rate:1,payment_date:'2026-08-22',method:'Bank',reference:correctedReference,notes:'Corrected at source',response_note:'Corrected amount, date and reference'})})).data;
  check('original creator can correct and resubmit all source fields',corrected.resubmitted===true&&corrected.changed_fields.some(item=>item.field==='original_amount')&&corrected.changed_fields.some(item=>item.field==='reference'));
  const buyerDetail=(await request(`/api/excavator/buyers/${buyer.id}`,{token:entry,unit})).data;
  const correctedPayment=buyerDetail.payments.find(item=>Number(item.id)===Number(payment.id));
  const correctedFinance=(await request(`/api/finance/${finance.id}/detail`,{token:entry})).data.finance;
  check('source and Finance records update together',Number(correctedPayment.original_amount)===275000&&correctedPayment.reference===correctedReference&&Number(correctedFinance.amount)===275000&&correctedFinance.reference===correctedReference&&correctedFinance.verification_status==='Resubmitted');
  correctionDetail=(await request(`/api/finance/corrections/${correction.id}`,{token:entry})).data;
  check('resubmission history and task state are tracked',correctionDetail.correction.status==='Resubmitted'&&correctionDetail.task.status==='Waiting'&&correctionDetail.history.some(item=>item.action==='Corrected & Resubmitted'));
  const performance=(await request('/api/performance/summary',{token:ceo,unit})).data;
  const performer=performance.find(item=>Number(item.id)===Number(entryId));
  check('correction activity appears in user performance',Number(performer?.performance?.finance_corrections?.total)>=1&&Number(performer?.performance?.finance_corrections?.resubmissions)>=1);

  await request(`/api/finance/${finance.id}/verify`,{token:ceo,unit,method:'PUT',body:{verification_status:'Verified / Correct',verification_note:'Correction verified'}});
  correctionDetail=(await request(`/api/finance/corrections/${correction.id}`,{token:entry})).data;
  check('verification resolves correction and linked task',correctionDetail.correction.status==='Resolved'&&correctionDetail.task.status==='Completed'&&correctionDetail.history.some(item=>item.action==='Verified & Resolved'));
  const resolvedCounts=(await request('/api/action-counts',{token:entry})).data.counts;
  check('resolved Finance and task counters disappear',resolvedCounts.finance===undefined&&resolvedCounts.tasks===undefined);

  if(failed)throw new Error(`V28.1 runtime API QA failed: ${failed}`);
  console.log('V28.1 runtime API QA PASS');
})().catch(error=>{console.error(error.stack||error);process.exit(1)});
