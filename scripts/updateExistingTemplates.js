const mongoose = require('mongoose');
const Template = require('../models/Template');

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

// Update existing templates with missing fields
const updateExistingTemplates = async () => {
  try {
    console.log('🚀 Starting template updates...');

    // Update Luxury House template
    const luxuryHouse = await Template.findOne({ name: 'Luxury House' });
    if (luxuryHouse) {
      luxuryHouse.templateKey = 'luxuryHouse';
      luxuryHouse.isRealEstate = true;
      luxuryHouse.description = 'Elegant luxury house advertisement with premium styling';
      luxuryHouse.category = 'flyers';
      luxuryHouse.canvasSize = '1200x1800';
      await luxuryHouse.save();
      console.log('✅ Updated Luxury House template');
    }

    // Update Modern Family template
    const modernFamily = await Template.findOne({ name: 'Modern Family' });
    if (modernFamily) {
      modernFamily.templateKey = 'modernFamily';
      modernFamily.isRealEstate = true;
      modernFamily.description = 'Modern family home advertisement with contemporary design';
      modernFamily.category = 'flyers';
      modernFamily.canvasSize = '1200x1800';
      await modernFamily.save();
      console.log('✅ Updated Modern Family template');
    }

    // Update Dream Home template
    const dreamHome = await Template.findOne({ name: 'Dream Home' });
    if (dreamHome) {
      dreamHome.templateKey = 'dreamHome';
      dreamHome.isRealEstate = true;
      dreamHome.description = 'Kitchen-focused dream home advertisement';
      dreamHome.category = 'stories';
      dreamHome.canvasSize = '1080x1920';
      await dreamHome.save();
      console.log('✅ Updated Dream Home template');
    }

    // Update City Real Estate template
    const cityRealEstate = await Template.findOne({ name: 'City Real Estate' });
    if (cityRealEstate) {
      cityRealEstate.templateKey = 'cityRealEstate';
      cityRealEstate.isRealEstate = true;
      cityRealEstate.description = 'Urban real estate banner with city skyline';
      cityRealEstate.category = 'banners';
      cityRealEstate.canvasSize = '1200x628';
      await cityRealEstate.save();
      console.log('✅ Updated City Real Estate template');
    }

    console.log('🎉 Template updates completed successfully!');

  } catch (error) {
    console.error('❌ Template updates failed:', error);
    process.exit(1);
  }
};

// Run updates
const run = async () => {
  await connectDB();
  await updateExistingTemplates();
  await mongoose.disconnect();
  console.log('✅ Template update script completed');
  process.exit(0);
};

// Handle script execution
if (require.main === module) {
  run().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = { updateExistingTemplates };
