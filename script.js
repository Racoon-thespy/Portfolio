/* ============================================================
   MOBILE NAV TOGGLE
   ------------------------------------------------------------
   The CSS hides .navlinks on small screens (display: none).
   This script adds a button that toggles a class on/off,
   and the CSS reacts to that class to show/hide the menu.

   The core pattern here — select an element, listen for a
   click, toggle a class — is probably 60% of "beginner JS
   interactivity" in general. Once this clicks, buttons,
   accordions, tabs, modals all use the same shape.
   ============================================================ */

// 1. SELECT the elements we need to work with.
//    querySelector takes a CSS selector (same syntax as style.css)
//    and returns the FIRST matching element on the page.
const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.navlinks');

// 2. LISTEN for a click on the toggle button.
//    addEventListener(eventType, callbackFunction) —
//    the callback runs every time that event fires.
navToggle.addEventListener('click', () => {

  // 3. TOGGLE a class on navLinks.
  //    classList.toggle('open') adds "open" if it's not there,
  //    removes it if it already is — no if/else needed.
  navLinks.classList.toggle('open');

  // 4. Optional nicety: flip the button's own state too,
  //    so we can style it differently while the menu is open
  //    (e.g. turn a hamburger icon into an X).
  navToggle.classList.toggle('active');
  navToggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
});

// ============================================================
// SCROLL-DRIVEN UI — one rAF loop drives everything
// ------------------------------------------------------------
// #top (.h-scroll) is a tall (400vh) container; .h-stage pins to
// the viewport while .h-track is translated sideways based on how
// far you've scrolled through that container — one panel per
// section. The same tick also drives the bottom timeline scrubber
// (fill + playhead), so there is exactly ONE measure+paint pass
// per animation frame no matter how many scroll events fire in
// between, instead of two independent scroll pipelines.
//
// Layout reads (getBoundingClientRect/offsetHeight/scrollWidth)
// only ever happen inside measure() — called on load, on resize,
// and when horizontal mode switches on/off (all of which actually
// change the geometry). The per-frame tick() reads only
// window.scrollY, which is just a fast counter, not a layout read,
// then writes a transform (translate3d — GPU-composited, doesn't
// invalidate layout) and a couple of scrubber styles.
//
// Disabled on narrow/short viewports and under reduced-motion,
// where the normal vertical stack (plain CSS, no JS) takes over.
// ============================================================
const header = document.querySelector('header');
const hScroll = document.querySelector('.h-scroll');
const hStage = document.querySelector('.h-stage');
const hTrack = document.querySelector('.h-track');
const hPanels = Array.from(document.querySelectorAll('.h-panel'));
const hPanelContents = hPanels.map((p) => p.firstElementChild);

// The filmography panel reveals its extra "reels" sideways (a
// filmstrip) instead of upward like every other panel's overflow —
// same scroll-timeline slot, different axis/target.
const reelStrip = document.querySelector('.reel-strip');
const reelTrack = document.querySelector('.reel-track');
const filmographyIndex = hPanels.findIndex((p) => p.dataset.panel === 'filmography');

const scrubberFill = document.querySelector('.scrubber-fill');
const scrubberHead = document.querySelector('.scrubber-playhead');

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let hScrollActive = false;

// Cached layout metrics, in absolute page-space. Recomputed only by
// measure(), never inside tick().
//
// A panel isn't always exactly one viewport tall (filmography has more
// "reels" than fit on screen). So each panel gets its own timeline slot:
// first `overflow[i]` px of scroll reveal the rest of its content in
// place (translateY), THEN `vh` px slide the whole track sideways into
// the next panel. Previously the tall panel had its own native
// `overflow-y: auto`, so a wheel scroll would get captured by that
// inner scroll box instead of advancing the outer (horizontal) one —
// that fight between two independent scroll containers was the jank.
// Driving both axes off one `scrollY` reading removes that fight.
const metrics = {
  scrollStartY: 0,
  totalScrollable: 1,
  vh: 0,
  stageWidth: 0,
  panelStart: [],
  overflow: [],
  transitionStart: [],
};

function measure() {
  if (!hScroll || !hStage || !hTrack) return;
  // Read the header's real height into --header-h before measuring
  // anything else — .h-scroll's own top offset (below) depends on it.
  if (header) {
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }
  metrics.scrollStartY = hScroll.getBoundingClientRect().top + window.scrollY;
  metrics.vh = hStage.offsetHeight;
  metrics.stageWidth = hStage.offsetWidth;

  let cursor = 0;
  const lastIndex = hPanelContents.length - 1;
  hPanelContents.forEach((content, i) => {
    metrics.panelStart[i] = cursor;
    let overflow = 0;
    // Hero and the final (contact) panel should always be static —
    // no internal reveal-scroll, even if their content runs a little
    // taller than the viewport on some screens.
    const isStaticPanel = i === 0 || i === lastIndex;
    if (hScrollActive && !isStaticPanel) {
      overflow = (i === filmographyIndex && reelStrip && reelTrack)
        ? Math.max(0, reelTrack.scrollWidth - reelStrip.clientWidth)
        : Math.max(0, content.scrollHeight - metrics.vh);
    }
    metrics.overflow[i] = overflow;
    cursor += overflow;
    metrics.transitionStart[i] = cursor;
    if (i < lastIndex) cursor += metrics.vh;
  });
  metrics.totalScrollable = Math.max(1, cursor);

  hScroll.style.height = hScrollActive ? (metrics.totalScrollable + metrics.vh) + 'px' : '';
}

function evaluateHScrollMode() {
  const shouldActivate = Boolean(
    hScroll && hTrack && hPanels.length
    && !motionQuery.matches
    && window.innerWidth >= 700 && window.innerHeight >= 500
    && hScroll.offsetHeight > window.innerHeight * 2
  );
  if (shouldActivate === hScrollActive) return;
  hScrollActive = shouldActivate;
  document.documentElement.classList.toggle('h-scroll-active', hScrollActive);
  if (!hScrollActive) {
    if (hTrack) hTrack.style.transform = '';
    hPanelContents.forEach((c) => { c.style.transform = ''; });
    if (reelTrack) reelTrack.style.transform = '';
  }
  measure(); // geometry just changed (h-scroll's height depends on this class)
}

let rafId = 0;
function scheduleTick() {
  if (rafId) return;
  rafId = window.requestAnimationFrame(() => {
    rafId = 0;
    tick();
  });
}

function tick() {
  const scrollY = window.scrollY;

  if (hScrollActive) {
    const scrolled = Math.min(Math.max(scrollY - metrics.scrollStartY, 0), metrics.totalScrollable);
    const lastIndex = hPanelContents.length - 1;
    let hProgress = 0;

    hPanelContents.forEach((content, i) => {
      const reveal = Math.min(Math.max(scrolled - metrics.panelStart[i], 0), metrics.overflow[i]);
      if (i === filmographyIndex && reelTrack) {
        reelTrack.style.transform = reveal ? `translate3d(${(-reveal).toFixed(1)}px, 0, 0)` : '';
      } else {
        content.style.transform = reveal ? `translate3d(0, ${(-reveal).toFixed(1)}px, 0)` : '';
      }
      if (i < lastIndex) {
        hProgress += Math.min(Math.max((scrolled - metrics.transitionStart[i]) / metrics.vh, 0), 1);
      }
    });

    hTrack.style.transform = `translate3d(${(-hProgress * metrics.stageWidth).toFixed(1)}px, 0, 0)`;
  }

  if (scrubberFill && scrubberHead) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    scrubberFill.style.width = pct + '%';
    scrubberHead.style.left = pct + '%';
  }
}

measure();
evaluateHScrollMode();
tick();

window.addEventListener('scroll', scheduleTick, { passive: true });
window.addEventListener('resize', () => {
  measure();
  evaluateHScrollMode();
  scheduleTick();
});
window.addEventListener('load', () => {
  measure();
  scheduleTick();
});
motionQuery.addEventListener('change', evaluateHScrollMode);

// Intercept in-page links to sections so they land on the right
// panel (native anchor scrolling can't target a horizontal offset).
if (hScroll && hStage && hTrack && hPanels.length) {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (!hScrollActive) return;
      const id = link.getAttribute('href').slice(1);
      const panel = hPanels.find((p) => p.dataset.panel === id);
      if (!panel) return;
      e.preventDefault();
      const index = hPanels.indexOf(panel);
      window.scrollTo({
        top: metrics.scrollStartY + metrics.panelStart[index],
        behavior: 'smooth',
      });
    });
  });
}

// ============================================================
// SECTION HIGHLIGHTING (scrubber labels)
// ------------------------------------------------------------
// Independent of the scroll tick above — IntersectionObserver
// runs off the main thread's scroll handler entirely, so it costs
// nothing per frame regardless of how the horizontal track moves.
// ============================================================
const scrubberLabels = document.querySelectorAll('.scrubber-labels a');
const trackedSections = ['hero', 'about', 'filmography', 'contact']
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if (scrubberLabels.length && trackedSections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const match = Array.from(scrubberLabels).find(
          (a) => a.getAttribute('href') === '#' + entry.target.id
        );
        if (match) {
          scrubberLabels.forEach((a) => a.classList.remove('current'));
          match.classList.add('current');
        }
      });
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );
  trackedSections.forEach((section) => sectionObserver.observe(section));
}

