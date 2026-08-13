// ---- KO/EN language toggle ----
// How it works: every translatable element is marked with the boolean
// attribute `data-i18n`. On first load we snapshot each element's current
// (Korean) markup into `data-ko` so we can always restore it. When an
// element also carries `data-en="..."`, switching to EN swaps that element's
// content to the English text. Elements with `data-i18n` but no `data-en`
// yet simply stay in Korean when EN is selected — so translations can be
// added incrementally, section by section, without breaking anything.
(function initLanguageToggle() {
  const i18nEls = document.querySelectorAll('[data-i18n]');
  i18nEls.forEach(el => {
    if (!el.dataset.ko) el.dataset.ko = el.innerHTML;
  });

  function applyLanguage(lang) {
    i18nEls.forEach(el => {
      if (lang === 'en' && el.dataset.en) {
        el.innerHTML = el.dataset.en;
      } else {
        el.innerHTML = el.dataset.ko;
      }
    });
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    try { localStorage.setItem('site-lang', lang); } catch (e) {}
  }

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });

  let savedLang = 'ko';
  try { savedLang = localStorage.getItem('site-lang') || 'ko'; } catch (e) {}
  if (savedLang === 'en') applyLanguage('en');
})();

// Mobile nav toggle
const sidenav = document.getElementById('sidenav');
const mobileToggle = document.getElementById('mobileNavToggle');
if (mobileToggle) {
  mobileToggle.addEventListener('click', () => sidenav.classList.toggle('open'));
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => sidenav.classList.remove('open'));
  });
}

// Safe scroll reveal with stagger — visible by default; JS only adds the
// hidden/animated state, so a script failure never leaves content invisible.
const revealGroups = document.querySelectorAll('.reveal');
revealGroups.forEach(el => el.classList.add('js-pending'));

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in-view'), i * 60);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  revealGroups.forEach(el => revealObserver.observe(el));

  // Stagger cards within grids too
  document.querySelectorAll('.stat-card, .auto-tile, .campaign-card, .process-steps li, .ads-card').forEach(card => {
    card.classList.add('reveal', 'js-pending');
  });
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in-view'), i * 50);
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.stat-card, .auto-tile, .campaign-card, .process-steps li, .ads-card').forEach(card => cardObserver.observe(card));
} else {
  document.querySelectorAll('.js-pending').forEach(el => el.classList.add('in-view'));
}

// Active nav link on scroll
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => link.classList.toggle('active', link.dataset.section === id));
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
  sections.forEach(section => navObserver.observe(section));
}

// KPI count-up
const kpiNumbers = document.querySelectorAll('.kpi-number');
let kpiAnimated = false;
function animateKpis() {
  if (kpiAnimated) return;
  kpiAnimated = true;
  kpiNumbers.forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
const kpiStrip = document.getElementById('kpiStrip');
if (kpiStrip) {
  if ('IntersectionObserver' in window) {
    const kpiObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { animateKpis(); kpiObserver.disconnect(); } });
    }, { threshold: 0.4 });
    kpiObserver.observe(kpiStrip);
  } else { animateKpis(); }
}

// Chart color helper
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Profile tabs (kept for safety if present — no-op if absent)
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === target));
  });
});

// Automation filter pills
const filterPills = document.querySelectorAll('.filter-pill');
const autoCards = document.querySelectorAll('.auto-tile');
filterPills.forEach(pill => {
  pill.addEventListener('click', () => {
    filterPills.forEach(p => p.classList.toggle('active', p === pill));
    const filter = pill.dataset.filter;
    autoCards.forEach(card => {
      const show = filter === 'all' || card.dataset.area === filter;
      card.classList.toggle('hidden', !show);
    });
  });
});

// Drag-to-scroll galleries
document.querySelectorAll('.drag-gallery').forEach(gallery => {
  let isDown = false, startX, scrollLeft, moved = false;
  gallery.addEventListener('mousedown', (e) => {
    isDown = true; moved = false;
    startX = e.pageX - gallery.offsetLeft;
    scrollLeft = gallery.scrollLeft;
  });
  gallery.addEventListener('mouseleave', () => { isDown = false; });
  gallery.addEventListener('mouseup', () => { isDown = false; });
  gallery.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - gallery.offsetLeft;
    const walk = (x - startX) * 1.2;
    if (Math.abs(walk) > 5) moved = true;
    gallery.scrollLeft = scrollLeft - walk;
  });
  // Prevent click-through triggering a modal after a drag
  gallery.addEventListener('click', (e) => {
    if (moved) { e.stopPropagation(); e.preventDefault(); }
  }, true);
});

// Flow diagram tooltips (tap-friendly, in addition to CSS :hover)
const flowTipNodes = document.querySelectorAll('.has-tip');
flowTipNodes.forEach(node => {
  node.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = node.classList.contains('tip-open');
    flowTipNodes.forEach(n => n.classList.remove('tip-open'));
    if (!isOpen) node.classList.add('tip-open');
  });
});
document.addEventListener('click', () => {
  flowTipNodes.forEach(n => n.classList.remove('tip-open'));
});

// Journey curve tooltip nodes (tap-friendly, in addition to CSS :hover)
const curveNodes = document.querySelectorAll('.curve-node');
curveNodes.forEach(node => {
  node.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = node.classList.contains('tt-open');
    curveNodes.forEach(n => n.classList.remove('tt-open'));
    if (!isOpen) node.classList.add('tt-open');
  });
});
document.addEventListener('click', () => {
  curveNodes.forEach(n => n.classList.remove('tt-open'));
});

// Website renewal — scroll-triggered animated CSS bars (no external chart library needed)
const renewalChartsEl = document.getElementById('renewalCharts');
if (renewalChartsEl) {
  const miniBars = renewalChartsEl.querySelectorAll('.mini-bar-fill');
  function revealMiniBars() {
    miniBars.forEach((bar, i) => setTimeout(() => bar.classList.add('in-view'), i * 60));
  }
  if ('IntersectionObserver' in window) {
    const renewalObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { revealMiniBars(); renewalObserver.disconnect(); } });
    }, { threshold: 0.3 });
    renewalObserver.observe(renewalChartsEl);
  } else {
    revealMiniBars();
  }
}

// Campaign modals
const modalBackdrop = document.getElementById('modalBackdrop');
const modalPanels = document.querySelectorAll('.modal-panel');

function openModal(id) {
  modalPanels.forEach(p => p.classList.toggle('open', p.dataset.modalPanel === id));
  modalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Trigger mini-bar chart animation inside the opened modal
  // (these bars live outside #renewalCharts, so the page-load
  // IntersectionObserver never reaches them).
  const openPanel = document.querySelector(`.modal-panel[data-modal-panel="${id}"]`);
  if (openPanel) {
    const bars = openPanel.querySelectorAll('.mini-bar-fill');
    bars.forEach((bar, i) => {
      bar.classList.remove('in-view');
      // Force reflow so the width transition replays every time the modal opens
      void bar.offsetWidth;
      setTimeout(() => bar.classList.add('in-view'), i * 80 + 50);
    });
  }
}
function closeModal() {
  modalBackdrop.classList.remove('open');
  modalPanels.forEach(p => p.classList.remove('open'));
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-modal]').forEach(card => {
  card.addEventListener('click', () => openModal(card.dataset.modal));
});
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', closeModal);
});
if (modalBackdrop) {
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
