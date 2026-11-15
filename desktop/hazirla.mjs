// Masaüstü paketinden önce çalışır: web sürümünü ve kütüphaneleri desktop/web/ klasörüne kopyalar.
// Web dosyaları (index.html, en/index.html) kökte tools/i18n/build.mjs ile üretilmiş olmalı.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BURA = path.dirname(fileURLToPath(import.meta.url));
const KOK = path.join(BURA, '..');
const WEB = path.join(BURA, 'web');
const NM = path.join(BURA, 'node_modules');
const kopya = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };

fs.rmSync(WEB, { recursive: true, force: true });
for (const f of ['index.html', 'en/index.html', 'favicon.svg']) kopya(path.join(KOK, f), path.join(WEB, f));

kopya(path.join(NM, 'exceljs/dist/exceljs.min.js'), path.join(WEB, 'lib/exceljs.min.js'));
kopya(path.join(NM, 'pdfmake/build/pdfmake.min.js'), path.join(WEB, 'lib/pdfmake.min.js'));
kopya(path.join(NM, 'pdfmake/build/vfs_fonts.js'), path.join(WEB, 'lib/vfs_fonts.js'));

// Otomatik nokta bulma (MediaPipe Pose): web sürümü bu dosyaları jsDelivr'den indirir; masaüstünde yerelden gelir.
// En ağır model (heavy) kullanılmadığı için kopyalanmaz.
for (const f of fs.readdirSync(path.join(NM, '@mediapipe/pose'))) {
  if (/\.(js|wasm|data|binarypb|tflite)$/.test(f) && !f.includes('heavy')) kopya(path.join(NM, '@mediapipe/pose', f), path.join(WEB, 'lib/pose', f));
}

// IBM Plex yazı tipleri: @fontsource'un CSS'inden yalnız latin ve latin-ext blokları (Türkçe harfler latin-ext'te)
const css = [];
for (const [paket, kalinliklar] of [['ibm-plex-sans', [400, 500, 600, 700]], ['ibm-plex-mono', [500]]]) {
  const dir = path.join(NM, '@fontsource', paket);
  for (const w of kalinliklar) {
    const bloklar = fs.readFileSync(path.join(dir, `${w}.css`), 'utf8').split('/* ').filter((b) => /-latin(-ext)?-\d+-normal \*\//.test(b));
    for (const b of bloklar) {
      const ad = b.match(/files\/([\w-]+\.woff2)/)[1];
      kopya(path.join(dir, 'files', ad), path.join(WEB, 'lib/fonts', ad));
      css.push('/* ' + b.replace(/url\(\.\/files\/([\w-]+\.woff2)\) format\('woff2'\), url\([^)]*\) format\('woff'\)/, "url($1) format('woff2')").trim());
    }
  }
}
fs.writeFileSync(path.join(WEB, 'lib/fonts/fonts.css'), css.join('\n') + '\n');
console.log('web/ hazır:', fs.readdirSync(WEB).join(', '));
