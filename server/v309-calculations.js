'use strict';

const n=v=>Number(v||0), text=v=>String(v??'').trim();

/**
 * Calculate raw-salt requirements for one finished-product output line.
 * For Bulk Pack / cartons, packWeightG is the configured pouch/inner-pack weight
 * and pouchCount comes from the finished-product BOM. A Bulk Pack without inner
 * pouches falls back to one pack weight per finished unit.
 */
function calculateSaltRequirements({packagingStyle,saltGrade,packWeightG,giftPouchWeightG,giftComponents,pouchCount,quantityUnits}){
  const qty=n(quantityUnits),result=new Map();
  if(qty<=0)return result;
  const components=Array.isArray(giftComponents)?giftComponents:[];
  if(packagingStyle==='Gift Box / Set'&&components.length&&n(giftPouchWeightG)>0){
    for(const c of components){
      const grade=text(c.salt_grade),count=n(c.pouches_per_box);
      if(!grade||count<=0)continue;
      const kg=qty*count*n(giftPouchWeightG)/1000;
      result.set(grade,(result.get(grade)||0)+kg);
    }
    return result;
  }
  const multiplier=packagingStyle==='Bulk Pack'&&n(pouchCount)>0?n(pouchCount):1;
  const grade=text(saltGrade),kg=qty*multiplier*n(packWeightG)/1000;
  if(grade&&kg>0)result.set(grade,kg);
  return result;
}

module.exports={calculateSaltRequirements};
