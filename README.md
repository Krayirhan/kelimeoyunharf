# Oyun Arası

Mini oyunları tek bir yerde toplayan, statik olarak GitHub Pages'te yayımlanan oyun kataloğu.

## Klasör yapısı

- `index.html`, `styles.css`: platformun ana sayfası ve tasarımı.
- `games/harfane/`: Harfane oyununun arayüzü, oyun mantığı ve kelime listeleri.
- `firebase-config.js`, `firestore.rules`, `firebase.json`: ortak Firebase yapılandırması ve Firestore ayarları.

Yeni bir oyun, kendine ait `games/<oyun-adi>/` klasöründe tutulur ve ana sayfadaki oyun listesine eklenir. Oyunlar aynı statik yayın içinde çalışır; yalnızca ihtiyaç duyan oyun Firebase kullanır.
