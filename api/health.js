const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

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

app.use(cors(corsOptions));

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

// Connect to database
connectDB();

// Health check endpoint
app.get('/', async (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
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

// Export for Vercel
module.exports = app;