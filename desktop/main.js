// Duruş masaüstü (Windows) — web sürümünün aynısını internetsiz çalıştıran Electron kabuğu.
// Sayfalar app://durus/ adresinden açılır (tr: app://durus/, en: app://durus/en/).
// Tek bir adres kökü olduğu için iki dil aynı kayıtları (localStorage) paylaşır; veriler bu bilgisayarda kalır.
// Web sürümünün CDN'den çektiği kütüphaneler (ExcelJS, pdfmake, yazı tipleri) uygulamanın içinde gelir;
// istekler buradaki eşleme tablosuyla yerel dosyalara yönlendirilir.
const { app, BrowserWindow, Menu, dialog, protocol, net, shell, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const WEB = path.join(__dirname, 'web');
// Veri klasörü: %APPDATA%\Durus (ASCII ad; kayıtlar, ayarlar burada)
app.setPath('userData', path.join(app.getPath('appData'), 'Durus'));
const AYAR = () => path.join(app.getPath('userData'), 'ayar.json');
const SITE = 'https://durus.ysfdurak.com/';

// Kütüphaneler ve yazı tipleri uygulamanın içinde (web/lib); sayfa /lib/... adresinden yükler, dış adrese gidilmez.

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

const ayarOku = () => { try { return JSON.parse(fs.readFileSync(AYAR(), 'utf8')); } catch { return {}; } };
const ayarYaz = (a) => { try { fs.writeFileSync(AYAR(), JSON.stringify({ ...ayarOku(), ...a })); } catch {} };
const adres = (dil) => (dil === 'en' ? 'app://durus/en/' : 'app://durus/');

// ---------- güncelleme denetimi: GitHub'daki son sürümü sorar, yenisi varsa indirme sayfasını önerir ----------
// Uygulama kendini değiştirmez; kullanıcı yeni kurulum dosyasını indirip çalıştırır (kayıtlar korunur).
const SURUMLER = 'https://github.com/ysfdurak/durus-ergonomi/releases/latest';
const sayi = (v) => String(v).replace(/^v/, '').split('.').map((x) => +x || 0);
const yeniMi = (a, b) => { const x = sayi(a), y = sayi(b); for (let i = 0; i < 3; i++) { if (x[i] !== y[i]) return x[i] > y[i]; } return false; };
async function guncellemeDenetle(win, elle) {
  const en = ayarOku().dil === 'en';
  try {
    const r = await net.fetch('https://api.github.com/repos/ysfdurak/durus-ergonomi/releases/latest', { headers: { 'User-Agent': 'Durus-masaustu', Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const son = String((await r.json()).tag_name || '').replace(/^v/, ''), simdi = app.getVersion();
    if (son && yeniMi(son, simdi) && (elle || ayarOku().atla !== son)) {
      const { response } = await dialog.showMessageBox(win, {
        type: 'info', title: 'Duruş', noLink: true, defaultId: 0, cancelId: 1,
        message: en ? `A new version is available: ${son}` : `Yeni sürüm var: ${son}`,
        detail: en ? `You have ${simdi}. Download the new installer and run it; your records are kept.` : `Kullandığın sürüm ${simdi}. Yeni kurulum dosyasını indirip çalıştır; kayıtların korunur.`,
        buttons: en ? ['Open download page', 'Later', 'Skip this version'] : ['İndirme sayfasını aç', 'Daha sonra', 'Bu sürümü atla'],
      });
      if (response === 0) shell.openExternal(SURUMLER);
      if (response === 2) ayarYaz({ atla: son });
    } else if (elle) {
      dialog.showMessageBox(win, { type: 'info', title: 'Duruş', message: en ? `You have the latest version (${simdi}).` : `En güncel sürümü kullanıyorsun (${simdi}).` });
    }
  } catch (e) {
    if (elle) dialog.showMessageBox(win, { type: 'warning', title: 'Duruş', message: en ? 'Could not check for updates.' : 'Güncellemeler denetlenemedi.', detail: en ? 'Check your internet connection. The app works offline.' : 'İnternet bağlantını kontrol et. Uygulama internetsiz de çalışır.' });
  }
}

async function dilSor() {
  const tr = app.getLocale().toLowerCase().startsWith('tr');
  const { response } = await dialog.showMessageBox({
    type: 'question',
    title: 'Duruş',
    message: 'Dil seçin / Choose your language',
    detail: 'Daha sonra menüden değiştirebilirsiniz.\nYou can change it later from the menu.',
    buttons: ['Türkçe', 'English'],
    defaultId: tr ? 0 : 1,
    cancelId: tr ? 0 : 1,
    noLink: true,
  });
  return response === 1 ? 'en' : 'tr';
}

function menuKur(win, dil) {
  const en = dil === 'en';
  const dilDegistir = (d) => { ayarYaz({ dil: d }); win.loadURL(adres(d)); menuKur(win, d); };
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: en ? 'File' : 'Dosya', submenu: [
      { label: en ? 'Reload' : 'Yeniden yükle', accelerator: 'F5', click: () => win.reload() },
      { type: 'separator' },
      { role: 'quit', label: en ? 'Quit' : 'Çıkış' },
    ] },
    { label: en ? 'Edit' : 'Düzen', submenu: [
      { role: 'undo', label: en ? 'Undo' : 'Geri al' }, { role: 'redo', label: en ? 'Redo' : 'Yinele' },
      { type: 'separator' },
      { role: 'cut', label: en ? 'Cut' : 'Kes' }, { role: 'copy', label: en ? 'Copy' : 'Kopyala' },
      { role: 'paste', label: en ? 'Paste' : 'Yapıştır' }, { role: 'selectAll', label: en ? 'Select all' : 'Tümünü seç' },
    ] },
    { label: en ? 'View' : 'Görünüm', submenu: [
      { role: 'zoomIn', label: en ? 'Zoom in' : 'Yakınlaştır' }, { role: 'zoomOut', label: en ? 'Zoom out' : 'Uzaklaştır' },
      { role: 'resetZoom', label: en ? 'Actual size' : 'Gerçek boyut' },
      { type: 'separator' }, { role: 'togglefullscreen', label: en ? 'Full screen' : 'Tam ekran' },
    ] },
    { label: 'Dil / Language', submenu: [
      { label: 'Türkçe', type: 'radio', checked: !en, click: () => dilDegistir('tr') },
      { label: 'English', type: 'radio', checked: en, click: () => dilDegistir('en') },
    ] },
    { label: en ? 'Help' : 'Yardım', submenu: [
      { label: en ? 'Web version' : 'Web sürümü', click: () => shell.openExternal(SITE + (en ? 'en/' : '')) },
      { label: en ? 'Check for updates' : 'Güncellemeleri denetle', click: () => guncellemeDenetle(win, true) },
      { label: en ? 'Source code and releases' : 'Kaynak kod ve sürümler', click: () => shell.openExternal('https://github.com/ysfdurak/durus-ergonomi') },
      { type: 'separator' },
      { label: (en ? 'Version ' : 'Sürüm ') + app.getVersion(), enabled: false },
    ] },
  ]));
}

async function baslat() {
  // app:// isteklerini uygulama klasöründen karşıla
  protocol.handle('app', (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const dosya = path.normalize(path.join(WEB, p));
    // WEB + ayırıcı: yalnızca "web" ile başlayan kardeş klasörlerin (ör. web-yedek) dışarı açılmasını da önler.
    if ((dosya !== WEB && !dosya.startsWith(WEB + path.sep)) || !fs.existsSync(dosya)) return new Response('Bulunamadı', { status: 404 });
    if (dosya.endsWith('.wasm')) return new Response(fs.readFileSync(dosya), { headers: { 'content-type': 'application/wasm' } });
    return net.fetch(pathToFileURL(dosya).toString());
  });

  let { dil } = ayarOku();
  if (dil !== 'tr' && dil !== 'en') { dil = await dilSor(); ayarYaz({ dil }); }

  const win = new BrowserWindow({
    width: 1360, height: 900, minWidth: 900, minHeight: 600,
    title: 'Duruş', backgroundColor: '#f3f3f1', show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: false },
  });
  win.once('ready-to-show', () => win.show());
  menuKur(win, dil);

  // Sayfadaki dil düğmesine basılırsa seçimi hatırla
  win.webContents.on('did-navigate', (_e, url) => {
    if (!url.startsWith('app://durus/')) return;
    const d = new URL(url).pathname.startsWith('/en/') ? 'en' : 'tr';
    if (d !== ayarOku().dil) { ayarYaz({ dil: d }); menuKur(win, d); }
  });
  // Dış bağlantılar varsayılan tarayıcıda açılsın; uygulama penceresi başka siteye gitmesin
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://durus/')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
  // İndirmelerde "Farklı kaydet" penceresi
  session.defaultSession.on('will-download', (_e, item) => {
    item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('documents'), item.getFilename()) });
  });

  win.loadURL(adres(dil));
  // Açılıştan biraz sonra sessizce denetle (internet yoksa hiçbir şey göstermez)
  setTimeout(() => guncellemeDenetle(win, false), 8000);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(baslat);
  app.on('window-all-closed', () => app.quit());
}
