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

// Function to validate and clean template data
function validateTemplateData(template) {
  try {
    // Required fields
    if (!template.name) {
      console.log(`⚠️  Template missing name, skipping...`);
      return null;
    }
    
    if (!template.type) {
      console.log(`⚠️  Template ${template.name} missing type, skipping...`);
      return null;
    }
    
    if (!template.category) {
      console.log(`⚠️  Template ${template.name} missing category, skipping...`);
      return null;
    }
    
    // Set default values
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
      console.log(`⚠️  Template ${template.name} has invalid dimensions, setting defaults...`);
      cleanedTemplate.dimensions = { width: 1200, height: 1800 };
    }
    
    // Validate canvas size format
    if (!cleanedTemplate.canvasSize.includes('x')) {
      console.log(`⚠️  Template ${template.name} has invalid canvas size, setting default...`);
      cleanedTemplate.canvasSize = `${cleanedTemplate.dimensions.width}x${cleanedTemplate.dimensions.height}`;
    }
    
    return cleanedTemplate;
  } catch (error) {
    console.error(`❌ Error validating template ${template.name}:`, error.message);
    return null;
  }
}

// Function to import a single template
async function importTemplate(templateData) {
  try {
    console.log(`\n🔄 Importing template: ${templateData.name}`);
    
    // Validate template data
    const cleanedTemplate = validateTemplateData(templateData);
    if (!cleanedTemplate) {
      return { imported: false, reason: 'validation_failed' };
    }
    
    // Check if template already exists
    const existingTemplate = await Template.findOne({ 
      $or: [
        { name: cleanedTemplate.name },
        { templateKey: cleanedTemplate.templateKey }
      ]
    });
    
    if (existingTemplate) {
      console.log(`   ⚠️  Template already exists: ${cleanedTemplate.name}`);
      return { imported: false, reason: 'already_exists', existingId: existingTemplate._id };
    }
    
    // Create new template
    const newTemplate = new Template(cleanedTemplate);
    const savedTemplate = await newTemplate.save();
    
    console.log(`   ✅ Successfully imported template: ${cleanedTemplate.name} (${savedTemplate._id})`);
    return { imported: true, template: savedTemplate };
    
  } catch (error) {
    console.error(`❌ Error importing template ${templateData.name}:`, error.message);
    return { imported: false, reason: 'error', error: error.message };
  }
}

// Main function to import all templates
async function importAllTemplates(templatesData) {
  try {
    console.log('🚀 Starting template import process...\n');
    
    if (!Array.isArray(templatesData)) {
      console.log('❌ Templates data is not an array');
      return;
    }
    
    console.log(`📋 Found ${templatesData.length} templates to import\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // Process each template
    for (const templateData of templatesData) {
      const result = await importTemplate(templateData);
      
      if (result.imported) {
        successCount++;
      } else if (result.reason === 'already_exists' || result.reason === 'validation_failed') {
        skipCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log('\n📊 Import Process Summary:');
    console.log(`   ✅ Successfully imported: ${successCount} templates`);
    console.log(`   ⚠️  Skipped: ${skipCount} templates`);
    console.log(`   ❌ Errors: ${errorCount} templates`);
    console.log(`   📋 Total processed: ${templatesData.length} templates`);
    
  } catch (error) {
    console.error('❌ Error in import process:', error);
  }
}

// Function to verify import results
async function verifyImportResults() {
  try {
    console.log('\n🔍 Verifying import results...\n');
    
    const templates = await Template.find({});
    console.log(`📋 Total templates in database: ${templates.length}`);
    
    // Group by category
    const categoryCounts = {};
    templates.forEach(template => {
      categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
    });
    
    console.log('\n📊 Templates by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} templates`);
    });
    
    // Group by type
    const typeCounts = {};
    templates.forEach(template => {
      typeCounts[template.type] = (typeCounts[template.type] || 0) + 1;
    });
    
    console.log('\n📊 Templates by type:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} templates`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying results:', error);
  }
}

// Main execution
async function main() {
  try {
    await connectDB();
    
    // Read templates from JSON file
    const templatesFilePath = 'c:\\Users\\Administrator\\Desktop\\templates.json';
    const templatesData = readTemplatesFile(templatesFilePath);
    
    if (!templatesData) {
      console.log('❌ Could not read templates file');
      return;
    }
    
    // Import templates
    await importAllTemplates(templatesData);
    
    // Verify results
    await verifyImportResults();
    
    console.log('\n🎉 Template import process completed!');
    
  } catch (error) {
    console.error('❌ Main execution error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { importTemplate, importAllTemplates, verifyImportResults };
