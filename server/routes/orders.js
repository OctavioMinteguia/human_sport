const router = require('express').Router();
const ctrl   = require('../controllers/OrderController');

router.post('/', ctrl.create.bind(ctrl));

module.exports = router;
