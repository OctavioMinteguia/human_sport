/* ================================================
   HUMAN SPORT — App JS
   Catálogo · Carrito · WhatsApp Checkout
   ================================================ */

// ================================================
// PRODUCTOS
// Agregá imágenes reales en img/products/ y usá el
// campo "image" en cada producto (ej: "img/products/calza-1.jpg")
// Si "image" es null se muestra el emoji placeholder.
// ================================================
const PRODUCTS = [
  {
    id: 1,
    name: "Musculosa + Short",
    brand: "Lady Fit",
    category: "conjuntos",
    price: 38000,
    originalPrice: null,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["#e8dcc8", "#d4798a"],
    colorLabel: "Beige / Rosa",
    badge: "NUEVO",
    emoji: "✨",
    bg: "linear-gradient(145deg, #2a1a1a, #3a2a2a)",
    image: "img/IMG_2858.JPG.jpeg",
    featured: true
  },
  {
    id: 2,
    name: "Buzo Crop Hoodie",
    brand: "Lady Fit",
    category: "buzos",
    price: 45000,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL"],
    colors: ["#c8b08a"],
    colorLabel: "Beige",
    badge: "NUEVO",
    emoji: "🧥",
    bg: "linear-gradient(145deg, #2a2010, #3a3020)",
    image: "img/IMG_2860.JPG.jpeg",
    featured: true
  },
  {
    id: 3,
    name: "Conjunto Training Violeta",
    brand: "Lady Fit",
    category: "conjuntos",
    price: 52000,
    originalPrice: 65000,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["#6a3a8a"],
    colorLabel: "Violeta",
    badge: "OFERTA",
    emoji: "✨",
    bg: "linear-gradient(145deg, #2d1a3a, #3a2050)",
    image: "img/IMG_2861.JPG.jpeg",
    featured: true
  },
  {
    id: 4,
    name: "Conjunto Running Gris/Rosa",
    brand: "Lady Fit",
    category: "conjuntos",
    price: 50000,
    originalPrice: null,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["#555", "#e8609a"],
    colorLabel: "Gris / Rosa",
    badge: "NUEVO",
    emoji: "✨",
    bg: "linear-gradient(145deg, #1a1a1a, #2a2a2a)",
    image: "img/IMG_2862.JPG.jpeg",
    featured: true
  },
  {
    id: 5,
    name: "Short Running Pro",
    brand: "Lady Fit",
    category: "shorts",
    price: 18000,
    originalPrice: null,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["#1a1a1a", "#0d2a4a", "#4a2a0d"],
    colorLabel: "Negro / Azul / Naranja",
    badge: "NUEVO",
    emoji: "🩳",
    bg: "linear-gradient(145deg, #1a2d3a, #0d1b2e)",
    image: null,
    featured: true
  },
  {
    id: 6,
    name: "Musculosa Mesh Performance",
    brand: "Lady Fit",
    category: "tops",
    price: 16000,
    originalPrice: null,
    sizes: ["XS", "S", "M", "L"],
    colors: ["#eee", "#e8b4c1", "#1a1a1a"],
    colorLabel: "Blanco / Rosa / Negro",
    badge: null,
    emoji: "👚",
    bg: "linear-gradient(145deg, #2a1a2a, #4a2a4a)",
    image: null,
    featured: false
  },
  {
    id: 7,
    name: "Calza Cintura Alta Ribete",
    brand: "Lady Fit",
    category: "calzas",
    price: 30000,
    originalPrice: 38000,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["#1a1a1a", "#5c2800", "#1a3a3a"],
    colorLabel: "Negro / Marrón / Verde petróleo",
    badge: "OFERTA",
    emoji: "🩲",
    bg: "linear-gradient(145deg, #2d1a3a, #1a1a3a)",
    image: null,
    featured: false
  },
  {
    id: 8,
    name: "Campera Deportiva Zip",
    brand: "Lady Fit",
    category: "buzos",
    price: 55000,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL"],
    colors: ["#1a1a1a", "#0d1a3a"],
    colorLabel: "Negro / Navy",
    badge: "NUEVO",
    emoji: "🧥",
    bg: "linear-gradient(145deg, #1a1a2d, #1a2d4a)",
    image: null,
    featured: false
  },
  {
    id: 9,
    name: "Conjunto Yoga Minimal",
    brand: "Lady Fit",
    category: "conjuntos",
    price: 42000,
    originalPrice: null,
    sizes: ["XS", "S", "M", "L"],
    colors: ["#555", "#1a3a3a", "#1a1a1a"],
    colorLabel: "Gris / Verde petróleo / Negro",
    badge: null,
    emoji: "🧘",
    bg: "linear-gradient(145deg, #2a2a3a, #3a3a4a)",
    image: null,
    featured: false
  },
  {
    id: 10,
    name: "Top Biker Fit",
    brand: "Lady Fit",
    category: "tops",
    price: 18000,
    originalPrice: null,
    sizes: ["XS", "S", "M", "L"],
    colors: ["#1a1a1a", "#6a0000"],
    colorLabel: "Negro / Rojo",
    badge: "NUEVO",
    emoji: "👙",
    bg: "linear-gradient(145deg, #2d1a1a, #4a2a2a)",
    image: null,
    featured: false
  },
  {
    id: 11,
    name: "Short Ciclista Liso",
    brand: "Lady Fit",
    category: "shorts",
    price: 22000,
    originalPrice: 28000,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["#1a1a1a", "#001a5c", "#004a00"],
    colorLabel: "Negro / Azul / Verde",
    badge: "OFERTA",
    emoji: "🩳",
    bg: "linear-gradient(145deg, #1a2a1a, #2a4a2a)",
    image: null,
    featured: false
  },
  {
    id: 12,
    name: "Remera Oversize Sport",
    brand: "Lady Fit",
    category: "tops",
    price: 15000,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL"],
    colors: ["#eee", "#1a1a1a", "#888"],
    colorLabel: "Blanco / Negro / Gris",
    badge: null,
    emoji: "👕",
    bg: "linear-gradient(145deg, #1a1a1a, #2a2a2a)",
    image: null,
    featured: false
  }
];

// ================================================
// UTILS
// ================================================
function fmt(n) {
  return '$' + n.toLocaleString('es-AR');
}

function discount(price, original) {
  return Math.round((1 - price / original) * 100);
}

// ================================================
// CART STATE
// ================================================
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem('hs_cart')) || [];
} catch (e) {
  cart = [];
}

let pendingProduct = null;
let pendingSize    = null;

function saveCart() {
  localStorage.setItem('hs_cart', JSON.stringify(cart));
}

function cartCount() {
  return cart.reduce((s, i) => s + i.qty, 0);
}

function cartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function syncCartBadge() {
  const cnt = cartCount();
  const el  = document.getElementById('cartCount');
  if (!el) return;
  el.textContent    = cnt;
  el.style.display  = cnt > 0 ? 'flex' : 'none';
}

function addToCart(product, size) {
  const existing = cart.find(i => i.id === product.id && i.size === size);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, size, qty: 1 });
  }
  saveCart();
  syncCartBadge();
  renderCart();
  openCart();
}

function removeFromCart(id, size) {
  cart = cart.filter(i => !(i.id === id && i.size === size));
  saveCart();
  syncCartBadge();
  renderCart();
}

function changeQty(id, size, delta) {
  const item = cart.find(i => i.id === id && i.size === size);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id, size);
  } else {
    saveCart();
    syncCartBadge();
    renderCart();
  }
}

function clearCart() {
  cart = [];
  saveCart();
  syncCartBadge();
  renderCart();
}

// ================================================
// RENDER CART
// ================================================
function renderCart() {
  const itemsEl = document.getElementById('cartItems');
  const footEl  = document.getElementById('cartFoot');
  if (!itemsEl || !footEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-bag"></i>
        <p>Tu carrito está vacío</p>
        <span>¡Explorá nuestro catálogo!</span>
      </div>`;
    footEl.innerHTML = '';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="ci-thumb" style="background:${item.bg}">${item.emoji}</div>
      <div class="ci-info">
        <div class="ci-brand">${item.brand}</div>
        <div class="ci-name">${item.name}</div>
        <div class="ci-size">Talle: <strong>${item.size}</strong></div>
        <div class="ci-row">
          <span class="ci-price">${fmt(item.price * item.qty)}</span>
          <div class="ci-qty">
            <button class="qty-btn" onclick="changeQty(${item.id},'${item.size}',-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id},'${item.size}',1)">+</button>
            <button class="ci-del" onclick="removeFromCart(${item.id},'${item.size}')" title="Eliminar">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>`).join('');

  footEl.innerHTML = `
    <div class="cart-total-row">
      <span class="cart-total-lbl">Total</span>
      <span class="cart-total-amt">${fmt(cartTotal())}</span>
    </div>
    <button class="btn-checkout" onclick="checkoutWhatsApp()">
      <i class="fab fa-whatsapp"></i> Comprar por WhatsApp
    </button>
    <button class="btn-clear" onclick="clearCart()">Vaciar carrito</button>`;
}

// ================================================
// WHATSAPP CHECKOUT
// ================================================
function checkoutWhatsApp() {
  if (cart.length === 0) return;

  let msg = '¡Hola! Me gustaría realizar el siguiente pedido en *Human Sport*:\n\n';
  msg += '🛍️ *MIS PRODUCTOS:*\n';

  cart.forEach((item, i) => {
    msg += `${i + 1}. ${item.name} - Talle ${item.size} - ${fmt(item.price)}`;
    if (item.qty > 1) msg += ` (x${item.qty})`;
    msg += '\n';
  });

  msg += `\n💰 *TOTAL: ${fmt(cartTotal())}*\n\n`;
  msg += '¿Me podés confirmar disponibilidad? ¡Muchas gracias! 😊';

  window.open(
    'https://wa.me/5492345404999?text=' + encodeURIComponent(msg),
    '_blank'
  );
}

// ================================================
// CART UI
// ================================================
function openCart() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ================================================
// SIZE MODAL
// ================================================
function openSizeModal(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  pendingProduct = product;
  pendingSize    = null;

  document.getElementById('modalProdInfo').innerHTML = `
    <div class="modal-thumb" style="background:${product.bg}">${product.emoji}</div>
    <div class="modal-details">
      <div class="m-brand">${product.brand}</div>
      <div class="m-name">${product.name}</div>
      <div class="m-price">${fmt(product.price)}</div>
    </div>`;

  document.getElementById('sizeGrid').innerHTML = product.sizes.map(s => `
    <button class="size-btn" data-size="${s}" onclick="selectSize('${s}')">${s}</button>`
  ).join('');

  document.getElementById('sizeModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function selectSize(size) {
  pendingSize = size;
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.size === size);
  });
}

function closeSizeModal() {
  document.getElementById('sizeModal').classList.remove('open');
  document.body.style.overflow = '';
  pendingProduct = null;
  pendingSize    = null;
}

function confirmAddToCart() {
  if (!pendingSize) {
    const grid = document.getElementById('sizeGrid');
    grid.classList.add('shake');
    setTimeout(() => grid.classList.remove('shake'), 320);
    return;
  }
  addToCart(pendingProduct, pendingSize);
  closeSizeModal();
}

// ================================================
// RENDER PRODUCTS
// ================================================
function renderProducts(filter) {
  const list = filter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === filter);

  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:#555">
      No hay productos en esta categoría aún.</div>`;
    return;
  }

  grid.innerHTML = list.map(p => {
    const hasDiscount = !!p.originalPrice;
    const imageTag = p.image
      ? `<img src="${p.image}" alt="${p.name}" class="prod-real-img" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        + `<div class="prod-placeholder" style="background:${p.bg};display:none">
             <span class="prod-emoji">${p.emoji}</span>
             <span class="prod-color-label">${p.colorLabel.split(' / ')[0]}</span>
           </div>`
      : `<div class="prod-placeholder" style="background:${p.bg}">
           <span class="prod-emoji">${p.emoji}</span>
           <span class="prod-color-label">${p.colorLabel.split(' / ')[0]}</span>
         </div>`;

    return `
    <article class="product-card fade-in">
      <div class="prod-img-wrap">
        ${imageTag}
        ${p.badge ? `<span class="prod-badge badge-${p.badge === 'NUEVO' ? 'nuevo' : 'oferta'}">${p.badge}</span>` : ''}
        <button class="prod-wishlist" onclick="toggleWish(this)" aria-label="Favorito">
          <i class="far fa-heart"></i>
        </button>
      </div>
      <div class="prod-info">
        <div class="prod-brand">${p.brand}</div>
        <div class="prod-name">${p.name}</div>
        <div class="prod-colors">
          ${p.colors.map(c => `<span class="color-dot" style="background:${c}" title="${p.colorLabel}"></span>`).join('')}
        </div>
        <div class="prod-price">
          <span class="price-now">${fmt(p.price)}</span>
          ${hasDiscount ? `<span class="price-was">${fmt(p.originalPrice)}</span>` : ''}
          ${hasDiscount ? `<span class="price-disc">-${discount(p.price, p.originalPrice)}%</span>` : ''}
        </div>
        <button class="btn-cart" onclick="openSizeModal(${p.id})">
          <i class="fas fa-plus"></i> Agregar al carrito
        </button>
      </div>
    </article>`;
  }).join('');

  observeElements();
}

// ================================================
// TOGGLE WISHLIST
// ================================================
function toggleWish(btn) {
  btn.classList.toggle('wished');
  btn.querySelector('i').className =
    btn.classList.contains('wished') ? 'fas fa-heart' : 'far fa-heart';
}

// ================================================
// FILTERS
// ================================================
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.dataset.filter);
    });
  });
}

// ================================================
// CATEGORY CARDS → SCROLL + FILTER
// ================================================
function initCategoryCards() {
  document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const filter = card.dataset.filter;
      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
        if (btn) { btn.classList.add('active'); renderProducts(filter); }
      }, 550);
    });
  });
}

// ================================================
// MOBILE MENU
// ================================================
function initMobileMenu() {
  const menuBtn   = document.getElementById('menuBtn');
  const nav       = document.getElementById('nav');
  const navClose  = document.getElementById('navClose');
  const overlay   = document.getElementById('navOverlay');

  const open  = () => { nav.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { nav.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; };

  menuBtn?.addEventListener('click', open);
  navClose?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  nav?.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', close));
}

// ================================================
// STICKY HEADER
// ================================================
function initStickyHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 36);
  }, { passive: true });
}

// ================================================
// SCROLL ANIMATIONS (IntersectionObserver)
// ================================================
function observeElements() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-in:not(.visible), .animate-up:not(.visible)').forEach(el => io.observe(el));
}

// ================================================
// NEWSLETTER
// ================================================
function initNewsletter() {
  document.getElementById('newsletterForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    const email = input.value;
    alert(`¡Gracias! Te avisaremos las novedades a ${email} 🎉`);
    input.value = '';
  });
}

// ================================================
// SMOOTH SCROLL
// ================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

// ================================================
// HERO SLIDER
// ================================================
function initSlider() {
  const container = document.getElementById('sliderContainer');
  if (!container) return;

  const slides    = container.querySelectorAll('.slide');
  const dots      = document.querySelectorAll('.dot');
  const totalSlides = slides.length;
  let current   = 0;
  let autoTimer = null;

  function goTo(idx) {
    current = ((idx % totalSlides) + totalSlides) % totalSlides;
    container.style.transform = `translateX(-${current * 100}%)`;
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    dots.forEach((d, i)   => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(next, 5000);
  }

  // Init first slide
  goTo(0);
  startAuto();

  document.getElementById('sliderNext')?.addEventListener('click', () => { next(); startAuto(); });
  document.getElementById('sliderPrev')?.addEventListener('click', () => { prev(); startAuto(); });

  dots.forEach(d => d.addEventListener('click', () => {
    goTo(parseInt(d.dataset.idx));
    startAuto();
  }));

  // Touch/swipe support
  let touchX = 0;
  container.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  container.addEventListener('touchend',   e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); startAuto(); }
  }, { passive: true });
}

// ================================================
// INIT
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  renderProducts('all');
  renderCart();
  syncCartBadge();
  initSlider();
  initFilters();
  initCategoryCards();
  initMobileMenu();
  initStickyHeader();
  observeElements();
  initNewsletter();
  initSmoothScroll();

  // Cart events
  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

  // Modal events
  document.getElementById('modalClose')?.addEventListener('click', closeSizeModal);
  document.getElementById('addToCartBtn')?.addEventListener('click', confirmAddToCart);
  document.getElementById('sizeModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('sizeModal')) closeSizeModal();
  });

});
