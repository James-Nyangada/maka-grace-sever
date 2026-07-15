const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const requireAuth = require('../middleware/authMiddleware');
const { requireAdminOrSuperAdmin } = require('../middleware/roleMiddleware');

router.route('/')
  .get(getSettings)
  .put(requireAuth, requireAdminOrSuperAdmin, updateSettings);

module.exports = router;
