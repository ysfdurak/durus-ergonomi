// Duruş çeviri altyapısı: index.html içindeki çevrilecek metin parçalarını konumlarıyla bulur.
// Kaynak tek dilde (Türkçe) tutulur; İngilizce sürüm bu parçaların sözlükteki karşılıklarıyla üretilir.
// Parça türleri: HTML metni, HTML öznitelik değeri (title, placeholder, aria-label, alt, meta content),
// JavaScript dize sabiti ('...' veya "...") ve şablon dizesi parçası (`...${}...`).
import { parse } from 'parse5';
import * as acorn from 'acorn';

const LETTER = /[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]/;
const TR_CHAR = /[ÇĞİÖŞÜçğıöşü]/;
const ATTRS = new Set(['title', 'placeholder', 'aria-label', 'alt']);
// Küçük harfli ve Türkçe karakter içermediği için kod sanılabilecek ama ekranda görünen birim sözcükleri.
const INCLUDE = new Set(['adet', 'dakika', 'metre', 'saat', 'dakikada', 'saatte', 'erkek', 'kez', 'saniye', 'uzunluk', 'yatay', 'dikey', ' ay', 'evet', 'otomatik']);

// İşaretlemeyi çıkarıp kalan görünür metni verir (yalnızca karar vermek için kullanılır).
export const visibleText = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');

// JavaScript dizesinin kod mu metin mi olduğuna karar verir.
function isUiText(raw) {
  if (INCLUDE.has(raw)) return true;
  const v = visibleText(raw).trim();
  if (!LETTER.test(v)) return false;                                  // harf yok: sayı, işaret, yalnız etiket
  if (/^(https?:|data:|mailto:|#[\w-]|\.[\w-]|\[[\w-])/.test(raw)) return false; // adres, seçici
  if (/^[a-z][A-Za-z0-9_-]*$/.test(raw) && !TR_CHAR.test(raw)) return false;  // tanımlayıcı: 'mmh', 'click'
  if (/^[A-Z0-9_]+$/.test(raw)) return false;                         // sabit adı / kısaltma kodu: 'REBA' ayrıca ele alınır
  if (/^[\w-]+(:[^;]+;)+[\w-]*(:[^;]*)?$/.test(raw.replace(/\s/g, ''))) return false; // satır içi CSS
  if (/^[\w\s.#:>\-\[\]="',()*]+$/.test(raw) && !/\s\S+\s/.test(raw) && !TR_CHAR.test(raw) && /[#.\[\]>]/.test(raw)) return false; // seçici listesi
  return true;
}

export function findSegments(src) {
  const segs = [];
  const doc = parse(src, { sourceCodeLocationInfo: true });
  let script = null;
  (function walk(node, inSkip) {
    const tag = node.tagName;
    if (tag === 'script') { const loc = node.childNodes[0]?.sourceCodeLocation; if (loc) script = { start: loc.startOffset, end: loc.endOffset }; return; }
    if (tag === 'style') return;
    if (node.attrs && node.sourceCodeLocation?.attrs) {
      const isMetaText = tag === 'meta' && node.attrs.some(a => (a.name === 'name' && a.value === 'description') || (a.name === 'property' && /^og:(title|description)$/.test(a.value)));
      for (const a of node.attrs) {
        if (!(ATTRS.has(a.name) || (isMetaText && a.name === 'content'))) continue;
        if (!LETTER.test(a.value)) continue;
        const L = node.sourceCodeLocation.attrs[a.name];
        const whole = src.slice(L.startOffset, L.endOffset);
        const q = whole.indexOf('=') + 1, quote = whole[q];
        const vs = L.startOffset + q + (quote === '"' || quote === "'" ? 1 : 0);
        segs.push({ start: vs, end: vs + a.value.length, raw: src.slice(vs, vs + a.value.length), kind: 'attr' });
      }
    }
    if (node.nodeName === '#text' && !inSkip) {
      const L = node.sourceCodeLocation; const raw = src.slice(L.startOffset, L.endOffset);
      const lead = raw.length - raw.trimStart().length, core = raw.trim();
      if (core && LETTER.test(core)) segs.push({ start: L.startOffset + lead, end: L.startOffset + lead + core.length, raw: core, kind: 'html' });
    }
    for (const c of node.childNodes || []) walk(c, inSkip);
    if (node.content) walk(node.content, inSkip); // <template>
  })(doc, false);

  if (script) {
    const js = src.slice(script.start, script.end);
    for (const t of acorn.tokenizer(js, { ecmaVersion: 'latest', allowHashBang: true })) {
      const lab = t.type.label;
      if (lab === 'string') {
        const raw = js.slice(t.start + 1, t.end - 1);
        if (isUiText(raw)) segs.push({ start: script.start + t.start + 1, end: script.start + t.end - 1, raw, kind: 'js' });
      } else if (lab === 'template') {
        const raw = js.slice(t.start, t.end);
        if (raw && isUiText(raw)) segs.push({ start: script.start + t.start, end: script.start + t.end, raw, kind: 'tpl' });
      }
    }
  }
  segs.sort((a, b) => a.start - b.start);
  return segs;
}
