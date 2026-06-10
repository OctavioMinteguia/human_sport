const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 10000 }
});

module.exports = {
  preference: new Preference(client),
  payment:    new Payment(client),
  isSandbox:  () => (process.env.MP_ACCESS_TOKEN || '').startsWith('TEST-')
};
