const jwt = require('jsonwebtoken');

// Admin and customer tokens share JWT_SECRET; the `role` claim tells them apart.
function signToken({ id, email, role }, expiresIn) {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET, { expiresIn });
}

// Returns the raw token from an `Authorization: Bearer <token>` header, or null.
function readBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Throws when the token is missing a valid signature or has expired.
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, readBearerToken, verifyToken };
