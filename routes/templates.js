const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Template = require('../models/Template');
const TemplateBackground = require('../models/TemplateBackground');
const User = require("../models/User");
const { ObjectId } = require('mongoose').Types;

// Helper function to safely delete files
const deleteFileSafely = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ File deleted successfully:', filePath);
      return true;
    } else {
      console.log('⚠️ File not found for deletion:', filePath);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting file:', filePath, error);
    return false;
  }
};

// Helper function to delete old design file when updating template
const deleteOldDesignFile = async (templateId) => {
  try {
    const template = await Template.findById(templateId);
    if (template && template.designFilename) {
              const oldFilePath = path.resolve(__dirname, '../uploads/designs', template.designFilename);
      if (deleteFileSafely(oldFilePath)) {
        console.log('🗑️ Old design file deleted for template:', templateId);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ Error deleting old design file:', error);
    return false;
  }
};

// Configure multer for thumbnail uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename for thumbnail
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'thumb-' + uniqueSuffix + '.png');
  }
});

// Configure multer for design data files
const designStorage = multer.diskStorage({
  destination: function (req, file, cb) {
            const uploadDir = path.resolve(__dirname, '../uploads/designs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename for design data
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'design-' + uniqueSuffix + '.json');
  }
});

// Configure multer for general file uploads
const generalStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../uploads/files');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    cb(null, `${nameWithoutExt}-${timestamp}${extension}`);
  }
});

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename for images
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + extension);
  }
});

const designUpload = multer({ 
  storage: designStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for design data
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed for design data'));
    }
  }
});

const generalUpload = multer({ 
  storage: generalStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|txt|zip|rar)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

const imageUpload = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to get default objects based on template type
function getDefaultObjectsForType(type) {
  switch (type) {
    case 'square-post':
      return [
        {
          id: '1',
          type: 'text',
          x: 200,
          y: 200,
          width: 400,
          height: 60,
          text: 'Your Post Title',
          font: 'Arial',
          color: '#1D4ED8',
        },
        {
          id: '2',
          type: 'text',
          x: 200,
          y: 300,
          width: 400,
          height: 40,
          text: 'Add your content here',
          font: 'Arial',
          color: '#6B7280',
        }
      ];
    case 'story':
      return [
        {
          id: '1',
          type: 'text',
          x: 50,
          y: 200,
          width: 400,
          height: 60,
          text: 'STORY TITLE',
          font: 'Arial',
          color: '#E91E63',
        },
        {
          id: '2',
          type: 'text',
          x: 50,
          y: 300,
          width: 400,
          height: 50,
          text: 'Your story content',
          font: 'Arial',
          color: '#9C27B0',
        }
      ];
    case 'marketplace-flyer':
      return [
        {
          id: '1',
          type: 'text',
          x: 100,
          y: 100,
          width: 500,
          height: 60,
          text: 'Your Flyer Headline',
          font: 'Arial',
          color: '#1D4ED8',
        },
        {
          id: '2',
          type: 'text',
          x: 100,
          y: 200,
          width: 500,
          height: 40,
          text: 'Add your content here',
          font: 'Arial',
          color: '#6B7280',
        }
      ];
    case 'real-estate-flyer':
      return [
        // Dark blue banner background
        {
          id: 'banner-bg',
          type: 'rect',
          x: 0,
          y: 0,
          width: 1200,
          height: 300,
          fill: '#1e3a8a',
          stroke: 'transparent',
          strokeWidth: 0,
          selectable: false,
          evented: false,
          isBackground: true
        },
        // Main title "REAL ESTATE"
        {
          id: 'main-title',
          type: 'text',
          x: 600,
          y: 100,
          width: 400,
          height: 60,
          text: 'REAL ESTATE',
          fontSize: 48,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#ffffff',
          textAlign: 'center',
          selectable: true
        },
        // Subtitle "Find your dream home"
        {
          id: 'subtitle',
          type: 'text',
          x: 600,
          y: 160,
          width: 400,
          height: 40,
          text: 'Find your dream home',
          fontSize: 24,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fill: '#ffffff',
          textAlign: 'center',
          selectable: true
        },
        // House image placeholder (white rectangle)
        {
          id: 'house-image',
          type: 'rect',
          x: 300,
          y: 400,
          width: 600,
          height: 400,
          fill: '#f3f4f6',
          stroke: '#d1d5db',
          strokeWidth: 2,
          selectable: true
        },
        // "House Image" placeholder text
        {
          id: 'image-placeholder',
          type: 'text',
          x: 600,
          y: 600,
          width: 200,
          height: 40,
          text: 'House Image',
          fontSize: 24,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fill: '#6b7280',
          textAlign: 'center',
          selectable: true
        },
        // FOR SALE badge background (hexagonal shape)
        {
          id: 'badge-bg',
          type: 'path',
          x: 800,
          y: 800,
          width: 200,
          height: 150,
          path: 'M 50 0 L 150 0 L 200 75 L 150 150 L 50 150 L 0 75 Z',
          fill: '#dc2626',
          stroke: 'transparent',
          strokeWidth: 0,
          selectable: true
        },
        // "FOR" text in badge
        {
          id: 'badge-for',
          type: 'text',
          x: 900,
          y: 820,
          width: 100,
          height: 30,
          text: 'FOR',
          fontSize: 20,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#ffffff',
          textAlign: 'center',
          selectable: true
        },
        // "SALE" text in badge
        {
          id: 'badge-sale',
          type: 'text',
          x: 900,
          y: 850,
          width: 100,
          height: 30,
          text: 'SALE',
          fontSize: 20,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#ffffff',
          textAlign: 'center',
          selectable: true
        },
        // Price "$850,000" in badge
        {
          id: 'badge-price',
          type: 'text',
          x: 900,
          y: 880,
          width: 100,
          height: 40,
          text: '$850,000',
          fontSize: 28,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#ffffff',
          textAlign: 'center',
          selectable: true
        },
        // Bottom section background
        {
          id: 'bottom-bg',
          type: 'rect',
          x: 0,
          y: 1000,
          width: 1200,
          height: 500,
          fill: '#f9fafb',
          stroke: 'transparent',
          strokeWidth: 0,
          selectable: false,
          evented: false,
          isBackground: true
        },
        // "ABOUT THE PROPERTY" header
        {
          id: 'property-header',
          type: 'text',
          x: 100,
          y: 1100,
          width: 400,
          height: 40,
          text: 'ABOUT THE PROPERTY',
          fontSize: 24,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#1e3a8a',
          textAlign: 'left',
          selectable: true
        },
        // Property description
        {
          id: 'property-desc',
          type: 'text',
          x: 100,
          y: 1150,
          width: 400,
          height: 100,
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vulputate augue sit amet erat interdum, at volutpat mauris elementum.',
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fill: '#374151',
          textAlign: 'left',
          selectable: true
        },
        // "VIEW MORE" button background
        {
          id: 'button-bg',
          type: 'rect',
          x: 100,
          y: 1280,
          width: 150,
          height: 50,
          fill: '#1e3a8a',
          stroke: 'transparent',
          strokeWidth: 0,
          rx: 8,
          ry: 8,
          selectable: true
        },
        // "VIEW MORE" button text
        {
          id: 'button-text',
          type: 'text',
          x: 175,
          y: 1295,
          width: 100,
          height: 20,
          text: 'VIEW MORE',
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#ffffff',
          textAlign: 'center',
          selectable: true
        },
        // Phone number
        {
          id: 'phone',
          type: 'text',
          x: 700,
          y: 1100,
          width: 200,
          height: 30,
          text: '123-456-7890',
          fontSize: 18,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fill: '#374151',
          textAlign: 'left',
          selectable: true
        },
        // Website
        {
          id: 'website',
          type: 'text',
          x: 700,
          y: 1140,
          width: 200,
          height: 30,
          text: 'www.example.com',
          fontSize: 18,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fill: '#374151',
          textAlign: 'left',
          selectable: true
        }
      ];
    case 'fb-feed-banner':
      return [
        {
          id: '1',
          type: 'text',
          x: 100,
          y: 120,
          width: 600,
          height: 80,
          text: 'BANNER HEADLINE',
          font: 'Arial',
          color: '#1976D2',
        },
        {
          id: '2',
          type: 'text',
          x: 100,
          y: 220,
          width: 600,
          height: 50,
          text: 'Subtitle text here',
          font: 'Arial',
          color: '#388E3C',
        }
      ];
    case 'digital-badge':
      return [
        {
          id: '1',
          type: 'text',
          x: 150,
          y: 150,
          width: 400,
          height: 60,
          text: 'BADGE TITLE',
          font: 'Arial',
          color: '#FF9800',
        },
        {
          id: '2',
          type: 'text',
          x: 150,
          y: 250,
          width: 400,
          height: 40,
          text: 'Badge content here',
          font: 'Arial',
          color: '#795548',
        }
      ];
    case 'brochure':
      return [
        {
          id: '1',
          type: 'text',
          x: 200,
          y: 150,
          width: 600,
          height: 80,
          text: 'Document Title',
          font: 'Arial',
          color: '#424242',
        },
        {
          id: '2',
          type: 'text',
          x: 200,
          y: 300,
          width: 600,
          height: 50,
          text: 'Document content here',
          font: 'Arial',
          color: '#616161',
        }
      ];
    default:
      return [];
  }
}

// Helper function to map template type to category
function getCategoryForType(type) {
  const typeToCategory = {
    'square-post': 'social-posts',
    'story': 'stories', 
    'marketplace-flyer': 'flyers',
    'real-estate-flyer': 'flyers',
    'fb-feed-banner': 'banners',
    'digital-badge': 'badges',
    'brochure': 'documents'
  };
  return typeToCategory[type] || 'flyers'; // Default to 'flyers' if type not found
}

// Helper function to generate default template name
function generateDefaultTemplateName(type) {
  const typeLabels = {
    'square-post': 'IG/FB Square Post',
    'story': 'IG/FB/WSP Story',
    'marketplace-flyer': 'Marketplace Flyer',
    'real-estate-flyer': 'Real Estate Flyer',
    'fb-feed-banner': 'FB Feed Banner',
    'digital-badge': 'Digital Badge',
    'brochure': 'Brochure'
  };
  
  const typeLabel = typeLabels[type] || 'Template';
  const timestamp = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  return `${typeLabel} - ${timestamp}`;
}

// Helper function to get default dimensions for template type
function getDefaultDimensions(type) {
  const dimensions = {
    'square-post': { width: 1080, height: 1080 },
    'story': { width: 1080, height: 1920 },
    'marketplace-flyer': { width: 1200, height: 1500 },
    'real-estate-flyer': { width: 1200, height: 1500 },
    'fb-feed-banner': { width: 1200, height: 628 },
    'digital-badge': { width: 1080, height: 1350 },
    'brochure': { width: 2480, height: 3508 }
  };
  return dimensions[type] || dimensions['square-post'];
}

// Default templates removed - editors now only work with user-created templates

// GET /api/templates?type=square-post|story|marketplace-flyer|fb-feed-banner|digital-badge|brochure
router.get('/', async (req, res) => {
  try {
    console.log('🔍 GET /api/templates called');
    console.log('📊 Query params:', req.query);
    console.log('🔍 Template model type:', typeof Template);
    console.log('🔍 Template model:', Template);
    
    // Check database connection
    console.log('🔍 Database connection state:', mongoose.connection.readyState);
    console.log('🔍 Database name:', mongoose.connection.db?.databaseName);
    console.log('🔍 Database host:', mongoose.connection.host);
    
    // Test database access
    console.log('🔍 Testing database access...');
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.listCollections().toArray();
      console.log('🔍 Available collections:', collections.map(c => c.name));
      
      // Check if templates collection exists
      const templatesCollection = collections.find(c => c.name === 'templates');
      console.log('🔍 Templates collection exists:', !!templatesCollection);
      
      if (templatesCollection) {
        const count = await db.collection('templates').countDocuments();
        console.log('🔍 Templates collection count:', count);
      }
    }
    
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
    console.log('🔍 About to execute Template.find()...');
    
    const templates = await Template.find(query).sort({ createdAt: -1 });
    console.log(`✅ Found ${templates.length} templates`);
    console.log('🔍 First template:', templates[0] ? 'Exists' : 'No templates');
    
    res.json(templates);
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch templates',
      message: error.message,
      name: error.name
    });
  }
});

// GET /api/templates/real-estate - Get all real estate templates
router.get('/real-estate', async (req, res) => {
  try {
    const realEstateTemplates = await Template.find({ isRealEstate: true }).sort({ createdAt: -1 });
    res.json(realEstateTemplates);
  } catch (error) {
    console.error('Error fetching real estate templates:', error);
    res.status(500).json({ error: 'Failed to fetch real estate templates' });
  }
});

// GET /api/templates/get - Get template by ID via query parameter
router.get('/get', async (req, res) => {
  try {
    const { id } = req.query;
    console.log('🔍 GET /api/templates/get called with ID:', id);
    console.log('🔍 Full query object:', req.query);
    console.log('🔍 Request URL:', req.url);
    
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received:', id);
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    // Check if ID is a valid MongoDB ObjectId format
    console.log('ID to validate:', id, 'Length:', id.length);
    console.log('Regex test result:', /^[0-9a-fA-F]{24}$/.test(id));
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ error: 'Invalid template ID format' });
    }
    
    console.log('🔍 Searching for template with ID:', id);
    
    // Try multiple methods to find the template
    let template = null;
    
    // Method 1: findById
    template = await Template.findById(id);
    if (template) {
      console.log('✅ Template found with findById:', template.name);
      return res.json(template);
    }
    
    // Method 2: findOne with _id
    template = await Template.findOne({ _id: id });
    if (template) {
      console.log('✅ Template found with findOne _id:', template.name);
      return res.json(template);
    }
    
    // Method 3: findOne with ObjectId
    template = await Template.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (template) {
      console.log('✅ Template found with findOne ObjectId:', template.name);
      return res.json(template);
    }
    
    // Method 4: findOne with string comparison
    template = await Template.findOne({ _id: { $eq: id } });
    if (template) {
      console.log('✅ Template found with findOne $eq:', template.name);
      return res.json(template);
    }
    
    // Method 5: Get all templates and find by string comparison
    console.log('🔍 Trying to find template by string comparison...');
    const allTemplates = await Template.find({});
    const foundTemplate = allTemplates.find(t => t._id.toString() === id);
    
    if (foundTemplate) {
      console.log('✅ Template found by string comparison:', foundTemplate.name);
      return res.json(foundTemplate);
    }
    
    console.log('❌ Template not found in database for ID:', id);
    return res.status(404).json({ error: 'Template not found' });
    
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// GET /api/templates/test - Simple test endpoint (must come before /:id)
router.get('/test', (req, res) => {
  res.json({ message: 'Templates API is working', timestamp: new Date().toISOString() });
});

// GET /api/templates/files - List uploaded files (must come before /:id)
router.get('/files', async (req, res) => {
  try {
    const filesDir = path.resolve(__dirname, '../uploads/files');
    const imagesDir = path.resolve(__dirname, '../uploads/images');
    const designsDir = path.resolve(__dirname, '../uploads/designs');

    const getFilesInDir = (dirPath) => {
      if (!fs.existsSync(dirPath)) return [];
      
      return fs.readdirSync(dirPath)
        .filter(file => !file.startsWith('.'))
        .map(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            path: `/uploads/files/${file}`
          };
        });
    };

    const files = getFilesInDir(filesDir);
    const images = getFilesInDir(imagesDir);
    const designs = getFilesInDir(designsDir);

    res.json({ 
      success: true, 
      files: files,
      images: images,
      designs: designs,
      total: files.length + images.length + designs.length
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// GET /api/templates/design - Get design data from file via query parameter (must come before /:id)
router.get('/design', async (req, res) => {
  try {
    const { filename } = req.query;
    console.log('🔍 GET /api/templates/design called with filename:', filename);
    
    if (!filename || filename === 'undefined' || filename === 'null') {
      return res.status(400).json({ error: 'Design filename is required' });
    }
    
    const filePath = path.resolve(__dirname, '../uploads/designs', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Design file not found' });
    }

    const designData = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(designData);
    
    res.json({ 
      success: true, 
      designData: parsedData
    });
  } catch (error) {
    console.error('Error reading design data:', error);
    res.status(500).json({ error: 'Failed to read design data' });
  }
});

// GET /api/templates/design/:filename - Get design data from file (legacy path parameter)
router.get('/design/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.resolve(__dirname, '../uploads/designs', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Design file not found' });
    }

    const designData = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(designData);
    
    res.json({ 
      success: true, 
      designData: parsedData
    });
  } catch (error) {
    console.error('Error reading design data:', error);
    res.status(500).json({ error: 'Failed to read design data' });
  }
});

// GET /api/templates/:id - Get template by ID (must come after specific routes)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 GET /api/templates/:id called with ID:', id);
    
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received:', id);
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ error: 'Invalid template ID format' });
    }
    
    console.log('🔍 Searching for template with ID:', id);
    
    // Try multiple methods to find the template
    let template = null;
    
    // Method 1: findById
    template = await Template.findById(id);
    if (template) {
      console.log('✅ Template found with findById:', template.name);
      return res.json(template);
    }
    
    // Method 2: findOne with _id
    template = await Template.findOne({ _id: id });
    if (template) {
      console.log('✅ Template found with findOne _id:', template.name);
      return res.json(template);
    }
    
    // Method 3: findOne with ObjectId
    template = await Template.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (template) {
      console.log('✅ Template found with findOne ObjectId:', template.name);
      return res.json(template);
    }
    
    // Method 4: findOne with string comparison
    template = await Template.findOne({ _id: { $eq: id } });
    if (template) {
      console.log('✅ Template found with findOne $eq:', template.name);
      return res.json(template);
    }
    
    // Method 5: Get all templates and find by string comparison
    console.log('🔍 Trying to find template by string comparison...');
    const allTemplates = await Template.find({});
    const foundTemplate = allTemplates.find(t => t._id.toString() === id);
    
    if (foundTemplate) {
      console.log('✅ Template found by string comparison:', foundTemplate.name);
      return res.json(foundTemplate);
    }
    
    console.log('❌ Template not found in database for ID:', id);
    return res.status(404).json({ error: 'Template not found' });
    
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// GET /api/templates/by-key/:templateKey - Get template by templateKey
router.get('/by-key/:templateKey', async (req, res) => {
  try {
    const { templateKey } = req.params;
    
    if (!templateKey) {
      return res.status(400).json({ error: 'Template key is required' });
    }
    
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

// PUT /api/templates/by-key/:templateKey - Update template by templateKey
router.put('/by-key/:templateKey', async (req, res) => {
  try {
    const { templateKey } = req.params;
    
    if (!templateKey) {
      return res.status(400).json({ error: 'Template key is required' });
    }
    
    // Check if we're updating the designFilename (which means a new design file was uploaded)
    const isUpdatingDesign = req.body.designFilename && req.body.designFilename !== '';
    
    // If updating design, find the template first to get its ID for file cleanup
    let templateId = null;
    if (isUpdatingDesign) {
      const existingTemplate = await Template.findOne({ templateKey });
      if (existingTemplate) {
        templateId = existingTemplate._id;
        console.log('🔄 Updating design file for template key:', templateKey, 'ID:', templateId);
        const oldFileDeleted = await deleteOldDesignFile(templateId);
        if (oldFileDeleted) {
          console.log('✅ Old design file cleaned up successfully');
        }
      }
    }
    
    const template = await Template.findOneAndUpdate(
      { templateKey },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error updating template by key:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// POST /api/templates/save-design - Save design data as file and return filename
router.post('/save-design', designUpload.single('designData'), async (req, res) => {
  try {
    let filename;
    
    if (req.file) {
      // File upload method
      filename = req.file.filename;
      console.log('Design data file saved via upload:', filename);
      console.log('File path:', req.file.path);
    } else if (req.body.designData) {
      // JSON data method (fallback)
      if (req.body.filename) {
        // Use custom filename if provided
        filename = req.body.filename;
        console.log('Using custom filename:', filename);
      } else {
        // Generate timestamp-based filename as fallback
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1E9);
        filename = `design-${timestamp}-${randomSuffix}.json`;
        console.log('Generated timestamp filename:', filename);
      }
      
      const filePath = path.resolve(__dirname, '../uploads/designs', filename);
      
      // Write the design data to file
      fs.writeFileSync(filePath, JSON.stringify(req.body.designData, null, 2));
      console.log('Design data saved via JSON:', filename);
      console.log('File path:', filePath);
    } else {
      return res.status(400).json({ error: 'No design data provided (file or JSON)' });
    }

    // Return the filename that should be stored in the database
    res.json({ 
      success: true, 
      filename: filename,
      message: 'Design data saved successfully'
    });
  } catch (error) {
    console.error('Error saving design data:', error);
    res.status(500).json({ error: 'Failed to save design data' });
  }
});


// POST /api/templates/save-design-large - Handle very large design data
router.post('/save-design-large', async (req, res) => {
  try {
    // This endpoint handles very large JSON payloads
    const designData = req.body.designData;
    
    if (!designData) {
      return res.status(400).json({ error: 'No design data provided' });
    }

    console.log('📊 Large design data received, size:', JSON.stringify(designData).length, 'bytes');

    // Generate filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const filename = `design-large-${timestamp}-${randomSuffix}.json`;
    const filePath = path.resolve(__dirname, '../uploads/designs', filename);

    // Write the design data to file
    fs.writeFileSync(filePath, JSON.stringify(designData, null, 2));
    console.log('✅ Large design data saved as file:', filename);
    console.log('📁 File path:', filePath);

    res.json({
      success: true,
      filename: filename,
      message: 'Large design data saved successfully',
      size: JSON.stringify(designData).length
    });
  } catch (error) {
    console.error('❌ Error saving large design data:', error);
    res.status(500).json({ error: 'Failed to save large design data' });
  }
});

// POST /api/templates/save-thumbnail - Save template thumbnail
router.post('/save-thumbnail', async (req, res) => {
  try {
    const { templateId, templateKey, thumbnailData } = req.body;
    
    if (!thumbnailData) {
      return res.status(400).json({ error: 'No thumbnail data provided' });
    }

    console.log('📸 Saving thumbnail for template:', templateId || templateKey);

    // Generate thumbnail filename
    const timestamp = Date.now();
    const filename = `thumbnail-${templateId || templateKey}-${timestamp}.png`;
    const filePath = path.resolve(__dirname, '../uploads/thumbnails', filename);

    // Ensure thumbnails directory exists
    const thumbnailsDir = path.dirname(filePath);
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    // Convert data URL to buffer and save
    const base64Data = thumbnailData.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    console.log('✅ Thumbnail saved:', filename);

    // Update template with thumbnail filename if templateId provided
    if (templateId) {
      await Template.findByIdAndUpdate(templateId, { 
        thumbnailFilename: filename,
        updatedAt: new Date()
      });
      console.log('✅ Template updated with thumbnail filename');
    }

    res.json({
      success: true,
      filename: filename,
      message: 'Thumbnail saved successfully'
    });
  } catch (error) {
    console.error('❌ Error saving thumbnail:', error);
    res.status(500).json({ error: 'Failed to save thumbnail' });
  }
});

// GET /api/templates/thumbnail/:filename - Serve thumbnail image
router.get('/thumbnail/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.resolve(__dirname, '../uploads/thumbnails', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Thumbnail not found' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('❌ Error serving thumbnail:', error);
    res.status(500).json({ error: 'Failed to serve thumbnail' });
  }
});

// POST /api/templates - Create new template
router.post('/', async (req, res) => {
  try {
    const { name, type, dimensions, brandKitLogo } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Template type is required' });
    }
    
    // Validate template type
    const validTypes = ['square-post', 'story', 'marketplace-flyer', 'real-estate-flyer', 'fb-feed-banner', 'digital-badge', 'brochure'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid template type' });
    }
    
    // Generate default name if none provided
    const templateName = name || generateDefaultTemplateName(type);
    
    // Generate a unique template key
    const templateKey = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get default objects and add logo if available
    let templateObjects = getDefaultObjectsForType(type);
    
    // Add brand kit logo to template if available
    if (brandKitLogo) {
      const logoObject = {
        id: 'brand-logo',
        type: 'image',
        x: 50,
        y: 50,
        width: 100,
        height: 60,
        src: brandKitLogo,
        selectable: true,
        evented: true,
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
        cornerStyle: 'circle',
        cornerColor: '#00525b',
        cornerSize: 8,
        transparentCorners: false,
        borderColor: '#00525b',
        borderScaleFactor: 1
      };
      
      // Add logo as the first object
      templateObjects = [logoObject, ...templateObjects];
    }
    
    // Create new template with default content based on type
    const newTemplate = await Template.create({
      name: templateName,
      type: type,
      category: getCategoryForType(type),
      thumbnail: '/uploads/default-thumbnail.png', // Will be updated when saved
      objects: templateObjects,
      backgroundColor: '#ffffff',
      dimensions: dimensions || getDefaultDimensions(type),
      templateKey: templateKey, // Add templateKey
    });
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// POST /api/templates/:id/duplicate
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received for duplication:', id);
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format for duplication:', id);
      return res.status(400).json({ error: 'Invalid template ID format' });
    }
    
    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const newTemplate = await Template.create({
      ...template.toObject(),
      _id: undefined, // Remove the original ID
      name: template.name + ' (Copy)',
              // Copied templates inherit properties from original
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ error: 'Failed to duplicate template' });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received for deletion:', id);
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format for deletion:', id);
      return res.status(400).json({ error: 'Invalid template ID format' });
    }
    
    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Template deletion allowed for all templates
    
    // Clean up associated files before deleting the template
    console.log('🗑️ Cleaning up files for template:', id);
    
    // Delete design file if it exists
    if (template.designFilename) {
              const designFilePath = path.resolve(__dirname, '../uploads/designs', template.designFilename);
      deleteFileSafely(designFilePath);
    }
    
    // Delete thumbnail file if it exists and it's not the default thumbnail
    if (template.thumbnail && template.thumbnail !== '/uploads/default-thumbnail.png') {
      const thumbnailPath = template.thumbnail.startsWith('/') ? template.thumbnail.substring(1) : template.thumbnail;
      const thumbnailFilePath = path.resolve(__dirname, '..', thumbnailPath);
      deleteFileSafely(thumbnailFilePath);
    }
    
    await Template.findByIdAndDelete(id);
    console.log('✅ Template and associated files deleted successfully');
    res.json({ success: true, deletedTemplate: template });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// PUT /api/templates/:id - Save template changes
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received for update:', id);
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format for update:', id);
      return res.status(400).json({ error: 'Invalid template ID format' });
    }
    
    // Check if we're updating the designFilename (which means a new design file was uploaded)
    const isUpdatingDesign = req.body.designFilename && req.body.designFilename !== '';
    
    // If updating design, delete the old design file first
    if (isUpdatingDesign) {
      console.log('🔄 Updating design file for template:', id);
      const oldFileDeleted = await deleteOldDesignFile(id);
      if (oldFileDeleted) {
        console.log('✅ Old design file cleaned up successfully');
      }
    }
    
    const template = await Template.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// POST /api/templates/:id/thumbnail - Upload thumbnail for template
router.post('/:id/thumbnail', upload.single('thumbnail'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received for thumbnail upload:', id);
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format for thumbnail upload:', id);
      return res.status(400).json({ error: 'Invalid template ID format' });
    }
    
    console.log('Thumbnail upload request received for template:', id);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const template = await Template.findById(id);
    if (!template) {
      console.log('Template not found:', id);
      return res.status(404).json({ error: 'Template not found' });
    }
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No thumbnail file uploaded' });
    }
    
    console.log('File uploaded successfully:', req.file.filename);
    
    // Delete old thumbnail if it exists and it's not the default thumbnail
    if (template.thumbnail && template.thumbnail !== '/uploads/default-thumbnail.png') {
      const oldThumbnailPath = template.thumbnail.startsWith('/') ? template.thumbnail.substring(1) : template.thumbnail;
      const oldThumbnailFilePath = path.resolve(__dirname, '..', oldThumbnailPath);
      console.log('🗑️ Deleting old thumbnail:', oldThumbnailFilePath);
      deleteFileSafely(oldThumbnailFilePath);
    }
    
    // Update the template's thumbnail path
    const thumbnailPath = '/uploads/' + req.file.filename;
    template.thumbnail = thumbnailPath;
    template.updatedAt = new Date();
    
    await template.save();
    
    console.log('Template thumbnail updated:', thumbnailPath);
    
    res.json({ 
      success: true, 
      thumbnail: thumbnailPath,
      template: template
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ error: 'Failed to upload thumbnail' });
  }
});

// POST /api/templates/upload-file - Upload general files
router.post('/upload-file', generalUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded successfully:', req.file.filename);
    console.log('File path:', req.file.path);
    console.log('File size:', req.file.size, 'bytes');
    console.log('File type:', req.file.mimetype);

    res.json({ 
      success: true, 
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: `/uploads/files/${req.file.filename}`,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// POST /api/templates/upload-image - Upload images
router.post('/upload-image', imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    console.log('Image uploaded successfully:', req.file.filename);
    console.log('Image path:', req.file.path);
    console.log('Image size:', req.file.size, 'bytes');
    console.log('Image type:', req.file.mimetype);

    res.json({ 
      success: true, 
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: `/uploads/images/${req.file.filename}`,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// POST /api/templates/upload-multiple - Upload multiple files
router.post('/upload-multiple', generalUpload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/files/${file.filename}`
    }));

    console.log('Multiple files uploaded successfully:', uploadedFiles.length);

    res.json({ 
      success: true, 
      files: uploadedFiles,
      count: uploadedFiles.length,
      message: `${uploadedFiles.length} files uploaded successfully`
    });
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});


// POST /api/templates/cleanup-orphaned-files - Clean up orphaned files
router.post('/cleanup-orphaned-files', async (req, res) => {
  try {
    console.log('🧹 Starting orphaned files cleanup...');
    
    // Get all templates to check which design files are still referenced
    const templates = await Template.find({});
    const referencedDesignFiles = new Set();
    
    templates.forEach(template => {
      if (template.designFilename) {
        referencedDesignFiles.add(template.designFilename);
      }
    });
    
    // Check design files directory
    const designsDir = path.resolve(__dirname, '../uploads/designs');
    let orphanedFiles = [];
    let cleanedUpCount = 0;
    
    if (fs.existsSync(designsDir)) {
      const designFiles = fs.readdirSync(designsDir);
      
      designFiles.forEach(filename => {
        if (!referencedDesignFiles.has(filename)) {
          const filePath = path.join(designsDir, filename);
          if (deleteFileSafely(filePath)) {
            orphanedFiles.push(filename);
            cleanedUpCount++;
          }
        }
      });
    }
    
    console.log(`✅ Cleanup completed. Removed ${cleanedUpCount} orphaned files.`);
    
    res.json({
      success: true,
      message: `Cleanup completed successfully`,
      orphanedFilesRemoved: orphanedFiles,
      totalFilesCleaned: cleanedUpCount
    });
  } catch (error) {
    console.error('❌ Error during orphaned files cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup orphaned files' });
  }
});

// DELETE /api/templates/file/:filename - Delete uploaded file
router.delete('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { type } = req.query; // 'files', 'images', or 'designs'
    
    let filePath;
    switch (type) {
      case 'images':
        filePath = path.resolve(__dirname, '../uploads/images', filename);
        break;
      case 'designs':
        filePath = path.resolve(__dirname, '../uploads/designs', filename);
        break;
      default:
        filePath = path.resolve(__dirname, '../uploads/files', filename);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    console.log('File deleted successfully:', filename);

    res.json({ 
      success: true, 
      message: 'File deleted successfully',
      deletedFile: filename
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// POST /api/templates/backgrounds - Save template background
router.post('/backgrounds', async (req, res) => {
  try {
    const { templateId, userId, imageData, imageType, fileName } = req.body;
    
    if (!templateId || !userId || !imageData || !imageType) {
      return res.status(400).json({ 
        error: 'Missing required fields: templateId, userId, imageData, imageType' 
      });
    }
    
    // Validate templateId format
    // if (!/^[0-9a-fA-F]{24}$/.test(templateId)) {
    //   return res.status(400).json({ error: 'Invalid template ID format' });
    // }
    
    // Validate userId format
    // if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    //   return res.status(400).json({ error: 'Invalid user ID format' });
    // }
    
    // For sample templates (non-MongoDB ObjectIds), skip template validation
    let template = null;
    if (/^[0-9a-fA-F]{24}$/.test(templateId)) {
      // Check if template exists only for valid MongoDB ObjectIds
      template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
    } else {
      // For sample templates, just log and continue
      console.log('📝 Saving background for sample template:', templateId);
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Delete any existing background for this template and user
    await TemplateBackground.deleteMany({ templateId, userId });
    
    // Create new background
    const templateBackground = new TemplateBackground({
      templateId,
      userId,
      imageData,
      imageType,
      fileName: fileName || `background_${templateId}_${Date.now()}`
    });
    
    console.log("before saving")
    console.log(templateBackground);
    await templateBackground.save();
    console.log("after saving")

    
    console.log('✅ Template background saved successfully for template:', templateId, 'user:', userId);
    
    res.json({ 
      success: true, 
      message: 'Template background saved successfully',
      backgroundId: templateBackground._id
    });
  } catch (error) {
    console.error('❌ Error saving template background:', error);
    res.status(500).json({ error: 'Failed to save template background' });
  }
});

// GET /api/templates/backgrounds/:templateId/:userId - Get template background
router.get('/backgrounds/:templateId/:userId', async (req, res) => {
  try {
    const { templateId, userId } = req.params;
    
    if (!templateId || !userId) {
      return res.status(400).json({ error: 'Template ID and User ID are required' });
    }
    
    // Validate userId format only
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const background = await TemplateBackground.findOne({ 
      templateId, 
      userId 
    }).sort({ createdAt: -1 }); // Get the most recent one
    
    if (!background) {
      return res.status(404).json({ error: 'Template background not found' });
    }
    
    res.json({
      success: true,
      background: {
        id: background._id,
        imageData: background.imageData,
        imageType: background.imageType,
        fileName: background.fileName,
        createdAt: background.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error fetching template background:', error);
    res.status(500).json({ error: 'Failed to fetch template background' });
  }
});

// DELETE /api/templates/backgrounds/:templateId/:userId - Delete template background
router.delete('/backgrounds/:templateId/:userId', async (req, res) => {
  try {
    const { templateId, userId } = req.params;
    
    if (!templateId || !userId) {
      return res.status(400).json({ error: 'Template ID and User ID are required' });
    }
    
    // Validate userId format only
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const result = await TemplateBackground.deleteMany({ templateId, userId });
    
    console.log('✅ Template background deleted successfully for template:', templateId, 'user:', userId, 'count:', result.deletedCount);
    
    res.json({ 
      success: true, 
      message: 'Template background deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error deleting template background:', error);
    res.status(500).json({ error: 'Failed to delete template background' });
  }
});

// DELETE /api/templates/backgrounds/:backgroundId - Delete specific background by ID
router.delete('/backgrounds/:backgroundId', async (req, res) => {
  try {
    const { backgroundId } = req.params;
    
    if (!backgroundId) {
      return res.status(400).json({ error: 'Background ID is required' });
    }
    
    // Validate ID format
    if (!/^[0-9a-fA-F]{24}$/.test(backgroundId)) {
      return res.status(400).json({ error: 'Invalid background ID format' });
    }
    
    const result = await TemplateBackground.findByIdAndDelete(backgroundId);
    
    if (!result) {
      return res.status(404).json({ error: 'Template background not found' });
    }
    
    console.log('✅ Template background deleted successfully:', backgroundId);
    
    res.json({ 
      success: true, 
      message: 'Template background deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting template background:', error);
    res.status(500).json({ error: 'Failed to delete template background' });
  }
});

module.exports = router;
