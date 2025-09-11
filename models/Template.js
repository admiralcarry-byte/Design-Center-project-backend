const mongoose = require('mongoose');

const CanvasObjectSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: [
      'text', 'i-text', 'image', 'rect', 'rectangle', 'circle', 'triangle', 
      'polygon', 'path', 'rounded-rectangle', 'line', 'placeholder', 'shape'
    ], 
    required: true 
  },
  // Position properties - support both naming conventions
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  left: { type: Number },  // Alternative to x
  top: { type: Number },   // Alternative to y
  
  // Size properties
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  radius: { type: Number },  // For circles
  
  // Text properties
  text: { type: String },
  content: { type: String },  // Alternative to text
  fontSize: { type: Number, default: 48 },
  font: { type: String, default: 'Arial' },
  fontFamily: { type: String, default: 'Arial' },
  fontWeight: { type: String, default: 'normal' },
  textAlign: { type: String, default: 'left' },
  
  // Color properties - support both naming conventions
  color: { type: String, default: '#000000' },
  fill: { type: String, default: '#000000' },
  stroke: { type: String, default: 'transparent' },
  borderColor: { type: String, default: 'transparent' },  // Alternative to stroke
  
  // Stroke properties
  strokeWidth: { type: Number, default: 0 },
  borderWidth: { type: Number, default: 0 },  // Alternative to strokeWidth
  strokeLineCap: { type: String, default: 'butt' },
  strokeLineJoin: { type: String, default: 'miter' },
  
  // Image properties
  src: { type: String },
  url: { type: String },  // Alternative to src
  placeholder: { type: String },
  originalAspectRatio: { type: Number },
  
  // Transform properties
  scaleX: { type: Number, default: 1 },
  scaleY: { type: Number, default: 1 },
  rotation: { type: Number, default: 0 },  // Alternative to angle
  
  // Shape-specific properties
  rx: { type: Number, default: 0 },  // Rounded rectangle corner radius X
  ry: { type: Number, default: 0 },  // Rounded rectangle corner radius Y
  points: { type: [Number], default: [] },  // For polygons
  path: { type: String },  // For path objects
  shape: { type: String },  // For generic shapes
  
  // Special properties
  isBackground: { type: Boolean, default: false }
}, { _id: false });

const TemplateSchema = new mongoose.Schema({
  _id: {type: String, required: true},
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['square-post', 'story', 'marketplace-flyer', 'fb-feed-banner', 'digital-badge', 'brochure'], required: true },
  category: { type: String, enum: ['social-posts', 'stories', 'flyers', 'banners', 'badges', 'documents', 'marketplace-flyers', 'fb-banners'], required: true },
  templateKey: { type: String, unique: true, sparse: true }, // For real estate templates
  thumbnail: {
    type: String,
    default: '/uploads/default-thumbnail.png'
  },
  fileUrl: { type: String },
  objects: [CanvasObjectSchema], // Canvas objects for the template
  backgroundColor: { type: String, default: '#ffffff' },
  backgroundImage: { type: String },
  canvasSize: { type: String, default: '1200x1800' },
  dimensions: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  createdBy: { type: String, ref: 'User' },
  // isDefault field removed - no more default templates
  isRealEstate: { type: Boolean, default: false } // Flag for real estate templates
}, { timestamps: true });

// Index for faster queries
TemplateSchema.index({ type: 1 });
TemplateSchema.index({ category: 1 });
// isDefault index removed
TemplateSchema.index({ isRealEstate: 1 });
TemplateSchema.index({ templateKey: 1 });
TemplateSchema.index({ dimensions: 1 });
// TemplateSchema.index({ dimensions: 1 });

module.exports = mongoose.model('Template', TemplateSchema);
