# Duruş — Ergonomi Analiz Merkezi

**Bir iş istasyonunu videodan, fotoğraftan ya da ölçümden ergonomik olarak değerlendiren uygulama. Türkçe ve İngilizce; tarayıcıda ya da Windows masaüstü uygulaması olarak çalışır. Hesap yok.**

- **Web (Türkçe):** https://durus.ysfdurak.com/
- **Web (English):** https://durus.ysfdurak.com/en/
- **Windows masaüstü:** [Sürümler (Releases)](https://github.com/ysfdurak/durus-ergonomi/releases/latest) sayfasından `Durus-…-kurulum.exe` (kurulumlu) ya da `Durus-…-tasinabilir.exe` (kurulumsuz). İnternet gerekmez.

> **English:** Duruş is an ergonomic risk analysis app (REBA, RULA, OWAS, QEC, NIOSH lifting equation, KIM, Liberty Mutual, OCRA, ROSA, Nordic questionnaire and more) with Excel/PDF reports. Use it in the browser at durus.ysfdurak.com/en/ or download the Windows app from Releases. Records stay on your device.

![Duruş analizi: örnek karede eklemler işaretlenmiş, REBA, RULA ve OWAS birlikte hesaplanmış](docs/ekran/durus-analizi.webp)

## Neler var?
- **Sahada en yaygın 11 yöntem tek yerde:** REBA, RULA, OWAS, QEC (Quick Exposure Check — sırt, omuz-kol, el-bilek ve boyun için hızlı tüm vücut taraması), NIOSH kaldırma denklemi, KIM kaldırma-tutma-taşıma ve KIM itme-çekme (BAuA), Liberty Mutual (Snook) itme-çekme-taşıma, OCRA kontrol listesi, ROSA (ofis) ve Nordik kas-iskelet anketi.
- **İleri düzey yöntemler:** LiFFT, DUET, ACGIH el aktivite düzeyi (HAL), Revize Strain Index, ofis iş istasyonu ve çalışma yüksekliği; ortam koşulları için gürültü, titreşim, ısı stresi (WBGT) ve aydınlatma.
- **Duruş analizi:** Video ya da fotoğraftan kare seç; eklemleri **otomatik bul** (MediaPipe Pose, görüntü cihazdan çıkmaz) ya da elle işaretle. Açılar hesaplanır, REBA, RULA ve OWAS aynı anda puanlanır. Görüntü yoksa açılar elle girilebilir. Mesafe ölçümü (kalibrasyon) var.
- **Rehber ve yorum desteği:** Hangi sonucun kullanılacağı, sınıra yakın açılar, girilmemiş yük ve yandan görünmeyen durumlar için uyarılar; kılavuzda sonuçların sınırları ile mevzuat ve sorumluluk bölümleri.
- **Rehber:** Birkaç evet/hayır sorusuyla riskli alanları bulur; her alan için tek bir önerilen yöntemi ve nedenini gösterir.
- **Saha modu:** Sahada fotoğraf çek ya da videodan kare al, tehlikeleri işaretle; analizi masaya dönünce yap.
- **İstasyonlar ve önlemler:** İşyeri, istasyon ve görev yapısı; Fine-Kinney ya da 5×5 matrisle risk değerlendirme tablosu; önlem takibi ve önlem sonrası yeniden ölçüm.
- **Senaryo dene:** Mevcut durumu sabitleyip değerleri değiştir (ör. yük 25 → 15 kg); sonuçlar yan yana karşılaştırılır, beğenilen senaryo tek tıkla önleme dönüşür ve yeniden ölçümde beklenenle karşılaştırılır.
- **Vücut bölgeleri ve iş rotasyonu:** Her görevin boyun, sırt-bel, omuz, dirsek, el-bilek ve bacak bölgelerini ne düzeyde zorladığı vücut figürü ve tabloyla; seçilen görevler için aynı bölgeyi art arda zorlamayan rotasyon sırası ve uyarılar.
- **Maliyet ve geri ödeme:** Kas-iskelet rahatsızlıklarının yıllık maliyeti, önlemlerle beklenen tasarruf, geri ödeme süresi ve 3 yıllık net kazanç.
- **Raporlar ve yedek:** Excel (tüm kayıtlar, görev raporu, tek kayıt değerlendirme formu), PDF rapor, CSV; tüm kayıtları tek .json dosyasına indirip başka cihazda geri yükleme.

| Başlangıç | Formlar (NIOSH) | Rehber |
|---|---|---|
| ![](docs/ekran/baslangic.webp) | ![](docs/ekran/formlar-niosh.webp) | ![](docs/ekran/rehber.webp) |

- **İki dil:** Türkçe ve İngilizce; sağ üstteki düğmeyle geçilir. İki dil aynı kayıtları kullanır.

## Nasıl çalışıyor?
- Tek bir HTML dosyası; sunucu yok. Hesaplar tarayıcıda yapılır.
- Düzenlenen tek kaynak `tools/i18n/source.html` (Türkçe). İngilizce sürüm ve yayındaki `index.html` bu kaynaktan üretilir (ayrıntı: [docs/GELISTIRME.md](docs/GELISTIRME.md)).
- Kayıtlar yalnızca kullanıcının tarayıcısında saklanır (localStorage, fotoğraf ve kareler için IndexedDB). Video ve fotoğraflar hiçbir sunucuya gönderilmez.
- Excel ve PDF raporlar için ExcelJS ve pdfmake web sürümünde ilk kullanımda CDN'den (cdnjs, jsDelivr) yüklenir; masaüstü sürümünde uygulamanın içinde gelir.
- Sonuçlar karar desteği içindir; bir iş güvenliği uzmanının ya da işyeri hekiminin değerlendirmesinin yerine geçmez.

## Yayın
- Canlı adres **durus.ysfdurak.com**: Cloudflare Workers, `main` dalına her gönderimde otomatik yayın (ayarlar `wrangler.jsonc`, yayın dışı dosyalar `.assetsignore`).
- Kendi bilgisayarında: depo kökünde `python -m http.server 8000`, sonra http://localhost:8000/ (İngilizce: /en/).
- **Masaüstü:** `v1.0.0` gibi bir etiket gönderilince GitHub Actions (`.github/workflows/masaustu.yml`) Windows kurulum dosyalarını üretip Releases'e koyar. Elle denemek için: `cd desktop && npm install && npm start`.

## Nasıl yapıldı?
Ürünü, kapsamı ve yöntem seçimini Yusuf Durak belirledi; kod ve içerik yapay zekâ (Claude) ile geliştirildi. İlk sürüm bir claude.ai artifact'ı olarak yapıldı; bu depodaki sürüm bağımsız çalışacak şekilde uyarlandı (dosya indirme tarayıcının kendi indirmesiyle yapılır).

Portföy: https://ysfdurak.com/tr/projeler/durus-ergonomi-analizi/
