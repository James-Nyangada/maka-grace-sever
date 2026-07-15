const express = require('express');
const { loginUser, me, changePassword, logoutUser } = require('../controllers/authController');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginUser);
router.post('/logout', logoutUser);

router.use(requireAuth);
router.get('/me', me);
router.put('/change-password', changePassword);

module.exports = router;