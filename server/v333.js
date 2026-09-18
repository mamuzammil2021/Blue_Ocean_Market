'use strict';
// Blue Ocean Market V30.33.0 — targeted-refresh UI architecture release.
// No schema mutation is required; backend install marker keeps release identity explicit.
const VERSION='30.33.0';
function install(){return {version:VERSION,additive:true,schema_changes:false}}
module.exports={install,VERSION};
