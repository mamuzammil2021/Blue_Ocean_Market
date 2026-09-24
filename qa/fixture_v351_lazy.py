from pathlib import Path
import json,base64

def support_lazy_modules(html, public_dir):
    names=('v349-pink-pages','v350-import-pages','v350-raw-pages')
    assets={f'/{name}.js':'data:application/javascript;base64,'+base64.b64encode((Path(public_dir)/(name+'.js')).read_bytes()).decode() for name in names}
    shim="<script>(function(){const assets=REPLACE;const original=document.head.appendChild.bind(document.head);document.head.appendChild=function(node){if(node.tagName==='SCRIPT'){const path=(node.getAttribute('src')||'').split('?')[0];if(assets[path])node.src=assets[path]}return original(node)}})();</script>".replace('REPLACE',json.dumps(assets))
    return html.replace('<head>', '<head>'+shim,1)
