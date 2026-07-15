const express = require('express');
const {
  getPackages,
  getFeaturedPackages,
  getPackageBySlug,
  getPackageByIdAdmin,
  createPackage,
  updatePackage,
  togglePackageActive,
  togglePackageFeature,
  incrementPackageView,
  deletePackage,
  getAllPackagesAdmin
} = require('../controllers/packageController');
const requireAuth = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', getPackages);
router.get('/featured', getFeaturedPackages);
router.get('/:slug', getPackageBySlug);
router.patch('/:id/view', incrementPackageView);

// Protected routes
router.use(requireAuth);
router.get('/admin/all', getAllPackagesAdmin); // Admin listing
router.get('/:id/admin', getPackageByIdAdmin);
router.post('/', createPackage);
router.put('/:id', updatePackage);
router.patch('/:id/toggle', togglePackageActive);
router.patch('/:id/feature', togglePackageFeature);

// Super-admin routes
router.delete('/:id', requireSuperAdmin, deletePackage);

module.exports = router;
