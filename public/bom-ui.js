/* Progressive semantic adaptation only. This module never fetches or mutates business data,
 * replaces handlers, routes, form values, permission decisions or dialog controllers. */
(()=>{'use strict';
if(window.BOMUI)return;
let nextId=0,pending=false,hadModal=false,restoreFocus=false,opener=null;
// Supplement the existing controller only when it leaves focus on a removed dialog.
document.addEventListener('click',event=>{if(!document.querySelector('#modalRoot .modal'))opener=event.target.closest('button,a,input,summary');},true);
// Keyboard users can open and close a dialog before the next decoration frame.
document.addEventListener('focusin',event=>{if(event.target.closest?.('#modalRoot .modal'))hadModal=true;});
const pick=(root,selector)=>[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
function decorate(root=document){
 for(const input of pick(root,'#content input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=button]):not([type=submit]),#content textarea,#content select,#modalRoot input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=button]):not([type=submit]),#modalRoot textarea,#modalRoot select')){
  input.classList.add(input.tagName==='SELECT'?'form-select':'form-control');
  if(!input.labels?.length&&!input.getAttribute('aria-label')&&input.placeholder)input.setAttribute('aria-label',input.placeholder);
  const label=input.closest('.field')?.querySelector('label');
  if(label&&!label.htmlFor&&!label.querySelector('input,select,textarea')){if(!input.id)input.id='bom-field-'+(++nextId);label.htmlFor=input.id;}
 }
 for(const table of pick(root,'table.table')){
  for(const th of table.querySelectorAll('th'))if(!th.hasAttribute('scope'))th.scope='col';
  // Preserve table descendants and delegated events. Only uncontained tables need a scroll surface.
  if(!table.closest('.table-wrap,.bom-table-scroll')){const wrap=document.createElement('div');wrap.className='bom-table-scroll';table.before(wrap);wrap.appendChild(table);}
  const wrap=table.closest('.table-wrap,.bom-table-scroll');if(wrap){wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',t('Scrollable table'));}
  for(const row of table.rows){const cell=row.cells[row.cells.length-1];if(cell?.querySelector('button,.btn'))cell.classList.add('bom-actions-cell');}
 }
 for(const nav of pick(root,'.side .nav')){nav.setAttribute('aria-label',t('Main navigation'));}
 for(const button of pick(root,'.side [data-nav-key]')){
  button.setAttribute('aria-current',button.classList.contains('active')?'page':'false');
  const span=button.querySelector('.nav-icon'),key=button.dataset.navKey;
  if(span&&window.BOMUIIcons&&!span.dataset.bomIcon){span.innerHTML=window.BOMUIIcons[iconNames[key]||'layout-dashboard'];span.dataset.bomIcon='1';span.setAttribute('aria-hidden','true');}
 }
 for(const span of pick(root,'.pack-sidebar>summary .nav-icon'))if(window.BOMUIIcons&&!span.querySelector('svg')){span.innerHTML=window.BOMUIIcons.box;span.setAttribute('aria-hidden','true');}
 for(const [selector,key,label] of [['.sidebar-toggle','menu-2','Collapse / expand menu'],['.mobile-menu','menu-2','Open menu'],['.mobile-side-close','x','Close menu'],['.top button[onclick*=logout]','logout','Logout']])for(const button of pick(root,selector))if(window.BOMUIIcons&&!button.querySelector('svg')){button.innerHTML=window.BOMUIIcons[key];button.setAttribute('aria-label',t(label));}
 for(const button of pick(root,'.notif-btn'))if(window.BOMUIIcons&&!button.querySelector('svg')){for(const n of [...button.childNodes])if(n.nodeType===3&&n.nodeValue.includes('🔔'))n.nodeValue=n.nodeValue.replace('🔔','');const icon=document.createElement('span');icon.innerHTML=window.BOMUIIcons.bell;icon.setAttribute('aria-hidden','true');button.prepend(icon);button.setAttribute('aria-label',t('Notifications'));}
 // Icon-only legacy close controls need an accessible name in both languages.
 for(const button of pick(root,'button'))if(/^[×✕✖]$/.test(button.textContent.trim())&&!button.getAttribute('aria-label'))button.setAttribute('aria-label',t('Close'));
 const content=document.getElementById('content');if(content){content.tabIndex=-1;
  const route=window.BOMRouter?.parse?.(),list=!route?.kind;
  content.dataset.bomView=route?.view||'';
  // Operational lists become labeled mobile records; financial journals retain table semantics.
  for(const table of content.querySelectorAll('table.table')){
   const heads=[...table.querySelectorAll('tr:first-child th')].map(n=>n.textContent.trim());
   if(!heads.length)continue;
   const cards=list&&['psImports','psSales','psCustomers','psSuppliers','excavator','excavatorSuppliers','excavatorBuyers','sales','purchases','inventory','documents','tasks','approvals'].includes(route?.view)&&!table.closest('form');
   table.classList.toggle('bom-mobile-records',cards);
   for(const row of table.rows){if(!row.querySelector('td')||row.cells.length!==heads.length)continue;[...row.cells].forEach((cell,i)=>{
    if(cell.dataset.label!==heads[i])cell.dataset.label=heads[i];
    const monetary=/amount|price|cost|balance|payable|receivable|revenue|profit|total|금액|가격|원가|잔액|미지급|미수|매출|이익|합계/i.test(heads[i]);
    cell.classList.toggle('bom-numeric',monetary&&!cell.querySelector('button,input,select'));
   });}
   heads.forEach((label,i)=>table.querySelector('tr:first-child')?.cells[i]?.classList.toggle('bom-numeric',/amount|price|cost|balance|금액|가격|원가|잔액/i.test(label)));
  }
  // Give first-line dashboard indicators stronger weight; secondary numbers stay visible.
  if(route?.view==='dashboard'){
   if(!content.querySelector('[data-bom-currency-note]')){const note=document.createElement('p');note.dataset.bomCurrencyNote='1';note.className='bom-currency-note';note.textContent=t('Financial figures: KRW');content.querySelector('.titlebar')?.after(note);}
   const grids=[...content.querySelectorAll('.grid,.ps-kpis')].filter(n=>n.querySelector(':scope > .stat,:scope > .ps-kpi'));
   grids.forEach((n,i)=>n.classList.toggle('bom-secondary-metrics',i>0));
  }
 }

 const skip=document.getElementById('bomSkipLink');if(skip&&skip.textContent!==t('Skip to content'))skip.textContent=t('Skip to content');
 const hasModal=!!document.querySelector('#modalRoot .modal');if(hadModal&&!hasModal)restoreFocus=true;hadModal=hasModal;
 if(restoreFocus&&!hasModal&&!window.BOMDialogProcessingV363?.isActive()){const active=document.activeElement;if(active===document.body||active===content||!active?.isConnected)(opener?.isConnected?opener:content)?.focus({preventScroll:true});restoreFocus=false;opener=null;}
}
const iconNames={dashboard:'layout-dashboard',businesses:'building',sales:'shopping-cart',purchases:'truck',inventory:'packages',finance:'wallet',accounting:'book',approvals:'checklist',tasks:'clipboard-check',performance:'chart-bar',reports:'file-report',documents:'files',meetings:'calendar',restaurant:'tools-kitchen-2',restaurantTables:'table',excavator:'backhoe',excavatorSuppliers:'building-factory',excavatorBuyers:'users',notifications:'bell',users:'shield-lock',profile:'user',audit:'history',systemSettings:'settings',payroll:'users-group',psSuppliers:'building-factory',psImports:'ship',psRawStock:'packages',psProduction:'assembly',psFinished:'package',psPackaging:'box',psSales:'shopping-cart',psCustomers:'users',psWaste:'recycle',psCommerce:'world'};
const observer=new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length||r.removedNodes.length)&&!pending){pending=true;requestAnimationFrame(()=>{pending=false;decorate();});}});
const skip=document.createElement('a');skip.id='bomSkipLink';skip.className='bom-skip-link';skip.href='#content';skip.textContent=t('Skip to content');skip.addEventListener('click',e=>{e.preventDefault();if(window.BOMDialogProcessingV363?.isActive())return;document.getElementById('content')?.focus({preventScroll:false});});document.body.prepend(skip);
observer.observe(document.body,{childList:true,subtree:true});
decorate();window.BOMUI=Object.freeze({version:'30.70.7',decorate});
})();
