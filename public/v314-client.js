// Blue Ocean Market V30.14 — system-wide Review & Confirm, processing lock and idempotent mutation protection.
(()=>{
  'use strict';
  const VERSION='30.14.0';
  const oldApi=window.api;
  if(typeof oldApi!=='function')return;

  const reviewedHandlers=new Set(['saveFinance','saveFinanceEdit','saveFinanceCorrection','savePurchaseEdit','saveExcavatorBuyerRefund']);
  const noReviewUrls=[/^\/api\/auth\//,/^\/api\/notifications(?:\/|$)/,/^\/api\/me\/language$/,/^\/api\/excavator\/assets\/\d+\/documents(?:\?|$)/,/\/statement-v313\.(?:csv|pdf)(?:\?|$)/,/\/received-pdf-v307(?:\?|$)/,/\/pdf-v308(?:\?|$)/,/\/payslip\.pdf(?:\?|$)/];
  let reviewAllowanceUntil=0,reviewAllowanceCount=0,processingCount=0,lastActionButton=null,lastActionAt=0;

  function tr(v){try{return typeof t==='function'?t(v):String(v)}catch(_){return String(v)}}
  function html(v){try{return typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}catch(_){return String(v??'')}}
  function grantReview(count=8){reviewAllowanceUntil=Date.now()+120000;reviewAllowanceCount=Math.max(reviewAllowanceCount,count)}
  function consumeReview(){if(Date.now()<=reviewAllowanceUntil&&reviewAllowanceCount>0){reviewAllowanceCount--;return true}return false}
  function isMutation(method){return !['GET','HEAD','OPTIONS'].includes(String(method||'GET').toUpperCase())}
  function noReview(url){return noReviewUrls.some(x=>x.test(String(url||'')))}
  function actionTextFromButton(btn){return String(btn?.dataset?.bomActionLabel||btn?.textContent||'').replace(/\s+/g,' ').trim()}
  function meaningfulButton(btn){if(!btn||!btn.isConnected)return null;return btn}

  function ensureUi(){
    if(!document.getElementById('bom314Style')){
      const s=document.createElement('style');s.id='bom314Style';s.textContent=`
      .bom314-processing{position:fixed;inset:0;z-index:13000;background:rgba(8,18,34,.62);display:grid;place-items:center;padding:20px;backdrop-filter:blur(2px)}
      .bom314-processing-card{width:min(430px,92vw);background:#fff;border-radius:18px;padding:26px;text-align:center;box-shadow:0 28px 80px rgba(0,0,0,.32);border:1px solid var(--line)}
      .bom314-spinner{width:46px;height:46px;margin:0 auto 15px;border:4px solid #dce8f6;border-top-color:var(--brand);border-radius:50%;animation:bom314spin .85s linear infinite}
      .bom314-processing-card h3{margin:0 0 7px;font-size:19px}.bom314-processing-card p{margin:0;color:var(--muted);line-height:1.45}
      .bom314-button-busy{position:relative;opacity:.78;cursor:wait!important}.bom314-button-busy:before{content:'';display:inline-block;width:13px;height:13px;margin-right:7px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;vertical-align:-2px;animation:bom314spin .75s linear infinite}
      .bom314-review{width:min(760px,100%)!important}.bom314-review-list{max-height:48vh;overflow:auto;border:1px solid var(--line);border-radius:12px;margin:14px 0}.bom314-review-row{display:grid;grid-template-columns:minmax(150px,.7fr) minmax(0,1.3fr);gap:10px;padding:10px 12px;border-bottom:1px solid var(--line);align-items:start}.bom314-review-row:last-child{border-bottom:0}.bom314-review-row small{color:var(--muted);font-weight:800}.bom314-review-row b{overflow-wrap:anywhere}.bom314-review-row.changed{background:#fff9e9}.bom314-review-change{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}.bom314-review-change .old{color:var(--muted);text-decoration:line-through;font-weight:500}.bom314-review-change .arrow{color:var(--brand);font-weight:900}.bom314-impact{padding:11px 12px;border-radius:10px;background:#eef6ff;color:#1646a0;border:1px solid #cfe2fb;margin:10px 0 14px;line-height:1.45}.bom314-review-note{font-size:12px;color:var(--muted);margin-top:5px}
      @keyframes bom314spin{to{transform:rotate(360deg)}}
      @media(max-width:700px){.bom314-processing{padding:0;align-items:end}.bom314-processing-card{width:100%;max-width:none;border-radius:18px 18px 0 0}.bom314-review-row{grid-template-columns:1fr}.bom314-review-change{grid-template-columns:1fr}.bom314-review-change .arrow{transform:rotate(90deg);justify-self:start}}
      `;document.head.appendChild(s);
    }
    if(!document.getElementById('processingRoot')){const d=document.createElement('div');d.id='processingRoot';document.body.appendChild(d)}
  }

  function processingMessage(url,buttonText=''){
    const hay=(buttonText+' '+String(url||'')).toLowerCase();
    if(/receive.*import|import.*receive|shipment.*receive/.test(hay))return 'Receiving import…';
    if(/production|repack|complete.*batch|batch.*complete/.test(hay))return 'Completing production…';
    if(/payment|receipt|settlement/.test(hay))return 'Recording payment…';
    if(/allocat/.test(hay))return 'Allocating balance…';
    if(/approve|approval/.test(hay))return 'Applying approval…';
    if(/void|delete|cancel|reverse|refund/.test(hay))return 'Processing controlled change…';
    if(/pdf|document|generate/.test(hay))return 'Generating document…';
    if(/update|edit|put|patch/.test(hay))return 'Saving changes…';
    if(/save|create|post|submit/.test(hay))return 'Saving…';
    return 'Processing…';
  }
  function showProcessing(url,buttonText=''){
    ensureUi();processingCount++;
    const root=document.getElementById('processingRoot'),msg=processingMessage(url,buttonText);
    root.innerHTML=`<div class="bom314-processing" role="status" aria-live="polite" aria-busy="true"><div class="bom314-processing-card"><div class="bom314-spinner" aria-hidden="true"></div><h3>${html(tr(msg))}</h3><p>${html(tr('Please wait. Do not close this screen or repeat the action while processing.'))}</p></div></div>`;
    if(typeof translateElement==='function')translateElement(root);
  }
  function hideProcessing(){processingCount=Math.max(0,processingCount-1);if(!processingCount){const root=document.getElementById('processingRoot');if(root)root.innerHTML=''}}
  function markButtonBusy(btn){btn=meaningfulButton(btn);if(!btn)return()=>{};const wasDisabled=btn.disabled;btn.disabled=true;btn.classList.add('bom314-button-busy');return()=>{if(!btn.isConnected)return;btn.disabled=wasDisabled;btn.classList.remove('bom314-button-busy')}}

  function randomKey(){try{return crypto.randomUUID()}catch(_){return 'bom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}}
  function plainBodyDetails(opt={}){
    const body=opt.body,out=[];if(!body)return out;
    if(body instanceof FormData){for(const [k,v] of body.entries()){if(out.length>=18)break;if(v instanceof File){if(v.name)out.push({label:k,value:v.name});continue}if(String(v||'').trim())out.push({label:k,value:String(v)})}return out}
    if(typeof body==='string'){try{const x=JSON.parse(body);if(x&&typeof x==='object')for(const [k,v] of Object.entries(x)){if(out.length>=18)break;if(v===null||v===undefined||v===''||typeof v==='object')continue;out.push({label:k,value:String(v)})}}catch(_){ }return out}
    return out;
  }
  function genericApiReview(url,opt){
    return new Promise(resolve=>{
      const host=document.getElementById('confirmRoot');if(!host)return resolve(false);
      const method=String(opt.method||'POST').toUpperCase(),details=plainBodyDetails(opt),tone=/DELETE|void|cancel|reverse/i.test(method+' '+url)?'danger':'primary';
      host.innerHTML=`<div class="confirm-layer"><div class="confirm-dialog bom314-review" role="dialog" aria-modal="true"><h2>${html(tr('Review & Confirm'))}</h2><p>${html(tr('Review this action before the system changes business data.'))}</p><div class="bom314-impact">${html(tr(impactMessage(actionTextFromButton(lastActionButton),url)))}</div><div class="confirm-details"><div class="confirm-detail"><span>${html(tr('Action'))}</span><b>${html(actionTextFromButton(lastActionButton)||method)}</b></div>${details.slice(0,12).map(x=>`<div class="confirm-detail"><span>${html(prettyLabel(x.label))}</span><b data-no-i18n>${html(x.value)}</b></div>`).join('')}</div><div class="actions"><button class="btn" id="bom314Cancel">${html(tr('Cancel'))}</button><button class="btn ${tone==='danger'?'danger':'primary'}" id="bom314Confirm">${html(tr('Confirm & Continue'))}</button></div></div></div>`;
      if(typeof translateElement==='function')translateElement(host);
      const done=v=>{host.innerHTML='';resolve(v)};host.querySelector('#bom314Cancel').onclick=()=>done(false);host.querySelector('#bom314Confirm').onclick=()=>done(true);host.querySelector('.confirm-layer').onclick=e=>{if(e.target===e.currentTarget)done(false)};
    })
  }

  function prettyLabel(raw){return String(raw||'Field').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
  function fieldLabel(el,index){
    const field=el.closest('.field'),label=field?.querySelector('label')?.textContent?.trim();if(label)return label.replace(/\s*\*\s*$/,'');
    const aria=el.getAttribute('aria-label');if(aria)return aria;
    const ph=el.getAttribute('placeholder');if(ph&&(!el.name||/^q|search$/i.test(el.name)))return ph;
    return el.name?prettyLabel(el.name):`${prettyLabel(el.type||el.tagName)} ${index+1}`;
  }
  function currentValue(el){
    if(el.type==='file')return [...(el.files||[])].map(f=>f.name).join(', ');
    if(el.type==='checkbox')return el.checked?tr('Yes'):tr('No');
    if(el.type==='radio'){if(!el.checked)return null;return el.value||tr('Selected')}
    if(el.tagName==='SELECT')return [...el.selectedOptions].map(o=>o.textContent.trim()).join(', ');
    return String(el.value??'').trim();
  }
  function initialValue(el){
    if(el.type==='file')return '';
    if(el.type==='checkbox')return el.defaultChecked?tr('Yes'):tr('No');
    if(el.type==='radio'){if(!el.defaultChecked)return null;return el.defaultValue||tr('Selected')}
    if(el.tagName==='SELECT')return [...el.options].filter(o=>o.defaultSelected).map(o=>o.textContent.trim()).join(', ');
    return String(el.defaultValue??'').trim();
  }
  function collectForm(form){
    const els=[...form.querySelectorAll('input,select,textarea')].filter(el=>!el.disabled&&el.type!=='hidden'&&el.type!=='submit'&&el.type!=='button'&&el.type!=='reset');
    const rows=[],seen=new Map();
    els.forEach((el,i)=>{const now=currentValue(el);if(now===null)return;const old=initialValue(el);if(!now&&!old&&!el.required)return;let label=fieldLabel(el,i);const count=(seen.get(label)||0)+1;seen.set(label,count);if(count>1)label+=` #${count}`;rows.push({label,now:now||'—',old:old||'—',changed:String(now)!==String(old)})});
    return rows;
  }
  function formTitle(form,submitter){return form.closest('.modal')?.querySelector('h2')?.textContent?.trim()||form.closest('.card')?.querySelector('h2,h3')?.textContent?.trim()||actionTextFromButton(submitter)||tr('Review & Confirm')}
  function impactMessage(action,url=''){
    const hay=(String(action||'')+' '+String(url||'')).toLowerCase();
    if(/receive.*import|import.*receive|receive.*shipment/.test(hay))return 'This will receive the import and update linked stock, supplier settlement and accounting records where applicable.';
    if(/production|repack|complete.*batch|batch.*complete/.test(hay))return 'This will post production output and update linked raw salt, packaging, waste and costing records.';
    if(/payment|receipt|settlement|allocat/.test(hay))return 'This will update linked account balances, receivables/payables and Finance/Accounting records where applicable.';
    if(/sale|order/.test(hay))return 'This may update finished-goods stock, customer receivables/payments and Finance/Accounting records.';
    if(/void|delete|cancel|reverse|refund/.test(hay))return 'This controlled action may reverse or remove linked operational or financial effects according to system safeguards.';
    if(/approve|approval/.test(hay))return 'This will record the decision and may automatically execute the linked controlled action after final approval.';
    return 'The system will save the reviewed business data only after you confirm.';
  }
  function formReview(form,submitter){
    return new Promise(resolve=>{
      const host=document.getElementById('confirmRoot');if(!host)return resolve(false);const rows=collectForm(form),changed=rows.filter(x=>x.changed),hasMeaningfulChanges=changed.length>0,action=actionTextFromButton(submitter)||'Save',title=formTitle(form,submitter);
      const display=(hasMeaningfulChanges?changed:rows).slice(0,45);
      host.innerHTML=`<div class="confirm-layer"><div class="confirm-dialog bom314-review" role="dialog" aria-modal="true"><h2>${html(tr('Review & Confirm'))}</h2><p><b data-no-i18n>${html(title)}</b><br>${html(tr(hasMeaningfulChanges?'Review the changes below before saving.':'Review the information below before saving.'))}</p><div class="bom314-impact">${html(tr(impactMessage(action)))}</div><div class="bom314-review-list">${display.length?display.map(x=>`<div class="bom314-review-row ${x.changed?'changed':''}"><small>${html(x.label)}</small>${x.changed?`<div class="bom314-review-change"><span class="old" data-no-i18n>${html(x.old)}</span><span class="arrow">→</span><b data-no-i18n>${html(x.now)}</b></div>`:`<b data-no-i18n>${html(x.now)}</b>`}</div>`).join(''):`<div class="bom314-review-row"><small>${html(tr('Action'))}</small><b>${html(action)}</b></div>`}</div>${rows.length>display.length?`<div class="bom314-review-note">${html(tr('Only the most relevant fields are shown in this review.'))}</div>`:''}<div class="actions"><button class="btn" id="bom314FormCancel">${html(tr('Back to Edit'))}</button><button class="btn primary" id="bom314FormConfirm">${html(tr('Confirm & Save'))}</button></div></div></div>`;
      if(typeof translateElement==='function')translateElement(host);
      const done=v=>{host.innerHTML='';resolve(v)};host.querySelector('#bom314FormCancel').onclick=()=>done(false);host.querySelector('#bom314FormConfirm').onclick=()=>done(true);host.querySelector('.confirm-layer').onclick=e=>{if(e.target===e.currentTarget)done(false)};
    })
  }

  function handlerName(form){const s=String(form.getAttribute('onsubmit')||'');for(const n of reviewedHandlers)if(s.includes(n+'('))return n;return ''}
  function shouldAutoReviewForm(form){
    if(form.dataset.bomNoReview==='1')return false;
    const action=String(form.getAttribute('action')||'');if(/\/api\/auth\//.test(action))return false;
    const submitText=actionTextFromButton(form.querySelector('[type="submit"],button:not([type])'));
    if(/sign in|login|reset password|create reset link/i.test(submitText))return false;
    if(handlerName(form))return false;
    return true;
  }

  document.addEventListener('click',ev=>{const b=ev.target.closest('button,.btn');if(b){lastActionButton=b;lastActionAt=Date.now()}},true);
  document.addEventListener('submit',ev=>{
    const form=ev.target;if(!(form instanceof HTMLFormElement))return;lastActionButton=ev.submitter||form.querySelector('[type="submit"],button:not([type])')||lastActionButton;lastActionAt=Date.now();
    if(form.dataset.bomReviewBypass==='1'){delete form.dataset.bomReviewBypass;delete form.dataset.bomReviewOpen;return}
    if(!shouldAutoReviewForm(form))return;
    if(form.dataset.bomReviewOpen==='1'){ev.preventDefault();ev.stopImmediatePropagation();return}
    ev.preventDefault();ev.stopImmediatePropagation();form.dataset.bomReviewOpen='1';const submitter=ev.submitter||form.querySelector('[type="submit"],button:not([type])');
    formReview(form,submitter).then(ok=>{if(!ok){delete form.dataset.bomReviewOpen;return}grantReview();form.dataset.bomReviewBypass='1';try{form.requestSubmit(submitter||undefined)}catch(_){delete form.dataset.bomReviewBypass;delete form.dataset.bomReviewOpen;form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))}});
  },true);

  function wrapDecision(name,positive){const fn=window[name];if(typeof fn!=='function')return;window[name]=async function(...args){const r=await fn.apply(this,args);if(positive(r))grantReview();return r}}
  wrapDecision('confirmAction',r=>r===true);wrapDecision('reasonAction',r=>r!==null&&r!==undefined);wrapDecision('choiceAction',r=>r!==null&&r!==undefined);wrapDecision('adjustmentAction',r=>!!r);

  window.api=async function(url,opt={}){
    const method=String(opt.method||'GET').toUpperCase();if(!isMutation(method))return oldApi(url,opt);if(noReview(url))return oldApi(url,opt);
    const actionButton=(Date.now()-lastActionAt<120000)?lastActionButton:null;
    const hasReview=consumeReview();
    if(!hasReview){const ok=await genericApiReview(url,opt);if(!ok)throw new Error(tr('Action cancelled.'));grantReview(1);consumeReview()}
    opt.headers=opt.headers||{};if(!opt.headers['X-Idempotency-Key']&&!opt.headers['x-idempotency-key'])opt.headers['X-Idempotency-Key']=randomKey();
    const restore=markButtonBusy(actionButton),buttonText=actionTextFromButton(actionButton);showProcessing(url,buttonText);
    try{return await oldApi(url,opt)}finally{hideProcessing();restore()}
  };

  ensureUi();
  console.info('Blue Ocean Market V30.14.0 Review & Confirm + processing protection loaded');
})();
