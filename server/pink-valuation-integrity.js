'use strict';
function issues(tx,finance){const a=[];if(!tx)return [{code:'SNAPSHOT_MISSING',message:'Payment snapshot is missing. Restore the linked record before posting.'}];const rate=Number(tx.company_rate_to_krw),native=Number(tx.company_amount),krw=Number(tx.bank_krw);if(tx.direction!=='NonCash'){
 if(!Number.isFinite(rate)||!Number.isFinite(native)||!Number.isFinite(krw)||native<=0||krw<=0)a.push({code:'INVALID_MOVEMENT',message:'The payment valuation rate is invalid. Request an authorized valuation correction.'});
 if(!(rate>0)||tx.company_currency==='KRW'&&rate!==1)a.push({code:'VALUATION_RATE_INVALID',message:'The payment valuation rate is invalid. Request an authorized valuation correction.'});
 if(tx.company_currency!=='KRW'&&rate===1&&!JSON.parse(tx.valuation_basis_json||'{}').identity_reason)a.push({code:'FOREIGN_IDENTITY_VALUATION',message:'A foreign-currency payment uses 1 as its KRW valuation rate. Review the evidenced payment-date valuation through Finance correction; the same-currency transfer ratio is not a KRW rate.'});
 if(Math.abs(native*rate-krw)>.011)a.push({code:'BANK_VALUE_MISMATCH',message:'Stored native bank amount and KRW valuation do not reconcile. Request Finance correction.'});
 if(finance&&(finance.original_currency!==tx.company_currency||Math.abs(Number(finance.original_amount)-native)>.005||Math.abs(Number(finance.fx_rate)-rate)>1e-8||Math.abs(Number(finance.krw_amount)-krw)>.005))a.push({code:'FINANCE_SNAPSHOT_MISMATCH',message:'Finance does not match the confirmed source-account snapshot. Rebuild through the authorized correction workflow.'});
 }return a;}
module.exports={issues};
