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

/* ===========================
   Featured Reel (continuous)
   =========================== */
(function () {
  const mask  = document.querySelector('.reel-mask');
  const track = document.getElementById('reelTrack');
  if (!mask || !track) return;

  // Duplicate once for seamless wrap
  track.innerHTML += track.innerHTML;

  // ---- SHARED STATE (this is what was missing) ----
  let autoSpeed = 0.35;   // px per frame
  let playing   = true;   // auto-scroll when not dragging
  let rafId     = null;

  let dragging  = false;  // pointer drag state
  let moved     = false;  // whether pointer moved far enough to be a drag
  let startX    = 0;
  let lastX     = 0;
  let vx        = 0;      // inertial velocity

  const halfWidth = () => track.scrollWidth / 2;

  // Animation loop
  const step = () => {
    if (playing && !dragging) {
      // auto scroll
      mask.scrollLeft += autoSpeed;
    } else if (!dragging && Math.abs(vx) > 0.05) {
      // inertia after flick
      mask.scrollLeft -= vx;
      vx *= 0.95; // friction
    }

    // Seamless wrap
    const hw = halfWidth();
    if (mask.scrollLeft >= hw) mask.scrollLeft -= hw;
    if (mask.scrollLeft < 0)   mask.scrollLeft += hw;

    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);

  // Pause on hover (optional)
  mask.addEventListener('mouseenter', () => { playing = false; });
  mask.addEventListener('mouseleave', () => { if (!dragging) { vx = 0; playing = true; } });

  // ---- Drag handlers ----
  const onPointerDown = (e) => {
    mask.setPointerCapture?.(e.pointerId);
    dragging = true;
    playing  = false;
    moved    = false;

    startX = e.clientX;
    lastX  = e.clientX;
    vx     = 0;

    document.body.style.userSelect = 'none';
    mask.classList.add('dragging');
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragging) return;

    const dx = e.clientX - lastX;
    if (Math.abs(e.clientX - startX) > 3) moved = true;

    mask.scrollLeft -= dx; // move with pointer
    lastX = e.clientX;
    vx = dx;               // velocity for inertia
  };

  const release = () => {
    if (!dragging) return;

    dragging = false;
    // resume auto after brief moment so inertia can play out
    setTimeout(() => { playing = true; }, 200);

    document.body.style.userSelect = '';
    mask.classList.remove('dragging');
  };

  mask.addEventListener('pointerdown', onPointerDown);
  mask.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', release);
  mask.addEventListener('pointerleave', release);

  // If the user dragged, prevent the click from following the link
  track.addEventListener('click', (e) => {
    if (moved) {
      e.preventDefault();
      moved = false;
    }
  });

  console.log('reel ready');
})();
