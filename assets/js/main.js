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

// --- Card tilt that follows the cursor across the grid ---
(() => {
  // Respect touch devices and reduced motion users
  if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;

  const grid = document.querySelector('.products');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.product'));
  if (!cards.length) return;

  const MAX_DEG = 8; // maximum tilt angle in degrees

  const clamp = (n, min, max) => (n < min ? min : n > max ? max : n);

  function setTilt(e) {
    const mx = e.clientX;
    const my = e.clientY;

    cards.forEach(card => {
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      // -1..1 relative offsets from the card center
      const dx = (mx - cx) / (r.width / 2);
      const dy = (my - cy) / (r.height / 2);

      // Map to angles (invert X/Y to feel natural)
      const ry = clamp(dx * MAX_DEG, -MAX_DEG, MAX_DEG);     // rotateY (left/right)
      const rx = clamp(-dy * MAX_DEG, -MAX_DEG, MAX_DEG);    // rotateX (up/down)

      card.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      card.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      card.classList.add('tilt');
    });
  }

  function resetTilt() {
    cards.forEach(card => {
      card.style.removeProperty('--rx');
      card.style.removeProperty('--ry');
      card.classList.remove('tilt');
    });
  }

  grid.addEventListener('pointermove', setTilt);
  grid.addEventListener('pointerleave', resetTilt);
})();
