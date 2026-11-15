// Bir HTML (tek dosya uygulama) ya da JS dosyasındaki çevrilecek metinleri çıkarır.
// Kullanım: node cikar.mjs <dosya> [--json]  → her parça: {k: 'js'|'tpl'|'html'|'attr', s, e, text}
import fs from 'fs';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { parse } from 'parse5';

export const TR = /[çğıöşüÇĞİÖŞÜ]/;
const WORDY = /[A-Za-zçğıöşüÇĞİÖŞÜ]{2,}/;

export function isNatural(t) {
  const s = t.trim();
  if (!s || !WORDY.test(s)) return false;
  if (/^(https?:|data:|mailto:|\/\/)/.test(s)) return false;
  if (/^[#.\[]?[a-z][\w-]*([ .#>:\[\]=\w-]*)$/.test(s) && !TR.test(s) && !/\s[a-z]+\s/.test(s) && !/^[A-Z]/.test(s)) return false; // seçici / anahtar
  if (/^[a-z]+([A-Z][a-z]+)+$/.test(s)) return false; // camelCase
  if (/^[\w-]+:[^;]+;/.test(s) && !TR.test(s)) return false; // css
  if (/^[\w.-]+\.(js|css|png|svg|webp|jpg|json|html|xlsx|pdf)$/.test(s)) return false;
  if (TR.test(s)) return true;
  // Türkçe özel harf yok: büyük harfle başlayan ya da boşluk içeren kelimeler
  if (/^[A-ZÇĞİÖŞÜ][a-zçğıöşü]/.test(s)) return true;
  if (/[a-zçğıöşü]{2,} [a-zçğıöşü]{2,}/.test(s)) return true;
  return false;
}

export function extractJS(code, base = 0, out = [], extras = []) {
  let ast;
  try {
    ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true, allowHashBang: true });
  } catch (e) {
    ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  }
  walk.full(ast, (n) => {
    if (n.type === 'Literal' && typeof n.value === 'string') {
      const raw = code.slice(n.start + 1, n.end - 1);
      if (isNatural(n.value) || extras.includes(n.value)) out.push({ k: 'js', s: base + n.start + 1, e: base + n.end - 1, text: raw, q: code[n.start] });
    } else if (n.type === 'TemplateElement') {
      const raw = n.value.raw;
      if (isNatural(raw.replace(/<[^>]*>/g, ' ')) || extras.includes(raw)) out.push({ k: 'tpl', s: base + n.start, e: base + n.end, text: raw });
    }
  });
  return out;
}

export function extractHTML(html, extras = []) {
  const out = [];
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const ATTRS = new Set(['title', 'placeholder', 'aria-label', 'alt', 'content', 'value', 'label', 'data-tip']);
  const visit = (node) => {
    if (node.nodeName === 'script') {
      const t = node.childNodes?.[0];
      if (t && t.sourceCodeLocation && !(node.attrs || []).some((a) => a.name === 'src')) {
        const loc = t.sourceCodeLocation;
        const type = (node.attrs || []).find((a) => a.name === 'type')?.value;
        if (!type || /javascript|module/.test(type)) extractJS(html.slice(loc.startOffset, loc.endOffset), loc.startOffset, out, extras);
      }
      return;
    }
    if (node.nodeName === 'style') return;
    if (node.nodeName === '#text' && node.sourceCodeLocation) {
      const { startOffset: s, endOffset: e } = node.sourceCodeLocation;
      const raw = html.slice(s, e);
      if (isNatural(raw) || extras.includes(raw.trim())) {
        const lead = raw.match(/^\s*/)[0].length, trail = raw.match(/\s*$/)[0].length;
        out.push({ k: 'html', s: s + lead, e: e - trail, text: raw.slice(lead, raw.length - trail) });
      }
    }
    if (node.attrs && node.sourceCodeLocation?.attrs) {
      for (const a of node.attrs) {
        if (!ATTRS.has(a.name)) continue;
        if (a.name === 'content') {
          const nm = node.attrs.find((x) => x.name === 'name' || x.name === 'property')?.value || '';
          if (!/description|title|og:site_name/.test(nm)) continue;
        }
        const loc = node.sourceCodeLocation.attrs[a.name];
        const src = html.slice(loc.startOffset, loc.endOffset);
        const m = src.match(/^[^=]+=\s*(["']?)/);
        const s = loc.startOffset + m[0].length, e = loc.endOffset - (m[1] ? 1 : 0);
        const raw = html.slice(s, e);
        if (isNatural(raw) || extras.includes(raw)) out.push({ k: 'attr', s, e, text: raw });
      }
    }
    (node.childNodes || []).forEach(visit);
    if (node.content) (node.content.childNodes || []).forEach(visit);
  };
  visit(doc);
  return out;
}

export function extractFile(path) {
  const src = fs.readFileSync(path, 'utf8');
  return /\.html?$/.test(path) ? extractHTML(src) : extractJS(src);
}

if (process.argv[1].endsWith('cikar.mjs')) {
  const items = extractFile(process.argv[2]);
  const uniq = new Map();
  for (const i of items) uniq.set(i.text, (uniq.get(i.text) || 0) + 1);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify([...uniq.keys()], null, 0));
  } else {
    let chars = 0;
    for (const [t] of uniq) chars += t.length;
    console.log('parça', items.length, 'benzersiz', uniq.size, 'karakter', chars);
  }
}
