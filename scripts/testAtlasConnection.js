const mongoose = require('mongoose');

// Test MongoDB Atlas connection
const testAtlasConnection = async () => {
  try {
    console.log('🔍 Testing MongoDB Atlas connection...');
    console.log('📡 Connection string:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable not set');
      console.log('💡 Please set MONGODB_URI in your .env file');
      process.exit(1);
    }
    
    // Connect to Atlas
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Connected to MongoDB Atlas: ${conn.connection.host}`);
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test basic operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections:`, collections.map(c => c.name));
    
    // Test a simple query
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    console.log(`👥 Users in database: ${userCount}`);
    
    const Template = require('../models/Template');
    const templateCount = await Template.countDocuments();
    console.log(`📄 Templates in database: ${templateCount}`);
    
    const BrandKit = require('../models/BrandKit');
    const brandKitCount = await BrandKit.countDocuments();
    console.log(`🎨 Brand kits in database: ${brandKitCount}`);
    
    console.log('\n🎉 Atlas connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Atlas connection test failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Check your username and password in the connection string');
    } else if (error.message.includes('network')) {
      console.log('💡 Check your IP address is whitelisted in Network Access');
    } else if (error.message.includes('SSL')) {
      console.log('💡 Check your connection string includes proper SSL parameters');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
};

// Run test if called directly
if (require.main === module) {
  testAtlasConnection();
}

module.exports = { testAtlasConnection };
