const router = require('express').Router();
const ctrl   = require('../controllers/BestsellerController');

router.get('/', ctrl.list.bind(ctrl));

module.exports = router;
