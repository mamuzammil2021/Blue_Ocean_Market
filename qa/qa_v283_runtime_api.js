const base=process.env.V283_BASE_URL||'http://127.0.0.1:3283';
const adminEmail=process.env.V283_ADMIN_EMAIL;
const adminPassword=process.env.V283_ADMIN_PASSWORD;
const qaPassword=process.env.V283_USER_PASSWORD;
if(!adminEmail||!adminPassword||!qaPassword)throw new Error('V283_ADMIN_EMAIL, V283_ADMIN_PASSWORD and V283_USER_PASSWORD are required.');
let failed=0;
function check(name,value,detail=''){if(value)console.log('PASS',name);else{failed+=1;console.error('FAIL',name,detail)}}
async function request(url,{token,unit,method='GET',body,form,headers:extraHeaders={},expected}={}){
  const headers={...extraHeaders};if(token)headers.Authorization='Bearer '+token;if(unit)headers['X-Business-Unit-ID']=String(unit);if(body!==undefined)headers['Content-Type']='application/json';
  const response=await fetch(base+url,{method,headers,body:form||(body===undefined?undefined:JSON.stringify(body))});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={raw:text}}
  if(expected!==undefined&&response.status!==expected)throw new Error(`${method} ${url}: expected ${expected}, received ${response.status}: ${text}`);
  if(expected===undefined&&!response.ok)throw new Error(`${method} ${url}: ${response.status}: ${text}`);
  return {status:response.status,data};
}
async function login(email,password){return (await request('/api/auth/login',{method:'POST',body:{email,password}})).data}
function evidence(values,fileField='receipt',name='v283-evidence.txt'){
  const form=new FormData();for(const [key,value] of Object.entries(values||{}))if(value!==undefined&&value!==null)form.append(key,String(value));form.append(fileField,new Blob(['V28.3 retained test evidence'],{type:'text/plain'}),name);return form;
}
async function approve(id,token,unit,note){return (await request(`/api/approvals/${id}`,{token,unit,method:'PUT',body:{status:'Approved',note}})).data}

(async()=>{
  const health=(await request('/api/health')).data;check('health reports V28.3.0',health.version==='28.3.0',JSON.stringify(health));
  const ceo=(await login(adminEmail,adminPassword)).token,finance=(await login('bilal.ahmed@blueocean.local',qaPassword)).token,financeTwo=(await login('farhan.malik@blueocean.local',qaPassword)).token,salesLogin=await login('hassan.excavator@blueocean.local',qaPassword),sales=salesLogin.token;
  const units=(await request('/api/business-units',{token:ceo})).data,excavator=units.find(x=>x.name==='Excavator');check('Excavator unit is available',!!excavator);const unit=excavator.id,suffix=Date.now();
  const users=(await request('/api/users',{token:ceo,unit})).data;check('development users are retained additively',users.some(x=>x.email==='bilal.ahmed@blueocean.local')&&users.some(x=>x.email==='farhan.malik@blueocean.local')&&users.some(x=>x.email==='hassan.excavator@blueocean.local'));
  const demoBuyers=(await request('/api/excavator/buyers',{token:sales,unit})).data;check('optional development sample data is available without a reset',demoBuyers.some(x=>String(x.name).startsWith('DEMO ·')));

  const buyerId=(await request('/api/excavator/buyers',{token:sales,unit,method:'POST',body:{name:`V283 Buyer ${suffix}`,buyer_type:'International',country:'Pakistan',location:'Lahore',contact_person:'QA Buyer',phone:'0300-0000000'}})).data.id;
  const missingReceipt=await request(`/api/excavator/buyers/${buyerId}/payments`,{token:sales,unit,method:'POST',form:new FormData(),expected:400});check('buyer payment cannot be saved without receipt evidence',/evidence|receipt/i.test(missingReceipt.data.error||''),missingReceipt.data.error);

  const paymentOne=(await request(`/api/excavator/buyers/${buyerId}/payments`,{token:sales,unit,method:'POST',form:evidence({payment_type:'Advance',original_amount:2000000,currency:'KRW',fx_rate:1,payment_date:'2026-08-22',method:'Bank',reference:`V283-PAY-1-${suffix}`,notes:'approval execution test'})})).data;
  const voidOne=(await request(`/api/excavator/buyers/${buyerId}/payments/${paymentOne.id}`,{token:sales,unit,method:'DELETE',body:{reason:'Duplicate buyer payment test'}})).data;
  check('buyer payment deletion creates a Finance + CEO approval',voidOne.approval_required===true&&!!voidOne.approval_id,JSON.stringify(voidOne));
  let financeCounts=(await request('/api/action-counts',{token:finance,unit})).data.counts,salesCounts=(await request('/api/action-counts',{token:sales,unit})).data.counts;
  check('Approval sidebar badge appears only when relevant work is pending',Number(financeCounts.approvals||0)>0&&Number(salesCounts.approvals||0)>0,JSON.stringify({financeCounts,salesCounts}));
  const financeDecision=await approve(voidOne.approval_id,finance,unit,'Finance verified duplicate payment and evidence');check('Finance review advances delegated void to CEO',financeDecision.status==='Pending'&&financeDecision.current_step==='CEO Review',JSON.stringify(financeDecision));
  await request(`/api/approvals/${voidOne.approval_id}`,{token:financeTwo,unit,method:'PUT',body:{status:'Approved',note:'Finance cannot replace CEO'},expected:403});
  const voidOneComplete=await approve(voidOne.approval_id,ceo,unit,'CEO authorizes payment reversal');check('final approval automatically executes buyer payment void',voidOneComplete.execution?.executed===true&&voidOneComplete.status==='Executed',JSON.stringify(voidOneComplete));
  let buyerDetail=(await request(`/api/excavator/buyers/${buyerId}`,{token:sales,unit})).data,paymentOneAfter=buyerDetail.payments.find(x=>Number(x.id)===Number(paymentOne.id));
  check('voided buyer payment stays visible with reversed source status',paymentOneAfter?.status==='Voided');
  const paymentOneFinance=(await request('/api/finance',{token:sales,unit})).data.find(x=>x.source_type==='Excavator Buyer Payment'&&Number(x.source_id)===Number(paymentOne.id));check('automatic void also reverses the linked Finance record',paymentOneFinance?.status==='Voided',JSON.stringify(paymentOneFinance));
  salesCounts=(await request('/api/action-counts',{token:sales,unit})).data.counts;check('Approval badge is omitted after relevant work completes',salesCounts.approvals===undefined,JSON.stringify(salesCounts));

  const paymentTwo=(await request(`/api/excavator/buyers/${buyerId}/payments`,{token:finance,unit,method:'POST',form:evidence({payment_type:'Advance',original_amount:1500000,currency:'KRW',fx_rate:1,payment_date:'2026-08-22',method:'Bank',reference:`V283-PAY-2-${suffix}`})})).data;
  const voidTwo=(await request(`/api/excavator/buyers/${buyerId}/payments/${paymentTwo.id}`,{token:finance,unit,method:'DELETE',body:{reason:'Finance-originated duplicate'}})).data;
  const voidTwoHistory=(await request(`/api/approvals/${voidTwo.approval_id}/history`,{token:finance,unit})).data;
  check('Finance requester proceeds directly to independent CEO review',voidTwoHistory.approval.waiting_for==='CEO Review'&&voidTwoHistory.approval.next_reviewers.some(x=>x.role==='CEO / Owner'),JSON.stringify(voidTwoHistory.approval));
  await request(`/api/approvals/${voidTwo.approval_id}`,{token:financeTwo,unit,method:'PUT',body:{status:'Approved',note:'not the CEO'},expected:403});
  const voidTwoComplete=await approve(voidTwo.approval_id,ceo,unit,'CEO independently approves Finance request');check('Finance-originated dual action executes without self-review deadlock',voidTwoComplete.execution?.executed===true&&voidTwoComplete.status==='Executed',JSON.stringify(voidTwoComplete));

  const paymentThree=(await request(`/api/excavator/buyers/${buyerId}/payments`,{token:sales,unit,method:'POST',form:evidence({payment_type:'Advance',original_amount:1000000,currency:'KRW',fx_rate:1,payment_date:'2026-08-22',method:'Bank',reference:`V283-PAY-3-${suffix}`})})).data;
  const needsCeoConfirmation=await request(`/api/excavator/buyers/${buyerId}/payments/${paymentThree.id}`,{token:ceo,unit,method:'DELETE',body:{reason:'CEO direct reversal test'},expected:428});check('CEO controlled action first requires explicit confirmation',needsCeoConfirmation.data.ceo_confirmation_required===true,JSON.stringify(needsCeoConfirmation.data));
  const ceoDirect=(await request(`/api/excavator/buyers/${buyerId}/payments/${paymentThree.id}`,{token:ceo,unit,method:'DELETE',body:{reason:'CEO direct reversal test'},headers:{'X-CEO-Confirmed':'1','X-CEO-Confirmation-Note':'Reviewed linked payment and authorize immediate reversal'}})).data;check('confirmed CEO action executes immediately without waiting',ceoDirect.ok===true);
  const approvals=(await request('/api/approvals',{token:ceo,unit})).data,directRecord=approvals.find(x=>x.source_entity==='excavator_buyer_payment'&&Number(x.source_id)===Number(paymentThree.id)&&Number(x.direct_authorization)===1);check('CEO confirmation is retained in approval and audit history',directRecord?.status==='Executed'&&/Reviewed linked payment/.test(directRecord.direct_authorization_note||''),JSON.stringify(directRecord));

  const refundablePayment=(await request(`/api/excavator/buyers/${buyerId}/payments`,{token:sales,unit,method:'POST',form:evidence({payment_type:'Advance',original_amount:10000000,currency:'KRW',fx_rate:1,payment_date:'2026-08-22',method:'Bank',reference:`V283-ADV-${suffix}`})})).data;
  const refundRequest=(await request(`/api/excavator/buyers/${buyerId}/refunds`,{token:sales,unit,method:'POST',form:evidence({original_amount:6000000,currency:'KRW',fx_rate:1,refund_date:'2026-08-22',method:'Bank',reference:`V283-REFUND-${suffix}`,reason:'Return unused buyer advance'})})).data;
  check('material buyer advance refund enters configured approval',refundRequest.approval_required===true&&!!refundRequest.approval_id,JSON.stringify(refundRequest));
  await approve(refundRequest.approval_id,finance,unit,'Refund evidence and available advance verified');const refundComplete=await approve(refundRequest.approval_id,ceo,unit,'CEO authorizes buyer advance refund');check('approved refund is paid and posted to Finance automatically',refundComplete.execution?.executed===true&&!!refundComplete.execution?.refund_id&&!!refundComplete.execution?.finance_id,JSON.stringify(refundComplete));
  buyerDetail=(await request(`/api/excavator/buyers/${buyerId}`,{token:sales,unit})).data;const refund=buyerDetail.refunds.find(x=>Number(x.id)===Number(refundComplete.execution.refund_id));check('refund evidence/history remains on buyer and reduces available advance',refund?.status==='Completed'&&!!refund.receipt_file&&Number(buyerDetail.balance.available_advance_krw)===4000000,JSON.stringify(buyerDetail.balance));
  const salesFinance=(await request('/api/finance',{token:sales,unit})).data,refundFinance=salesFinance.find(x=>x.source_type==='Excavator Buyer Refund'&&Number(x.source_id)===Number(refund.id));
  await request(`/api/finance/${refundFinance.id}/verify`,{token:finance,unit,method:'PUT',body:{verification_status:'Verified / Correct',verification_note:'Refund evidence and linked source verified'}});
  const verifiedChange=(await request(`/api/finance/${refundFinance.id}/request-change`,{token:finance,unit,method:'POST',body:{reason:'Correct the refund reference and retain revised evidence'}})).data;check('changing a verified Finance source requires an independent approval',verifiedChange.approval_required===true&&!!verifiedChange.approval_id,JSON.stringify(verifiedChange));
  const verifiedChangeApproved=await approve(verifiedChange.approval_id,financeTwo,unit,'Independent Finance reviewer authorizes source creator correction');check('approved verified change automatically opens the creator correction task',verifiedChangeApproved.execution?.executed===true&&!!verifiedChangeApproved.execution?.correction_id,JSON.stringify(verifiedChangeApproved));
  const corrections=(await request('/api/finance/corrections',{token:sales,unit})).data,refundCorrection=corrections.find(x=>Number(x.finance_entry_id)===Number(refundFinance.id)),refundCorrectionDetail=(await request(`/api/finance/corrections/${refundCorrection.id}`,{token:sales,unit})).data;
  check('refund Finance correction form exposes source-specific editable fields',['original_amount','currency','fx_rate','refund_date','method','reference','reason'].every(name=>refundCorrectionDetail.form.fields.some(x=>x.name===name))&&refundCorrectionDetail.can_correct===true,JSON.stringify(refundCorrectionDetail.form));
  const correctedRefund=(await request(`/api/finance/${refundFinance.id}`,{token:sales,unit,method:'PUT',form:evidence({original_amount:6000000,currency:'KRW',fx_rate:1,refund_date:'2026-08-22',method:'Bank',reference:`V283-REFUND-CORRECTED-${suffix}`,reason:'Return unused buyer advance',response_note:'Corrected the refund reference and uploaded revised evidence'},'attachments','v283-refund-correction.txt')})).data;
  check('only the original creator can correct refund fields and resubmit',correctedRefund.resubmitted===true&&correctedRefund.changed_fields.some(x=>x.field==='reference'),JSON.stringify(correctedRefund));
  await request(`/api/finance/${refundFinance.id}/verify`,{token:finance,unit,method:'PUT',body:{verification_status:'Verified / Correct',verification_note:'Corrected refund accepted'}});
  const refundVoid=(await request(`/api/excavator/buyers/${buyerId}/refunds/${refund.id}`,{token:sales,unit,method:'DELETE',body:{reason:'Refund was sent twice'}})).data;await approve(refundVoid.approval_id,finance,unit,'Finance confirms duplicate refund');const refundVoidComplete=await approve(refundVoid.approval_id,ceo,unit,'CEO authorizes refund reversal');check('approved refund void executes automatically',refundVoidComplete.execution?.executed===true&&refundVoidComplete.status==='Executed',JSON.stringify(refundVoidComplete));
  buyerDetail=(await request(`/api/excavator/buyers/${buyerId}`,{token:sales,unit})).data;const voidedRefund=buyerDetail.refunds.find(x=>Number(x.id)===Number(refund.id)),refundFinanceAfter=(await request(`/api/finance/${refundFinance.id}/detail`,{token:sales,unit})).data.finance;check('refund void preserves history, reverses Finance and restores available advance',voidedRefund?.status==='Voided'&&refundFinanceAfter.status==='Voided'&&Number(buyerDetail.balance.available_advance_krw)===10000000,JSON.stringify({voidedRefund,finance:refundFinanceAfter.status,balance:buyerDetail.balance}));

  const integrity=(await request('/api/system/integrity',{token:ceo,unit})).data;check('integrity scan has no critical cross-record failures',integrity.critical===0,JSON.stringify(integrity));
  if(failed)throw new Error(`V28.3 runtime API QA failed: ${failed}`);console.log('V28.3 CEO authorization, approval execution, buyer payment and refund runtime API QA PASS');
})().catch(error=>{console.error(error.stack||error);process.exit(1)});
