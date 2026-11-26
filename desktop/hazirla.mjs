// Masaüstü paketinden önce çalışır: web sürümünü ve kütüphaneleri desktop/web/ klasörüne kopyalar.
// Web dosyaları (index.html, en/index.html) kökte tools/i18n/build.mjs ile üretilmiş olmalı.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BURA = path.dirname(fileURLToPath(import.meta.url));
const KOK = path.join(BURA, '..');
const WEB = path.join(BURA, 'web');
const kopya = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };

fs.rmSync(WEB, { recursive: true, force: true });
for (const f of ['index.html', 'en/index.html', 'favicon.svg']) kopya(path.join(KOK, f), path.join(WEB, f));

// Kütüphaneler ve yazı tipleri: web sürümüyle aynı, depo kökündeki lib/ klasöründen (tools/kutuphaneler.mjs üretir).
if (!fs.existsSync(path.join(KOK, 'lib', 'exceljs.min.js'))) { console.error('lib/ yok: önce node tools/kutuphaneler.mjs'); process.exit(1); }
fs.cpSync(path.join(KOK, 'lib'), path.join(WEB, 'lib'), { recursive: true });
// Örnek kareler (gerçek depo videosundan, yüzler bulanık): "Örnek kareyle dene" ve "Belirsiz nokta örneği".
fs.cpSync(path.join(KOK, 'ornek'), path.join(WEB, 'ornek'), { recursive: true });
console.log('web/ hazır:', fs.readdirSync(WEB).join(', '));
