# Oyun Arası

Mini oyunları tek bir yerde toplayan, statik olarak GitHub Pages'te yayımlanan oyun kataloğu.

## Klasör yapısı

- `index.html`, `styles.css`: platformun ana sayfası ve tasarımı.
- `games/2048/`: 2048 oyununun arayüzü, kuralları ve cihaz içi kayıtları.
- `games/harfane/`: Harfane oyununun arayüzü, oyun mantığı ve kelime listeleri.
- `games/xox/`: Aynı cihazda iki kişilik XOX ve cihaz içi skor kaydı.
- `games/hafiza/`: 4×4 ve 6×6 Hafıza Kartları, rekorlar ve cihaz içi oturum kaydı.
- `games/mayin-tarlasi/`: Üç zorluk seviyeli Mayın Tarlası ve cihaz içi oyun/rekor kaydı.
- `firebase-config.js`, `firestore.rules`, `firebase.json`: ortak Firebase yapılandırması ve Firestore ayarları.

Yeni bir oyun, kendine ait `games/<oyun-adi>/` klasöründe tutulur ve ana sayfadaki oyun listesine eklenir. Oyunlar aynı statik yayın içinde çalışır; yalnızca ihtiyaç duyan oyun Firebase kullanır.

Yeni oyunların bağımsız kuralları `logic.js` dosyalarında tutulur. Oyun klasörlerindeki küçük modül tanımları tarayıcı importlarını ve Node.js testlerini aynı biçimde çalıştırır. Yerleşik testler bağımlılık kurmadan çalıştırılır:

```sh
node --test games/xox/logic.test.mjs games/hafiza/logic.test.mjs games/mayin-tarlasi/logic.test.mjs
```
