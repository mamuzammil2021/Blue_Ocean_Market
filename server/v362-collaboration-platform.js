const VERSION='30.62.0';

function addColumn(db,table,column,definition){
  const cols=db.prepare(`PRAGMA table_info(${table})`).all();
  if(!cols.some(c=>c.name===column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
function install({app,db,auth,audit,access}){
  addColumn(db,'meetings','minutes_status',"TEXT NOT NULL DEFAULT 'Draft'");
  addColumn(db,'meetings','archived_at','TEXT');
  db.exec(`
    CREATE TABLE IF NOT EXISTS meeting_agenda_items(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      position INTEGER NOT NULL DEFAULT 1,
      topic TEXT NOT NULL,
      owner_id INTEGER,
      planned_minutes INTEGER NOT NULL DEFAULT 10,
      notes TEXT NOT NULL DEFAULT '',
      decision_required INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Open',
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_v362_agenda_meeting ON meeting_agenda_items(meeting_id,position,id);
    CREATE TABLE IF NOT EXISTS meeting_decision_items(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      decision_text TEXT NOT NULL,
      owner_id INTEGER,
      status TEXT NOT NULL DEFAULT 'Final',
      notes TEXT NOT NULL DEFAULT '',
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_v362_decisions_meeting ON meeting_decision_items(meeting_id,status,id);
  `);

  const isManager=u=>!!u&&['CEO / Owner','Operations Manager','Business Unit Manager'].includes(u.role);
  const assignedUnits=u=>u?.role==='CEO / Owner'?db.prepare("SELECT id FROM business_units WHERE status!='Archived' ORDER BY id").all().map(x=>Number(x.id)):(access?.assignedUnits?access.assignedUnits(u.id).map(x=>Number(x.id)):[Number(u?.business_unit_id)].filter(Boolean));
  const meetingUnits=id=>db.prepare('SELECT business_unit_id FROM meeting_business_units WHERE meeting_id=?').all(Number(id)).map(x=>Number(x.business_unit_id));
  function meetingAccess(req,m){
    if(!m)return false;
    if(req.user.role==='CEO / Owner')return true;
    if(Number(m.organizer_id)===Number(req.user.id))return true;
    if(db.prepare('SELECT 1 FROM meeting_attendees WHERE meeting_id=? AND user_id=?').get(m.id,req.user.id))return true;
    if(String(m.scope_mode)==='Company-wide')return true;
    if(isManager(req.user)){const allowed=new Set(assignedUnits(req.user));return meetingUnits(m.id).some(x=>allowed.has(x));}
    return false;
  }
  function loadMeeting(req,id){const m=db.prepare('SELECT * FROM meetings WHERE id=?').get(Number(id));if(!m)return {error:[404,'Meeting not found']};if(!meetingAccess(req,m))return {error:[403,'You cannot access this meeting']};return {m};}
  function canManage(req,m){return isManager(req.user)||Number(m.organizer_id)===Number(req.user.id)}
  function taskAccess(req,t){if(!t)return false;if(req.user.role==='CEO / Owner')return true;if(Number(t.owner_id)===Number(req.user.id)||Number(t.created_by)===Number(req.user.id)||Number(t.assigned_by)===Number(req.user.id))return true;if(isManager(req.user)){const units=new Set(assignedUnits(req.user));return units.has(Number(t.business_unit_id))}return false}
  function relatedRows(type,id){return db.prepare(`SELECT r.*,CASE WHEN r.source_entity_type=? AND r.source_entity_id=? THEN r.target_entity_type ELSE r.source_entity_type END related_entity_type,
    CASE WHEN r.source_entity_type=? AND r.source_entity_id=? THEN r.target_entity_id ELSE r.source_entity_id END related_entity_id
    FROM platform_related_records r WHERE (r.source_entity_type=? AND r.source_entity_id=?) OR (r.target_entity_type=? AND r.target_entity_id=?) ORDER BY r.created_at DESC,r.id DESC`).all(type,id,type,id,type,id,type,id)}
  function displayLabel(entityType,id){
    const e=db.prepare('SELECT * FROM platform_entities WHERE entity_type=? AND active=1').get(entityType);if(!e)return null;
    const adapters={
      meeting:{sql:'SELECT id,title label,business_unit_id FROM meetings WHERE id=?'},
      task:{sql:'SELECT id,title label,business_unit_id FROM tasks WHERE id=?'},
      excavator_machine:{sql:"SELECT id,COALESCE(NULLIF(machine_name,''),asset_no) label,business_unit_id FROM excavator_assets WHERE id=?"},
      excavator_buyer:{sql:'SELECT id,name label,business_unit_id FROM excavator_buyers WHERE id=?'},
      excavator_supplier:{sql:'SELECT id,name label,business_unit_id FROM excavator_suppliers WHERE id=?'},
      finance_transaction:{sql:"SELECT id,COALESCE(NULLIF(description,''),type||' #'||id) label,business_unit_id FROM finance_entries WHERE id=?"}
    };
    const a=adapters[entityType];if(!a)return {id:Number(id),label:`${e.entity_name} #${id}`,business_unit_id:null};
    try{return db.prepare(a.sql).get(Number(id))||null}catch(_){return null}
  }

  app.get('/api/v362/platform/entity-search',auth,(req,res)=>{
    const q=String(req.query.q||'').trim().slice(0,100),limit=Math.max(1,Math.min(20,Number(req.query.limit)||12));
    if(q.length<2)return res.json({rows:[]});
    const requested=String(req.query.entity_types||'').split(',').map(x=>x.trim()).filter(Boolean);
    const types=requested.length?requested:['meeting','task','excavator_machine','excavator_buyer','excavator_supplier'];
    const units=new Set(assignedUnits(req.user)),like=`%${q}%`,out=[];
    const defs={
      meeting:{name:'Meeting',sql:`SELECT id,title label,business_unit_id FROM meetings WHERE title LIKE ? OR summary LIKE ? ORDER BY id DESC LIMIT ?`,args:[like,like,limit]},
      task:{name:'Task',sql:`SELECT id,title label,business_unit_id FROM tasks WHERE title LIKE ? OR description LIKE ? ORDER BY id DESC LIMIT ?`,args:[like,like,limit]},
      excavator_machine:{name:'Excavator Machine',sql:`SELECT id,COALESCE(NULLIF(machine_name,''),asset_no) label,business_unit_id FROM excavator_assets WHERE machine_name LIKE ? OR asset_no LIKE ? OR make LIKE ? OR model LIKE ? OR serial_no LIKE ? ORDER BY id DESC LIMIT ?`,args:[like,like,like,like,like,limit]},
      excavator_buyer:{name:'Excavator Buyer',sql:`SELECT id,name label,business_unit_id FROM excavator_buyers WHERE name LIKE ? OR contact_person LIKE ? OR phone LIKE ? ORDER BY id DESC LIMIT ?`,args:[like,like,like,limit]},
      excavator_supplier:{name:'Excavator Supplier',sql:`SELECT id,name label,business_unit_id FROM excavator_suppliers WHERE name LIKE ? OR contact_person LIKE ? OR phone LIKE ? ORDER BY id DESC LIMIT ?`,args:[like,like,like,limit]}
    };
    for(const type of types){const d=defs[type];if(!d)continue;let rows=[];try{rows=db.prepare(d.sql).all(...d.args)}catch(_){continue}for(const r of rows){if(req.user.role!=='CEO / Owner'&&r.business_unit_id&&!units.has(Number(r.business_unit_id)))continue;if(type==='task'&&!isManager(req.user)){const t=db.prepare('SELECT owner_id,created_by,assigned_by FROM tasks WHERE id=?').get(r.id);if(!t||(Number(t.owner_id)!==Number(req.user.id)&&Number(t.created_by)!==Number(req.user.id)&&Number(t.assigned_by)!==Number(req.user.id)))continue}if(type==='meeting'){const m=db.prepare('SELECT * FROM meetings WHERE id=?').get(r.id);if(!meetingAccess(req,m))continue}out.push({entity_type:type,entity_name:d.name,id:Number(r.id),label:String(r.label||`${d.name} #${r.id}`),business_unit_id:r.business_unit_id?Number(r.business_unit_id):null});if(out.length>=limit)break}if(out.length>=limit)break}
    res.json({rows:out.slice(0,limit)});
  });

  app.get('/api/v362/platform/related/:entityType/:entityId',auth,(req,res)=>{
    const type=String(req.params.entityType||''),id=Number(req.params.entityId||0);
    if(type==='meeting'){const check=loadMeeting(req,id);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});}if(type==='task'){const t=db.prepare('SELECT * FROM tasks WHERE id=?').get(id);if(!t)return res.status(404).json({error:'Task not found'});if(!taskAccess(req,t))return res.status(403).json({error:'You cannot access this task'});}
    const rows=relatedRows(type,id).map(r=>{const info=displayLabel(r.related_entity_type,r.related_entity_id);return {...r,related_label:info?.label||`${r.related_entity_type} #${r.related_entity_id}`,related_business_unit_id:info?.business_unit_id||null}});
    res.json(rows);
  });

  app.post('/api/v362/platform/related',auth,(req,res)=>{
    const sourceType=String(req.body.source_entity_type||''),sourceId=Number(req.body.source_entity_id||0),targetType=String(req.body.target_entity_type||''),targetId=Number(req.body.target_entity_id||0);
    if(sourceType==='meeting'){const check=loadMeeting(req,sourceId);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});if(!canManage(req,check.m))return res.status(403).json({error:'Only organizer or authorized manager can link records to this meeting'})}
    else if(sourceType==='task'){const t=db.prepare('SELECT * FROM tasks WHERE id=?').get(sourceId);if(!t)return res.status(404).json({error:'Task not found'});if(!taskAccess(req,t))return res.status(403).json({error:'You cannot access this task'});if(!isManager(req.user)&&Number(t.owner_id)!==Number(req.user.id))return res.status(403).json({error:'You cannot link records to this task'})}
    else return res.status(400).json({error:'V30.62 related-record linking currently supports Meeting and Task sources'});
    if(!displayLabel(targetType,targetId))return res.status(400).json({error:'Target is not an available registered record'});
    const rel=String(req.body.relationship_type||'Related').trim().slice(0,80)||'Related';
    const bu=req.body.business_unit_id?Number(req.body.business_unit_id):null;
    const r=db.prepare(`INSERT OR IGNORE INTO platform_related_records(source_entity_type,source_entity_id,target_entity_type,target_entity_id,relationship_type,business_unit_id,created_by) VALUES(?,?,?,?,?,?,?)`).run(sourceType,sourceId,targetType,targetId,rel,bu,req.user.id);
    if(audit)audit(req.user,'platform_related_record',r.lastInsertRowid||null,'link',JSON.stringify({sourceType,sourceId,targetType,targetId,relationship_type:rel}));
    res.json({ok:true,id:Number(r.lastInsertRowid||0)});
  });

  app.delete('/api/v362/platform/related/:id',auth,(req,res)=>{const r=db.prepare('SELECT * FROM platform_related_records WHERE id=?').get(Number(req.params.id));if(!r)return res.status(404).json({error:'Related record link not found'});if(r.source_entity_type==='meeting'){const check=loadMeeting(req,r.source_entity_id);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});if(!canManage(req,check.m))return res.status(403).json({error:'Only organizer or authorized manager can remove this link'})}db.prepare('DELETE FROM platform_related_records WHERE id=?').run(r.id);if(audit)audit(req.user,'platform_related_record',r.id,'unlink',JSON.stringify(r));res.json({ok:true})});

  app.get('/api/v362/meetings/:id/collaboration',auth,(req,res)=>{const check=loadMeeting(req,req.params.id);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});const agenda=db.prepare(`SELECT a.*,u.name owner_name FROM meeting_agenda_items a LEFT JOIN users u ON u.id=a.owner_id WHERE a.meeting_id=? ORDER BY a.position,a.id`).all(check.m.id);const decisions=db.prepare(`SELECT d.*,u.name owner_name FROM meeting_decision_items d LEFT JOIN users u ON u.id=d.owner_id WHERE d.meeting_id=? ORDER BY d.id`).all(check.m.id);res.json({agenda,decisions,minutes_status:check.m.minutes_status||'Draft',archived_at:check.m.archived_at||null,related:relatedRows('meeting',check.m.id).map(r=>{const info=displayLabel(r.related_entity_type,r.related_entity_id);return {...r,related_label:info?.label||`${r.related_entity_type} #${r.related_entity_id}`}})});});
  app.post('/api/v362/meetings/:id/agenda',auth,(req,res)=>{const check=loadMeeting(req,req.params.id);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});if(!canManage(req,check.m))return res.status(403).json({error:'Only organizer or authorized manager can edit agenda items'});const topic=String(req.body.topic||'').trim();if(!topic)return res.status(400).json({error:'Agenda topic is required'});const pos=Number(req.body.position||db.prepare('SELECT COALESCE(MAX(position),0)+1 n FROM meeting_agenda_items WHERE meeting_id=?').get(check.m.id).n);const r=db.prepare(`INSERT INTO meeting_agenda_items(meeting_id,position,topic,owner_id,planned_minutes,notes,decision_required,status,created_by) VALUES(?,?,?,?,?,?,?,?,?)`).run(check.m.id,pos,topic,req.body.owner_id?Number(req.body.owner_id):null,Math.max(1,Number(req.body.planned_minutes||10)),String(req.body.notes||''),req.body.decision_required?1:0,String(req.body.status||'Open'),req.user.id);if(audit)audit(req.user,'meeting_agenda_item',r.lastInsertRowid,'create',JSON.stringify({meeting_id:check.m.id,topic}));res.json({id:Number(r.lastInsertRowid)});});
  app.put('/api/v362/meetings/:meetingId/agenda/:id',auth,(req,res)=>{const check=loadMeeting(req,req.params.meetingId);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});if(!canManage(req,check.m))return res.status(403).json({error:'Only organizer or authorized manager can edit agenda items'});const a=db.prepare('SELECT * FROM meeting_agenda_items WHERE id=? AND meeting_id=?').get(Number(req.params.id),check.m.id);if(!a)return res.status(404).json({error:'Agenda item not found'});db.prepare(`UPDATE meeting_agenda_items SET position=?,topic=?,owner_id=?,planned_minutes=?,notes=?,decision_required=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(Number(req.body.position??a.position),String(req.body.topic??a.topic),req.body.owner_id===undefined?a.owner_id:(req.body.owner_id?Number(req.body.owner_id):null),Math.max(1,Number(req.body.planned_minutes??a.planned_minutes)),String(req.body.notes??a.notes),req.body.decision_required===undefined?a.decision_required:(req.body.decision_required?1:0),String(req.body.status??a.status),a.id);res.json({ok:true})});
  app.delete('/api/v362/meetings/:meetingId/agenda/:id',auth,(req,res)=>{const check=loadMeeting(req,req.params.meetingId);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});if(!canManage(req,check.m))return res.status(403).json({error:'Only organizer or authorized manager can edit agenda items'});db.prepare('DELETE FROM meeting_agenda_items WHERE id=? AND meeting_id=?').run(Number(req.params.id),check.m.id);res.json({ok:true})});

  app.post('/api/v362/meetings/:id/decisions',auth,(req,res)=>{const check=loadMeeting(req,req.params.id);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});if(!canManage(req,check.m))return res.status(403).json({error:'Only organizer or authorized manager can record decisions'});const text=String(req.body.decision_text||'').trim();if(!text)return res.status(400).json({error:'Decision is required'});const r=db.prepare(`INSERT INTO meeting_decision_items(meeting_id,decision_text,owner_id,status,notes,created_by) VALUES(?,?,?,?,?,?)`).run(check.m.id,text,req.body.owner_id?Number(req.body.owner_id):null,String(req.body.status||'Final'),String(req.body.notes||''),req.user.id);if(audit)audit(req.user,'meeting_decision',r.lastInsertRowid,'create',JSON.stringify({meeting_id:check.m.id,decision:text}));res.json({id:Number(r.lastInsertRowid)});});
  app.put('/api/v362/meetings/:meetingId/decisions/:id',auth,(req,res)=>{const check=loadMeeting(req,req.params.meetingId);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});if(!canManage(req,check.m))return res.status(403).json({error:'Only organizer or authorized manager can edit decisions'});const d=db.prepare('SELECT * FROM meeting_decision_items WHERE id=? AND meeting_id=?').get(Number(req.params.id),check.m.id);if(!d)return res.status(404).json({error:'Decision not found'});db.prepare(`UPDATE meeting_decision_items SET decision_text=?,owner_id=?,status=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(String(req.body.decision_text??d.decision_text),req.body.owner_id===undefined?d.owner_id:(req.body.owner_id?Number(req.body.owner_id):null),String(req.body.status??d.status),String(req.body.notes??d.notes),d.id);res.json({ok:true})});

  app.post('/api/v362/meetings/:id/publish-minutes',auth,(req,res)=>{const check=loadMeeting(req,req.params.id);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});if(!canManage(req,check.m))return res.status(403).json({error:'Only organizer or authorized manager can publish minutes'});db.prepare("UPDATE meetings SET minutes_status='Published',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(check.m.id);if(audit)audit(req.user,'meeting',check.m.id,'publish_minutes','Published');res.json({ok:true,minutes_status:'Published'})});
  app.post('/api/v362/meetings/:id/archive',auth,(req,res)=>{const check=loadMeeting(req,req.params.id);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});if(!canManage(req,check.m))return res.status(403).json({error:'Only organizer or authorized manager can archive this meeting'});db.prepare("UPDATE meetings SET status='Closed/Archived',archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(check.m.id);if(audit)audit(req.user,'meeting',check.m.id,'archive',String(req.body.reason||''));res.json({ok:true})});

  function pdfEsc(s){return String(s??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ')}
  function pdfToken(s){const v=String(s??'');if(/[^\x20-\x7e]/.test(v)){const le=Buffer.from('\uFEFF'+v,'utf16le');for(let i=0;i<le.length;i+=2){const b=le[i];le[i]=le[i+1];le[i+1]=b}return '<'+le.toString('hex').toUpperCase()+'>'}return `(${pdfEsc(v)})`}
  function simplePdf(title,lines){const W=612,H=792,M=38,pages=[];let ops=[],y=748,pno=1;const text=(x,yy,s,size=9,bold=false)=>{const uni=/[^\x20-\x7e]/.test(String(s??''));const f=uni?(bold?'F4':'F3'):(bold?'F2':'F1');ops.push(`BT /${f} ${size} Tf 0.08 0.12 0.2 rg 1 0 0 1 ${x} ${yy} Tm ${pdfToken(s)} Tj ET`)};const header=()=>{text(M,y,'BLUE OCEAN MARKET',14,true);y-=18;text(M,y,title,12,true);y-=20};const finish=()=>{text(M,18,`BLUE OCEAN MARKET · ${title}`,6);text(W-80,18,`Page ${pno}`,6);pages.push(ops.join('\n'));ops=[];pno++;y=748;header()};header();for(const line of lines){const parts=String(line??'').match(/.{1,88}(?:\s|$)|.{1,88}/g)||[''];for(const part of parts){if(y<45)finish();text(M,y,part.trim(),8.5);y-=13}y-=2}if(ops.length){text(M,18,`BLUE OCEAN MARKET · ${title}`,6);text(W-80,18,`Page ${pno}`,6);pages.push(ops.join('\n'))}const objs=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>','<< /Type /Font /Subtype /Type0 /BaseFont /HYSMyeongJo-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [7 0 R] >>','<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [8 0 R] >>','<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYSMyeongJo-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>','<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>'];const pids=[];for(const stream of pages){const cid=objs.length+1;objs.push(`<< /Length ${Buffer.byteLength(stream,'utf8')} >>\nstream\n${stream}\nendstream`);const pid=objs.length+1;objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${cid} 0 R >>`);pids.push(pid)}objs[1]=`<< /Type /Pages /Count ${pids.length} /Kids [${pids.map(i=>i+' 0 R').join(' ')}] >>`;let out='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n',offs=[0];for(let i=0;i<objs.length;i++){offs.push(Buffer.byteLength(out,'binary'));out+=`${i+1} 0 obj\n${objs[i]}\nendobj\n`}const xref=Buffer.byteLength(out,'binary');out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offs.length;i++)out+=String(offs[i]).padStart(10,'0')+' 00000 n \n';out+=`trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(out,'binary')}
  app.get('/api/v362/meetings/:id/:kind.pdf',auth,(req,res)=>{const check=loadMeeting(req,req.params.id);if(check.error)return res.status(check.error[0]).json({error:check.error[1]});const m=check.m,kind=String(req.params.kind||'minutes');if(!['agenda','minutes'].includes(kind))return res.status(404).end();const units=db.prepare(`SELECT b.name FROM meeting_business_units mb JOIN business_units b ON b.id=mb.business_unit_id WHERE mb.meeting_id=? ORDER BY b.name`).all(m.id).map(x=>x.name).join(', ');const attendees=db.prepare(`SELECT u.name,ma.response_status,ma.attendance_status FROM meeting_attendees ma JOIN users u ON u.id=ma.user_id WHERE ma.meeting_id=? ORDER BY u.name`).all(m.id);const agenda=db.prepare(`SELECT a.*,u.name owner_name FROM meeting_agenda_items a LEFT JOIN users u ON u.id=a.owner_id WHERE a.meeting_id=? ORDER BY a.position,a.id`).all(m.id);const decisions=db.prepare(`SELECT d.*,u.name owner_name FROM meeting_decision_items d LEFT JOIN users u ON u.id=d.owner_id WHERE d.meeting_id=? ORDER BY d.id`).all(m.id);const actions=db.prepare(`SELECT a.*,u.name owner_name FROM meeting_actions a LEFT JOIN users u ON u.id=a.owner_id WHERE a.meeting_id=? ORDER BY a.id`).all(m.id);const lines=[`Meeting: ${m.title}`,`Date/Time: ${m.meeting_date||''} ${m.start_time||''}`,`Scope: ${m.scope_mode||''} · ${units||'—'}`,`Location: ${m.location||'—'}`,`Purpose: ${m.summary||'—'}`,'', 'Agenda'];if(agenda.length)agenda.forEach((a,i)=>lines.push(`${i+1}. ${a.topic} · ${a.owner_name||'—'} · ${a.planned_minutes||0} min${a.decision_required?' · Decision required':''}`));else lines.push(m.agenda||'No structured agenda items.');if(kind==='minutes'){lines.push('','Attendance');attendees.forEach(a=>lines.push(`${a.name} · ${a.response_status||'Invited'} · ${a.attendance_status||'Pending'}`));lines.push('','Minutes / Notes',m.minutes||'—','','Decisions');if(decisions.length)decisions.forEach((d,i)=>lines.push(`${i+1}. ${d.decision_text} · ${d.owner_name||'—'} · ${d.status}`));else lines.push(m.decisions||'—');lines.push('','Action Items');actions.forEach((a,i)=>lines.push(`${i+1}. ${a.title} · ${a.owner_name||'—'} · Due ${a.due_date||'—'} · ${a.status}`))}const buf=simplePdf(kind==='agenda'?'Meeting Agenda':'Meeting Minutes',lines);res.type('application/pdf');res.set('Content-Disposition',`attachment; filename="Meeting_${m.id}_${kind}.pdf"`);res.set('Cache-Control','no-store');res.send(buf)});

  return {VERSION};
}
module.exports={install,VERSION};
