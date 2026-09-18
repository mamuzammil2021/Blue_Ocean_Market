// Blue Ocean Market V30.38.0 — shared Excavator sale-settlement calculator.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.BOMSettlementV338=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
  const round=v=>Math.round((n(v)+Number.EPSILON)*100)/100;
  function calculateExcavatorSaleSettlementV338(input={}){
    const sale=Math.max(0,n(input.salePrice));
    const current=Math.max(0,n(input.currentAllocated));
    const mode=['replace','keep','add'].includes(String(input.settlementMode||'').toLowerCase())?String(input.settlementMode).toLowerCase():'replace';
    const buyerExists=input.buyerExists!==false;
    let source=String(input.paymentSource||'').toLowerCase();
    if(!['buyer_advance','new_payment','advance_plus_new'].includes(source))source=buyerExists?'buyer_advance':'new_payment';
    if(!buyerExists)source='new_payment';
    const effectiveCurrent=mode==='replace'?0:current;
    const coverageRequired=round(Math.max(0,sale-effectiveCurrent));
    const availableAdvance=Math.max(0,n(input.availableAdvance));
    const requestedAdvance=Math.max(0,n(input.requestedAdvance));
    const errors=[];
    let advanceUsed=0;
    if(mode==='keep'){
      if(coverageRequired>0.005)errors.push(`Additional settlement of KRW ${coverageRequired.toLocaleString()} is required.`);
    }else if(source==='buyer_advance'){
      advanceUsed=coverageRequired;
      if(!buyerExists&&coverageRequired>0.005)errors.push('Buyer advance can be used only for an existing buyer.');
      if(advanceUsed>availableAdvance+0.005)errors.push(`Buyer advance exceeds available balance by KRW ${round(advanceUsed-availableAdvance).toLocaleString()}.`);
    }else if(source==='advance_plus_new'){
      if(!buyerExists&&coverageRequired>0.005)errors.push('Combined settlement requires an existing buyer.');
      advanceUsed=round(Math.min(requestedAdvance,coverageRequired));
      if(coverageRequired>0.005&&advanceUsed<=0.005)errors.push('Enter the buyer advance amount to use for the combined settlement.');
      if(advanceUsed>availableAdvance+0.005)errors.push(`Buyer advance exceeds available balance by KRW ${round(advanceUsed-availableAdvance).toLocaleString()}.`);
      if(coverageRequired>0.005&&advanceUsed>=coverageRequired-0.005)errors.push('Combined settlement requires both buyer advance and a new payment.');
    }
    const newPaymentRequiredKrw=round(Math.max(0,coverageRequired-advanceUsed));
    const currency=String(input.paymentCurrency||'KRW').toUpperCase();
    const fx=currency==='KRW'?1:n(input.fxRate);
    const original=Math.max(0,n(input.paymentAmountOriginal));
    const receivedKrw=round(currency==='KRW'?original:(fx>0?original*fx:0));
    const newPaymentExpected=mode!=='keep'&&(source==='new_payment'||source==='advance_plus_new')&&newPaymentRequiredKrw>0.005;
    if(newPaymentExpected&&input.validatePaymentFields!==false){
      if(original<=0)errors.push('Payment Amount is required.');
      if(currency!=='KRW'&&fx<=0)errors.push('FX Rate to KRW is required.');
      if(receivedKrw+0.005<newPaymentRequiredKrw)errors.push(`New payment is short by KRW ${round(newPaymentRequiredKrw-receivedKrw).toLocaleString()}.`);
      if(input.requireMethod&&!String(input.paymentMethod||'').trim())errors.push('Payment Method is required.');
      if(input.requireDate&&!String(input.paymentDate||'').trim())errors.push('Payment Date is required.');
      if(input.requireReference&&String(input.paymentMethod||'').trim().toLowerCase()!=='cash'&&!String(input.paymentReference||'').trim())errors.push('Payment Reference is required for non-cash payments.');
      if(input.requireEvidence&&!input.hasEvidence)errors.push('Receipt / evidence is mandatory for a new buyer payment.');
    }
    const newPaymentAppliedKrw=round(Math.min(receivedKrw,newPaymentRequiredKrw));
    const buyerCreditAddedKrw=round(Math.max(0,receivedKrw-newPaymentRequiredKrw));
    const resultingOutstandingKrw=round(Math.max(0,coverageRequired-advanceUsed-newPaymentAppliedKrw));
    return {
      salePriceKrw:round(sale),currentAllocatedKrw:round(current),effectiveCurrentKrw:round(effectiveCurrent),settlementMode:mode,paymentSource:source,
      coverageRequiredKrw:coverageRequired,availableAdvanceKrw:round(availableAdvance),advanceUsedKrw:round(advanceUsed),newPaymentRequiredKrw,
      paymentCurrency:currency,fxRate:fx,paymentAmountOriginal:original,receivedKrw,newPaymentAppliedKrw,buyerCreditAddedKrw,resultingOutstandingKrw,
      newPaymentExpected,valid:errors.length===0,errors
    };
  }
  return {calculateExcavatorSaleSettlementV338};
});
