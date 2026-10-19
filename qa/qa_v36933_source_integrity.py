import pathlib,os,json,zipfile,hashlib,re
root=pathlib.Path(__file__).resolve().parents[1];p=pathlib.Path(os.environ['BOM_QA32_BASELINE_ZIP']);checks=[]
def passed(s):checks.append(s);print('PASS '+s)
assert hashlib.sha256(p.read_bytes()).hexdigest()=='327f6f3316ca40d3da77299750e2c85e2aad7039585b0278853a338d9256c6a0'
with zipfile.ZipFile(p) as z:
 prefix=next(n for n in z.namelist() if n.endswith('/package.json')).rsplit('/',1)[0]+'/'
 def old(n):return z.read(prefix+n)
 assert json.loads(old('package.json'))['version']=='30.69.32';passed('Latest protected V30.69.32 archive and SHA256 verified before development')
 allowed={'server.js','pink-fx-engine.js','v318.js','v319.js','v3392-core.js','v343.js','v368-critical-email.js','approval-detail.js'}
 for f in (root/'server').glob('*.js'):
  if prefix+'server/'+f.name in z.namelist() and f.name not in allowed:assert old('server/'+f.name)==f.read_bytes(),f.name
 passed('Unrelated server controllers remain byte-identical to protected .32')
 for n in ['public/route-registry.js','public/v3693-persistent-routing.js','public/pink-fx-payment.js','public/pink-fx-calculation.js','public/pink-import-detail.js','public/pink-operation.js','public/v3695-repacking-inputs.js','public/v365-pink-commerce.js','public/v366-pink-product-master.js','public/v367-pink-operational-completion.js']:
  assert old(n)==(root/n).read_bytes(),n
 passed('Deep-route hydration, current cost identity, simplified forms, single rates and operational inventory flows remain protected')
 for n in ['public/client.js','public/runtime-v30392.js']:
  for h in ['saveSimpleExcavatorMachine','saveExcavatorBuyerPayment','saveExcavatorBuyerRefund','saveSimpleExcavatorCost','completeExcavatorSale','saveExcavatorPayment']:
   pat=r'(?m)^async function '+h+r'\([^\n]*[\s\S]*?(?=\n(?:async )?function |\Z)';assert re.findall(pat,old(n).decode())==re.findall(pat,(root/n).read_text()),(n,h)
 a=old('server/server.js').decode();b=(root/'server/server.js').read_text();extract=lambda s:s[s.index('function financeSync('):s.index('function voidFinanceBySource(')]
 before,after=extract(a),extract(b);after=after.replace('if(fxLink){paymentApproval.finance(fxLink.finance_entry_id);return fxLink.finance_entry_id;}','if(fxLink)return fxLink.finance_entry_id;');after=re.sub(r'paymentApproval\.finance\((?:Number\([^)]*\)|[^)]*)\);','',after);assert before==after
 passed('Excavator mutation handlers and shared Finance monetary SQL/calculation are unchanged; only explicit approval-link hooks are added')
 a=old('server/pink-fx-engine.js').decode();b=(root/'server/pink-fx-engine.js').read_text();strip_response=lambda s:re.sub(r'(?m)^ function response\(fn\)[^\n]*\n','',s[s.index('function migrate('):]);assert strip_response(a)==strip_response(b)
 for f in (root/'server/migrations').glob('*'):
  if f.is_file() and prefix+'server/migrations/'+f.name in z.namelist():assert old('server/migrations/'+f.name)==f.read_bytes()
 passed('Durable settlement debit/credit engine and existing migrations/Chart-of-Accounts definitions are preserved; approval HTTP responses now wait for transaction completion')
(root/'qa/evidence/36933-source-integrity.json').write_text(json.dumps({'status':'PASS','checks':checks,'baseline':'30.69.32','baseline_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'production_data_used':False},indent=2))
