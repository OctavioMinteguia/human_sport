/* ================================================
   Human Sport — Frontend App
   Consume la API REST del servidor Express.
   ================================================ */

// ================================================
// UTILS
// ================================================
function fmt(n) {
  return '$' + Number(n).toLocaleString('es-AR');
}
function discount(price, original) {
  return Math.round((1 - price / original) * 100);
}
function primaryImage(product) {
  const img = product.images?.find(i => i.is_primary) || product.images?.[0];
  return img?.url || null;
}

// ================================================
// CART STATE (localStorage)
// ================================================
let cart = [];
try { cart = JSON.parse(localStorage.getItem('hs_cart')) || []; } catch { cart = []; }

let pendingProduct = null;
let pendingSize    = null;
let pendingColor   = null;
let pendingQty     = 1;

function saveCart()  { localStorage.setItem('hs_cart', JSON.stringify(cart)); }
function cartTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function cartCount() { return cart.reduce((s, i) => s + i.qty, 0); }

function syncBadge() {
  const cnt = cartCount();
  const el  = document.getElementById('cartCount');
  if (!el) return;
  el.textContent   = cnt;
  el.style.display = cnt > 0 ? 'flex' : 'none';
}

function addToCart(product, size, color, qty) {
  qty = qty || 1;
  color = color || '';
  const existing = cart.find(i => i.id === product.id && i.size === size && (i.color || '') === color);
  if (existing) { existing.qty += qty; }
  else {
    cart.push({
      id:    product.id,
      name:  product.name,
      brand: product.brand,
      price: product.price,
      bg:    product.bg_gradient,
      emoji: product.emoji,
      image: primaryImage(product),
      size,
      color,
      qty
    });
  }
  saveCart(); syncBadge(); renderCart();
  showAddedToast(product, size, color, qty);
}

function removeFromCart(id, size, color) {
  color = color || '';
  cart = cart.filter(i => !(i.id === id && i.size === size && (i.color || '') === color));
  saveCart(); syncBadge(); renderCart();
}

function changeQty(id, size, color, delta) {
  color = color || '';
  const item = cart.find(i => i.id === id && i.size === size && (i.color || '') === color);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id, size, color);
  else { saveCart(); syncBadge(); renderCart(); }
}

function clearCart() {
  cart = []; saveCart(); syncBadge(); renderCart();
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

  itemsEl.innerHTML = cart.map(item => {
    const c = item.color || '';
    const thumb = item.image
      ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover">`
      : `<span>${item.emoji}</span>`;
    const sizeColor = `Talle: <strong>${item.size}</strong>${c ? ` · <strong>${c}</strong>` : ''}`;
    return `
    <div class="cart-item">
      <div class="ci-thumb" style="${item.image ? '' : 'background:' + item.bg}">${thumb}</div>
      <div class="ci-info">
        <div class="ci-brand">${item.brand}</div>
        <div class="ci-name">${item.name}</div>
        <div class="ci-size">${sizeColor}</div>
        <div class="ci-row">
          <span class="ci-price">${fmt(item.price * item.qty)}</span>
          <div class="ci-qty">
            <button class="qty-btn" onclick="changeQty(${item.id},'${item.size}','${c}',-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id},'${item.size}','${c}',1)">+</button>
            <button class="ci-del" onclick="removeFromCart(${item.id},'${item.size}','${c}')" title="Eliminar">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

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
async function checkoutWhatsApp() {
  if (cart.length === 0) return;

  const snapshot = [...cart];
  const total    = cartTotal();

  let msg = '¡Hola! Me gustaría realizar el siguiente pedido en *Human Sport*:\n\n🛍️ *MIS PRODUCTOS:*\n';
  snapshot.forEach((item, i) => {
    msg += `${i + 1}. ${item.name} - Talle ${item.size}`;
    if (item.color) msg += ` - Color ${item.color}`;
    msg += ` - ${fmt(item.price)}`;
    if (item.qty > 1) msg += ` (x${item.qty})`;
    msg += '\n';
  });
  msg += `\n💰 *TOTAL: ${fmt(total)}*\n\n¿Me podés confirmar disponibilidad? ¡Muchas gracias! 😊`;

  try {
    await API.createOrder({
      items: snapshot.map(i => ({
        product_id: i.id, product_name: i.name, brand: i.brand,
        size: i.size, quantity: i.qty, unit_price: i.price
      }))
    });
  } catch (e) { console.warn('No se pudo registrar el pedido:', e.message); }

  const waUrl = 'https://wa.me/5492346581240?text=' + encodeURIComponent(msg);

  // Abrir WhatsApp inmediatamente
  window.open(waUrl, '_blank');

  // Cuando el usuario vuelve a esta pestaña, mostrar confirmación y vaciar carrito
  function onReturn() {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', onReturn);
    clearCart();
    const itemsEl = document.getElementById('cartItems');
    const footEl  = document.getElementById('cartFoot');
    if (itemsEl) itemsEl.innerHTML = `
      <div class="cart-success">
        <div class="cart-success-emoji">🎉</div>
        <h3>¡Pedido enviado!</h3>
        <p>¡Gracias! En breve te confirmamos la disponibilidad por WhatsApp.</p>
      </div>`;
    if (footEl) footEl.innerHTML = `
      <button class="btn-clear" onclick="closeCart()">Seguir comprando</button>`;
  }

  // Delay para no capturar el cambio de visibilidad al abrir la nueva pestaña
  setTimeout(() => {
    document.addEventListener('visibilitychange', onReturn);
  }, 800);
}

// ================================================
// CART UI
// ================================================
function openCart()  {
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
  const product = window.__products?.find(p => p.id === id);
  if (!product) return;
  pendingProduct = product; pendingSize = null; pendingColor = null; pendingQty = 1;

  document.getElementById('modalProdInfo').innerHTML = `
    <div class="modal-thumb" style="background:${product.bg_gradient}">${product.emoji}</div>
    <div class="modal-details">
      <div class="m-brand">${product.brand}</div>
      <div class="m-name">${product.name}</div>
      <div class="m-price">${fmt(product.price)}</div>
    </div>`;

  const sizes = product.variants?.map(v => v.size) || [];
  document.getElementById('sizeGrid').innerHTML = sizes.map(s => {
    const noStock = product.variants?.find(v => v.size === s)?.stock === 0;
    return `<button class="size-btn${noStock ? ' unavailable' : ''}" data-size="${s}"
      onclick="${noStock ? '' : `selectSize('${s}')`}"
      ${noStock ? 'disabled title="Sin stock"' : ''}>${s}</button>`;
  }).join('');

  const colors = product.colors || [];
  const colorsWrap = document.getElementById('modalColorsWrap');
  const colorPicker = document.getElementById('colorPicker');
  const colorName = document.getElementById('modalColorName');
  if (colors.length > 0) {
    colorPicker.innerHTML = colors.map(c =>
      `<button class="color-swatch" data-color="${c.name}" title="${c.name}"
        style="background:${c.hex}" onclick="selectColor('${c.name}')"></button>`
    ).join('');
    colorName.textContent = '';
    colorsWrap.style.display = '';
  } else {
    colorsWrap.style.display = 'none';
  }

  document.getElementById('modalQtyNum').textContent = '1';
  document.getElementById('sizeModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function selectSize(size) {
  pendingSize = size;
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.size === size);
  });
}

function selectColor(name) {
  pendingColor = name;
  document.querySelectorAll('.color-swatch').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color === name);
  });
  document.getElementById('modalColorName').textContent = name;
}

function changeModalQty(delta) {
  pendingQty = Math.max(1, pendingQty + delta);
  document.getElementById('modalQtyNum').textContent = pendingQty;
}

function closeSizeModal() {
  document.getElementById('sizeModal').classList.remove('open');
  document.body.style.overflow = '';
  pendingProduct = null; pendingSize = null; pendingColor = null; pendingQty = 1;
}

function confirmAddToCart() {
  if (!pendingSize) {
    const grid = document.getElementById('sizeGrid');
    grid.classList.add('shake');
    setTimeout(() => grid.classList.remove('shake'), 320);
    return;
  }
  addToCart(pendingProduct, pendingSize, pendingColor, pendingQty);
  closeSizeModal();
}

// ================================================
// RENDER PRODUCTS
// ================================================
let allProducts = [];

function buildProductCard(p) {
  const hasDiscount = !!p.original_price;
  const img = primaryImage(p);
  const imgTag = img
    ? `<img src="${img}" alt="${p.name}" class="prod-real-img" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="prod-placeholder" style="background:${p.bg_gradient};display:none">
         <span class="prod-emoji">${p.emoji}</span>
         <span class="prod-color-label">${p.colors?.[0]?.name || ''}</span>
       </div>`
    : `<div class="prod-placeholder" style="background:${p.bg_gradient}">
         <span class="prod-emoji">${p.emoji}</span>
         <span class="prod-color-label">${p.colors?.[0]?.name || ''}</span>
       </div>`;

  return `
  <article class="product-card fade-in">
    <div class="prod-img-wrap">
      ${imgTag}
      ${p.badge ? `<span class="prod-badge badge-${p.badge === 'NUEVO' ? 'nuevo' : 'oferta'}">${p.badge}</span>` : ''}
      <button class="prod-wishlist" onclick="toggleWish(this)" aria-label="Favorito">
        <i class="far fa-heart"></i>
      </button>
    </div>
    <div class="prod-info">
      <div class="prod-brand">${p.brand}</div>
      <div class="prod-name">${p.name}</div>
      <div class="prod-colors">
        ${(p.colors || []).map(c => `<span class="color-dot" style="background:${c.hex}" title="${c.name}"></span>`).join('')}
      </div>
      <div class="prod-price">
        <span class="price-now">${fmt(p.price)}</span>
        ${hasDiscount ? `<span class="price-was">${fmt(p.original_price)}</span>` : ''}
        ${hasDiscount ? `<span class="price-disc">-${discount(p.price, p.original_price)}%</span>` : ''}
      </div>
      <button class="btn-cart" onclick="openSizeModal(${p.id})">
        <i class="fas fa-plus"></i> Agregar al carrito
      </button>
    </div>
  </article>`;
}

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:#555">
    <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#d4812a"></i></div>`;
  try {
    allProducts = await API.getProducts();
    window.__products = allProducts;
    renderProducts('all');
  } catch {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:#555">
      Error cargando productos.</div>`;
  }
}

function renderProducts(filter) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  let list = filter === 'all' ? allProducts : allProducts.filter(p => p.category === filter);
  list = list.filter(p => primaryImage(p));
  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:#555">Sin productos en esta categoría.</div>`;
    return;
  }
  grid.innerHTML = list.map(buildProductCard).join('');
  observeElements();
}

// ================================================
// WISHLIST / FILTERS / CATEGORIES / SLIDER / ETC.
// ================================================
function toggleWish(btn) {
  btn.classList.toggle('wished');
  btn.querySelector('i').className = btn.classList.contains('wished') ? 'fas fa-heart' : 'far fa-heart';
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.dataset.filter);
    });
  });
}

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

function initSlider() {
  const container = document.getElementById('sliderContainer');
  if (!container) return;
  const slides = container.querySelectorAll('.slide');
  const dots   = document.querySelectorAll('.dot');
  let current = 0, autoTimer = null;

  function goTo(idx) {
    current = ((idx % slides.length) + slides.length) % slides.length;
    container.style.transform = `translateX(-${current * 100}%)`;
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    dots.forEach((d, i)   => d.classList.toggle('active', i === current));
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }
  function startAuto() { clearInterval(autoTimer); autoTimer = setInterval(next, 5000); }

  goTo(0); startAuto();
  document.getElementById('sliderNext')?.addEventListener('click', () => { next(); startAuto(); });
  document.getElementById('sliderPrev')?.addEventListener('click', () => { prev(); startAuto(); });
  dots.forEach(d => d.addEventListener('click', () => { goTo(parseInt(d.dataset.idx)); startAuto(); }));
  let touchX = 0;
  container.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  container.addEventListener('touchend',   e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); startAuto(); }
  }, { passive: true });
}

function initMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const nav     = document.getElementById('nav');
  const navClose = document.getElementById('navClose');
  const overlay  = document.getElementById('navOverlay');
  const open  = () => { nav.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { nav.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; };
  menuBtn?.addEventListener('click', open);
  navClose?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  nav?.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', close));
}

function showAddedToast(product, size, color, qty) {
  const prev = document.getElementById('addToast');
  if (prev) { clearTimeout(prev._timer); prev.remove(); }

  const toast = document.createElement('div');
  toast.id = 'addToast';
  toast.className = 'add-toast';
  const img = primaryImage(product);
  const thumb = img
    ? `<img src="${img}" alt="" class="toast-thumb">`
    : `<div class="toast-thumb toast-thumb-emoji" style="background:${product.bg_gradient}">${product.emoji}</div>`;
  const detail = [`Talle ${size}`, color || null, (qty > 1) ? `x${qty}` : null]
    .filter(Boolean).join(' · ');
  toast.innerHTML = `
    <div class="toast-inner">
      ${thumb}
      <div class="toast-text">
        <strong>${product.name}</strong>
        <span>${detail} · agregado al carrito</span>
      </div>
      <button class="toast-btn" onclick="openCart();this.closest('.add-toast').remove()">
        <i class="fas fa-shopping-bag"></i> Ver carrito
      </button>
    </div>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  toast._timer = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

function initStickyHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 36);
  }, { passive: true });
}

function observeElements() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-in:not(.visible), .animate-up:not(.visible)').forEach(el => io.observe(el));
}

function initNewsletter() {
  document.getElementById('newsletterForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    alert(`¡Gracias! Te avisaremos las novedades a ${input.value} 🎉`);
    input.value = '';
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

// ================================================
// INIT
// ================================================
document.addEventListener('DOMContentLoaded', async () => {
  renderCart(); syncBadge();
  initSlider(); initFilters(); initCategoryCards();
  initMobileMenu(); initStickyHeader();
  observeElements(); initNewsletter(); initSmoothScroll();

  await loadProducts();

  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('modalClose')?.addEventListener('click', closeSizeModal);
  document.getElementById('addToCartBtn')?.addEventListener('click', confirmAddToCart);
  document.getElementById('sizeModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('sizeModal')) closeSizeModal();
  });
});
