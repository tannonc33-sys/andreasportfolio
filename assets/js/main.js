// assets/js/main.js
async function load(id, url){
  const host = document.getElementById(id);
  if(!host) return;
  const res = await fetch(url);
  host.innerHTML = await res.text();

  // mark active nav
  const path = location.pathname.split('/').pop() || 'index.html';
  host.querySelectorAll('.nav-links a').forEach(a=>{
    const href = a.getAttribute('href');
    if(href === path) a.classList.add('active');
  });
}

load('site-header', 'partials/header.html');
load('site-footer', 'partials/footer.html');

// --- simple cart helpers (if you used them before) ---
export function addToCart(item){
  const cart = JSON.parse(localStorage.getItem('cart')||'[]');
  cart.push(item);
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Added to cart');
}
export function getCart(){ return JSON.parse(localStorage.getItem('cart')||'[]'); }
export function clearCart(){ localStorage.removeItem('cart'); }

// --- Whole-card tilt that follows the cursor anywhere on the page ---
(() => {
  // Respect touch devices and reduced motion users
  if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;

  const grid = document.querySelector('.products');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.product'));
  if (!cards.length) return;

  const MAX_DEG = 8;          // max tilt angle
  const SOFT_RADIUS = 0.8;    // larger = slower falloff with distance (0.6–1.2 feels good)
  const UPDATE_MS = 120;      // how often to refresh rects on scroll/resize (ms)

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ticking = false;

  // cache card rects for faster math
  let cardRects = [];
  function cacheRects() {
    cardRects = cards.map(c => {
      const r = c.getBoundingClientRect();
      return { el: c, rect: r };
    });
  }
  cacheRects();

  // refresh rects on resize/scroll (throttled)
  let lastRectUpdate = 0;
  function maybeUpdateRects() {
    const now = performance.now();
    if (now - lastRectUpdate > UPDATE_MS) {
      cacheRects();
      lastRectUpdate = now;
    }
  }
  window.addEventListener('resize', cacheRects, { passive: true });
  window.addEventListener('scroll',  () => { maybeUpdateRects(); }, { passive: true });

  // map to [-1..1] with falloff so even far-away cursor still gives subtle tilt
  const clamp = (n, min, max) => (n < min ? min : n > max ? max : n);

  function update() {
    ticking = false;

    cardRects.forEach(({ el, rect }) => {
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;

      // denom controls falloff; larger soft radius means the effect reaches farther
      const denomX = (rect.width  / 2) * SOFT_RADIUS;
      const denomY = (rect.height / 2) * SOFT_RADIUS;

      const dx = clamp((mouseX - cx) / denomX, -1, 1);
      const dy = clamp((mouseY - cy) / denomY, -1, 1);

      // distance-based falloff (optional but feels nice)
      const dist = Math.hypot(dx, dy);        // 0..~1.4
      const falloff = clamp(1 - dist * 0.35, 0, 1); // tweak 0.35 for softer/harder rolloff

      const ry = clamp(dx * MAX_DEG * falloff, -MAX_DEG, MAX_DEG);   // left/right
      const rx = clamp(-dy * MAX_DEG * falloff, -MAX_DEG, MAX_DEG);  // up/down

      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      el.classList.add('tilt');
    });
  }

  function onPointerMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    maybeUpdateRects();
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  // Reset gently if the pointer leaves the window
  function resetTilt() {
    cards.forEach(c => {
      c.style.removeProperty('--rx');
      c.style.removeProperty('--ry');
      c.classList.remove('tilt');
    });
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', resetTilt);
  window.addEventListener('blur', resetTilt);
})();
