/* ================================================
   Human Sport — API Client
   Centraliza todas las llamadas al backend.
   ================================================ */
const API = (() => {
  const BASE = '/api';

  function getToken() { return localStorage.getItem('hs_token') || null; }

  async function request(method, path, body, withAuth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (withAuth) {
      const t = getToken();
      if (t) headers['Authorization'] = 'Bearer ' + t;
    }
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    const json = await res.json().catch(() => ({ success: false, error: res.statusText }));
    if (!json.success) throw new Error(json.error || 'Error desconocido');
    return json.data;
  }

  return {
    // Productos (público)
    getProducts: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
      ).toString();
      return request('GET', '/products' + (qs ? '?' + qs : ''));
    },
    getProduct: (id) => request('GET', `/products/${id}`),

    // Pedidos (público — registra el checkout de WhatsApp)
    createOrder: (data) => request('POST', '/orders', data),

    // Más vendidos (público)
    getBestsellers: () => request('GET', '/bestsellers'),

    // Checkout MercadoPago (envía token si está logueado)
    createPreference: (cartItems) => request('POST', '/checkout', { items: cartItems }, true),

    // Auth
    authRegister: (data)  => request('POST', '/auth/register', data),
    authLogin:    (data)  => request('POST', '/auth/login', data),
    getMyProfile:  ()     => request('GET',   '/auth/me',        null, true),
    updateProfile: (data) => request('PATCH', '/auth/profile',   data, true),
    getMyOrders:   ()     => request('GET',   '/auth/my-orders', null, true)
  };
})();
