const router = require('express').Router();
const ctrl   = require('../controllers/AuthController');
const auth   = require('../middleware/customerAuth');
const { customerLoginLimiter } = require('../middleware/rateLimit');

router.post('/register', ctrl.register.bind(ctrl));
router.post('/login',    customerLoginLimiter, ctrl.login.bind(ctrl));
router.get('/me',        auth, ctrl.getProfile.bind(ctrl));
router.patch('/profile',   auth, ctrl.updateProfile.bind(ctrl));
router.get('/my-orders',  auth, ctrl.getMyOrders.bind(ctrl));

module.exports = router;
