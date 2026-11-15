import fs from 'fs';import * as acorn from 'acorn';import * as walk from 'acorn-walk';import {isNatural} from './cikar.mjs';
const h=fs.readFileSync(process.argv[2],'utf8');const re=/<script>([\s\S]*?)<\/script>/g;let m;const set=new Map();
while(m=re.exec(h)){const ast=acorn.parse(m[1],{ecmaVersion:'latest'});walk.full(ast,n=>{let t=null;
 if(n.type==='TemplateElement')t=n.value.raw; else if(n.type==='Literal'&&typeof n.value==='string')t=n.value;
 if(t==null||isNatural(t.replace(/<[^>]*>/g,' ')))return;
 const txt=t.replace(/<[^>]*>/g,' ').replace(/(style|class|data-[\w-]+|aria-label|title)="[^"]*"/g,' ');
 const w=txt.match(/[A-Za-zçğıöşüÇĞİÖŞÜ]{3,}/g); if(!w)return; set.set(t,(set.get(t)||0)+1);});}
console.log([...set.keys()].map(x=>JSON.stringify(x)).join('\n'));
