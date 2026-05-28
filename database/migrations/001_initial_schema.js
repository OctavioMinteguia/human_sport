exports.up = function (knex) {
  return knex.schema
    .createTable('products', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.string('brand').notNullable().defaultTo('Lady Fit');
      t.string('category').notNullable();
      t.text('description').defaultTo('');
      t.float('price').notNullable();
      t.float('original_price').nullable();
      t.string('badge').nullable();
      t.string('bg_gradient').nullable();
      t.string('emoji').defaultTo('✨');
      t.boolean('is_active').defaultTo(true);
      t.integer('sort_order').defaultTo(0);
      t.timestamps(true, true);
    })
    .createTable('product_variants', (t) => {
      t.increments('id').primary();
      t.integer('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.string('size').notNullable();
      t.integer('stock').notNullable().defaultTo(0);
      t.unique(['product_id', 'size']);
    })
    .createTable('product_images', (t) => {
      t.increments('id').primary();
      t.integer('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.string('filename').notNullable();
      t.string('url').notNullable();
      t.boolean('is_primary').defaultTo(false);
      t.integer('sort_order').defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('product_colors', (t) => {
      t.increments('id').primary();
      t.integer('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.string('hex').notNullable();
      t.string('name').nullable();
    })
    .createTable('orders', (t) => {
      t.increments('id').primary();
      t.string('customer_name').nullable();
      t.string('customer_phone').nullable();
      t.float('total').notNullable();
      t.string('status').notNullable().defaultTo('pending');
      t.text('notes').nullable();
      t.boolean('whatsapp_sent').defaultTo(false);
      t.timestamps(true, true);
    })
    .createTable('order_items', (t) => {
      t.increments('id').primary();
      t.integer('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
      t.integer('product_id').nullable().references('id').inTable('products');
      t.string('product_name').notNullable();
      t.string('brand').nullable();
      t.string('size').notNullable();
      t.integer('quantity').notNullable().defaultTo(1);
      t.float('unit_price').notNullable();
    })
    .createTable('admin_users', (t) => {
      t.increments('id').primary();
      t.string('email').unique().notNullable();
      t.string('password_hash').notNullable();
      t.string('name').defaultTo('Admin');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('settings', (t) => {
      t.string('key').primary();
      t.text('value').nullable();
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('settings')
    .dropTableIfExists('admin_users')
    .dropTableIfExists('order_items')
    .dropTableIfExists('orders')
    .dropTableIfExists('product_colors')
    .dropTableIfExists('product_images')
    .dropTableIfExists('product_variants')
    .dropTableIfExists('products');
};
