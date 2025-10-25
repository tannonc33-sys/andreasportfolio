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

// Gentle 3D tilt that follows the cursor
(function () {
  const MAX_TILT = 8; // degrees (keep subtle)
  const cards = document.querySelectorAll('.product');

  // Respect reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !cards.length) return;

  cards.forEach((card) => {
    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;   // 0..1
      const py = (e.clientY - r.top) / r.height;   // 0..1

      // Map cursor position to rotation
      const ry = (0.5 - px) * (MAX_TILT * 2); // rotateY: left/right
      const rx = (py - 0.5) * (MAX_TILT * 2); // rotateX: up/down

      card.style.setProperty('--ry', `${ry}deg`);
      card.style.setProperty('--rx', `${rx}deg`);
      card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    };

    const onLeave = () => {
      card.style.transition = 'transform 220ms ease, box-shadow 220ms ease';
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '50%');
      // after the reset, restore normal transition
      setTimeout(() => { card.style.transition = 'transform 180ms ease, box-shadow 180ms ease'; }, 220);
    };

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
  });
})();
