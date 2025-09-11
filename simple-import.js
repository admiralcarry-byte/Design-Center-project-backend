const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Template = require('./models/Template');

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reddragon');
    console.log('✅ Connected to MongoDB');
    
    // Read templates file
    const templatesFilePath = path.resolve('c:/Users/Administrator/Desktop/templates.json');
    const templatesData = JSON.parse(fs.readFileSync(templatesFilePath, 'utf8'));
    console.log(`✅ Read ${templatesData.length} templates`);
    
    let processed = 0;
    let errors = 0;
    
    for (const templateData of templatesData) {
      try {
        console.log(`Processing: ${templateData.name}`);
        
        const template = {
          name: templateData.name,
          description: templateData.description || `Template ${templateData.name}`,
          type: templateData.type,
          category: templateData.category,
          templateKey: templateData.templateKey || null,
          thumbnail: templateData.thumbnail || '/uploads/default-thumbnail.png',
          designFilename: templateData.designFilename || null,
          backgroundColor: templateData.backgroundColor || '#ffffff',
          canvasSize: templateData.canvasSize || '1200x1800',
          dimensions: templateData.dimensions || { width: 1200, height: 1800 },
          isRealEstate: templateData.isRealEstate || false,
          objects: templateData.objects || []
        };
        
        // Try to find existing template
        const existing = await Template.findOne({ name: template.name });
        
        if (existing) {
          await Template.findByIdAndUpdate(existing._id, template);
          console.log(`  ✅ Updated existing template`);
        } else {
          await Template.create(template);
          console.log(`  ✅ Created new template`);
        }
        
        processed++;
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 Summary: ${processed} processed, ${errors} errors`);
    
    // Count final results
    const total = await Template.countDocuments();
    console.log(`📋 Total templates in database: ${total}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

main();
