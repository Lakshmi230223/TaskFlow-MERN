
function adminMiddleware(req, res, next) {
  // Check whether the user is logged in
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required.'
    });
  }

  // Check whether the user has admin privileges
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied. Admin privileges required.'
    });
  }

  // Allow admin to continue
  next();
}

module.exports = adminMiddleware;
