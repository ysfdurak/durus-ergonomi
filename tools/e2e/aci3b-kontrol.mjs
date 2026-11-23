// 3B gövde/kol açısı (angles3) denetimi: bilinen duruşlardan üretilmiş dünya noktalarıyla.
// Kullanım: node tools/e2e/aci3b-kontrol.mjs   (index.html'deki angles3'ü okur; tarayıcı gerekmez)
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const bas = html.indexOf('function angles3('), son = html.indexOf('function uaBase(');
const angles3 = new Function('const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));\n' + html.slice(bas, son) + '\nreturn angles3;')();
const R = d => d * Math.PI / 180;
// Kişi kameraya dönük (yüz -z), sağ taraf görüntüde solda (x eksi). Gövde öne fl derece eğik, sağ kol gövdeye göre ua derece öne kalkık.
function poz(fl, ua, yuz = 1) {
  const W = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 1 }));
  const ileri = [0, 0, -yuz], yan = [-yuz, 0, 0]; // kişinin sağı
  const gov = [ileri[0] * Math.sin(R(fl)), -Math.cos(R(fl)), ileri[2] * Math.sin(R(fl))]; // kalçadan omza birim
  const ant = [ileri[0] * Math.cos(R(fl)), Math.sin(R(fl)), ileri[2] * Math.cos(R(fl))];   // göğsün önü
  const p = (o, v, k) => ({ x: o.x + v[0] * k, y: o.y + v[1] * k, z: o.z + v[2] * k, visibility: 1 });
  const hip = { x: 0, y: 0, z: 0 }, sh = p(hip, gov, .5);
  W[24] = p(hip, yan, .1); W[23] = p(hip, yan, -.1); W[12] = p(sh, yan, .18); W[11] = p(sh, yan, -.18);
  const bas = p(sh, gov, .2); W[7] = p(bas, yan, -.07); W[8] = p(bas, yan, .07); W[0] = p(bas, ant, .1);
  const kol = [-gov[0] * Math.cos(R(ua)) + ant[0] * Math.sin(R(ua)), -gov[1] * Math.cos(R(ua)) + ant[1] * Math.sin(R(ua)), -gov[2] * Math.cos(R(ua)) + ant[2] * Math.sin(R(ua))];
  W[14] = p(W[12], kol, .3); W[16] = p(W[14], kol, .25); W[20] = p(W[16], kol, .08); W[18] = p(W[16], kol, .08);
  W[26] = p(W[24], [0, 1, 0], .45); W[28] = p(W[26], [0, 1, 0], .45);
  return W;
}
let hata = 0;
for (const yuz of [1, -1]) for (const [fl, ua] of [[0, 0], [30, 0], [60, 45], [90, 90], [100, 120], [-15, 20]]) {
  const a = angles3(poz(fl, ua, yuz), true);
  const ok = Math.abs(a.trunk - fl) <= 1 && Math.abs(a.ua - ua) <= 1 && Math.abs(a.side) <= 1 && Math.abs(a.la) <= 1 && Math.abs(a.kn) <= 1;
  if (!ok) { hata++; console.error('fark', { yuz, fl, ua, a }); }
}
console.log(`3B açı denetimi: ${hata ? hata + ' fark' : '12 duruş tuttu'}`); process.exit(hata ? 1 : 0);
