const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get the JWT token from the HTTP-only cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required. Please log in.'
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user associated with this token
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'User not found. Please log in again.'
      });
    }

    // Attach the user to the request
    req.user = user;

    // Continue to the next middleware or route
    next();

  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired session. Please log in again.'
    });
  }
};

module.exports = authMiddleware;
