const cards = [...document.querySelectorAll('.game-card')];
const categoryButtons = [...document.querySelectorAll('.category-button[data-filter]')];
const searchInput = document.querySelector('#game-search');
const emptyMessage = document.querySelector('#empty-search');

let selectedCategory = 'all';

function updateCatalog() {
  const query = searchInput.value.trim().toLocaleLowerCase('tr-TR');
  let visibleCount = 0;

  for (const card of cards) {
    const categories = card.dataset.category.split(' ');
    const searchText = `${card.dataset.search} ${card.textContent}`.toLocaleLowerCase('tr-TR');
    const matchesCategory = selectedCategory === 'all' || categories.includes(selectedCategory);
    const matchesSearch = !query || searchText.includes(query);
    card.hidden = !matchesCategory || !matchesSearch;
    if (!card.hidden) visibleCount += 1;
  }

  emptyMessage.hidden = visibleCount > 0;
}

categoryButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectedCategory = button.dataset.filter;
    categoryButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    updateCatalog();
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    document.querySelector('#oyunlar').scrollIntoView({ behavior, block: 'nearest' });
  });
});

searchInput.addEventListener('input', updateCatalog);
categoryButtons.forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));
