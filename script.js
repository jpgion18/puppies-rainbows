(() => {
  'use strict';

  const DOG_API_URL = 'https://dog.ceo/api/breeds/image/random';
  const CAT_IMAGE_URL = 'https://cataas.com/cat';
  const BATCH_SIZE = 12;

  const CATEGORIES = {
    puppies: { emoji: '🐶', label: 'Puppies', mode: 'dog', bg: '#FFD9E6' },
    kittens: { emoji: '🐱', label: 'Kittens', mode: 'cat', bg: '#FFE8CC' },
    bunnies: { emoji: '🐰', label: 'Bunnies', mode: 'illustration', bg: '#D9F2E3' },
    rainbows: { emoji: '🌈', label: 'Rainbows', mode: 'illustration', bg: '#FFF6CC' },
  };

  // ---- hand-drawn SVG illustrations (bunnies + rainbows) ----
  // No external dependency: these never fail to load, unlike hotlinked photos.

  function cloudGroup(cx, cy) {
    return `<g fill="#fff" opacity="0.9">
      <circle cx="${cx}" cy="${cy}" r="14"/>
      <circle cx="${cx + 14}" cy="${cy - 6}" r="18"/>
      <circle cx="${cx + 30}" cy="${cy}" r="13"/>
      <rect x="${cx - 4}" y="${cy}" width="42" height="14" rx="7"/>
    </g>`;
  }

  function sunGroup(cx, cy) {
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x1 = cx + Math.cos(angle) * 22;
      const y1 = cy + Math.sin(angle) * 22;
      const x2 = cx + Math.cos(angle) * 30;
      const y2 = cy + Math.sin(angle) * 30;
      rays += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#FFD966" stroke-width="4" stroke-linecap="round"/>`;
    }
    return `<g>${rays}<circle cx="${cx}" cy="${cy}" r="18" fill="#FFD966"/></g>`;
  }

  function bubblesGroup() {
    const spots = [[24, 150, 8], [45, 130, 5], [165, 145, 9], [178, 120, 5], [100, 165, 6]];
    return `<g fill="#fff" opacity="0.6">${spots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
  }

  function sparkleGroup() {
    function star(cx, cy, s) {
      return `<path d="M${cx} ${cy - s} L${cx + s * 0.28} ${cy - s * 0.28} L${cx + s} ${cy} L${cx + s * 0.28} ${cy + s * 0.28} L${cx} ${cy + s} L${cx - s * 0.28} ${cy + s * 0.28} L${cx - s} ${cy} L${cx - s * 0.28} ${cy - s * 0.28} Z" fill="#fff" opacity="0.85"/>`;
    }
    return star(30, 40, 9) + star(170, 55, 6) + star(20, 100, 5);
  }

  function rainbowSvg({ bg, decor }) {
    const bands = ['#FF6FA0', '#FFA65C', '#FFD966', '#7ED6A5', '#6EC6E8'];
    const cx = 100;
    const baseY = 170;
    let arcs = '';
    bands.forEach((color, i) => {
      const r = 90 - i * 15;
      arcs += `<path d="M ${cx - r} ${baseY} A ${r} ${r} 0 0 1 ${cx + r} ${baseY}" fill="none" stroke="${color}" stroke-width="15" stroke-linecap="round"/>`;
    });
    if (decor === 'double') {
      const offsetY = baseY + 18;
      bands.forEach((color, i) => {
        const r = 80 - i * 13;
        arcs += `<path d="M ${cx - r} ${offsetY} A ${r} ${r} 0 0 1 ${cx + r} ${offsetY}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" opacity="0.5"/>`;
      });
    }
    let decorMarkup = '';
    if (decor === 'clouds') decorMarkup = cloudGroup(24, 172) + cloudGroup(146, 172);
    else if (decor === 'sun') decorMarkup = sunGroup(165, 35);
    else if (decor === 'bubbles') decorMarkup = bubblesGroup();
    else if (decor === 'sparkle') decorMarkup = sparkleGroup();

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${bg}"/>${decorMarkup}${arcs}</svg>`;
  }

  function bunnySvg({ bg, fur, innerEar, blush, nose, earPose, bow }) {
    const earPoses = {
      up: { lRot: -15, rRot: 15, lCy: 55, rCy: 55, lRy: 48, rRy: 48 },
      oneFlop: { lRot: -15, rRot: 68, lCy: 55, rCy: 78, lRy: 48, rRy: 40 },
      bothFlop: { lRot: -58, rRot: 58, lCy: 80, rCy: 80, lRy: 40, rRy: 40 },
    };
    const p = earPoses[earPose];
    const bowMarkup = bow
      ? `<g transform="translate(138 78)">
          <path d="M0 0 L-14 -9 L-14 9 Z" fill="${bow}"/>
          <path d="M0 0 L14 -9 L14 9 Z" fill="${bow}"/>
          <circle cx="0" cy="0" r="5" fill="${bow}"/>
        </g>`
      : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${bg}"/>
      <ellipse cx="100" cy="188" rx="46" ry="26" fill="${fur}"/>
      <g transform="rotate(${p.lRot} 70 ${p.lCy})">
        <ellipse cx="70" cy="${p.lCy}" rx="18" ry="${p.lRy}" fill="${fur}"/>
        <ellipse cx="70" cy="${p.lCy + 4}" rx="9" ry="${p.lRy - 12}" fill="${innerEar}"/>
      </g>
      <g transform="rotate(${p.rRot} 130 ${p.rCy})">
        <ellipse cx="130" cy="${p.rCy}" rx="18" ry="${p.rRy}" fill="${fur}"/>
        <ellipse cx="130" cy="${p.rCy + 4}" rx="9" ry="${p.rRy - 12}" fill="${innerEar}"/>
      </g>
      <circle cx="100" cy="120" r="55" fill="${fur}"/>
      <circle cx="70" cy="135" r="12" fill="${blush}" opacity="0.6"/>
      <circle cx="130" cy="135" r="12" fill="${blush}" opacity="0.6"/>
      <circle cx="82" cy="115" r="6" fill="#3A2E39"/>
      <circle cx="118" cy="115" r="6" fill="#3A2E39"/>
      <ellipse cx="100" cy="128" rx="7" ry="5" fill="${nose}"/>
      <path d="M100 132 Q100 140 92 142" stroke="#3A2E39" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M100 132 Q100 140 108 142" stroke="#3A2E39" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${bowMarkup}
    </svg>`;
  }

  const RAINBOW_VARIANTS = [
    { bg: '#EAF6FC', decor: 'clouds' },
    { bg: '#FFF9EF', decor: 'sun' },
    { bg: '#E9F7EF', decor: 'bubbles' },
    { bg: '#FFEFF5', decor: 'double' },
    { bg: '#FFF3E0', decor: 'sparkle' },
  ].map(rainbowSvg);

  const BUNNY_VARIANTS = [
    { bg: '#FFE8F0', fur: '#FFFFFF', innerEar: '#FFC2D6', blush: '#FF9FC1', nose: '#FF6FA0', earPose: 'up', bow: null },
    { bg: '#FFF3E0', fur: '#F7E1C6', innerEar: '#FFB37B', blush: '#FFB37B', nose: '#E8823D', earPose: 'up', bow: '#FF6FA0' },
    { bg: '#E9F7EF', fur: '#F2F2F2', innerEar: '#BFE3CE', blush: '#A9DFC0', nose: '#4FAF7B', earPose: 'oneFlop', bow: null },
    { bg: '#E7F6FB', fur: '#FFFFFF', innerEar: '#BFE6F5', blush: '#9ED9F0', nose: '#4FA9D6', earPose: 'up', bow: '#6EC6E8' },
    { bg: '#FFF9E5', fur: '#F7ECC9', innerEar: '#FFE9A8', blush: '#FFD966', nose: '#D6A93A', earPose: 'bothFlop', bow: null },
  ].map(bunnySvg);

  const ILLUSTRATIONS = { bunnies: BUNNY_VARIANTS, rainbows: RAINBOW_VARIANTS };

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

  function svgDataUri(svgMarkup) {
    return 'data:image/svg+xml,' + encodeURIComponent(svgMarkup);
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

  function fetchIllustrationBatch(catKey, limit) {
    const pool = shuffle(ILLUSTRATIONS[catKey].slice());
    const items = [];
    for (let i = 0; i < limit; i++) {
      const svg = pool[i % pool.length];
      items.push({ id: `${catKey}-${i}-${Math.random()}`, url: svgDataUri(svg), catKey });
    }
    return items;
  }

  function fetchCategory(catKey, limit) {
    const mode = CATEGORIES[catKey].mode;
    if (mode === 'dog') return fetchDogBatch(limit);
    if (mode === 'cat') return Promise.resolve(fetchCatBatch(limit));
    return Promise.resolve(fetchIllustrationBatch(catKey, limit));
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
