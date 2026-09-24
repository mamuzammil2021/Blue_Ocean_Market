// Blue Ocean Market V30.45.0 — Unified Action Feedback Coordinator.
// Presentation-only: Review & Confirm, API/idempotency, mutation lifecycle and business logic stay upstream.
(()=>{
  'use strict';
  if(window.BOMFeedback)return;
  const active=new Map(),buttons=new WeakMap(),overlays=new Map(),recentToasts=new Map();
  let sequence=0,lastFinished=null;
  const tr=s=>{try{return typeof t==='function'?t(s):s}catch(_){return s}};
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  try{Object.assign(KO,{
    'Saving…':'저장 중…','Saving changes…':'변경사항 저장 중…','Recording payment…':'결제 기록 중…',
    'Allocating balance…':'잔액 배정 중…','Applying approval…':'승인 처리 중…',
    'Processing controlled change…':'통제된 변경 처리 중…','Generating document…':'문서 생성 중…',
    'Completing production…':'생산 완료 처리 중…','Receiving import…':'수입 입고 처리 중…',
    'Restoring system…':'시스템 복원 중…','Running maintenance…':'시스템 유지보수 중…',
    'Still working…':'계속 처리 중…','Please do not repeat this action.':'이 작업을 반복하지 마세요.'
  })}catch(_){ }
  const style=document.createElement('style');style.id='bom345-feedback-style';style.textContent=`
    .bom345-button-busy{font-size:0!important;cursor:wait!important;white-space:nowrap;opacity:.88;}
    .bom345-button-busy > *{visibility:hidden!important}
    .bom345-button-busy:before{content:'';display:inline-block!important;width:12px;height:12px;margin-right:7px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;vertical-align:middle;animation:bom314spin .75s linear infinite;}
    .bom345-button-busy:after{content:attr(data-bom345-label);display:inline!important;font-size:13px;font-weight:inherit;vertical-align:middle;}
    .bom345-progress-host{position:relative!important;}
    .bom345-progress{position:absolute;inset:0;z-index:150;min-height:90px;background:rgba(255,255,255,.88);display:grid;place-items:center;padding:18px;cursor:progress;border-radius:inherit;}
    .bom345-progress-card{display:flex;flex-direction:column;align-items:center;gap:10px;max-width:390px;text-align:center;color:var(--text,#223048);font-weight:700;line-height:1.4;}
    .bom345-spinner{width:28px;height:28px;border:3px solid #dbe5f4;border-top-color:var(--brand,#2974c8);border-radius:50%;animation:bom314spin .85s linear infinite;}
    .bom345-global{position:fixed;inset:0;z-index:31000;background:rgba(8,18,34,.65);display:grid;place-items:center;padding:20px;}
    .bom345-global .bom345-progress-card{width:min(420px,94vw);background:white;border-radius:16px;padding:25px;color:#223048;}
    .bom345-button-busy:focus-visible{outline:2px solid var(--brand,#2974c8)}
  `;document.head.appendChild(style);
  function label(url,btn){const text=((btn?.dataset?.bomFeedbackLabel||btn?.textContent||'')+' '+url).toLowerCase();
    if(/restore|reset|maintenance/.test(text))return /restore/.test(text)?'Restoring system…':'Running maintenance…';
    if(/import.*receiv|receiv.*import/.test(text))return 'Receiving import…';
    if(/production|repack/.test(text))return 'Completing production…';
    if(/payment|receipt|settlement|transfer|refund/.test(text))return 'Recording payment…';
    if(/allocat/.test(text))return 'Allocating balance…';
    if(/approv|verif|posting/.test(text))return 'Applying approval…';
    if(/void|delet|cancel|revers|archiv/.test(text))return 'Processing controlled change…';
    if(/pdf|document|generat/.test(text))return 'Generating document…';
    if(/updat|edit|patch/.test(text))return 'Saving changes…';
    return 'Saving…';
  }
  function scopeFor(url,btn){const explicit=btn?.dataset?.bomFeedback;
    if(['global','transaction','button'].includes(explicit))return explicit;
    const s=(String(url||'')+' '+String(btn?.textContent||'')).toLowerCase();
    if(/(?:test[-_/]?reset|environment[-_/]?reset|restore[-_/]?(?:backup|database)|backup[-_/]?restore|full[-_/]?reset|maintenance[-_/]?reset)/.test(s))return 'global';
    if(/(?:payment|receipt|refund|settlement|transfer|posting|journal|allocat|void|revers|approval|approve|verif|period[-_/]?close|purchase|sale[-_/]?complete|complete[-_/]?sale)/.test(s))return 'transaction';
    return btn?.isConnected?'button':'transaction';
  }
  function hostFor(scope){if(scope==='global')return document.getElementById('processingRoot')||document.body;
    return document.querySelector('#modalRoot .modal,#v324WorkflowSurface,#content')||document.body;
  }
  function setButton(btn,on,message){if(!btn?.isConnected)return;
    if(on){let state=buttons.get(btn);if(!state){state={count:0,disabled:btn.disabled,minWidth:btn.style.minWidth,aria:btn.getAttribute('aria-label')};buttons.set(btn,state)}state.count++;
      if(state.count>1){btn.dataset.bom345Label=tr(message);return}
      const width=btn.getBoundingClientRect?.().width||0;if(width)btn.style.minWidth=Math.ceil(width)+'px';
      btn.disabled=true;btn.classList.add('bom345-button-busy');btn.dataset.bom345Label=tr(message);btn.setAttribute('aria-busy','true');btn.setAttribute('aria-label',tr(message));
    }else{const state=buttons.get(btn);if(!state)return;state.count=Math.max(0,state.count-1);if(state.count)return;
      buttons.delete(btn);btn.disabled=state.disabled;btn.classList.remove('bom345-button-busy');delete btn.dataset.bom345Label;btn.removeAttribute('aria-busy');
      btn.style.minWidth=state.minWidth;if(state.aria===null)btn.removeAttribute('aria-label');else btn.setAttribute('aria-label',state.aria);if([...active.values()].some(x=>x.button===btn&&x.scope!=='button'))btn.disabled=true;
    }
  }
  function updateButtonLabel(btn,message){if(!btn?.isConnected||!buttons.has(btn))return;btn.dataset.bom345Label=tr(message);btn.setAttribute('aria-label',tr(message))}
  function updateHost(host){const tokens=[...active.values()].filter(x=>x.host===host&&x.scope!=='button');let entry=overlays.get(host);
    if(!tokens.length){if(entry){entry.node.remove();overlays.delete(host);if(entry.marked)host.classList.remove('bom345-progress-host')}return}
    const token=tokens.at(-1),global=token.scope==='global',message=tr(token.slow?'Still working…':token.message);
    if(!entry){const node=document.createElement('div');node.className=global?'bom345-global':'bom345-progress';node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.setAttribute('aria-busy','true');node.innerHTML='<div class="bom345-progress-card"><span class="bom345-spinner" aria-hidden="true"></span><span data-bom345-message></span></div>';const marked=!global&&!host.classList.contains('bom345-progress-host');if(marked)host.classList.add('bom345-progress-host');host.appendChild(node);entry={node,marked};overlays.set(host,entry)}
    entry.node.querySelector('[data-bom345-message]').textContent=message;
  }
  function begin(url,btn,opt={}){const scope=opt.read?'button':scopeFor(url,btn),host=scope==='button'?null:hostFor(scope),ticket={id:++sequence,scope,host,button:btn?.isConnected?btn:null,message:opt.label||label(url,btn),read:!!opt.read,slow:false,done:false,slowTimer:null,buttonWasDisabled:buttons.get(btn)?.disabled??!!btn?.disabled,suspendedButton:false};
    active.set(ticket.id,ticket);if(!ticket.read)lastFinished=null;
    if(scope==='button')setButton(ticket.button,true,ticket.message);
    else {if(ticket.button){if(buttons.has(ticket.button)){ticket.button.classList.remove('bom345-button-busy');ticket.suspendedButton=true}ticket.button.disabled=true}updateHost(host)}
    ticket.slowTimer=setTimeout(()=>{if(!active.has(ticket.id))return;ticket.slow=true;if(scope==='button')updateButtonLabel(ticket.button,'Still working…');else updateHost(host)},3500);
    return ticket;
  }
  function end(ticket){if(!ticket||ticket.done)return;ticket.done=true;clearTimeout(ticket.slowTimer);active.delete(ticket.id);if(!ticket.read)lastFinished={id:ticket.id,at:Date.now(),success:false};
    if(ticket.scope==='button'){setButton(ticket.button,false)}else{if(ticket.button?.isConnected){if(ticket.suspendedButton&&buttons.has(ticket.button))ticket.button.classList.add('bom345-button-busy');if(!([...active.values()].some(x=>x.button===ticket.button)))ticket.button.disabled=ticket.buttonWasDisabled}updateHost(ticket.host)}
  }
  // Single success channel: keep actionable failures, remove duplicated progress and identical/second success notices.
  const baseToast=window.toast;
  if(typeof baseToast==='function'){
    const coordinatedToast=function(message){const text=String(message??'').trim(),now=Date.now();if(!text)return;
      const progress=/^(?:processing|saving|working|still working|recording payment|처리 중|저장 중|계속 처리 중|결제 기록 중)/i.test(text);
      if(progress&&(active.size>0||lastFinished&&now-lastFinished.at<600))return;
      const prior=recentToasts.get(text);if(prior&&now-prior<2300)return;
      const error=/(?:error|failed|cannot|invalid|required|denied|unable|not allowed|실패|오류|필수|권한 없음)/i.test(text);
      const success=/(?:saved|completed|updated|created|recorded|verified|approved|successful|success|sent|posted|allocated|requested|archived|restored|deleted|cancelled|transferred|저장됨|완료|기록됨|승인됨)/i.test(text);
      if(success&&!error&&lastFinished&&now-lastFinished.at<1100){if(lastFinished.success)return;lastFinished.success=true}
      recentToasts.set(text,now);if(recentToasts.size>45)for(const [key,at]of recentToasts)if(now-at>2300)recentToasts.delete(key);
      return baseToast.call(this,message);
    };window.toast=coordinatedToast;try{toast=coordinatedToast}catch(_){ }
  }
  window.BOMFeedback={version:'30.45.0',begin,end,scopeFor,isActive:()=>active.size>0,hasMutation:()=>[...active.values()].some(x=>!x.read),diagnostics:()=>({active:active.size,visible_surfaces:overlays.size,legacy_network_banner_enabled:false})};
  console.info('Blue Ocean Market V30.45.0 unified action feedback loaded');
})();
