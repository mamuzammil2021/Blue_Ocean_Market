// Blue Ocean Market V30.22.1 — regression and attachment-integrity hotfix.
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const VERSION='30.22.1';

function install({app,db,auth,enforceUnit,audit,uploads,access,attachmentSecurity}){
  const text=v=>String(v??'').trim();
  const base=v=>{try{return path.basename(String(v||'').split('?')[0])}catch(_){return ''}};
  const exists=t=>!!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t);
  const cols=t=>{try{return exists(t)?db.prepare(`PRAGMA table_info(${t})`).all().map(x=>x.name):[]}catch(_){return[]}};
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachment_file_registry(
      stored_name TEXT PRIMARY KEY,
      original_name TEXT NOT NULL DEFAULT '',
      extension TEXT NOT NULL DEFAULT '',
      mime_type TEXT NOT NULL DEFAULT '',
      size_bytes INTEGER NOT NULL DEFAULT 0,
      sha256 TEXT NOT NULL DEFAULT '',
      uploaded_by INTEGER,
      business_unit_id INTEGER,
      field_name TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_attachment_registry_sha ON attachment_file_registry(sha256);
  `);
  try{db.prepare("INSERT OR IGNORE INTO schema_migrations(id,release_version,notes) VALUES('v30.22.1.attachment-integrity',?,?)").run(VERSION,'Original bytes, original filename/MIME/checksum registry and authenticated preview/download metadata.')}catch(_){}

  function shaFile(p){try{return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}catch(_){return ''}}
  function mimeFromExt(ext){return ({'.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.bmp':'image/bmp','.svg':'image/svg+xml','.csv':'text/csv','.txt':'text/plain','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.xls':'application/vnd.ms-excel','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.doc':'application/msword'})[String(ext||'').toLowerCase()]||''}
  function sniff(p){
    try{const fd=fs.openSync(p,'r'),b=Buffer.alloc(32),n=fs.readSync(fd,b,0,32,0);fs.closeSync(fd);const h=b.subarray(0,n).toString('hex'),a=b.subarray(0,n).toString('ascii');
      if(a.startsWith('%PDF-'))return {extension:'.pdf',mime_type:'application/pdf'};
      if(h.startsWith('89504e470d0a1a0a'))return {extension:'.png',mime_type:'image/png'};
      if(h.startsWith('ffd8ff'))return {extension:'.jpg',mime_type:'image/jpeg'};
      if(a.startsWith('GIF87a')||a.startsWith('GIF89a'))return {extension:'.gif',mime_type:'image/gif'};
      if(a.startsWith('RIFF')&&a.slice(8,12)==='WEBP')return {extension:'.webp',mime_type:'image/webp'};
    }catch(_){}
    return {extension:'',mime_type:''};
  }
  function upsert(stored,original='',mime='',bu=null){
    stored=base(stored);if(!stored)return;const p=path.join(uploads,stored);if(!fs.existsSync(p)||!fs.statSync(p).isFile())return;
    const stat=fs.statSync(p),sn=sniff(p),orig=base(original)||stored,ext=path.extname(orig).toLowerCase()||path.extname(stored).toLowerCase()||sn.extension,m=mime||mimeFromExt(ext)||sn.mime_type||'application/octet-stream',hash=shaFile(p);
    db.prepare(`INSERT INTO attachment_file_registry(stored_name,original_name,extension,mime_type,size_bytes,sha256,business_unit_id,created_at)
      VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(stored_name) DO UPDATE SET
        original_name=CASE WHEN attachment_file_registry.original_name='' OR attachment_file_registry.original_name=attachment_file_registry.stored_name THEN excluded.original_name ELSE attachment_file_registry.original_name END,
        extension=CASE WHEN attachment_file_registry.extension='' THEN excluded.extension ELSE attachment_file_registry.extension END,
        mime_type=CASE WHEN attachment_file_registry.mime_type='' OR attachment_file_registry.mime_type='application/octet-stream' THEN excluded.mime_type ELSE attachment_file_registry.mime_type END,
        size_bytes=excluded.size_bytes,sha256=excluded.sha256,business_unit_id=COALESCE(attachment_file_registry.business_unit_id,excluded.business_unit_id)`).run(stored,orig,ext,m,stat.size,hash,bu);
  }
  // Backfill metadata from tables that already preserve original filenames.
  const sources=[
    ['excavator_documents','file_path','original_name','mime_type',null],['excavator_buyer_documents','file_path','original_name','mime_type',null],
    ['finance_attachments','file_path','original_name','mime_type',null],['pink_salt_attachments','file_path','original_name','mime_type','business_unit_id'],
    ['payroll_documents','file_path','original_name','mime_type',null],['accounting_journal_documents','file_path','original_name','mime_type',null],
    ['documents','file_path','original_name','mime_type','business_unit_id']
  ];
  for(const [t,fp,on,mt,bu] of sources){try{if(!exists(t)||!cols(t).includes(fp)||!cols(t).includes(on))continue;const fields=[fp,on,cols(t).includes(mt)?mt+" AS mime_type":"'' AS mime_type",bu&&cols(t).includes(bu)?bu+" AS bu":"NULL AS bu"].join(',');for(const r of db.prepare(`SELECT ${fields} FROM ${t} WHERE COALESCE(${fp},'')<>''`).all())upsert(r[fp],r[on],r.mime_type,r.bu)}catch(_){} }
  // Register every physical legacy file as a fallback, without changing its bytes.
  try{for(const name of fs.readdirSync(uploads)){const p=path.join(uploads,name);if(fs.statSync(p).isFile())upsert(name,name,'',null)}}catch(_){}

  function storedMetadata(filename){
    const raw=base(filename),like='%/uploads/'+raw,tries=[
      ['excavator_documents',"SELECT original_name,mime_type,file_path FROM excavator_documents WHERE file_path=? OR file_path LIKE ? LIMIT 1"],
      ['excavator_buyer_documents',"SELECT original_name,mime_type,file_path FROM excavator_buyer_documents WHERE file_path=? OR file_path LIKE ? LIMIT 1"],
      ['finance_attachments',"SELECT original_name,mime_type,file_path FROM finance_attachments WHERE file_path=? OR file_path LIKE ? LIMIT 1"],
      ['pink_salt_attachments',"SELECT original_name,mime_type,file_path FROM pink_salt_attachments WHERE file_path=? OR file_path LIKE ? LIMIT 1"],
      ['payroll_documents',"SELECT original_name,mime_type,file_path FROM payroll_documents WHERE file_path=? OR file_path LIKE ? LIMIT 1"],
      ['accounting_journal_documents',"SELECT original_name,mime_type,file_path FROM accounting_journal_documents WHERE file_path=? OR file_path LIKE ? LIMIT 1"]
    ];
    for(const [t,q] of tries){try{if(!exists(t))continue;const r=db.prepare(q).get(raw,like);if(r)return r}catch(_){}}
    return null;
  }
  function authMeta(req,filename){
    filename=base(filename);if(!filename)return {error:400,message:'Invalid attachment path.'};
    const linked=attachmentSecurity?.authorizeAttachment?.(req,filename);if(linked===false)return {error:403,message:'You do not have permission to access this attachment.'};if(!linked)return {error:404,message:'Attachment not found or is not linked to an accessible record.'};
    const p=path.join(uploads,filename);if(path.dirname(p)!==path.resolve(uploads)||!fs.existsSync(p)||!fs.statSync(p).isFile())return {error:404,message:'Attachment file is missing from storage.'};
    const liveMeta=storedMetadata(filename);upsert(filename,liveMeta?.original_name||filename,liveMeta?.mime_type||linked.mime_type||'',linked.bu||null);
    const reg=db.prepare('SELECT * FROM attachment_file_registry WHERE stored_name=?').get(filename)||{};
    const sniffed=sniff(p),original=base(reg.original_name)||filename,ext=String(reg.extension||path.extname(original)||path.extname(filename)||sniffed.extension||'').toLowerCase(),mime=text(reg.mime_type)||text(linked.mime_type)||mimeFromExt(ext)||sniffed.mime_type||'application/octet-stream';
    return {filename,p,linked,original_name:original,extension:ext,mime_type:mime,size_bytes:Number(reg.size_bytes||fs.statSync(p).size||0),sha256:text(reg.sha256)||shaFile(p)};
  }
  function stream(req,res,download){const m=authMeta(req,req.params.filename);if(m.error)return res.status(m.error).json({error:m.message});res.set('Cache-Control','private, no-store, max-age=0');res.set('X-Content-Type-Options','nosniff');res.set('Content-Type',m.mime_type);res.set('Content-Length',String(m.size_bytes));res.set('X-Content-SHA256',m.sha256);res.set('Content-Disposition',`${download?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(m.original_name)}`);try{audit(req.user,'attachment_access',null,download?'download-original':'preview',JSON.stringify({filename:m.filename,original_name:m.original_name,sha256:m.sha256,source:m.linked.source,business_unit_id:m.linked.bu||null}))}catch(_){};fs.createReadStream(m.p).on('error',()=>{if(!res.headersSent)res.status(404).end()}).pipe(res)}
  app.get('/api/v3221/attachments/:filename/meta',auth,(req,res)=>{const m=authMeta(req,req.params.filename);if(m.error)return res.status(m.error).json({error:m.message});res.json({filename:m.filename,original_name:m.original_name,mime_type:m.mime_type,size_bytes:m.size_bytes,sha256:m.sha256,preview_supported:/^image\/(png|jpeg|gif|webp|bmp|svg\+xml)$/.test(m.mime_type)||m.mime_type==='application/pdf'})});
  app.get('/api/v3221/attachments/:filename/view',auth,(req,res)=>stream(req,res,false));
  app.get('/api/v3221/attachments/:filename/download',auth,(req,res)=>stream(req,res,true));
  app.get('/api/v3221/version',auth,(req,res)=>res.json({version:VERSION,features:['attachment-original-integrity','field-scoped-validation','smart-file-limits','numeric-input-freedom','top-layer-messages']}));
  return {VERSION};
}
module.exports={install,VERSION};
