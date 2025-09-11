const mongoose = require('mongoose');
const Template = require('../models/Template');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Comprehensive initial data
const initialData = {
  // Real Estate Templates
  realEstateTemplates: [
    {
      name: 'Luxury House',
      description: 'Elegant luxury house advertisement with premium styling',
      type: 'flyer',
      category: 'flyers',
      templateKey: 'luxuryHouse',
      isRealEstate: true,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 100, width: 300, height: 50, text: 'LUXURY HOUSE', fontSize: 72, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 200, width: 300, height: 50, text: 'FOR SALE', fontSize: 48, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '3', type: 'text', x: 100, y: 300, width: 300, height: 50, text: 'START PRICE', fontSize: 24, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '4', type: 'text', x: 100, y: 350, width: 300, height: 50, text: '$ 500.000', fontSize: 48, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'bold' }
      ],
      backgroundColor: '#1e3a8a',
      backgroundImage: null,
      canvasSize: '1200x1800'
    },
    {
      name: 'Dream Home',
      description: 'Kitchen-focused dream home advertisement',
      type: 'story',
      category: 'stories',
      templateKey: 'dreamHome',
      isRealEstate: true,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 100, width: 300, height: 50, text: 'MODERN HOME', fontSize: 48, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '2', type: 'text', x: 100, y: 200, width: 300, height: 50, text: 'DREAM', fontSize: 96, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 100, y: 350, width: 300, height: 50, text: 'for sale', fontSize: 24, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '4', type: 'text', x: 100, y: 400, width: 300, height: 50, text: 'Starting price:', fontSize: 24, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '5', type: 'text', x: 100, y: 450, width: 300, height: 50, text: '$1,500,000', fontSize: 48, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '6', type: 'text', x: 100, y: 530, width: 300, height: 50, text: 'Call Us :', fontSize: 24, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '7', type: 'text', x: 100, y: 570, width: 300, height: 50, text: '+123-456-7890', fontSize: 36, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#1e3a8a',
      backgroundImage: null,
      canvasSize: '1080x1920'
    },
    {
      name: 'City Real Estate',
      description: 'Urban real estate banner with city skyline',
      type: 'banner',
      category: 'banners',
      templateKey: 'cityRealEstate',
      isRealEstate: true,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 100, width: 600, height: 80, text: 'CITY REAL ESTATE', fontSize: 72, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 200, width: 600, height: 50, text: 'WHAT TO KNOW BEFORE JUMPING IN', fontSize: 24, color: '#d1d5db', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#0f766e',
      backgroundImage: null,
      canvasSize: '1200x628'
    },
    {
      name: 'Trifold Brochure',
      description: 'Professional trifold brochure for villas',
      type: 'brochure',
      category: 'documents',
      templateKey: 'trifoldBrochure',
      isRealEstate: true,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 100, width: 400, height: 50, text: 'About Us', fontSize: 36, color: '#1f2937', fontFamily: 'Georgia', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 160, width: 400, height: 100, text: 'Trifold brochures have long been a type of material used to advertise brands, products, and services. The best way to maximize its use is to introduce what the brand has to offer with a brief or about section like this.', fontSize: 16, color: '#374151', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '3', type: 'text', x: 400, y: 200, width: 400, height: 50, text: 'Live better in villas that give you more than what you expect.', fontSize: 24, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'normal' },
        { id: '4', type: 'text', x: 800, y: 100, width: 400, height: 50, text: 'Our Homes', fontSize: 36, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'bold' },
        { id: '5', type: 'text', x: 800, y: 200, width: 400, height: 50, text: 'Regal Villa', fontSize: 24, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'normal' },
        { id: '6', type: 'text', x: 800, y: 300, width: 400, height: 50, text: 'Ruby Villa', fontSize: 24, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'normal' },
        { id: '7', type: 'text', x: 800, y: 400, width: 400, height: 50, text: 'Ronda Villa', fontSize: 24, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'normal' }
      ],
      backgroundColor: '#f3f4f6',
      backgroundImage: null,
      canvasSize: '1200x1800'
    }
  ],

  // Default Templates (Non-Real Estate)
  defaultTemplates: [
    // Summer Sale Flyer removed - eliminated one flyer from template gallery
    {
      name: 'Instagram Story Promo',
      description: 'Default story template for social media promotions',
      type: 'story',
      category: 'stories',
      templateKey: 'instagramStoryPromo',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 50, y: 100, width: 300, height: 50, text: 'NEW PRODUCT', fontSize: 48, color: '#E91E63', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 50, y: 200, width: 300, height: 50, text: 'LAUNCH', fontSize: 96, color: '#E91E63', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 50, y: 350, width: 300, height: 50, text: 'Coming Soon!', fontSize: 24, color: '#9C27B0', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#FFFFFF',
      backgroundImage: null,
      canvasSize: '1080x1920'
    },
    {
      name: 'Event Banner',
      description: 'Default banner template for events and announcements',
      type: 'banner',
      category: 'banners',
      templateKey: 'eventBanner',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 120, width: 600, height: 80, text: 'GRAND OPENING', fontSize: 72, color: '#1976D2', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 220, width: 600, height: 50, text: 'Join us for the celebration!', fontSize: 24, color: '#388E3C', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#FFFFFF',
      backgroundImage: null,
      canvasSize: '1200x628'
    },
    {
      name: 'Business Document',
      description: 'Default document template for business communications',
      type: 'document',
      category: 'documents',
      templateKey: 'businessDocument',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 80, width: 400, height: 50, text: 'Business Report', fontSize: 48, color: '#424242', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 150, width: 400, height: 50, text: 'Q4 2024', fontSize: 24, color: '#616161', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '3', type: 'text', x: 100, y: 220, width: 400, height: 100, text: 'This is a comprehensive business report covering all aspects of our operations for the fourth quarter of 2024.', fontSize: 16, color: '#424242', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#FFFFFF',
      backgroundImage: null,
      canvasSize: '1200x1800'
    },
    {
      name: 'IG/FB Square Post',
      description: 'Square post template optimized for Instagram and Facebook',
      type: 'social',
      category: 'social-posts',
      templateKey: 'igFbSquarePost',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 50, y: 200, width: 500, height: 60, text: 'NEW PRODUCT', fontSize: 48, color: '#E91E63', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 50, y: 300, width: 500, height: 80, text: 'LAUNCH', fontSize: 72, color: '#E91E63', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 50, y: 450, width: 500, height: 40, text: 'Coming Soon!', fontSize: 24, color: '#9C27B0', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#FFFFFF',
      backgroundImage: null,
      canvasSize: '1080x1080'
    },
    {
      name: 'Post Promocional',
      description: 'Attractive design for social media promotions',
      type: 'social',
      category: 'social-posts',
      templateKey: 'postPromocional',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 50, y: 150, width: 500, height: 60, text: 'SALE', fontSize: 64, color: '#FF6B35', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 50, y: 250, width: 500, height: 60, text: 'UP TO 70% OFF', fontSize: 48, color: '#FF6B35', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 50, y: 400, width: 500, height: 40, text: 'Limited Time Only', fontSize: 24, color: '#666666', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#FFFFFF',
      backgroundImage: null,
      canvasSize: '1080x1080'
    },
    {
      name: 'Professional Badge',
      description: 'Elegant professional badge for credentials and certifications',
      type: 'badge',
      category: 'badges',
      templateKey: 'professionalBadge',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 150, y: 200, width: 400, height: 60, text: 'PROFESSIONAL', fontSize: 48, color: '#1e40af', fontFamily: 'Georgia', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 150, y: 280, width: 400, height: 80, text: 'CERTIFIED', fontSize: 72, color: '#1e40af', fontFamily: 'Georgia', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 150, y: 400, width: 400, height: 40, text: 'Design Expert', fontSize: 24, color: '#64748b', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '4', type: 'text', x: 150, y: 500, width: 400, height: 30, text: '2024', fontSize: 18, color: '#94a3b8', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#f8fafc',
      backgroundImage: null,
      canvasSize: '1080x1350'
    },
    {
      name: 'Achievement Badge',
      description: 'Modern achievement badge for awards and accomplishments',
      type: 'badge',
      category: 'badges',
      templateKey: 'achievementBadge',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 150, width: 500, height: 60, text: 'EXCELLENCE', fontSize: 56, color: '#dc2626', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 250, width: 500, height: 80, text: 'AWARD', fontSize: 80, color: '#dc2626', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 100, y: 380, width: 500, height: 40, text: 'Outstanding Performance', fontSize: 28, color: '#374151', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '4', type: 'text', x: 100, y: 450, width: 500, height: 30, text: 'Recognized for exceptional work', fontSize: 20, color: '#6b7280', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#fef2f2',
      backgroundImage: null,
      canvasSize: '1080x1350'
    }
  ]
};

// Initialize all data
const initializeDatabase = async () => {
  try {
    console.log('🚀 Starting database initialization...');

    // Initialize Templates
    console.log('📋 Initializing templates...');
    const allTemplates = [...initialData.realEstateTemplates, ...initialData.defaultTemplates];
    
    for (const templateData of allTemplates) {
      const existingTemplate = await Template.findOne({
        $or: [
          { name: templateData.name, type: templateData.type },
          { templateKey: templateData.templateKey }
        ]
      });

      if (!existingTemplate) {
        await Template.create(templateData);
        console.log(`✅ Created ${templateData.isRealEstate ? 'real estate' : 'default'} template: ${templateData.name}`);
      } else {
        console.log(`ℹ️ Template already exists: ${templateData.name}`);
      }
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log(`📊 Created/Updated: ${allTemplates.length} templates`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization
const run = async () => {
  await connectDB();
  await initializeDatabase();
  await mongoose.disconnect();
  console.log('✅ Database initialization script completed');
  process.exit(0);
};

// Handle script execution
if (require.main === module) {
  run().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = { initializeDatabase, initialData };
