'use strict';
const fs=require('fs'),path=require('path'),child=require('child_process');
const root=path.join(__dirname,'..');let pass=0,fail=0;
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function check(name,ok,detail=''){if(ok){pass++;console.log('PASS',name)}else{fail++;console.error('FAIL',name,detail)}}
function contains(file,needle){return read(file).includes(needle)}
const pkg=JSON.parse(read('package.json')),html=read('public/index.html'),runtime=read('public/runtime-v30392.js'),server=read('server/server.js'),db=read('server/db.js'),req=read('REQUIREMENTS_MASTER.md');
check('V30.39 foundation retained in package 30.39.2',pkg.version==='30.39.2');
check('qa:v339 script registered',!!pkg.scripts['qa:v339']);
const scripts=[...html.matchAll(/<script\s+src=/g)].length;
check('live HTML reduced to 3 scripts',scripts===3,`found ${scripts}`);
check('runtime bundle loaded',/runtime-v30392\.js\?v=30\.39\.2/.test(html));
check('legacy patch chain not loaded separately',!/<script[^>]+v3382-client\.js/.test(html));
check('historical V30.38.2 patch preserved in bundle',runtime.includes('===== v3382-client.js ====='));
check('V30.39 client foundation included',runtime.includes('performance foundation loaded')&&runtime.includes("const VERSION='30.39.0'"));
for(const f of ['public/i18n-ko.js','public/client.js','public/runtime-v30392.js']){const gz=f+'.gz';check(`${gz} exists`,fs.existsSync(path.join(root,gz)));if(fs.existsSync(path.join(root,gz)))check(`${gz} smaller than source`,fs.statSync(path.join(root,gz)).size<fs.statSync(path.join(root,f)).size)}
check('server performance middleware installed before static runtime',server.indexOf('perfV339.installEarly({app,root})')>=0&&server.indexOf('perfV339.installEarly({app,root})')<server.indexOf('express.static'));
check('server reports current V30.39.2 while V30.39 foundation remains installed',server.includes('Blue Ocean Market V30.39.2 running on port'));
check('performance health route installed',server.includes('perfV339.installRoutes({app,db,auth,allow})'));
check('slow request logging exists',contains('server/v339-performance.js','[PERF] slow'));
check('large response logging exists',contains('server/v339-performance.js','[PERF] large'));
check('API gzip exists',contains('server/v339-performance.js',"Content-Encoding','gzip"));
check('static immutable cache exists',contains('server/v339-performance.js','max-age=604800, immutable'));
check('request id exists',contains('server/v339-performance.js','X-Request-ID'));
check('server timing exists',contains('server/v339-performance.js','Server-Timing'));
check('optional SQL profiling exists',contains('server/v339-performance.js','BOM_SQL_PROFILE'));
check('SQLite busy timeout enabled',db.includes("busy_timeout=5000"));
check('SQLite NORMAL synchronous enabled',db.includes("synchronous=NORMAL"));
check('V30.39 list indexes exist',db.includes('idx_finance_v339_list')&&db.includes('idx_excavator_assets_v339_list'));
check('shared server pagination helper exists',fs.existsSync(path.join(root,'server/pagination-v339.js')));
check('server paging standard includes 25/50/100',contains('server/pagination-v339.js','[25,50,100]'));
check('client in-flight GET dedupe exists',contains('public/v339-client.js','inFlight.has(key)'));
check('client remote-search debounce/cancel exists',contains('public/v339-client.js','AbortController')&&contains('public/v339-client.js','debounceMs||300'));
check('client shared paged API exists',contains('public/v339-client.js','async function pagedApi'));
check('client immediate busy button feedback exists',contains('public/v339-client.js','bom-v339-button-spin')&&contains('public/v339-client.js',"aria-busy"));
check('client slow connection feedback exists',contains('public/v339-client.js','3500')&&contains('public/v339-client.js','Still working'));
check('future lifecycle registry exists',contains('public/v339-client.js','onLifecycle')&&contains('public/v339-client.js','emitLifecycle'));
const observers=(runtime.match(/new MutationObserver/g)||[]).length;
check('document observer baseline does not grow above V30.39 audit threshold',observers<=33,`found ${observers}`);
const syncHits=[];for(const f of fs.readdirSync(path.join(root,'server')).filter(x=>x.endsWith('.js'))){if(read('server/'+f).includes('execFileSync'))syncHits.push(f)}
check('blocking Chrome execFileSync removed from server',syncHits.length===0,syncHits.join(','));
for(const f of ['server/v307.js','server/v308.js','server/v313.js','server/v315.js'])check(`${f} uses async PDF helper`,contains(f,"renderChromePdf"));
check('permanent performance carry-forward rules documented',req.includes('System-Wide Performance, Async Interaction & Scalability Standard — V30.39+ PERMANENT CARRY-FORWARD RULE'));
check('requirements mandate server-side pagination',req.toLowerCase().includes('search, permission scope, bu scope, status/date filters and sorting are applied **before** pagination'));
check('requirements prohibit renewed patch stacking',req.includes('Do not resume indefinite `vXXXX-client.js` stacking'));
check('requirements carry rules into future work',req.includes('The user should not need to repeat these rules in future feature requests.'));
for(const f of ['server/server.js','server/v339-performance.js','server/pagination-v339.js','server/async-pdf-v339.js','server/v307.js','server/v308.js','server/v313.js','server/v315.js','public/v339-client.js','public/runtime-v30392.js']){try{child.execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'pipe'});check(`syntax ${f}`,true)}catch(e){check(`syntax ${f}`,false,String(e.stderr||e.message))}}
console.log(`\nV30.39 QA: ${pass} passed, ${fail} failed`);if(fail)process.exit(1);
