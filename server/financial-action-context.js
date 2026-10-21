// A live, authenticated user mutation is required for financial cancellation/reversal.
'use strict';
const {AsyncLocalStorage}=require('async_hooks'),scope=new AsyncLocalStorage();
exports.middleware=(req,res,next)=>scope.run(req,next);
exports.actor=()=>{const req=scope.getStore();return req&&['POST','PUT','PATCH','DELETE'].includes(req.method)&&req.user?.id?req.user:null};
// Multipart parsers may resume in their own async resource. Re-enter scope for each
// registered mutation handler so the authenticated request remains the audit actor.
exports.install=app=>{for(const method of ['post','put','patch','delete']){const native=app[method];app[method]=function(path,...handlers){const bind=h=>Array.isArray(h)?h.map(bind):typeof h==='function'&&h.length!==4?function(req,res,next){return scope.run(req,()=>h(req,res,next))}:h;return native.call(this,path,...handlers.map(bind))}}};
