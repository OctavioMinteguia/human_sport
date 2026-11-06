const AppError = require('../utils/AppError');
const { readBearerToken, verifyToken } = require('../utils/token');

// Admin-only routes. Customer tokens share the same secret, so the role claim
// is what separates them: anything that is not an admin token gets 403.
function requireAuth(req, res, next) {
  const token = readBearerToken(req);
  if (!token) return next(new AppError('Token requerido', 401));

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(new AppError('Token inválido o expirado', 401));
  }
  if (payload.role !== 'admin') return next(new AppError('Acceso denegado', 403));

  req.admin = payload;
  next();
}

module.exports = { requireAuth };
