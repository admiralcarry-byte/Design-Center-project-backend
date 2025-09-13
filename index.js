const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const corsMiddleware = require('./middleware/cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const templateRoutes = require('./routes/templates');
const brandKitRoutes = require('./routes/brandKit');
const canvaRoutes = require('./routes/canva');

const app = express();
const PORT = process.env.PORT || 4000;



app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center';
    console.log('🔌 Connecting to MongoDB:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    await mongoose.connect(mongoURI, {
      // Core connection options
      useNewUrlParser: true,
      useUnifiedTopology: true,

      // Timeouts (tweak based on your app/network)
      connectTimeoutMS: 100000,  // 100s max to initially connect
      socketTimeoutMS: 450000,   // 450s max inactivity before close

      // Retry logic
      serverSelectionTimeoutMS: 500000, // Stop trying after 500s if no server
      heartbeatFrequencyMS: 1000000,    // Keep connection alive with pings
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('🔍 Connected to database:', mongoose.connection.db?.databaseName);
    console.log('🔍 Connection host:', mongoose.connection.host);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Database connection failed in production, but continuing...');
    } else {
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// Add error handling for unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});

// Add error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/brand-kit', brandKitRoutes);
app.use('/api/canva', canvaRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'RedDragon Backend API', 
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      templates: '/api/templates',
      auth: '/api/auth',
      brandKit: '/api/brand-kit',
      canva: '/api/canva'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/api/health`);
});
