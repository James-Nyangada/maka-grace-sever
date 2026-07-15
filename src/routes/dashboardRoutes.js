const express = require('express');
const { getStats, getRecent } = require('../controllers/dashboardController');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/stats', getStats);
router.get('/recent', getRecent);

module.exports = router;
