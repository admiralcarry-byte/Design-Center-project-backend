const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import your models
const User = require('../models/User');
const Template = require('../models/Template');
const BrandKit = require('../models/BrandKit');

// Database connection
const connectDB = async () => {
  try {
    // Connect to local MongoDB first
    await mongoose.connect(process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/designcenter');
    console.log('✅ Connected to local MongoDB');
  } catch (error) {
    console.error('❌ Local MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Connect to Atlas
const connectToAtlas = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error);
    process.exit(1);
  }
};

// Export data from local database
const exportData = async () => {
  console.log('📤 Exporting data from local database...');
  
  const data = {
    users: await User.find({}),
    templates: await Template.find({}),
    brandKits: await BrandKit.find({})
  };
  
  // Save to JSON file
  const exportPath = path.join(__dirname, '..', 'data-export.json');
  fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
  console.log(`✅ Data exported to ${exportPath}`);
  
  return data;
};

// Import data to Atlas
const importData = async (data) => {
  console.log('📥 Importing data to MongoDB Atlas...');
  
  try {
    // Clear existing data (optional - remove if you want to keep existing data)
    await User.deleteMany({});
    await Template.deleteMany({});
    await BrandKit.deleteMany({});
    console.log('🗑️ Cleared existing data in Atlas');
    
    // Import users
    if (data.users.length > 0) {
      await User.insertMany(data.users);
      console.log(`✅ Imported ${data.users.length} users`);
    }
    
    // Import templates
    if (data.templates.length > 0) {
      await Template.insertMany(data.templates);
      console.log(`✅ Imported ${data.templates.length} templates`);
    }
    
    // Import brand kits
    if (data.brandKits.length > 0) {
      await BrandKit.insertMany(data.brandKits);
      console.log(`✅ Imported ${data.brandKits.length} brand kits`);
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
};

// Main migration function
const migrateToAtlas = async () => {
  try {
    console.log('🚀 Starting migration to MongoDB Atlas...\n');
    
    // Step 1: Connect to local database and export data
    await connectDB();
    const data = await exportData();
    await mongoose.disconnect();
    
    // Step 2: Connect to Atlas and import data
    await connectToAtlas();
    await importData(data);
    await mongoose.disconnect();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📝 Next steps:');
    console.log('1. Update your .env file with the Atlas connection string');
    console.log('2. Test your application with the new database');
    console.log('3. Remove the local MongoDB dependency if desired');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateToAtlas();
}

module.exports = { migrateToAtlas, exportData, importData };
