/* ================================================
   Human Sport — Admin Dashboard
   ================================================ */

const ADMIN_API = (() => {
  const BASE = '/api/admin';

  function token() {
    return localStorage.getItem('hs_admin_token') || '';
  }

  async function request(method, path, body, isFormData = false) {
    const headers = { Authorization: 'Bearer ' + token() };
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    const res  = await fetch(BASE + path, opts);
    const json = await res.json().catch(() => ({ success: false, error: res.statusText }));
    if (!json.success) throw new Error(json.error || 'Error desconocido');
    return json.data;
  }

  return {
    // Auth
    me: () => request('GET', '/auth/me'),

    // Products
    getProducts: () => request('GET', '/products'),
    getProduct:  (id) => request('GET', `/products/${id}`),
    createProduct: (data) => request('POST', '/products', data),
    updateProduct: (id, data) => request('PUT', `/products/${id}`, data),
    deleteProduct: (id) => request('DELETE', `/products/${id}`),
    uploadImage:   (id, fd) => request('POST', `/products/${id}/images`, fd, true),
    deleteImage:   (id, imgId) => request('DELETE', `/products/${id}/images/${imgId}`),
    setPrimaryImage: (id, imgId) => request('PATCH', `/products/${id}/images/${imgId}/primary`),

    // Stock
    getStock:    (id) => request('GET', `/stock/${id}`),
    setStock:    (id, size, qty) => request('PATCH', `/stock/${id}`, { size, quantity: qty }),
    getLowStock: () => request('GET', '/stock/alerts'),

    // Orders
    getOrders:     (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
      ).toString();
      return request('GET', '/orders' + (qs ? '?' + qs : ''));
    },
    getOrderStats: () => request('GET', '/orders/stats'),
    getOrder:      (id) => request('GET', `/orders/${id}`),
    updateStatus:  (id, status) => request('PATCH', `/orders/${id}/status`, { status })
  };
})();

// ================================================
// UTILS
// ================================================
function fmt(n) { return '$' + Number(n).toLocaleString('es-AR'); }

function statusLabel(s) {
  const map = {
    pending:   { label: 'Pendiente',   cls: 'badge-pending' },
    confirmed: { label: 'Confirmado',  cls: 'badge-confirmed' },
    preparing: { label: 'Preparando',  cls: 'badge-preparing' },
    delivered: { label: 'Entregado',   cls: 'badge-delivered' },
    cancelled: { label: 'Cancelado',   cls: 'badge-cancelled' }
  };
  return map[s] || { label: s, cls: '' };
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast show ' + (type === 'error' ? 'toast-error' : 'toast-success');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ================================================
// NAVIGATION
// ================================================
function switchSection(name) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === name);
  });
  document.querySelectorAll('.section').forEach(el => {
    el.classList.toggle('active', el.id === 'section-' + name);
  });
  const titles = {
    overview: 'Resumen',
    products: 'Productos',
    stock:    'Stock',
    orders:   'Pedidos'
  };
  document.getElementById('topbarTitle').textContent = titles[name] || name;

  if (name === 'overview') loadOverview();
  if (name === 'products') loadProducts();
  if (name === 'stock')    loadStockTable();
  if (name === 'orders')   loadOrders();

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ================================================
// OVERVIEW
// ================================================
async function loadOverview() {
  try {
    const [stats, orders, lowStock] = await Promise.all([
      ADMIN_API.getOrderStats(),
      ADMIN_API.getOrders({ limit: 5 }),
      ADMIN_API.getLowStock()
    ]);

    document.getElementById('statTotal').textContent   = stats.total ?? 0;
    document.getElementById('statPending').textContent = stats.pending ?? 0;
    document.getElementById('statToday').textContent   = stats.today ?? 0;
    document.getElementById('statRevenue').textContent = fmt(stats.revenue ?? 0);

    renderRecentOrders(Array.isArray(orders) ? orders : (orders.orders || orders));
    renderLowStockAlerts(lowStock);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function renderRecentOrders(orders) {
  const wrap = document.getElementById('recentOrdersWrap');
  if (!orders.length) {
    wrap.innerHTML = '<p class="empty-msg">Sin pedidos todavía.</p>';
    return;
  }
  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Fecha</th>
          <th>Total</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${orders.slice(0, 5).map(o => {
          const { label, cls } = statusLabel(o.status);
          const date = new Date(o.created_at).toLocaleDateString('es-AR');
          return `<tr>
            <td>#${o.id}</td>
            <td>${date}</td>
            <td>${fmt(o.total)}</td>
            <td><span class="badge ${cls}">${label}</span></td>
            <td><button class="btn-icon" onclick="openOrderModal(${o.id})" title="Ver"><i class="fas fa-eye"></i></button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function renderLowStockAlerts(items) {
  const wrap = document.getElementById('lowStockAlerts');
  if (!items.length) {
    wrap.innerHTML = '<p class="empty-msg" style="color:#16a34a"><i class="fas fa-check-circle"></i> Todo el stock está OK.</p>';
    return;
  }
  wrap.innerHTML = items.map(v => `
    <div class="alert-item">
      <span class="alert-prod">${escHtml(v.product_name)}</span>
      <span class="alert-size">Talle ${escHtml(v.size)}</span>
      <span class="alert-stock ${v.stock === 0 ? 'stock-zero' : 'stock-low'}">${v.stock} unid.</span>
    </div>`).join('');
}

// ================================================
// PRODUCTS
// ================================================
let _products = [];

async function loadProducts() {
  const wrap = document.getElementById('productsTableWrap');
  wrap.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
  try {
    _products = await ADMIN_API.getProducts();
    renderProductsTable();
  } catch (e) {
    wrap.innerHTML = `<p class="empty-msg error">${escHtml(e.message)}</p>`;
  }
}

function renderProductsTable() {
  const wrap = document.getElementById('productsTableWrap');
  if (!_products.length) {
    wrap.innerHTML = '<p class="empty-msg">Sin productos. ¡Cargá el primero!</p>';
    return;
  }
  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Foto</th>
          <th>Nombre</th>
          <th>Marca</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${_products.map(p => {
          const img = p.images?.find(i => i.is_primary) || p.images?.[0];
          const thumb = img
            ? `<img src="${escHtml(img.url)}" class="prod-thumb" alt="">`
            : `<div class="prod-thumb-placeholder" style="background:${escHtml(p.bg_gradient)}">${escHtml(p.emoji)}</div>`;
          return `<tr>
            <td>${thumb}</td>
            <td><strong>${escHtml(p.name)}</strong></td>
            <td>${escHtml(p.brand)}</td>
            <td>${escHtml(p.category)}</td>
            <td>${fmt(p.price)}</td>
            <td><span class="badge ${p.is_active ? 'badge-delivered' : 'badge-cancelled'}">${p.is_active ? 'Activo' : 'Inactivo'}</span></td>
            <td class="actions-cell">
              <button class="btn-icon" onclick="openEditProduct(${p.id})" title="Editar"><i class="fas fa-edit"></i></button>
              <button class="btn-icon" onclick="openImagesModal(${p.id})" title="Imágenes"><i class="fas fa-images"></i></button>
              <button class="btn-icon btn-danger" onclick="confirmDeleteProduct(${p.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ------------------------------------------------
// PRODUCT MODAL — variants & colors state
// ------------------------------------------------
let _variantRows  = [];  // [{size, stock}]
let _colorRows    = [];  // [{hex, name}]
let _pendingImages = []; // File objects selected but not yet uploaded

function openNewProduct() {
  _variantRows = [
    { size: 'XS', stock: 0 },
    { size: 'S',  stock: 0 },
    { size: 'M',  stock: 0 },
    { size: 'L',  stock: 0 },
    { size: 'XL', stock: 0 }
  ];
  _colorRows = [];
  _pendingImages = [];
  document.getElementById('productId').value       = '';
  document.getElementById('prodName').value        = '';
  document.getElementById('prodBrand').value       = 'Lady Fit';
  document.getElementById('prodCategory').value    = '';
  document.getElementById('prodBadge').value       = '';
  document.getElementById('prodPrice').value       = '';
  document.getElementById('prodOriginalPrice').value = '';
  document.getElementById('prodEmoji').value       = '🏃‍♀️';
  document.getElementById('prodBg').value          = 'linear-gradient(135deg,#1a1a1a,#333333)';
  document.getElementById('prodDesc').value        = '';
  document.getElementById('productModalTitle').textContent = 'Nuevo Producto';
  renderVariantsGrid();
  renderColorsGrid();
  renderPendingImages();
  document.getElementById('prodExistingImages').innerHTML = '';
  document.getElementById('productModal').classList.add('open');
}

async function openEditProduct(id) {
  try {
    const p = await ADMIN_API.getProduct(id);
    _variantRows = (p.variants || []).map(v => ({ size: v.size, stock: v.stock }));
    _colorRows   = (p.colors   || []).map(c => ({ hex: c.hex, name: c.name }));
    _pendingImages = [];

    document.getElementById('productId').value          = p.id;
    document.getElementById('prodName').value           = p.name;
    document.getElementById('prodBrand').value          = p.brand;
    document.getElementById('prodCategory').value       = p.category;
    document.getElementById('prodBadge').value          = p.badge || '';
    document.getElementById('prodPrice').value          = p.price;
    document.getElementById('prodOriginalPrice').value  = p.original_price || '';
    document.getElementById('prodEmoji').value          = p.emoji || '';
    document.getElementById('prodBg').value             = p.bg_gradient || '';
    document.getElementById('prodDesc').value           = p.description || '';
    document.getElementById('productModalTitle').textContent = 'Editar Producto';
    renderVariantsGrid();
    renderColorsGrid();
    renderPendingImages();
    renderProdExistingImages(p.images || []);
    document.getElementById('productModal').classList.add('open');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('open');
  _pendingImages = [];
}

function renderVariantsGrid() {
  document.getElementById('variantsGrid').innerHTML = _variantRows.map((v, i) => `
    <div class="variant-row">
      <span class="variant-size">${escHtml(v.size)}</span>
      <div class="stock-stepper">
        <button type="button" class="stepper-btn" onclick="stepStock(${i}, -1)">−</button>
        <input type="number" min="0" value="${v.stock}" onchange="updateVariantStock(${i}, this.value)" class="variant-stock-input">
        <button type="button" class="stepper-btn" onclick="stepStock(${i}, 1)">+</button>
      </div>
      <button type="button" class="btn-icon btn-danger" onclick="removeVariantRow(${i})"><i class="fas fa-times"></i></button>
    </div>`).join('');
}

function updateVariantStock(i, val) {
  _variantRows[i].stock = Math.max(0, parseInt(val) || 0);
}

function stepStock(i, delta) {
  _variantRows[i].stock = Math.max(0, (_variantRows[i].stock || 0) + delta);
  renderVariantsGrid();
}

function addVariantRow() {
  const input = document.getElementById('newSizeInput');
  const size  = input.value.trim().toUpperCase();
  if (!size) { input.focus(); return; }
  if (_variantRows.find(v => v.size === size)) {
    showToast('Ese talle ya existe', 'error'); return;
  }
  _variantRows.push({ size, stock: 0 });
  input.value = '';
  renderVariantsGrid();
}

function removeVariantRow(i) {
  _variantRows.splice(i, 1);
  renderVariantsGrid();
}

function renderColorsGrid() {
  document.getElementById('colorsGrid').innerHTML = _colorRows.map((c, i) => `
    <div class="color-editor-row">
      <input type="color" value="${c.hex || '#000000'}" onchange="updateColor(${i},'hex',this.value)" class="color-picker">
      <input type="text" value="${escHtml(c.name)}" placeholder="Nombre del color" onchange="updateColor(${i},'name',this.value)" class="color-name-input">
      <button type="button" class="btn-icon btn-danger" onclick="removeColorRow(${i})"><i class="fas fa-times"></i></button>
    </div>`).join('');
}

function updateColor(i, key, val) {
  _colorRows[i][key] = val;
}

function addColorRow() {
  _colorRows.push({ hex: '#000000', name: '' });
  renderColorsGrid();
}

function removeColorRow(i) {
  _colorRows.splice(i, 1);
  renderColorsGrid();
}

// ------------------------------------------------
// PRODUCT FORM — inline image upload
// ------------------------------------------------
function initProdUploadZone() {
  const zone  = document.getElementById('prodUploadZone');
  const input = document.getElementById('prodImageInput');
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    Array.from(e.dataTransfer.files).forEach(f => _pendingImages.push(f));
    renderPendingImages();
  });
  input.addEventListener('change', () => {
    Array.from(input.files).forEach(f => _pendingImages.push(f));
    renderPendingImages();
    input.value = '';
  });
}

function renderPendingImages() {
  const el = document.getElementById('prodPendingImages');
  if (!_pendingImages.length) { el.innerHTML = ''; return; }
  el.innerHTML = _pendingImages.map((f, i) => {
    const url = URL.createObjectURL(f);
    return `<div class="img-item">
      <img src="${url}" alt="">
      <button type="button" class="img-remove-btn" onclick="removePendingImage(${i})" title="Quitar">✕</button>
    </div>`;
  }).join('');
}

function removePendingImage(i) {
  _pendingImages.splice(i, 1);
  renderPendingImages();
}

function renderProdExistingImages(images) {
  const el = document.getElementById('prodExistingImages');
  if (!images.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<p class="form-sublabel">Fotos actuales</p>` + images.map(img => `
    <div class="image-row">
      <img src="${escHtml(img.url)}" alt="" class="image-preview">
      <div class="image-info">
        ${img.is_primary ? '<span class="badge badge-delivered">Principal</span>' : ''}
      </div>
      <div class="image-actions">
        ${!img.is_primary ? `<button type="button" class="btn-sm btn-outline" onclick="setProdPrimaryImage(${img.id})">Principal</button>` : ''}
        <button type="button" class="btn-sm btn-danger" onclick="deleteProdImage(${img.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

async function setProdPrimaryImage(imgId) {
  const id = document.getElementById('productId').value;
  if (!id) return;
  try {
    await ADMIN_API.setPrimaryImage(id, imgId);
    const p = await ADMIN_API.getProduct(id);
    renderProdExistingImages(p.images || []);
    loadProducts();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteProdImage(imgId) {
  const id = document.getElementById('productId').value;
  if (!id) return;
  if (!confirm('¿Eliminar esta imagen?')) return;
  try {
    await ADMIN_API.deleteImage(id, imgId);
    const p = await ADMIN_API.getProduct(id);
    renderProdExistingImages(p.images || []);
    loadProducts();
  } catch (e) { showToast(e.message, 'error'); }
}

async function saveProduct() {
  const id = document.getElementById('productId').value;
  const data = {
    name:           document.getElementById('prodName').value.trim(),
    brand:          document.getElementById('prodBrand').value.trim(),
    category:       document.getElementById('prodCategory').value,
    badge:          document.getElementById('prodBadge').value || null,
    price:          parseFloat(document.getElementById('prodPrice').value),
    original_price: parseFloat(document.getElementById('prodOriginalPrice').value) || null,
    emoji:          document.getElementById('prodEmoji').value.trim(),
    bg_gradient:    document.getElementById('prodBg').value.trim(),
    description:    document.getElementById('prodDesc').value.trim(),
    variants: _variantRows,
    colors:   _colorRows
  };

  const btn = document.getElementById('saveProductBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

  try {
    let productId;
    if (id) {
      await ADMIN_API.updateProduct(id, data);
      productId = parseInt(id);
    } else {
      const created = await ADMIN_API.createProduct(data);
      productId = created.id;
    }

    if (_pendingImages.length > 0) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo fotos...';
      for (const file of _pendingImages) {
        const fd = new FormData();
        fd.append('image', file);
        await ADMIN_API.uploadImage(productId, fd);
      }
      _pendingImages = [];
    }

    showToast(id ? 'Producto actualizado' : 'Producto creado');
    closeProductModal();
    loadProducts();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
  }
}

async function confirmDeleteProduct(id) {
  const p = _products.find(x => x.id === id);
  if (!confirm(`¿Eliminar "${p?.name || id}"? Esta acción no se puede deshacer.`)) return;
  try {
    await ADMIN_API.deleteProduct(id);
    showToast('Producto eliminado');
    loadProducts();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ================================================
// IMAGES MODAL
// ================================================
let _currentImageProductId = null;

async function openImagesModal(productId) {
  _currentImageProductId = productId;
  const p = _products.find(x => x.id === productId) || { name: 'Producto' };
  document.getElementById('imagesModalTitle').textContent = `Imágenes — ${p.name}`;
  document.getElementById('productImagesList').innerHTML  = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
  document.getElementById('imagesModal').classList.add('open');
  await refreshImages();
}

function closeImagesModal() {
  document.getElementById('imagesModal').classList.remove('open');
  _currentImageProductId = null;
}

async function refreshImages() {
  try {
    const p = await ADMIN_API.getProduct(_currentImageProductId);
    renderImagesList(p.images || []);
  } catch (e) {
    document.getElementById('productImagesList').innerHTML = `<p class="empty-msg error">${escHtml(e.message)}</p>`;
  }
}

function renderImagesList(images) {
  const el = document.getElementById('productImagesList');
  if (!images.length) {
    el.innerHTML = '<p class="empty-msg">Sin imágenes cargadas.</p>';
    return;
  }
  el.innerHTML = images.map(img => `
    <div class="image-row">
      <img src="${escHtml(img.url)}" alt="" class="image-preview">
      <div class="image-info">
        <span class="image-filename">${escHtml(img.filename)}</span>
        ${img.is_primary ? '<span class="badge badge-delivered">Principal</span>' : ''}
      </div>
      <div class="image-actions">
        ${!img.is_primary ? `<button class="btn-sm btn-outline" onclick="setPrimaryImage(${img.id})">Principal</button>` : ''}
        <button class="btn-sm btn-danger" onclick="deleteImage(${img.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

async function setPrimaryImage(imgId) {
  try {
    await ADMIN_API.setPrimaryImage(_currentImageProductId, imgId);
    showToast('Imagen principal actualizada');
    await refreshImages();
    loadProducts();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteImage(imgId) {
  if (!confirm('¿Eliminar esta imagen?')) return;
  try {
    await ADMIN_API.deleteImage(_currentImageProductId, imgId);
    showToast('Imagen eliminada');
    await refreshImages();
    loadProducts();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function initUploadZone() {
  const zone  = document.getElementById('uploadZone');
  const input = document.getElementById('imageFileInput');

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) uploadImage(file);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) uploadImage(input.files[0]);
    input.value = '';
  });
}

async function uploadImage(file) {
  if (!_currentImageProductId) return;
  const zone = document.getElementById('uploadZone');
  zone.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#d4812a"></i><p>Subiendo...</p>';
  try {
    const fd = new FormData();
    fd.append('image', file);
    await ADMIN_API.uploadImage(_currentImageProductId, fd);
    showToast('Imagen subida');
    await refreshImages();
    loadProducts();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    zone.innerHTML = `<i class="fas fa-cloud-upload-alt"></i>
      <p>Arrastrá una imagen o hacé clic para subir</p>
      <span>JPG, PNG, WebP — máx. 5MB</span>`;
  }
}

// ================================================
// STOCK
// ================================================
let _allStockRows = [];

async function loadStockTable() {
  const wrap = document.getElementById('stockTableWrap');
  wrap.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
  try {
    const products = await ADMIN_API.getProducts();
    _allStockRows = [];
    products.forEach(p => {
      (p.variants || []).forEach(v => {
        _allStockRows.push({ product_id: p.id, name: p.name, brand: p.brand, size: v.size, stock: v.stock });
      });
    });
    renderStockTable(_allStockRows);
  } catch (e) {
    wrap.innerHTML = `<p class="empty-msg error">${escHtml(e.message)}</p>`;
  }
}

function filterStockTable(query) {
  const q = query.toLowerCase();
  const filtered = _allStockRows.filter(r =>
    r.name.toLowerCase().includes(q) || r.brand.toLowerCase().includes(q)
  );
  renderStockTable(filtered);
}

function renderStockTable(rows) {
  const wrap = document.getElementById('stockTableWrap');
  if (!rows.length) {
    wrap.innerHTML = '<p class="empty-msg">Sin resultados.</p>';
    return;
  }
  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr><th>Producto</th><th>Marca</th><th>Talle</th><th>Stock</th><th>Acción</th></tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr id="stock-row-${r.product_id}-${escHtml(r.size)}">
            <td>${escHtml(r.name)}</td>
            <td>${escHtml(r.brand)}</td>
            <td><strong>${escHtml(r.size)}</strong></td>
            <td>
              <span class="stock-val ${r.stock === 0 ? 'stock-zero' : r.stock <= 3 ? 'stock-low' : ''}">
                ${r.stock}
              </span>
            </td>
            <td>
              <div class="stock-controls">
                <button class="btn-icon" onclick="adjustStockUI(${r.product_id},'${escHtml(r.size)}',-1)"><i class="fas fa-minus"></i></button>
                <input type="number" min="0" value="${r.stock}" class="stock-input"
                  id="stock-input-${r.product_id}-${escHtml(r.size)}"
                  onchange="setStockUI(${r.product_id},'${escHtml(r.size)}',this.value)">
                <button class="btn-icon" onclick="adjustStockUI(${r.product_id},'${escHtml(r.size)}',1)"><i class="fas fa-plus"></i></button>
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function adjustStockUI(productId, size, delta) {
  const inputEl = document.getElementById(`stock-input-${productId}-${size}`);
  const current = parseInt(inputEl?.value) || 0;
  const newQty  = Math.max(0, current + delta);
  await setStockUI(productId, size, newQty);
}

async function setStockUI(productId, size, qty) {
  const newQty = Math.max(0, parseInt(qty) || 0);
  try {
    await ADMIN_API.setStock(productId, size, newQty);
    const row = _allStockRows.find(r => r.product_id === productId && r.size === size);
    if (row) row.stock = newQty;
    const inputEl = document.getElementById(`stock-input-${productId}-${size}`);
    if (inputEl) inputEl.value = newQty;
    showToast(`Stock actualizado: ${size} → ${newQty}`);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ================================================
// ORDERS
// ================================================
async function loadOrders() {
  const wrap       = document.getElementById('ordersTableWrap');
  const statusFilter = document.getElementById('orderStatusFilter')?.value || '';
  wrap.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
  try {
    const data   = await ADMIN_API.getOrders({ status: statusFilter || undefined });
    const orders = Array.isArray(data) ? data : (data.orders || []);
    renderOrdersTable(orders);
  } catch (e) {
    wrap.innerHTML = `<p class="empty-msg error">${escHtml(e.message)}</p>`;
  }
}

function renderOrdersTable(orders) {
  const wrap = document.getElementById('ordersTableWrap');
  if (!orders.length) {
    wrap.innerHTML = '<p class="empty-msg">Sin pedidos con ese filtro.</p>';
    return;
  }
  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Cambiar estado</th>
          <th>Ver</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(o => {
          const { label, cls } = statusLabel(o.status);
          const date = new Date(o.created_at).toLocaleDateString('es-AR');
          return `<tr>
            <td>#${o.id}</td>
            <td>${date}</td>
            <td>${escHtml(o.customer_name || '—')}</td>
            <td>${fmt(o.total)}</td>
            <td><span class="badge ${cls}">${label}</span></td>
            <td>
              <select class="status-select" onchange="changeOrderStatus(${o.id}, this.value)" data-current="${o.status}">
                <option value="pending"   ${o.status === 'pending'   ? 'selected' : ''}>Pendiente</option>
                <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmado</option>
                <option value="preparing" ${o.status === 'preparing' ? 'selected' : ''}>Preparando</option>
                <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Entregado</option>
                <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
              </select>
            </td>
            <td>
              <button class="btn-icon" onclick="openOrderModal(${o.id})" title="Ver detalle">
                <i class="fas fa-eye"></i>
              </button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

async function changeOrderStatus(id, status) {
  try {
    await ADMIN_API.updateStatus(id, status);
    showToast('Estado actualizado');
    loadOrders();
    // Also refresh overview if visible
    if (document.getElementById('section-overview').classList.contains('active')) {
      loadOverview();
    }
  } catch (e) {
    showToast(e.message, 'error');
    loadOrders(); // re-render to revert select
  }
}

async function openOrderModal(id) {
  document.getElementById('orderModalTitle').textContent = `Pedido #${id}`;
  document.getElementById('orderModalBody').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
  document.getElementById('orderModal').classList.add('open');
  try {
    const o = await ADMIN_API.getOrder(id);
    const { label, cls } = statusLabel(o.status);
    const date = new Date(o.created_at).toLocaleString('es-AR');
    document.getElementById('orderModalBody').innerHTML = `
      <div class="order-detail">
        <div class="order-meta">
          <div><strong>Fecha:</strong> ${date}</div>
          <div><strong>Estado:</strong> <span class="badge ${cls}">${label}</span></div>
          ${o.customer_name  ? `<div><strong>Cliente:</strong> ${escHtml(o.customer_name)}</div>` : ''}
          ${o.customer_phone ? `<div><strong>Tel:</strong> ${escHtml(o.customer_phone)}</div>` : ''}
          ${o.notes ? `<div><strong>Notas:</strong> ${escHtml(o.notes)}</div>` : ''}
        </div>
        <table class="data-table" style="margin-top:1rem">
          <thead>
            <tr><th>Producto</th><th>Talle</th><th>Cant.</th><th>P.Unit.</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            ${(o.items || []).map(i => `
              <tr>
                <td>${escHtml(i.product_name)}</td>
                <td>${escHtml(i.size)}</td>
                <td>${i.quantity}</td>
                <td>${fmt(i.unit_price)}</td>
                <td>${fmt(i.unit_price * i.quantity)}</td>
              </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align:right;font-weight:700">Total</td>
              <td style="font-weight:700;color:#d4812a">${fmt(o.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  } catch (e) {
    document.getElementById('orderModalBody').innerHTML = `<p class="empty-msg error">${escHtml(e.message)}</p>`;
  }
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('open');
}

// ================================================
// INIT
// ================================================
async function init() {
  const token = localStorage.getItem('hs_admin_token');
  if (!token) { window.location.href = '/admin/'; return; }

  try {
    const admin = await ADMIN_API.me();
    document.getElementById('adminName').textContent  = admin.name  || 'Admin';
    document.getElementById('adminEmail').textContent = admin.email || '';
  } catch {
    localStorage.removeItem('hs_admin_token');
    localStorage.removeItem('hs_admin_user');
    window.location.href = '/admin/';
    return;
  }

  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      switchSection(el.dataset.section);
    });
  });

  // Mobile sidebar toggle
  const toggle  = document.getElementById('sidebarToggle');
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  toggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (!confirm('¿Cerrar sesión?')) return;
    localStorage.removeItem('hs_admin_token');
    localStorage.removeItem('hs_admin_user');
    window.location.href = '/admin/';
  });

  // New product button
  document.getElementById('btnNewProduct').addEventListener('click', openNewProduct);

  // Modal close on overlay click
  ['productModal', 'imagesModal', 'orderModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target.id === id) e.target.classList.remove('open');
    });
  });

  // Upload zones
  initUploadZone();
  initProdUploadZone();

  // Load initial view
  loadOverview();
}

document.addEventListener('DOMContentLoaded', init);
