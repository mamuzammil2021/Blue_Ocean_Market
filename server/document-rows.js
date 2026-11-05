'use strict';
// Optional monetary summaries may be omitted at zero. Ledger lines, totals and
// negative adjustments remain intact; this is a presentation rule only.
const optional=/^(?:discount|tax|vat|additional expenses?|advance applied|payments? recorded|claim credit applied|delivery fee|platform fee|outstanding|할인|세금|부가세|추가 비용|사용한 선급금|선급금 적용|적용 선급금|지급 기록|기록된 지급액|기록된 지급|클레임 크레딧 적용|적용한 클레임 크레딧|적용된 클레임 크레딧|미결제액|배송비|플랫폼 수수료)(?:\s*\([^)]*\))?$/i;
const text=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&[^;]+;/g,'').replace(/\s+/g,' ').trim();
function zero(s){const t=text(s).replace(/,/g,''),n=t.match(/[-−]?\d+(?:\.\d+)?/g);return !!n?.length&&n.every(x=>Number(x.replace('−','-'))===0)}
function compactMoneyRows(html){return String(html).replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi,row=>{const cells=[...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>m[1]);return cells.length===2&&optional.test(text(cells[0]))&&zero(cells[1])?'':row}).replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi,table=>{
 const rows=[...table.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)];if(!rows.length)return table;const head=[...rows[0][0].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)];if(!head.length)return table;
 const omit=head.flatMap((c,i)=>optional.test(text(c[1]))&&rows.slice(1).every(r=>{const cells=[...r[0].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];return cells.length===head.length&&zero(cells[i][1])})?[i]:[]);if(!omit.length)return table;
 return table.replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi,row=>{let i=0;return row.replace(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi,cell=>omit.includes(i++)?'':cell)})
 })}
function install(app){app.use((req,res,next)=>{if(/invoice|\.pdf|\/export|statement/i.test(req.path)){const send=res.send;res.send=function(body){return send.call(this,typeof body==='string'&&/<(?:html|table)\b/i.test(body)?compactMoneyRows(body):body)}}next()})}
module.exports={compactMoneyRows,install};
