const base=process.env.V282_BASE_URL||'http://127.0.0.1:3282';
const adminEmail=process.env.V282_ADMIN_EMAIL;
const adminPassword=process.env.V282_ADMIN_PASSWORD;
const qaPassword=process.env.V282_USER_PASSWORD;
if(!adminEmail||!adminPassword||!qaPassword)throw new Error('V282_ADMIN_EMAIL, V282_ADMIN_PASSWORD and V282_USER_PASSWORD are required.');
let failed=0;
function check(name,value,detail=''){if(value)console.log('PASS',name);else{failed+=1;console.error('FAIL',name,detail)}}
async function request(url,{token,unit,method='GET',body,form,expected}={}){
  const headers={};if(token)headers.Authorization='Bearer '+token;if(unit)headers['X-Business-Unit-ID']=String(unit);if(body!==undefined)headers['Content-Type']='application/json';
  const response=await fetch(base+url,{method,headers,body:form||(body===undefined?undefined:JSON.stringify(body))});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={raw:text}}
  if(expected!==undefined&&response.status!==expected)throw new Error(`${method} ${url}: expected ${expected}, received ${response.status}: ${text}`);
  if(expected===undefined&&!response.ok)throw new Error(`${method} ${url}: ${response.status}: ${text}`);
  return {status:response.status,data};
}
async function login(email,password){return (await request('/api/auth/login',{method:'POST',body:{email,password}})).data}
function multipart(values,fileField,fileName='v282-evidence.txt'){
  const result=new FormData();for(const [key,value] of Object.entries(values||{}))if(value!==undefined&&value!==null)result.append(key,String(value));
  if(fileField)result.append(fileField,new Blob(['V28.2 controlled evidence'],{type:'text/plain'}),fileName);return result;
}
function idsDescending(rows){return rows.every((row,index)=>index===0||Number(rows[index-1].id)>Number(row.id))}

(async()=>{
  const health=(await request('/api/health')).data;
  check('health reports V28.2.0',health.version==='28.2.0',JSON.stringify(health));
  const admin=await login(adminEmail,adminPassword),ceo=admin.token;
  const units=(await request('/api/business-units',{token:ceo})).data,excavator=units.find(x=>x.name==='Excavator');
  check('Excavator unit is available',!!excavator);const unit=excavator.id,suffix=Date.now();

  const managerEmail=`v282.manager.${suffix}@example.test`,financeOneEmail=`v282.finance1.${suffix}@example.test`,financeTwoEmail=`v282.finance2.${suffix}@example.test`;
  const managerId=(await request('/api/users',{token:ceo,unit,method:'POST',body:{name:'V282 Request Owner',email:managerEmail,password:qaPassword,role:'Business Unit Manager',business_unit_id:unit}})).data.id;
  const financeOneId=(await request('/api/users',{token:ceo,unit,method:'POST',body:{name:'V282 Finance One',email:financeOneEmail,password:qaPassword,role:'Finance / Admin',business_unit_id:unit}})).data.id;
  const financeTwoId=(await request('/api/users',{token:ceo,unit,method:'POST',body:{name:'V282 Finance Two',email:financeTwoEmail,password:qaPassword,role:'Finance / Admin',business_unit_id:unit}})).data.id;
  const manager=(await login(managerEmail,qaPassword)).token,financeOne=(await login(financeOneEmail,qaPassword)).token,financeTwo=(await login(financeTwoEmail,qaPassword)).token;

  const baseMachine={machine_name:'Conditional Token Excavator',type:'Excavator',make:'Hyundai',model:'HX220',year:2023,condition_status:'Used',purchase_date:'2026-08-21',purchase_price:2000000,supplier_option:'Other / New Supplier',supplier_name:`V282 Supplier ${suffix}`};
  const zeroToken=(await request('/api/excavator/assets',{token:ceo,unit,method:'POST',form:multipart({...baseMachine,asset_no:`V282-ZERO-${suffix}`,purchase_token:0})})).data;
  check('machine purchase with zero token needs no payment reference or evidence',!!zeroToken.id);
  const missingEvidence=await request('/api/excavator/assets',{token:ceo,unit,method:'POST',form:multipart({...baseMachine,asset_no:`V282-NO-EVID-${suffix}`,purchase_token:10000,token_payment_reference:`REF-${suffix}`}),expected:400});
  check('positive purchase token requires evidence',/evidence|receipt/i.test(missingEvidence.data.error||''),missingEvidence.data.error);
  const missingReference=await request('/api/excavator/assets',{token:ceo,unit,method:'POST',form:multipart({...baseMachine,asset_no:`V282-NO-REF-${suffix}`,purchase_token:10000},'payment_evidence'),expected:400});
  check('positive purchase token requires payment reference',/reference/i.test(missingReference.data.error||''),missingReference.data.error);
  const tokenMachine=(await request('/api/excavator/assets',{token:ceo,unit,method:'POST',form:multipart({...baseMachine,asset_no:`V282-TOKEN-${suffix}`,purchase_token:10000,token_payment_method:'Bank',token_paid_date:'2026-08-21',token_payment_reference:`TOKEN-${suffix}`},'payment_evidence')})).data;
  check('positive token with reference and evidence creates machine and linked payment',!!tokenMachine.id);

  const dual=(await request('/api/approvals',{token:manager,method:'POST',body:{business_unit_id:unit,type:'V282 Dual Control',action_key:'general.request',amount:1200000,reason:'Verify strict Finance then CEO sequence',required_level:5,priority:'High'}})).data;
  check('dual approval request is created',!!dual.id);
  await request(`/api/approvals/${dual.id}`,{token:manager,method:'PUT',body:{status:'Approved',note:'self approval attempt'},expected:409});
  await request(`/api/approvals/${dual.id}`,{token:ceo,unit,method:'PUT',body:{status:'Approved',note:'CEO too early'},expected:403});
  const financeStep=(await request(`/api/approvals/${dual.id}`,{token:financeOne,method:'PUT',body:{status:'Approved',note:'Finance control complete'}})).data;
  check('Finance approval advances dual request to CEO',financeStep.status==='Pending'&&financeStep.current_step==='CEO Review',JSON.stringify(financeStep));
  await request(`/api/approvals/${dual.id}`,{token:financeTwo,method:'PUT',body:{status:'Approved',note:'second Finance attempt'},expected:403});
  const dualComplete=(await request(`/api/approvals/${dual.id}`,{token:ceo,unit,method:'PUT',body:{status:'Approved',note:'CEO final approval'}})).data;
  check('CEO completes dual approval only after Finance',dualComplete.status==='Approved');
  const dualHistory=(await request(`/api/approvals/${dual.id}/history`,{token:manager})).data;
  check('dual approval retains immutable snapshot and exact decision history',!!dualHistory.approval.payload_hash&&!!dualHistory.approval.original_snapshot_json&&['Requested','Finance Approved','CEO Approved'].every(action=>dualHistory.history.some(h=>h.action===action)));

  const correctionApproval=(await request('/api/approvals',{token:manager,method:'POST',body:{business_unit_id:unit,type:'V282 Correctable Request',action_key:'general.request',amount:1000,reason:'Initial request values',required_level:3,priority:'Normal'}})).data;
  const changes=(await request(`/api/approvals/${correctionApproval.id}`,{token:financeOne,method:'PUT',body:{status:'Changes Required',note:'Update amount and explain the revised value'}})).data;
  check('request changes creates a linked pending task',changes.status==='Changes Required'&&!!changes.task_id);
  await request(`/api/approvals/${correctionApproval.id}/resubmit`,{token:financeTwo,method:'POST',form:multipart({type:'V282 Unauthorized Edit',amount:1500,reason:'attempt',response_note:'not owner'}),expected:403});
  const resubmitted=(await request(`/api/approvals/${correctionApproval.id}/resubmit`,{token:manager,method:'POST',form:multipart({type:'V282 Correctable Request',amount:1500,reason:'Revised request values',response_note:'Updated amount and business reason'},'attachment','v282-revised.txt')})).data;
  check('only original requester can correct every request field and resubmit',resubmitted.status==='Resubmitted'&&resubmitted.changed_fields.some(x=>x.field==='amount')&&resubmitted.changed_fields.some(x=>x.field==='reason'),JSON.stringify(resubmitted));
  await request(`/api/approvals/${correctionApproval.id}/remind`,{token:manager,method:'POST',body:{message:'Please review the corrected request'}});
  const correctedComplete=(await request(`/api/approvals/${correctionApproval.id}`,{token:financeTwo,method:'PUT',body:{status:'Approved',note:'Corrected values accepted'}})).data;
  check('resubmitted approval can be verified without a duplicate request',correctedComplete.status==='Approved');
  const tasks=(await request('/api/tasks',{token:manager})).data,changeTask=tasks.find(x=>Number(x.id)===Number(changes.task_id));
  check('approval correction task closes and remains in performance history',changeTask?.status==='Completed'&&Number(changeTask.progress_percent)===100,JSON.stringify(changeTask));
  const correctedHistory=(await request(`/api/approvals/${correctionApproval.id}/history`,{token:manager})).data;
  check('approval correction preserves diffs, reminders and full history',Number(correctedHistory.approval.revision_count)>=1&&Number(correctedHistory.approval.reminder_count)>=1&&correctedHistory.changed_fields.length>=2&&['Changes Requested','Corrected & Resubmitted','Reminder Sent','Approved'].every(action=>correctedHistory.history.some(h=>h.action===action)));

  const cancellable=(await request('/api/approvals',{token:manager,method:'POST',body:{business_unit_id:unit,type:'V282 Cancel Request',action_key:'general.request',amount:0,reason:'Cancellation permission test',required_level:3}})).data;
  await request(`/api/approvals/${cancellable.id}`,{token:financeOne,method:'PUT',body:{status:'Cancelled',note:'reviewer cancellation attempt'},expected:403});
  const cancelled=(await request(`/api/approvals/${cancellable.id}`,{token:manager,method:'PUT',body:{status:'Cancelled',note:'Requester no longer needs this'}})).data;
  check('only original requester can cancel an active approval',cancelled.status==='Cancelled');

  const largeReference=`V282-LARGE-${suffix}`,largeRequest=(await request('/api/finance',{token:manager,method:'POST',form:multipart({business_unit_id:unit,type:'Expense',category:'General Expense',original_amount:6000000,original_currency:'KRW',fx_rate:1,transaction_date:'2026-08-21',description:'V282 automatically approved large payment',payment_method:'Bank',reference:largeReference,source_type:'Manual'},'attachments','v282-large-finance-evidence.txt')})).data;
  check('large Finance entry waits for configured approval',largeRequest.approval_required===true&&!!largeRequest.approval_id);
  const largeApproved=(await request(`/api/approvals/${largeRequest.approval_id}`,{token:financeOne,method:'PUT',body:{status:'Approved',note:'Large payment evidence verified'}})).data;
  const managerFinance=(await request('/api/finance',{token:manager})).data,largeEntry=managerFinance.find(x=>x.reference===largeReference);
  check('final approval automatically creates large Finance entry once',largeApproved.execution?.executed===true&&largeApproved.execution?.finance_entry_id&&Number(largeEntry?.created_by)===Number(managerId)&&Number(largeEntry?.attachment_count)>=1,JSON.stringify({largeApproved,largeEntry}));

  const financeEntry=(await request('/api/finance',{token:financeOne,method:'POST',form:multipart({business_unit_id:unit,type:'Expense',category:'General Expense',original_amount:450000,original_currency:'KRW',fx_rate:1,transaction_date:'2026-08-21',description:'V282 controlled void test',payment_method:'Bank',reference:`V282-FIN-${suffix}`,source_type:'Manual'},'attachments','v282-finance-receipt.txt')})).data;
  check('test Finance entry is created with evidence',!!financeEntry.id&&Number(financeEntry.attachment_count)>=1);
  const voidRequest=(await request(`/api/finance/${financeEntry.id}`,{token:financeOne,method:'DELETE',body:{reason:'Duplicate bank transaction'}})).data;
  check('Finance void enters dual approval instead of changing data immediately',voidRequest.approval_required===true&&!!voidRequest.approval_id);
  await request(`/api/approvals/${voidRequest.approval_id}`,{token:financeOne,method:'PUT',body:{status:'Approved',note:'self approval attempt'},expected:409});
  await request(`/api/approvals/${voidRequest.approval_id}`,{token:financeTwo,method:'PUT',body:{status:'Approved',note:'Finance confirms duplicate'}});
  const voidComplete=(await request(`/api/approvals/${voidRequest.approval_id}`,{token:ceo,unit,method:'PUT',body:{status:'Approved',note:'CEO authorizes reversal'}})).data;
  const voidedFinance=(await request(`/api/finance/${financeEntry.id}/detail`,{token:financeOne})).data.finance;
  check('final void approval automatically updates linked Finance data',voidComplete.execution?.executed===true&&voidedFinance.status==='Voided',JSON.stringify({voidComplete,financeStatus:voidedFinance.status}));
  const voidHistory=(await request(`/api/approvals/${voidRequest.approval_id}/history`,{token:financeOne})).data;
  check('automatic execution is idempotently recorded',voidHistory.approval.status==='Executed'&&!!voidHistory.approval.executed_at&&voidHistory.history.some(h=>h.action==='Executed'));

  let notifications=(await request('/api/notifications',{token:manager})).data;
  const unread=notifications.filter(x=>!x.read_at);check('workflow creates actionable user notifications',unread.length>0);
  if(unread.length)await request(`/api/notifications/${unread[0].id}/read`,{token:manager,method:'PUT',body:{}});
  notifications=(await request('/api/notifications',{token:manager})).data;
  const firstRead=notifications.findIndex(x=>!!x.read_at),lastUnread=notifications.map(x=>!x.read_at).lastIndexOf(true),unreadRows=notifications.filter(x=>!x.read_at),readRows=notifications.filter(x=>x.read_at);
  check('notifications return every unread item before read history',firstRead===-1||lastUnread<firstRead,JSON.stringify(notifications.map(x=>({id:x.id,read:!!x.read_at}))));
  check('notification groups are newest first',idsDescending(unreadRows)&&idsDescending(readRows));

  const managerCounts=(await request('/api/action-counts',{token:manager})).data.counts;
  check('zero action counters are omitted after resolved work',managerCounts.tasks===undefined&&managerCounts.approvals===undefined,JSON.stringify(managerCounts));
  const performance=(await request('/api/performance/summary',{token:ceo,unit})).data.find(x=>Number(x.id)===Number(managerId));
  check('approval correction task remains available to performance reporting',Number(performance?.performance?.completed_tasks||0)>=1);
  check('Finance approval action belongs to the acting Finance user',voidHistory.history.some(h=>h.action==='Finance Approved'&&Number(h.user_id)===Number(financeTwoId))&&Number(financeOneId)!==Number(financeTwoId));

  if(failed)throw new Error(`V28.2 runtime API QA failed: ${failed}`);
  console.log('V28.2 approval, Finance, token evidence and notification runtime API QA PASS');
})().catch(error=>{console.error(error.stack||error);process.exit(1)});
