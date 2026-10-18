// Blue Ocean Market V30.68.0 — important-only email promotion for existing notifications.
'use strict';

function install({db,settings}){
  const VERSION='30.68.0';
  const text=v=>String(v??'').trim();
  const table=name=>!!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_critical_email_events(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_key TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      entity_type TEXT NOT NULL DEFAULT '',
      entity_id INTEGER,
      status TEXT NOT NULL DEFAULT 'Queued',
      error_text TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      sent_at TEXT,
      UNIQUE(event_key,user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_critical_email_events_created_v368 ON system_critical_email_events(created_at,id);
  `);
  const baseUrl=()=>text(process.env.APP_BASE_URL).replace(/\/$/,'');
  const notificationSettings=(bu,user)=>settings?.effectiveFor?.('notifications',bu||null,user||null)||{};
  const approvalForNotification=(entityType,entityId)=>{
    if(entityType==='approval'&&entityId&&table('approvals'))return db.prepare('SELECT * FROM approvals WHERE id=?').get(entityId)||null;
    if(entityType==='task'&&entityId&&table('tasks')){const t=db.prepare('SELECT related_entity_type,related_entity_id FROM tasks WHERE id=?').get(entityId);if(t?.related_entity_type==='approval'&&t.related_entity_id&&table('approvals'))return db.prepare('SELECT * FROM approvals WHERE id=?').get(t.related_entity_id)||null}
    return null;
  };
  const highRiskApproval=a=>{
    if(!a)return false;
    const hay=`${a.action_key||''} ${a.type||''} ${a.source_entity||''}`.toLowerCase();
    return ['critical','high','urgent'].includes(String(a.priority||'').toLowerCase())||Number(a.required_level||0)>=3||/(finance|payment|refund|void|correction|payroll|salary|bank|account|posting|journal|security|access|permission)/.test(hay);
  };
  function classify(n){
    const title=text(n.title),lower=title.toLowerCase();
    if(n.entity_type==='employee_payment_account_request')return {category:'Payroll / Bank Account',setting:'email_payroll_account_changes',important:true};
    if(/finance correction required|finance correction reminder|accounting correction required|operational source correction required/.test(lower))return {category:'Finance / Accounting Correction',setting:'email_finance_corrections',important:true};
    if(n.entity_type==='approval'||(n.entity_type==='task'&&/approval/.test(lower))){const a=approvalForNotification(n.entity_type,n.entity_id);if(highRiskApproval(a)&&(/approval requested|approval resubmitted|approval changes required|approval correction reminder|approval review reminder|ceo approval required|approved action needs attention/.test(lower)))return {category:'High-Risk Approval',setting:'email_high_risk_approvals',important:true,approval:a};}
    if(n.entity_type==='task'&&table('tasks')&&/new work assigned|work reassigned|important task assigned/.test(lower)){const task=db.prepare('SELECT priority,status,updated_at FROM tasks WHERE id=?').get(n.entity_id);if(task&&!['Completed','Cancelled'].includes(task.status)&&['high','urgent','critical'].includes(String(task.priority||'').toLowerCase()))return {category:'Important Task',setting:'email_important_tasks',important:true,task};}
    if(n.entity_type==='security_event'||/security critical|sensitive access changed|permission changed|approval authority changed|account disabled/.test(lower))return {category:'Security / Access',setting:'email_security_events',important:true};
    if(n.entity_type==='system_critical'||/backup failed|database failure|storage failure|critical system/.test(lower))return {category:'Critical System',setting:'email_system_critical',important:true};
    return {important:false};
  }
  function deepLink(n){const b=baseUrl();if(!b)return '';const view=text(n.action_view)||'notifications';const id=Number(n.action_id||n.entity_id||0);if(view==='approvals'&&id)return `${b}/#approvals/approval/${id}?unit=${Number(n.business_unit_id||0)}`;if(view==='tasks'&&id)return `${b}/#tasks/task/${id}?unit=${Number(n.business_unit_id||0)}`;return `${b}/#${encodeURIComponent(view)}`;}
  function localizedBody(user,n,c){
    const ko=String(user.preferred_language||'').toLowerCase()==='ko',url=deepLink(n),ref=n.entity_id?`#${n.entity_id}`:'';
    if(ko)return `[조치 필요] ${{'High-Risk Approval':'중요 승인','Finance / Accounting Correction':'재무 / 회계 수정','Payroll / Bank Account':'급여 / 은행 계좌','Security / Access':'보안 / 접근 권한','Critical System':'중요 시스템','Important Task':'중요 업무'}[c.category]||c.category}\n\n${({'Approval requested':'승인 요청','Approval resubmitted':'승인 재제출','CEO approval required':'CEO 승인 필요','New work assigned':'새 업무 배정','Work reassigned to you':'업무 재배정','Important task assigned':'중요 업무 배정'}[n.title]||n.title)}${ref?' '+ref:''}\n${c.approval?(c.approval.reason||'승인 요청의 상세 내용과 증빙을 확인하세요.'):(n.message||'')}\n${n.business_unit_name?`사업부: ${n.business_unit_name}\n`:''}${url?`\nBlue Ocean Market 열기: ${url}\n`:''}\n이 메일은 중요한 업무, 승인, 재무, 급여, 보안 또는 시스템 예외에 대해서만 발송됩니다.`;
    return `[Action required] ${c.category}\n\n${n.title}${ref?' '+ref:''}\n${n.message||''}\n${n.business_unit_name?`Business Unit: ${n.business_unit_name}\n`:''}${url?`\nOpen Blue Ocean Market: ${url}\n`:''}\nThis email is sent only for important task, approval, finance, payroll, security or critical system exceptions.`;
  }
  async function promote(n){
    try{
      if(!n?.user_id||!settings?.sendSystemEmail)return;
      const cfg=notificationSettings(n.business_unit_id,n.user_id);if(!cfg.email_enabled||cfg.critical_email_only===false)return;
      const c=classify(n);if(!c.important||cfg[c.setting]===false)return;
      const user=db.prepare("SELECT id,name,email,preferred_language,active FROM users WHERE id=?").get(n.user_id);if(!user?.active||!text(user.email))return;
      const eventKey=[c.category,n.entity_type||'',n.entity_id||0,n.title||'',n.action_id||0,c.approval?`revision:${Number(c.approval.revision_count||0)}:${c.approval.current_step||''}`:c.task?`task:${c.task.priority}:${c.task.updated_at||''}`:''].join('|').slice(0,500);
      let inserted=false;try{const r=db.prepare("INSERT INTO system_critical_email_events(event_key,user_id,category,entity_type,entity_id,status) VALUES(?,?,?,?,?,'Queued')").run(eventKey,user.id,c.category,n.entity_type||'',n.entity_id||null);inserted=!!r.changes}catch(e){if(/UNIQUE/.test(String(e.message)))return;throw e}
      if(!inserted)return;
      const result=await settings.sendSystemEmail({to:user.email,subject:`Blue Ocean Market — ${n.title}`,textBody:localizedBody(user,n,c),purpose:`Important Notification: ${c.category}`,userId:user.id});
      db.prepare("UPDATE system_critical_email_events SET status=?,error_text=?,sent_at=CASE WHEN ?='Sent' THEN CURRENT_TIMESTAMP ELSE sent_at END WHERE event_key=? AND user_id=?").run(result.ok?'Sent':result.skipped?'Skipped':'Failed',text(result.error||result.reason).slice(0,2000),result.ok?'Sent':'',eventKey,user.id);
    }catch(e){console.error('V30.68 critical email promotion:',e.message)}
  }
  function notifyEvent(n){Promise.resolve().then(()=>promote(n)).catch(e=>console.error('V30.68 email queue:',e.message));}
  return {VERSION,notifyEvent,classify,highRiskApproval};
}
module.exports={install};
