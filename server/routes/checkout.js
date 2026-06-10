const router = require('express').Router();
const ctrl   = require('../controllers/CheckoutController');

router.post('/',                    ctrl.createPreference.bind(ctrl));
router.post('/webhook/mercadopago', ctrl.webhook.bind(ctrl));

module.exports = router;
