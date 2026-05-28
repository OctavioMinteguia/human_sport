const authService  = require('../services/AuthService');
const adminRepo    = require('../repositories/AdminRepository');

class AdminController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async me(req, res, next) {
    try {
      res.json({ success: true, data: { id: req.admin.id, email: req.admin.email } });
    } catch (err) { next(err); }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.admin.id, currentPassword, newPassword);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getSettings(req, res, next) {
    try {
      const settings = await adminRepo.getAllSettings();
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  }

  async updateSetting(req, res, next) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      await adminRepo.setSetting(key, value);
      res.json({ success: true, data: { key, value } });
    } catch (err) { next(err); }
  }
}

module.exports = new AdminController();
