(() => {
  'use strict';

  // GIPHY's public "beta" key — meant for demos/testing (low rate limit).
  // Swap in your own free key from developers.giphy.com for a smoother ride.
  const GIPHY_API_KEY = 'dc6zaTOxFJmzC';
  const GIPHY_SEARCH_URL = 'https://api.giphy.com/v1/gifs/search';
  const BATCH_SIZE = 12;
  const OFFSET_RANGE = 200; // stay within results Giphy reliably has for these queries

  const CATEGORIES = {
    puppies: { emoji: '🐶', label: 'Puppies', query: 'cute puppy', bg: '#FFD9E6' },
    kittens: { emoji: '🐱', label: 'Kittens', query: 'cute kitten', bg: '#FFE8CC' },
    bunnies: { emoji: '🐰', label: 'Bunnies', query: 'cute bunny rabbit', bg: '#D9F2E3' },
    rainbows: { emoji: '🌈', label: 'Rainbows', query: 'rainbow', bg: '#FFF6CC' },
  };

  const feedEl = document.getElementById('feed');
  const statusEl = document.getElementById('statusLine');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const surpriseBtn = document.getElementById('surpriseBtn');
  const filterRow = document.getElementById('filterRow');

  let currentFilter = 'all';
  const seenIds = new Set();

  function placeholderSvg(emoji, bg) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="${bg}"/>
        <text x="50%" y="54%" font-size="80" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
      </svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  function randomOffset() {
    return Math.floor(Math.random() * OFFSET_RANGE);
  }

  async function fetchCategory(catKey, limit) {
    const cat = CATEGORIES[catKey];
    const url = `${GIPHY_SEARCH_URL}?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(cat.query)}&limit=${limit}&offset=${randomOffset()}&rating=g&lang=en`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GIPHY request failed (${res.status})`);
    const json = await res.json();
    return (json.data || [])
      .filter((g) => !seenIds.has(g.id))
      .map((g) => {
        seenIds.add(g.id);
        const img = g.images.fixed_width || g.images.original;
        return {
          id: g.id,
          url: img.url,
          catKey,
        };
      });
  }

  function categoriesForFilter(filter) {
    return filter === 'all' ? Object.keys(CATEGORIES) : [filter];
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildCard(item) {
    const cat = CATEGORIES[item.catKey];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="media">
        <img src="${item.url}" alt="A cute ${cat.label.toLowerCase().replace(/s$/, '')}" loading="lazy">
      </div>
      <div class="caption"><span>${cat.emoji}</span><span>${cat.label.replace(/s$/, '')}</span></div>
    `;
    const img = card.querySelector('img');
    img.addEventListener('error', () => {
      img.src = placeholderSvg(cat.emoji, cat.bg);
    }, { once: true });
    return card;
  }

  function buildSkeletons(n) {
    const nodes = [];
    for (let i = 0; i < n; i++) {
      const card = document.createElement('div');
      card.className = 'card skeleton';
      card.innerHTML = `<div class="media"></div><div class="caption">&nbsp;</div>`;
      nodes.push(card);
    }
    return nodes;
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  async function loadBatch({ append }) {
    loadMoreBtn.disabled = true;
    surpriseBtn.disabled = true;

    const skeletons = buildSkeletons(append ? 6 : BATCH_SIZE);
    if (!append) feedEl.innerHTML = '';
    skeletons.forEach((s) => feedEl.appendChild(s));
    setStatus('Fetching a little goodness...');

    const cats = categoriesForFilter(currentFilter);
    const perCat = Math.max(3, Math.floor(BATCH_SIZE / cats.length));

    try {
      const results = await Promise.allSettled(cats.map((c) => fetchCategory(c, perCat)));
      skeletons.forEach((s) => s.remove());

      let items = [];
      let anySucceeded = false;
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          anySucceeded = true;
          items = items.concat(r.value);
        }
      });
      shuffle(items);

      if (!anySucceeded) {
        setStatus("Couldn't reach the good stuff right now — here's a little placeholder instead. Try again in a bit 💛");
        cats.forEach((c) => {
          const cat = CATEGORIES[c];
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `<div class="media"><img class="placeholder-svg" src="${placeholderSvg(cat.emoji, cat.bg)}" alt="${cat.label}"></div><div class="caption"><span>${cat.emoji}</span><span>${cat.label}</span></div>`;
          feedEl.appendChild(card);
        });
      } else if (items.length === 0) {
        setStatus("That's everything fresh for now — hit surprise me for a new batch!");
      } else {
        items.forEach((item) => feedEl.appendChild(buildCard(item)));
        setStatus('');
      }
    } catch (err) {
      skeletons.forEach((s) => s.remove());
      setStatus("Something went sideways fetching pictures. Try again? 🐾");
    } finally {
      loadMoreBtn.disabled = false;
      surpriseBtn.disabled = false;
    }
  }

  filterRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.pillar');
    if (!btn) return;
    filterRow.querySelectorAll('.pillar').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadBatch({ append: false });
  });

  loadMoreBtn.addEventListener('click', () => loadBatch({ append: true }));
  surpriseBtn.addEventListener('click', () => loadBatch({ append: false }));

  loadBatch({ append: false });
})();
