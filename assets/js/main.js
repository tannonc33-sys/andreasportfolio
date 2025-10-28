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

// --- Mobile burger menu toggle ---
(function () {
  const btn = document.querySelector('.burger');
  const panel = document.querySelector('.nav-links');
  if (!btn || !panel) return;

  const closeMenu = () => {
    btn.classList.remove('is-open');
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  const openMenu = () => {
    btn.classList.add('is-open');
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  };

  btn.addEventListener('click', () => {
    const isOpen = panel.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close on ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      closeMenu();
      btn.focus();
    }
  });

  // Close when clicking a link
  panel.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) closeMenu();
  });
})();

/* ======================
   CART DRAWER CONTROLLER
   ====================== */

// If your helpers are in this file they already exist; else import them:
import { getCart, clearCart } from './main.js'; // remove this line if the same file

(function cartDrawer(){
  const drawerE1 = document.getElementById('cartDrawer');
  if (!drawerE1) return; // not on this page

  const overlay  = drawer.querySelector('.cart-overlay');
  const panel    = drawer.querySelector('.cart-panel');
  const listEl   = document.getElementById('cartItems');
  const totalEl  = document.getElementById('cartSubtotal');
  const clearBtn = document.getElementById('cartClear');
  const checkout = document.getElementById('cartCheckout');
  const countEl  = document.getElementById('cartCount');

  // --- open/close ---
  const open  = () => { drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden','false'); };
  const close = () => { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden','true'); };

  // Toggle from any element with data-cart-toggle
  document.querySelectorAll('[data-cart-toggle]').forEach(el=>{
    el.addEventListener('click', (e)=>{ e.preventDefault(); render(); open(); });
  });

  drawer.addEventListener('click', (e)=>{
    if (e.target.hasAttribute('data-cart-close')) close();
  });
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

  // --- render ---
  function money(centsLike){
    // your prices are numbers like 180.00 or 300.00 – keep it simple:
    return new Intl.NumberFormat('en-US',{ style:'currency', currency:'USD' }).format(centsLike);
  }

  function render(){
    const cart = getCart() || [];
    let html = '';
    let subtotal = 0;

    cart.forEach((item, i)=>{
      subtotal += Number(item.price) || 0;
      html += `
        <div class="cart-item" data-i="${i}">
          <img src="${item.image || item.img || ''}" alt="${item.alt || item.name || ''}">
          <div>
            <h4>${item.name || 'Untitled'}</h4>
            <div class="meta">${item.group ? item.group : ''}</div>
            <div class="price">${money(item.price || 0)}</div>
          </div>
          <button class="remove" type="button" aria-label="Remove item" data-remove="${i}">Remove</button>
        </div>`;
    });

    listEl.innerHTML = html || `<p style="padding:10px;">Your cart is empty.</p>`;
    totalEl.textContent = money(subtotal);
    if (countEl) countEl.textContent = cart.length;
  }

  // Remove item
  listEl.addEventListener('click', (e)=>{
    const i = e.target.getAttribute('data-remove');
    if (i==null) return;
    const cart = getCart() || [];
    cart.splice(Number(i), 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    render();
  });

  // Clear cart
  clearBtn.addEventListener('click', ()=>{
    clearCart();
    render();
  });

  // Placeholder checkout (replace with Stripe/PayPal)
  checkout.addEventListener('click', ()=>{
    const cart = getCart() || [];
    // TODO: send cart to server or payment provider with priceId’s
    alert('Checkout coming soon. Items in cart: ' + cart.length);
  });

  // Listen for external cart changes (after addToCart)
  window.addEventListener('cart:changed', render);

  // Initial badge update on page load
  render();

  // inside addToCart(item)
  window.dispatchEvent(new CustomEvent('cart:changed'));
  // Optionally auto-open after add:
  const drawer = document.getElementById('cartDrawer');
  if (drawer) drawer.classList.add('is-open'), drawer.setAttribute('aria-hidden','false');
})();
