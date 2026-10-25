
const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');

const router = express.Router();

// 1. CREATE a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        message: 'Task title is required',
      });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate: dueDate || null,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 2. READ all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. READ one task by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. UPDATE a task
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const allowedFields = [
      'title',
      'description',
      'completed',
      'priority',
      'dueDate',
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
      Object.prototype.hasOwnProperty.call(updates, 'completed') &&
      typeof updates.completed !== 'boolean'
    ) {
      return res.status(400).json({
        message: 'Completed must be true or false',
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 5. DELETE a task
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
