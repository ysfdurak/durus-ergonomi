# Duruş — geliştirici notları

Bu belge, projeyi kendin değiştirebilmen ve sorulduğunda anlatabilmen için yazıldı. Her bölüm “ne var, neden böyle, nasıl değiştirilir” sırasıyla gider.

## 1. Klasör yapısı

```
durus-ergonomi/
├─ tools/i18n/source.html   ← DÜZENLEDİĞİN TEK DOSYA (Türkçe, uygulamanın tamamı)
├─ tools/i18n/en.json       ← İngilizce sözlük: "Türkçe metin" → "English text"
├─ tools/i18n/segments.mjs  ← kaynaktaki çevrilecek metinleri bulur
├─ tools/i18n/extract.mjs   ← yeni metinleri sözlüğe ekler
├─ tools/i18n/build.mjs     ← index.html ve en/index.html dosyalarını üretir
├─ index.html               ← ÜRETİLİR: Türkçe yayın (elle düzenleme, üzerine yazılır)
├─ en/index.html            ← ÜRETİLİR: İngilizce yayın
├─ desktop/                 ← Windows masaüstü uygulaması (Electron)
├─ .github/workflows/masaustu.yml ← Windows .exe üretimi
├─ wrangler.jsonc, .assetsignore  ← Cloudflare yayını
└─ sitemap.xml, robots.txt, favicon.svg, og.jpg
```

## 2. Uygulamanın içi (source.html)

Tek dosya: üstte CSS, ortada HTML iskeleti (başlık, sekmeler), altta tek bir `<script>`. Kodun neredeyse tamamı bir `(function(){ ... })();` bloğunun içinde; bu yüzden yeni yardımcı fonksiyonlar bu bloğun içine, `window.__durus=` satırından önce eklenir.

Önemli yapılar:

| Ad | Ne işe yarar |
|---|---|
| `FORMS` | Her yöntem bir kayıt: `{g: grup, n: ad, intro, fields:[...], calc(d)}`. `calc` girilen değerleri alır, `{v, txt, lv, nm, tips, bd}` döndürür (`lv` 0–4 risk düzeyi, `txt` ekranda büyük görünen puan, `bd` hesap dökümü). |
| `fields` | Form alanları: `sel` (seçim), `num` (sayı), `chk`, `yn`, `rows`; `show:d=>...` alanı koşula bağlar, `h` yardım metni. |
| `FG`, `ORD`, `CORE` | Formlar sekmesindeki gruplar, sıra ve “temel set” (ilk görünen 8 yöntem). |
| `LIB` + yöntem bilgileri | Yöntem kartları: düzey, süre, araç, ne zaman kullanılmaz, benzerleri. |
| `AREA_OF` | Yöntemin risk haritasında hangi sütuna düştüğü. |
| `HELP` | Kılavuz sekmesinin bölümleri `{id, t, b}`. |
| `LV` | Düzey renkleri. |

Yeni bir yöntem eklemek = `FORMS`'a bir kayıt + `ORD`/`FG`/`AREA_OF`/`LIB` satırları. QEC bu şekilde eklendi: puan tablolarındaki her hücre `2×(satır+sütun−1)`; bölge puanı etkileşimlerin toplamı; sırt için statik/hareketli iş ayrı sınırlarla değerlendirilir; sonuç en kötü bölgedir.

**EAWS neden yok?** EAWS'ın puan tabloları lisanslıdır (MTM/IAD); izinsiz kopyalanamaz. Kılavuzda bu açıklanıyor.

## 3. İki dil nasıl çalışıyor?

Uygulama Türkçe yazılır; İngilizce sürüm otomatik üretilir. Kodu iki kez yazmazsın.

1. `segments.mjs` kaynaktaki görünen metinleri bulur: HTML metinleri, `title/placeholder/aria-label/alt` öznitelikleri ve JavaScript içindeki metin dizeleri. Kod gibi görünen dizeleri (`'Escape'`, `'image/jpeg'`) atlar.
2. `en.json` bu metinlerin çevirilerini tutar. Anahtar Türkçe metnin kendisidir. Değeri boş bırakılan ya da hiç yazılmayan metin İngilizce sürümde Türkçe kalır (kod parçaları bilerek böyle).
3. `build.mjs` her metni çevirisiyle değiştirir ve ayrıca İngilizce sürümde:
   - ondalık ayırıcıyı virgülden noktaya çevirir (`0,78` → `0.78`),
   - tarih biçimini `tr-TR` → `en-GB` yapar,
   - yüzde işaretini sayının arkasına alır (`%49` → `49%`),
   - `lang`, canonical ve hreflang etiketlerini ayarlar, dil düğmesini koyar.
   - Bir çevirideki HTML etiketleri orijinalle aynı değilse durur ve hatayı söyler (bozuk sayfa yayınlanmasın diye).

**Bir şey değiştirdiğinde iş akışı:**

```bash
# 1) tools/i18n/source.html dosyasını düzenle
cd tools && npm install          # ilk seferde
node i18n/extract.mjs            # yeni metinleri en.json'a boş olarak ekler, sayısını söyler
# 2) en.json'da boş ("") değerleri doldur
node i18n/build.mjs              # index.html ve en/index.html üretilir
```

`build.mjs` sonunda “çevrilmemiş Türkçe metin” listesi verir; yalnız `&L&8Duruş · ` (Excel sayfa başlığı, marka adı) kalması normaldir.

## 4. Web yayını

Cloudflare Workers statik dosya olarak depo kökünü yayınlar (`wrangler.jsonc` içinde `assets.directory: "./"`). `.assetsignore` yayına girmeyecekleri listeler (`tools`, `desktop`, `docs`...). `main`'e her gönderim otomatik yayına çıkar. Cloudflare'deki proje adı `wrangler.jsonc` içindeki `name` (`durus-ergonomi`) ile aynı olmalı.

## 5. Masaüstü uygulaması (desktop/)

Electron ile yazılmış ince bir kabuk; içinde web sürümünün aynısı çalışır.

- `hazirla.mjs`: üretilmiş `index.html`, `en/index.html` ve kütüphaneleri (ExcelJS, pdfmake, IBM Plex yazı tipleri) `desktop/web/` klasörüne kopyalar.
- `main.js`:
  - Sayfaları `app://durus/` adresinden açar. Tek adres kökü olduğu için Türkçe ve İngilizce aynı kayıtları paylaşır.
  - Web sürümünün CDN'e giden isteklerini (`YEREL` tablosu) uygulama içindeki kopyalara yönlendirir. Böylece kaynak dosyada masaüstüne özel bir değişiklik yok ve internet gerekmiyor.
  - İlk açılışta dil sorar; seçimi `%APPDATA%\Durus\ayar.json` dosyasına yazar. Menüde “Dil / Language” ile değişir; sayfadaki dil düğmesi de seçimi günceller.
  - Kayıtlar (localStorage/IndexedDB) `%APPDATA%\Durus` altında durur.
  - Dış bağlantılar varsayılan tarayıcıda açılır; dosya indirirken “Farklı kaydet” penceresi çıkar.
- Paketleme `electron-builder` ile: `package.json` → `build` bölümü. Kurulumlu (NSIS, Türkçe/İngilizce kurulum ekranı) ve taşınabilir iki `.exe` üretir.

**Yeni sürüm çıkarmak:**

```bash
git tag v1.0.1 && git push origin v1.0.1
```

GitHub Actions Windows makinesinde paketler ve Releases sayfasına iki dosyayı yükler. Sürüm numarası etiketten alınır. Uygulama imzasız olduğu için Windows ilk açılışta SmartScreen uyarısı verebilir (“Ek bilgi → Yine de çalıştır”); bunu kaldırmak için kod imzalama sertifikası gerekir (ücretli).

**Kendi bilgisayarında denemek:** `cd desktop && npm install && npm start` (önce kökte `node tools/i18n/build.mjs` çalışmış olmalı).

## 6. Sık sorulabilecek sorular

- **Veriler nereye gidiyor?** Hiçbir yere. Web'de tarayıcıda, masaüstünde `%APPDATA%\Durus` klasöründe.
- **Sunucu (VPS) gerekir mi?** Şu an hayır. Birden çok kişinin aynı kayıtları görmesi, merkezi yedek ya da kullanıcı girişi istenirse gerekir.
- **Neden iki ayrı HTML var da tek dosyada dil seçimi yok?** Arama motorları her dili ayrı adreste görmek ister (`/` ve `/en/`), ve çeviri derleme anında yapıldığı için uygulama kodu tek dilde kalıp sadeleşir.
- **Hesaplar doğru mu?** Her yöntemin kaynağı yöntem kartında yazar; örnek değerlerle test edildi. Sonuçlar karar desteğidir; uzman değerlendirmesinin yerine geçmez.
