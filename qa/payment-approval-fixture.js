'use strict';
// Explicit prerequisite used only by regression cases whose intended outcome is a verified payment.
// It never auto-approves an outstanding operational/dual authorization.
const assert=require('assert/strict');
async function authorizePolicy(f,id){const d=await f.api('GET',`/api/finance/${id}/detail`);assert(d.ok);const g=d.j.authorization;if(!g||g.ready)return;assert(g.blockers.every(x=>x.code==='ACCOUNTING_POLICY_APPROVAL'),'A real required operational approval must be completed explicitly by the test');const r=await f.api('POST',`/api/finance/${id}/payment-policy-approval`,{reason:'Synthetic regression: CEO reviewed this exact evidenced valuation/fee treatment before Finance verification'},{'x-ceo-confirmed':'1','x-ceo-confirmation-note':'Synthetic explicit accounting authorization'});assert(r.ok,JSON.stringify(r));const after=await f.api('GET',`/api/finance/${id}/detail`);assert(after.j.authorization.ready);}
module.exports={authorizePolicy};
