# Firebase Kurulumu

Firebase web yapılandırması repo kökündeki `firebase-config.js` içinde tutulur; API key bu dosyaya yazılmaz. Harfane bu ortak ayarı `games/harfane/` altından kullanır.
GitHub Actions deploy adımında `FIREBASE_API_KEY` secret'ı kullanılarak geçici config oluşturulur.

Firebase Console'da Email/Password sağlayıcısını ve `krayirhan.github.io` yetkili domainini etkinleştir.

Veriler `users/{uid}` ve `users/{uid}/games/{YYYY-MM-DD}` belgelerinde tutulur.

Firestore kuralları GitHub Pages dağıtımından bağımsızdır. Kuralları Firebase projesine yayımlamak için yetkili bir Firebase CLI oturumunda `firebase deploy --only firestore:rules --project kelimeoyunharf` çalıştır. Projeye erişimin yoksa bu adım tamamlanmış sayılmaz.

Yerel kuralları denemek için `firebase emulators:start --only firestore --project demo-harfane` çalıştır. Emulator demo proje kullanır ve canlı Firebase verilerine bağlanmaz.
