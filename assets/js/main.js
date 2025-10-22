// assets/js/main.js

// Mobile menu
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-burger]');
  if (btn) document.querySelector('.nav-links')?.classList.toggle('open');
});

// Load header/footer on every page
async function loadPartials() {
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  try {
    // IMPORTANT: use RELATIVE paths (no leading slash) so it works on GitHub Pages
    if (header) header.innerHTML = await (await fetch('partials/header.html')).text();
    if (footer) footer.innerHTML = await (await fetch('partials/footer.html')).text();

    // highlight active link
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('a[data-link]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.toLowerCase().endsWith(path)) a.classList.add('active');
    });
  } catch (err) {
    console.warn('Run with a local server so fetch() can load partials.', err);
  }
}
loadPartials();

// Simple cart using localStorage
const CART_KEY = 'cart_items_v1';
export function addToCart(item) {
  const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  const existing = items.find(i => i.id === item.id);
  if (existing) { existing.qty += item.qty || 1; } else { items.push({...item, qty: item.qty || 1}); }
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  alert('Added to cart');
}
export function getCart() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
export function removeFromCart(id) {
  const items = getCart().filter(i => i.id !== id);
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}
export function clearCart() { localStorage.removeItem(CART_KEY); }
