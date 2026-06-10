exports.up = async function (knex) {
  await knex.schema.createTable('customers', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.string('phone').nullable();
    t.timestamps(true, true);
  });

  await knex.schema.table('orders', (t) => {
    t.integer('customer_id').unsigned().nullable().references('id').inTable('customers').onDelete('SET NULL');
    t.string('customer_email').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.table('orders', (t) => {
    t.dropColumn('customer_id');
    t.dropColumn('customer_email');
  });
  await knex.schema.dropTableIfExists('customers');
};
