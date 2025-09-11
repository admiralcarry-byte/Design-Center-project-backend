const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import the Template model
const Template = require('./models/Template');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reddragon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Function to read and parse templates JSON file
function readTemplatesFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Templates file not found: ${filePath}`);
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const templatesData = JSON.parse(fileContent);
    
    console.log(`✅ Read templates file: ${filePath}`);
    console.log(`   - Templates count: ${Array.isArray(templatesData) ? templatesData.length : 'Not an array'}`);
    
    return templatesData;
  } catch (error) {
    console.error(`❌ Error reading templates file ${filePath}:`, error.message);
    return null;
  }
}

// Function to read and parse design JSON file
function readDesignFile(filename) {
  try {
    const filePath = path.join(__dirname, 'uploads/designs', filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const designData = JSON.parse(fileContent);
    
    return designData;
  } catch (error) {
    return null;
  }
}

// Function to validate and clean template data
function validateTemplateData(template) {
  try {
    if (!template.name || !template.type || !template.category) {
      return null;
    }
    
    const cleanedTemplate = {
      name: template.name,
      description: template.description || `Template ${template.name}`,
      type: template.type,
      category: template.category,
      templateKey: template.templateKey || null,
      thumbnail: template.thumbnail || '/uploads/default-thumbnail.png',
      fileUrl: template.fileUrl || null,
      designFilename: template.designFilename || null,
      backgroundColor: template.backgroundColor || '#ffffff',
      backgroundImage: template.backgroundImage || null,
      canvasSize: template.canvasSize || '1200x1800',
      dimensions: template.dimensions || { width: 1200, height: 1800 },
      isRealEstate: template.isRealEstate || false,
      objects: template.objects || []
    };
    
    // Validate dimensions
    if (!cleanedTemplate.dimensions.width || !cleanedTemplate.dimensions.height) {
      cleanedTemplate.dimensions = { width: 1200, height: 1800 };
    }
    
    // Validate canvas size format
    if (!cleanedTemplate.canvasSize.includes('x')) {
      cleanedTemplate.canvasSize = `${cleanedTemplate.dimensions.width}x${cleanedTemplate.dimensions.height}`;
    }
    
    return cleanedTemplate;
  } catch (error) {
    return null;
  }
}

// Function to import and merge a single template
async function importAndMergeTemplate(templateData) {
  try {
    console.log(`\n🔄 Processing: ${templateData.name}`);
    
    // Validate template data
    const cleanedTemplate = validateTemplateData(templateData);
    if (!cleanedTemplate) {
      console.log(`   ❌ Validation failed`);
      return { success: false, reason: 'validation_failed' };
    }
    
    // Check if template already exists
    const existingTemplate = await Template.findOne({ 
      $or: [
        { name: cleanedTemplate.name },
        { templateKey: cleanedTemplate.templateKey }
      ]
    });
    
    let template;
    if (existingTemplate) {
      console.log(`   ⚠️  Already exists, updating...`);
      template = existingTemplate;
    } else {
      console.log(`   📥 Importing new template...`);
      const newTemplate = new Template(cleanedTemplate);
      template = await newTemplate.save();
    }
    
    // Try to merge with design data
    if (template.designFilename) {
      const designData = readDesignFile(template.designFilename);
      if (designData && designData.objects && designData.objects.length > 0) {
        console.log(`   🔄 Merging with design data (${designData.objects.length} objects)...`);
        
        const updateData = {
          objects: designData.objects,
          canvasSize: designData.canvasSize || template.canvasSize,
          dimensions: designData.dimensions || template.dimensions,
          backgroundColor: designData.backgroundColor || template.backgroundColor,
          backgroundImage: designData.backgroundImage || template.backgroundImage
        };
        
        await Template.findByIdAndUpdate(template._id, { $set: updateData });
        console.log(`   ✅ Successfully merged with design data`);
      } else {
        console.log(`   ⚠️  No design data found for ${template.designFilename}`);
      }
    } else {
      console.log(`   ⚠️  No design filename specified`);
    }
    
    return { success: true, template: template };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, reason: 'error', error: error.message };
  }
}

// Main function
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
      
      const result = await importAndMergeTemplate(templateData);
      
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
      } else {
        withoutObjects++;
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

// Run the script
if (require.main === module) {
  main();
}
