"""Real Chromium browser test of production route functions in isolated DOM state.
No network, Render credentials, or database needed."""
from playwright.sync_api import sync_playwright
from pathlib import Path
client=Path('public/client.js').read_text()
start=client.index('function parseAppRouteV3696(')
end=client.index('const viewLabels=',start)
functions=client[start:end].replace('localStorage.', 'window.__routeStore.')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page()
 page.goto('about:blank')
 page.evaluate('''() => {window.me={role:'CEO / Owner'};window.unitOptions=[{id:2,name:'Excavator'},{id:3,name:'Pink Salt'}];window.selectedUnitId='';window.view='dashboard';window.viewLabels={dashboard:'Dashboard',excavatorBuyers:'Buyers',finance:'Finance',profile:'Profile',excavator:'Excavator'};window.allowed=()=>true;window.__routeStore={setItem(){},removeItem(){}};}''')
 # Evaluate the unmodified route function definitions from the release client, with browser-provided location/history.
 page.evaluate("(src)=>{(0,eval)(src)}",functions)
 for path,expected in [('#excavatorBuyers/buyer/125?section=payments&unit=2','excavatorBuyers'),('#psImports/import/4?unit=3','psImports'),('#payroll/employee/7?unit=2','payroll'),('#finance/record/8?unit=2','finance'),('#unrecognized?unit=2','dashboard')]:
  page.evaluate('(h)=>{location.hash=h;}',path)
  result=page.evaluate('''() => {const r=window.BOMRouteCoreV3696.apply();return {hash:location.hash,view:window.view,problem:window.BOMRouteProblemV3697,unit:window.selectedUnitId,route:r.view}}''')
  assert result['hash'].split('?')[0]==path.split('?')[0],result
  assert result['route']==expected,result
  assert bool(result['problem'])==(expected=='dashboard'),result
  print('PASS',path,'=>',result['route'],'unit',result['unit'])
 # Denied route remains addressable, never changed to dashboard.
 page.evaluate('''() => {window.allowed=()=>false;location.hash='#finance/record/19?unit=2';}''')
 denied=page.evaluate('''() => window.BOMRouteCoreV3696.apply()''')
 assert page.evaluate('location.hash').startswith('#finance/record/19'),denied
 assert denied['routeError']=='access',denied
 print('PASS access-denied deep link preserved')
 browser.close()
print('6/6 REAL CHROMIUM ROUTE TESTS PASS (isolated route functions; not full authenticated application)')
