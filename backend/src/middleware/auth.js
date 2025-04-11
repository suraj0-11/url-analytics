const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('[Auth Middleware] No token found');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('[Auth Middleware] Token received:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[Auth Middleware] Token decoded:', decoded);

    const user = await User.findById(decoded.id);
    console.log('[Auth Middleware] User found by ID:', user ? user._id : 'null');

    if (!user) {
      console.log('[Auth Middleware] User not found for decoded ID:', decoded.id);
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error verifying token:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth; 