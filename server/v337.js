'use strict';
// Blue Ocean Market V30.37.0 — profile sections, account-management repair and responsive filter UI.
// Additive/no-schema release marker. Existing data and persistent uploads are untouched.
const VERSION='30.37.0';
function install(){return {version:VERSION,additive:true,schema_changes:false,profile_sections:true,account_management_repaired:true,responsive_filter_bar:true}}
module.exports={install,VERSION};
