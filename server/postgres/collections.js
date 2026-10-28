'use strict';
// Sequential by design: keep callbacks on a transaction's one checked-out
// client, preserve side-effect order and honor short-circuit operations.
exports.map=async(a,fn,receiver)=>{const out=[];for(let i=0;i<a.length;i++)if(i in a)out[i]=await fn.call(receiver,a[i],i,a);return out};
exports.flatMap=async(a,fn,receiver)=>(await exports.map(a,fn,receiver)).flat();
exports.forEach=async(a,fn,receiver)=>{for(let i=0;i<a.length;i++)if(i in a)await fn.call(receiver,a[i],i,a)};
exports.filter=async(a,fn,receiver)=>{const out=[];for(let i=0;i<a.length;i++)if(i in a&&await fn.call(receiver,a[i],i,a))out.push(a[i]);return out};
exports.some=async(a,fn,receiver)=>{for(let i=0;i<a.length;i++)if(i in a&&await fn.call(receiver,a[i],i,a))return true;return false};
exports.every=async(a,fn,receiver)=>{for(let i=0;i<a.length;i++)if(i in a&&!await fn.call(receiver,a[i],i,a))return false;return true};
exports.find=async(a,fn,receiver)=>{for(let i=0;i<a.length;i++)if(await fn.call(receiver,a[i],i,a))return a[i]};
exports.findIndex=async(a,fn,receiver)=>{for(let i=0;i<a.length;i++)if(await fn.call(receiver,a[i],i,a))return i;return -1};
exports.reduce=async function(a,fn,...initial){let i=0,result;if(initial.length)result=initial[0];else{while(i<a.length&&!(i in a))i++;if(i===a.length)throw TypeError('Reduce of empty array with no initial value');result=a[i++]}for(;i<a.length;i++)if(i in a)result=await fn(result,a[i],i,a);return result};
