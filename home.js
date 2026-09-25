const library = document.querySelector('#library-grid');
const libraryCount = document.querySelector('#library-count');
const libraryEmpty = document.querySelector('#library-empty');

function renderTile(game) {
  const tile = document.createElement('a');
  tile.className = ['tile', game.size, game.soon && 'soon', game.cover && `cover cover-${game.cover.name}`].filter(Boolean).join(' ');
  tile.href = game.soon ? '#' : game.href;
  tile.dataset.category = game.category;
  tile.dataset.search = `${game.title} ${game.search || ''}`;
  tile.dataset.title = game.title;
  tile.setAttribute('aria-label', game.soon ? `${game.title} (yakında)` : game.title);

  if (game.image) {
    const img = document.createElement('img');
    img.src = game.image;
    img.alt = '';
    img.loading = 'lazy';
    tile.append(img);
  } else if (game.cover) {
    const label = document.createElement('b');
    label.innerHTML = game.cover.label;
    const cells = document.createElement('i');
    cells.setAttribute('aria-hidden', 'true');
    cells.append(...game.cover.cells.map(text => Object.assign(document.createElement('span'), { textContent: text })));
    tile.append(label, cells);
  }

  const name = document.createElement('span');
  name.className = 'tile-name';
  name.textContent = game.title;
  tile.append(name);
  return tile;
}

library.append(...(window.OYUN_ARASI_GAMES || []).map(renderTile));

const shelfCards = [...document.querySelectorAll('.thumb')];
const tiles = [...library.querySelectorAll('.tile')];
const categoryButtons = [...document.querySelectorAll('.side-cat[data-filter]')];
const searchInput = document.querySelector('#game-search');
const emptyMessage = document.querySelector('#empty-search');
const track = document.querySelector('#game-shelf');
const toast = document.querySelector('#toast');

let selectedCategory = 'all';
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function filterCards(list, query) {
  let visibleCount = 0;
  for (const card of list) {
    const categories = card.dataset.category.split(' ');
    const matchesCategory = selectedCategory === 'all' || categories.includes(selectedCategory);
    const matchesSearch = !query || card.dataset.search.toLocaleLowerCase('tr-TR').includes(query);
    card.hidden = !matchesCategory || !matchesSearch;
    if (!card.hidden) visibleCount += 1;
  }
  return visibleCount;
}

function updateCatalog() {
  const query = searchInput.value.trim().toLocaleLowerCase('tr-TR');

  const shelfCount = filterCards(shelfCards, query);
  emptyMessage.hidden = shelfCount > 0;
  track.hidden = shelfCount === 0;
  track.scrollLeft = 0;

  const tileCount = filterCards(tiles, query);
  libraryEmpty.hidden = tileCount > 0;
  library.hidden = tileCount === 0;
  libraryCount.textContent = `${tileCount} oyun`;
}

function selectCategory(filter) {
  selectedCategory = filter;
  categoryButtons.forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  updateCatalog();
}

categoryButtons.forEach(button => {
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  button.addEventListener('click', () => {
    selectCategory(button.dataset.filter);
    document.querySelector('#oyunlar').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});

document.querySelector('[data-show-all]').addEventListener('click', event => {
  event.preventDefault();
  searchInput.value = '';
  selectCategory('all');
  document.querySelector('#tum-oyunlar').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

searchInput.addEventListener('input', updateCatalog);

document.querySelectorAll('[data-scroll]').forEach(button => {
  button.addEventListener('click', () => {
    track.scrollBy({ left: Number(button.dataset.scroll) * track.clientWidth * 0.6 });
  });
});

shelfCards.filter(card => card.classList.contains('soon')).forEach(card => {
  card.addEventListener('click', event => {
    event.preventDefault();
    showToast(`${card.querySelector('img').alt.replace(' (yakında)', '')} çok yakında burada!`);
  });
});

tiles.filter(tile => tile.classList.contains('soon')).forEach(tile => {
  tile.addEventListener('click', event => {
    event.preventDefault();
    showToast(`${tile.dataset.title} çok yakında burada!`);
  });
});

// Oyun sayfalarındaki arama kutusu ve konum bağlantıları buraya ?q=, ?ara ve ?kategori= ile gelir.
const params = new URLSearchParams(location.search);
const requestedCategory = params.get('kategori');
if (params.get('q')) searchInput.value = params.get('q');
if (requestedCategory && categoryButtons.some(button => button.dataset.filter === requestedCategory)) selectCategory(requestedCategory);
else updateCatalog();
if (params.get('q') || requestedCategory) {
  requestAnimationFrame(() => document.querySelector('#tum-oyunlar').scrollIntoView({ block: 'start' }));
}
if (params.has('ara')) window.addEventListener('load', () => searchInput.focus());

document.querySelector('[data-invite]').addEventListener('click', async event => {
  event.preventDefault();
  const data = { title: 'Oyun Arası', text: 'Gel birlikte oynayalım!', url: location.href.split('#')[0] };
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(data.url);
      showToast('Bağlantı kopyalandı, arkadaşına gönder!');
    }
  } catch {
    // Paylaşım penceresi kapatıldı.
  }
});
