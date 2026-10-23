'use strict';
const fs=require('fs'),sass=require('sass'),postcss=require('postcss'),path=require('path');
const app=path.resolve(__dirname,'..');const css=sass.compile(path.join(app,'vendor/tabler/components.scss'),{style:'expanded'}).css;
const root=postcss.parse(css);root.walkRules(rule=>{if(rule.parent.type==='atrule'&&/keyframes$/.test(rule.parent.name))return;rule.selector=rule.selectors.map(s=>s.replace(/^:root|^\[data-bs-theme=light\]/,'html.bom-ui')).map(s=>s.startsWith('html.bom-ui')?s:'.bom-ui '+s).join(',\n')});
fs.writeFileSync(path.join(app,'public/tabler-components.css'),'/*! Tabler 1.7.0 subset | MIT | See THIRD_PARTY_NOTICES.md. Generated; do not edit. */\n'+root.toString());console.log('Scoped Tabler components built');
