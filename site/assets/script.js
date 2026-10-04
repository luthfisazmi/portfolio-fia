/* ==========================================================
   Luthfi Azmi Sa'diyah — Portfolio · script.js (consolidated)
   Satu modul = satu fitur. Tiap modul berdiri sendiri (IIFE),
   tidak ada observer atau listener yang bekerja dua kali.
   1 Helper · 2 Nav · 3 Contact form · 4 Badge lanyard · 5 Role chips
   6 Stat cards · 7 Skills · 8 Scroll reveal (dua arah)
   9 Garis timeline · 10 Teks memudar saat scroll · 11 Tilt kartu
   ========================================================== */

/* ---------- 1. HELPER ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 2. NAV: menu mobile + link aktif ---------- */
(function () {
  const toggle = $('#navToggle'), links = $('#navLinks');
  if (!toggle || !links) return;

  const setNav = (open) => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', (e) => { e.stopPropagation(); setNav(!links.classList.contains('open')); });
  $$('a', links).forEach((a) => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('click', (e) => { if (!e.target.closest('.nav')) setNav(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });
  addEventListener('resize', () => { if (innerWidth > 720) setNav(false); });

  // tandai link menu sesuai section yang sedang di layar
  const sections = $$('section[id], header[id]');
  const anchors = $$('a', links);
  const setActive = () => {
    let current = '';
    sections.forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.top <= 120 && r.bottom >= 120) current = s.id;
    });
    anchors.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  };
  addEventListener('scroll', setActive, { passive: true });
  setActive();
})();

/* ---------- 3. CONTACT FORM -> Netlify Forms ---------- */
(function () {
  const form = $('#contactForm'), btn = $('#formBtn'), status = $('#formStatus');
  if (!form) return;
  const show = (msg, type) => { status.textContent = msg; status.className = 'form-status ' + (type || ''); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending...'; show('', '');
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      show("Thank you! Your message has been sent. I'll get back to you soon.", 'ok');
    } catch (err) {
      show('Sorry, something went wrong. Please email me directly at luthfiadiyah@gmail.com.', 'err');
    } finally {
      btn.disabled = false; btn.textContent = label;
    }
  });
})();

/* ---------- 4. BADGE LANYARD: fisika pendulum ---------- */
(function () {
  const badge = $('.hero-visual .badge');
  if (!badge || reduce) return;
  const hint = $('.drag-hint', badge);

  const STIFFNESS = 38;   // makin besar = makin cepat balik
  const DAMPING = 2.6;    // makin kecil = makin lama berayun
  const MAX_ANGLE = 40;   // batas ayunan (derajat)

  let angle = 10, vel = 0, dragging = false, visible = true;
  let pivotX = 0, pivotY = 0, last = performance.now();

  function setPivot() {
    const strap = parseFloat(getComputedStyle(badge).getPropertyValue('--strap')) || 90;   // panjang tali dari CSS
    const r = badge.offsetParent.getBoundingClientRect();
    pivotX = r.left + badge.offsetLeft + badge.offsetWidth / 2;
    pivotY = r.top + badge.offsetTop - strap;   // ujung atas tali = bawah nav
  }
  const pointToAngle = (e) =>
    clamp(-Math.atan2(e.clientX - pivotX, Math.max(e.clientY - pivotY, 60)) * 180 / Math.PI, -MAX_ANGLE, MAX_ANGLE);

  badge.addEventListener('pointerdown', (e) => {
    dragging = true; badge.classList.add('is-dragging'); badge.setPointerCapture(e.pointerId);
    setPivot(); angle = pointToAngle(e); vel = 0;
    if (hint) hint.classList.add('is-hidden');
  });
  badge.addEventListener('pointermove', (e) => {
    if (dragging) { const next = pointToAngle(e); vel = (next - angle) * 30; angle = next; }
    else if (e.pointerType === 'mouse') vel += e.movementX * 0.35;   // efek tertiup
  });
  const release = () => { dragging = false; badge.classList.remove('is-dragging'); };
  badge.addEventListener('pointerup', release);
  badge.addEventListener('pointercancel', release);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(badge);

  (function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.032); last = now;
    if (visible) {   // di luar layar: tidak menghitung dan tidak menulis style
      if (!dragging) { vel += (-STIFFNESS * angle - DAMPING * vel) * dt; angle += vel * dt; }
      badge.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      badge.style.setProperty('--shine', Math.min(Math.abs(vel) / 60, 1).toFixed(2));
    }
    requestAnimationFrame(tick);
  })(performance.now());
})();

/* ---------- 5. ROLE CHIPS: sorotan bergantian ---------- */
(function () {
  const chips = $$('.role-chip');
  if (!chips.length) return;
  let current = 0, paused = false;
  const activate = (i) => { chips.forEach((c, k) => c.classList.toggle('is-active', k === i)); current = i; };
  activate(0);
  if (reduce) return;
  setInterval(() => { if (!paused && !document.hidden) activate((current + 1) % chips.length); }, 2200);
  chips.forEach((chip, i) => {
    chip.addEventListener('mouseenter', () => { paused = true; activate(i); });
    chip.addEventListener('mouseleave', () => { paused = false; });
  });
})();

/* ---------- 6. STAT CARDS: count-up, bar, joke ---------- */
(function () {
  const cards = $$('.stat-card');
  if (!cards.length) return;
  const DURATION = 1400, STAGGER = 150;
  const closeAll = (except) => cards.forEach((c) => { if (c !== except) c.classList.remove('is-open'); });

  cards.forEach((card, idx) => {
    const num = $('.num', card);
    const to = parseFloat(card.dataset.to) || 0;
    const dec = parseInt(card.dataset.dec || '0', 10);
    const suffix = card.dataset.suffix || '';
    const fill = parseFloat(card.dataset.fill) || 0;
    const jokes = (card.dataset.jokes || '').split('|').filter(Boolean);

    // gelembung joke
    const tip = document.createElement('div');
    tip.className = 'stat-joke'; tip.id = 'statJoke' + idx; tip.setAttribute('role', 'tooltip');
    card.appendChild(tip);
    card.tabIndex = 0; card.setAttribute('aria-describedby', tip.id);

    let j = -1;
    const nextJoke = () => { if (jokes.length) { j = (j + 1) % jokes.length; tip.textContent = jokes[j]; } };
    const open = () => { closeAll(card); nextJoke(); card.classList.add('is-open'); };
    card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') open(); });
    card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') card.classList.remove('is-open'); });
    card.addEventListener('focus', open);
    card.addEventListener('blur', () => card.classList.remove('is-open'));
    card.addEventListener('click', (e) => { e.stopPropagation(); card.classList.contains('is-open') ? nextJoke() : open(); });

    // count-up + bar, jalan sekali saat kartu terlihat
    if (!reduce) num.textContent = (0).toFixed(dec) + suffix;
    const run = () => {
      card.style.setProperty('--fill', fill + '%');
      if (reduce) { num.textContent = to.toFixed(dec) + suffix; return; }
      const t0 = performance.now();
      (function step(now) {
        const p = Math.min((now - t0) / DURATION, 1);
        num.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec) + suffix;   // easeOutCubic
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    };
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { setTimeout(run, idx * STAGGER); obs.disconnect(); }
    }, { threshold: 0.4 }).observe(card);
  });
  document.addEventListener('click', () => closeAll());   // tap di luar menutup gelembung
})();

/* ---------- 7. SKILLS: logo, marquee, kecepatan konstan ---------- */
(function () {
  // [slug Simple Icons, warna] atau ['local', 'path']. Tool yang tidak terdaftar tetap pakai monogram.
  const LOGOS = {
    'PHP': ['php', '777BB4'], 'Laravel': ['laravel', 'FF2D20'], 'MySQL': ['mysql', '4479A1'],
    'VB.NET': ['dotnet', '512BD4'], 'Python': ['python', '3776AB'], 'Pandas': ['pandas', '150458'],
    'Tableau': ['local', 'assets/img/logos/tableau.png'], 'Crystal Reports': ['sap', '0FAAFF'],
    'Figma': ['figma', 'F24E1E'], 'Maze': ['local', 'assets/img/logos/maze.png'],
    'StarUML': ['local', 'assets/img/logos/staruml.png'], 'GitHub': ['github', '181717'],
    'SmartPLS': ['local', 'assets/img/logos/smartpls.png'],
  };
  const DB_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#2461C7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>';

  // a) pasang logo SEBELUM kartu digandakan, supaya salinannya sudah membawa logo
  $$('.sk').forEach((sk) => {
    const tile = $('i', sk), name = $('b', sk).firstChild.textContent.trim();
    if (name === 'SQL') { tile.innerHTML = DB_SVG; return; }
    const m = LOGOS[name];
    if (!m) return;
    const fallback = tile.textContent, img = document.createElement('img');
    img.src = m[0] === 'local' ? m[1] : `https://cdn.simpleicons.org/${m[0]}/${m[1]}`;
    img.alt = ''; img.loading = 'lazy';
    img.onerror = () => img.replaceWith(fallback);   // gagal dimuat -> kembali ke monogram
    tile.textContent = ''; tile.appendChild(img);
  });

  // b) gandakan isi jadi 4 salinan agar loop mulus (CSS menggeser tepat 1 salinan = 25%)
  if (reduce) return;
  $$('.mq-track').forEach((track) => {
    const base = [...track.children];
    for (let k = 0; k < 3; k++) base.forEach((n) => {
      const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c);
    });
  });

  // c) kecepatan sama di semua baris, berapa pun jumlah kartunya
  const SPEED = 30;   // piksel per detik
  const apply = () => $$('.mq-row').forEach((row) => {
    const oneSet = $('.mq-track', row).scrollWidth / 4;
    row.style.setProperty('--t', (oneSet / SPEED).toFixed(1) + 's');
  });
  addEventListener('load', apply);
  addEventListener('resize', apply);
  if (document.fonts) document.fonts.ready.then(apply);
})();

/* ---------- 8. SCROLL REVEAL: satu observer, dua arah ----------
   Elemen muncul saat masuk layar dan hilang saat keluar.
   Arah geser mengikuti arah scroll (--rv-y). */
(function () {
  if (reduce) return;
  const OFFSET = 32, STEP = 0.1;

  const fade = [   // ikut animasi muncul/hilang
    '.section-head', '.marquee', '.am-left > *', '.proj-card', '.cert-card',
    '.contact .wrap > div', '.contact-form', '.contact-info-item',
  ];
  const stateOnly = ['.tl-item', '.xp-item'];   // hanya butuh class is-in (titik/cincin); teksnya diurus modul 10

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const el = en.target;
      if (en.isIntersecting) {
        el.style.setProperty('--d', el.dataset.d);   // masuk: jeda bergantian
        el.classList.add('is-in');
      } else {
        el.style.setProperty('--rv-y', (en.boundingClientRect.top < 0 ? -OFFSET : OFFSET) + 'px');
        el.style.setProperty('--d', '0s');           // keluar: langsung
        el.classList.remove('is-in');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  const seen = new Set();
  const watch = (sel, withFade) => $$(sel).forEach((el, i) => {
    if (seen.has(el)) return;
    seen.add(el);
    if (withFade) el.classList.add('rv');
    el.dataset.d = ((i % 3) * STEP).toFixed(2) + 's';
    io.observe(el);
  });
  fade.forEach((s) => watch(s, true));
  stateOnly.forEach((s) => watch(s, false));
})();

/* ---------- 9. GARIS TIMELINE terisi mengikuti scroll (About + Experience) ---------- */
(function () {
  [$('#tl'), $('#xp')].filter(Boolean).forEach((el) => {
    const update = () => {
      const r = el.getBoundingClientRect();
      const p = reduce ? 1 : clamp((innerHeight * 0.65 - r.top) / r.height, 0, 1);
      el.style.setProperty('--p', p.toFixed(3));
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  });
})();

/* ---------- 10. TEKS MEMUDAR mengikuti posisi scroll (About + Experience) ---------- */
(function () {
  if (reduce) return;
  const els = $$('.tl-when,.tl-title,.tl-desc,.xp-date,.xp-item h3,.xp-co,.xp-desc,.xp-tags,.xp-orgs h3,.xp-orgs li');
  els.forEach((e) => e.classList.add('sc'));

  let queued = false;
  const run = () => {
    queued = false;
    const vh = innerHeight, zone = vh * 0.24;   // 24% tepi atas/bawah = zona memudar
    els.forEach((e) => {
      const r = e.getBoundingClientRect(), c = r.top + r.height / 2;
      const t = clamp(Math.min(c, vh - c) / zone, 0, 1);
      e.style.setProperty('--o', t.toFixed(2));
      e.style.setProperty('--y', ((1 - t) * (c < vh / 2 ? -1 : 1) * 22).toFixed(1) + 'px');
    });
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(run); } }, { passive: true });
  addEventListener('resize', run);
  run();
})();

/* ---------- 11. TILT 3D kartu proyek + sertifikat ---------- */
(function () {
  const cards = $$('.proj-card, .cert-card');
  if (!cards.length || reduce) return;
  const MAX_TILT = 9;

  // satu listener untuk semua kartu
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const card = e.target.closest && e.target.closest('.proj-card, .cert-card');
    cards.forEach((c) => { if (c !== card) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); } });
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--ry', ((px - 0.5) * 2 * MAX_TILT).toFixed(2) + 'deg');
    card.style.setProperty('--rx', ((0.5 - py) * 2 * MAX_TILT).toFixed(2) + 'deg');
    card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
  }, { passive: true });
})();