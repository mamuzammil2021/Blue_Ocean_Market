'use strict';
const fs=require('fs');let source=fs.readFileSync('server/packaging-decimal.js','utf8');source=source.replace('module.exports=','window.BOMPackagingDecimal=');fs.writeFileSync('public/packaging-decimal.js','// Generated from server/packaging-decimal.js. Run node scripts/build-packaging-client.js after edits.\n(()=>{\n'+source+'\n})();\n');
