// Oyun sayfalarının altındaki "Diğer oyunlar" şeridi; liste catalog.js dosyasından gelir.
const moreGames = document.querySelector('[data-more-games]');

if (moreGames) {
  const base = moreGames.dataset.base || '../../';
  const current = document.body.dataset.game;
  const games = (window.OYUN_ARASI_GAMES || [])
    .filter(game => game.id !== current)
    .sort((a, b) => Number(Boolean(a.soon)) - Number(Boolean(b.soon)))
    .slice(0, 6);

  moreGames.append(...games.map(game => {
    const tile = document.createElement(game.soon ? 'div' : 'a');
    tile.className = ['more-tile', game.soon && 'soon', game.size === 'wide' && 'wide'].filter(Boolean).join(' ');
    if (!game.soon) tile.href = base + game.href;
    tile.setAttribute('aria-label', game.soon ? `${game.title} (yakında)` : game.title);
    tile.title = game.title;

    if (game.image) {
      const img = document.createElement('img');
      img.src = base + game.image;
      img.alt = '';
      img.loading = 'lazy';
      tile.append(img);
    } else {
      const cover = document.createElement('span');
      cover.className = 'more-tile-cover';
      cover.style.setProperty('--c', game.cover?.color || '#e4dfd3');
      if (game.cover?.text) cover.style.setProperty('--t', game.cover.text);
      cover.textContent = game.title;
      tile.append(cover);
    }
    return tile;
  }));
}
