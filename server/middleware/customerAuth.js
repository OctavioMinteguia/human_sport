const { readBearerToken, verifyToken } = require('../utils/token');

module.exports = function customerAuth(req, res, next) {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token requerido' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
  // Admin tokens are signed with the same secret; their id points to admin_users.
  if (payload.role !== 'customer') {
    return res.status(403).json({ success: false, error: 'Acceso denegado' });
  }
  req.customerId    = payload.id;
  req.customerEmail = payload.email;
  next();
};
