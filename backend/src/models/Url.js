const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    trim: true
  },
  shortId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customAlias: {
    type: String,
    trim: true,
    sparse: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date
  },
  clicks: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  analytics: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ip: String,
    userAgent: String,
    device: String,
    browser: String,
    os: String,
    country: String,
    city: String
  }]
});

// Index for faster queries
urlSchema.index({ shortId: 1 });
urlSchema.index({ user: 1 });
urlSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Url', urlSchema); 