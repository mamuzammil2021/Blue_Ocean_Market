'use strict';
// Blue Ocean Market V30.36.0 — complete browser button audit & UX hardening.
// Additive/no-schema release marker. No database mutation is required.
const VERSION='30.36.0';
function install(){return {version:VERSION,additive:true,schema_changes:false,browser_button_audit:true}}
module.exports={install,VERSION};
