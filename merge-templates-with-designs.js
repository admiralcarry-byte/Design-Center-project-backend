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

// Function to merge template with design data
async function mergeTemplateWithDesign(template) {
  try {
    console.log(`\n🔄 Processing template: ${template.name} (${template._id})`);
    
    // Check if template already has objects
    if (template.objects && template.objects.length > 0) {
      console.log(`   ⚠️  Template already has ${template.objects.length} objects, skipping...`);
      return { updated: false, reason: 'already_has_objects' };
    }
    
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

// Main function to process all templates
async function mergeAllTemplates() {
  try {
    console.log('🚀 Starting template merge process...\n');
    
    // Get all templates
    const templates = await Template.find({});
    console.log(`📋 Found ${templates.length} templates to process\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // Process each template
    for (const template of templates) {
      const result = await mergeTemplateWithDesign(template);
      
      if (result.updated) {
        successCount++;
      } else if (result.reason === 'already_has_objects' || result.reason === 'no_design_filename' || result.reason === 'design_file_not_found' || result.reason === 'no_data_to_update') {
        skipCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log('\n📊 Merge Process Summary:');
    console.log(`   ✅ Successfully updated: ${successCount} templates`);
    console.log(`   ⚠️  Skipped: ${skipCount} templates`);
    console.log(`   ❌ Errors: ${errorCount} templates`);
    console.log(`   📋 Total processed: ${templates.length} templates`);
    
  } catch (error) {
    console.error('❌ Error in merge process:', error);
  }
}

// Function to verify merge results
async function verifyMergeResults() {
  try {
    console.log('\n🔍 Verifying merge results...\n');
    
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
    
  } catch (error) {
    console.error('❌ Error verifying results:', error);
  }
}

// Main execution
async function main() {
  try {
    await connectDB();
    
    // Run the merge process
    await mergeAllTemplates();
    
    // Verify results
    await verifyMergeResults();
    
    console.log('\n🎉 Template merge process completed!');
    
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

module.exports = { mergeTemplateWithDesign, mergeAllTemplates, verifyMergeResults };
