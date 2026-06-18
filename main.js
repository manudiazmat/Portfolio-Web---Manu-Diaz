'use strict';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

/* Loader --------------------------------------------------- */
function initLoader() {
  const loader = $('#loader');
  const fill = $('#loader-fill');
  const count = $('#loader-count');
  if (!loader || !fill || !count) return;

  let progress = 0;
  const timer = setInterval(() => {
    progress = Math.min(98, progress + Math.random() * 18);
    fill.style.transform = `scaleX(${progress / 100})`;
    count.textContent = String(Math.floor(progress)).padStart(3, '0');
  }, 55);

  const finish = () => {
    clearInterval(timer);
    fill.style.transform = 'scaleX(1)';
    count.textContent = '100';
    setTimeout(() => {
      loader.classList.add('is-hidden');
      document.body.classList.remove('is-loading');
    }, 320);
  };

  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish, { once: true });
  setTimeout(finish, 1600);
}

/* Cursor + background wash -------------------------------- */
function initPointer() {
  const cursor = $('#cursor');
  const follower = $('#cursor-follower');
  if (!cursor || !follower || matchMedia('(hover: none)').matches) return;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let fx = x;
  let fy = y;

  window.addEventListener('mousemove', (event) => {
    x = event.clientX;
    y = event.clientY;

    const nx = x / window.innerWidth;
    const ny = y / window.innerHeight;

    const mx = (nx - 0.5) * 26;
    const my = (ny - 0.5) * 26;

    // Hero gradient interaction: the colour field drifts away from the cursor
    // while a very soft dark pocket opens under the pointer.
    const flowX = (0.5 - nx) * 110;
    const flowY = (0.5 - ny) * 82;

    document.documentElement.style.setProperty('--mx', `${mx}px`);
    document.documentElement.style.setProperty('--my', `${my}px`);
    document.documentElement.style.setProperty('--hero-x', `${nx * 100}%`);
    document.documentElement.style.setProperty('--hero-y', `${ny * 100}%`);
    document.documentElement.style.setProperty('--hero-avoid-x', `${nx * 100}%`);
    document.documentElement.style.setProperty('--hero-avoid-y', `${ny * 100}%`);
    document.documentElement.style.setProperty('--hero-flow-x', `${flowX}px`);
    document.documentElement.style.setProperty('--hero-flow-y', `${flowY}px`);
  }, { passive: true });

  function tick() {
    fx = lerp(fx, x, 0.14);
    fy = lerp(fy, y, 0.14);
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    follower.style.left = `${fx}px`;
    follower.style.top = `${fy}px`;
    requestAnimationFrame(tick);
  }
  tick();

  const hoverables = 'a, button, .preview-panel__media, .project-block, .gallery-item';
  document.addEventListener('mouseover', (event) => {
    if (event.target.closest(hoverables)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', (event) => {
    if (event.target.closest(hoverables)) document.body.classList.remove('cursor-hover');
  });
}


/* Organic modular hero gradient --------------------------- */
function initOrganicHeroGradient() {
  const hero = document.querySelector('.hero--cinematic');
  if (!hero) return;

  let targetX = 0.5;
  let targetY = 0.5;
  let x = 0.5;
  let y = 0.5;
  const root = document.documentElement;

  window.addEventListener('mousemove', (event) => {
    targetX = event.clientX / window.innerWidth;
    targetY = event.clientY / window.innerHeight;
  }, { passive: true });

  function tick(now) {
    const t = now * 0.001;
    x = lerp(x, targetX, 0.045);
    y = lerp(y, targetY, 0.045);

    // Base idle motion: slow, irregular, organic.
    const idleX = Math.sin(t * 0.18) * 26 + Math.sin(t * 0.071 + 1.9) * 34;
    const idleY = Math.cos(t * 0.15 + 0.7) * 22 + Math.sin(t * 0.089) * 28;

    // Repulsion: colour modules move away from the pointer. The dark pocket
    // remains under the cursor, so the field visually opens around it.
    const repelX = (0.5 - x) * 150;
    const repelY = (0.5 - y) * 118;

    root.style.setProperty('--hero-mouse-x', `${x * 100}%`);
    root.style.setProperty('--hero-mouse-y', `${y * 100}%`);

    root.style.setProperty('--hero-field-x', `${repelX * 0.36 + idleX * 0.38}px`);
    root.style.setProperty('--hero-field-y', `${repelY * 0.30 + idleY * 0.36}px`);

    root.style.setProperty('--hero-blue-x', `${repelX * 0.62 + idleX * 0.52}px`);
    root.style.setProperty('--hero-blue-y', `${repelY * 0.46 + idleY * 0.48}px`);

    root.style.setProperty('--hero-orange-x', `${repelX * -0.50 + idleX * -0.32}px`);
    root.style.setProperty('--hero-orange-y', `${repelY * -0.38 + idleY * 0.42}px`);

    root.style.setProperty('--hero-black-x', `${repelX * 0.22 + idleX * -0.18}px`);
    root.style.setProperty('--hero-black-y', `${repelY * 0.24 + idleY * 0.16}px`);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}


/* Hero typewriter ---------------------------------------- */
function initHeroTypewriter() {
  const typed = $('#hero-typed');
  if (!typed) return;

  const fullText = typed.dataset.text || typed.textContent.trim();
  if (!fullText) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typed.textContent = fullText;
    return;
  }

  typed.textContent = '';
  let index = 0;
  let hasStarted = false;

  function step() {
    typed.textContent = fullText.slice(0, index);
    if (index <= fullText.length) {
      index += 1;
      const char = fullText.charAt(index - 1);
      const pause = /[,.&]/.test(char) ? 105 : char === ' ' ? 32 : 46;
      window.setTimeout(step, pause);
    }
  }

  function start() {
    if (hasStarted) return;
    hasStarted = true;
    step();
  }

  window.setTimeout(start, 1850);
}

/* Navigation ---------------------------------------------- */
function initNavigation() {
  const nav = $('#main-nav');
  const toggle = $('#nav-toggle');
  const mobile = $('#mobile-menu');
  const navLinks = $$('.nav__links a');
  const sectionMap = [
    ['hero', 'home'],
    ['about', 'about'],
    ['experience', 'experience'],
    ['projects', 'projects'],
    ['contact', 'contact'],
  ];

  function setMenu(open) {
    if (!toggle || !mobile) return;
    toggle.classList.toggle('is-open', open);
    mobile.classList.toggle('is-open', open);
    mobile.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }

  toggle?.addEventListener('click', () => setMenu(!toggle.classList.contains('is-open')));
  $$('#mobile-menu a, .nav__links a, .nav__brand').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  function onScroll() {
    nav?.classList.toggle('is-scrolled', window.scrollY > 30);
    const mid = window.scrollY + window.innerHeight * 0.42;
    sectionMap.forEach(([id, name]) => {
      const section = document.getElementById(id);
      if (!section) return;
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (mid >= top && mid < bottom) {
        navLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.nav === name));
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* Reveals -------------------------------------------------- */
function initReveals() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index * 0.025, 0.24)}s`;
    observer.observe(el);
  });
}

/* Preview card light -------------------------------------- */
function initMediaLight() {
  $$('.preview-panel__media').forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--card-x', `${x}%`);
      card.style.setProperty('--card-y', `${y}%`);
    });
  });
}

/* Gallery modal ------------------------------------------- */
const galleryData = {
  posters: {
    kicker: 'Project 01 / Posters',
    title: 'Posters',
    items: [
      { label: 'Antonio Muñoz Degrain exhibition poster', src: 'assets/project-images/poster-prado.png' },
      { label: 'Fiestas del Pilar illustration poster', src: 'assets/project-images/poster-fiestas-pilar.png' },
      { label: 'Graduation Fashion Show poster', src: 'assets/project-images/poster-graduation-fashion-show.png' },
      { label: 'Hermès fashion illustration poster', src: 'assets/project-images/poster-hermes.png' },
      { label: 'Medieval Market poster system', src: 'assets/project-images/poster-mercado-medieval.png' },
      { label: 'Manchild graphic poster', src: 'assets/project-images/poster-sabrina-carpenter.png' },
    ],
  },
  illustrations: {
    kicker: 'Project 02 / Illustration',
    title: 'Illustrations',
    items: [
      { label: 'Little Prince atmospheric illustration', src: 'assets/project-images/illustration-little-prince.png' },
      { label: 'Motorbike character illustration', src: 'assets/project-images/illustration-motorbike.png' },
      { label: 'Noir city concept illustration', src: 'assets/project-images/illustration-noir-city.png' },
      { label: 'Perspective character study', src: 'assets/project-images/illustration-perspective.png' },
      { label: 'Robot cinematic illustration', src: 'assets/project-images/illustration-robot.png' },
      { label: 'Under the Sea environment study', src: 'assets/project-images/illustration-under-the-sea.png' },
    ],
  },
  ovrkll: {
    kicker: 'Project 03 / OVRKLL Brand',
    title: 'OVRKLL Brand',
    items: [
      { label: 'Launch billboard', src: 'assets/project-images/ovrkll-advertisement-2.png' },
      { label: 'Embossed logo / light', src: 'assets/project-images/ovrkll-effect-1.png' },
      { label: 'Embossed logo / dark', src: 'assets/project-images/ovrkll-effect.png' },
      { label: 'Vertical outdoor mockup', src: 'assets/project-images/ovrkll-mockup-2.png' },
      { label: 'Architectural campaign wall', src: 'assets/project-images/ovrkll-mockup.png' },
      { label: 'Grillz graphic experiment', src: 'assets/project-images/ovrkll-grillz.png' },
    ],
  },
  archetype: {
    kicker: 'Project 04 / ARCHETYPE Brand',
    title: 'ARCHETYPE Brand',
    summary: {
      category: 'Premium sports sub-brand / Final Degree Project',
      headline: 'A complete brand system created for a premium sports sub-brand inside the Adidas ecosystem.',
      description: 'ARCHETYPE proposes a quieter, more precise territory within performance culture. Instead of spectacle and over-stimulation, the project builds a controlled editorial language based on process, discipline and visual clarity.',
      scope: 'Research, strategy, identity, campaign, editorial web and physical experience.',
      positioning: 'Technical performance + editorial aesthetic + everyday desirability.',
      audience: 'The aesthetic athlete, the creative professional and the aspirational younger community.',
      deliverables: ['Brand strategy', 'Visual identity', 'Campaign system', 'Landing page', 'Archetype Lab flagship concept', 'Retail and urban applications'],
      documentHref: 'assets/archetype-tfg.pdf',
      documentLabel: 'Trabajo de Fin de Grado · Diseño Gráfico',
      documentMeta: '22-page project presentation · Manuel Díaz Mateo · 2026',
      claim: 'Pause. Then become.'
    },
    items: [
      { label: 'Landscape campaign key visual', src: 'assets/project-images/archetype-add.png' },
      { label: 'Flagship store concept', src: 'assets/project-images/archetype-lab.png' },
      { label: 'Logo blackout screen', src: 'assets/project-images/archetype-logo.png' },
      { label: 'City billboard application', src: 'assets/project-images/archetype-mockup-city.png' },
      { label: 'Outdoor poster system', src: 'assets/project-images/archetype-mockup.png' },
      { label: 'Trekking campaign image', src: 'assets/project-images/archetype-trekking-add.png' },
    ],
  },
};

function initGallery() {
  const modal = $('#gallery-modal');
  const grid = $('#gallery-grid');
  const title = $('#gallery-title');
  const kicker = $('#gallery-kicker');
  const intro = $('#gallery-intro');
  const carousel = $('#carousel-modal');
  const carouselImage = $('#carousel-image');
  const carouselCaption = $('#carousel-caption');
  const carouselCounter = $('#carousel-counter');
  const carouselTitle = $('#carousel-title');
  const carouselKicker = $('#carousel-kicker');
  const prevBtn = $('#carousel-prev');
  const nextBtn = $('#carousel-next');
  if (!modal || !grid || !title || !kicker) return;

  let activeGalleryKey = null;
  let activeCarouselIndex = 0;

  const getImageItems = (key) => (galleryData[key]?.items || []).filter((item) => typeof item === 'object' && item.src);

  function openGallery(key) {
    const data = galleryData[key];
    if (!data) return;

    kicker.textContent = data.kicker;
    title.textContent = data.title;

    if (intro) {
      const summary = data.summary;
      if (summary) {
        intro.classList.add('is-visible');
        intro.innerHTML = `
          <section class="project-story">
            <article class="project-story__lead">
              <div>
                <span class="eyebrow">${summary.category}</span>
                <h3>${summary.headline}</h3>
                <p>${summary.description}</p>
              </div>
              <div class="project-story__actions">
                <a href="${summary.documentHref}" target="_blank" rel="noopener">Open full document <i>↗</i></a>
                <a href="${summary.documentHref}" target="_blank" rel="noopener" download>Download PDF <i>↓</i></a>
              </div>
            </article>
            <article class="project-story__meta">
              <div><span>Scope</span><strong>${summary.scope}</strong></div>
              <div><span>Positioning</span><strong>${summary.positioning}</strong></div>
              <div><span>Audience</span><strong>${summary.audience}</strong></div>
            </article>
            <article class="project-story__list">
              <div>
                <span>Main deliverables</span>
                <ul class="project-story__tags">${summary.deliverables.map((tag) => `<li>${tag}</li>`).join('')}</ul>
              </div>
              <p><strong>${summary.claim}</strong> The project extends from strategic research and identity design to campaign thinking, digital presentation and the Archetype Lab flagship experience.</p>
            </article>
            <article class="project-story__document">
              <div>
                <span>Attached document</span>
                <h3>${summary.documentLabel}</h3>
                <p>${summary.documentMeta}</p>
              </div>
              <div class="project-story__actions">
                <a href="${summary.documentHref}" target="_blank" rel="noopener">View dossier <i>↗</i></a>
              </div>
            </article>
          </section>
        `;
      } else {
        intro.classList.remove('is-visible');
        intro.innerHTML = '';
      }
    }

    grid.innerHTML = data.items.map((item, index) => {
      const number = String(index + 1).padStart(2, '0');
      if (typeof item === 'object' && item.src) {
        return `
          <button type="button" class="gallery-item gallery-item--image" data-carousel-item data-gallery-key="${key}" data-index="${index}" aria-label="Open ${data.title} carousel at ${item.label}">
            <img src="${item.src}" alt="${data.title} — ${item.label}" loading="lazy" />
            <div class="gallery-item__caption">
              <span>${number} / Image</span>
              <strong>${item.label}</strong>
            </div>
          </button>
        `;
      }

      const modifier = index % 3 === 0 ? 'gallery-item--dark' : index % 3 === 1 ? 'gallery-item--orange' : 'gallery-item--paper';
      return `
        <article class="gallery-item ${modifier}">
          <span>${number} / Image placeholder</span>
          <strong>${item}</strong>
        </article>
      `;
    }).join('');

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeGallery() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    closeCarousel(false);
    document.body.style.overflow = '';
  }

  function renderCarousel() {
    if (!carousel || !carouselImage || !carouselCaption || !carouselCounter || !carouselTitle || !carouselKicker) return;
    const data = galleryData[activeGalleryKey];
    const items = getImageItems(activeGalleryKey);
    if (!data || !items.length) return;

    activeCarouselIndex = (activeCarouselIndex + items.length) % items.length;
    const item = items[activeCarouselIndex];
    carouselTitle.textContent = data.title;
    carouselKicker.textContent = data.kicker;
    carouselImage.src = item.src;
    carouselImage.alt = `${data.title} — ${item.label}`;
    carouselCaption.textContent = item.label;
    carouselCounter.textContent = `${String(activeCarouselIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
  }

  function openCarousel(key, index = 0) {
    if (!carousel) return;
    const imageItems = getImageItems(key);
    if (!imageItems.length) return;
    activeGalleryKey = key;
    activeCarouselIndex = index;
    renderCarousel();
    carousel.classList.add('is-open');
    carousel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCarousel(restoreScroll = true) {
    if (!carousel) return;
    carousel.classList.remove('is-open');
    carousel.setAttribute('aria-hidden', 'true');
    if (restoreScroll && !modal.classList.contains('is-open')) document.body.style.overflow = '';
  }

  function changeSlide(direction) {
    const items = getImageItems(activeGalleryKey);
    if (!items.length) return;
    activeCarouselIndex = (activeCarouselIndex + direction + items.length) % items.length;
    renderCarousel();
  }

  prevBtn?.addEventListener('click', () => changeSlide(-1));
  nextBtn?.addEventListener('click', () => changeSlide(1));

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.gallery-trigger');
    if (trigger) {
      event.preventDefault();
      openGallery(trigger.dataset.gallery);
      return;
    }

    const carouselItem = event.target.closest('[data-carousel-item]');
    if (carouselItem) {
      event.preventDefault();
      openCarousel(carouselItem.dataset.galleryKey, Number(carouselItem.dataset.index || 0));
      return;
    }

    if (event.target.closest('[data-close-carousel]')) closeCarousel();
    if (event.target.closest('[data-close-gallery]')) closeGallery();
  });

  document.addEventListener('keydown', (event) => {
    if (carousel?.classList.contains('is-open')) {
      if (event.key === 'Escape') closeCarousel();
      if (event.key === 'ArrowLeft') changeSlide(-1);
      if (event.key === 'ArrowRight') changeSlide(1);
      return;
    }
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeGallery();
  });
}

/* Curved kinetic word wheel -------------------------------- */
function initCurvedWheel() {
  const wheel = $('.wheel-reference');
  const track = $('.wheel-reference__track');
  if (!wheel || !track) return;

  const words = $$('.wheel-reference__track span');
  if (!words.length) return;

  let running = true;
  let raf = null;
  let phase = 0;
  let last = performance.now();
  let rect = wheel.getBoundingClientRect();

  // Slower than previous versions: the reference feels like a continuous
  // mechanical wheel, not a fast marquee.
  let speed = 0.000082;

  const resize = () => {
    rect = wheel.getBoundingClientRect();
  };

  const observer = new IntersectionObserver(([entry]) => {
    running = entry.isIntersecting;
    wheel.classList.toggle('is-paused', !running);
    if (running && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }, { threshold: 0.08 });

  observer.observe(wheel);
  window.addEventListener('resize', resize, { passive: true });

  wheel.addEventListener('mouseenter', () => { speed = 0.000045; });
  wheel.addEventListener('mouseleave', () => { speed = 0.000082; });

  function normalizeAngle(angle) {
    const full = Math.PI * 2;
    angle = ((angle + Math.PI) % full + full) % full - Math.PI;
    return angle;
  }

  function tick(now) {
    raf = null;
    const dt = Math.min(48, now - last);
    last = now;

    if (running) {
      // Negative phase makes the words travel upward through the centre,
      // matching the supplied video reference.
      phase -= dt * speed;
      render();
      raf = requestAnimationFrame(tick);
    }
  }

  function render() {
    const count = words.length;
    const width = rect.width || wheel.offsetWidth || 640;
    const height = rect.height || wheel.offsetHeight || 620;

    // Geometry tuned to the supplied reference: a rounder wheel whose
    // front edge rises through the centre and pushes the active word to the right.
    const centerX = width * 0.285;
    const centerY = height * 0.50;
    const radiusX = width * 0.335;
    const radiusY = height * 0.535;

    // Keep the same speed, but make the arc more circular and legible.
    const step = 0.205;
    const activeZone = 1.58;

    words.forEach((word, index) => {
      const theta = normalizeAngle((index - count * 0.52) * step + phase);
      const abs = Math.abs(theta);

      // Front half of the wheel only. Other words are pushed out of view
      // until they loop back into the visible arc.
      if (abs > activeZone) {
        word.style.opacity = '0';
        word.style.pointerEvents = 'none';
        return;
      }

      const curve = Math.cos(theta);
      const x = centerX + curve * radiusX;
      const y = centerY + Math.sin(theta) * radiusY;

      // The word rotates with the circular path: top rows lean one way,
      // bottom rows lean the other, and the centre row sits almost straight.
      const rotateZ = theta * 23;
      const rotateY = (1 - curve) * -16;
      const rotateX = theta * -1.4;
      const scale = 0.76 + curve * 0.22;
      const opacity = clamp(0.16 + curve * 0.78 - abs * 0.06, 0, 1);
      const blur = abs > 1.36 ? 1.0 : abs > 1.12 ? 0.45 : 0;

      word.style.transform = `translate3d(${x}px, ${y}px, ${curve * 180}px) translate(-50%, -50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`;
      word.style.opacity = opacity.toFixed(3);
      word.style.filter = `blur(${blur}px)`;
      word.style.zIndex = String(Math.round((curve + 1) * 100));
      word.style.pointerEvents = 'none';
    });
  }

  resize();
  render();
  raf = requestAnimationFrame(tick);
}

function boot() {
  initLoader();
  initPointer();
  initOrganicHeroGradient();
  initHeroTypewriter();
  initNavigation();
  initReveals();
  initMediaLight();
  initGallery();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
