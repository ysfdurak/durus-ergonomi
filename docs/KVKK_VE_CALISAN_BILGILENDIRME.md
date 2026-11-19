# Duruş · KVKK ve çalışan bilgilendirme

> **Not:** Bu belge bir başlangıç şablonudur, hukuki görüş değildir. Kullanmadan önce kurumunun hukuk ya da KVKK sorumlusuna onaylat. Veri sorumlusu uygulamayı kuran kurumdur; bu depo yalnızca aracı sağlar.

Duruş, iş istasyonunu video, fotoğraf ya da ölçümle ergonomik olarak değerlendirir. Görüntü çalışanı gösterir; görüntü ve ona bağlanan risk puanları kişisel veridir. Eklem noktası bulma (MediaPipe Pose) kişiyi tanımak için değil, duruş açısını ölçmek için kullanılır ve cihazda çalışır.

## Hangi kişisel veriler işleniyor?

| Veri | Nereden gelir | Neden gerekir |
|---|---|---|
| Video ve fotoğraflar (çalışanın görüntüsü) | Kurum çeker | Duruş açısını ölçmek |
| Eklem noktaları ve açılar | Uygulama hesaplar ya da elle girilir | REBA, RULA, OWAS puanı |
| İstasyon, görev, tarih, notlar, önce-sonra kayıtları | Değerlendiren girer | Riski ve iyileşmeyi izlemek |

## Nerede durur, kim görür, ne kadar kalır?

- **Yer:** Kayıtlar tarayıcının yerel deposunda (fotoğraf ve kareler IndexedDB'de), masaüstü sürümde uygulama klasöründe. Video ve fotoğraflar hiçbir sunucuya gönderilmez; sayfanın güvenlik ayarı (CSP) da dış adrese bağlantıyı engeller.
- **Kim görür:** O cihazı kullanan herkes. Ortak cihazda iş bitince **Kılavuz › Veri › Ortak cihaz** bölümündeki adımla bütün kayıtlar ve fotoğraflar birlikte silinir; tek bir saha kaydı da fotoğraflarıyla birlikte silinebilir.
- **Ne kadar:** Uygulama kendiliğinden silmez; kurum süreyi belirlemeli.

## Kurumun yapması gerekenler

1. **Aydınlatma:** Çalışanlara, verinin hangi amaçla, hangi hukuki sebeple, kimler tarafından ve ne kadar süre işlendiğini yazılı olarak bildir (aşağıdaki duyuru şablonu başlangıç olabilir).
2. **Amaçla sınırla:** Toplanan veri yalnız yazılan amaç için kullanılır. Başka bir amaca (ör. disiplin, bireysel performans sıralaması) kaydırılacaksa yeniden değerlendir ve çalışanı bilgilendir.
3. **Erişimi daralt:** Yalnız işi gereği görmesi gerekenlere hesap aç; ayrılanların hesabını aynı gün kapat.
4. **Saklama süresini yaz ve uygula:** Süre dolan kayıtları sil ya da anonimleştir; silme tarihini kayıt altına al.
5. **Kayıt envanteri:** Bu işlemeyi kurumun kişisel veri envanterine ekle; VERBİS kaydı gerekiyorsa güncelle.
6. **Talepler:** Çalışanın KVKK 11. madde kapsamındaki taleplerine (bilgi, düzeltme, silme) kimin, kaç gün içinde cevap vereceğini belirle.

## Duruş'a özel noktalar

- **Yüz görünmesin:** Duruş ölçümü için yüz gerekmez. Mümkünse kamerayı yüz görünmeyecek açıdan kur ya da rapora yüzün görünmediği kareyi koy.
- **Risk puanı istasyona aittir:** REBA/RULA/OWAS puanı istasyonun riskini anlatır; kişinin sağlık durumu ya da performansı hakkında çıkarım yapmak için kullanma.
- **Sağlık bilgisi yazma:** Notlara çalışanın hastalığı, raporu ya da şikâyeti gibi sağlık bilgisi girme; bu özel nitelikli kişisel veridir ve ayrı kurallara tabidir.
- **Dışa aktarım:** PDF ve Excel raporu fotoğraf içerebilir; kurum dışına göndermeden önce kontrol et.

## Çalışan duyurusu (şablon)

Köşeli parantezli yerleri doldur.

> [Kurum adı] olarak [istasyon]'daki çalışma duruşlarının bedene yükünü ölçmek için ergonomi değerlendirmesi yapıyoruz. Bunun için çalışırken fotoğrafın ya da kısa videon çekilebilir. Görüntüler yalnız [cihaz] üzerinde tutulur, internete yüklenmez; analiz bitince [n gün içinde] silinir. Raporda istasyonun risk puanı ve önerilen iyileştirmeler yer alır; puan istasyona aittir, senin sağlığın ya da performansın hakkında değerlendirme değildir. Çekime katılmak istemezsen [kişi]'ye söylemen yeterli. Soruların ve KVKK kapsamındaki talepler için: [kişi / e-posta].

## Çekim öncesi bilgilendirme ve onay (şablon)

Videoya alınacak her çalışana çekimden **önce** okut ve imzalat. Çalışan istemezse çekim yapma ya da yüzü görünmeyecek açıdan çek.

> **Konu:** [İstasyon / iş] için ergonomi değerlendirmesi
> **Ne kaydedilecek:** [Tarih] günü [süre] boyunca, iş istasyonunda çalışırken video ya da fotoğraf.
> **Amaç:** Çalışma duruşunun bedene yükünü ölçüp istasyonu iyileştirmek. Kayıt bireysel performans değerlendirmesinde, disiplin sürecinde ya da başka bir amaçla kullanılmaz.
> **Nerede tutulacak:** Video yalnız [bilgisayar / klasör] üzerinde durur, internete yüklenmez. Uygulama görüntüyü hiçbir sunucuya göndermez.
> **Kim görecek:** [Analizi yapan kişi(ler)]. Raporlarda yüzün görünmez ya da [bulanıklaştırılır / kırpılır].
> **Ne kadar kalacak:** Analiz bitince [en geç n gün içinde] video silinir; raporda yalnız süreler ve açılar kalır.
> **Hakların:** Çekime katılmak zorunda değilsin; istediğin an durdurmamı isteyebilirsin. Bilgi, düzeltme ve silme talebin için: [kişi / e-posta].
>
> Okudum, anladım. Çekime katılmayı kabul ediyorum.  Ad soyad: ________  Tarih: ________  İmza: ________

**Sendikalı işyerlerinde** çalışmaya başlamadan önce işyeri temsilcisini bilgilendir; zaman etüdü ve ergonomi ölçümleri toplu sözleşmede ayrıca düzenlenmiş olabilir.

---
Son güncelleme: 19 Kasım 2026.
