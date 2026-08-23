const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const client=read('public/client.js'),localeSource=read('public/i18n-ko.js'),server=read('server/server.js'),db=read('server/db.js'),html=read('public/index.html'),pkg=require(path.join(root,'package.json'));
let failed=0;function check(name,ok,detail=''){if(ok)console.log('PASS',name);else{failed++;console.error('FAIL',name,detail)}}

const context={window:{}};vm.createContext(context);vm.runInContext(localeSource,context);
const external=context.window.BO_I18N_KO||{},patterns=context.window.BO_I18N_PATTERNS||[],messages=context.window.BO_I18N_MESSAGES||{};
const first=client.indexOf('const KO={'),firstEnd=client.indexOf('};\nObject.assign(KO',first),base=vm.runInNewContext('('+client.slice(first+9,firstEnd+1)+')');
const second=client.indexOf('Object.assign(KO,{',firstEnd),secondEnd=client.indexOf('});\nObject.assign(KO,window',second),added=vm.runInNewContext('('+client.slice(second+'Object.assign(KO,'.length,secondEnd+1)+')');
const ko={...base,...added,...external};context.window.BO_I18N_LOOKUP=ko;
function translate(value){let out=ko[value];if(!out)for(const [re,render] of patterns){re.lastIndex=0;const match=String(value).match(re);if(match){out=render(...match);break}}return out||String(value)}

check('V27.9+ version and cache identity',pkg.version==='28.3.0'&&server.includes("version:'28.3.0'")&&html.includes('/client.js?v=28.3.0')&&html.includes('/i18n-ko.js?v=28.3.0'));
check('document starts in Korean',html.includes('<html lang="ko">'));
check('browser language default is Korean',client.includes("let currentLanguage=localStorage.getItem('bo_language')||'ko'")&&!client.includes("||'en'"));
check('server, token, and database defaults are Korean',server.includes("preferred_language:u.preferred_language||'ko'")&&server.includes("COALESCE(preferred_language,'ko')")&&db.includes("v27EnsureColumn('users','preferred_language',\"TEXT DEFAULT 'ko'\")"));
check('existing inherited preferences migrate once to Korean',db.includes("language_explicit")&&db.includes("preferred_language='ko' WHERE COALESCE(language_explicit,0)=0"));
check('explicit English selection remains supported',server.includes("['en','ko'].includes(req.body.preferred_language)")&&server.includes('language_explicit=1'));
check('pre-login choice wins and persists after login',client.includes("const prelogin=localStorage.getItem('bo_prelogin_language')")&&client.includes('currentLanguage=prelogin||me.preferred_language')&&client.includes("localStorage.removeItem('bo_prelogin_language')"));
check('Korean is first in every language selector',client.includes('<option value="ko" ${currentLanguage===\'ko\'?\'selected\':\'\'}>\ud55c\uad6d\uc5b4</option><option value="en"')&&client.includes('<select name="preferred_language"><option value="ko"'));
check('English language label is Korean in Korean mode',ko.English==='영어');

check('semantic catalogs have exact parity',messages.ko&&messages.en&&JSON.stringify(Object.keys(messages.ko).sort())===JSON.stringify(Object.keys(messages.en).sort()));
check('semantic Korean messages contain Korean or language-neutral placeholders',Object.values(messages.ko||{}).every(x=>{const literal=String(x).replace(/\{\w+\}/g,'');return /[가-힣]/.test(literal)||!/[A-Za-z]/.test(literal)}));
const allowedInternationalTokens=new Set(['MIMI POS','KPIs','CEO','WhatsApp','kg','ml','KRW','USD','PKR','CNY','JPY','EUR','+ KPI','SKU']);
const latinOnlyTranslations=Object.entries(ko).filter(([key,value])=>/[A-Za-z]{2,}/.test(value)&&!/[\uac00-\ud7a3]/.test(value)&&!allowedInternationalTokens.has(key));
check('Korean catalog has no English-only labels outside approved international tokens',latinOnlyTranslations.length===0,latinOnlyTranslations.map(([key,value])=>`${key} -> ${value}`).join(' | '));
check('runtime tracks explicitly requested missing translations',client.includes('window.BO_I18N_MISSING')&&client.includes("console.warn('[Korean translation missing]'"));
check('full inline and external lookup is used by dynamic patterns',client.includes('window.BO_I18N_LOOKUP=KO')&&localeSource.includes('window.BO_KO'));

check('option values are frozen before label translation',client.includes("option.setAttribute('value',option.textContent.trim())")&&client.indexOf('preserveOptionValues(el);')<client.indexOf("if(currentLanguage!=='ko')return"));
check('text-node mutations are translated',client.includes('n.nodeType===Node.TEXT_NODE')&&client.includes('translateTextNode(n)'));
check('user-entered content boundary exists',client.includes('[data-user-content]')&&client.includes('<b data-user-content>'));
check('safe canonical system values translate inside protected details',client.includes('SAFE_SYSTEM_VALUES')&&client.includes("blocked&&!SAFE_SYSTEM_VALUES.has(trim)"));
check('runtime progress messages use semantic keys',client.includes("tr('common.saving')")&&client.includes("tr('common.updating')")&&client.includes("tr('common.completing')")&&client.includes("tr('buyer.availableAdvance'"));
const rawAssignments=[...client.matchAll(/\.textContent\s*=\s*(['"])([^'"]*[A-Za-z][^'"]*)\1/g)].map(x=>x[2]);
check('no direct English textContent assignment remains',rawAssignments.length===0,rawAssignments.join(' | '));

function mappedToKorean(value){const translated=translate(value);return translated!==value&&/[\uac00-\ud7a3]/.test(translated)}
const translationArguments=new Set();
for(const re of [/guardDirty\(\s*(['"])(.*?)\1/g,/toast\(\s*(['"])(.*?)\1/g,/\bt\(\s*(['"])(.*?)\1/g,/(?:title|message|confirmLabel|cancelLabel|placeholder|label|actionMessage)\s*:\s*(['"])(.*?)\1/g]){
  let match;while((match=re.exec(client)))translationArguments.add(match[2]);
}
const titleArguments=/\btitle\(\s*(['"])(.*?)\1\s*,\s*(['"])(.*?)\3/g;let titleMatch;
while((titleMatch=titleArguments.exec(client))){translationArguments.add(titleMatch[2]);translationArguments.add(titleMatch[4])}
const argumentLeaks=[...translationArguments].filter(value=>value===value.trim()&&/[A-Za-z]/.test(value)&&!mappedToKorean(value)).sort();
check('all translation-aware JavaScript arguments have Korean output',argumentLeaks.length===0,argumentLeaks.slice(0,100).join(' | '));

const enumLabels=new Set();
for(const match of client.matchAll(/\[((?:\s*['"][^'"\n]+['"]\s*,?){2,})\]\s*\.map/g))for(const item of match[1].matchAll(/(['"])(.*?)\1/g))enumLabels.add(item[2]);
for(const match of client.matchAll(/const lifecycle=\[([\s\S]*?)\];/g))for(const item of match[1].matchAll(/\[(['"])(.*?)\1\s*,\s*(['"])(.*?)\3\]/g)){enumLabels.add(item[2]);enumLabels.add(item[4])}
const enumLeaks=[...enumLabels].filter(value=>/[A-Za-z]/.test(value)&&!allowedInternationalTokens.has(value)&&!mappedToKorean(value)).sort();
check('all JavaScript-generated enum and lifecycle labels have Korean output',enumLeaks.length===0,enumLeaks.join(' | '));
check('dynamic lifecycle rendering localizes before HTML insertion',client.includes('esc(systemText(label))')&&client.includes('esc(systemText(a.lifecycle_stage'));

const runtimeSamples=[
  '· CEO / Owner','Expense · General Expense','Available 3','Table A — Available','Available advance: ₩ 100','Saving…','Updating...','Completing...',
  'Excavator → Machine Sale #8','Insufficient stock: Bibimbap','3 active items','2 published entries','Published · 100,000.00','Weekly Report · Kim',
  'Finance amount does not match the linked source amount (source ₩10,000).','2 active Finance records point to the same source transaction.',
  'Finance entry submitted for CEO approval. After approval, submit the same entry again.','Inventory write-off submitted for Manager approval. After approval, submit the same waste entry again.',
  'This machine is already sold. Add Cost is available only to the CEO.','Machine purchase submitted for Finance approval. After approval, submit the same purchase again.',
  'Sale update submitted for CEO approval. After approval, open Update Sale and submit again.','Loss/below-margin sale requires CEO approval. After approval, submit the sale again.',
  'Buyer available advance is insufficient. Available: KRW 10 / Required: KRW 20. Record the buyer payment first.',
  'Purchases → Purchase #4','MIMI POS → Sale #9','Sales / POS #2','Excavator Purchase payment for EX-24-001',
  'Buyer Han Trading payment for machine 17','Buyer Han Trading payment for EX-24-001','Buyer Han Trading payment','Excavator sale EX-24-001',
  'Purchase PO-2026-00001','Restaurant POS INV-2026-12','Sale INV-2026-13','EX-24-001 repair: hydraulic hose · Seoul Parts',
  'EX-24-001 logistics: Korea Freight Busan → Incheon','EX-24-001 parts: filter','EX-24-001 Customs Duty · Korea Customs',
  'System · 2026-08-20','Excavator Repair #12'
];
const runtimeFailures=runtimeSamples.filter(x=>translate(x)===x||!/[가-힣]/.test(translate(x)));
check('known rendered and server dynamic leaks translate to Korean',runtimeFailures.length===0,runtimeFailures.join(' | '));

const screenshotLeaks=[
  'You have unsaved changes in this form. Close it and discard the changes?',
  'Live Excavator data · purchase → costs → sale → payment · base currency KRW',
  'Export Preparation','Shipped','On Hold','Cancelled'
];
check('all user-reported screenshot leaks translate to Korean',screenshotLeaks.every(mappedToKorean),screenshotLeaks.filter(x=>!mappedToKorean(x)).join(' | '));
const generatedFrameSamples=['Order POS-12 cancelled','Document · Final','Report Review · Approved','Supplier machine list could not be loaded: offline','Unable to load supplier machines: offline'];
check('generated UI framing translates while preserving record data',generatedFrameSamples.every(mappedToKorean),generatedFrameSamples.filter(x=>!mappedToKorean(x)).join(' | '));

check('POS receipt follows Korean-first locale',client.includes("const lang=currentLanguage==='ko'?'ko':'en'")&&client.includes("t('Subtotal')")&&client.includes("t(s.payment_method)"));
check('server receipts default to Korean',server.includes("function receiptHtml(asset,sale,receiptNo,language='ko')")&&server.includes("const lang=language==='en'?'en':'ko'"));
check('sale PDF defaults to Korean and honors explicit English',server.includes("function finalizeExcavatorSalePdf({assetId,businessUnitId,saleId,userId,language='ko'})")&&server.includes("language:req.headers['x-language']==='en'?'en':'ko'"));
check('Korean Unicode PDF encoding retained',server.includes('/UniKS-UCS2-H')&&server.includes('pdfUnicodeHex'));
check('Korean-readable font stack retained',html.includes('"Noto Sans KR"')&&html.includes('"Malgun Gothic"')&&html.includes('word-break:keep-all'));

if(failed){console.error(`V27.9 Korean runtime QA failed: ${failed}`);process.exit(1)}
console.log(`V27.9 Korean runtime QA PASS (${Object.keys(ko).length} exact phrases, ${patterns.length} runtime patterns)`);
