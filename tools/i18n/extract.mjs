// Çevrilecek parçaları bulur ve i18n/en.json sözlüğünü günceller (var olan çeviriler korunur).
// Kaynak: i18n/source.html (düzenlenen tek dosya). Kullanım: node i18n/extract.mjs   → yeni parçalar boş çeviriyle eklenir, artık kullanılmayanlar ayrılır.
import fs from 'node:fs';
import { findSegments } from './segments.mjs';
const SRC = new URL('./source.html', import.meta.url), DICT = new URL('./en.json', import.meta.url);
const src = fs.readFileSync(SRC, 'utf8');
const segs = findSegments(src);
const old = fs.existsSync(DICT) ? JSON.parse(fs.readFileSync(DICT, 'utf8')) : {};
const out = {}; let fresh = 0;
for (const s of segs) { if (s.raw in out) continue; out[s.raw] = old[s.raw] ?? ''; if (!(s.raw in old)) fresh++; }
const unused = Object.keys(old).filter(k => !(k in out));
fs.writeFileSync(DICT, JSON.stringify(out, null, 1) + '\n');
const empty = Object.values(out).filter(v => v === '').length;
console.log(`parça: ${segs.length} · benzersiz: ${Object.keys(out).length} · yeni: ${fresh} · çevrilmemiş: ${empty} · artık kullanılmayan: ${unused.length}`);
