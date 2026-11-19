# Mülakatta sorulabilecek sorular · Duruş

Bu kart, projeyi kendi ağzınla anlatabilmen için. Cevaplar kısa tutuldu; ayrıntısı belirtilen belgede. Kod yapay zekâ (Claude) ile yazıldı; kapsam, öncelik ve aşağıdaki kararlar senin. Bunu saklama, açıkça söyle: "Ürünü ve kararları ben belirledim, kodu yapay zekâyla yazdım, her kararın nedenini anlatabilirim."

**1. Bu proje ne yapıyor?**
Bir iş istasyonunu videodan, fotoğraftan ya da ölçümden ergonomik olarak değerlendiriyor; REBA, RULA ve OWAS puanlarını aynı anda veriyor.

**2. Eklem noktalarını nasıl buluyorsun?**
MediaPipe Pose ile cihazda otomatik ya da elle işaretleme; açılar hesaplanıyor. Görüntü cihazdan çıkmıyor.

**3. Neden üç yöntem birden?**
Her yöntem farklı şeye bakıyor (tüm vücut, üst gövde, duruş sınıfı); birlikte görmek tek puana körü körüne güvenmeyi önlüyor.

**4. Önce-sonra nasıl ölçülüyor?**
Yeniden ölçüm önleme bağlanıyor: aynı istasyon, görev ve yöntem, aynı koşullar. Raporda tahmini senaryo ile sahada ölçülen iyileşme ayrı etiketleniyor.

**5. Veri nerede?**
Tarayıcıda (fotoğraflar IndexedDB'de) ya da masaüstü sürümde bilgisayarda. Hesap yok, sunucu yok.

**6. Ortak cihazda ne oluyor?**
Tek bir saha kaydı fotoğraflarıyla birlikte silinebiliyor; 'tümünü sil' kayıtları ve fotoğrafları birlikte temizliyor. Bu boşluklar bir incelemede bulundu ve kapatıldı.

**7. Çalışan mahremiyeti?**
Çekimden önce bilgilendirme ve onay gerekiyor; risk puanı istasyona ait, kişinin sağlığı ya da performansı hakkında değil. Şablon docs/KVKK_VE_CALISAN_BILGILENDIRME.md'de.

**8. Teknik yapı?**
Tek HTML dosyası, Türkçe ve İngilizce sayfalar tek kaynaktan derleniyor; Windows masaüstü sürümü Electron. CI derlenmiş sayfanın kaynakla aynı olduğunu ve önbellek adını denetliyor.

**9. Puanlar ne kadar güvenilir?**
Ölçümün tekrarlanabilirliği henüz ölçülmedi: aynı videoyu iki kişi ölçünce ne kadar fark çıktığı bilinmiyor.

**10. Neyi farklı yapardın?**
Silme akışlarını ve çekim onayını baştan tasarlardım.


## Bu projede verdiğim kararlar (sorun → karar → bedel)

- **Ortak cihazda silme:** Fotoğraflar kayıtla birlikte silinmiyordu → birlikte silme ve kayıt bazlı silme → iki tık onay gerekiyor.
- **Görüntü cihazda:** Gizlilik için → sunucuya hiçbir şey gitmiyor → cihazlar arası paylaşım dosyayla yapılıyor.

---
Son güncelleme: 19 Kasım 2026.
