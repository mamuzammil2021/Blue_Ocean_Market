'use strict';
// Read-only approval history projection. No approval, Finance or journal writes.
const credentialKeys=/^(password|password_hash|jwt_secret|smtp_password|api_key|access_token|refresh_token|authorization)$/i;
function safeApprovalValue(value){
  if(Array.isArray(value))return value.map(safeApprovalValue);
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).map(([key,item])=>{
    if(credentialKeys.test(key))return [key,'[REDACTED]'];
    if(['request_snapshot_json','original_snapshot_json','execution_result_json'].includes(key)&&typeof item==='string'){
      try{return [key,JSON.stringify(safeApprovalValue(JSON.parse(item)))]}catch(_){return [key,'{}']}
    }
    return [key,safeApprovalValue(item)];
  }));
}
function createApprovalDetail({db,enforceUnit,access,canViewFinanceRecord}){
  return function approvalSourceDetail(approval,req){
    let snapshot={};try{snapshot=JSON.parse(approval.request_snapshot_json||'{}')}catch(_){}
    const source={entity:approval.source_entity||'',id:Number(approval.source_id||0)};
    if(!source.entity||!source.id)return {source,snapshot:safeApprovalValue(snapshot)};
    const aliases={finance_entry:'finance_transaction',finance_payment_policy:'finance_transaction',excavator_asset:'excavator_machine'};
    const entity=db.prepare('SELECT * FROM platform_entities WHERE entity_type=? AND active=1').get(aliases[source.entity]||source.entity);
    // Only registered, unit-scoped records can be projected. Child records lacking
    // their own scope need a module adapter; do not guess their ownership.
    if(!entity||!/^[a-z_][a-z0-9_]*$/i.test(entity.table_name||''))return {source,snapshot:safeApprovalValue(snapshot)};
    const columns=db.prepare(`PRAGMA table_info(${entity.table_name})`).all();
    if(!columns.some(c=>c.name==='business_unit_id'))return {source,snapshot:safeApprovalValue(snapshot)};
    const record=db.prepare(`SELECT * FROM ${entity.table_name} WHERE id=?`).get(source.id);
    const bu=Number(approval.business_unit_id||0),permissions=access();
    let permitted=!!record&&Number(record.business_unit_id)===bu&&enforceUnit(req,bu);
    if(req.user.role!=='CEO / Owner'){
      permitted=permitted&&!!permissions?.canAction(req.user.id,entity.module_key,'view',bu);
      if(entity.module_key==='payroll')permitted=permitted&&!!permissions?.can(req.user.id,'sensitive.payroll',bu);
    }
    if(entity.table_name==='finance_entries')permitted=permitted&&canViewFinanceRecord(req,record);
    if(permitted){source.record=safeApprovalValue(record);source.action_view=entity.route_template?.replace(/^#/,'')||'';source.action_id=source.id;if(entity.entity_type==='employee')source.action_view='employee';if(entity.table_name==='pink_fx_transactions')source.action_view='pinkFx';}
    return {source,snapshot:safeApprovalValue(snapshot)};
  };
}
module.exports={createApprovalDetail,safeApprovalValue};
