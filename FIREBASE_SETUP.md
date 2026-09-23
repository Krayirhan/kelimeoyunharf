# Firebase Kurulumu

Firebase web yapılandırması `firebase-config.js` içinde tutulur; API key bu dosyaya yazılmaz.
GitHub Actions deploy adımında `FIREBASE_API_KEY` secret'ı kullanılarak geçici config oluşturulur.

Firebase Console'da Email/Password sağlayıcısını ve `krayirhan.github.io` yetkili domainini etkinleştir.

Veriler `users/{uid}` ve `users/{uid}/games/{YYYY-MM-DD}` belgelerinde tutulur.
