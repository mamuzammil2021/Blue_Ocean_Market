'use strict';
const DEFAULT_SIZE=25;
const ALLOWED_SIZES=new Set([25,50,100]);
function parsePaging(req,{defaultSize=DEFAULT_SIZE,maxSize=100}={}){
  const rawSize=Number(req.query?.pageSize??req.query?.page_size??defaultSize);
  const size=ALLOWED_SIZES.has(rawSize)?rawSize:Math.min(maxSize,Math.max(1,Number.isFinite(rawSize)?rawSize:defaultSize));
  const page=Math.max(1,Math.floor(Number(req.query?.page)||1));
  return {page,pageSize:size,limit:size,offset:(page-1)*size};
}
function normalizeSort(raw,allowed,fallback){const key=String(raw||'').trim();return Object.prototype.hasOwnProperty.call(allowed,key)?allowed[key]:fallback}
function sendPaged(res,rows,total,{page,pageSize}){
  const count=Math.max(0,Number(total)||0),pages=Math.max(1,Math.ceil(count/pageSize));
  res.setHeader('X-Total-Count',String(count));res.setHeader('X-Page',String(page));res.setHeader('X-Page-Size',String(pageSize));
  return res.json({rows,pagination:{page,page_size:pageSize,total:count,pages,from:count?((page-1)*pageSize+1):0,to:Math.min(count,page*pageSize)}});
}
module.exports={DEFAULT_SIZE,ALLOWED_SIZES,parsePaging,normalizeSort,sendPaged};
