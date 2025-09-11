const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  _id:{type: String, required: true},
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan: { type: String, enum: ['Free', 'Premium', 'Ultra-Premium'], default: 'Free' },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  position: { type: String, trim: true },
  location: { type: String, trim: true },
  bio: { type: String, trim: true },
  avatar: { type: String },
  preferences: {
    notifications: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
    language: { type: String, default: 'es' },
    timezone: { type: String, default: 'Europe/Madrid' }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
