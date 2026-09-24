// V30.48 — selective smart feed: notifications only. Financial/audit/work queues retain pages.
(function(){'use strict';
const legacy=window.notificationsView;const MAX_DOM_ROWS=250;
let epoch=0,observer=null,fetching=false,flightEpoch=0,cursor=null,more=false,count=0,shown=new Set(),renderedRead=false,mode='feed',scope='';
try{Object.assign(KO,{'Load more notifications':'알림 더 보기','Loading more notifications…':'알림을 더 불러오는 중…','Could not load more notifications.':'추가 알림을 불러오지 못했습니다.','Continue in paged view':'페이지 목록에서 계속 보기','Use scroll feed':'스크롤 알림 목록 사용','Notifications are loaded as you scroll.':'스크롤하면 알림을 추가로 불러옵니다.','Showing notifications':'표시된 알림','No matching notifications.':'일치하는 알림이 없습니다.','Loading notifications…':'알림 불러오는 중…','Older notifications':'이전 알림','Notifications':'알림'})}catch(_){}
const e=s=>esc(t(s));
function identity(){return String(me?.id||'')+'|'+String(selectedUnitId||me?.business_unit_id||'')}
function stop(){if(observer){observer.disconnect();observer=null}}
function alive(id){return id===epoch&&view==='notifications'&&identity()===scope&&!!document.getElementById('v348-items')}
function status(message,retry=false){const el=document.getElementById('v348-status');if(el)el.innerHTML=`<span>${e(message)}</span>${retry?` <button class="btn small" type="button" onclick="v348LoadMore()">${e('Retry')}</button>`:''}`}
function controls(){const el=document.getElementById('v348-controls');if(!el)return;stop();
  if(count>=MAX_DOM_ROWS&&more){el.innerHTML=`<div class="muted">${e('Showing notifications')}: ${count}</div><button class="btn" type="button" onclick="v348UsePages()">${e('Continue in paged view')}</button>`;status('');return}
  if(!more){el.innerHTML='';status('');return}
  el.innerHTML=`<button type="button" class="btn small" id="v348-more" onclick="v348LoadMore()">${e('Load more notifications')}</button><div id="v348-sentinel" aria-hidden="true" style="height:1px"></div>`;
  if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting))v348LoadMore()},{rootMargin:'360px 0px'});observer.observe(document.getElementById('v348-sentinel'))}
}
function row(item){const id=Number(item.id)||0;if(!id||shown.has(id))return'';shown.add(id);const isRead=!!item.read_at;let heading='';
  if(isRead&&!renderedRead){heading=`<div class="notification-group-title read-group">${e('Earlier Notifications')}</div>`;renderedRead=true}
  const dest=esc(JSON.stringify(String(item.action_view||''))),action=Number(item.action_id)||0;
  return heading+`<div class="notif card ${isRead?'notification-read':'notification-unread'} v348-notif" data-notification-id="${id}" style="margin-bottom:10px;content-visibility:auto;contain-intrinsic-size:auto 140px"><span class="pill ${item.level==='critical'?'bad':item.level==='warning'?'warn':'blue'}">${e(item.level||'info')}</span>${isRead?'':` <span class="pill warn">${e('Unread')}</span>`} <b>${e(item.title||'Notification')}</b><div class="muted">${e(item.message||'')}</div><div class="muted" data-no-i18n>${esc(item.created_at||'')}</div>${item.action_view?`<button class="btn small primary" type="button" onclick="notificationNavigate(${dest},${action})">${e('Open related record')}</button>`:''}${isRead?'':` <button class="btn small" type="button" onclick="readNotif(${id})">${e('Mark read')}</button>`}</div>`;
}
async function loadMore(){if(fetching||!alive(epoch)||!more||count>=MAX_DOM_ROWS)return;const id=epoch;fetching=true;flightEpoch=id;status('Loading more notifications…');const st=bom346Lists.notifications;
  const q=new URLSearchParams({pageSize:'25',search:st.search||'',status:st.status||'all'});if(cursor)q.set('cursor',cursor);
  try{const d=await api('/api/v348/notifications/feed?'+q);if(!alive(id))return;
    const host=document.getElementById('v348-items');if(!host)return;
    const html=(d.rows||[]).map(row).join('');if(html)host.insertAdjacentHTML('beforeend',html);
    count=shown.size;cursor=d.next_cursor||null;more=!!d.has_more&&!!cursor;
    const badge=document.getElementById('v348-unread');if(badge){badge.textContent=Number(d.unread_total||0);badge.style.display=Number(d.unread_total||0)?'inline-flex':'none'}
    const total=document.getElementById('v348-total');if(total)total.textContent=`${e('Showing notifications')}: ${count} ${e('of')} ${Number(d.total||0)}`;
    if(!count)host.innerHTML=`<div class="empty">${e('No matching notifications.')}</div>`;
    try{translateElement(host)}catch(_){}controls();
  }catch(err){if(alive(id)){stop();status('Could not load more notifications. '+String(err?.message||''),true)}}finally{if(flightEpoch===id)fetching=false}}
async function feed(c){stop();epoch++;const id=epoch;fetching=false;flightEpoch=0;cursor=null;more=true;count=0;shown=new Set();renderedRead=false;scope=identity();const st=bom346Lists.notifications;
  c.innerHTML=title('Notifications & Alerts','Unread notifications appear first. Each group is sorted newest first.')+`<form class="card" onsubmit="v348Filter(event)"><div class="grid g3"><label>${e('Search')}<input name="search" value="${esc(st.search||'')}" placeholder="${e('Search notifications')}"></label><label>${e('Status')}<select name="status">${['all','unread','read'].map(x=>`<option value="${x}" ${st.status===x?'selected':''}>${e(x==='all'?'All':x==='unread'?'Unread':'Read')}</option>`).join('')}</select></label><button class="btn primary" type="submit">${e('Apply Filters')}</button></div></form><section class="card"><div class="section-title"><h3>${e('Notifications')}</h3><span id="v348-unread" class="pill warn" style="display:none"></span></div><div class="muted">${e('Notifications are loaded as you scroll.')}</div><div id="v348-items"></div><div id="v348-total" class="muted" style="margin-top:10px"></div><div id="v348-status" role="status" aria-live="polite" class="muted" style="margin:10px 0"></div><div id="v348-controls"></div></section>`;
  try{translateElement(c)}catch(_){}if(id===epoch)await loadMore();
}
async function paged(c){stop();epoch++;flightEpoch=0;fetching=false;await legacy(c);if(view==='notifications'){const target=c.querySelector('.titlebar')||c;target.insertAdjacentHTML('afterend',`<div class="actions" style="margin:8px 0"><button class="btn small" onclick="v348UseFeed()">${e('Use scroll feed')}</button></div>`)}}
window.v348Filter=function(ev){ev.preventDefault();const data=new FormData(ev.target),st=bom346Lists.notifications;st.search=String(data.get('search')||'').trim().slice(0,100);st.status=['all','unread','read'].includes(data.get('status'))?data.get('status'):'all';st.page=1;mode='feed';return feed(document.getElementById('content'))};
window.v348LoadMore=()=>loadMore();
window.v348UsePages=()=>{mode='pages';bom346Lists.notifications.page=1;return paged(document.getElementById('content'))};
window.v348UseFeed=()=>{mode='feed';return feed(document.getElementById('content'))};
window.notificationsView=function(c=document.getElementById('content')){if(scope&&scope!==identity())mode='feed';return mode==='pages'?paged(c):feed(c)};
try{notificationsView=window.notificationsView}catch(_){}
window.BOMSmartNotifications348={version:'30.49.0',max_dom_rows:MAX_DOM_ROWS,diagnostics:()=>({mode,loaded:count,has_more:more,fetching,scope_active:scope===identity()})};
})();
