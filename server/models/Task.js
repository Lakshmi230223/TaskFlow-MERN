
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Kept for compatibility with existing functionality.
    completed: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },

    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Keep status and completed fields synchronized.
taskSchema.pre('validate', function () {
  if (this.isModified('status')) {
    this.completed = this.status === 'Completed';
  } else if (this.isModified('completed')) {
    this.status = this.completed ? 'Completed' : 'Pending';
  }
});

module.exports = mongoose.model('Task', taskSchema);
