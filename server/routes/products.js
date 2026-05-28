const router  = require('express').Router();
const ctrl    = require('../controllers/ProductController');

router.get('/',    ctrl.list.bind(ctrl));
router.get('/:id', ctrl.getOne.bind(ctrl));

module.exports = router;
