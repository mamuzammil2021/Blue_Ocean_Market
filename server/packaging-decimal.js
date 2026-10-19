'use strict';
// Fixed-scale arithmetic at API boundaries. Four decimal quantity/rate inputs and
// two decimal invoice amounts; products use BigInt before half-up rounding.
const SCALE=10000n;
function fixed(value){const s=String(value??'0').trim();if(!/^\d+(\.\d{1,4})?$/.test(s))throw new Error('Use a non-negative number with at most four decimal places.');const [a,b='']=s.split('.');const n=BigInt(a)*SCALE+BigInt(b.padEnd(4,'0'));if(n>9007199254740000n)throw new Error('Amount exceeds supported precision.');return n}
const div=(a,b)=>a<0n?-((-a+b/2n)/b):(a+b/2n)/b;
const signedFixed=value=>String(value).startsWith('-')?-fixed(String(value).slice(1)):fixed(value);
const number=n=>Number(n)/10000;
const cents=n=>{if(n>BigInt(Number.MAX_SAFE_INTEGER)||n< -BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Amount exceeds supported financial precision.');return Number(n)/100};
const money=n=>cents(div(n,100n));
function line(x){const q=fixed(x.quantity),price=fixed(x.unit_price),discount=fixed(x.discount||0),tax=fixed(x.tax_percent||0);if(!q||tax>1000000n)throw new Error('Quantity must be positive and tax must be at most 100%.');const gross=div(q*price,SCALE*100n),deduction=div(discount,100n);if(deduction>gross)throw new Error('Discount exceeds the line amount.');const net=gross-deduction,taxValue=div(net*tax,100n*SCALE);return {gross:cents(gross),net:cents(net),tax:cents(taxValue),total:cents(net+taxValue)}}
function multiply(a,b){return number(div(fixed(a)*fixed(b),SCALE))}
function total(xs){return money(xs.reduce((n,x)=>n+signedFixed(x),0n))}
function convertMoney(amount,rate){return cents(div(signedFixed(amount)*fixed(rate),SCALE*100n))}
function valuationMoney(amount,rate){if(!Number.isFinite(Number(rate))||Number(rate)<0)throw new Error('Invalid valuation rate.');const r=BigInt(Number(rate).toFixed(12).replace('.',''));return cents(div(fixed(amount)*r,SCALE*10000000000n))}
function allocatedCost(base,extra,weight,totalWeight,rate){const denominator=fixed(totalWeight);if(!denominator)throw new Error('Cost allocation requires a positive total.');return cents(div((fixed(base)*denominator+fixed(extra)*fixed(weight))*fixed(rate),denominator*SCALE*100n))}
function proportionMoney(total,quantity,base){const denominator=fixed(base);if(!denominator)throw new Error('Quantity basis must be positive.');return cents(div(signedFixed(total)*fixed(quantity),denominator*100n))}
module.exports={fixed,number,money,line,multiply,total,convertMoney,valuationMoney,allocatedCost,proportionMoney};
