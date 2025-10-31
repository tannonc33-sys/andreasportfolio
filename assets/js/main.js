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

// GLOBAL TILT + AMBIENT LIGHT FOR PORTFOLIO CARDS
(() => {
  const grid = document.querySelector('.products');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.product'));
  if (!cards.length) return;

  const maxTilt = 6; // degrees; gentle is 4–8

  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let raf = null;

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function animate(){
    // Add a marker class so CSS can slightly increase light opacity if you want
    grid.classList.add('tilt-active');

    for (const card of cards){
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top  + r.height / 2;

      // Normalized vector from card center to mouse [-1, 1]
      const ndx = clamp((mouse.x - cx) / (r.width  / 2), -1, 1);
      const ndy = clamp((mouse.y - cy) / (r.height / 2), -1, 1);

      // Rotate *toward* the cursor (invert X for “swivel” feel)
      const rx = (-ndy) * maxTilt;  // tilt up/down
      const ry = ( ndx) * maxTilt;  // tilt left/right

      // Set transform
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;

      // Depth-shadow lean variables
      card.style.setProperty('--dx', ndx.toFixed(3));
      card.style.setProperty('--dy', ndy.toFixed(3));

      // Ambient light hotspot inside the card (in %)
      const px = clamp(((mouse.x - r.left) / r.width)  * 100, 0, 100);
      const py = clamp(((mouse.y - r.top ) / r.height) * 100, 0, 100);
      card.style.setProperty('--mx', `${px}%`);
      card.style.setProperty('--my', `${py}%`);
    }
    raf = null;
  }

  function queue(){ if (!raf) raf = requestAnimationFrame(animate); }

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    queue();
  });

  window.addEventListener('mouseleave', () => {
    // ease back to center when cursor leaves the window
    mouse.x = window.innerWidth / 2;
    mouse.y = window.innerHeight / 2;
    queue();
  });

  // Initial position
  queue();
})();

/* ============ Reel (CSS-driven) bootstrap ============ */
(function () {
  const mask  = document.querySelector('.reel-mask');
  const track = document.getElementById('reelTrack');
  if (!mask || !track) return;

  // 1) Duplicate the row once for a seamless wrap
  track.innerHTML = track.innerHTML + track.innerHTML;

  // 2) After images settle, compute loop distance (half the track width)
  const setLoop = () => {
    const half = track.scrollWidth / 2;              // pixels
    track.style.setProperty('--loop', `${half}px`);
  };
  // If images are cached, timeout is enough; otherwise wait for them
  window.addEventListener('load', setLoop);
  setTimeout(setLoop, 200);

  // 3) Simple drag (no inertia): pause while dragging, shift by delta
  let dragging = false;
  let startX = 0;
  let shiftStart = 0;

  const getShift = () =>
    parseFloat(getComputedStyle(track).getPropertyValue('--shift')) || 0;

  const wrapShift = (s) => {
    const half = parseFloat(getComputedStyle(track).getPropertyValue('--loop')) || 0;
    if (!half) return s;
    // keep shift in [-half, 0] range to avoid large numbers
    while (s <= -half) s += half;
    while (s > 0) s -= half;
    return s;
  };

  const down = (e) => {
    dragging = true;
    mask.classList.add('dragging');
    startX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    shiftStart = getShift();
    e.preventDefault();
  };

  const move = (e) => {
    if (!dragging) return;
    const x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const dx = x - startX;
    const next = wrapShift(shiftStart + dx);
    track.style.setProperty('--shift', `${next}px`);
  };

  const up = () => {
    if (!dragging) return;
    dragging = false;
    mask.classList.remove('dragging');   // CSS animation resumes automatically
  };

  mask.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  })();

  /* === Keep the cards below the fold: dynamic spacer for .reel === */
(function () {
  const reel = document.querySelector('.reel');
  if (!reel) return;

  const GAP = 24;                 // how many pixels you want between reel bottom and viewport bottom
  const MIN = 96;                 // never less than this margin
  const MAX = 640;                // never more than this margin

  function setReelSpacer() {
    // Where is the bottom of the reel right now?
    const rect = reel.getBoundingClientRect();
    // How much room remains from reel bottom to viewport bottom?
    const needed = window.innerHeight - rect.bottom - GAP;
    // Clamp to a sane range so it doesn't go weird on huge/small screens
    const mb = Math.max(MIN, Math.min(MAX, needed));
  }

  const onResize = () => {
    setReelSpacer();
  };

  window.addEventListener('load', setReelSpacer);
  window.addEventListener('resize', onResize);
  // If fonts/images shift layout after load, a small delayed check helps:
  setTimeout(setReelSpacer, 150);
})();

// --- Burger toggle (simple & safe) ---
document.addEventListener('DOMContentLoaded', () => {
  const btn   = document.querySelector('button.burger');
  const panel = document.getElementById('mobile-nav');

  if (!btn || !panel) return;

  const setState = (open) => {
    panel.classList.toggle('open', open);
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !panel.classList.contains('open');
    setState(open);
  });

  // Close on link click inside panel (mobile)
  panel.addEventListener('click', (e) => {
    if (e.target.closest('a')) setState(false);
  });

  // Click outside closes
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('open') &&
        !panel.contains(e.target) &&
        e.target !== btn) {
      setState(false);
    }
  });

  // Escape closes
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setState(false);
  });
});
