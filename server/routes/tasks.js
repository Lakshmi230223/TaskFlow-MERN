
const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const validStatuses = ['Pending', 'In Progress', 'Completed'];
const validPriorities = ['Low', 'Medium', 'High'];

function formatTask(task) {
  const data = task.toObject ? task.toObject() : { ...task };

  // Keep the completed field consistent with the task status.
  data.completed = data.status === 'Completed';

  return data;
}

// Protect all routes below this middleware.
router.use(authMiddleware);

// 1. CREATE a task
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate, status } = req.body;

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        message: 'Task title is required',
      });
    }

    const taskStatus = status || 'Pending';

    if (!validStatuses.includes(taskStatus)) {
      return res.status(400).json({
        message: 'Invalid task status',
      });
    }

    const taskPriority = priority || 'Medium';

    if (!validPriorities.includes(taskPriority)) {
      return res.status(400).json({
        message: 'Invalid task priority',
      });
    }

    if (
      description !== undefined &&
      typeof description !== 'string'
    ) {
      return res.status(400).json({
        message: 'Description must be a string',
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || '',
      priority: taskPriority,
      dueDate: dueDate || null,
      status: taskStatus,
      completed: taskStatus === 'Completed',
      userId: req.user._id,
    });

    res.status(201).json(formatTask(task));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 2. READ all tasks belonging to the logged-in user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json(tasks.map(formatTask));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. READ one task belonging to the logged-in user
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid task ID',
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    res.status(200).json(formatTask(task));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. UPDATE a task belonging to the logged-in user
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid task ID',
      });
    }

    const allowedFields = [
      'title',
      'description',
      'priority',
      'dueDate',
      'status',
      'completed',
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid fields provided for update',
      });
    }

    // Validate title
    if (Object.prototype.hasOwnProperty.call(updates, 'title')) {
      if (
        typeof updates.title !== 'string' ||
        !updates.title.trim()
      ) {
        return res.status(400).json({
          message: 'Task title cannot be empty',
        });
      }

      updates.title = updates.title.trim();
    }

    // Validate description
    if (
      Object.prototype.hasOwnProperty.call(updates, 'description') &&
      typeof updates.description !== 'string'
    ) {
      return res.status(400).json({
        message: 'Description must be a string',
      });
    }

    // Validate priority
    if (
      Object.prototype.hasOwnProperty.call(updates, 'priority') &&
      !validPriorities.includes(updates.priority)
    ) {
      return res.status(400).json({
        message: 'Invalid task priority',
      });
    }

    // Validate status
    if (
      Object.prototype.hasOwnProperty.call(updates, 'status') &&
      !validStatuses.includes(updates.status)
    ) {
      return res.status(400).json({
        message: 'Invalid task status',
      });
    }

    // Validate completed
    if (
      Object.prototype.hasOwnProperty.call(updates, 'completed') &&
      typeof updates.completed !== 'boolean'
    ) {
      return res.status(400).json({
        message: 'Completed must be true or false',
      });
    }

    // Keep status and completed synchronized.
    // If both are supplied, status takes priority.
    if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
      updates.completed = updates.status === 'Completed';
    } else if (
      Object.prototype.hasOwnProperty.call(updates, 'completed')
    ) {
      updates.status = updates.completed
        ? 'Completed'
        : 'Pending';
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    res.status(200).json(formatTask(task));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 5. DELETE a task belonging to the logged-in user
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid task ID',
      });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    res.status(200).json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
