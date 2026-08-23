const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const client=read('public/client.js'),localeSource=read('public/i18n-ko.js'),server=read('server/server.js'),html=read('public/index.html'),pkg=require(path.join(root,'package.json'));
let failed=0;
function check(name,ok,detail=''){if(ok)console.log('PASS',name);else{failed++;console.error('FAIL',name,detail)}}

const context={window:{}};vm.createContext(context);vm.runInContext(localeSource,context);
const external=context.window.BO_I18N_KO||{},patterns=context.window.BO_I18N_PATTERNS||[];
const inlineStart=client.indexOf('const KO={'),inlineEnd=client.indexOf('};\nObject.assign(KO',inlineStart);
const inline=inlineStart>=0&&inlineEnd>inlineStart?vm.runInNewContext('('+client.slice(inlineStart+9,inlineEnd+1)+')'):{};
const assignedStart=client.indexOf('Object.assign(KO,{',inlineEnd),assignedEnd=client.indexOf('});\nObject.assign(KO,window',assignedStart);
const assigned=assignedStart>=0&&assignedEnd>assignedStart?vm.runInNewContext('('+client.slice(assignedStart+'Object.assign(KO,'.length,assignedEnd+1)+')'):{};
const ko={...inline,...assigned,...external};

check('current release version',pkg.version==='28.3.0'&&server.includes("version:'28.3.0'")&&html.includes('/client.js?v=28.3.0'));
check('Korean catalog loads before application',html.indexOf('/i18n-ko.js?v=28.3.0')>=0&&html.indexOf('/i18n-ko.js?v=28.3.0')<html.indexOf('/client.js?v=28.3.0'));
check('large combined bilingual catalog',Object.keys(ko).length>=1300,`only ${Object.keys(ko).length} keys`);
check('dynamic message translation patterns',patterns.length>=25,`only ${patterns.length} patterns`);
check('catalog has Korean output',Object.values(ko).filter(v=>/[가-힣]/.test(String(v))).length>=1350);

const normalize=s=>String(s||'').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const human=s=>/[A-Za-z]/.test(s)&&s.length>1&&!/^https?:/i.test(s)&&!s.includes('function ')&&!s.includes('=>')&&!/[={}]/.test(s)&&!/^[-+*/.\d\s]+$/.test(s)&&!s.startsWith('+')&&!s.endsWith('+')&&!/\b(?:esc|JSON|stringify|breadcrumbHtml|navHtml|unitSelect)\b/.test(s);
const staticText=new Set();let m;
function stripExpressions(value){let out='';for(let i=0;i<value.length;i++){if(value[i]==='$'&&value[i+1]==='{'){i+=2;let depth=1,quote='';for(;i<value.length&&depth;i++){const ch=value[i];if(quote){if(ch==='\\')i++;else if(ch===quote)quote='';continue}if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}if(ch==='{')depth++;else if(ch==='}')depth--}i--;out+=' ';continue}out+=value[i]}return out}
const textRe=/>\s*([^<>\n]+?)\s*</g;
while((m=textRe.exec(client))){const openStart=client.lastIndexOf('<',m.index),opening=client.slice(openStart,m.index+1);if(!/^<[A-Za-z][^<>]*>$/.test(opening))continue;const chunks=stripExpressions(m[1]).split(/\s*[|]\s*/);for(let chunk of chunks){chunk=normalize(chunk).replace(/^['"`]+|['"`]+$/g,'');if(human(chunk))staticText.add(chunk)}}
const attrRe=/(?:placeholder|title|aria-label)=(?:"([^"$]+)"|'([^'$]+)')/g;
while((m=attrRe.exec(client))){const value=normalize(m[1]||m[2]);if(human(value))staticText.add(value)}
const knownArtifacts=new Set(["':'')+(!x.read_at?'",'×']);
const dynamicSamples={
  'Critical exceptions · warnings':'Critical exceptions · 2 warnings','Deal · ·':'Deal EX-1 · Sold / Completed · Buyer','Documents ( )':'Documents (3)','Finance Verification #':'Finance Verification #4',
  'Income ₩ · Expense ₩':'Income ₩ 10 · Expense ₩ 5','Ingredients / Recipe ·':'Ingredients / Recipe · 4 ingredients','KRW accounting value: ₩':'KRW accounting value: ₩ 100','Manager:':'Manager: Kim',
  'Open Order ·':'Open Order · A-12','Other ₩':'Other ₩ 5','Payable ₩':'Payable ₩ 10','Read-only reconciliation ·':'Read-only reconciliation · All Business Units',
  'Related: · #':'Related: Finance · Sale #3','Report ·':'Weekly Report · Kim','Review:':'Review: Approved','Selected workspace:':'Selected workspace: Excavator','Task #':'Task #3','Update Stock ·':'Update Stock · Bibimbap','Version ·':'Version 2',
  'available':'3 available','available · occupied':'3 available · 2 occupied','completed sales':'3 completed sales','low-stock items':'3 low-stock items','occupied':'3 occupied','open · sold':'3 open · 2 sold','seats':'4 seats',
  '· Assigned to by':'Task · Assigned to Kim by Lee','· FX':'USD · FX 1300','· Machines':'3 Machines','· Paid ₩ · Balance ₩':'Completed · Paid ₩ 10 · Balance ₩ 0','· Published':'3 Published',
  '· System score remains separate from human evaluation.':'88 · System score remains separate from human evaluation.','· pts':'8 pts','· seats':'Table A · 4 seats','· · Organized by':'Meeting · Today · Organized by Kim','· · Version':'Weekly · Kim · Version 2',
  '· · · Available ₩':'Buyer · Korea · Active · Available ₩ 10','— in stock':'Bibimbap — 4 in stock','₩ pending/resubmitted':'₩ 10 pending/resubmitted'
};
const valuesOnly=new Set(['% · PKR','PKR /','· · to']);
check('dynamic UI skeletons have tested Korean patterns',Object.values(dynamicSamples).every(sample=>patterns.some(([r])=>{r.lastIndex=0;return r.test(sample)})));
const staticMissing=[...staticText].filter(x=>!knownArtifacts.has(x)&&!valuesOnly.has(x)&&!dynamicSamples[x]&&!ko[x]&&!patterns.some(([r])=>r.test(x))).sort();
check('all extracted static UI text has Korean mapping',staticMissing.length===0,staticMissing.slice(0,100).join(' | '));

const backendMessages=new Set();
const messageRe=/(?:error|message)\s*:\s*(['"])([^'"\n]+)\1/g;
while((m=messageRe.exec(server))){const value=normalize(m[2]);if(human(value))backendMessages.add(value)}
const backendMissing=[...backendMessages].filter(x=>!ko[x]&&!patterns.some(([r])=>r.test(x))).sort();
check('all literal backend messages have Korean mapping',backendMissing.length===0,backendMissing.slice(0,20).join(' | '));

const moduleLandmarks={
  login:['Preferred Language','Sign in','Forgot password?'],dashboard:['CEO — Consolidated Dashboard','Data Integrity','Business Unit Performance'],
  finance:['Finance Control Center','Source & Evidence','Verification Warnings'],excavator:['Machines / Deals','Add Machine','Buyer Payment'],
  buyers:['Add Buyer','Add Buyer Payment','Buyer Documents'],suppliers:['Add Supplier','Supplier\'s available machines','Add Requirement'],
  restaurant:['MIMI Resturant — POS & Menu','Restaurant Tables','Published Buffets'],tasks:['Tasks & Work Queue','Progress','Manager Review'],
  reports:['Work Reports','Submit Report','Version History'],meetings:['Meetings','Meeting Minutes','Action Items'],
  approvals:['Approval Center','Requests & Decisions','Approval Rules'],documents:['Documents & SOP Center','Workflow','Make Final'],
  users:['Users & Access','Preferred Language','Business Unit / Primary Scope'],audit:['Audit Log','Entity','Details']
};
for(const [module,keys] of Object.entries(moduleLandmarks))check(`${module} bilingual landmarks`,keys.every(k=>ko[k]&&/[가-힣]/.test(String(ko[k]))),keys.filter(k=>!ko[k]).join(', '));

check('language selectable before login',client.includes('function login()')&&client.includes('onchange="setLanguage(this.value)"')&&client.includes('>한국어</option>'));
check('selected language persisted locally and per user',client.includes("localStorage.setItem('bo_language',lang)")&&client.includes("api('/api/me/language'")&&server.includes("app.put('/api/me/language'"));
check('language sent to backend',client.includes("opt.headers['X-Language']")&&server.includes("req.headers['x-language']==='en'?'en':'ko'"));
check('runtime translates text and accessibility attributes',client.includes('NodeFilter.SHOW_TEXT')&&client.includes("'[placeholder],[title],[aria-label]'")&&client.includes('document.documentElement.lang'));
check('mutation-created UI is translated',client.includes('new MutationObserver')&&client.includes('translateElement(n)'));
check('locale-aware money formatting',client.includes("currentLanguage==='ko'?'ko-KR':'en-US'"));
check('Korean-readable responsive typography',html.includes('"Noto Sans KR"')&&html.includes('"Malgun Gothic"')&&html.includes('word-break:keep-all'));
check('system business-unit names translated',client.includes('esc(t(x.name))')&&ko['Mango / Seasonal']&&ko['Pink Salt']&&ko['MIMI Resturant']&&ko.Excavator);
check('roles translated but authorization values unchanged',ko['CEO / Owner']&&ko['Finance / Admin']&&client.includes("me.role==='CEO / Owner'"));

check('POS receipt uses selected language',client.includes('<html lang="${lang}">')&&client.includes("t('Subtotal')")&&client.includes("t('Thank you')"));
check('excavator receipt is bilingual',server.includes("function receiptHtml(asset,sale,receiptNo,language='ko')")&&server.includes("tr('EXCAVATOR SALE RECEIPT')"));
check('sale PDF receives selected language',server.includes("language:req.headers['x-language']==='en'?'en':'ko'")&&server.includes('const report={language:lang'));
check('sale PDF preserves Korean Unicode',server.includes('/UniKS-UCS2-H')&&server.includes("Buffer.from('\\uFEFF'+String(v??''),'utf16le')")&&server.includes('pdfUnicodeHex'));
check('generated values stay authoritative',server.includes('Every value used by the PDF is re-read from the authoritative database'));

if(failed){console.error(`V27.7 localization QA failed: ${failed}`);process.exit(1)}
console.log(`V27.7 bilingual localization QA PASS (${Object.keys(ko).length} exact phrases, ${patterns.length} dynamic patterns)`);
