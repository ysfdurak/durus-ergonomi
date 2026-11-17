// Dış kütüphaneleri ve yazı tiplerini depo kökündeki lib/ klasörüne kopyalar.
// Neden: Duruş hiçbir dış adrese bağlanmasın (gizlilik, KVKK) ve internetsiz de tam çalışsın.
// Kaynak: desktop/node_modules (cd desktop && npm ci). Sürümler desktop/package.json'da sabit.
// Çalıştır: node tools/kutuphaneler.mjs  → lib/ değişirse commit'le. Masaüstü (desktop/hazirla.mjs) aynı lib/'i kullanır.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NM = path.join(KOK, 'desktop', 'node_modules');
const LIB = path.join(KOK, 'lib');
const kopya = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };

fs.rmSync(LIB, { recursive: true, force: true });
kopya(path.join(NM, 'exceljs/dist/exceljs.min.js'), path.join(LIB, 'exceljs.min.js'));
kopya(path.join(NM, 'pdfmake/build/pdfmake.min.js'), path.join(LIB, 'pdfmake.min.js'));
kopya(path.join(NM, 'pdfmake/build/vfs_fonts.js'), path.join(LIB, 'vfs_fonts.js'));

// Otomatik nokta bulma (MediaPipe Pose). En ağır model (heavy) kullanılmadığı için kopyalanmaz.
for (const f of fs.readdirSync(path.join(NM, '@mediapipe/pose'))) {
  if (/\.(js|wasm|data|binarypb|tflite)$/.test(f) && !f.includes('heavy')) kopya(path.join(NM, '@mediapipe/pose', f), path.join(LIB, 'pose', f));
}

// IBM Plex: @fontsource'un CSS'inden yalnız latin ve latin-ext blokları (Türkçe harfler latin-ext'te)
const css = [];
for (const [paket, kalinliklar] of [['ibm-plex-sans', [400, 500, 600, 700]], ['ibm-plex-mono', [500]]]) {
  const dir = path.join(NM, '@fontsource', paket);
  for (const w of kalinliklar) {
    const bloklar = fs.readFileSync(path.join(dir, `${w}.css`), 'utf8').split('/* ').filter((b) => /-latin(-ext)?-\d+-normal \*\//.test(b));
    for (const b of bloklar) {
      const ad = b.match(/files\/([\w-]+\.woff2)/)[1];
      kopya(path.join(dir, 'files', ad), path.join(LIB, 'fonts', ad));
      css.push('/* ' + b.replace(/url\(\.\/files\/([\w-]+\.woff2)\) format\('woff2'\), url\([^)]*\) format\('woff'\)/, "url($1) format('woff2')").trim());
    }
  }
}
fs.writeFileSync(path.join(LIB, 'fonts/fonts.css'), css.join('\n') + '\n');

// Lisans bildirimleri
const lis = [['exceljs', 'LICENSE'], ['pdfmake', 'LICENSE'], ['@mediapipe/pose', 'LICENSE'], ['@fontsource/ibm-plex-sans', 'LICENSE'], ['@fontsource/ibm-plex-mono', 'LICENSE']];
for (const [p, f] of lis) {
  const hedef = path.join(LIB, 'lisanslar', p.replace('@', '').replace('/', '-') + '-LICENSE.txt');
  const a = path.join(NM, p, f);
  if (fs.existsSync(a)) kopya(a, hedef);
  else { const pk = JSON.parse(fs.readFileSync(path.join(NM, p, 'package.json'), 'utf8')); fs.mkdirSync(path.dirname(hedef), { recursive: true }); fs.writeFileSync(hedef, `${p} ${pk.version}\nLisans: ${pk.license} (paketin package.json dosyasına göre)\n${pk.homepage || ''}\n`); }
}
console.log('lib/ hazır');
