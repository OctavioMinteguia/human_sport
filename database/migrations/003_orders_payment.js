exports.up = async function (knex) {
  await knex.schema.table('orders', (t) => {
    t.string('preference_id').nullable();
    t.string('payment_id').nullable();
    t.string('payment_status').nullable().defaultTo('pending');
  });
};

exports.down = async function (knex) {
  await knex.schema.table('orders', (t) => {
    t.dropColumn('preference_id');
    t.dropColumn('payment_id');
    t.dropColumn('payment_status');
  });
};
