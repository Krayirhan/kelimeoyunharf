# Firebase Kurulumu

Proje `kelimeoyunharf` Firebase projesine bağlıdır.

## Console adımları

1. [Firebase Authentication](https://console.firebase.google.com/project/kelimeoyunharf/authentication/providers) ekranını aç.
2. `Sign-in providers` içinden `Email/Password` sağlayıcısını etkinleştir.
3. Authentication ayarlarında `krayirhan.github.io` alan adını yetkili domain olarak ekle.

Bu adımlar tamamlandıktan sonra canlı sitedeki `Giriş yap` düğmesi kayıt ve giriş için çalışır.

## Veri modeli

- `users/{uid}`: e-posta, kullanıcı adı, son görülme zamanı ve özet istatistikler.
- `users/{uid}/games/{YYYY-MM-DD}`: o günün tahminleri, sonuç durumu, deneme sayısı ve bulmaca numarası.


## Notlar

- `firebase-config.js` içindeki web yapılandırması gizli değildir; Firebase web uygulamalarında bu bilgiler istemciye gider.
- Admin/service-account anahtarı projeye eklenmemelidir.
- Günlük kelime ve tahminler istemcide bulunduğu için bu sürüm temel hesap ve geçmiş saklama içindir. Hileye dayanıklı yarışma sistemi için günlük cevabı sunucu tarafında doğrulayan Cloud Functions katmanı gerekir.
