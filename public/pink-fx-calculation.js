// Generated from server/pink-fx-calculation.js; run scripts/build-pink-fx-client.js after editing.
(function(){
'use strict';
// Evidenced settlement calculations; the simple conversion contract remains compatible.
const currencies=new Set(['KRW','USD','PKR','EUR','JPY','CNY']);
const round=x=>Math.round((Number(x)+Number.EPSILON)*100)/100;
const fail=(message,status=400,field=null)=>{throw Object.assign(new Error(message),{status,field})};
const positive=(v,label,zero=false)=>{const n=Number(v);if(!Number.isFinite(n)||(zero?n<0:n<=0))fail(`${label} must be ${zero?'non-negative':'greater than zero'}.`);if(n>Number.MAX_SAFE_INTEGER/100)fail(`${label} exceeds supported financial precision.`);return n};
const mutableRateWorkflows=new Set(['supplier_advance','supplier_refund','import_cost','expense']);
// Opt-in for new forms. Legacy API callers/corrections keep their explicit accounting bases.
function sharedRates(input,c){
 const b={...input};if(b.rate_entry_mode!=='shared')return b;
 const cc=c.company_currency,ic=c.invoice_currency;if(!cc||!ic||b.settlement_mode==='advance')return b;
 const rate=cc===ic?1:Number(b.bank_fx_rate),mutable=mutableRateWorkflows.has(c.workflow);
 const valid=x=>Number.isFinite(Number(x))&&Number(x)>0;
 function derive(key,value){if(!valid(value))return;const entered=b[key];if(entered!==undefined&&entered!==''&&(!valid(entered)||Math.abs(Number(entered)-value)>Math.max(1e-8,Math.abs(value)*1e-9)))fail('The shared exchange rate does not match the accounting equivalent.');b[key]=String(value);}
 if(mutable&&ic==='KRW')derive('invoice_rate_to_krw',1);
 if(mutable&&ic!=='KRW'&&cc==='KRW'&&valid(rate))derive('invoice_rate_to_krw',rate);
 if(cc==='KRW')derive('company_rate_to_krw',1);
 else if(ic==='KRW'&&valid(rate))derive('company_rate_to_krw',1/rate);
 else if(mutable&&valid(b.invoice_rate_to_krw)&&valid(rate))derive('company_rate_to_krw',Number(b.invoice_rate_to_krw)/rate);
 if((!b.fee_payment_account_id||String(b.fee_payment_account_id)===String(b.payment_account_id))&&valid(b.company_rate_to_krw))derive('separate_fee_rate_to_krw',Number(b.company_rate_to_krw));
 return b;
}
function calculate(b,c,options={}){
 if(b.multi_leg==='1'&&b.settlement_mode!=='advance')return calculateLegs(b,c,options);
 b=sharedRates(b,c);if(b.rate_entry_mode==='shared'&&mutableRateWorkflows.has(c.workflow))c={...c,invoice_carrying_rate:c.invoice_currency==='KRW'?1:Number(b.invoice_rate_to_krw)||null};
 const bounded=c.outstanding_krw!==null&&c.outstanding_krw!==undefined;
 const previewOnly=options.previewOnly===true; // UI arithmetic only; server validation calls the strict two-argument contract.
 const mode=b.settlement_mode||'new';if(!['advance','new','both'].includes(mode))fail('Invalid settlement option.');
 const advance=mode==='new'?0:round(positive(b.advance_amount_krw||0,'Advance allocation',true));
 if(mode!=='new'&&advance<=0)fail('No usable advance allocation. Select New Payment Only.');
 if(advance>c.available_advance_krw+.005)fail('Advance allocation exceeds available balance.',409);
 if(mode==='advance'){
  if(advance>c.outstanding_krw+.005)fail('Advance allocation exceeds outstanding.',409);
  return {direction:'NonCash',advance_krw:advance,invoice_amount:0,allocation_krw:0,company_amount:0,bank_krw:0,fee_krw:0,fx_difference_krw:0,confirmation_status:'NonCash',remaining_krw:round(c.outstanding_krw-advance)};
 }
 const cc=c.company_currency,ic=c.invoice_currency;
 for(const x of [cc,ic])if(!currencies.has(x))fail(`Unsupported conversion currency: ${x}.`);
 if(b.transfer_currency&&b.transfer_currency!==ic||b.recipient_currency&&b.recipient_currency!==ic)fail('Intermediary FX or recipient/invoice currency conversion requires separately evidenced conversion legs. This route supports one bank conversion only.');
 const cross=cc!==ic,rate=cross?positive(b.bank_fx_rate,'Bank FX rate'):1;
 if(!cross&&b.bank_fx_rate&&Number(b.bank_fx_rate)!==1)fail('Same-currency bank rate must be 1.');
 const pair=`${ic}/${cc}`;
 if(cross&&!previewOnly){
  if(b.fx_rate_pair!==pair)fail(`Quote direction must be 1 ${ic} = bank rate ${cc}; pair ${pair}.`);

 }
 const sourceFee=round(positive(b.source_fee_amount||0,'Source fee',true)),transferFee=round(positive(b.transfer_fee_amount||0,'Transfer fee',true));
 const feePolicy=b.fee_policy||'added_to_debit';
 if(!['added_to_debit','deducted_from_transfer','separate_debit'].includes(feePolicy))fail('Separate fee debits require a separate evidenced bank charge record; use an included debit fee or a transfer deduction here.');
 if(feePolicy==='added_to_debit'&&transferFee||feePolicy==='deducted_from_transfer'&&sourceFee||feePolicy==='separate_debit'&&(sourceFee||transferFee))fail('Fee fields do not match the selected fee policy.');
 const direction=c.direction||'Out',companyRate=cc==='KRW'?1:previewOnly&&!b.company_rate_to_krw?null:positive(b.company_rate_to_krw,'Company account accounting rate to KRW');
 if(cc==='KRW'&&b.company_rate_to_krw!==undefined&&b.company_rate_to_krw!==''&&Number(b.company_rate_to_krw)!==1)fail('KRW to KRW valuation must be 1.');
 if(!previewOnly&&cc!=='KRW'&&companyRate===1&&!String(b.identity_valuation_reason||'').trim())fail('Enter the payment-date valuation rate to KRW. A same-currency transfer ratio of 1 is not a KRW valuation rate.',400,'company_rate_to_krw');
 const entry=b.amount_entry||'recipient';if(!['recipient','company'].includes(entry))fail('Invalid amount entry option.');
 let recipient,transfer,company;
 if(direction==='Out'){
  if(entry==='recipient'){recipient=round(positive(b.recipient_expected_amount,'Recipient amount'));transfer=round(recipient+transferFee);company=round(transfer*rate+sourceFee)}
  else{company=round(positive(b.source_debit_amount,'Company debit'));transfer=round((company-sourceFee)/rate);recipient=round(transfer-transferFee)}
 }else{
  // Customer sends invoice currency; company bank receives net credit.
  if(transferFee)fail('Incoming transfer deductions must be evidenced as a fee in company account currency.');
  if(entry==='recipient'){recipient=round(positive(b.recipient_expected_amount,'Customer settlement amount'));transfer=recipient;company=round(transfer*rate-sourceFee)}
  else{company=round(positive(b.source_debit_amount,'Company credit'));transfer=round((company+sourceFee)/rate);recipient=transfer}
 }
 if(![recipient,company,transfer].every(x=>Number.isFinite(x)&&Number.isSafeInteger(Math.round(x*100))))fail('Calculated movement exceeds supported financial precision.');
 if(recipient<=0||company<=0||transfer<=0)fail('Fees exceed the available transfer or company amount.');
 if(entry==='recipient'&&b.source_debit_amount!==undefined&&b.source_debit_amount!==''&&Math.abs(Number(b.source_debit_amount)-company)>.01)fail('Actual company movement does not reconcile to the bank quote and fees.');
 if(entry==='company'&&b.recipient_expected_amount!==undefined&&b.recipient_expected_amount!==''&&Math.abs(Number(b.recipient_expected_amount)-recipient)>.01)fail('Recipient estimate does not reconcile to the company movement and fees.');
 const confirmed=b.recipient_confirmed_amount==null||b.recipient_confirmed_amount===''?null:round(positive(b.recipient_confirmed_amount,'Confirmed recipient amount'));
 if(confirmed!==null&&Math.abs(confirmed-recipient)>.01)fail('Recipient confirmation differs from the quote. Reconcile the actual quote/debit/fees before recording.');
 if(confirmed!==null&&entry==='company'){
  const reconciledCompany=round(direction==='Out'?transfer*rate+sourceFee:transfer*rate-sourceFee);
  if(Math.abs(reconciledCompany-company)>.01)fail('Rounded transfer does not reconcile to the actual bank movement. Enter the evidenced actual FX rate or use recipient-amount entry.');
 }
 const invoiceAmount=confirmed===null?recipient:confirmed;
 const carryingKnown=Number.isFinite(c.invoice_carrying_rate)&&c.invoice_carrying_rate>0;
 const applied=previewOnly&&!carryingKnown?null:round(invoiceAmount*c.invoice_carrying_rate),bankKrw=companyRate===null?null:fxMul(company,companyRate),feeKrw=companyRate===null?null:round((sourceFee+transferFee*rate)*companyRate);
 if(bounded&&applied!==null&&applied+advance>c.outstanding_krw+.005)fail('Invoice settlement exceeds outstanding.',409);
 if(![applied,bankKrw,feeKrw].every(x=>x===null||Number.isFinite(x)&&Number.isSafeInteger(Math.round(x*100))))fail('KRW equivalent exceeds supported financial precision.');
 const principal=bankKrw===null?null:direction==='Out'?bankKrw-feeKrw:bankKrw+feeKrw;
 const fx=principal===null||applied===null?null:round(principal-applied);
 return {direction,advance_krw:advance,invoice_amount:invoiceAmount,allocation_krw:applied,company_currency:cc,company_amount:company,company_rate_to_krw:companyRate,bank_krw:bankKrw,transfer_currency:ic,transfer_amount:transfer,recipient_expected:recipient,recipient_confirmed:confirmed,bank_rate:rate,rate_pair:pair,source_fee:sourceFee,transfer_fee:transferFee,fee_policy:feePolicy,fee_krw:feeKrw,fx_difference_krw:fx,confirmation_status:confirmed===null?'Estimated':'Confirmed',remaining_krw:!bounded||applied===null?null:round(c.outstanding_krw-applied-advance)};
}
// Bank/valuation products and quotients use integer arithmetic before cent rounding.
const fxScale=1000000000000n;
function fxFixed(x){const n=Number(x);if(!Number.isFinite(n)||n<0||n>Number.MAX_SAFE_INTEGER/100)fail('Amount exceeds supported financial precision.');return BigInt(n.toFixed(12).replace('.',''));}
function fxRatio(n,d){if(d<=0n)fail('Conversion rate must be positive.');const cents=(n+d/2n)/d;if(cents>BigInt(Number.MAX_SAFE_INTEGER))fail('Amount exceeds supported financial precision.');return Number(cents)/100;}
const fxProduct=(...xs)=>fxRatio(xs.reduce((n,x)=>n*fxFixed(x),1n)*100n,xs.reduce(n=>n*fxScale,1n));
const fxMul=(a,b)=>fxRatio(fxFixed(a)*fxFixed(b)*100n,fxScale*fxScale),fxDiv=(a,b)=>fxRatio(fxFixed(a)*100n,fxFixed(b));
// Explicitly evidenced bank -> transfer -> recipient -> invoice conversions.
// Each rate is stated as units of the preceding currency per one of the next.
function calculateLegs(b,c,options){
 if(c.direction==='In')fail('Use the normal receipt conversion for incoming money.');
 if(b.rate_entry_mode==='shared')b={...b,rate_entry_mode:'explicit'};
 const tc=b.transfer_currency||c.invoice_currency,rc=b.recipient_currency||c.invoice_currency,ic=c.invoice_currency,cc=c.company_currency;
 for(const x of [tc,rc,ic,cc])if(!currencies.has(x))fail('Unsupported conversion currency.');
 const r1=cc===tc?1:positive(b.bank_fx_rate,'Source to transfer rate'),r2=tc===rc?1:positive(b.recipient_fx_rate,'Transfer to recipient rate'),r3=rc===ic?1:positive(b.invoice_settlement_rate,'Recipient to invoice rate');
 if(!options.previewOnly&&(!String(b.conversion_reference||'').trim()||!String(b.quote_source||'').trim()))fail('Conversion evidence reference and source are required for multiple currency legs.');
 const sourceFee=round(positive(b.source_fee_amount||0,'Source fee',true)),transferFee=round(positive(b.transfer_fee_amount||0,'Transfer fee',true)),recipientFee=round(positive(b.recipient_fee_amount||0,'Recipient fee',true)),recipient=round(positive(b.recipient_expected_amount,'Recipient amount'));
 const transfer=round(fxMul(round(recipient+recipientFee),r2)+transferFee),company=round(fxMul(transfer,r1)+sourceFee),invoice=fxDiv(recipient,r3),companyRate=cc==='KRW'?1:positive(b.company_rate_to_krw,'Company account accounting rate to KRW');
 if(b.source_debit_amount!==''&&b.source_debit_amount!==undefined&&Math.abs(Number(b.source_debit_amount)-company)>.02)fail('Actual company movement does not reconcile to the conversion legs.');
 const confirmed=b.recipient_confirmed_amount==null||b.recipient_confirmed_amount===''?null:round(positive(b.recipient_confirmed_amount,'Confirmed recipient amount'));if(confirmed!==null&&Math.abs(confirmed-recipient)>.005)fail('Recipient confirmation differs from the evidenced conversion legs.');
 if(!invoice||!company)fail('Conversion amounts must be positive.');
 const reconciledRecipient=fxDiv(round(transfer-transferFee),r2)-recipientFee;if(Math.abs(reconciledRecipient-recipient)>.01)fail('Rounded transfer does not reconcile to the recipient amount. Enter the evidenced conversion rate.');
 const applied=fxMul(invoice,c.invoice_carrying_rate),advance=b.settlement_mode==='new'?0:round(positive(b.advance_amount_krw||0,'Advance allocation',true));if(advance>c.available_advance_krw+.005)fail('Advance allocation exceeds available balance.',409);if(c.outstanding_krw!=null&&applied+advance>c.outstanding_krw+.005)fail('Invoice settlement exceeds outstanding.',409);
 if(cc!=='KRW'&&companyRate===1&&!String(b.identity_valuation_reason||'').trim())fail('Enter the payment-date valuation rate to KRW.');
 const bank=fxMul(company,companyRate),fee=round(fxProduct(sourceFee,companyRate)+fxProduct(transferFee,r1,companyRate)+fxProduct(recipientFee,r2,r1,companyRate)),legs=[{from:cc,to:tc,rate:r1,from_amount:fxMul(transfer,r1),to_amount:transfer},{from:tc,to:rc,rate:r2,from_amount:fxMul(round(recipient+recipientFee),r2),to_amount:round(recipient+recipientFee)},{from:rc,to:ic,rate:r3,from_amount:recipient,to_amount:invoice}];
 return {direction:'Out',advance_krw:advance,invoice_amount:invoice,allocation_krw:applied,company_currency:cc,company_amount:company,company_rate_to_krw:companyRate,bank_krw:bank,transfer_currency:tc,transfer_amount:transfer,recipient_currency:rc,recipient_expected:recipient,recipient_confirmed:confirmed,bank_rate:r1,rate_pair:tc+'/'+cc,source_fee:sourceFee,transfer_fee:transferFee,fee_policy:'evidenced_legs',fee_krw:fee,fx_difference_krw:round(bank-fee-applied),confirmation_status:confirmed===null?'Estimated':'Confirmed',remaining_krw:c.outstanding_krw==null?null:round(c.outstanding_krw-applied-advance),conversion_legs:legs,conversion_reference:String(b.conversion_reference||''),recipient_fee:recipientFee};
}

window.BOMFxCalculation={calculate,round,fail,currencies,sharedRates};

})();
