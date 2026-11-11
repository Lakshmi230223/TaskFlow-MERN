
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

require('dotenv').config();


const taskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'TaskFlow backend is running!' });
});

// Start server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Startup error:', error.message);
    process.exit(1);
  }
}

startServer();
