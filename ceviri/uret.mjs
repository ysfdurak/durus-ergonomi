// Çeviri sözlüğüyle İngilizce sürüm üretir.
// node uret.mjs <kaynak.html> <sozluk-klasoru> <cikti.html> [ekler.json] [yamalar.mjs]
// Sözlük klasörü: en-*.tsv dosyaları, satır: "<sıra>\t<çeviri>"; kaynak.json: sıra → Türkçe metin listesi.
import fs from 'fs';
import path from 'path';
import { extractHTML } from './cikar.mjs';

const [src, dir, out, patchFile] = process.argv.slice(2);
let html = fs.readFileSync(src, 'utf8');
const list = JSON.parse(fs.readFileSync(path.join(dir, 'kaynak.json'), 'utf8'));
const dict = new Map();
for (const f of fs.readdirSync(dir).filter((f) => /^en-.*\.tsv$/.test(f)).sort()) {
  for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const t = line.indexOf('\t');
    const i = +line.slice(0, t);
    let en = line.slice(t + 1);
    const tr = list[i];
    if (tr == null) { console.error('sıra yok', i); continue; }
    // satır sonu: kaynakta gerçek satır sonu varsa \n → gerçek satır sonu
    if (tr.includes('\n')) en = en.replace(/\\n/g, '\n');
    // baş/son boşlukları kaynaktan al
    const lead = tr.match(/^\s*/)[0], trail = tr.match(/\s*$/)[0];
    en = (/^[,.;:)%]/.test(en.trim()) ? '' : lead) + en.trim() + trail;
    dict.set(tr, en);
  }
}
// metin anahtarlı ek sözlük: ek-*.tsv, satır "Türkçe\tİngilizce" (\n kaçışı, boşluklar korunur: ⎵ yerine gerçek boşluk)
const extraKeys = [];
for (const f of fs.readdirSync(dir).filter((f) => /^ek-.*\.tsv$/.test(f)).sort()) {
  for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
    if (!line.includes('\t')) continue;
    let [tr, en] = line.split('\t');
    tr = tr.replace(/␣/g, ' '); en = en.replace(/␣/g, ' ');
    dict.set(tr, en); extraKeys.push(tr);
  }
}
const patches = patchFile ? (await import(path.resolve(patchFile))).default : { pre: [], post: [], extras: [] };

// ön yamalar kaynağa (çıkarma öncesi) uygulanır
for (const [a, b] of patches.pre || []) {
  if (!html.includes(a)) console.error('ÖN YAMA BULUNAMADI:', a.slice(0, 80));
  html = html.split(a).join(b);
}

const items = extractHTML(html, [...(patches.extras || []), ...extraKeys]);
const missing = new Map();
items.sort((a, b) => b.s - a.s);
let outHtml = html;
for (const it of items) {
  let en = dict.get(it.text);
  if (en == null) { missing.set(it.text, (missing.get(it.text) || 0) + 1); continue; }
  if (it.k === 'js') {
    const q = it.q;
    en = en.replace(/\\?(['"])/g, (m, c) => (c === q ? '\\' + c : c));
    en = en.replace(/\n/g, '\\n');
  } else if (it.k === 'tpl') {
    en = en.replace(/(^|[^\\])`/g, '$1\\`');
  } else if (it.k === 'attr') {
    en = en.replace(/"/g, '&quot;');
  }
  outHtml = outHtml.slice(0, it.s) + en + outHtml.slice(it.e);
}

for (const [a, b] of patches.post || []) {
  if (typeof a === 'string') {
    if (!outHtml.includes(a)) console.error('SON YAMA BULUNAMADI:', a.slice(0, 80));
    outHtml = outHtml.split(a).join(b);
  } else outHtml = outHtml.replace(a, b);
}
fs.writeFileSync(out, outHtml);
console.log('çevrilen parça', items.length - [...missing.values()].reduce((a, b) => a + b, 0), '· eksik benzersiz', missing.size);
fs.writeFileSync(path.join(dir, 'eksik.txt'), [...missing.keys()].join('\n---\n'));
