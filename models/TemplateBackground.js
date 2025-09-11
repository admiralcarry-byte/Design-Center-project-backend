const mongoose = require('mongoose');

const TemplateBackgroundSchema = new mongoose.Schema({
  templateId: { 
    type: String, 
    ref: 'Template', 
    required: true 
  },
  userId: { 
    type: String, 
    ref: 'User', 
    required: true 
  },
  imageData: { 
    type: String, 
    required: true 
  }, // Base64 encoded image data
  imageType: { 
    type: String, 
    required: true 
  }, // e.g., 'image/png', 'image/jpeg'
  fileName: { 
    type: String 
  }, // Original filename if available
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
}, { timestamps: true });

// Index for faster queries
TemplateBackgroundSchema.index({ templateId: 1, userId: 1 });
TemplateBackgroundSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

module.exports = mongoose.model('TemplateBackground', TemplateBackgroundSchema);
