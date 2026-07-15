const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Access denied. Super-admin role required.' });
  }
  next();
};

const requireAdminOrSuperAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

module.exports = {
  requireSuperAdmin,
  requireAdminOrSuperAdmin
};