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

### Benzer araçlardan alınan özellikler

Kasım 2026'da ticari ve akademik ergonomi yazılımlarına bakılarak Duruş'a uygun olan özellikler eklendi:

| Özellik | Esin kaynağı | Duruş'ta nerede | Kodda |
|---|---|---|---|
| Eklemleri görüntüden otomatik bulma | TuMeke, Ergoniza Intelligent, ErgoPlus 360, VelocityEHS (yapay zekâ ile poz tahmini) | Duruş analizi → “Noktaları otomatik bul” | `loadPose`, `detectPose`, `autoPoints` |
| Vücut bölgesi profili | ErgoPlus Job Screen (her bölge için ayrı risk), QEC | İstasyonlar → Vücut bölgeleri | `regionLv`, `taskRegions`, `renderBody`, `bodySVG` |
| İş rotasyonu planı | VelocityEHS Job Rotation Tool, ErgoPlus Job Rotation Evaluator | İstasyonlar → İş rotasyonu planı | `rotCost`, `bestOrder`, `renderRot` |
| Senaryo dene (“şunu değiştirsem ne olur?”) | MCP ile sohbetten hesap yerine programın içinde; Ergoniza/VelocityEHS’teki önlem önerisi ve kontrol akışı | Formlar ve Duruş analizi → “Senaryo dene” | `SC`, `AD` (bağdaştırıcılar), `renderScen`, `formDiff`, `postureDiff` |
| Maliyet ve geri ödeme | VelocityEHS ROI hesaplayıcı | Önlemler → Maliyet ve geri ödeme; önlemde “Tahmini maliyet” | `ROI_F`, `renderRoi` |

Duruş'ta zaten olanlar: önce-sonra karşılaştırması ve doğrulanmış iyileşme (VelocityEHS Risk Reduction Index'e benzer), saha turu ve hızlı tarama (ErgoPlus Quick Screen'e benzer), vardiya içi riskli süre payı (“time at risk”), istasyon-görev yapısı ve Excel/PDF raporlar.

Bilerek alınmayanlar: çok kullanıcılı bulut veritabanı ve kullanıcı girişi (sunucu, yani VPS gerektirir), 3B hareket yakalama ve giyilebilir sensörler (ek donanım ister), EAWS (lisanslı).

**Otomatik bulma nasıl çalışıyor?** MediaPipe Pose (Google, Apache 2.0 lisanslı) görüntüde 33 vücut noktası tahmin eder. `detectPose` bunlardan Duruş'un 8 noktasını seçer: kulak, omuz, dirsek, bilek, işaret ve serçe parmak köklerinin ortası (el), kalça, diz, ayak bileği. Taraf, “Değerlendirilen taraf” seçiliyse o taraf, değilse görünürlük puanı yüksek olan taraftır; yön, burnun kulağa göre konumundan bulunur. Görünürlüğü 0,3'ün altındaki noktalar konmaz. Model web sürümünde jsDelivr'den ilk kullanımda iner (yaklaşık 10 MB); masaüstünde `desktop/web/lib/pose/` içinde gelir.

**Bölge düzeyleri:** Duruş analizinde REBA bileşen skorları doğrudan düzeye çevrilir (gövde 1–5 → en çok 4, boyun 1–3, üst kol 1–6 → en çok 4, ön kol 1–2, bilek 1–3, bacak 1–4). Diğer formlarda yöntemin genel sonucu `REG_OF` tablosundaki bölgelere yazılır. Bu bir özet görünümdür; yöntemin kendi sonucu her zaman önceliklidir.

**Senaryo dene nasıl çalışıyor?** Her ekran bir bağdaştırıcı verir (`AD.form`, `AD.posture`): durumu al (`get`), durumu yükle (`set`), durumdan sözde kayıt üret (`rec`), iki durum arasındaki farkları yaz (`diff`). Senaryo başlarken mevcut durum `SC[anahtar].base` olarak kopyalanır; ekrandaki değerler “bu senaryo”dur, “Sakla” ile listeye eklenir. Sonuçlar normal kayıtlar gibi `results()` ile hesaplanır, yani senaryo için ayrı hesap kodu yoktur. Senaryodan önlem oluşturulunca önleme `before` (mevcut), `exp` (beklenen) ve formlarda `sdata` (senaryo değerleri) yazılır; “Yeniden ölç” formu `sdata` ile açar. Senaryolar kaydedilmez, sayfa yenilenince silinir. Senaryo modunda Kaydet düğmesi kapalıdır; böylece senaryo değerleri yanlışlıkla gerçek kayıt olmaz.

**Videoyu otomatik tara nasıl çalışıyor?** `scanVideo` videoyu seçilen aralıkla (`seekTo` ile) ilerletir, her kareyi en fazla 1280 piksel genişliğinde bir tuvale çizer ve `detectPose`'a verir. Omuz ve kalça dahil en az 5 nokta bulunan kareler, 160 piksellik küçük resimle ve `scan` kimliğiyle duruş kaydı olarak eklenir; tam kare saklanmaz (yer tasarrufu). Noktalar 1280 piksellik kare ölçüsünde tutulduğu için kayıt, aynı video açıkken açılınca `openRecord` kareyi videodan yeniden alır ve noktalar doğru yere oturur. “Bu taramayı geri al” aynı `scan` kimliğine sahip kayıtları siler.

**Raporlardaki yeni bölümler:** PDF'te bölüm numaraları artık sayaçla (`N()`) verilir; vücut bölgeleri ve rotasyon (`rotPlan`), maliyet ve geri ödeme (`roiCalc`) ekran ile aynı fonksiyonları kullanır. Excel'de `addBodySheet` ve `addRoiSheet` sayfaları eklenir; önlem planında “Senaryoda beklenen” ve “Tahmini maliyet” sütunları vardır.

**Masaüstü güncelleme denetimi:** `main.js` içindeki `guncellemeDenetle`, GitHub API'den son sürümü alır ve `app.getVersion()` ile karşılaştırır. Yeni sürüm varsa indirme sayfasını önerir; “Bu sürümü atla” seçimi `ayar.json`'a yazılır. Kendini otomatik güncellemez, çünkü imzasız uygulamalarda otomatik güncelleme Windows uyarılarıyla sorun çıkarır.

**Rotasyon algoritması:** İki görev arasındaki ceza, ikisinde de yüksek (3+) olan her bölge için büyük, diğer bölgelerdeki ortak yük için küçüktür. Sıra döngüsel kabul edilir. 8 göreve kadar tüm sıralar denenir; daha fazlasında her adımda en düşük cezalı görev seçilir.

### Önce–sonra bağı (Kasım 2026)

**Ne var?** Önlem kartı ve raporlar üç değeri ayrı yazar: **önce (ölçüm)**, **tahmini senaryo (ölçüm değil)** ve **sahada yeniden ölçüm**. Tahmini senaryo “Senaryo dene” ekranındaki değerlerden hesaplanır; sahada bir şey ölçülmemiştir. “Sahada yeniden ölçülen iyileşme” etiketi yalnız şu koşulların hepsi tutunca çıkar:

1. Sonraki kayıt önleme **bağlı** (`a.ver.after`) ve önceki ölçümle aynı **istasyon › görev** ve aynı **yöntem**de (kod bunu kendisi denetler; farklıysa bağ sayılmaz).
2. Karşılaştırma **koşulları** işaretli: aynı çalışan ya da benzer boy/deneyim, aynı yük-ürün-ekipman, aynı iş hızı-adet, aynı vardiya dönemi-ortam; duruş analizinde ayrıca aynı çekim açısı-mesafe.
3. **Önce ve sonra fotoğrafı** seçili ve **yeniden ölçüm tarihi** girili.
4. Risk düzeyi önceki ölçümden **düşük**.

Eksik varsa kart “karşılaştırma koşulları eksik” yazar ve eksikleri sayar. Bağlanmamış sonraki ölçüm (eski kayıtlar) “önleme bağlanmadı” diye görünür; iyileşme sayısına girmez.

**Akış:** Önlem kartında “Yeniden ölç” → kayıt kaydedilince `linkRemeasure` onu önleme bağlar (tarih = kayıt günü, fotoğraf = varsa kaydın küçük resmi). “Ölçümü bağla / bağı düzenle” penceresi (`openVerDlg`) kaydı, tarihi, koşulları, notu ve fotoğrafları düzenler. Fotoğraf görevdeki duruş karelerinden, saha kayıtlarından seçilir ya da yüklenir; 320 piksellik küçük resim olarak önlemde saklanır (JSON yedeğe girer).

| Ad | Ne işe yarar |
|---|---|
| `a.ver` | `{after, date, cond:{worker,load,pace,env,view}, note, phB, phA}` |
| `verOf(a)` | Bağlı ölçümün sonucu, eksik koşullar; bağ yoksa eski yol (`legacyAfter`) |
| `measLabel(a)`, `EST_L` | Kart, Excel ve PDF'teki ölçüm türü etiketi |
| `fieldVerified(a)` | “Sahada yeniden ölçülen iyileşme” sayılır mı |
| `baBlock(a)` | Karttaki üç satır ve fotoğraf çifti |

Excel “Önlem planı” sayfasında yeni sütunlar: Önce (ölçüm), Tahmini senaryo (ölçüm değil), Sahada yeniden ölçüm, Yeniden ölçüm tarihi, Ölçüm türü, Karşılaştırma koşulları. PDF önlem planı aynı etiketleri kullanır ve “Önce–sonra fotoğrafları” bölümünü ekler.

### Değerlendirme zinciri (Kasım 2026)

Önlem kartında açılır “Değerlendirme zinciri”: **gözlenen** (önceki ölçüm ve tarihi) → **değerlendirme gerekçesi** (puanın hesabı, `primary(rec).m.bd`) → **önerilen iş düzenlemesi** (önlem başlığı ve ayrıntısı) → **yeniden değerlendirme** (bağlı sonraki ölçüm, iyileşme ve yeni hesap). Bağlı ölçüm varsa iki kayıt arasındaki girdi farkları “Sonucu değiştiren girdiler” başlığıyla listelenir: duruşta `postureDiff`, formlarda `formDiff` (Senaryo dene'deki fonksiyonların aynısı). Kod: `chainBlock(a)`. Fark hesaplanamazsa “Girdi farkları hesaplanamadı” yazar; “fark yok” demez.

**Aynı gün yeniden ölçüm:** Duruşta bir günün sonucu o gün o görevdeki karelerin en kötüsüdür (`postureDay`). Önlemin önceki ölçümü bu gruptan çıkarılır (`postureDay(tk, rec, a.rec)`); böylece önlem aynı gün uygulanıp yeniden ölçülürse sonucu önceki kare belirlemez. Kasım 2026'dan önce bu durumda iyileşme “aynı seviye” görünüyordu.

### Silme ve ortak cihaz (19 Kasım 2026)

Ortak cihazda bir çalışmanın fotoğrafları ve kayıtları birlikte silinmeli. Kontrolde dört açık bulundu ve kapatıldı:

| Durum | Önce | Şimdi (kod) |
|---|---|---|
| Saha kaydını silmek | Yalnız düzenlerken tek tek fotoğraf kaldırılabiliyordu | Kartta “Sil” (iki basış): kayıt ve IndexedDB'deki tam boy fotoğraflar (`MDB.del`) silinir |
| İstasyon / görev silmek | Analiz kaydı yoksa siliniyordu; o görevin saha kayıtları ve fotoğrafları görünmez hâlde kalıyordu | Saha kaydı da sayılır; varsa silme engellenir ve sayısı söylenir |
| Analiz kaydı silmek | Önlemdeki yeniden ölçüm bağı ve önce/sonra fotoğraf kopyası kalıyordu | `dropRecord`: bağ ve aynı küçük resmin kopyaları silinir |
| “Tümünü sil” | Yalnız analiz kayıtlarını siliyordu | `wipeAll`: localStorage (`durus_v3`, `durus_v1`), IndexedDB `durus_media`, önlemler, saha kayıtları ve tanımlar. MDB bağlantısı `onversionchange` ile kapanır; yoksa silme sayfa kapanana kadar bekliyordu |

Sentetik kayıtla tarayıcıda denendi (kayıt, saha fotoğrafı, önlem fotoğrafı, tümünü sil). Kılavuz › Veriler bölümüne ortak cihaz notu eklendi.

## 3. İki dil nasıl çalışıyor?

Uygulama Türkçe yazılır; İngilizce sürüm otomatik üretilir. Kodu iki kez yazmazsın.

1. `segments.mjs` kaynaktaki görünen metinleri bulur: HTML metinleri, `title/placeholder/aria-label/alt` öznitelikleri ve JavaScript içindeki metin dizeleri. Kod gibi görünen dizeleri (`'Escape'`, `'image/jpeg'`) atlar. Sayfadaki **bütün** `<script>` blokları taranır. (Kasım 2026 düzeltmesi: önceden yalnız son blok taranıyordu; sayfanın sonuna service worker betiği eklenince ana betiğin metinleri İngilizce sürümde Türkçe kalmış, sayaç yine de 0 göstermişti.)
2. `en.json` bu metinlerin çevirilerini tutar. Anahtar Türkçe metnin kendisidir. Değeri boş bırakılan ya da hiç yazılmayan metin İngilizce sürümde Türkçe kalır (kod parçaları bilerek böyle).
3. `build.mjs` her metni çevirisiyle değiştirir ve ayrıca İngilizce sürümde:
   - ondalık ayırıcıyı virgülden noktaya çevirir (`0,78` → `0.78`),
   - tarih biçimini `tr-TR` → `en-GB` yapar,
   - yüzde işaretini sayının arkasına alır (`%49` → `49%`),
   - `lang`, canonical ve hreflang etiketlerini ayarlar, dil düğmesini koyar.
   - Bir çevirideki HTML etiketleri orijinalle aynı değilse durur ve hatayı söyler (bozuk sayfa yayınlanmasın diye).

**Hangi dil açılır?** Her iki sayfanın başında `build.mjs`'in eklediği küçük bir betik var. Sırasıyla: adreste `?lang=tr|en` varsa o dil seçilir ve hatırlanır; kişi daha önce dil düğmesine bastıysa (tarayıcıda `durus_dil`) o dil açılır; hiç seçim yoksa ve tarayıcı dili Türkçe değilse Türkçe sayfa İngilizceye yönlendirilir. Arama motoru botları ve masaüstü uygulaması (`app://`) yönlendirilmez; böylece iki dil de kendi adresinde dizinlenir, masaüstünde dil menüden seçilir.

**Bir şey değiştirdiğinde iş akışı:**

```bash
# 1) tools/i18n/source.html dosyasını düzenle
cd tools && npm install          # ilk seferde
node i18n/extract.mjs            # yeni metinleri en.json'a boş olarak ekler, sayısını söyler
# 2) en.json'da boş ("") değerleri doldur
node i18n/build.mjs              # index.html ve en/index.html üretilir
```

`build.mjs` sonunda “çevrilmemiş Türkçe metin” listesi verir; 0 olmalı. Marka adı gibi aynen kalacak metinler (`&L&8Duruş · `) sözlüğe kendisiyle aynı değerle yazılır.

## 4. Web yayını

Cloudflare Workers statik dosya olarak depo kökünü yayınlar (`wrangler.jsonc` içinde `assets.directory: "./"`). `.assetsignore` yayına girmeyecekleri listeler (`tools`, `desktop`, `docs`...). `main`'e her gönderim otomatik yayına çıkar. Cloudflare'deki proje adı `wrangler.jsonc` içindeki `name` (`durus-ergonomi`) ile aynı olmalı.

## 5. Masaüstü uygulaması (desktop/)

Electron ile yazılmış ince bir kabuk; içinde web sürümünün aynısı çalışır.

- `hazirla.mjs`: üretilmiş `index.html`, `en/index.html` ve kütüphaneleri (ExcelJS, pdfmake, MediaPipe Pose, IBM Plex yazı tipleri) `desktop/web/` klasörüne kopyalar.
- `main.js`:
  - Sayfaları `app://durus/` adresinden açar. Tek adres kökü olduğu için Türkçe ve İngilizce aynı kayıtları paylaşır.
  - Web sürümünün CDN'e giden isteklerini (`YEREL` tablosu) uygulama içindeki kopyalara yönlendirir. Böylece kaynak dosyada masaüstüne özel bir değişiklik yok ve internet gerekmiyor.
  - İlk açılışta dil sorar; seçimi `%APPDATA%\Durus\ayar.json` dosyasına yazar. Menüde “Dil / Language” ile değişir; sayfadaki dil düğmesi de seçimi günceller.
  - Kayıtlar (localStorage/IndexedDB) `%APPDATA%\Durus` altında durur.
  - Dış bağlantılar varsayılan tarayıcıda açılır; dosya indirirken “Farklı kaydet” penceresi çıkar.
- Paketleme `electron-builder` ile: `package.json` → `build` bölümü. Kurulumlu (NSIS, Türkçe/İngilizce kurulum ekranı) ve taşınabilir iki `.exe` üretir.

**Yeni sürüm çıkarmak:**

1. `desktop/package.json` içindeki `"version"` değerini artır (ör. `1.4.0` → `1.5.0`) ve `main`'e gönder.
2. Aynı numarayla etiket gönder:

```bash
git tag v1.5.0 && git push origin v1.5.0
```

GitHub Actions Windows makinesinde paketler, yeni bir Release oluşturur ve iki `.exe` ile `SHA256SUMS.txt` dosyasını yükler.

Kurallar (aynı sürüm numarası her zaman aynı dosya demek):
- `main`'e gelen değişiklikler yalnızca derlenir; EXE'ler Actions çalıştırmasının **Artifacts** bölümünde 30 gün durur. Herkese açık Release'e dokunulmaz. Yayımlamadan önce denemek için buradan indir.
- Etiket `package.json` sürümüyle aynı değilse iş durur.
- O etiket için Release zaten varsa iş durur; yayımlanmış dosyalar değiştirilmez. Düzeltme gerekiyorsa sürümü artırıp yeni etiket gönder.

Uygulama imzasız olduğu için Windows ilk açılışta SmartScreen uyarısı verebilir (“Ek bilgi → Yine de çalıştır”); bunu kaldırmak için kod imzalama sertifikası gerekir (ücretli).

**Kendi bilgisayarında denemek:** `cd desktop && npm install && npm start` (önce kökte `node tools/i18n/build.mjs` çalışmış olmalı).

## 6. Sık sorulabilecek sorular

- **Veriler nereye gidiyor?** Hiçbir yere. Web'de tarayıcıda, masaüstünde `%APPDATA%\Durus` klasöründe.
- **Sunucu (VPS) gerekir mi?** Şu an hayır. Birden çok kişinin aynı kayıtları görmesi, merkezi yedek ya da kullanıcı girişi istenirse gerekir.
- **Neden iki ayrı HTML var da tek dosyada dil seçimi yok?** Arama motorları her dili ayrı adreste görmek ister (`/` ve `/en/`), ve çeviri derleme anında yapıldığı için uygulama kodu tek dilde kalıp sadeleşir.
- **Hesaplar doğru mu?** Her yöntemin kaynağı yöntem kartında yazar; örnek değerlerle test edildi. Sonuçlar karar desteğidir; uzman değerlendirmesinin yerine geçmez.

## 7. Uçtan uca denetim · 23 Kasım 2026 (masaüstü 1.4.5)

- **Puan doğrulaması:** REBA ve RULA, uygulamadan bağımsız yazılmış çalışma kâğıdı tablolarıyla (Hignett ve McAtamney 2000; McAtamney ve Corlett 1993) 20.000 rastgele duruş ve düzeltme seçeneği üzerinde karşılaştırıldı. Fark çıkmadı.
- **Tarayıcıda uçtan uca (TR ve EN):** Örnekle dene, otomatik nokta bulma, kaydetme, 10 formun sonucu, PDF ve Excel rapor, yedek indir, tümünü sil, yedekten geri yükle. İngilizce PDF'te Türkçe metin kalmadı.
- **Düzeltme:** "Tümünü sil"den sonra kendiliğinden boş bir "İşyerim" açılıyordu; yedek geri yüklenince yedekteki işyeri onun yanına ekleniyor, iki işyeri oluyordu. İçe aktarmada yedekte işyeri varsa bu boş varsayılan işyeri atılıyor (kaynak: `tools/i18n/source.html`, `#ioLoad`).


## 8. Gerçek videoyla deneme · 23 Kasım 2026 (masaüstü 1.4.6)

Açık lisanslı (Pexels) gerçek depo videoları ve fotoğraflarıyla "Videoyu tara" ve "Noktaları otomatik bul" sınandı (Chromium, Playwright).

- **Bulgu:** Kişi yandan görünmediğinde 2B çizimden ölçülen açı ciddi biçimde kısalıyordu. Kameraya çapraz dönük, yerden koli alan çalışanda göze 70–100° görünen gövde eğilmesi 2B'de 15–34° ölçüldü; bir karede yüz yönü (burun-kulak) yanlış seçildiği için öne eğilme geriye eğilme sayıldı. Tarama en kötü kareyi REBA 5 gösterdi.
- **Düzeltme:** MediaPipe'ın 3B dünya noktalarından (`poseWorldLandmarks`) gövdeye göre açılar hesaplanıyor (`angles3`): gövde öne eğilme ve yana eğilme, boyun, üst kol (gövdeye göre), dirsek, bilek, diz. Omuzlar arası 2B uzaklığın gövde boyuna oranı 3B'deki oranın yarısından azsa kişi yandan görünüyor sayılır ve eski 2B ölçüm kullanılır; değilse 3B açılar geçerli olur ve ekranda "Kişi yandan görünmüyor" uyarısı çıkar. Bir nokta elle sürüklenince 3B açılar silinir, çizim esas alınır. Yüz yönü önce ayak ucu-topuktan bulunur.
- **Sonuç:** Aynı videoda 16 karenin 10'unda 3B açı kullanıldı; derin eğilmede gövde 72–108°, en kötü kare REBA 8 (yüksek risk). Yandan görünen karelerde iki yöntem birkaç derece içinde aynı.
- **Denetim:** `node tools/e2e/aci3b-kontrol.mjs` bilinen 12 duruştan üretilmiş 3B noktalarla açıları doğrular (CI'da çalışır).
- **Nokta kabulü (ikinci tur):** Kamyon yüklemesi fotoğrafında (arkası dönük, kollar yukarıda) kulak ve el noktaları kolinin üstüne, görüntü dışında kalan kalça görüntünün kenarına konuyordu. Artık bir nokta ancak model yeterince eminse (görünürlük ≥ 0,5), görüntünün içindeyse ve kişinin silüetinin (MediaPipe segmentasyon maskesi) üstünde ya da 2% yakınındaysa konuyor; değilse boş kalır ve elle konur. Aynı videolarda tarama sonucu değişmedi (en kötü kare REBA 8).
- **Açı etiketleri:** Eğilmiş gövdede eklemler birbirine yakın düştüğü için Gövde, Üst kol ve Boyun etiketleri üst üste biniyor, nokta işaretleri yazıyı kapatıyordu. Etiketler artık birbirini ve noktaları engel sayarak yerleşiyor; uzağa kayan etiket ince bir çizgiyle eklemine bağlanıyor.
- **Bilinen sınırlar:** Karede birden çok kişi varsa model en belirgin olanı seçer; hangi kişinin ölçüleceği seçilemiyor. Arkası dönük ve kollar başın üstündeyken 3B kol açısı az çıkabiliyor. Uzaktaki küçük kişide (görüntünün ~%20'sinden kısa) nokta bulunamıyor. Bu durumlarda noktaları elle koymak gerekir.

## 9. Windows'ta kurulum ve uçtan uca deneme · 24 Kasım 2026 (masaüstü 1.4.6)

Gerçek bir Windows 11 bilgisayarda, kurulu 1.4.1'in üzerine yapıldı (örneklem; her adım değil, kullanıcının ilk yapacakları):

| Adım | Sonuç |
|---|---|
| Güncelleme bildirimi | 1.4.1, Yardım menüsü açılınca "Yeni sürüm var: 1.4.6" penceresini gösterdi. |
| Kurulum (`Durus-1.4.6-kurulum.exe`, SHA256 sürüm sayfasıyla aynı) | "Sadece benim için" + varsayılan klasör. Eski sürüm açıkken "Duruş çalışıyor, kapatmak için Tamam" uyarısı çıktı, Tamam ile kapattı ve kurdu. Yardım › Sürüm 1.4.6. |
| Kayıtlar | Güncellemeden önceki kayıt korundu (Son kayıtlar: 1). |
| Video tarama | Bulanıklaştırılmış gerçek yükleme videosu (8,4 sn, 2 sn aralık): 2 kare kaydedildi, en kötü REBA 3; 1 karede 3D açı kullanıldı. |
| Tek kare | Noktalar kişinin üzerinde, kolilerde değil; etiketler çakışmıyor; "Kişi yandan görünmüyor" uyarısı çıktı. |
| PDF rapor | İstasyonlar › PDF rapor indir: 3 sayfa, Türkçe karakterler doğru. |

**Kapanış (doğrulandı, sorun yok):** Kurulumdaki "Duruş çalışıyor" uyarısı, denemede eski pencerenin kapatma düğmesi yerine yanına tıklandığı için çıktı. Ayrıca ölçüldü: Duruş açıkken 4 süreç (Electron ana + yardımcılar), X ile kapatınca 0. `main.js` `window-all-closed` olayında `app.quit()` çağırıyor; tepside bekleme yok.

**Not:** Taşınabilir exe Gezgin'den başlatılırken bu oturumda pencere açılmadı (otomasyon kısıtından olabilir); kullanıcının kendisinin bir kez çift tıklayıp SmartScreen uyarısı çıkıp çıkmadığını görmesi yeterli.
