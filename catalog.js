// Oyun Arası oyun kataloğu — "Tüm Oyunlar" ızgarası bu listeden çizilir.
// Yeni oyun eklemek için listeye bir satır ekle:
//   id        benzersiz kısa ad
//   title     oyunun görünen adı
//   tagline   oyun sayfalarındaki "Başka oyun dene" kartında başlığın altındaki kısa açıklama
//   href      oyun sayfası; oyun henüz hazır değilse soon: true ver (sayfası "Yakında" gösterir)
//   image     kapak görseli (yoksa cover ile CSS kapağı kullanılır)
//   cover     styles.css içindeki cover-<ad> kapağı ve içindeki kareler;
//             color/text kapağın zemin ve yazı rengi; cols sütun sayısı; tones hücre renkleri
//             (g yeşil, y sarı, x gri)
//   category  sol menü filtreleri: word, logic, classic, number
//   search    aramada eşleşecek ek kelimeler
//   size      big (2×2) veya wide (2×1); boş bırakılırsa tek kare
window.OYUN_ARASI_GAMES = [
  { id: 'harfane', tagline: 'Günlük kelime bulmacası', title: 'Harfle', href: 'games/harfane/', cover: { name: 'harfane', color: '#14553f', text: '#fff', label: 'HARFLE', cells: ['H', 'A', 'R', 'F', 'L', 'E'], tones: ['g', 'g', 'y', 'g', 'x', 'g'] }, category: 'word', search: 'harfle harfane kelime günlük wordle türkçe', size: 'big' },
  { id: '2048', tagline: 'Sayıları birleştir', title: '2048', href: 'games/2048/', cover: { name: '2048', color: '#ffcd3c', label: '2048', cells: ['2', '4', '8', '16'] }, category: 'logic number classic', search: 'sayı birleştir' },
  { id: 'mayin-tarlasi', tagline: 'Dikkat ve mantık', title: 'Mayın Tarlası', href: 'games/mayin-tarlasi/', cover: { name: 'mines', color: '#8fd3f4', label: 'MAYIN<br>TARLASI', cells: ['1', '1', '', '1', '✹', '1', '', '1', '1'] }, category: 'logic classic', search: 'minesweeper dikkat' },
  { id: 'hafiza', tagline: 'Eş kartları bul', title: 'Hafıza Kartları', href: 'games/hafiza/', cover: { name: 'memory', color: '#c9a4f2', label: 'HAFIZA<br>KARTLARI', cells: ['?', '★', '?', '★', '?', '?'] }, category: 'logic', search: 'eş bul' },
  { id: 'xox', tagline: 'İki kişilik klasik', title: 'XOX', href: 'games/xox/', cover: { name: 'xox', color: '#0a2fb5', text: '#fff', label: 'XOX', cells: ['×', '○', '', '○', '×', '', '', '', '×'] }, category: 'classic', search: 'üç taş arkadaş iki kişi tic tac toe' },
  { id: 'sudoku', tagline: 'Sayı bulmacası', href: 'games/sudoku/', title: 'Sudoku', image: 'assets/landing/t-sudoku.webp', category: 'logic number', search: 'sayı' },
  { id: 'soliter', tagline: 'Kartları sırala', href: 'games/soliter/', title: 'Soliter', soon: true, image: 'assets/landing/t-soliter.webp', category: 'classic', search: 'solitaire kart', size: 'wide' },
  { id: 'tetris', tagline: 'Blokları diz', href: 'games/tetris/', title: 'Tetris', soon: true, image: 'assets/landing/t-tetris.webp', category: 'classic logic', search: 'blok' },
  { id: 'mahjong', tagline: 'Eş taşları bul', href: 'games/mahjong/', title: 'Mahjong', soon: true, image: 'assets/landing/t-mahjong.webp', category: 'classic logic', search: 'taş' },
  { id: 'kelime-avi', tagline: 'Harflerden kelime', href: 'games/kelime-avi/', title: 'Kelime Avı', soon: true, image: 'assets/landing/t-kelime-avi.webp', category: 'word', search: 'harf' },
  { id: 'araba', tagline: 'Engellerden kaç', href: 'games/araba/', title: 'Araba Yarışı', soon: true, image: 'assets/landing/t-araba.webp', category: 'classic', search: 'yarış' },
  { id: 'sekil', tagline: 'Parçaları yerleştir', href: 'games/sekil/', title: 'Şekil Birleştir', soon: true, image: 'assets/landing/t-sekil.webp', category: 'logic', search: 'blok' }
];
