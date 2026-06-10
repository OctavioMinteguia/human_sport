exports.up = function (knex) {
  return knex.schema.createTable('bestsellers', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('badge').nullable();
    t.float('price').notNullable();
    t.string('image_filename').nullable();
    t.string('image_url').nullable();
    t.integer('sort_order').defaultTo(0);
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('bestsellers');
};
