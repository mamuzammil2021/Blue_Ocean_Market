// Blue Ocean Market V30.24.3 — BU-scoped central Numbering & References registry.
'use strict';
const numbering=require('./numbering-service');
const VERSION='30.24.3';

function install({app,db,auth,enforceUnit,access,audit}){
  numbering.ensure();
  const text=v=>String(v??'').trim();
  const unitGroup=name=>{const n=text(name).toLowerCase();if(n.includes('pink')&&n.includes('salt'))return 'pink_salt';if(n.includes('mimi')||n.includes('restaurant')||n.includes('resturant'))return 'restaurant';if(n.includes('excavator'))return 'excavator';if(n.includes('mango'))return 'mango';return 'generic'};
  const isCeo=req=>req.user?.role==='CEO / Owner';
  const canSystemAdmin=(req,bu)=>isCeo(req)||!!access?.can?.(req.user.id,'sensitive.system_admin',bu||req.selected_business_unit_id||req.user.business_unit_id);
  const canSeeUnit=(req,bu)=>isCeo(req)||canSystemAdmin(req,bu);
  const canEditUnit=(req,bu)=>isCeo(req)||canSeeUnit(req,bu);
  const allUnits=()=>db.prepare("SELECT id,name,status FROM business_units WHERE status!='Archived' ORDER BY name").all();
  const accessibleUnits=req=>allUnits().filter(u=>canSeeUnit(req,Number(u.id))).map(u=>({...u,numbering_group:unitGroup(u.name)}));
  const refsFor=(scope,bu)=>{
    const defs=numbering.listDefinitions();
    let filtered=[];
    if(scope==='company')filtered=defs.filter(d=>d.display_group==='shared'||d.display_group==='generic');
    else{
      const u=allUnits().find(x=>Number(x.id)===Number(bu));if(!u)return [];
      const group=unitGroup(u.name);
      filtered=defs.filter(d=>d.display_group===group || (group==='mango'&&d.display_group==='generic'));
      // General sale/purchase references can apply to ordinary non-dedicated BUs.
      if(group==='generic')filtered=defs.filter(d=>d.display_group==='generic');
    }
    const scopeBu=scope==='company'?0:Number(bu||0);
    const rows=filtered.map(d=>{const e=numbering.effective(d.reference_key,scopeBu);return {...e,preview:numbering.formatPreview(e),current_sequence:numbering.currentSequence(e),scope_business_unit_id:scopeBu};});
    const prefixCount={};for(const r of rows){const p=text(r.prefix).toUpperCase();if(p)prefixCount[p]=(prefixCount[p]||0)+1}
    return rows.map(r=>({...r,prefix_conflict:(prefixCount[text(r.prefix).toUpperCase()]||0)>1}));
  };
  const auditSafe=(req,type,id,action,detail)=>{try{audit?.(req.user,type,id,action,typeof detail==='string'?detail:JSON.stringify(detail||{}))}catch(_){ }};

  try{db.prepare("INSERT OR IGNORE INTO schema_migrations(id,release_version,notes) VALUES('v30.24.3.numbering-registry',?,?)").run(VERSION,'Central Numbering & References registry with Business Unit presentation, audited overrides and automatic feature registration.')}catch(_){ }

  app.get('/api/v3243/version',auth,(req,res)=>res.json({version:VERSION,features:['central-numbering-registry','business-unit-numbering-tabs','automatic-prefix-registration','numbering-audit-history']}));
  app.get('/api/v3243/numbering/catalog',auth,(req,res)=>{
    const units=accessibleUnits(req);if(!isCeo(req)&&!units.length)return res.status(403).json({error:'System Administrator access is required.'});
    const requestedScope=text(req.query.scope)==='company'?'company':'business_unit',requestedBu=Number(req.query.business_unit_id||0);
    let scope=requestedScope,bu=requestedBu;
    if(scope==='company'&&!isCeo(req)){scope='business_unit';bu=Number(req.selected_business_unit_id||req.user.business_unit_id||units[0]?.id||0)}
    if(scope==='business_unit'){if(!bu)bu=Number(req.selected_business_unit_id||req.user.business_unit_id||units[0]?.id||0);if(!canSeeUnit(req,bu))return res.status(403).json({error:'You cannot view numbering for another business unit.'})}
    res.json({version:VERSION,scope,business_unit_id:scope==='company'?0:bu,can_view_company:isCeo(req),can_edit:scope==='company'?isCeo(req):canEditUnit(req,bu),units,references:refsFor(scope,bu),policy:{historical_references_immutable:true,new_feature_auto_registration:true,precedence:'BU Override → Company Override → System Default'}});
  });
  app.put('/api/v3243/numbering/:key',auth,(req,res)=>{
    const key=text(req.params.key),scope=text(req.body.scope)==='company'?'company':'business_unit',bu=scope==='company'?0:Number(req.body.business_unit_id||0),reason=text(req.body.reason);
    if(scope==='company'&&!isCeo(req))return res.status(403).json({error:'Only CEO / Owner can change Company / Shared numbering.'});
    if(scope==='business_unit'&&(!bu||!canEditUnit(req,bu)))return res.status(403).json({error:'You cannot change numbering for this business unit.'});
    if(reason.length<3)return res.status(400).json({error:'Enter a change reason.'});
    const before=numbering.effective(key,bu);if(!before)return res.status(404).json({error:'Numbering reference type not found.'});
    const p=numbering.normalizePrefix(req.body.prefix||before.prefix);if(!p)return res.status(400).json({error:'Enter a valid prefix.'});
    const siblings=refsFor(scope,bu).filter(x=>x.reference_key!==key&&String(x.prefix||'').toUpperCase()===p.toUpperCase());
    if(p!==String(before.prefix||'').toUpperCase()&&siblings.length)return res.status(409).json({error:`Prefix ${p} is already used by ${siblings.map(x=>x.label).join(', ')} in this scope. Choose a unique prefix.`});
    try{
      const after=numbering.setOverride(key,bu,{prefix:p,padding:req.body.padding,include_year:req.body.include_year,reset_yearly:req.body.reset_yearly,enabled:req.body.enabled},{userId:req.user.id,reason});
      auditSafe(req,'numbering_reference',key,'update',{scope,business_unit_id:bu,before:{prefix:before.prefix,padding:before.padding,include_year:before.include_year,reset_yearly:before.reset_yearly},after:{prefix:after.prefix,padding:after.padding,include_year:after.include_year,reset_yearly:after.reset_yearly},reason});
      res.json({...after,preview:numbering.formatPreview(after),current_sequence:numbering.currentSequence(after)});
    }catch(e){res.status(400).json({error:e.message})}
  });
  app.get('/api/v3243/numbering/:key/history',auth,(req,res)=>{
    const scope=text(req.query.scope)==='company'?'company':'business_unit',bu=scope==='company'?0:Number(req.query.business_unit_id||0);
    if(scope==='company'&&!isCeo(req))return res.status(403).json({error:'Only CEO / Owner can view Company / Shared numbering history.'});
    if(scope==='business_unit'&&(!bu||!canSeeUnit(req,bu)))return res.status(403).json({error:'You cannot view this numbering history.'});
    const rows=db.prepare(`SELECT h.*,u.name changed_by_name FROM numbering_reference_history h LEFT JOIN users u ON u.id=h.changed_by WHERE h.reference_key=? AND h.business_unit_id=? ORDER BY h.id DESC LIMIT 200`).all(text(req.params.key),bu).map(r=>{let before={},after={};try{before=JSON.parse(r.before_json||'{}')}catch(_){}try{after=JSON.parse(r.after_json||'{}')}catch(_){}return {...r,before,after}});res.json(rows);
  });
  return {VERSION,numbering};
}
module.exports={install,VERSION};
