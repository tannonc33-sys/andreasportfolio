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

/* ===== Featured Reel (transform version): autoplay + pause on hover + drag with inertia ===== */
(function () {
  const mask  = document.querySelector('.reel-mask');
  const track = document.getElementById('reelTrack');
  if (!mask || !track) return;

  // Make the loop seamless by duplicating once
  track.innerHTML += track.innerHTML;

  // ---- State ----
  let x = 0;           // current translateX
  let vx = 0;          // velocity for inertia
  let playing  = true; // auto-scroll when not dragging
  let dragging = false;
  let moved    = false; // did we actually drag (to decide click cancel)
  let startX   = 0;
  let lastX    = 0;
  let rafId    = null;

  // ---- Tunables ----
  const AUTO_SPEED = 0.15;  // px per frame
  const FRICTION   = 0.96;  // inertia decay; higher = longer glide
  const DRAG_EPS   = 3;     // pixels to count as a real drag

  // Helpers
  const halfWidth = () => track.scrollWidth / 2;

  function render() {
    track.style.transform = `translateX(${x}px)`;
  }

  function wrap() {
    const hw = halfWidth();
    if (x <= -hw) x += hw;
    if (x >= 0)   x -= hw;
  }

  function step() {
    if (playing && !dragging) {
      x -= AUTO_SPEED;             // autoplay
    } else if (!dragging && Math.abs(vx) > 0.02) {
      x += vx;                     // inertia after drag/flick
      vx *= FRICTION;
    }
    wrap();
    render();
    rafId = requestAnimationFrame(step);
  }
  rafId = requestAnimationFrame(step);

  // ---- Pause / resume on hover ----
  mask.addEventListener('mouseenter', () => { playing = false; });
  mask.addEventListener('mouseleave', () => { if (!dragging) playing = true; });

  // ---- Drag handlers ----
  function onPointerDown(e) {
    mask.setPointerCapture?.(e.pointerId);
    dragging = true;
    moved    = false;
    playing  = false;
    vx       = 0;
    startX = lastX = e.clientX;

    document.body.style.userSelect = 'none'; // avoid text selection while dragging
    mask.classList.add('dragging');
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    x += dx;                   // follow the pointer
    lastX = e.clientX;
    if (!moved && Math.abs(e.clientX - startX) > DRAG_EPS) moved = true;
    vx = dx;                   // capture velocity for inertia
  }

  function release() {
    if (!dragging) return;
    dragging = false;
    document.body.style.userSelect = '';
    mask.classList.remove('dragging');
    // let inertia play a moment, then resume autoplay
    setTimeout(() => { if (!dragging) playing = true; }, 150);
  }

  mask.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove',  onPointerMove);
  window.addEventListener('pointerup',    release);
  window.addEventListener('pointercancel',release);
  window.addEventListener('blur',         release);

  // ---- Allow clicks only when not dragged ----
  track.addEventListener('click', (e) => {
    if (moved) {
      e.preventDefault(); // we dragged—don’t follow the link
      moved = false;      // reset for the next click
    }
  });

  console.log('reel ready (autoplay + pause + drag + click-through)');
})();
