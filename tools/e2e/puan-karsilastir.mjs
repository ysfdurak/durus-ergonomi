// REBA ve RULA puanlarını uygulamadan bağımsız yazılmış çalışma kâğıdı tablolarıyla (referans.mjs) karşılaştırır.
// Kullanım: node tools/e2e/puan-karsilastir.mjs   (index.html'deki hesap bloğunu okur; tarayıcı gerekmez)
import fs from 'node:fs'; import { reba, rula } from './referans.mjs';
const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const bas = html.indexOf('const ANG=['), son = html.indexOf('function owasCodes');
const kod = 'const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));\n' + html.slice(bas, son) + '\nreturn {calcREBA,calcRULA,ADJ0};';
const { calcREBA, calcRULA, ADJ0 } = new Function(kod)();
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648; const pick = a => a[Math.floor(rnd() * a.length)];
let fark = 0; const n = 20000;
for (let i = 0; i < n; i++) {
  const a = { trunk: Math.round(rnd() * 130 - 30), neck: Math.round(rnd() * 70 - 30), ua: Math.round(rnd() * 200 - 50), la: Math.round(rnd() * 150), wr: Math.round(rnd() * 40), kn: Math.round(rnd() * 120) };
  const j = { loadKg: pick([0, 1, 3, 6, 12]), shock: rnd() < .15, coupling: pick([0, 1, 2, 3]), legMode: pick(['stand2', 'stand1']), trunkTwist: rnd() < .3, neckTwist: rnd() < .3, uaAbd: rnd() < .2, uaRaised: rnd() < .2, uaSupported: rnd() < .2, wristDev: rnd() < .3, actStatic: rnd() < .3, actRepeat: rnd() < .3, actRapid: rnd() < .2 };
  const jj = Object.assign({}, ADJ0, j);
  if (reba(a, j) !== calcREBA(a, jj).v || rula(a, j) !== calcRULA(a, jj).v) { fark++; if (fark <= 3) console.error('fark', JSON.stringify({ a, j })); }
}
console.log(`${n} rastgele duruş · REBA/RULA farkı: ${fark}`); process.exit(fark ? 1 : 0);
