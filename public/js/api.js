/* ================================================
   Human Sport — API Client
   Centraliza todas las llamadas al backend.
   ================================================ */
const API = (() => {
  const BASE = '/api';

  async function request(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
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
    createOrder: (data) => request('POST', '/orders', data)
  };
})();
