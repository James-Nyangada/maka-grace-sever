const express = require('express');
const {
  createBooking,
  getBookings,
  exportBookings,
  getBookingById,
  updateBookingStatus,
  updateBookingNotes,
  updateBooking,
  sendBookingEmail,
  deleteBooking
} = require('../controllers/bookingController');
const requireAuth = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public route
router.post('/', createBooking);

// Protected routes
router.use(requireAuth);
router.get('/', getBookings);
router.get('/export', exportBookings);
router.get('/:id', getBookingById);
router.put('/:id', updateBooking);
router.put('/:id/status', updateBookingStatus);
router.put('/:id/notes', updateBookingNotes);
router.post('/:id/email', sendBookingEmail);

// Super-admin route
router.delete('/:id', requireSuperAdmin, deleteBooking);

module.exports = router;
