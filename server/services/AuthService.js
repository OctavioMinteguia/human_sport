const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const adminRepo = require('../repositories/AdminRepository');
const AppError  = require('../utils/AppError');

class AuthService {
  async login(email, password) {
    if (!email || !password) throw new AppError('Email y contraseña requeridos');

    const user = await adminRepo.findByEmail(email);
    if (!user) throw new AppError('Credenciales inválidas', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Credenciales inválidas', 401);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name }
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await adminRepo.findById(userId);
    if (!user) throw new AppError('Usuario no encontrado', 404);

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new AppError('Contraseña actual incorrecta', 401);

    const hash = await bcrypt.hash(newPassword, 10);
    const db   = require('../config/database');
    await db('admin_users').where({ id: userId }).update({ password_hash: hash });
    return { message: 'Contraseña actualizada correctamente' };
  }
}

module.exports = new AuthService();
