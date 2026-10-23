'use strict';
// Action authorization is evaluated independently of structural stock/ledger locks.
function policy(req,imp,activity,access){
 const user=req?.user||{},ceo=user.role==='CEO / Owner',bu=imp.business_unit_id;
 const write=ceo||['purchases','inventory','finance'].some(m=>access?.canAction?.(user.id,m,'edit',bu));
 const admin=ceo||['Admin','System Administrator','Finance / Admin'].includes(user.role)||access?.can?.(user.id,'sensitive.system_admin',bu)===true;
 const manager=['Operations Manager','Business Unit Manager'].includes(user.role),owner=Number(imp.created_by)===Number(user.id);
 const received=imp.status==='Received'||!!imp.received_at||Number(activity.received_weight_kg)>0||activity.stock_activity;
 const terminal=['Cancelled','Voided'].includes(imp.status),voidRole=received?ceo:activity.financial_history||activity.financial_activity?admin:ceo||manager||owner;
 return {edit:!!(!terminal&&write&&(!received||ceo)),void:!!(!terminal&&write&&voidRole),received,restricted_to_ceo:!!received};
}
module.exports={policy};
