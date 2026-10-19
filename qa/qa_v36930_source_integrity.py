"""Protection evidence supplements actual server/browser acceptance."""
import os,json,hashlib,zipfile,pathlib,re
root=pathlib.Path(__file__).resolve().parents[1];archive=os.environ['BOM_RATE_BASELINE_ZIP'];checks=[]
def passed(s):checks.append(s);print('PASS '+s)
with zipfile.ZipFile(archive) as z:
 prefix=next(x for x in z.namelist() if x.endswith('/package.json')).rsplit('/',1)[0]+'/'
 def prior(name):return z.read(prefix+name)
 assert json.loads(prior('package.json'))['version']=='30.69.29'
 protected=[]
 for p in sorted((root/'server').glob('*')):
  if p.is_file() and p.name not in {'frontend-manifest.json','pink-fx-engine.js','pink-fx-calculation.js'}:assert p.read_bytes()==prior('server/'+p.name),p.name;protected.append({'file':'server/'+p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 passed('Server business logic outside the focused shared-rate calculations and all schemas remain byte-identical to V30.69.29')
 for name in ['public/v3693-persistent-routing.js','public/route-registry.js','public/client.js','public/runtime-v30392.js','public/v337-client.js','public/v338-client.js','public/v357-accounting-workspace.js','public/v3591-payroll-ui.js','public/v3592-payroll-ui.js']:
  p=root/name;assert p.read_bytes()==prior(name),name;protected.append({'file':name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 passed('Direct deep-route hydration, shared shell and Excavator native UI remain byte-identical to protected V30.69.29')
 old=prior('public/client.js').decode();new=(root/'public/client.js').read_text();handlers=[]
 for name in ['saveSimpleExcavatorMachine','saveExcavatorBuyerPayment','saveExcavatorBuyerRefund','saveSimpleExcavatorCost','completeExcavatorSale','saveExcavatorPayment']:
  pattern=r'(?m)^async function '+name+r'\([^\n]*[\s\S]*?(?=\n(?:async )?function |\Z)'
  a=re.findall(pattern,old);b=re.findall(pattern,new);assert a and a==b,name
  handlers.append({'handler':name,'all_native_definitions_identical':True,'sha256':[hashlib.sha256(x.encode()).hexdigest() for x in b]})
 passed('All six native Excavator money-mutation handler definitions remain byte-identical')
 changed=[]
 for x in z.namelist():
  if x.startswith(prefix) and not x.endswith('/'):
   rel=x[len(prefix):];p=root/rel
   if p.is_file() and p.read_bytes()!=z.read(x):changed.append(rel)
 report={'status':'PASS','baseline':'30.69.29','baseline_zip_sha256':hashlib.sha256(pathlib.Path(archive).read_bytes()).hexdigest(),'checks':checks,'protected_files':protected,'excavator_handlers':handlers,'changed_baseline_files':changed,'production_data_used':False}
 (root/'qa/evidence/36930-source-integrity.json').write_text(json.dumps(report,indent=2))
