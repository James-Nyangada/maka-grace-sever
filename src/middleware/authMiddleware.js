const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authorization.split(' ')[1];

  try {
    const { _id } = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await User.findById(_id).select('-password');
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    if (!req.user.isActive) {
      return res.status(401).json({ error: 'User account is deactivated' });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

module.exports = requireAuth;