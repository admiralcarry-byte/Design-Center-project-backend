const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Template = require('./models/Template');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reddragon');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

function readTemplatesFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const templatesData = JSON.parse(fileContent);
    console.log(`✅ Read ${templatesData.length} templates from JSON file`);
    return templatesData;
  } catch (error) {
    console.error('❌ Error reading templates file:', error.message);
    return null;
  }
}

function readDesignFile(filename) {
  try {
    if (!filename) return null;
    
    const filePath = path.join(__dirname, 'uploads/designs', filename);
    if (!fs.existsSync(filePath)) return null;
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const designData = JSON.parse(fileContent);
    return designData;
  } catch (error) {
    return null;
  }
}

async function processTemplate(templateData) {
  try {
    console.log(`\n🔄 Processing: ${templateData.name}`);
    
    // Validate required fields
    if (!templateData.name || !templateData.type || !templateData.category) {
      console.log(`   ❌ Missing required fields`);
      return { success: false };
    }
    
    // Prepare template data with safe defaults
    const template = {
      name: templateData.name,
      description: templateData.description || `Template ${templateData.name}`,
      type: templateData.type,
      category: templateData.category,
      templateKey: templateData.templateKey || null,
      thumbnail: templateData.thumbnail || '/uploads/default-thumbnail.png',
      fileUrl: templateData.fileUrl || null,
      designFilename: templateData.designFilename || null,
      backgroundColor: templateData.backgroundColor || '#ffffff',
      backgroundImage: templateData.backgroundImage || null,
      canvasSize: templateData.canvasSize || '1200x1800',
      dimensions: templateData.dimensions || { width: 1200, height: 1800 },
      isRealEstate: templateData.isRealEstate || false,
      objects: templateData.objects || []
    };
    
    // Validate dimensions
    if (!template.dimensions.width || !template.dimensions.height) {
      template.dimensions = { width: 1200, height: 1800 };
    }
    
    // Validate canvas size
    if (!template.canvasSize.includes('x')) {
      template.canvasSize = `${template.dimensions.width}x${template.dimensions.height}`;
    }
    
    // Check if template exists
    const existingTemplate = await Template.findOne({ 
      $or: [
        { name: template.name },
        { templateKey: template.templateKey }
      ]
    });
    
    let savedTemplate;
    if (existingTemplate) {
      console.log(`   ⚠️  Template exists, updating...`);
      savedTemplate = await Template.findByIdAndUpdate(existingTemplate._id, template, { new: true });
    } else {
      console.log(`   📥 Creating new template...`);
      const newTemplate = new Template(template);
      savedTemplate = await newTemplate.save();
    }
    
    // Try to merge with design data if designFilename exists
    if (savedTemplate.designFilename) {
      console.log(`   🔍 Looking for design file: ${savedTemplate.designFilename}`);
      const designData = readDesignFile(savedTemplate.designFilename);
      
      if (designData && designData.objects && designData.objects.length > 0) {
        console.log(`   🔄 Merging with design data (${designData.objects.length} objects)...`);
        
        const updateData = {
          objects: designData.objects,
          canvasSize: designData.canvasSize || savedTemplate.canvasSize,
          dimensions: designData.dimensions || savedTemplate.dimensions,
          backgroundColor: designData.backgroundColor || savedTemplate.backgroundColor,
          backgroundImage: designData.backgroundImage || savedTemplate.backgroundImage
        };
        
        await Template.findByIdAndUpdate(savedTemplate._id, { $set: updateData });
        console.log(`   ✅ Successfully merged with design data`);
      } else {
        console.log(`   ⚠️  No design data found for ${savedTemplate.designFilename}`);
      }
    } else {
      console.log(`   ⚠️  No design filename specified`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false };
  }
}

async function main() {
  try {
    await connectDB();
    
    // Read templates from JSON file
    const templatesFilePath = 'c:\\Users\\Administrator\\Desktop\\templates.json';
    const templatesData = readTemplatesFile(templatesFilePath);
    
    if (!templatesData || !Array.isArray(templatesData)) {
      console.log('❌ Could not read templates file or data is not an array');
      return;
    }
    
    console.log(`\n🚀 Processing ${templatesData.length} templates...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each template
    for (let i = 0; i < templatesData.length; i++) {
      const templateData = templatesData[i];
      console.log(`[${i + 1}/${templatesData.length}]`);
      
      const result = await processTemplate(templateData);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Success: ${successCount} templates`);
    console.log(`   ❌ Errors: ${errorCount} templates`);
    console.log(`   📋 Total: ${templatesData.length} templates`);
    
    // Verify results
    const templates = await Template.find({});
    let withObjects = 0;
    let withoutObjects = 0;
    
    templates.forEach(template => {
      if (template.objects && template.objects.length > 0) {
        withObjects++;
        console.log(`✅ ${template.name}: ${template.objects.length} objects`);
      } else {
        withoutObjects++;
        console.log(`⚠️  ${template.name}: No objects`);
      }
    });
    
    console.log(`\n🔍 Verification:`);
    console.log(`   ✅ Templates with objects: ${withObjects}`);
    console.log(`   ⚠️  Templates without objects: ${withoutObjects}`);
    console.log(`   📋 Total templates in DB: ${templates.length}`);
    
  } catch (error) {
    console.error('❌ Main execution error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

main();