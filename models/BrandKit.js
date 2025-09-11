const mongoose = require('mongoose');

const BrandKitSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  primaryColor: { 
    type: String, 
    default: '#00525b',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Primary color must be a valid hex color'
    }
  },
  secondaryColor: { 
    type: String, 
    default: '#01aac7',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Secondary color must be a valid hex color'
    }
  },
  accentColor: { 
    type: String, 
    default: '#32e0c5',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Accent color must be a valid hex color'
    }
  },
  logo: {
    data: { type: String }, // Base64 data URL
    filename: { type: String },
    mimetype: { type: String },
    size: { type: Number }
  },
  fonts: [{
    name: { type: String, required: true },
    url: { type: String },
    isDefault: { type: Boolean, default: false }
  }],
  customElements: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['shape', 'icon', 'pattern'], required: true },
    data: { type: String, required: true }, // SVG or base64 data
    category: { type: String }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
BrandKitSchema.index({ userId: 1 });

// Virtual for logo URL (if we want to serve it as a file later)
BrandKitSchema.virtual('logoUrl').get(function() {
  if (this.logo && this.logo.data) {
    return this.logo.data; // For now, return the data URL directly
  }
  return null;
});

// Method to get brand kit for a user
BrandKitSchema.statics.getByUserId = function(userId) {
  return this.findOne({ userId }).populate('userId', 'username email');
};

// Method to update brand kit
BrandKitSchema.statics.updateByUserId = function(userId, updateData) {
  return this.findOneAndUpdate(
    { userId }, 
    updateData, 
    { 
      new: true, 
      upsert: true, // Create if doesn't exist
      runValidators: true 
    }
  );
};

module.exports = mongoose.model('BrandKit', BrandKitSchema);