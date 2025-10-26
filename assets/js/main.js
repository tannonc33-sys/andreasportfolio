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

/* ==============================
   Featured Reel – Continuous Loop
   with smooth autoplay, flick, and non-sticky drag
   ============================== */
(function(){
  const mask = document.querySelector('.reel-mask');
  const track = document.getElementById('reelTrack');
  if (!mask || !track) return;

  // Duplicate content for seamless looping
  track.innerHTML = track.innerHTML + track.innerHTML;

  /* === CONFIG === */
  const autoSpeed = 0.4;     // px per frame (smooth medium speed)
  const friction = 0.95;     // flick slowdown
  let isPlaying = true;
  let isDragging = false;
  let startX = 0;
  let scrollStart = 0;
  let velocity = 0;
  let rafId;

  // Make sure the content loops properly
  const halfWidth = () => track.scrollWidth / 2;

  function step() {
    if (isPlaying && !isDragging) {
      mask.scrollLeft += autoSpeed;
    } else if (!isDragging && Math.abs(velocity) > 0.05) {
      mask.scrollLeft -= velocity;
      velocity *= friction;
    }

    // wrap seamlessly
    const hw = halfWidth();
    if (mask.scrollLeft >= hw) mask.scrollLeft -= hw;
    if (mask.scrollLeft < 0) mask.scrollLeft += hw;

    rafId = requestAnimationFrame(step);
  }

  // === Hover pause ===
  mask.addEventListener('mouseenter', () => isPlaying = false);
  mask.addEventListener('mouseleave', () => isPlaying = true);

  // === Drag + Flick ===
  mask.addEventListener('mousedown', (e) => {
    isDragging = true;
    isPlaying = false;
    startX = e.pageX;
    scrollStart = mask.scrollLeft;
    velocity = 0;
    mask.style.cursor = 'grabbing';
    e.preventDefault();
  });

  mask.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.pageX - startX;
    mask.scrollLeft = scrollStart - dx;
    velocity = dx; // used for flick inertia
  });

  // When mouse released
  mask.addEventListener('mouseup', () => {
    isDragging = false;
    isPlaying = true;
    mask.style.cursor = '';
  });

  // In case mouse leaves window mid-drag
  mask.addEventListener('mouseleave', () => {
    if (isDragging) {
      isDragging = false;
      isPlaying = true;
      mask.style.cursor = '';
    }
  });

  // === Touch support ===
  mask.addEventListener('touchstart', (e) => {
    isDragging = true;
    isPlaying = false;
    startX = e.touches[0].pageX;
    scrollStart = mask.scrollLeft;
    velocity = 0;
  }, { passive: true });

  mask.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].pageX - startX;
    mask.scrollLeft = scrollStart - dx;
    velocity = dx;
  }, { passive: true });

  mask.addEventListener('touchend', () => {
    isDragging = false;
    isPlaying = true;
  });

  // === Click pass-through fix ===
  // Allow click if drag distance is small
  let dragMoved = false;
  mask.addEventListener('mousedown', () => dragMoved = false);
  mask.addEventListener('mousemove', () => dragMoved = true);
  mask.addEventListener('click', (e) => {
    if (dragMoved) e.preventDefault();
  });

  console.log('carousel_js loaded');
  step();
})();
