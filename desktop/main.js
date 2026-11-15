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

// CDN adresi (başlangıcı) → uygulama içindeki dosya
const YEREL = [
  ['https://cdnjs.cloudflare.com/ajax/libs/exceljs/', 'lib/exceljs.min.js'],
  ['https://cdn.jsdelivr.net/npm/pdfmake@0.2.7/build/pdfmake.min.js', 'lib/pdfmake.min.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js', 'lib/pdfmake.min.js'],
  ['https://cdn.jsdelivr.net/npm/pdfmake@0.2.7/build/vfs_fonts.js', 'lib/vfs_fonts.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js', 'lib/vfs_fonts.js'],
  ['https://fonts.googleapis.com/css2', 'lib/fonts/fonts.css'],
];

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

const ayarOku = () => { try { return JSON.parse(fs.readFileSync(AYAR(), 'utf8')); } catch { return {}; } };
const ayarYaz = (a) => { try { fs.writeFileSync(AYAR(), JSON.stringify({ ...ayarOku(), ...a })); } catch {} };
const adres = (dil) => (dil === 'en' ? 'app://durus/en/' : 'app://durus/');

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
    if (!dosya.startsWith(WEB) || !fs.existsSync(dosya)) return new Response('Bulunamadı', { status: 404 });
    return net.fetch(pathToFileURL(dosya).toString());
  });

  // CDN isteklerini yerel kopyalara yönlendir (internet olmadan da PDF/Excel ve yazı tipi çalışır)
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['https://*/*'] }, (d, cb) => {
    const m = YEREL.find(([on]) => d.url.startsWith(on));
    cb(m ? { redirectURL: 'app://durus/' + m[1] } : {});
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
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(baslat);
  app.on('window-all-closed', () => app.quit());
}
