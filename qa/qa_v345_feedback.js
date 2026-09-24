#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const runtime=read('public/runtime-v30392.js'),src=read('public/v345-client.js'),idx=read('public/index.html');
function check(v,name){assert.ok(v,name);console.log('PASS '+name)}
const element=(tag='div')=>{
  const classes=new Set(),attrs=new Map(),obj={tagName:tag.toUpperCase(),children:[],dataset:{},style:{minWidth:''},disabled:false,isConnected:true,innerHTML:'',textContent:'',className:'',
    classList:{add(x){classes.add(x)},remove(x){classes.delete(x)},contains(x){return classes.has(x)}},
    appendChild(node){this.children.push(node);node.parent=this;node.isConnected=true;return node},
    remove(){if(this.parent){this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null}this.isConnected=false},
    setAttribute(k,v){attrs.set(k,String(v))},getAttribute(k){return attrs.has(k)?attrs.get(k):null},removeAttribute(k){attrs.delete(k)},
    getBoundingClientRect(){return {width:112}},querySelector(q){if(q==='[data-bom345-message]')return this.messageNode||(this.messageNode={textContent:''});return null}
  };return obj;
};
let timeouts=new Map(),nextTimer=1;const timers={setTimeout(fn,ms){const n=nextTimer++;timeouts.set(n,{fn,ms});return n},clearTimeout(n){timeouts.delete(n)}};
const modal=element(),content=element(),processing=element(),head=element(),body=element(),toasts=[];
const document={head,body,createElement:element,getElementById(id){if(id==='processingRoot')return processing;return null},querySelector(q){if(q.includes('#modalRoot'))return modal;if(q.includes('#content'))return content;return null}};
const window={toast(msg){toasts.push(msg)}};
const ko={};const context={window,document,KO:ko,t:s=>ko[s]||s,console,...timers};
vm.runInNewContext(src,context,{filename:'v345-client.js'});
const f=window.BOMFeedback;
check(f&&f.version==='30.45.0','new shared coordinator exports V30.52.0');
const b=element('button');b.textContent='Save Buyer';
let x=f.begin('/api/excavator/buyers/8',b);
check(x.scope==='button'&&b.disabled&&b.dataset.bom345Label===ko['Saving…']&&modal.children.length===0,'ordinary Save uses only one button feedback surface');
const slow=[...timeouts.values()].find(v=>v.ms===3500);slow.fn();
check(b.dataset.bom345Label===ko['Still working…']&&b.disabled,'slow response replaces button message without adding a second surface');
f.end(x);check(!b.disabled&&!b.classList.contains('bom345-button-busy')&&!b.dataset.bom345Label,'button fully restores after slow request');
const trans=element('button');trans.textContent='Record Payment';
x=f.begin('/api/excavator/buyers/8/payments',trans);
check(x.scope==='transaction'&&modal.children.length===1&&trans.disabled&&!trans.classList.contains('bom345-button-busy'),'important transaction uses one modal overlay; button disabled without second spinner');
window.toast('Processing…');check(toasts.length===0,'duplicate legacy progress toast suppressed during operation');
const y=f.begin('/api/excavator/buyers/8/payments',element('button'));
check(modal.children.length===1&&f.diagnostics().visible_surfaces===1,'two concurrent requests in same modal share one surface');
f.end(x);check(modal.children.length===1,'first completion does not hide concurrent transaction progress');
f.end(y);check(modal.children.length===0&&f.diagnostics().active===0,'final completion removes modal overlay');
window.toast('Payment recorded');window.toast('Payment recorded');window.toast('Payment completed');
check(toasts.length===1&&toasts[0]==='Payment recorded','same-operation repeated and different success messages collapse to one');
window.toast('Payment failed: invalid account');check(toasts.length===2,'actionable error is not hidden after success');

// A direct fetch may start before a later payment mutation; transition to one overlay with no second button spinner.
const mix=element('button');mix.textContent='Record Payment';
const readOne=f.begin('',mix,{label:'Loading…',read:true}),readTwo=f.begin('',mix,{label:'Loading…',read:true});
check(mix.classList.contains('bom345-button-busy')&&mix.dataset.bom345Label==='Loading…'&&f.hasMutation()===false,'parallel direct reads share one button presentation');
const pay=f.begin('/api/finance/payment',mix);
check(pay.scope==='transaction'&&!mix.classList.contains('bom345-button-busy')&&modal.children.length===1&&f.hasMutation(),'later financial mutation supersedes read button with one overlay');
f.end(readOne);f.end(readTwo);
check(mix.disabled&&!mix.classList.contains('bom345-button-busy'),'completed reads cannot re-enable a pending financial action');
f.end(pay);check(!mix.disabled&&modal.children.length===0,'mixed read/transaction lifecycle fully restores original button state');

const global=f.begin('/api/system-settings-v319/test-reset',element('button'));
check(global.scope==='global'&&processing.children.length===1&&processing.children[0].className==='bom345-global','system reset uses one global overlay');f.end(global);
check(processing.children.length===0,'global overlay releases on completion');
check(f.scopeFor('/api/finance/3/verify',b)==='transaction'&&f.scopeFor('/api/other',b)==='button','finance verification is transactional while standard edits are local');
check(ko['Saving…']==='저장 중…'&&ko['Still working…']==='계속 처리 중…','EN/KO action and slow messages registered');
check(idx.includes('/v345-client.js?v=30.52.0')&&idx.indexOf('/v345-client.js')>idx.indexOf('/v344-client.js'),'V30.45 served after protected V30.44 account actions');
check(runtime.includes('const ticket=feedback?.begin?.(url,actionButton')&&runtime.includes('feedback.end(ticket)'),'Review & Confirm API pipeline delegates presentation to coordinator');
check(runtime.includes('if(window.BOMFeedback){if(chip)chip.remove();return}'),'legacy V30.38 modal chip is suppressed, modal lifecycle retained');
check(runtime.includes('if(active<=0||window.BOMFeedback)return'),'V30.39 network banner no longer overlays action feedback');
check(runtime.includes("window.BOMFeedback.begin('',a.btn,{label:'Loading…',read:true})"),'direct fetches reuse the same feedback coordinator');
check(runtime.includes("!b.closest('#confirmRoot,#processingRoot')"),'confirmation button does not replace actual original action context');
check(runtime.includes("opt.headers['X-Idempotency-Key']=randomKey()")&&runtime.includes('genericApiReview(url,opt)'),'existing idempotency and Review & Confirm preserved');
const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'));
check(pkg.version==='30.52.0'&&lock.version==='30.52.0'&&read('server/server.js').includes("version:'30.52.0'"),'package, lock and server release identity updated');
check(read('REQUIREMENTS_MASTER.md').includes('V30.45.0 Unified Action Feedback'),'master requirements retain new permanent rule');
console.log('V30.45.0 Unified Action Feedback QA: PASS');
