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

/* ============================
   Featured Reel — continuous loop with drag + inertia
   ============================ */
(function () {
  const mask  = document.querySelector('.reel-mask');
  const track = document.getElementById('reelTrack');
  if (!mask || !track) return;

  // Duplicate row once for seamless wrap
  track.innerHTML = track.innerHTML + track.innerHTML;

  // --- Auto play / state ---
  let autoSpeed = 0.35;   // keep the gentle pace
  let playing  = true;
  let rafId    = null;

  // fractional accumulator so integer scrollLeft still moves
  let acc = 0;

  const step = () => {
    if (playing && !dragging) {
      acc += autoSpeed;
      // apply only whole pixels, keep the remainder
      const dx = (acc > 0 ? Math.floor(acc) : Math.ceil(acc));
      if (dx !== 0) {
        mask.scrollLeft += dx;
        acc -= dx;
      }
    } else if (!dragging && Math.abs(vx) > 0.05) {
      // inertia after flick (vx is already integer-ish)
      mask.scrollLeft -= vx;
      vx *= 0.95;           // friction
    }

    // wrap seamlessly
    const hw = halfWidth();
    if (mask.scrollLeft >= hw) mask.scrollLeft -= hw;
    if (mask.scrollLeft < 0)   mask.scrollLeft += hw;

    rafId = requestAnimationFrame(step);
  };


  // Hover pause/resume
  const pause  = () => { playing = false; };
  const resume = () => { playing = true;  };

  mask.addEventListener('mouseenter', pause,  { passive: true });
  mask.addEventListener('mouseleave', resume, { passive: true });

  // --- Drag handlers (pointer events) ---
  const onPointerDown = (e) => {
    // capture the pointer so we continue to receive events even if the
    // pointer leaves the mask while dragging
    mask.setPointerCapture?.(e.pointerId);

    dragging = true;
    playing  = false;
    moved    = false;

    startX = e.clientX;
    lastX  = e.clientX;
    vx     = 0;

    // nicer feel while dragging
    document.body.style.userSelect = 'none';
    mask.classList.add('dragging');   // optional (see CSS below)

    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragging) return;

    const dx = e.clientX - lastX;
    // treat as a real drag once we’ve moved a few px
    if (Math.abs(e.clientX - startX) > 3) moved = true;

    mask.scrollLeft -= dx;   // move with the pointer
    lastX = e.clientX;

    vx = dx;                 // velocity for inertia
  };

  const release = () => {
    if (!dragging) return;

    dragging = false;
    // let the step loop finish inertia for a short moment,
    // then resume the auto-scrolling
    setTimeout(() => { playing = true; }, 200);

    document.body.style.userSelect = '';
    mask.classList.remove('dragging');
  };

  // Important: attach “up/cancel” to window so you don’t have to leave the box
  mask.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  window.addEventListener('blur', release);

  // Prevent “click-through” when the user dragged
  track.addEventListener('click', (e) => {
    if (moved) e.preventDefault();
  });

  // Kick it off
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(step);

  console.log('reel ready');
})();
