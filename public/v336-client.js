'use strict';
// Blue Ocean Market V30.36.0 — complete browser button audit & UX hardening.
// Functional hardening is intentionally applied at the originating compatibility layers so
// older listeners cannot override current validation/pagination rules. This final overlay is
// a release/audit marker and exposes the browser-audit identity without remounting UI chrome.
(()=>{
  const VERSION='30.36.0';
  window.__BOM_V336={version:VERSION,browser_button_audit:true,ux_hardening:true,schema_changes:false};
})();
