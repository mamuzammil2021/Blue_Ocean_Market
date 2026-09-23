// V30.46: single shared child-node dispatcher for audited, idempotent legacy UI enhancers.
// This is NOT a global MutationObserver monkeypatch; permission/sale/account observers stay independent.
(()=>{'use strict';if(window.BOMMutationHub)return;
const handlers=new Map(),errors=new Map();let observer=null,dispatched=0;
function ensure(){if(observer)return;observer=new MutationObserver(records=>{
  for(const record of records){for(const node of record.addedNodes||[]){if(node.nodeType!==1)continue;
    for(const [name,item] of handlers){if(item.root==='body'&&!(document.body?.contains?.(node)||record.target===document.body||document.body?.contains?.(record.target)))continue;
      try{item.callback(node)}catch(e){const n=(errors.get(name)||0)+1;errors.set(name,n);if(n<=2)console.warn('BOM mutation enhancement',name,e)}}dispatched++;
  }}
});observer.observe(document.documentElement,{childList:true,subtree:true});}
function register(name,callback,{root='documentElement'}={}){if(typeof callback!=='function')throw new TypeError('Mutation enhancer callback required');if(handlers.has(name))throw new Error('Duplicate mutation enhancer '+name);handlers.set(name,{callback,root});ensure();return()=>handlers.delete(name)}
window.BOMMutationHub={version:'30.46.0',register,diagnostics:()=>({observers:observer?1:0,handlers:[...handlers.keys()],dispatched_nodes:dispatched,handler_errors:Object.fromEntries(errors)})};
})();
