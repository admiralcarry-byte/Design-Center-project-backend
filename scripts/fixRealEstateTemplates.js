const mongoose = require('mongoose');
const Template = require('../models/Template');
const { initialData } = require('./initializeDatabase');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/designcenter');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Fix real estate templates by adding missing objects
const fixRealEstateTemplates = async () => {
  try {
    console.log('🔧 Starting to fix real estate templates...');

    // Get all real estate templates from initial data
    const realEstateTemplates = initialData.realEstateTemplates;
    
    for (const templateData of realEstateTemplates) {
      console.log(`\n🔍 Processing template: ${templateData.name} (${templateData.templateKey})`);
      
      // Find existing template
      const existingTemplate = await Template.findOne({ templateKey: templateData.templateKey });
      
      if (existingTemplate) {
        console.log(`   📋 Found existing template: ${existingTemplate.name}`);
        
        // Check if template has objects
        if (!existingTemplate.objects || existingTemplate.objects.length === 0) {
          console.log(`   ❌ Template is missing objects - adding them now...`);
          
          // Update template with missing objects
          const updatedTemplate = await Template.findByIdAndUpdate(
            existingTemplate._id,
            {
              objects: templateData.objects,
              description: templateData.description,
              category: templateData.category,
              canvasSize: templateData.canvasSize,
              updatedAt: new Date()
            },
            { new: true, runValidators: true }
          );
          
          console.log(`   ✅ Template updated successfully with ${updatedTemplate.objects.length} objects`);
          console.log(`   📊 Objects added:`, updatedTemplate.objects.map(obj => `${obj.type}: "${obj.text || obj.id}"`));
        } else {
          console.log(`   ✅ Template already has ${existingTemplate.objects.length} objects - skipping`);
        }
      } else {
        console.log(`   ❌ Template not found - creating new one...`);
        
        // Create new template
        const newTemplate = await Template.create(templateData);
        console.log(`   ✅ Created new template: ${newTemplate.name} with ${newTemplate.objects.length} objects`);
      }
    }

    console.log('\n🎉 Real estate template fixing completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing real estate templates:', error);
    throw error;
  }
};

// Run the fix
const run = async () => {
  try {
    await connectDB();
    await fixRealEstateTemplates();
    await mongoose.disconnect();
    console.log('✅ Real estate template fixing script completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
};

// Handle script execution
if (require.main === module) {
  run();
}

module.exports = { fixRealEstateTemplates };
