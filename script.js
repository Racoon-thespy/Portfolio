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
});