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
    <button class="btn-mp" id="btnMercadoPago" onclick="checkoutMercadoPago()">
      Pagar
    </button>
    <button class="btn-checkout" onclick="checkoutWhatsApp()">
      <i class="fab fa-whatsapp"></i> Comprar por WhatsApp
    </button>
    <button class="btn-clear" onclick="clearCart()">Vaciar carrito</button>`;
}

// ================================================
// MERCADOPAGO CHECKOUT
// ================================================
let _pendingMpCheckout = false;

async function checkoutMercadoPago() {
  if (cart.length === 0) return;

  if (!currentUser) {
    _pendingMpCheckout = true;
    openAuthModal('login');
    return;
  }

  await _doMpCheckout();
}

async function _doMpCheckout() {
  _pendingMpCheckout = false;
  const btn = document.getElementById('btnMercadoPago');
  if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

  try {
    const data = await API.createPreference(cart.map(i => ({
      id: i.id, name: i.name, brand: i.brand || '',
      size: i.size, color: i.color || '',
      qty: i.qty, price: i.price
    })));
    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      throw new Error('No se recibió la URL de pago');
    }
  } catch (e) {
    console.error('MercadoPago error:', e);
    alert('Hubo un problema al iniciar el pago. Por favor intentá de nuevo o contactanos por WhatsApp.');
    if (btn) { btn.disabled = false; btn.textContent = 'Pagar'; }
  }
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
    colorsWrap.style.display = '';
    selectColor(colors[0].name);
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

function showModalValidation(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<span style="font-size:1rem">⚠️</span> ${msg}`;
  el.classList.remove('pop');
  void el.offsetWidth; // reflow para reiniciar animación
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 300);
}

function confirmAddToCart() {
  const hasColors = (pendingProduct?.colors || []).length > 0;
  const hasSizes  = (pendingProduct?.variants || []).length > 0;
  const missing = [];
  if (hasSizes && !pendingSize)       missing.push('talle');
  if (hasColors && pendingColor == null) missing.push('color');

  if (missing.length) {
    const msg = 'Seleccioná ' + missing.join(' y ');
    showModalValidation('modalValidation', msg);
    const shakeId = !pendingSize ? 'sizeGrid' : 'colorPicker';
    const el = document.getElementById(shakeId);
    el?.classList.add('shake');
    setTimeout(() => el?.classList.remove('shake'), 320);
    return;
  }
  document.getElementById('modalValidation').textContent = '';
  addToCart(pendingProduct, pendingSize, pendingColor, pendingQty);
  closeSizeModal();
}

// ================================================
// PRODUCT DETAIL MODAL
// ================================================
let pdProduct = null, pdSize = null, pdColor = null, pdQty = 1;

function openProductDetail(id) {
  const product = window.__products?.find(p => p.id === id);
  if (!product) return;
  pdProduct = product; pdSize = null; pdColor = null; pdQty = 1;
  history.pushState({ productId: id }, '', '?p=' + id);

  // Badge
  document.getElementById('pdBadgeRow').innerHTML = product.badge
    ? `<span class="prod-badge badge-${product.badge === 'NUEVO' ? 'nuevo' : 'oferta'}">${product.badge}</span>`
    : '';

  document.getElementById('pdBrand').textContent = product.brand;
  document.getElementById('pdName').textContent = product.name;

  // Prices
  const hasDisc = !!product.original_price;
  document.getElementById('pdPrices').innerHTML =
    `<span class="price-now">${fmt(product.price)}</span>` +
    (hasDisc ? `<span class="price-was">${fmt(product.original_price)}</span>` : '') +
    (hasDisc ? `<span class="price-disc">-${discount(product.price, product.original_price)}%</span>` : '');

  // Description
  const descWrap = document.getElementById('pdDescWrap');
  if (product.description) {
    document.getElementById('pdDesc').textContent = product.description;
    descWrap.style.display = '';
  } else {
    descWrap.style.display = 'none';
  }

  // Gallery
  const images = product.images || [];
  const mainImg = document.getElementById('pdMainImg');
  const placeholder = document.getElementById('pdImgPlaceholder');
  const primary = primaryImage(product);
  if (primary) {
    mainImg.src = primary; mainImg.alt = product.name;
    mainImg.style.display = 'block'; placeholder.style.display = 'none';
  } else {
    mainImg.style.display = 'none';
    placeholder.style.display = 'flex';
    placeholder.style.background = product.bg_gradient;
    placeholder.innerHTML = `<span style="font-size:3.5rem">${product.emoji}</span>`;
  }
  const thumbsEl = document.getElementById('pdThumbs');
  if (images.length > 1) {
    thumbsEl.innerHTML = images.map((img, i) =>
      `<button class="pd-thumb${i === 0 ? ' active' : ''}" onclick="setPdImage('${img.url}',this)">
        <img src="${img.url}" alt="${product.name}">
      </button>`
    ).join('');
    thumbsEl.style.display = 'flex';
  } else {
    thumbsEl.innerHTML = ''; thumbsEl.style.display = 'none';
  }

  // Colors
  const colors = product.colors || [];
  const colorsWrap = document.getElementById('pdColorsWrap');
  document.getElementById('pdColorName').textContent = '';
  if (colors.length > 0) {
    document.getElementById('pdColorPicker').innerHTML = colors.map(c =>
      `<button class="color-swatch" data-color="${c.name}" title="${c.name}"
        style="background:${c.hex}" onclick="selectPdColor('${c.name}')"></button>`
    ).join('');
    colorsWrap.style.display = '';
    selectPdColor(colors[0].name);
  } else {
    colorsWrap.style.display = 'none';
  }

  // Sizes
  document.getElementById('pdSizeGrid').innerHTML = (product.variants || []).map(v => {
    const no = v.stock === 0;
    return `<button class="size-btn${no ? ' unavailable' : ''}" data-size="${v.size}"
      onclick="${no ? '' : `selectPdSize('${v.size}')`}" ${no ? 'disabled title="Sin stock"' : ''}>${v.size}</button>`;
  }).join('');

  document.getElementById('pdQtyNum').textContent = '1';
  document.getElementById('productDetailModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductDetail() {
  document.getElementById('productDetailModal').classList.remove('open');
  document.body.style.overflow = '';
  pdProduct = null; pdSize = null; pdColor = null; pdQty = 1;
  if (location.search.includes('p=')) history.pushState({}, '', '/');
}

function setPdImage(url, btn) {
  document.getElementById('pdMainImg').src = url;
  document.querySelectorAll('.pd-thumb').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

function selectPdSize(size) {
  pdSize = size;
  document.querySelectorAll('#pdSizeGrid .size-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.size === size);
  });
}

function selectPdColor(name) {
  pdColor = name;
  document.querySelectorAll('#pdColorPicker .color-swatch').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color === name);
  });
  document.getElementById('pdColorName').textContent = name;
}

function changePdQty(delta) {
  pdQty = Math.max(1, pdQty + delta);
  document.getElementById('pdQtyNum').textContent = pdQty;
}

function confirmPdAddToCart() {
  const hasColors = (pdProduct?.colors || []).length > 0;
  const hasSizes  = (pdProduct?.variants || []).length > 0;
  const missing = [];
  if (hasSizes && !pdSize)       missing.push('talle');
  if (hasColors && pdColor == null) missing.push('color');

  if (missing.length) {
    const msg = 'Seleccioná ' + missing.join(' y ');
    showModalValidation('pdValidation', msg);
    const shakeId = !pdSize ? 'pdSizeGrid' : 'pdColorPicker';
    const el = document.getElementById(shakeId);
    el?.classList.add('shake');
    setTimeout(() => el?.classList.remove('shake'), 320);
    return;
  }
  document.getElementById('pdValidation').textContent = '';
  addToCart(pdProduct, pdSize, pdColor, pdQty);
  closeProductDetail();
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
    <div class="prod-img-wrap" onclick="openProductDetail(${p.id})" role="button" aria-label="Ver detalle de ${p.name}">
      ${imgTag}
      ${p.badge ? `<span class="prod-badge badge-${p.badge === 'NUEVO' ? 'nuevo' : 'oferta'}">${p.badge}</span>` : ''}
      <button class="prod-wishlist" onclick="toggleWish(this);event.stopPropagation()" aria-label="Favorito">
        <i class="far fa-heart"></i>
      </button>
      <div class="prod-view-overlay"><i class="fas fa-search-plus"></i> Ver detalle</div>
    </div>
    <div class="prod-info">
      <div class="prod-brand">${p.brand}</div>
      <div class="prod-name" onclick="openProductDetail(${p.id})" style="cursor:pointer">${p.name}</div>
      <div class="prod-colors">
        ${(p.colors || []).map(c => `<span class="color-dot" style="background:${c.hex}" title="${c.name}"></span>`).join('')}
      </div>
      <div class="prod-price">
        <span class="price-now">${fmt(p.price)}</span>
        ${hasDiscount ? `<span class="price-was">${fmt(p.original_price)}</span>` : ''}
        ${hasDiscount ? `<span class="price-disc">-${discount(p.price, p.original_price)}%</span>` : ''}
      </div>
      <div class="prod-actions">
        <button class="btn-cart-icon" onclick="openSizeModal(${p.id})" aria-label="Agregar al carrito">
          <i class="fas fa-shopping-bag"></i>
        </button>
        <button class="btn-detail" onclick="openProductDetail(${p.id})">
          Ver detalle
        </button>
      </div>
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
    renderCategoryFilters(allProducts);
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

function setFilter(filter) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const active = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
  if (active) active.classList.add('active');
  renderProducts(filter);
  updateFilterBtnLabels();
}

function updateFilterBtnLabels() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const filter = btn.dataset.filter;
    const isActive = btn.classList.contains('active');
    const label = filter === 'all' ? 'Todos' : filter.charAt(0).toUpperCase() + filter.slice(1);
    btn.innerHTML = isActive && filter !== 'all'
      ? `${label} <span class="filter-btn-x">×</span>`
      : label;
  });
}

function renderCategoryFilters(products) {
  const bar = document.getElementById('filterBar');
  if (!bar) return;
  const cats = [...new Set((products || allProducts).map(p => p.category).filter(Boolean))];
  bar.innerHTML = `<button class="filter-btn active" data-filter="all">Todos</button>` +
    cats.map(c => `<button class="filter-btn" data-filter="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</button>`).join('');
  bar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isAlreadyActive = btn.classList.contains('active') && btn.dataset.filter !== 'all';
      setFilter(isAlreadyActive ? 'all' : btn.dataset.filter);
    });
  });
}

function initCategoryCards() {
  document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const filter = card.dataset.filter;
      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => setFilter(filter), 550);
    });
  });
}

function initSlider() {
  const container    = document.getElementById('sliderContainer');
  if (!container) return;
  const slides       = container.querySelectorAll('.slide');
  const dots         = document.querySelectorAll('.dot');
  const progressFill = document.getElementById('sliderProgressFill');
  let current = 0, autoTimer = null, progressTween = null, busy = false;

  function kenBurns(img) {
    gsap.fromTo(img, { scale: 1 }, { scale: 1.08, duration: 7, ease: 'none', overwrite: true });
  }

  function killProgress() {
    if (progressTween) { progressTween.kill(); progressTween = null; }
  }

  function startProgress() {
    killProgress();
    if (!progressFill) return;
    gsap.set(progressFill, { scaleX: 0 });
    progressTween = gsap.to(progressFill, { scaleX: 1, duration: 5, ease: 'none' });
  }

  function animateSlideIn(slide) {
    const tag   = slide.querySelector('.slide-tag');
    const title = slide.querySelector('.slide-title');
    const btn   = slide.querySelector('.btn');
    if (tag)   gsap.fromTo(tag,   { x: -60, opacity: 0 },            { x: 0, opacity: 1, duration: 0.6,  ease: 'power3.out',   delay: 0.35 });
    if (title) gsap.fromTo(title, { y: 90,  opacity: 0, skewX: -4 }, { y: 0, opacity: 1, skewX: 0, duration: 0.75, ease: 'power4.out', delay: 0.48 });
    if (btn)   gsap.fromTo(btn,   { y: 30,  opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.6)', delay: 0.72 });
  }

  function goTo(idx, dir) {
    if (busy) return;
    const from = current;
    const to   = ((idx % slides.length) + slides.length) % slides.length;
    if (from === to) return;
    busy = true;
    current = to;

    const entering = slides[to];
    const leaving  = slides[from];

    // Wipe: entering reveals over leaving from the correct side
    gsap.set(entering, { zIndex: 2, clipPath: dir >= 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' });
    gsap.set(leaving,  { zIndex: 1 });

    gsap.to(entering, {
      clipPath: 'inset(0 0% 0 0%)',
      duration: 0.88,
      ease: 'power3.inOut',
      onComplete() {
        gsap.set(leaving, { zIndex: 0, clipPath: 'inset(0 0 0 100%)' });
        busy = false;
      },
    });

    // Leaving: subtle scale + fade during wipe
    gsap.to(leaving.querySelector('.slide-img'),  { scale: 1.1, opacity: 0.6, duration: 0.88, ease: 'power3.inOut' });
    gsap.fromTo(entering.querySelector('.slide-img'), { scale: 1.1, opacity: 1 }, { scale: 1, duration: 0.88, ease: 'power3.inOut',
      onComplete() { kenBurns(entering.querySelector('.slide-img')); }
    });

    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    animateSlideIn(entering);
    startProgress();
  }

  function next() { goTo(current + 1,  1); }
  function prev() { goTo(current - 1, -1); }
  function startAuto() { clearInterval(autoTimer); autoTimer = setInterval(next, 5000); startProgress(); }

  // Init: first slide visible, rest hidden
  slides.forEach((s, i) => gsap.set(s, { zIndex: i === 0 ? 1 : 0, clipPath: i === 0 ? 'inset(0 0% 0 0%)' : 'inset(0 0 0 100%)' }));
  animateSlideIn(slides[0]);
  kenBurns(slides[0].querySelector('.slide-img'));
  startAuto();

  document.getElementById('sliderNext')?.addEventListener('click', () => { next(); startAuto(); });
  document.getElementById('sliderPrev')?.addEventListener('click', () => { prev(); startAuto(); });
  dots.forEach(d => d.addEventListener('click', () => {
    const idx = parseInt(d.dataset.idx);
    goTo(idx, idx > current ? 1 : -1);
    startAuto();
  }));

  let touchX = 0;
  container.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  container.addEventListener('touchend',   e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); startAuto(); }
  }, { passive: true });
}

function buildBsCard(item) {
  const badge  = item.badge ? `<span class="bs-badge">${item.badge}</span>` : '';
  const imgHtml = item.image_url
    ? `<img src="${item.image_url}" alt="${item.name}" class="bs-img">`
    : `<div class="bs-img" style="background:#181818;display:flex;align-items:center;justify-content:center"><i class="fas fa-image" style="font-size:2rem;color:#333"></i></div>`;
  const waText = encodeURIComponent(`Hola! Me interesa ${item.name}`);
  return `
  <article class="bs-card">
    <div class="bs-img-wrap">
      ${imgHtml}
      ${badge}
    </div>
    <div class="bs-info">
      <div class="bs-name">${item.name}</div>
      <div class="bs-price">${fmt(item.price)}</div>
      <a href="https://wa.me/5492346581240?text=${waText}" target="_blank" class="bs-btn">
        <i class="fab fa-whatsapp"></i> Consultar
      </a>
    </div>
  </article>`;
}

async function loadBestsellers() {
  const track   = document.getElementById('bsTrack');
  const section = document.getElementById('mas-vendidos');
  if (!track) return;
  try {
    const items = await API.getBestsellers();
    if (items && items.length > 0) {
      track.innerHTML = items.map(buildBsCard).join('');
      initBestsellers();
    } else {
      if (section) section.style.display = 'none';
    }
  } catch {
    if (section) section.style.display = 'none';
  }
}

function initBestsellers() {
  const track = document.getElementById('bsTrack');
  if (!track) return;

  gsap.registerPlugin(ScrollTrigger);

  const cards = Array.from(track.querySelectorAll('.bs-card'));
  if (!cards.length) return;
  const GAP = 16;
  let current = 0;

  // Entrance animation: cards reveal from top (clip-path, no overflow issues)
  gsap.from(cards, {
    scrollTrigger: { trigger: track, start: 'top 85%', once: true },
    clipPath: 'inset(0 0 100% 0)',
    opacity: 0,
    duration: 0.65,
    stagger: 0.1,
    ease: 'power3.out',
  });

  function cardWidth()   { return cards[0].offsetWidth + GAP; }
  function visibleCount(){ return Math.floor(track.parentElement.offsetWidth / cardWidth()); }
  function maxIdx()      { return Math.max(0, cards.length - visibleCount()); }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, maxIdx()));
    gsap.to(track, { x: -(current * cardWidth()), duration: 0.48, ease: 'power2.out' });
    const prev = document.getElementById('bsPrev');
    const next = document.getElementById('bsNext');
    if (prev) prev.style.opacity = current === 0 ? '0.3' : '1';
    if (next) next.style.opacity = current >= maxIdx() ? '0.3' : '1';
  }

  document.getElementById('bsPrev')?.addEventListener('click', () => goTo(current - 1));
  document.getElementById('bsNext')?.addEventListener('click', () => goTo(current + 1));

  let touchX = 0;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
  }, { passive: true });

  goTo(0);
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
// AUTH
// ================================================
let currentUser = null;

function getStoredToken() { return localStorage.getItem('hs_token'); }
function getStoredUser()  {
  try { return JSON.parse(localStorage.getItem('hs_user')); } catch { return null; }
}

function saveSession(token, user) {
  localStorage.setItem('hs_token', token);
  localStorage.setItem('hs_user', JSON.stringify(user));
  currentUser = user;
}

function clearSession() {
  localStorage.removeItem('hs_token');
  localStorage.removeItem('hs_user');
  currentUser = null;
}

function renderHeaderUser() {
  const el = document.getElementById('headerUser');
  if (!el) return;
  if (currentUser) {
    el.innerHTML = `
      <div class="user-dropdown" id="userDropdown">
        <button class="btn-user-name" onclick="toggleUserDropdown(event)">
          <i class="fas fa-user-circle"></i>
          <span>${escHtml(currentUser.name.split(' ')[0])}</span>
          <i class="fas fa-chevron-down user-caret"></i>
        </button>
        <div class="user-dropdown-menu" id="userDropdownMenu">
          <button class="user-dropdown-item" onclick="openProfile(); closeUserDropdown()">
            <i class="fas fa-user-edit"></i> Mis datos
          </button>
          <button class="user-dropdown-item" onclick="openMyOrders(); closeUserDropdown()">
            <i class="fas fa-box"></i> Mis pedidos
          </button>
          <div class="user-dropdown-sep"></div>
          <button class="user-dropdown-item user-dropdown-item--danger" onclick="logoutUser()">
            <i class="fas fa-sign-out-alt"></i> Cerrar sesión
          </button>
        </div>
      </div>`;
  } else {
    el.innerHTML = `<button class="btn-login" onclick="openAuthModal('login')"><i class="fas fa-user"></i> Ingresar</button>`;
  }
}

function toggleUserDropdown(e) {
  e.stopPropagation();
  const menu = document.getElementById('userDropdownMenu');
  if (menu) menu.classList.toggle('open');
}

function closeUserDropdown() {
  document.getElementById('userDropdownMenu')?.classList.remove('open');
}

function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function openAuthModal(tab = 'login') {
  switchAuthTab(tab);
  document.getElementById('authOverlay').classList.add('open');
  document.getElementById('authModal').classList.add('open');
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.remove('open');
  document.getElementById('authModal').classList.remove('open');
}

function switchAuthTab(tab) {
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  document.getElementById('formLogin').classList.toggle('auth-form--hidden', tab !== 'login');
  document.getElementById('formRegister').classList.toggle('auth-form--hidden', tab !== 'register');
  document.getElementById('loginError').textContent = '';
  document.getElementById('registerError').textContent = '';
}

function showAuthToast(name, isNew) {
  const prev = document.getElementById('authToast');
  if (prev) prev.remove();
  const t = document.createElement('div');
  t.id = 'authToast';
  t.className = 'auth-toast';
  const mainText = isNew
    ? `¡Cuenta creada! Bienvenida, <strong>${escHtml(name.split(' ')[0])}</strong>`
    : `¡Hola de nuevo, <strong>${escHtml(name.split(' ')[0])}</strong>!`;
  t.innerHTML = `<span class="auth-toast-line"><i class="fas fa-check-circle"></i> ${mainText}</span>`;
  if (_pendingMpCheckout) {
    t.innerHTML += `<span class="auth-toast-sub">Redirigiendo al pago…</span>`;
  }
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 350); }, 2500);
}

async function submitLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  btn.disabled = true; btn.textContent = 'Ingresando...';
  errEl.textContent = '';
  try {
    const data = await API.authLogin({
      email:    document.getElementById('loginEmail').value,
      password: document.getElementById('loginPassword').value
    });
    saveSession(data.token, data.customer);
    renderHeaderUser();
    closeAuthModal();
    showAuthToast(data.customer.name, false);
    if (_pendingMpCheckout) setTimeout(_doMpCheckout, 1600);
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false; btn.textContent = 'Ingresar';
  }
}

async function submitRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('registerBtn');
  const errEl = document.getElementById('registerError');
  btn.disabled = true; btn.textContent = 'Creando cuenta...';
  errEl.textContent = '';
  try {
    const data = await API.authRegister({
      name:     document.getElementById('regName').value,
      email:    document.getElementById('regEmail').value,
      password: document.getElementById('regPassword').value,
      phone:    document.getElementById('regPhone').value
    });
    saveSession(data.token, data.customer);
    renderHeaderUser();
    closeAuthModal();
    showAuthToast(data.customer.name, true);
    if (_pendingMpCheckout) setTimeout(_doMpCheckout, 1600);
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false; btn.textContent = 'Crear cuenta';
  }
}

function logoutUser() {
  clearSession();
  renderHeaderUser();
}

// ================================================
// PERFIL
// ================================================
function openProfile() {
  if (!currentUser) return;
  document.getElementById('profileName').value  = currentUser.name  || '';
  document.getElementById('profileEmail').value = currentUser.email || '';
  document.getElementById('profilePhone').value = currentUser.phone || '';
  document.getElementById('profileError').textContent = '';
  document.getElementById('profileOverlay').classList.add('open');
  document.getElementById('profileModal').classList.add('open');
}

function closeProfile() {
  document.getElementById('profileOverlay').classList.remove('open');
  document.getElementById('profileModal').classList.remove('open');
}

async function submitProfile(e) {
  e.preventDefault();
  const btn   = document.getElementById('profileBtn');
  const errEl = document.getElementById('profileError');
  btn.disabled = true; btn.textContent = 'Guardando...';
  errEl.textContent = '';
  try {
    const updated = await API.updateProfile({
      name:  document.getElementById('profileName').value,
      phone: document.getElementById('profilePhone').value
    });
    saveSession(localStorage.getItem('hs_token'), { ...currentUser, ...updated });
    renderHeaderUser();
    closeProfile();
    showAuthToast(updated.name, false);
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar cambios';
  }
}

function initAuth() {
  const token = getStoredToken();
  const user  = getStoredUser();
  if (token && user) {
    currentUser = user;
    // Verificar token en background
    API.getMyProfile().catch(() => { clearSession(); renderHeaderUser(); });
  }
  renderHeaderUser();
}

// ================================================
// MIS PEDIDOS
// ================================================
const AR_TZ = 'America/Argentina/Buenos_Aires';

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleString('es-AR', {
    timeZone: AR_TZ, day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function openMyOrders() {
  document.getElementById('ordersOverlay').classList.add('open');
  document.getElementById('ordersModal').classList.add('open');
  loadMyOrders();
}

function closeMyOrders() {
  document.getElementById('ordersOverlay').classList.remove('open');
  document.getElementById('ordersModal').classList.remove('open');
}

async function loadMyOrders() {
  const body = document.getElementById('ordersModalBody');
  body.innerHTML = '<div class="auth-loading"><i class="fas fa-spinner fa-spin"></i></div>';
  try {
    const orders = await API.getMyOrders();
    if (!orders.length) {
      body.innerHTML = `<div class="orders-empty"><i class="fas fa-box-open"></i><p>Todavía no hiciste ningún pedido.</p></div>`;
      return;
    }
    const statusMap = {
      pending: 'Pendiente', confirmed: 'Confirmado',
      preparing: 'Preparando', delivered: 'Entregado', cancelled: 'Cancelado'
    };
    body.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-card-head">
          <span class="order-card-id">Pedido #${o.id}</span>
          <span class="order-card-date">${fmtDate(o.created_at)}</span>
          <span class="badge badge-${o.status || 'pending'}">${statusMap[o.status] || o.status}</span>
        </div>
        <div class="order-card-items">
          ${o.items.map(i => `${escHtml(i.product_name)} — Talle ${i.size} × ${i.quantity}`).join('<br>')}
        </div>
        <div class="order-card-foot">
          <span class="order-card-total">${fmt(o.total)}</span>
        </div>
      </div>`).join('');
  } catch (err) {
    body.innerHTML = `<div class="orders-empty"><p style="color:#e74c3c">${err.message}</p></div>`;
  }
}

// ================================================
// INFO MODALS (guía de talles, cambios, FAQ)
// ================================================
const INFO_CONTENT = {
  talles: {
    title: 'Guía de Talles',
    html: `
      <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:16px">Medidas en centímetros. Para dudas, consultanos por WhatsApp.</p>
      <div style="overflow-x:auto">
        <table class="info-table">
          <thead><tr><th>Medida</th><th>S</th><th>M</th><th>L</th><th>XL</th></tr></thead>
          <tbody>
            <tr><td>Cintura</td><td>67–74</td><td>74–81</td><td>81–88</td><td>88–98</td></tr>
            <tr><td>Cadera</td><td>91–98</td><td>98–105</td><td>105–112</td><td>112–120</td></tr>
            <tr><td>Busto</td><td>85–90</td><td>90–95</td><td>95–100</td><td>100–105</td></tr>
            <tr><td>Estatura</td><td>163–173</td><td>163–173</td><td>163–173</td><td>163–173</td></tr>
          </tbody>
        </table>
      </div>
      <p style="color:var(--text-muted);font-size:0.8rem;margin-top:14px">¿No encontrás tu talle? <a href="https://wa.me/5492346581240" target="_blank" style="color:var(--orange)">Consultanos</a> y te ayudamos.</p>`
  },
  cambios: {
    title: 'Política de Cambios',
    html: `
      <div class="info-section">
        <h4>¿Cuándo puedo solicitar un cambio?</h4>
        <p>Aceptamos cambios dentro de los <strong>30 días corridos</strong> desde la fecha de compra.</p>
      </div>
      <div class="info-section">
        <h4>Condiciones del producto</h4>
        <ul class="info-list">
          <li>La ropa debe estar <strong>sin uso</strong>, sin manchas, roturas ni olores.</li>
          <li>Debe conservar la <strong>etiqueta original</strong> y estar en su embalaje.</li>
          <li>No se aceptan cambios de productos en <strong>liquidación o promoción especial</strong>.</li>
        </ul>
      </div>
      <div class="info-section">
        <h4>¿Cómo realizarlo?</h4>
        <ul class="info-list">
          <li>Contactanos por WhatsApp con tu número de pedido y el motivo del cambio.</li>
          <li>Los gastos de envío por cambio de talle corren por cuenta del comprador.</li>
          <li>Si el cambio es por defecto de fabricación, nos hacemos cargo del envío.</li>
        </ul>
      </div>
      <div class="info-section">
        <h4>Importante</h4>
        <p>No realizamos <strong>reintegros de dinero</strong>. Los cambios son por otro talle o modelo de igual o mayor valor (abonando la diferencia).</p>
      </div>
      <a href="https://wa.me/5492346581240?text=Hola!%20Quiero%20hacer%20un%20cambio." target="_blank" class="btn btn-primary" style="margin-top:8px;display:inline-flex">
        <i class="fab fa-whatsapp"></i> Iniciar cambio por WhatsApp
      </a>`
  },
  faq: {
    title: 'Preguntas Frecuentes',
    html: `
      <div class="faq-item">
        <div class="faq-q">¿Hacen envíos a todo el país?</div>
        <div class="faq-a">Sí, enviamos a todo el país a través de correo privado. El costo y tiempo de entrega varía según la zona.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">¿Cuánto tarda el envío?</div>
        <div class="faq-a">Entre 5 y 10 días hábiles según la localidad. Enviamos desde Chivilcoy, Buenos Aires, por lo que los tiempos pueden variar para CABA y GBA.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">¿Cómo puedo pagar?</div>
        <div class="faq-a">Aceptamos pagos por MercadoPago (todas las tarjetas de crédito y débito, dinero en cuenta), transferencia bancaria y efectivo.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">¿Los precios incluyen IVA?</div>
        <div class="faq-a">Sí, todos los precios publicados son finales e incluyen impuestos.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">¿Cómo sé qué talle elegir?</div>
        <div class="faq-a">Podés consultar nuestra <a href="#" onclick="openInfoModal('talles');return false" style="color:var(--orange)">guía de talles</a>. Si tenés dudas, escribinos y te ayudamos a elegir.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">¿Puedo hacer una devolución?</div>
        <div class="faq-a">No realizamos reintegros de dinero, pero sí aceptamos cambios de talle o modelo dentro de los 30 días. Consultá nuestra <a href="#" onclick="openInfoModal('cambios');return false" style="color:var(--orange)">política de cambios</a>.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q">¿Tienen local físico?</div>
        <div class="faq-a">Sí, estamos en Chivilcoy, Buenos Aires. Para coordinar una visita, escribinos por WhatsApp.</div>
      </div>`
  }
};

function openInfoModal(key) {
  const content = INFO_CONTENT[key];
  if (!content) return;
  const modal = document.getElementById('infoModal');
  document.getElementById('infoModalContent').innerHTML =
    `<h3 class="info-modal-title">${content.title}</h3>${content.html}`;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeInfoModal() {
  const modal = document.getElementById('infoModal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// ================================================
// INIT
// ================================================
document.addEventListener('click', () => closeUserDropdown());

document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  renderCart(); syncBadge();
  initSlider(); initCategoryCards();
  initMobileMenu(); initStickyHeader();
  observeElements(); initNewsletter(); initSmoothScroll();

  await Promise.all([loadProducts(), loadBestsellers()]);

  // Abrir producto si la URL tiene ?p=ID (link compartido)
  const pid = new URLSearchParams(location.search).get('p');
  if (pid) openProductDetail(Number(pid));

  // Botón Atrás del navegador cierra el modal
  window.addEventListener('popstate', () => {
    if (!location.search.includes('p=')) closeProductDetail();
  });

  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('modalClose')?.addEventListener('click', closeSizeModal);
  document.getElementById('addToCartBtn')?.addEventListener('click', confirmAddToCart);
  document.getElementById('sizeModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('sizeModal')) closeSizeModal();
  });
  document.getElementById('pdClose')?.addEventListener('click', closeProductDetail);
  document.getElementById('pdAddBtn')?.addEventListener('click', confirmPdAddToCart);
  document.getElementById('productDetailModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('productDetailModal')) closeProductDetail();
  });
});
