const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import the BrandKit model
const BrandKit = require('../models/BrandKit');

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'https://turbo-enigma-frontend.vercel.app',
    'https://turbo-enigma-frontend-bydm.vercel.app',
    'https://turbo-enigma-jw51.vercel.app',
    'https://turbo-enigma.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Database connection
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Auth middleware
const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/brand-kit/test - Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Brand kit API is working' });
});

// GET /api/brand-kit/test-auth - Test auth endpoint
app.get('/test-auth', auth, async (req, res) => {
  res.json({
    success: true,
    message: 'Auth working',
    user: req.user
  });
});

// GET /api/brand-kit - Get brand kit for authenticated user
app.get('/', auth, async (req, res) => {
  try {
    await connectDB();
    
    const brandKit = await BrandKit.getByUserId(req.user.userId);
    
    if (!brandKit) {
      // Return default brand kit if none exists
      return res.json({
        success: true,
        brandKit: {
          primaryColor: '#00525b',
          secondaryColor: '#01aac7',
          accentColor: '#32e0c5',
          logo: null,
          fonts: [],
          customElements: []
        }
      });
    }

    res.json({
      success: true,
      brandKit: {
        id: brandKit._id,
        primaryColor: brandKit.primaryColor,
        secondaryColor: brandKit.secondaryColor,
        accentColor: brandKit.accentColor,
        logo: brandKit.logo ? {
          data: brandKit.logo.data,
          filename: brandKit.logo.filename,
          mimetype: brandKit.logo.mimetype,
          size: brandKit.logo.size
        } : null,
        fonts: brandKit.fonts || [],
        customElements: brandKit.customElements || []
      }
    });
  } catch (error) {
    console.error('Error fetching brand kit:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brand kit',
      error: error.message
    });
  }
});

// PUT /api/brand-kit - Update brand kit for authenticated user
app.put('/', auth, async (req, res) => {
  try {
    await connectDB();
    
    const { primaryColor, secondaryColor, accentColor, logo, fonts, customElements } = req.body;
    
    const updateData = {};
    
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;
    if (accentColor !== undefined) updateData.accentColor = accentColor;
    if (logo !== undefined) updateData.logo = logo;
    if (fonts !== undefined) updateData.fonts = fonts;
    if (customElements !== undefined) updateData.customElements = customElements;

    const brandKit = await BrandKit.updateByUserId(req.user.userId, updateData);

    res.json({
      success: true,
      message: 'Brand kit updated successfully',
      brandKit: {
        id: brandKit._id,
        primaryColor: brandKit.primaryColor,
        secondaryColor: brandKit.secondaryColor,
        accentColor: brandKit.accentColor,
        logo: brandKit.logo ? {
          data: brandKit.logo.data,
          filename: brandKit.logo.filename,
          mimetype: brandKit.logo.mimetype,
          size: brandKit.logo.size
        } : null,
        fonts: brandKit.fonts || [],
        customElements: brandKit.customElements || []
      }
    });
  } catch (error) {
    console.error('Error updating brand kit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating brand kit',
      error: error.message
    });
  }
});

// PATCH /api/brand-kit - Update specific brand kit properties
app.patch('/', auth, async (req, res) => {
  try {
    await connectDB();
    
    const updateData = {};
    
    // Only update provided fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    const brandKit = await BrandKit.updateByUserId(req.user.userId, updateData);

    res.json({
      success: true,
      message: 'Brand kit updated successfully',
      brandKit: {
        id: brandKit._id,
        primaryColor: brandKit.primaryColor,
        secondaryColor: brandKit.secondaryColor,
        accentColor: brandKit.accentColor,
        logo: brandKit.logo ? {
          data: brandKit.logo.data,
          filename: brandKit.logo.filename,
          mimetype: brandKit.logo.mimetype,
          size: brandKit.logo.size
        } : null,
        fonts: brandKit.fonts || [],
        customElements: brandKit.customElements || []
      }
    });
  } catch (error) {
    console.error('Error patching brand kit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating brand kit',
      error: error.message
    });
  }
});

// DELETE /api/brand-kit - Delete brand kit (reset to defaults)
app.delete('/', auth, async (req, res) => {
  try {
    await connectDB();
    
    await BrandKit.findOneAndDelete({ userId: req.user.userId });
    
    res.json({
      success: true,
      message: 'Brand kit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting brand kit:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting brand kit',
      error: error.message
    });
  }
});

// GET /api/brand-kit/logo - Get brand kit logo only
app.get('/logo', auth, async (req, res) => {
  try {
    await connectDB();
    
    const brandKit = await BrandKit.getByUserId(req.user.userId);
    
    if (!brandKit || !brandKit.logo) {
      return res.json({
        success: true,
        logo: null
      });
    }

    res.json({
      success: true,
      logo: {
        data: brandKit.logo.data,
        filename: brandKit.logo.filename,
        mimetype: brandKit.logo.mimetype,
        size: brandKit.logo.size
      }
    });
  } catch (error) {
    console.error('Error fetching brand kit logo:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brand kit logo',
      error: error.message
    });
  }
});

// POST /api/brand-kit/logo - Upload brand kit logo
app.post('/logo', auth, async (req, res) => {
  try {
    await connectDB();
    
    const { logo } = req.body;
    
    if (!logo) {
      return res.status(400).json({
        success: false,
        message: 'Logo data is required'
      });
    }

    const updateData = { logo };
    const brandKit = await BrandKit.updateByUserId(req.user.userId, updateData);

    res.json({
      success: true,
      message: 'Logo updated successfully',
      logo: {
        data: brandKit.logo.data,
        filename: brandKit.logo.filename,
        mimetype: brandKit.logo.mimetype,
        size: brandKit.logo.size
      }
    });
  } catch (error) {
    console.error('Error updating brand kit logo:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating brand kit logo',
      error: error.message
    });
  }
});

// POST /api/brand-kit/colors - Update brand kit colors
app.post('/colors', auth, async (req, res) => {
  try {
    await connectDB();
    
    const { primaryColor, secondaryColor, accentColor } = req.body;
    
    const updateData = {};
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;
    if (accentColor !== undefined) updateData.accentColor = accentColor;

    const brandKit = await BrandKit.updateByUserId(req.user.userId, updateData);

    res.json({
      success: true,
      message: 'Colors updated successfully',
      colors: {
        primaryColor: brandKit.primaryColor,
        secondaryColor: brandKit.secondaryColor,
        accentColor: brandKit.accentColor
      }
    });
  } catch (error) {
    console.error('Error updating brand kit colors:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating brand kit colors',
      error: error.message
    });
  }
});

// POST /api/brand-kit/fonts - Update brand kit fonts
app.post('/fonts', auth, async (req, res) => {
  try {
    await connectDB();
    
    const { fonts } = req.body;
    
    if (!Array.isArray(fonts)) {
      return res.status(400).json({
        success: false,
        message: 'Fonts must be an array'
      });
    }

    const updateData = { fonts };
    const brandKit = await BrandKit.updateByUserId(req.user.userId, updateData);

    res.json({
      success: true,
      message: 'Fonts updated successfully',
      fonts: brandKit.fonts
    });
  } catch (error) {
    console.error('Error updating brand kit fonts:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating brand kit fonts',
      error: error.message
    });
  }
});

// POST /api/brand-kit/elements - Update brand kit custom elements
app.post('/elements', auth, async (req, res) => {
  try {
    await connectDB();
    
    const { customElements } = req.body;
    
    if (!Array.isArray(customElements)) {
      return res.status(400).json({
        success: false,
        message: 'Custom elements must be an array'
      });
    }

    const updateData = { customElements };
    const brandKit = await BrandKit.updateByUserId(req.user.userId, updateData);

    res.json({
      success: true,
      message: 'Custom elements updated successfully',
      customElements: brandKit.customElements
    });
  } catch (error) {
    console.error('Error updating brand kit custom elements:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating brand kit custom elements',
      error: error.message
    });
  }
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
