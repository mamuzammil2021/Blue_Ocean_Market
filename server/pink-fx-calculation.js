'use strict';
// One bank conversion leg only. No rate service or invented bank quote.
const currencies=new Set(['KRW','USD','PKR','EUR','JPY','CNY']);
const round=x=>Math.round((Number(x)+Number.EPSILON)*100)/100;
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const positive=(v,label,zero=false)=>{const n=Number(v);if(!Number.isFinite(n)||(zero?n<0:n<=0))fail(`${label} must be ${zero?'non-negative':'greater than zero'}.`);if(n>Number.MAX_SAFE_INTEGER/100)fail(`${label} exceeds supported financial precision.`);return n};
function calculate(b,c,options={}){
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
  if(!String(b.bank_quote_reference||'').trim()||!String(b.quote_source||'').trim()||!b.quote_time||!Number.isFinite(Date.parse(b.quote_time)))fail('Bank quote reference, source and valid date/time are required.');
  if(!/(?:Z|[+-]\d{2}:\d{2})$/.test(String(b.quote_time)))fail('Bank quote date/time must include its UTC offset.');
  if(Date.parse(b.quote_time)>Date.now()+300000)fail('Bank quote date/time cannot be in the future.');
 }
 const sourceFee=round(positive(b.source_fee_amount||0,'Source fee',true)),transferFee=round(positive(b.transfer_fee_amount||0,'Transfer fee',true));
 const feePolicy=b.fee_policy||'added_to_debit';
 if(!['added_to_debit','deducted_from_transfer','separate_debit'].includes(feePolicy))fail('Separate fee debits require a separate evidenced bank charge record; use an included debit fee or a transfer deduction here.');
 if(feePolicy==='added_to_debit'&&transferFee||feePolicy==='deducted_from_transfer'&&sourceFee||feePolicy==='separate_debit'&&(sourceFee||transferFee))fail('Fee fields do not match the selected fee policy.');
 const direction=c.direction||'Out',companyRate=cc==='KRW'?1:previewOnly&&!b.company_rate_to_krw?null:positive(b.company_rate_to_krw,'Company account accounting rate to KRW');
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
 const applied=previewOnly&&!carryingKnown?null:round(invoiceAmount*c.invoice_carrying_rate),bankKrw=companyRate===null?null:round(company*companyRate),feeKrw=companyRate===null?null:round((sourceFee+transferFee*rate)*companyRate);
 if(bounded&&applied!==null&&applied+advance>c.outstanding_krw+.005)fail('Invoice settlement exceeds outstanding.',409);
 if(![applied,bankKrw,feeKrw].every(x=>x===null||Number.isFinite(x)&&Number.isSafeInteger(Math.round(x*100))))fail('KRW equivalent exceeds supported financial precision.');
 const principal=bankKrw===null?null:direction==='Out'?bankKrw-feeKrw:bankKrw+feeKrw;
 const fx=principal===null||applied===null?null:round(principal-applied);
 return {direction,advance_krw:advance,invoice_amount:invoiceAmount,allocation_krw:applied,company_currency:cc,company_amount:company,company_rate_to_krw:companyRate,bank_krw:bankKrw,transfer_currency:ic,transfer_amount:transfer,recipient_expected:recipient,recipient_confirmed:confirmed,bank_rate:rate,rate_pair:pair,source_fee:sourceFee,transfer_fee:transferFee,fee_policy:feePolicy,fee_krw:feeKrw,fx_difference_krw:fx,confirmation_status:confirmed===null?'Estimated':'Confirmed',remaining_krw:!bounded||applied===null?null:round(c.outstanding_krw-applied-advance)};
}
module.exports={calculate,round,fail,currencies};
