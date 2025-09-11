const mongoose = require('mongoose');
const Template = require('../models/Template');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const removeSummerSaleFlyer = async () => {
  try {
    console.log('🗑️ Removing Summer Sale Flyer template...');
    
    // Remove the Summer Sale Flyer template
    const result = await Template.deleteOne({ name: 'Summer Sale Flyer' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Successfully removed Summer Sale Flyer template');
    } else {
      console.log('ℹ️ Summer Sale Flyer template not found (already removed)');
    }
    
    // Verify the current state
    const remainingTemplates = await Template.find({ type: 'flyer' });
    console.log(`📊 Remaining flyer templates: ${remainingTemplates.length}`);
    
    if (remainingTemplates.length > 0) {
      console.log('📋 Remaining flyer templates:');
      remainingTemplates.forEach(template => {
        console.log(`  - ${template.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error removing template:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Execute the script
const runScript = async () => {
  await connectDB();
  await removeSummerSaleFlyer();
};

runScript();
