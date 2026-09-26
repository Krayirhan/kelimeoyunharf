# Oyun Arası Firebase düzeni

Site yeni `oyun-arasi` Firebase projesini kullanır. Firestore Frankfurt (`europe-west3`) konumundadır. E-posta/şifre girişi ve `krayirhan.github.io` yetkili alan adı kullanılmalıdır. Firebase Hosting gerekmez; site GitHub Pages'te yayımlanır.

## Hesap ve oyun verileri

Her hesap `users/{uid}` belgesinde açılır. Hesap oluşturulurken `gameStats` içindeki bütün oyunlar sıfır başlangıç değerleriyle hazırlanır:

- `2048`: en iyi skor ve hedefe ulaşma.
- `harfane`: Günlük istatistikleri ve Sefer ilerlemesi. Antrenman kaydı cihazda kalır.
- `xox`: tur, X/O galibiyetleri ve beraberlikler.
- `hafiza`: klasik/geniş tahta süre ve hamle rekorları.
- `mayin-tarlasi`: kolay/orta/zor süre rekorları.

Aktif oyun ve ayrıntılı kayıtlar `users/{uid}/games/{gameId}` belgelerinde tutulur. Platform oyunlarının kimlikleri `2048`, `xox`, `hafiza`, `mayin-tarlasi`, `sudoku`, `sekil`, `kelime-avi`, `tetris`, `soliter`, `mahjong` ve `araba`; Harfle'nin (`harfane`) günlük bulmacaları `daily-YYYY-MM-DD`, Sefer kaydı `series` kimliğini kullanır. Oyun belgesi ilk oyun kaydedildiğinde oluşur. Harfle Antrenman torbası cihazda kalır. Hesap açmak oyunları veya Firebase hesabını herkese açık yapmaz.

Her kullanıcı yalnızca kendi profilini ve oyun belgelerini okuyup değiştirebilir. `firestore.rules` bu erişimi tanımlar; herkese açık skor tablosu yoktur. Önceki `kelimeoyunharf` Firebase projesindeki kullanıcılar ve kayıtlar bu yeni projeye aktarılmaz. Yeni projede hesap açılmalıdır.

## Yayın ayarları

Web uygulamasının proje kimliği `firebase-config.js` içinde bulunur. API key dosyada tutulmaz; GitHub deposundaki **Settings → Secrets and variables → Actions → `FIREBASE_API_KEY`** secret'ına yeni `Oyun Arasi Web` uygulamasının API key değerini sen ekle. Pages dağıtımı bu secret'ı yayın sırasında yapılandırmaya ekler.

Firestore kuralları Pages dağıtımından bağımsızdır ve `.github/workflows/deploy-firestore-rules.yml` iş akışıyla otomatik yayımlanır: `firestore.rules` değişip `main` dalına geldiğinde Firebase CLI kuralları derler ve yayımlar. Hatalı kural dosyası yayımlanmaz, iş kırmızı olur. İş, **Actions → Deploy Firestore rules → Run workflow** ile elle de çalıştırılabilir.

Bu iş akışı bir kez kurulum ister:

1. Firebase Console → Proje ayarları (⚙️) → **Hizmet hesapları** → **Yeni özel anahtar oluştur** ile bir JSON anahtar dosyası indir.
2. GitHub deposunda **Settings → Secrets and variables → Actions → New repository secret** aç; adı `FIREBASE_SERVICE_ACCOUNT`, değeri JSON dosyasının tüm içeriği olsun. Dosyayı sonra bilgisayarından sil; depoya ekleme.
3. **Actions → Deploy Firestore rules → Run workflow** ile ilk yayını başlat. İş izin hatası verirse Google Cloud Console → IAM bölümünde bu hizmet hesabına **Firebase Rules Admin** rolünü ekleyip tekrar çalıştır.

Secret yoksa iş hata vermeden atlanır ve uyarı bırakır; o durumda `firestore.rules` içeriğini Firebase Console → Firestore Database → Rules bölümüne yapıştırıp **Publish** ile yayımlamak gerekir. Yerel Firebase CLI oturumunda alternatif olarak `firebase deploy --only firestore:rules --project oyun-arasi` kullanılabilir.

Yerel geliştirmede canlı projeye bağlanmadan Firestore emülatörünü çalıştırmak için `firebase emulators:start --only firestore --project demo-oyun-arasi` kullanılır.
