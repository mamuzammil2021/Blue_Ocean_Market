// Blue Ocean Market V30.69.13 — shared payment intent contract.
// Pure, registry-ready rules. No Excavator functions are replaced or patched.
(function(root){
 'use strict';
 const norm=v=>String(v||'').trim().toLowerCase();
 const methods=Object.freeze({cash:'cash',bank:'bank',card:'card'});
 const mode=v=>['advance','new','both'].includes(norm(v))?norm(v):'new';
 const rules={
  version:'30.69.13',
  method: v=>methods[norm(v)]||norm(v),
  mode,
  usesNewMoney: v=>mode(v)!=='advance',
  requiresSource: v=>mode(v)!=='advance',
  requiresCounterparty: (method,settlement)=>mode(settlement)!=='advance'&&norm(method)!=='cash',
  requiresEvidence: v=>mode(v)!=='advance',
  eligibleSource: (a,method,currency)=>{
   if(!a||a.active===false||a.is_active===false)return false;
   const type=norm(a.financial_account_type||a.payment_type||a.method_type||'bank');
   return type===norm(method)&&norm(a.currency||'krw')===norm(currency||'krw');
  },
  validateSettlement: ({mode:choice,advance=0,newAmount=0,outstanding=0,availableAdvance=0})=>{
   const m=mode(choice),adv=Number(advance),fresh=Number(newAmount),out=Number(outstanding),avail=Number(availableAdvance);
   if(![adv,fresh,out,avail].every(Number.isFinite)||adv<0||fresh<0||out<0||avail<0)return 'Invalid settlement amounts';
   if((m==='advance'||m==='both')&&(adv<=.005||adv>avail+.005))return 'Supplier advance amount is unavailable or invalid';
   if((m==='new'||m==='both')&&fresh<=.005)return 'New payment amount is required';
   if(adv+fresh>out+.01)return 'Settlement exceeds outstanding';
   return '';
  }
 };
 root.BOMPaymentRules=Object.freeze(rules);
 if(typeof module!=='undefined'&&module.exports)module.exports=rules;
})(typeof window!=='undefined'?window:globalThis);
