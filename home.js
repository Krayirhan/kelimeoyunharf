const cards = [...document.querySelectorAll('.thumb')];
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

function updateCatalog() {
  const query = searchInput.value.trim().toLocaleLowerCase('tr-TR');
  let visibleCount = 0;

  for (const card of cards) {
    const categories = card.dataset.category.split(' ');
    const matchesCategory = selectedCategory === 'all' || categories.includes(selectedCategory);
    const matchesSearch = !query || card.dataset.search.toLocaleLowerCase('tr-TR').includes(query);
    card.hidden = !matchesCategory || !matchesSearch;
    if (!card.hidden) visibleCount += 1;
  }

  emptyMessage.hidden = visibleCount > 0;
  track.hidden = visibleCount === 0;
  track.scrollLeft = 0;
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
});

searchInput.addEventListener('input', updateCatalog);

document.querySelectorAll('[data-scroll]').forEach(button => {
  button.addEventListener('click', () => {
    track.scrollBy({ left: Number(button.dataset.scroll) * track.clientWidth * 0.6 });
  });
});

cards.filter(card => card.classList.contains('soon')).forEach(card => {
  card.addEventListener('click', event => {
    event.preventDefault();
    showToast(`${card.querySelector('img').alt.replace(' (yakında)', '')} çok yakında burada!`);
  });
});

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
