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
      console.log(`⚠️  Design file not found: ${filename}`);
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const designData = JSON.parse(fileContent);
    
    console.log(`✅ Read design file: ${filename}`);
    console.log(`   - Objects count: ${designData.objects ? designData.objects.length : 0}`);
    console.log(`   - Canvas size: ${designData.canvasSize || 'N/A'}`);
    
    return designData;
  } catch (error) {
    console.error(`❌ Error reading design file ${filename}:`, error.message);
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

// Function to merge template with design data
async function mergeTemplateWithDesign(template) {
  try {
    console.log(`\n🔄 Processing template: ${template.name} (${template._id})`);
    
    // Get design filename
    const designFilename = template.designFilename;
    if (!designFilename) {
      console.log(`   ⚠️  No designFilename found for template: ${template.name}`);
      return { updated: false, reason: 'no_design_filename' };
    }
    
    // Read design file
    const designData = readDesignFile(designFilename);
    if (!designData) {
      console.log(`   ⚠️  Could not read design file: ${designFilename}`);
      return { updated: false, reason: 'design_file_not_found' };
    }
    
    // Prepare update data
    const updateData = {};
    
    // Add objects if they exist
    if (designData.objects && designData.objects.length > 0) {
      updateData.objects = designData.objects;
      console.log(`   📝 Adding ${designData.objects.length} objects to template`);
    }
    
    // Update canvas size if provided
    if (designData.canvasSize) {
      updateData.canvasSize = designData.canvasSize;
      console.log(`   📝 Updating canvas size to: ${designData.canvasSize}`);
    }
    
    // Update dimensions if provided
    if (designData.dimensions) {
      updateData.dimensions = designData.dimensions;
      console.log(`   📝 Updating dimensions to: ${designData.dimensions.width}x${designData.dimensions.height}`);
    }
    
    // Update background color if provided
    if (designData.backgroundColor) {
      updateData.backgroundColor = designData.backgroundColor;
      console.log(`   📝 Updating background color to: ${designData.backgroundColor}`);
    }
    
    // Update background image if provided
    if (designData.backgroundImage) {
      updateData.backgroundImage = designData.backgroundImage;
      console.log(`   📝 Updating background image`);
    }
    
    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      console.log(`   ⚠️  No data to update for template: ${template.name}`);
      return { updated: false, reason: 'no_data_to_update' };
    }
    
    // Update the template in database
    const result = await Template.findByIdAndUpdate(
      template._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (result) {
      console.log(`   ✅ Successfully updated template: ${template.name}`);
      return { updated: true, template: result };
    } else {
      console.log(`   ❌ Failed to update template: ${template.name}`);
      return { updated: false, reason: 'update_failed' };
    }
    
  } catch (error) {
    console.error(`❌ Error merging template ${template.name}:`, error.message);
    return { updated: false, reason: 'error', error: error.message };
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

// Main function to setup templates for production
async function setupTemplatesForProduction(templatesData) {
  try {
    console.log('🚀 Starting template setup for production...\n');
    
    if (!Array.isArray(templatesData)) {
      console.log('❌ Templates data is not an array');
      return;
    }
    
    console.log(`📋 Found ${templatesData.length} templates to process\n`);
    
    let importSuccessCount = 0;
    let importSkipCount = 0;
    let importErrorCount = 0;
    let mergeSuccessCount = 0;
    let mergeSkipCount = 0;
    let mergeErrorCount = 0;
    
    // Process each template
    for (const templateData of templatesData) {
      // Step 1: Import template
      const importResult = await importTemplate(templateData);
      
      if (importResult.imported) {
        importSuccessCount++;
        
        // Step 2: Merge with design data
        const mergeResult = await mergeTemplateWithDesign(importResult.template);
        
        if (mergeResult.updated) {
          mergeSuccessCount++;
        } else if (mergeResult.reason === 'no_design_filename' || mergeResult.reason === 'design_file_not_found' || mergeResult.reason === 'no_data_to_update') {
          mergeSkipCount++;
        } else {
          mergeErrorCount++;
        }
        
      } else if (importResult.reason === 'already_exists') {
        importSkipCount++;
        
        // Try to merge with existing template
        const existingTemplate = await Template.findById(importResult.existingId);
        if (existingTemplate) {
          const mergeResult = await mergeTemplateWithDesign(existingTemplate);
          
          if (mergeResult.updated) {
            mergeSuccessCount++;
          } else if (mergeResult.reason === 'no_design_filename' || mergeResult.reason === 'design_file_not_found' || mergeResult.reason === 'no_data_to_update') {
            mergeSkipCount++;
          } else {
            mergeErrorCount++;
          }
        }
        
      } else if (importResult.reason === 'validation_failed') {
        importSkipCount++;
      } else {
        importErrorCount++;
      }
    }
    
    console.log('\n📊 Setup Process Summary:');
    console.log(`   📥 Import Results:`);
    console.log(`      ✅ Successfully imported: ${importSuccessCount} templates`);
    console.log(`      ⚠️  Skipped: ${importSkipCount} templates`);
    console.log(`      ❌ Errors: ${importErrorCount} templates`);
    console.log(`   🔄 Merge Results:`);
    console.log(`      ✅ Successfully merged: ${mergeSuccessCount} templates`);
    console.log(`      ⚠️  Skipped: ${mergeSkipCount} templates`);
    console.log(`      ❌ Errors: ${mergeErrorCount} templates`);
    console.log(`   📋 Total processed: ${templatesData.length} templates`);
    
  } catch (error) {
    console.error('❌ Error in setup process:', error);
  }
}

// Function to verify setup results
async function verifySetupResults() {
  try {
    console.log('\n🔍 Verifying setup results...\n');
    
    const templates = await Template.find({});
    let withObjects = 0;
    let withoutObjects = 0;
    
    for (const template of templates) {
      if (template.objects && template.objects.length > 0) {
        withObjects++;
        console.log(`✅ ${template.name}: ${template.objects.length} objects`);
      } else {
        withoutObjects++;
        console.log(`⚠️  ${template.name}: No objects`);
      }
    }
    
    console.log(`\n📊 Verification Summary:`);
    console.log(`   ✅ Templates with objects: ${withObjects}`);
    console.log(`   ⚠️  Templates without objects: ${withoutObjects}`);
    console.log(`   📋 Total templates: ${templates.length}`);
    
    // Group by category
    const categoryCounts = {};
    templates.forEach(template => {
      categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
    });
    
    console.log('\n📊 Templates by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} templates`);
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
    
    // Setup templates for production
    await setupTemplatesForProduction(templatesData);
    
    // Verify results
    await verifySetupResults();
    
    console.log('\n🎉 Template setup for production completed!');
    
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

module.exports = { setupTemplatesForProduction, verifySetupResults };
