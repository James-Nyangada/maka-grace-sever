const express = require('express');
const { getAnalyticsOverview, getTrafficVsConversions, getTopPackages } = require('../controllers/analyticsController');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/overview', getAnalyticsOverview);
router.get('/traffic-vs-conversions', getTrafficVsConversions);
router.get('/top-packages', getTopPackages);

module.exports = router;
