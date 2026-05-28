const router       = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { upload }      = require('../middleware/upload');
const productCtrl  = require('../controllers/ProductController');
const stockCtrl    = require('../controllers/StockController');
const orderCtrl    = require('../controllers/OrderController');
const adminCtrl    = require('../controllers/AdminController');

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/login',           adminCtrl.login.bind(adminCtrl));
router.get( '/auth/me',  requireAuth, adminCtrl.me.bind(adminCtrl));
router.post('/auth/change-password', requireAuth, adminCtrl.changePassword.bind(adminCtrl));

// ── Settings ─────────────────────────────────────────────────────────────────
router.get( '/settings',         requireAuth, adminCtrl.getSettings.bind(adminCtrl));
router.put( '/settings/:key',    requireAuth, adminCtrl.updateSetting.bind(adminCtrl));

// ── Products ─────────────────────────────────────────────────────────────────
router.get(   '/products',                      requireAuth, productCtrl.list.bind(productCtrl));
router.get(   '/products/:id',                  requireAuth, productCtrl.getOne.bind(productCtrl));
router.post(  '/products',                      requireAuth, productCtrl.create.bind(productCtrl));
router.put(   '/products/:id',                  requireAuth, productCtrl.update.bind(productCtrl));
router.delete('/products/:id',                  requireAuth, productCtrl.remove.bind(productCtrl));

// Images
router.post(  '/products/:id/images',           requireAuth, upload.single('image'), productCtrl.uploadImage.bind(productCtrl));
router.delete('/products/:id/images/:imageId',  requireAuth, productCtrl.deleteImage.bind(productCtrl));
router.patch( '/products/:id/images/:imageId/primary', requireAuth, productCtrl.setPrimaryImage.bind(productCtrl));

// ── Stock ─────────────────────────────────────────────────────────────────────
router.get(  '/stock/alerts',      requireAuth, stockCtrl.getLowStock.bind(stockCtrl));
router.get(  '/stock/:id',         requireAuth, stockCtrl.getStock.bind(stockCtrl));
router.patch('/stock/:id',         requireAuth, stockCtrl.setStock.bind(stockCtrl));

// ── Orders ───────────────────────────────────────────────────────────────────
router.get(  '/orders',            requireAuth, orderCtrl.list.bind(orderCtrl));
router.get(  '/orders/stats',      requireAuth, orderCtrl.getStats.bind(orderCtrl));
router.get(  '/orders/:id',        requireAuth, orderCtrl.getOne.bind(orderCtrl));
router.patch('/orders/:id/status', requireAuth, orderCtrl.updateStatus.bind(orderCtrl));

module.exports = router;
