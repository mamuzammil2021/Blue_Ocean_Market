import os,json,pathlib,hashlib,zipfile,re
root=pathlib.Path(__file__).resolve().parents[1];archive=os.environ['BOM_QA31_BASELINE_ZIP'];checks=[]
def passed(s):checks.append(s);print('PASS '+s)
with zipfile.ZipFile(archive) as z:
 prefix=next(x for x in z.namelist() if x.endswith('/package.json')).rsplit('/',1)[0]+'/'
 def old(name):return z.read(prefix+name)
 assert json.loads(old('package.json'))['version']=='30.69.31'
 assert hashlib.sha256(pathlib.Path(archive).read_bytes()).hexdigest()=='f3389a820c47ebdd71908cf4b3f761e015b6b2cf0ac533f3d660cda28dc2e568'
 passed('Latest protected V30.69.31 source identity and archive SHA256 verified')
 allowed={'server.js','pink-fx-engine.js','pink-fx-calculation.js','pink-fx-errors.js','frontend-manifest.json','async-pdf-v339.js','v300.js','v307.js','v310.js','v315.js','v318.js','v284.js'}
 unchanged=[]
 for p in sorted((root/'server').glob('*.js')):
  name='server/'+p.name
  if prefix+name in z.namelist() and p.name not in allowed:assert old(name)==p.read_bytes(),name;unchanged.append(name)
 passed('Server modules outside the reviewed Pink Salt, PDF and posting-readiness changes remain byte-identical')
 for name in ['public/v3693-persistent-routing.js','public/route-registry.js','public/bom-payment-rules.js','public/v3695-repacking-inputs.js','public/v365-pink-commerce.js','public/v366-pink-product-master.js','public/v367-pink-operational-completion.js','public/v3591-payroll-ui.js','public/v3592-payroll-ui.js']:
  assert old(name)==(root/name).read_bytes(),name
 a=old('public/pink-import-detail.js').decode();b=(root/'public/pink-import-detail.js').read_text();strip=lambda x:x[:x.index('async function legacyCost(id)')]+x[x.index('window.BOMPinkImportDetailQA'):];assert strip(a)==strip(b)
 passed('Routing, category builder, reference validator, inventory/product/commerce and payroll controllers are preserved')
 for name in ['public/client.js','public/runtime-v30392.js']:
  for h in ['saveSimpleExcavatorMachine','saveExcavatorBuyerPayment','saveExcavatorBuyerRefund','saveSimpleExcavatorCost','completeExcavatorSale','saveExcavatorPayment']:
   pat=r'(?m)^async function '+h+r'\([^\n]*[\s\S]*?(?=\n(?:async )?function |\Z)';a=re.findall(pat,old(name).decode());b=re.findall(pat,(root/name).read_text());assert a==b,(name,h)
 passed('Every native Excavator financial mutation handler remains byte-identical to the protected baseline')
 a=old('server/server.js').decode();b=(root/'server/server.js').read_text();extract=lambda s:s[s.index('function financeSync('):s.index('function voidFinanceBySource(')];assert extract(a)==extract(b)
 for p in (root/'server/migrations').glob('*'):
  if p.is_file() and prefix+'server/migrations/'+p.name in z.namelist():assert p.read_bytes()==old('server/migrations/'+p.name),p.name
 passed('Shared Finance write engine and existing migration sources/Chart-of-Accounts definitions remain unchanged')
 changed=[x[len(prefix):] for x in z.namelist() if x.startswith(prefix) and not x.endswith('/') and (root/x[len(prefix):]).is_file() and old(x[len(prefix):])!=(root/x[len(prefix):]).read_bytes()]
 (root/'qa/evidence/36932-source-integrity.json').write_text(json.dumps({'status':'PASS','baseline':'30.69.31','checks':checks,'unchanged_server_files':unchanged,'changed_baseline_files':changed,'production_data_used':False},indent=2))
