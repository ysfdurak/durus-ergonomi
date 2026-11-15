// Duruş iki dil üretimi: index.html (Türkçe kaynak) + i18n/en.json → yayın dosyaları.
//   index.html      → aynı dosya, dil düğmesi ve hreflang eklenmiş Türkçe sürüm (yerinde güncellenir)
//   en/index.html   → İngilizce sürüm
// Kaynakta değişiklik yaptıktan sonra:  cd tools && node i18n/extract.mjs  (yeni metinleri sözlüğe ekler)
//                                       → i18n/en.json içinde boş çevirileri doldur
//                                       → node i18n/build.mjs
// Kaynak dosyada yalnızca işaretler (<!--DIL-->, <!--HREFLANG-->) bulunur; build bunları doldurur.
// Bu yüzden build her zaman işaretli kaynak üzerinden çalışır: i18n/source.html (ilk çalıştırmada index.html'den alınır).
import fs from 'node:fs';
import { findSegments, visibleText } from './segments.mjs';

const ROOT = new URL('../../', import.meta.url);
const SRC = new URL('i18n/source.html', new URL('../', import.meta.url));
const DICT = JSON.parse(fs.readFileSync(new URL('./en.json', import.meta.url), 'utf8'));
const SITE = 'https://durus.ysfdurak.com/';

// Kaynak: işaretli Türkçe dosya. İlk kurulumda kökteki index.html'den kopyalanır.
if (!fs.existsSync(SRC)) fs.copyFileSync(new URL('index.html', ROOT), SRC);
const src = fs.readFileSync(SRC, 'utf8');
if (!src.includes('<!--DIL-->') || !src.includes('<!--HREFLANG-->')) throw new Error('Kaynakta <!--DIL--> veya <!--HREFLANG--> işareti yok.');

const HREFLANG = `<link rel="alternate" hreflang="tr" href="${SITE}">\n<link rel="alternate" hreflang="en" href="${SITE}en/">\n<link rel="alternate" hreflang="x-default" href="${SITE}">`;

// ---------- Türkçe ----------
let tr = src.replace('<!--HREFLANG-->', HREFLANG)
  .replace('<!--DIL-->', '<a class="langsw" href="en/" hreflang="en" lang="en" title="English version">English</a>');

// ---------- İngilizce ----------
const segs = findSegments(src);
const warn = [], err = [];
const TR_CHAR = /[çğıöşüÇĞİÖŞÜ]/;
const tagNames = (s) => (s.match(/<\/?[a-zA-Z][\w-]*/g) || []).join(' ');
let out = '', pos = 0;
for (const sg of segs) {
  let t = DICT[sg.raw];
  if (t === undefined || t === '') { t = sg.raw; if (TR_CHAR.test(visibleText(sg.raw))) warn.push(sg.raw); }
  else {
    if (tagNames(t) !== tagNames(sg.raw)) err.push(`etiketler farklı: ${JSON.stringify(sg.raw).slice(0, 90)}`);
    if (sg.kind === 'js') {
      const q = src[sg.start - 1];
      if (/\n/.test(t)) err.push(`tek tırnaklı dizede satır sonu: ${sg.raw.slice(0, 60)}`);
      t = t.replace(new RegExp(`(?<!\\\\)${q}`, 'g'), '\\' + q);
    } else if (sg.kind === 'tpl') {
      t = t.replace(/(?<!\\)`/g, '\\`').replace(/\$\{/g, '\\${');
    } else if (sg.kind === 'attr') {
      t = t.replace(/"/g, '&quot;');
    }
  }
  out += src.slice(pos, sg.start) + t; pos = sg.end;
}
out += src.slice(pos);

// Kod düzeyindeki yerel ayarlar (yalnız İngilizce sürümde).
const sIdx = out.indexOf('<script>'), eIdx = out.lastIndexOf('</script>');
let head = out.slice(0, sIdx), js = out.slice(sIdx, eIdx), tail = out.slice(eIdx);
js = js
  .replace(/\.replace\('\.',','\)/g, ".replace('.','.')")           // ondalık virgül → nokta
  .replace(/'tr-TR'/g, "'en-GB'")
  .replace(/localeCompare\(([^()]*(?:\([^()]*\))?[^()]*),'tr'\)/g, "localeCompare($1,'en')")
  .replace(/toLocaleLowerCase\('tr'\)/g, "toLocaleLowerCase('en')")
  .replace(/'dd\.mm\.yyyy'/g, "'dd/mm/yyyy'")
  .replace(/txt:'%'\+pct,/g, "txt:pct+'%',")
  .replace("const pct=P=>'%'+Math.round(P*100);", "const pct=P=>Math.round(P*100)+'%';")
  .replace("txt:'%'+Math.round(worst*100),", "txt:Math.round(worst*100)+'%',")
  .replace(/%\$\{((?:[^{}]|\{[^{}]*\})*)\}/g, '${$1}%');             // "%42" → "42%"
head = head
  .replace('<html lang="tr">', '<html lang="en">')
  .replace(`<link rel="canonical" href="${SITE}">`, `<link rel="canonical" href="${SITE}en/">`)
  .replace(`property="og:url" content="${SITE}"`, `property="og:url" content="${SITE}en/"`)
  .replace('href="favicon.svg"', 'href="../favicon.svg"')
  .replace('<!--HREFLANG-->', HREFLANG)
  .replace('<!--DIL-->', '<a class="langsw" href="../" hreflang="tr" lang="tr" title="Türkçe sürüm">Türkçe</a>');
const en = head + js + tail;

if (err.length) { console.error('HATA:\n' + err.join('\n')); process.exit(1); }
fs.writeFileSync(new URL('index.html', ROOT), tr);
fs.mkdirSync(new URL('en/', ROOT), { recursive: true });
fs.writeFileSync(new URL('en/index.html', ROOT), en);
console.log(`Türkçe: index.html · İngilizce: en/index.html · parça ${segs.length} · çevrilmemiş Türkçe metin ${warn.length}`);
if (warn.length) console.log(warn.slice(0, 20).map((w) => '  · ' + JSON.stringify(w).slice(0, 100)).join('\n'));
