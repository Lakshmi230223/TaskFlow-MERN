
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// All routes in this file require login and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// GET all registered users (admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return res.json({
      message: 'Users retrieved successfully.',
      totalUsers: users.length,
      users
    });
  } catch (error) {
    console.error('Admin users error:', error.message);

    return res.status(500).json({
      message: 'Unable to retrieve users.'
    });
  }
});

// UPDATE a user's role (admin only)
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    // Validate the requested role
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Role must be user or admin.'
      });
    }

    // Prevent an admin from changing their own role
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        message: 'You cannot change your own role.'
      });
    }

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid user ID.'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    user.role = role;
    await user.save();

    return res.json({
      message: 'User role updated successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update user role error:', error.message);

    return res.status(500).json({
      message: 'Unable to update user role.'
    });
  }
});

// DELETE another user's account (admin only)
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate the user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID.'
      });
    }

    // Prevent an admin from deleting their own account here
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        message: 'You cannot delete your own account from the admin dashboard.'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    // Prevent deletion of the last admin account
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });

      if (adminCount <= 1) {
        return res.status(403).json({
          message: 'The last admin account cannot be deleted.'
        });
      }
    }

    // Delete all tasks belonging to this user
    await Task.deleteMany({ userId: user._id });

    // Delete the user's account
    await User.findByIdAndDelete(user._id);

    return res.json({
      message: 'User account and associated tasks deleted successfully.'
    });
  } catch (error) {
    console.error('Delete user account error:', error.message);

    return res.status(500).json({
      message: 'Unable to delete user account.'
    });
  }
});

// GET admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks
    ] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Task.countDocuments({ status: 'Pending' }),
      Task.countDocuments({ status: 'In Progress' }),
      Task.countDocuments({ status: 'Completed' })
    ]);

    return res.json({
      totalUsers,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error.message);

    return res.status(500).json({
      message: 'Unable to retrieve dashboard statistics.'
    });
  }
});

module.exports = router;
