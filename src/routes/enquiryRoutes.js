const express = require('express');
const {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  toggleEnquiryRead,
  deleteEnquiry
} = require('../controllers/enquiryController');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

// Public route
router.post('/', createEnquiry);

// Protected routes
router.use(requireAuth);
router.get('/', getEnquiries);
router.get('/:id', getEnquiryById);
router.patch('/:id/read', toggleEnquiryRead);
router.delete('/:id', deleteEnquiry);

module.exports = router;
