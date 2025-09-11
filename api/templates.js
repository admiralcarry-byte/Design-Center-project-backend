const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import the Template model
const Template = require('../models/Template');

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
    console.log('🔌 Connecting to MongoDB:', mongoURI.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB connected successfully');
    console.log('🔍 Connected to database:', mongoose.connection.db?.databaseName);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// GET /api/templates - Get all templates with filtering
app.get('/', async (req, res) => {
  try {
    console.log('🔍 GET /api/templates called');
    console.log('📊 Query params:', req.query);
    
    // Ensure database connection
    await connectDB();
    
    const { type, category, isRealEstate } = req.query;
    let query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (isRealEstate !== undefined) {
      query.isRealEstate = isRealEstate === 'true';
    }
    
    console.log('🔍 Database query:', query);
    
    const templates = await Template.find(query).sort({ createdAt: -1 }).limit(50);
    console.log(`✅ Found ${templates.length} templates`);
    
    res.json(templates);
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch templates',
      message: error.message
    });
  }
});

// GET /api/templates/real-estate - Get real estate templates
app.get('/real-estate', async (req, res) => {
  try {
    await connectDB();
    const realEstateTemplates = await Template.find({ isRealEstate: true }).sort({ createdAt: -1 }).limit(50);
    res.json(realEstateTemplates);
  } catch (error) {
    console.error('Error fetching real estate templates:', error);
    res.status(500).json({ error: 'Failed to fetch real estate templates' });
  }
});

// GET /api/templates/get - Get template by ID via query parameter
app.get('/get', async (req, res) => {
  try {
    const { id } = req.query;
    console.log('🔍 GET /api/templates/get called with ID:', id);
    
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid template ID format' });
    }
    
    await connectDB();
    const template = await Template.findById(id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// GET /api/templates/by-key/:templateKey - Get template by templateKey
app.get('/by-key/:templateKey', async (req, res) => {
  try {
    const { templateKey } = req.params;
    
    if (!templateKey) {
      return res.status(400).json({ error: 'Template key is required' });
    }
    
    await connectDB();
    const template = await Template.findOne({ templateKey });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching template by key:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST /api/templates - Create new template
app.post('/', async (req, res) => {
  try {
    const { name, type, dimensions, brandKitLogo } = req.body;
    
    if (!name || !type || !dimensions) {
      return res.status(400).json({ error: 'Name, type, and dimensions are required' });
    }
    
    await connectDB();
    
    const template = new Template({
      name,
      type,
      dimensions,
      category: getCategoryFromType(type),
      templateKey: uuidv4(),
      backgroundColor: '#ffffff',
      canvasSize: `${dimensions.width}x${dimensions.height}`,
      objects: []
    });
    
    const savedTemplate = await template.save();
    res.status(201).json(savedTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT /api/templates/:id - Update template
app.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid template ID format' });
    }
    
    await connectDB();
    
    const template = await Template.findByIdAndUpdate(
      id, 
      { ...updateData, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/templates/:id - Delete template
app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid template ID format' });
    }
    
    await connectDB();
    
    const template = await Template.findByIdAndDelete(id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// POST /api/templates/:id/duplicate - Duplicate template
app.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    await connectDB();
    
    const originalTemplate = await Template.findById(id);
    if (!originalTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const duplicatedTemplate = new Template({
      ...originalTemplate.toObject(),
      _id: undefined,
      name: name || `${originalTemplate.name} (Copy)`,
      templateKey: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedTemplate = await duplicatedTemplate.save();
    res.status(201).json(savedTemplate);
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ error: 'Failed to duplicate template' });
  }
});

// POST /api/templates/save-design - Save design data
app.post('/save-design', async (req, res) => {
  try {
    const { templateId, designData } = req.body;
    
    if (!templateId || !designData) {
      return res.status(400).json({ error: 'Template ID and design data are required' });
    }
    
    await connectDB();
    
    const template = await Template.findByIdAndUpdate(
      templateId,
      { 
        objects: designData.objects || [],
        backgroundColor: designData.backgroundColor || '#ffffff',
        backgroundImage: designData.backgroundImage,
        canvasSize: designData.canvasSize,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ message: 'Design saved successfully', template });
  } catch (error) {
    console.error('Error saving design:', error);
    res.status(500).json({ error: 'Failed to save design' });
  }
});

// GET /api/templates/design - Get design data by filename
app.get('/design', async (req, res) => {
  try {
    const { filename } = req.query;
    
    if (!filename || filename === 'undefined' || filename === 'null') {
      return res.status(400).json({ error: 'Design filename is required' });
    }
    
    await connectDB();
    
    // Find template by designFilename
    const template = await Template.findOne({ designFilename: filename });
    
    if (template) {
      return res.json({
        success: true,
        designData: {
          id: template._id.toString(),
          editorType: template.type,
          canvasSize: template.canvasSize,
          backgroundColor: template.backgroundColor,
          backgroundImage: template.backgroundImage,
          templateKey: template.templateKey,
          objects: template.objects || [],
          metadata: {
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            version: "1.0.0"
          }
        }
      });
    }
    
    return res.status(404).json({ error: 'Design file not found' });
  } catch (error) {
    console.error('Error fetching design data:', error);
    res.status(500).json({ error: 'Failed to fetch design data' });
  }
});

// Helper function to get category from type
function getCategoryFromType(type) {
  const categoryMap = {
    'square-post': 'social-posts',
    'story': 'stories',
    'marketplace-flyer': 'marketplace-flyers',
    'fb-feed-banner': 'fb-banners',
    'digital-badge': 'badges',
    'brochure': 'documents'
  };
  return categoryMap[type] || 'documents';
}

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
