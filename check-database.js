const mongoose = require('mongoose');
const Template = require('./models/Template');
require('dotenv').config();

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reddragon');
    console.log('✅ Connected to MongoDB');
    
    const templates = await Template.find({});
    console.log(`\n📋 Found ${templates.length} templates in database:`);
    
    templates.forEach(template => {
      const objectCount = template.objects ? template.objects.length : 0;
      const hasDesignFile = template.designFilename ? '✅' : '❌';
      console.log(`- ${template.name}: ${objectCount} objects, design file: ${hasDesignFile} ${template.designFilename || 'none'}`);
    });
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();
