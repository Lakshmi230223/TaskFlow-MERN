const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const validStatuses = ['Pending', 'In Progress', 'Completed'];

function formatTask(task) {
  const data = task.toObject ? task.toObject() : { ...task };

  if (!data.status) {
    data.status = data.completed ? 'Completed' : 'Pending';
  }

  return data;
}

// Protect all routes below this middleware
router.use(authMiddleware);

// 1. CREATE a task
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        message: 'Task title is required',
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      priority,
      dueDate: dueDate || null,
      status: 'Pending',
      completed: false,
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
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
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
      return res.status(400).json({ message: 'Invalid task ID' });
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

    if (
      Object.prototype.hasOwnProperty.call(updates, 'title') &&
      (typeof updates.title !== 'string' || !updates.title.trim())
    ) {
      return res.status(400).json({
        message: 'Task title cannot be empty',
      });
    }

    if (typeof updates.title === 'string') {
      updates.title = updates.title.trim();
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, 'description') &&
      typeof updates.description !== 'string'
    ) {
      return res.status(400).json({
        message: 'Description must be a string',
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, 'status') &&
      !validStatuses.includes(updates.status)
    ) {
      return res.status(400).json({
        message: 'Invalid task status',
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, 'completed') &&
      typeof updates.completed !== 'boolean'
    ) {
      return res.status(400).json({
        message: 'Completed must be true or false',
      });
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
      updates.completed = updates.status === 'Completed';
    } else if (Object.prototype.hasOwnProperty.call(updates, 'completed')) {
      updates.status = updates.completed ? 'Completed' : 'Pending';
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
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
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;