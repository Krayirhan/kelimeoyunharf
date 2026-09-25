# Oyun Arası

Mini oyunları tek bir yerde toplayan, statik olarak GitHub Pages'te yayımlanan oyun kataloğu.

## Klasör yapısı

- `index.html`, `styles.css`, `home.js`: platformun ana sayfası, oyun kataloğu, arama ve kategori filtreleri.
- `catalog.js`: ana sayfadaki "Tüm Oyunlar" ızgarasını ve oyun sayfalarındaki "Diğer oyunlar" şeridini besleyen oyun listesi.
- `game-shell.css`, `game-shell.js`: oyun sayfalarının ortak iskeleti. Ana sayfanın logosu, renkleri ve yazı tipleri; oyuna özel vurgu rengi (`<body class="game-page" data-game="...">`) üst menü (arama, Tüm oyunlar, Giriş yap) ve "Başka oyun dene" kartları. Menüdeki arama ana sayfaya `?q=` ile, konum bağlantıları `?kategori=` ile gider.
- `assets/landing/`: ana sayfadaki hero, kart ve oyun kapağı görselleri.
- `games/2048/`: 2048 oyununun arayüzü, kuralları ve cihaz/bulut kayıtları. Masaüstünde üç sütunlu (nasıl oynanır · tahta · hedef ve başka oyunlar), telefonda tek sütunlu sayfa; diğer oyun sayfaları için örnek şablon.
- `games/harfane/`: Harfane oyununun arayüzü, oyun mantığı ve kelime listeleri.
- `games/xox/`: Aynı cihazda iki kişilik XOX ve skor kaydı.
- `games/hafiza/`: 4×4 ve 6×6 Hafıza Kartları, rekorlar ve oturum kaydı.
- `games/mayin-tarlasi/`: Üç zorluk seviyeli Mayın Tarlası ve oyun/rekor kaydı.
- `firebase-client.js`, `account.js`, `account.css`: ortak hesap, Firebase bağlantısı ve oyun ilerlemesi eşitlemesi.
- `cloud-sync.js`: oyunların Firebase'i sonradan yüklediği ara katman. Oyunlar `firebase-client.js` yerine bunu içe aktarır; Firebase yüklenemezse oyun yine açılır ve cihazda kaydolur.
- `firebase-config.js`, `firestore.rules`, `firebase.json`: Oyun Arası Firebase yapılandırması ve erişim kuralları.

Yeni bir oyun, kendine ait `games/<oyun-adi>/` klasöründe tutulur ve `catalog.js` listesine bir satır olarak eklenir. Oyun sayfası kendi `styles.css` dosyasından sonra `game-shell.css`'i yükler, `<body>` etiketine `class="game-page" data-game="<oyun-adi>"` verir ve vurgu rengi `game-shell.css` içinde tanımlanır; "Tüm Oyunlar" ızgarası, arama ve kategori filtreleri bu listeden otomatik çalışır. Oyunlar cihazda kaydolur; giriş yapıldığında desteklenen oyun ilerlemesi `users/{uid}/games/{gameId}` altında eşitlenir. Yeni hesap profili bütün oyunlar için sıfır başlangıç istatistikleriyle açılır. Harfane Antrenman torbası cihazda kalır.

Yeni oyunların bağımsız kuralları `logic.js` dosyalarında tutulur. Oyun klasörlerindeki küçük modül tanımları tarayıcı importlarını ve Node.js testlerini aynı biçimde çalıştırır. Yerleşik testler bağımlılık kurmadan çalıştırılır:

```sh
node --test games/xox/logic.test.mjs games/hafiza/logic.test.mjs games/mayin-tarlasi/logic.test.mjs
```
