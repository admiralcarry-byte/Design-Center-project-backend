const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Simple template schema without strict validation
const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true },
  category: { type: String, required: true },
  templateKey: { type: String },
  thumbnail: { type: String },
  fileUrl: { type: String },
  designFilename: { type: String },
  designfilepath: { type: String },
  objects: { type: mongoose.Schema.Types.Mixed }, // Use Mixed type to avoid validation issues
  backgroundColor: { type: String },
  backgroundImage: { type: String },
  canvasSize: { type: String },
  dimensions: { type: mongoose.Schema.Types.Mixed },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRealEstate: { type: Boolean, default: false }
}, { timestamps: true });

const Template = mongoose.model('Template', TemplateSchema);

async function simpleUpdate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center');
    console.log('Connected to MongoDB');

    // Read the design file
    const designFilePath = path.join(__dirname, 'uploads/designs/68b7784187672e7048b2bc9d.json');
    const designData = JSON.parse(fs.readFileSync(designFilePath, 'utf8'));
    
    console.log('Design data loaded:', {
      objectsCount: designData.objects.length,
      canvasSize: designData.canvasSize,
      backgroundColor: designData.backgroundColor
    });

    // Find the Achievement Badge template
    const template = await Template.findOne({ name: 'Achievement Badge' });
    
    if (!template) {
      console.log('❌ Template not found');
      return;
    }

    console.log('Found template:', {
      id: template._id,
      name: template.name,
      currentObjectsCount: Array.isArray(template.objects) ? template.objects.length : 0
    });

    // Prepare objects with required x, y coordinates
    const updatedObjects = designData.objects.map(obj => ({
      ...obj,
      x: obj.left || 0,
      y: obj.top || 0
    }));

    // Parse canvas size to get dimensions
    const [width, height] = designData.canvasSize.split('x').map(Number);

    // Force update the template
    const updateResult = await Template.updateOne(
      { _id: template._id },
      {
        $set: {
          objects: updatedObjects,
          backgroundColor: designData.backgroundColor,
          canvasSize: designData.canvasSize,
          dimensions: {
            width: width || 600,
            height: height || 600
          }
        }
      }
    );

    console.log('Update result:', updateResult);

    if (updateResult.modifiedCount > 0) {
      console.log('✅ Template updated successfully!');
      
      // Verify the update
      const verifyTemplate = await Template.findById(template._id);
      console.log('Verification - Objects count:', Array.isArray(verifyTemplate.objects) ? verifyTemplate.objects.length : 0);
      console.log('Canvas size:', verifyTemplate.canvasSize);
      console.log('Background color:', verifyTemplate.backgroundColor);
    } else {
      console.log('❌ Template update failed - no documents modified');
    }

  } catch (error) {
    console.error('Error updating template:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

simpleUpdate();
