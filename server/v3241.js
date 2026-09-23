// Blue Ocean Market V30.24.1 — workflow context, finance/document/statement refinement.
'use strict';
const path=require('path');
const VERSION='30.24.1';

function install({app,db,auth,allow,currentUnit,enforceUnit,audit,upload,access,maybeCreateApproval,stopForApproval,markApprovalExecuted}){
  const addColumn=(table,definition)=>{try{db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`)}catch(_){} };
  [
    "previous_workflow_status TEXT DEFAULT ''",
    "archived INTEGER DEFAULT 0",
    "archived_by INTEGER",
    "archived_at TEXT",
    "archive_reason TEXT DEFAULT ''",
    "restored_by INTEGER",
    "restored_at TEXT",
    "restore_reason TEXT DEFAULT ''",
    "original_name TEXT DEFAULT ''",
    "mime_type TEXT DEFAULT ''",
    "size_bytes INTEGER DEFAULT 0",
    "sha256 TEXT DEFAULT ''"
  ].forEach(c=>addColumn('documents',c));
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_history_v3241(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      business_unit_id INTEGER,
      user_id INTEGER,
      action TEXT NOT NULL,
      from_status TEXT DEFAULT '',
      to_status TEXT DEFAULT '',
      reason TEXT DEFAULT '',
      data_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_document_history_v3241_document ON document_history_v3241(document_id,id);
  `);
  try{db.prepare("UPDATE documents SET archived=1 WHERE workflow_status='Archived'").run()}catch(_){}
  try{db.prepare("UPDATE documents SET previous_workflow_status='Draft' WHERE workflow_status='Archived' AND trim(COALESCE(previous_workflow_status,''))='' ").run()}catch(_){}
  // Backfill exact upload metadata from the attachment registry where available.
  try{
    const rows=db.prepare("SELECT id,file_path FROM documents WHERE trim(COALESCE(file_path,''))<>''").all();
    const upd=db.prepare("UPDATE documents SET original_name=CASE WHEN trim(COALESCE(original_name,''))='' THEN ? ELSE original_name END,mime_type=CASE WHEN trim(COALESCE(mime_type,''))='' THEN ? ELSE mime_type END,size_bytes=CASE WHEN COALESCE(size_bytes,0)=0 THEN ? ELSE size_bytes END,sha256=CASE WHEN trim(COALESCE(sha256,''))='' THEN ? ELSE sha256 END WHERE id=?");
    for(const row of rows){
      const stored=path.basename(String(row.file_path||''));
      const meta=db.prepare('SELECT * FROM attachment_file_registry WHERE stored_name=?').get(stored);
      if(meta)upd.run(meta.original_name||stored,meta.mime_type||'',Number(meta.size_bytes||0),meta.sha256||'',row.id);
    }
  }catch(_){}
  try{db.prepare("INSERT OR IGNORE INTO schema_migrations(id,release_version,notes) VALUES('v30.24.1.workflow-finance-document-statement',?,?)").run(VERSION,'Workflow context, finance correction/history, document archive/restore, preview/dialog and statement quality refinement.')}catch(_){}

  const isManager=u=>!!u&&['CEO / Owner','Operations Manager','Business Unit Manager','Finance / Admin'].includes(u.role);
  const canArchive=(req,bu)=>req.user?.role==='CEO / Owner'||!!access?.canAction?.(req.user.id,'documents','delete',bu)||!!access?.canAction?.(req.user.id,'documents','void',bu);
  const canAudit=(req,bu)=>req.user?.role==='CEO / Owner'||!!access?.can?.(req.user.id,'sensitive.audit_logs',bu);
  const scope=(req,alias='d')=>{
    const args=[];let sql='';
    if(req.selected_business_unit_id){sql+=` AND ${alias}.business_unit_id=?`;args.push(Number(req.selected_business_unit_id));}
    else if(req.user.role!=='CEO / Owner'){sql+=` AND ${alias}.business_unit_id=?`;args.push(Number(req.user.business_unit_id||0));}
    return {sql,args};
  };
  const history=(doc,user,action,from,to,reason='',data={})=>{
    db.prepare('INSERT INTO document_history_v3241(document_id,business_unit_id,user_id,action,from_status,to_status,reason,data_json) VALUES(?,?,?,?,?,?,?,?)').run(doc.id,doc.business_unit_id,user?.id||null,action,from||'',to||'',reason||'',JSON.stringify(data||{}));
  };
  const selectDoc=id=>db.prepare(`SELECT d.*,b.name business_unit,u.name uploaded_by_name,ab.name archived_by_name,rb.name restored_by_name
    FROM documents d LEFT JOIN business_units b ON b.id=d.business_unit_id LEFT JOIN users u ON u.id=d.uploaded_by
    LEFT JOIN users ab ON ab.id=d.archived_by LEFT JOIN users rb ON rb.id=d.restored_by WHERE d.id=?`).get(id);
  const clientDoc=(req,d)=>({...d,can_archive:canArchive(req,d.business_unit_id),can_restore:canArchive(req,d.business_unit_id)&&Number(d.archived||0)===1,can_view_archive:canArchive(req,d.business_unit_id),can_technical_history:canAudit(req,d.business_unit_id),file_url:'/uploads/'+String(d.file_path||'').replace(/^\/+|^uploads\//g,'')});

  // Replace legacy document listing before the legacy route is registered. Archived rows
  // are not returned at all unless the caller has archive/restore authority.
  try{db.exec('CREATE INDEX IF NOT EXISTS idx_v347_documents_scope ON documents(business_unit_id,archived,workflow_status,created_at,id)')}catch(e){console.warn('Document paging index:',e.message)}
  // V30.47: use the identical archive/BU access predicate as the protected document master.
  app.get('/api/v347/documents/page',auth,allow('documents'),(req,res)=>{try{
    const sc=scope(req,'d'),canViewArchive=req.user.role==='CEO / Owner'||!!access?.canAction?.(req.user.id,'documents','delete',currentUnit(req))||!!access?.canAction?.(req.user.id,'documents','void',currentUnit(req));
    const q=String(req.query.search||'').trim().slice(0,120),section=['active','final','archived'].includes(String(req.query.section))?String(req.query.section):'active';
    if(section==='archived'&&!canViewArchive)return res.status(403).json({error:'Archived documents require archive access.'});
    const active="COALESCE(d.archived,0)=0 AND COALESCE(d.workflow_status,'Draft') NOT IN ('Final','Archived')";
    const final="COALESCE(d.archived,0)=0 AND d.workflow_status='Final'";
    const archived="(COALESCE(d.archived,0)=1 OR d.workflow_status='Archived')";
    const safeScope='1=1'+sc.sql+(canViewArchive?'':` AND NOT ${archived}`),base=[...sc.args];
    const counts=db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN ${active} THEN 1 ELSE 0 END) active,
      SUM(CASE WHEN ${final} THEN 1 ELSE 0 END) final,SUM(CASE WHEN ${archived} THEN 1 ELSE 0 END) archived FROM documents d WHERE ${safeScope}`).get(...base);
    let where=safeScope+' AND '+({active,final,archived}[section]),args=[...base];
    if(q){where+=' AND (d.title LIKE ? OR d.category LIKE ? OR d.original_name LIKE ?)';args.push(...Array(3).fill('%'+q+'%'))}
    const total=db.prepare(`SELECT COUNT(*) n FROM documents d WHERE ${where}`).get(...args).n;
    const size=[25,50,100].includes(Number(req.query.pageSize))?Number(req.query.pageSize):25,pages=Math.max(1,Math.ceil(total/size)),page=Math.min(pages,Math.max(1,Math.floor(Number(req.query.page)||1)));
    const rows=db.prepare(`SELECT d.*,b.name business_unit,u.name uploaded_by_name,ab.name archived_by_name,rb.name restored_by_name
      FROM documents d LEFT JOIN business_units b ON b.id=d.business_unit_id LEFT JOIN users u ON u.id=d.uploaded_by
      LEFT JOIN users ab ON ab.id=d.archived_by LEFT JOIN users rb ON rb.id=d.restored_by WHERE ${where}
      ORDER BY d.created_at DESC,d.id DESC LIMIT ? OFFSET ?`).all(...args,size,(page-1)*size).map(d=>clientDoc(req,d));
    res.json({rows,pagination:{page,page_size:size,pageSize:size,total,pages,from:total?(page-1)*size+1:0,to:Math.min(total,page*size)},
      summary:{total:Number(counts.total||0),active:Number(counts.active||0),final:Number(counts.final||0),archived:canViewArchive?Number(counts.archived||0):0},can_view_archive:canViewArchive});
  }catch(e){console.error('V30.47 document page',e);res.status(500).json({error:'Unable to load document page'})}});
  app.get('/api/documents',auth,allow('documents'),(req,res)=>{
    const sc=scope(req,'d'),archivedAllowed=req.user.role==='CEO / Owner'||!!access?.canAction?.(req.user.id,'documents','delete',currentUnit(req))||!!access?.canAction?.(req.user.id,'documents','void',currentUnit(req));
    let q=`SELECT d.*,b.name business_unit,u.name uploaded_by_name,ab.name archived_by_name,rb.name restored_by_name
      FROM documents d LEFT JOIN business_units b ON b.id=d.business_unit_id LEFT JOIN users u ON u.id=d.uploaded_by
      LEFT JOIN users ab ON ab.id=d.archived_by LEFT JOIN users rb ON rb.id=d.restored_by WHERE 1=1${sc.sql}`;
    if(!archivedAllowed)q+=" AND COALESCE(d.archived,0)=0 AND COALESCE(d.workflow_status,'Draft')!='Archived'";
    const rows=db.prepare(q+' ORDER BY d.created_at DESC,d.id DESC').all(...sc.args).map(d=>clientDoc(req,d));
    res.json(rows);
  });

  app.get('/api/documents/:id/history-v3241',auth,allow('documents'),(req,res)=>{
    const d=selectDoc(req.params.id);if(!d)return res.status(404).json({error:'Document not found'});if(!enforceUnit(req,d.business_unit_id))return res.status(403).json({error:'You cannot access another business unit document'});if(Number(d.archived||0)===1&&!canArchive(req,d.business_unit_id))return res.status(403).json({error:'Archived documents require archive access.'});
    const technical=canAudit(req,d.business_unit_id);
    const rows=db.prepare(`SELECT h.*,u.name user_name,u.role user_role FROM document_history_v3241 h LEFT JOIN users u ON u.id=h.user_id WHERE h.document_id=? ORDER BY h.id DESC`).all(d.id).map(h=>{let data={};try{data=JSON.parse(h.data_json||'{}')}catch(_){}return {...h,technical_data:technical?data:undefined,data_json:undefined}});
    res.json({document:clientDoc(req,d),history:rows,technical_allowed:technical});
  });

  app.post('/api/documents',auth,allow('documents'),...upload.single('file'),(req,res)=>{
    if(!req.file)return res.status(400).json({error:'File required'});const bu=Number(req.body.business_unit_id||currentUnit(req));if(!bu||!enforceUnit(req,bu))return res.status(403).json({error:'Document must belong to the current business unit'});
    const workflow=['Draft','Submitted'].includes(req.body.workflow_status)?req.body.workflow_status:'Draft',meta=(req.attachment_metadata||[])[0]||{};
    const r=db.prepare(`INSERT INTO documents(title,category,version,business_unit_id,file_path,approved,uploaded_by,workflow_status,archived,original_name,mime_type,size_bytes,sha256)
      VALUES(?,?,?,?,?,?,?, ?,0,?,?,?,?)`).run(req.body.title||req.file.originalname,req.body.category||'Document',req.body.version||'1.0',bu,req.file.filename,0,req.user.id,workflow,meta.original_name||req.file.originalname,meta.mime_type||req.file.mimetype||'',Number(meta.size_bytes||req.file.size||0),meta.sha256||'');
    const d=selectDoc(r.lastInsertRowid);history(d,req.user,'Uploaded','',workflow,'',{original_name:d.original_name,mime_type:d.mime_type,size_bytes:d.size_bytes});audit(req.user,'document',d.id,'upload',JSON.stringify({file:d.original_name,workflow_status:workflow}));res.json({id:d.id,workflow_status:workflow});
  });

  app.put('/api/documents/:id/workflow',auth,allow('documents'),(req,res)=>{
    const d=selectDoc(req.params.id);if(!d)return res.status(404).json({error:'Document not found'});if(!enforceUnit(req,d.business_unit_id))return res.status(403).json({error:'You cannot access another business unit document'});if(Number(d.archived||0)===1||d.workflow_status==='Archived')return res.status(409).json({error:'Archived documents must be restored before workflow changes can be made.'});
    const status=String(req.body.workflow_status||''),note=String(req.body.note||'').trim();if(!['Draft','Submitted','Approved','Final'].includes(status))return res.status(400).json({error:'Invalid document workflow status'});
    if(d.workflow_status==='Final'&&status!=='Final')return res.status(409).json({error:'Final documents cannot be reopened. Archive the Final document if it must be withdrawn, then use authorized Restore if needed.'});
    const reviewer=isManager(req.user);if(['Approved','Final'].includes(status)&&!reviewer)return res.status(403).json({error:'Manager, Finance or CEO review is required for Approved / Final documents'});if(!reviewer&&Number(d.uploaded_by)!==Number(req.user.id))return res.status(403).json({error:'You can only submit your own document for review'});
    db.prepare('UPDATE documents SET workflow_status=?,approved=?,reviewed_by=?,reviewed_at=?,workflow_note=? WHERE id=?').run(status,['Approved','Final'].includes(status)?1:0,reviewer?req.user.id:d.reviewed_by,reviewer?new Date().toISOString():d.reviewed_at,note,d.id);
    history(d,req.user,'Workflow Updated',d.workflow_status||'Draft',status,note);audit(req.user,'document',d.id,'workflow',JSON.stringify({from:d.workflow_status||'Draft',to:status,note}));res.json({ok:true,workflow_status:status});
  });

  app.delete('/api/documents/:id',auth,allow('documents'),(req,res)=>{
    const d=selectDoc(req.params.id);if(!d)return res.status(404).json({error:'Document not found'});if(!enforceUnit(req,d.business_unit_id))return res.status(403).json({error:'You cannot access another business unit document'});if(!canArchive(req,d.business_unit_id))return res.status(403).json({error:'Document archive permission is required.'});if(Number(d.archived||0)===1||d.workflow_status==='Archived')return res.json({ok:true,archived:true,already_archived:true});
    const reason=String(req.body?.reason||'').trim();if(!reason)return res.status(400).json({error:'Archiving reason is required.'});
    const ap=maybeCreateApproval?.({req,businessUnitId:d.business_unit_id,actionKey:'document.delete',type:'Archive Important Document',amount:0,reason,sourceEntity:'document',sourceId:d.id,priority:'High'});
    if(ap&&stopForApproval?.(res,ap,'Document archive submitted for approval. It will be applied automatically after final approval.'))return;
    db.prepare("UPDATE documents SET previous_workflow_status=CASE WHEN COALESCE(workflow_status,'Draft')='Archived' THEN COALESCE(NULLIF(previous_workflow_status,''),'Draft') ELSE COALESCE(workflow_status,'Draft') END,workflow_status='Archived',archived=1,approved=0,archive_reason=?,archived_by=?,archived_at=CURRENT_TIMESTAMP,workflow_note=? WHERE id=?").run(reason,req.user.id,reason,d.id);
    if(ap?.approval)markApprovalExecuted?.(ap.approval,req.user);history(d,req.user,'Archived',d.workflow_status||'Draft','Archived',reason,{previous_status:d.workflow_status||'Draft'});audit(req.user,'document',d.id,'archive',JSON.stringify({title:d.title,file_path:d.file_path,reason,previous_status:d.workflow_status||'Draft'}));res.json({ok:true,archived:true});
  });

  app.post('/api/documents/:id/restore',auth,allow('documents'),(req,res)=>{
    const d=selectDoc(req.params.id);if(!d)return res.status(404).json({error:'Document not found'});if(!enforceUnit(req,d.business_unit_id))return res.status(403).json({error:'You cannot access another business unit document'});if(!canArchive(req,d.business_unit_id))return res.status(403).json({error:'Document restore permission is required.'});if(Number(d.archived||0)!==1&&d.workflow_status!=='Archived')return res.status(409).json({error:'This document is not archived.'});
    const reason=String(req.body?.reason||'').trim();if(!reason)return res.status(400).json({error:'Restore reason is required.'});let target=String(d.previous_workflow_status||'Draft');if(!['Draft','Submitted','Approved','Final'].includes(target))target='Draft';
    db.prepare("UPDATE documents SET workflow_status=?,approved=?,archived=0,restore_reason=?,restored_by=?,restored_at=CURRENT_TIMESTAMP,workflow_note=?,archive_reason=archive_reason WHERE id=?").run(target,['Approved','Final'].includes(target)?1:0,reason,req.user.id,reason,d.id);
    history(d,req.user,'Restored','Archived',target,reason,{restored_to:target,archived_at:d.archived_at,archive_reason:d.archive_reason});audit(req.user,'document',d.id,'restore',JSON.stringify({to:target,reason,archive_reason:d.archive_reason||''}));res.json({ok:true,restored:true,workflow_status:target});
  });

  app.get('/api/v3241/version',auth,(req,res)=>res.json({version:VERSION,features:['workflow-context','finance-correction-history','document-archive-restore','statement-period-integrity','dialog-preview-refinement']}));
  console.info(`Blue Ocean Market V${VERSION} document/workflow refinement backend loaded`);
  return {VERSION};
}
module.exports={install,VERSION};
