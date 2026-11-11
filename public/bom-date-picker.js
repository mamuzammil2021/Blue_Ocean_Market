/* Calendar for date-only fields. The native field remains the form value. */
(() => {
  'use strict';
  const dateField='input[type=date]:not([disabled]):not([readonly])';
  let dialog, field, month;
  const local=(en,ko)=>document.documentElement.lang==='ko'?ko:en;
  const iso=date=>date.toISOString().slice(0,10);
  const parse=value=>new Date(value+'T00:00:00Z');
  const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());

  function render() {
    const locale=local('en','ko');
    const heading=new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',timeZone:'UTC'}).format(month);
    dialog.querySelector('h2').textContent=heading;
    const date=new Date(month);
    date.setUTCDate(1-date.getUTCDay());
    const weekdays=new Intl.DateTimeFormat(locale,{weekday:'short',timeZone:'UTC'});
    const grid=dialog.querySelector('.bom-calendar-grid');
    const headers=[], dates=[];
    const probe=document.createElement('input');
    probe.type='date';
    for(const key of ['min','max','step','value'])if(field.hasAttribute(key))probe.setAttribute(key,field.getAttribute(key));
    for(let i=0;i<42;i++){
      const value=iso(date);
      if(i<7)headers.push(`<span class="bom-calendar-weekday">${weekdays.format(date)}</span>`);
      probe.value=value;
      dates.push(`<button type="button" data-date="${value}" aria-label="${value}" aria-pressed="${value===field.value}"
        ${probe.validity.valid?'':'disabled'} class="btn small ${date.getUTCMonth()===month.getUTCMonth()?'':'outside'}">${date.getUTCDate()}</button>`);
      date.setUTCDate(date.getUTCDate()+1);
    }
    grid.innerHTML=headers.join('')+dates.join('');
  }

  function choose(value) {
    if(!field?.isConnected)return;
    const target=field;
    dialog.close();
    if(target.value===value)return;
    target.value=value;
    target.dispatchEvent(new Event('input',{bubbles:true}));
    target.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function open(input) {
    if(!window.HTMLDialogElement?.prototype.showModal||dialog?.open)return false;
    field=input;
    const focused=input.value||today();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(focused))return false;
    month=parse(focused);
    month.setUTCDate(1);
    dialog=document.createElement('dialog');
    dialog.className='bom-calendar';
    dialog.setAttribute('aria-labelledby','bom-calendar-heading');
    dialog.innerHTML=`<div class="bom-calendar-header">
      <button type="button" class="btn small" data-month="-1" aria-label="${local('Previous month','이전 달')}">‹</button>
      <h2 id="bom-calendar-heading" aria-live="polite"></h2>
      <button type="button" class="btn small" data-month="1" aria-label="${local('Next month','다음 달')}">›</button></div>
      <div class="bom-calendar-grid"></div><div class="bom-calendar-footer">
      ${input.required?'':`<button type="button" class="btn small" data-clear>${local('Clear','지우기')}</button>`}
      <button type="button" class="btn small" data-close>${local('Close','닫기')}</button></div>`;
    document.body.append(dialog);
    render();
    dialog.addEventListener('click',event=>{
      const button=event.target.closest('button');
      if(button?.dataset.date)choose(button.dataset.date);
      if(button?.dataset.month){
        month.setUTCMonth(month.getUTCMonth()+Number(button.dataset.month));
        render();
      }
      if(button?.hasAttribute('data-clear'))choose('');
      if(button?.hasAttribute('data-close')||event.target===dialog)dialog.close();
    });
    dialog.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        event.preventDefault();
        event.stopPropagation();
        dialog.close();
        return;
      }
      const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];
      if(!delta||!event.target.dataset.date)return;
      event.preventDefault();
      const date=parse(event.target.dataset.date);
      date.setUTCDate(date.getUTCDate()+delta);
      if(date.getUTCMonth()!==month.getUTCMonth()){
        month=new Date(date);
        month.setUTCDate(1);
        render();
      }
      dialog.querySelector(`[data-date="${iso(date)}"]:not([disabled])`)?.focus();
    });
    dialog.addEventListener('close',()=>{
      dialog.remove();
      dialog=null;
      field=null;
      if(input.isConnected)input.focus({preventScroll:true});
    },{once:true});
    dialog.showModal();
    const box=input.getBoundingClientRect(),height=dialog.offsetHeight;
    const left=Math.min(box.left,innerWidth-dialog.offsetWidth-12);
    const top=box.bottom+height+8<=innerHeight?box.bottom+6:Math.max(12,box.top-height-6);
    dialog.style.left=Math.max(12,left)+'px';
    dialog.style.top=top+'px';
    dialog.querySelector(`[data-date="${focused}"]:not([disabled])`)?.focus();
    return true;
  }

  document.addEventListener('click',event=>{
    const input=event.target;
    if(!input.matches?.(dateField))return;
    const box=input.getBoundingClientRect();
    if(event.clientX>=box.right-36&&open(input))event.preventDefault();
  },true);
  document.addEventListener('keydown',event=>{
    if(event.altKey&&event.key==='ArrowDown'&&event.target.matches?.(dateField)&&open(event.target))event.preventDefault();
  },true);
})();
