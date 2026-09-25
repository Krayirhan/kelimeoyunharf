// Oyun Arası oyun kataloğu — "Tüm Oyunlar" ızgarası bu listeden çizilir.
// Yeni oyun eklemek için listeye bir satır ekle:
//   id        benzersiz kısa ad
//   title     oyunun görünen adı
//   href      oyun sayfası; henüz hazır değilse soon: true ver
//   image     kapak görseli (yoksa cover ile CSS kapağı kullanılır)
//   cover     styles.css içindeki cover-<ad> kapağı ve içindeki kareler
//   category  sol menü filtreleri: word, logic, classic, number
//   search    aramada eşleşecek ek kelimeler
//   size      big (2×2) veya wide (2×1); boş bırakılırsa tek kare
window.OYUN_ARASI_GAMES = [
  { id: 'harfane', title: 'Wordle Türkçe', href: 'games/harfane/', image: 'assets/landing/t-wordle.webp', category: 'word', search: 'harfane kelime günlük wordle', size: 'big' },
  { id: '2048', title: '2048', href: 'games/2048/', cover: { name: '2048', label: '2048', cells: ['2', '4', '8', '16'] }, category: 'logic number classic', search: 'sayı birleştir' },
  { id: 'mayin-tarlasi', title: 'Mayın Tarlası', href: 'games/mayin-tarlasi/', cover: { name: 'mines', label: 'MAYIN<br>TARLASI', cells: ['1', '1', '', '1', '✹', '1', '', '1', '1'] }, category: 'logic classic', search: 'minesweeper dikkat' },
  { id: 'hafiza', title: 'Hafıza Kartları', href: 'games/hafiza/', cover: { name: 'memory', label: 'HAFIZA<br>KARTLARI', cells: ['?', '★', '?', '★', '?', '?'] }, category: 'logic', search: 'eş bul' },
  { id: 'xox', title: 'XOX', href: 'games/xox/', cover: { name: 'xox', label: 'XOX', cells: ['×', '○', '', '○', '×', '', '', '', '×'] }, category: 'classic', search: 'üç taş arkadaş iki kişi tic tac toe' },
  { id: 'soliter', title: 'Soliter', soon: true, image: 'assets/landing/t-soliter.webp', category: 'classic', search: 'solitaire kart', size: 'wide' },
  { id: 'sudoku', title: 'Sudoku', soon: true, image: 'assets/landing/t-sudoku.webp', category: 'logic number', search: 'sayı' },
  { id: 'tetris', title: 'Tetris', soon: true, image: 'assets/landing/t-tetris.webp', category: 'classic logic', search: 'blok' },
  { id: 'mahjong', title: 'Mahjong', soon: true, image: 'assets/landing/t-mahjong.webp', category: 'classic logic', search: 'taş' },
  { id: 'kelime-avi', title: 'Kelime Avı', soon: true, image: 'assets/landing/t-kelime-avi.webp', category: 'word', search: 'harf' },
  { id: 'araba', title: 'Araba Yarışı', soon: true, image: 'assets/landing/t-araba.webp', category: 'classic', search: 'yarış' },
  { id: 'sekil', title: 'Şekil Birleştir', soon: true, image: 'assets/landing/t-sekil.webp', category: 'logic', search: 'blok' }
];
