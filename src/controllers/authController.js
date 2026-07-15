const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is deactivated' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = createToken(user._id);
    
    // Convert to object to safely remove password via toJSON transform
    const userObj = user.toJSON();

    res.status(200).json({ email: userObj.email, role: userObj.role, name: userObj.name, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current user
const me = async (req, res) => {
  res.status(200).json(req.user);
};

// Change Password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout
const logoutUser = async (req, res) => {
  // Stateless logout, client removes token
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  loginUser,
  me,
  changePassword,
  logoutUser
};