// V30.48: Bell preview retrieves one bounded page, never the whole notification history.
(function(){'use strict';
window.toggleNotifs=async function(){if(document.getElementById('notifDialog')){closeNotifDialog();return}
 try{const d=await api('/api/v348/notifications/feed?pageSize=25&status=unread'),n=d.rows||[],unreadRows=n.filter(x=>!x.read_at),readRows=n.filter(x=>x.read_at),wrap=document.createElement('div');
 wrap.id='notifDialog';wrap.className='modal-bg';
 wrap.innerHTML=`<div class="modal" style="max-width:620px"><div class="section-title"><div><h2 style="margin:0">${esc(t('Notifications'))}</h2><div class="muted">${Number(d.unread_total||0)} ${esc(t('unread notifications'))}</div></div><button class="btn" type="button" onclick="closeNotifDialog()">✕</button></div><div style="max-height:60vh;overflow:auto;margin-top:12px">${unreadRows.length?`<div class="notification-group-title">${esc(t('Unread Notifications'))}</div>${unreadRows.map(notificationCardHtml).join('')}`:''}${readRows.length?`<div class="notification-group-title read-group">${esc(t('Earlier Notifications'))}</div>${readRows.map(notificationCardHtml).join('')}`:''}${!n.length?`<div class="empty">${esc(t('No notifications.'))}</div>`:''}</div><div class="actions" style="margin-top:12px"><button class="btn primary" type="button" onclick="closeNotifDialog();go('notifications')">${esc(t('View all notifications'))}</button></div></div>`;
 document.body.appendChild(wrap);translateElement(wrap);wrap.onclick=ev=>{if(ev.target===wrap)closeNotifDialog()};
 }catch(e){toast(e.message)}};
try{toggleNotifs=window.toggleNotifs}catch(_){}
})();
