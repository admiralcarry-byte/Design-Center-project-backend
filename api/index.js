const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('../routes/auth');
const templateRoutes = require('../routes/templates');
const brandKitRoutes = require('../routes/brandKit');
const canvaRoutes = require('../routes/canva');

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'https://turbo-enigma-frontend.vercel.app',
    'https://turbo-enigma-frontend-bydm.vercel.app',
    'https://turbo-enigma-jw51.vercel.app',
    'https://turbo-enigma.vercel.app',
    'https://turbo-enigma-frontend-sq3h.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center';
    console.log('🔌 Connecting to MongoDB:', mongoURI.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(mongoURI);
    
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
console.log("index");
// Connect to database
connectDB();

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
    version: '1.0.1',
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

// Export for Vercel
module.exports = app;
