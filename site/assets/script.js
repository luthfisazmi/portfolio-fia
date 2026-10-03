// Fallback for CDN tech-logo icons: swap to a colored initial badge if the
// external icon fails to load (e.g. offline, CDN blocked).
document.querySelectorAll('.skill-pill img').forEach(img => {
  img.addEventListener('error', () => {
    const label = img.nextElementSibling ? img.nextElementSibling.textContent.trim() : '?';
    const fallback = document.createElement('span');
    fallback.className = 'ic-fallback';
    fallback.style.background = '#4C6B2E';
    fallback.textContent = label.slice(0, 2);
    img.replaceWith(fallback);
  }, { once: true });
});

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id], header[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const setActive = () => {
  let current = '';
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 120 && rect.bottom >= 120) {
      current = section.getAttribute('id');
    }
  });
  navAnchors.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
};
window.addEventListener('scroll', setActive);
setActive();

// Skills filter
const filterBtns = document.querySelectorAll('.filter-btn');
const skillPills = document.querySelectorAll('.skill-pill');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const filter = btn.dataset.filter;
    skillPills.forEach(pill => {
      const cats = pill.dataset.cat || '';
      const show = filter === 'all' || cats.split(' ').includes(filter);
      pill.style.display = show ? 'flex' : 'none';
    });
  });
});

// Contact form -> mailto fallback
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;
  const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
  const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
  window.location.href = `mailto:luthfiadiyah@gmail.com?subject=${subject}&body=${body}`;
});

/* ===== Badge pendulum: drag, lepas, memantul balik ===== */
(function () {
  const badge = document.querySelector('.hero-visual .badge');
  if (!badge) return;
  const hint = badge.querySelector('.drag-hint');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const STIFFNESS = 38;    // makin besar = makin cepat balik
  const DAMPING   = 2.6;   // makin kecil = makin lama berayun
  const MAX_ANGLE = 40;    // batas ayunan (derajat)

  let angle = 10, vel = 0, dragging = false, visible = true;
  let pivotX = 0, pivotY = 0, last = performance.now();

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function setPivot() {
    // panjang tali dibaca dari CSS, jadi otomatis ikut breakpoint
    const strap = parseFloat(getComputedStyle(badge).getPropertyValue('--strap')) || 90;
    const r = badge.offsetParent.getBoundingClientRect();
    pivotX = r.left + badge.offsetLeft + badge.offsetWidth / 2;
    pivotY = r.top + badge.offsetTop - strap;   // ujung atas tali = bawah nav
  }

  function pointToAngle(e) {
    const dx = e.clientX - pivotX;
    const dy = Math.max(e.clientY - pivotY, 60);
    return clamp(-Math.atan2(dx, dy) * 180 / Math.PI, -MAX_ANGLE, MAX_ANGLE);
  }

  badge.addEventListener('pointerdown', (e) => {
    dragging = true;
    badge.classList.add('is-dragging');
    badge.setPointerCapture(e.pointerId);
    setPivot();
    angle = pointToAngle(e);
    vel = 0;
    if (hint) hint.classList.add('is-hidden');
  });

  badge.addEventListener('pointermove', (e) => {
    if (dragging) {
      const next = pointToAngle(e);
      vel = (next - angle) * 30;   // simpan kecepatan untuk efek "lemparan"
      angle = next;
    } else if (e.pointerType === 'mouse') {
      vel += e.movementX * 0.35;   // efek tertiup saat mouse lewat
    }
  });

  const release = () => {
    dragging = false;
    badge.classList.remove('is-dragging');
  };
  badge.addEventListener('pointerup', release);
  badge.addEventListener('pointercancel', release);

  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(badge);

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.032);
    last = now;
    if (visible && !dragging) {
      const acc = -STIFFNESS * angle - DAMPING * vel;
      vel += acc * dt;
      angle += vel * dt;
    }
    badge.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    badge.style.setProperty('--shine', Math.min(Math.abs(vel) / 60, 1).toFixed(2));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ===== Skills: durasi, jeda, dan tinggi lompatan acak per pill ===== */
(function () {
  const pills = document.querySelectorAll('#skillsGrid .skill-pill');
  pills.forEach((pill, i) => {
    const dur   = (3.2 + Math.random() * 2.4).toFixed(2);   // 3.2 – 5.6 detik
    const delay = (-Math.random() * 4).toFixed(2);          // mulai di titik berbeda
    const amp   = -(5 + Math.random() * 7).toFixed(1);      // -5px sampai -12px
    pill.style.setProperty('--dur', dur + 's');
    pill.style.setProperty('--delay', delay + 's');
    pill.style.setProperty('--amp', amp + 'px');
    pill.querySelector('img, .ic-fallback')
      ?.style.setProperty('animation-delay', (-(i * 0.45)).toFixed(2) + 's');
  });
})();

/* ===== Projects: tilt 3D + kilau + reveal bergantian ===== */
(function () {
  const cards = document.querySelectorAll('.proj-grid .proj-card');
  if (!cards.length) return;

  const MAX_TILT = 9;   // derajat; makin besar makin miring
  const canHover = matchMedia('(hover: hover)').matches &&
                   !matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Tilt + kilau */
  if (canHover) {
    cards.forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r  = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;    // 0 – 1
        const py = (e.clientY - r.top)  / r.height;
        card.style.setProperty('--ry', ((px - 0.5) * 2 * MAX_TILT).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 2 * MAX_TILT).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* Reveal bergantian per baris */
  const perRow = window.innerWidth > 900 ? 3 : window.innerWidth > 600 ? 2 : 1;
  cards.forEach((card, i) => {
    card.classList.add('js-reveal');
    card.style.setProperty('--d', ((i % perRow) * 0.12).toFixed(2) + 's');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach((c) => io.observe(c));
})();

/* ===== Role chips: sorotan berpindah bergantian ===== */
(function () {
  const row = document.querySelector('.role-row');
  if (!row) return;
  const chips = [...row.querySelectorAll('.role-chip')];
  if (!chips.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INTERVAL = 2200;   // ms per chip
  let current = 0, paused = false;

  const activate = (i) => {
    chips.forEach((c, k) => c.classList.toggle('is-active', k === i));
    current = i;
  };

  activate(0);
  if (reduce) return;

  // Pindah otomatis ke chip berikutnya
  setInterval(() => {
    if (paused || document.hidden) return;
    activate((current + 1) % chips.length);
  }, INTERVAL);

  // Hover: sorotan pindah ke chip itu dan berhenti berpindah
  chips.forEach((chip, i) => {
    chip.addEventListener('mouseenter', () => { paused = true; activate(i); });
    chip.addEventListener('mouseleave', () => { paused = false; });
  });
})();

/* ===== Stat cards: count-up, bar, joke bubble ===== */
(function () {
  const cards = [...document.querySelectorAll('.stat-card')];
  if (!cards.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURATION = 1400;   // ms count-up
  const STAGGER  = 150;    // jeda antar kartu

  const closeAll = (except) =>
    cards.forEach((c) => { if (c !== except) c.classList.remove('is-open'); });

  cards.forEach((card, idx) => {
    const num    = card.querySelector('.num');
    const to     = parseFloat(card.dataset.to) || 0;
    const dec    = parseInt(card.dataset.dec || '0', 10);
    const suffix = card.dataset.suffix || '';
    const fill   = parseFloat(card.dataset.fill) || 0;
    const jokes  = (card.dataset.jokes || '').split('|').filter(Boolean);

    /* ---- joke bubble ---- */
    const tip = document.createElement('div');
    tip.className = 'stat-joke';
    tip.id = `statJoke${idx}`;
    tip.setAttribute('role', 'tooltip');
    card.appendChild(tip);

    card.tabIndex = 0;
    card.setAttribute('aria-describedby', tip.id);

    let j = -1;
    const nextJoke = () => {
      if (!jokes.length) return;
      j = (j + 1) % jokes.length;
      tip.textContent = jokes[j];
    };
    const open = () => { closeAll(card); nextJoke(); card.classList.add('is-open'); };
    const close = () => card.classList.remove('is-open');

    card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') open(); });
    card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') close(); });
    card.addEventListener('focus', open);
    card.addEventListener('blur', close);
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      if (card.classList.contains('is-open')) nextJoke();   // klik lagi = joke berikutnya
      else open();                                          // tap pertama di HP
    });

    /* ---- count-up + bar ---- */
    if (!reduce) num.textContent = (0).toFixed(dec) + suffix;

    const run = () => {
      card.style.setProperty('--fill', fill + '%');
      if (reduce) { num.textContent = to.toFixed(dec) + suffix; return; }
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / DURATION, 1);
        const eased = 1 - Math.pow(1 - p, 3);              // easeOutCubic
        num.textContent = (to * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) {
        setTimeout(run, idx * STAGGER);
        obs.disconnect();
      }
    }, { threshold: 0.4 }).observe(card);
  });

  // tap di luar kartu menutup bubble (untuk HP)
  document.addEventListener('click', () => closeAll());
})();

(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
 
  /* ---- reveal saat scroll (About, Experience, judul section) ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
 
  const reveal = (sel, step) => {
    if (reduce) return;
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('rv');
      el.style.setProperty('--d', ((i % 4) * step).toFixed(2) + 's');
      io.observe(el);
    });
  };
  reveal('.section-head', 0);
  reveal('.am-left > *', 0.08);
  reveal('.tl-item', 0);          // tiap item muncul tepat saat di-scroll
  reveal('.exp-card', 0.15);
  reveal('.exp-card li', 0.1);
  reveal('.cert-card', 0.12);
 
  /* ---- garis timeline terisi mengikuti scroll ---- */
  const tl = document.getElementById('tl');
  if (tl) {
    const update = () => {
      const r = tl.getBoundingClientRect();
      const p = reduce ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
      tl.style.setProperty('--p', p.toFixed(3));
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }
 
  /* ---- marquee skills: gandakan isi agar loop mulus ---- */
  if (!reduce) {
    document.querySelectorAll('.mq-track').forEach((track) => {
      const base = [...track.children];
      for (let k = 0; k < 3; k++) {
        base.forEach((n) => {
          const c = n.cloneNode(true);
          c.setAttribute('aria-hidden', 'true');
          track.appendChild(c);
        });
      }
    });
  }
 
  /* ---- kartu proyek tanpa link: jangan loncat ke atas ---- */
  document.querySelectorAll('a.proj-card[href="#"]').forEach((a) =>
    a.addEventListener('click', (e) => e.preventDefault()));
})();

/* ===== v6 — tempel di PALING BAWAH script.js (setelah additions.js) ===== */
(function () {
  const xp = document.getElementById('xp');
  if (!xp) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...xp.querySelectorAll('.xp-item'), ...document.querySelectorAll('.xp-orgs')];

  /* tiap item muncul saat di-scroll */
  if (reduce) {
    items.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => { el.classList.add('rv'); io.observe(el); });
  }

  /* garis merah terisi mengikuti scroll */
  const update = () => {
    const r = xp.getBoundingClientRect();
    const p = reduce ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
    xp.style.setProperty('--p', p.toFixed(3));
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();

/* ===== v7 — tempel di PALING BAWAH script.js (setelah additions.js dan v6.js) ===== */
/* ===== v7 — tempel di PALING BAWAH script.js (setelah additions.js dan v6.js) ===== */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1) Logo asli per tool (Simple Icons CDN) ----------
     [slug, warna]. Tool yang tidak ada di sini tetap pakai monogram.
     Kalau logo gagal dimuat, otomatis kembali ke monogram. */
  const LOGOS = {
    'PHP':             ['php', '777BB4'],
    'Laravel':         ['laravel', 'FF2D20'],
    'MySQL':           ['mysql', '4479A1'],
    'VB.NET':          ['dotnet', '512BD4'],
    'Python':          ['python', '3776AB'],
    'Pandas':          ['pandas', '150458'],
    'Tableau':         ['local', 'assets/img/logos/tableau.png'],
    'Crystal Reports': ['sap', '0FAAFF'],
    'Figma':           ['figma', 'F24E1E'],
    'Canva':           ['local', 'assets/img/logos/canva.png'],
    'Maze':            ['local', 'assets/img/logos/maze.png'],
    'StarUML':         ['local', 'assets/img/logos/staruml.png'],
    'GitHub':          ['github', '181717'],
    'SmartPLS':     ['local', 'assets/img/logos/smartpls.png'],
  };
  const DB_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#2461C7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>';

  document.querySelectorAll('.sk').forEach((sk) => {
    const tile = sk.querySelector('i');
    const name = sk.querySelector('b').firstChild.textContent.trim();
    if (name === 'SQL') { tile.innerHTML = DB_SVG; return; }
    const m = LOGOS[name];
    if (!m) return;
    const fallback = tile.textContent;
    const img = document.createElement('img');
    img.src = m[0] === 'local' ? m[1] : `https://cdn.simpleicons.org/${m[0]}/${m[1]}`;
    img.alt = '';
    img.loading = 'lazy';
    img.onerror = () => img.replaceWith(fallback);
    tile.textContent = '';
    tile.appendChild(img);
  });

  /* ---------- 2) Kalimat hilang/muncul mengikuti scroll ---------- */
  if (reduce) return;
  const sel = '.tl-when,.tl-title,.tl-desc,.xp-date,.xp-item h3,.xp-co,.xp-desc,.xp-tags,.xp-orgs h3,.xp-orgs li';
  const els = [...document.querySelectorAll(sel)];
  els.forEach((e) => e.classList.add('sc'));

  let queued = false;
  const run = () => {
    queued = false;
    const vh = innerHeight, zone = vh * 0.24;           // 24% tepi atas/bawah = zona memudar
    els.forEach((e) => {
      const r = e.getBoundingClientRect();
      const c = r.top + r.height / 2;
      const t = Math.max(0, Math.min(1, Math.min(c, vh - c) / zone));
      e.style.setProperty('--o', t.toFixed(2));
      e.style.setProperty('--y', ((1 - t) * (c < vh / 2 ? -1 : 1) * 22).toFixed(1) + 'px');
    });
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(run); } }, { passive: true });
  addEventListener('resize', run);
  run();
})();

/* ===== v11 — GANTI blok v10.js dengan ini (tempel di PALING BAWAH script.js) ===== */
(function () {
  const cards = [...document.querySelectorAll('.cert-card')];
  if (!cards.length) return;

  const MAX_TILT = 9;   // sama dengan kartu Projects
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveal bergantian per baris
  cards.forEach((c, i) => c.style.setProperty('--d', ((i % 3) * 0.12).toFixed(2) + 's'));
  if (reduce) return;

  // satu listener untuk semua kartu (tidak bergantung urutan script atau media hover)
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const card = e.target.closest && e.target.closest('.cert-card');
    cards.forEach((c) => {
      if (c === card) return;
      c.style.setProperty('--rx', '0deg');
      c.style.setProperty('--ry', '0deg');
    });
    if (!card) return;
    const r  = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top)  / r.height;
    card.style.setProperty('--ry', ((px - 0.5) * 2 * MAX_TILT).toFixed(2) + 'deg');
    card.style.setProperty('--rx', ((0.5 - py) * 2 * MAX_TILT).toFixed(2) + 'deg');
    card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
  }, { passive: true });
})();
