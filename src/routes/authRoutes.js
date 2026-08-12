const express = require('express');
const { loginUser, me, changePassword, forgotPassword, resetPassword, logoutUser } = require('../controllers/authController');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logoutUser);

router.use(requireAuth);
router.get('/me', me);
router.put('/change-password', changePassword);

module.exports = router;