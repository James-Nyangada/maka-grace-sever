const Setting = require('../models/settingModel');

// @desc    Get website settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await Setting.create({});
    }

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
};

// @desc    Update website settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();

    if (settings) {
      // Update existing
      settings.officeLocation = req.body.officeLocation || settings.officeLocation;
      settings.phoneNumber = req.body.phoneNumber || settings.phoneNumber;
      settings.contactPerson = req.body.contactPerson || settings.contactPerson;
      settings.emailAddress = req.body.emailAddress || settings.emailAddress;
      settings.workingHours = req.body.workingHours || settings.workingHours;

      const updatedSettings = await settings.save();
      res.status(200).json(updatedSettings);
    } else {
      // Create if it doesn't exist
      const newSettings = await Setting.create(req.body);
      res.status(201).json(newSettings);
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
