const express = require('express');
const {
  getTestimonials,
  getFeaturedTestimonials,
  getTestimonialsAdmin,
  createTestimonial,
  updateTestimonial,
  toggleApprove,
  toggleFeature,
  deleteTestimonial
} = require('../controllers/testimonialController');
const requireAuth = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', getTestimonials);
router.get('/featured', getFeaturedTestimonials);

// Protected routes
router.use(requireAuth);
router.get('/admin', getTestimonialsAdmin);
router.post('/', createTestimonial);
router.put('/:id', updateTestimonial);
router.patch('/:id/approve', toggleApprove);
router.patch('/:id/feature', toggleFeature);

// Super-admin route
router.delete('/:id', requireSuperAdmin, deleteTestimonial);

module.exports = router;
