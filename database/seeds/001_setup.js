const bcrypt = require('bcryptjs');

const PRODUCTS = [
  {
    name: 'Musculosa + Short', brand: 'Lady Fit', category: 'conjuntos',
    price: 38000, original_price: null, badge: 'NUEVO',
    bg_gradient: 'linear-gradient(145deg,#2a1a1a,#3a2a2a)', emoji: '✨',
    image: '/img/IMG_2858.JPG.jpeg',
    colors: [{ hex: '#e8dcc8', name: 'Beige' }, { hex: '#d4798a', name: 'Rosa' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    name: 'Buzo Crop Hoodie', brand: 'Lady Fit', category: 'buzos',
    price: 45000, original_price: null, badge: 'NUEVO',
    bg_gradient: 'linear-gradient(145deg,#2a2010,#3a3020)', emoji: '🧥',
    image: '/img/IMG_2860.JPG.jpeg',
    colors: [{ hex: '#c8b08a', name: 'Beige' }],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    name: 'Conjunto Training Violeta', brand: 'Lady Fit', category: 'conjuntos',
    price: 52000, original_price: 65000, badge: 'OFERTA',
    bg_gradient: 'linear-gradient(145deg,#2d1a3a,#3a2050)', emoji: '✨',
    image: '/img/IMG_2861.JPG.jpeg',
    colors: [{ hex: '#6a3a8a', name: 'Violeta' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    name: 'Conjunto Running Gris/Rosa', brand: 'Lady Fit', category: 'conjuntos',
    price: 50000, original_price: null, badge: 'NUEVO',
    bg_gradient: 'linear-gradient(145deg,#1a1a1a,#2a2a2a)', emoji: '✨',
    image: '/img/IMG_2862.JPG.jpeg',
    colors: [{ hex: '#555555', name: 'Gris' }, { hex: '#e8609a', name: 'Rosa' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    name: 'Short Running Pro', brand: 'Lady Fit', category: 'shorts',
    price: 18000, original_price: null, badge: 'NUEVO',
    bg_gradient: 'linear-gradient(145deg,#1a2d3a,#0d1b2e)', emoji: '🩳',
    image: null,
    colors: [{ hex: '#1a1a1a', name: 'Negro' }, { hex: '#0d2a4a', name: 'Azul' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    name: 'Musculosa Mesh Performance', brand: 'Lady Fit', category: 'tops',
    price: 16000, original_price: null, badge: null,
    bg_gradient: 'linear-gradient(145deg,#2a1a2a,#4a2a4a)', emoji: '👚',
    image: null,
    colors: [{ hex: '#eeeeee', name: 'Blanco' }, { hex: '#e8b4c1', name: 'Rosa' }],
    sizes: ['XS', 'S', 'M', 'L']
  },
  {
    name: 'Calza Cintura Alta', brand: 'Lady Fit', category: 'calzas',
    price: 30000, original_price: 38000, badge: 'OFERTA',
    bg_gradient: 'linear-gradient(145deg,#2d1a3a,#1a1a3a)', emoji: '🩲',
    image: null,
    colors: [{ hex: '#1a1a1a', name: 'Negro' }, { hex: '#5c2800', name: 'Marrón' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    name: 'Campera Deportiva Zip', brand: 'Lady Fit', category: 'buzos',
    price: 55000, original_price: null, badge: 'NUEVO',
    bg_gradient: 'linear-gradient(145deg,#1a1a2d,#1a2d4a)', emoji: '🧥',
    image: null,
    colors: [{ hex: '#1a1a1a', name: 'Negro' }, { hex: '#0d1a3a', name: 'Navy' }],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    name: 'Conjunto Yoga Minimal', brand: 'Lady Fit', category: 'conjuntos',
    price: 42000, original_price: null, badge: null,
    bg_gradient: 'linear-gradient(145deg,#2a2a3a,#3a3a4a)', emoji: '🧘',
    image: null,
    colors: [{ hex: '#555555', name: 'Gris' }, { hex: '#1a3a3a', name: 'Verde petróleo' }],
    sizes: ['XS', 'S', 'M', 'L']
  },
  {
    name: 'Top Biker Fit', brand: 'Lady Fit', category: 'tops',
    price: 18000, original_price: null, badge: 'NUEVO',
    bg_gradient: 'linear-gradient(145deg,#2d1a1a,#4a2a2a)', emoji: '👙',
    image: null,
    colors: [{ hex: '#1a1a1a', name: 'Negro' }, { hex: '#6a0000', name: 'Rojo' }],
    sizes: ['XS', 'S', 'M', 'L']
  },
  {
    name: 'Short Ciclista Liso', brand: 'Lady Fit', category: 'shorts',
    price: 22000, original_price: 28000, badge: 'OFERTA',
    bg_gradient: 'linear-gradient(145deg,#1a2a1a,#2a4a2a)', emoji: '🩳',
    image: null,
    colors: [{ hex: '#1a1a1a', name: 'Negro' }, { hex: '#001a5c', name: 'Azul' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    name: 'Remera Oversize Sport', brand: 'Lady Fit', category: 'tops',
    price: 15000, original_price: null, badge: null,
    bg_gradient: 'linear-gradient(145deg,#1a1a1a,#2a2a2a)', emoji: '👕',
    image: null,
    colors: [{ hex: '#eeeeee', name: 'Blanco' }, { hex: '#1a1a1a', name: 'Negro' }],
    sizes: ['S', 'M', 'L', 'XL']
  }
];

exports.seed = async function (knex) {
  // Limpiar tablas en orden correcto
  await knex('order_items').del();
  await knex('orders').del();
  await knex('product_colors').del();
  await knex('product_images').del();
  await knex('product_variants').del();
  await knex('products').del();
  await knex('admin_users').del();
  await knex('settings').del();

  // Admin por defecto
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'humansport2025', 10);
  await knex('admin_users').insert({
    email: process.env.ADMIN_EMAIL || 'admin@humansport.com',
    password_hash: hash,
    name: 'Octavio'
  });

  // Settings iniciales
  await knex('settings').insert([
    { key: 'whatsapp_number', value: '5492346581240' },
    { key: 'instagram_handle', value: 'humansportchivilcoy' },
    { key: 'store_name', value: 'Human Sport' },
    { key: 'low_stock_threshold', value: '3' }
  ]);

  // Insertar productos con variantes, colores e imágenes
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];

    const [productId] = await knex('products').insert({
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      original_price: p.original_price,
      badge: p.badge,
      bg_gradient: p.bg_gradient,
      emoji: p.emoji,
      is_active: true,
      sort_order: i
    });

    // Variantes con stock inicial de 10 unidades por talle
    for (const size of p.sizes) {
      await knex('product_variants').insert({
        product_id: productId,
        size,
        stock: 10
      });
    }

    // Colores
    for (const color of p.colors) {
      await knex('product_colors').insert({
        product_id: productId,
        hex: color.hex,
        name: color.name
      });
    }

    // Imagen principal si existe
    if (p.image) {
      await knex('product_images').insert({
        product_id: productId,
        filename: p.image.split('/').pop(),
        url: p.image,
        is_primary: true,
        sort_order: 0
      });
    }
  }

  console.log('✓ Seed completado: 12 productos, 1 admin, settings iniciales');
};
