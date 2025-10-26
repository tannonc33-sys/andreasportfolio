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

/* =========================
   Featured Reel — continuous loop with drag + inertia
   ========================= */

(function () {
  const mask  = document.querySelector('.reel-mask');
  const track = document.getElementById('reelTrack');
  if (!mask || !track) return;

  // Duplicate the row so we can wrap seamlessly
  track.innerHTML = track.innerHTML + track.innerHTML;

  // --- settings / state ---
  const autoSpeed = 0.35;  // px per frame (steady pace)
  let playing = true;      // paused on hover/drag
  let rafId = null;

  // drag / inertia
  let dragging = false;
  let startX = 0;
  let startLeft = 0;
  let vx = 0;              // flick velocity
  let lastX = 0;
  let lastT = 0;

  const halfWidth = () => track.scrollWidth / 2;

  // --- animation loop ---
  const step = (t) => {
    // first timestamp
    if (!lastT) lastT = t;

    if (playing && !dragging) {
      mask.scrollLeft += autoSpeed;
    } else if (!playing && Math.abs(vx) > 0.05) {
      // inertia
      mask.scrollLeft -= vx;           // invert because scrollLeft grows to the right
      vx *= 0.95;                      // friction
    }

    // seamless wrap
    const hw = halfWidth();
    if (mask.scrollLeft >= hw) mask.scrollLeft -= hw;
    if (mask.scrollLeft < 0)    mask.scrollLeft += hw;

    rafId = requestAnimationFrame(step);
  };

  const play  = () => (playing = true);
  const pause = () => (playing = false);

  // --- hover pause ---
  mask.addEventListener('mouseenter', pause);
  mask.addEventListener('mouseleave', play);

  // --- drag / flick (pointer events) ---
  mask.addEventListener('pointerdown', (e) => {
    dragging = true;
    pause();
    mask.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startLeft = mask.scrollLeft;
    lastX = e.clientX;
    lastT = performance.now();
    vx = 0;
  });

  mask.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    mask.scrollLeft = startLeft - dx;

    // wrap while dragging so it never snaps
    const hw = halfWidth();
    if (mask.scrollLeft >= hw) mask.scrollLeft -= hw;
    if (mask.scrollLeft < 0)    mask.scrollLeft += hw;

    // velocity sampling
    const now = performance.now();
    const dt = now - lastT || 16;
    vx = (e.clientX - lastX) / dt * 16; // px per ~frame
    lastX = e.clientX;
    lastT = now;
  });

  mask.addEventListener('pointerup', () => {
    dragging = false;
    // remain paused briefly to let inertia run; loop continues in step()
    // If you want autoplay to resume immediately after the flick dies out,
    // you can start a timer to call play() after a second or so.
  });

  // (Optional) start from zero
  mask.scrollLeft = 0;

  // ✅ Start the loop
  rafId = requestAnimationFrame(step);

  // Debug: confirm we loaded
  console.log('carousel js loaded');
})();
