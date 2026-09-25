// Oyun sayfalarının ortak davranışları: "Nasıl oynanır?" kartı ve "Başka oyun dene" önerileri.

// "Nasıl oynanır?" masaüstü ve tablette hep açık, telefonda kapalı başlar.
const howCard = document.querySelector('#how-card');
if (howCard) {
  const wide = matchMedia('(min-width: 761px)');
  const sync = () => { howCard.open = wide.matches; };
  sync();
  wide.addEventListener('change', sync);
  howCard.querySelector('summary').addEventListener('click', event => { if (wide.matches) event.preventDefault(); });
}

// Öneriler catalog.js listesinden gelir; yalnızca oynanabilen oyunlar önerilir.
const moreGames = document.querySelector('[data-more-games]');

function coverArt(cover) {
  const art = document.createElement('span');
  art.className = 'more-cover';
  art.style.setProperty('--c', cover.color || '#e4dfd3');
  if (cover.text) art.style.setProperty('--t', cover.text);
  const cells = cover.cells || [];
  art.style.setProperty('--cols', cells.length === 4 ? 2 : 3);
  art.append(...cells.map(text => Object.assign(document.createElement('i'), { textContent: text })));
  return art;
}

if (moreGames) {
  const base = moreGames.dataset.base || '../../';
  const limit = Number(moreGames.dataset.limit) || 6;
  const current = document.body.dataset.game;
  const games = (window.OYUN_ARASI_GAMES || [])
    .filter(game => game.id !== current && !game.soon)
    .slice(0, limit);

  moreGames.append(...games.map(game => {
    const tile = document.createElement(game.soon ? 'div' : 'a');
    tile.className = ['more-tile', game.soon && 'soon', game.size === 'wide' && 'wide'].filter(Boolean).join(' ');
    if (!game.soon) tile.href = base + game.href;

    const art = document.createElement('span');
    art.className = 'more-art';
    if (game.image) {
      const img = document.createElement('img');
      img.src = base + game.image;
      img.alt = '';
      img.loading = 'lazy';
      art.append(img);
    } else if (game.cover) {
      art.append(coverArt(game.cover));
    }

    const text = document.createElement('span');
    text.className = 'more-text';
    const title = document.createElement('strong');
    title.textContent = game.title;
    text.append(title);
    if (game.tagline || game.soon) {
      const tagline = document.createElement('small');
      tagline.textContent = game.soon ? 'Yakında' : game.tagline;
      text.append(tagline);
    }

    tile.append(art, text);
    return tile;
  }));
}
