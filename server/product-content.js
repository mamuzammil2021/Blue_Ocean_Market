'use strict';
// Content preferences are independent of the application's interface language.
const text=v=>String(v??'').trim();
function normalize(body,current={}){
 const b={...body},mode=b.content_language??current.content_language;
 if(mode==null||mode==='')return b; // Legacy clients retain their existing contract.
 if(!['en','ko','both'].includes(mode))throw new Error('Select English, Korean or Both for product content.');
 const preferred=b.commerce_language??current.commerce_language??'auto';
 if(!['auto','en','ko'].includes(preferred))throw new Error('Invalid preferred commerce language.');
 const en=text(b.name_en??current.name_en),ko=text(b.name_ko??current.name_ko);
 if((mode==='en'||mode==='both')&&!en)throw new Error('English product name is required.');
 if((mode==='ko'||mode==='both')&&!ko)throw new Error('Korean product name is required.');
 b.content_language=mode;b.commerce_language=preferred;b.name_en=en;b.name_ko=ko;
 // Generic operational name is a compatibility fallback; never manufacture translated content.
 b.name=mode==='ko'?ko:en||ko;
 return b;
}
function savePreferences(db,b,bu,id){
 if(b.content_language)db.prepare('UPDATE pink_salt_products SET content_language=?,commerce_language=? WHERE id=? AND business_unit_id=?').run(b.content_language,b.commerce_language||'auto',id,bu);
 if(Object.hasOwn(b,'family_id')){
  const fid=Number(b.family_id)||null;
  const f=fid?db.prepare('SELECT id,name_en FROM pink_salt_product_families WHERE id=? AND business_unit_id=?').get(fid,bu):null;
  if(fid&&!f)throw new Error('Invalid product family.');
  db.prepare('UPDATE pink_salt_products SET family_id=?,product_family=?,variant_code=?,variant_sort_order=? WHERE id=? AND business_unit_id=?').run(fid,f?.name_en||'',text(b.variant_code),Math.max(0,Math.trunc(Number(b.variant_sort_order)||0)),id,bu);
 }
}
function resolveContent(p,requested){
 const preferred=['en','ko'].includes(requested)?requested:['en','ko'].includes(p.commerce_language)?p.commerce_language:p.content_language==='ko'?'ko':'en';
 const other=preferred==='en'?'ko':'en',out={preferred_language:preferred};
 for(const field of ['name','short_description','ingredients','storage_instructions']){
  const first=text(p[field+'_'+preferred]),fallback=text(p[field+'_'+other]);
  out[field]=first||fallback||(field==='name'?text(p.name):'');
  out[field+'_language']=first?preferred:fallback?other:field==='name'&&text(p.name)?'legacy':null;
 }
 return out;
}
module.exports={normalize,savePreferences,resolveContent};
