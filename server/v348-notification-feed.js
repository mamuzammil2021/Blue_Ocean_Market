'use strict';
// V30.48: opt-in keyset feed for the notification card workspace only.
// Auth, selected-BU scope, current user and legacy paged routes remain authoritative.
const crypto=require('node:crypto');
const MAX_CURSOR=512;
const SORT_GROUP='CASE WHEN read_at IS NULL THEN 0 ELSE 1 END';
function pageSize(input){return [25,50].includes(Number(input))?Number(input):25}
function fingerprint(req,status,search){
  return crypto.createHash('sha256').update(JSON.stringify([req.user.id,req.selected_business_unit_id||null,req.user.business_unit_id||null,status,search])).digest('hex').slice(0,20);
}
function makeCursor(row,key){return Buffer.from(JSON.stringify({g:row.read_at?1:0,at:row.created_at,id:row.id,k:key})).toString('base64url')}
function parseCursor(raw,key){
  if(!raw)return null;
  if(typeof raw!=='string'||raw.length>MAX_CURSOR||!/^[A-Za-z0-9_-]+$/.test(raw))throw new Error('Invalid feed cursor');
  let o;try{o=JSON.parse(Buffer.from(raw,'base64url').toString('utf8'))}catch(_){throw new Error('Invalid feed cursor')}
  if(!o||o.k!==key||![0,1].includes(o.g)||!Number.isSafeInteger(o.id)||o.id<1||typeof o.at!=='string'||o.at.length>40||!/^[0-9TZ: .+\-]+$/.test(o.at))throw new Error('Feed filter or scope changed; restart the feed');
  return o;
}
function install({app,db,auth,notificationUnitScope}){
  try{db.exec('CREATE INDEX IF NOT EXISTS idx_v348_notif_feed ON notifications(user_id,business_unit_id,read_at,created_at DESC,id DESC)')}catch(e){console.warn('V30.48 notification read index:',e.message)}
  app.get('/api/v348/notifications/feed',auth,(req,res)=>{try{
    const scope=notificationUnitScope(req),size=pageSize(req.query.pageSize),search=String(req.query.search||'').trim().slice(0,100),status=['all','unread','read'].includes(req.query.status)?req.query.status:'all';
    const key=fingerprint(req,status,search),cursor=parseCursor(req.query.cursor,key);
    let where=`(user_id IS NULL OR user_id=?)${scope.sql}`,args=[req.user.id,...scope.args];
    if(status!=='all')where+=status==='unread'?' AND read_at IS NULL':' AND read_at IS NOT NULL';
    if(search){where+=' AND (title LIKE ? OR message LIKE ?)';args.push(`%${search}%`,`%${search}%`)}
    // Counts are across the FULL authorized scope, not just downloaded cards.
    const total=db.prepare(`SELECT COUNT(*) n FROM notifications WHERE ${where}`).get(...args).n;
    const unreadTotal=db.prepare(`SELECT COUNT(*) n FROM notifications WHERE (user_id IS NULL OR user_id=?)${scope.sql} AND read_at IS NULL`).get(req.user.id,...scope.args).n;
    let extra='',listArgs=[...args];
    if(cursor){extra=` AND (${SORT_GROUP}>? OR (${SORT_GROUP}=? AND (created_at<? OR (created_at=? AND id<?))))`;listArgs.push(cursor.g,cursor.g,cursor.at,cursor.at,cursor.id)}
    const rows=db.prepare(`SELECT * FROM notifications WHERE ${where}${extra} ORDER BY ${SORT_GROUP},created_at DESC,id DESC LIMIT ?`).all(...listArgs,size+1);
    const hasMore=rows.length>size,items=rows.slice(0,size),last=items[items.length-1];
    res.json({rows:items,total,unread_total:unreadTotal,has_more:hasMore,next_cursor:hasMore&&last?makeCursor(last,key):null,page_size:size});
  }catch(e){if(/cursor|scope changed/i.test(e.message||''))return res.status(400).json({error:e.message});console.error('V30.48 notification feed',e);return res.status(500).json({error:'Unable to load notifications'})}});
}
module.exports={install,makeCursor,parseCursor,pageSize,fingerprint};
