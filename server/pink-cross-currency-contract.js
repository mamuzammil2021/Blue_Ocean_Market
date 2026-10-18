'use strict';
// V30.69.17: pure, additive preview contract. NO ledger posting.
const round=(x,places=2)=>Math.round((x+Number.EPSILON)*10**places)/10**places;
const approx=(a,b)=>Math.abs(a-b)<=Math.max(.02,Math.abs(b)*.00001);
const supported=new Set(['KRW','USD','PKR','EUR','JPY','CNY']);
const positive=(value,label,allowZero=false)=>{const n=Number(value);if(!Number.isFinite(n)||(allowZero?n<0:n<=0))throw new Error(`${label} must be ${allowZero?'non-negative':'greater than zero'}.`);return n};
const code=(v,label)=>{const s=String(v||'').trim().toUpperCase();if(!/^[A-Z]{3}$/.test(s))throw new Error(`Invalid ${label}.`);return s};
function sourceCurrencyMismatch(a,b){return a!==b}
function preview(input){
 const accountCurrency=code(input.source_account_currency,'source account currency');
 const transferCurrency=code(input.transfer_currency,'transfer currency');
 const recipientCurrency=code(input.recipient_currency,'recipient currency');
 const invoiceCurrency=code(input.invoice_currency,'invoice currency');
 for(const c of [accountCurrency,transferCurrency,recipientCurrency,invoiceCurrency])if(!supported.has(c))throw new Error(`Unsupported transaction currency: ${c}.`);
 const sourceDebit=positive(input.source_debit_amount,'Source account debit');
 const transfer=positive(input.transfer_amount,'Transfer amount');
 const recipient=positive(input.recipient_expected_amount,'Expected recipient amount');
 const settled=positive(input.invoice_amount_applied,'Invoice amount applied');
 const outstanding=positive(input.invoice_outstanding,'Invoice outstanding');
 const accountingRate=invoiceCurrency==='KRW'?1:positive(input.invoice_rate_to_krw,'Invoice accounting rate');
 const sourceFee=positive(input.source_fee_amount??0,'Source-account fee',true);
 if(settled>outstanding+0.005)throw new Error('Invoice settlement cannot exceed outstanding amount.');
 const cross= new Set([accountCurrency,transferCurrency,recipientCurrency,invoiceCurrency]).size>1;
 // Multi-leg conversion or a recipient/invoice currency mismatch requires its own documented reconciliation workflow.
 // Reject instead of fabricating a payable settlement from unrelated amounts.
 if(transferCurrency!==recipientCurrency)throw new Error('Transfer and recipient currencies differ: a separately reconciled intermediary FX leg is required.');
 if(recipientCurrency!==invoiceCurrency)throw new Error('Recipient and invoice currencies differ: an explicit invoice-settlement FX leg is required.');
 if(sourceDebit+0.005<sourceFee)throw new Error('Source-account fee exceeds source debit.');
 if(cross){if(!String(input.bank_quote_reference||'').trim())throw new Error('Cross-currency payment requires a bank quotation/reference.');
  if(!String(input.fx_rate_pair||'').trim())throw new Error('Cross-currency payment requires an explicit FX rate pair.');
  const rate=positive(input.bank_fx_rate,'Bank FX rate');
  if(sourceCurrencyMismatch(accountCurrency,transferCurrency)){
   // Accepted convention: source units per 1 transfer unit; fees are charged in source account currency.
   if(!approx(sourceDebit-sourceFee,transfer*rate))throw new Error('Source debit does not reconcile with transfer amount, bank FX rate and source fee.');
  }else if(!approx(sourceDebit-sourceFee,transfer))throw new Error('Source debit does not reconcile with transfer amount and source fee.');
  if(!String(input.fx_evidence_reference||'').trim())throw new Error('Cross-currency payment requires FX evidence.');
 }
 if(!cross && (Math.abs(sourceDebit-sourceFee-transfer)>.015||Math.abs(transfer-recipient)>.015||Math.abs(recipient-settled)>.015))throw new Error('Same-currency debit, transfer, receipt and settlement amounts must reconcile (net of fee).');
 if(input.recipient_confirmed_amount!=null && input.recipient_confirmed_amount!==''){
  const confirmed=positive(input.recipient_confirmed_amount,'Confirmed recipient amount');
  if(confirmed>recipient+.015)throw new Error('Confirmed recipient amount cannot exceed expected amount without a reconciled adjustment.');
 }
 return Object.freeze({base_currency:'KRW',cross_currency:cross,source_account_currency:accountCurrency,source_debit_amount:round(sourceDebit),source_fee_amount:round(sourceFee),transfer_currency:transferCurrency,transfer_amount:round(transfer),recipient_currency:recipientCurrency,recipient_expected_amount:round(recipient),recipient_confirmed_amount:input.recipient_confirmed_amount==null||input.recipient_confirmed_amount===''?null:round(Number(input.recipient_confirmed_amount)),recipient_confirmation_status:input.recipient_confirmed_amount==null||input.recipient_confirmed_amount===''?'Estimated':'Confirmed',invoice_currency:invoiceCurrency,invoice_amount_applied:round(settled),invoice_outstanding:round(outstanding),invoice_settlement_krw:round(settled*accountingRate),invoice_rate_to_krw:accountingRate,bank_fx_rate:cross?Number(input.bank_fx_rate):null,fx_rate_pair:cross?String(input.fx_rate_pair).trim():null,bank_quote_reference:cross?String(input.bank_quote_reference).trim():null,posting_supported:!cross});
}
module.exports={preview};
