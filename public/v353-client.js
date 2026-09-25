// Blue Ocean Market V30.53.0 — targeted QA corrections layered on protected V30.52.0.
(() => {
  'use strict';
  const VERSION='30.53.0';
  const translate=s=>typeof t==='function'?t(s):s;
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  try { Object.assign(KO,{
    'e.g., Kim Min-su':'예: 김민수',
    'e.g., KB Kookmin Bank':'예: KB국민은행',
    'e.g., South Korea':'예: 대한민국',
    'Payment reference check unavailable. Retry.':'결제 참조 확인에 실패했습니다. 다시 시도하세요.',
    'Unable to check payment reference. Retry.':'결제 참조를 확인할 수 없습니다. 다시 시도하세요.',
    'Read':'읽음', 'Recording payment…':'결제 기록 중…',
    'Your transaction is being recorded. Do not submit it again.':'거래를 기록하고 있습니다. 다시 제출하지 마세요.',
    'Details updated successfully.':'정보가 성공적으로 업데이트되었습니다.'
  }); } catch(_) {}
  const style=document.createElement('style');style.id='bom353-style';style.textContent=`
    /* Native selectors replace the V30.38 mirrored picker, retaining the real FormData account IDs. */
    #v324WorkflowSurface select[name="token_payment_account_id"],
    #v324WorkflowSurface select[name="token_receiver_account_id"]{position:static!important;width:100%!important;height:auto!important;min-height:43px!important;opacity:1!important;pointer-events:auto!important;visibility:visible!important}
    #v324WorkflowSurface .v3382-account-picker{display:none!important}
    .bom353-success{display:flex;align-items:flex-start;gap:11px;max-width:min(520px,calc(100vw - 30px));padding:14px 16px;border:1px solid #16a34a;border-radius:12px;background:#fff;color:#163e2c;box-shadow:0 9px 25px rgba(18,52,39,.12);font-weight:650;line-height:1.4}
    .bom353-success-icon{display:grid;place-items:center;width:23px;height:23px;border:2px solid #16a34a;border-radius:50%;color:#15803d;flex:none;font-size:15px;font-weight:800}
    .bom353-success-text{flex:1;min-width:0}
    .notification-read{background:#fafbfc!important;border-color:#e4e9f0!important;box-shadow:none!important}
    .notification-read .pill.warn{display:none!important}
    .bom353-account-manager{pointer-events:auto!important}
    .modal[data-v3382-processing="1"] .v3382-processing-chip{display:none!important}
    [data-bom353-protected="1"]{position:relative!important}
    .bom353-payment-overlay{position:absolute;inset:0;z-index:155;background:rgba(255,255,255,.89);border-radius:inherit;display:grid;place-items:center;padding:20px;cursor:progress}
    .bom353-payment-panel{display:grid;justify-items:center;gap:10px;text-align:center;max-width:390px;color:#25354c;font-weight:650}
    .bom353-payment-spinner{height:28px;width:28px;border:3px solid #dae7f6;border-top-color:#2563b8;border-radius:50%;animation:bom314spin .85s linear infinite}
    @media(max-width:650px){.bom353-success{padding:12px 13px}}
  `;document.head.appendChild(style);

  // Origin-aware Buyer edit: list stays on list, profile stays on profile.
  document.addEventListener('click',ev=>{
    const b=ev.target.closest?.('button[onclick*="excavatorBuyerForm("]');
    if(!b)return;
    window.__BOMBuyerEditOriginV353=b.closest('#v324WorkflowSurface')?'profile':'list';
  },true);

  // The final token account manager action must not match old overlapping capture handlers.
  document.addEventListener('click',ev=>{
    const b=ev.target.closest?.('[data-v353-manage-payee]');if(!b)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const f=b.closest('form')||document.querySelector('#v324WorkflowSurface form[onsubmit*="saveSimpleExcavatorMachine"]');
    const id=Number(f?.querySelector('[name="supplier_id"]')?.value||0);
    if(!id){toast(translate('Select an existing supplier first. For a new supplier, enter the receiver account below.'));return;}
    const supplier=(window._buySuppliers||[]).find(x=>Number(x.id)===id);
    const manager=window.openCounterpartyAccountsV338||window.managePayeeAccountsV330;
    if(typeof manager!=='function'){toast(translate('Account manager is unavailable. Refresh the screen and try again.'));return;}
    manager('excavator_supplier',id,supplier?.name||f?.querySelector('[name="supplier_name"]')?.value||'Supplier');
  },true);

  // Contextual single success surface; leave V30.45 feedback and errors intact.
  const baseToast=window.toast,last=new Map();
  const positive=/(?:saved|completed|updated|created|recorded|verified|approved|successful|success|posted|allocated|archived|restored|transferred|저장|완료|기록|승인)/i;
  const negative=/(?:failed|cannot|invalid|required|denied|unable|error|warning|skipped|pending|not available|실패|오류|필수|보류)/i;
  if(typeof baseToast==='function'){
    const nextToast=function(message){const text=String(translate(message)||'').trim();if(!text)return;
      if(!positive.test(text)||negative.test(text))return baseToast.apply(this,arguments);
      const now=Date.now(),prior=last.get(text)||0;if(now-prior<2500)return;last.set(text,now);
      if(last.size>30)for(const [k,v]of last)if(now-v>6000)last.delete(k);
      const root=document.getElementById('toastRoot');if(!root)return baseToast.apply(this,arguments);
      const el=document.createElement('div');el.className='toast bom353-success';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
      el.innerHTML=`<span class="bom353-success-icon" aria-hidden="true">✓</span><span class="bom353-success-text">${escape(text)}</span>`;
      root.appendChild(el);setTimeout(()=>el.remove(),4700);return el;
    };window.toast=nextToast;try{toast=nextToast}catch(_){}
  }

  // Shared mark-read lifecycle: no modal remount, list requery, scroll reset, or item removal.
  const reads=new Set();
  function styleRead(id){
    const cards=[...document.querySelectorAll(`[data-notification-id="${id}"]`)];
    for(const card of cards){card.classList.remove('notification-unread');card.classList.add('notification-read');
      card.querySelectorAll('button').forEach(b=>{if(/\bmark read\b|읽음으로 표시/i.test((b.textContent||'').toLowerCase()))b.remove()});
      const badge=[...card.querySelectorAll('.pill')].find(b=>/^(unread|읽지 않음)$/i.test((b.textContent||'').trim()));
      if(badge){badge.classList.remove('warn');badge.textContent=translate('Read')}
    }
    const bell=document.getElementById('notifDialog');if(bell){const unread=bell.querySelectorAll('.notification-unread').length;
      const label=bell.querySelector('.section-title .muted');if(label)label.textContent=`${unread} ${translate('unread notifications')}`;
    }
    const count=document.getElementById('v348-unread');if(count){const value=Math.max(0,(Number(count.textContent)||0)-1);count.textContent=value;count.style.display=value?'inline-flex':'none'}
  }
  const originalRead=window.readNotif;
  const read353=async function(id){id=Number(id||0);if(!id||reads.has(id))return false;reads.add(id);
    const buttons=[...document.querySelectorAll(`[data-notification-id="${id}"] button`)].filter(b=>/mark read|읽음으로 표시/i.test(b.textContent||''));
    buttons.forEach(b=>b.disabled=true);
    try{await api('/api/notifications/'+id+'/read',{method:'PUT'});styleRead(id);
      await Promise.allSettled([typeof refreshNotifCount==='function'?refreshNotifCount():null,typeof refreshActionCounts==='function'?refreshActionCounts():null]);return true;
    }catch(err){buttons.forEach(b=>{if(b.isConnected)b.disabled=false});toast(err?.message||translate('Unable to mark notification as read.'));return false;
    }finally{reads.delete(id)}
  };window.readNotif=read353;try{readNotif=read353}catch(_){}
  const originalNavigate=window.notificationNavigate;
  if(typeof originalNavigate==='function'){
    const navigate353=async function(target,actionId,notificationId){
      if(Number(notificationId)>0)await read353(notificationId);
      return originalNavigate.call(this,target,actionId);
    };window.notificationNavigate=navigate353;try{notificationNavigate=navigate353}catch(_){}
  }

  // Payment single-flight and protected modal lifecycle. Existing V30.45 scoped
  // feedback remains the one visible progress surface; this guard does not add a second banner.
  const paymentRoute=/(?:\/payments?(?:\/|$)|\/refunds?(?:\/|$)|\/account-transfers|\/inter-unit-transfers|\/pakistan-korea|\/complete-sale|\/resale-payments?|\/orders\/\d+\/close)(?:\?|$|\/)/i;
  const paymentFlights=new WeakMap();
  const protectedForms=new Set();
  const api353Previous=window.api;
  if(typeof api353Previous==='function'){
    const guardedApi=async function(url,opt={}){
      const method=String(opt?.method||'GET').toUpperCase();
      if(['GET','HEAD','OPTIONS'].includes(method)||!paymentRoute.test(String(url||''))&&!(/\/api\/excavator\/assets(?:\?|$)/.test(String(url||''))&&Number(document.querySelector('#v324WorkflowSurface [name="purchase_token"]')?.value||0)>0))return api353Previous.apply(this,arguments);
      const f=document.querySelector('#modalRoot form[onsubmit],#v324WorkflowSurface form[onsubmit*="Sale"],#v324WorkflowSurface form[onsubmit*="Machine"]');
      if(!f)return api353Previous.apply(this,arguments);
      if(paymentFlights.has(f))return paymentFlights.get(f);
      const host=f.closest('.modal')||f.closest('#v324WorkflowSurface');
      const controls=[...f.querySelectorAll('button,input,select,textarea')].map(el=>[el,el.disabled]);
      const key=f.dataset.bom353PaymentKey||(f.dataset.bom353PaymentKey='v353-'+(crypto.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2)));
      opt.headers=opt.headers||{};
      if(!opt.headers['X-Idempotency-Key']&&!opt.headers['x-idempotency-key'])opt.headers['X-Idempotency-Key']=key;
      protectedForms.add(f);if(host){host.dataset.bom353Protected='1';host.setAttribute('aria-busy','true')}
      for(const [el]of controls)if(el.type!=='hidden')el.disabled=true;
      // Existing V30.45 scoped overlay remains primary. Add a fallback only if absent.
      let fallback=null;const feedbackTimer=setTimeout(()=>{if(!host?.isConnected||!protectedForms.has(f)||host.querySelector('.bom345-progress,.bom345-global,[data-bom353-payment-overlay]'))return;fallback=document.createElement('div');fallback.className='bom353-payment-overlay';fallback.dataset.bom353PaymentOverlay='1';fallback.setAttribute('role','status');fallback.setAttribute('aria-live','polite');fallback.innerHTML='<div class="bom353-payment-panel"><span class="bom353-payment-spinner" aria-hidden="true"></span><span>'+escape(translate('Recording payment…'))+'</span><small>'+escape(translate('Your transaction is being recorded. Do not submit it again.'))+'</small></div>';host.appendChild(fallback)},120);
      const flight=(async()=>{
        try{const result=await api353Previous.call(this,url,opt);f.dataset.bom353Committed='1';return result}
        catch(err){if(!/timed out|failed to fetch|network|connection|fetch failed/i.test(err?.message||''))delete f.dataset.bom353PaymentKey;throw err}
        finally{clearTimeout(feedbackTimer);fallback?.remove();protectedForms.delete(f);if(f.dataset.bom353Committed!=='1')paymentFlights.delete(f);if(host){delete host.dataset.bom353Protected;host.removeAttribute('aria-busy')}
          for(const [el,wasDisabled]of controls)if(el.isConnected)el.disabled=wasDisabled;}
      })();paymentFlights.set(f,flight);return flight;
    };
    window.api=guardedApi;try{api=guardedApi}catch(_){}
  }
  const closeBefore353=window.closeModal;
  if(typeof closeBefore353==='function'){
    const close353=function(force=false){if(!force&&[...protectedForms].some(f=>f.isConnected&&f.closest('#modalRoot')))return false;return closeBefore353.apply(this,arguments)};
    window.closeModal=close353;try{closeModal=close353}catch(_){}
  }
  document.addEventListener('click',ev=>{if(!protectedForms.size)return;
    const b=ev.target.closest?.('button,a');if(!b)return;
    if([...protectedForms].some(f=>{const host=f.closest('.modal')||f.closest('#v324WorkflowSurface');return host?.contains(b)})){
      ev.preventDefault();ev.stopImmediatePropagation();}
  },true);
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&protectedForms.size){ev.preventDefault();ev.stopImmediatePropagation()}},true);

  // Source-level toolbar reconciliation for legacy enhancers that can both inject the return button.
  let queued=false;
  const reconcile=()=>{queued=false;const c=document.getElementById('content');if(!c||view!=='accounting')return;
    const buttons=[...c.querySelectorAll('button')].filter(x=>/back to simple view|간단 보기로 돌아가기/i.test(x.textContent||''));
    buttons.slice(1).forEach(x=>x.remove());
    if(/accounting posting control/i.test(c.querySelector('h1,h2')?.textContent||''))c.querySelectorAll('[data-v332-posting]').forEach(x=>x.remove());
  };
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(reconcile)}).observe(document.getElementById('content')||document.body,{subtree:true,childList:true});
  setTimeout(reconcile,0);
  window.__BOM_V353={version:VERSION,read_in_place:true,native_token_selects:true,contextual_success:true};
})();
