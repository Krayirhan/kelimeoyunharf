window.HARFANE_ANSWERS = [
  'araba', 'bahçe', 'badem', 'balık', 'bebek', 'çadır', 'çakıl', 'çanta', 'çiçek', 'çorap',
  'davet', 'değiş', 'deniz', 'dünya', 'ekmek', 'elmas', 'emlak', 'fikir', 'gizem', 'gölge',
  'güneş', 'haber', 'hafif', 'hamur', 'hayal', 'hedef', 'iklim', 'insan', 'kahve', 'kalem',
  'kapak', 'karar', 'kavun', 'kayık', 'kekik', 'kepek', 'kitap', 'kolye', 'köprü', 'kural',
  'kürek', 'limon', 'masal', 'meyve', 'mutlu', 'nehir', 'orman', 'pamuk', 'parça', 'perde',
  'resim', 'sabah', 'sahil', 'sarma', 'sepet', 'sınır', 'sokak', 'tahta', 'takım', 'tarak',
  'tavan', 'tepsi', 'topuz', 'tulum', 'vapur', 'yarın', 'yemek', 'yılan', 'zaman', 'zafer'
];

window.HARFANE_WORDS = [...new Set([
  ...window.HARFANE_ANSWERS,
  'acemi', 'adres', 'akşam', 'akrep', 'altın', 'anlam', 'armut', 'aslan', 'aşkın', 'atlet',
  'avize', 'ayran', 'bavul', 'beyaz', 'biber', 'bilgi', 'bilet', 'birim', 'boyun', 'bölge',
  'bölüm', 'bulut', 'çevre', 'çevik', 'çizgi', 'çocuk', 'damar', 'demir', 'dergi', 'diken',
  'dilim', 'duman', 'durum', 'düğün', 'düşün', 'eşya', 'evrak', 'fener', 'fidan', 'fırın',
  'forma', 'fiyat', 'geçit', 'gelen', 'giriş', 'görev', 'gurur', 'hızlı', 'havuç', 'hüzün',
  'incir', 'ilham', 'izmir', 'kablo', 'kader', 'kalın', 'kalıp', 'kanat', 'karga', 'kasım',
  'katır', 'kayıt', 'kazan', 'keman', 'kemik', 'kılıç', 'kiraz', 'komşu', 'konak', 'konum',
  'korku', 'kokuş', 'koyun', 'kredi', 'kömür', 'kütük', 'makas', 'merak', 'model', 'moral',
  'nazik', 'nokta', 'ödev', 'ödül', 'ölçek', 'pasta', 'pilav', 'posta', 'radyo', 'resim',
  'robot', 'saman', 'sabır', 'sakin', 'sanat', 'saray', 'sedef', 'simit', 'sıcak', 'sınav',
  'sofra', 'sucuk', 'sürüm', 'şeker', 'şirin', 'tabak', 'tablo', 'taksi', 'tanım', 'tatil',
  'tatlı', 'temiz', 'terzi', 'toprak', 'umut', 'ünlü', 'uyarı', 'uzman', 'vakit', 'vatan',
  'vergi', 'yapıt', 'yazar', 'yeten', 'yolcu', 'yürek', 'zihin'
].filter(word => [...word].length === 5))];
