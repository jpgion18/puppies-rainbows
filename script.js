(() => {
  'use strict';

  const DOG_API_URL = 'https://dog.ceo/api/breeds/image/random';
  const CAT_IMAGE_URL = 'https://cataas.com/cat';
  const BATCH_SIZE = 12;

  const CATEGORIES = {
    puppies: { emoji: '🐶', label: 'Puppies', mode: 'dog', bg: '#FFD9E6' },
    kittens: { emoji: '🐱', label: 'Kittens', mode: 'cat', bg: '#FFE8CC' },
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

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function fetchDogBatch(limit) {
    const res = await fetch(`${DOG_API_URL}/${limit}`);
    if (!res.ok) throw new Error(`Dog CEO request failed (${res.status})`);
    const json = await res.json();
    return (json.message || [])
      .filter((url) => !seenIds.has(url))
      .map((url) => {
        seenIds.add(url);
        return { id: url, url, catKey: 'puppies' };
      });
  }

  function fetchCatBatch(limit) {
    // Hotlinked directly as <img> (no fetch/JSON call) — cataas.com's own
    // anti-bot protection returns 403 for scripted requests to its JSON
    // API but allows normal image loads, which is its intended usage.
    const items = [];
    for (let i = 0; i < limit; i++) {
      const url = `${CAT_IMAGE_URL}?width=500&height=500&_=${Date.now()}-${i}-${Math.random()}`;
      items.push({ id: url, url, catKey: 'kittens' });
    }
    return items;
  }

  function fetchCategory(catKey, limit) {
    const mode = CATEGORIES[catKey].mode;
    if (mode === 'dog') return fetchDogBatch(limit);
    return Promise.resolve(fetchCatBatch(limit));
  }

  function categoriesForFilter(filter) {
    return filter === 'all' ? Object.keys(CATEGORIES) : [filter];
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
